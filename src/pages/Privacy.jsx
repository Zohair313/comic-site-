import React from 'react';
import { Link } from 'react-router-dom';

const sections = [
  {
    title: '1. Information We Collect',
    body: 'We collect information you provide directly to us, such as your name, email address, and any message content when you use our contact form or subscribe to updates. We do not sell your personal information to third parties.',
  },
  {
    title: '2. How We Use Your Information',
    body: 'Your information is used solely to respond to your inquiries, send you requested updates, and improve our website experience. We only send emails you have opted in to receive.',
  },
  {
    title: '3. Cookies & Analytics',
    body: 'Our site may use basic cookies and analytics to understand how visitors use the site, such as which pages are most popular. This data is aggregated and does not personally identify you.',
  },
  {
    title: '4. Payment & Security',
    body: 'Any purchases are processed through trusted third-party payment providers. We never store your card details on our servers. All communications are kept confidential.',
  },
  {
    title: '5. Third-Party Links',
    body: 'Greyfire Studio may link to external sites such as Instagram or email clients. We are not responsible for the privacy practices of those external services.',
  },
  {
    title: '6. Your Rights',
    body: 'You may request access to, correction of, or deletion of your personal data at any time by contacting us directly. We will honour such requests promptly.',
  },
  {
    title: '7. Contact',
    body: 'If you have any questions about this Privacy Policy, reach out to us at info@greyfirestudio.com.',
  },
];

export default function Privacy() {
  return (
    <section className="pt-24 pb-20 min-h-screen bg-[#faf7f2]">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <p className="badge-font text-[#ED3833] text-sm font-extrabold tracking-[0.3em] uppercase mb-3">
            <i className="fa-solid fa-shield-halved mr-2"></i>Greyfire Studio
          </p>
          <h1 className="display-font italic font-black text-4xl md:text-6xl text-zinc-900 tracking-tight">Privacy Policy</h1>
          <div className="mx-auto mt-5 h-1.5 w-24 rounded-full bg-[#ED3833]"></div>
          <p className="text-zinc-500 italic mt-4 text-sm">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-10 border-2 border-stone-800 shadow-[8px_8px_0_rgba(74,59,50,0.85)]">
          {sections.map((s, idx) => (
            <div key={idx} className={idx !== sections.length - 1 ? 'mb-8' : ''}>
              <h2 className="display-font italic font-black text-2xl text-[#4A3B32] mb-3">
                <span className="text-[#ED3833] mr-2">{s.title}</span>
              </h2>
              <p className="text-zinc-600 leading-relaxed">{s.body}</p>
            </div>
          ))}

          <div className="mt-10 pt-6 border-t-2 border-dashed border-zinc-200 text-center">
            <Link to="/support" className="inline-flex items-center gap-2 text-[#ED3833] font-extrabold hover:text-[#c92825] transition-colors">
              <i className="fa-solid fa-envelope"></i> Contact Us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}