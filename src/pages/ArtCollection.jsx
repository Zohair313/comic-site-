import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const artworks = [
  { img: 'images/hero-comic-cover.jpg', title: 'Skyhawk #1', category: 'Covers', tag: 'Full Cover Art' },
  { img: 'images/comic cover img.jpg', title: 'Blue Sky 2', category: 'Covers', tag: 'Next Chapter' },
  { img: 'images/skyhawk_landscape.jpg', title: 'The Ashen Skies', category: 'Scenes', tag: 'Landscape Illustration' },
  { img: 'images/custom/char_kaelen_1787177600102.jpg', title: 'Kaelen', category: 'Characters', tag: 'Protagonist' },
  { img: 'images/custom/char_lyra_1787177611766.jpg', title: 'Lyra', category: 'Characters', tag: 'Master Mage' },
  { img: 'images/custom/char_draken_1787177625172.jpg', title: 'Draken', category: 'Characters', tag: 'The Antagonist' },
  { img: 'images/custom/char_elara_1787177638388.jpg', title: 'Elara', category: 'Characters', tag: 'The Guide' },
  { img: 'images/custom/comic_page_1_1787177649462.jpg', title: 'The Awakening', category: 'Pages', tag: 'Story Page' },
  { img: 'images/custom/comic_page_2_1787177662562.jpg', title: 'Into the Flames', category: 'Pages', tag: 'Story Page' },
  { img: 'images/Comic story pages.jpg', title: 'Panel Study I', category: 'Pages', tag: 'Action Layout' },
  { img: 'images/Comic story pages2.jpg', title: 'Panel Study II', category: 'Pages', tag: 'Action Layout' },
  { img: 'images/intro_post.jpeg', title: 'Studio Announcement', category: 'Scenes', tag: 'Release Art' },
];

const categories = ['All', 'Covers', 'Characters', 'Pages', 'Scenes'];

export default function ArtCollection() {
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState(null);

  const filtered = category === 'All' ? artworks : artworks.filter((a) => a.category === category);
  const currentIdx = selected ? filtered.findIndex((a) => a.img === selected.img) : -1;

  const prev = () => {
    if (filtered.length === 0) return;
    setSelected(filtered[(currentIdx - 1 + filtered.length) % filtered.length]);
  };
  const next = () => {
    if (filtered.length === 0) return;
    setSelected(filtered[(currentIdx + 1) % filtered.length]);
  };

  return (
    <section className="pt-24 pb-20 min-h-screen bg-[#faf7f2]">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="badge-font text-[#ED3833] text-sm font-extrabold tracking-[0.3em] uppercase mb-3">
            <i className="fa-solid fa-palette mr-2"></i>Greyfire Studio
          </p>
          <h1 className="display-font italic font-black text-5xl md:text-7xl text-zinc-900 tracking-tight">Art Collection</h1>
          <p className="text-zinc-600 italic max-w-xl mx-auto mt-4 leading-relaxed">
            Every panel, sketch, and cover — drawn by hand, panel by panel. Browse the gallery below.
          </p>
          <div className="mx-auto mt-5 h-1.5 w-24 rounded-full bg-[#ED3833]"></div>
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-12">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-5 py-2 rounded-full text-sm font-extrabold uppercase tracking-wider transition-all duration-200 ${
                category === c
                  ? 'bg-[#ED3833] text-white shadow-[3px_3px_0_rgba(74,59,50,0.85)]'
                  : 'bg-white text-zinc-600 border-2 border-stone-200 hover:border-[#ED3833] hover:text-[#ED3833]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Gallery grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 max-w-6xl mx-auto">
          {filtered.map((art, idx) => (
            <button
              key={`${art.img}-${idx}`}
              onClick={() => setSelected(art)}
              className="group relative text-left bg-white rounded-2xl overflow-hidden border-2 border-stone-800 shadow-[6px_6px_0_rgba(74,59,50,0.85)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[8px_8px_0_rgba(74,59,50,0.85)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ED3833]"
            >
              <div className="aspect-[4/5] overflow-hidden bg-zinc-100">
                <img
                  src={art.img}
                  alt={art.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#2a211b]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                <div className="p-5 text-left">
                  <p className="badge-font text-[#D9A441] text-xs font-extrabold tracking-[0.25em] uppercase mb-1">{art.tag}</p>
                  <h3 className="display-font italic font-black text-2xl text-white">{art.title}</h3>
                </div>
                <span className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#ED3833] text-white flex items-center justify-center shadow-lg">
                  <i className="fa-solid fa-expand text-sm"></i>
                </span>
              </div>

              {/* Category chip */}
              <span className="absolute top-4 left-4 badge-font bg-white/90 text-zinc-800 text-xs font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full shadow">
                {art.category}
              </span>
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-14">
          <p className="text-zinc-600 italic mb-4">Want more art drops, sketches and process videos?</p>
          <Link
            to="/bio"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#4A3B32] text-white font-extrabold uppercase tracking-widest text-sm hover:bg-[#5d4a3f] transition-colors"
          >
            <i className="fa-solid fa-palette"></i> About the Artist
          </Link>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 hover:bg-[#ED3833] text-white flex items-center justify-center transition-colors"
            onClick={() => setSelected(null)}
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>

          <button
            type="button"
            className="absolute left-3 md:left-8 w-12 h-12 rounded-full bg-white/10 hover:bg-[#ED3833] text-white flex items-center justify-center transition-colors"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="Previous artwork"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <button
            type="button"
            className="absolute right-3 md:right-8 w-12 h-12 rounded-full bg-white/10 hover:bg-[#ED3833] text-white flex items-center justify-center transition-colors"
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="Next artwork"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>

          <figure className="max-h-[85vh] max-w-4xl w-full text-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={selected.img}
              alt={selected.title}
              className="max-h-[72vh] w-auto mx-auto rounded-xl border-2 border-white/20 shadow-2xl object-contain"
            />
            <figcaption className="mt-4">
              <p className="badge-font text-[#D9A441] text-xs font-extrabold tracking-[0.3em] uppercase mb-1">{selected.tag}</p>
              <h3 className="display-font italic font-black text-3xl text-white">{selected.title}</h3>
              <span className="inline-block mt-2 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/10 text-zinc-300">
                {selected.category} · {currentIdx + 1} / {filtered.length}
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}