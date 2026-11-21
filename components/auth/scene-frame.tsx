'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';

interface SceneFrameProps {
  children: React.ReactNode;
  className?: string;
  onHoverChange?: (isHovering: boolean) => void;
  ariaLabel?: string;
}

export function SceneFrame({
  children,
  className = '',
  onHoverChange,
  ariaLabel,
}: SceneFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isReduced, setIsReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReduced(media.matches);
    const handler = (e: MediaQueryListEvent) => setIsReduced(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isReduced) return;
      const rect = e.currentTarget.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const normX = (e.clientX - rect.left) / rect.width;
      const normY = (e.clientY - rect.top) / rect.height;

      // Max 4 degrees tilt
      const tiltX = (normX - 0.5) * 8; // -4 to +4
      const tiltY = (normY - 0.5) * -8; // -4 to +4

      setTilt({ x: tiltX, y: tiltY });
      setGlare({
        x: normX * 100,
        y: normY * 100,
        opacity: 0.35,
      });
    },
    [isReduced]
  );

  const handlePointerEnter = useCallback(() => {
    onHoverChange?.(true);
  }, [onHoverChange]);

  const handlePointerLeave = useCallback(() => {
    onHoverChange?.(false);
    setTilt({ x: 0, y: 0 });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  }, [onHoverChange]);

  // Opposite shadow shift
  const shadowX = isReduced ? 0 : -tilt.x * 2.5;
  const shadowY = isReduced ? 16 : tilt.y * 2.5 + 20;

  return (
    <div
      className={`relative w-full select-none ${className}`}
      style={{ perspective: 1200 }}
      role="region"
      aria-label={ariaLabel}
    >
      <div
        ref={frameRef}
        data-scene-frame="true"
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        className="relative w-full rounded-[6px] transition-transform duration-200 ease-out will-change-transform"
        style={{
          transform: isReduced
            ? 'none'
            : `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
          boxShadow: `${shadowX}px ${shadowY}px 36px rgba(22, 32, 58, 0.08), 0 1px 3px rgba(22, 32, 58, 0.05)`,
        }}
      >
        {children}

        {/* Paper-sheen glare overlay */}
        {!isReduced && (
          <div
            className="pointer-events-none absolute inset-0 rounded-[6px] transition-opacity duration-300 z-30"
            style={{
              opacity: glare.opacity,
              background: `radial-gradient(circle 380px at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0) 70%)`,
              mixBlendMode: 'overlay',
            }}
          />
        )}
      </div>
    </div>
  );
}
