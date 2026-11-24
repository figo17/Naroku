'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export const treatmentItems = [
  {
    id: 'kompres',
    name: 'Kompres daun herba',
    target: 'rara_kuning',
    targetLabel: 'Putri Rara Kuning',
    reason: 'Kanggo nambani lara gondhok ing gulu.',
    image: '/assets/level2/item-kompres-daun.png',
    cardCoords: { left: '37.3%', top: '62.5%', width: '8.3%', height: '19.1%' },
  },
  {
    id: 'adus',
    name: 'Adus ramuan',
    target: 'rara_runting',
    targetLabel: 'Rara Runting (Dewi Kilisuci)',
    reason: 'Kanggo adus ngresiki lara kuning ing awak.',
    image: '/assets/level2/item-adus-ramuan.png',
    cardCoords: { left: '46.7%', top: '62.5%', width: '8.3%', height: '19.1%' },
  },
  {
    id: 'lulur',
    name: 'Lulur rempah',
    target: 'rara_kuning',
    targetLabel: 'Putri Rara Kuning',
    reason: 'Kanggo marasake kulit sisik lan gatel ing awak.',
    image: '/assets/level2/item-lulur-rempah.png',
    cardCoords: { left: '56.0%', top: '62.5%', width: '8.1%', height: '19.1%' },
  },
  {
    id: 'jamu',
    name: 'Ramuan jamu',
    target: 'rara_runting',
    targetLabel: 'Rara Runting (Dewi Kilisuci)',
    reason: 'Kanggo diombe ngobati lara kuning saka njero awak.',
    image: '/assets/level2/item-ramuan-jamu.png',
    cardCoords: { left: '64.9%', top: '62.5%', width: '8.3%', height: '19.1%' },
  },
];

