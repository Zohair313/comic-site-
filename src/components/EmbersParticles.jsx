import { useEffect, useRef } from 'react';

const COLORS = ['#333333', '#333333', '#1a1a1a', '#1a1a1a', '#8b0000'];
const COUNT = 260;

export default function EmbersParticles({ className }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let raf = 0;
    let running = true;
    let particles = [];

    const spawn = () => ({
      x: Math.random() * width,
      y: -6 - Math.random() * height * 0.3,
      r: 0.7 + Math.random() * 2.3,
      vx: (Math.random() - 0.5) * 0.18,
      vy: 0.3 + Math.random() * 0.5,
      a: 0.3 + Math.random() * 0.5,
      c: COLORS[Math.floor(Math.random() * COLORS.length)],
      wa: Math.random() * Math.PI * 2,
      ws: 0.2 + Math.random() * 0.5,
    });

    const size = () => {
      const rect = parent.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (_t) => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx + Math.sin(p.wa) * 0.04;
        p.y += p.vy;
        p.wa += p.ws * 0.02;
        if (p.y - p.r > height) {
          Object.assign(p, spawn());
        }
        if (p.x < -p.r) p.x = width + p.r;
        if (p.x > width + p.r) p.x = -p.r;
        ctx.globalAlpha = p.a;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    size();
    particles = Array.from({ length: COUNT }, () => spawn());
    if (reduced) {
      draw(0);
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(() => size());
    ro.observe(parent);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} style={{ filter: 'blur(1px)' }} aria-hidden="true" />;
}