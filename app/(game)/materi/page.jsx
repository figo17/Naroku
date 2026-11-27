'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const MATERI_SLIDES = [
  {
    id: 1,
    title: 'Modul Materi 1 – 1. Asale Grojogan Rara Kuning',
    src: '/assets/materi/slide-1-asale-grojogan.jpg',
    width: 1024,
    height: 370,
    hasNavbar: true,
    hasTabs: true,
  },
  {
    id: 2,
    title: 'Modul Materi 1 – 2. Ujian lan Lelara Misterius',
    src: '/assets/materi/slide-2-ujian-lelara.jpg',
    width: 1024,
    height: 370,
    hasNavbar: true,
    hasTabs: true,
  },
  {
    id: 3,
    title: 'Modul Materi 1 – 3. Ngulandara menyang Alas Gunung Wilis',
    src: '/assets/materi/slide-3-ngulandara-wilis.jpg',
    width: 1024,
    height: 370,
    hasNavbar: true,
    hasTabs: true,
  },
  {
    id: 4,
    title: 'Paraga Legenda – Profil Tokoh Utama',
    src: '/assets/materi/slide-4-profil-tokoh.jpg',
    width: 1024,
    height: 394,
    hasNavbar: true,
    hasWiwitButton: true,
  },
  {
    id: 5,
    title: 'Kraton Daha Kadiri – Raja lan Tabib Keraton',
    src: '/assets/materi/slide-5-raja-tabib.jpg',
    width: 1024,
    height: 512,
    hasNavbar: false,
    hasBanjurButton: true,
  },
  {
    id: 6,
    title: 'Profil Pengembang – Melani Widyah Dwi Nurreira',
    src: '/assets/materi/slide-6-profil-pengembang.jpg',
    width: 1024,
    height: 768,
    hasNavbar: false,
    hasBaliButton: true,
  },
];

