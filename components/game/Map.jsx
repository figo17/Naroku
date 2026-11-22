'use client';

import React from 'react';

/**
 * Map Component
 * Renders the 2D grid background, collision tiles, river, items, and goal zones.
 * Tile size: 48px
 */
export default function Map({ mapData, onCollectItem }) {
  if (!mapData || !mapData.collisionMatrix) {
    return <div className="text-white p-4">Memuat peta...</div>;
  }

  const { width, height, tileSize = 48, collisionMatrix, completionPoint, items = [] } = mapData;

  return (
    <div
      className="relative select-none"
      style={{
        width: `${width * tileSize}px`,
        height: `${height * tileSize}px`,
      }}
    >
      {/* Grid Tiles */}
      {collisionMatrix.map((row, y) => (
        <div key={`row-${y}`} className="flex" style={{ height: `${tileSize}px` }}>
          {row.map((tileType, x) => {
            // 0: Walkable path / grass / floor
            // 1: Wall / obstacle / tree / rock
            // 2: River / water
            let tileBg = 'bg-amber-100/40 border border-amber-900/10'; // default floor (Keraton/ground)
            let tileContent = null;

            if (mapData.id === 'keraton') {
              if (tileType === 1) {
                tileBg = 'bg-amber-950 border-amber-900 shadow-inner';
                tileContent = (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-amber-500/60 font-mono">
                    🧱
                  </div>
                );
              } else {
                tileBg = 'bg-[#e8d5b5] border-[0.5px] border-amber-800/20';
              }
            } else if (mapData.id === 'hutan_wilis') {
              if (tileType === 1) {
                tileBg = 'bg-emerald-950 border-emerald-900';
                tileContent = (
                  <div className="w-full h-full flex items-center justify-center text-xs opacity-75">
                    🌲
                  </div>
                );
              } else if (tileType === 2) {
                tileBg = 'bg-sky-600/80 animate-pulse border-y border-sky-400/40';
                tileContent = (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-sky-200/50">
                    〰️
                  </div>
                );
              } else {
                tileBg = 'bg-emerald-800/40 border-[0.5px] border-emerald-900/30';
              }
            } else if (mapData.id === 'grojogan') {
              if (tileType === 1) {
                tileBg = 'bg-stone-800 border-stone-700';
                tileContent = (
                  <div className="w-full h-full flex items-center justify-center text-xs opacity-75">
                    🪨
                  </div>
                );
              } else if (tileType === 2) {
                tileBg = 'bg-cyan-600/90 border-cyan-400/50 shadow-lg animate-pulse';
                tileContent = (
                  <div className="w-full h-full flex items-center justify-center text-xs text-white">
                    🌊
                  </div>
                );
              } else {
                tileBg = 'bg-emerald-900/30 border-[0.5px] border-stone-600/30';
              }
            }

            return (
              <div
                key={`tile-${x}-${y}`}
                style={{ width: `${tileSize}px`, height: `${tileSize}px` }}
                className={`relative flex-shrink-0 transition-colors ${tileBg}`}
              >
                {tileContent}
              </div>
            );
          })}
        </div>
      ))}

      {/* Completion Zone (if any) */}
      {completionPoint && (
        <div
          className="absolute z-10 flex items-center justify-center pointer-events-none"
          style={{
            transform: `translate3d(${completionPoint.x * tileSize}px, ${completionPoint.y * tileSize}px, 0)`,
            width: `${tileSize}px`,
            height: `${tileSize}px`,
          }}
        >
          <div className="w-10 h-10 rounded-full border-2 border-yellow-400 bg-yellow-400/30 animate-ping absolute" />
          <div className="w-8 h-8 rounded-full border-2 border-yellow-300 bg-yellow-500/40 flex items-center justify-center text-xs shadow-lg">
            ✨
          </div>
        </div>
      )}

      {/* Ground Items on Map */}
      {items.map((item) => (
        <div
          key={`item-${item.code}`}
          onClick={() => onCollectItem && onCollectItem(item)}
          className="absolute z-10 flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
          style={{
            transform: `translate3d(${item.x * tileSize}px, ${item.y * tileSize}px, 0)`,
            width: `${tileSize}px`,
            height: `${tileSize}px`,
          }}
          title={`${item.nama_item} - Klik kanggo njupuk`}
        >
          <div className="w-9 h-9 bg-amber-400/30 border-2 border-amber-300 rounded-lg flex items-center justify-center text-lg animate-bounce shadow-md">
            🎁
          </div>
        </div>
      ))}
    </div>
  );
}
