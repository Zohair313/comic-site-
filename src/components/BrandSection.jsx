import React from 'react';

export default function BrandSection() {
  const brands = [
    { name: 'GOTHAM COMICS', icon: 'fa-bolt' },
    { name: 'HERO PUBLISHING', icon: 'fa-mask' },
    { name: 'ACTION INK', icon: 'fa-meteor' },
    { name: 'SUPER GRAPHICS', icon: 'fa-shield-halved' },
    { name: 'COMIX STUDIOS', icon: 'fa-book-open' }
  ];

  // Repeat brands to ensure the track exceeds typical screen widths
  const trackItems = [...brands, ...brands, ...brands];

  return (
    <div id="brand" className="bg-white border-b border-gray-200 overflow-hidden relative p-0 m-0">
      <style>
        {`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100%); }
          }
          .marquee-container {
            display: flex;
            align-items: center;
            width: 100%;
            padding: 5px 0;
          }
          .marquee-track {
            display: flex;
            align-items: center;
            flex-shrink: 0;
            animation: marquee 30s linear infinite;
          }
          .marquee-container:hover .marquee-track {
            animation-play-state: paused;
          }
        `}
      </style>
      
      <div className="marquee-container opacity-70">
        <div className="marquee-track">
          {trackItems.map((brand, idx) => (
            <div key={idx} className="flex flex-shrink-0 items-center justify-center gap-3 mr-12 md:mr-20 grayscale hover:grayscale-0 transition-all cursor-pointer hover:scale-105 duration-300">
              <i className={`fa-solid ${brand.icon} text-2xl md:text-3xl text-zinc-800 m-0 p-0`}></i>
              <span className="text-lg md:text-xl font-black text-zinc-800 tracking-tighter uppercase font-sans whitespace-nowrap m-0 p-0 leading-none">
                {brand.name}
              </span>
            </div>
          ))}
        </div>
        
        <div className="marquee-track" aria-hidden="true">
          {trackItems.map((brand, idx) => (
            <div key={idx} className="flex flex-shrink-0 items-center justify-center gap-3 mr-12 md:mr-20 grayscale hover:grayscale-0 transition-all cursor-pointer hover:scale-105 duration-300">
              <i className={`fa-solid ${brand.icon} text-2xl md:text-3xl text-zinc-800 m-0 p-0`}></i>
              <span className="text-lg md:text-xl font-black text-zinc-800 tracking-tighter uppercase font-sans whitespace-nowrap m-0 p-0 leading-none">
                {brand.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}