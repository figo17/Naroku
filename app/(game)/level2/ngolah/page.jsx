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
  const navLockRef = useRef(false);
  const boostTimerRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]); // [1, 2, 3, 4]
  const [resiFrame, setResiFrame] = useState(0); // 0..5 (6-frame animasi ngulek jamu)
  const [fastPound, setFastPound] = useState(false);
  const [toast, setToast] = useState(null);

  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    router.prefetch('/level2/ngunjuk');
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!user) router.push('/login?role=murid');
      })
      .finally(() => setLoading(false));
  }, [router, supabase]);

  // Loop Animasi 6-Frame Resi Darmo Ngulek Jamu
  useEffect(() => {
    const intervalMs = fastPound ? 75 : 135;
    const timer = setInterval(() => {
      setResiFrame((prev) => (prev + 1) % 6);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [fastPound]);

  useEffect(() => {
    return () => {
      if (boostTimerRef.current) clearTimeout(boostTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3400);
    return () => clearTimeout(t);
  }, [toast]);

  const triggerPoundBurst = useCallback(() => {
    setFastPound(true);
    if (boostTimerRef.current) clearTimeout(boostTimerRef.current);
    boostTimerRef.current = setTimeout(() => setFastPound(false), 1200);
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

  const handleTriggerStep = useCallback(
    (stepObj) => {
      triggerPoundBurst();
      const expectedNext = completedSteps.length + 1;

      if (completedSteps.includes(stepObj.step)) {
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

      const updated = [...completedSteps, stepObj.step];
      setCompletedSteps(updated);

      const isAllDone = updated.length === NGOLAH_STEPS.length;
      playStepTone(stepObj.step, isAllDone);

      setToast({
        type: 'success',
        text: `${stepObj.icon} Tahap ${stepObj.step}: ${stepObj.desc}`,
      });

      if (isAllDone) {
        recordLevel2Mission(supabase, 'ngolah');
        router.push('/level2/ngunjuk');
      }
    },
    [completedSteps, playStepTone, router, supabase, triggerPoundBurst]
  );

  const handleAdvanceNextStep = useCallback(() => {
    if (completedSteps.length < NGOLAH_STEPS.length) {
      handleTriggerStep(NGOLAH_STEPS[completedSteps.length]);
    } else {
      recordLevel2Mission(supabase, 'ngolah');
      router.push('/level2/ngunjuk');
    }
  }, [completedSteps, handleTriggerStep, router, supabase]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (showStoryModal || showHelpModal) return;
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight' || e.code === 'KeyD') {
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

  return (
    <div className="relative w-screen h-screen bg-[#120b05] text-stone-100 flex items-center justify-center overflow-hidden select-none font-sans">
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

        {/* LAYER 2: Sprite Animasi 6-Frame Resi Darmo Ngulek Jamu (Persis Koordinat Acuan) */}
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

        {/* LAYER 3: Masking Meja Ngarep, Mangkok Kayu & Kendhil Cilik supaya nutupi ngisor lumpang kanthi alami */}
        <Image
          src="/assets/level2/screen_ngolah_fg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-contain object-center pointer-events-none z-15"
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
          title="Resi Darmo & Lumpang Watu: Ulek nganti halus (Tahap 3)"
          className="absolute left-[36.5%] top-[28.0%] w-[19.0%] h-[44.5%] rounded-2xl bg-transparent hover:bg-yellow-300/10 hover:ring-2 hover:ring-yellow-300/60 cursor-pointer z-25 transition-all"
        >
          <span className="sr-only">Ulek Jamu</span>
        </button>

        <button
          type="button"
          onClick={() => handleTriggerStep(NGOLAH_STEPS[3])}
          title="Kendhil Geni: Rebus karo banyu nganti mateng (Tahap 4)"
          className="absolute left-[57.0%] top-[55.5%] w-[13.5%] h-[22.5%] rounded-2xl bg-transparent hover:bg-orange-400/15 hover:ring-2 hover:ring-amber-300/70 cursor-pointer z-25 transition-all"
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
              triggerPoundBurst();
              setToast({ type: 'info', text: item.info });
            }}
            style={{ left: item.left }}
            title={item.name}
            className="absolute top-[73.5%] w-[13.2%] h-[22.5%] rounded-2xl bg-transparent hover:bg-yellow-400/10 hover:ring-2 hover:ring-yellow-300/70 cursor-pointer z-25 transition-all"
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
            KONTROL & TOMBOL AKSI ING POJOK TENGEN NGISOR
           ======================================================== */}
        <AnalogJoystick
          className="absolute right-[24.2%] bottom-[2.2%] w-[8.5%] h-[14.2%] min-w-[58px] min-h-[58px] z-35"
          onChange={({ x, active }) => {
            if (!active) return;
            if (x > 0.78 && !navLockRef.current) {
              navLockRef.current = true;
              handleAdvanceNextStep();
              setTimeout(() => {
                navLockRef.current = false;
              }, 550);
            } else if (x < -0.78 && !navLockRef.current) {
              navLockRef.current = true;
              router.push('/level2/jamu');
            }
          }}
        />

        <div className="absolute right-[1.8%] bottom-[2.6%] z-35 flex flex-col items-end gap-1.5">
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
                  <strong>{s.step}. {s.title}:</strong> {s.desc}
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
              1. Klik urut <strong>Tahap 1 nganti Tahap 4</strong> ing panel <em>Tahap Ngolah Jamu</em> sisih tengen (utawa pencet tombol kuning ing tengen ngisor).<br />
              2. Sampeyan uga bisa ngeklik 4 keranjang godhong ing meja kanggo nyumurupi khasiate.<br />
              3. Sawise kabeh 4 tahap rampung, langsung nyambung menyang adegan ngunjuk jamu!
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
