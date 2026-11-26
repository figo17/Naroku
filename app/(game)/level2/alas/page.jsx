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
  SCENE FLOW:
  1. 'intro' -> Background lengkap (screen_alas_kapak.jpg) dengan karakter, dialog, kapak & tombol "Gunakake kapak".
  2. 'play'  -> Background tanpa karakter cewek (screen_alas_tanpa_cewe_kapak.jpg -> setelah kapak diambil jadi screen_alas_tanpa_cewe_kosong.jpg).
                Karakter Rara Kuning & Rara Runting bisa digerakkan dengan D-Pad Emulator (HP) & Arrow/WASD (PC).
                Ambil kapak -> jalan ke depan pohon -> ayunkan kapak untuk mengisi Bar Tebang Pohon hingga 100%.
  3. 'cut'   -> Background pohon sudah ditebang (screen_alas_pohon_ditebang.jpg) tanpa cewek, tanpa kapak, dan tanpa tombol "Gunakake kapak".
*/

export default function Level2AlasKapakPage() {
  const router = useRouter();
  const supabase = createClient();
  const analogRef = useRef({ x: 0, y: 0, active: false });
  const walkStopTimerRef = useRef(null);
  const audioCtxRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [scene, setScene] = useState('intro'); // 'intro' | 'play' | 'cut'
  const sceneRef = useRef('intro');

  // Character position in % of 1024x512 container (bottom-center anchor)
  const [charPos, setCharPos] = useState({ x: 22, y: 78 });
  const charPosRef = useRef({ x: 22, y: 78 });
  const [facingLeft, setFacingLeft] = useState(false);
  const [isWalking, setIsWalking] = useState(false);

  // Gameplay states in 'play' scene
  const [hasAxe, setHasAxe] = useState(false);
  const hasAxeRef = useRef(false);
  const [chopProgress, setChopProgress] = useState(0);
  const chopProgressRef = useRef(0);
  const [isChopping, setIsChopping] = useState(false);
  const [woodChips, setWoodChips] = useState([]);
  const [showCutModal, setShowCutModal] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { sceneRef.current = scene; }, [scene]);
  useEffect(() => { hasAxeRef.current = hasAxe; }, [hasAxe]);
  useEffect(() => { chopProgressRef.current = chopProgress; }, [chopProgress]);

  // Auth check
  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login?role=murid');
          return;
        }
      } catch (err) {
        console.error('Level 2 Alas auth error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router, supabase]);

  // Sound effects
  const playSound = useCallback((type) => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      if (type === 'pickup') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(720, now);
        osc.frequency.exponentialRampToValueAtTime(1440, now + 0.14);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.17);
      } else if (type === 'chop') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(65, now + 0.18);
        gain.gain.setValueAtTime(0.32, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.21);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.46);
      }
    } catch {
      // Ignore audio restriction errors
    }
  }, []);

  const showToast = useCallback((text, type = 'info') => {
    setToast({ text, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Check if character is in front of the fallen tree
  const isNearTree = (pos) => {
    return pos.x >= 40 && pos.x <= 78 && pos.y >= 46 && pos.y <= 78;
  };

  // Start Scene 2 ('play') from Scene 1 ('intro')
  const startPlayScene = useCallback(() => {
    if (sceneRef.current !== 'intro') return;
    setScene('play');
    sceneRef.current = 'play';
    setCharPos({ x: 22, y: 78 });
    charPosRef.current = { x: 22, y: 78 };
    setHasAxe(false);
    hasAxeRef.current = false;
    setChopProgress(0);
    chopProgressRef.current = 0;
    setShowCutModal(false);
    showToast('🚶 Mlaku nyedhaki kapak nganggo tombol Panah utawa Analog!', 'info');
  }, [showToast]);

  // Move character in 'play' scene
  const moveCharacter = useCallback((dx, dy) => {
    if (sceneRef.current !== 'play') return;

    if (dx < -0.05) setFacingLeft(true);
    else if (dx > 0.05) setFacingLeft(false);

    setIsWalking(true);
    if (walkStopTimerRef.current) clearTimeout(walkStopTimerRef.current);
    walkStopTimerRef.current = setTimeout(() => setIsWalking(false), 160);

    const prev = charPosRef.current;
    // Constrain movement within forest path bounds
    const nx = Math.max(10, Math.min(86, prev.x + dx));
    const ny = Math.max(48, Math.min(92, prev.y + dy));
    const nextPos = { x: nx, y: ny };
    charPosRef.current = nextPos;
    setCharPos(nextPos);

    // Auto-pickup axe when walking close to axe on ground (x: 37..52, y: 66..88)
    if (!hasAxeRef.current && nx >= 37 && nx <= 52 && ny >= 66 && ny <= 88) {
      hasAxeRef.current = true;
      setHasAxe(true);
      playSound('pickup');
      showToast('🪓 Kapak kasil dijupuk! Saiki mlaku menyang ngarep wit gedhe!', 'success');
    }
  }, [playSound, showToast]);

  // Swing axe at tree
  const swingAxe = useCallback(() => {
    if (sceneRef.current !== 'play') return;
    if (!hasAxeRef.current) {
      showToast('⚠️ Jupuk kapak ing lemah dhisik!', 'info');
      return;
    }
    if (!isNearTree(charPosRef.current)) {
      showToast('⚠️ Karakter kudu ana ing ngarep wit gedhe kanggo ngayunake kapak!', 'info');
      return;
    }
    if (chopProgressRef.current >= 100) return;

    setIsChopping(true);
    playSound('chop');
    setTimeout(() => setIsChopping(false), 320);

    // Spawn wood chips
    const batchId = Date.now();
    const newChips = Array.from({ length: 6 }, (_, i) => ({
      id: `${batchId}-${i}`,
      dx: (Math.random() - 0.5) * 70,
      dy: -(Math.random() * 45 + 15),
      rot: Math.random() * 360,
    }));
    setWoodChips((prev) => [...prev.slice(-10), ...newChips]);

    const nextProgress = Math.min(100, chopProgressRef.current + 20);
    chopProgressRef.current = nextProgress;
    setChopProgress(nextProgress);

    if (nextProgress >= 100) {
      playSound('success');
      recordLevel2Mission(supabase, 'alas');
      setTimeout(() => {
        setScene('cut');
        sceneRef.current = 'cut';
        setTimeout(() => setShowCutModal(true), 1200);
      }, 450);
    }
  }, [playSound, showToast]);

  // Keyboard Arrow / WASD + Analog + Space/Enter handlers
  useEffect(() => {
    const activeKeys = new Set();
    let animFrameId = null;

    const loop = () => {
      if (sceneRef.current === 'play') {
        const step = 0.65;
        let dx = analogRef.current.active ? analogRef.current.x * 0.7 : 0;
        let dy = analogRef.current.active ? analogRef.current.y * 0.7 : 0;
        if (activeKeys.has('ArrowUp') || activeKeys.has('KeyW')) dy -= step;
        if (activeKeys.has('ArrowDown') || activeKeys.has('KeyS')) dy += step;
        if (activeKeys.has('ArrowLeft') || activeKeys.has('KeyA')) dx -= step;
        if (activeKeys.has('ArrowRight') || activeKeys.has('KeyD')) dx += step;
        if (Math.hypot(dx, dy) > 0.04) moveCharacter(dx, dy);
      }
      animFrameId = requestAnimationFrame(loop);
    };

    const onKeyDown = (e) => {
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'Enter'];
      if (!keys.includes(e.code)) return;
      e.preventDefault();

      if (e.code === 'Space' || e.code === 'Enter') {
        if (sceneRef.current === 'intro') startPlayScene();
        else if (sceneRef.current === 'play') swingAxe();
        return;
      }

      if (sceneRef.current === 'play') {
        activeKeys.add(e.code);
      }
    };

    const onKeyUp = (e) => {
      activeKeys.delete(e.code);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    animFrameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (walkStopTimerRef.current) clearTimeout(walkStopTimerRef.current);
    };
  }, [moveCharacter, startPlayScene, swingAxe]);

  const resetLevel = () => {
    setScene('intro');
    sceneRef.current = 'intro';
    setCharPos({ x: 22, y: 78 });
    charPosRef.current = { x: 22, y: 78 };
    setHasAxe(false);
    hasAxeRef.current = false;
    setChopProgress(0);
    chopProgressRef.current = 0;
    setWoodChips([]);
    setShowCutModal(false);
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#030a08] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm tracking-wide text-amber-200">Mbukak Lelampahan Alas Gunung Wilis...</p>
      </div>
    );
  }

  // Determine current background image
  let bgSrc = '/assets/level2/screen_alas_kapak.jpg';
  if (scene === 'play') {
    bgSrc = hasAxe
      ? '/assets/level2/screen_alas_tanpa_cewe_kosong.jpg'
      : '/assets/level2/screen_alas_tanpa_cewe_kapak.jpg';
  } else if (scene === 'cut') {
    bgSrc = '/assets/level2/screen_alas_pohon_ditebang.jpg';
  }

  const nearTree = isNearTree(charPos);

  return (
    <div className="relative w-screen h-screen bg-[#020705] text-stone-100 flex flex-col items-center justify-center overflow-hidden select-none font-sans">
      <style>{`
        @keyframes roroWalkBob {
          0%   { transform: translateY(0px) rotate(0deg) scale(1, 0.98); }
          25%  { transform: translateY(-8px) rotate(2.5deg) scale(0.99, 1.03); }
          50%  { transform: translateY(0px) rotate(0deg) scale(1, 0.98); }
          75%  { transform: translateY(-8px) rotate(-2.5deg) scale(0.99, 1.03); }
          100% { transform: translateY(0px) rotate(0deg) scale(1, 0.98); }
        }
        @keyframes roroIdleBreath {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-3px); }
        }
        @keyframes kapakSwing {
          0%   { transform: rotate(-25deg) translate(0, 0); }
          45%  { transform: rotate(45deg) translate(12px, 14px); }
          100% { transform: rotate(-25deg) translate(0, 0); }
        }
        @keyframes woodChipFly {
          0%   { opacity: 1; transform: translate(0, 0) rotate(0deg); }
          100% { opacity: 0; transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-walk { animation: roroWalkBob 0.42s ease-in-out infinite; }
        .anim-idle { animation: roroIdleBreath 2.4s ease-in-out infinite; }
        .anim-chop { animation: kapakSwing 0.32s ease-in-out; }
        .anim-fadein { animation: fadeIn 0.35s ease-out forwards; }
      `}</style>

      {/* Container 1024x512 (2:1 Aspect Ratio) */}
      <div className="relative w-full h-full max-w-[calc(100vh*1024/512)] max-h-[calc(100vw*512/1024)] aspect-[1024/512] overflow-hidden shadow-2xl">
        {/* Background Layer */}
        <Image
          src={bgSrc}
          alt="Alas Gunung Wilis"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center transition-opacity duration-300"
        />

        {/* Navigasi Pojok Kiri Atas */}
        <div className="absolute top-3 left-4 z-35 flex items-center gap-2">
          <Link
            href="/level2/mucuk"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold backdrop-blur-md shadow-md active:scale-95 transition-all"
          >
            ⬅ Bali menyang Mucuk
          </Link>
          <Link
            href="/peta"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold backdrop-blur-md shadow-md active:scale-95 transition-all"
          >
            🗺️ Peta
          </Link>
        </div>

        {/* Badge Petunjuk Kontrol */}
        {scene !== 'cut' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-35 px-3.5 py-1.5 rounded-full bg-stone-950/90 border border-yellow-400/75 shadow-xl backdrop-blur-md">
            <span className="text-yellow-300 font-bold text-[10px] sm:text-xs flex items-center gap-1.5 whitespace-nowrap">
              {scene === 'intro' ? (
                <>👆 Pencet &ldquo;Gunakake kapak&rdquo; kanggo miwiti</>
              ) : !hasAxe ? (
                <>🕹️ Kontrol: Analog / Arrow Keys — Jupuk kapak ing lemah!</>
              ) : !nearTree ? (
                <>🚶 Mlaku menyang ngarep wit gedhe nganggo Analog / Arrow Keys!</>
              ) : (
                <>🪓 Pencet &ldquo;Ayunkan Kapak&rdquo; utawa Spasi kanggo nugel wit!</>
              )}
            </span>
          </div>
        )}

        {/* ========================================================
            SCENE 1 ('intro'): HITBOX KAPAK & TOMBOL "GUNAKAKE KAPAK"
           ======================================================== */}
        {scene === 'intro' && (
          <>
            <div
              onClick={startPlayScene}
              className="absolute left-[37.5%] top-[70.5%] w-[14.5%] h-[16.5%] rounded-2xl z-25 cursor-pointer hover:ring-2 hover:ring-yellow-300 hover:bg-yellow-400/20 active:scale-95 transition-all animate-pulse"
              title="Pencet kanggo miwiti"
            />
            <button
              type="button"
              onClick={startPlayScene}
              className="absolute left-[52.0%] top-[72.0%] w-[16.8%] h-[9.5%] rounded-full bg-transparent hover:bg-yellow-400/25 hover:ring-2 hover:ring-yellow-300 hover:shadow-[0_0_20px_rgba(250,204,21,0.6)] active:scale-95 transition-all cursor-pointer z-25"
              title="Gunakake kapak"
            >
              <span className="sr-only">Gunakake kapak</span>
            </button>
          </>
        )}

        {/* ========================================================
            SCENE 2 ('play'): BAR TEBANG POHON & ZONA DEPAN POHON
           ======================================================== */}
        {scene === 'play' && (
          <>
            {/* Indikator zona ambil kapak jika belum punya kapak */}
            {!hasAxe && (
              <div
                className="absolute left-[44.5%] top-[69%] -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center"
              >
                <div className="px-2.5 py-0.5 rounded-full bg-stone-950/90 border border-yellow-400 text-yellow-300 text-[9px] sm:text-[10px] font-bold shadow-lg animate-bounce whitespace-nowrap">
                  ⬇ Jupuk Kapak
                </div>
              </div>
            )}

            {/* Bar Tebang Pohon di dekat pohon */}
            <div className="absolute left-[58%] top-[34%] -translate-x-1/2 z-25 flex flex-col items-center gap-1 pointer-events-none">
              <div className="bg-stone-950/90 border border-yellow-500/80 rounded-xl px-3 py-1.5 shadow-2xl backdrop-blur-md min-w-[150px] sm:min-w-[190px]">
                <div className="flex items-center justify-between text-[9px] sm:text-[11px] font-bold text-yellow-300 mb-1">
                  <span>🪵 Ketahanan Wit</span>
                  <span>{chopProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-stone-800 rounded-full overflow-hidden border border-stone-700">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-300"
                    style={{ width: `${chopProgress}%` }}
                  />
                </div>
              </div>

              {hasAxe && !nearTree && (
                <div className="px-2.5 py-0.5 rounded-full bg-amber-950/90 border border-yellow-400/70 text-yellow-200 text-[9px] sm:text-[10px] font-bold animate-pulse whitespace-nowrap">
                  ⬇ Cedhaki wit iki!
                </div>
              )}
            </div>

            {/* Highlight zona depan pohon saat sudah pegang kapak */}
            {hasAxe && (
              <div
                className={`absolute left-[42%] top-[48%] w-[32%] h-[24%] rounded-3xl z-15 pointer-events-none transition-all duration-300 ${
                  nearTree
                    ? 'border-2 border-emerald-400/80 bg-emerald-400/10 shadow-[0_0_25px_rgba(52,211,153,0.3)]'
                    : 'border border-dashed border-yellow-400/40 bg-yellow-400/5'
                }`}
              />
            )}

            {/* Partikel tatal kayu saat kapak diayunkan */}
            {woodChips.map((chip) => (
              <div
                key={chip.id}
                className="absolute z-30 w-2.5 h-1.5 rounded-sm bg-amber-600 border border-amber-900 pointer-events-none"
                style={{
                  left: `${charPos.x + (facingLeft ? -4 : 5)}%`,
                  top: `${charPos.y - 14}%`,
                  '--dx': `${chip.dx}px`,
                  '--dy': `${chip.dy}px`,
                  '--rot': `${chip.rot}deg`,
                  animation: 'woodChipFly 0.8s ease-out forwards',
                }}
              />
            ))}

            {/* KARAKTER DINAMIS PIXEL ART (RARA KUNING & RARA RUNTING) */}
            <div
              className="absolute z-20 pointer-events-none"
              style={{
                left: `${charPos.x}%`,
                top: `${charPos.y}%`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <PixelRoroPair isWalking={isWalking} facingLeft={facingLeft} order="kuning-first">
                {/* Kapak di tangan karakter saat sudah diambil */}
                {hasAxe && (
                  <div
                    className={`absolute -right-5 top-[30%] z-25 ${isChopping ? 'anim-chop' : ''}`}
                    style={{ transformOrigin: 'bottom left' }}
                  >
                    <div
                      className="relative"
                      style={{ width: '4.5vw', maxWidth: 56, minWidth: 32, aspectRatio: '2.2/1' }}
                    >
                      <Image
                        src="/assets/level2/item-kapak.png"
                        alt="Kapak Wesi"
                        fill
                        sizes="56px"
                        className="object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]"
                      />
                    </div>
                  </div>
                )}
              </PixelRoroPair>
            </div>

            {/* Tombol Ayunkan Kapak (muncul ketika pegang kapak) */}
            {hasAxe && (
              <button
                type="button"
                onClick={swingAxe}
                className={`absolute right-[4%] bottom-[8%] z-35 flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 font-black text-xs sm:text-sm shadow-2xl transition-all active:scale-90 cursor-pointer ${
                  nearTree
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 border-yellow-200 text-stone-950 animate-pulse hover:scale-105'
                    : 'bg-stone-900/85 border-stone-600 text-stone-400 hover:bg-stone-800'
                }`}
              >
                <span className="text-lg">🪓</span>
                <span>{nearTree ? 'Ayunkan Kapak! (Spasi)' : 'Cedhaki Wit Dhisik'}</span>
              </button>
            )}
          </>
        )}

        {/* KONTROLER ANALOG 360° (AKTIF DI INTRO & PLAY) */}
        {scene !== 'cut' && (
          <AnalogJoystick
            onStart={() => {
              if (sceneRef.current === 'intro') startPlayScene();
            }}
            onChange={(v) => {
              analogRef.current = v;
            }}
          />
        )}

        {/* ========================================================
            SCENE 3 ('cut'): MODAL SELESAI SETELAH POHON DITEBANG
           ======================================================== */}
        {scene === 'cut' && showCutModal && (
          <div className="absolute inset-0 z-40 bg-stone-950/70 backdrop-blur-[2px] flex items-center justify-center p-4 anim-fadein">
            <div className="max-w-sm w-full bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-yellow-500/90 rounded-2xl p-6 shadow-2xl text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-4xl shadow-lg">
                🌲
              </div>
              <h3 className="text-xl font-serif font-black text-yellow-400">
                Wit Gedhe Kasil Ditugel!
              </h3>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
                Dalan tumuju Gunung Wilis wis tinarbuka. Putri Rara Kuning lan Rara Runting saiki bisa nerusake lelampahan golek usada!
              </p>
              <div className="pt-2 flex flex-col gap-2.5">
                <Link
                  href="/level2/kali"
                  className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-stone-950 font-black text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  🌊 Lanjut menyang Kali →
                </Link>
                <button
                  type="button"
                  onClick={resetLevel}
                  className="w-full px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300 text-xs font-bold transition cursor-pointer"
                >
                  Muter Maneh 🔄
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] px-4 py-2.5 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs sm:text-sm font-bold tracking-wide anim-fadein ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200'
              : 'bg-stone-900/95 border-yellow-400 text-yellow-300'
          }`}
        >
          <span>{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-stone-300 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
