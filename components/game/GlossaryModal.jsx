'use client';

import React, { useState } from 'react';
import { useUIStore } from '@/store/useUIStore';
import { glossaryData } from '@/data/glossary';

/**
 * GlossaryModal Component ("Pamilihe Tembung")
 * Traditional parchment style modal showing Javanese vocabulary and meanings.
 */
export default function GlossaryModal() {
  const { isGlossaryOpen, closeGlossary } = useUIStore();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isGlossaryOpen) {
    return null;
  }

  const list = glossaryData || [];
  const filtered = list.filter(
    (item) =>
      item.kata.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.arti.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.konteks?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[85vh] bg-[#FDF6E3] border-4 border-amber-800 rounded-2xl shadow-2xl p-6 text-stone-900 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-800/30 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📜</span>
            <div>
              <h2 className="text-xl font-bold font-serif text-amber-950">
                Pamilihe Tembung
              </h2>
              <p className="text-xs text-amber-800">
                Kamus kosakata Jawa ing carita Rara Kuning
              </p>
            </div>
          </div>
          <button
            onClick={closeGlossary}
            className="w-8 h-8 rounded-full bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-bold flex items-center justify-center transition-all"
          >
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Goleki tembung utawa tegese..."
            className="w-full px-4 py-2 rounded-xl bg-amber-50 border-2 border-amber-300 focus:border-amber-600 focus:outline-none text-sm font-serif"
          />
        </div>

        {/* Vocabulary List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-stone-500 font-serif italic text-sm">
              Ora ana tembung sing cocog karo panggolekan.
            </div>
          ) : (
            filtered.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-amber-100/60 border border-amber-300/80 hover:border-amber-500 transition-all flex flex-col gap-1"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-serif font-bold text-base text-amber-950">
                    {item.kata}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-200 text-amber-800">
                    {item.kategori || 'Basa Jawa'}
                  </span>
                </div>
                <div className="text-sm font-serif text-stone-800">
                  <span className="font-semibold text-amber-900">Tegese: </span>
                  {item.arti}
                </div>
                {item.tuladha && (
                  <div className="text-xs font-serif text-stone-600 italic mt-0.5 bg-amber-50/50 p-1.5 rounded border border-amber-200/50">
                    &quot;{item.tuladha}&quot;
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-amber-800/30 flex justify-between items-center text-xs text-amber-800 font-mono">
          <span>Total: {filtered.length} tembung</span>
          <button
            onClick={closeGlossary}
            className="px-5 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-amber-50 font-bold transition-all shadow"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
