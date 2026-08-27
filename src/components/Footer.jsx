import { Link } from 'react-router-dom';
import footerLogo from '../data/footerLogo';


export default function Footer() {
  return (
    <>
      <section id="footer">
        <div className="container">
          <div className="row">
            <div className="col-lg-3 footer-logo">
              <Link to="/">Greyfire studio<span>.</span></Link>
              <div className="footer-social d-flex gap-3 mt-3 mb-4">
                <a href="#" onClick={(e) => e.preventDefault()}><i className="fa-brands fa-facebook-f"></i></a>
                <a href="#" onClick={(e) => e.preventDefault()}><i className="fa-brands fa-instagram"></i></a>
                <a href="#" onClick={(e) => e.preventDefault()}><i className="fa-brands fa-twitter"></i></a>
                <a href="#" onClick={(e) => e.preventDefault()}><i className="fa-brands fa-youtube"></i></a>
                <a href="#" onClick={(e) => e.preventDefault()}><i className="fa-brands fa-tiktok"></i></a>
              </div>
              <div className="copyright-txt" style={{ textAlign: 'left', color: '#a1a1aa', fontSize: '0.9rem' }}>
                <p className="mb-0">© {new Date().getFullYear()} Greyfire Studio. All Rights Reserved.</p>
              </div>
            </div>
            <div className="col-lg-2 col-md-4 footer-menu">
              <h3>Quick Link</h3>
              <Link to="/">Home Page</Link>
              <a href="/#about">About</a>
              <Link to="/support">Contact Us</Link>
            </div>
            <div className="col-lg-2 col-md-4 footer-menu">
              <h3>Community</h3>
              <a href="#" onClick={(e) => e.preventDefault()}>Career Page</a>
              <a href="#" onClick={(e) => e.preventDefault()}>FAQ</a>
              <a href="#" onClick={(e) => e.preventDefault()}>Supports</a>
              <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
              <a href="#" onClick={(e) => e.preventDefault()}>Affiliate Marketing</a>
              <a href="#" onClick={(e) => e.preventDefault()}>Partnership</a>
              <a href="#" onClick={(e) => e.preventDefault()}>Terms &amp; Condition</a>
            </div>
            <div className="col-lg-2 col-md-4 footer-menu">
              <h3>Action Link</h3>
              <Link to="/support">Contact Us</Link>
              <a href="#" onClick={(e) => e.preventDefault()}>Payments</a>
              <Link to="/reader">Comic Reader</Link>
              <Link to="/shop">Merch Shop</Link>
            </div>
            <div className="col-lg-3 footer-action">
              <h3>Get The App</h3>
              <div className="mt-3">
                <form onSubmit={(e) => { e.preventDefault(); alert('Subscribed!'); }}>
                  <input type="email" className="form-control mb-2" placeholder="Your Email" required style={{ backgroundColor: 'transparent', color: '#fff', border: '1px solid #52525b' }} />
                  <button type="submit" className="button-primary px-4 py-2 mt-1" style={{ width: 'auto', fontSize: '0.9rem' }}>Subscribe</button>
                </form>
              </div>
              <div className="mt-4 pt-2">
                <img src={footerLogo} alt="comixo-logo" style={{ maxWidth: '150px' }} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
