import React from 'react';
import { Link } from 'react-router-dom';

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: 'By accessing or using the Greyfire Studio website, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, please do not use our site.',
  },
  {
    title: '2. Intellectual Property',
    body: 'All comics, artwork, characters, logos, and content on this website are the intellectual property of Greyfire Studio and its creator Wessley. You may not reproduce, distribute, or use any content without explicit written permission.',
  },
  {
    title: '3. Digital Content',
    body: 'Digital downloads and printed comics are for personal use only. You may not resell, redistribute, or claim ownership of purchased or free content without authorization.',
  },
  {
    title: '4. Purchases & Refunds',
    body: 'All sales of physical merchandise are processed with care. Damaged items may be reported within 14 days of receipt for replacement or refund. Digital downloads are generally non-refundable once delivered.',
  },
  {
    title: '5. User Conduct',
    body: 'You agree not to misuse the website, including attempting to disrupt services, harvest personal data, or post unlawful content through our contact channels.',
  },
  {
    title: '6. Limitation of Liability',
    body: 'Greyfire Studio shall not be liable for any indirect, incidental, or consequential damages arising from the use of this website or its content.',
  },
  {
    title: '7. Changes to These Terms',
    body: 'We may update these Terms & Conditions from time to time. Continued use of the site after changes means you accept the revised terms.',
  },
  {
    title: '8. Contact',
    body: 'For questions regarding these Terms & Conditions, contact us at info@greyfirestudio.com.',
  },
];

export default function Terms() {
  return (
    <section className="pt-24 pb-20 min-h-screen bg-[#faf7f2]">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <p className="badge-font text-[#ED3833] text-sm font-extrabold tracking-[0.3em] uppercase mb-3">
            <i className="fa-solid fa-file-signature mr-2"></i>Greyfire Studio
          </p>
          <h1 className="display-font italic font-black text-4xl md:text-6xl text-zinc-900 tracking-tight">Terms &amp; Conditions</h1>
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