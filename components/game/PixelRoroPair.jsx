'use client';

import React, { useState, useEffect } from 'react';

const PING_PONG = [0, 1, 2, 3, 4, 5, 4, 3, 2, 1];

/**
 * Reusable 6-Frame Pixel Art Walk & Idle Pair (Putri Rara Kuning & Putri Rara Runting)
 */
export default function PixelRoroPair({
  isWalking = false,
  facingLeft = false,
  stepIndex,
  order = 'runting-first',
  heightCss = 'clamp(72px, 20vh, 142px)',
  children,
}) {
  const [autoStep, setAutoStep] = useState(0);

  useEffect(() => {
    if (stepIndex !== undefined || !isWalking) {
      setAutoStep(0);
      return;
    }
    const id = setInterval(() => {
      setAutoStep((s) => (s + 1) % 10);
    }, 85);
    return () => clearInterval(id);
  }, [isWalking, stepIndex]);

  const curStep = stepIndex !== undefined ? stepIndex : autoStep;
  const kuningFrame = isWalking ? PING_PONG[curStep % 10] : 0;
  const runtingFrame = isWalking ? PING_PONG[(curStep + 2) % 10] : 0;
  const kuningPct = (kuningFrame / 5) * 100;
  const runtingPct = (runtingFrame / 5) * 100;

  const kuningEl = (
    <div
      key="kuning"
      aria-label="Putri Rara Kuning"
      style={{
        height: heightCss,
        aspectRatio: '143 / 338',
        backgroundImage: "url('/assets/level2/pixel-walk-kuning.png')",
        backgroundSize: '600% 100%',
        backgroundPosition: `${kuningPct}% 0%`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.82))',
      }}
    />
  );

  const runtingEl = (
    <div
      key="runting"
      aria-label="Putri Rara Runting"
      style={{
        height: `calc(${heightCss} * 0.97)`,
        aspectRatio: '155 / 329',
        backgroundImage: "url('/assets/level2/pixel-walk-runting.png')",
        backgroundSize: '600% 100%',
        backgroundPosition: `${runtingPct}% 0%`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.82))',
      }}
    />
  );

  const first = order === 'kuning-first' ? kuningEl : runtingEl;
  const second = order === 'kuning-first' ? runtingEl : kuningEl;

  return (
    <div className="relative inline-flex flex-col items-center select-none pointer-events-none">
      <style>{`
        @keyframes pixelIdleBreath {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }
        .anim-pixel-idle { animation: pixelIdleBreath 2.2s steps(2, end) infinite; }
      `}</style>

      {/* Preload textures */}
      <div className="hidden" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/level2/pixel-walk-kuning.png" alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/level2/pixel-walk-runting.png" alt="" />
      </div>

      {/* Ground shadow */}
      <div
        className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-[78%] h-3 rounded-full bg-black/55 blur-[2.5px]"
        style={{ transform: `translateX(-50%) scaleX(${isWalking ? 1.06 : 0.96})` }}
      />

      <div
        className={`relative flex items-end ${isWalking ? '' : 'anim-pixel-idle'}`}
        style={{
          transform: facingLeft ? 'scaleX(-1)' : 'scaleX(1)',
          transition: 'transform 0.14s ease-out',
        }}
      >
        {first}
        <div className="-ml-2">{second}</div>
        {children}
      </div>
    </div>
  );
}
