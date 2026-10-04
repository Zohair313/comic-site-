import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  apiAsset,
  createVenmoOrder,
  fetchVenmoConfig,
  fetchVenmoOrder,
  isApiConfigured,
  resolveSrc,
} from '@/lib/api';
import { useSiteData } from '@/context/SiteDataContext';
import { centsToDollars, purchasableArtworks } from '@/lib/characters';
import { forgetOrder, listOrders, rememberOrder } from '@/lib/venmoOrders';

const POLL_MS = 6000;
const CLOSED_STATUSES = ['delivered', 'rejected', 'refunded', 'canceled'];

const STATUS_STYLES = {
  pending: {
    label: 'Waiting for your payment',
    hint: 'Send the exact amount with the order number in the note. Once we confirm it we email your download links, and this page updates on its own.',
    box: 'bg-amber-50 border-amber-300 text-amber-900',
    dot: 'bg-amber-500 animate-pulse',
  },
  paid: {
    label: 'Payment received',
    hint: 'Thanks! Your download links are on their way by email — this page will update automatically too.',
    box: 'bg-sky-50 border-sky-300 text-sky-900',
    dot: 'bg-sky-500 animate-pulse',
  },
  delivered: {
    label: 'Your files are ready',
    hint: 'Download everything below, or use the links we emailed you. Both work.',
    box: 'bg-emerald-50 border-emerald-300 text-emerald-900',
    dot: 'bg-emerald-500',
  },
  rejected: {
    label: 'Payment could not be verified',
    hint: 'The amount or note did not match. Send the exact amount again, or email us and we will fix it.',
    box: 'bg-red-50 border-red-300 text-red-900',
    dot: 'bg-red-500',
  },
  refunded: {
    label: 'Order refunded',
    hint: 'This order was refunded. Nothing more to do.',
    box: 'bg-zinc-100 border-stone-300 text-zinc-700',
    dot: 'bg-zinc-400',
  },
  canceled: {
    label: 'Order canceled',
    hint: 'This order was canceled.',
    box: 'bg-zinc-100 border-stone-300 text-zinc-700',
    dot: 'bg-zinc-400',
  },
};

const MAX_PROOF_BYTES = 5 * 1024 * 1024;

