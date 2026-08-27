import React from 'react';
import { Link } from 'react-router-dom';
export default function Shop() {
  const products = [
    { name: 'Shadow Fighter II', type: 'Printed Comic', price: '$19.99', badge: 'Best Seller' },
    { name: 'Super Hero V', type: 'Printed Comic', price: '$14.99', badge: '' },
    { name: 'Power Ranger X', type: 'Digital Download', price: '$9.99', badge: 'New' },
    { name: 'Dr. Stranger', type: 'Digital Download', price: '$9.99', badge: '' },
  ];

  const merch = [
    { name: 'Greyfire Studio Tee', type: 'Apparel', price: '$25.00' },
    { name: 'Character Art Print', type: 'Art Print', price: '$15.00' },
    { name: 'Concept Artbook', type: 'Book', price: '$29.99' },
    { name: 'Sticker Pack', type: 'Accessories', price: '$7.99' },
  ];

  return (
    <>
      <section id="new-comics" className="pt-5">
        <div className="container">
          <div className="row">
            <div className="section-title t-white">
              <div className="row">
                <div className="col-lg-6 m-auto text-center">
                  <span>Merch Shop</span>
                  <h3>Physical Merch & Digital Downloads.</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="row comic-item-pos pt-4">
            {products.map((item, idx) => (
              <div className="col-lg-3 col-md-6 mb-4" key={idx}>
                <div className={`comic-item ${idx === 0 ? 'active' : ''}`}>
                  <div
                    style={{
                      background: `linear-gradient(135deg, ${idx % 2 === 0 ? '#f3f4f6' : '#e5e7eb'} 0%, ${idx % 2 === 0 ? '#ff8a8a' : '#9ca3af'} 100%)`,
                      aspectRatio: '1/1.3',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                    }}
                  >
                    <i className="fa-solid fa-book" style={{ fontSize: '3rem', color: '#fff', opacity: 0.6 }}></i>
                  </div>
                  {item.badge && (
                    <span style={{
                      position: 'absolute', top: '10px', right: '10px',
                      background: '#d71515', color: '#fff', padding: '4px 12px',
                      borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                    }}>{item.badge}</span>
                  )}
                  <div className="comic-item-details">
                    <div className="row">
                      <div className="col-8">
                        <h3>{item.name}</h3>
                        <p><i className="fa-solid fa-tag"></i> {item.type}</p>
                      </div>
                      <div className="col-4 text-end">
                        <span style={{ color: '#d71515', fontWeight: 'bold', fontSize: '1.1rem' }}>{item.price}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="price-plan" className="pt-2">
        <div className="container">
          <div className="row">
            <div className="section-title">
              <div className="col-lg-6">
                <span>Merchandise</span>
                <h3>Greyfire Studio Merch.</h3>
              </div>
            </div>
          </div>
          <div className="row pt-55">
            {merch.map((item, idx) => (
              <div className="col-lg-3 col-md-6 mb-4" key={idx}>
                <div className={`price-item text-center ${idx === 1 ? 'active' : ''}`}>
                  {idx === 1 && (
                    <div className="mobile-v-bg">
                      <span>Popular</span>
                      <p>{item.type}</p>
                    </div>
                  )}
                  {idx !== 1 && (
                    <>
                      <span>{item.type}</span>
                      <p>Greyfire Studio</p>
                    </>
                  )}
                  <div style={{
                    background: `linear-gradient(135deg, #f3f4f6 0%, #ff8a8a 100%)`,
                    width: '100px', height: '100px', borderRadius: '50%',
                    margin: '20px auto',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="fa-solid fa-star" style={{ color: '#fff', fontSize: '2rem' }}></i>
                  </div>
                  <h3>{item.price}</h3>
                  <p><i className="fa-solid fa-check"></i> {item.name}</p>
                  <p><i className="fa-solid fa-check"></i> High Quality</p>
                  <p><i className="fa-solid fa-check"></i> Worldwide Shipping</p>
                  <div className="price-btn mt-4">
                    <Link to="/support" className="button-secondary">Buy Now</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="row pt-3 price-footer">
            <div className="col-lg-6 col-sm-4">
              
            </div>
            <div className="col-lg-6 col-sm-8 text-end">
              <p><i className="fa-solid fa-lock"></i> All Payments Are Highly Secured.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
