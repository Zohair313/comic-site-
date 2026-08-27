import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();
  const getNavClass = (path) => "nav-link" + (location.pathname === path ? " active" : "");

  return (
    <>
      <nav className="navbar navbar-expand-lg sticky-top" style={{ backgroundColor: '#f4f0e6', padding: '15px 0' }}>
        <div className="container">
          <Link className="navbar-brand d-flex align-items-end" to="/" style={{ fontWeight: '900', fontSize: 'clamp(1.2rem, 5vw, 28px)', letterSpacing: '-1px', color: '#111' }}>
            Greyfire Studio<span style={{ color: '#d71515', fontSize: 'clamp(1.5rem, 6vw, 32px)', lineHeight: '0.6', marginLeft: '2px' }}>.</span>
          </Link>
          
          <button className="mobile-nav border-0 px-0 bg-transparent" type="button" onClick={() => {
            if (window.bootstrap) {
              const offcanvasEl = document.getElementById('offcanvasRight');
              const offcanvas = window.bootstrap.Offcanvas.getInstance(offcanvasEl) || new window.bootstrap.Offcanvas(offcanvasEl);
              offcanvas.toggle();
            }
          }}>
            <i className="fa-solid fa-bars" style={{ fontSize: '28px', color: '#111' }}></i>
          </button>

          <div className="desktop-nav">
            <ul className="navbar-nav mb-2 mt-0 mb-lg-0 me-4 align-items-center" style={{ gap: '20px', fontWeight: '600', fontSize: '14px' }}>
              <li className="nav-item">
                <Link className={getNavClass("/")} to="/" style={{ color: '#777' }}>HOME</Link>
              </li>
              <li className="nav-item">
                <Link className={getNavClass("/bio")} to="/bio" style={{ color: '#777' }}>ABOUT</Link>
              </li>
              <li className="nav-item">
                <Link className={getNavClass("/reader")} to="/reader" style={{ color: '#777' }}>COMICS</Link>
              </li>
              <li className="nav-item">
                <Link className={getNavClass("/lore")} to="/lore" style={{ color: '#777' }}>BLOG</Link>
              </li>
              <li className="nav-item">
                <Link className={getNavClass("/support")} to="/support" style={{ color: '#777' }}>CONTACT</Link>
              </li>
            </ul>
            <div className="d-flex align-items-center gap-4 ms-2">
              <div className="d-flex align-items-center gap-3">
                <a className="text-secondary" href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: '18px', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#111'} onMouseLeave={(e) => e.currentTarget.style.color = '#6c757d'}>
                  <i className="fa-solid fa-bookmark"></i>
                </a>
                <a className="text-secondary position-relative" href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: '18px', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#111'} onMouseLeave={(e) => e.currentTarget.style.color = '#6c757d'}>
                  <i className="fa-solid fa-cart-shopping"></i>
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-danger border border-white" style={{ fontSize: '9px', padding: '3px 5px', transform: 'translate(-40%, -40%)' }}>2</span>
                </a>
              </div>
              <Link to="/reader" className="btn text-white rounded-pill px-4 py-2" style={{ backgroundColor: '#111', fontWeight: 'bold', fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase', boxShadow: '0 4px 14px 0 rgba(0,0,0,0.15)', transition: 'all 0.2s ease', border: 'none' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(0,0,0,0.2)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(0,0,0,0.15)'; }}>
                Free Comics
              </Link>
            </div>
            {/* The hamburger icon on desktop from the screenshot */}
            <div className="ms-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', cursor: 'pointer' }} data-bs-toggle="offcanvas" data-bs-target="#offcanvasRight">
              <i className="fa-solid fa-bars" style={{ fontSize: '24px', color: '#555' }}></i>
            </div>
          </div>
        </div>
      </nav>

      {/* Offcanvas Menu for Mobile */}
      <div className="offcanvas offcanvas-end" tabIndex="-1" id="offcanvasRight" aria-labelledby="offcanvasRightLabel">
        <div className="offcanvas-header">
          <h5 id="offcanvasRightLabel">Menu</h5>
          <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div className="offcanvas-body d-flex flex-column">
          {/* Mobile Quick Actions */}
          <div className="d-flex align-items-center justify-content-between mb-4 pb-4 border-bottom border-secondary-subtle">
            <div className="d-flex align-items-center gap-4">
              <a className="text-secondary position-relative" href="#" onClick={(e) => { e.preventDefault(); document.querySelector('.btn-close').click(); }} style={{ fontSize: '20px' }}>
                <i className="fa-solid fa-cart-shopping"></i>
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-danger border border-white" style={{ fontSize: '10px', padding: '4px 6px', transform: 'translate(-40%, -40%)' }}>2</span>
              </a>
              <a className="text-secondary" href="#" onClick={(e) => { e.preventDefault(); document.querySelector('.btn-close').click(); }} style={{ fontSize: '20px' }}>
                <i className="fa-solid fa-bookmark"></i>
              </a>
            </div>
            <Link to="/reader" onClick={() => document.querySelector('.btn-close').click()} className="btn text-white rounded-pill px-4 py-2" style={{ backgroundColor: '#111', fontWeight: 'bold', fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Free Comics
            </Link>
          </div>
          
          <ul className="navbar-nav">
            <li className="nav-item"><Link className={getNavClass("/")} to="/" onClick={() => document.querySelector('.btn-close').click()}>Home</Link></li>
            <li className="nav-item"><Link className={getNavClass("/bio")} to="/bio" onClick={() => document.querySelector('.btn-close').click()}>About</Link></li>
            <li className="nav-item"><Link className={getNavClass("/reader")} to="/reader" onClick={() => document.querySelector('.btn-close').click()}>Comics</Link></li>
            <li className="nav-item"><Link className={getNavClass("/lore")} to="/lore" onClick={() => document.querySelector('.btn-close').click()}>Blog</Link></li>
            <li className="nav-item"><Link className={getNavClass("/support")} to="/support" onClick={() => document.querySelector('.btn-close').click()}>Contact</Link></li>
          </ul>
          <div className="offcanvas-contact mt-4">
            <h3>Contact Info</h3>
            <p><i className="fa-solid fa-phone"></i> +1 856 789 000</p>
            <p><i className="fa-solid fa-envelope"></i> info@comixo.com</p>
            <p><i className="fa-solid fa-location-dot"></i> New York, USA</p>
          </div>
          <div className="offcanvas-social mt-4">
            <a href="#"><i className="fa-brands fa-facebook-f"></i></a>
            <a href="#"><i className="fa-brands fa-instagram"></i></a>
            <a href="#"><i className="fa-brands fa-twitter"></i></a>
            <a href="#"><i className="fa-brands fa-youtube"></i></a>
          </div>
        </div>
      </div>


    </>
  );
}
