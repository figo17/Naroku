'use client';

import React, { useState } from 'react';
import { useUIStore } from '@/store/useUIStore';
import { createClient } from '@/lib/supabase/client';

/**
 * QuizModal Component ("Garapan")
 * Interactive quiz evaluation modal.
 * Styled parchment background (bg-[#FDF6E3]), green hover options,
 * and records student results into Supabase `quiz_results`.
 */
export default function QuizModal({ onQuizFinished }) {
  const { isQuizOpen, currentQuiz, closeQuiz } = useUIStore();
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultFeedback, setResultFeedback] = useState(null);

  if (!isQuizOpen || !currentQuiz) {
    return null;
  }

  const options = [
    { key: 'a', text: currentQuiz.opsi_a },
    { key: 'b', text: currentQuiz.opsi_b },
    { key: 'c', text: currentQuiz.opsi_c },
    { key: 'd', text: currentQuiz.opsi_d },
  ].filter((opt) => Boolean(opt.text));

  const handleSelect = (key) => {
    if (resultFeedback) return;
    setSelectedOption(key);
  };

  const handleSubmit = async () => {
    if (!selectedOption || isSubmitting) return;

    setIsSubmitting(true);
    const isCorrect = selectedOption.toLowerCase() === currentQuiz.jawaban_benar?.toLowerCase();
    const skor = isCorrect ? (currentQuiz.poin || 20) : 0;

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user && currentQuiz.id) {
        // Upsert result to quiz_results
        await supabase.from('quiz_results').upsert(
          {
            user_id: user.id,
            quiz_id: currentQuiz.id,
            jawaban_dipilih: selectedOption.toLowerCase(),
            is_correct: isCorrect,
            skor: skor,
            answered_at: new Date().toISOString(),
          },
          { onConflict: 'user_id, quiz_id' }
        );
      }
    } catch (err) {
      console.error('Error saving quiz result:', err);
    } finally {
      setIsSubmitting(false);
      setResultFeedback({
        isCorrect,
        skor,
      });
    }
  };

  const handleClose = () => {
    const feedback = resultFeedback;
    setSelectedOption(null);
    setResultFeedback(null);
    closeQuiz();
    if (onQuizFinished) {
      onQuizFinished(feedback);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#FDF6E3] border-4 border-amber-800 rounded-2xl shadow-2xl p-6 text-stone-900 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-800/30 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📝</span>
            <h2 className="text-xl font-bold font-serif text-amber-950">
              Garapan Evaluasi
            </h2>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded bg-amber-200 text-amber-900 border border-amber-400">
            {currentQuiz.poin || 20} Poin
          </span>
        </div>

        {/* Question Text */}
        <div className="text-base sm:text-lg font-serif font-medium text-stone-800 leading-relaxed bg-amber-50/60 p-3 rounded-lg border border-amber-200">
          {currentQuiz.pertanyaan}
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2.5">
          {options.map((option) => {
            const isChosen = selectedOption === option.key;
            let btnStyle = 'bg-white/80 hover:bg-emerald-600 hover:text-white border-amber-300';

            if (isChosen) {
              btnStyle = 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400';
            }

            if (resultFeedback) {
              const isActualCorrect = option.key.toLowerCase() === currentQuiz.jawaban_benar?.toLowerCase();
              if (isActualCorrect) {
                btnStyle = 'bg-emerald-600 text-white border-emerald-700';
              } else if (isChosen && !resultFeedback.isCorrect) {
                btnStyle = 'bg-rose-600 text-white border-rose-700';
              } else {
                btnStyle = 'bg-stone-200 text-stone-500 border-stone-300 opacity-60';
              }
            }

            return (
              <button
                key={option.key}
                disabled={Boolean(resultFeedback)}
                onClick={() => handleSelect(option.key)}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left font-serif text-sm sm:text-base transition-all active:scale-[0.99] ${btnStyle}`}
              >
                <span className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 mt-0.5">
                  {option.key}
                </span>
                <span className="flex-1">{option.text}</span>
              </button>
            );
          })}
        </div>

        {/* Result Message */}
        {resultFeedback && (
          <div
            className={`p-3 rounded-xl text-center font-bold text-sm ${
              resultFeedback.isCorrect
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-400'
                : 'bg-rose-100 text-rose-800 border border-rose-400'
            }`}
          >
            {resultFeedback.isCorrect
              ? '🎉 Bener banget! Panjenengan entuk poin ganjaran!'
              : '❌ Kurang trep. Ayo sinau maneh liwat Pamilihe Tembung!'}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-amber-800/30">
          {!resultFeedback ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedOption || isSubmitting}
              className={`px-6 py-2 rounded-xl font-bold text-sm shadow-md transition-all ${
                selectedOption && !isSubmitting
                  ? 'bg-amber-700 hover:bg-amber-600 text-amber-50 active:scale-95'
                  : 'bg-stone-300 text-stone-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Nyimpen...' : 'Kirim Jawaban'}
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="px-6 py-2 rounded-xl bg-amber-800 hover:bg-amber-700 text-amber-50 font-bold text-sm shadow-md active:scale-95 transition-all"
            >
              Banjurake Petualangan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
