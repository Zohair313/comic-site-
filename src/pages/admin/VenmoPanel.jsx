import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  apiAsset,
  deleteVenmoAsset,
  fetchAdminVenmoOrders,
  fetchVenmoAdminConfig,
  fetchVenmoAssets,
  fetchVenmoProofBlobUrl,
  resendVenmoOrderAlert,
  saveVenmoAdminConfig,
  updateAdminVenmoOrder,
  uploadVenmoAsset,
  verifyAdminVenmoOrder,
} from '@/lib/api';
import { Field, SectionCard, TextAreaField } from './controls';

const POLL_MS = 20000;
const MAX_QR_BYTES = 1024 * 1024;

const STATUS_META = {
  pending: { label: 'Pending', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  paid: { label: 'Paid', cls: 'bg-sky-100 text-sky-800 border-sky-300' },
  delivered: { label: 'Delivered', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700 border-red-300' },
  refunded: { label: 'Refunded', cls: 'bg-zinc-100 text-zinc-700 border-stone-300' },
  canceled: { label: 'Canceled', cls: 'bg-zinc-100 text-zinc-700 border-stone-300' },
};

const REJECT_REASONS = {
  amount_mismatch: 'Amount did not match the order total',
  amount_unreadable: 'Could not read the amount in the email',
  order_not_found: 'No order matched that email',
  order_not_pending: 'This order is no longer pending',
};

function toCents(value) {
  const num = Number(String(value).replace(/[$,\s]/g, ''));
  return Number.isFinite(num) ? Math.round(num * 100) : 0;
}

function fromCents(cents) {
  return ((Number(cents) || 0) / 100).toFixed(2);
}

const CURRENCY_SYMBOLS = { USD: '$', CAD: 'CA$', AUD: 'A$', NZD: 'NZ$', EUR: '€', GBP: '£' };

function money(cents, currency) {
  return `${CURRENCY_SYMBOLS[currency] || ''}${fromCents(cents)}`;
}

function when(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return '—';
  }
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-extrabold uppercase tracking-wider ${meta.cls}`}>
      {status === 'pending' && <i className="fa-solid fa-circle text-[6px] animate-pulse"></i>}
      {meta.label}
    </span>
  );
}

function Notice({ tone = 'info', children }) {
  const tones = {
    info: 'bg-sky-50 border-sky-200 text-sky-800',
    ok: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warn: 'bg-amber-50 border-amber-200 text-amber-900',
    error: 'bg-red-50 border-red-200 text-red-700',
  };
  return <p className={`rounded-lg border px-4 py-3 text-sm ${tones[tone]}`}>{children}</p>;
}

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState({ total: 0 });
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState('');
  const [busy, setBusy] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const onSearch = (value) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setQuery(value.trim()), 300);
  };

  useEffect(() => {
    let cancelled = false;
    fetchAdminVenmoOrders({ status, q: query })
      .then((data) => {
        if (cancelled) return;
        setOrders(data.orders);
        setCounts(data.counts);
        setError('');
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load orders.');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setRefreshing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, query, tick]);

  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), POLL_MS);
    return () => clearInterval(timer);
  }, []);

  const act = async (id, label, run) => {
    setBusy(`${id}:${label}`);
    setError('');
    try {
      await run();
      setTick((n) => n + 1);
    } catch (err) {
      setError(err.message || 'That action failed.');
    } finally {
      setBusy('');
    }
  };

  const filters = ['all', 'pending', 'paid', 'delivered', 'rejected', 'refunded'];

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border-2 border-stone-800 shadow-[5px_5px_0_rgba(74,59,50,0.25)] p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs"></i>
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Order number, email or name"
              className="w-full border-2 border-zinc-200 rounded-lg pl-10 pr-3 py-2.5 text-sm outline-none focus:border-[#ED3833]"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              setTick((n) => n + 1);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#ED3833] text-white text-xs font-extrabold uppercase tracking-wider hover:bg-[#c92825] transition-colors"
          >
            <i className={`fa-solid fa-rotate-right ${refreshing ? 'fa-spin' : ''}`}></i> Refresh
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((key) => {
            const count = key === 'all' ? counts.total : counts[key] || 0;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStatus(key)}
                className={`px-3.5 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider transition-colors ${
                  status === key
                    ? 'bg-[#4A3B32] text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-[#ED3833] hover:text-white'
                }`}
              >
                {key} <span className="opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      {loading && !orders.length ? (
        <p className="text-center text-sm text-zinc-500 py-10">
          <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>Loading orders…
        </p>
      ) : (
        !orders.length && (
          <Notice tone="info">
            <i className="fa-solid fa-inbox mr-2"></i>
            No orders here yet. New orders appear automatically — this list refreshes every 20 seconds.
          </Notice>
        )
      )}

      <div className="space-y-3">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} open={openId === order.id} busy={busy} onToggle={() => setOpenId(openId === order.id ? '' : order.id)} onAct={act} />
        ))}
      </div>
    </div>
  );
}

function ProofViewer({ order }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !order.proof?.uploaded) return undefined;
    let revoked = false;
    let objectUrl = null;
    fetchVenmoProofBlobUrl(order.id)
      .then((next) => {
        if (revoked) {
          if (next) URL.revokeObjectURL(next);
          return;
        }
        objectUrl = next;
        setUrl(next);
        if (!next) setError('The screenshot could not be loaded.');
      })
      .catch((err) => setError(err.message || 'The screenshot could not be loaded.'));
    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, order.id, order.proof?.uploaded]);

  if (!order.proof?.uploaded) {
    return (
      <p className="text-xs text-zinc-500">
        <i className="fa-regular fa-image mr-1.5 text-zinc-400"></i>No payment screenshot was attached to this order.
      </p>
    );
  }

  const toggleProof = () => {
    setUrl(null);
    setError('');
    setOpen((prev) => !prev);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={toggleProof}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900 text-white text-xs font-extrabold uppercase tracking-wider hover:bg-zinc-700 transition-colors"
        >
          <i className={`fa-solid ${open ? 'fa-eye-slash' : 'fa-eye'}`}></i> {open ? 'Hide screenshot' : 'View screenshot'}
        </button>
        <span className="text-xs text-zinc-500">
          {order.proof.filename} · {(order.proof.size / 1024).toFixed(0)} KB · {when(order.proof.uploadedAt)}
        </span>
      </div>
      {open && (
        <div className="mt-3 rounded-lg border-2 border-zinc-200 bg-white p-3">
          {error ? (
            <p className="text-xs text-red-600">{error}</p>
          ) : url ? (
            <a href={url} target="_blank" rel="noreferrer" className="block">
              <img src={url} alt="Payment screenshot" className="max-h-[420px] w-auto rounded-lg border border-zinc-200" />
            </a>
          ) : (
            <p className="text-xs text-zinc-500">
              <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>Loading…
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, open, busy, onToggle, onAct }) {
  const [verifyAmount, setVerifyAmount] = useState(order.total);
  const [transactionId, setTransactionId] = useState(order.payment?.transactionId || '');
  const [payer, setPayer] = useState(order.payment?.payer || '');
  const [files, setFiles] = useState(order.delivery?.map((file) => ({ ...file })) || []);
  const [note, setNote] = useState(order.adminNote || '');
  const [feedback, setFeedback] = useState(null);
  const [confirmRefund, setConfirmRefund] = useState(false);

  const run = (label, body, successText, action) =>
    onAct(order.id, label, async () => {
      let result = { ok: true };
      if (action) {
        await action();
      } else if (label === 'verify') {
        result = await verifyAdminVenmoOrder(order.id, {
          amount: verifyAmount,
          transactionId: transactionId.trim(),
          payer: payer.trim(),
        });
      } else {
        await updateAdminVenmoOrder(order.id, body);
      }
      if (result.ok === false) {
        const reason = result.body?.reason;
        setFeedback({
          tone: 'error',
          text: `${result.body?.error || 'Could not confirm.'}${reason ? ` (${REJECT_REASONS[reason] || reason})` : ''}`,
        });
        return;
      }
      if (label === 'refund' || label === 'reject') setConfirmRefund(false);
      setFeedback({ tone: 'ok', text: successText });
    });

  const isBusy = (label) => busy === `${order.id}:${label}`;

  return (
    <div className="bg-white rounded-xl border-2 border-stone-800 shadow-[4px_4px_0_rgba(74,59,50,0.2)] overflow-hidden">
      <button type="button" onClick={onToggle} className="w-full text-left px-4 py-4 flex flex-wrap items-center gap-3 hover:bg-zinc-50 transition-colors">
        <div className="flex-1 min-w-[190px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-zinc-900 tracking-wide">{order.id}</span>
            <StatusBadge status={order.status} />
            {order.needsReview && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider">
                <i className="fa-solid fa-triangle-exclamation"></i> Check
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {order.buyer.name} · {order.buyer.email}
          </p>
        </div>
        <div className="text-right">
          <p className="font-black text-zinc-900">{order.total}</p>
          <p className="text-[11px] text-zinc-400">{when(order.createdAt)}</p>
        </div>
        <i className={`fa-solid fa-chevron-down text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}></i>
      </button>

      {open && (
        <div className="border-t-2 border-stone-100 px-4 py-4 space-y-4 bg-zinc-50/50">
          {feedback && <Notice tone={feedback.tone}>{feedback.text}</Notice>}

          <div className="rounded-lg border-2 border-zinc-200 bg-white p-4 space-y-3">
            <p className="text-sm font-bold text-zinc-800">
              <i className="fa-solid fa-receipt mr-2 text-[#ED3833]"></i>Payment proof
            </p>
            <ProofViewer order={order} />
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() =>
                  run('alert', null, 'Review email sent with fresh one-click links.', () =>
                    resendVenmoOrderAlert(order.id)
                  )
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 text-white text-xs font-extrabold uppercase tracking-wider hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                <i className={`fa-solid ${isBusy('alert') ? 'fa-circle-notch fa-spin' : 'fa-paper-plane'}`}></i>
                Email me review links
              </button>
              {order.alert?.ok && (
                <span className="self-center text-xs text-zinc-500">Last sent {when(order.alert.sentAt)}</span>
              )}
              {order.alert && !order.alert.ok && (
                <span className="self-center text-xs text-amber-700">
                  Last alert failed{order.actions?.approve?.usedAt ? ' · link already used' : ''}
                </span>
              )}
            </div>
            {order.deliveryEmail && (
              <p className="text-xs text-zinc-500">
                Delivery email:{' '}
                <span
                  className={
                    order.deliveryEmail.status === 'sent'
                      ? 'font-bold text-emerald-700'
                      : order.deliveryEmail.status === 'failed'
                        ? 'font-bold text-red-600'
                        : 'font-bold text-amber-700'
                  }
                >
                  {order.deliveryEmail.status}
                </span>
                {order.deliveryEmail.sentAt ? ` · ${when(order.deliveryEmail.sentAt)}` : ''}
              </p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 mb-1">Items</p>
              {order.items.map((item) => (
                <p key={item.productId} className="text-zinc-700">
                  {item.title} ×{item.qty} — {item.price}
                </p>
              ))}
              <p className="mt-2 text-zinc-600">
                Subtotal {order.subtotal}
                {Number(order.feeCents) > 0 ? ` · Fee ${order.fee}` : ''}
              </p>
              <p className="font-black text-zinc-900">Buyer paid {order.total}</p>
              <p className="text-xs text-zinc-500">You receive {order.payout}</p>
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 mb-1">Payment</p>
              <p className="text-zinc-700">
                Note: <span className="font-black text-zinc-900 select-all">{order.paymentNote}</span>
              </p>
              {order.buyer?.handle && <p className="text-zinc-600">Buyer handle: @{order.buyer.handle}</p>}
              {order.buyer?.transactionId && (
                <p className="text-zinc-600">Buyer stated transaction: {order.buyer.transactionId}</p>
              )}
              {order.payment?.payer && <p className="text-zinc-600">From: {order.payment.payer}</p>}
              {order.payment?.transactionId && <p className="text-zinc-600">Transaction: {order.payment.transactionId}</p>}
              {order.payment?.reportedAmountCents !== null && order.payment?.reportedAmountCents !== undefined && (
                <p className={order.payment.reportedAmountCents === order.totalCents ? 'text-emerald-700' : 'text-red-600'}>
                  Email reported {money(order.payment.reportedAmountCents, order.currency)} (expected {order.total})
                </p>
              )}
              <p className="text-zinc-500 mt-1">Paid {when(order.paidAt)}</p>
            </div>
          </div>

          {order.history?.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer font-bold text-zinc-500 hover:text-[#ED3833]">
                Activity log ({order.history.length})
              </summary>
              <ul className="mt-2 space-y-1 text-zinc-500">
                {[...order.history].reverse().map((event, idx) => (
                  <li key={idx}>
                    <span className="text-zinc-400">{when(event.at)}</span> — {event.action.replace(/_/g, ' ')}
                    {event.from && event.to ? ` (${event.from} → ${event.to})` : event.to ? ` → ${event.to}` : ''}
                    {event.reason ? `: ${REJECT_REASONS[event.reason] || event.reason}` : ''}
                    {event.by ? ` · by ${event.by}` : ''}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {order.status === 'pending' && (
            <div className="rounded-lg border-2 border-amber-200 bg-amber-50/60 p-4 space-y-3">
              <p className="text-sm font-bold text-amber-900">
                <i className="fa-solid fa-magnifying-glass-dollar mr-2"></i>Confirm the payment yourself
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                <Field label="Amount received" value={verifyAmount} onChange={setVerifyAmount} />
                <Field label="Transaction ID" value={transactionId} onChange={setTransactionId} hint="Optional" />
                <Field label="Payer name" value={payer} onChange={setPayer} hint="Optional" />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => run('verify', null, 'Payment confirmed and files unlocked.')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-extrabold uppercase tracking-wider hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  <i className={`fa-solid ${isBusy('verify') ? 'fa-circle-notch fa-spin' : 'fa-circle-check'}`}></i> Confirm payment
                </button>
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => {
                    if (!window.confirm(`Reject order ${order.id}? The buyer will see a "could not be verified" notice.`)) return;
                    run('reject', { status: 'rejected' }, 'Order marked as not verified.');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500 text-white text-xs font-extrabold uppercase tracking-wider hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <i className="fa-solid fa-xmark"></i> Reject
                </button>
              </div>
            </div>
          )}

          {['paid', 'delivered'].includes(order.status) && (
            <div className="rounded-lg border-2 border-zinc-200 bg-white p-4 space-y-3">
              <p className="text-sm font-bold text-zinc-800">
                <i className="fa-solid fa-paper-plane mr-2 text-[#ED3833]"></i>Delivery links the buyer can download
              </p>
              <div className="space-y-2">
                {files.map((file, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-2">
                    <input
                      value={file.label}
                      onChange={(e) => setFiles(files.map((f, i) => (i === idx ? { ...f, label: e.target.value } : f)))}
                      placeholder="Comic PDF"
                      className="flex-1 min-w-[120px] border-2 border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#ED3833]"
                    />
                    <input
                      value={file.url}
                      onChange={(e) => setFiles(files.map((f, i) => (i === idx ? { ...f, url: e.target.value } : f)))}
                      placeholder="https://…"
                      className="flex-[2] min-w-[160px] border-2 border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#ED3833]"
                    />
                    <button
                      type="button"
                      onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                      aria-label="Remove link"
                      className="w-9 h-9 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <i className="fa-solid fa-trash text-xs"></i>
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFiles([...files, { label: '', url: '' }])}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-extrabold uppercase tracking-wider hover:bg-zinc-200 transition-colors"
                >
                  <i className="fa-solid fa-plus"></i> Add link
                </button>
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() =>
                    run('deliver', { delivery: files.filter((f) => f.label.trim() && f.url.trim()), status: 'delivered' }, 'Delivered — the buyer can download now.')
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#ED3833] text-white text-xs font-extrabold uppercase tracking-wider hover:bg-[#c92825] transition-colors disabled:opacity-50"
                >
                  <i className={`fa-solid ${isBusy('deliver') ? 'fa-circle-notch fa-spin' : 'fa-box-open'}`}></i> Save &amp; mark delivered
                </button>
                {confirmRefund ? (
                  <span className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-red-600">Sure?</span>
                    <button
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() => run('refund', { status: 'refunded' }, 'Order marked as refunded.')}
                      className="px-3 py-1.5 rounded bg-red-500 text-white font-extrabold uppercase tracking-wider"
                    >
                      Yes, refund
                    </button>
                    <button type="button" onClick={() => setConfirmRefund(false)} className="px-3 py-1.5 rounded bg-zinc-200 text-zinc-700 font-extrabold uppercase tracking-wider">
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmRefund(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border-2 border-red-200 text-red-500 text-xs font-extrabold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <i className="fa-solid fa-rotate-left"></i> Refund
                  </button>
                )}
              </div>
            </div>
          )}

          {['rejected', 'refunded', 'canceled'].includes(order.status) && (
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => {
                if (!window.confirm(`Reopen ${order.id} as pending? The buyer will be asked to pay again and any delivery links will be hidden.`)) return;
                run('reopen', { status: 'pending', needsReview: false }, 'Order reopened — you can confirm the payment now.');
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-stone-300 text-zinc-600 text-xs font-extrabold uppercase tracking-wider hover:border-[#ED3833] hover:text-[#ED3833] transition-colors disabled:opacity-50"
            >
              <i className="fa-solid fa-rotate-left"></i> Reopen as pending
            </button>
          )}

          <div>
            <TextAreaField label="Private note (only you can see this)" value={note} onChange={setNote} rows={2} />
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => run('note', { adminNote: note }, 'Note saved.')}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#4A3B32] text-white text-xs font-extrabold uppercase tracking-wider hover:bg-black transition-colors disabled:opacity-50"
            >
              <i className="fa-solid fa-floppy-disk"></i> Save note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsTab() {
  const [config, setConfig] = useState(null);
  const [products, setProducts] = useState([]);
  const [qr, setQr] = useState(null);
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetchVenmoAdminConfig()
      .then((data) => {
        if (cancelled) return;
        setConfig(data.config);
        setProducts((data.config.products || []).map((p) => ({ ...p, price: fromCents(p.priceCents) })));
        setQr(null);
        setFeedback(null);
      })
      .catch((err) => {
        if (!cancelled) setFeedback({ tone: 'error', text: err.message || 'Could not load settings.' });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const set = (key) => (value) => setConfig((prev) => ({ ...prev, [key]: value }));

  const pickQr = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_QR_BYTES) {
      setFeedback({ tone: 'error', text: 'That image is too big. Use a PNG under 1 MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setQr(String(reader.result));
      setFeedback({ tone: 'info', text: 'QR ready — press Save to upload it.' });
    };
    reader.readAsDataURL(file);
  };

  const checkProducts = () => {
    const problems = [];
    const seen = new Set();
    products.forEach((product, idx) => {
      const label = product.title.trim() || product.id.trim() || `#${idx + 1}`;
      if (!product.id.trim()) problems.push(`${label}: needs an ID.`);
      else if (!/^[A-Za-z0-9_-]+$/.test(product.id.trim())) problems.push(`${label}: ID can only use letters, numbers, - and _.`);
      else if (seen.has(product.id.trim())) problems.push(`${label}: ID "${product.id.trim()}" is used twice.`);
      seen.add(product.id.trim());
      if (!product.title.trim()) problems.push(`${label}: needs a title.`);
      if (!(toCents(product.price) > 0)) problems.push(`${label}: price must be more than 0.`);
    });
    return problems;
  };

  const save = async () => {
    const problems = checkProducts();
    if (problems.length) {
      setFeedback({ tone: 'error', text: `Fix these before saving — otherwise the plan is dropped from checkout: ${problems.join(' ')}` });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        enabled: config.enabled,
        handle: config.handle,
        displayName: config.displayName,
        accountEmail: config.accountEmail,
        accountType: config.accountType,
        noteTemplate: config.noteTemplate,
        instructions: config.instructions,
        feeMode: config.feeMode,
        feePercent: config.feePercent,
        feeFixedCents: config.feeFixedCents,
        allowPartial: config.allowPartial,
        autoConfirm: config.autoConfirm,
        products: products.map((p) => ({
          id: p.id.trim(),
          title: p.title,
          description: p.description,
          priceCents: toCents(p.price),
          active: p.active !== false,
        })),
      };
      if (qr) payload.qrDataUrl = qr;
      const data = await saveVenmoAdminConfig(payload);
      setConfig(data.config);
      setProducts((data.config.products || []).map((p) => ({ ...p, price: fromCents(p.priceCents) })));
      setQr(null);
      setFeedback({ tone: 'ok', text: 'Saved. The checkout page is live with these settings.' });
    } catch (err) {
      setFeedback({ tone: 'error', text: err.message || 'Could not save settings.' });
    } finally {
      setSaving(false);
    }
  };

  const qrPreview = useMemo(() => qr || apiAsset(config?.qrUploaded ? '/api/venmo/qr' : ''), [qr, config]);

  if (loading) {
    return (
      <p className="text-center text-sm text-zinc-500 py-10">
        <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>Loading settings…
      </p>
    );
  }

  if (!config) return <Notice tone="error">{feedback?.text || 'Settings unavailable.'}</Notice>;

  return (
    <div className="space-y-5">
      <SectionCard icon="fa-money-bill-transfer" title="Venmo Account" desc="Where buyers send money — the @handle is what matters most">
        {feedback && <Notice tone={feedback.tone}>{feedback.text}</Notice>}

        <label className="flex items-center gap-3 rounded-lg border-2 border-zinc-200 px-4 py-3 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(config.enabled)}
            onChange={(e) => set('enabled')(e.target.checked)}
            className="w-5 h-5 accent-[#ED3833]"
          />
          <span className="text-sm font-extrabold text-zinc-800">Accept Venmo payments on the site</span>
        </label>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Venmo Handle" value={config.handle} onChange={set('handle')} hint="Without the @ — e.g. greyfire-studio" />
          <Field label="Display Name" value={config.displayName} onChange={set('displayName')} hint="Shown on your Venmo profile" />
          <Field label="Account Email" value={config.accountEmail} onChange={set('accountEmail')} hint="Where payment alerts are forwarded from" />
          <div>
            <span className="block text-xs font-extrabold uppercase tracking-wider text-zinc-600 mb-1.5">Account Type</span>
            <div className="flex gap-2">
              {['personal', 'business'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => set('accountType')(option)}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-colors ${
                    config.accountType === option ? 'bg-[#ED3833] text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Field label="Note buyers must type" value={config.noteTemplate} onChange={set('noteTemplate')} hint="{orderId} is replaced with the order number" />
        <TextAreaField label="Instructions shown at checkout" value={config.instructions} onChange={set('instructions')} rows={3} />
      </SectionCard>

      <SectionCard icon="fa-receipt" title="Fees & Verification" desc="How the Venmo fee is handled and what counts as a match">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <span className="block text-xs font-extrabold uppercase tracking-wider text-zinc-600 mb-1.5">Fee</span>
            <div className="flex gap-2">
              {[
                { value: 'absorb', label: 'I pay it' },
                { value: 'add', label: 'Buyer pays' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => set('feeMode')(option.value)}
                  className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-colors ${
                    config.feeMode === option.value ? 'bg-[#4A3B32] text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <Field label="Fee Percent" value={config.feePercent} onChange={set('feePercent')} type="number" hint="Venmo charges about 1.5–2.9%" />
          <Field label="Fixed Fee (cents)" value={config.feeFixedCents} onChange={set('feeFixedCents')} type="number" hint="Usually 29" />
        </div>

        <label className="flex items-center gap-3 rounded-lg border-2 border-zinc-200 px-4 py-3 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(config.allowPartial)}
            onChange={(e) => set('allowPartial')(e.target.checked)}
            className="w-5 h-5 accent-[#ED3833]"
          />
          <span className="text-sm font-extrabold text-zinc-800">Accept overpayments from buyers</span>
        </label>

        {config.ingestConfigured ? (
          <Notice tone="ok">
            <i className="fa-solid fa-envelope-circle-check mr-2"></i>Email auto-verify is on. Forwarded Venmo emails can confirm orders on their own.
          </Notice>
        ) : (
          <Notice tone="warn">
            <i className="fa-solid fa-triangle-exclamation mr-2"></i>
            Email auto-verify is off. Set <code className="font-black">VENMO_INGEST_TOKEN</code> on the server to turn it on.
          </Notice>
        )}
      </SectionCard>

      <SectionCard icon="fa-qrcode" title="Checkout QR Code" desc="Shown to buyers at payment — upload a high-res PNG">
        <div className="flex flex-wrap items-center gap-4">
          {qrPreview ? (
            <img src={qrPreview} alt="Venmo QR" className="w-40 h-40 object-contain rounded-lg border-2 border-stone-200 bg-white" />
          ) : (
            <div className="w-40 h-40 rounded-lg border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-zinc-400 text-center px-3">
              <i className="fa-solid fa-qrcode text-3xl mb-2"></i>
              <span className="text-xs">No QR uploaded</span>
            </div>
          )}
          <div className="space-y-2">
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={pickQr} className="hidden" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#4A3B32] text-white text-xs font-extrabold uppercase tracking-wider hover:bg-black transition-colors"
            >
              <i className="fa-solid fa-upload"></i> Choose image
            </button>
            {config.qrUploaded && (
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setSaving(true);
                  setQr(null);
                  saveVenmoAdminConfig({ qrDataUrl: null })
                    .then(() => setTick((n) => n + 1))
                    .catch((err) => setFeedback({ tone: 'error', text: err.message || 'Could not remove the QR.' }))
                    .finally(() => setSaving(false));
                }}
                className="block inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-red-200 text-red-500 text-xs font-extrabold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
              >
                <i className="fa-solid fa-trash"></i> Remove QR
              </button>
            )}
            <p className="text-[11px] text-zinc-400 italic max-w-xs">PNG, JPG or WebP · under 1 MB · a screenshot usually will not scan cleanly.</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard icon="fa-boxes-stacked" title="Plans for Sale" desc="Prices here are what buyers are charged — the site cannot override them">
        <div className="space-y-3">
          {products.map((product, idx) => (
            <div key={idx} className="border-2 border-zinc-100 rounded-xl p-3 bg-zinc-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-zinc-500">
                  <i className="fa-solid fa-layer-group text-[#ED3833]"></i> #{idx + 1}
                </span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500">
                    <input
                      type="checkbox"
                      checked={product.active !== false}
                      onChange={(e) => setProducts(products.map((p, i) => (i === idx ? { ...p, active: e.target.checked } : p)))}
                      className="w-4 h-4 accent-[#ED3833]"
                    />
                    Live
                  </label>
                  <button
                    type="button"
                    onClick={() => setProducts(products.filter((_, i) => i !== idx))}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-500 text-xs font-bold hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <i className="fa-solid fa-trash"></i> Remove
                  </button>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <Field label="ID" value={product.id} onChange={(v) => setProducts(products.map((p, i) => (i === idx ? { ...p, id: v } : p)))} hint="Letters, numbers, - _" />
                <Field label="Title" value={product.title} onChange={(v) => setProducts(products.map((p, i) => (i === idx ? { ...p, title: v } : p)))} />
                <Field label={`Price (${config.currency || 'USD'})`} value={product.price} onChange={(v) => setProducts(products.map((p, i) => (i === idx ? { ...p, price: v } : p)))} />
              </div>
              <Field label="Description" value={product.description} onChange={(v) => setProducts(products.map((p, i) => (i === idx ? { ...p, description: v } : p)))} />
            </div>
          ))}
          {products.length === 0 && <p className="text-sm text-zinc-400 italic">No plans yet — add one below.</p>}
        </div>
        <button
          type="button"
          onClick={() => setProducts([...products, { id: '', title: '', description: '', price: '', active: true }])}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#ED3833] text-white text-xs font-extrabold uppercase tracking-wider hover:bg-[#c92825] transition-colors"
        >
          <i className="fa-solid fa-plus"></i> Add plan
        </button>
      </SectionCard>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ED3833] text-white font-extrabold uppercase tracking-widest text-xs hover:bg-[#c92825] transition-colors disabled:opacity-60"
        >
          <i className={`fa-solid ${saving ? 'fa-circle-notch fa-spin' : 'fa-floppy-disk'}`}></i> {saving ? 'Saving…' : 'Save Venmo Settings'}
        </button>
        <button type="button" onClick={() => setTick((n) => n + 1)} className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-stone-300 text-zinc-600 font-extrabold uppercase tracking-widest text-xs hover:border-[#ED3833] hover:text-[#ED3833] transition-colors">
          <i className="fa-solid fa-rotate-left"></i> Discard changes
        </button>
      </div>
    </div>
  );
}

function AssetsTab() {
  const [assets, setAssets] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [selected, setSelected] = useState([]);
  const [tick, setTick] = useState(0);

  const load = () => {
    Promise.all([fetchVenmoAssets(), fetchVenmoAdminConfig()])
      .then(([assetData, configData]) => {
        setAssets(assetData.assets || []);
        setProducts(configData.config?.products || []);
        setError('');
      })
      .catch((err) => setError(err.message || 'Could not load assets.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [tick]);

  const toggleProduct = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]));

  const upload = async (event) => {
    event.preventDefault();
    if (!file || busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await uploadVenmoAsset({ file, label: label.trim(), description: description.trim(), productIds: selected });
      setFile(null);
      setLabel('');
      setDescription('');
      setSelected([]);
      setNotice('Asset uploaded. It will be attached automatically on approval.');
      setTick((n) => n + 1);
    } catch (err) {
      setError(err.message || 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (asset) => {
    if (!window.confirm(`Delete "${asset.label}"? Buyers who already downloaded it keep their copy.`)) return;
    try {
      await deleteVenmoAsset(asset.id);
      setTick((n) => n + 1);
    } catch (err) {
      setError(err.message || 'Delete failed.');
    }
  };

  const setActive = async (asset, active) => {
    try {
      setAssets((prev) => prev.map((entry) => (entry.id === asset.id ? { ...entry, active } : entry)));
      await updateVenmoAsset(asset.id, { active });
    } catch (err) {
      setAssets((prev) => prev.map((entry) => (entry.id === asset.id ? { ...entry, active: !active } : entry)));
      setError(err.message || 'Could not update that asset.');
    }
  };

  return (
    <div className="space-y-5">
      <SectionCard
        icon="fa-box-archive"
        title="Digital assets"
        desc="Upload the OC and character files buyers receive. They are emailed as signed download links the moment an order is approved."
      >
        {error && <Notice tone="error">{error}</Notice>}
        {notice && <Notice tone="ok">{notice}</Notice>}

        <form onSubmit={upload} className="mt-4 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Label shown to buyers" value={label} onChange={setLabel} hint="e.g. OC pack — Fire (PSD + PNG)" />
            <Field label="Description" value={description} onChange={setDescription} hint="Optional" />
          </div>

          <label className="block">
            <span className="badge-font text-xs uppercase tracking-widest text-zinc-500">File</span>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-1.5 w-full text-sm text-zinc-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:bg-stone-900 file:text-white file:font-bold file:text-xs file:uppercase file:tracking-widest hover:file:bg-stone-700 cursor-pointer"
            />
          </label>

          <div>
            <p className="badge-font text-xs uppercase tracking-widest text-zinc-500 mb-2">Unlock for plans</p>
            <div className="flex flex-wrap gap-2">
              {products.map((product) => (
                <label
                  key={product.id}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-xs font-bold cursor-pointer transition-colors ${
                    selected.includes(product.id)
                      ? 'border-[#ED3833] bg-red-50 text-[#ED3833]'
                      : 'border-stone-200 text-zinc-600 hover:border-[#ED3833]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(product.id)}
                    onChange={() => toggleProduct(product.id)}
                    className="accent-[#ED3833]"
                  />
                  {product.title}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Select none to make this a bonus file that rides along with every order.
            </p>
          </div>

          <button
            type="submit"
            disabled={!file || busy}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#ED3833] text-white font-extrabold uppercase tracking-widest text-xs hover:bg-[#c92825] transition-colors disabled:opacity-50"
          >
            <i className={`fa-solid ${busy ? 'fa-circle-notch fa-spin' : 'fa-cloud-arrow-up'}`}></i>{' '}
            {busy ? 'Uploading…' : 'Upload asset'}
          </button>
        </form>
      </SectionCard>

      <SectionCard icon="fa-boxes-stacked" title={`Uploaded files (${assets.length})`} desc="Delivered automatically on approval.">
        {loading ? (
          <p className="text-sm text-zinc-500">
            <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>Loading…
          </p>
        ) : assets.length === 0 ? (
          <p className="text-sm text-zinc-500">Nothing uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {assets.map((asset) => (
              <li
                key={asset.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border-2 border-stone-200 px-4 py-3"
              >
                <div className="flex-1 min-w-[180px]">
                  <p className="font-bold text-zinc-900">{asset.label}</p>
                  <p className="text-xs text-zinc-500">
                    {asset.filename} · {(asset.size / 1024 / 1024).toFixed(2)} MB
                    {asset.description ? ` · ${asset.description}` : ''}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {asset.productIds?.length
                      ? asset.productIds.map((id) => products.find((p) => p.id === id)?.title || id).join(', ')
                      : 'Every order'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActive(asset, !asset.active)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border-2 ${
                    asset.active
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : 'border-stone-200 bg-stone-50 text-zinc-500'
                  }`}
                >
                  {asset.active ? 'Active' : 'Paused'}
                </button>
                <button
                  type="button"
                  onClick={() => remove(asset)}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border-2 border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

export default function VenmoPanel() {
  const [tab, setTab] = useState('orders');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'orders', label: 'Orders', icon: 'fa-receipt' },
          { id: 'assets', label: 'Assets', icon: 'fa-box-archive' },
          { id: 'settings', label: 'Venmo Settings', icon: 'fa-gear' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-colors ${
              tab === item.id ? 'bg-[#ED3833] text-white' : 'bg-white text-zinc-600 border-2 border-stone-200 hover:border-[#ED3833] hover:text-[#ED3833]'
            }`}
          >
            <i className={`fa-solid ${item.icon}`}></i> {item.label}
          </button>
        ))}
      </div>

      {tab === 'orders' ? <OrdersTab /> : tab === 'assets' ? <AssetsTab /> : <SettingsTab />}
    </div>
  );
}
