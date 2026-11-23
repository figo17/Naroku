"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { treatmentItems } from "@/app/(game)/level2/orientasi/page";

export default function RekapLevel2Page() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // 1. Fetch all students
        const { data: studentsData, error: stuErr } = await supabase
          .from("profiles")
          .select("id, nama_lengkap, nomor_induk, role, created_at")
          .eq("role", "murid")
          .order("nama_lengkap", { ascending: true });

        if (stuErr) console.error("Error loading students:", stuErr);

        // 2. Fetch Level 2 Orientasi results
        const { data: resData, error: resErr } = await supabase
          .from("level2_orientasi_results")
          .select("*")
          .order("updated_at", { ascending: false });

        if (resErr) console.error("Error loading level 2 results:", resErr);

        setStudents(studentsData || []);
        setResults(resData || []);
      } catch (err) {
        console.error("Rekap Level 2 error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  // Map results by user_id
  const resultsMap = {};
  results.forEach((r) => {
    resultsMap[r.user_id] = r;
  });

  // Filter students
  const filteredStudents = students.filter((stu) => {
    const q = searchQuery.toLowerCase();
    const name = (stu.nama_lengkap || "").toLowerCase();
    const nis = (stu.nomor_induk || "").toLowerCase();
    return name.includes(q) || nis.includes(q);
  });

  const totalStudents = students.length;
  const completedCount = results.filter((r) => r.is_completed).length;
  const inProgressCount = results.filter((r) => !r.is_completed).length;

  const getItemLabel = (id) => {
    const it = treatmentItems?.find((t) => t.id === id);
    return it ? it.name : id;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-yellow-400 tracking-wide flex items-center gap-2">
            <span>🌿</span> Rekap Hasil Level 2: Orientasi Perawatan
          </h1>
          <p className="text-stone-400 text-xs sm:text-sm mt-1">
            Rekap hasil interaktif free-transform murid dalam nambani lara Rara Kuning lan Rara Runting kanthi bahan herbal trep.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Goleki jeneng utawa NISN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 pl-9 bg-stone-900 border border-stone-700 rounded-lg text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-yellow-500"
          />
          <span className="absolute left-3 top-2.5 text-stone-400 text-sm">🔍</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 shadow">
          <p className="text-xs uppercase font-semibold tracking-wider text-stone-400">Total Murid</p>
          <p className="text-3xl font-extrabold font-serif text-stone-100 mt-1">{totalStudents}</p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 shadow">
          <p className="text-xs uppercase font-semibold tracking-wider text-emerald-400">Selesai 4 Perawatan</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold font-serif text-emerald-400">{completedCount}</span>
            <span className="text-xs text-stone-400">
              ({totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0}%)
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 shadow">
          <p className="text-xs uppercase font-semibold tracking-wider text-amber-400">Sedang Mengerjakan</p>
          <p className="text-3xl font-extrabold font-serif text-yellow-400 mt-1">{inProgressCount}</p>
        </div>
      </div>

      {/* Kunci Jawaban Info Banner */}
      <div className="p-4 rounded-xl bg-stone-900 border border-yellow-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-stone-300">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <p className="font-bold text-yellow-400 text-sm">Pedoman Kunci Perawatan Tokoh:</p>
            <p className="mt-0.5">
              • <strong className="text-yellow-200">Rara Kuning</strong> (Gondhok & Kulit sisik): <span className="underline">Kompres daun herba</span> & <span className="underline">Lulur rempah</span>
            </p>
            <p>
              • <strong className="text-emerald-300">Rara Runting</strong> (Lara kuning): <span className="underline">Adus ramuan</span> & <span className="underline">Ramuan jamu</span>
            </p>
          </div>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-950 border-b border-stone-800 text-xs uppercase font-semibold tracking-wider text-stone-400">
              <tr>
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Nama Murid</th>
                <th className="py-3 px-4">NISN</th>
                <th className="py-3 px-4">Rara Kuning (2 Bahan)</th>
                <th className="py-3 px-4">Rara Runting (2 Bahan)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    <div className="w-8 h-8 border-3 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Memuat data murid...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-500">
                    Tidak ada data murid yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stu, idx) => {
                  const res = resultsMap[stu.id];
                  const rkItems = res?.rara_kuning_treatments || [];
                  const rrItems = res?.rara_runting_treatments || [];
                  const isDone = res?.is_completed;

                  return (
                    <tr key={stu.id} className="hover:bg-stone-800/40 transition">
                      <td className="py-3 px-4 text-stone-500 text-xs">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-stone-100">
                        {stu.nama_lengkap || "Tanpa Nama"}
                      </td>
                      <td className="py-3 px-4 text-stone-400 font-mono text-xs">
                        {stu.nomor_induk || "-"}
                      </td>
                      <td className="py-3 px-4">
                        {rkItems.length === 0 ? (
                          <span className="text-stone-500 text-xs italic">Belum ada</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {rkItems.map((id) => (
                              <span
                                key={id}
                                className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-yellow-500/60 text-yellow-300 text-[11px] font-medium"
                              >
                                ✓ {getItemLabel(id)}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {rrItems.length === 0 ? (
                          <span className="text-stone-500 text-xs italic">Belum ada</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {rrItems.map((id) => (
                              <span
                                key={id}
                                className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-[11px] font-medium"
                              >
                                ✓ {getItemLabel(id)}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs font-bold">
                            ✓ Rampung
                          </span>
                        ) : res ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950 border border-amber-500 text-amber-300 text-xs font-bold">
                            ⏳ {rkItems.length + rrItems.length}/4
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-800 border border-stone-700 text-stone-400 text-xs">
                            ✗ Durung
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedStudent({ student: stu, result: res })}
                          className="px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-300 text-xs rounded transition"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-stone-900 border border-stone-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="font-serif font-bold text-yellow-400 text-lg">
                  {selectedStudent.student.nama_lengkap}
                </h3>
                <p className="text-xs text-stone-400 font-mono">
                  NISN: {selectedStudent.student.nomor_induk || "-"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {selectedStudent.result ? (
              <div className="space-y-4 text-sm">
                <div className="p-3 rounded-xl bg-amber-950/30 border border-yellow-500/40">
                  <h4 className="font-bold text-yellow-400 text-xs uppercase mb-2">
                    Putri Rara Kuning (Gondhok & Kulit Sisik):
                  </h4>
                  <ul className="space-y-1 text-xs">
                    {(selectedStudent.result.rara_kuning_treatments || []).map((id) => (
                      <li key={id} className="text-yellow-200 flex items-center gap-2">
                        <span>✓</span> {getItemLabel(id)}
                      </li>
                    ))}
                    {(selectedStudent.result.rara_kuning_treatments || []).length === 0 && (
                      <li className="text-stone-500 italic">Belum ada bahan yang dipasangkan.</li>
                    )}
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40">
                  <h4 className="font-bold text-emerald-400 text-xs uppercase mb-2">
                    Rara Runting / Dewi Kilisuci (Lara Kuning):
                  </h4>
                  <ul className="space-y-1 text-xs">
                    {(selectedStudent.result.rara_runting_treatments || []).map((id) => (
                      <li key={id} className="text-emerald-200 flex items-center gap-2">
                        <span>✓</span> {getItemLabel(id)}
                      </li>
                    ))}
                    {(selectedStudent.result.rara_runting_treatments || []).length === 0 && (
                      <li className="text-stone-500 italic">Belum ada bahan yang dipasangkan.</li>
                    )}
                  </ul>
                </div>

                <div className="text-xs text-stone-400 pt-2 border-t border-stone-800 flex justify-between">
                  <span>
                    Status:{" "}
                    <strong className={selectedStudent.result.is_completed ? "text-emerald-400" : "text-amber-400"}>
                      {selectedStudent.result.is_completed ? "Selesai (4/4)" : "Belum Selesai"}
                    </strong>
                  </span>
                  <span>
                    Update: {new Date(selectedStudent.result.updated_at).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-stone-400 text-sm py-4 text-center">
                Murid ini belum memulai pengerjaan Level 2: Orientasi Perawatan.
              </p>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
