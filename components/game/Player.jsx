'use client';

import React, { useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { checkCollision } from '@/lib/utils';
import PixelRoroPair from '@/components/game/PixelRoroPair';

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
      <div className="relative w-full h-full flex flex-col items-center justify-end">
        <PixelRoroPair
          isWalking={isMoving}
          facingLeft={direction === 'left'}
          heightCss="54px"
        />

        {/* Name tag */}
        <div className="absolute -top-5 bg-black/75 text-yellow-300 text-[9px] font-semibold px-1.5 py-0.2 rounded-full whitespace-nowrap border border-yellow-500/40 shadow">
          Rara Kuning &amp; Runting
        </div>
      </div>
    </div>
  );
}
