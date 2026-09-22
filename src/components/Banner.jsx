import { Link } from 'react-router-dom';
import Marquee from './Marquee';

const book = {
  name: 'Blue Sky 1',
  img: 'images/hero-comic-cover.jpg',
  pills: ['Debut Issue', 'Over 100 Pages'],
  snippet: 'The saga begins. A 100% hand-drawn debut — high-octane action, vibrant ink, and real lessons in every panel, made from scratch by one artist.',
  tag: 'Skyhawk #1',
};

export default function Banner() {
  const bgUrl = `${import.meta.env.BASE_URL}images/background full page.jpg`;
  return (
    <section
      id="banner"
      className="relative isolate bg-[#F5F2EB] overflow-hidden min-h-svh bg-cover bg-center"
      style={{ backgroundImage: `url("${bgUrl}")` }}
    >
      {/* Dark overlay so text stays readable over the background image */}
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/70 via-black/45 to-black/25" aria-hidden="true"></div>

      {/* Red marquee pinned to the bottom of the hero */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <Marquee />
      </div>

      {/* Uniform section container */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-10">

          {/* Left column — featured book info */}
          <div>
            <p className="badge-font text-[#ED3833] text-sm font-extrabold tracking-[0.25em] mb-5">
              Greyfire Studio presents
            </p>

            <div>
              <div className="min-h-[7.5rem] md:min-h-[10rem] flex flex-col justify-end">
                <h1 className="display-font font-black text-white text-5xl sm:text-6xl md:text-8xl leading-none mb-5">
                  {book.name}
                </h1>
              </div>

              {/* Basil pill badges */}
              <div className="flex flex-wrap gap-2.5 mb-4">
                {book.pills.map((pill, idx) => (
                  <span key={idx} className="badge-font bg-[#879F84] text-white text-sm font-extrabold tracking-widest uppercase px-5 py-2.5 rounded-full">
                    {pill}
                  </span>
                ))}
              </div>

              <p className="text-white/90 text-lg md:text-xl leading-relaxed max-w-[480px] mb-6">
                {book.snippet}
              </p>
            </div>

            {/* Twin CTAs */}
            <div className="flex flex-wrap gap-3.5">
              <Link to="/reader" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border-2 border-[#ED3833] bg-[#ED3833] text-white font-bold text-base hover:bg-[#c92825] hover:border-[#c92825] transition-colors">
                <i className="fa-solid fa-book-open"></i>Read Now
              </Link>
              <Link to="/shop" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border-2 border-[#ED3833] text-[#ED3833] font-bold text-base hover:bg-[#ED3833] hover:text-white transition-colors">
                <i className="fa-solid fa-cart-shopping"></i>Get Art Book &amp; Cards
              </Link>
            </div>
          </div>

          {/* Right column — 3D angled cover, contained within section */}
          <div className="hidden lg:flex justify-center items-center" style={{ perspective: '1200px' }}>
            <div className="relative" style={{ maxWidth: '340px', maxHeight: '440px', overflow: 'hidden', borderRadius: '6px' }}>

              {/* 3D angled book — subtler rotation so it stays proportional to text */}
              <div className="relative inline-block" style={{ transform: 'rotateY(-8deg) rotateX(3deg) rotateZ(-2deg)', transformStyle: 'preserve-3d' }}>
                <div className="bg-[#4A3B32] rounded-md shadow-[0_30px_60px_rgba(0,0,0,0.4)]" style={{ padding: '10px 10px 10px 3px' }}>
                  <div className="relative">
                    <img
                      src={book.img}
                      alt={`${book.name} cover`}
                      className="block rounded-md max-h-[400px] w-auto max-w-full object-cover"
                      onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect fill="%23e8e4db" width="400" height="600"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="18">Cover</text></svg>'; }}
                    />
                    <span className="badge-font absolute bottom-3 left-3 bg-[#ED3833] text-white px-4 py-2 text-base tracking-wider">
                      {book.tag}
                    </span>
                    <span className="badge-font absolute top-3 right-3 rotate-6 bg-[#ED3833] text-white px-4 py-2 text-sm tracking-widest shadow-[4px_4px_0_rgba(45,49,57,0.85)]">
                      NEW ISSUE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}