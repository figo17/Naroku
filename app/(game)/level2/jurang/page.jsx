'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Level2JurangTaliPage() {
  const router = useRouter();
  const supabase = createClient();
  const containerRef = useRef(null);
  const audioCtxRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);

  // Core Mission States
  const [isRopeConnected, setIsRopeConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [sparkleActive, setSparkleActive] = useState(false);

  // Animation & Crossing States
  // crossStep: 0 = Tepi Kiri (14%), 1 = Awal Jembatan (32%), 2 = Simpul Tengah (51%), 3 = Nyedhaki Seberang (71%), 4 = Tekan Seberang Kanan (85%)
  const [crossStep, setCrossStep] = useState(0);
  const [animationMode, setAnimationMode] = useState('idle'); // 'idle' | 'walk'
  const [isCrossing, setIsCrossing] = useState(false);
  const [hasCrossed, setHasCrossed] = useState(false);
  const [isSuspendedOverChasm, setIsSuspendedOverChasm] = useState(false);

  // Dialog & Feedback States
  const [toast, setToast] = useState(null);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [activeSpeech, setActiveSpeech] = useState(null);

  // Web Audio Synthesizer
  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Suara Simpul Tali Rotan (Swoosh + Snap)
  const playRopeSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Noise buffer for swoosh
      const bufferSize = ctx.sampleRate * 0.3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + 0.25);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);

      // Snap tone (Tali ketat ditaleni)
      const osc = ctx.createOscillator();
      const snapGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.35);

      snapGain.gain.setValueAtTime(0.5, now + 0.15);
      snapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(snapGain);
      snapGain.connect(ctx.destination);
      osc.start(now + 0.15);
      osc.stop(now + 0.38);
    } catch (err) {
      console.warn('Audio not allowed yet:', err);
    }
  }, [getAudioContext]);

  // Suara Langkah Kaki Menyeberang
  const playStepSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Audio context might be restricted
    }
  }, [getAudioContext]);

  // Suara Gamelan Kemenangan
  const playVictorySound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Tangga nada Slendro / Pelog (C5, D5, E5, G5, A5)
      const notes = [523.25, 587.33, 659.25, 783.99, 880.0];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.14;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.65);
      });
    } catch {
      // ignore
    }
  }, [getAudioContext]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login?role=murid');
          return;
        }

        setCurrentUser(user);

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) setStudentProfile(profile);
      } catch (err) {
        console.error('Error loading level 2 jurang tali data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router, supabase]);

  // Aksi Klik Tombol "Gunakake tali rotan"
  const handleConnectRope = () => {
    if (isRopeConnected || isConnecting) return;

    setIsConnecting(true);
    playRopeSound();
    setSparkleActive(true);

    setToast({
      type: 'info',
      text: '🪢 Narik lan nyambung tali rotan ing ndhuwur jurang...',
    });

    setTimeout(() => {
      // Switch background to screen_jurang_tali_sambung.jpg
      setIsRopeConnected(true);
      setIsConnecting(false);
      setAnimationMode('idle');
      setCrossStep(0); // Mulai dari tepi tebing kiri

      setActiveSpeech('Putri Rara Kuning: "Alhamdulillah! Tali rotan wis kasil ditaleni kanthi kenceng. Ayo saiki nyebrang alon-alon!"');
      setToast({
        type: 'success',
        text: '✨ Kreeek! Tali rotan kasil disambung kanthi kuwat! Ayo sebrangi jembatan tali!',
      });

      // Hilangkan sparkle setelah 1.5s
      setTimeout(() => setSparkleActive(false), 1500);

      // Mulai otomatis melangkah setelah 1.2 detik jeda
      setTimeout(() => {
        startWalkingSequence();
      }, 1200);
    }, 700);
  };

  // Sekuens Animasi Menyeberang Jembatan Tali (Walk Cycle Transition)
  const startWalkingSequence = () => {
    if (isCrossing || hasCrossed) return;

    setIsCrossing(true);
    setAnimationMode('walk');

    // Step 1: Melangkah ke pangkal jembatan rotan (2.0s)
    setCrossStep(1);
    setIsSuspendedOverChasm(false);
    playStepSound();

    setTimeout(() => {
      // Step 2: Melangkah ke simpul tengah jembatan di atas jurang (2.5s)
      setCrossStep(2);
      setIsSuspendedOverChasm(true);
      playStepSound();
      setActiveSpeech('Putri Rara Runting: "Wah, jurange jero banget mbakyu! Nyekel tali sing kenceng..."');

      setTimeout(() => {
        // Step 3: Melangkah mendekati tebing kanan (2.4s)
        setCrossStep(3);
        setIsSuspendedOverChasm(true);
        playStepSound();

        setTimeout(() => {
          // Step 4: Mendarat di tebing kanan (2.0s)
          setCrossStep(4);
          setIsSuspendedOverChasm(false);
          setIsCrossing(false);
          setHasCrossed(true);
          setAnimationMode('idle'); // Berganti kembali ke idle gembira
          playVictorySound();
          setActiveSpeech('Putri Rara Kuning: "Kasil! Kita wis tekan seberang kanthi slamet!"');

          setToast({
            type: 'success',
            text: '🎉 Hore! Putri Rara Kuning lan Rara Runting kasil nyebrang jurang kanthi slamet!',
          });
        }, 2200);
      }, 2600);
    }, 2100);
  };

  // Manual Trigger: Pindah Step demi Step atau Mode
  const handleToggleAnimationMode = () => {
    setAnimationMode((prev) => (prev === 'idle' ? 'walk' : 'idle'));
    setToast({
      type: 'info',
      text: animationMode === 'idle' ? '🏃 Mode Walk Cycle diaktifake!' : '🧘 Mode Idle Pose diaktifake!',
    });
  };

  const handleReset = () => {
    setIsRopeConnected(false);
    setIsConnecting(false);
    setCrossStep(0);
    setIsCrossing(false);
    setHasCrossed(false);
    setAnimationMode('idle');
    setSparkleActive(false);
    setActiveSpeech(null);
    setToast({
      type: 'info',
      text: 'Dolanan direset. Pencet tombol "Gunakake tali rotan" kanggo miwiti maneh!',
    });
  };

  // Posisi Koordinat Karakter Berdasarkan Step (Rasio 16:9 1024x576)
  const getCharacterCoords = () => {
    switch (crossStep) {
      case 0:
        // Tepi Kiri (Depan Tiang Kayu)
        return { left: '13.5%', top: '48.0%' };
      case 1:
        // Awal Jembatan Tali (Pangkal Tali Kiri)
        return { left: '31.5%', top: '45.0%' };
      case 2:
        // Tengah Jembatan (Di Atas Simpul Rotan Jurang Air Terjun)
        return { left: '52.0%', top: '50.5%' };
      case 3:
        // Menuju Tiang Kayu Kanan
        return { left: '72.0%', top: '44.5%' };
      case 4:
        // Tiba di Seberang Tebing Kanan
        return { left: '85.5%', top: '40.0%' };
      default:
        return { left: '13.5%', top: '48.0%' };
    }
  };

  const charCoords = getCharacterCoords();

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#030c07] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-3 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm tracking-wide text-amber-200">Mbukak Lelampahan Jurang Tali Rotan...</p>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-[#030c07] text-stone-100 flex flex-col items-center justify-center overflow-hidden select-none font-sans">
      {/* ========================================================
          GLOBAL ANIMATION KEYFRAMES (WALK CYCLE & IDLE)
         ======================================================== */}
      <style jsx global>{`
        /* Animasi Idle: Nafas halus, gerak mengambang anggun */
        @keyframes roroIdleBreath {
          0%, 100% {
            transform: translateY(0px) scale(1, 1);
          }
          50% {
            transform: translateY(-4px) scale(1.01, 1.02);
          }
        }

        /* Animasi Idle Angin: Ronce melati & selendang bergoyang lembut */
        @keyframes roroBreezeSway {
          0%, 100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(1.5deg);
          }
        }

        /* Animasi Walk Cycle: Langkah naik-turun kaki & ayunan pinggul */
        @keyframes roroWalkBob {
          0% {
            transform: translateY(0px) rotate(0deg) scale(1, 0.98);
          }
          25% {
            transform: translateY(-9px) rotate(2.2deg) scale(0.99, 1.02);
          }
          50% {
            transform: translateY(0px) rotate(0deg) scale(1, 0.98);
          }
          75% {
            transform: translateY(-9px) rotate(-2.2deg) scale(0.99, 1.02);
          }
          100% {
            transform: translateY(0px) rotate(0deg) scale(1, 0.98);
          }
        }

        /* Animasi Ayunan Jembatan Gantung di Atas Jurang */
        @keyframes suspensionBridgeBounce {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(4px) rotate(0.6deg);
          }
        }

        /* Animasi Simpul Sparkle Emas */
        @keyframes knotSparkleBurst {
          0% {
            transform: scale(0.3) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.4) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: scale(2.2) rotate(360deg);
            opacity: 0;
          }
        }

        /* Bayangan Dinamis di Bawah Kaki */
        @keyframes dynamicShadow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.65;
          }
          50% {
            transform: scale(0.82);
            opacity: 0.35;
          }
        }

        .animate-idle-roro {
          animation: roroIdleBreath 2.8s ease-in-out infinite;
        }

        .animate-walk-roro {
          animation: roroWalkBob 0.65s ease-in-out infinite;
        }

        .animate-bridge-sway {
          animation: suspensionBridgeBounce 1.8s ease-in-out infinite;
        }

        .animate-shadow-walk {
          animation: dynamicShadow 0.65s ease-in-out infinite;
        }
      `}</style>

      {/* 
        CONTAINER UTAMA 16:9 (1024 x 576)
        Menjamin koordinat tombol, tali, dan animasi karakter 100% presisi di semua resolusi
      */}
      <div
        ref={containerRef}
        className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl select-none"
      >
        {/* ========================================================
            DUAL BACKGROUND SWITCHER (ANTI-DOUBLE KARAKTER)
           ======================================================== */}
        
        {/* Latar Belakang 1: Awal dengan tali putus & dialog statis di tebing kiri */}
        <Image
          src="/assets/level2/screen_jurang_tali_putus.jpg"
          alt="Alas Gunung Wilis - Jembatan Tali Putus"
          fill
          priority
          sizes="100vw"
          className={`object-contain object-center transition-opacity duration-700 ease-in-out ${
            isRopeConnected ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        />

        {/* Latar Belakang 2: Tali sudah tersambung simpul & tebing kiri bersih tanpa karakter ganda */}
        <Image
          src="/assets/level2/screen_jurang_tali_sambung.jpg"
          alt="Alas Gunung Wilis - Jembatan Tali Tersambung Simpul"
          fill
          priority
          sizes="100vw"
          className={`object-contain object-center transition-opacity duration-700 ease-in-out ${
            isRopeConnected ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* ========================================================
            STATUS BADGE MISI (POJOK ATAS TENGAH)
           ======================================================== */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-35 flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-950/90 border border-yellow-400/80 shadow-2xl backdrop-blur-md">
          <span className="text-yellow-400 font-bold text-xs sm:text-sm">
            Lv 2 - Jurang Air Terjun
          </span>
          <span className="text-stone-400 text-xs">|</span>
          <span className="text-stone-200 text-xs flex items-center gap-1.5 font-medium">
            <span>🪢</span>
            {isRopeConnected ? (
              <span className="text-emerald-400 font-bold">Tali Rotan Kasil Disambung</span>
            ) : (
              <span className="text-amber-300 font-bold animate-pulse">Tali Jembatan Pedhot!</span>
            )}
          </span>
        </div>

        {/* ========================================================
            KONTROL ANIMASI & POSISI (POJOK KANAN ATAS)
           ======================================================== */}
        <div className="absolute top-3 right-3 z-35 flex items-center gap-1.5">
          {isRopeConnected && (
            <>
              {/* Tombol Toggle Walk Cycle / Idle */}
              <button
                type="button"
                onClick={handleToggleAnimationMode}
                title="Ganti Mode Gerak Karakter (Walk Cycle / Idle)"
                className="px-2.5 py-1 rounded-full bg-stone-950/90 hover:bg-stone-900 border border-yellow-400/60 text-yellow-300 text-[10px] sm:text-xs font-bold backdrop-blur-md shadow-md active:scale-95 transition-all flex items-center gap-1"
              >
                <span>{animationMode === 'walk' ? '🚶 Walk Cycle' : '🧘 Idle Pose'}</span>
              </button>

              {/* Tombol Mlaku Nyebrang (Jika belum selesai) */}
              {!hasCrossed && !isCrossing && (
                <button
                  type="button"
                  onClick={startWalkingSequence}
                  title="Mulai Mlaku Nyebrang Jembatan Tali"
                  className="px-3 py-1 rounded-full bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-400 text-emerald-200 text-[10px] sm:text-xs font-bold backdrop-blur-md shadow-md active:scale-95 transition-all flex items-center gap-1 animate-pulse"
                >
                  <span>▶ Mlaku Nyebrang</span>
                </button>
              )}

              {/* Tombol Reset */}
              <button
                type="button"
                onClick={handleReset}
                title="Baleni Nyambung Tali"
                className="p-1.5 rounded-full bg-stone-950/80 hover:bg-stone-900 border border-stone-600 text-stone-300 text-xs shadow backdrop-blur-md active:scale-95 transition-all"
              >
                🔄
              </button>
            </>
          )}

          <Link
            href="/peta"
            className="px-3 py-1 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-yellow-500/50 text-yellow-300 text-xs font-bold backdrop-blur-md shadow-md transition-all active:scale-95 flex items-center gap-1"
          >
            <span>🗺️ Peta</span>
          </Link>
        </div>

        {/* ========================================================
            TOMBOLE "GUNAKAKE TALI ROTAN" (INTERAKTIF & AKURAT)
            Koordinat X: ~36.5% - 54.0%, Y: ~36.0% - 44.5%
           ======================================================== */}
        {!isRopeConnected && (
          <>
            {/* Clickable Area Tiang Kayu Kiri (X: 29%..36%, Y: 36%..63%) */}
            <div
              onClick={handleConnectRope}
              title="Pencet cagak tali rotan iki kanggo nyambung jembatan"
              className="absolute left-[29.5%] top-[36.0%] w-[6.5%] h-[27.0%] rounded-xl z-25 cursor-pointer hover:bg-yellow-400/20 active:scale-95 transition-all"
            />

            {/* Clickable Area Tali Rotan Putus (X: 36%..68%, Y: 40%..58%) */}
            <div
              onClick={handleConnectRope}
              title="Pencet tali sing pedhot iki kanggo nyambung simpul"
              className="absolute left-[36.0%] top-[40.0%] w-[32.0%] h-[18.0%] rounded-2xl z-25 cursor-pointer hover:bg-yellow-400/15 active:scale-95 transition-all"
            />

            {/* Tombol Eksak "✋ Gunakake tali rotan" dengan Animasi Pulsing Glow */}
            <button
              type="button"
              onClick={handleConnectRope}
              disabled={isConnecting}
              title="Pencet kanggo nyambung tali rotan"
              className="group absolute left-[36.8%] top-[36.4%] w-[17.5%] h-[8.5%] rounded-full bg-transparent border-2 border-transparent hover:border-yellow-400/90 hover:bg-yellow-400/20 hover:shadow-[0_0_25px_rgba(250,204,21,0.85)] active:scale-95 transition-all duration-200 cursor-pointer z-30 flex items-center justify-center overflow-hidden"
            >
              {/* Efek kilau border aktif */}
              <div className="absolute inset-0 rounded-full border border-yellow-300/40 animate-ping pointer-events-none opacity-75" />
              
              {/* Petunjuk Interaktif Melayang di atas tombol */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none -mt-14 px-3 py-1 bg-stone-950/95 border border-yellow-400 rounded-full text-yellow-300 text-[10px] sm:text-xs font-bold tracking-wide shadow-2xl flex items-center gap-1.5 whitespace-nowrap">
                <span>✨ Pencet kene kanggo nyambung tali!</span>
              </div>
              <span className="sr-only">Gunakake tali rotan</span>
            </button>
          </>
        )}

        {/* ========================================================
            PARTIKEL SPARKLE SIMPUL TALI TERSAMBUNG (TENGAH JURANG)
           ======================================================== */}
        {sparkleActive && (
          <div className="absolute left-[62.0%] top-[52.0%] -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-4 border-yellow-300 bg-yellow-400/30 filter drop-shadow-[0_0_30px_rgba(250,204,21,1)] animate-[knotSparkleBurst_1.2s_ease-out_forwards]" />
            <div className="px-3 py-1 rounded-full bg-stone-950/95 border border-yellow-400 text-yellow-300 text-xs font-bold shadow-2xl tracking-wide whitespace-nowrap -mt-6 animate-bounce">
              🪢 Simpul Kuwat Kasil Ditaleni!
            </div>
          </div>
        )}

        {/* ========================================================
            KARAKTER DINAMIS (RARA KUNING & RARA RUNTING)
            MUNCUL SETELAH TALI TERSAMBUNG (ANTI-DOUBLE)
           ======================================================== */}
        {isRopeConnected && (
          <div
            className={`absolute z-30 pointer-events-none transition-all ease-in-out ${
              isSuspendedOverChasm ? 'animate-bridge-sway' : ''
            }`}
            style={{
              left: charCoords.left,
              top: charCoords.top,
              transitionDuration:
                crossStep === 1
                  ? '2.1s'
                  : crossStep === 2
                  ? '2.6s'
                  : crossStep === 3
                  ? '2.4s'
                  : crossStep === 4
                  ? '2.2s'
                  : '0.5s',
              filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.85))',
            }}
          >
            {/* Bayangan Dinamis di Bawah Kaki */}
            <div
              className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-28 h-5 rounded-[100%] bg-black/60 blur-[2px] ${
                animationMode === 'walk' ? 'animate-shadow-walk' : ''
              }`}
            />

            {/* Karakter Putri Berdampingan */}
            <div
              className={`flex items-end gap-1.5 ${
                animationMode === 'walk' ? 'animate-walk-roro' : 'animate-idle-roro'
              }`}
            >
              {/* Putri Rara Runting (Kebaya Hijau) */}
              <div className="relative w-14 h-32 sm:w-18 sm:h-40 transform transition-transform">
                <Image
                  src="/assets/level2/karakter-rara-runting-tali.png"
                  alt="Putri Rara Runting"
                  fill
                  priority
                  sizes="100px"
                  className="object-contain"
                />
              </div>

              {/* Putri Rara Kuning (Kebaya Kuning) */}
              <div className="relative w-18 h-34 sm:w-22 sm:h-44 -ml-4 transform transition-transform">
                <Image
                  src="/assets/level2/karakter-rara-kuning-tali.png"
                  alt="Putri Rara Kuning"
                  fill
                  priority
                  sizes="120px"
                  className="object-contain"
                />
              </div>
            </div>

            {/* Status Indikator di Bawah Karakter */}
            <div className="flex flex-col items-center mt-1">
              {isCrossing ? (
                <div className="px-2.5 py-0.5 rounded-full bg-stone-950/90 border border-yellow-400 text-yellow-300 text-[9px] sm:text-[10px] font-bold shadow-lg animate-pulse whitespace-nowrap">
                  🚶‍♀️🚶‍♀️ Mlaku nyebrang jembatan tali rotan...
                </div>
              ) : hasCrossed ? (
                <div className="px-2.5 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-400 text-emerald-200 text-[9px] sm:text-[10px] font-bold shadow-lg whitespace-nowrap">
                  ✨ Wis tekan seberang kanthi slamet!
                </div>
              ) : (
                <div className="px-2.5 py-0.5 rounded-full bg-stone-950/80 border border-stone-500 text-stone-300 text-[9px] font-medium whitespace-nowrap">
                  {animationMode === 'walk' ? 'Walk Cycle Aktif' : 'Idle Pose'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            SUBTITLE / BALON UCAPAN KARAKTER DINAMIS
           ======================================================== */}
        {activeSpeech && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-35 max-w-lg w-[90%] px-4 py-2 rounded-2xl bg-stone-950/90 border border-amber-400/80 text-amber-200 text-xs sm:text-sm font-serif shadow-2xl backdrop-blur-md text-center animate-fade-in">
            {activeSpeech}
          </div>
        )}

        {/* ========================================================
            D-PAD DI KIRI BAWAH & NAVIGASI
           ======================================================== */}
        <button
          type="button"
          onClick={() => router.push('/level2/kali')}
          title="Bali menyang Adegan Kali"
          className="absolute left-[0.9%] top-[84.0%] w-[4.0%] h-[15.0%] rounded-lg bg-transparent hover:bg-yellow-400/20 active:scale-95 transition-all cursor-pointer z-20"
        >
          <span className="sr-only">Bali</span>
        </button>

        <div className="absolute bottom-2.5 left-4 z-30">
          <Link
            href="/level2/kali"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold backdrop-blur-md shadow-md active:scale-95 transition-all"
          >
            <span>⬅</span> Bali menyang Adegan Kali
          </Link>
        </div>
      </div>

      {/* ========================================================
          MODAL: KASIL NYAMBUNG TALI & NYEBRANG JURANG!
         ======================================================== */}
      {hasCrossed && (
        <div className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="max-w-md w-full bg-stone-900 border-2 border-yellow-500/90 rounded-2xl p-6 shadow-2xl text-stone-100 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-4xl shadow-lg">
              🪢
            </div>
            <h3 className="text-xl font-serif font-black text-yellow-400">
              Kasil Nyambung Tali & Nyebrang Jurang!
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
              Kanthi gotong royong lan kawicaksanan, Putri Rara Kuning lan Rara Runting kasil nyambung tali rotan sing pedhot. Jembatan tali dadi kuwat maneh lan putri loro kasil nyebrang jurang kanthi slamet. Lelampahan menyang lereng Gunung Wilis saiki bisa diterusake!
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300 text-xs font-bold transition active:scale-95"
              >
                Baleni Dolanan 🔄
              </button>
              <Link
                href="/level2/gua"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-stone-950 font-black text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>🔥</span> Lanjut menyang Guwa (Misi Obor) →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TOAST FEEDBACK
         ======================================================== */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] px-4 py-2.5 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs sm:text-sm font-bold tracking-wide animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200 shadow-emerald-900/50'
              : 'bg-stone-900/95 border-yellow-400 text-yellow-300 shadow-yellow-900/50'
          }`}
        >
          <span>{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-stone-300 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
