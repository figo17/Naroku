'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/*
  PHASE STATE MACHINE
  -------------------
  'intro'           → Roro Kuning & Runting berdiri di kiri, kapak di tanah, tombol "Gunakake Kapak" muncul
  'walking_to_axe'  → Karakter berjalan ke kanan menuju kapak (CSS transition left)
  'pickup'          → Sparkle + efek ambil kapak, kapak melayang di atas karakter
  'walking_to_tree' → Karakter berjalan ke kanan menuju pohon tumbang dengan kapak
  'chopping'        → Animasi menggergaji pohon (kapak swing + wood chip particles)
  'done'            → Modal sukses, lanjut ke kali
*/

// Posisi karakter (dalam persen, relatif ke container 1024×512)
const CHAR_POS = {
  intro:        { left: '10%',  bottom: '12%' },  // kiri, di atas jalan
  atAxe:        { left: '33%',  bottom: '12%' },  // dekat kapak
  atTree:       { left: '58%',  bottom: '20%' },  // dekat pohon tumbang
};

// Posisi kapak saat di tanah (persen 1024×512)
const AXE_ON_GROUND = { left: '39%', bottom: '14%' };

export default function Level2AlasKapakPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading]   = useState(true);
  const [phase, setPhase]       = useState('intro');   // state machine
  const [woodChips, setWoodChips] = useState([]);       // partikel tatal kayu
  const phaseRef = useRef('intro');

  // ─── Auth ────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login?role=murid'); return; }
      } catch (err) {
        console.error('Level 2 Alas auth error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router, supabase]);

  // ─── Phase Transition Helper ─────────────────────────────────────────────
  function goPhase(next) {
    phaseRef.current = next;
    setPhase(next);
  }

  // ─── Tombol "Gunakake Kapak" ditekan → mulai walk ────────────────────────
  function handleStart() {
    if (phaseRef.current !== 'intro') return;
    goPhase('walking_to_axe');

    // Setelah karakter sampai di kapak (2.4 detik)
    setTimeout(() => {
      goPhase('pickup');

      // Setelah animasi pickup (1.0 detik) → jalan ke pohon
      setTimeout(() => {
        goPhase('walking_to_tree');

        // Setelah sampai di pohon (2.4 detik) → mulai menggergaji
        setTimeout(() => {
          goPhase('chopping');
          spawnWoodChips();

          // Setelah menggergaji (4.0 detik) → selesai
          setTimeout(() => {
            goPhase('done');
          }, 4000);
        }, 2400);
      }, 1000);
    }, 2400);
  }

  // ─── Wood Chip Particles ─────────────────────────────────────────────────
  function spawnWoodChips() {
    const chips = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      dx: (Math.random() - 0.5) * 60,
      dy: -(Math.random() * 50 + 20),
      rot: Math.random() * 360,
      delay: Math.random() * 0.5,
    }));
    setWoodChips(chips);
    setTimeout(() => setWoodChips([]), 2000);
  }

  // ─── Derived values dari phase ────────────────────────────────────────────
  const isWalking   = phase === 'walking_to_axe' || phase === 'walking_to_tree';
  const hasAxe      = ['pickup', 'walking_to_tree', 'chopping', 'done'].includes(phase);
  const isChopping  = phase === 'chopping';
  const isDone      = phase === 'done';

  // Posisi karakter sesuai phase
  let charPos = CHAR_POS.intro;
  if (phase === 'walking_to_axe' || phase === 'pickup') charPos = CHAR_POS.atAxe;
  if (phase === 'walking_to_tree' || phase === 'chopping' || phase === 'done') charPos = CHAR_POS.atTree;

  // ─── Loading Screen ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#030a08] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm tracking-wide text-amber-200">Mbukak Lelampahan Alas Gunung Wilis...</p>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-[#020705] text-stone-100 flex flex-col items-center justify-center overflow-hidden select-none font-sans">

      {/* ── Keyframe Animations ─────────────────────────────────────────── */}
      <style>{`
        @keyframes roroWalkBob {
          0%   { transform: translateY(0px)  rotate(0deg)   scale(1,0.98); }
          25%  { transform: translateY(-8px) rotate(2deg)   scale(0.99,1.02); }
          50%  { transform: translateY(0px)  rotate(0deg)   scale(1,0.98); }
          75%  { transform: translateY(-8px) rotate(-2deg)  scale(0.99,1.02); }
          100% { transform: translateY(0px)  rotate(0deg)   scale(1,0.98); }
        }
        @keyframes roroIdleBreath {
          0%,100% { transform: translateY(0px); }
          50%     { transform: translateY(-3px); }
        }
        @keyframes pickupBounce {
          0%   { transform: scale(1) translateY(0); }
          30%  { transform: scale(1.18) translateY(-10px); }
          60%  { transform: scale(0.95) translateY(2px); }
          100% { transform: scale(1) translateY(0); }
        }
        @keyframes kapakFloat {
          0%,100% { transform: translateY(0px) rotate(-10deg); }
          50%     { transform: translateY(-6px) rotate(-10deg); }
        }
        @keyframes kapakChop {
          0%,100% { transform: rotate(-35deg) translate(0px,0px); }
          50%     { transform: rotate(25deg)  translate(8px,12px); }
        }
        @keyframes woodChipFly {
          0%   { opacity:1; transform: translate(0,0) rotate(0deg); }
          100% { opacity:0; transform: translate(var(--dx),var(--dy)) rotate(var(--rot)); }
        }
        @keyframes sparkle {
          0%,100% { opacity:0; transform:scale(0.5); }
          50%     { opacity:1; transform:scale(1.4); }
        }
        @keyframes fadeIn {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .anim-walk    { animation: roroWalkBob   0.5s ease-in-out infinite; }
        .anim-idle    { animation: roroIdleBreath 2.5s ease-in-out infinite; }
        .anim-pickup  { animation: pickupBounce  0.6s ease-in-out; }
        .anim-float   { animation: kapakFloat    1.6s ease-in-out infinite; }
        .anim-chop    { animation: kapakChop     0.45s ease-in-out infinite; }
        .anim-fadein  { animation: fadeIn        0.5s ease-out forwards; }
      `}</style>

      {/* ── Container 1024×512 (2:1 Aspect Ratio) ───────────────────────── */}
      <div
        className="relative w-full h-full max-w-[calc(100vh*1024/512)] max-h-[calc(100vw*512/1024)] aspect-[1024/512] overflow-hidden shadow-2xl"
      >

        {/* Background */}
        <Image
          src="/assets/level2/screen_alas_kapak.jpg"
          alt="Alas Gunung Wilis - Wit Gedhe Ngalangi Dalan"
          fill priority sizes="100vw"
          className="object-contain object-center"
        />

        {/* ── Navigasi ──────────────────────────────────────────────────── */}
        <div className="absolute top-3 left-4 z-30 flex items-center gap-2">
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

        {/* ── KAPAK DI TANAH (hanya saat intro) ────────────────────────── */}
        {phase === 'intro' && (
          <div
            className="absolute z-20"
            style={{ left: AXE_ON_GROUND.left, bottom: AXE_ON_GROUND.bottom, transform: 'translateX(-50%)' }}
          >
            {/* Sparkle aura di bawah kapak */}
            <div className="absolute -inset-3 rounded-full bg-yellow-400/20 animate-pulse" />
            <div
              className="relative"
              style={{ width: '7vw', maxWidth: 90, minWidth: 55, aspectRatio: '2.2/1' }}
            >
              <Image
                src="/assets/level2/item-kapak.png"
                alt="Kapak di lemah"
                fill sizes="90px"
                className="object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.9)]"
              />
            </div>
          </div>
        )}

        {/* ── TOMBOL "GUNAKAKE KAPAK" (saat intro) ─────────────────────── */}
        {phase === 'intro' && (
          <button
            type="button"
            onClick={handleStart}
            className="absolute z-25 flex items-center gap-2 px-4 py-2 rounded-full bg-amber-900/90 hover:bg-amber-800 border-2 border-yellow-400 text-yellow-200 font-black text-xs sm:text-sm shadow-2xl hover:shadow-yellow-500/40 active:scale-95 transition-all anim-fadein"
            style={{ left: '48%', bottom: '17%', transform: 'translateX(-50%)' }}
          >
            <span className="text-base">🪓</span>
            Gunakake Kapak!
          </button>
        )}

        {/* ── KARAKTER: RARA RUNTING (kiri / depan) ────────────────────── */}
        <div
          className="absolute z-20 flex flex-col items-center transition-all ease-in-out"
          style={{
            left: charPos.left,
            bottom: charPos.bottom,
            transitionDuration: isWalking ? '2.4s' : '0s',
            transform: 'translateX(-50%)',
          }}
        >
          <div
            className={
              isWalking   ? 'anim-walk'   :
              phase === 'pickup' ? 'anim-pickup' :
              'anim-idle'
            }
          >
            <div
              style={{ width: '7vw', maxWidth: 80, minWidth: 46, aspectRatio: '130/315' }}
              className="relative"
            >
              <Image
                src="/assets/level2/karakter-rara-runting-tengok.png"
                alt="Rara Runting"
                fill sizes="80px"
                className="object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.75)]"
              />
            </div>
          </div>
        </div>

        {/* ── KARAKTER: RARA KUNING (kanan / belakang) ─────────────────── */}
        <div
          className="absolute z-19 flex flex-col items-center transition-all ease-in-out"
          style={{
            left: `calc(${charPos.left} + 5%)`,
            bottom: charPos.bottom,
            transitionDuration: isWalking ? '2.4s' : '0s',
            transform: 'translateX(-50%)',
          }}
        >
          <div
            className={
              isWalking   ? 'anim-walk'   :
              phase === 'pickup' ? 'anim-pickup' :
              'anim-idle'
            }
            style={{ animationDelay: '0.12s' }}
          >
            <div
              style={{ width: '8vw', maxWidth: 90, minWidth: 52, aspectRatio: '241/331' }}
              className="relative"
            >
              <Image
                src="/assets/level2/karakter-rara-kuning-tunjuk.png"
                alt="Rara Kuning"
                fill sizes="90px"
                className="object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.75)]"
              />
            </div>
          </div>
        </div>

        {/* ── KAPAK MELAYANG DI TANGAN (setelah pickup) ────────────────── */}
        {hasAxe && (
          <div
            className="absolute z-25 transition-all ease-in-out pointer-events-none"
            style={{
              left: `calc(${charPos.left} + 2%)`,
              bottom: `calc(${charPos.bottom} + 10%)`,
              transitionDuration: isWalking ? '2.4s' : '0s',
              transform: 'translateX(-50%)',
            }}
          >
            <div
              className={isChopping ? 'anim-chop' : 'anim-float'}
              style={{ transformOrigin: 'bottom left' }}
            >
              <div
                style={{ width: '5vw', maxWidth: 68, minWidth: 38, aspectRatio: '2.2/1' }}
                className="relative"
              >
                <Image
                  src="/assets/level2/item-kapak.png"
                  alt="Kapak dicekel"
                  fill sizes="68px"
                  className="object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── TATAL KAYU (woodchip particles) ─────────────────────────── */}
        {woodChips.map(chip => (
          <div
            key={chip.id}
            className="absolute z-30 w-3 h-2 rounded-sm bg-amber-700 pointer-events-none"
            style={{
              left: `calc(${CHAR_POS.atTree.left} + 8%)`,
              bottom: `calc(${CHAR_POS.atTree.bottom} + 8%)`,
              '--dx': `${chip.dx}px`,
              '--dy': `${chip.dy}px`,
              '--rot': `${chip.rot}deg`,
              animation: `woodChipFly 1.0s ease-out ${chip.delay}s forwards`,
            }}
          />
        ))}

        {/* ── SPEECH BUBBLE (intro & walking_to_axe) ───────────────────── */}
        {(phase === 'intro' || phase === 'walking_to_axe') && (
          <div className="absolute top-[8%] left-[4%] z-30 flex gap-3 anim-fadein">
            {/* Rara Kuning */}
            <div className="bg-amber-950/90 border border-yellow-400/80 rounded-xl px-3 py-2 text-[9px] sm:text-xs text-yellow-100 font-semibold shadow-xl max-w-[18ch] leading-relaxed">
              <span className="block text-yellow-400 font-black text-[8px] mb-0.5">Putri Rara Kuning</span>
              Dhuh..ana wit gedhe sing ngalangi dalan. Kepriye iki dhik?
            </div>
            {/* Rara Runting */}
            <div className="bg-stone-900/90 border border-emerald-400/70 rounded-xl px-3 py-2 text-[9px] sm:text-xs text-stone-100 font-semibold shadow-xl max-w-[20ch] leading-relaxed">
              <span className="block text-emerald-400 font-black text-[8px] mb-0.5">Putri Rara Runting</span>
              Tenang Mbakyu, iku ana kapak. Ayo nagunakake kapak iki kanggo nugel wit iki, supaya bisa liwat.
            </div>
          </div>
        )}

        {/* ── SPEECH BUBBLE (pickup) ───────────────────────────────────── */}
        {phase === 'pickup' && (
          <div className="absolute top-[8%] left-[4%] z-30 anim-fadein">
            <div className="bg-emerald-950/90 border border-emerald-400/80 rounded-xl px-3 py-2 text-[9px] sm:text-xs text-emerald-100 font-semibold shadow-xl max-w-[24ch] leading-relaxed">
              <span className="block text-emerald-300 font-black text-[8px] mb-0.5">✨ Kapak kasil dijupuk!</span>
              Saiki ayo nugel wit sing ngalangi dalan!
            </div>
          </div>
        )}

        {/* ── SPEECH BUBBLE (walking_to_tree / chopping) ───────────────── */}
        {(phase === 'walking_to_tree' || phase === 'chopping') && (
          <div className="absolute top-[8%] left-[4%] z-30 anim-fadein">
            <div className="bg-amber-950/90 border border-yellow-400/80 rounded-xl px-3 py-2 text-[9px] sm:text-xs text-yellow-100 font-semibold shadow-xl max-w-[22ch] leading-relaxed">
              <span className="block text-yellow-400 font-black text-[8px] mb-0.5">
                {phase === 'chopping' ? '🪓 Nugel wit...' : 'Ayo menyang wit!'}
              </span>
              {phase === 'chopping'
                ? 'Dheg! Dheg! Dheg! Kapak ngethok wit gedhe karo sekuat tenaga!'
                : 'Ayo Mbakyu, nugel wit karo kapak iki!'}
            </div>
          </div>
        )}

        {/* ── MODAL SELESAI ─────────────────────────────────────────────── */}
        {isDone && (
          <div className="absolute inset-0 z-40 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 anim-fadein">
            <div className="max-w-sm w-full bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-yellow-500/90 rounded-2xl p-6 shadow-2xl text-center space-y-4">

              {/* Icon */}
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-4xl shadow-lg">
                🌲
              </div>

              {/* Judul */}
              <h3 className="text-xl font-serif font-black text-yellow-400">
                Wit Kasil Ditugel! 🎉
              </h3>

              {/* Deskripsi */}
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
                Mantap! Dalan tumuju Gunung Wilis wis tinarbuka. Putri Rara Kuning lan Rara Runting saiki bisa nerusake lelampahan golek usada!
              </p>

              {/* Tombol aksi */}
              <div className="pt-2 flex flex-col gap-2.5">
                <Link
                  href="/level2/kali"
                  className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-stone-950 font-black text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  🌊 Lanjut menyang Kali →
                </Link>
                <button
                  type="button"
                  onClick={() => { goPhase('intro'); setWoodChips([]); }}
                  className="w-full px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300 text-xs font-bold transition"
                >
                  Muter Maneh 🔄
                </button>
              </div>
            </div>
          </div>
        )}

      </div>{/* end container */}
    </div>
  );
}
