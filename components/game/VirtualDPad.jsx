'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { checkCollision } from '@/lib/utils';
import AnalogJoystick from '@/components/game/AnalogJoystick';

/**
 * Virtual Analog Controller for Grid/Map PlayPage (/play)
 */
export default function VirtualDPad({ collisionMatrix, onStep, disabled = false }) {
  const { pos, move, setIsMoving, setDirection } = useGameStore();
  const posRef = useRef(pos);
  const vecRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  const stepGrid = useCallback(
    (dx, dy, dirName) => {
      if (disabled) return;
      const cur = posRef.current;
      const targetX = cur.x + dx;
      const targetY = cur.y + dy;

      if (collisionMatrix && checkCollision(targetX, targetY, collisionMatrix)) {
        setDirection(dirName);
        return;
      }

      move(dx, dy);
      setTimeout(() => setIsMoving(false), 150);
      if (onStep) onStep({ x: targetX, y: targetY });
    },
    [collisionMatrix, disabled, move, onStep, setDirection, setIsMoving]
  );

  useEffect(() => {
    const id = setInterval(() => {
      const { x, y, active } = vecRef.current;
      if (!active || disabled) return;
      if (Math.hypot(x, y) < 0.35) return;

      if (Math.abs(x) >= Math.abs(y)) {
        stepGrid(x > 0 ? 1 : -1, 0, x > 0 ? 'right' : 'left');
      } else {
        stepGrid(0, y > 0 ? 1 : -1, y > 0 ? 'down' : 'up');
      }
    }, 185);
    return () => clearInterval(id);
  }, [disabled, stepGrid]);

  return (
    <AnalogJoystick
      disabled={disabled}
      onChange={(v) => {
        vecRef.current = v;
      }}
      className="fixed bottom-5 right-5 w-28 h-28 sm:w-32 sm:h-32 z-40"
    />
  );
}
