'use client';

import React from 'react';
import { useUIStore } from '@/store/useUIStore';
import { useInventoryStore } from '@/store/useInventoryStore';

/**
 * InventoryModal Component
 * Bag / Tas modal showing collected items (Wadung, Racikan Obat, Kembang, etc.).
 */
export default function InventoryModal() {
  const { isInventoryOpen, closeInventory } = useUIStore();
  const { items } = useInventoryStore();

  if (!isInventoryOpen) {
    return null;
  }

  // Predefined icons or fallback
  const getItemIcon = (code) => {
    switch (code) {
      case 'wadung':
        return '🪓';
      case 'racikan_obat':
        return '🌿';
      case 'kembang':
        return '🌸';
      case 'selendang':
        return '🧣';
      default:
        return '📦';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#FDF6E3] border-4 border-amber-800 rounded-2xl shadow-2xl p-6 text-stone-900 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-800/30 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎒</span>
            <div>
              <h2 className="text-xl font-bold font-serif text-amber-950">
                Tas Barang Bawaan
              </h2>
              <p className="text-xs text-amber-800">
                Barang-barang pusaka lan tamba sing wis dikumpulake
              </p>
            </div>
          </div>
          <button
            onClick={closeInventory}
            className="w-8 h-8 rounded-full bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-bold flex items-center justify-center transition-all"
          >
            ✕
          </button>
        </div>

        {/* Item List / Grid */}
        <div className="min-h-[160px] max-h-[300px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-stone-500 font-serif gap-2">
              <span className="text-4xl opacity-40">👝</span>
              <p className="text-sm italic">Tas isih kothong, durung ana barang.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((item, idx) => (
                <div
                  key={item.code || idx}
                  className="flex items-center gap-3 p-3 rounded-xl bg-amber-100/70 border border-amber-300 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-lg bg-amber-200/80 border border-amber-400 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
                    {getItemIcon(item.code)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-serif font-bold text-sm text-amber-950 truncate">
                      {item.nama_item || item.name}
                    </span>
                    <span className="text-xs font-serif text-stone-600 line-clamp-2">
                      {item.deskripsi || item.description || 'Barang migunani'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-amber-800/30 flex justify-between items-center text-xs text-amber-800 font-mono">
          <span>Kapasitas: {items.length} Barang</span>
          <button
            onClick={closeInventory}
            className="px-5 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-amber-50 font-bold transition-all shadow"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
