import React from 'react';
import { useSiteData } from '@/context/SiteDataContext';

export default function CreatorIntro() {
  const { data } = useSiteData();
  const about = data.about;

  return (
    <section className="bg-[#4A3B32] border-t-4 border-[#ED3833]">
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <p className="badge-font text-[#ED3833] text-sm font-extrabold tracking-[0.25em] uppercase mb-4">
          Meet the Creator
        </p>

        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-8">
          <img
            src={about.image}
            alt={about.name}
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover shadow-2xl border-4 border-[#ED3833] flex-none"
          />
          <div className="text-center sm:text-left">
            <h3 className="display-font font-black text-white text-4xl sm:text-5xl leading-none">
              Hi, I'm {about.name}<span className="text-[#ED3833]">.</span>
            </h3>
            {about.role && (
              <p className="badge-font text-[#ED3833] text-sm font-extrabold tracking-widest uppercase mt-3 mb-0">
                <i className="fa-solid fa-pen-nib mr-2"></i>{about.role}
              </p>
            )}
          </div>
        </div>

        {about.intro && (
          <p className="text-white/85 text-lg leading-relaxed max-w-3xl mx-auto mt-8 mb-0">
            {about.intro}
          </p>
        )}
      </div>
    </section>
  );
}