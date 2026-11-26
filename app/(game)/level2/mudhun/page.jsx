'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AnalogJoystick from '@/components/game/AnalogJoystick';

const HERBAL_LEAVES = [
  {
    id: 'tapak_liman',
    name: 'Godhong Tapak Liman',
    targetCount: 3,
    khasiat: 'Nglancarake getih, ngudhunake panas benter, lan ngempiske abuh gondhok.',
    top: '38.2%',
  },
  {
    id: 'sirih',
    name: 'Godhong Sirih',
    targetCount: 3,
    khasiat: 'Ngresiki kuman ing kulit, ngurangi gatel-gatel, lan nguwatake daya tahan awak.',
    top: '48.8%',
  },
  {
    id: 'sambiloto',
    name: 'Godhong Sambiloto',
    targetCount: 3,
    khasiat: 'Jamu pait kang mandi banget kanggo nambani lelara kuning lan ngresiki ati.',
    top: '58.8%',
  },
  {
    id: 'mindi',
    name: 'Godhong Mindi',
    targetCount: 3,
    khasiat: 'Marasake lelara kulit sisik lan ngresiki racun saka njero lan njaba awak.',
    top: '68.6%',
  },
];

export default function Level2MudhunPage() {
  const router = useRouter();
  const supabase = createClient();
  const audioCtxRef = useRef(null);
  const navLockRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [toast, setToast] = useState(null);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!user) router.push('/login?role=murid');
      })
      .finally(() => setLoading(false));
  }, [router, supabase]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const playChime = useCallback(() => {
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

  const handleMiwitiNgumbara = useCallback(() => {
    playChime();
    setShowStartModal(true);
  }, [playChime]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#120b05] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm tracking-wide text-amber-200">Mbukak Adegan Lv 2 – Mudhun...</p>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-[#120b05] text-stone-100 flex flex-col items-center justify-center overflow-hidden select-none font-sans">
      {/* Container 16:9 (1024 x 576) */}
      <div className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl select-none">
        <Image
          src="/assets/level2/screen_mudhun_tantangan.jpg"
          alt="Lv 2 – Mudhun: Dhawuhe Resi Darmo Ngumpulake Gegodhongan Jamu"
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
          title="Kawruh Gegodhongan Jamu"
          className="absolute left-[83.8%] top-[1.2%] w-[4.0%] h-[6.8%] rounded-full bg-transparent hover:bg-yellow-400/20 cursor-pointer z-30"
        >
          <span className="sr-only">Kawruh Jamu</span>
        </button>

        <button
          type="button"
          onClick={() => setShowHelpModal(true)}
          title="Petunjuk Tantangan"
          className="absolute left-[89.1%] top-[1.2%] w-[4.0%] h-[6.8%] rounded-full bg-transparent hover:bg-yellow-400/20 cursor-pointer z-30"
        >
          <span className="sr-only">Petunjuk</span>
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

        {/* Hitbox Balon Dhawuhe Resi Darmo */}
        <div
          onClick={() => setShowStoryModal(true)}
          title="Klik kanggo maca dhawuhe Resi Darmo"
          className="absolute left-[20.2%] top-[10.8%] w-[34.8%] h-[32.5%] rounded-3xl bg-transparent hover:bg-yellow-400/10 cursor-pointer z-20 transition-all"
        />

        {/* Hitbox Interaktif 4 Kartu Gegodhongan ing Panel Tantanganmu */}
        {HERBAL_LEAVES.map((leaf) => (
          <button
            key={leaf.id}
            type="button"
            onClick={() =>
              setToast({
                text: `🍃 ${leaf.name} (0/${leaf.targetCount}): ${leaf.khasiat}`,
              })
            }
            style={{ top: leaf.top }}
            title={`${leaf.name}: ${leaf.khasiat}`}
            className="absolute left-[73.2%] w-[24.2%] h-[9.2%] rounded-xl bg-transparent hover:bg-emerald-400/15 hover:ring-1 hover:ring-emerald-500/60 transition-all cursor-pointer z-25"
          >
            <span className="sr-only">{leaf.name}</span>
          </button>
        ))}

        {/* ========================================================
            TOMBOL TRANSPARAN: ▶ MIWITI NGUMBARA
           ======================================================== */}
        <button
          type="button"
          onClick={handleMiwitiNgumbara}
          title="Miwiti Ngumbara Golek Gegodhongan Jamu"
          className="absolute left-[36.0%] top-[88.3%] w-[26.8%] h-[8.2%] rounded-full bg-transparent hover:bg-yellow-300/20 hover:ring-2 hover:ring-yellow-300 hover:shadow-[0_0_28px_rgba(250,204,21,0.7)] active:scale-[0.98] transition-all duration-200 cursor-pointer z-35 flex items-center justify-center"
        >
          <span className="sr-only">Miwiti Ngumbara</span>
        </button>

        {/* Navigasi Bali Cilik ing Pojok Kiwa Ngisor */}
        <div className="absolute bottom-2.5 left-4 z-30">
          <Link
            href="/level2/sowan"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold backdrop-blur-md shadow-md active:scale-95 transition-all"
          >
            <span>⬅</span> Sowan Resi Darmo
          </Link>
        </div>

        {/* Kontroler Analog 360° */}
        <AnalogJoystick
          onChange={({ x, active }) => {
            if (!active) return;
            if (x > 0.75 && !showStartModal) {
              handleMiwitiNgumbara();
            } else if (x < -0.75 && !navLockRef.current) {
              navLockRef.current = true;
              router.push('/level2/sowan');
            }
          }}
        />
      </div>

      {/* Toast Khasiat Godhong */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] px-4 py-2.5 rounded-2xl border bg-emerald-950/95 border-emerald-400 text-emerald-100 text-xs sm:text-sm font-bold shadow-2xl">
          {toast.text}
        </div>
      )}

      {/* Modal Miwiti Ngumbara Golek Gegodhongan */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md font-sans">
          <div className="relative max-w-md w-full bg-stone-900 border-2 border-yellow-500/90 rounded-2xl p-6 shadow-2xl text-stone-100 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-3xl shadow-lg">
              🌿
            </div>
            <h3 className="text-xl font-serif font-black text-yellow-400">
              Tantangan Ngumpulake Gegodhongan Jamu!
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
              Miturut dhawuhe <strong>Resi Darmo</strong>, Rara Kuning lan Rara Runting kudu nggoleki 4 jinis gegodhongan ing alas kanggo diracik dadi jamu usada:
            </p>
            <div className="grid grid-cols-2 gap-2 text-left text-xs bg-stone-950/80 p-3 rounded-xl border border-amber-500/30">
              {HERBAL_LEAVES.map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-1 px-2 py-1 rounded bg-amber-950/40 text-amber-200">
                  <span className="truncate font-semibold">🍃 {l.name.replace('Godhong ', '')}</span>
                  <span className="font-mono text-yellow-300 font-bold">0/{l.targetCount}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-1">
              <button
                type="button"
                onClick={() => setShowStartModal(false)}
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300 text-xs font-bold cursor-pointer"
              >
                Deleng Tantangan
              </button>
              <Link
                href="/peta"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-stone-950 font-black text-xs sm:text-sm shadow-lg"
              >
                🗺️ Lanjut menyang Peta →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kawruh Gegodhongan Jamu */}
      {showStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md font-sans">
          <div className="relative max-w-lg w-full bg-stone-900 border-2 border-yellow-500/80 rounded-2xl p-6 shadow-2xl text-stone-100 space-y-4">
            <h3 className="text-xl font-serif font-black text-yellow-400 flex items-center gap-2">
              <span>📖</span> Dhawuhe Resi Darmo &amp; Kawruh Gegodhongan
            </h3>
            <p className="text-xs sm:text-sm text-amber-100/95 font-serif italic bg-amber-950/40 p-3 rounded-xl border border-yellow-500/30 leading-relaxed">
              &ldquo;Becik, Rara Kuning lan Rara Runting. Kanggo nerusaké perawatan, uga kudu ngumpulake maneka werna gegodhongan kanggo jamu. Golekana godhong Tapak Liman, godhong Sirih, godhong Sambiloto, lan godhong Mindi ing alas. Saben godhong iku bakal dakracik dadi jamu kanggo marasaké panyakitmu.&rdquo;
            </p>
            <div className="space-y-2 text-xs sm:text-sm text-stone-300 font-serif">
              {HERBAL_LEAVES.map((leaf) => (
                <p key={leaf.id}>
                  • <strong className="text-emerald-300">{leaf.name}:</strong> {leaf.khasiat}
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

      {/* Modal Petunjuk */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md font-sans">
          <div className="relative max-w-md w-full bg-stone-900 border-2 border-yellow-500/80 rounded-2xl p-6 shadow-2xl text-stone-100 space-y-3">
            <h3 className="text-lg font-serif font-black text-yellow-400 flex items-center gap-2">
              <span>❓</span> Petunjuk Adegan Lv 2 – Mudhun
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
              1. Wacanen dhawuhe Resi Darmo babagan gegodhongan jamu sing kudu digoleki.<br />
              2. Klik saben kartu godhong ing kothak <strong>Tantanganmu</strong> sisih tengen kanggo nyumurupi khasiate.<br />
              3. Pencet tombol kuning <strong>▶ Miwiti Ngumbara</strong> kanggo miwiti tantangan!
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
