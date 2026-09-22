import React, { useState } from 'react';
import { Link } from 'react-router-dom';

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
    'images/Comic story pages.jpg',
    'images/Comic story pages1.jpg',
    'images/Comic story pages2.jpg',
    'images/Comic story pages3.jpg',
    'images/Comic story pages4.jpg',
    'images/Comic story pages5.jpg',
    'images/Comic story pages6.jpg',
    'images/Comic story pages7.jpg',
    'images/Comic story pages8.jpg',
    'images/Comic story pages9.jpg',
    'images/Comic story pages10.jpg'
  ];

  return (
    <div className="min-h-screen font-sans pb-16">
      <section id="new-comics" className="pt-20">
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
          {/* Control Bar: Chapter Directory + View Mode */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 my-6 max-w-[1400px] mx-auto px-1 sm:px-6">

            {/* Left — Chapter Directory */}
            <div className="flex flex-col gap-1.5 w-full sm:w-auto">
              <label htmlFor="chapter-select" className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Chapter Directory
              </label>
              <div className="relative w-full sm:w-80">
                <select
                  id="chapter-select"
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(Number(e.target.value))}
                  className="w-full appearance-none border border-zinc-300 bg-white rounded-lg shadow-sm pl-4 pr-10 py-2.5 text-sm font-medium text-zinc-800 outline-none transition focus:border-[#ED3833] focus:ring-2 focus:ring-[#ED3833]/20 hover:border-zinc-400 cursor-pointer"
                >
                  {chapters.map(ch => (
                    <option key={ch.id} value={ch.id}>{ch.title} ({ch.pages} pages)</option>
                  ))}
                </select>
                <i className="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs"></i>
              </div>
            </div>

            {/* Right — View Mode segmented pills */}
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 whitespace-nowrap">View Mode:</span>
              <div
                className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-white p-1 shadow-sm"
                role="group"
                aria-label="Reading view mode"
              >
                <button
                  type="button"
                  onClick={() => setViewMode('vertical')}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                    viewMode === 'vertical'
                      ? 'bg-[#ED3833] text-white shadow'
                      : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
                  }`}
                >
                  <i className="fa-solid fa-arrows-left-right"></i> Vertical
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('book')}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                    viewMode === 'book'
                      ? 'bg-[#ED3833] text-white shadow'
                      : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
                  }`}
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
    </div>
  );
}
