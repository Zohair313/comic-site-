import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import NewComicsSection from '../components/NewComicsSection';

export default function Reader() {
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [viewMode, setViewMode] = useState('book');

  const chapters = [
    { id: 1, title: 'Chapter 1: The Awakening', pages: 3 },
    { id: 2, title: 'Chapter 2: Flames of the Past', pages: 4 },
    { id: 3, title: 'Chapter 3: Journey Begins', pages: 3 },
    { id: 4, title: 'Chapter 4: Dark Alliance', pages: 5 },
    { id: 5, title: 'Chapter 5: The Final Stand', pages: 4 },
  ];

  // Dummy pages for a chapter
  const pages = [
    '/images/Comic story pages.jpg',
    '/images/Comic story pages1.jpg',
    '/images/Comic story pages2.jpg',
    '/images/Comic story pages3.jpg',
    '/images/Comic story pages4.jpg',
    '/images/Comic story pages5.jpg',
    '/images/Comic story pages6.jpg',
    '/images/Comic story pages7.jpg',
    '/images/Comic story pages8.jpg',
    '/images/Comic story pages9.jpg',
    '/images/Comic story pages10.jpg'
  ];

  return (
    <div className="min-h-screen font-sans pb-16">
      <section id="new-comics" className="pt-5">
        <div className="container">
          <div className="row">
            <div className="section-title t-white">
              <div className="row">
                <div className="col-lg-6 m-auto text-center">
                  <span>Comic Reader</span>
                  <h3>Read Comics Online.</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-5">
        <div className="container">
          <div className="row mb-4 align-items-center">
            <div className="col-md-6">
              <h3 style={{ color: '#333', fontSize: '1.3rem', fontWeight: 'bold' }}>Chapter Directory</h3>
              <select
                className="form-select mt-2"
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(Number(e.target.value))}
                style={{ border: '1px solid #d1d5db', maxWidth: '400px' }}
              >
                {chapters.map(ch => (
                  <option key={ch.id} value={ch.id}>{ch.title} ({ch.pages} pages)</option>
                ))}
              </select>
            </div>
            <div className="col-md-6 text-md-end mt-3 mt-md-0">
              <span className="d-none d-sm-inline" style={{ color: '#a1a1aa', marginRight: '12px', fontWeight: 'bold' }}>View Mode:</span>
              <div className="btn-group w-100 w-sm-auto" role="group">
                <button
                  type="button"
                  className={`btn ${viewMode === 'vertical' ? 'button-primary' : 'button-secondary'}`}
                  onClick={() => setViewMode('vertical')}
                >
                  <i className="fa-solid fa-arrows-left-right"></i> Vertical
                </button>
                <button
                  type="button"
                  className={`btn ${viewMode === 'book' ? 'button-primary' : 'button-secondary'}`}
                  onClick={() => setViewMode('book')}
                >
                  <i className="fa-solid fa-book-open"></i> Side-by-Side
                </button>
              </div>
            </div>
          </div>

          <div
            className={`reader-container ${viewMode === 'book' ? 'grid grid-cols-1 md:grid-cols-2 gap-5' : ''}`}
            style={{ 
              maxWidth: viewMode === 'vertical' ? '800px' : '1400px', 
              margin: '0 auto',
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {pages.map((imgSrc, idx) => (
              <div
                key={idx}
                className={viewMode === 'vertical' ? "mb-3" : ""}
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid #e5e7eb',
                }}
              >
                <img 
                  src={imgSrc} 
                  alt={`Comic Page ${idx + 1}`} 
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    userDrag: 'none',
                    WebkitUserDrag: 'none',
                    userSelect: 'none',
                    pointerEvents: 'none'
                  }}
                />
              </div>
            ))}
          </div>

          <div className="row mt-5">
            <div className="col-lg-6">
              <Link to="/comics" className="button-secondary">
                <i className="fa-solid fa-arrow-left me-2"></i>Back to Comics
              </Link>
            </div>
            <div className="col-lg-6 text-end">
              <Link to="/support" className="button-primary">
                Support the Creator<i className="fa-solid fa-arrow-right ms-2"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <NewComicsSection />
    </div>
  );
}
