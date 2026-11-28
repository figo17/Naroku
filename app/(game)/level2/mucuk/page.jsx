'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AnalogJoystick from '@/components/game/AnalogJoystick';
import PixelRoroPair from '@/components/game/PixelRoroPair';
import { recordLevel2Mission } from '@/lib/level2Progress';

const START_POS = { x: 18.5, y: 86.0 };
const GATE_TARGET = { x: 70.3, y: 58.8 };
const SPEED_X = 16.5;
const SPEED_Y = 13.0;

export default function Level2MucukPage() {
  const router = useRouter();
  const supabase = createClient();

  const analogRef = useRef({ x: 0, y: 0, active: false });
  const autoWalkRef = useRef(false);
  const walkStopTimerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const doneRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [charPos, setCharPos] = useState(START_POS);
  const charPosRef = useRef(START_POS);
  const [facingLeft, setFacingLeft] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);

  useEffect(() => {
    router.prefetch('/level2/alas');
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!user) router.push('/login?role=murid');
      })
      .finally(() => setLoading(false));
  }, [router, supabase]);

  const playGateChime = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const s = now + i * 0.11;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, s);
        gain.gain.setValueAtTime(0.22, s);
        gain.gain.exponentialRampToValueAtTime(0.001, s + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(s);
        osc.stop(s + 0.5);
      });
    } catch {
      // Ignore audio restriction
    }
  }, []);

  const stepCharacter = useCallback(
    (dx, dy) => {
      if (doneRef.current) return;

      if (dx < -0.02) setFacingLeft(true);
      else if (dx > 0.02) setFacingLeft(false);

      setIsWalking(true);
      if (walkStopTimerRef.current) clearTimeout(walkStopTimerRef.current);
      walkStopTimerRef.current = setTimeout(() => setIsWalking(false), 180);

      const prev = charPosRef.current;
      let nx = Math.max(14, Math.min(88, prev.x + dx));
      let ny = Math.max(58.5, Math.min(94, prev.y + dy));

      // Tembok lan prajurit kiwa-tengen gapura: mung tengah gerbang (65.0..75.5) sing bisa dileboni nganti jero
      if (ny < 67.0 && (nx < 65.0 || nx > 75.5)) {
        if (prev.y >= 67.0) {
          ny = 67.0;
        } else if (prev.x >= 65.0 && prev.x <= 75.5) {
          nx = nx < 65.0 ? 65.0 : 75.5;
        } else {
          ny = 67.0;
        }
      }

      const nextPos = { x: nx, y: ny };
      charPosRef.current = nextPos;
      setCharPos(nextPos);

      // Mentok mlebu tekan njero gerbang kraton -> langsung nyambung menyang /level2/alas
      if (nx >= 65.0 && nx <= 75.5 && ny <= 59.8 && !doneRef.current) {
        doneRef.current = true;
        autoWalkRef.current = false;
        analogRef.current = { x: 0, y: 0, active: false };
        setIsWalking(false);
        playGateChime();
        recordLevel2Mission(supabase, 'mucuk');
        router.push('/level2/alas');
      }
    },
    [playGateChime, router, supabase]
  );

  useEffect(() => {
    if (loading) return;
    const keys = new Set();
    const map = {
      ArrowUp: [0, -1],
      KeyW: [0, -1],
      ArrowDown: [0, 1],
      KeyS: [0, 1],
      ArrowLeft: [-1, 0],
      KeyA: [-1, 0],
      ArrowRight: [1, 0],
      KeyD: [1, 0],
    };

    let rafId = null;
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      if (!doneRef.current && !showStoryModal) {
        let ix = analogRef.current.active ? analogRef.current.x : 0;
        let iy = analogRef.current.active ? analogRef.current.y : 0;

        keys.forEach((k) => {
          ix += map[k][0];
          iy += map[k][1];
        });

        const mag = Math.hypot(ix, iy);
        if (mag > 0.06) {
          autoWalkRef.current = false;
          const norm = mag > 1 ? 1 / mag : 1;
          stepCharacter(ix * norm * SPEED_X * dt, iy * norm * SPEED_Y * dt);
        } else if (autoWalkRef.current) {
          const cur = charPosRef.current;
          // Yen durung sejajar karo lawang gapura, mlaku menyang ngarep undhak-undhakan dhisik banjur mlebu jero gapura
          const targetX = GATE_TARGET.x;
          const targetY = Math.abs(cur.x - GATE_TARGET.x) > 4.5 ? 69.5 : GATE_TARGET.y;
          const vx = targetX - cur.x;
          const vy = targetY - cur.y;
          const dist = Math.hypot(vx, vy);
          if (dist > 0.2) {
            stepCharacter((vx / dist) * SPEED_X * dt, (vy / dist) * SPEED_Y * dt);
          }
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    const onDown = (e) => {
      if (showStoryModal) return;
      if (map[e.code]) {
        e.preventDefault();
        keys.add(e.code);
      } else if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        autoWalkRef.current = true;
      }
    };
    const onUp = (e) => keys.delete(e.code);

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      if (rafId) cancelAnimationFrame(rafId);
      if (walkStopTimerRef.current) clearTimeout(walkStopTimerRef.current);
    };
  }, [loading, showStoryModal, stepCharacter]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#04120a] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm tracking-wide text-amber-200">Mbukak Adegan Lv 2: Mucuk...</p>
      </div>
    );
  }

  // Perspektif: saya cedhak lan mlebu menyang Gerbang Kraton (70.3, 58.8), sprite saya cilik (1.02 -> 0.36)
  const yNorm = Math.max(0, Math.min(1, (charPos.y - 58.5) / 31.5));
  const gateDist = Math.hypot((charPos.x - 70.3) * 0.75, (charPos.y - 58.5) * 1.35);
  const gateProximity = Math.max(0, Math.min(1, gateDist / 42));
  const depthScale = 0.36 + 0.68 * (0.65 * yNorm + 0.35 * gateProximity);

  return (
    <div className="relative w-screen h-screen bg-[#090503] text-stone-100 flex flex-col items-center justify-center overflow-hidden select-none font-sans">
      {/* Container Presisi 1024 x 443 */}
      <div className="relative w-full h-full max-w-[calc(100vh*1024/443)] max-h-[calc(100vw*443/1024)] aspect-[1024/443] overflow-hidden shadow-2xl select-none">
        {/* Latar Anyar Gapura Kraton Polos Tanpa Karakter Cewek Bawaan */}
        <Image
          src="/assets/level2/screen_mucuk_polos.jpg"
          alt="Lv 2 - Mucuk: Gapura Kraton Menyang Alas Gunung Wilis"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
        />

        {/* Navigasi Pojok Kiwa Ndhuwur */}
        <div className="absolute top-2.5 left-4 z-[35] flex items-center gap-2">
          <Link
            href="/level2/nanjak"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold backdrop-blur-md shadow-md active:scale-95 transition-all"
          >
            <span>⬅</span> Tugas Nulis (Nanjak)
          </Link>
          <button
            type="button"
            onClick={() => setShowStoryModal(true)}
            className="px-3 py-1 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-amber-400/60 text-amber-200 text-[10px] sm:text-xs font-bold shadow-md cursor-pointer"
          >
            📜 Dialog
          </button>
        </div>

        {/* Petunjuk Arah Gerbang */}
        <div className="absolute top-2.5 right-4 z-[35] px-3.5 py-1 rounded-full bg-stone-950/90 border border-yellow-400/80 text-yellow-300 font-bold text-[10px] sm:text-xs shadow-lg">
          🚪 Mlaku mlebu nganti mentok Gerbang Kraton!
        </div>

        {/* Indikator Tujuan ing Lawang Gerbang */}
        <div className="absolute left-[70.3%] top-[52.5%] -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-center gap-1">
          <div className="px-2.5 py-0.5 rounded-full bg-amber-950/95 border border-yellow-400 text-yellow-200 text-[9px] sm:text-[10px] font-bold shadow-lg animate-bounce whitespace-nowrap">
            ⬇ Mlebu Gerbang
          </div>
        </div>

        {/* SPRITE 2D PIXEL ART BERGERAK (SAYA CEDHAK GERBANG SAYA CILIK) */}
        <div
          className="absolute z-[28] pointer-events-none"
          style={{
            left: `${charPos.x}%`,
            top: `${charPos.y}%`,
            transform: `translate(-50%, -100%) scale(${depthScale})`,
            transformOrigin: 'bottom center',
          }}
        >
          <PixelRoroPair
            isWalking={isWalking}
            facingLeft={facingLeft}
            heightCss="clamp(74px, 24vh, 148px)"
          />
        </div>

        {/* TOMBOL TRANSPARAN: BANJUR ▶▶ (Mlaku otomatis nganti mentok mlebu gerbang) */}
        <button
          type="button"
          onClick={() => {
            autoWalkRef.current = true;
          }}
          title="Mlaku mlebu Gerbang menyang Alas Gunung Wilis"
          className="absolute left-[68.4%] top-[87.2%] w-[9.8%] h-[7.4%] rounded-lg bg-transparent hover:bg-yellow-400/25 hover:ring-2 hover:ring-yellow-300 hover:shadow-[0_0_20px_rgba(250,204,21,0.7)] active:scale-[0.96] transition-all duration-200 cursor-pointer z-[35] flex items-center justify-center"
        >
          <span className="sr-only">Banjur</span>
        </button>

        {/* KONTROLER ANALOG 360° ING KIWA NGISOR */}
        <AnalogJoystick
          onChange={(v) => {
            analogRef.current = v;
          }}
        />
      </div>

      {/* MODAL: KATRANGAN ADEGAN MUCUK */}
      {showStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md font-sans">
          <div className="relative max-w-lg w-full bg-stone-900 border-2 border-yellow-500/80 rounded-2xl p-6 shadow-2xl text-stone-100">
            <h3 className="text-xl font-serif font-black text-yellow-400 flex items-center gap-2">
              <span>📜</span> Katrangan Adegan: Lv 2 - Mucuk
            </h3>
            <div className="mt-4 space-y-3 text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
              <p>
                <strong>Klimaks Lelampahan:</strong> Amarga perawatan nganggo jamu lan adus ing kraton ora bisa ngilangi larané, Putri Rara Kuning lan Putri Rara Runting mutusake kanggo ngumbara lan tapa brata menyang alas lereng Gunung Wilis.
              </p>
              <div className="p-3.5 rounded-xl bg-amber-950/50 border border-yellow-500/40 text-yellow-200 space-y-1.5">
                <p>
                  <strong>Putri Rara Kuning:</strong> &ldquo;Adhiku... ayo awakdhewe ngumbara ing alas Gunung Wilis, supaya bisa pikantuk tamba.&rdquo;
                </p>
                <p>
                  <strong>Putri Rara Runting:</strong> &ldquo;Iya Mbakyu.. ayo!&rdquo;
                </p>
                <p className="text-stone-300 pt-1 border-t border-amber-800/60">
                  <strong>Prajurit Kraton:</strong> &ldquo;Mugi putri tansah dipunparingi keslametan dening Gusti Allah nalikane ngumbara menyang alas Gunung Wilis.&rdquo;
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end items-center gap-2">
              <button
                type="button"
                onClick={() => setShowStoryModal(false)}
                className="px-5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-black text-xs shadow-md cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
