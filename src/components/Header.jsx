import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSiteData } from '@/context/SiteDataContext';

export default function Header() {
  const { data } = useSiteData();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuBtnRef = useRef(null);
  const closeBtnRef = useRef(null);

  const links = [
    { label: 'HOME', to: '/' },
    { label: 'ABOUT', to: '/bio' },
    { label: 'READ COMIC', to: '/reader' },
    { label: 'ART', to: '/art' },
    { label: 'CHARACTERS', to: '/lore' },
    { label: 'CONTACT', to: '/support' },
  ];

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (open) {
      closeBtnRef.current?.focus();
    } else {
      const t = setTimeout(() => menuBtnRef.current?.focus(), 350);
      return () => clearTimeout(t);
    }
  }, [open]);

  const closeMenu = () => setOpen(false);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 w-full"
        style={{ backgroundColor: '#f5f2eb', padding: '14px 0', borderBottom: '1px solid #e8e4db', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', zIndex: 1030 }}
      >
        <div className="relative flex items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          {/* LEFT — brand pinned to far left */}
          <Link className="navbar-brand flex-none flex items-center gap-2" to="/" style={{ fontWeight: '900', fontSize: 'clamp(1.1rem, 4.5vw, 24px)', letterSpacing: '-0.5px', color: '#111' }}>
            <i className="fa-solid fa-bolt" style={{ color: '#ED3833' }}></i>
            {data.site.name}<span style={{ color: '#ED3833', fontSize: 'clamp(1.4rem, 5vw, 28px)', lineHeight: '0.6', marginLeft: '1px' }}>.</span>
          </Link>

          {/* CENTER — nav links absolute-centered (desktop only) */}
          <ul className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-6 m-0 p-0">
            {links.map((link, idx) => (
              <li className="list-none" key={idx}>
                <Link
                  className={`nav-link whitespace-nowrap text-[13px] tracking-wider uppercase transition-colors duration-200 ${
                    location.pathname === link.to ? 'text-[#ED3833]' : 'text-[#6b7280] hover:text-[#ED3833]'
                  }`}
                  to={link.to}
                  style={{ fontWeight: '800', padding: '6px 0' }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* RIGHT — mobile toggle + CTA pinned to far right */}
          <div className="flex-none flex items-center gap-3">
            <button
              type="button"
              ref={menuBtnRef}
              className="lg:hidden flex items-center justify-center border-0 bg-transparent px-1"
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <i className="fa-solid fa-bars" style={{ fontSize: '26px', color: '#111' }}></i>
            </button>

            <Link
              to="/reader"
              className="hidden lg:inline-flex items-center rounded-lg bg-[#ED3833] px-4 py-2 text-[13px] font-extrabold uppercase tracking-wider text-white shadow-sm transition-all duration-200 hover:bg-[#c92825] hover:-translate-y-0.5"
            >
              Start Reading
            </Link>
          </div>
        </div>
      </nav>

      {/* Custom mobile drawer (no Bootstrap dependency); inert blocks focus & tab when closed */}
      <div
        className={`fixed inset-0 z-[100] ${open ? '' : 'pointer-events-none'}`}
        aria-hidden={!open}
        inert={!open}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={closeMenu}
        ></div>

        {/* Slide-in panel */}
        <aside
          className={`absolute right-0 top-0 h-full w-72 max-w-[85vw] bg-[#F5F2EB] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e4db]">
            <span className="font-black" style={{ fontSize: '1.05rem', color: '#111' }}>
              <i className="fa-solid fa-bolt mr-1.5" style={{ color: '#ED3833' }}></i>{data.site.name}<span style={{ color: '#ED3833' }}>.</span>
            </span>
            <button
              type="button"
              ref={closeBtnRef}
              onClick={closeMenu}
              aria-label="Close menu"
              className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-600 hover:bg-[#ED3833] hover:text-white transition-colors"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          {/* Nav links */}
          <ul className="flex flex-col py-3 border-b border-[#e8e4db]" style={{ fontWeight: '800', letterSpacing: '1px' }}>
            {links.map((link, idx) => (
              <li key={idx} className="border-b border-[#e8e4db]/70 last:border-b-0">
                <Link
                  to={link.to}
                  onClick={closeMenu}
                  className={`flex items-center justify-between px-6 py-4 text-sm transition-colors hover:text-[#ED3833] ${location.pathname === link.to ? 'text-[#ED3833] bg-white' : 'text-zinc-700'}`}
                >
                  {link.label}
                  <i className="fa-solid fa-chevron-right text-xs opacity-40"></i>
                </Link>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="px-5 py-5 mt-auto">
            <Link
              to="/reader"
              onClick={closeMenu}
              className="btn text-white w-100 rounded-pill py-2"
              style={{ backgroundColor: '#ED3833', fontWeight: '800', fontSize: '13px', letterSpacing: '1.5px', textTransform: 'uppercase', border: 'none' }}
            >
              Start Reading
            </Link>
            <p className="mt-4 mb-0 text-center text-xs text-zinc-400" style={{ fontStyle: 'italic' }}>
              100% hand-drawn comics by one artist.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}