function Panel({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border-2 border-stone-800 shadow-[6px_6px_0_rgba(74,59,50,0.85)] ${className}`}>
      {children}
    </div>
  );
}

function StepBadge({ n, label, active, done }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
          done
            ? 'bg-emerald-500 text-white'
            : active
              ? 'bg-[#ED3833] text-white'
              : 'bg-stone-200 text-stone-500'
        }`}
      >
        {done ? <i className="fa-solid fa-check text-xs"></i> : n}
      </span>
      <span
        className={`badge-font text-xs uppercase tracking-[0.2em] ${
          active ? 'text-[#ED3833]' : 'text-stone-400'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export default function Checkout() {
  const { data: siteData } = useSiteData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [config, setConfig] = useState(null);
  const [configState, setConfigState] = useState(isApiConfigured ? 'loading' : 'offline');
  const [cart, setCart] = useState([]);
  const [buyer, setBuyer] = useState({ name: '', email: '', handle: '', transactionId: '' });
  const [proof, setProof] = useState(null);
  const [stage, setStage] = useState('cart');
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(listOrders);

  // Characters priced in the admin panel join the same catalog as the plans,
  // so one cart and one checkout handles both.
  const catalog = useMemo(() => {
    const plans = (config?.products ?? []).map((product) => ({ ...product, kind: 'plan' }));
    const taken = new Set(plans.map((product) => product.id));
    const artworks = purchasableArtworks(siteData?.art?.artworks)
      .filter((product) => !taken.has(product.id))
      .map((product) => ({ ...product, price: `$${centsToDollars(product.priceCents)}` }));
    return [...plans, ...artworks];
  }, [config, siteData?.art?.artworks]);

  // Lore links here with ?add=char-kaelen to drop that character straight in.
  useEffect(() => {
    const wanted = searchParams.get('add');
    if (!wanted) return;
    const product = catalog.find((item) => item.id === wanted);
    if (product) {
      setCart((prev) =>
        prev.some((item) => item.id === product.id)
          ? prev
          : [...prev, { id: product.id, title: product.title, priceCents: product.priceCents, qty: 1 }]
      );
    }
    const rest = new URLSearchParams(searchParams);
    rest.delete('add');
    setSearchParams(rest, { replace: true });
  }, [catalog, searchParams, setSearchParams]);

  useEffect(() => {
    if (!isApiConfigured) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchVenmoConfig();
        if (cancelled) return;
        setConfig(data);
        setConfigState(data.enabled ? 'ready' : 'disabled');
      } catch {
        if (!cancelled) setConfigState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyOrder = useCallback((next) => {
    setOrder(next);
    if (CLOSED_STATUSES.includes(next.status)) setStage('done');
  }, []);

  const checkStatus = useCallback(
    async (silent = false) => {
      if (!order?.id || !order?.token) return;
      if (!silent) setChecking(true);
      try {
        const data = await fetchVenmoOrder(order.id, order.token);
        applyOrder(data.order);
        setError('');
      } catch {
        if (!silent) setError('We could not reach the server. Check your connection and try again.');
      } finally {
        if (!silent) setChecking(false);
      }
    },
    [order, applyOrder]
  );

  useEffect(() => {
    if (stage !== 'pay' || !order || CLOSED_STATUSES.includes(order.status)) return undefined;
    const timer = setInterval(() => checkStatus(true), POLL_MS);
    return () => clearInterval(timer);
  }, [stage, order, checkStatus]);

  const totals = useMemo(() => {
    const subtotalCents = cart.reduce((sum, item) => sum + item.priceCents * item.qty, 0);
    const feeCents =
      config?.feeMode === 'add'
        ? Math.round((subtotalCents * (config.feePercent || 0)) / 100) + (config.feeFixedCents || 0)
        : 0;
    return { subtotalCents, feeCents, totalCents: subtotalCents + feeCents };
  }, [cart, config]);

  const money = (cents) => `$${((cents || 0) / 100).toFixed(2)}`;

  const changeQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: Math.max(0, Math.min(10, item.qty + delta)) } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const addProduct = (product) => {
    setCart((prev) =>
      prev.some((item) => item.id === product.id)
        ? prev
        : [...prev, { id: product.id, title: product.title, priceCents: product.priceCents, qty: 1 }]
    );
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    if (!cart.length || busy) return;
    setBusy(true);
    setError('');
    try {
      const data = await createVenmoOrder({
        items: cart.map((item) => ({ id: item.id, qty: item.qty })),
        buyer,
        proof,
      });
      rememberOrder({
        id: data.order.id,
        token: data.order.token,
        total: data.order.total,
        itemCount: cart.reduce((sum, item) => sum + item.qty, 0),
      });
      setSaved(listOrders());
      setOrder(data.order);
      setPayment(data.payment);
      setStage('pay');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const resumeOrder = async (ref) => {
    setBusy(true);
    setError('');
    try {
      const data = await fetchVenmoOrder(ref.id, ref.token);
      setOrder(data.order);
      setPayment({
        handle: config?.handle,
        displayName: config?.displayName,
        note: data.order.paymentNote,
        amount: data.order.total,
        deepLink: `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(config?.handle || '')}&amount=${((data.order.totalCents || 0) / 100).toFixed(2)}&note=${encodeURIComponent(data.order.paymentNote)}`,
        qrUrl: config?.qrUrl,
        instructions: config?.instructions,
      });
      setStage(CLOSED_STATUSES.includes(data.order.status) ? 'done' : 'pay');
    } catch {
      forgetOrder(ref.id);
      setSaved(listOrders());
      setError('That saved order could not be found. It may have expired.');
    } finally {
      setBusy(false);
    }
  };

  const startOver = () => {
    if (order?.id) forgetOrder(order.id);
    setSaved(listOrders());
    setOrder(null);
    setPayment(null);
    setCart([]);
    setError('');
    setCopied(false);
    setStage('cart');
  };

  const copyNote = async () => {
    try {
      await navigator.clipboard.writeText(order.paymentNote);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Copy failed — please type the order number manually.');
    }
  };

  const status = order ? STATUS_STYLES[order.status] || STATUS_STYLES.pending : null;
  const qrSrc = apiAsset(payment?.qrUrl);
  const step = stage === 'cart' ? 1 : stage === 'pay' ? 2 : 3;

  return (
    <section className="pt-24 pb-20 min-h-screen bg-[#faf7f2]">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-10">
          <p className="badge-font text-[#ED3833] text-sm font-extrabold tracking-[0.3em] uppercase mb-3">
            <i className="fa-solid fa-bolt mr-2"></i>Secure Checkout
          </p>
          <h1 className="display-font italic font-black text-5xl md:text-7xl text-zinc-900 tracking-tight">
            Get the Comics.
          </h1>
          <p className="text-zinc-600 italic max-w-xl mx-auto mt-4 leading-relaxed">
            Pay with Venmo, get your files the moment the payment lands. No card, no waiting on a reply.
          </p>
          <div className="mx-auto mt-5 h-1.5 w-24 rounded-full bg-[#ED3833]"></div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-10">
          <StepBadge n={1} label="Choose plan" active={step === 1} done={step > 1} />
          <StepBadge n={2} label="Pay with Venmo" active={step === 2} done={step > 2} />
          <StepBadge n={3} label="Download" active={step === 3} done={false} />
        </div>

        {configState === 'loading' && (
          <p className="text-center text-zinc-500 py-16">
            <i className="fa-solid fa-spinner fa-spin mr-2"></i>Loading plans…
          </p>
        )}

        {configState === 'offline' && (
          <Panel className="p-8 text-center max-w-2xl mx-auto">
            <h2 className="display-font italic font-black text-2xl text-zinc-900">Checkout is not connected yet</h2>
            <p className="text-zinc-600 mt-3">
              The payment server is not configured for this site. Please contact us and we will take your order directly.
            </p>
            <Link
              to="/support"
              className="inline-flex items-center gap-2 mt-6 px-7 py-3 rounded-full bg-[#4A3B32] text-white font-extrabold uppercase tracking-widest text-sm hover:bg-[#5d4a3f] transition-colors"
            >
              <i className="fa-solid fa-envelope"></i> Contact Support
            </Link>
          </Panel>
        )}

        {configState === 'error' && (
          <Panel className="p-8 text-center max-w-2xl mx-auto">
            <h2 className="display-font italic font-black text-2xl text-zinc-900">We could not load the plans</h2>
            <p className="text-zinc-600 mt-3">The payment server did not respond. Please refresh and try again.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 mt-6 px-7 py-3 rounded-full bg-[#ED3833] text-white font-extrabold uppercase tracking-widest text-sm hover:bg-[#c92825] transition-colors"
            >
              <i className="fa-solid fa-rotate-right"></i> Refresh
            </button>
          </Panel>
        )}

        {configState === 'disabled' && (
          <Panel className="p-8 text-center max-w-2xl mx-auto">
            <h2 className="display-font italic font-black text-2xl text-zinc-900">Venmo checkout is offline</h2>
            <p className="text-zinc-600 mt-3">
              Online payments are paused right now. Message us and we will send your files straight away.
            </p>
            <Link
              to="/support"
              className="inline-flex items-center gap-2 mt-6 px-7 py-3 rounded-full bg-[#4A3B32] text-white font-extrabold uppercase tracking-widest text-sm hover:bg-[#5d4a3f] transition-colors"
            >
              <i className="fa-solid fa-envelope"></i> Contact Support
            </Link>
          </Panel>
        )}

        {configState === 'ready' && stage === 'cart' && (
          <div className="grid lg:grid-cols-[1.6fr_1fr] gap-8 items-start">
            <form onSubmit={placeOrder}>
              <Panel className="p-6 md:p-8">
                <h2 className="display-font italic font-black text-2xl text-zinc-900 mb-1">Pick your plan</h2>
                <p className="text-sm text-zinc-500 mb-6">Tap add for everything you want. You can pick more than one.</p>

                {!catalog.length && (
                  <p className="text-zinc-500 py-6 text-center">No plans are available right now — check back soon.</p>
                )}

                <div className="space-y-4">
                  {catalog.map((product) => {
                    const inCart = cart.find((item) => item.id === product.id);
                    return (
                      <div
                        key={product.id}
                        className={`flex flex-wrap items-center justify-between gap-4 p-5 rounded-xl border-2 transition-colors ${
                          inCart ? 'border-[#ED3833] bg-[#ED3833]/5' : 'border-stone-200 bg-white'
                        }`}
                      >
                        <div className="min-w-0 flex items-center gap-3">
                          {product.image ? (
                            <img
                              src={resolveSrc(product.image)}
                              alt=""
                              className="w-12 h-12 rounded-full object-cover border-2 border-stone-200 shrink-0"
                            />
                          ) : null}
                          <div className="min-w-0">
                            {product.kind === 'character' && (
                              <span className="badge-font inline-block mb-1 px-2 py-0.5 rounded-full bg-[#4A3B32] text-white text-[10px] font-extrabold uppercase tracking-widest">
                                Character Pack
                              </span>
                            )}
                            <h3 className="font-extrabold text-zinc-900">{product.title}</h3>
                            <p className="text-sm text-zinc-500 mt-0.5">{product.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="display-font font-black text-xl text-[#ED3833]">{product.price}</span>
                          {inCart ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => changeQty(product.id, -1)}
                                aria-label={`Remove one ${product.title}`}
                                className="w-8 h-8 rounded-full border-2 border-stone-300 text-stone-600 hover:border-[#ED3833] hover:text-[#ED3833] transition-colors font-black"
                              >
                                −
                              </button>
                              <span className="w-6 text-center font-black text-zinc-800">{inCart.qty}</span>
                              <button
                                type="button"
                                onClick={() => changeQty(product.id, 1)}
                                aria-label={`Add one ${product.title}`}
                                className="w-8 h-8 rounded-full border-2 border-stone-300 text-stone-600 hover:border-[#ED3833] hover:text-[#ED3833] transition-colors font-black"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => addProduct(product)}
                              className="px-4 py-2 rounded-full bg-stone-900 text-white text-xs font-extrabold uppercase tracking-widest hover:bg-[#ED3833] transition-colors"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <h2 className="display-font italic font-black text-2xl text-zinc-900 mt-9 mb-4">Where should we send it?</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="badge-font text-xs uppercase tracking-widest text-zinc-500">Your name</span>
                    <input
                      type="text"
                      value={buyer.name}
                      onChange={(e) => setBuyer((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Ayesha Khan"
                      className="mt-1.5 w-full px-4 py-3 rounded-lg border-2 border-stone-200 focus:border-[#ED3833] focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="badge-font text-xs uppercase tracking-widest text-zinc-500">Email</span>
                    <input
                      type="email"
                      required
                      value={buyer.email}
                      onChange={(e) => setBuyer((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="you@example.com"
                      className="mt-1.5 w-full px-4 py-3 rounded-lg border-2 border-stone-200 focus:border-[#ED3833] focus:outline-none"
                    />
                  </label>
                </div>

                <h2 className="display-font italic font-black text-2xl text-zinc-900 mt-9 mb-4">
                  Anything that helps us verify faster
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="badge-font text-xs uppercase tracking-widest text-zinc-500">
                      Your Venmo handle <span className="normal-case tracking-normal text-zinc-400">(optional)</span>
                    </span>
                    <input
                      type="text"
                      value={buyer.handle}
                      onChange={(e) => setBuyer((prev) => ({ ...prev, handle: e.target.value }))}
                      placeholder="@your-venmo-name"
                      className="mt-1.5 w-full px-4 py-3 rounded-lg border-2 border-stone-200 focus:border-[#ED3833] focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="badge-font text-xs uppercase tracking-widest text-zinc-500">
                      Transaction ID <span className="normal-case tracking-normal text-zinc-400">(optional)</span>
                    </span>
                    <input
                      type="text"
                      value={buyer.transactionId}
                      onChange={(e) => setBuyer((prev) => ({ ...prev, transactionId: e.target.value }))}
                      placeholder="3988123456"
                      className="mt-1.5 w-full px-4 py-3 rounded-lg border-2 border-stone-200 focus:border-[#ED3833] focus:outline-none"
                    />
                  </label>
                </div>

                <label className="block mt-4">
                  <span className="badge-font text-xs uppercase tracking-widest text-zinc-500">
                    Payment screenshot <span className="normal-case tracking-normal text-zinc-400">(optional)</span>
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file && file.size > MAX_PROOF_BYTES) {
                        setProof(null);
                        setError('That screenshot is over 5 MB. Please upload a smaller image.');
                      } else {
                        setError('');
                        setProof(file);
                      }
                    }}
                    className="mt-1.5 w-full text-sm text-zinc-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:bg-stone-900 file:text-white file:font-bold file:text-xs file:uppercase file:tracking-widest hover:file:bg-stone-700 cursor-pointer"
                  />
                  <span className="mt-2 block text-xs text-zinc-500">
                    JPEG, PNG or WebP up to 5 MB. A screenshot of your Venmo receipt lets us confirm your order
                    without waiting.
                  </span>
                </label>

                {proof && (
                  <div className="mt-3 flex items-center gap-3 rounded-lg border-2 border-stone-200 bg-stone-50 px-4 py-3">
                    <i className="fa-solid fa-circle-check text-emerald-600"></i>
                    <span className="min-w-0 flex-1 truncate text-sm text-zinc-700">{proof.name}</span>
                    <button
                      type="button"
                      onClick={() => setProof(null)}
                      className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {error && (
                  <p className="mt-5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!cart.length || busy}
                  className="mt-7 w-full py-4 rounded-full bg-[#ED3833] text-white font-extrabold uppercase tracking-[0.2em] text-sm hover:bg-[#c92825] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {busy ? 'Creating order…' : `Continue to Venmo${cart.length ? ` · ${money(totals.totalCents)}` : ''}`}
                </button>

                <p className="mt-4 text-center text-xs text-zinc-500">
                  <i className="fa-solid fa-lock mr-1.5"></i>
                  You will never be asked for your Venmo password or a login code.
                </p>
              </Panel>
            </form>

            <div className="space-y-6">
              <Panel className="p-6">
                <h3 className="badge-font text-xs uppercase tracking-[0.25em] text-zinc-500 mb-4">Order summary</h3>
                {!cart.length && <p className="text-sm text-zinc-500">Nothing added yet.</p>}
                <ul className="space-y-3">
                  {cart.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-zinc-700">
                        {item.title} <span className="text-zinc-400">×{item.qty}</span>
                      </span>
                      <span className="font-black text-zinc-900 shrink-0">{money(item.priceCents * item.qty)}</span>
                    </li>
                  ))}
                </ul>
                {cart.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-stone-200 space-y-2 text-sm">
                    <div className="flex justify-between text-zinc-600">
                      <span>Subtotal</span>
                      <span>{money(totals.subtotalCents)}</span>
                    </div>
                    {totals.feeCents > 0 && (
                      <div className="flex justify-between text-zinc-600">
                        <span>Venmo fee</span>
                        <span>{money(totals.feeCents)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-black text-zinc-900 pt-1">
                      <span>Total</span>
                      <span>{money(totals.totalCents)}</span>
                    </div>
                  </div>
                )}
              </Panel>

              {saved.length > 0 && (
                <Panel className="p-6">
                  <h3 className="badge-font text-xs uppercase tracking-[0.25em] text-zinc-500 mb-4">Your recent orders</h3>
                  <ul className="space-y-2">
                    {saved.map((ref) => (
                      <li key={ref.id} className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => resumeOrder(ref)}
                          disabled={busy}
                          className="text-sm font-black text-[#ED3833] hover:underline disabled:opacity-50 text-left"
                        >
                          {ref.id}
                        </button>
                        <span className="text-xs text-zinc-500 shrink-0">{ref.total}</span>
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}
            </div>
          </div>
        )}

        {configState === 'ready' && (stage === 'pay' || stage === 'done') && order && (
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8 items-start">
            <Panel className="p-6 md:p-8">
              <div className={`flex items-start gap-3 p-4 rounded-xl border-2 ${status.box}`}>
                <span className={`mt-1.5 w-3 h-3 rounded-full shrink-0 ${status.dot}`}></span>
                <div>
                  <p className="font-black">{status.label}</p>
                  <p className="text-sm mt-0.5">
                    {order.needsReview && order.status === 'pending'
                      ? 'We received a payment mention and are checking it against your order.'
                      : status.hint}
                  </p>
                </div>
              </div>

              <div className="mt-7 text-center">
                <p className="badge-font text-xs uppercase tracking-[0.3em] text-zinc-500">Send exactly</p>
                <p className="display-font italic font-black text-6xl text-[#ED3833] mt-1">{order.total}</p>
                <p className="text-sm text-zinc-500 mt-1">
                  to <span className="font-black text-zinc-800">@{payment?.handle}</span>
                  {payment?.displayName ? ` · ${payment.displayName}` : ''}
                </p>
              </div>

              <div className="mt-7">
                <p className="badge-font text-xs uppercase tracking-widest text-zinc-500 text-center mb-2">
                  Order number — put this in the note
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-center py-3 px-4 rounded-lg bg-stone-100 border-2 border-dashed border-stone-300 font-black tracking-widest text-zinc-900 select-all">
                    {order.paymentNote}
                  </code>
                  <button
                    type="button"
                    onClick={copyNote}
                    className="px-4 py-3 rounded-lg bg-stone-900 text-white text-xs font-extrabold uppercase tracking-widest hover:bg-[#ED3833] transition-colors shrink-0"
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {stage === 'pay' && (
                <div className="mt-7 space-y-3">
                  {payment?.deepLink && (
                    <a
                      href={payment.deepLink}
                      className="flex items-center justify-center gap-2 w-full py-4 rounded-full bg-[#3D6DF2] text-white font-extrabold uppercase tracking-[0.2em] text-sm hover:bg-[#2f56c4] transition-colors"
                    >
                      <i className="fa-solid fa-mobile-screen"></i> Open Venmo
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => checkStatus(false)}
                    disabled={checking}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full border-2 border-stone-300 text-zinc-700 font-extrabold uppercase tracking-widest text-sm hover:border-[#ED3833] hover:text-[#ED3833] transition-colors disabled:opacity-50"
                  >
                    <i className={`fa-solid fa-rotate-right ${checking ? 'fa-spin' : ''}`}></i>
                    {checking ? 'Checking…' : 'I have sent the payment'}
                  </button>
                </div>
              )}

              {error && (
                <p className="mt-5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
              )}

              {payment?.instructions && stage === 'pay' && (
                <p className="mt-6 text-sm text-zinc-600 leading-relaxed whitespace-pre-line border-t border-stone-200 pt-5">
                  {payment.instructions}
                </p>
              )}

              <div className="mt-7 flex flex-wrap items-center justify-between gap-3 text-sm">
                <Link to="/support" className="font-bold text-[#ED3833] hover:underline">
                  <i className="fa-solid fa-envelope mr-1.5"></i>Need help?
                </Link>
                <button type="button" onClick={startOver} className="text-zinc-500 hover:text-[#ED3833] font-bold">
                  Start a new order
                </button>
              </div>
            </Panel>

            <div className="space-y-6">
              {stage === 'pay' && (
                <Panel className="p-6 text-center">
                  <h3 className="badge-font text-xs uppercase tracking-[0.25em] text-zinc-500 mb-5">
                    Scan with your phone
                  </h3>
                  {qrSrc ? (
                    <img
                      src={qrSrc}
                      alt="Venmo QR code"
                      className="mx-auto w-64 h-64 object-contain rounded-xl border-2 border-stone-200 bg-white"
                    />
                  ) : (
                    <div className="mx-auto w-64 h-64 rounded-xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-zinc-400 px-6 text-center">
                      <i className="fa-solid fa-qrcode text-4xl mb-3"></i>
                      <p className="text-sm">The studio has not uploaded a QR code yet. Use the Venmo button instead.</p>
                    </div>
                  )}
                  {payment?.profileUrl && (
                    <a
                      href={payment.profileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 mt-5 text-sm font-black text-[#ED3833] hover:underline"
                    >
                      <i className="fa-brands fa-venmo mr-1"></i>Open @{payment.handle} on the web
                    </a>
                  )}
                </Panel>
              )}

              {stage === 'done' && order.status === 'delivered' && (
                <Panel className="p-6 md:p-8">
                  <h3 className="display-font italic font-black text-2xl text-zinc-900 mb-1">Your downloads</h3>
                  <p className="text-sm text-zinc-500 mb-5">
                    Order <span className="font-black text-zinc-800">{order.id}</span> · keep this link, it always works.
                  </p>
                  {order.delivery?.length ? (
                    <ul className="space-y-3">
                      {order.delivery.map((file) => (
                        <li key={file.url}>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between gap-3 p-4 rounded-xl border-2 border-stone-200 hover:border-[#ED3833] transition-colors"
                          >
                            <span className="font-extrabold text-zinc-800">
                              <i className="fa-solid fa-file-arrow-down mr-2 text-[#ED3833]"></i>
                              {file.label}
                            </span>
                            <i className="fa-solid fa-arrow-up-right-from-square text-xs text-stone-400"></i>
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-zinc-500">
                      Your payment is confirmed and the files are on the way to your inbox. If nothing arrives in a few
                      minutes, check spam or email us with the order number above.
                    </p>
                  )}
                </Panel>
              )}

              <Panel className="p-6">
                <h3 className="badge-font text-xs uppercase tracking-[0.25em] text-zinc-500 mb-4">Order details</h3>
                <ul className="space-y-2 text-sm">
                  {order.items.map((item) => (
                    <li key={item.productId} className="flex items-center justify-between gap-3">
                      <span className="text-zinc-700">
                        {item.title} <span className="text-zinc-400">×{item.qty}</span>
                      </span>
                      <span className="font-black text-zinc-900">{item.price}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-stone-200 flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Paid {order.paidAt ? `on ${new Date(order.paidAt).toLocaleDateString()}` : '—'}</span>
                  <span className="font-black text-zinc-900">{order.total}</span>
                </div>
                {order.status === 'rejected' && (
                  <button
                    type="button"
                    onClick={startOver}
                    className="mt-6 w-full py-3 rounded-full bg-[#ED3833] text-white font-extrabold uppercase tracking-widest text-sm hover:bg-[#c92825] transition-colors"
                  >
                    Pay again
                  </button>
                )}
              </Panel>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
