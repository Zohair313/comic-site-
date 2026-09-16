import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import EmbersParticles from './EmbersParticles';
import Marquee from './Marquee';

const books = [
  {
    name: 'Blue Sky 1',
    img: 'images/hero-comic-cover.jpg',
    pills: ['Debut Issue', 'Over 100 Pages'],
    snippet: 'The saga begins. A 100% hand-drawn debut — high-octane action, vibrant ink, and real lessons in every panel, made from scratch by one artist.',
    tag: 'Skyhawk #1',
  },
  {
    name: 'Blue Sky 2',
    img: 'images/comic cover img.jpg',
    pills: ['Next Chapter', 'In the Works'],
    snippet: 'The story deepens. New faces and bigger stakes — pages are being inked and lettered by hand right now.',
    tag: 'Coming Soon',
  },
  {
    name: 'Skyhawk — Origins',
    img: 'images/custom/char_kaelen_1787177600102.jpg',
    pills: ['New Arc', 'Hand-Drawn'],
    snippet: 'Where the hero comes from. An origins arc sketched, inked, and lettered panel by panel.',
    tag: 'Origins',
  },
  {
    name: 'The Art Book',
    img: 'images/custom/char_lyra_1787177611766.jpg',
    pills: ['50 Pages', 'Sketches'],
    snippet: 'A behind-the-scenes companion — thumbnails, character turnarounds, and world-building notes from the studio.',
    tag: 'Art Book',
  },
  {
    name: 'Cards & Lore',
    img: 'images/custom/char_draken_1787177625172.jpg',
    pills: ['Collectible', 'Lore Guide'],
    snippet: 'Physical cards with stats and lore — the perfect companion to the printed saga.',
    tag: 'Card Pack',
  },
];

export default function Banner() {
  const [active, setActive] = useState(0);
  const total = books.length;

  const goTo = useCallback((idx) => setActive(((idx % total) + total) % total), [total]);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % total), 5000);
    return () => clearInterval(id);
  }, [total]);

  const book = books[active];

  return (
    <section id="banner" className="relative isolate bg-[#F5F2EB] overflow-hidden h-svh">
      {/* Battlefield ash — dark embers drifting down behind the slider content */}
      <EmbersParticles className="absolute inset-0 z-0 w-full h-full pointer-events-none" />

      {/* Red marquee pinned to the bottom of the hero */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <Marquee />
      </div>

      {/* Uniform section container */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-10 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12">

          {/* Left column — rotating book info */}
          <div>
            <p className="badge-font text-[#ED3833] text-sm font-extrabold tracking-[0.25em] uppercase mb-5">
              Greyfire Studio Presents
            </p>

            <div key={active} className="hero-fade">
              <div className="min-h-[7.5rem] md:min-h-[10rem] flex flex-col justify-end">
                <h1 className="display-font font-black text-[#4A3B32] text-6xl md:text-8xl xl:text-9xl leading-none mb-5">
                  {book.name}
                </h1>
              </div>

              {/* Basil pill badges */}
              <div className="flex flex-wrap gap-2.5 mb-4">
                {book.pills.map((pill, idx) => (
                  <span key={idx} className="badge-font bg-[#879F84] text-white text-sm font-extrabold tracking-widest uppercase px-5 py-2.5 rounded-full">
                    {pill}
                  </span>
                ))}
              </div>

              <p className="text-[#4A3B32] text-lg md:text-xl leading-relaxed max-w-[480px] mb-6">
                {book.snippet}
              </p>
            </div>

            {/* Slide counter + dots */}
            <div className="flex items-center gap-4 mb-6">
              <span className="badge-font text-[#4A3B32] text-base tracking-widest">
                {String(active + 1).padStart(2, '0')}<span className="text-gray-400"> / {String(total).padStart(2, '0')}</span>
              </span>
              <div className="flex items-center gap-2">
                {books.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Go to slide ${idx + 1}`}
                    onClick={() => goTo(idx)}
                    className={idx === active
                      ? 'h-2.5 w-7 rounded-full bg-[#ED3833] transition-all'
                      : 'h-2.5 w-2.5 rounded-full bg-gray-300 hover:bg-[#ED3833] transition-all'}
                  ></button>
                ))}
              </div>
            </div>

            {/* Twin CTAs */}
            <div className="flex flex-wrap gap-3.5">
              <Link to="/reader" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#ED3833] text-white font-bold text-base hover:bg-[#c92825] transition-colors">
                <i className="fa-solid fa-book-open"></i>Read Now
              </Link>
              <Link to="/shop" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border-2 border-[#ED3833] text-[#ED3833] font-bold text-base hover:bg-[#ED3833] hover:text-white transition-colors">
                Get Art Book &amp; Cards
              </Link>
            </div>
          </div>

          {/* Right column — 3D angled cover, contained within section */}
          <div className="hidden lg:flex justify-center items-center" style={{ perspective: '1200px' }}>
            <div className="relative" style={{ maxWidth: '340px', maxHeight: '440px', overflow: 'hidden', borderRadius: '8px' }}>

              {/* 3D angled book — subtler rotation so it stays proportional to text */}
              <div className="relative inline-block" style={{ transform: 'rotateY(-8deg) rotateX(3deg) rotateZ(-2deg)', transformStyle: 'preserve-3d' }}>
                <div className="bg-[#4A3B32] rounded-md shadow-[0_30px_60px_rgba(0,0,0,0.4)]" style={{ padding: '10px 10px 10px 3px' }}>
                  <div className="relative">
                    <img
                      key={active}
                      src={book.img}
                      alt={`${book.name} cover`}
                      className="hero-fade block rounded-sm max-h-[400px] w-auto max-w-full object-cover"
                      onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect fill="%23e8e4db" width="400" height="600"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="18">Cover</text></svg>'; }}
                    />
                    <span className="badge-font absolute bottom-3 left-3 bg-[#ED3833] text-white px-4 py-2 text-base tracking-wider">
                      {book.tag}
                    </span>
                    <span className="badge-font absolute top-3 right-3 rotate-6 bg-[#ED3833] text-white px-4 py-2 text-sm tracking-widest shadow-[4px_4px_0_rgba(45,49,57,0.85)]">
                      NEW ISSUE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
