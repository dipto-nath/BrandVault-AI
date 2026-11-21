'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export function AuthAmbientBg() {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const targetPos = useRef({ x: 300, y: 300 });
  const currentPos = useRef({ x: 300, y: 300 });
  const [isReduced, setIsReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReduced(media.matches);
    const handler = (e: MediaQueryListEvent) => setIsReduced(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (isReduced) return;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) return;

    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      // Only track when cursor is within reasonable left bounds (story side focus)
      targetPos.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const loop = () => {
      const ease = 0.08;
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * ease;
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * ease;

      if (spotlightRef.current) {
        spotlightRef.current.style.transform = `translate3d(${currentPos.current.x - 200}px, ${currentPos.current.y - 200}px, 0)`;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, [isReduced]);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none" aria-hidden="true">
      {/* Base Canvas */}
      <div className="absolute inset-0 bg-[#FAF6EF]" />

      {/* Dotted / Fine Grid with Radial Fade */}
      <div
        className="absolute inset-0 opacity-[0.28]"
        style={{
          backgroundImage: `radial-gradient(#16203A 0.75px, transparent 0.75px)`,
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 30% 45%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 30% 45%, black 40%, transparent 100%)',
        }}
      />

      {/* Atmospheric Drifting Color Orbs (transform only, 30-40s loops) */}
      {!isReduced ? (
        <>
          {/* Indigo Orb */}
          <motion.div
            className="absolute -top-[10%] left-[5%] w-[550px] h-[550px] rounded-full blur-[110px]"
            style={{
              background: 'radial-gradient(circle, rgba(59,75,200,0.13) 0%, rgba(59,75,200,0) 70%)',
            }}
            animate={{
              transform: [
                'translate3d(0px, 0px, 0) scale(1)',
                'translate3d(60px, 40px, 0) scale(1.08)',
                'translate3d(-40px, 70px, 0) scale(0.95)',
                'translate3d(0px, 0px, 0) scale(1)',
              ],
            }}
            transition={{
              duration: 34,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Warm Amber Orb */}
          <motion.div
            className="absolute top-[40%] left-[22%] w-[480px] h-[480px] rounded-full blur-[100px]"
            style={{
              background: 'radial-gradient(circle, rgba(232,169,74,0.10) 0%, rgba(232,169,74,0) 70%)',
            }}
            animate={{
              transform: [
                'translate3d(0px, 0px, 0) scale(1)',
                'translate3d(-50px, -45px, 0) scale(1.06)',
                'translate3d(40px, -20px, 0) scale(0.92)',
                'translate3d(0px, 0px, 0) scale(1)',
              ],
            }}
            transition={{
              duration: 38,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Sage Orb */}
          <motion.div
            className="absolute bottom-[5%] left-[2%] w-[520px] h-[520px] rounded-full blur-[120px]"
            style={{
              background: 'radial-gradient(circle, rgba(63,143,107,0.08) 0%, rgba(63,143,107,0) 70%)',
            }}
            animate={{
              transform: [
                'translate3d(0px, 0px, 0) scale(1)',
                'translate3d(45px, -50px, 0) scale(0.95)',
                'translate3d(-35px, 30px, 0) scale(1.05)',
                'translate3d(0px, 0px, 0) scale(1)',
              ],
            }}
            transition={{
              duration: 40,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </>
      ) : (
        <div
          className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(59,75,200,0.08) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Mouse Follow Spotlight (Lerp rAF, 400px radial gradient) */}
      {!isReduced && (
        <div
          ref={spotlightRef}
          className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full blur-[60px] opacity-80 pointer-events-none will-change-transform"
          style={{
            background: 'radial-gradient(circle, rgba(59,75,200,0.08) 0%, transparent 70%)',
          }}
        />
      )}

      {/* 2-3% Subtle Film Grain Overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '160px 160px',
        }}
      />
    </div>
  );
}
