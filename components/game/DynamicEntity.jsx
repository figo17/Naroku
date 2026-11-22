'use client';

import React from 'react';

/**
 * DynamicEntity Component
 * Handles patrol enemies (Macan) and environmental platforms (Kayu Bergerak).
 * Styled with hardware-accelerated translate3d.
 */
export default function DynamicEntity({ entity }) {
  const tileSize = 48;
  const isMacan = entity.type === 'macan';
  const isKayu = entity.type === 'kayu';

  return (
    <div
      className="absolute z-20 transition-transform duration-300 ease-in-out pointer-events-none select-none"
      style={{
        transform: `translate3d(${entity.x * tileSize}px, ${entity.y * tileSize}px, 0)`,
        width: `${tileSize}px`,
        height: `${tileSize}px`,
      }}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Shadow */}
        <div className="absolute bottom-1 w-8 h-2 bg-black/40 rounded-full blur-[1px]" />

        {isMacan && (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 border-2 border-orange-950 shadow-lg flex flex-col items-center justify-center p-1 animate-pulse">
            <span className="text-xl">🐅</span>
            <div className="text-[7px] font-black tracking-widest text-white bg-black/60 px-1 rounded-sm mt-0.5">
              MACAN
            </div>
          </div>
        )}

        {isKayu && (
          <div className="w-11 h-7 rounded-md bg-gradient-to-r from-amber-800 via-yellow-900 to-amber-800 border-2 border-stone-900 shadow-md flex items-center justify-center gap-1">
            <span className="text-xs">🪵</span>
            <div className="text-[7px] font-bold text-amber-200">KAYU</div>
          </div>
        )}

        {/* Name tag */}
        <div className="absolute -bottom-3 bg-black/70 text-[7px] font-medium px-1 rounded text-white whitespace-nowrap">
          {entity.name}
        </div>
      </div>
    </div>
  );
}
