import React from 'react';

const creators = [
  {
    name: 'Wessley Stangle',
    role: 'Comic Creator / Writer',
    desc: 'Story, lore, and every hand-inked panel.',
    img: 'images/custom/creator_bio_1787177588804.jpg',
    initials: 'W',
    accent: '#ED3833',
    socials: [
      { icon: 'fa-brands fa-instagram', url: 'https://www.instagram.com/vtube.rrhapsody', label: 'Instagram' },
      { icon: 'fa-solid fa-envelope', url: 'mailto:Wolf.357.lord@gmail.com', label: 'Email' },
    ]
  },
  {
    name: 'Rhapsody',
    role: 'Web Developer & Digital Artist',
    desc: 'Website engineering, UX design, and the digital assets that bring the studio online.',
    img: 'images/custom/rhapsody-avatar.svg',
    initials: 'R',
    accent: '#879F84',
    socials: [
      { icon: 'fa-brands fa-instagram', url: 'https://www.instagram.com/vtube.rrhapsody', label: 'Instagram' },
      { icon: 'fa-brands fa-x-twitter', url: 'https://x.com/Caternia_vt', label: 'X (Twitter)' },
    ]
  }
];

export default function TeamSection() {
  return (
    <section id="team" className="bg-[#4A3B32] overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Section header */}
        <div className="text-center mb-10">
          <p className="badge-font text-[#ED3833] text-sm font-extrabold tracking-[0.25em] uppercase mb-3">The Creators</p>
          <h2 className="display-font font-black text-white text-5xl md:text-6xl">
            Meet the Duo Behind Greyfire Studio
          </h2>
        </div>

        {/* Duo grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 justify-items-center">
          {creators.map((creator, idx) => (
            <div key={idx} className="text-center h-full flex flex-col">
              {/* Circular profile with dropped shadow */}
              <div className="relative w-[190px] h-[190px] mx-auto">
                <div className="absolute top-3 left-3 w-full h-full rounded-full bg-black/40"></div>
                <div className="relative w-full h-full rounded-full border-4 border-white overflow-hidden bg-[#3a3f47]">
                  <img
                    src={creator.img}
                    alt={creator.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="190" height="190"><rect fill="%234A3B32" width="190" height="190"/><circle cx="95" cy="95" r="70" fill="none" stroke="%23ED3833" stroke-width="4"/><text x="95" y="124" text-anchor="middle" font-family="Arial Black,Arial" font-size="84" font-weight="900" fill="%23ED3833">' + creator.initials + '</text></svg>';
                    }}
                  />
                </div>
              </div>

              <h3 className="display-font text-white text-3xl mt-6 mb-1">{creator.name}</h3>
              <p className="badge-font text-sm font-bold tracking-widest mb-2" style={{ color: creator.accent }}>
                {creator.role}
              </p>
              <p className="text-[#b9bec7] text-base leading-relaxed mb-6 max-w-[280px] mx-auto">{creator.desc}</p>

              {/* Social buttons — solid primary / outline secondary, matching section language elsewhere */}
              <div className="flex justify-center gap-3 mt-auto pt-2">
                {creator.socials.map((social, sIdx) => (
                  <a
                    key={sIdx}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className={sIdx === 0
                      ? 'inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-full bg-[#ED3833] text-white hover:bg-[#c92825] transition-colors'
                      : 'inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-full border-2 border-[#ED3833] text-[#ED3833] hover:bg-[#ED3833] hover:text-white transition-colors'}
                  >
                    {social.icon === 'fa-brands fa-x-twitter' ? (
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    ) : (
                      <i className={social.icon}></i>
                    )}
                    {social.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}