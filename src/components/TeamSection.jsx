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
      { icon: 'fa-brands fa-instagram', url: 'https://instagram.com/wessley_stangle' },
      { icon: 'fa-solid fa-envelope', url: 'mailto:Wolf.357.lord@gmail.com' },
    ]
  },
  {
    name: 'Rhapsody',
    role: 'Web Developer & Digital Artist',
    desc: 'Website engineering, UX design, and the digital assets that bring the studio online.',
    img: 'images/rhapsody-placeholder.jpg',
    initials: 'R',
    accent: '#879F84',
    socials: [
      { icon: 'fa-brands fa-instagram', url: 'https://instagram.com/rhapsodys' },
      { icon: 'fa-brands fa-x-twitter', url: 'https://x.com/Caternia_vt' },
    ]
  }
];

function toggleCircle(e, on, solid) {
  const el = e.currentTarget;
  el.style.backgroundColor = on ? solid : '#4A3B32';
  el.style.color = on ? '#fff' : '#e8e4db';
  el.style.transform = on ? 'translateY(-4px)' : 'none';
}

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
            <div key={idx} className="text-center">
              {/* Circular profile with dropped shadow */}
              <div className="relative w-[190px] h-[190px] mx-auto">
                <div className="absolute top-3 left-3 w-full h-full rounded-full bg-black/40"></div>
                <div className="relative w-full h-full rounded-full border-4 border-white overflow-hidden bg-[#3a3f47]">
                  <img
                    src={creator.img}
                    alt={creator.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="190" height="190"><rect fill="%23e8e4db" width="190" height="190"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="72">' + creator.initials + '</text></svg>';
                    }}
                  />
                </div>
              </div>

              <h4 className="display-font text-white text-3xl mt-6 mb-1">{creator.name}</h4>
              <p className="badge-font text-sm font-bold tracking-widest uppercase mb-2" style={{ color: creator.accent }}>
                {creator.role}
              </p>
              <p className="text-[#b9bec7] text-base leading-relaxed mb-6 max-w-[280px] mx-auto">{creator.desc}</p>

              {/* Circular social triggers */}
              <div className="flex justify-center gap-3.5">
                {creator.socials.map((social, sIdx) => (
                  <a
                    key={sIdx}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.icon}
                    className="inline-flex items-center justify-center w-11 h-11 rounded-full border-2 border-[#4a4f57] text-[#E8E4DB] text-[15px] transition-all bg-[#4A3B32]"
                    onMouseEnter={(e) => toggleCircle(e, true, creator.accent)}
                    onMouseLeave={(e) => toggleCircle(e, false, creator.accent)}
                  >
                    <i className={social.icon}></i>
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