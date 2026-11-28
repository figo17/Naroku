'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AnalogJoystick from '@/components/game/AnalogJoystick';
import { recordLevel2Mission } from '@/lib/level2Progress';

const NGOLAH_STEPS = [
  {
    step: 1,
    title: 'Resikna godhong-godhongé',
    icon: '💧',
    desc: 'Gegodhongan jamu dikumbah resik nganggo banyu suci supaya ilang regedané.',
    rowTop: '24.8%',
  },
  {
    step: 2,
    title: 'Iris cilik-cilik',
    icon: '🔪',
    desc: 'Gegodhongan sing wis resik diiris alus ing talenan kayu supaya sariné gampang metu.',
    rowTop: '38.8%',
  },
  {
    step: 3,
    title: 'Ulek nganti halus',
    icon: '🪨',
    desc: 'Resi Darmo ngulek irisan gegodhongan ing lumpang watu nganti dadi lumat.',
    rowTop: '52.2%',
  },
  {
    step: 4,
    title: 'Rebus karo banyu nganti mateng',
    icon: '🔥',
    desc: 'Racikan jamu digodhog ing kendhil lemah ing ndhuwur geni nganti umob lan siap diombe.',
    rowTop: '65.8%',
  },
];

const BASKET_ITEMS = [
  {
    id: 'andong',
    name: 'Godhong Andong',
    left: '5.5%',
    info: '🍃 Godhong Andong: Ngudhunake benter lan mbiyantu ngempiske abuh gondhok.',
  },
  {
    id: 'sirih',
    name: 'Godhong Sirih',
    left: '20.0%',
    info: '🍃 Godhong Sirih: Ngresiki kuman kulit lan ngurangi gatel-gatel.',
  },
  {
    id: 'sambiloto',
    name: 'Godhong Sambiloto',
    left: '33.2%',
    info: '🍃 Godhong Sambiloto: Jamu pait kang mandi kanggo marasake lelara kuning.',
  },
  {
    id: 'meniran',
    name: 'Godhong Meniran',
    left: '46.5%',
    info: '🍃 Godhong Meniran: Nguwatake daya tahan awak lan marasake lelara kulit.',
  },
];

