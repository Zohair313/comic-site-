import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();
  const getNavClass = (path) => "nav-link" + (location.pathname === path ? " active" : "");

  const links = [
    { label: 'HOME', to: '/' },
    { label: 'ABOUT', to: '/bio' },
    { label: 'READ COMIC', to: '/reader' },
    { label: 'ART', to: '/art' },
    { label: 'CHARACTERS', to: '/lore' },
    { label: 'CONTACT', to: '/support' },
  ];

  const closeMobile = () => {
    if (document.querySelector('.offcanvas .btn-close')) {
      document.querySelector('.offcanvas .btn-close').click();
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg sticky-top" style={{ backgroundColor: '#f5f2eb', padding: '14px 0', borderBottom: '1px solid #e8e4db' }}>
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center gap-2" to="/" style={{ fontWeight: '900', fontSize: 'clamp(1.1rem, 4.5vw, 24px)', letterSpacing: '-0.5px', color: '#111' }}>
            <i className="fa-solid fa-bolt" style={{ color: '#ED3833' }}></i>
            Greyfire Studio<span style={{ color: '#ED3833', fontSize: 'clamp(1.4rem, 5vw, 28px)', lineHeight: '0.6', marginLeft: '1px' }}>.</span>
          </Link>

          <button className="mobile-nav border-0 px-0 bg-transparent" type="button" onClick={() => {
            if (window.bootstrap) {
              const offcanvasEl = document.getElementById('offcanvasRight');
              const offcanvas = window.bootstrap.Offcanvas.getInstance(offcanvasEl) || new window.bootstrap.Offcanvas(offcanvasEl);
              offcanvas.toggle();
            }
          }}>
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

      {/* Mobile Offcanvas Menu */}
      <div className="offcanvas offcanvas-end" tabIndex="-1" id="offcanvasRight" aria-labelledby="offcanvasRightLabel">
        <div className="offcanvas-header" style={{ borderBottom: '1px solid #eee' }}>
          <h5 id="offcanvasRightLabel">
            <i className="fa-solid fa-bolt me-2" style={{ color: '#ED3833' }}></i>
            Greyfire Studio
          </h5>
          <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div className="offcanvas-body d-flex flex-column">
          <ul className="navbar-nav" style={{ fontWeight: '700', letterSpacing: '1px' }}>
            {links.map((link, idx) => (
              <li className="nav-item" key={idx}>
                <Link className={getNavClass(link.to)} to={link.to} onClick={closeMobile}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Link
              to="/reader"
              onClick={closeMobile}
              className="btn text-white w-100 rounded-pill py-2"
              style={{ backgroundColor: '#ED3833', fontWeight: '800', fontSize: '13px', letterSpacing: '1.5px', textTransform: 'uppercase', border: 'none' }}
            >
              Start Reading
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}