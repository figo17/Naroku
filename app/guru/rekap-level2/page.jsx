"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { treatmentItems } from "@/app/(game)/level2/orientasi/page";

export default function RekapLevel2Page() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [orientasiResults, setOrientasiResults] = useState([]);
  const [nanjakAnswers, setNanjakAnswers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("semua"); // 'semua' | 'perawatan' | 'nulis'
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

        // 2. Fetch Level 2 Orientasi results (perawatan herbal)
        const { data: resData, error: resErr } = await supabase
          .from("level2_orientasi_results")
          .select("*")
          .order("updated_at", { ascending: false });

        if (resErr) console.error("Error loading level 2 orientasi results:", resErr);

        // 3. Fetch Level 2 Nanjak answers (tugas nulis)
        const { data: nanjakData, error: nanjakErr } = await supabase
          .from("level2_nanjak_answers")
          .select("*")
          .order("updated_at", { ascending: false });

        if (nanjakErr) console.error("Error loading level 2 nanjak answers:", nanjakErr);

        setStudents(studentsData || []);
        setOrientasiResults(resData || []);
        setNanjakAnswers(nanjakData || []);
      } catch (err) {
        console.error("Rekap Level 2 error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  // Map results by user_id
  const orientasiMap = {};
  orientasiResults.forEach((r) => {
    orientasiMap[r.user_id] = r;
  });

  const nanjakMap = {};
  nanjakAnswers.forEach((a) => {
    nanjakMap[a.user_id] = a;
  });

  // Filter students
  const filteredStudents = students.filter((stu) => {
    const q = searchQuery.toLowerCase();
    const name = (stu.nama_lengkap || "").toLowerCase();
    const nis = (stu.nomor_induk || "").toLowerCase();
    return name.includes(q) || nis.includes(q);
  });

  const totalStudents = students.length;
  const completedOrientasiCount = orientasiResults.filter((r) => r.is_completed).length;
  const completedNanjakCount = nanjakAnswers.filter((a) => a.answer && a.answer.trim().length > 0).length;

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
            <span>🌿</span> Rekap Hasil Level 2 (Orientasi & Tugas Nulis Nanjak)
          </h1>
          <p className="text-stone-400 text-xs sm:text-sm mt-1">
            Rekap pengerjaan murid: Pasangan perawatan herbal (Orientasi) & tulisan 2-3 ukara bab lara para putri (Nanjak).
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
          <p className="text-xs uppercase font-semibold tracking-wider text-emerald-400">
            Perawatan Herbal (Orientasi)
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold font-serif text-emerald-400">
              {completedOrientasiCount}
            </span>
            <span className="text-xs text-stone-400">
              ({totalStudents > 0 ? Math.round((completedOrientasiCount / totalStudents) * 100) : 0}% rampung)
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 shadow">
          <p className="text-xs uppercase font-semibold tracking-wider text-yellow-400">
            Tugas Nulis (Nanjak)
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold font-serif text-yellow-400">
              {completedNanjakCount}
            </span>
            <span className="text-xs text-stone-400">
              ({totalStudents > 0 ? Math.round((completedNanjakCount / totalStudents) * 100) : 0}% terisi)
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("semua")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === "semua"
              ? "bg-yellow-500 text-stone-950 shadow"
              : "bg-stone-900 text-stone-400 hover:text-stone-200"
          }`}
        >
          Kabeh Rekap (Ringkesan)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("perawatan")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === "perawatan"
              ? "bg-emerald-600 text-white shadow"
              : "bg-stone-900 text-stone-400 hover:text-stone-200"
          }`}
        >
          🌿 Perawatan Herbal (Orientasi)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("nulis")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === "nulis"
              ? "bg-amber-600 text-white shadow"
              : "bg-stone-900 text-stone-400 hover:text-stone-200"
          }`}
        >
          🪶 Tugas Nulis (Nanjak)
        </button>
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
                {(activeTab === "semua" || activeTab === "perawatan") && (
                  <th className="py-3 px-4">Perawatan Herbal</th>
                )}
                {(activeTab === "semua" || activeTab === "nulis") && (
                  <th className="py-3 px-4">Tugas Nulis (Lv 2 - Nanjak)</th>
                )}
                <th className="py-3 px-4 text-center">Status Akhir</th>
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
                  const oRes = orientasiMap[stu.id];
                  const nAns = nanjakMap[stu.id];
                  const rkItems = oRes?.rara_kuning_treatments || [];
                  const rrItems = oRes?.rara_runting_treatments || [];
                  const isOrientasiDone = oRes?.is_completed;
                  const hasNanjakAnswer = Boolean(nAns?.answer?.trim());

                  return (
                    <tr key={stu.id} className="hover:bg-stone-800/40 transition">
                      <td className="py-3 px-4 text-stone-500 text-xs">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-stone-100">
                        {stu.nama_lengkap || "Tanpa Nama"}
                      </td>
                      <td className="py-3 px-4 text-stone-400 font-mono text-xs">
                        {stu.nomor_induk || "-"}
                      </td>

                      {/* Perawatan Column */}
                      {(activeTab === "semua" || activeTab === "perawatan") && (
                        <td className="py-3 px-4">
                          {isOrientasiDone ? (
                            <div className="space-y-0.5 text-xs">
                              <p className="text-yellow-300">
                                <strong>Rara Kuning:</strong> {rkItems.map(getItemLabel).join(", ")}
                              </p>
                              <p className="text-emerald-300">
                                <strong>Rara Runting:</strong> {rrItems.map(getItemLabel).join(", ")}
                              </p>
                            </div>
                          ) : oRes ? (
                            <span className="text-amber-400 text-xs">
                              ⏳ Sedang proses ({rkItems.length + rrItems.length}/4)
                            </span>
                          ) : (
                            <span className="text-stone-500 text-xs italic">Belum mengerjakan</span>
                          )}
                        </td>
                      )}

                      {/* Tugas Nulis Column */}
                      {(activeTab === "semua" || activeTab === "nulis") && (
                        <td className="py-3 px-4 max-w-xs space-y-1.5">
                          {hasNanjakAnswer ? (
                            <p className="text-xs text-stone-200 line-clamp-2 italic font-serif bg-stone-950/60 p-2 rounded border border-stone-800">
                              <span className="text-yellow-400 not-italic font-bold">Nanjak: </span>
                              &ldquo;{nAns.answer}&rdquo;
                            </p>
                          ) : (
                            <span className="text-stone-500 text-xs italic block">Nanjak: durung diisi</span>
                          )}
                          {nAns?.gladhen_answer?.trim() && (
                            <p className="text-xs text-emerald-200 line-clamp-2 italic font-serif bg-emerald-950/30 p-2 rounded border border-emerald-800/60">
                              <span className="text-emerald-400 not-italic font-bold">Gladhen Alas: </span>
                              &ldquo;{nAns.gladhen_answer}&rdquo;
                            </p>
                          )}
                        </td>
                      )}

                      {/* Status Column */}
                      <td className="py-3 px-4 text-center">
                        {isOrientasiDone && hasNanjakAnswer ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs font-bold">
                            ✓ Lengkap
                          </span>
                        ) : isOrientasiDone || hasNanjakAnswer ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950 border border-amber-500 text-amber-300 text-xs font-bold">
                            ⏳ Sebagian
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-800 border border-stone-700 text-stone-400 text-xs">
                            ✗ Durung
                          </span>
                        )}
                      </td>

                      {/* Action Column */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedStudent({
                              student: stu,
                              orientasi: oRes,
                              nanjak: nAns,
                            })
                          }
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
          <div className="w-full max-w-xl bg-stone-900 border border-stone-700 rounded-2xl p-6 shadow-2xl space-y-4">
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

            <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto pr-1">
              {/* Bagian 1: Perawatan Herbal */}
              <div className="p-4 rounded-xl bg-stone-950/80 border border-yellow-500/30 space-y-3">
                <h4 className="font-bold text-yellow-400 text-xs uppercase flex items-center gap-1.5">
                  <span>🌿</span> Bagian 1: Hasil Orientasi Perawatan Herbal
                </h4>

                {selectedStudent.orientasi ? (
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-amber-950/40 border border-yellow-500/40">
                      <p className="font-bold text-yellow-300">Rara Kuning (Gondhok & Kulit Sisik):</p>
                      <p className="text-stone-300 mt-1">
                        {(selectedStudent.orientasi.rara_kuning_treatments || [])
                          .map((id) => `✓ ${getItemLabel(id)}`)
                          .join(", ") || "Belum ada bahan"}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40">
                      <p className="font-bold text-emerald-300">Rara Runting (Lara Kuning):</p>
                      <p className="text-stone-300 mt-1">
                        {(selectedStudent.orientasi.rara_runting_treatments || [])
                          .map((id) => `✓ ${getItemLabel(id)}`)
                          .join(", ") || "Belum ada bahan"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-stone-500 text-xs italic">Belum mengerjakan perawatan herbal.</p>
                )}
              </div>

              {/* Bagian 2: Tugas Nulis (Nanjak) */}
              <div className="p-4 rounded-xl bg-stone-950/80 border border-yellow-500/30 space-y-2">
                <h4 className="font-bold text-yellow-400 text-xs uppercase flex items-center gap-1.5">
                  <span>🪶</span> Bagian 2: Wangsulan Tugas Nulis (Lv 2 - Nanjak)
                </h4>
                <p className="text-[11px] text-stone-400 italic">
                  &ldquo;Saka crita sing kokwaca lan kokdeleng , tulisen nganggo 2-3 ukara bab apa sing dialami déning Rara Kuning lan Rara Runting!&rdquo;
                </p>

                {selectedStudent.nanjak?.answer ? (
                  <div className="p-3.5 rounded-xl bg-amber-950/20 border border-yellow-500/50 text-stone-100 text-xs sm:text-sm font-serif leading-relaxed">
                    &ldquo;{selectedStudent.nanjak.answer}&rdquo;
                  </div>
                ) : (
                  <p className="text-stone-500 text-xs italic">Murid belum menulis wangsulan.</p>
                )}
                {selectedStudent.nanjak?.updated_at && (
                  <p className="text-[10px] text-stone-500 text-right">
                    Disimpen: {new Date(selectedStudent.nanjak.updated_at).toLocaleString("id-ID")}
                  </p>
                )}
              </div>

              {/* Bagian 3: Gladhen Nulis Akhir Level 2 (Ngumbara ing Alas) */}
              <div className="p-4 rounded-xl bg-stone-950/80 border border-emerald-500/30 space-y-2">
                <h4 className="font-bold text-emerald-400 text-xs uppercase flex items-center gap-1.5">
                  <span>🌲</span> Bagian 3: Gladhen Nulis Akhir (Ngumbara ing Alas)
                </h4>
                <p className="text-[11px] text-stone-400 italic">
                  &ldquo;Saka lelampahanmu ngumbara ing alas, tulisen kanthi 2-3 ukara bab apa sing kokalami sajrone nelusuri alas iku!&rdquo;
                </p>
                {selectedStudent.nanjak?.gladhen_answer?.trim() ? (
                  <div className="p-3.5 rounded-xl bg-emerald-950/25 border border-emerald-500/50 text-stone-100 text-xs sm:text-sm font-serif leading-relaxed">
                    &ldquo;{selectedStudent.nanjak.gladhen_answer}&rdquo;
                  </div>
                ) : (
                  <p className="text-stone-500 text-xs italic">Murid durung ngisi Gladhen Nulis Akhir.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-stone-800">
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
