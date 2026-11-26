'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function countUkara(text) {
  if (!text || !text.trim()) return 0;
  const parts = text
    .trim()
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
  return Math.max(1, parts.length);
}

/**
 * Tampilan Rekapan Semua Jawaban Murid ("Simpanan Jawaban")
 * Menimpa 4 kartu pada bingkai perkamen dengan seluruh jawaban asli murid (2 halaman x 4 kartu = 8 jawaban:
 * Halaman 1: Gladhen Nulis Alur Crita Lv 2 & Lv 3
 * Halaman 2: Uraian 4 Paraga Lv 1)
 */
export default function SimpananJawabanView({ onClose, onInsertText }) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState(1); // 1 | 2
  const [audioPlaying, setAudioPlaying] = useState(false);

  const [lv1Data, setLv1Data] = useState(null);
  const [lv2Data, setLv2Data] = useState(null);
  const [lv3Data, setLv3Data] = useState(null);

  const [selectedCard, setSelectedCard] = useState(null);
  const [confirmDeleteCard, setConfirmDeleteCard] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const loadAllAnswers = useCallback(async () => {
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

      const [r1, r2, r3] = await Promise.all([
        supabase.from('level1_essay_answers').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('level2_nanjak_answers').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('level3_nulis_answers').select('*').eq('user_id', user.id).maybeSingle(),
      ]);

      setLv1Data(r1.data || {});
      setLv2Data(r2.data || {});
      setLv3Data(r3.data || {});
    } catch (err) {
      console.error('Error loading Simpanan Jawaban:', err);
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    loadAllAnswers();
  }, [loadAllAnswers]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const handleClose = () => {
    if (onClose) onClose();
    else router.push('/level3/nulis');
  };

  const allCards = [
    // HALAMAN 1: GLADHEN NULIS ALUR CRITA (LV 2 & LV 3)
    {
      id: 'lv2_nanjak',
      title: 'Lv 2 – Nanjak (Lelara ing Kraton)',
      thumb: '/assets/level2/screen_nanjak_tugas_nulis.jpg',
      text: lv2Data?.answer || '',
      table: 'level2_nanjak_answers',
      column: 'answer',
      editHref: '/level2/nanjak',
    },
    {
      id: 'lv2_mucuk',
      title: 'Lv 2 – Ngumbara ing Alas',
      thumb: '/assets/level2/screen_gladhen_nulis_akhir.jpg',
      text: lv2Data?.gladhen_answer || '',
      table: 'level2_nanjak_answers',
      column: 'gladhen_answer',
      editHref: '/level2/gladhen',
    },
    {
      id: 'lv2_mudhun',
      title: 'Lv 2 – Ngracik Ramuan Jamu',
      thumb: '/assets/level2/screen_gladhen_mudhun.jpg',
      text: lv2Data?.mudhun_answer || '',
      table: 'level2_nanjak_answers',
      column: 'mudhun_answer',
      editHref: '/level2/gladhen-jamu',
    },
    {
      id: 'lv3_narasi',
      title: 'Lv 3 – Narasi Grojogan Rara Kuning',
      thumb: '/assets/level2/screen_adus_air_terjun.jpg',
      text: lv3Data?.narasi || '',
      table: 'level3_nulis_answers',
      column: 'narasi',
      editHref: '/level3/nulis',
    },
    // HALAMAN 2: ORIENTASI 4 PARAGA (LV 1)
    {
      id: 'lv1_tokoh1',
      title: 'Lv 1 – Putri Rara Kuning',
      thumb: '/assets/level1/screen_rara_kuning.jpg',
      text: lv1Data?.tokoh1_answer || '',
      table: 'level1_essay_answers',
      column: 'tokoh1_answer',
      editHref: '/level1',
    },
    {
      id: 'lv1_tokoh2',
      title: 'Lv 1 – Rara Runting (Kilisuci)',
      thumb: '/assets/level1/screen_rara_runting.jpg',
      text: lv1Data?.tokoh2_answer || '',
      table: 'level1_essay_answers',
      column: 'tokoh2_answer',
      editHref: '/level1',
    },
    {
      id: 'lv1_tokoh3',
      title: 'Lv 1 – Resi Darmo (Padhepokan)',
      thumb: '/assets/level1/screen_resi_darmo.jpg',
      text: lv1Data?.tokoh3_answer || '',
      table: 'level1_essay_answers',
      column: 'tokoh3_answer',
      editHref: '/level1',
    },
    {
      id: 'lv1_tokoh4',
      title: 'Lv 1 – Patih Lembu Amiseno',
      thumb: '/assets/level1/screen_lembu_amiseno.jpg',
      text: lv1Data?.tokoh4_answer || '',
      table: 'level1_essay_answers',
      column: 'tokoh4_answer',
      editHref: '/level1',
    },
  ];

  const totalPages = 2;
  const visibleCards = allCards.slice((page - 1) * 4, page * 4);

  const handleDeleteAnswer = async (card) => {
    if (!currentUser || !card) return;
    setIsDeleting(true);
    try {
      const payload =
        card.table === 'level3_nulis_answers'
          ? { [card.column]: '', word_count: 0, updated_at: new Date().toISOString() }
          : { [card.column]: '', updated_at: new Date().toISOString() };

      const { error } = await supabase
        .from(card.table)
        .update(payload)
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('Error clearing answer:', error);
        setToast({ type: 'error', text: 'Gagal mbusak jawaban. Coba maneh!' });
      } else {
        if (card.table === 'level1_essay_answers') {
          setLv1Data((prev) => ({ ...prev, [card.column]: '' }));
        } else if (card.table === 'level2_nanjak_answers') {
          setLv2Data((prev) => ({ ...prev, [card.column]: '' }));
        } else {
          setLv3Data((prev) => ({ ...prev, [card.column]: '' }));
        }
        setToast({ type: 'success', text: `✓ Jawaban "${card.title}" wis dikosongake.` });
      }
    } finally {
      setIsDeleting(false);
      setConfirmDeleteCard(null);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-[#04120a] text-stone-100 flex items-center justify-center overflow-hidden select-none font-sans">
      {/* Container 4:3 (1024 x 768) */}
      <div className="relative w-full h-full max-w-[calc(100vh*4/3)] max-h-[calc(100vw*3/4)] aspect-[4/3] overflow-hidden shadow-2xl">
        <Image
          src="/assets/level3/screen_simpanan_jawaban.jpg"
          alt="Simpanan Jawaban Gladhen Nulis Siswa"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
        />

        {/* ===== TOP BAR HITBOXES (Inventori, Misi, Peta, Jurnal, Swara, Setelan) ===== */}
        <button
          type="button"
          onClick={() => setPage(1)}
          title="Halaman 1: Gladhen Alur Crita"
          className="absolute left-[49.0%] top-[1.0%] w-[11.2%] h-[5.2%] rounded-lg bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
        />
        <button
          type="button"
          onClick={() => setPage(2)}
          title="Halaman 2: Paraga Level 1"
          className="absolute left-[61.0%] top-[1.0%] w-[8.2%] h-[5.2%] rounded-lg bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
        />
        <Link
          href="/peta"
          title="Peta Petualangan"
          className="absolute left-[70.0%] top-[1.0%] w-[8.2%] h-[5.2%] rounded-lg bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
        />
        <button
          type="button"
          onClick={handleClose}
          title="Bali menyang Mode Nulis Level 3"
          className="absolute left-[79.0%] top-[1.0%] w-[10.0%] h-[5.2%] rounded-lg bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
        />
        <button
          type="button"
          onClick={() => setAudioPlaying((p) => !p)}
          title={audioPlaying ? 'Pateni Swara' : 'Uripake Swara'}
          className="absolute left-[90.0%] top-[1.0%] w-[4.2%] h-[5.2%] rounded-lg bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
        />
        <button
          type="button"
          onClick={handleClose}
          title="Tutup Simpanan Jawaban"
          className="absolute left-[94.8%] top-[1.0%] w-[4.2%] h-[5.2%] rounded-lg bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
        />

        {/* ===== TOMBOL CLOSE ABANG (✕) ING POJOK TENGEN NDHUWUR BINGKAI ===== */}
        <button
          type="button"
          onClick={handleClose}
          title="Tutup Simpanan Jawaban"
          aria-label="Tutup"
          className="absolute left-[92.3%] top-[31.8%] w-[5.0%] h-[5.8%] rounded-full bg-transparent hover:bg-white/20 hover:ring-2 hover:ring-yellow-200 active:scale-95 transition-all cursor-pointer z-35"
        >
          <span className="sr-only">Tutup</span>
        </button>

        {/* ===== GRID 2x2 KARTU JAWABAN ASLI MURID (MENIMPA AREA PERKAMEN) ===== */}
        <div className="absolute left-[5.2%] top-[43.8%] w-[89.6%] h-[38.8%] z-25 grid grid-cols-2 grid-rows-2 gap-2.5 sm:gap-3.5">
          {loading ? (
            <div className="col-span-2 row-span-2 flex flex-col items-center justify-center text-amber-950 gap-2">
              <div className="w-8 h-8 border-3 border-amber-800 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs sm:text-sm font-serif font-bold">Mbukak kabeh simpanan jawabanmu...</p>
            </div>
          ) : (
            visibleCards.map((card) => {
              const hasAnswer = Boolean(card.text?.trim());
              const ukara = countUkara(card.text);

              return (
                <div
                  key={card.id}
                  onClick={() => {
                    if (hasAnswer) setSelectedCard(card);
                  }}
                  className={`relative rounded-xl bg-[#fcf2dc] border-2 border-[#d5b57e] shadow-[0_3px_10px_rgba(92,58,18,0.16)] p-2 sm:p-2.5 flex items-stretch gap-2.5 transition-all ${
                    hasAnswer
                      ? 'hover:border-amber-600 hover:shadow-[0_4px_14px_rgba(146,64,14,0.28)] cursor-pointer'
                      : 'opacity-85'
                  }`}
                >
                  {/* Thumbnail Gambar berbingkai emas */}
                  <div className="relative w-[27%] shrink-0 rounded-lg overflow-hidden border-2 border-amber-500 shadow-sm bg-stone-800">
                    <Image
                      src={card.thumb}
                      alt={card.title}
                      fill
                      sizes="140px"
                      className="object-cover object-center"
                    />
                  </div>

                  {/* Isi Teks Jawaban Murid */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-1.5">
                      <h3 className="font-sans font-extrabold text-[#2b1806] text-[10px] sm:text-xs md:text-[13px] leading-tight truncate">
                        {card.title}
                      </h3>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold ${
                          hasAnswer
                            ? 'bg-[#edd6a9] text-[#543411]'
                            : 'bg-stone-300/70 text-stone-600'
                        }`}
                      >
                        {hasAnswer ? `${ukara} ukara` : 'Kosong'}
                      </span>
                    </div>

                    <div className="my-auto py-0.5 pr-5">
                      {hasAnswer ? (
                        <p className="text-[#3a230b] font-sans text-[9.5px] sm:text-[11px] md:text-xs leading-snug line-clamp-3">
                          &ldquo;{card.text.trim()}&rdquo;
                        </p>
                      ) : (
                        <p className="text-stone-500 italic text-[9.5px] sm:text-[11px]">
                          Durung ana wangsulan sing disimpen ing bagian iki.{' '}
                          <Link
                            href={card.editHref}
                            onClick={(e) => e.stopPropagation()}
                            className="underline font-bold text-amber-800 hover:text-amber-600"
                          >
                            Isi saiki →
                          </Link>
                        </p>
                      )}
                    </div>

                    {/* Baris Bawah Kecil: Baca / Salin + Ikon Tempat Sampah */}
                    <div className="flex items-center justify-between pt-0.5">
                      {hasAnswer ? (
                        <span className="text-[8.5px] sm:text-[10px] font-bold text-amber-800">
                          {onInsertText ? '✨ Klik kanggo maca / lebokake narasi' : '📖 Klik kanggo maca lengkap'}
                        </span>
                      ) : (
                        <span />
                      )}

                      {hasAnswer && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteCard(card);
                          }}
                          title="Kosongake jawaban iki"
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-md hover:bg-red-500/15 text-[#6b4922] hover:text-red-700 flex items-center justify-center text-xs sm:text-sm transition cursor-pointer"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ===== PAGINATION TENGAH NGISOR: <  1 / 2  > ===== */}
        <div className="absolute left-1/2 top-[84.4%] -translate-x-1/2 z-30 flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setPage((p) => (p > 1 ? p - 1 : totalPages))}
            title="Kaca Sadurunge"
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-yellow-300 to-amber-500 hover:from-yellow-200 hover:to-amber-400 border-2 border-amber-900 text-amber-950 font-black text-xs sm:text-sm shadow-md active:scale-90 transition cursor-pointer flex items-center justify-center"
          >
            ❮
          </button>

          <div className="px-3.5 py-0.5 sm:px-4 sm:py-1 rounded-full bg-[#4a2b0d] border-2 border-amber-500/80 text-amber-100 font-sans font-extrabold text-[10px] sm:text-xs shadow-inner">
            {page} / {totalPages}
          </div>

          <button
            type="button"
            onClick={() => setPage((p) => (p < totalPages ? p + 1 : 1))}
            title="Kaca Sabanjure"
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-yellow-300 to-amber-500 hover:from-yellow-200 hover:to-amber-400 border-2 border-amber-900 text-amber-950 font-black text-xs sm:text-sm shadow-md active:scale-90 transition cursor-pointer flex items-center justify-center"
          >
            ❯
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] px-4 py-2.5 rounded-2xl border shadow-2xl text-xs sm:text-sm font-bold ${
            toast.type === 'error'
              ? 'bg-red-950/95 border-red-400 text-red-200'
              : 'bg-emerald-950/95 border-emerald-400 text-emerald-200'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Modal Waca Lengkap / Lebokake menyang Narasi Level 3 */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-stone-900 border-2 border-yellow-500/85 rounded-2xl p-6 shadow-2xl space-y-4 text-stone-100">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-serif font-black text-yellow-400 text-base sm:text-lg">
                {selectedCard.title}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedCard(null)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#fcf2dc] text-amber-950 border border-amber-700/40 text-xs sm:text-sm font-serif leading-relaxed whitespace-pre-wrap max-h-[50vh] overflow-y-auto select-text">
              &ldquo;{selectedCard.text.trim()}&rdquo;
            </div>

            <div className="flex flex-wrap justify-between items-center gap-2 pt-1">
              <Link
                href={selectedCard.editHref}
                className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-amber-300 text-xs font-bold"
              >
                ✏️ Owahi ing Halaman Asal
              </Link>

              <div className="flex gap-2">
                {onInsertText && (
                  <button
                    type="button"
                    onClick={() => {
                      onInsertText(selectedCard.text.trim());
                      setSelectedCard(null);
                      if (onClose) onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-black text-xs shadow-lg cursor-pointer"
                  >
                    ➕ Lebokake ing Narasi Lv 3
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedCard(null)}
                  className="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-black text-xs cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Busak Jawaban */}
      {confirmDeleteCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-stone-900 border-2 border-red-500/80 rounded-2xl p-6 shadow-2xl space-y-4 text-stone-100">
            <h3 className="text-lg font-serif font-black text-red-400">🗑️ Busak Simpanan Jawaban?</h3>
            <p className="text-xs sm:text-sm text-stone-300 font-serif leading-relaxed">
              Apa kowe yakin arep ngosongake jawaban ing bagian <strong>{confirmDeleteCard.title}</strong>?
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setConfirmDeleteCard(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDeleteAnswer(confirmDeleteCard)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black cursor-pointer"
              >
                {isDeleting ? 'Mbusak...' : 'Ya, Busak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
