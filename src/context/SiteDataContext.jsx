import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { isApiConfigured, fetchRemoteContent, saveRemoteContent } from '@/lib/api';

const STORAGE_KEY = 'gf_site_data_v2';

function deepMerge(base, overlay) {
  if (Array.isArray(base) || Array.isArray(overlay)) {
    return overlay === undefined ? base : overlay;
  }
  if (typeof base !== 'object' || base === null || typeof overlay !== 'object' || overlay === null) {
    return overlay === undefined ? base : overlay;
  }
  const out = { ...base };
  for (const key of Object.keys(overlay)) {
    out[key] = deepMerge(base[key], overlay[key]);
  }
  return out;
}

export const defaultData = {
  site: {
    name: 'Greyfire Studio',
    tagline: 'Comic Books & Art Studio',
    email: 'info@greyfirestudio.com',
    contactEmail: 'Wolf.357.lord@gmail.com',
  },
  hero: {
    badge: 'Greyfire Studio presents',
    title: 'Blue Sky 1',
    tag: 'Skyhawk #1',
    snippet: 'The saga begins. A 100% hand-drawn debut — high-octane action, vibrant ink, and real lessons in every panel, made from scratch by one artist.',
    image: 'images/hero-comic-cover.jpg',
    background: 'images/background full page.jpg',
    ctaPrimary: { label: 'Read Now', to: '/reader' },
    ctaSecondary: { label: 'Get Art Book & Cards', to: '/art' },
  },
  marquee: {
    items: [
      'Original Artworks & Animations',
      'Immersive Storytelling',
      'Read, Bookmark, Purchase & Subscribe',
      'Modern Pulp & Heroic Pop-Art',
      'Comixo Digital Comics',
    ],
  },
  about: {
    eyebrow: 'About Me',
    name: 'Wessley',
    role: 'Comic Creator, Artist & Army Veteran',
    intro: "From farm to frontlines to full-page ink — I'm a comic creator, artist and Army veteran. Every panel is drawn by hand to tell stories that heal, inspire, and entertain.",
    image: 'images/author img.jpeg',
    paragraphs: [
      "Welcome to Grey Fire Studio! I'm Wessley — a comic creator, artist, and Army veteran. Growing up on a farm with dyslexia, traditional reading was a challenge until comics opened up a whole new visual world for me.",
      'After serving in the Army with deployments to Iraq and Afghanistan, seeing people do incredible things for those they love gave me a deep appreciation for life, community, and mental health. Grey Fire Studio blends thrilling stories with real lessons on emotional growth and resilience.',
    ],
    bullets: [
      'Comic Creator & Artist',
      'Army Veteran',
      'Passionate about Mental Health',
    ],
    instagram: 'https://www.instagram.com/vtube.rrhapsody',
  },
  blog: {
    eyebrow: 'Studio Blog',
    heading: 'Behind the Scenes & Updates',
    number: '01',
    pill: 'Announcement',
    title: 'Intro Post: A New Adventure Begins',
    body: 'Every page of this comic starts as nothing but blank paper and a pencil. This is the first post from the studio — a look at why Greyfire exists, what Blue Sky 1 means to me, and everything we\'re drawing next. Welcome to the adventure.',
    authorName: 'Wessley',
    authorRole: 'Founder & Artist',
    authorImg: 'images/custom/creator_bio_1787177588804.jpg',
    dateLabel: 'August 22, 2026',
    image: 'images/Comic story pages5.jpg',
    imageBadge: 'WIP Page',
    ctaLabel: 'View All Updates',
    ctaTo: '/lore',
  },
  lore: {
    badge: 'Character Bios',
    heading: 'Meet the Core Cast',
    characters: [
      { name: 'Kaelen', role: 'The Protagonist', desc: 'A young warrior with a mysterious past and a burning desire for justice. He wields the Flame of Aether, an ancient power thought lost forever.', img: 'images/custom/char_kaelen_1787177600102.jpg' },
      { name: 'Lyra', role: 'Master Mage', desc: 'A brilliant tactician who wields elemental magic with devastating precision. She is the last of the Starweavers, a forgotten order of sorcerers.', img: 'images/custom/char_lyra_1787177611766.jpg' },
      { name: 'Draken', role: 'The Antagonist', desc: 'A ruthless warlord seeking to conquer the fractured realms. His power comes from corrupted Aether, twisting the natural order.', img: 'images/custom/char_draken_1787177625172.jpg' },
      { name: 'Elara', role: 'The Guide', desc: 'An ancient spirit trapped in human form, guiding Kaelen on his journey. She remembers the world before the Great Cataclysm.', img: 'images/custom/char_elara_1787177638388.jpg' },
    ],
  },
  reader: {
    heading: 'Read Comics Online.',
    chapters: [
      { id: 1, title: 'Chapter 1: The Awakening', pages: 3 },
      { id: 2, title: 'Chapter 2: Flames of the Past', pages: 4 },
      { id: 3, title: 'Chapter 3: Journey Begins', pages: 3 },
      { id: 4, title: 'Chapter 4: Dark Alliance', pages: 5 },
      { id: 5, title: 'Chapter 5: The Final Stand', pages: 4 },
    ],
    pages: [
      'images/Comic story pages.jpg',
      'images/Comic story pages1.jpg',
      'images/Comic story pages2.jpg',
      'images/Comic story pages3.jpg',
      'images/Comic story pages4.jpg',
      'images/Comic story pages5.jpg',
      'images/Comic story pages6.jpg',
      'images/Comic story pages7.jpg',
      'images/Comic story pages8.jpg',
      'images/Comic story pages9.jpg',
      'images/Comic story pages10.jpg',
    ],
    backLabel: 'Back to Comics',
    backTo: '/comics',
  },
  art: {
    eyebrow: 'Greyfire Studio',
    heading: 'Art Collection',
    description: 'Every panel, sketch, and cover — drawn by hand, panel by panel. Browse the gallery below.',
    categories: ['All', 'Covers', 'Characters', 'Pages', 'Scenes'],
    artworks: [
      { img: 'images/hero-comic-cover.jpg', title: 'Skyhawk #1', category: 'Covers', tag: 'Full Cover Art' },
      { img: 'images/comic cover img.jpg', title: 'Blue Sky 2', category: 'Covers', tag: 'Next Chapter' },
      { img: 'images/skyhawk_landscape.jpg', title: 'The Ashen Skies', category: 'Scenes', tag: 'Landscape Illustration' },
      { img: 'images/custom/char_kaelen_1787177600102.jpg', title: 'Kaelen', category: 'Characters', tag: 'Protagonist' },
      { img: 'images/custom/char_lyra_1787177611766.jpg', title: 'Lyra', category: 'Characters', tag: 'Master Mage' },
      { img: 'images/custom/char_draken_1787177625172.jpg', title: 'Draken', category: 'Characters', tag: 'The Antagonist' },
      { img: 'images/custom/char_elara_1787177638388.jpg', title: 'Elara', category: 'Characters', tag: 'The Guide' },
      { img: 'images/custom/comic_page_1_1787177649462.jpg', title: 'The Awakening', category: 'Pages', tag: 'Story Page' },
      { img: 'images/custom/comic_page_2_1787177662562.jpg', title: 'Into the Flames', category: 'Pages', tag: 'Story Page' },
      { img: 'images/Comic story pages.jpg', title: 'Panel Study I', category: 'Pages', tag: 'Action Layout' },
      { img: 'images/Comic story pages2.jpg', title: 'Panel Study II', category: 'Pages', tag: 'Action Layout' },
      { img: 'images/intro_post.jpeg', title: 'Studio Announcement', category: 'Scenes', tag: 'Release Art' },
    ],
    ctaText: 'Want more art drops, sketches and process videos?',
    ctaLabel: 'About the Artist',
  },
  contact: {
    heading: 'CONTACT PAGE',
    email: 'info@greyfirestudio.com',
    formNote: 'Send your inquiry directly to our email address.',
    socials: [
      {
        label: 'Instagram',
        handle: '@Wessley',
        icon: 'fa-brands fa-instagram',
        href: 'https://www.instagram.com/vtube.rrhapsody',
        external: true,
        badgeClass: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]',
        hoverClass: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]',
      },
      {
        label: 'Email',
        handle: 'info@greyfirestudio.com',
        icon: 'fa-solid fa-envelope',
        href: 'mailto:info@greyfirestudio.com',
        external: false,
        badgeClass: 'bg-gradient-to-br from-[#ED3833] to-[#c92825]',
        hoverClass: 'bg-gradient-to-br from-[#ED3833] to-[#c92825]',
      },
    ],
  },
  footer: {
    about: '100% hand-drawn comics by a solo creator. Stories that inspire, artwork that moves.',
    instagram: 'https://www.instagram.com/vtube.rrhapsody',
    email: 'Wolf.357.lord@gmail.com',
    creditedBy: 'Wessley',
  },
};

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return deepMerge(defaultData, JSON.parse(raw));
  } catch {
    // ignore corrupt storage
  }
  return defaultData;
}