export default function Level2NgolahJamuPage() {
  const router = useRouter();
  const supabase = createClient();

  const audioCtxRef = useRef(null);
  const lastUlekSoundRef = useRef(0);
  const analogRef = useRef({ x: 0, y: 0, active: false });
  const prevInputRef = useRef({ x: 0, y: 0 });
  const ulekAccumRef = useRef(0);
  const prevFrameRef = useRef(0);
  const ulekProgressRef = useRef(0);
  const completedStepsRef = useRef([]);
  const ulekHintShownRef = useRef(false);
  const grindStopTimerRef = useRef(null);
  const lastFleckTimeRef = useRef(0);

  const [loading, setLoading] = useState(true);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]); // [1, 2, 3, 4]
  const [resiFrame, setResiFrame] = useState(0); // 0..5 dikontrol langsung saka Analog
  const [ulekProgress, setUlekProgress] = useState(0); // 0..100%
  const [isGrinding, setIsGrinding] = useState(false);
  const [herbFlecks, setHerbFlecks] = useState([]);
  const [toast, setToast] = useState(null);

  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    completedStepsRef.current = completedSteps;
  }, [completedSteps]);

  useEffect(() => {
    router.prefetch('/level2/ngunjuk');
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!user) router.push('/login?role=murid');
      })
      .finally(() => setLoading(false));
  }, [router, supabase]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const playUlekSound = useCallback(() => {
    if (typeof window === 'undefined') return;
    const nowMs = performance.now();
    if (nowMs - lastUlekSoundRef.current < 145) return;
    lastUlekSoundRef.current = nowMs;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(145, now);
      osc.frequency.exponentialRampToValueAtTime(62, now + 0.085);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.008, now + 0.095);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Ignore audio restriction
    }
  }, []);

  const playStepTone = useCallback((stepNum = 1, isFinal = false) => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const notes = isFinal
        ? [523.25, 587.33, 659.25, 783.99, 1046.5]
        : [440 + stepNum * 75, 554.37 + stepNum * 75];

      notes.forEach((freq, i) => {
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

  const finalizeStep3IfReady = useCallback(
    (currentSteps, progVal) => {
      if (
        progVal >= 100 &&
        currentSteps.includes(1) &&
        currentSteps.includes(2) &&
        !currentSteps.includes(3)
      ) {
        const nextSteps = [...currentSteps, 3];
        completedStepsRef.current = nextSteps;
        setCompletedSteps(nextSteps);
        playStepTone(3, false);
        setToast({
          type: 'success',
          text: '🪨 Tahap 3 rampung: Gegodhongan wis alus diulek! Lanjut klik Tahap 4 (Rebus jamu)!',
        });
        return true;
      }
      return false;
    },
    [playStepTone]
  );

  // Loop Kontrol Analog & Keyboard kanggo Ngulek Jamu (6-Frame Resi Darmo)
  useEffect(() => {
    if (loading) return;
    const activeKeys = new Set();
    const keyVec = {
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
      const dtSec = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      let ax = analogRef.current.active ? analogRef.current.x : 0;
      let ay = analogRef.current.active ? analogRef.current.y : 0;

      if (!analogRef.current.active && activeKeys.size > 0) {
        activeKeys.forEach((code) => {
          const v = keyVec[code];
          if (v) {
            ax += v[0];
            ay += v[1];
          }
        });
        const kLen = Math.hypot(ax, ay);
        if (kLen > 1) {
          ax /= kLen;
          ay /= kLen;
        }
      }

      const mag = Math.min(1, Math.hypot(ax, ay));
      const deltaMove = Math.hypot(ax - prevInputRef.current.x, ay - prevInputRef.current.y);
      prevInputRef.current = { x: ax, y: ay };

      const activelyMoving = analogRef.current.active || activeKeys.size > 0;
      if (activelyMoving && (mag > 0.14 || deltaMove > 0.018)) {
        setIsGrinding(true);
        if (grindStopTimerRef.current) clearTimeout(grindStopTimerRef.current);
        grindStopTimerRef.current = setTimeout(() => setIsGrinding(false), 180);

        // Muter / goyangake analog nyepetake ulekan; nahan arah uga tetep ngulek alus
        const frameInc = Math.min(
          0.52,
          deltaMove * 1.15 + (mag > 0.16 ? mag * 5.2 * dtSec : 0)
        );

        const prevCycleStep = Math.floor(ulekAccumRef.current / 3);
        ulekAccumRef.current += frameInc;
        const nextCycleStep = Math.floor(ulekAccumRef.current / 3);

        const nextFrame = Math.floor(ulekAccumRef.current) % 6;
        if (nextFrame !== prevFrameRef.current) {
          prevFrameRef.current = nextFrame;
          setResiFrame(nextFrame);
        }

        if (nextCycleStep !== prevCycleStep) {
          playUlekSound();
        }

        if (now - lastFleckTimeRef.current > 190) {
          lastFleckTimeRef.current = now;
          const fid = `${Math.round(now)}-${Math.random().toString(36).slice(2, 6)}`;
          const newFleck = {
            id: fid,
            dx: (Math.random() - 0.5) * 34,
            dy: -(Math.random() * 24 + 10),
            rot: Math.random() * 260,
          };
          setHerbFlecks((prev) => [...prev.slice(-7), newFleck]);
        }

        if (ulekProgressRef.current < 100) {
          const prevFloor = Math.floor(ulekProgressRef.current);
          const nextProg = Math.min(100, ulekProgressRef.current + frameInc * 4.2);
          ulekProgressRef.current = nextProg;
          const nextFloor = Math.floor(nextProg);

          if (nextFloor !== prevFloor || nextProg >= 100) {
            setUlekProgress(nextFloor);
          }

          if (nextProg >= 100) {
            const didComplete = finalizeStep3IfReady(completedStepsRef.current, 100);
            if (!didComplete && !ulekHintShownRef.current) {
              ulekHintShownRef.current = true;
              setToast({
                type: 'info',
                text: '✨ Ulekan jamu wis alus (100%)! Klik urut Tahap 1, 2, lan 4 ing panel tengen ya!',
              });
            }
          }
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    const onKeyDown = (e) => {
      if (showStoryModal || showHelpModal) return;
      if (keyVec[e.code]) {
        e.preventDefault();
        activeKeys.add(e.code);
      }
    };
    const onKeyUp = (e) => activeKeys.delete(e.code);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      if (rafId) cancelAnimationFrame(rafId);
      if (grindStopTimerRef.current) clearTimeout(grindStopTimerRef.current);
    };
  }, [finalizeStep3IfReady, loading, playUlekSound, showHelpModal, showStoryModal]);

  const handleTriggerStep = useCallback(
    (stepObj) => {
      const current = completedStepsRef.current;
      const expectedNext = current.length + 1;

      if (current.includes(stepObj.step)) {
        setToast({
          type: 'info',
          text: `✓ Tahap ${stepObj.step} (${stepObj.title}) wis katindakake!`,
        });
        return;
      }

      if (stepObj.step > expectedNext) {
        const needed = NGOLAH_STEPS[expectedNext - 1];
        setToast({
          type: 'warn',
          text: `⚠️ Tindakake urut saka Tahap ${expectedNext} dhisik: "${needed.title}"!`,
        });
        return;
      }

      // Tahap 3 wajib dikontrol nganggo Analog nganti ulekan 100%
      if (stepObj.step === 3 && ulekProgressRef.current < 100) {
        setToast({
          type: 'warn',
          text: `🕹️ Puter / obahna Analog ing ngisor kanggo ngulek jamu nganti alus (${Math.floor(
            ulekProgressRef.current
          )}%/100%)!`,
        });
        return;
      }

      let updated = [...current, stepObj.step];
      // Yen bar ngrampungake Tahap 2 lan ulekan wis 100% sadurunge, Tahap 3 otomatis centhang pisan
      if (stepObj.step === 2 && ulekProgressRef.current >= 100 && !updated.includes(3)) {
        updated = [...updated, 3];
      }

      completedStepsRef.current = updated;
      setCompletedSteps(updated);

      const isAllDone = updated.length === NGOLAH_STEPS.length;
      playStepTone(stepObj.step, isAllDone);

      if (stepObj.step === 2 && updated.includes(3)) {
        setToast({
          type: 'success',
          text: '🪨 Tahap 2 & Tahap 3 (Ulekan 100%) rampung! Saiki klik Tahap 4 (Rebus jamu)!',
        });
      } else if (stepObj.step === 2) {
        setToast({
          type: 'success',
          text: '🔪 Tahap 2 rampung! Saiki puter Analog kanggo ngulek gegodhongan (Tahap 3)!',
        });
      } else {
        setToast({
          type: 'success',
          text: `${stepObj.icon} Tahap ${stepObj.step}: ${stepObj.desc}`,
        });
      }

      if (isAllDone) {
        recordLevel2Mission(supabase, 'ngolah');
        router.push('/level2/ngunjuk');
      }
    },
    [playStepTone, router, supabase]
  );

  const handleAdvanceNextStep = useCallback(() => {
    const current = completedStepsRef.current;
    if (current.length < NGOLAH_STEPS.length) {
      handleTriggerStep(NGOLAH_STEPS[current.length]);
    } else {
      recordLevel2Mission(supabase, 'ngolah');
      router.push('/level2/ngunjuk');
    }
  }, [handleTriggerStep, router, supabase]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (showStoryModal || showHelpModal) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleAdvanceNextStep();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleAdvanceNextStep, showHelpModal, showStoryModal]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#120b05] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm tracking-wide text-amber-200">Nyiapake Piranti Ngolah Jamu Resi Darmo...</p>
      </div>
    );
  }

  const nextStepNum = completedSteps.length + 1;
  const allStepsDone = completedSteps.length === NGOLAH_STEPS.length;
  const resiFramePct = (resiFrame / 5) * 100;
  const isStep3Active = nextStepNum === 3;

  return (
    <div className="relative w-screen h-screen bg-[#120b05] text-stone-100 flex items-center justify-center overflow-hidden select-none font-sans">
      <style>{`
        @keyframes herbFleckPop {
          0%   { opacity: 0.95; transform: translate(0, 0) rotate(0deg) scale(1); }
          100% { opacity: 0; transform: translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(0.45); }
        }
      `}</style>

      {/* Preload Spritesheet 6-Frame Resi Darmo */}
      <div className="hidden" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/level2/resi-ngolah-sheet.png" alt="" />
      </div>

      {/* Container 16:9 (1024 x 576) */}
      <div className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl select-none">
        {/* LAYER 1: Background Bersih Tanpa Kakek */}
        <Image
          src="/assets/level2/screen_ngolah_clean.jpg"
          alt="Lv 2 – Ngolah Jamu Tradhisional Resi Darmo"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center z-0"
        />

        {/* LAYER 2: Sprite Animasi 6-Frame Resi Darmo Ngulek Jamu (Dikontrol Analog) */}
        <div
          aria-label="Resi Darmo Ngulek Gegodhongan Jamu"
          className="absolute pointer-events-none z-10"
          style={{
            left: '32.3%',
            top: '22.6%',
            width: '27.0%',
            height: '61.3%',
            backgroundImage: "url('/assets/level2/resi-ngolah-sheet.png')",
            backgroundSize: '600% 100%',
            backgroundPosition: `${resiFramePct}% 0%`,
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* Cipratan Alus Godhong Jamu nalika Diulek nganggo Analog */}
        {herbFlecks.map((fl) => (
          <div
            key={fl.id}
            className="absolute z-[12] w-2 h-1.5 rounded-full bg-lime-500 border border-emerald-900 pointer-events-none"
            style={{
              left: '44.6%',
              top: '56.2%',
              '--dx': `${fl.dx}px`,
              '--dy': `${fl.dy}px`,
              '--rot': `${fl.rot}deg`,
              animation: 'herbFleckPop 0.65s ease-out forwards',
            }}
          />
        ))}

        {/* LAYER 3: Masking Meja Ngarep, Mangkok Kayu & Kendhil Cilik supaya nutupi ngisor lumpang kanthi alami */}
        <Image
          src="/assets/level2/screen_ngolah_fg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-contain object-center pointer-events-none z-[15]"
        />

        {/* ========================================================
            BAR PROGRES NGULEK JAMU (DIKONTROL ANALOG)
           ======================================================== */}
        <div className="absolute left-[45.8%] top-[10.8%] -translate-x-1/2 z-30 pointer-events-none">
          <div
            className={`px-3 py-1.5 rounded-xl bg-stone-950/90 border shadow-2xl min-w-[165px] sm:min-w-[215px] transition-all ${
              isGrinding
                ? 'border-lime-400 shadow-[0_0_18px_rgba(163,230,53,0.5)] scale-[1.03]'
                : isStep3Active
                ? 'border-yellow-400 shadow-[0_0_16px_rgba(250,204,21,0.45)] animate-pulse'
                : 'border-yellow-500/65'
            }`}
          >
            <div className="flex items-center justify-between gap-2 text-[9px] sm:text-[11px] font-bold mb-1">
              <span className="text-amber-200 whitespace-nowrap">
                🕹️ Ngulek Jamu (Analog)
              </span>
              <span
                className={
                  ulekProgress >= 100 ? 'text-emerald-300 font-black' : 'text-yellow-300 font-black'
                }
              >
                {ulekProgress}%
              </span>
            </div>
            <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden border border-stone-700">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-lime-400 to-emerald-400 transition-all duration-100"
                style={{ width: `${ulekProgress}%` }}
              />
            </div>
          </div>
        </div>

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
          title="Kawruh Ngolah Jamu"
          className="absolute left-[83.8%] top-[1.2%] w-[4.0%] h-[6.8%] rounded-full bg-transparent hover:bg-yellow-400/20 cursor-pointer z-30"
        >
          <span className="sr-only">Kawruh</span>
        </button>

        <button
          type="button"
          onClick={() => setShowHelpModal(true)}
          title="Pituduh Ngolah Jamu"
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

        {/* Interaktif Resi Darmo & Lumpang Watu (Tahap 3) & Kendhil Geni (Tahap 4) */}
        <button
          type="button"
          onClick={() => handleTriggerStep(NGOLAH_STEPS[2])}
          title="Resi Darmo & Lumpang Watu: Puter Analog kanggo ngulek nganti halus (Tahap 3)"
          className="absolute left-[36.5%] top-[28.0%] w-[19.0%] h-[44.5%] rounded-2xl bg-transparent hover:bg-yellow-300/10 hover:ring-2 hover:ring-yellow-300/60 cursor-pointer z-[25] transition-all"
        >
          <span className="sr-only">Ulek Jamu</span>
        </button>

        <button
          type="button"
          onClick={() => handleTriggerStep(NGOLAH_STEPS[3])}
          title="Kendhil Geni: Rebus karo banyu nganti mateng (Tahap 4)"
          className="absolute left-[57.0%] top-[55.5%] w-[13.5%] h-[22.5%] rounded-2xl bg-transparent hover:bg-orange-400/15 hover:ring-2 hover:ring-amber-300/70 cursor-pointer z-[25] transition-all"
        >
          <span className="sr-only">Rebus Jamu</span>
        </button>

        {/* ========================================================
            4 KERANJANG GEGODHONGAN ING MEJA NGISOR
           ======================================================== */}
        {BASKET_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setToast({ type: 'info', text: item.info });
            }}
            style={{ left: item.left }}
            title={item.name}
            className="absolute top-[73.5%] w-[13.2%] h-[22.5%] rounded-2xl bg-transparent hover:bg-yellow-400/10 hover:ring-2 hover:ring-yellow-300/70 cursor-pointer z-[25] transition-all"
          >
            <span className="sr-only">{item.name}</span>
          </button>
        ))}

        {/* ========================================================
            PANEL KANAN: 4 TAHAP NGOLAH JAMU INTERAKTIF
           ======================================================== */}
        {NGOLAH_STEPS.map((st) => {
          const isDone = completedSteps.includes(st.step);
          const isCurrent = st.step === nextStepNum;

          return (
            <button
              key={st.step}
              type="button"
              onClick={() => handleTriggerStep(st)}
              style={{ top: st.rowTop }}
              title={`Tahap ${st.step}: ${st.title}`}
              className={`absolute left-[72.2%] w-[25.5%] h-[11.8%] rounded-xl z-30 cursor-pointer transition-all flex items-center justify-end pr-2 ${
                isDone
                  ? 'bg-emerald-500/15 ring-2 ring-emerald-500/80'
                  : isCurrent
                  ? 'bg-yellow-400/15 ring-2 ring-yellow-400 shadow-[0_0_16px_rgba(250,204,21,0.55)] animate-pulse'
                  : 'hover:bg-amber-400/10'
              }`}
            >
              {isDone && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-800 border border-emerald-300 text-emerald-100 text-[9px] sm:text-[10px] font-black shadow">
                  ✓
                </span>
              )}
              <span className="sr-only">{st.title}</span>
            </button>
          );
        })}

        {/* ========================================================
            ANALOG KONTROLER NGULEK JAMU & TOMBOL AKSI ING POJOK TENGEN NGISOR
           ======================================================== */}
        <div
          className={`absolute right-[22.4%] bottom-[20.8%] z-[35] pointer-events-none px-2 py-0.5 rounded-full border text-[8px] sm:text-[10px] font-bold whitespace-nowrap shadow-md transition-all ${
            isStep3Active && ulekProgress < 100
              ? 'bg-yellow-400 border-yellow-100 text-stone-950 animate-bounce'
              : 'bg-stone-950/90 border-yellow-500/60 text-yellow-300'
          }`}
        >
          🕹️ Puter Analog (Ngulek)
        </div>

        <AnalogJoystick
          className={`absolute right-[22.5%] bottom-[1.8%] w-[11.0%] h-[18.2%] min-w-[74px] min-h-[74px] z-[35] ${
            isStep3Active && ulekProgress < 100
              ? 'ring-2 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.65)]'
              : ''
          }`}
          onChange={(v) => {
            analogRef.current = v;
          }}
        />

        <div className="absolute right-[1.8%] bottom-[2.6%] z-[35] flex flex-col items-end gap-1.5">
          <button
            type="button"
            onClick={handleAdvanceNextStep}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 border border-yellow-200 text-stone-950 font-black text-[10px] sm:text-xs shadow-[0_0_20px_rgba(250,204,21,0.55)] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            {allStepsDone ? (
              <>
                <span>🍵 Jamu Mateng — Banjur</span>
                <span>▶</span>
              </>
            ) : isStep3Active && ulekProgress < 100 ? (
              <>
                <span>🕹️ Ngulek Analog ({ulekProgress}%)</span>
              </>
            ) : (
              <>
                <span>✨ Tindakake Tahap {nextStepNum}/4</span>
                <span>▶</span>
              </>
            )}
          </button>

          <Link
            href="/level2/jamu"
            className="px-3 py-1 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-yellow-500/50 text-yellow-300 text-[9px] sm:text-[11px] font-bold shadow-md"
          >
            ⬅ Ngumpulake Jamu
          </Link>
        </div>
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] px-4 py-2.5 rounded-2xl border shadow-2xl backdrop-blur-md text-xs sm:text-sm font-bold ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-400 text-emerald-100'
              : toast.type === 'warn'
              ? 'bg-amber-950/95 border-yellow-400 text-yellow-200'
              : 'bg-stone-950/95 border-amber-400/80 text-amber-100'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Modal Kawruh Ngolah Jamu */}
      {showStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md font-sans">
          <div className="relative max-w-lg w-full bg-stone-900 border-2 border-yellow-500/80 rounded-2xl p-6 shadow-2xl text-stone-100 space-y-4">
            <h3 className="text-xl font-serif font-black text-yellow-400 flex items-center gap-2">
              <span>📖</span> Kawruh Ngolah Jamu Tradhisional
            </h3>
            <p className="text-xs sm:text-sm text-amber-100 font-serif italic bg-amber-950/45 p-3 rounded-xl border border-yellow-500/30 leading-relaxed">
              &ldquo;Saiki godhong-godhonge wis kumpul. Kula racik dados jamu tradhisional kangge nambani penyakit Rara Kuning lan Rara Runting. Gatekna cara ngolahé, ya.&rdquo;
            </p>
            <div className="space-y-2 text-xs sm:text-sm text-stone-300 font-serif">
              {NGOLAH_STEPS.map((s) => (
                <p key={s.step}>
                  <strong>
                    {s.step}. {s.title}:
                  </strong>{' '}
                  {s.desc}
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

      {/* Modal Pituduh */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md font-sans">
          <div className="relative max-w-md w-full bg-stone-900 border-2 border-yellow-500/80 rounded-2xl p-6 shadow-2xl text-stone-100 space-y-3">
            <h3 className="text-lg font-serif font-black text-yellow-400 flex items-center gap-2">
              <span>❓</span> Pituduh Ngolah Jamu
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
              1. Klik urut <strong>Tahap 1</strong> lan <strong>Tahap 2</strong> ing panel <em>Tahap Ngolah Jamu</em> sisih tengen.<br />
              2. Ing <strong>Tahap 3 (Ulek nganti halus)</strong>, puter utawa obahna <strong>Analog</strong> kanggo ngontrol Resi Darmo ngulek jamu nganti <strong>100%</strong>.<br />
              3. Lanjut klik <strong>Tahap 4 (Rebus jamu)</strong> supaya langsung nyambung menyang adegan ngunjuk jamu!
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
