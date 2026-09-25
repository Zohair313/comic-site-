import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { defaultData, useSiteData } from '@/context/SiteDataContext';
import { isApiConfigured, apiLogin, clearApiToken } from '@/lib/api';
import { Field, TextAreaField, SectionCard, ArrayEditor, ObjectListEditor, SaveBar } from './controls';

const AUTH_KEY = 'gf_admin_authed';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin';

function isAuthed() {
  try {
    return sessionStorage.getItem(AUTH_KEY) === '1';
  } catch {
    return false;
  }
}

const sections = [
  { id: 'site', label: 'Site Settings', icon: 'fa-gear' },
  { id: 'hero', label: 'Hero Banner', icon: 'fa-bolt' },
  { id: 'ticker', label: 'Scrolling Ticker', icon: 'fa-angles-right' },
  { id: 'about', label: 'About Section', icon: 'fa-user' },
  { id: 'blog', label: 'Blog / Updates', icon: 'fa-newspaper' },
  { id: 'characters', label: 'Characters', icon: 'fa-masks-theater' },
  { id: 'reader', label: 'Comic Reader', icon: 'fa-book-open' },
  { id: 'art', label: 'Art Collection', icon: 'fa-palette' },
  { id: 'contact', label: 'Contact Page', icon: 'fa-envelope' },
  { id: 'footer', label: 'Footer', icon: 'fa-shoe-prints' },
];

