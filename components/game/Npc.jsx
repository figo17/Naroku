'use client';

import React from 'react';

/**
 * NPC Component
 * Renders static NPCs like Putri Rara Kuning, Resi, Prajurit, Abdi Dalem.
 * Shows an interaction prompt (Space/Enter or click) when player is adjacent or on click.
 */
export default function Npc({ npc, onInteract, isNearby = false }) {
  const tileSize = 48;

  // Visual variants based on NPC ID
  const getAvatarStyle = () => {
    switch (npc.id) {
      case 'rara_kuning':
      case 'rara_kuning_pulih':
        return {
          bg: 'from-amber-200 to-yellow-500',
          border: 'border-yellow-700',
          label: 'PRK',
          emoji: '👑',
        };
      case 'resi':
      case 'resi_wilis':
        return {
          bg: 'from-stone-200 to-stone-400',
          border: 'border-stone-700',
          label: 'RESI',
          emoji: '🧘',
        };
      case 'prajurit':
        return {
          bg: 'from-red-600 to-amber-900',
          border: 'border-red-950',
          label: 'PRAJ',
          emoji: '🛡️',
        };
      case 'abdi_dalem':
      default:
        return {
          bg: 'from-amber-600 to-amber-800',
          border: 'border-amber-950',
          label: 'ABDI',
          emoji: '🧑',
        };
    }
  };

  const style = getAvatarStyle();

  return (
    <div
      onClick={() => onInteract && onInteract(npc)}
      className="absolute z-20 cursor-pointer group select-none transition-transform hover:scale-105"
      style={{
        transform: `translate3d(${npc.x * tileSize}px, ${npc.y * tileSize}px, 0)`,
        width: `${tileSize}px`,
        height: `${tileSize}px`,
      }}
      title={`Klik kanggo rembugan karo ${npc.name}`}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Interaction pulse if player is nearby */}
        {isNearby && (
          <div className="absolute -top-6 bg-yellow-400 text-stone-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-yellow-600 animate-bounce flex items-center gap-1">
            <span>[Spasi]</span> Rembugan
          </div>
        )}

        {/* Shadow */}
        <div className="absolute bottom-1 w-6 h-2 bg-black/40 rounded-full blur-[1px]" />

        {/* NPC Body Placeholder */}
        <div
          className={`w-9 h-10 rounded-t-lg bg-gradient-to-b ${style.bg} border-2 ${style.border} shadow-md flex flex-col items-center justify-between p-0.5`}
        >
          <div className="w-5 h-4 bg-amber-100 rounded-full border border-stone-800 flex items-center justify-center text-[9px]">
            {style.emoji}
          </div>
          <div className="text-[7px] font-bold text-stone-900 bg-amber-200/80 px-1 rounded">
            {style.label}
          </div>
        </div>

        {/* Name tag */}
        <div className="absolute -bottom-4 bg-stone-900/80 text-amber-200 text-[8px] font-medium px-1.5 py-0.2 rounded-full whitespace-nowrap border border-amber-600/40">
          {npc.name}
        </div>
      </div>
    </div>
  );
}
