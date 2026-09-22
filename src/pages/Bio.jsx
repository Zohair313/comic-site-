import React from 'react';

export default function Bio() {
  const socialLinks = [
    { icon: 'fa-brands fa-instagram', label: 'Instagram', href: 'https://instagram.com/wessley_stangle', external: true },
    { icon: 'fa-solid fa-envelope', label: 'Email', href: 'mailto:Wolf.357.lord@gmail.com' },
  ];

  return (
    <>
      <section id="about" className="pt-5">
        <div className="container">
          <div className="row pt-5 align-items-center">
            <div className="col-lg-5 col-md-9 m-md-auto about-main">
              <img 
                src="images/author img.jpeg" 
                alt="Author" 
                className="img-fluid" 
                style={{ width: '100%', filter: 'none', borderRadius: '12px' }}
              />

              {/* Small note in place of the old stats */}
              <div className="w-full mt-4 p-4 rounded-xl border-l-4 bg-white border-[#ED3833] shadow-md">
                <p className="m-0 !p-0 italic !text-[#4A3B32] !leading-normal !text-lg font-medium !normal-case text-center sm:text-left">
                  <i className="fa-solid fa-quote-left mr-2 text-[#ED3833]" aria-hidden="true"></i>
                  Every panel is drawn by hand — inspired by real heroes, made for real readers.
                </p>
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
                    <a
                      key={idx}
                      href={link.href}
                      {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="button-secondary"
                      aria-label={link.label}
                    >
                      <i className={`${link.icon} me-2`}></i>
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
