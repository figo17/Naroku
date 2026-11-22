'use client';

import React, { useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { checkCollision } from '@/lib/utils';

/**
 * Player Component
 * Represents Dewi Kilisuci.
 * Handles keyboard events (WASD / Arrows) and coordinates movement on the 48px grid.
 */
export default function Player({ collisionMatrix, onStep, disabled = false }) {
  const { pos, direction, isMoving, move, setIsMoving } = useGameStore();

  const handleKeyDown = useCallback(
    (e) => {
      if (disabled) return;

      const key = e.key.toLowerCase();
      let dx = 0;
      let dy = 0;

      if (key === 'arrowup' || key === 'w') {
        dy = -1;
      } else if (key === 'arrowdown' || key === 's') {
        dy = 1;
      } else if (key === 'arrowleft' || key === 'a') {
        dx = -1;
      } else if (key === 'arrowright' || key === 'd') {
        dx = 1;
      } else {
        return;
      }

      e.preventDefault();

      const targetX = pos.x + dx;
      const targetY = pos.y + dy;

      // Check collision
      if (collisionMatrix && checkCollision(targetX, targetY, collisionMatrix)) {
        // Can't walk into obstacle/wall/water
        // Still update direction
        let dir = 'down';
        if (dx > 0) dir = 'right';
        else if (dx < 0) dir = 'left';
        else if (dy > 0) dir = 'down';
        else if (dy < 0) dir = 'up';
        useGameStore.getState().setDirection(dir);
        return;
      }

      // Execute step
      move(dx, dy);

      // Reset moving state briefly for sprite animation effect
      setTimeout(() => {
        setIsMoving(false);
      }, 150);

      if (onStep) {
        onStep({ x: targetX, y: targetY });
      }
    },
    [disabled, pos, collisionMatrix, move, setIsMoving, onStep]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const tileSize = 48;

  // Direction indicators or sprite placeholder
  const directionIndicator = {
    up: '▲',
    down: '▼',
    left: '◄',
    right: '►',
  }[direction] || '▼';

  return (
    <div
      className="absolute z-30 transition-transform duration-150 ease-linear pointer-events-none"
      style={{
        transform: `translate3d(${pos.x * tileSize}px, ${pos.y * tileSize}px, 0)`,
        width: `${tileSize}px`,
        height: `${tileSize}px`,
      }}
    >
      {/* Sprite Container */}
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Shadow */}
        <div className="absolute bottom-1 w-7 h-2 bg-black/40 rounded-full blur-[1px]" />

        {/* Dewi Kilisuci Character Placeholder */}
        <div
          className={`w-9 h-10 rounded-t-lg bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-600 border-2 border-amber-900 shadow-md flex flex-col items-center justify-between p-0.5 transform ${
            isMoving ? 'scale-105 -translate-y-0.5' : ''
          } transition-transform`}
        >
          {/* Head & Hair with Sanggul */}
          <div className="w-5 h-4 bg-amber-100 rounded-full border border-amber-900 flex items-center justify-center relative">
            {/* Sanggul or crown */}
            <div className="absolute -top-1 w-3 h-2 bg-yellow-500 rounded-t-full border border-amber-800" />
            <span className="text-[7px] text-amber-950 font-bold">{directionIndicator}</span>
          </div>

          {/* Kebaya / Jarik Traditional Body */}
          <div className="w-6 h-5 bg-gradient-to-b from-emerald-700 to-amber-900 rounded-b-md flex items-center justify-center text-[7px] font-bold text-amber-200">
            DK
          </div>
        </div>

        {/* Name tag */}
        <div className="absolute -top-4 bg-black/70 text-yellow-300 text-[9px] font-semibold px-1.5 py-0.2 rounded-full whitespace-nowrap border border-yellow-500/40 shadow">
          Dewi Kilisuci
        </div>
      </div>
    </div>
  );
}
