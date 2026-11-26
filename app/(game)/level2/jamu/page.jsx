'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AnalogJoystick from '@/components/game/AnalogJoystick';
import PixelRoroPair from '@/components/game/PixelRoroPair';
import { recordLevel2Mission } from '@/lib/level2Progress';

/*
  MISI RESI DARMO (Lv 2 - Mudhun / Ngumpulake Jamu):
  Ngumpulake 4 jinis gegodhongan jamu ing alas Gunung Wilis, saben jinis cacahé 3 (0/3 -> 3/3):
  1. Godhong Tapak Liman (0/3)
  2. Godhong Sirih       (0/3)
  3. Godhong Sambiloto   (0/3)
  4. Godhong Mindi       (0/3)
  Migunakake Sprite 2D Pixel Art (PixelRoroPair) + Kontroler Analog 360° (lan klik langsung).
*/

const START_POS = { x: 38.5, y: 93.5 };
const TARGET_PER_HERB = 3;

const HERB_PLANTS = [
  {
    id: 'tapak_liman',
    name: 'Godhong Tapak Liman',
    shortName: 'Tapak Liman',
    khasiat: 'Ngudhunake benter lan ngempiske abuh gondhok.',
    // Bush hitbox on 16:9 canvas + foot target where 2D sprite stands
    hitbox: { left: '36.5%', top: '18.5%', width: '14.0%', height: '19.5%' },
    badgePos: { left: '43.5%', top: '18.0%' },
    walkX: 43.5,
    walkY: 39.5,
    pillTop: '25.1%',
    cardRowTop: '22.5%',
  },
  {
    id: 'sirih',
    name: 'Godhong Sirih',
    shortName: 'Sirih',
    khasiat: 'Ngresiki kuman ing kulit lan ngurangi gatel-gatel.',
    hitbox: { left: '53.5%', top: '35.0%', width: '13.5%', height: '21.0%' },
    badgePos: { left: '60.2%', top: '34.5%' },
    walkX: 54.8,
    walkY: 55.5,
    pillTop: '36.7%',
    cardRowTop: '34.2%',
  },
  {
    id: 'sambiloto',
    name: 'Godhong Sambiloto',
    shortName: 'Sambiloto',
    khasiat: 'Jamu pait kang mandi kanggo marasake lelara kuning.',
    hitbox: { left: '17.2%', top: '64.5%', width: '14.2%', height: '19.5%' },
    badgePos: { left: '24.3%', top: '64.0%' },
    walkX: 31.5,
    walkY: 81.5,
    pillTop: '48.2%',
    cardRowTop: '45.8%',
  },
  {
    id: 'mindi',
    name: 'Godhong Mindi',
    shortName: 'Mindi',
    khasiat: 'Marasake lelara kulit sisik lan ngresiki racun awak.',
    hitbox: { left: '46.8%', top: '64.0%', width: '13.0%', height: '19.5%' },
    badgePos: { left: '53.3%', top: '63.5%' },
    walkX: 47.2,
    walkY: 81.5,
    pillTop: '59.6%',
    cardRowTop: '57.2%',
  },
];

const INITIAL_COUNTS = {
  tapak_liman: 0,
  sirih: 0,
  sambiloto: 0,
  mindi: 0,
};

