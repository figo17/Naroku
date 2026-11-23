'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { charactersLevel1 } from '@/data/charactersLevel1';

export default function Level1OrientasiTokohPage() {
  const router = useRouter();
  const supabase = createClient();

  const [studentProfile, setStudentProfile] = useState(null);
  const [activeCharIndex, setActiveCharIndex] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(false);

  // State pengerjaan tiap karakter:
  // selectedAnswers: { [characterId]: [index0, index2, ...] }
  const [selectedAnswers, setSelectedAnswers] = useState({
    rara_kuning: [],
    rara_runting: [],
    resi_darmo: [],
    lembu_amiseno: [],
  });

  // submittedState: { [characterId]: boolean }
  const [submittedState, setSubmittedState] = useState({
    rara_kuning: false,
    rara_runting: false,
    resi_darmo: false,
    lembu_amiseno: false,
  });

  // scores: { [characterId]: number }
  const [scores, setScores] = useState({
    rara_kuning: 0,
    rara_runting: 0,
    resi_darmo: 0,
    lembu_amiseno: 0,
  });

  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const currentChar = charactersLevel1[activeCharIndex];

  // 1. Load User & Existing Submissions
  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login?role=murid');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setStudentProfile(profile);
      }

      // Load previous level 1 submissions
      const { data: existingResults } = await supabase
        .from('level1_character_results')
        .select('*')
        .eq('user_id', user.id);

      if (existingResults && existingResults.length > 0) {
        const newSelected = { ...selectedAnswers };
        const newSubmitted = { ...submittedState };
        const newScores = { ...scores };

        existingResults.forEach((res) => {
          const char = charactersLevel1.find((c) => c.id === res.character_id);
          if (char) {
            // Find indices of selected answers
            const indices = [];
            (res.selected_answers || []).forEach((ansText) => {
              const idx = char.options.indexOf(ansText);
              if (idx !== -1) indices.push(idx);
            });

            newSelected[res.character_id] = indices;
            newSubmitted[res.character_id] = true;
            newScores[res.character_id] = res.score;
          }
        });

        setSelectedAnswers(newSelected);
        setSubmittedState(newSubmitted);
        setScores(newScores);
      }
    }

    loadData();
  }, [router, supabase]);

  // 2. Slide Navigation Handlers
  const handlePrevChar = useCallback(() => {
    setActiveCharIndex((prev) => (prev - 1 + charactersLevel1.length) % charactersLevel1.length);
    setFeedbackMsg(null);
  }, []);

  const handleNextChar = useCallback(() => {
    setActiveCharIndex((prev) => (prev + 1) % charactersLevel1.length);
    setFeedbackMsg(null);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrevChar();
      if (e.key === 'ArrowRight') handleNextChar();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevChar, handleNextChar]);

  // 3. Toggle Checkbox
  const handleToggleOption = (optionIndex) => {
    const charId = currentChar.id;
    const currentList = selectedAnswers[charId] || [];

    let updatedList;
    if (currentList.includes(optionIndex)) {
      updatedList = currentList.filter((idx) => idx !== optionIndex);
    } else {
      // Maksimal 3 centangan
      if (currentList.length >= 3) {
        setFeedbackMsg('Pilih maksimal 3 jawaban sing bener!');
        return;
      }
      updatedList = [...currentList, optionIndex];
      setFeedbackMsg(null);
    }

    setSelectedAnswers((prev) => ({
      ...prev,
      [charId]: updatedList,
    }));

    // Jika murid mengubah pilihan setelah submit, reset status submit agar bisa periksa lagi
    if (submittedState[charId]) {
      setSubmittedState((prev) => ({ ...prev, [charId]: false }));
    }
  };

  // 4. Priksa Jawaban & Simpan ke Supabase
  const handleCheckAnswers = async () => {
    const charId = currentChar.id;
    const selected = selectedAnswers[charId] || [];

    if (selected.length === 0) {
      setFeedbackMsg('Pilih paling sethithik 1 ciri-ciri dhisik!');
      return;
    }

    // Hitung berapa jawaban benar yang dipilih
    let correctCount = 0;
    selected.forEach((idx) => {
      if (currentChar.correctIndices.includes(idx)) {
        correctCount += 1;
      }
    });

    const isPassed = correctCount >= 2; // lulus jika minimal 2 benar
    const targetCount = Math.min(3, currentChar.correctIndices.length);

    setScores((prev) => ({ ...prev, [charId]: correctCount }));
    setSubmittedState((prev) => ({ ...prev, [charId]: true }));

    if (correctCount === targetCount) {
      setFeedbackMsg(`🎉 Apik Tenan! Bener kabeh (${correctCount}/${targetCount})!`);
    } else {
      setFeedbackMsg(`💡 Sampeyan bener ${correctCount} saka ${targetCount}. Priksa tandha ijo lan abang!`);
    }

    // Simpan ke Supabase
    if (studentProfile) {
      setIsSaving(true);
      try {
        const selectedTexts = selected.map((idx) => currentChar.options[idx]);

        await supabase.from('level1_character_results').upsert(
          {
            user_id: studentProfile.id,
            character_id: charId,
            character_name: currentChar.name,
            selected_answers: selectedTexts,
            correct_answers: currentChar.correctAnswers,
            all_options: currentChar.options,
            score: correctCount,
            total_questions: targetCount,
            is_passed: isPassed,
            submitted_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,character_id' }
        );

        // Update quest progress jika belum
        await supabase
          .from('game_progress')
          .update({ quest_stage: 1, updated_at: new Date().toISOString() })
          .eq('user_id', studentProfile.id);
      } catch (err) {
        console.error('Error saving level 1 result:', err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Checkbox row Y-percentages based on 1024x576 coordinates
  const rowPositions = [
    { top: '39.0%', height: '5.5%' },
    { top: '45.1%', height: '5.5%' },
    { top: '51.2%', height: '5.5%' },
    { top: '57.3%', height: '5.5%' },
    { top: '63.4%', height: '5.5%' },
  ];

  const currentSelected = selectedAnswers[currentChar.id] || [];
  const isSubmitted = submittedState[currentChar.id];

  // Hitung total karakter yang sudah selesai
  const completedCount = Object.values(submittedState).filter(Boolean).length;

  return (
    <div className="relative w-screen h-screen bg-[#04120a] text-stone-100 flex items-center justify-center overflow-hidden select-none font-sans">
      {/* 
        CONTAINER 16:9
        Menjaga akurasi posisi hitbox transparan 100% presisi dengan artwork
      */}
      <div className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl">
        {/* Background Slide Artwork Sesuai Tokoh yang Aktif */}
        <Image
          src={currentChar.image}
          alt={`Tantangan ${currentChar.name}`}
          fill
          priority
          sizes="100vw"
          className="object-contain object-center transition-all duration-300"
        />

        {/* ========================================================
            TOP NAVBAR HITBOXES
           ======================================================== */}
        <Link
          href="/beranda"
          title="Bali menyang Beranda"
          aria-label="Menu Beranda"
          className="absolute left-[28.5%] top-[2%] w-[5%] h-[5%] rounded-md bg-transparent hover:bg-yellow-400/10 cursor-pointer z-30"
        />
        <Link
          href="/cptp"
          title="Capaian lan Tujuan Pasinaon"
          aria-label="CP/TP"
          className="absolute left-[39%] top-[2%] w-[5%] h-[5%] rounded-md bg-transparent hover:bg-yellow-400/10 cursor-pointer z-30"
        />
        <Link
          href="/peta"
          title="Peta Petualangan"
          aria-label="Peta"
          className="absolute left-[45%] top-[2%] w-[6%] h-[5%] rounded-md bg-transparent hover:bg-yellow-400/10 cursor-pointer z-30"
        />
        <button
          type="button"
          onClick={() => setAudioPlaying((p) => !p)}
          title={audioPlaying ? 'Pateni Swara' : 'Uripake Swara'}
          className="absolute left-[93.5%] top-[1.8%] w-[4%] h-[5.2%] rounded-full bg-transparent hover:bg-yellow-400/20 cursor-pointer z-30 flex items-center justify-center"
        >
          {audioPlaying && (
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping opacity-75" />
          )}
        </button>

        {/* ========================================================
            TOMBOL BALI (Back to Peta)
           ======================================================== */}
        <Link
          href="/peta"
          title="Bali menyang Peta Petualangan"
          className="absolute left-[87.5%] top-[11.2%] w-[8.5%] h-[6.0%] rounded-full bg-transparent hover:bg-yellow-400/15 hover:ring-2 hover:ring-yellow-400/50 active:scale-95 transition-all cursor-pointer z-30 flex items-center justify-center"
        />

        {/* ========================================================
            SLIDER CONTROLS: PREVIOUS (<) & NEXT (>)
           ======================================================== */}
        {/* Tombol Previous (<) */}
        <button
          type="button"
          onClick={handlePrevChar}
          title="Tokoh Sadurunge (Panah Kiri)"
          aria-label="Previous Character"
          className="group absolute left-[9.2%] top-[45.0%] w-[3.5%] h-[6.5%] rounded-full bg-transparent hover:bg-yellow-400/25 hover:ring-2 hover:ring-yellow-400/70 active:scale-90 transition-all cursor-pointer z-30 flex items-center justify-center"
        >
          <span className="opacity-0 group-hover:opacity-100 text-yellow-300 font-bold text-sm">◀</span>
        </button>

        {/* Tombol Next (>) */}
        <button
          type="button"
          onClick={handleNextChar}
          title="Tokoh Sabanjure (Panah Tengen)"
          aria-label="Next Character"
          className="group absolute left-[23.0%] top-[45.0%] w-[3.5%] h-[6.5%] rounded-full bg-transparent hover:bg-yellow-400/25 hover:ring-2 hover:ring-yellow-400/70 active:scale-90 transition-all cursor-pointer z-30 flex items-center justify-center"
        >
          <span className="opacity-0 group-hover:opacity-100 text-yellow-300 font-bold text-sm">▶</span>
        </button>

        {/* ========================================================
            INTERACTIVE CHECKBOXES (RIGHT CHALLENGE CARD)
           ======================================================== */}
        {currentChar.options.map((optionText, idx) => {
          const isSelected = currentSelected.includes(idx);
          const isCorrect = currentChar.correctIndices.includes(idx);
          const pos = rowPositions[idx];

          return (
            <div
              key={idx}
              onClick={() => handleToggleOption(idx)}
              title={optionText}
              className={`absolute left-[70.8%] w-[23.2%] rounded-md cursor-pointer z-20 flex items-center px-1.5 transition-all duration-150 ${
                isSelected
                  ? 'bg-yellow-400/10 ring-1 ring-yellow-400/40'
                  : 'hover:bg-white/5'
              }`}
              style={{ top: pos.top, height: pos.height }}
            >
              {/* Checkbox Icon Indicator (Pas di atas kotak checklist bawaan) */}
              <div className="w-[18px] h-[18px] rounded border border-yellow-500/60 flex items-center justify-center bg-black/60 shadow-sm flex-shrink-0">
                {isSelected && (
                  <span className="text-yellow-400 font-black text-xs leading-none">✓</span>
                )}
              </div>

              {/* Status Evaluasi: Checklist jika benar, Tanda X jika salah */}
              {isSubmitted && (
                <div className="ml-auto flex items-center">
                  {isCorrect ? (
                    <span
                      className="px-1.5 py-0.5 rounded bg-emerald-900/90 border border-emerald-400 text-emerald-300 text-[10px] sm:text-xs font-black shadow flex items-center gap-0.5"
                      title="Bener (Ciri-cirine Cocog)"
                    >
                      ✓ <span className="hidden xl:inline">Bener</span>
                    </span>
                  ) : isSelected ? (
                    <span
                      className="px-1.5 py-0.5 rounded bg-red-950/90 border border-red-500 text-red-300 text-[10px] sm:text-xs font-black shadow flex items-center gap-0.5"
                      title="Salah (Ora cocog karo tokoh)"
                    >
                      ✗ <span className="hidden xl:inline">Salah</span>
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}

        {/* ========================================================
            TOMBOL "PRIKSA JAWABAN"
           ======================================================== */}
        <button
          type="button"
          onClick={handleCheckAnswers}
          title="Priksa Jawaban Sampeyan"
          className="absolute left-[75.0%] top-[70.5%] w-[15.5%] h-[6.5%] rounded-xl bg-transparent hover:bg-yellow-400/20 hover:ring-2 hover:ring-yellow-300/60 active:scale-95 transition-all cursor-pointer z-30 flex items-center justify-center font-bold text-yellow-300"
        >
          {isSaving && (
            <span className="text-[10px] text-stone-900 bg-yellow-400 px-2 py-0.5 rounded shadow animate-pulse">
              Nyimpen...
            </span>
          )}
        </button>

        {/* ========================================================
            BOTTOM TRAY CHARACTER SWITCHERS (4 TOKOH)
           ======================================================== */}
        {charactersLevel1.map((char, cIdx) => {
          const leftOffsets = ['15.5%', '32.5%', '49.5%', '66.5%'];
          const widths = ['15.5%', '15.5%', '15.5%', '16.5%'];
          const isActive = activeCharIndex === cIdx;
          const isDone = submittedState[char.id];

          return (
            <div
              key={char.id}
              onClick={() => {
                setActiveCharIndex(cIdx);
                setFeedbackMsg(null);
              }}
              title={`Pilih ${char.name}`}
              className={`absolute top-[82.5%] h-[14.5%] rounded-2xl cursor-pointer z-30 transition-all duration-200 ${
                isActive
                  ? 'ring-2 ring-yellow-400/80 bg-yellow-400/10 shadow-[0_0_20px_rgba(250,204,21,0.4)]'
                  : 'hover:bg-white/10 hover:ring-1 hover:ring-yellow-300/40 opacity-70 hover:opacity-100'
              }`}
              style={{ left: leftOffsets[cIdx], width: widths[cIdx] }}
            >
              {/* Badge Centang jika sudah dikerjakan */}
              {isDone && (
                <div className="absolute top-1 right-2 px-1.5 py-0.2 rounded-full bg-emerald-900/90 border border-emerald-400 text-emerald-300 text-[10px] font-bold shadow">
                  ✓ Rampung
                </div>
              )}
            </div>
          );
        })}

        {/* ========================================================
            FEEDBACK MESSAGE FLOATING BANNER
           ======================================================== */}
        {feedbackMsg && (
          <div className="absolute top-[18%] right-[8%] z-40 max-w-sm px-4 py-2 bg-black/90 border border-yellow-400 rounded-xl text-yellow-300 text-xs font-bold shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-fade-in">
            <span>{feedbackMsg}</span>
            <button
              type="button"
              onClick={() => setFeedbackMsg(null)}
              className="text-stone-400 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* ========================================================
            STATUS PENGERJAAN & NAVIGASI LANJUT
           ======================================================== */}
        <div className="absolute bottom-1 left-4 z-30 flex items-center gap-3 text-[11px] font-semibold text-emerald-300/90 bg-black/70 backdrop-blur px-3 py-1 rounded-full border border-emerald-800/60">
          <span>
            Progres Tokoh: <strong className="text-yellow-300">{completedCount}/4</strong> rampung
          </span>
          {completedCount === 4 && (
            <Link
              href="/peta"
              className="px-2 py-0.5 rounded bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-black shadow animate-pulse"
            >
              Lanjut menyang Peta ➔
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
