'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const PIWULANG_LIST = [
  {
    id: 1,
    icon: '🪷',
    title: 'Sabar lan ikhlas nampa pacoban.',
    meaning:
      'Sanadyan nandhang lelara abot, Putri Rara Kuning lan Rara Runting tetep sabar, narima ing pandum, lan ora nyalahake kahanan.',
    top: '30.8%',
  },
  {
    id: 2,
    icon: '⛰️',
    title: 'Ora gampang nglokro.',
    meaning:
      'Para putri ora putus asa nalika nempuh dalan rumpil ing alas Gunung Wilis nganti tekan Padhepokan Resi Darmo.',
    top: '41.2%',
  },
  {
    id: 3,
    icon: '🌱',
    title: 'Ngurmati alam.',
    meaning:
      'Tetuwuhan alas lan banyu grojogan dijaga kanthi becik amarga alam maringi usada lan panguripan kanggo manungsa.',
    top: '51.8%',
  },
  {
    id: 4,
    icon: '✊',
    title: 'Tekad sing kuwat.',
    meaning:
      'Kanthi tekad lan ikhtiar sing mantep, saben rintangan — kali, jurang, guwa peteng, nganti labirin — kasil diliwati.',
    top: '62.6%',
  },
  {
    id: 5,
    icon: '🏯',
    title: 'Ngurmati tradhisi leluhur.',
    meaning:
      'Ngajeni pitutur wong tuwa, tata krama marang Resi Darmo, sarta nglestarekake kawruh jamu tradhisional Jawa.',
    top: '73.2%',
  },
];

