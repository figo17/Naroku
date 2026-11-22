'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

/**
 * Student Profile Page
 * Displays student info, class details, quest stage, and quiz history.
 */
export default function StudentProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [className, setClassName] = useState('Durung nggabung');
  const [gameProgress, setGameProgress] = useState(null);
  const [quizResults, setQuizResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();

        if (userErr || !user) {
          router.push('/login');
          return;
        }

        // 1. Profile
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setProfile(prof);

        // 2. Class
        if (prof?.class_id) {
          const { data: cls } = await supabase
            .from('classes')
            .select('nama_kelas, class_code')
            .eq('id', prof.class_id)
            .single();
          if (cls) setClassName(`${cls.nama_kelas} (${cls.class_code})`);
        }

        // 3. Game progress
        const { data: progress } = await supabase
          .from('game_progress')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        setGameProgress(progress);

        // 4. Quiz results
        const { data: results } = await supabase
          .from('quiz_results')
          .select(`
            id,
            jawaban_dipilih,
            is_correct,
            skor,
            answered_at,
            quizzes (
              pertanyaan,
              quest_stage
            )
          `)
          .eq('user_id', user.id)
          .order('answered_at', { ascending: false });

        setQuizResults(results || []);
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-stone-950 text-amber-200">
        Memuat profil murid...
      </div>
    );
  }

  const questNames = {
    1: 'Babak 1: Lelarane Putri',
    2: 'Babak 2: Ngulandara menyang Gunung Wilis',
    3: 'Babak 3: Pamulihan Grojogan',
  };

  const totalScore = quizResults.reduce((acc, curr) => acc + (curr.skor || 0), 0);

  return (
    <div className="w-full h-full overflow-y-auto p-4 sm:p-8 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 text-stone-100">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between border-b border-amber-800/40 pb-4">
          <Link
            href="/play"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-900/60 hover:bg-amber-800 text-amber-200 text-xs font-bold border border-amber-600/40 transition-all"
          >
            ← Bali menyang Game
          </Link>

          <h1 className="text-xl sm:text-2xl font-bold font-serif text-amber-200">
            Profil & Prestasi Murid
          </h1>

          <Link
            href="/"
            className="text-xs text-stone-400 hover:text-amber-200 transition-colors"
          >
            Menu Utama
          </Link>
        </div>

        {/* Profile Card & Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main ID Card */}
          <div className="bg-stone-900/90 border-2 border-amber-700 rounded-2xl p-5 flex flex-col items-center text-center gap-3 shadow-xl">
            <div className="w-20 h-20 rounded-full border-4 border-yellow-500 bg-gradient-to-tr from-amber-700 to-yellow-500 flex items-center justify-center text-4xl shadow-md">
              👸
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-100">{profile?.nama_lengkap || 'Murid'}</h2>
              <p className="text-xs text-amber-400/80 font-mono">NIS: {profile?.nomor_induk || '-'}</p>
            </div>
            <div className="w-full bg-amber-950/60 border border-amber-800/60 rounded-xl p-2.5 flex flex-col gap-1 text-xs">
              <span className="text-stone-400">Status Akun:</span>
              <span className="font-bold text-amber-200">Murid Aktif</span>
            </div>
          </div>

          {/* Quest Progress Card */}
          <div className="bg-stone-900/90 border-2 border-amber-700 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🗺️</span>
                <h3 className="font-serif font-bold text-base text-amber-200">
                  Lelampahan Petualangan
                </h3>
              </div>
              <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-800/40 flex flex-col gap-1">
                <span className="text-xs text-stone-400">Babak Saiki:</span>
                <span className="text-sm font-bold text-yellow-300">
                  {questNames[gameProgress?.quest_stage || 1]}
                </span>
              </div>
              <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-800/40 flex flex-col gap-1">
                <span className="text-xs text-stone-400">Status Tamat:</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit ${
                    gameProgress?.is_completed
                      ? 'bg-emerald-900 text-emerald-300 border border-emerald-600'
                      : 'bg-amber-900 text-amber-300 border border-amber-600'
                  }`}
                >
                  {gameProgress?.is_completed ? 'Sampun Tamat (Grojogan)' : 'Isih Lumaku'}
                </span>
              </div>
            </div>
          </div>

          {/* Score Summary Card */}
          <div className="bg-stone-900/90 border-2 border-amber-700 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <h3 className="font-serif font-bold text-base text-amber-200">
                  Total Nilai Garapan
                </h3>
              </div>
              <div className="text-center py-3 bg-amber-950/40 rounded-xl border border-amber-800/40">
                <span className="text-4xl font-mono font-black text-yellow-400">
                  {totalScore}
                </span>
                <p className="text-xs text-stone-400 mt-1">Poin Kaasilan</p>
              </div>
              <div className="text-xs text-stone-400 text-center">
                Wis ngrampungake {quizResults.length} pitakon evaluasi
              </div>
            </div>
          </div>
        </div>

        {/* Quiz History Table */}
        <div className="bg-stone-900/90 border-2 border-amber-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-amber-800/30 pb-3">
            <span className="text-xl">📜</span>
            <h3 className="font-serif font-bold text-lg text-amber-200">
              Cathetan Riwayat Nilai Garapan
            </h3>
          </div>

          {quizResults.length === 0 ? (
            <div className="text-center py-8 text-stone-400 font-serif italic text-sm">
              Durung ana garapan evaluasi sing dikerjakake ing jroning game.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-serif">
                <thead>
                  <tr className="border-b border-amber-800/40 text-amber-400 uppercase text-[10px]">
                    <th className="py-2 px-3">Pitakon</th>
                    <th className="py-2 px-3">Babak</th>
                    <th className="py-2 px-3">Jawaban</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Skor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/30">
                  {quizResults.map((res) => (
                    <tr key={res.id} className="hover:bg-amber-950/30">
                      <td className="py-3 px-3 text-stone-200 max-w-xs truncate">
                        {res.quizzes?.pertanyaan || 'Pitakon'}
                      </td>
                      <td className="py-3 px-3 text-amber-300 font-mono">
                        Babak {res.quizzes?.quest_stage || '-'}
                      </td>
                      <td className="py-3 px-3 uppercase font-mono font-bold text-stone-300">
                        {res.jawaban_dipilih}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            res.is_correct
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                              : 'bg-rose-950 text-rose-300 border border-rose-600'
                          }`}
                        >
                          {res.is_correct ? 'Bener' : 'Salah'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-yellow-400">
                        +{res.skor}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
