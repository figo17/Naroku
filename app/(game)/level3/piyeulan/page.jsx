'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  PIYEULAN_ITEMS,
  PIYEULAN_BOX_X,
  scorePiyeulanAnswers,
} from '@/data/piyeulanLevel3';

export default function Level3PiyeulanPage() {
  const router = useRouter();
  const supabase = createClient();
  const audioCtxRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);

  // Map { "1": "bener" | "salah", ..., "10": "bener" | "salah" }
  const [answers, setAnswers] = useState({});
  const [isChecked, setIsChecked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login?role=murid');
          return;
        }
        setCurrentUser(user);

        const [{ data: profile }, { data: saved }] = await Promise.all([
          supabase
            .from('profiles')
            .select('nama_lengkap, nomor_induk')
            .eq('id', user.id)
            .maybeSingle(),
          supabase
            .from('level3_piyeulan_answers')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle(),
        ]);

        if (profile) setStudentProfile(profile);
        if (saved?.answers && typeof saved.answers === 'object') {
          setAnswers(saved.answers);
          if (saved.is_completed) {
            setIsChecked(true);
          }
        }
      } catch (err) {
        console.error('Error loading Level 3 Piyeulan:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router, supabase]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const playSound = useCallback((kind = 'tick') => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const freqs =
        kind === 'fanfare'
          ? [523.25, 659.25, 783.99, 1046.5]
          : kind === 'bener'
          ? [587.33, 783.99]
          : [493.88, 659.25];

      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const s = now + idx * 0.08;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, s);
        gain.gain.setValueAtTime(0.18, s);
        gain.gain.exponentialRampToValueAtTime(0.001, s + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(s);
        osc.stop(s + 0.32);
      });
    } catch {
      // Ignore audio restriction
    }
  }, []);

  const handleSelectChoice = (itemId, choice) => {
    playSound(choice);
    setAnswers((prev) => ({
      ...prev,
      [itemId]: choice,
    }));
    if (isChecked) {
      setIsChecked(false);
    }
  };

  const handlePriksaJawaban = async () => {
    if (!currentUser) return;

    const unanswered = PIYEULAN_ITEMS.filter((it) => !answers[it.id]);
    if (unanswered.length > 0) {
      setToast({
        type: 'error',
        text: `⚠️ Ana pernyataan sing durung dicenthang (No. ${unanswered
          .map((u) => u.no)
          .join(', ')})!`,
      });
      return;
    }

    setIsSaving(true);
    const finalScore = scorePiyeulanAnswers(answers);

    try {
      const studentName =
        studentProfile?.nama_lengkap || currentUser.email?.split('@')[0] || 'Murid';
      const studentNisn = studentProfile?.nomor_induk || '';

      const { error } = await supabase.from('level3_piyeulan_answers').upsert(
        {
          user_id: currentUser.id,
          student_name: studentName,
          student_nisn: studentNisn,
          answers,
          score: finalScore,
          total_questions: PIYEULAN_ITEMS.length,
          is_completed: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (error) {
        console.error('Supabase error saving Level 3 Piyeulan:', error);
        setToast({
          type: 'error',
          text: 'Gagal nyimpen jawaban. Priksa sambungan internetmu!',
        });
      } else {
        playSound('fanfare');
        setIsChecked(true);
        setShowResultModal(true);
      }
    } catch (err) {
      console.error('Error saving Piyeulan:', err);
      setToast({
        type: 'error',
        text: 'Ana kaluputan nalika nyimpen jawaban.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#04140d] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm tracking-wide text-amber-200">Mbukak Level 3 – Piyeulan...</p>
      </div>
    );
  }

  const answeredCount = PIYEULAN_ITEMS.filter((it) => Boolean(answers[it.id])).length;
  const currentScore = scorePiyeulanAnswers(answers);

  return (
    <div className="relative w-screen h-screen bg-[#04140d] text-stone-100 flex items-center justify-center overflow-hidden select-none font-sans">
      {/* Ambient Full-Screen Backdrop supaya layar widescreen ora ana ruang kosong/putih */}
      <Image
        src="/assets/level3/screen_piyeulan.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center blur-xl scale-110 opacity-65 pointer-events-none"
      />

      {/* Container Presisi 766 x 576 (4:3) */}
      <div
        className="relative w-full h-full max-w-[calc(100vh*766/576)] max-h-[calc(100vw*576/766)] aspect-[766/576] overflow-hidden shadow-2xl"
        style={{ containerType: 'size' }}
      >
        <Image
          src="/assets/level3/screen_piyeulan.jpg"
          alt="Level 3 – Piyeulan: Bener utawa Salah"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
        />

        {/* Navigasi Pojok Kiwa & Tengen Ndhuwur */}
        <div className="absolute top-2.5 left-3 z-40 flex items-center gap-1.5">
          <Link
            href="/level3/apresiasi"
            className="px-2.5 py-1 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-yellow-500/55 text-yellow-300 text-[10px] sm:text-xs font-bold shadow-md"
          >
            ⬅ Galeri Apresiasi
          </Link>
          <Link
            href="/peta"
            className="px-2.5 py-1 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-yellow-500/55 text-yellow-300 text-[10px] sm:text-xs font-bold shadow-md"
          >
            🗺️ Peta
          </Link>
        </div>

        <div className="absolute top-2.5 right-3 z-40 flex items-center gap-1.5">
          <div className="px-3 py-1 rounded-full bg-stone-950/90 border border-amber-400/75 text-amber-200 text-[10px] sm:text-xs font-extrabold shadow-md">
            ✓ Dicenthang: <span className="text-yellow-300">{answeredCount}/10</span>
          </div>
          {isChecked && (
            <button
              type="button"
              onClick={() => setShowResultModal(true)}
              className="px-2.5 py-1 rounded-full bg-emerald-800 hover:bg-emerald-700 border border-emerald-300 text-emerald-50 text-[10px] sm:text-xs font-black shadow-md cursor-pointer"
            >
              📊 Skor: {currentScore}/10
            </button>
          )}
        </div>

        {/* ========================================================
            10 BARIS CHECKBOX INTERAKTIF: BENER & SALAH
           ======================================================== */}
        {PIYEULAN_ITEMS.map((item) => {
          const picked = answers[item.id]; // 'bener' | 'salah' | undefined
          const isRowCorrect = isChecked && picked === item.correct;
          const isRowWrong = isChecked && picked && picked !== item.correct;

          return (
            <React.Fragment key={item.id}>
              {/* Kothak Centhang BENER */}
              <button
                type="button"
                onClick={() => handleSelectChoice(item.id, 'bener')}
                title={`No. ${item.no} – Pilih Bener`}
                aria-label={`Pernyataan ${item.no} Bener`}
                style={{
                  left: `${PIYEULAN_BOX_X.benerCenterPct}%`,
                  top: `${item.centerY}%`,
                  width: '5.4%',
                  height: '4.2%',
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-md z-30 flex items-center justify-center cursor-pointer transition-all ${
                  picked === 'bener'
                    ? isRowWrong
                      ? 'bg-red-500/20 ring-2 ring-red-600'
                      : 'bg-emerald-500/20 ring-2 ring-emerald-600'
                    : 'hover:bg-emerald-500/15 hover:ring-1 hover:ring-emerald-700/60'
                }`}
              >
                {picked === 'bener' && (
                  <span
                    className={`font-black leading-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] ${
                      isRowWrong ? 'text-red-700' : 'text-emerald-800'
                    }`}
                    style={{ fontSize: '2.7cqh' }}
                  >
                    ✓
                  </span>
                )}
              </button>

              {/* Kothak Centhang SALAH */}
              <button
                type="button"
                onClick={() => handleSelectChoice(item.id, 'salah')}
                title={`No. ${item.no} – Pilih Salah`}
                aria-label={`Pernyataan ${item.no} Salah`}
                style={{
                  left: `${PIYEULAN_BOX_X.salahCenterPct}%`,
                  top: `${item.centerY}%`,
                  width: '5.4%',
                  height: '4.2%',
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-md z-30 flex items-center justify-center cursor-pointer transition-all ${
                  picked === 'salah'
                    ? isRowWrong
                      ? 'bg-red-500/20 ring-2 ring-red-600'
                      : 'bg-emerald-500/20 ring-2 ring-emerald-600'
                    : 'hover:bg-amber-700/15 hover:ring-1 hover:ring-amber-800/60'
                }`}
              >
                {picked === 'salah' && (
                  <span
                    className={`font-black leading-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] ${
                      isRowWrong ? 'text-red-700' : 'text-emerald-800'
                    }`}
                    style={{ fontSize: '2.7cqh' }}
                  >
                    ✓
                  </span>
                )}
              </button>

              {/* Indikator Cilik Bener/Salah ing Sisih Tengen Kothak Sawise Dipriksa */}
              {isChecked && picked && (
                <div
                  style={{
                    left: '76.4%',
                    top: `${item.centerY}%`,
                  }}
                  className={`absolute -translate-y-1/2 z-30 pointer-events-none px-1.5 py-0.2 rounded-full text-[8px] sm:text-[10px] font-black shadow ${
                    isRowCorrect
                      ? 'bg-emerald-700 text-emerald-50'
                      : 'bg-red-700 text-red-50'
                  }`}
                >
                  {isRowCorrect ? '✓' : '✗'}
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* ========================================================
            TOMBOL TRANSPARAN PRESISI: ✔ PRIKSA JAWABAN
            (left: 36.81%, top: 86.81%, width: 30.94%, height: 8.16%)
           ======================================================== */}
        <button
          type="button"
          onClick={handlePriksaJawaban}
          disabled={isSaving}
          title={isSaving ? 'Nyimpen & Mriksa...' : 'Priksa lan Simpen Jawaban Piyeulan'}
          aria-label="Priksa Jawaban"
          className="absolute left-[36.81%] top-[86.81%] w-[30.94%] h-[8.16%] rounded-full bg-transparent hover:bg-yellow-300/20 hover:ring-2 hover:ring-yellow-200 hover:shadow-[0_0_28px_rgba(250,204,21,0.75)] active:scale-[0.98] transition-all cursor-pointer z-35 flex items-center justify-end pr-4 disabled:opacity-60"
        >
          {isSaving && (
            <span className="w-4 h-4 border-2 border-amber-950 border-t-transparent rounded-full animate-spin" />
          )}
          <span className="sr-only">Priksa Jawaban</span>
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] px-4 py-2.5 rounded-2xl border shadow-2xl text-xs sm:text-sm font-bold ${
            toast.type === 'error'
              ? 'bg-red-950/95 border-red-400 text-red-200'
              : 'bg-emerald-950/95 border-emerald-400 text-emerald-100'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Modal Asil Priksa Jawaban & Simpen menyang Guru */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl max-h-[90vh] bg-stone-900 border-2 border-yellow-500/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
            <div className="px-5 py-4 bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 border-b border-amber-800/70 flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-serif font-black text-yellow-400 flex items-center gap-2">
                  <span>📜</span>
                  <span>Asil Piyeulan Level 3</span>
                </h3>
                <p className="text-xs text-emerald-300 font-semibold mt-0.5">
                  ✓ Jawabanmu wis kasil disimpen lan bisa dideleng dening Guru!
                </p>
              </div>
              <div className="px-4 py-1.5 rounded-xl bg-emerald-950 border border-emerald-500 text-center">
                <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold">
                  Skor
                </div>
                <div className="text-lg sm:text-xl font-black font-mono text-yellow-300">
                  {currentScore} / 10
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-2 flex-1 bg-stone-950/60">
              {PIYEULAN_ITEMS.map((it) => {
                const ans = answers[it.id];
                const ok = ans === it.correct;
                return (
                  <div
                    key={it.id}
                    className={`p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 ${
                      ok
                        ? 'bg-emerald-950/45 border-emerald-600/60 text-emerald-100'
                        : 'bg-red-950/45 border-red-600/60 text-red-100'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-mono font-bold mr-1.5">{it.no}.</span>
                      <span className="font-serif">{it.statement}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 text-[10px] sm:text-xs font-bold">
                      <span
                        className={`px-2 py-0.5 rounded-full border ${
                          ans === 'bener'
                            ? 'bg-emerald-900/90 border-emerald-400 text-emerald-100'
                            : 'bg-rose-900/90 border-rose-400 text-rose-100'
                        }`}
                      >
                        Jawabanmu: {ans === 'bener' ? 'Bener' : 'Salah'}
                      </span>
                      <span className="text-sm">{ok ? '✅' : '❌'}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-stone-900 border-t border-stone-800 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowResultModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-200 text-xs font-bold cursor-pointer"
              >
                ✏️ Dandanana Jawaban
              </button>
              <div className="flex items-center gap-2">
                <Link
                  href="/level3/apresiasi"
                  className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-700 text-amber-50 text-xs font-bold"
                >
                  🏆 Galeri Apresiasi
                </Link>
                <Link
                  href="/peta"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-stone-950 font-black text-xs shadow-lg"
                >
                  🗺️ Rampung — Bali menyang Peta
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