const SiteDataContext = createContext(null);

export function SiteDataProvider({ children }) {
  const [data, setData] = useState(loadLocal);
  const [storage, setStorage] = useState(isApiConfigured ? 'connecting' : 'local');
  const dataRef = useRef(data);
  const syncedOnce = useRef(false);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isApiConfigured) return;
      try {
        const remote = await fetchRemoteContent();
        if (cancelled) return;
        if (remote) {
          const merged = deepMerge(defaultData, remote);
          setData(merged);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } else {
          await saveRemoteContent(dataRef.current);
        }
        setStorage('api');
      } catch {
        if (!cancelled) setStorage('local');
      } finally {
        syncedOnce.current = true;
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // storage full / unavailable — ignore
    }
  }, [data]);

  const updateSection = useCallback((section, value) => {
    setData((prev) => ({ ...prev, [section]: { ...prev[section], ...value } }));
  }, []);

  const resetAll = useCallback(() => setData(defaultData), []);

  const flushSave = useCallback(async () => {
    const snapshot = dataRef.current;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // ignore
    }
    if (!isApiConfigured || !syncedOnce.current) return true;
    try {
      await saveRemoteContent(snapshot);
      return true;
    } catch {
      return false;
    }
  }, []);

  const value = useMemo(
    () => ({ data, storage, updateSection, resetAll, flushSave }),
    [data, storage, updateSection, resetAll, flushSave]
  );

  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>;
}

export function useSiteData() {
  const ctx = useContext(SiteDataContext);
  if (!ctx) throw new Error('useSiteData must be used within a SiteDataProvider');
  return ctx;
}