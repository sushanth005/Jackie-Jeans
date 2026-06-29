'use client';

import { useEffect, useRef } from 'react';

interface Dot {
  x: number;
  y: number;
  baseAlpha: number;
  phase: number;
}

export default function AnimatedBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;
    let dots: Dot[] = [];

    const SPACING = 32;
    const DOT_R = 1.1;

    function buildDots() {
      dots = [];
      const cols = Math.ceil(canvas!.width / SPACING) + 2;
      const rows = Math.ceil(canvas!.height / SPACING) + 2;
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          dots.push({
            x: c * SPACING,
            y: r * SPACING,
            baseAlpha: 0.06 + Math.random() * 0.08,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    }

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      buildDots();
    }
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(document.body);

    function draw() {
      frame++;
      const W = canvas!.width;
      const H = canvas!.height;
      ctx!.clearRect(0, 0, W, H);

      // Base background
      ctx!.fillStyle = '#07090F';
      ctx!.fillRect(0, 0, W, H);

      // Slow scrolling offset — denim weave feel
      const scrollX = (frame * 0.25) % SPACING;
      const scrollY = (frame * 0.12) % SPACING;

      // Draw dots
      const t = frame * 0.016;
      for (const d of dots) {
        const px = d.x - scrollX;
        const py = d.y - scrollY;
        const wave = Math.sin(t + d.phase + px * 0.015 + py * 0.01);
        const alpha = Math.max(0, d.baseAlpha + wave * 0.07);
        ctx!.beginPath();
        ctx!.arc(px, py, DOT_R, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(90,125,183,${alpha.toFixed(3)})`;
        ctx!.fill();
      }

      // Primary ambient glow that drifts slowly
      const gx = W * (0.4 + 0.12 * Math.sin(t * 0.18));
      const gy = H * (0.45 + 0.08 * Math.cos(t * 0.22));
      const g1 = ctx!.createRadialGradient(gx, gy, 0, gx, gy, W * 0.55);
      g1.addColorStop(0, `rgba(90,125,183,${(0.07 + 0.03 * Math.sin(t * 0.3)).toFixed(3)})`);
      g1.addColorStop(1, 'transparent');
      ctx!.fillStyle = g1;
      ctx!.fillRect(0, 0, W, H);

      // Secondary softer glow
      const g2x = W * (0.65 + 0.1 * Math.cos(t * 0.14));
      const g2y = H * (0.55 + 0.1 * Math.sin(t * 0.19));
      const g2 = ctx!.createRadialGradient(g2x, g2y, 0, g2x, g2y, W * 0.4);
      g2.addColorStop(0, `rgba(50,80,140,${(0.05 + 0.02 * Math.cos(t * 0.25)).toFixed(3)})`);
      g2.addColorStop(1, 'transparent');
      ctx!.fillStyle = g2;
      ctx!.fillRect(0, 0, W, H);

      animId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
}
