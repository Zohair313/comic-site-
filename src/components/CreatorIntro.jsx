import React from 'react';
import { useSiteData } from '@/context/SiteDataContext';
import { resolveSrc } from '@/lib/api';

const FALLBACK_IMAGE = 'images/author img.jpeg';

export default function CreatorIntro() {
  const { data } = useSiteData();
  const about = data.about ?? {};
  const intro = data.creatorIntro ?? {};
  const eyebrow = intro.eyebrow ?? 'Meet the Creator';
  const name = intro.name || about.name;
  const role = intro.role || about.role;
  const text = intro.intro ?? '';
  const image = resolveSrc(intro.image || about.image || FALLBACK_IMAGE);

  // A stored upload can go missing (storage cleared, file deleted on deploy).
  // Fall back rather than showing a broken image icon.
  const handleError = (event) => {
    const fallback = resolveSrc(FALLBACK_IMAGE);
    if (event.currentTarget.src !== fallback) event.currentTarget.src = fallback;
  };

  if (intro.enabled === false) return null;

  return (
    <section className="bg-[#4A3B32] border-t-4 border-[#ED3833]">
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <p className="badge-font text-[#ED3833] text-sm font-extrabold tracking-[0.25em] uppercase mb-4">
          {eyebrow}
        </p>

        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-8">
          <img
            src={image}
            alt={name}
            onError={handleError}
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover shadow-2xl border-4 border-[#ED3833] flex-none"
          />
          <div className="text-center sm:text-left">
            <h3 className="display-font font-black text-white text-4xl sm:text-5xl leading-none">
              Hi, I'm {name}<span className="text-[#ED3833]">.</span>
            </h3>
            {role && (
              <p className="badge-font text-[#ED3833] text-sm font-extrabold tracking-widest uppercase mt-3 mb-0">
                <i className="fa-solid fa-pen-nib mr-2"></i>{role}
              </p>
            )}
          </div>
        </div>

        {text && (
          <p className="text-white/85 text-lg leading-relaxed max-w-3xl mx-auto mt-8 mb-0">
            {text}
          </p>
        )}
      </div>
    </section>
  );
}