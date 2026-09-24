import React from 'react';
import { useSiteData } from '@/context/SiteDataContext';

function Strip({ items }) {
  return (
    <div className="gf-marquee-strip">
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <span className="gf-marquee-item">{item}</span>
          <i className="gf-marquee-spark">✦</i>
        </React.Fragment>
      ))}
    </div>
  );
}

export default function Marquee() {
  const { data } = useSiteData();
  const items = (data.marquee?.items?.length ? data.marquee.items : ['Greyfire Studio']);
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
          <Strip items={items} />
          <Strip items={items} />
        </div>
      </div>
    </section>
  );
}