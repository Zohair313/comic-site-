import React from 'react';
import { useSiteData } from '@/context/SiteDataContext';

export default function Bio() {
  const { data } = useSiteData();
  const about = data.about;
  const site = data.site;

  const socialLinks = [
    { icon: 'fa-brands fa-instagram', label: 'Instagram', href: about.instagram || 'https://www.instagram.com', external: true },
    { icon: 'fa-solid fa-envelope', label: 'Email', href: `mailto:${site.contactEmail}` },
  ];

  return (
    <>
      <section id="about" className="pb-20" style={{ paddingTop: '120px' }}>
        <div className="container">
          <div className="row pt-5 align-items-center">
            <div className="col-lg-5 col-md-9 m-md-auto about-main">
              <img 
                src={about.image} 
                alt={about.name} 
                className="img-fluid" 
                style={{ width: '100%', filter: 'none', borderRadius: '12px' }}
              />
            </div>
            <div className="col-lg-6 offset-lg-1 mt-5 mt-lg-0">
              <div className="about-txt">
                <span>{about.eyebrow || 'Creator Bio'}</span>
                <h3>{about.name}.</h3>
                <div className="pt-2 pb-4">
                  {about.paragraphs && about.paragraphs.map((p, idx) => (
                    <p key={idx} className="mb-4">{p}</p>
                  ))}
                </div>
                <div className="check-p">
                  {about.bullets && about.bullets.map((b, idx) => (
                    <p key={idx}><i className="fa-solid fa-check"></i> {b}</p>
                  ))}
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
