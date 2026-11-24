'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Level2AlasKapakPage() {
  const router = useRouter();
  const supabase = createClient();
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);

  // Axe & Pointer States
  const [isHoldingAxe, setIsHoldingAxe] = useState(false);
  const [pointerPos, setPointerPos] = useState({ xPercent: 50, yPercent: 50 });
  const [isHoveringPrincess, setIsHoveringPrincess] = useState(false);

  // Video & Completion States
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [toast, setToast] = useState(null);

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

  // Pointer position calculator relative to 2:1 container
  const updatePointer = (clientX, clientY) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    setPointerPos({ xPercent, yPercent });

    // Target Hitbox: Putri Rara Kuning & Rara Runting (X: 10%..38%, Y: 35%..98%)
    const isTarget = xPercent >= 10 && xPercent <= 38 && yPercent >= 35 && yPercent <= 98;
    setIsHoveringPrincess(isTarget);

    return isTarget;
  };

  // Pickup Axe
  const handleAxePickup = (clientX, clientY) => {
    setIsHoldingAxe(true);
    updatePointer(clientX, clientY);
    setToast({
      type: 'info',
      text: '🪓 Kapak dicekel! Seret menyang Putri Rara Kuning utawa Rara Runting kanggo nugel wit!',
    });
  };

  const handlePointerMove = (e) => {
    if (!isHoldingAxe) return;
    const isTarget = updatePointer(e.clientX, e.clientY);
    // Instant trigger if cursor touches princess while holding axe
    if (isTarget) {
      triggerTreeCutAction();
    }
  };

  const handleTouchMove = (e) => {
    if (!isHoldingAxe || !e.touches[0]) return;
    const isTarget = updatePointer(e.touches[0].clientX, e.touches[0].clientY);
    // Instant trigger if touch point touches princess while holding axe
    if (isTarget) {
      triggerTreeCutAction();
    }
  };

  const handlePointerUp = () => {
    if (!isHoldingAxe) return;

    if (isHoveringPrincess) {
      triggerTreeCutAction();
    } else {
      // Released outside princess
      setIsHoldingAxe(false);
      setIsHoveringPrincess(false);
      setToast({
        type: 'info',
        text: 'Arahake kapak nganti nyentuh Putri Rara Kuning utawa Rara Runting.',
      });
    }
  };

  // Trigger Action: Play Cut Video
  const triggerTreeCutAction = () => {
    setIsHoldingAxe(false);
    setIsHoveringPrincess(false);
    setIsPlayingVideo(true);
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
  };

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
        Menjamin koordinat hitbox kapak dan putri selalu 100% tepat presisi di layar mana pun
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
            TARGET DROP ZONE: PUTRI RARA KUNING & RARA RUNTING
            (X: 11%..37%, Y: 35%..98%)
           ======================================================== */}
        <div
          onClick={() => {
            if (isHoldingAxe) triggerTreeCutAction();
          }}
          className={`absolute left-[11.0%] top-[35.0%] w-[26.0%] h-[62.0%] rounded-3xl z-20 cursor-pointer transition-all duration-200 flex flex-col items-center justify-start p-2 ${
            isHoveringPrincess
              ? 'ring-4 ring-yellow-400 bg-yellow-400/20 shadow-[0_0_40px_rgba(250,204,21,0.85)] scale-105 animate-pulse'
              : isHoldingAxe
              ? 'ring-2 ring-emerald-400/80 bg-emerald-400/10 shadow-[0_0_25px_rgba(52,211,153,0.5)] animate-pulse'
              : 'hover:bg-yellow-400/5'
          }`}
          title="Target: Putri Rara Kuning lan Rara Runting (Arahake kapak mréné)"
        >
          {isHoldingAxe && (
            <div className="px-3 py-1 rounded-full bg-stone-950/90 border border-yellow-400 text-yellow-300 text-[10px] sm:text-xs font-bold shadow-lg animate-bounce mt-2 whitespace-nowrap">
              🎯 Selehake kapak ing kéné!
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
              onPointerDown={(e) => {
                e.preventDefault();
                handleAxePickup(e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                if (e.touches[0]) {
                  handleAxePickup(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              className="absolute left-[37.5%] top-[70.5%] w-[14.5%] h-[16.5%] rounded-2xl z-20 cursor-grab hover:ring-2 hover:ring-yellow-300 hover:bg-yellow-400/15 transition-all flex items-center justify-center animate-pulse"
              title="Pencet utawa seret kapak iki!"
            >
              <span className="sr-only">Kapak ing lemah</span>
            </div>

            {/* 2. Hitbox Tombol Grafis "👆 Gunakake kapak" */}
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                handleAxePickup(e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                if (e.touches[0]) {
                  handleAxePickup(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              title="Klik kanggo nggunakake kapak"
              className="absolute left-[52.0%] top-[72.0%] w-[16.8%] h-[9.5%] rounded-full bg-transparent hover:bg-yellow-400/25 hover:ring-2 hover:ring-yellow-300 hover:shadow-[0_0_20px_rgba(250,204,21,0.6)] active:scale-95 transition-all cursor-pointer z-20 flex items-center justify-center"
            >
              <span className="sr-only">Gunakake kapak</span>
            </button>
          </>
        )}

        {/* ========================================================
            FLOATING AXE (MENGIKUTI KURSOR / TOUCH POINT)
           ======================================================== */}
        {isHoldingAxe && (
          <div
            style={{
              position: 'absolute',
              left: `${pointerPos.xPercent}%`,
              top: `${pointerPos.yPercent}%`,
              transform: 'translate(-50%, -50%) rotate(-15deg)',
              zIndex: 50,
              pointerEvents: 'none',
            }}
            className="flex flex-col items-center select-none"
          >
            {/* Gambar Kapak Melayang */}
            <div className="relative w-28 h-14 sm:w-36 sm:h-16 drop-shadow-[0_15px_25px_rgba(0,0,0,0.9)] filter brightness-110">
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
            <div className="px-3 py-0.5 rounded-full bg-stone-950/95 border border-yellow-400 text-yellow-300 text-[10px] font-bold shadow-2xl tracking-wide whitespace-nowrap mt-0.5">
              ✨ Kapak Siap Digunakake
            </div>
          </div>
        )}

        {/* ========================================================
            D-PAD DI KIRI BAWAH
           ======================================================== */}
        {/* Tombol Kiri (⬅) -> Kembali ke Lv 2 Mucuk */}
        <button
          type="button"
          onClick={() => router.push('/level2/mucuk')}
          title="Bali menyang Adegan Mucuk"
          className="absolute left-[0.9%] top-[84.0%] w-[4.0%] h-[15.0%] rounded-lg bg-transparent hover:bg-yellow-400/20 active:scale-95 transition-all cursor-pointer z-20"
        >
          <span className="sr-only">Bali</span>
        </button>

        {/* ========================================================
            NAVIGASI POJOK BAWAH
           ======================================================== */}
        <div className="absolute bottom-2.5 left-4 z-30">
          <Link
            href="/level2/mucuk"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold backdrop-blur-md shadow-md active:scale-95 transition-all"
          >
            <span>⬅</span> Bali menyang Adegan Mucuk
          </Link>
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
                      href="/peta"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-stone-950 font-black text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>🗺️</span> Lanjut menyang Peta Petualangan →
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
