'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Level2AlasKapakPage() {
  const router = useRouter();
  const supabase = createClient();
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const dpadTimerRef = useRef(null);
  const audioCtxRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);

  // Axe & Movement States
  const [isHoldingAxe, setIsHoldingAxe] = useState(false);
  const isHoldingAxeRef = useRef(false);

  // Initial axe position matches where it is lying on the ground: x: 45%, y: 78%
  const [pointerPos, setPointerPos] = useState({ xPercent: 45, yPercent: 78 });
  const pointerPosRef = useRef({ xPercent: 45, yPercent: 78 });

  const [isHoveringPrincess, setIsHoveringPrincess] = useState(false);
  const isHoveringPrincessRef = useRef(false);
  const [isDraggingDirectly, setIsDraggingDirectly] = useState(false);
  const [activeDpadDir, setActiveDpadDir] = useState(null);

  // Video & Completion States
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Sync refs with state
  useEffect(() => {
    isHoldingAxeRef.current = isHoldingAxe;
  }, [isHoldingAxe]);

  useEffect(() => {
    pointerPosRef.current = pointerPos;
  }, [pointerPos]);

  useEffect(() => {
    isHoveringPrincessRef.current = isHoveringPrincess;
  }, [isHoveringPrincess]);

  // Audio Context for sound effects
  const playSoundEffect = useCallback((type) => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      if (type === 'pickup') {
        // Metallic clink
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.12);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'chop') {
        // Wood chop whoosh
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.23);
      }
    } catch {
      // Audio context might be restricted
    }
  }, []);

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
        console.error('Error loading level 2 alas kapak data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router, supabase]);

  // Trigger Action: Play Cut Video
  const triggerTreeCutAction = useCallback(() => {
    setIsHoldingAxe(false);
    isHoldingAxeRef.current = false;
    setIsHoveringPrincess(false);
    isHoveringPrincessRef.current = false;
    setIsPlayingVideo(true);
    playSoundEffect('chop');

    setToast({
      type: 'success',
      text: '✨ Kapak ditampa! Para putri wiwit nugel wit sing ngalangi dalan...',
    });

    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch((err) => {
          console.log('Video autoplay interrupted or blocked:', err);
        });
      }
    }, 150);
  }, [playSoundEffect]);

  // Move Axe by Delta Percent (Used by D-Pad and Keyboard Arrow Keys)
  const moveAxe = useCallback(
    (dxPercent, dyPercent) => {
      // Auto-pickup if not held
      if (!isHoldingAxeRef.current) {
        setIsHoldingAxe(true);
        isHoldingAxeRef.current = true;
        playSoundEffect('pickup');
      }

      const prev = pointerPosRef.current;
      const newX = Math.max(5, Math.min(95, prev.xPercent + dxPercent));
      const newY = Math.max(15, Math.min(92, prev.yPercent + dyPercent));

      const newPos = { xPercent: newX, yPercent: newY };
      setPointerPos(newPos);
      pointerPosRef.current = newPos;

      // Target Hitbox: Putri Rara Kuning & Rara Runting (X: 10%..38%, Y: 35%..98%)
      const inTarget = newX >= 10 && newX <= 38 && newY >= 35 && newY <= 98;
      setIsHoveringPrincess(inTarget);
      isHoveringPrincessRef.current = inTarget;

      // Auto-trigger if axe moves inside target area
      if (inTarget) {
        triggerTreeCutAction();
      }
    },
    [playSoundEffect, triggerTreeCutAction]
  );

  // Direct Pointer/Mouse Coordinate Updater (For Drag & Drop)
  const updatePointerFromCoords = useCallback(
    (clientX, clientY) => {
      if (!containerRef.current) return false;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const xPercent = Math.max(5, Math.min(95, (x / rect.width) * 100));
      const yPercent = Math.max(15, Math.min(92, (y / rect.height) * 100));

      const newPos = { xPercent, yPercent };
      setPointerPos(newPos);
      pointerPosRef.current = newPos;

      const isTarget = xPercent >= 10 && xPercent <= 38 && yPercent >= 35 && yPercent <= 98;
      setIsHoveringPrincess(isTarget);
      isHoveringPrincessRef.current = isTarget;

      return isTarget;
    },
    []
  );

  // Pickup Axe by Clicking / Tapping Axe or "Gunakake kapak"
  const handleAxePickup = (clientX, clientY) => {
    setIsHoldingAxe(true);
    isHoldingAxeRef.current = true;
    setIsDraggingDirectly(true);
    playSoundEffect('pickup');

    if (clientX !== undefined && clientY !== undefined) {
      updatePointerFromCoords(clientX, clientY);
    } else {
      // Default to ground position
      setPointerPos({ xPercent: 45, yPercent: 78 });
      pointerPosRef.current = { xPercent: 45, yPercent: 78 };
    }

    setToast({
      type: 'info',
      text: '🪓 Kapak dicekel! Arahake nganggo tombol panah / D-Pad menyang Putri Rara Kuning!',
    });
  };

  // Direct Mouse / Touch Drag Handlers
  const handlePointerMove = (e) => {
    if (!isHoldingAxe || !isDraggingDirectly) return;
    const isTarget = updatePointerFromCoords(e.clientX, e.clientY);
    if (isTarget) {
      triggerTreeCutAction();
    }
  };

  const handleTouchMove = (e) => {
    if (!isHoldingAxe || !isDraggingDirectly || !e.touches[0]) return;
    const isTarget = updatePointerFromCoords(e.touches[0].clientX, e.touches[0].clientY);
    if (isTarget) {
      triggerTreeCutAction();
    }
  };

  const handlePointerUp = () => {
    setIsDraggingDirectly(false);
    // Keep axe in hand so user can use D-Pad / Arrow keys!
    if (isHoldingAxe && isHoveringPrincess) {
      triggerTreeCutAction();
    }
  };

  // ==========================================================
  // D-PAD EMULATOR CONTROLS (FOR HP / MOBILE & TOUCH)
  // ==========================================================
  const startDpadMove = (direction) => {
    setActiveDpadDir(direction);
    if (dpadTimerRef.current) clearInterval(dpadTimerRef.current);

    const step = 3.0; // Initial step
    let dx = 0;
    let dy = 0;
    if (direction === 'up') dy = -step;
    if (direction === 'down') dy = step;
    if (direction === 'left') dx = -step;
    if (direction === 'right') dx = step;

    moveAxe(dx, dy);

    // Continuous glide when held down
    dpadTimerRef.current = setInterval(() => {
      moveAxe(dx * 0.7, dy * 0.7);
    }, 45);
  };

  const stopDpadMove = () => {
    setActiveDpadDir(null);
    if (dpadTimerRef.current) {
      clearInterval(dpadTimerRef.current);
      dpadTimerRef.current = null;
    }
  };

  // ==========================================================
  // PC KEYBOARD ARROW CONTROLS (ARROW KEYS / WASD)
  // ==========================================================
  useEffect(() => {
    const activeKeys = new Set();
    let animFrameId = null;

    const gameLoop = () => {
      if (activeKeys.size > 0 && !isPlayingVideo) {
        const step = 1.0;
        let dx = 0;
        let dy = 0;
        if (activeKeys.has('ArrowUp') || activeKeys.has('KeyW')) dy -= step;
        if (activeKeys.has('ArrowDown') || activeKeys.has('KeyS')) dy += step;
        if (activeKeys.has('ArrowLeft') || activeKeys.has('KeyA')) dx -= step;
        if (activeKeys.has('ArrowRight') || activeKeys.has('KeyD')) dx += step;

        if (dx !== 0 || dy !== 0) {
          moveAxe(dx, dy);
        }
      }
      animFrameId = requestAnimationFrame(gameLoop);
    };

    const handleKeyDown = (e) => {
      const validKeys = [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'KeyW',
        'KeyA',
        'KeyS',
        'KeyD',
        'Space',
        'Enter',
      ];

      if (validKeys.includes(e.code)) {
        // Prevent default window scrolling with arrow keys
        e.preventDefault();

        // Space or Enter: Toggle pick up axe or interact
        if (e.code === 'Space' || e.code === 'Enter') {
          if (!isHoldingAxeRef.current) {
            handleAxePickup();
          } else if (isHoveringPrincessRef.current) {
            triggerTreeCutAction();
          }
          return;
        }

        activeKeys.add(e.code);
      }
    };

    const handleKeyUp = (e) => {
      activeKeys.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    animFrameId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (dpadTimerRef.current) clearInterval(dpadTimerRef.current);
    };
  }, [isPlayingVideo, moveAxe, triggerTreeCutAction]);

  const handleVideoEnded = () => {
    setVideoCompleted(true);
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#030a08] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-3 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm tracking-wide text-amber-200">Mbukak Lelampahan Alas Gunung Wilis...</p>
      </div>
    );
  }

  return (
    <div
      className="relative w-screen h-screen bg-[#020705] text-stone-100 flex flex-col items-center justify-center overflow-hidden select-none font-sans"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handlePointerUp}
    >
      {/* 
        CONTAINER 1024 x 512 (2:1 Aspect Ratio)
        Menjamin koordinat hitbox kapak, D-Pad emulator, dan putri selalu 100% tepat presisi
      */}
      <div
        ref={containerRef}
        className="relative w-full h-full max-w-[calc(100vh*1024/512)] max-h-[calc(100vw*512/1024)] aspect-[1024/512] overflow-hidden shadow-2xl select-none"
      >
        {/* Background Artwork Alas & Wit Gedhe */}
        <Image
          src="/assets/level2/screen_alas_kapak.jpg"
          alt="Alas Gunung Wilis - Wit Gedhe Ngalangi Dalan"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
        />

        {/* ========================================================
            NAVIGASI POJOK KIRI ATAS
           ======================================================== */}
        <div className="absolute top-3 left-4 z-35 flex items-center gap-2">
          <Link
            href="/level2/mucuk"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold backdrop-blur-md shadow-md active:scale-95 transition-all"
          >
            <span>⬅</span> Bali menyang Mucuk
          </Link>

          <Link
            href="/peta"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold backdrop-blur-md shadow-md active:scale-95 transition-all"
          >
            <span>🗺️</span> Peta
          </Link>
        </div>

        {/* ========================================================
            BADGE PETUNJUK KONTROL (POJOK ATAS TENGAH)
           ======================================================== */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-35 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-950/90 border border-yellow-400/80 shadow-2xl backdrop-blur-md">
          <span className="text-yellow-400 font-bold text-[10px] sm:text-xs flex items-center gap-1.5">
            <span>🎮</span>
            <span>Kontrol: D-Pad Emulator (HP) / Tombol Panah (PC)</span>
          </span>
        </div>

        {/* ========================================================
            TARGET DROP ZONE: PUTRI RARA KUNING & RARA RUNTING
            (X: 11%..37%, Y: 35%..98%)
           ======================================================== */}
        <div
          onClick={() => {
            if (isHoldingAxe) triggerTreeCutAction();
          }}
          className={`absolute left-[11.0%] top-[35.0%] w-[26.0%] h-[62.0%] rounded-3xl z-20 cursor-pointer transition-all duration-200 flex flex-col items-center justify-start p-2 ${
            isHoveringPrincess
              ? 'ring-4 ring-yellow-400 bg-yellow-400/25 shadow-[0_0_40px_rgba(250,204,21,0.9)] scale-105 animate-pulse'
              : isHoldingAxe
              ? 'ring-2 ring-emerald-400/80 bg-emerald-400/10 shadow-[0_0_25px_rgba(52,211,153,0.5)] animate-pulse'
              : 'hover:bg-yellow-400/5'
          }`}
          title="Target: Putri Rara Kuning lan Rara Runting (Arahake kapak mréné)"
        >
          {isHoldingAxe && (
            <div className="px-3 py-1 rounded-full bg-stone-950/95 border border-yellow-400 text-yellow-300 text-[10px] sm:text-xs font-bold shadow-lg animate-bounce mt-2 whitespace-nowrap">
              🎯 Arahake kapak mréné kanggo nugel wit!
            </div>
          )}
        </div>

        {/* ========================================================
            HITBOX KAPAK DI LEMAH & TOMBOL "GUNAKAKE KAPAK"
           ======================================================== */}
        {!isHoldingAxe && !isPlayingVideo && (
          <>
            {/* 1. Hitbox Gambar Kapak ing Lemah */}
            <div
              onClick={() => handleAxePickup()}
              onPointerDown={(e) => {
                e.preventDefault();
                handleAxePickup(e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                if (e.touches[0]) {
                  handleAxePickup(e.touches[0].clientX, e.touches[0].clientY);
                } else {
                  handleAxePickup();
                }
              }}
              className="absolute left-[37.5%] top-[70.5%] w-[14.5%] h-[16.5%] rounded-2xl z-25 cursor-grab hover:ring-2 hover:ring-yellow-300 hover:bg-yellow-400/20 active:scale-95 transition-all flex items-center justify-center animate-pulse"
              title="Pencet utawa seret kapak iki!"
            >
              <div className="absolute inset-0 rounded-2xl border border-yellow-300/40 animate-ping opacity-60" />
              <span className="sr-only">Kapak ing lemah</span>
            </div>

            {/* 2. Hitbox Tombol Grafis "👆 Gunakake kapak" */}
            <button
              type="button"
              onClick={() => handleAxePickup()}
              onPointerDown={(e) => {
                e.preventDefault();
                handleAxePickup(e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                if (e.touches[0]) {
                  handleAxePickup(e.touches[0].clientX, e.touches[0].clientY);
                } else {
                  handleAxePickup();
                }
              }}
              title="Klik kanggo nggunakake kapak"
              className="group absolute left-[52.0%] top-[72.0%] w-[16.8%] h-[9.5%] rounded-full bg-transparent hover:bg-yellow-400/25 hover:ring-2 hover:ring-yellow-300 hover:shadow-[0_0_20px_rgba(250,204,21,0.6)] active:scale-95 transition-all cursor-pointer z-25 flex items-center justify-center"
            >
              <span className="sr-only">Gunakake kapak</span>
            </button>
          </>
        )}

        {/* ========================================================
            FLOATING AXE (MENGIKUTI D-PAD / ARROW KEYS / KURSOR)
           ======================================================== */}
        {isHoldingAxe && !isPlayingVideo && (
          <div
            style={{
              position: 'absolute',
              left: `${pointerPos.xPercent}%`,
              top: `${pointerPos.yPercent}%`,
              transform: 'translate(-50%, -50%) rotate(-15deg)',
              zIndex: 50,
              pointerEvents: 'auto',
            }}
            onPointerDown={() => setIsDraggingDirectly(true)}
            onTouchStart={() => setIsDraggingDirectly(true)}
            className="flex flex-col items-center select-none cursor-grab active:cursor-grabbing"
            title="Kapak dicekel! Seret utawa gunakan D-Pad / tombol panah"
          >
            {/* Gambar Kapak Melayang dengan Aura Bercahaya */}
            <div className="relative w-28 h-14 sm:w-36 sm:h-16 drop-shadow-[0_15px_25px_rgba(0,0,0,0.9)] filter brightness-110 animate-pulse">
              <Image
                src="/assets/level2/item-kapak.png"
                alt="Kapak Wesi"
                fill
                priority
                sizes="160px"
                className="object-contain"
              />
            </div>

            {/* Label Melayang */}
            <div className="px-3 py-0.5 rounded-full bg-stone-950/95 border border-yellow-400 text-yellow-300 text-[10px] font-bold shadow-2xl tracking-wide whitespace-nowrap mt-0.5 flex items-center gap-1">
              <span>🪓</span>
              <span>Arahake menyang Putri</span>
            </div>
          </div>
        )}

        {/* ========================================================
            D-PAD EMULATOR (HP / MOBILE & POINTER INTERAKTIF)
            Terletak persis di atas 4 tombol panah pada background:
            - Up:    left: 5.4%, top: 78.1%, w: 4.1%, h: 8.4%
            - Left:  left: 0.9%, top: 87.5%, w: 4.1%, h: 8.4%
            - Down:  left: 5.4%, top: 87.5%, w: 4.1%, h: 8.4%
            - Right: left: 9.8%, top: 87.5%, w: 4.1%, h: 8.4%
           ======================================================== */}
        <div className="pointer-events-auto select-none">
          {/* Tombol Atas (▲) */}
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              startDpadMove('up');
            }}
            onPointerUp={stopDpadMove}
            onPointerLeave={stopDpadMove}
            onTouchStart={(e) => {
              e.preventDefault();
              startDpadMove('up');
            }}
            onTouchEnd={stopDpadMove}
            onTouchCancel={stopDpadMove}
            title="Arahake Kapak Mendhuwur (▲)"
            className={`absolute left-[5.4%] top-[78.1%] w-[4.1%] h-[8.4%] rounded-lg z-30 transition-all cursor-pointer flex items-center justify-center ${
              activeDpadDir === 'up'
                ? 'bg-yellow-400/40 ring-2 ring-yellow-300 scale-90 shadow-[0_0_15px_rgba(250,204,21,0.8)]'
                : 'hover:bg-yellow-400/20 active:scale-90 hover:ring-1 hover:ring-yellow-400/60'
            }`}
          >
            <span className="sr-only">Panah Dhuwur</span>
          </button>

          {/* Tombol Kiwa (◀) */}
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              startDpadMove('left');
            }}
            onPointerUp={stopDpadMove}
            onPointerLeave={stopDpadMove}
            onTouchStart={(e) => {
              e.preventDefault();
              startDpadMove('left');
            }}
            onTouchEnd={stopDpadMove}
            onTouchCancel={stopDpadMove}
            title="Arahake Kapak Ngiwa (◀)"
            className={`absolute left-[0.9%] top-[87.5%] w-[4.1%] h-[8.4%] rounded-lg z-30 transition-all cursor-pointer flex items-center justify-center ${
              activeDpadDir === 'left'
                ? 'bg-yellow-400/40 ring-2 ring-yellow-300 scale-90 shadow-[0_0_15px_rgba(250,204,21,0.8)]'
                : 'hover:bg-yellow-400/20 active:scale-90 hover:ring-1 hover:ring-yellow-400/60'
            }`}
          >
            <span className="sr-only">Panah Kiwa</span>
          </button>

          {/* Tombol Ngisor (▼) */}
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              startDpadMove('down');
            }}
            onPointerUp={stopDpadMove}
            onPointerLeave={stopDpadMove}
            onTouchStart={(e) => {
              e.preventDefault();
              startDpadMove('down');
            }}
            onTouchEnd={stopDpadMove}
            onTouchCancel={stopDpadMove}
            title="Arahake Kapak Mengisor (▼)"
            className={`absolute left-[5.4%] top-[87.5%] w-[4.1%] h-[8.4%] rounded-lg z-30 transition-all cursor-pointer flex items-center justify-center ${
              activeDpadDir === 'down'
                ? 'bg-yellow-400/40 ring-2 ring-yellow-300 scale-90 shadow-[0_0_15px_rgba(250,204,21,0.8)]'
                : 'hover:bg-yellow-400/20 active:scale-90 hover:ring-1 hover:ring-yellow-400/60'
            }`}
          >
            <span className="sr-only">Panah Ngisor</span>
          </button>

          {/* Tombol Tengen (▶) */}
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              startDpadMove('right');
            }}
            onPointerUp={stopDpadMove}
            onPointerLeave={stopDpadMove}
            onTouchStart={(e) => {
              e.preventDefault();
              startDpadMove('right');
            }}
            onTouchEnd={stopDpadMove}
            onTouchCancel={stopDpadMove}
            title="Arahake Kapak Nengen (▶)"
            className={`absolute left-[9.8%] top-[87.5%] w-[4.1%] h-[8.4%] rounded-lg z-30 transition-all cursor-pointer flex items-center justify-center ${
              activeDpadDir === 'right'
                ? 'bg-yellow-400/40 ring-2 ring-yellow-300 scale-90 shadow-[0_0_15px_rgba(250,204,21,0.8)]'
                : 'hover:bg-yellow-400/20 active:scale-90 hover:ring-1 hover:ring-yellow-400/60'
            }`}
          >
            <span className="sr-only">Panah Tengen</span>
          </button>
        </div>

        {/* ========================================================
            VIDEO PLAYER OVERLAY (MUNCUL SAAT KAPAK MENYENTUH PUTRI)
           ======================================================== */}
        {isPlayingVideo && (
          <div className="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center animate-fade-in">
            <video
              ref={videoRef}
              src="/assets/level2/video_tebang_pohon.mp4"
              playsInline
              autoPlay
              muted={videoMuted}
              onEnded={handleVideoEnded}
              className="w-full h-full object-contain"
            />

            {/* Video Controls Bar di Atas */}
            <div className="absolute top-3 left-4 right-4 flex items-center justify-between z-50 pointer-events-auto">
              <div className="px-3 py-1 rounded-full bg-stone-950/80 border border-yellow-500/50 text-yellow-300 text-xs font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>Nugel Wit Gedhe...</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVideoMuted((m) => !m)}
                  className="px-3 py-1 rounded-full bg-stone-900/80 border border-stone-600 text-stone-200 text-xs font-semibold hover:bg-stone-800 transition"
                >
                  {videoMuted ? '🔇 Unmute' : '🔊 Mute'}
                </button>
                <button
                  type="button"
                  onClick={handleVideoEnded}
                  className="px-3.5 py-1 rounded-full bg-yellow-500 hover:bg-yellow-400 text-stone-950 text-xs font-black shadow transition active:scale-95"
                >
                  Lewati Video ⏭️
                </button>
              </div>
            </div>

            {/* Modal Selesai Video */}
            {videoCompleted && (
              <div className="absolute inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
                <div className="max-w-md w-full bg-stone-900 border-2 border-yellow-500/90 rounded-2xl p-6 shadow-2xl text-stone-100 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-4xl shadow-lg">
                    🌲
                  </div>
                  <h3 className="text-xl font-serif font-black text-yellow-400">
                    Wit Gedhe Kasil Ditugel!
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
                    Dalan tumuju Gunung Wilis wis tinarbuka. Putri Rara Kuning lan Rara Runting saiki bisa nerusake lelampahan golek usada!
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setVideoCompleted(false);
                        if (videoRef.current) {
                          videoRef.current.currentTime = 0;
                          videoRef.current.play();
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300 text-xs font-bold transition"
                    >
                      Putar Ulang 🎬
                    </button>
                    <Link
                      href="/level2/kali"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-stone-950 font-black text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>🌊</span> Lanjut menyang Kali (Jembatan Kayu) →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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
