import React from 'react';
import { Link } from 'react-router-dom';

export default function BlogSection() {
  return (
    <section id="updates" className="bg-[#4A3B32]">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Section header */}
        <div className="text-center mb-10">
          <p className="badge-font text-[#ED3833] text-sm font-extrabold tracking-[0.25em] uppercase mb-3">Studio Blog</p>
          <h2 className="display-font font-black text-white text-4xl sm:text-5xl md:text-6xl">
            Behind the Scenes &amp; Updates<span className="text-[#ED3833]">.</span>
          </h2>
        </div>

        {/* Featured update card — constrained width */}
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-8 items-stretch">

            {/* Text side */}
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-5">
                <span className="display-font text-[#ED3833] text-6xl leading-none">01</span>
                <span className="badge-font bg-[#879F84] text-white text-xs font-extrabold tracking-[0.2em] uppercase px-4 py-2 rounded-full">
                  Announcement
                </span>
              </div>

              <h3 className="display-font text-[#4A3B32] text-3xl mb-4">
                Intro Post: A New Adventure Begins
              </h3>
              <p className="text-gray-500 text-base leading-relaxed flex-grow">
                Every page of this comic starts as nothing but blank paper and a pencil. This is the
                first post from the studio — a look at why Greyfire exists, what Blue Sky 1 means to
                me, and everything we're drawing next. Welcome to the adventure.
              </p>

              {/* Bottom row — author + date, anchored to bottom */}
              <div className="flex flex-wrap items-center justify-between gap-4 mt-auto pt-8">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-[#ED3833] bg-[#F5F2EB]">
                    <img
                      src="images/custom/creator_bio_1787177588804.jpg"
                      alt="Wessley"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-[#4A3B32] font-extrabold text-base leading-tight">Wessley</p>
                    <p className="text-gray-400 text-sm leading-tight">Founder &amp; Artist</p>
                  </div>
                </div>

                <span className="badge-font inline-flex items-center gap-2 bg-[#F5F2EB] text-[#4A3B32] text-sm font-extrabold tracking-wider uppercase px-5 py-2.5 rounded-full">
                  <i className="fa-solid fa-calendar-days text-[#ED3833]"></i>August 22, 2026
                </span>
              </div>
            </div>

            {/* Comic strip image side */}
            <div className="relative rounded-md overflow-hidden min-h-[280px] bg-[#F5F2EB]">
              <img
                src="images/Comic story pages5.jpg"
                alt="Hand-drawn comic page preview"
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect fill="%23e8e4db" width="400" height="600"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="18">Page Art</text></svg>'; }}
              />
              <span className="badge-font absolute bottom-4 left-4 bg-[#4A3B32] text-white text-xs font-extrabold tracking-widest uppercase px-4 py-2 rounded-full shadow">
                <i className="fa-solid fa-pen-nib text-[#ED3833] mr-1.5"></i>WIP Page
              </span>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link to="/lore" className="inline-flex items-center px-6 py-3 text-base rounded-md border-2 border-[#ED3833] bg-[#ED3833] text-white font-bold hover:bg-[#c92825] hover:border-[#c92825] transition-colors">
            View All Updates
          </Link>
        </div>
      </div>
    </section>
  );
}