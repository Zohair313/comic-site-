import React from 'react';
import { Link } from 'react-router-dom';

export default function Bio() {
  const socialLinks = [
    { icon: 'fa-brands fa-discord', label: 'Discord' },
    { icon: 'fa-brands fa-x-twitter', label: 'Twitter / X' },
    { icon: 'fa-brands fa-instagram', label: 'Instagram' },
    { icon: 'fa-brands fa-youtube', label: 'YouTube' },
  ];

  const timeline = [
    { year: '2018', title: 'Studio Founded', text: 'Greyfire Studio was born from a passion project. Started sketching the first characters of The Fractured Realms.' },
    { year: '2020', title: 'First Issue Published', text: 'Shadow Fighter II launched on Comixo. Over 10K downloads in the first month.' },
    { year: '2022', title: 'Community Growth', text: 'Reached 100K readers. Launched the Discord server and started weekly art streams.' },
    { year: '2024', title: 'New Chapter', text: 'The Fractured Realms saga enters its most ambitious arc yet. Merch shop and print editions launching.' },
  ];

  return (
    <>
      <section id="about" className="pt-5">
        <div className="container">
          <div className="row pt-5 align-items-center">
            <div className="col-lg-5 col-md-9 m-md-auto about-main">
              <img 
                src="/images/custom/creator_bio_1787177588804.jpg" 
                alt="Author" 
                className="img-fluid rounded" 
                style={{ width: '100%' }}
              />
              <div className="active-users">
                <h3 className="counter">3</h3><span>M</span>
                <p>Readers</p>
              </div>
              <div className="experience">
                <h3 className="counter">6</h3>
                <span>+</span>
                <p>Years creating</p>
              </div>
            </div>
            <div className="col-lg-6 offset-lg-1 mt-5 mt-lg-0">
              <div className="about-txt">
                <span>Creator Bio</span>
                <h3>Wessley.</h3>
                <p className="pt-2 pb-4">
                  Welcome to Grey Fire Studio! I’m Wessley a comic creator, artist and Army veteran. Growing up on a farm with dyslexia, traditional reading was a challenge until comics opened up a whole new visual world for me.
                  <br/><br/>
                  After serving in the Army with deployments to Iraq and Afghanistan, seeing people do incredible things for those they love gave me a deep appreciation for life, community and mental health. I created Grey Fire Studio to share my original comics, artwork and gear combining thrilling stories with real life lessons on emotional growth and resilience.
                </p>
                <div className="check-p">
                  <p><i className="fa-solid fa-check"></i> Comic Creator & Artist</p>
                  <p><i className="fa-solid fa-check"></i> Army Veteran</p>
                  <p><i className="fa-solid fa-check"></i> Passionate about Mental Health</p>
                </div>

                <h5 style={{ color: '#18181b', marginTop: '24px', marginBottom: '12px' }}>Connect with me:</h5>
                <div className="d-flex gap-3 flex-wrap">
                  {socialLinks.map((link, idx) => (
                    <a key={idx} href="#" onClick={(e) => e.preventDefault()} className="button-secondary">
                      <i className={`${link.icon} me-2`}></i>{link.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="font-black tracking-widest uppercase text-sm mb-2 block" style={{ color: '#e50914' }}>My Journey</span>
            <h3 className="text-4xl md:text-5xl font-black text-zinc-900 uppercase tracking-tight" style={{ WebkitTextStroke: '0px' }}>Studio Timeline.</h3>
          </div>
          
          <div className="max-w-4xl mx-auto relative">
            {/* Vertical Line */}
            <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-1 bg-gray-200 transform md:-translate-x-1/2"></div>
            
            {timeline.map((item, idx) => (
              <div className={`relative flex flex-col md:flex-row items-center justify-between mb-12 ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`} key={idx}>
                
                {/* Timeline Dot */}
                <div className="absolute left-[16px] md:left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full border-4 border-white shadow-sm z-10" style={{ backgroundColor: '#e50914' }}></div>
                
                {/* Empty Space for alignment on Desktop */}
                <div className="hidden md:block w-5/12"></div>
                
                {/* Content Card */}
                <div className="w-full pl-20 md:pl-0 md:w-5/12">
                  <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                    <span className="inline-block px-4 py-1 font-bold text-sm uppercase tracking-wider rounded-full mb-4" style={{ backgroundColor: 'rgba(229, 9, 20, 0.1)', color: '#e50914' }}>{item.year}</span>
                    <h4 className="text-2xl font-black text-zinc-900 mb-3" style={{ WebkitTextStroke: '0px' }}>{item.title}</h4>
                    <p className="text-zinc-600 text-lg leading-relaxed m-0">{item.text}</p>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div className="bg-zinc-900 rounded-3xl p-10 md:p-16 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] opacity-20 transform translate-x-1/3 -translate-y-1/3" style={{ backgroundColor: '#e50914' }}></div>
            
            <div className="relative z-10 md:w-2/3 mb-8 md:mb-0 text-center md:text-left">
              <h3 className="text-3xl md:text-5xl font-black text-white mb-4" style={{ WebkitTextStroke: '0px' }}>Want to collaborate?</h3>
              <p className="text-zinc-400 text-lg md:text-xl m-0 max-w-2xl leading-relaxed">
                I'm always open to collaborations, commissions, and new creative projects. Let's build something amazing together.
              </p>
            </div>
            
            <div className="relative z-10 md:w-1/3 text-center md:text-right">
              <Link to="/support" className="inline-flex items-center justify-center px-8 py-4 text-white font-bold rounded-full transition-all duration-300 shadow-lg hover:shadow-[rgba(229,9,20,0.4)]" style={{ backgroundColor: '#e50914' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b80710'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e50914'}>
                Get In Touch <i className="fa-solid fa-arrow-right ml-2"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
