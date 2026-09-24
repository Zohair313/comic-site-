import React from 'react';
import { useSiteData } from '@/context/SiteDataContext';

export default function Support() {
  const { data } = useSiteData();
  const contact = data.contact;
  const socials = contact.socials;

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const subject = `Contact Inquiry from ${data.get('firstName')} ${data.get('lastName')}`;
    const body = [
      `Name: ${data.get('firstName')} ${data.get('lastName')}`,
      `Email: ${data.get('email')}`,
      '',
      'Message:',
      data.get('message'),
    ].join('\n');
    window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <section className="pt-24 pb-20 min-h-screen bg-[#faf7f2]">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="display-font italic font-black text-5xl md:text-7xl text-zinc-900 tracking-tight">{contact.heading}</h1>
          <div className="mx-auto mt-4 h-1.5 w-24 rounded-full bg-[#ED3833]"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">

          {/* LEFT — Email Inquiry Form */}
          <div>
            <div className="flex items-start gap-4 mb-6">
              <span className="relative shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-[#ED3833] to-[#c92825] flex items-center justify-center text-white shadow-lg shadow-[#ED3833]/40">
                <i className="fa-solid fa-envelope text-2xl"></i>
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#879F84] border-2 border-[#faf7f2] flex items-center justify-center text-white text-[11px]">
                  <i className="fa-solid fa-plus"></i>
                </span>
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[#608066] mb-1">// Get In Touch</p>
                <h2 className="display-font italic font-black text-3xl md:text-4xl text-zinc-900 leading-none">Email Inquiry Form</h2>
                <p className="text-zinc-600 italic mt-2">{contact.formNote}</p>
              </div>
            </div>

            <form
              className="bg-white rounded-2xl overflow-hidden border-2 border-stone-800 shadow-[8px_8px_0_rgba(74,59,50,0.9)]"
              onSubmit={handleSubmit}
            >
              {/* Top comic strip band */}
              <div className="px-6 md:px-8 py-3 bg-[#4A3B32] flex items-center justify-between">
                <span className="badge-font text-[#F5F2EB] text-xs font-extrabold uppercase tracking-[0.3em]">
                  <i className="fa-solid fa-paper-plane mr-2 text-[#ED3833]"></i>Send a Message
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="fa-solid fa-circle text-[#ED3833] text-[9px]"></i>
                  <i className="fa-solid fa-circle text-[#879F84] text-[9px]"></i>
                  <i className="fa-solid fa-circle text-[#D9A441] text-[9px]"></i>
                </span>
              </div>

              <div className="p-6 md:p-8 pt-7">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label htmlFor="firstName" className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-2">First Name</label>
                    <div className="relative">
                      <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm"></i>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        placeholder="John"
                        className="w-full border-2 border-zinc-200 rounded-xl pl-11 pr-4 py-3 text-zinc-800 placeholder-zinc-400 outline-none transition focus:border-[#ED3833] focus:ring-2 focus:ring-[#ED3833]/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-2">Last Name</label>
                    <div className="relative">
                      <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm"></i>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        placeholder="Doe"
                        className="w-full border-2 border-zinc-200 rounded-xl pl-11 pr-4 py-3 text-zinc-800 placeholder-zinc-400 outline-none transition focus:border-[#ED3833] focus:ring-2 focus:ring-[#ED3833]/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-5">
                  <label htmlFor="email" className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-2">Email Address</label>
                  <div className="relative">
                    <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm"></i>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      className="w-full border-2 border-zinc-200 rounded-xl pl-11 pr-4 py-3 text-zinc-800 placeholder-zinc-400 outline-none transition focus:border-[#ED3833] focus:ring-2 focus:ring-[#ED3833]/20"
                    />
                  </div>
                </div>

                <div className="mb-7">
                  <label htmlFor="message" className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-2">Message</label>
                  <div className="relative">
                    <i className="fa-solid fa-comment-dots absolute left-4 top-5 text-zinc-400 text-sm"></i>
                    <textarea
                      id="message"
                      name="message"
                      required
                      placeholder="Type your message here..."
                      className="w-full min-h-[130px] border-2 border-zinc-200 rounded-xl pl-11 pr-4 py-3 text-zinc-800 placeholder-zinc-400 outline-none transition focus:border-[#ED3833] focus:ring-2 focus:ring-[#ED3833]/20 resize-none"
                    ></textarea>
                  </div>
                </div>

                <button
                  type="submit"
                  className="group w-full py-4 bg-[#769678] hover:bg-[#608066] text-white font-extrabold uppercase tracking-widest rounded-xl transition-all duration-200 shadow-[4px_4px_0_rgba(74,59,50,0.8)] hover:shadow-[2px_2px_0_rgba(74,59,50,0.8)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  <i className="fa-solid fa-paper-plane mr-2 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"></i>
                  Send
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT — Social Media Links */}
          <div>
            <div className="flex items-start gap-4 mb-6">
              <span className="relative shrink-0 w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-white shadow-lg">
                <i className="fa-brands fa-x-twitter text-2xl"></i>
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#ED3833] border-2 border-[#faf7f2] flex items-center justify-center text-white text-[11px]">
                  <i className="fa-solid fa-heart"></i>
                </span>
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[#608066] mb-1">// Connect</p>
                <h2 className="display-font italic font-black text-3xl md:text-4xl text-zinc-900 leading-none">Social Media Links</h2>
                <p className="text-zinc-600 italic mt-2">Follow the studio for comics, sketches and behind-the-scenes.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden border-2 border-stone-800 shadow-[8px_8px_0_rgba(74,59,50,0.9)]">
              {/* Top comic strip band */}
              <div className="px-6 md:px-8 py-3 bg-[#ED3833] flex items-center justify-between">
                <span className="badge-font text-white text-xs font-extrabold uppercase tracking-[0.3em]">
                  <i className="fa-solid fa-share-nodes mr-2"></i>Follow The Studio
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="fa-solid fa-circle text-white/40 text-[9px]"></i>
                  <i className="fa-solid fa-circle text-white/40 text-[9px]"></i>
                  <i className="fa-solid fa-circle text-white/40 text-[9px]"></i>
                </span>
              </div>

              <div className="p-6 md:p-8">
                <ul className="space-y-4">
                  {socials.map((s, idx) => (
                    <li key={idx}>
                      <a
                        href={s.href}
                        {...(s.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        className="group relative flex items-center gap-4 p-4 rounded-xl border-2 border-zinc-200 overflow-hidden transition-all duration-300 hover:border-transparent hover:shadow-[5px_5px_0_rgba(74,59,50,0.9)]"
                      >
                        <span className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${s.hoverClass}`}></span>

                        <span className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-white text-xl shadow-md group-hover:scale-110 transition-transform duration-300 ${s.badgeClass}`}>
                          <i className={s.icon}></i>
                        </span>

                        <span className="relative z-10 flex-1">
                          <span className="block font-black text-zinc-900 group-hover:text-white transition-colors">{s.label}</span>
                          <span className="block text-sm font-bold text-zinc-500 group-hover:text-white/80 italic transition-colors">{s.handle}</span>
                        </span>

                        <span className="relative z-10 w-9 h-9 rounded-full border-2 border-zinc-200 group-hover:border-white/40 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                          <i className="fa-solid fa-arrow-right text-sm group-hover:translate-x-0.5 transition-transform"></i>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>

                <p className="mt-6 text-center text-xs font-bold uppercase tracking-widest text-zinc-400">
                  <i className="fa-solid fa-bolt mr-1 text-[#D9A441]"></i> Free response within 24 hours
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}