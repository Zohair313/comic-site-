import React from 'react';
import { useSiteData } from '@/context/SiteDataContext';

export default function AboutSection() {
  const { data } = useSiteData();
  const about = data.about;
  const site = data.site;

  return (
    <section id="about" className="bg-[#F5F2EB]">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12">

          {/* Left — portrait */}
          <div className="relative flex justify-center">
            <img
              src={about.image}
              alt={about.name}
              className="w-72 sm:w-80 lg:w-96 aspect-[3/4] rounded-full object-cover shadow-2xl block"
            />
          </div>

          {/* Right — about copy */}
          <div>
            <p className="badge-font text-[#ED3833] text-sm font-extrabold tracking-[0.25em] uppercase mb-4">{about.eyebrow}</p>
            <h2 className="display-font font-black text-[#4A3B32] text-5xl md:text-6xl mb-6">
              {about.name}.
            </h2>

            {about.paragraphs.map((p, idx) => (
              <p key={idx} className="text-[#4A3B32] text-lg leading-relaxed mb-6">{p}</p>
            ))}

            <ul className="space-y-2.5 mb-8">
              {about.bullets.map((b, idx) => (
                <li key={idx} className="flex items-center gap-3 text-[#4A3B32] text-lg font-semibold">
                  <i className="fa-solid fa-check text-[#ED3833]"></i>{b}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3">
              <a href={about.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#ED3833] text-white font-bold text-base hover:bg-[#c92825] transition-colors">
                <i className="fa-brands fa-instagram"></i>Instagram
              </a>
              <a href={`mailto:${site.contactEmail}`} className="inline-flex items-center gap-2 px-7 py-3 rounded-full border-2 border-[#ED3833] text-[#ED3833] font-bold text-base hover:bg-[#ED3833] hover:text-white transition-colors">
                <i className="fa-solid fa-envelope"></i>Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}