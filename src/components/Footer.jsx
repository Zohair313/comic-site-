import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <section id="footer" style={{ backgroundColor: '#4A3B32', color: '#b9bec7', padding: '70px 0 30px' }}>
      <div className="container">
        <div className="row g-4">
          {/* Column 1: Branding & socials */}
          <div className="col-lg-3 col-md-6">
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '18px' }}>
              <span style={{ color: '#fff', fontWeight: '900', fontSize: '1.35rem', letterSpacing: '0.5px' }}>
                <i className="fa-solid fa-bolt me-1" style={{ color: '#ED3833' }}></i>Greyfire Studio<span style={{ color: '#ED3833' }}>.</span>
              </span>
            </Link>
            <p style={{ fontSize: '0.85rem', lineHeight: '1.7', marginBottom: '20px' }}>
              100% hand-drawn comics by a solo creator. Stories that inspire, artwork that moves.
            </p>
            <div className="d-flex gap-3">
              <a href="https://instagram.com/wessley_stangle" target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ color: '#e8e4db', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ED3833'} onMouseLeave={(e) => e.currentTarget.style.color = '#e8e4db'}>
                <i className="fa-brands fa-instagram" style={{ fontSize: '1.1rem' }}></i>
              </a>
              <a href="mailto:Wolf.357.lord@gmail.com" aria-label="Email" style={{ color: '#e8e4db', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ED3833'} onMouseLeave={(e) => e.currentTarget.style.color = '#e8e4db'}>
                <i className="fa-solid fa-envelope" style={{ fontSize: '1.1rem' }}></i>
              </a>
            </div>
          </div>

          {/* Column 2: Store & Support */}
          <div className="col-lg-3 col-md-6">
            <h3 className="badge-font text-white text-xs font-extrabold tracking-widest uppercase mb-5" style={{ fontSize: '0.9rem' }}>Store &amp; Support</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link to="/shop" style={{ color: '#b9bec7', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#b9bec7'}>Merch Shop</Link>
              <Link to="/support" style={{ color: '#b9bec7', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#b9bec7'}>Support Creator (Tip Jar)</Link>
              <Link to="/lore" style={{ color: '#b9bec7', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#b9bec7'}>Updates & Blog</Link>
            </div>
          </div>

          {/* Column 3: Legal */}
          <div className="col-lg-3 col-md-6">
            <h3 className="badge-font text-white text-xs font-extrabold tracking-widest uppercase mb-5" style={{ fontSize: '0.9rem' }}>Legal</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <a href="#" onClick={(e) => e.preventDefault()} style={{ color: '#b9bec7', textDecoration: 'none', fontSize: '0.9rem' }}>Privacy Policy</a>
              <a href="#" onClick={(e) => e.preventDefault()} style={{ color: '#b9bec7', textDecoration: 'none', fontSize: '0.9rem' }}>Terms & Conditions</a>
            </div>
          </div>

          {/* Column 4: Newsletter */}
          <div className="col-lg-3 col-md-6">
            <h3 className="badge-font text-white text-xs font-extrabold tracking-widest uppercase mb-5" style={{ fontSize: '0.9rem' }}>Stay Updated</h3>
            <p style={{ fontSize: '0.85rem', lineHeight: '1.7', marginBottom: '16px' }}>
              Get the latest updates on new pages, behind-the-scenes content, and merch drops.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); alert('Subscribed!'); }}>
              <input
                type="email"
                className="form-control mb-2"
                placeholder="Your Email"
                required
                style={{
                  backgroundColor: '#3a3f47', color: '#fff', border: '1px solid #4a4f57',
                  fontSize: '0.9rem', padding: '10px 14px', borderRadius: '6px'
                }}
              />
              <button
                type="submit"
                className="btn w-100"
                style={{
                  backgroundColor: '#ED3833', color: '#fff', fontWeight: '800', fontSize: '0.85rem',
                  letterSpacing: '1px', textTransform: 'uppercase', padding: '10px', borderRadius: '6px',
                  border: 'none', transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c92825'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ED3833'}
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Copyright */}
        <hr style={{ borderColor: '#4a4f57', margin: '44px 0 22px' }} />
        <div className="row align-items-center">
          <div className="col-md-6 text-center text-md-start">
            <p className="mb-0" style={{ fontSize: '0.8rem', color: '#8a9099' }}>
              &copy; {new Date().getFullYear()} Greyfire Studio. All Rights Reserved.
            </p>
          </div>
          <div className="col-md-6 text-center text-md-end mt-3 mt-md-0">
            <p className="mb-0" style={{ fontSize: '0.8rem', color: '#8a9099' }}>
              Made with <i className="fa-solid fa-heart" style={{ color: '#ED3833' }}></i> by Wessley
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}