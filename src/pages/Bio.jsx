import React from 'react';

export default function Bio() {
  const socialLinks = [
    { icon: 'fa-brands fa-instagram', label: 'Instagram', href: 'https://www.instagram.com/vtube.rrhapsody', external: true },
    { icon: 'fa-solid fa-envelope', label: 'Email', href: 'mailto:Wolf.357.lord@gmail.com' },
  ];

  return (
    <>
      <section id="about" className="pb-20" style={{ paddingTop: '120px' }}>
        <div className="container">
          <div className="row pt-5 align-items-center">
            <div className="col-lg-5 col-md-9 m-md-auto about-main">
              <img 
                src="images/author img.jpeg" 
                alt="Author" 
                className="img-fluid" 
                style={{ width: '100%', filter: 'none', borderRadius: '12px' }}
              />


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
                <div className="d-flex gap-3 flex-wrap mb-5 pb-4">
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

          <div className="row pt-5 mt-5 align-items-center">
            {/* Text on Left */}
            <div className="col-lg-6">
              <div className="about-txt">
                <span>Creator Intro</span>
                <h3>The Visionary.</h3>
                <p className="pt-2 pb-4">
                  Behind the dynamic panels of Greyfire Studio is a deep-rooted passion for bringing heroic worlds to life. By combining modern storytelling with a strong respect for classic comic artistry, every page is crafted to inspire. The creator builds immersive universes where each character's journey reflects resilience, courage, and the triumph of the human spirit.
                </p>

                <h5 style={{ color: '#18181b', marginTop: '24px', marginBottom: '12px' }}>Connect with me:</h5>
                <div className="d-flex gap-3 flex-wrap mb-5 pb-4">
                  {socialLinks.map((link, idx) => (
                    <a
                      key={`creator-social-${idx}`}
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

            {/* Image on Right */}
            <div className="col-lg-5 offset-lg-1 mt-5 mt-lg-0 m-md-auto about-main">
              <img 
                src="images/author img.jpeg" 
                alt="Creator" 
                className="img-fluid" 
                style={{ width: '100%', filter: 'none', borderRadius: '12px' }}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