export default function Level2NgumpulakeJamuPage() {
  const router = useRouter();
  const supabase = createClient();

  const analogRef = useRef({ x: 0, y: 0, active: false });
  const autoTargetRef = useRef(null); // { id, x, y } when player clicks a bush to walk & pick
  const walkStopTimerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const lastPickTimeRef = useRef({ tapak_liman: 0, sirih: 0, sambiloto: 0, mindi: 0 });
  const completedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const [charPos, setCharPos] = useState(START_POS);
  const charPosRef = useRef(START_POS);
  const [facingLeft, setFacingLeft] = useState(false);
  const [isWalking, setIsWalking] = useState(false);

  const [counts, setCounts] = useState(INITIAL_COUNTS);
  const countsRef = useRef(INITIAL_COUNTS);
  const [floatingPops, setFloatingPops] = useState([]); // [{ key, x, y, text }]
  const [toast, setToast] = useState(null);

  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    router.prefetch('/level2/ngolah');
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!user) router.push('/login?role=murid');
      })
      .finally(() => setLoading(false));
  }, [router, supabase]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const playPickSound = useCallback((stepNum = 1) => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const baseFreq = 523.25 + stepNum * 95;
      [baseFreq, baseFreq * 1.25].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const s = now + i * 0.07;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, s);
        gain.gain.setValueAtTime(0.2, s);
        gain.gain.exponentialRampToValueAtTime(0.001, s + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(s);
        osc.stop(s + 0.34);
      });
    } catch {
      // Ignore audio restriction
    }
  }, []);

  const playVictorySound = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      [523.25, 587.33, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const s = now + i * 0.12;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, s);
        gain.gain.setValueAtTime(0.24, s);
        gain.gain.exponentialRampToValueAtTime(0.001, s + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(s);
        osc.stop(s + 0.6);
      });
    } catch {
      // Ignore audio restriction
    }
  }, []);

  const harvestHerb = useCallback(
    (plant, forceImmediate = false) => {
      const cur = countsRef.current[plant.id] || 0;
      if (cur >= TARGET_PER_HERB) {
        if (forceImmediate) {
          setToast({
            type: 'info',
            text: `✓ ${plant.name} wis jangkep (${TARGET_PER_HERB}/${TARGET_PER_HERB})! Golekana godhong liyane.`,
          });
        }
        return false;
      }

      const now = Date.now();
      const cooldown = forceImmediate ? 180 : 680;
      if (now - (lastPickTimeRef.current[plant.id] || 0) < cooldown) {
        return false;
      }
      lastPickTimeRef.current[plant.id] = now;

      const nextVal = cur + 1;
      const updated = { ...countsRef.current, [plant.id]: nextVal };
      countsRef.current = updated;
      setCounts(updated);

      playPickSound(nextVal);

      const popKey = `${plant.id}-${now}-${Math.random()}`;
      setFloatingPops((prev) => [
        ...prev,
        {
          key: popKey,
          left: plant.badgePos.left,
          top: plant.badgePos.top,
          text: `+1 ${plant.shortName} (${nextVal}/${TARGET_PER_HERB}) ✨`,
        },
      ]);
      setTimeout(() => {
        setFloatingPops((prev) => prev.filter((p) => p.key !== popKey));
      }, 1100);

      const totalPicked = Object.values(updated).reduce((acc, v) => acc + v, 0);
      if (totalPicked >= HERB_PLANTS.length * TARGET_PER_HERB && !completedRef.current) {
        completedRef.current = true;
        analogRef.current = { x: 0, y: 0, active: false };
        autoTargetRef.current = null;
        setIsWalking(false);
        playVictorySound();
        recordLevel2Mission(supabase, 'jamu');
        setToast({
          type: 'success',
          text: '🎉 Jangkep 12/12 godhong! Bali menyang Resi Darmo kanggo ngolah jamu...',
        });
        setTimeout(() => {
          router.push('/level2/ngolah');
        }, 900);
      } else if (nextVal === TARGET_PER_HERB) {
        setToast({
          type: 'success',
          text: `🌿 ${plant.name} jangkep ${TARGET_PER_HERB}/${TARGET_PER_HERB}!`,
        });
      }

      return true;
    },
    [playPickSound, playVictorySound, router, supabase]
  );

  const stepMovement = useCallback(
    (dx, dy, fromAuto = false) => {
      if (completedRef.current) return;

      if (dx < -0.04) setFacingLeft(true);
      else if (dx > 0.04) setFacingLeft(false);

      setIsWalking(true);
      if (walkStopTimerRef.current) clearTimeout(walkStopTimerRef.current);
      walkStopTimerRef.current = setTimeout(() => setIsWalking(false), 150);

      const prev = charPosRef.current;
      const nx = Math.max(19, Math.min(67, prev.x + dx));
      const ny = Math.max(36, Math.min(95, prev.y + dy));
      const next = { x: nx, y: ny };
      charPosRef.current = next;
      setCharPos(next);

      // Proximity harvest when 2D sprite walks near any glowing herb plant
      if (!fromAuto) {
        for (const plant of HERB_PLANTS) {
          const dist = Math.hypot(nx - plant.walkX, ny - plant.walkY);
          if (dist <= 8.8 && (countsRef.current[plant.id] || 0) < TARGET_PER_HERB) {
            harvestHerb(plant, false);
          }
        }
      }
    },
    [harvestHerb]
  );

  // Main 60fps loop for 360° Analog + Keyboard + Click-to-Walk
  useEffect(() => {
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

    let raf;
    const loop = () => {
      if (!completedRef.current) {
        let dx = analogRef.current.active ? analogRef.current.x * 0.62 : 0;
        let dy = analogRef.current.active ? analogRef.current.y * 0.62 : 0;
        keys.forEach((k) => {
          dx += map[k][0] * 0.58;
          dy += map[k][1] * 0.58;
        });

        if (Math.hypot(dx, dy) > 0.04) {
          // Manual analog/keyboard overrides auto-walk
          autoTargetRef.current = null;
          stepMovement(dx, dy, false);
        } else if (autoTargetRef.current) {
          const target = autoTargetRef.current;
          const cur = charPosRef.current;
          const vx = target.plant.walkX - cur.x;
          const vy = target.plant.walkY - cur.y;
          const dist = Math.hypot(vx, vy);

          if (dist <= 2.2) {
            harvestHerb(target.plant, true);
            autoTargetRef.current = null;
            setIsWalking(false);
          } else {
            const speed = 0.72;
            stepMovement((vx / dist) * speed, (vy / dist) * speed, true);
          }
        }
      }
      raf = requestAnimationFrame(loop);
    };

    const down = (e) => {
      if (map[e.code]) {
        e.preventDefault();
        keys.add(e.code);
      } else if (e.code === 'Space' || e.code === 'Enter') {
        // Space/Enter picks nearby herb immediately
        const cur = charPosRef.current;
        for (const plant of HERB_PLANTS) {
          if (Math.hypot(cur.x - plant.walkX, cur.y - plant.walkY) <= 11) {
            e.preventDefault();
            harvestHerb(plant, true);
            break;
          }
        }
      }
    };
    const up = (e) => keys.delete(e.code);

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      cancelAnimationFrame(raf);
      if (walkStopTimerRef.current) clearTimeout(walkStopTimerRef.current);
    };
  }, [harvestHerb, stepMovement]);

  const handlePlantClick = (plant) => {
    if (completedRef.current) return;
    const cur = charPosRef.current;
    const dist = Math.hypot(cur.x - plant.walkX, cur.y - plant.walkY);

    if (dist <= 11.5) {
      // Already close -> pick +1 leaf right away!
      if (plant.walkX < cur.x - 1) setFacingLeft(true);
      else if (plant.walkX > cur.x + 1) setFacingLeft(false);
      harvestHerb(plant, true);
    } else {
      // Walk 2D sprite smoothly to that plant, then pick +1 leaf!
      autoTargetRef.current = { plant };
    }
  };

  const handleReset = () => {
    completedRef.current = false;
    autoTargetRef.current = null;
    analogRef.current = { x: 0, y: 0, active: false };
    countsRef.current = { ...INITIAL_COUNTS };
    setCounts({ ...INITIAL_COUNTS });
    charPosRef.current = START_POS;
    setCharPos(START_POS);
    setFacingLeft(false);
    setIsWalking(false);
    setShowSuccessModal(false);
    setToast({
      type: 'info',
      text: '🔄 Tantangan dibaleni! Kumpulna maneh 3 lembar kanggo saben godhong jamu.',
    });
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#06150b] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm tracking-wide text-amber-200">Mbukak Alas Gegodhongan Jamu...</p>
      </div>
    );
  }

  const totalCollected = Object.values(counts).reduce((a, b) => a + b, 0);
  const totalTarget = HERB_PLANTS.length * TARGET_PER_HERB; // 12
  // Perspective scale along forest path (y: 36..95)
  const depthScale = Math.max(0.68, Math.min(1.0, 0.68 + ((charPos.y - 36) / 59) * 0.32));

  return (
    <div className="relative w-screen h-screen bg-[#06150b] text-stone-100 flex items-center justify-center overflow-hidden select-none font-sans">
      {/* Container 16:9 (1024 x 576) */}
      <div className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl select-none">
        <Image
          src="/assets/level2/screen_jamu_mudhun.jpg"
          alt="Lv 2 – Ngumpulake Jamu ing Alas Gunung Wilis"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
        />

        {/* ========================================================
            TOP NAVBAR HITBOXES
           ======================================================== */}
        <Link
          href="/beranda"
          title="Rara Kuning - Bali menyang Beranda"
          className="absolute left-[1.8%] top-[1.0%] w-[20%] h-[7.2%] rounded-md bg-transparent hover:bg-yellow-400/10 cursor-pointer z-30"
        />

        <button
          type="button"
          onClick={() => setShowStoryModal(true)}
          title="Kawruh 4 Gegodhongan Jamu"
          className="absolute left-[83.8%] top-[1.2%] w-[4.0%] h-[6.8%] rounded-full bg-transparent hover:bg-yellow-400/20 cursor-pointer z-30"
        >
          <span className="sr-only">Kawruh Jamu</span>
        </button>

        <button
          type="button"
          onClick={() => setShowHelpModal(true)}
          title="Pituduh Dolanan"
          className="absolute left-[89.1%] top-[1.2%] w-[4.0%] h-[6.8%] rounded-full bg-transparent hover:bg-yellow-400/20 cursor-pointer z-30"
        >
          <span className="sr-only">Pituduh</span>
        </button>

        <button
          type="button"
          onClick={() => setAudioPlaying((p) => !p)}
          title={audioPlaying ? 'Pateni Swara' : 'Uripake Swara'}
          className="absolute left-[94.4%] top-[1.2%] w-[4.0%] h-[6.8%] rounded-full bg-transparent hover:bg-yellow-400/20 cursor-pointer z-30 flex items-center justify-center"
        >
          {audioPlaying && (
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping opacity-80" />
          )}
          <span className="sr-only">Audio</span>
        </button>

        {/* Status Progres Total ing Ngisor Banner Tengah */}
        <div className="absolute left-[45.5%] top-[9.6%] -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-stone-950/85 border border-yellow-400/75 text-yellow-200 text-[10px] sm:text-xs font-bold shadow-lg flex items-center gap-1.5 whitespace-nowrap">
          <span>🍃</span>
          <span>
            Jamu Kakumpul: <strong className="text-yellow-300">{totalCollected}/{totalTarget}</strong>
          </span>
        </div>

        {/* ========================================================
            4 TANAMAN HERBAL INTERAKTIF ING ALAS
           ======================================================== */}
        {HERB_PLANTS.map((plant) => {
          const count = counts[plant.id] || 0;
          const isDone = count >= TARGET_PER_HERB;

          return (
            <React.Fragment key={plant.id}>
              {/* Floating Counter Badge ing Ndhuwur Tanaman */}
              <div
                style={{ left: plant.badgePos.left, top: plant.badgePos.top }}
                className={`absolute -translate-x-1/2 -translate-y-full z-25 pointer-events-none px-2 py-0.5 rounded-full border text-[9px] sm:text-[11px] font-extrabold shadow-md whitespace-nowrap transition-all ${
                  isDone
                    ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200'
                    : count > 0
                    ? 'bg-amber-950/95 border-yellow-300 text-yellow-200 animate-bounce'
                    : 'bg-stone-950/85 border-amber-400/70 text-amber-100'
                }`}
              >
                {isDone ? `✓ ${plant.shortName} (3/3)` : `🌿 ${plant.shortName} ${count}/${TARGET_PER_HERB}`}
              </div>

              {/* Hitbox Tanaman kanggo Klik / Tutul */}
              <button
                type="button"
                onClick={() => handlePlantClick(plant)}
                style={plant.hitbox}
                title={
                  isDone
                    ? `${plant.name} wis jangkep (3/3)`
                    : `Tutul utawa cedhaki nganggo Analog kanggo methik ${plant.name} (${count}/3)`
                }
                className={`absolute rounded-3xl z-20 cursor-pointer transition-all ${
                  isDone
                    ? 'bg-emerald-500/10 ring-2 ring-emerald-400/70'
                    : 'hover:bg-yellow-300/15 hover:ring-2 hover:ring-yellow-300/80 active:scale-95'
                }`}
              >
                <span className="sr-only">{plant.name}</span>
              </button>
            </React.Fragment>
          );
        })}

        {/* ========================================================
            PANEL KANAN (DHAPTAR GODHONG): LIVE COUNTER 0/3 -> 3/3
           ======================================================== */}
        {HERB_PLANTS.map((plant) => {
          const count = counts[plant.id] || 0;
          const isDone = count >= TARGET_PER_HERB;

          return (
            <React.Fragment key={`panel-${plant.id}`}>
              {/* Klik baris kartu ing Dhaptar Godhong uga ngarahake putri menyang tanamane */}
              <button
                type="button"
                onClick={() => handlePlantClick(plant)}
                style={{ top: plant.cardRowTop }}
                title={`${plant.name} (${count}/${TARGET_PER_HERB}) — ${plant.khasiat}`}
                className="absolute left-[74.0%] w-[23.2%] h-[10.0%] rounded-xl bg-transparent hover:bg-amber-400/10 cursor-pointer z-25 transition-all"
              >
                <span className="sr-only">{plant.name}</span>
              </button>

              {/* Live Pill Counter (0/3 .. 3/3) persis ing slot pil coklat */}
              <div
                style={{ top: plant.pillTop }}
                className={`absolute left-[91.3%] w-[5.5%] h-[4.4%] rounded-full z-30 pointer-events-none flex items-center justify-center font-sans font-extrabold text-[9px] sm:text-[11px] md:text-xs tracking-tight shadow-inner transition-colors ${
                  isDone
                    ? 'bg-emerald-800 border border-emerald-300 text-emerald-100 shadow-[0_0_10px_rgba(52,211,153,0.65)]'
                    : count > 0
                    ? 'bg-amber-800 border border-yellow-300 text-yellow-200'
                    : 'bg-[#56380a] text-[#fef3c7]'
                }`}
              >
                {count} / {TARGET_PER_HERB}
              </div>
            </React.Fragment>
          );
        })}

        {/* Floating +1 Pop-up Effects */}
        {floatingPops.map((pop) => (
          <div
            key={pop.key}
            style={{ left: pop.left, top: pop.top }}
            className="absolute -translate-x-1/2 -translate-y-6 z-40 pointer-events-none px-2.5 py-1 rounded-full bg-emerald-950/95 border border-emerald-300 text-emerald-200 text-[10px] sm:text-xs font-black shadow-xl animate-bounce whitespace-nowrap"
          >
            {pop.text}
          </div>
        ))}

        {/* ========================================================
            SPRITE 2D PIXEL ART RARA KUNING & RARA RUNTING
           ======================================================== */}
        <div
          className="absolute z-30 pointer-events-none"
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
            heightCss="clamp(64px, 17.5vh, 124px)"
          />
        </div>

        {/* ========================================================
            EMULATOR KONTROLER ANALOG 360° (NUTUPI D-PAD STATIS)
           ======================================================== */}
        <AnalogJoystick
          disabled={showSuccessModal}
          onChange={(v) => {
            analogRef.current = v;
          }}
        />

        {/* Navigasi Cilik Bali menyang Dhawuhe Resi Darmo */}
        <div className="absolute bottom-2.5 right-4 z-35 flex items-center gap-2">
          <Link
            href="/level2/mudhun"
            className="px-3 py-1.5 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold shadow-md"
          >
            ⬅ Tantangan Resi Darmo
          </Link>
          {totalCollected >= totalTarget && (
            <button
              type="button"
              onClick={() => setShowSuccessModal(true)}
              className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-stone-950 text-[10px] sm:text-xs font-black shadow-lg cursor-pointer animate-pulse"
            >
              ✓ Lanjut →
            </button>
          )}
        </div>
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] px-4 py-2.5 rounded-2xl border shadow-2xl backdrop-blur-md text-xs sm:text-sm font-bold ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200'
              : 'bg-stone-950/95 border-yellow-400 text-yellow-200'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Modal Rampung Ngumpulake 12 Gegodhongan Jamu */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md font-sans">
          <div className="relative max-w-md w-full bg-stone-900 border-2 border-yellow-500/90 rounded-2xl p-6 shadow-2xl text-stone-100 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-3xl shadow-lg animate-bounce">
              🍵
            </div>
            <h3 className="text-xl font-serif font-black text-yellow-400">
              Jangkep! Gegodhongan Jamu Kasil Dikumpulake!
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
              Alhamdulillah! Rara Kuning lan Rara Runting wis kasil ngumpulake kabeh gegodhongan miturut dhawuhe <strong>Resi Darmo</strong> kanggo diracik dadi jamu usada:
            </p>
            <div className="grid grid-cols-2 gap-2 text-left text-xs bg-stone-950/80 p-3 rounded-xl border border-emerald-500/40">
              {HERB_PLANTS.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-200"
                >
                  <span className="truncate font-semibold">✓ {p.shortName}</span>
                  <span className="font-mono font-bold text-yellow-300">3/3</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-1">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300 text-xs font-bold cursor-pointer"
              >
                Baleni 🔄
              </button>
              <Link
                href="/level2/ngolah"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-stone-950 font-black text-xs sm:text-sm shadow-lg"
              >
                🍵 Lanjut Ngolah Jamu →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kawruh Gegodhongan */}
      {showStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md font-sans">
          <div className="relative max-w-lg w-full bg-stone-900 border-2 border-yellow-500/80 rounded-2xl p-6 shadow-2xl text-stone-100 space-y-4">
            <h3 className="text-xl font-serif font-black text-yellow-400 flex items-center gap-2">
              <span>📖</span> Kawruh 4 Gegodhongan Jamu Resi Darmo
            </h3>
            <div className="space-y-2.5 text-xs sm:text-sm text-stone-300 font-serif">
              {HERB_PLANTS.map((p) => (
                <p key={p.id}>
                  • <strong className="text-emerald-300">{p.name} (3 lembar):</strong> {p.khasiat}
                </p>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowStoryModal(false)}
                className="px-5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-bold text-xs shadow-md cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pituduh Dolanan */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md font-sans">
          <div className="relative max-w-md w-full bg-stone-900 border-2 border-yellow-500/80 rounded-2xl p-6 shadow-2xl text-stone-100 space-y-3">
            <h3 className="text-lg font-serif font-black text-yellow-400 flex items-center gap-2">
              <span>❓</span> Pituduh Ngumpulake Jamu
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
              1. Gerakake putri nganggo <strong>Analog 360°</strong> ing pojok kiwa ngisor (utawa tombol Panah / WASD) nyedhaki tanduran jamu sing sumunar.<br />
              2. Sampeyan uga bisa langsung <strong>nutul (klik)</strong> tanduran jamu supaya putri mlaku methik godhonge.<br />
              3. Kumpulna <strong>3 lembar (3/3)</strong> kanggo saben jinis: <em>Tapak Liman, Sirih, Sambiloto, lan Mindi</em>!
            </p>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-black text-xs shadow-md cursor-pointer"
              >
                Ngerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
