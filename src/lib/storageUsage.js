import { useEffect, useState } from 'react';

const KEY = 'gf_site_data_v2';
const LIMIT_BYTES = 5 * 1024 * 1024;

/**
 * Rough read on how much of the origin's localStorage budget the site content
 * is using. Inline (API-less) image uploads are the thing that fills it, so the
 * admin panel shows this instead of failing silently.
 */
export function useStorageUsage() {
  const [state, setState] = useState({ used: 0, limit: LIMIT_BYTES });

  useEffect(() => {
    const measure = () => {
      let used = 0;
      try {
        used = new Blob([localStorage.getItem(KEY) || '']).size;
      } catch {
        used = 0;
      }
      setState({ used, limit: LIMIT_BYTES });
    };

    measure();
    window.addEventListener('storage', measure);
    const timer = setInterval(measure, 1500);
    return () => {
      window.removeEventListener('storage', measure);
      clearInterval(timer);
    };
  }, []);

  return state;
}

export function formatBytes(bytes) {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
