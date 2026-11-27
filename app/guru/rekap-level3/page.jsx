"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PIYEULAN_ITEMS } from "@/data/piyeulanLevel3";

export default function RekapLevel3Page() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [narasiMap, setNarasiMap] = useState({});
  const [piyeulanMap, setPiyeulanMap] = useState({});
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("piyeulan"); // 'piyeulan' | 'narasi'

  // Modal detail per murid (nampilake Narasi + Jawaban Piyeulan 1-10)
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [stuRes, narRes, piyRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, nama_lengkap, nomor_induk")
            .eq("role", "murid")
            .order("nama_lengkap", { ascending: true }),
          supabase.from("level3_nulis_answers").select("*"),
          supabase.from("level3_piyeulan_answers").select("*"),
        ]);

        if (stuRes.error) console.error(stuRes.error);
        if (narRes.error) console.error(narRes.error);
        if (piyRes.error) console.error(piyRes.error);

        const nMap = {};
        (narRes.data || []).forEach((a) => {
          nMap[a.user_id] = a;
        });

        const pMap = {};
        (piyRes.data || []).forEach((p) => {
          pMap[p.user_id] = p;
        });

        setStudents(stuRes.data || []);
        setNarasiMap(nMap);
        setPiyeulanMap(pMap);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.nama_lengkap || "").toLowerCase().includes(q) ||
      (s.nomor_induk || "").toLowerCase().includes(q)
    );
  });

  const narasiDoneCount = students.filter((s) => narasiMap[s.id]?.narasi?.trim()).length;
  const piyeulanDoneList = students.filter((s) => piyeulanMap[s.id]?.is_completed);
  const piyeulanDoneCount = piyeulanDoneList.length;
  const avgPiyeulanScore =
    piyeulanDoneCount > 0
      ? (
          piyeulanDoneList.reduce((acc, s) => acc + (piyeulanMap[s.id]?.score || 0), 0) /
          piyeulanDoneCount
        ).toFixed(1)
      : "0.0";

  const downloadCSV = () => {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const piyeulanHeaders = PIYEULAN_ITEMS.map((it) => `Piyeulan No.${it.no}`);
    const header = [
      "No",
      "Nama Murid",
      "NISN",
      "Skor Piyeulan (0-10)",
      "Nilai Piyeulan (0-100)",
      ...piyeulanHeaders,
      "Cacah Tembung Narasi",
      "Narasi Level 3",
      "Dianyari",
    ].join(",");

    const rows = filtered.map((s, i) => {
      const n = narasiMap[s.id];
      const p = piyeulanMap[s.id];
      const ansObj = p?.answers || {};
      const perNoCols = PIYEULAN_ITEMS.map((it) => {
        const val = ansObj[it.id];
        if (!val) return esc("-");
        const isOk = val === it.correct;
        return esc(`${val === "bener" ? "Bener" : "Salah"} (${isOk ? "Tepat" : "Salah"})`);
      });
      const latestTime = p?.updated_at || n?.updated_at || "-";
      return [
        i + 1,
        esc(s.nama_lengkap),
        esc(s.nomor_induk || "-"),
        p?.is_completed ? p.score : "-",
        p?.is_completed ? p.score * 10 : "-",
        ...perNoCols,
        n?.word_count ?? 0,
        esc(n?.narasi || "-"),
        esc(latestTime),
      ].join(",");
    });

    const csv = [header, ...rows].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `Rekap_Level3_Lengkap_Haroku_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-yellow-400">
            📜 Rekap Level 3 – Narasi Crita &amp; Piyeulan
          </h1>
          <p className="text-stone-400 text-xs sm:text-sm mt-1">
            Pantau jawaban per murid kanggo Evaluasi Piyeulan (Bener/Salah No. 1–10) sarta Narasi Crita Lengkap.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            placeholder="Goleki jeneng utawa NISN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-60 px-4 py-2 bg-stone-900 border border-stone-700 rounded-lg text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-yellow-500"
          />
          <Link
            href="/level3/apresiasi"
            className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-stone-950 text-xs font-black rounded-lg shadow flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            🏆 Galeri Apresiasi (Love &amp; Komentar)
          </Link>
          <button
            type="button"
            onClick={downloadCSV}
            disabled={!filtered.length}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg border border-emerald-500 cursor-pointer whitespace-nowrap"
          >
            📥 Download CSV Lengkap
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800">
          <p className="text-[11px] uppercase font-semibold tracking-wider text-stone-400">
            Total Murid
          </p>
          <p className="text-3xl font-extrabold font-serif text-stone-100 mt-1">
            {students.length}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80">
          <p className="text-[11px] uppercase font-semibold tracking-wider text-amber-300">
            Wis Ngerjakake Piyeulan
          </p>
          <p className="text-3xl font-extrabold font-serif text-yellow-400 mt-1">
            {piyeulanDoneCount}{" "}
            <span className="text-xs text-stone-400">/ {students.length}</span>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/80">
          <p className="text-[11px] uppercase font-semibold tracking-wider text-cyan-300">
            Rata-rata Skor Piyeulan
          </p>
          <p className="text-3xl font-extrabold font-serif text-cyan-300 mt-1">
            {avgPiyeulanScore} <span className="text-xs text-stone-400">/ 10</span>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80">
          <p className="text-[11px] uppercase font-semibold tracking-wider text-emerald-400">
            Wis Nulis Narasi
          </p>
          <p className="text-3xl font-extrabold font-serif text-emerald-400 mt-1">
            {narasiDoneCount}{" "}
            <span className="text-xs text-stone-400">/ {students.length}</span>
          </p>
        </div>
      </div>

      {/* Tab Switcher: Piyeulan (Bener/Salah) vs Narasi Crita */}
      <div className="flex flex-wrap items-center gap-2 bg-stone-900 border border-amber-900/60 p-1.5 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("piyeulan")}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === "piyeulan"
              ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-stone-950 font-black shadow"
              : "text-amber-200/80 hover:text-yellow-300"
          }`}
        >
          <span>✅</span>
          <span>Jawaban Piyeulan Per Murid (Bener / Salah)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-stone-950/75 text-yellow-300 text-[10px]">
            {piyeulanDoneCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("narasi")}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === "narasi"
              ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-stone-950 font-black shadow"
              : "text-amber-200/80 hover:text-yellow-300"
          }`}
        >
          <span>✍️</span>
          <span>Narasi Crita Lengkap</span>
          <span className="px-1.5 py-0.2 rounded-full bg-stone-950/75 text-yellow-300 text-[10px]">
            {narasiDoneCount}
          </span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: JAWABAN PIYEULAN PER MURID (NO. 1 - 10)
         ======================================================== */}
      {activeTab === "piyeulan" && (
        <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-950 border-b border-stone-800 text-[11px] uppercase font-semibold tracking-wider text-stone-400">
              <tr>
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Nama Murid</th>
                <th className="py-3 px-4 text-center">Skor / Nilai</th>
                <th className="py-3 px-4">Ringkesan Jawaban No. 1–10</th>
                <th className="py-3 px-4">Waktu Kirim</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    Memuat data jawaban murid...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-500">
                    Tidak ada data murid.
                  </td>
                </tr>
              ) : (
                filtered.map((s, i) => {
                  const p = piyeulanMap[s.id];
                  const ansObj = p?.answers || {};
                  const hasDone = Boolean(p?.is_completed);

                  return (
                    <tr key={s.id} className="hover:bg-stone-800/40 align-middle">
                      <td className="py-3 px-4 text-stone-500 text-xs font-mono">{i + 1}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-stone-100">
                          {s.nama_lengkap || "Tanpa Nama"}
                        </div>
                        <div className="text-[11px] text-stone-400 font-mono">
                          NISN: {s.nomor_induk || "-"}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {hasDone ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-600 text-xs font-bold text-emerald-300">
                            <span>{p.score}/10</span>
                            <span className="text-yellow-300 font-mono">({p.score * 10})</span>
                          </div>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-stone-950 border border-stone-700 text-stone-500 text-xs">
                            Durung ngerjakake
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {hasDone ? (
                          <div className="flex flex-wrap gap-1">
                            {PIYEULAN_ITEMS.map((it) => {
                              const choice = ansObj[it.id];
                              const ok = choice === it.correct;
                              return (
                                <span
                                  key={it.id}
                                  title={`No. ${it.no}: "${it.statement}" — Dijawab: ${
                                    choice === "bener" ? "Bener" : "Salah"
                                  } (${ok ? "Tepat" : "Kurang Tepat"})`}
                                  className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-mono font-black border ${
                                    ok
                                      ? "bg-emerald-950/90 border-emerald-500 text-emerald-200"
                                      : "bg-red-950/90 border-red-500 text-red-200"
                                  }`}
                                >
                                  {it.no}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-xs text-stone-500 italic">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-xs text-stone-400 whitespace-nowrap">
                        {p?.updated_at
                          ? new Date(p.updated_at).toLocaleString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(s)}
                          className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/35 border border-yellow-500/50 text-yellow-300 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          📋 Detail Jawaban
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================
          TAB 2: NARASI CRITA LENGKAP PER MURID
         ======================================================== */}
      {activeTab === "narasi" && (
        <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-950 border-b border-stone-800 text-[11px] uppercase font-semibold tracking-wider text-stone-400">
              <tr>
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Nama Murid</th>
                <th className="py-3 px-4">Tembung</th>
                <th className="py-3 px-4">Cuplikan Narasi</th>
                <th className="py-3 px-4 text-center">Skor Piyeulan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    Memuat data...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-500">
                    Tidak ada data murid.
                  </td>
                </tr>
              ) : (
                filtered.map((s, i) => {
                  const a = narasiMap[s.id];
                  const p = piyeulanMap[s.id];
                  return (
                    <tr key={s.id} className="hover:bg-stone-800/40 align-top">
                      <td className="py-3 px-4 text-stone-500 text-xs font-mono">{i + 1}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-stone-100">
                          {s.nama_lengkap || "Tanpa Nama"}
                        </div>
                        <div className="text-[11px] text-stone-400 font-mono">
                          NISN: {s.nomor_induk || "-"}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-bold text-yellow-300">
                        {a?.word_count ?? 0}
                      </td>
                      <td className="py-3 px-4 max-w-[320px]">
                        {a?.narasi?.trim() ? (
                          <p className="text-xs text-stone-200 line-clamp-2 italic font-serif">
                            &ldquo;{a.narasi}&rdquo;
                          </p>
                        ) : (
                          <span className="text-stone-500 text-xs italic">Durung nulis</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {p?.is_completed ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-600 text-emerald-300 text-xs font-bold">
                            {p.score}/10
                          </span>
                        ) : (
                          <span className="text-xs text-stone-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(s)}
                          className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/35 border border-yellow-500/50 text-yellow-300 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          📖 Buka Jawaban
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================
          MODAL DETAIL LENGKAP PER MURID (PIYEULAN 1-10 + NARASI)
         ======================================================== */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90vh] bg-stone-900 border-2 border-yellow-500/85 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 border-b border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-black text-yellow-400 text-lg">
                  {selectedStudent.nama_lengkap}
                </h3>
                <p className="text-xs text-stone-400 font-mono">
                  NISN: {selectedStudent.nomor_induk || "-"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Bagian 1: Detail Jawaban Piyeulan No. 1 - 10 */}
              {(() => {
                const p = piyeulanMap[selectedStudent.id];
                const ansObj = p?.answers || {};

                return (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-serif font-bold text-yellow-300 text-sm sm:text-base flex items-center gap-2">
                        <span>✅</span>
                        <span>Jawaban Evaluasi Piyeulan (Bener / Salah)</span>
                      </h4>
                      {p?.is_completed ? (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-200 font-bold">
                            Skor: {p.score} / 10 (Nilai {p.score * 10})
                          </span>
                          <span className="text-stone-400">
                            {new Date(p.updated_at).toLocaleString("id-ID")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-stone-400 italic">
                          Murid durung ngirim jawaban Piyeulan
                        </span>
                      )}
                    </div>

                    {p?.is_completed ? (
                      <div className="border border-stone-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs sm:text-sm">
                          <thead className="bg-stone-950 text-stone-400 text-[11px] uppercase">
                            <tr>
                              <th className="py-2.5 px-3">No</th>
                              <th className="py-2.5 px-3">Pernyataan</th>
                              <th className="py-2.5 px-3 text-center">Jawaban Murid</th>
                              <th className="py-2.5 px-3 text-center">Kunci</th>
                              <th className="py-2.5 px-3 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-800">
                            {PIYEULAN_ITEMS.map((it) => {
                              const studentChoice = ansObj[it.id];
                              const isCorrect = studentChoice === it.correct;
                              return (
                                <tr
                                  key={it.id}
                                  className={
                                    isCorrect ? "bg-emerald-950/20" : "bg-red-950/25"
                                  }
                                >
                                  <td className="py-2.5 px-3 font-mono text-stone-400">
                                    {it.no}.
                                  </td>
                                  <td className="py-2.5 px-3 font-serif text-stone-100">
                                    {it.statement}
                                  </td>
                                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                    {studentChoice ? (
                                      <span
                                        className={`px-2.5 py-0.5 rounded-full font-bold text-xs border ${
                                          studentChoice === "bener"
                                            ? "bg-emerald-950 text-emerald-300 border-emerald-600"
                                            : "bg-rose-950 text-rose-300 border-rose-600"
                                        }`}
                                      >
                                        {studentChoice === "bener" ? "Bener" : "Salah"}
                                      </span>
                                    ) : (
                                      <span className="text-stone-500">-</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-center whitespace-nowrap text-stone-300 font-semibold text-xs">
                                    {it.correct === "bener" ? "Bener" : "Salah"}
                                  </td>
                                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                    {isCorrect ? (
                                      <span className="px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-200 font-bold text-[11px]">
                                        ✓ Tepat
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded bg-red-900/80 text-red-200 font-bold text-[11px]">
                                        ✗ Salah
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 text-stone-400 text-xs text-center">
                        Durung ana data jawaban Piyeulan saka murid iki.
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Bagian 2: Narasi Crita Lengkap Level 3 */}
              {(() => {
                const n = narasiMap[selectedStudent.id];
                return (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif font-bold text-yellow-300 text-sm sm:text-base flex items-center gap-2">
                        <span>✍️</span>
                        <span>Narasi Crita Lengkap Level 3</span>
                      </h4>
                      {n?.narasi?.trim() && (
                        <span className="text-xs text-amber-300 font-bold">
                          {n.word_count || 0} tembung
                        </span>
                      )}
                    </div>

                    {n?.narasi?.trim() ? (
                      <div className="p-4 rounded-xl bg-[#fcf6e5] text-amber-950 text-sm font-serif leading-relaxed whitespace-pre-wrap border border-amber-700/40">
                        {n.narasi}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 text-stone-400 text-xs text-center">
                        Murid durung ngirim tulisan narasi Level 3.
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-stone-950 border-t border-stone-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-stone-950 font-black text-xs cursor-pointer"
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
