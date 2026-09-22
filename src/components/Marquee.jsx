import React from 'react';

const tickerItems = [
  'Original Artworks & Animations',
  'Immersive Storytelling',
  'Read, Bookmark, Purchase & Subscribe',
  'Modern Pulp & Heroic Pop-Art',
  'Comixo Digital Comics',
];

function Strip() {
  return (
    <div className="gf-marquee-strip">
      {tickerItems.map((item, idx) => (
        <React.Fragment key={idx}>
          <span className="gf-marquee-item">{item}</span>
          <i className="gf-marquee-spark">✦</i>
        </React.Fragment>
      ))}
    </div>
  );
}

export default function Marquee() {
  return (
    <section
      aria-label="Greyfire Studio highlights"
      style={{
        backgroundColor: '#ED3833',
        borderTop: '3px solid #4A3B32',
        borderBottom: '3px solid #4A3B32',
        padding: '22px 0',
        overflow: 'hidden'
      }}
    >
      <div className="gf-marquee">
        <div className="gf-marquee-track">
          <Strip />
          <Strip />
        </div>
      </div>
    </section>
  );
}