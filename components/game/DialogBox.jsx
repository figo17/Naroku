'use client';

import React, { useState, useEffect } from 'react';
import { useUIStore } from '@/store/useUIStore';

/**
 * DialogBox Component
 * Bottom dialogue box with Javanese styling:
 * - Dark background (bg-black/80)
 * - Amber border (border-amber-700)
 * - Speaker name in gold/yellow
 * - Pagination / Next dialogue step
 */
export default function DialogBox() {
  const { isDialogOpen, currentDialog, closeDialog } = useUIStore();
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    setLineIndex(0);
  }, [currentDialog]);

  if (!isDialogOpen || !currentDialog) {
    return null;
  }

  // Handle both array of lines or single dialog object
  const lines = Array.isArray(currentDialog.lines)
    ? currentDialog.lines
    : [
        {
          speaker: currentDialog.speaker || 'Karakter',
          text: currentDialog.text || currentDialog.message || '',
        },
      ];

  const currentLine = lines[lineIndex] || lines[0];

  const handleNext = () => {
    if (lineIndex < lines.length - 1) {
      setLineIndex((prev) => prev + 1);
    } else {
      closeDialog();
      if (currentDialog.onComplete) {
        currentDialog.onComplete();
      }
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-3xl pointer-events-auto">
      <div className="relative bg-black/85 backdrop-blur-md border-4 border-amber-700 rounded-2xl p-4 sm:p-6 shadow-2xl text-stone-100 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom duration-200">
        {/* Speaker Name Tag */}
        <div className="absolute -top-4 left-6 bg-amber-600 text-yellow-100 font-bold px-4 py-0.5 rounded-full border-2 border-yellow-400 text-xs sm:text-sm uppercase tracking-wider shadow">
          {currentLine.speaker}
        </div>

        {/* Dialogue Text Content */}
        <div className="mt-2 min-h-[60px] text-sm sm:text-base leading-relaxed font-serif text-stone-200">
          {currentLine.text}
        </div>

        {/* Footer info & Next Button */}
        <div className="flex items-center justify-between pt-2 border-t border-amber-900/60 mt-1">
          <span className="text-[11px] text-amber-400/80 font-mono">
            {lineIndex + 1} / {lines.length}
          </span>

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-stone-900 font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all"
          >
            <span>{lineIndex < lines.length - 1 ? 'Banjurake ▶' : 'Rampung ✔'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