export default function MateriPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  useEffect(() => {
    router.prefetch('/beranda');
    router.prefetch('/peta');
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const slideParam = Number(params.get('slide'));
      if (slideParam >= 1 && slideParam <= MATERI_SLIDES.length) {
        setStep(slideParam - 1);
      }
    }
  }, [router]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      setStep((s) => s - 1);
    } else {
      router.push('/beranda');
    }
  }, [router, step]);

  const handleNext = useCallback(() => {
    if (step < MATERI_SLIDES.length - 1) {
      setStep((s) => s + 1);
    } else {
      router.push('/peta');
    }
  }, [router, step]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleBack();
      } else if (e.code === 'ArrowRight' || e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleBack, handleNext]);

  const current = MATERI_SLIDES[step];
  const isLast = step === MATERI_SLIDES.length - 1;

  return (
    <div className="relative w-screen h-screen bg-[#03150c] text-stone-100 flex flex-col items-center justify-between overflow-hidden select-none font-sans">
      {/* Ambient Blurred Backdrop */}
      <Image
        src={current.src}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center blur-xl scale-110 opacity-45 pointer-events-none"
      />

      {/* Area Gambar Utama (Presisi sesuai rasio asli saben gambar) */}
      <div className="relative z-10 flex-1 w-full flex items-center justify-center px-2 pt-2 pb-1 overflow-hidden">
        <div
          className="relative w-full h-full shadow-2xl overflow-hidden rounded-lg"
          style={{
            aspectRatio: `${current.width} / ${current.height}`,
            maxWidth: `calc((100vh - 64px) * ${current.width} / ${current.height})`,
            maxHeight: `calc(100vw * ${current.height} / ${current.width})`,
          }}
        >
          <Image
            src={current.src}
            alt={current.title}
            fill
            priority
            sizes="100vw"
            className="object-contain object-center"
          />

          {/* Hitbox Navigasi Atas pada Gambar Slide 1–4 */}
          {current.hasNavbar && (
            <>
              {/* Logo Rara Kuning -> Beranda */}
              <Link
                href="/beranda"
                title="Beranda"
                className="absolute left-[5.5%] top-[1.5%] w-[18.5%] h-[9.5%] rounded-md bg-transparent hover:bg-yellow-400/10 cursor-pointer z-30"
              />
              {/* Menu -> Beranda */}
              <Link
                href="/beranda"
                title="Menu Beranda"
                className="absolute left-[31.8%] top-[2.5%] w-[3.8%] h-[7.0%] rounded-md bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
              />
              {/* Materi -> Slide 1 */}
              <button
                type="button"
                onClick={() => setStep(0)}
                title="Materi"
                className="absolute left-[36.8%] top-[2.5%] w-[4.2%] h-[7.0%] rounded-md bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
              >
                <span className="sr-only">Materi</span>
              </button>
              {/* CP/TP */}
              <Link
                href="/cptp"
                title="CP/TP"
                className="absolute left-[42.0%] top-[2.5%] w-[4.2%] h-[7.0%] rounded-md bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
              />
              {/* Tokoh -> Slide 4 */}
              <button
                type="button"
                onClick={() => setStep(3)}
                title="Profil Tokoh Utama"
                className="absolute left-[47.2%] top-[2.5%] w-[4.2%] h-[7.0%] rounded-md bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
              >
                <span className="sr-only">Tokoh</span>
              </button>
              {/* Misi & Ngulandara -> Peta */}
              <Link
                href="/peta"
                title="Peta Petualangan"
                className="absolute left-[52.4%] top-[2.5%] w-[10.5%] h-[7.0%] rounded-md bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
              />
            </>
          )}

          {/* Hitbox 3 Tab Langsung pada Slide 1–3 */}
          {current.hasTabs && (
            <>
              <button
                type="button"
                onClick={() => setStep(0)}
                title="1. Asale Grojogan Rara Kuning"
                className="absolute left-[10.2%] top-[32.5%] w-[16.6%] h-[6.8%] rounded-md bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
              >
                <span className="sr-only">1. Asale Grojogan Rara Kuning</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                title="2. Ujian lan Lelara Misterius"
                className="absolute left-[27.3%] top-[32.5%] w-[14.5%] h-[6.8%] rounded-md bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
              >
                <span className="sr-only">2. Ujian lan Lelara Misterius</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                title="3. Ngulandara menyang Alas Gunung Wilis"
                className="absolute left-[42.3%] top-[32.5%] w-[18.0%] h-[6.8%] rounded-md bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
              >
                <span className="sr-only">3. Ngulandara menyang Alas Gunung Wilis</span>
              </button>
            </>
          )}

          {/* Hitbox Tombol "▶ Wiwit" pada Slide 4 */}
          {current.hasWiwitButton && (
            <button
              type="button"
              onClick={handleNext}
              title="Lanjut"
              className="absolute left-[79.59%] top-[18.78%] w-[10.74%] h-[7.11%] rounded-xl bg-transparent hover:bg-white/20 hover:ring-2 hover:ring-yellow-200 active:scale-95 transition-all cursor-pointer z-30"
            >
              <span className="sr-only">Wiwit</span>
            </button>
          )}

          {/* Hitbox Tombol "Banjur ▶▶" pada Slide 5 */}
          {current.hasBanjurButton && (
            <button
              type="button"
              onClick={handleNext}
              title="Lanjut menyang Profil Pengembang"
              className="absolute left-[83.59%] top-[86.33%] w-[12.89%] h-[7.03%] rounded-xl bg-transparent hover:bg-yellow-300/20 hover:ring-2 hover:ring-yellow-300 active:scale-95 transition-all cursor-pointer z-30"
            >
              <span className="sr-only">Banjur</span>
            </button>
          )}

          {/* Hitbox Tombol "⬅ Bali" pada Slide 6 (Profil Pengembang) */}
          {current.hasBaliButton && (
            <button
              type="button"
              onClick={() => router.push('/beranda')}
              title="Bali menyang Beranda"
              className="absolute left-[88.8%] top-[1.4%] w-[8.8%] h-[4.8%] rounded-full bg-transparent hover:bg-yellow-400/20 hover:ring-2 hover:ring-yellow-300 active:scale-95 transition-all cursor-pointer z-30"
            >
              <span className="sr-only">Bali</span>
            </button>
          )}
        </div>
      </div>

      {/* Bar Navigasi Bawah: Cukup Tombol Balik & Lanjut (Tanpa Modal) */}
      <div className="relative z-20 w-full px-4 sm:px-8 py-2.5 bg-[#021009]/90 border-t border-emerald-900/60 backdrop-blur-md flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="px-4 sm:px-5 py-2 rounded-full bg-stone-900 hover:bg-stone-800 border border-yellow-500/60 text-yellow-300 font-bold text-xs sm:text-sm shadow active:scale-95 transition cursor-pointer flex items-center gap-1.5"
        >
          <span>⬅</span>
          <span>{step === 0 ? 'Balik ke Beranda' : 'Balik'}</span>
        </button>

        {/* Indikator Urutan Halaman */}
        <div className="flex items-center gap-1.5">
          {MATERI_SLIDES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(idx)}
              title={`Halaman ${idx + 1}`}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                idx === step
                  ? 'w-7 bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.7)]'
                  : 'w-2.5 bg-emerald-800 hover:bg-emerald-600'
              }`}
            />
          ))}
          <span className="ml-2 text-[11px] sm:text-xs font-mono font-bold text-emerald-300">
            {step + 1} / {MATERI_SLIDES.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isLast && (
            <Link
              href="/beranda"
              className="px-4 py-2 rounded-full bg-emerald-900/90 hover:bg-emerald-800 border border-emerald-400/60 text-emerald-100 font-bold text-xs sm:text-sm shadow active:scale-95 transition"
            >
              🏠 Beranda
            </Link>
          )}
          <button
            type="button"
            onClick={handleNext}
            className="px-5 sm:px-6 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 border border-yellow-200 text-stone-950 font-black text-xs sm:text-sm shadow-lg active:scale-95 transition cursor-pointer flex items-center gap-1.5"
          >
            <span>{isLast ? 'Selesai ke Peta' : 'Lanjut'}</span>
            <span>➜</span>
          </button>
        </div>
      </div>

      {/* Preload Semua Slide Materi supaya Pindah Halaman Instan */}
      <div className="hidden" aria-hidden="true">
        {MATERI_SLIDES.map((sl) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={sl.id} src={sl.src} alt="" />
        ))}
      </div>
    </div>
  );
}
