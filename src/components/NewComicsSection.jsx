import React from 'react';
import { Link } from 'react-router-dom';

const products = [
  {
    title: 'Blue Sky 1 — Issue #1',
    desc: 'The debut issue of the saga. Every panel hand-drawn, inked, lettered, and colored by one artist.',
    img: 'images/hero-comic-cover.jpg',
    alt: 'Blue Sky 1 Comic Cover',
    tags: ['100% Hand-Drawn', '100 Pages'],
    cta: { to: '/reader', text: 'Read Now', icon: 'fa-solid fa-book-open', solid: true },
    ctaSecondary: { to: '/shop', text: 'Buy Physical', icon: 'fa-solid fa-cart-shopping', solid: false },
  },
  {
    title: '50-Page Art Book',
    desc: 'A behind-the-scenes companion: sketches, character turnarounds, and world-building notes from Blue Sky 1.',
    img: 'images/comic cover img.jpg',
    alt: 'Companion Art Book',
    tags: ['Sketches', 'Turnarounds'],
    cta: { to: '/portfolio', text: 'Explore Book', icon: 'fa-solid fa-palette', solid: true },
  },
  {
    title: 'Collectible Cards & Lore Pack',
    desc: 'Physical character cards with stats, bios, and a mini lore guide — perfect for fans and collectors.',
    img: 'images/custom/char_kaelen_1787177600102.jpg',
    alt: 'Collectible Character Cards',
    tags: ['Character Stats', 'Lore Guide'],
    cta: { to: '/shop', text: 'Get Card Set', icon: 'fa-solid fa-layer-group', solid: true },
  },
];

export default function NewComicsSection() {
  return (
    <section id="new-comics" className="bg-[#4A3B32]">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Section header */}
        <div className="text-center mb-10">
          <p className="badge-font text-[#ED3833] text-sm font-extrabold tracking-[0.25em] uppercase mb-3">The Collection</p>
          <h2 className="display-font font-black text-white text-6xl md:text-7xl">
            What We're Making<span className="text-[#ED3833]">.</span>
          </h2>
        </div>

        {/* Project grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl overflow-hidden shadow-lg h-full flex flex-col transition-shadow hover:shadow-2xl"
            >
              {/* 2:3 cover art */}
              <img
                src={item.img}
                alt={item.alt}
                className="aspect-[2/3] object-cover w-full"
                onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect fill="%23e8e4db" width="400" height="600"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="18">Image</text></svg>'; }}
              />

              {/* Body */}
              <div className="p-5 flex flex-col flex-grow">
                <h3 className="display-font text-[#4A3B32] text-2xl leading-tight mb-2">{item.title}</h3>
                <p className="text-gray-500 text-base leading-relaxed flex-grow mb-4">{item.desc}</p>

                {/* Red tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {item.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="badge-font bg-[#879F84] text-white text-xs font-extrabold tracking-wider uppercase px-3.5 py-1.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Compact buttons */}
                <div className="flex flex-wrap gap-2">
                  <Link to={item.cta.to} className="inline-flex items-center gap-1.5 px-5 py-2.5 text-base rounded-md bg-[#ED3833] text-white font-bold hover:bg-[#c92825] transition-colors">
                    <i className={item.cta.icon}></i>{item.cta.text}
                  </Link>
                  {item.ctaSecondary && (
                    <Link to={item.ctaSecondary.to} className="inline-flex items-center gap-1.5 px-5 py-2.5 text-base rounded-md border border-[#ED3833] text-[#ED3833] font-bold hover:bg-[#ED3833] hover:text-white transition-colors">
                      <i className={item.ctaSecondary.icon}></i>{item.ctaSecondary.text}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}