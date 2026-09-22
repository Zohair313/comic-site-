import React from 'react';

export default function AboutSection() {
  return (
    <section id="about" className="bg-[#F5F2EB]">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12">

          {/* Left — portrait + overlaid red badges */}
          <div className="relative flex justify-center">
            {/* Stacked red badges anchored top-left */}
            <div className="absolute top-0 left-0 z-10 flex flex-col gap-2" style={{ transform: 'translate(0, -8px)' }}>
              <span className="badge-font inline-flex items-center gap-1.5 bg-[#ED3833] text-white text-sm font-extrabold tracking-widest uppercase px-5 py-2 rounded-full shadow-lg shadow-[#ED3833]/40">
                <i className="fa-solid fa-pen-nib"></i>100% Hand-Drawn
              </span>
              <span className="badge-font inline-flex items-center gap-1.5 bg-[#ED3833] text-white text-sm font-extrabold tracking-widest uppercase px-5 py-2 rounded-full shadow-lg shadow-[#ED3833]/40">
                <i className="fa-solid fa-book"></i>500+ Pages
              </span>
            </div>

            <img
              src="images/custom/creator_bio_1787177588804.jpg"
              alt="Wessley at his drawing tablet"
              className="w-72 sm:w-80 lg:w-96 aspect-[3/4] rounded-full object-cover shadow-2xl block"
            />
          </div>

          {/* Right — about copy */}
          <div>
            <p className="badge-font text-[#ED3833] text-sm font-extrabold tracking-[0.25em] uppercase mb-4">About Me</p>
            <h2 className="display-font font-black text-[#4A3B32] text-5xl md:text-6xl mb-6">
              Wessley.
            </h2>

            <p className="text-[#4A3B32] text-lg leading-relaxed mb-5">
              Welcome to Grey Fire Studio! I'm Wessley — a comic creator, artist, and Army veteran.
              Growing up on a farm with dyslexia, traditional reading was a challenge until comics
              opened up a whole new visual world for me.
            </p>
            <p className="text-[#4A3B32] text-lg leading-relaxed mb-6">
              After serving in the Army with deployments to Iraq and Afghanistan, seeing people do
              incredible things for those they love gave me a deep appreciation for life, community,
              and mental health. Grey Fire Studio blends thrilling stories with real lessons on
              emotional growth and resilience.
            </p>

            <ul className="space-y-2.5 mb-8">
              <li className="flex items-center gap-3 text-[#4A3B32] text-lg font-semibold">
                <i className="fa-solid fa-check text-[#ED3833]"></i>Comic Creator &amp; Artist
              </li>
              <li className="flex items-center gap-3 text-[#4A3B32] text-lg font-semibold">
                <i className="fa-solid fa-check text-[#ED3833]"></i>Army Veteran
              </li>
              <li className="flex items-center gap-3 text-[#4A3B32] text-lg font-semibold">
                <i className="fa-solid fa-check text-[#ED3833]"></i>Passionate about Mental Health
              </li>
            </ul>

            <div className="flex flex-wrap gap-3">
              <a href="https://instagram.com/wessley_stangle" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#ED3833] text-white font-bold text-base hover:bg-[#c92825] transition-colors">
                <i className="fa-brands fa-instagram"></i>Instagram
              </a>
              <a href="mailto:Wolf.357.lord@gmail.com" className="inline-flex items-center gap-2 px-7 py-3 rounded-full border-2 border-[#ED3833] text-[#ED3833] font-bold text-base hover:bg-[#ED3833] hover:text-white transition-colors">
                <i className="fa-solid fa-envelope"></i>Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}