function Login({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (isApiConfigured) {
        const res = await apiLogin(username.trim(), password);
        if (res.token) {
          sessionStorage.setItem(AUTH_KEY, '1');
          onSuccess();
          return;
        }
        setError(res.error || 'Invalid username or password.');
      } else {
        if (username.trim() === ADMIN_USER && password === ADMIN_PASS) {
          sessionStorage.setItem(AUTH_KEY, '1');
          onSuccess();
          return;
        }
        setError('Invalid username or password.');
      }
    } catch {
      setError('Backend unreachable — check the API server.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden border-2 border-stone-800 shadow-[10px_10px_0_rgba(74,59,50,0.35)]">
        <div className="px-6 py-5 bg-[#4A3B32] flex items-center gap-3">
          <span className="w-11 h-11 rounded-full bg-[#ED3833] text-white flex items-center justify-center">
            <i className="fa-solid fa-user-shield"></i>
          </span>
          <div>
            <h1 className="display-font text-white text-2xl leading-none">Admin Login</h1>
            <p className="text-xs text-white/60 mt-0.5">Greyfire Studio Control Panel</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
          {error && (
            <div className="rounded-lg border-2 border-red-200 bg-red-50 text-red-600 text-sm font-bold px-4 py-3">
              <i className="fa-solid fa-triangle-exclamation mr-2"></i>{error}
            </div>
          )}

          <label className="block">
            <span className="block text-xs font-extrabold uppercase tracking-wider text-zinc-600 mb-1.5">Username</span>
            <div className="relative">
              <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm"></i>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
                className="w-full border-2 border-zinc-200 rounded-xl pl-11 pr-4 py-3 text-zinc-800 placeholder-zinc-400 outline-none transition focus:border-[#ED3833] focus:ring-2 focus:ring-[#ED3833]/20"
              />
            </div>
          </label>

          <label className="block">
            <span className="block text-xs font-extrabold uppercase tracking-wider text-zinc-600 mb-1.5">Password</span>
            <div className="relative">
              <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm"></i>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                className="w-full border-2 border-zinc-200 rounded-xl pl-11 pr-4 py-3 text-zinc-800 placeholder-zinc-400 outline-none transition focus:border-[#ED3833] focus:ring-2 focus:ring-[#ED3833]/20"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3.5 rounded-xl bg-[#ED3833] hover:bg-[#c92825] text-white font-extrabold uppercase tracking-widest transition-colors shadow-[4px_4px_0_rgba(74,59,50,0.6)] active:translate-y-0.5 active:shadow-none disabled:opacity-60"
          >
            <i className={`fa-solid ${busy ? 'fa-circle-notch fa-spin' : 'fa-sign-in-alt'} mr-2`}></i>{busy ? 'Signing In…' : 'Sign In'}
          </button>

          <p className="text-center text-xs text-zinc-400">
            <Link to="/" className="hover:text-[#ED3833] font-bold"><i className="fa-solid fa-arrow-left mr-1"></i>Back to site</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const { data, updateSection, resetAll, flushSave, storage } = useSiteData();
  const [authed, setAuthed] = useState(isAuthed);
  const [active, setActive] = useState('site');
  const [savedAt, setSavedAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [unsaved, setUnsaved] = useState(false);
  const lastSavedRef = useRef(JSON.stringify(data));
  const baselined = useRef(false);

  useEffect(() => {
    if (storage === 'connecting') return;
    if (storage === 'api' && !baselined.current) {
      baselined.current = true;
      lastSavedRef.current = JSON.stringify(data);
      return;
    }
    if (JSON.stringify(data) !== lastSavedRef.current) {
      setUnsaved(true);
    }
  }, [data, storage]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(false);
    const ok = await flushSave();
    setSaving(false);
    if (ok) {
      lastSavedRef.current = JSON.stringify(data);
      setUnsaved(false);
      setSavedAt(new Date().toLocaleTimeString());
    } else {
      setSaveError(true);
    }
  };

  const handleReset = () => {
    if (!window.confirm('Reset ALL content back to defaults?')) return;
    resetAll();
    flushSave();
    lastSavedRef.current = JSON.stringify(defaultData);
    setUnsaved(false);
    setSavedAt(new Date().toLocaleTimeString());
  };

  const logout = () => {
    try {
      sessionStorage.removeItem(AUTH_KEY);
      clearApiToken();
    } catch { /* no-op */ }
    setAuthed(false);
  };

  if (!authed) {
    return <Login onSuccess={() => setAuthed(true)} />;
  }

  const activeSection = sections.find((s) => s.id === active);

  const d = (section) => data[section] ?? {};

  return (
    <section id="admin-panel" className="min-h-screen bg-[#f0ece3] pt-8 pb-16">
      <div className="container mx-auto px-3 sm:px-4">
        {/* Admin top bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-6 rounded-xl border-2 border-stone-800 bg-[#4A3B32] px-4 py-3 shadow-[5px_5px_0_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-[#ED3833] text-white flex items-center justify-center">
              <i className="fa-solid fa-bolt"></i>
            </span>
            <div>
              <h1 className="display-font text-white text-xl leading-none">Admin Panel</h1>
              <p className="text-xs text-white/60 mt-0.5">Logged in as admin</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 text-white text-xs font-extrabold uppercase tracking-wider hover:bg-white/20 transition-colors"
            >
              <i className="fa-solid fa-eye"></i> View Site
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500 text-white text-xs font-extrabold uppercase tracking-wider hover:bg-red-600 transition-colors"
            >
              <i className="fa-solid fa-right-from-bracket"></i> Logout
            </button>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-6">
          {/* Sidebar — chips scroll horizontally on mobile, rail on desktop */}
          <nav className="lg:sticky lg:top-6 lg:self-start mb-6 lg:mb-0">
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              {sections.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActive(s.id)}
                  className={`inline-flex items-center gap-2.5 shrink-0 px-4 lg:px-4 py-2.5 rounded-xl text-sm font-extrabold uppercase tracking-wider transition-all ${
                    active === s.id
                      ? 'bg-[#ED3833] text-white shadow-[3px_3px_0_rgba(74,59,50,0.4)]'
                      : 'bg-white text-zinc-600 border-2 border-stone-200 hover:border-[#ED3833] hover:text-[#ED3833]'
                  }`}
                >
                  <i className={`fa-solid ${s.icon}`}></i>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <h2 className="display-font text-[#4A3B32] text-3xl leading-none">{activeSection?.label}</h2>
              <span className="badge-font bg-[#769678] text-white text-xs font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full">
                <i className="fa-solid fa-pen-nib mr-1"></i>Editable
              </span>
            </div>

            {/* SITE */}
            {active === 'site' && (
              <SectionCard icon={sections[0].icon} title="Site Settings" desc="Site-wide name, tagline and contact emails">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Site Name" value={d('site').name} onChange={(v) => updateSection('site', { name: v })} />
                  <Field label="Tagline" value={d('site').tagline} onChange={(v) => updateSection('site', { tagline: v })} />
                  <Field label="Inquiry Email (forms)" value={d('site').email} onChange={(v) => updateSection('site', { email: v })} hint="Used by contact form mailto" />
                  <Field label="Contact Email (direct)" value={d('site').contactEmail} onChange={(v) => updateSection('site', { contactEmail: v })} />
                </div>
              </SectionCard>
            )}

            {/* HERO */}
            {active === 'hero' && (
              <SectionCard icon={sections[1].icon} title="Hero Banner" desc="Homepage hero — headline, snippet and CTAs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Eyebrow Badge" value={d('hero').badge} onChange={(v) => updateSection('hero', { badge: v })} />
                  <Field label="Title" value={d('hero').title} onChange={(v) => updateSection('hero', { title: v })} />
                  <Field label="Cover Tag" value={d('hero').tag} onChange={(v) => updateSection('hero', { tag: v })} />
                  <Field label="Cover Image" value={d('hero').image} onChange={(v) => updateSection('hero', { image: v })} hint="Path in /public or full URL" />
                  <Field label="Background Image" value={d('hero').background} onChange={(v) => updateSection('hero', { background: v })} hint="Path in /public or full URL" />
                  <Field label="Primary CTA Label" value={d('hero').ctaPrimary.label} onChange={(v) => updateSection('hero', { ctaPrimary: { ...d('hero').ctaPrimary, label: v } })} />
                  <Field label="Primary CTA Link" value={d('hero').ctaPrimary.to} onChange={(v) => updateSection('hero', { ctaPrimary: { ...d('hero').ctaPrimary, to: v } })} />
                  <Field label="Secondary CTA Label" value={d('hero').ctaSecondary.label} onChange={(v) => updateSection('hero', { ctaSecondary: { ...d('hero').ctaSecondary, label: v } })} />
                  <Field label="Secondary CTA Link" value={d('hero').ctaSecondary.to} onChange={(v) => updateSection('hero', { ctaSecondary: { ...d('hero').ctaSecondary, to: v } })} />
                </div>
                <TextAreaField label="Snippet" value={d('hero').snippet} onChange={(v) => updateSection('hero', { snippet: v })} rows={3} />
              </SectionCard>
            )}

            {/* TICKER */}
            {active === 'ticker' && (
              <SectionCard icon={sections[2].icon} title="Scrolling Ticker" desc="Red marquee strip words at the hero bottom">
                <ArrayEditor label="Ticker Items" items={d('marquee').items ?? []} onChange={(items) => updateSection('marquee', { items })} />
              </SectionCard>
            )}

            {/* ABOUT */}
            {active === 'about' && (
              <SectionCard icon={sections[3].icon} title="About Section" desc="Homepage about block + bio image & socials">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Eyebrow" value={d('about').eyebrow} onChange={(v) => updateSection('about', { eyebrow: v })} />
                  <Field label="Name / Heading" value={d('about').name} onChange={(v) => updateSection('about', { name: v })} />
                  <Field label="Creator Intro (role/tagline)" value={d('about').role ?? ''} onChange={(v) => updateSection('about', { role: v })} />
                  <TextAreaField label="Creator Intro (short section text)" value={d('about').intro ?? ''} onChange={(v) => updateSection('about', { intro: v })} rows={3} />
                  <Field label="Portrait Image" value={d('about').image} onChange={(v) => updateSection('about', { image: v })} />
                  <Field label="Instagram URL" value={d('about').instagram} onChange={(v) => updateSection('about', { instagram: v })} />
                </div>
                <ArrayEditor label="Paragraphs" items={d('about').paragraphs ?? []} onChange={(paragraphs) => updateSection('about', { paragraphs })} />
                <ArrayEditor label="Key Points (checks)" items={d('about').bullets ?? []} onChange={(bullets) => updateSection('about', { bullets })} />
              </SectionCard>
            )}

            {/* BLOG */}
            {active === 'blog' && (
              <SectionCard icon={sections[4].icon} title="Blog / Updates" desc='Featured "Behind the Scenes" post card on the homepage'>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Eyebrow" value={d('blog').eyebrow} onChange={(v) => updateSection('blog', { eyebrow: v })} />
                  <Field label="Section Heading" value={d('blog').heading} onChange={(v) => updateSection('blog', { heading: v })} />
                  <Field label="Badge Number" value={d('blog').number} onChange={(v) => updateSection('blog', { number: v })} />
                  <Field label="Category Pill" value={d('blog').pill} onChange={(v) => updateSection('blog', { pill: v })} />
                  <Field label="Post Title" value={d('blog').title} onChange={(v) => updateSection('blog', { title: v })} />
                  <Field label="Date Label" value={d('blog').dateLabel} onChange={(v) => updateSection('blog', { dateLabel: v })} />
                  <Field label="Author Name" value={d('blog').authorName} onChange={(v) => updateSection('blog', { authorName: v })} />
                  <Field label="Author Role" value={d('blog').authorRole} onChange={(v) => updateSection('blog', { authorRole: v })} />
                  <Field label="Author Image" value={d('blog').authorImg} onChange={(v) => updateSection('blog', { authorImg: v })} />
                  <Field label="Post Image" value={d('blog').image} onChange={(v) => updateSection('blog', { image: v })} />
                  <Field label="Image Badge" value={d('blog').imageBadge} onChange={(v) => updateSection('blog', { imageBadge: v })} />
                  <Field label="CTA Label" value={d('blog').ctaLabel} onChange={(v) => updateSection('blog', { ctaLabel: v })} />
                  <Field label="CTA Link" value={d('blog').ctaTo} onChange={(v) => updateSection('blog', { ctaTo: v })} />
                </div>
                <TextAreaField label="Post Body" value={d('blog').body} onChange={(v) => updateSection('blog', { body: v })} rows={4} />
              </SectionCard>
            )}

            {/* CHARACTERS */}
            {active === 'characters' && (
              <SectionCard icon={sections[5].icon} title="Characters" desc="Lore page — the core cast grid">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Section Badge" value={d('lore').badge} onChange={(v) => updateSection('lore', { badge: v })} />
                  <Field label="Section Heading" value={d('lore').heading} onChange={(v) => updateSection('lore', { heading: v })} />
                </div>
                <ObjectListEditor
                  label="Characters"
                  items={d('lore').characters ?? []}
                  onChange={(characters) => updateSection('lore', { characters })}
                  fields={[
                    { key: 'name', label: 'Name' },
                    { key: 'role', label: 'Role' },
                    { key: 'desc', label: 'Description', full: true },
                    { key: 'img', label: 'Image Path', hint: 'Path in /public or full URL' },
                  ]}
                  newItem={{ name: '', role: '', desc: '', img: '' }}
                />
              </SectionCard>
            )}

            {/* READER */}
            {active === 'reader' && (
              <SectionCard icon={sections[6].icon} title="Comic Reader" desc="Reader page heading, chapters and available pages">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Page Heading" value={d('reader').heading} onChange={(v) => updateSection('reader', { heading: v })} />
                  <Field label="Back Button Label" value={d('reader').backLabel} onChange={(v) => updateSection('reader', { backLabel: v })} />
                  <Field label="Back Button Link" value={d('reader').backTo} onChange={(v) => updateSection('reader', { backTo: v })} />
                </div>
                <ObjectListEditor
                  label="Chapters"
                  items={d('reader').chapters ?? []}
                  onChange={(chapters) => updateSection('reader', { chapters })}
                  fields={[
                    { key: 'id', label: 'ID (number)', type: 'number' },
                    { key: 'title', label: 'Title' },
                    { key: 'pages', label: 'Pages', type: 'number', hint: 'Shown in the dropdown' },
                  ]}
                  newItem={{ id: 1, title: '', pages: 3 }}
                />
                <ArrayEditor label="Comic Page Images" items={d('reader').pages ?? []} onChange={(pages) => updateSection('reader', { pages })} hint="Each entry is one page image in reading order" />
              </SectionCard>
            )}

            {/* ART */}
            {active === 'art' && (
              <SectionCard icon={sections[7].icon} title="Art Collection" desc="Art gallery — heading, categories and artworks">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Eyebrow" value={d('art').eyebrow} onChange={(v) => updateSection('art', { eyebrow: v })} />
                  <Field label="Heading" value={d('art').heading} onChange={(v) => updateSection('art', { heading: v })} />
                  <Field label="CTA Text (below gallery)" value={d('art').ctaText} onChange={(v) => updateSection('art', { ctaText: v })} />
                  <Field label="CTA Button Label" value={d('art').ctaLabel} onChange={(v) => updateSection('art', { ctaLabel: v })} />
                </div>
                <TextAreaField label="Description" value={d('art').description} onChange={(v) => updateSection('art', { description: v })} rows={2} />
                <ArrayEditor label="Filter Categories" items={d('art').categories ?? []} onChange={(categories) => updateSection('art', { categories })} hint="Keep 'All' as the first item" />
                <ObjectListEditor
                  label="Artworks"
                  items={d('art').artworks ?? []}
                  onChange={(artworks) => updateSection('art', { artworks })}
                  fields={[
                    { key: 'img', label: 'Image Path', hint: 'Path in /public or full URL' },
                    { key: 'title', label: 'Title' },
                    { key: 'category', label: 'Category', hint: 'Must match a filter above' },
                    { key: 'tag', label: 'Tag' },
                  ]}
                  newItem={{ img: '', title: '', category: 'Covers', tag: '' }}
                />
              </SectionCard>
            )}

            {/* CONTACT */}
            {active === 'contact' && (
              <SectionCard icon={sections[8].icon} title="Contact Page" desc="Contact heading, form email and social links">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Page Heading" value={d('contact').heading} onChange={(v) => updateSection('contact', { heading: v })} />
                  <Field label="Form Email (mailto)" value={d('contact').email} onChange={(v) => updateSection('contact', { email: v })} hint="Where inquiry form messages go" />
                  <Field label="Form Note" value={d('contact').formNote} onChange={(v) => updateSection('contact', { formNote: v })} />
                </div>
                <ObjectListEditor
                  label="Social / Direct Links"
                  items={d('contact').socials ?? []}
                  onChange={(socials) => updateSection('contact', { socials })}
                  fields={[
                    { key: 'label', label: 'Label' },
                    { key: 'handle', label: 'Handle / Address' },
                    { key: 'icon', label: 'FontAwesome Icon Class', hint: 'e.g. fa-brands fa-instagram' },
                    { key: 'href', label: 'Link URL', hint: 'mailto: or https://' },
                  ]}
                  newItem={{ label: '', handle: '', icon: 'fa-solid fa-link', href: '' }}
                />
              </SectionCard>
            )}

            {/* FOOTER */}
            {active === 'footer' && (
              <SectionCard icon={sections[9].icon} title="Footer" desc="Footer description, socials and credit line">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="About Text" value={d('footer').about} onChange={(v) => updateSection('footer', { about: v })} />
                  <Field label="Instagram URL" value={d('footer').instagram} onChange={(v) => updateSection('footer', { instagram: v })} />
                  <Field label="Email Address" value={d('footer').email} onChange={(v) => updateSection('footer', { email: v })} />
                  <Field label="Credit Line (Made with ❤ by)" value={d('footer').creditedBy} onChange={(v) => updateSection('footer', { creditedBy: v })} />
                </div>
              </SectionCard>
            )}

            <SaveBar
              savedAt={savedAt}
              saving={saving}
              saveError={saveError}
              unsaved={unsaved}
              storage={storage}
              onSave={handleSave}
              onReset={handleReset}
            />
          </div>
        </div>
      </div>
    </section>
  );
}