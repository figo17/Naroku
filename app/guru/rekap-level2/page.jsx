"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { treatmentItems } from "@/app/(game)/level2/orientasi/page";
import { LEVEL2_MISSIONS } from "@/lib/level2Progress";

export default function RekapLevel2Page() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [orientasiResults, setOrientasiResults] = useState([]);
  const [nanjakAnswers, setNanjakAnswers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("semua"); // 'semua' | 'perawatan' | 'nanjak' | 'misi' | 'gladhen'
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [stuRes, oriRes, nanRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, nama_lengkap, nomor_induk, role, created_at")
            .eq("role", "murid")
            .order("nama_lengkap", { ascending: true }),
          supabase
            .from("level2_orientasi_results")
            .select("*")
            .order("updated_at", { ascending: false }),
          supabase
            .from("level2_nanjak_answers")
            .select("*")
            .order("updated_at", { ascending: false }),
        ]);

        if (stuRes.error) console.error("Error loading students:", stuRes.error);
        if (oriRes.error) console.error("Error loading orientasi:", oriRes.error);
        if (nanRes.error) console.error("Error loading nanjak/gladhen:", nanRes.error);

        setStudents(stuRes.data || []);
        setOrientasiResults(oriRes.data || []);
        setNanjakAnswers(nanRes.data || []);
      } catch (err) {
        console.error("Rekap Level 2 error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  const orientasiMap = {};
  orientasiResults.forEach((r) => {
    orientasiMap[r.user_id] = r;
  });

  const nanjakMap = {};
  nanjakAnswers.forEach((a) => {
    nanjakMap[a.user_id] = a;
  });

  const filteredStudents = students.filter((stu) => {
    const q = searchQuery.toLowerCase();
    const name = (stu.nama_lengkap || "").toLowerCase();
    const nis = (stu.nomor_induk || "").toLowerCase();
    return name.includes(q) || nis.includes(q);
  });

  const totalStudents = students.length;
  const completedOrientasiCount = orientasiResults.filter((r) => r.is_completed).length;
  const completedNanjakCount = nanjakAnswers.filter((a) => a.answer?.trim()).length;
  const completedMisiCount = orientasiResults.filter(
    (r) => Array.isArray(r.completed_missions) && r.completed_missions.length >= LEVEL2_MISSIONS.length
  ).length;
  const completedGladhenCount = nanjakAnswers.filter((a) => a.gladhen_answer?.trim()).length;

  const getItemLabel = (id) => {
    const it = treatmentItems?.find((t) => t.id === id);
    return it ? it.name : id;
  };

  const handleDownloadCSV = () => {
    if (!filteredStudents.length) return;
    const headers = [
      "No",
      "Nama Murid",
      "NISN",
      "Perawatan Rara Kuning",
      "Perawatan Rara Runting",
      "Tugas Nulis 1 (Nanjak)",
      "Misi Alas Selesai",
      "Daftar Misi Alas",
      "Gladhen Nulis Akhir (Alas)",
      "Status Level 2",
    ];

    const rows = filteredStudents.map((stu, idx) => {
      const oRes = orientasiMap[stu.id];
      const nAns = nanjakMap[stu.id];
      const rk = (oRes?.rara_kuning_treatments || []).map(getItemLabel).join("; ");
      const rr = (oRes?.rara_runting_treatments || []).map(getItemLabel).join("; ");
      const missions = Array.isArray(oRes?.completed_missions) ? oRes.completed_missions : [];
      const missionLabels = LEVEL2_MISSIONS.filter((m) => missions.includes(m.id))
        .map((m) => m.label)
        .join("; ");
      const isFull =
        Boolean(oRes?.is_completed) &&
        Boolean(nAns?.answer?.trim()) &&
        missions.length >= LEVEL2_MISSIONS.length &&
        Boolean(nAns?.gladhen_answer?.trim());

      const esc = (v) => `"${String(v || "").replace(/"/g, '""')}"`;
      return [
        idx + 1,
        esc(stu.nama_lengkap || "Tanpa Nama"),
        esc(stu.nomor_induk || "-"),
        esc(rk || "-"),
        esc(rr || "-"),
        esc(nAns?.answer || "-"),
        esc(`${missions.length}/${LEVEL2_MISSIONS.length}`),
        esc(missionLabels || "-"),
        esc(nAns?.gladhen_answer || "-"),
        esc(isFull ? "Lengkap" : oRes || nAns ? "Sebagian" : "Durung"),
      ];
    });

    const csv =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `Rekap_Level2_Haroku_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-yellow-400 tracking-wide flex items-center gap-2">
            <span>🌿</span> Rekap Lengkap Level 2 (Perawatan, Misi Alas &amp; Gladhen Nulis)
          </h1>
          <p className="text-stone-400 text-xs sm:text-sm mt-1">
            Integrasi kabeh wangsulan murid ing Level 2: Orientasi Perawatan, Tugas Nulis Nanjak, 8 Misi Alas Gunung Wilis, lan Gladhen Nulis Akhir.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative">
            <input
              type="text"
              placeholder="Goleki jeneng utawa NISN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-60 px-4 py-2 pl-9 bg-stone-900 border border-stone-700 rounded-lg text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-yellow-500"
            />
            <span className="absolute left-3 top-2.5 text-stone-400 text-sm">🔍</span>
          </div>

          <button
            type="button"
            onClick={handleDownloadCSV}
            disabled={filteredStudents.length === 0}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg border border-emerald-500 shadow transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <span>📥</span>
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 shadow">
          <p className="text-[11px] uppercase font-semibold tracking-wider text-stone-400">Total Murid</p>
          <p className="text-2xl sm:text-3xl font-extrabold font-serif text-stone-100 mt-1">{totalStudents}</p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 shadow">
          <p className="text-[11px] uppercase font-semibold tracking-wider text-emerald-400">1. Perawatan Herbal</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-serif text-emerald-400">
              {completedOrientasiCount}
            </span>
            <span className="text-xs text-stone-400">/ {totalStudents}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 shadow">
          <p className="text-[11px] uppercase font-semibold tracking-wider text-yellow-400">2. Nulis Nanjak</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-serif text-yellow-400">
              {completedNanjakCount}
            </span>
            <span className="text-xs text-stone-400">/ {totalStudents}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/80 shadow">
          <p className="text-[11px] uppercase font-semibold tracking-wider text-cyan-300">3. Misi Alas (8 Pos)</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-serif text-cyan-300">
              {completedMisiCount}
            </span>
            <span className="text-xs text-stone-400">tuntas</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-teal-950/40 border border-teal-800/80 shadow col-span-2 lg:col-span-1">
          <p className="text-[11px] uppercase font-semibold tracking-wider text-teal-300">4. Gladhen Akhir</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-serif text-teal-300">
              {completedGladhenCount}
            </span>
            <span className="text-xs text-stone-400">/ {totalStudents}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-800 pb-3">
        {[
          { id: "semua", label: "Kabeh Rekap" },
          { id: "perawatan", label: "🌿 1. Perawatan Herbal" },
          { id: "nanjak", label: "🪶 2. Tugas Nulis Nanjak" },
          { id: "misi", label: "🗺️ 3. Misi Alas (8 Pos)" },
          { id: "gladhen", label: "🌲 4. Gladhen Nulis Akhir" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === tab.id
                ? "bg-yellow-500 text-stone-950 shadow"
                : "bg-stone-900 text-stone-400 hover:text-stone-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Student List Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-950 border-b border-stone-800 text-[11px] uppercase font-semibold tracking-wider text-stone-400">
              <tr>
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Nama Murid</th>
                {(activeTab === "semua" || activeTab === "perawatan") && (
                  <th className="py-3 px-4">1. Perawatan Herbal</th>
                )}
                {(activeTab === "semua" || activeTab === "nanjak") && (
                  <th className="py-3 px-4">2. Tugas Nulis (Nanjak)</th>
                )}
                {(activeTab === "semua" || activeTab === "misi") && (
                  <th className="py-3 px-4">3. Misi Petualangan Alas</th>
                )}
                {(activeTab === "semua" || activeTab === "gladhen") && (
                  <th className="py-3 px-4">4. Gladhen Nulis Akhir</th>
                )}
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400">
                    <div className="w-8 h-8 border-3 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Memuat data jawaban Level 2...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-500">
                    Tidak ada data murid yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stu, idx) => {
                  const oRes = orientasiMap[stu.id];
                  const nAns = nanjakMap[stu.id];
                  const rkItems = oRes?.rara_kuning_treatments || [];
                  const rrItems = oRes?.rara_runting_treatments || [];
                  const missions = Array.isArray(oRes?.completed_missions) ? oRes.completed_missions : [];
                  const isOrientasiDone = Boolean(oRes?.is_completed);
                  const hasNanjak = Boolean(nAns?.answer?.trim());
                  const hasGladhen = Boolean(nAns?.gladhen_answer?.trim());
                  const isMisiDone = missions.length >= LEVEL2_MISSIONS.length;

                  const doneParts = [isOrientasiDone, hasNanjak, isMisiDone, hasGladhen].filter(Boolean).length;
                  const anyProgress = doneParts > 0 || missions.length > 0 || rkItems.length + rrItems.length > 0;

                  return (
                    <tr key={stu.id} className="hover:bg-stone-800/40 transition align-top">
                      <td className="py-3 px-4 text-stone-500 text-xs font-mono">{idx + 1}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-stone-100">{stu.nama_lengkap || "Tanpa Nama"}</div>
                        <div className="text-[11px] text-stone-400 font-mono">
                          NISN: {stu.nomor_induk || "-"}
                        </div>
                      </td>

                      {/* 1. Perawatan */}
                      {(activeTab === "semua" || activeTab === "perawatan") && (
                        <td className="py-3 px-4 min-w-[180px]">
                          {isOrientasiDone ? (
                            <div className="space-y-0.5 text-xs">
                              <p className="text-yellow-300">
                                <strong>Kuning:</strong> {rkItems.map(getItemLabel).join(", ")}
                              </p>
                              <p className="text-emerald-300">
                                <strong>Runting:</strong> {rrItems.map(getItemLabel).join(", ")}
                              </p>
                            </div>
                          ) : rkItems.length + rrItems.length > 0 ? (
                            <span className="text-amber-400 text-xs">
                              ⏳ Proses ({rkItems.length + rrItems.length}/4)
                            </span>
                          ) : (
                            <span className="text-stone-500 text-xs italic">Durung</span>
                          )}
                        </td>
                      )}

                      {/* 2. Nanjak */}
                      {(activeTab === "semua" || activeTab === "nanjak") && (
                        <td className="py-3 px-4 max-w-[230px]">
                          {hasNanjak ? (
                            <p className="text-xs text-stone-200 line-clamp-2 italic font-serif bg-stone-950/60 p-2 rounded border border-stone-800">
                              &ldquo;{nAns.answer}&rdquo;
                            </p>
                          ) : (
                            <span className="text-stone-500 text-xs italic">Durung ngisi</span>
                          )}
                        </td>
                      )}

                      {/* 3. Misi Petualangan Alas (8 Pos) */}
                      {(activeTab === "semua" || activeTab === "misi") && (
                        <td className="py-3 px-4 min-w-[190px]">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-cyan-300">
                              {missions.length}/{LEVEL2_MISSIONS.length} Pos
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {LEVEL2_MISSIONS.map((m) => {
                              const passed = missions.includes(m.id);
                              return (
                                <span
                                  key={m.id}
                                  title={`${m.label}: ${passed ? "Rampung" : "Durung"}`}
                                  className={`px-1.5 py-0.5 rounded text-[10px] border ${
                                    passed
                                      ? "bg-emerald-950/90 border-emerald-500/70 text-emerald-200"
                                      : "bg-stone-950/70 border-stone-800 text-stone-500"
                                  }`}
                                >
                                  {m.icon}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                      )}

                      {/* 4. Gladhen Akhir */}
                      {(activeTab === "semua" || activeTab === "gladhen") && (
                        <td className="py-3 px-4 max-w-[230px]">
                          {hasGladhen ? (
                            <p className="text-xs text-emerald-200 line-clamp-2 italic font-serif bg-emerald-950/30 p-2 rounded border border-emerald-800/60">
                              &ldquo;{nAns.gladhen_answer}&rdquo;
                            </p>
                          ) : (
                            <span className="text-stone-500 text-xs italic">Durung ngisi</span>
                          )}
                        </td>
                      )}

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {doneParts === 4 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs font-bold">
                            ✓ Lengkap (4/4)
                          </span>
                        ) : anyProgress ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950 border border-amber-500 text-amber-300 text-xs font-bold">
                            ⏳ {doneParts}/4 Bagian
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-800 border border-stone-700 text-stone-400 text-xs">
                            ✗ Durung
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedStudent({
                              student: stu,
                              orientasi: oRes,
                              nanjak: nAns,
                            })
                          }
                          className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/35 border border-yellow-500/50 text-yellow-300 text-xs font-bold rounded-lg transition cursor-pointer"
                        >
                          📖 Detail Lengkap
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

      {/* Full Student Level 2 Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-stone-900 border-2 border-yellow-500/80 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="font-serif font-bold text-yellow-400 text-lg">
                  Rekap Level 2: {selectedStudent.student.nama_lengkap}
                </h3>
                <p className="text-xs text-stone-400 font-mono">
                  NISN: {selectedStudent.student.nomor_induk || "-"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm max-h-[72vh] overflow-y-auto pr-1">
              {/* 1. Orientasi Perawatan Herbal */}
              <div className="p-4 rounded-xl bg-stone-950/80 border border-yellow-500/30 space-y-2.5">
                <h4 className="font-bold text-yellow-400 text-xs uppercase flex items-center gap-1.5">
                  <span>🌿</span> 1. Orientasi Perawatan Herbal
                </h4>
                {selectedStudent.orientasi &&
                ((selectedStudent.orientasi.rara_kuning_treatments || []).length > 0 ||
                  (selectedStudent.orientasi.rara_runting_treatments || []).length > 0) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-amber-950/40 border border-yellow-500/40">
                      <p className="font-bold text-yellow-300">Putri Rara Kuning:</p>
                      <p className="text-stone-200 mt-1">
                        {(selectedStudent.orientasi.rara_kuning_treatments || [])
                          .map((id) => `✓ ${getItemLabel(id)}`)
                          .join(", ") || "Durung dipilih"}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40">
                      <p className="font-bold text-emerald-300">Putri Rara Runting:</p>
                      <p className="text-stone-200 mt-1">
                        {(selectedStudent.orientasi.rara_runting_treatments || [])
                          .map((id) => `✓ ${getItemLabel(id)}`)
                          .join(", ") || "Durung dipilih"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-stone-500 text-xs italic">Durung ngerjakake perawatan herbal.</p>
                )}
              </div>

              {/* 2. Tugas Nulis Nanjak */}
              <div className="p-4 rounded-xl bg-stone-950/80 border border-amber-500/30 space-y-2">
                <h4 className="font-bold text-amber-400 text-xs uppercase flex items-center gap-1.5">
                  <span>🪶</span> 2. Wangsulan Tugas Nulis 1 (Nanjak)
                </h4>
                <p className="text-[11px] text-stone-400 italic">
                  &ldquo;Tulisen nganggo 2-3 ukara bab apa sing dialami déning Rara Kuning lan Rara Runting!&rdquo;
                </p>
                {selectedStudent.nanjak?.answer?.trim() ? (
                  <div className="p-3.5 rounded-xl bg-[#fcf6e5] text-amber-950 border border-amber-700/40 text-xs sm:text-sm font-serif leading-relaxed whitespace-pre-wrap">
                    {selectedStudent.nanjak.answer}
                  </div>
                ) : (
                  <p className="text-stone-500 text-xs italic">Murid durung nulis wangsulan Nanjak.</p>
                )}
              </div>

              {/* 3. Checklist 8 Misi Petualangan Alas */}
              <div className="p-4 rounded-xl bg-stone-950/80 border border-cyan-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-cyan-300 text-xs uppercase flex items-center gap-1.5">
                    <span>🗺️</span> 3. Progres Misi Ngumbara ing Alas Gunung Wilis
                  </h4>
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    {(selectedStudent.orientasi?.completed_missions || []).length}/{LEVEL2_MISSIONS.length} Pos
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {LEVEL2_MISSIONS.map((m) => {
                    const done = (selectedStudent.orientasi?.completed_missions || []).includes(m.id);
                    return (
                      <div
                        key={m.id}
                        className={`p-2 rounded-lg border flex items-center gap-1.5 ${
                          done
                            ? "bg-emerald-950/60 border-emerald-500/70 text-emerald-200 font-semibold"
                            : "bg-stone-900/60 border-stone-800 text-stone-500"
                        }`}
                      >
                        <span>{done ? "✓" : "○"}</span>
                        <span>{m.icon}</span>
                        <span className="truncate">{m.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Gladhen Nulis Akhir */}
              <div className="p-4 rounded-xl bg-stone-950/80 border border-emerald-500/30 space-y-2">
                <h4 className="font-bold text-emerald-400 text-xs uppercase flex items-center gap-1.5">
                  <span>🌲</span> 4. Gladhen Nulis Akhir Level 2 (Ngumbara ing Alas)
                </h4>
                <p className="text-[11px] text-stone-400 italic">
                  &ldquo;Saka lelampahanmu ngumbara ing alas, tulisen kanthi 2-3 ukara bab apa sing kokalami sajrone nelusuri alas iku!&rdquo;
                </p>
                {selectedStudent.nanjak?.gladhen_answer?.trim() ? (
                  <div className="p-3.5 rounded-xl bg-[#fcf6e5] text-amber-950 border border-emerald-700/40 text-xs sm:text-sm font-serif leading-relaxed whitespace-pre-wrap">
                    {selectedStudent.nanjak.gladhen_answer}
                  </div>
                ) : (
                  <p className="text-stone-500 text-xs italic">Murid durung ngisi Gladhen Nulis Akhir.</p>
                )}
                {selectedStudent.nanjak?.updated_at && (
                  <p className="text-[10px] text-stone-500 text-right">
                    Dianyari: {new Date(selectedStudent.nanjak.updated_at).toLocaleString("id-ID")}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-stone-950 text-xs font-black cursor-pointer"
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
