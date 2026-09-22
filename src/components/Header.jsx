import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuBtnRef = useRef(null);
  const closeBtnRef = useRef(null);
  const getNavClass = (path) => "nav-link" + (location.pathname === path ? " active" : "");

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
      <nav className="navbar navbar-expand-lg sticky-top" style={{ backgroundColor: '#f5f2eb', padding: '14px 0', borderBottom: '1px solid #e8e4db' }}>
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center gap-2" to="/" style={{ fontWeight: '900', fontSize: 'clamp(1.1rem, 4.5vw, 24px)', letterSpacing: '-0.5px', color: '#111' }}>
            <i className="fa-solid fa-bolt" style={{ color: '#ED3833' }}></i>
            Greyfire Studio<span style={{ color: '#ED3833', fontSize: 'clamp(1.4rem, 5vw, 28px)', lineHeight: '0.6', marginLeft: '1px' }}>.</span>
          </Link>

          <button
            type="button"
            ref={menuBtnRef}
            className="mobile-nav border-0 px-0 bg-transparent"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <i className="fa-solid fa-bars" style={{ fontSize: '26px', color: '#111' }}></i>
          </button>

          <div className="desktop-nav">
            <ul className="navbar-nav mb-2 mt-0 mb-lg-0 me-4 align-items-center" style={{ gap: '22px', fontWeight: '700', fontSize: '13px', letterSpacing: '1px' }}>
              {links.map((link, idx) => (
                <li className="nav-item" key={idx}>
                  <Link className={getNavClass(link.to)} to={link.to} style={{ color: '#6b7280', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ED3833'} onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              to="/reader"
              className="btn text-white rounded-pill px-4 py-2"
              style={{ backgroundColor: '#ED3833', fontWeight: '800', fontSize: '13px', letterSpacing: '1.5px', textTransform: 'uppercase', border: 'none', transition: 'all 0.2s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#c92825'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ED3833'; e.currentTarget.style.transform = 'none'; }}
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
              <i className="fa-solid fa-bolt mr-1.5" style={{ color: '#ED3833' }}></i>Greyfire Studio<span style={{ color: '#ED3833' }}>.</span>
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