import { Link } from 'react-router-dom';
import { useSiteData } from '@/context/SiteDataContext';

export default function Footer() {
  const { data } = useSiteData();
  const footer = data.footer;

  return (
    <section id="footer" style={{ backgroundColor: '#4A3B32', color: '#b9bec7', borderTop: '4px solid #ED3833', borderBottom: '1px solid rgba(255,255,255,0.12)', padding: 'clamp(52px, 7vw, 70px) 0 26px' }}>
      <div className="container">
        <div className="row g-4">
          {/* Column 1: Branding & socials */}
          <div className="col-lg-3 col-md-6">
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '18px' }}>
              <span style={{ color: '#fff', fontWeight: '900', fontSize: 'var(--gf-fs-lg)', letterSpacing: '0.5px' }}>
                <i className="fa-solid fa-bolt me-1" style={{ color: '#ED3833' }}></i>{data.site.name}<span style={{ color: '#ED3833' }}>.</span>
              </span>
            </Link>
            <p style={{ fontSize: 'var(--gf-fs-sm)', lineHeight: '1.7', marginBottom: '20px' }}>
              {footer.about}
            </p>
            <div className="d-flex gap-3">
              <a href={footer.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ color: '#e8e4db', transition: 'color 0.2s', display: 'inline-flex', width: '44px', height: '44px', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ED3833'} onMouseLeave={(e) => e.currentTarget.style.color = '#e8e4db'}>
                <i className="fa-brands fa-instagram" style={{ fontSize: '1.4rem' }}></i>
              </a>
              <a href={`mailto:${footer.email}`} aria-label="Email" style={{ color: '#e8e4db', transition: 'color 0.2s', display: 'inline-flex', width: '44px', height: '44px', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ED3833'} onMouseLeave={(e) => e.currentTarget.style.color = '#e8e4db'}>
                <i className="fa-solid fa-envelope" style={{ fontSize: '1.4rem' }}></i>
              </a>
            </div>
          </div>

          {/* Column 2: Store & Support */}
          <div className="col-lg-3 col-md-6">
            <h3 className="badge-font text-white text-xs font-extrabold tracking-widest uppercase mb-5" style={{ fontSize: 'var(--gf-fs-sm)' }}>Store &amp; Support</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link to="/support" style={{ color: '#b9bec7', textDecoration: 'none', fontSize: 'var(--gf-fs-sm)', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#b9bec7'}>Support Creator (Tip Jar)</Link>
              <Link to="/lore" style={{ color: '#b9bec7', textDecoration: 'none', fontSize: 'var(--gf-fs-sm)', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#b9bec7'}>Updates & Blog</Link>
            </div>
          </div>

          {/* Column 3: Legal */}
          <div className="col-lg-3 col-md-6">
            <h3 className="badge-font text-white text-xs font-extrabold tracking-widest uppercase mb-5" style={{ fontSize: 'var(--gf-fs-sm)' }}>Legal</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link to="/privacy-policy" style={{ color: '#b9bec7', textDecoration: 'none', fontSize: 'var(--gf-fs-sm)', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#b9bec7'}>Privacy Policy</Link>
              <Link to="/terms" style={{ color: '#b9bec7', textDecoration: 'none', fontSize: 'var(--gf-fs-sm)', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#b9bec7'}>Terms & Conditions</Link>
            </div>
          </div>

          {/* Column 4: Newsletter */}
          <div className="col-lg-3 col-md-6">
            <h3 className="badge-font text-white text-xs font-extrabold tracking-widest uppercase mb-5" style={{ fontSize: 'var(--gf-fs-sm)' }}>Stay Updated</h3>
            <p style={{ fontSize: 'var(--gf-fs-sm)', lineHeight: '1.7', marginBottom: '8px' }}>
              Get the latest updates on new pages, behind-the-scenes content, and merch drops.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); alert('Subscribed!'); }}>
              <input
                type="email"
                className="form-control mb-2"
                placeholder="Your Email"
                required
                style={{
                  backgroundColor: '#454b54', color: '#fff', border: '1px solid #7b828c',
                  fontSize: 'var(--gf-fs-sm)', padding: '10px 14px', borderRadius: 'var(--gf-radius-sm)',
                  width: '100%'
                }}
              />
              <button
                type="submit"
                className="btn w-100"
                style={{
                  backgroundColor: '#ED3833', color: '#fff', fontWeight: '800', fontSize: 'var(--gf-fs-sm)',
                  letterSpacing: '1px', textTransform: 'uppercase', padding: '10px', borderRadius: 'var(--gf-radius-sm)',
                  border: 'none', transition: 'background-color 0.2s', whiteSpace: 'nowrap'
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
        <hr style={{ borderColor: '#4a4f57', margin: 'clamp(28px, 6vw, 44px) 0 22px' }} />
        <div className="row align-items-center">
          <div className="col-md-6 text-center text-md-start">
            <p className="mb-0" style={{ fontSize: 'var(--gf-fs-caption)', color: '#8a9099' }}>
              &copy; {new Date().getFullYear()} {data.site.name}. All Rights Reserved.
            </p>
          </div>
          <div className="col-md-6 text-center text-md-end mt-3 mt-md-0">
            <p className="mb-0" style={{ fontSize: 'var(--gf-fs-caption)', color: '#8a9099' }}>
              Made with <i className="fa-solid fa-heart" style={{ color: '#ED3833' }}></i> by {footer.creditedBy}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}