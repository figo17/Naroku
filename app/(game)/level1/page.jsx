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
  const [currentUser, setCurrentUser] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);

  // ALUR LEVEL 1: 'centhang' (Tahap 1: Centhang Ciri Dulu) -> 'uraian' (Tahap 2: Tantangan Nulis)
  const [activeView, setActiveView] = useState('centhang');
  const [activeCharIndex, setActiveCharIndex] = useState(0);

  // ==========================================================
  // STATE TANTANGAN 1: CENTHANG KARAKTER (CHECKLIST)
  // ==========================================================
  const [selectedAnswers, setSelectedAnswers] = useState({
    rara_kuning: [],
    rara_runting: [],
    resi_darmo: [],
    lembu_amiseno: [],
  });
  const [submittedState, setSubmittedState] = useState({
    rara_kuning: false,
    rara_runting: false,
    resi_darmo: false,
    lembu_amiseno: false,
  });
  const [scores, setScores] = useState({
    rara_kuning: 0,
    rara_runting: 0,
    resi_darmo: 0,
    lembu_amiseno: 0,
  });
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [isSavingChecklist, setIsSavingChecklist] = useState(false);
  const [showTransitionToEssayModal, setShowTransitionToEssayModal] = useState(false);

  // ==========================================================
  // STATE TANTANGAN 2: TANTANGAN NULIS (URAIAN 4 TOKOH)
  // ==========================================================
  const [essayAnswers, setEssayAnswers] = useState({
    tokoh1: '',
    tokoh2: '',
    tokoh3: '',
    tokoh4: '',
  });
  const [isSavingEssay, setIsSavingEssay] = useState(false);
  const [essayToast, setEssayToast] = useState(null);
  const [hasSavedEssayBefore, setHasSavedEssayBefore] = useState(false);

  // Modal dialogs
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showUnlockLevel2Modal, setShowUnlockLevel2Modal] = useState(false);

  const currentChar = charactersLevel1[activeCharIndex];
  const completedCharsCount = Object.values(submittedState).filter(Boolean).length;
  const isAllEssayFilled = Boolean(
    essayAnswers.tokoh1?.trim() &&
    essayAnswers.tokoh2?.trim() &&
    essayAnswers.tokoh3?.trim() &&
    essayAnswers.tokoh4?.trim()
  );

  // ==========================================================
  // 1. LOAD USER DATA, ESSAY ANSWERS & CHECKLIST RESULTS
  // ==========================================================
  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login?role=murid');
        return;
      }

      setCurrentUser(user);

      // Load Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setStudentProfile(profile);
      }

      // Load Existing Checklist Results
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

      // Load Existing Essay Answers
      const { data: essayData } = await supabase
        .from('level1_essay_answers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (essayData) {
        setEssayAnswers({
          tokoh1: essayData.tokoh1_answer || '',
          tokoh2: essayData.tokoh2_answer || '',
          tokoh3: essayData.tokoh3_answer || '',
          tokoh4: essayData.tokoh4_answer || '',
        });
        setHasSavedEssayBefore(true);
      }
    }

    loadData();
  }, [router, supabase]);

  // ==========================================================
  // 2. HANDLER: SIMPAN JAWABAN TANTANGAN NULIS KE SUPABASE
  // ==========================================================
  const handleSaveEssay = async () => {
    if (!currentUser) return;

    const hasAnyText =
      essayAnswers.tokoh1.trim() ||
      essayAnswers.tokoh2.trim() ||
      essayAnswers.tokoh3.trim() ||
      essayAnswers.tokoh4.trim();

    if (!hasAnyText) {
      setEssayToast({
        type: 'error',
        msg: 'Isi paling sithik salah siji wangsulan tokoh sadurunge nyimpen!',
      });
      setTimeout(() => setEssayToast(null), 3500);
      return;
    }

    setIsSavingEssay(true);
    setEssayToast(null);

    try {
      const studentName = studentProfile?.nama_lengkap || currentUser.email.split('@')[0];
      const studentNisn = studentProfile?.nomor_induk || '';

      const { error } = await supabase.from('level1_essay_answers').upsert(
        {
          user_id: currentUser.id,
          student_name: studentName,
          student_nisn: studentNisn,
          tokoh1_answer: essayAnswers.tokoh1.trim(),
          tokoh2_answer: essayAnswers.tokoh2.trim(),
          tokoh3_answer: essayAnswers.tokoh3.trim(),
          tokoh4_answer: essayAnswers.tokoh4.trim(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (error) throw error;

      setHasSavedEssayBefore(true);

      const allDone = Boolean(
        essayAnswers.tokoh1?.trim() &&
        essayAnswers.tokoh2?.trim() &&
        essayAnswers.tokoh3?.trim() &&
        essayAnswers.tokoh4?.trim()
      );

      if (allDone) {
        setShowUnlockLevel2Modal(true);
      } else {
        setEssayToast({
          type: 'success',
          msg: '✓ Wangsulan kasil disimpen! Isi kabeh 4 tokoh kanggo mbukak Level 2.',
        });
        setTimeout(() => setEssayToast(null), 4000);
      }
    } catch (err) {
      console.error('Error saving essay:', err);
      setEssayToast({
        type: 'error',
        msg: 'Gagal nyimpen wangsulan. Mangga priksa sambungan internetmu.',
      });
      setTimeout(() => setEssayToast(null), 3500);
    } finally {
      setIsSavingEssay(false);
    }
  };

  // ==========================================================
  // 3. HANDLERS: CENTHANG CIRI TOKOH (CAROUSEL)
  // ==========================================================
  const handlePrevChar = useCallback(() => {
    setActiveCharIndex((prev) => (prev - 1 + charactersLevel1.length) % charactersLevel1.length);
    setFeedbackMsg(null);
  }, []);

  const handleNextChar = useCallback(() => {
    setActiveCharIndex((prev) => (prev + 1) % charactersLevel1.length);
    setFeedbackMsg(null);
  }, []);

  // Keyboard navigation for checklist carousel
  useEffect(() => {
    if (activeView !== 'centhang') return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrevChar();
      if (e.key === 'ArrowRight') handleNextChar();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeView, handlePrevChar, handleNextChar]);

  const handleToggleOption = (optionIndex) => {
    const charId = currentChar.id;
    const currentList = selectedAnswers[charId] || [];

    let updatedList;
    if (currentList.includes(optionIndex)) {
      updatedList = currentList.filter((idx) => idx !== optionIndex);
    } else {
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

    if (submittedState[charId]) {
      setSubmittedState((prev) => ({ ...prev, [charId]: false }));
    }
  };

  const handleCheckAnswers = async () => {
    const charId = currentChar.id;
    const selected = selectedAnswers[charId] || [];

    if (selected.length === 0) {
      setFeedbackMsg('Pilih paling sethithik 1 ciri-ciri dhisik!');
      return;
    }

    let correctCount = 0;
    selected.forEach((idx) => {
      if (currentChar.correctIndices.includes(idx)) {
        correctCount += 1;
      }
    });

    const isPassed = correctCount >= 2;
    const targetCount = Math.min(3, currentChar.correctIndices.length);

    setScores((prev) => ({ ...prev, [charId]: correctCount }));
    const newSubmitted = { ...submittedState, [charId]: true };
    setSubmittedState(newSubmitted);

    if (correctCount === targetCount) {
      setFeedbackMsg(`🎉 Sampurna! Kabeh ${correctCount} pilihanmu bener!`);
    } else if (correctCount > 0) {
      setFeedbackMsg(`👍 Apik! Ana ${correctCount} pilihan sing bener.`);
    } else {
      setFeedbackMsg('❌ Durung bener. Gatekna maneh katrangan busana ing sisih kiwa!');
    }

    // Cek apakah semua 4 tokoh sudah dicek jawabannya
    const allCount = Object.values(newSubmitted).filter(Boolean).length;
    if (allCount === charactersLevel1.length) {
      setTimeout(() => {
        setShowTransitionToEssayModal(true);
      }, 1200);
    }

    if (studentProfile) {
      setIsSavingChecklist(true);
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
      } catch (err) {
        console.error('Error saving checklist:', err);
      } finally {
        setIsSavingChecklist(false);
      }
    }
  };

  const rowPositions = [
    { top: '39.0%', height: '5.5%' },
    { top: '45.1%', height: '5.5%' },
    { top: '51.2%', height: '5.5%' },
    { top: '57.3%', height: '5.5%' },
    { top: '63.4%', height: '5.5%' },
  ];

  const currentSelected = selectedAnswers[currentChar?.id] || [];
  const isSubmitted = submittedState[currentChar?.id];

  return (
    <div className="relative w-screen h-screen bg-[#04120a] text-stone-100 flex flex-col items-center justify-center overflow-hidden select-none font-sans">
      {/* 
        CONTAINER UTAMA 16:9 (1024 x 576)
        Menjamin 100% presisi posisi checkbox, textarea, dan tombol di layar apa pun
      */}
      <div className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl">
        
        {/* ========================================================
            TAHAP 1: CENTHANG CIRI-CIRI TOKOH (CAROUSEL)
            DITAMPILKAN PERTAMA KALI KETIKA MEMBUKA LEVEL 1
           ======================================================== */}
        {activeView === 'centhang' && (
          <>
            {/* Background Slide Artwork Sesuai Tokoh yang Aktif */}
            <Image
              src={currentChar.image}
              alt={`Tantangan ${currentChar.name}`}
              fill
              priority
              sizes="100vw"
              className="object-contain object-center transition-all duration-300"
            />

            {/* Top Navbar */}
            <Link
              href="/beranda"
              title="Bali menyang Beranda"
              className="absolute left-[28.5%] top-[2%] w-[5%] h-[5%] rounded-md bg-transparent hover:bg-yellow-400/10 cursor-pointer z-30"
            />
            <Link
              href="/materi"
              title="Materi Crita Legenda"
              className="absolute left-[33.8%] top-[2%] w-[4.8%] h-[5%] rounded-md bg-transparent hover:bg-yellow-400/10 cursor-pointer z-30"
            />
            <Link
              href="/cptp"
              title="Capaian lan Tujuan Pasinaon"
              className="absolute left-[39%] top-[2%] w-[5%] h-[5%] rounded-md bg-transparent hover:bg-yellow-400/10 cursor-pointer z-30"
            />
            <Link
              href="/peta"
              title="Peta Petualangan"
              className="absolute left-[45%] top-[2%] w-[6%] h-[5%] rounded-md bg-transparent hover:bg-yellow-400/10 cursor-pointer z-30"
            />

            {/* Top Right Icons: Cerita (Buku), Panduan (?), Audio (Speaker) */}
            <button
              type="button"
              onClick={() => setShowStoryModal(true)}
              title="Waca Ringkesan Crita"
              className="absolute left-[83.8%] top-[1.8%] w-[4.0%] h-[5.5%] rounded-full bg-transparent hover:bg-yellow-400/20 cursor-pointer z-30"
            />
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              title="Pituduh Pasinaon"
              className="absolute left-[88.8%] top-[1.8%] w-[4.0%] h-[5.5%] rounded-full bg-transparent hover:bg-yellow-400/20 cursor-pointer z-30"
            />
            <button
              type="button"
              onClick={() => setAudioPlaying((p) => !p)}
              title={audioPlaying ? 'Pateni Swara' : 'Uripake Swara'}
              className="absolute left-[93.5%] top-[1.8%] w-[4%] h-[5.5%] rounded-full bg-transparent hover:bg-yellow-400/20 cursor-pointer z-30 flex items-center justify-center"
            >
              {audioPlaying && (
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping opacity-75" />
              )}
            </button>

            {/* Status Badge: Langkah 1 - Centhang Ciri */}
            <div className="absolute top-2.5 left-4 z-35 hidden sm:flex items-center gap-2 px-3.5 py-1 rounded-full bg-stone-950/90 border border-yellow-400/70 shadow-lg backdrop-blur-md">
              <span className="text-yellow-400 font-bold text-xs">
                Langkah 1: Centhang Ciri Tokoh
              </span>
              <span className="text-stone-400 text-xs">|</span>
              <span className="text-stone-200 text-xs font-medium">
                {activeCharIndex + 1}/4 ({currentChar.name})
              </span>
              <span className="text-emerald-400 font-bold text-[10px]">
                [{completedCharsCount}/4 rampung]
              </span>
            </div>

            {/* Tombol Eksak "Lanjut menyang Tantangan Nulis" di Pojok Kanan Atas */}
            <button
              type="button"
              onClick={() => setActiveView('uraian')}
              title="Lanjut menyang Tantangan Nulis 4 Tokoh"
              className="group absolute left-[86.5%] top-[10.5%] w-[10.5%] h-[7.0%] rounded-full bg-transparent hover:bg-yellow-400/25 hover:ring-2 hover:ring-yellow-400/80 active:scale-95 transition-all cursor-pointer z-30 flex items-center justify-center"
            >
              <span className="sr-only">Lanjut menyang Tantangan Nulis</span>
              {/* Tooltip Hover yang Jelas */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none -mt-14 px-3 py-1 bg-stone-950/95 border border-yellow-400 rounded-full text-yellow-300 text-[10px] sm:text-xs font-bold tracking-wide shadow-2xl whitespace-nowrap">
                📝 Lanjut menyang Tantangan Nulis →
              </div>
            </button>

            {/* Slider Controls: Previous (<) & Next (>) */}
            <button
              type="button"
              onClick={handlePrevChar}
              title="Tokoh Sadurunge (Panah Kiwa)"
              className="absolute left-[9.3%] top-[45.5%] w-[3.5%] h-[6.5%] rounded-full bg-transparent hover:bg-yellow-400/20 hover:ring-2 hover:ring-yellow-300/60 active:scale-90 transition-all cursor-pointer z-30"
            />
            <button
              type="button"
              onClick={handleNextChar}
              title="Tokoh Sabanjure (Panah Tengen)"
              className="absolute left-[23.6%] top-[45.5%] w-[3.5%] h-[6.5%] rounded-full bg-transparent hover:bg-yellow-400/20 hover:ring-2 hover:ring-yellow-300/60 active:scale-90 transition-all cursor-pointer z-30"
            />

            {/* Checkbox Rows (5 Opsi Ciri-ciri) */}
            {currentChar.options.map((optionText, idx) => {
              const isChecked = currentSelected.includes(idx);
              const isCorrect = currentChar.correctIndices.includes(idx);
              const rowPos = rowPositions[idx] || rowPositions[0];

              return (
                <div
                  key={idx}
                  onClick={() => handleToggleOption(idx)}
                  className="absolute left-[70.2%] w-[24.2%] z-20 cursor-pointer group flex items-center select-none"
                  style={{ top: rowPos.top, height: rowPos.height }}
                >
                  <div className="absolute left-[1.1%] w-[9.5%] aspect-square rounded-md flex items-center justify-center transition-all group-hover:ring-1 group-hover:ring-yellow-400/60">
                    {isChecked && !isSubmitted && (
                      <span className="text-yellow-400 text-lg sm:text-2xl font-black drop-shadow">
                        ✓
                      </span>
                    )}
                    {isSubmitted && isChecked && isCorrect && (
                      <span className="text-emerald-400 text-lg sm:text-2xl font-black drop-shadow animate-bounce">
                        ✓
                      </span>
                    )}
                    {isSubmitted && isChecked && !isCorrect && (
                      <span className="text-red-500 text-lg sm:text-2xl font-black drop-shadow">
                        ✗
                      </span>
                    )}
                  </div>
                  {isSubmitted && isChecked && (
                    <div
                      className={`ml-auto mr-2 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                        isCorrect
                          ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/60'
                          : 'bg-red-950/90 text-red-300 border border-red-500/60'
                      }`}
                    >
                      {isCorrect ? '✓ Bener' : '✗ Salah'}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Tombol Priksa Jawaban */}
            <button
              type="button"
              onClick={handleCheckAnswers}
              disabled={isSavingChecklist}
              title="Priksa Jawaban Ciri-ciri Tokoh"
              className="absolute left-[75.0%] top-[69.0%] w-[15.8%] h-[6.5%] rounded-xl bg-transparent hover:bg-yellow-400/20 hover:ring-2 hover:ring-yellow-300/80 active:scale-95 transition-all cursor-pointer z-30 flex items-center justify-center"
            >
              {isSavingChecklist && (
                <span className="text-amber-950 font-black text-[10px] bg-yellow-300 px-2 py-0.5 rounded-full animate-pulse">
                  Mriksa...
                </span>
              )}
            </button>

            {/* Bottom Character Thumbnail Tabs */}
            <div className="absolute left-[15.5%] top-[82.0%] w-[69.5%] h-[15.5%] z-20 flex items-center justify-between">
              {charactersLevel1.map((char, idx) => {
                const charDone = submittedState[char.id];
                return (
                  <div
                    key={char.id}
                    onClick={() => {
                      setActiveCharIndex(idx);
                      setFeedbackMsg(null);
                    }}
                    title={`Pilih ${char.name} ${charDone ? '(Wis dipriksa)' : ''}`}
                    className={`relative w-[23.5%] h-full rounded-2xl cursor-pointer hover:bg-yellow-400/10 hover:ring-1 hover:ring-yellow-300/50 transition-all ${
                      idx === activeCharIndex ? 'ring-2 ring-yellow-400/80' : ''
                    }`}
                  >
                    {charDone && (
                      <span className="absolute top-1 right-2 text-emerald-400 text-xs font-black drop-shadow">
                        ✓
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tombol Melayang Lanjut menyang Tantangan Nulis */}
            <div className="absolute bottom-2.5 right-4 z-30">
              <button
                type="button"
                onClick={() => setActiveView('uraian')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-xs shadow-xl active:scale-95 transition-all animate-pulse"
              >
                <span>📝</span>
                <span>Lanjut menyang Tantangan Nulis →</span>
              </button>
            </div>
          </>
        )}

        {/* ========================================================
            TAHAP 2: TANTANGAN NULIS URUSAN 4 TOKOH (TEXTBOX)
            DITAMPILKAN SETELAH CENTHANG CIRI
           ======================================================== */}
        {activeView === 'uraian' && (
          <>
            {/* Background Artwork Tantangan Uraian */}
            <Image
              src="/assets/level1/screen_tantangan_uraian.jpg"
              alt="Tantangan Nulis Pangenalan Tokoh"
              fill
              priority
              sizes="100vw"
              className="object-contain object-center"
            />

            {/* Top Navbar Hitbox: Logo -> Beranda */}
            <Link
              href="/"
              title="Legenda Rara Kuning"
              className="absolute left-[2.5%] top-[1.5%] w-[18%] h-[8%] rounded-md bg-transparent hover:bg-yellow-400/10 cursor-pointer z-30"
            />

            {/* Status Badge: Langkah 2 - Tantangan Nulis */}
            <div className="absolute top-2.5 left-4 z-35 hidden sm:flex items-center gap-2 px-3.5 py-1 rounded-full bg-stone-950/90 border border-amber-400/70 shadow-lg backdrop-blur-md">
              <span className="text-amber-300 font-bold text-xs">
                Langkah 2: Tantangan Nulis 4 Tokoh
              </span>
              <span className="text-stone-400 text-xs">|</span>
              <span className="text-stone-300 text-xs font-medium">
                Tulisna jeneng & watek paraga ing kothak
              </span>
            </div>

            {/* Progress Dots: Dot 1 (Centhang Ciri), Dot 2..5 (Pilihan Tokoh) */}
            <div className="absolute left-[60.2%] top-[3.2%] w-[14.5%] h-[4.5%] z-30 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveView('centhang')}
                title="Bali menyang Centhang Ciri Tokoh"
                className="w-3.5 h-3.5 rounded-full bg-stone-900/80 border border-yellow-400/60 hover:bg-yellow-400/40 hover:scale-125 transition-all cursor-pointer"
              />
              {[0, 1, 2, 3].map((idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActiveCharIndex(idx);
                    setActiveView('centhang');
                  }}
                  title={`Deleng Ciri Tokoh: ${charactersLevel1[idx]?.name}`}
                  className="w-3.5 h-3.5 rounded-full bg-stone-900/80 border border-yellow-400/60 hover:bg-yellow-400/40 hover:scale-125 transition-all cursor-pointer"
                />
              ))}
            </div>

            {/* Top Right Icons: Cerita (Buku), Panduan (?), Audio (Speaker) */}
            <button
              type="button"
              onClick={() => setShowStoryModal(true)}
              title="Waca Ringkesan Crita"
              className="absolute left-[83.8%] top-[2.0%] w-[4.0%] h-[7.0%] rounded-full bg-transparent hover:bg-yellow-400/20 hover:ring-1 hover:ring-yellow-300/40 cursor-pointer z-30"
            />
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              title="Pituduh Pengerjaan"
              className="absolute left-[89.2%] top-[2.0%] w-[4.0%] h-[7.0%] rounded-full bg-transparent hover:bg-yellow-400/20 hover:ring-1 hover:ring-yellow-300/40 cursor-pointer z-30"
            />
            <button
              type="button"
              onClick={() => setAudioPlaying((p) => !p)}
              title={audioPlaying ? 'Pateni Swara' : 'Uripake Swara'}
              className="absolute left-[94.5%] top-[2.0%] w-[4.0%] h-[7.0%] rounded-full bg-transparent hover:bg-yellow-400/20 hover:ring-1 hover:ring-yellow-300/40 cursor-pointer z-30 flex items-center justify-center"
            >
              {audioPlaying && (
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
              )}
            </button>

            {/* ----------------------------------------------------
                TEXTAREA INPUT BOXES: TOKOH 1 - 4
               ---------------------------------------------------- */}
            
            {/* Tokoh 1 (Rara Kuning) */}
            <div className="absolute left-[21.8%] top-[55.0%] w-[17.2%] h-[23.0%] z-20">
              <textarea
                value={essayAnswers.tokoh1}
                onChange={(e) =>
                  setEssayAnswers((prev) => ({ ...prev, tokoh1: e.target.value }))
                }
                placeholder="Jeneng: Rara Kuning&#10;Watek: Kendel, sabar..."
                className="w-full h-full bg-[#fcf5df]/90 text-amber-950 font-serif text-[11px] sm:text-xs leading-relaxed p-2.5 rounded-lg border border-amber-900/40 shadow-inner focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:bg-[#fffef8] resize-none overflow-y-auto selection:bg-amber-200"
              />
            </div>

            {/* Tokoh 2 (Rara Runting) */}
            <div className="absolute left-[41.1%] top-[55.0%] w-[17.1%] h-[23.0%] z-20">
              <textarea
                value={essayAnswers.tokoh2}
                onChange={(e) =>
                  setEssayAnswers((prev) => ({ ...prev, tokoh2: e.target.value }))
                }
                placeholder="Jeneng: Rara Runting&#10;Watek: Setya, ngopeni..."
                className="w-full h-full bg-[#fcf5df]/90 text-amber-950 font-serif text-[11px] sm:text-xs leading-relaxed p-2.5 rounded-lg border border-amber-900/40 shadow-inner focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:bg-[#fffef8] resize-none overflow-y-auto selection:bg-amber-200"
              />
            </div>

            {/* Tokoh 3 (Resi Darmo) */}
            <div className="absolute left-[60.0%] top-[55.0%] w-[17.6%] h-[23.0%] z-20">
              <textarea
                value={essayAnswers.tokoh3}
                onChange={(e) =>
                  setEssayAnswers((prev) => ({ ...prev, tokoh3: e.target.value }))
                }
                placeholder="Jeneng: Resi Darmo&#10;Watek: Wicaksana, sekti..."
                className="w-full h-full bg-[#fcf5df]/90 text-amber-950 font-serif text-[11px] sm:text-xs leading-relaxed p-2.5 rounded-lg border border-amber-900/40 shadow-inner focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:bg-[#fffef8] resize-none overflow-y-auto selection:bg-amber-200"
              />
            </div>

            {/* Tokoh 4 (Patih Lembu Amiseno) */}
            <div className="absolute left-[79.6%] top-[55.0%] w-[17.6%] h-[23.0%] z-20">
              <textarea
                value={essayAnswers.tokoh4}
                onChange={(e) =>
                  setEssayAnswers((prev) => ({ ...prev, tokoh4: e.target.value }))
                }
                placeholder="Jeneng: Patih Lembu Amiseno&#10;Watek: Tegas, adil..."
                className="w-full h-full bg-[#fcf5df]/90 text-amber-950 font-serif text-[11px] sm:text-xs leading-relaxed p-2.5 rounded-lg border border-amber-900/40 shadow-inner focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:bg-[#fffef8] resize-none overflow-y-auto selection:bg-amber-200"
              />
            </div>

            {/* ----------------------------------------------------
                TOMBOL SIMPAN (FLOPPY DISK)
               ---------------------------------------------------- */}
            <button
              type="button"
              onClick={handleSaveEssay}
              disabled={isSavingEssay}
              title="Simpen Kabeh Wangsulan menyang Database"
              className="absolute left-[40.5%] top-[84.8%] w-[22.8%] h-[9.8%] rounded-full bg-transparent hover:bg-yellow-400/15 hover:ring-2 hover:ring-yellow-300/80 hover:shadow-[0_0_25px_rgba(250,204,21,0.5)] active:scale-[0.98] transition-all cursor-pointer z-30 flex items-center justify-center"
            >
              {isSavingEssay && (
                <span className="text-amber-950 font-black text-xs sm:text-sm bg-yellow-300 px-3 py-1 rounded-full animate-pulse shadow-md">
                  Nyimpen...
                </span>
              )}
            </button>

            {/* Tombol Bali menyang Centhang Ciri */}
            <div className="absolute bottom-2.5 left-4 z-30">
              <button
                type="button"
                onClick={() => setActiveView('centhang')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold backdrop-blur-md shadow-md active:scale-95 transition-all"
              >
                <span>⬅</span> Bali menyang Centhang Ciri
              </button>
            </div>
          </>
        )}

        {/* ========================================================
            FLOATING TOP SWITCHER: TAHAP 1 ➔ TAHAP 2 ➔ LEVEL 2
           ======================================================== */}
        <div className="absolute top-2.5 right-[16%] z-40 flex items-center gap-1 bg-stone-950/90 backdrop-blur-md px-2 py-1 rounded-full border border-yellow-500/50 shadow-2xl">
          {/* Tab 1: Centhang Ciri Dulu */}
          <button
            type="button"
            onClick={() => setActiveView('centhang')}
            className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 ${
              activeView === 'centhang'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 shadow-md font-black'
                : 'text-amber-200/80 hover:text-yellow-300 hover:bg-amber-950/40'
            }`}
          >
            <span>✓</span>
            <span>1. Centhang Ciri</span>
          </button>

          {/* Tab 2: Tantangan Nulis Setelahnya */}
          <button
            type="button"
            onClick={() => setActiveView('uraian')}
            className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 ${
              activeView === 'uraian'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 shadow-md font-black'
                : 'text-amber-200/80 hover:text-yellow-300 hover:bg-amber-950/40'
            }`}
          >
            <span>📝</span>
            <span>2. Tantangan Nulis</span>
          </button>

          {/* Tab 3: Menuju Level 2 */}
          <button
            type="button"
            onClick={() => {
              if (isAllEssayFilled) {
                router.push('/level2');
              } else {
                const missing = [];
                if (!essayAnswers.tokoh1?.trim()) missing.push('Tokoh 1 (Rara Kuning)');
                if (!essayAnswers.tokoh2?.trim()) missing.push('Tokoh 2 (Rara Runting)');
                if (!essayAnswers.tokoh3?.trim()) missing.push('Tokoh 3 (Resi Darmo)');
                if (!essayAnswers.tokoh4?.trim()) missing.push('Tokoh 4 (Lembu Amiseno)');
                setEssayToast({
                  type: 'error',
                  msg: `⚠️ Rampungake Tantangan Nulis dhisik sadurunge menyang Level 2! (Kurang: ${missing.join(', ')})`,
                });
                setTimeout(() => setEssayToast(null), 4500);
              }
            }}
            className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 ${
              isAllEssayFilled
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-stone-950 shadow-lg font-black hover:scale-105'
                : 'bg-stone-800/90 text-stone-400 hover:text-stone-300 hover:bg-stone-800'
            }`}
          >
            <span>{isAllEssayFilled ? '🔓' : '🔒'}</span>
            <span>Level 2 ➜</span>
          </button>
        </div>

        {/* ========================================================
            TOAST NOTIFICATION (STATUS SIMPAN)
           ======================================================== */}
        {essayToast && (
          <div
            className={`absolute top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs sm:text-sm font-bold tracking-wide animate-bounce ${
              essayToast.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200'
                : 'bg-red-950/95 border-red-400 text-red-200'
            }`}
          >
            <span>{essayToast.msg}</span>
          </div>
        )}

        {/* Feedback Message for Checklist Mode */}
        {activeView === 'centhang' && feedbackMsg && (
          <div className="absolute left-[70.2%] top-[33.5%] w-[24.2%] z-30 flex items-center justify-center">
            <div className="w-full text-center py-1.5 px-3 rounded-lg bg-stone-950/90 border border-yellow-400/80 text-yellow-300 text-xs font-bold shadow-lg animate-fade-in">
              {feedbackMsg}
            </div>
          </div>
        )}

      </div>

      {/* ========================================================
          MODAL TRANSISI: SEMUA CIRI TELAH DICENTANG!
          MENGAJAK SISWA LANJUT KE TANTANGAN NULIS
         ======================================================== */}
      {showTransitionToEssayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in font-sans">
          <div className="max-w-md w-full bg-stone-900 border-2 border-yellow-500/80 rounded-2xl p-6 shadow-2xl text-center text-stone-100 space-y-4">
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 border-2 border-yellow-400 text-yellow-300 text-3xl flex items-center justify-center mx-auto shadow-lg animate-bounce">
              🎉
            </div>
            <h3 className="text-xl font-serif font-black text-yellow-400">
              Ciri-ciri 4 Tokoh Wis Dicenthang!
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
              Sampeyan wis kasil ngenali busana lan ciri-ciri Putri Rara Kuning, Rara Runting, Resi Darmo, lan Patih Lembu Amiseno. Ayo saiki lanjut menyang <strong>Tantangan Nulis</strong> kanggo njlentrehake watak lan paragane!
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={() => {
                  setShowTransitionToEssayModal(false);
                  setActiveView('uraian');
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-stone-950 font-black text-xs sm:text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>📝</span> Lanjut menyang Tantangan Nulis ➜
              </button>
              <button
                type="button"
                onClick={() => setShowTransitionToEssayModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300 font-bold text-xs transition active:scale-95"
              >
                Tetep ing Centhang Ciri
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: LEVEL 2 KABUKAK (LEVEL 2 UNLOCKED)
         ======================================================== */}
      {showUnlockLevel2Modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in font-sans">
          <div className="relative max-w-md w-full bg-stone-900 border-2 border-emerald-500/80 rounded-2xl p-6 shadow-2xl text-center text-stone-100">
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-500/80 text-emerald-400 text-3xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
              🎉
            </div>

            <h3 className="text-xl font-serif font-black text-yellow-400">
              Sampurna! Level 2 Wis Kabukak!
            </h3>

            <p className="mt-3 text-xs sm:text-sm text-stone-300 leading-relaxed">
              Kabeh wangsulan 4 tokoh ing Level 1 kasil disimpen lan lengkap. Panjenengan wis siap nglajengake lelampahan menyang <strong>Adegan 2: Cengkorongan Crita</strong>!
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
              <Link
                href="/level2"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-yellow-500 hover:from-emerald-400 hover:to-yellow-400 text-stone-950 font-black text-xs sm:text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>➜</span> Lanjut menyang Adegan 2
              </Link>
              <button
                type="button"
                onClick={() => setShowUnlockLevel2Modal(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300 font-bold text-xs sm:text-sm transition-all"
              >
                Tetep ing Kene
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: PITUDUH CARA NGERJAKAKE (HELP)
         ======================================================== */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-lg w-full bg-stone-900 border-2 border-yellow-500/70 rounded-2xl p-6 shadow-2xl text-stone-100 font-sans">
            <h3 className="text-xl font-serif font-black text-yellow-400 flex items-center gap-2">
              <span>❓</span> Pituduh Pasinaon Level 1
            </h3>
            <div className="mt-4 space-y-3 text-xs sm:text-sm text-stone-300 leading-relaxed">
              <p>
                <strong>1. Langkah 1 (Centhang Ciri Dhisik):</strong> Gatekna katrangan busana lan wacan para tokoh ing sisih kiwa, banjur centhang 2-3 pilihan sing bener lan klik tombol <em>Priksa Jawaban</em>. Lakoni kanggo kabeh 4 tokoh.
              </p>
              <p>
                <strong>2. Langkah 2 (Tantangan Nulis):</strong> Sawise ngenali ciri-ciri kabeh tokoh, klik tombol <em>Lanjut menyang Tantangan Nulis 📝</em> kanggo nulis jeneng lan watek/katrangan ringkes ing kothak Tokoh 1 nganti Tokoh 4.
              </p>
              <p>
                <strong>3. Simpen Wangsulan & Bukak Level 2:</strong> Sawise nulis, klik tombol <strong>💾 Simpan</strong> ing ngisor supaya wangsulanmu langsung disimpen lan Level 2 kabukak otomatis!
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-stone-950 font-bold text-xs sm:text-sm shadow-md"
              >
                Paham, Matur Nuwun
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: RINGKESAN CRITA RARA KUNING (STORY)
         ======================================================== */}
      {showStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-lg w-full bg-stone-900 border-2 border-yellow-500/70 rounded-2xl p-6 shadow-2xl text-stone-100 font-sans max-h-[85vh] overflow-y-auto">
            <h3 className="text-xl font-serif font-black text-yellow-400 flex items-center gap-2">
              <span>📖</span> Ringkesan Crita Rara Kuning
            </h3>
            <div className="mt-4 space-y-3 text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
              <p>
                Ing Karajan Daha/Kadiri, ana putri kang sulistya ing warna yaiku <strong>Putri Rara Kuning</strong> (Dewi Sekartaji) lan adhine <strong>Rara Runting</strong> (Dewi Kilisuci), putrane <strong>Patih Lembu Amiseno</strong>.
              </p>
              <p>
                Sawijining wektu, Rara Kuning nandhang lara gondhok lan penyakit kulit kang ngowahi kulite dadi kuning. Sanadyan nandhang gerah, dheweke ora gampang nyerah lan ngupaya golek tamba.
              </p>
              <p>
                Kanthi didampingi adhine Rara Runting, dheweke ngulandara nganti lereng Gunung Wilis. Ing kana, dheweke kepethuk karo <strong>Resi Darmo</strong>, sawijining pertapa suci kang wicaksana lan maringi pituduh kanggo adus ing grojogan suci kang saiki diarani Grojogan Rara Kuning.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowStoryModal(false)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-stone-950 font-bold text-xs sm:text-sm shadow-md"
              >
                Tutup Crita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