export default function Level3PiwulangPage() {
  const router = useRouter();
  const supabase = createClient();
  const audioCtxRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState(null);
  const [piyeulanScore, setPiyeulanScore] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const [toast, setToast] = useState(null);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showMisiModal, setShowMisiModal] = useState(false);

  useEffect(() => {
    router.prefetch('/pengembang');
    router.prefetch('/peta');
    router.prefetch('/level3/apresiasi');

    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login?role=murid');
          return;
        }

        const [profRes, piyRes, narRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('nama_lengkap, nomor_induk')
            .eq('id', user.id)
            .maybeSingle(),
          supabase
            .from('level3_piyeulan_answers')
            .select('score, is_completed')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('level3_nulis_answers')
            .select('word_count')
            .eq('user_id', user.id)
            .maybeSingle(),
        ]);

        if (profRes.data) setStudentProfile(profRes.data);
        if (piyRes.data?.is_completed) setPiyeulanScore(piyRes.data.score);
        if (narRes.data?.word_count) setWordCount(narRes.data.word_count);
      } catch (err) {
        console.error('Error loading Level 3 Piwulang:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router, supabase]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  const playChime = useCallback((isFinale = false) => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const freqs = isFinale
        ? [523.25, 659.25, 783.99, 1046.5, 1318.5]
        : [587.33, 880];

      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const s = now + idx * 0.11;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, s);
        gain.gain.setValueAtTime(0.2, s);
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

  const handleRampung = useCallback(() => {
    playChime(true);
    router.push('/pengembang');
  }, [playChime, router]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#04140d] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm tracking-wide text-amber-200">Mbukak Piwulang Luhur Rara Kuning...</p>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-[#04140d] text-stone-100 flex items-center justify-center overflow-hidden select-none font-sans">
      {/* Ambient Full-Screen Backdrop supaya layar widescreen katon kebak lan resik */}
      <Image
        src="/assets/level3/screen_piwulang.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center blur-xl scale-110 opacity-65 pointer-events-none"
      />

      {/* Container Presisi 1024 x 770 */}
      <div className="relative w-full h-full max-w-[calc(100vh*1024/770)] max-h-[calc(100vw*770/1024)] aspect-[1024/770] overflow-hidden shadow-2xl">
        <Image
          src="/assets/level3/screen_piwulang.jpg"
          alt="Piwulang saka Crita Legenda Rara Kuning"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
        />

        {/* Tombol Bali menyang Piyeulan ing Pojok Kiwa Ndhuwur */}
        <Link
          href="/level3/piyeulan"
          className="absolute left-3 top-2.5 z-35 px-3 py-1 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-yellow-500/55 text-yellow-300 text-[10px] sm:text-xs font-bold shadow-md"
        >
          ⬅ Bali menyang Piyeulan
        </Link>

        {/* ===== TOP BAR HITBOXES: Inventori, Misi, Peta, Jurnal, Swara, Setelan ===== */}
        <Link
          href="/level3/simpanan"
          title="Inventori – Simpanan Jawabanmu"
          className="absolute left-[53.5%] top-[0.9%] w-[10.0%] h-[5.0%] rounded-lg bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
        />
        <button
          type="button"
          onClick={() => setShowMisiModal(true)}
          title="Misi & Ringkesan Pasinaon"
          className="absolute left-[64.5%] top-[0.9%] w-[7.4%] h-[5.0%] rounded-lg bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
        >
          <span className="sr-only">Misi</span>
        </button>
        <Link
          href="/peta"
          title="Peta Petualangan"
          className="absolute left-[72.7%] top-[0.9%] w-[7.5%] h-[5.0%] rounded-lg bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
        />
        <Link
          href="/level3/apresiasi"
          title="Jurnal – Galeri Apresiasi Siswa"
          className="absolute left-[80.8%] top-[0.9%] w-[8.6%] h-[5.0%] rounded-lg bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
        />
        <button
          type="button"
          onClick={() => {
            setAudioPlaying((p) => !p);
            playChime(false);
          }}
          title={audioPlaying ? 'Pateni Swara' : 'Uripake Swara'}
          className="absolute left-[90.2%] top-[0.9%] w-[4.1%] h-[5.0%] rounded-lg bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30 flex items-center justify-center"
        >
          {audioPlaying && (
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
          )}
          <span className="sr-only">Swara</span>
        </button>
        <Link
          href="/level3/piyeulan"
          title="Bali menyang Piyeulan"
          className="absolute left-[95.0%] top-[0.9%] w-[3.9%] h-[5.0%] rounded-lg bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
        />

        {/* ===== 5 BARIS PIWULANG INTERAKTIF (KLIK KANGGO TEGESE LUWIH JERO) ===== */}
        {PIWULANG_LIST.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              playChime(false);
              setToast(`${item.icon} ${item.title} — ${item.meaning}`);
            }}
            style={{ top: item.top }}
            title={`Klik kanggo maca tegese: ${item.title}`}
            className="absolute left-[24.5%] w-[51.5%] h-[9.2%] rounded-full bg-transparent hover:bg-yellow-300/15 hover:ring-2 hover:ring-yellow-400/70 active:scale-[0.99] transition-all cursor-pointer z-25"
          >
            <span className="sr-only">{item.title}</span>
          </button>
        ))}

        {/* ========================================================
            TOMBOL TRANSPARAN PRESISI: ✔ RAMPUNG
            (left: 38.2%, top: 88.0%, width: 23.6%, height: 8.0%)
           ======================================================== */}
        <button
          type="button"
          onClick={handleRampung}
          title="Rampungake Pasinaon Legenda Rara Kuning"
          aria-label="Rampung"
          className="absolute left-[38.2%] top-[88.0%] w-[23.6%] h-[8.0%] rounded-full bg-transparent hover:bg-yellow-300/25 hover:ring-2 hover:ring-yellow-200 hover:shadow-[0_0_28px_rgba(250,204,21,0.8)] active:scale-[0.97] transition-all cursor-pointer z-35"
        >
          <span className="sr-only">Rampung</span>
        </button>
      </div>

      {/* Toast Makna Piwulang */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] px-4 py-2.5 rounded-2xl border bg-emerald-950/95 border-emerald-400 text-emerald-100 text-xs sm:text-sm font-serif font-semibold shadow-2xl">
          {toast}
        </div>
      )}

      {/* Modal Misi */}
      {showMisiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-stone-900 border-2 border-yellow-500/85 rounded-2xl p-6 text-stone-100 space-y-4 shadow-2xl">
            <h3 className="text-lg sm:text-xl font-serif font-black text-yellow-400 flex items-center gap-2">
              <span>📜</span>
              <span>Piwulang Luhur Legenda Rara Kuning</span>
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 font-serif leading-relaxed">
              Tutul saben poin piwulang ing layar kanggo maca tegese luwih jero, banjur pencet tombol kuning <strong>✔ Rampung</strong> ing ngisor kanggo mungkasi petualanganmu!
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowMisiModal(false)}
                className="px-5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-black text-xs cursor-pointer"
              >
                Ngerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tamat / Rampung Petualangan */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-gradient-to-b from-[#1f1308] to-[#120b05] border-2 border-yellow-400 rounded-2xl p-6 text-center text-stone-100 space-y-4 shadow-[0_0_45px_rgba(250,204,21,0.35)]">
            <div className="w-16 h-16 mx-auto rounded-full bg-yellow-400/20 border-2 border-yellow-300 flex items-center justify-center text-3xl shadow-lg animate-bounce">
              👑
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-serif font-black text-yellow-300">
                Sugeng! Pasinaon Wis Rampung!
              </h3>
              <p className="text-xs sm:text-sm text-amber-100/90 font-serif mt-1.5 leading-relaxed">
                Matur nuwun{studentProfile?.nama_lengkap ? `, ${studentProfile.nama_lengkap}` : ''}! Kowe wis ngrampungake kabeh lelampahan pasinaon <strong>Legenda Rara Kuning</strong> saka Level 1 nganti Level 3.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs bg-stone-950/80 p-3.5 rounded-xl border border-amber-700/50">
              <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-600/50">
                <div className="text-[10px] uppercase text-emerald-300 font-bold">
                  Skor Piyeulan
                </div>
                <div className="text-base font-black text-yellow-300 mt-0.5">
                  {piyeulanScore !== null ? `${piyeulanScore} / 10` : 'Tersimpan'}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-950/50 border border-amber-600/50">
                <div className="text-[10px] uppercase text-amber-300 font-bold">
                  Narasi Level 3
                </div>
                <div className="text-base font-black text-yellow-300 mt-0.5">
                  {wordCount > 0 ? `${wordCount} tembung` : 'Rampung'}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <Link
                href="/level3/apresiasi"
                className="px-4 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-700 border border-yellow-400/50 text-amber-50 font-bold text-xs shadow"
              >
                🏆 Galeri Apresiasi
              </Link>
              <Link
                href="/peta"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-stone-950 font-black text-xs sm:text-sm shadow-lg"
              >
                🗺️ Bali menyang Peta Petualangan
              </Link>
              <Link
                href="/beranda"
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-200 font-bold text-xs"
              >
                🏠 Beranda
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
