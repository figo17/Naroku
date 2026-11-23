'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useUIStore } from '@/store/useUIStore';
import { useGameStore } from '@/store/useGameStore';

/**
 * HUD Component
 * Top status bar:
 * - Avatar, Student Name, Class, Quest Stage
 * - Action buttons: Tas (Inventory), Kamus (Glossary), Audio Toggle
 */
export default function HUD({ studentName = 'Dewi Kilisuci' }) {
  const { toggleInventory, toggleGlossary } = useUIStore();
  const { questStage } = useGameStore();
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const questNames = {
    1: 'Babak 1: Lelarane Putri',
    2: 'Babak 2: Ngulandara menyang Wilis',
    3: 'Babak 3: Pamulihan Grojogan',
  };

  const handleAudioToggle = () => {
    setIsAudioMuted((prev) => !prev);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-2 bg-gradient-to-b from-stone-900/90 via-stone-900/70 to-transparent backdrop-blur-[2px] flex items-center justify-between pointer-events-auto">
      {/* Left: Player Profile & Quest Stage */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative w-11 h-11 rounded-full border-2 border-yellow-500 bg-gradient-to-tr from-amber-700 to-yellow-500 flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0">
          <span className="text-xl">👸</span>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-100 text-sm md:text-base tracking-wide drop-shadow-sm">
              {studentName}
            </span>
          </div>
          <div className="text-xs font-medium text-yellow-400/90 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
            <span>{questNames[questStage] || `Babak ${questStage}`}</span>
          </div>
        </div>
      </div>

      {/* Right: Quick Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Peta Petualangan */}
        <Link
          href="/peta"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-950/80 hover:bg-teal-900 border-2 border-teal-600 text-teal-100 text-xs sm:text-sm font-semibold shadow-md active:scale-95 transition-all"
          title="Bali menyang Peta Petualangan"
        >
          <span className="text-base sm:text-lg">🗺️</span>
          <span className="hidden sm:inline">Peta</span>
        </Link>

        {/* Tas / Inventory */}
        <button
          onClick={() => toggleInventory(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-900/80 hover:bg-amber-800 border-2 border-amber-600 text-amber-100 text-xs sm:text-sm font-semibold shadow-md active:scale-95 transition-all"
          title="Bukak Tas Barang (I)"
        >
          <span className="text-base sm:text-lg">🎒</span>
          <span className="hidden sm:inline">Tas</span>
        </button>

        {/* Kamus / Glossary */}
        <button
          onClick={() => toggleGlossary(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 border-2 border-emerald-600 text-emerald-100 text-xs sm:text-sm font-semibold shadow-md active:scale-95 transition-all"
          title="Bukak Pamilihe Tembung (Kamus)"
        >
          <span className="text-base sm:text-lg">📖</span>
          <span className="hidden sm:inline">Kamus</span>
        </button>

        {/* Audio Toggle */}
        <button
          onClick={handleAudioToggle}
          className={`flex items-center justify-center w-9 h-9 rounded-lg border-2 text-sm shadow-md active:scale-95 transition-all ${
            isAudioMuted
              ? 'bg-stone-800 border-stone-600 text-stone-400'
              : 'bg-yellow-700/80 hover:bg-yellow-600 border-yellow-500 text-yellow-100'
          }`}
          title={isAudioMuted ? 'Uripake Suwara' : 'Pateni Suwara'}
        >
          {isAudioMuted ? '🔇' : '🔊'}
        </button>
      </div>
    </header>
  );
}
