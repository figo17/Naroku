"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function GuruDashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalQuizzes: 0,
  });
  const [recentClasses, setRecentClasses] = useState([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Get classes created by this teacher
        const { data: classesData, error: classesError } = await supabase
          .from("classes")
          .select("id, nama_kelas, class_code, deskripsi, created_at")
          .eq("teacher_id", user.id)
          .order("created_at", { ascending: false });

        if (classesError) {
          console.error("Error fetching classes:", classesError);
        }

        const classList = classesData || [];
        const classIds = classList.map((c) => c.id);

        // 2. Count total students across these classes
        let totalStudentsCount = 0;
        if (classIds.length > 0) {
          const { count, error: studentsError } = await supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .in("class_id", classIds);

          if (!studentsError && count !== null) {
            totalStudentsCount = count;
          }
        }

        // 3. Count total quizzes created by this teacher
        const { count: quizCount, error: quizError } = await supabase
          .from("quizzes")
          .select("id", { count: "exact", head: true })
          .eq("created_by", user.id);

        if (quizError) {
          console.error("Error counting quizzes:", quizError);
        }

        setStats({
          totalClasses: classList.length,
          totalStudents: totalStudentsCount,
          totalQuizzes: quizCount || 0,
        });

        setRecentClasses(classList.slice(0, 4));
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [supabase]);

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-black text-yellow-500 tracking-wide">
          Ringkasan Guru
        </h1>
        <p className="text-sm text-stone-300 mt-1">
          Pantau statistik kelas, murid terdaftar, dan soal evaluasi babak petualangan.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Card 1: Classes */}
        <div className="bg-amber-950/40 border border-amber-800/80 rounded-xl p-6 shadow-lg backdrop-blur relative overflow-hidden group hover:border-amber-600 transition">
          <div className="absolute top-0 right-0 p-4 text-4xl opacity-15 select-none">🏫</div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/80">Total Kelas</p>
          <div className="mt-2 flex items-baseline">
            <span className="text-4xl font-extrabold font-serif text-yellow-400">
              {loading ? "..." : stats.totalClasses}
            </span>
            <span className="ml-2 text-xs text-stone-400">kelas aktif</span>
          </div>
          <div className="mt-4">
            <Link
              href="/guru/kelas"
              className="text-xs font-medium text-amber-300 hover:text-yellow-400 inline-flex items-center space-x-1"
            >
              <span>Kelola Kelas</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Card 2: Students */}
        <div className="bg-emerald-950/30 border border-emerald-800/80 rounded-xl p-6 shadow-lg backdrop-blur relative overflow-hidden group hover:border-emerald-600 transition">
          <div className="absolute top-0 right-0 p-4 text-4xl opacity-15 select-none">👥</div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300/80">Total Murid</p>
          <div className="mt-2 flex items-baseline">
            <span className="text-4xl font-extrabold font-serif text-emerald-400">
              {loading ? "..." : stats.totalStudents}
            </span>
            <span className="ml-2 text-xs text-stone-400">tergabung</span>
          </div>
          <div className="mt-4">
            <Link
              href="/guru/kelas"
              className="text-xs font-medium text-emerald-300 hover:text-emerald-200 inline-flex items-center space-x-1"
            >
              <span>Lihat Detail Murid</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Card 3: Quizzes */}
        <div className="bg-amber-950/40 border border-amber-800/80 rounded-xl p-6 shadow-lg backdrop-blur relative overflow-hidden group hover:border-amber-600 transition">
          <div className="absolute top-0 right-0 p-4 text-4xl opacity-15 select-none">📝</div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/80">Bank Soal (Garapan)</p>
          <div className="mt-2 flex items-baseline">
            <span className="text-4xl font-extrabold font-serif text-yellow-400">
              {loading ? "..." : stats.totalQuizzes}
            </span>
            <span className="ml-2 text-xs text-stone-400">soal tersimpan</span>
          </div>
          <div className="mt-4">
            <Link
              href="/guru/quizzes"
              className="text-xs font-medium text-amber-300 hover:text-yellow-400 inline-flex items-center space-x-1"
            >
              <span>Buka Bank Soal</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Access / Recent Classes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif font-bold text-amber-200">Kelas Terbaru</h2>
          <Link
            href="/guru/kelas"
            className="text-xs text-amber-400 hover:text-yellow-300 font-medium transition"
          >
            Lihat Semua Kelas →
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-stone-400 bg-stone-900/60 rounded-xl border border-stone-800">
            Sedang mengambil data kelas...
          </div>
        ) : recentClasses.length === 0 ? (
          <div className="p-8 text-center bg-stone-900/60 rounded-xl border border-stone-800 space-y-3">
            <p className="text-stone-400">Belum ada kelas yang dibuat.</p>
            <Link
              href="/guru/kelas"
              className="inline-block px-4 py-2 bg-amber-700 hover:bg-amber-600 text-stone-100 rounded-lg text-sm font-medium transition shadow"
            >
              + Buat Kelas Pertama
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentClasses.map((cls) => (
              <div
                key={cls.id}
                className="p-5 bg-amber-950/20 border border-amber-900/60 rounded-xl hover:border-amber-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="font-serif font-bold text-yellow-400 text-base">{cls.nama_kelas}</h3>
                    <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-amber-900 text-yellow-300 border border-amber-700">
                      {cls.class_code}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-2 line-clamp-2">
                    {cls.deskripsi || "Tidak ada deskripsi"}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between">
                  <span className="text-[11px] text-stone-500">
                    Dibuat: {new Date(cls.created_at).toLocaleDateString("id-ID")}
                  </span>
                  <Link
                    href={`/guru/kelas/${cls.id}`}
                    className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
                  >
                    Buka Detail & Murid →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
