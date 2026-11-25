'use client';

import React, { useState, useRef, useCallback } from 'react';

/**
 * Reusable 360-degree Virtual Analog Joystick (Touch & Mouse)
 * Covers any legacy painted D-pad in bottom-left and emits continuous { x, y, active } in [-1..1].
 */
export default function AnalogJoystick({
  onChange,
  onStart,
  disabled = false,
  className = 'absolute left-[0.6%] bottom-[2.2%] w-[16.2%] h-[24.5%] min-w-[88px] min-h-[88px] z-40',
}) {
  const ringRef = useRef(null);
  const draggingRef = useRef(false);
  const [knob, setKnob] = useState({ x: 0, y: 0, active: false });

  const emit = useCallback(
    (nx, ny, active) => {
      setKnob({ x: nx, y: ny, active });
      if (onChange) onChange({ x: nx, y: ny, active });
    },
    [onChange]
  );

  const updateFromClient = useCallback(
    (clientX, clientY) => {
      const el = ringRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const maxR = rect.width * 0.33;
      const dx = clientX - (rect.left + rect.width / 2);
      const dy = clientY - (rect.top + rect.height / 2);
      const dist = Math.hypot(dx, dy);

      if (dist < 2) {
        emit(0, 0, true);
        return;
      }

      const clamped = Math.min(dist, maxR);
      const angle = Math.atan2(dy, dx);
      const nx = (Math.cos(angle) * clamped) / maxR;
      const ny = (Math.sin(angle) * clamped) / maxR;
      emit(nx, ny, true);
    },
    [emit]
  );

  const handlePointerDown = (e) => {
    if (disabled) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    if (onStart) onStart();
    updateFromClient(e.clientX, e.clientY);
  };

  const handlePointerMove = (e) => {
    if (!draggingRef.current || disabled) return;
    updateFromClient(e.clientX, e.clientY);
  };

  const handleRelease = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    emit(0, 0, false);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handleRelease}
      onPointerCancel={handleRelease}
      title="Analog Kontroler (Tahan & geser 360°)"
      aria-label="Analog Kontroler"
      className={`${className} rounded-2xl bg-[#090d0a]/95 border border-yellow-500/40 shadow-[0_8px_24px_rgba(0,0,0,0.92)] backdrop-blur-md touch-none select-none cursor-grab active:cursor-grabbing flex items-center justify-center p-1.5 ${
        disabled ? 'opacity-45 pointer-events-none' : ''
      }`}
    >
      {/* Circular Analog Track */}
      <div
        ref={ringRef}
        className={`relative h-full aspect-square max-w-full rounded-full bg-stone-900/95 border-2 transition-shadow flex items-center justify-center ${
          knob.active
            ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.55)]'
            : 'border-amber-500/65 shadow-inner'
        }`}
      >
        <div className="absolute inset-[16%] rounded-full border border-amber-400/25 pointer-events-none" />
        <span className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-yellow-400/50 pointer-events-none" />
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-yellow-400/50 pointer-events-none" />
        <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-yellow-400/50 pointer-events-none" />
        <span className="absolute right-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-yellow-400/50 pointer-events-none" />

        {/* Draggable Thumbstick Knob */}
        <div
          style={{
            transform: `translate3d(${knob.x * 58}%, ${knob.y * 58}%, 0)`,
            transition: knob.active ? 'none' : 'transform 0.18s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          className={`w-[44%] h-[44%] rounded-full border-2 flex items-center justify-center pointer-events-none ${
            knob.active
              ? 'bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 border-yellow-100 shadow-[0_0_14px_rgba(250,204,21,0.9)]'
              : 'bg-gradient-to-br from-amber-400 via-amber-600 to-stone-800 border-yellow-300/85 shadow-[0_4px_10px_rgba(0,0,0,0.85)]'
          }`}
        >
          <div className="w-[42%] h-[42%] rounded-full bg-yellow-100/45" />
        </div>
      </div>
    </div>
  );
}