export default function Level2OrientasiPerawatanPage() {
  const router = useRouter();
  const supabase = createClient();
  const containerRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);

  // Drag & Pointer Following States
  const [activeItem, setActiveItem] = useState(null); // id item yang sedang aktif/dipegang
  const [isDragging, setIsDragging] = useState(false);
  const [pointerPos, setPointerPos] = useState({ xPercent: 50, yPercent: 50, pxX: 0, pxY: 0 });
  const [hoveredTarget, setHoveredTarget] = useState(null); // 'rara_kuning' | 'rara_runting' | null

  // Treatments Applied to Princesses
  const [appliedTreatments, setAppliedTreatments] = useState({
    rara_kuning: [], // ['kompres', 'lulur']
    rara_runting: [], // ['adus', 'jamu']
  });

  // Feedback & Completion
  const [feedback, setFeedback] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);

  // 1. Load User & Previous Results
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

        // Load existing saved treatments
        const { data: savedData } = await supabase
          .from('level2_orientasi_results')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (savedData) {
          setAppliedTreatments({
            rara_kuning: savedData.rara_kuning_treatments || [],
            rara_runting: savedData.rara_runting_treatments || [],
          });
          if (savedData.is_completed) {
            // Already completed
          }
        }
      } catch (err) {
        console.error('Error loading level 2 orientasi data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router, supabase]);

  // 2. Pointer Position Calculator relative to 16:9 container
  const updatePointer = (clientX, clientY) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    setPointerPos({ xPercent, yPercent, pxX: x, pxY: y });

    // Hitbox Drop Zones
    // Rara Kuning: X 23%..53%, Y 15%..60%
    // Rara Runting: X 54%..85%, Y 15%..60%
    if (xPercent >= 23 && xPercent <= 53 && yPercent >= 15 && yPercent <= 60) {
      setHoveredTarget('rara_kuning');
    } else if (xPercent >= 54 && xPercent <= 85 && yPercent >= 15 && yPercent <= 60) {
      setHoveredTarget('rara_runting');
    } else {
      setHoveredTarget(null);
    }
  };

  // 3. Item Selection & Drag Handlers
  const handleItemStart = (itemId, clientX, clientY) => {
    setActiveItem(itemId);
    setIsDragging(true);
    updatePointer(clientX, clientY);
    const itemData = treatmentItems.find((it) => it.id === itemId);
    setFeedback({
      type: 'info',
      text: `Piranti dicekel: ${itemData?.name}. Seret utawa klik menyang putri sing trep!`,
    });
  };

  const handlePointerMove = (e) => {
    if (!activeItem) return;
    updatePointer(e.clientX, e.clientY);
  };

  const handleTouchMove = (e) => {
    if (!activeItem || !e.touches[0]) return;
    updatePointer(e.touches[0].clientX, e.touches[0].clientY);
  };

  // 4. Apply Item to Target (Princess)
  const applyItemToTarget = async (targetPrincess) => {
    if (!activeItem) return;

    const itemData = treatmentItems.find((it) => it.id === activeItem);
    if (!itemData) return;

    // Check if already applied
    if (
      appliedTreatments.rara_kuning.includes(activeItem) ||
      appliedTreatments.rara_runting.includes(activeItem)
    ) {
      setFeedback({
        type: 'info',
        text: `Bahan ${itemData.name} wis tau ditrepake!`,
      });
      setActiveItem(null);
      setIsDragging(false);
      return;
    }

    // Check if target is correct according to story
    if (itemData.target === targetPrincess) {
      // CORRECT!
      const updated = {
        ...appliedTreatments,
        [targetPrincess]: [...appliedTreatments[targetPrincess], activeItem],
      };
      setAppliedTreatments(updated);

      setFeedback({
        type: 'success',
        text: `✓ Bener! ${itemData.name} kasil ditrepake kanggo ${itemData.targetLabel}! (${itemData.reason})`,
      });

      // Check if all 4 are now completed
      const totalApplied = updated.rara_kuning.length + updated.rara_runting.length;
      if (totalApplied === 4) {
        saveCompletion(updated, true);
        setTimeout(() => setShowSuccessModal(true), 600);
      }
    } else {
      // INCORRECT TARGET
      setFeedback({
        type: 'error',
        text: `❌ Kurang cocog! ${itemData.name} ora trep kanggo ${
          targetPrincess === 'rara_kuning' ? 'Rara Kuning' : 'Rara Runting'
        }. Coba wacanen maneh katrangan larané ing kothak sisih ndhuwur!`,
      });
    }

    setActiveItem(null);
    setIsDragging(false);
    setHoveredTarget(null);
  };

  const handlePointerUp = () => {
    if (!isDragging || !activeItem) return;

    if (hoveredTarget) {
      applyItemToTarget(hoveredTarget);
    } else {
      // Let go outside targets -> cancel drag
      setActiveItem(null);
      setIsDragging(false);
      setHoveredTarget(null);
    }
  };

  // 5. Save Results to Supabase
  const saveCompletion = async (treatments, isCompleted) => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      await supabase.from('level2_orientasi_results').upsert(
        {
          user_id: currentUser.id,
          student_name: studentProfile?.nama_lengkap || currentUser.email.split('@')[0],
          student_nisn: studentProfile?.nomor_induk || '',
          rara_kuning_treatments: treatments.rara_kuning,
          rara_runting_treatments: treatments.rara_runting,
          is_completed: isCompleted,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
    } catch (err) {
      console.error('Error saving Level 2 orientasi results:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Button: Tindakake Perawatan
  const handleTindakakePerawatan = () => {
    const totalApplied = appliedTreatments.rara_kuning.length + appliedTreatments.rara_runting.length;
    if (totalApplied === 4) {
      setShowSuccessModal(true);
    } else {
      setFeedback({
        type: 'info',
        text: `Bahan sing wis ditrepake: ${totalApplied}/4. Lakoni nganti kabeh 4 bahan perawatan trep karo larané saben putri!`,
      });
    }
  };

  // Reset Perawatan
  const handleReset = () => {
    setAppliedTreatments({ rara_kuning: [], rara_runting: [] });
    setActiveItem(null);
    setFeedback({ type: 'info', text: 'Pilihan perawatan direset. Mangga wiwiti maneh!' });
  };

  const totalCompleted = appliedTreatments.rara_kuning.length + appliedTreatments.rara_runting.length;
  const isAllReady = totalCompleted === 4;

  const currentActiveData = activeItem
    ? treatmentItems.find((it) => it.id === activeItem)
    : null;

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#04120a] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-3 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm tracking-wide text-amber-200">Mbukak Pasinaon Level 2: Orientasi...</p>
      </div>
    );
  }

  return (
    <div
      className="relative w-screen h-screen bg-[#04120a] text-stone-100 flex flex-col items-center justify-center overflow-hidden select-none font-sans"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handlePointerUp}
    >
      {/* 
        CONTAINER UTAMA 16:9 (1024 x 576)
        Menjamin koordinat hitbox dan free transform 100% presisi di layar mana pun
      */}
      <div
        ref={containerRef}
        className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl select-none"
      >
        {/* Artwork Utama Level 2 Orientasi Perawatan */}
        <Image
          src="/assets/level2/screen_orientasi_perawatan.jpg"
          alt="Level 2: Orientasi Perawatan Rara Kuning lan Rara Runting"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
        />

        {/* ========================================================
            TOP NAVBAR HITBOXES
           ======================================================== */}
        {/* Logo -> Beranda */}
        <Link
          href="/"
          title="Legenda Rara Kuning"
          className="absolute left-[2.5%] top-[1.5%] w-[18%] h-[8%] rounded-md bg-transparent hover:bg-yellow-400/10 cursor-pointer z-30"
        />

        {/* Top Right Icons: Buku (Cerita), Bantuan (?), Audio */}
        <button
          type="button"
          onClick={() => setShowStoryModal(true)}
          title="Waca Katrangan Lara & Obat"
          className="absolute left-[83.8%] top-[2.0%] w-[4.0%] h-[7.0%] rounded-full bg-transparent hover:bg-yellow-400/20 cursor-pointer z-30"
        />
        <button
          type="button"
          onClick={() => setShowHelpModal(true)}
          title="Petunjuk Dolanan"
          className="absolute left-[89.2%] top-[2.0%] w-[4.0%] h-[7.0%] rounded-full bg-transparent hover:bg-yellow-400/20 cursor-pointer z-30"
        />
        <button
          type="button"
          onClick={() => setAudioPlaying((p) => !p)}
          title={audioPlaying ? 'Pateni Swara' : 'Uripake Swara'}
          className="absolute left-[94.5%] top-[2.0%] w-[4.0%] h-[7.0%] rounded-full bg-transparent hover:bg-yellow-400/20 cursor-pointer z-30 flex items-center justify-center"
        >
          {audioPlaying && (
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
          )}
        </button>

        {/* ========================================================
            DROP ZONES / TARGETS: RARA KUNING & RARA RUNTING
           ======================================================== */}

        {/* 1. TARGET: RARA KUNING (Kiri) */}
        <div
          onClick={() => {
            if (activeItem) applyItemToTarget('rara_kuning');
          }}
          className={`absolute left-[23.0%] top-[14.5%] w-[29.5%] h-[43.0%] rounded-3xl z-20 cursor-pointer transition-all duration-200 flex flex-col justify-between p-2 ${
            hoveredTarget === 'rara_kuning' && activeItem
              ? 'ring-4 ring-yellow-400 bg-yellow-400/15 shadow-[0_0_35px_rgba(250,204,21,0.7)] animate-pulse'
              : 'hover:bg-yellow-400/5'
          }`}
          title="Target Perawatan: Putri Rara Kuning"
        >
          {/* Badge Indikator Drop Saat Drag */}
          {activeItem && (
            <div className="self-center px-3 py-1 rounded-full bg-stone-950/90 border border-yellow-400/80 text-yellow-300 text-[10px] font-bold shadow-lg">
              🎯 Selehake kanggo Rara Kuning
            </div>
          )}

          {/* Display Applied Treatments */}
          <div className="mt-auto flex flex-wrap gap-1.5 justify-center pointer-events-none">
            {appliedTreatments.rara_kuning.map((itemId) => {
              const it = treatmentItems.find((t) => t.id === itemId);
              return (
                <div
                  key={itemId}
                  className="px-2 py-0.5 rounded-full bg-amber-950/90 border border-yellow-400 text-yellow-200 text-[9px] font-bold shadow flex items-center gap-1 animate-fade-in"
                >
                  <span>✓</span>
                  <span>{it?.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. TARGET: RARA RUNTING (Kanan) */}
        <div
          onClick={() => {
            if (activeItem) applyItemToTarget('rara_runting');
          }}
          className={`absolute left-[54.0%] top-[14.5%] w-[33.5%] h-[43.0%] rounded-3xl z-20 cursor-pointer transition-all duration-200 flex flex-col justify-between p-2 ${
            hoveredTarget === 'rara_runting' && activeItem
              ? 'ring-4 ring-emerald-400 bg-emerald-400/15 shadow-[0_0_35px_rgba(52,211,153,0.7)] animate-pulse'
              : 'hover:bg-emerald-400/5'
          }`}
          title="Target Perawatan: Rara Runting"
        >
          {/* Badge Indikator Drop Saat Drag */}
          {activeItem && (
            <div className="self-center px-3 py-1 rounded-full bg-stone-950/90 border border-emerald-400/80 text-emerald-300 text-[10px] font-bold shadow-lg">
              🎯 Selehake kanggo Rara Runting
            </div>
          )}

          {/* Display Applied Treatments */}
          <div className="mt-auto flex flex-wrap gap-1.5 justify-center pointer-events-none">
            {appliedTreatments.rara_runting.map((itemId) => {
              const it = treatmentItems.find((t) => t.id === itemId);
              return (
                <div
                  key={itemId}
                  className="px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-400 text-emerald-200 text-[9px] font-bold shadow flex items-center gap-1 animate-fade-in"
                >
                  <span>✓</span>
                  <span>{it?.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================
            4 ITEM CARDS (PILIHAN PERAWATAN DI BAWAH)
           ======================================================== */}
        {treatmentItems.map((item) => {
          const isApplied =
            appliedTreatments.rara_kuning.includes(item.id) ||
            appliedTreatments.rara_runting.includes(item.id);
          const isCurrentActive = activeItem === item.id;

          return (
            <div
              key={item.id}
              style={{
                left: item.cardCoords.left,
                top: item.cardCoords.top,
                width: item.cardCoords.width,
                height: item.cardCoords.height,
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                handleItemStart(item.id, e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                if (e.touches[0]) {
                  handleItemStart(item.id, e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              className={`absolute rounded-xl z-20 cursor-grab active:cursor-grabbing transition-all select-none flex flex-col items-center justify-center ${
                isApplied
                  ? 'opacity-35 pointer-events-none'
                  : isCurrentActive
                  ? 'ring-2 ring-yellow-400 bg-yellow-400/20 scale-105'
                  : 'hover:ring-2 hover:ring-yellow-300/80 hover:bg-yellow-400/10'
              }`}
              title={`${item.name} (Pencet/Seret menyang putri)`}
            >
              {/* Badge jika sudah diterapkan */}
              {isApplied && (
                <div className="absolute top-1 right-1 px-1.5 py-0.2 rounded-full bg-emerald-900 border border-emerald-400 text-emerald-200 text-[9px] font-bold shadow">
                  ✓ Ditrepake
                </div>
              )}
            </div>
          );
        })}

        {/* ========================================================
            FREE TRANSFORM / FLOATING ITEM FOLLOWING POINTER
            (Hanya muncul jika item disentuh/dipencet, tersembunyi jika belum nyentuh)
           ======================================================== */}
        {activeItem && currentActiveData && (
          <div
            style={{
              position: 'absolute',
              left: `${pointerPos.xPercent}%`,
              top: `${pointerPos.yPercent}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 50,
              pointerEvents: 'none',
            }}
            className="flex flex-col items-center select-none animate-scale-up"
          >
            {/* Bayangan floating */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 drop-shadow-[0_15px_25px_rgba(0,0,0,0.85)] filter brightness-110">
              <Image
                src={currentActiveData.image}
                alt={currentActiveData.name}
                fill
                priority
                sizes="120px"
                className="object-contain"
              />
            </div>

            {/* Label nama bahan melayang bersama kursor */}
            <div className="px-3 py-1 rounded-full bg-stone-950/95 border border-yellow-400/90 text-yellow-300 text-[10px] sm:text-xs font-serif font-bold shadow-2xl tracking-wide whitespace-nowrap mt-1 flex items-center gap-1.5">
              <span>✨</span>
              <span>{currentActiveData.name}</span>
            </div>
          </div>
        )}

        {/* ========================================================
            TOMBOL: TINDAKAKE PERAWATAN & BANJUR
           ======================================================== */}
        {/* Tombol: Tindakake Perawatan (Tengah) */}
        <button
          type="button"
          onClick={handleTindakakePerawatan}
          title="Tindakake Perawatan"
          className="absolute left-[42.1%] top-[88.0%] w-[24.5%] h-[7.6%] rounded-full bg-transparent hover:bg-yellow-400/15 hover:ring-2 hover:ring-yellow-300/80 hover:shadow-[0_0_25px_rgba(250,204,21,0.5)] active:scale-[0.98] transition-all cursor-pointer z-30 flex items-center justify-center"
        >
          <span className="sr-only">Tindakake Perawatan</span>
        </button>

        {/* Tombol: Banjur > (Kanan Bawah) */}
        <button
          type="button"
          onClick={() => {
            if (isAllReady) {
              router.push('/level2/orientasi/hasil');
            } else {
              setFeedback({
                type: 'info',
                text: '⚠️ Rampungake kabeh 4 perawatan putri sadurunge nglajengake menyang adegan sabanjure!',
              });
            }
          }}
          title={isAllReady ? 'Nglajengake menyang Asil Perawatan' : 'Rampungake perawatan dhisik'}
          className={`absolute left-[84.5%] top-[89.4%] w-[11.7%] h-[7.8%] rounded-full bg-transparent transition-all cursor-pointer z-30 flex items-center justify-center ${
            isAllReady
              ? 'hover:bg-yellow-400/20 hover:ring-2 hover:ring-yellow-300 hover:shadow-[0_0_20px_rgba(250,204,21,0.6)] animate-pulse'
              : 'hover:bg-stone-800/20'
          }`}
        >
          <span className="sr-only">Banjur</span>
        </button>

        {/* ========================================================
            FEEDBACK TOAST NOTIFICATION
           ======================================================== */}
        {feedback && (
          <div
            className={`absolute top-16 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[90%] px-4 py-2.5 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs sm:text-sm font-bold tracking-wide animate-fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200'
                : feedback.type === 'error'
                ? 'bg-red-950/95 border-red-400 text-red-200'
                : 'bg-stone-950/95 border-yellow-500/80 text-yellow-300'
            }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-stone-400 hover:text-white text-xs px-1.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* Floating Reset Button */}
        <div className="absolute bottom-2.5 left-4 z-30 flex items-center gap-2">
          <Link
            href="/level2"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black/90 border border-yellow-500/60 text-yellow-300 text-[11px] font-bold backdrop-blur-md shadow-md active:scale-95 transition-all"
          >
            <span>⬅</span> Adegan 2
          </Link>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black/90 border border-stone-600 hover:border-yellow-500/60 text-stone-300 hover:text-yellow-300 text-[11px] font-bold backdrop-blur-md shadow-md active:scale-95 transition-all"
            title="Reset Pilihan Perawatan"
          >
            <span>🔄</span> Reset
          </button>
        </div>

      </div>

      {/* ========================================================
          MODAL: SUKSES SEMUA PERAWATAN LENGKAP
         ======================================================== */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in font-sans">
          <div className="relative max-w-md w-full bg-stone-900 border-2 border-yellow-500/80 rounded-2xl p-6 shadow-2xl text-center text-stone-100">
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-400/80 text-emerald-400 text-3xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
              🎉
            </div>

            <h3 className="text-xl font-serif font-black text-yellow-400">
              Sampurna! Perawatan Kasil!
            </h3>

            <p className="mt-3 text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
              Matur nuwun! <strong>Putri Rara Kuning</strong> wis nampa kompres godhong lan lulur rempah, sarta <strong>Rara Runting</strong> wis nampa adus ramuan lan jamu tradhisional.
            </p>

            <div className="mt-4 p-3 rounded-xl bg-amber-950/60 border border-amber-800/80 text-left text-xs space-y-1 text-amber-200">
              <p className="font-bold text-yellow-300">✓ Hasil Perawatan:</p>
              <p>• Rara Kuning: Kompres Daun Herba & Lulur Rempah (Cocog)</p>
              <p>• Rara Runting: Adus Ramuan & Ramuan Jamu (Cocog)</p>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
              <Link
                href="/level2/orientasi/hasil"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-stone-950 font-black text-xs sm:text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>📜</span> Deleng Asil Perawatan (Banjur →)
              </Link>
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300 font-bold text-xs sm:text-sm transition-all"
              >
                Deleng Tampilan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: PETUNJUK DOLANAN (HELP)
         ======================================================== */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in font-sans">
          <div className="relative max-w-lg w-full bg-stone-900 border-2 border-yellow-500/80 rounded-2xl p-6 shadow-2xl text-stone-100">
            <h3 className="text-xl font-serif font-black text-yellow-400 flex items-center gap-2">
              <span>❓</span> Petunjuk Dolanan Orientasi Perawatan
            </h3>
            <div className="mt-4 space-y-3 text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
              <p>
                <strong>1. Wacanen Katrangan Lara:</strong> Gatekna katrangan larané Rara Kuning (Gondhok & Lara kulit) lan Rara Runting (Lara kuning).
              </p>
              <p>
                <strong>2. Pilih lan Seret (Free Transform):</strong> Pencet salah siji saka 4 bahan perawatan ing ngisor, banjur seret utawa arahake kursor/driji menyang putri sing cocog.
              </p>
              <p>
                <strong>3. Selehake Bahan:</strong> Culake bahan kasebut ing area Rara Kuning utawa Rara Runting. Yen bener, bahan bakal nempel otomatis.
              </p>
              <p>
                <strong>4. Rampungake Kabeh:</strong> Priksa nganti kabeh 4 bahan perawatan ditrepake kanthi bener.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 text-stone-950 font-bold text-xs sm:text-sm shadow-md"
              >
                Paham, Matur Nuwun
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: KATRANGAN LARA & OBAT (STORY)
         ======================================================== */}
      {showStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in font-sans">
          <div className="relative max-w-lg w-full bg-stone-900 border-2 border-yellow-500/80 rounded-2xl p-6 shadow-2xl text-stone-100 max-h-[85vh] overflow-y-auto">
            <h3 className="text-xl font-serif font-black text-yellow-400 flex items-center gap-2">
              <span>📖</span> Kawruh Obat Tradhisional Jawa
            </h3>
            <div className="mt-4 space-y-3 text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
              <p>
                Ing crita rakyat Jawa, tetuwuhan lan banyu suci minangka srana utama kanggo nambani maneka warna lelara:
              </p>
              <p>
                • <strong>Kompres Daun Herba:</strong> Godhong-godhongan tamba tradisional kang dibuntel lan ditetelake ing gulu kanggo ngurangi abuh lan lara gondhok.
              </p>
              <p>
                • <strong>Lulur Rempah:</strong> Parutan kunir, temu lawak, lan beras kencur kang dibalurake ing kulit kanggo ngilangi sisik, gatel, lan ngalusake kulit putri.
              </p>
              <p>
                • <strong>Adus Ramuan Kembang:</strong> Banyu sendhang kang dicampur kembang pitung rupa kanggo ngresiki hawa ala lan ngadhemake badan kang nandhang lara kuning.
              </p>
              <p>
                • <strong>Ramuan Jamu Tradhisional:</strong> Jamu godhogan empon-empon kang diombe kanggo ngresiki getih lan marasake penyakit kuning saka njero awak.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowStoryModal(false)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 text-stone-950 font-bold text-xs sm:text-sm shadow-md"
              >
                Tutup Kawruh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
