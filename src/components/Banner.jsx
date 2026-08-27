import React from 'react';
import { Link } from 'react-router-dom';

export default function Banner() {
  return (
    <section id="banner" style={{ 
      background: "url('/images/background full page.jpg') center/cover no-repeat", 
      position: 'relative' 
    }}>
      {/* Overlay to ensure text readability against the background */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.4)', zIndex: 0 }}></div>
      
      <div className="container zindex" style={{ position: 'relative', zIndex: 1, padding: '50px 0' }}>
        <div className="row align-items-center">
          <div className="col-lg-6 banner-txt">
            <span style={{ fontSize: '1.4rem', color: '#333', fontWeight: 'bold' }}>The Ultimate</span>
            <h3 className="text-6xl md:text-[4.5rem]" style={{ fontWeight: '900', color: '#000', margin: 0, lineHeight: '1' }}>Comic</h3>
            <h3 className="text-6xl md:text-[4.5rem]" style={{ fontWeight: '900', color: '#000', margin: 0, marginBottom: '20px', lineHeight: '1' }}>Book.</h3>
            
            <div className="d-flex align-items-center">
              <Link to="/reader" className="button-primary px-4 py-2" style={{ textDecoration: 'none', fontWeight: 'bold', borderRadius: '30px', backgroundColor: '#e50914', color: '#fff' }}>Read Now</Link>
              <a className="venobox button-circular vbox-item ms-3" data-autoplay="true" data-vbtype="video" href="https://www.youtube.com/watch?v=kmh1cr3b4Js" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', color: '#333', textDecoration: 'none' }}>
                <i className="fa-solid fa-play"></i>
              </a>
            </div>

            <div className="row banner-review mt-5 align-items-center">

              <div 
                className="col-lg-12 d-flex align-items-center mt-3 mt-lg-0" 
                style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div className="avatar-group d-flex me-3">
                  <img src="https://i.pravatar.cc/100?img=32" alt="user" style={{ width: '45px', height: '45px', borderRadius: '50%', border: '3px solid #fff', zIndex: 3, position: 'relative', objectFit: 'cover', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }} />
                  <img src="https://i.pravatar.cc/100?img=47" alt="user" style={{ width: '45px', height: '45px', borderRadius: '50%', border: '3px solid #fff', zIndex: 2, position: 'relative', marginLeft: '-15px', objectFit: 'cover', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }} />
                  <img src="https://i.pravatar.cc/100?img=12" alt="user" style={{ width: '45px', height: '45px', borderRadius: '50%', border: '3px solid #fff', zIndex: 1, position: 'relative', marginLeft: '-15px', objectFit: 'cover', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }} />
                </div>
                <div>
                  <div className="stars" style={{ color: '#fbbf24', fontSize: '1.2rem', marginBottom: '2px' }}>
                    <i className="fa-solid fa-star"></i>
                    <i className="fa-solid fa-star"></i>
                    <i className="fa-solid fa-star"></i>
                    <i className="fa-solid fa-star"></i>
                    <i className="fa-solid fa-star-half-stroke"></i>
                  </div>
                  <p style={{ color: '#333', margin: 0, fontWeight: '800', fontSize: '0.95rem' }}>(409.6K Reviews)</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-10 col-sm-11 col-md-7 col-lg-6 banner-images mt-5 mt-lg-0 text-center">
            <img 
              src="/images/hero-comic-cover.jpg" 
              alt="Comic Story" 
              style={{ 
                maxWidth: '100%',
                maxHeight: '70vh', 
                width: 'auto',
                borderRadius: '10px', 
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)', 
                transform: 'rotate(-3deg) scale(1.02)', 
                transition: 'transform 0.3s ease' 
              }} 
            />
          </div>
        </div>
      </div>
    </section>
  );
}
