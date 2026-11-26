"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LEVEL2_MISSIONS } from "@/lib/level2Progress";

export default function GuruDashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalQuizzes: 0,
    lv2OrientasiDone: 0,
    lv2NanjakDone: 0,
    lv2MisiDone: 0,
    lv2GladhenDone: 0,
  });
  const [recentClasses, setRecentClasses] = useState([]);
  const [recentLv2Submissions, setRecentLv2Submissions] = useState([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const [classesRes, quizRes, allMuridRes, oriRes, nanRes] = await Promise.all([
          supabase
            .from("classes")
            .select("id, nama_kelas, class_code, deskripsi, created_at")
            .eq("teacher_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("quizzes")
            .select("id", { count: "exact", head: true })
            .eq("created_by", user.id),
          supabase
            .from("profiles")
            .select("id, nama_lengkap, nomor_induk, class_id")
            .eq("role", "murid"),
          supabase
            .from("level2_orientasi_results")
            .select("*")
            .order("updated_at", { ascending: false }),
          supabase
            .from("level2_nanjak_answers")
            .select("*")
            .order("updated_at", { ascending: false }),
        ]);

        const classList = classesRes.data || [];
        const muridList = allMuridRes.data || [];
        const oriList = oriRes.data || [];
        const nanList = nanRes.data || [];

        const oriMap = {};
        oriList.forEach((o) => {
          oriMap[o.user_id] = o;
        });

        const muridMap = {};
        muridList.forEach((m) => {
          muridMap[m.id] = m;
        });

        // Build unified recent Level 2 activity list
        const userIds = Array.from(
          new Set([...nanList.map((n) => n.user_id), ...oriList.map((o) => o.user_id)])
        );
        const combined = userIds
          .map((uid) => {
            const stu = muridMap[uid];
            const ori = oriMap[uid];
            const nan = nanList.find((n) => n.user_id === uid);
            const tOri = ori?.updated_at ? new Date(ori.updated_at).getTime() : 0;
            const tNan = nan?.updated_at ? new Date(nan.updated_at).getTime() : 0;
            return {
              user_id: uid,
              student_name: stu?.nama_lengkap || nan?.student_name || ori?.student_name || "Murid",
              student_nisn: stu?.nomor_induk || nan?.student_nisn || ori?.student_nisn || "-",
              orientasiDone: Boolean(ori?.is_completed),
              missionsCount: Array.isArray(ori?.completed_missions) ? ori.completed_missions.length : 0,
              nanjakAnswer: nan?.answer || "",
              gladhenAnswer: nan?.gladhen_answer || "",
              updatedAt: Math.max(tOri, tNan),
            };
          })
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .slice(0, 6);

        setStats({
          totalClasses: classList.length,
          totalStudents: muridList.length,
          totalQuizzes: quizRes.count || 0,
          lv2OrientasiDone: oriList.filter((o) => o.is_completed).length,
          lv2NanjakDone: nanList.filter((n) => n.answer?.trim()).length,
          lv2MisiDone: oriList.filter(
            (o) => Array.isArray(o.completed_missions) && o.completed_missions.length >= LEVEL2_MISSIONS.length
          ).length,
          lv2GladhenDone: nanList.filter((n) => n.gladhen_answer?.trim()).length,
        });

        setRecentClasses(classList.slice(0, 4));
        setRecentLv2Submissions(combined);
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
          Pantau statistik kelas, murid terdaftar, serta seluruh jawaban evaluasi Level 1 &amp; Level 2.
        </p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-amber-950/40 border border-amber-800/80 rounded-xl p-6 shadow-lg backdrop-blur relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 text-4xl opacity-15 select-none">🏫</div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/80">Total Kelas</p>
          <div className="mt-2 flex items-baseline">
            <span className="text-4xl font-extrabold font-serif text-yellow-400">
              {loading ? "..." : stats.totalClasses}
            </span>
            <span className="ml-2 text-xs text-stone-400">kelas aktif</span>
          </div>
          <div className="mt-4">
            <Link href="/guru/kelas" className="text-xs font-medium text-amber-300 hover:text-yellow-400">
              Kelola Kelas →
            </Link>
          </div>
        </div>

        <div className="bg-emerald-950/30 border border-emerald-800/80 rounded-xl p-6 shadow-lg backdrop-blur relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 text-4xl opacity-15 select-none">👥</div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300/80">Total Murid</p>
          <div className="mt-2 flex items-baseline">
            <span className="text-4xl font-extrabold font-serif text-emerald-400">
              {loading ? "..." : stats.totalStudents}
            </span>
            <span className="ml-2 text-xs text-stone-400">murid terdaftar</span>
          </div>
          <div className="mt-4">
            <Link href="/guru/rekap-level2" className="text-xs font-medium text-emerald-300 hover:text-emerald-200">
              Lihat Rekap Murid →
            </Link>
          </div>
        </div>

        <div className="bg-amber-950/40 border border-amber-800/80 rounded-xl p-6 shadow-lg backdrop-blur relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 text-4xl opacity-15 select-none">📝</div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/80">Bank Soal (Garapan)</p>
          <div className="mt-2 flex items-baseline">
            <span className="text-4xl font-extrabold font-serif text-yellow-400">
              {loading ? "..." : stats.totalQuizzes}
            </span>
            <span className="ml-2 text-xs text-stone-400">soal tersimpan</span>
          </div>
          <div className="mt-4">
            <Link href="/guru/quizzes" className="text-xs font-medium text-amber-300 hover:text-yellow-400">
              Buka Bank Soal →
            </Link>
          </div>
        </div>
      </div>

      {/* Rekap Evaluasi Games (Level 1 & Level 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Banner Rekap Level 1 */}
        <div className="p-5 rounded-xl bg-gradient-to-r from-amber-950/80 to-stone-900 border border-yellow-500/50 shadow-xl flex flex-col justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-400/20 border border-yellow-400/60 flex items-center justify-center text-2xl shadow shrink-0">
              👥
            </div>
            <div>
              <h3 className="font-serif font-black text-yellow-400 text-base sm:text-lg">
                Rekap Level 1: Pengenalan Tokoh
              </h3>
              <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                Checklist ciri-ciri &amp; busana 4 tokoh serta isian uraian karakter murid.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Link
              href="/guru/rekap-level1"
              className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-black text-xs transition shadow flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>Buka Rekap Level 1</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Banner Rekap Level 2 dengan Statistik Live */}
        <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-950/80 to-stone-900 border border-emerald-500/50 shadow-xl flex flex-col justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-400/20 border border-emerald-400/60 flex items-center justify-center text-2xl shadow shrink-0">
              🌿
            </div>
            <div className="flex-1">
              <h3 className="font-serif font-black text-emerald-400 text-base sm:text-lg">
                Rekap Level 2 Lengkap (Perawatan, Misi Alas &amp; Nulis)
              </h3>
              <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                Perawatan Herbal, Tugas Nulis Nanjak, 8 Pos Misi Alas, lan Gladhen Nulis Akhir.
              </p>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="px-2.5 py-1 rounded bg-stone-950/70 border border-emerald-800/60 text-emerald-300">
                  Herbal: <strong>{loading ? "-" : stats.lv2OrientasiDone}</strong>
                </div>
                <div className="px-2.5 py-1 rounded bg-stone-950/70 border border-amber-800/60 text-yellow-300">
                  Nanjak: <strong>{loading ? "-" : stats.lv2NanjakDone}</strong>
                </div>
                <div className="px-2.5 py-1 rounded bg-stone-950/70 border border-cyan-800/60 text-cyan-300">
                  8 Pos Alas: <strong>{loading ? "-" : stats.lv2MisiDone}</strong>
                </div>
                <div className="px-2.5 py-1 rounded bg-stone-950/70 border border-teal-800/60 text-teal-300">
                  Gladhen: <strong>{loading ? "-" : stats.lv2GladhenDone}</strong>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Link
              href="/guru/rekap-level2"
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs transition shadow flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>Buka Semua Jawaban Level 2</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Live Feed: Jawaban & Progres Level 2 Terbaru di Dashboard Utama */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif font-bold text-emerald-300 flex items-center gap-2">
            <span>🌲</span> Jawaban &amp; Progres Level 2 Terbaru
          </h2>
          <Link
            href="/guru/rekap-level2"
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition"
          >
            Lihat Tabel Lengkap &amp; Export CSV →
          </Link>
        </div>

        {loading ? (
          <div className="p-6 text-center text-stone-400 bg-stone-900/60 rounded-xl border border-stone-800 text-sm">
            Memuat jawaban Level 2 terbaru...
          </div>
        ) : recentLv2Submissions.length === 0 ? (
          <div className="p-6 text-center text-stone-400 bg-stone-900/60 rounded-xl border border-stone-800 text-sm">
            Belum ada jawaban Level 2 yang masuk dari murid.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentLv2Submissions.map((item) => (
              <div
                key={item.user_id}
                className="p-4 rounded-xl bg-stone-950/75 border border-stone-800 hover:border-emerald-700/70 transition space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-stone-100 text-sm">{item.student_name}</p>
                    <p className="text-[11px] text-stone-400 font-mono">NISN: {item.student_nisn}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold">
                    <span
                      className={`px-2 py-0.5 rounded-full border ${
                        item.orientasiDone
                          ? "bg-emerald-950 text-emerald-300 border-emerald-600"
                          : "bg-stone-900 text-stone-400 border-stone-700"
                      }`}
                    >
                      🌿 Herbal {item.orientasiDone ? "✓" : "-"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700">
                      🗺️ {item.missionsCount}/{LEVEL2_MISSIONS.length} Pos
                    </span>
                  </div>
                </div>

                {item.nanjakAnswer && (
                  <p className="text-xs text-stone-300 italic font-serif line-clamp-2 bg-stone-900/80 px-2.5 py-1.5 rounded border border-stone-800">
                    <span className="not-italic font-bold text-yellow-400">Nanjak: </span>
                    &ldquo;{item.nanjakAnswer}&rdquo;
                  </p>
                )}

                {item.gladhenAnswer && (
                  <p className="text-xs text-emerald-200 italic font-serif line-clamp-2 bg-emerald-950/30 px-2.5 py-1.5 rounded border border-emerald-800/60">
                    <span className="not-italic font-bold text-emerald-400">Gladhen Akhir: </span>
                    &ldquo;{item.gladhenAnswer}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Access / Recent Classes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif font-bold text-amber-200">Kelas Terbaru</h2>
          <Link href="/guru/kelas" className="text-xs text-amber-400 hover:text-yellow-300 font-medium transition">
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
                    Buka Detail &amp; Murid →
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
