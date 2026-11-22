'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { checkCollision } from '@/lib/utils';

/**
 * VirtualDPad Component
 * On-screen touch/click D-Pad controls for mobile and tablet players.
 */
export default function VirtualDPad({ collisionMatrix, onStep, disabled = false }) {
  const { pos, move, setIsMoving, setDirection } = useGameStore();

  const handleDirectionPress = (dx, dy, dirName) => {
    if (disabled) return;

    const targetX = pos.x + dx;
    const targetY = pos.y + dy;

    if (collisionMatrix && checkCollision(targetX, targetY, collisionMatrix)) {
      setDirection(dirName);
      return;
    }

    move(dx, dy);

    setTimeout(() => {
      setIsMoving(false);
    }, 150);

    if (onStep) {
      onStep({ x: targetX, y: targetY });
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center select-none pointer-events-auto opacity-80 hover:opacity-100 transition-opacity">
      {/* Up Button */}
      <button
        type="button"
        onClick={() => handleDirectionPress(0, -1, 'up')}
        className="w-14 h-14 bg-stone-900/80 active:bg-amber-600 border-2 border-amber-600/70 text-yellow-300 rounded-t-2xl flex items-center justify-center text-xl shadow-lg active:scale-95 transition-all"
        aria-label="Move Up"
      >
        ▲
      </button>

      {/* Middle Row: Left, Center circle, Right */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => handleDirectionPress(-1, 0, 'left')}
          className="w-14 h-14 bg-stone-900/80 active:bg-amber-600 border-2 border-amber-600/70 text-yellow-300 rounded-l-2xl flex items-center justify-center text-xl shadow-lg active:scale-95 transition-all"
          aria-label="Move Left"
        >
          ◄
        </button>

        <div className="w-14 h-14 bg-stone-950/90 border-2 border-amber-700/40 flex items-center justify-center text-amber-500 text-xs font-mono font-bold">
          🕹️
        </div>

        <button
          type="button"
          onClick={() => handleDirectionPress(1, 0, 'right')}
          className="w-14 h-14 bg-stone-900/80 active:bg-amber-600 border-2 border-amber-600/70 text-yellow-300 rounded-r-2xl flex items-center justify-center text-xl shadow-lg active:scale-95 transition-all"
          aria-label="Move Right"
        >
          ►
        </button>
      </div>

      {/* Down Button */}
      <button
        type="button"
        onClick={() => handleDirectionPress(0, 1, 'down')}
        className="w-14 h-14 bg-stone-900/80 active:bg-amber-600 border-2 border-amber-600/70 text-yellow-300 rounded-b-2xl flex items-center justify-center text-xl shadow-lg active:scale-95 transition-all"
        aria-label="Move Down"
      >
        ▼
      </button>
    </div>
  );
}
