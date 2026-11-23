"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { charactersLevel1 } from "@/data/charactersLevel1";

export default function RekapLevel1Page() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentModal, setSelectedStudentModal] = useState(null);
  const [activeModalCharId, setActiveModalCharId] = useState("rara_kuning");

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

        // 2. Fetch all Level 1 submissions
        const { data: subsData, error: subErr } = await supabase
          .from("level1_character_results")
          .select("*")
          .order("submitted_at", { ascending: false });

        if (subErr) console.error("Error loading submissions:", subErr);

        setStudents(studentsData || []);
        setSubmissions(subsData || []);
      } catch (err) {
        console.error("Rekap error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  // Map submissions by user_id and character_id
  const submissionMap = {};
  submissions.forEach((sub) => {
    if (!submissionMap[sub.user_id]) {
      submissionMap[sub.user_id] = {};
    }
    submissionMap[sub.user_id][sub.character_id] = sub;
  });

  // Filter students by search
  const filteredStudents = students.filter((stu) => {
    const q = searchQuery.toLowerCase();
    const name = (stu.nama_lengkap || "").toLowerCase();
    const nis = (stu.nomor_induk || "").toLowerCase();
    return name.includes(q) || nis.includes(q);
  });

  // Calculate statistics
  const totalStudents = students.length;
  const participatedStudents = Object.keys(submissionMap).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-black text-yellow-500 tracking-wide flex items-center gap-3">
          <span>👥</span> Rekap Level 1: Orientasi Tokoh
        </h1>
        <p className="text-sm text-stone-300 mt-1">
          Pantau hasil checklist dan ketepatan pemahaman ciri-ciri paraga legenda oleh para murid.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-amber-950/40 border border-amber-800/80 rounded-xl p-5 shadow-lg backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/80">
            Total Murid Terdaftar
          </p>
          <div className="mt-2 flex items-baseline">
            <span className="text-3xl font-black text-yellow-400 font-serif">
              {loading ? "..." : totalStudents}
            </span>
            <span className="ml-2 text-xs text-stone-400">murid</span>
          </div>
        </div>

        <div className="bg-amber-950/40 border border-amber-800/80 rounded-xl p-5 shadow-lg backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/80">
            Sudah Mengerjakan Level 1
          </p>
          <div className="mt-2 flex items-baseline">
            <span className="text-3xl font-black text-emerald-400 font-serif">
              {loading ? "..." : participatedStudents}
            </span>
            <span className="ml-2 text-xs text-stone-400">
              ({totalStudents > 0 ? Math.round((participatedStudents / totalStudents) * 100) : 0}%)
            </span>
          </div>
        </div>

        <div className="bg-amber-950/40 border border-amber-800/80 rounded-xl p-5 shadow-lg backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/80">
            Total Jawaban Tersimpan
          </p>
          <div className="mt-2 flex items-baseline">
            <span className="text-3xl font-black text-amber-300 font-serif">
              {loading ? "..." : submissions.length}
            </span>
            <span className="ml-2 text-xs text-stone-400">evaluasi tokoh</span>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-900/80 border border-amber-900/50 p-4 rounded-xl shadow">
        <div className="relative w-full sm:w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Goleki nama murid utawa NIS..."
            className="w-full pl-9 pr-4 py-2 bg-stone-950 border border-amber-900/80 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-yellow-500"
          />
        </div>
        <div className="text-xs text-stone-400">
          Menampilkan <strong className="text-yellow-400">{filteredStudents.length}</strong> murid
        </div>
      </div>

      {/* Table Rekap Murid */}
      <div className="bg-stone-900/70 border border-amber-900/60 rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-amber-950/80 border-b border-amber-800/80 text-yellow-400 uppercase tracking-wider text-[11px] font-semibold">
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Nama Murid</th>
                <th className="py-3 px-3 text-center">Rara Kuning</th>
                <th className="py-3 px-3 text-center">Rara Runting</th>
                <th className="py-3 px-3 text-center">Resi Darmo</th>
                <th className="py-3 px-3 text-center">Lembu Amiseno</th>
                <th className="py-3 px-4 text-center">Total Skor</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-950/40 text-stone-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Memuat data rekap pengerjaan murid...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    Ora ana data murid sing ditemokake.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stu, idx) => {
                  const stuSubs = submissionMap[stu.id] || {};
                  const rk = stuSubs["rara_kuning"];
                  const rr = stuSubs["rara_runting"];
                  const rd = stuSubs["resi_darmo"];
                  const la = stuSubs["lembu_amiseno"];

                  // Total score
                  const totalScore = (rk?.score || 0) + (rr?.score || 0) + (rd?.score || 0) + (la?.score || 0);
                  const maxScore = 11; // 3 + 3 + 3 + 2

                  return (
                    <tr key={stu.id} className="hover:bg-amber-950/20 transition-colors">
                      <td className="py-3 px-4 text-stone-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-100">{stu.nama_lengkap}</div>
                        <div className="text-[11px] text-stone-400">
                          {stu.nomor_induk ? `NIS: ${stu.nomor_induk}` : "Murid"}
                        </div>
                      </td>

                      {/* Rara Kuning */}
                      <td className="py-3 px-3 text-center">
                        {rk ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                              rk.score === 3
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-600"
                                : "bg-yellow-950 text-yellow-300 border border-yellow-600"
                            }`}
                          >
                            ✓ {rk.score}/3
                          </span>
                        ) : (
                          <span className="text-stone-500 text-xs">-</span>
                        )}
                      </td>

                      {/* Rara Runting */}
                      <td className="py-3 px-3 text-center">
                        {rr ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                              rr.score === 3
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-600"
                                : "bg-yellow-950 text-yellow-300 border border-yellow-600"
                            }`}
                          >
                            ✓ {rr.score}/3
                          </span>
                        ) : (
                          <span className="text-stone-500 text-xs">-</span>
                        )}
                      </td>

                      {/* Resi Darmo */}
                      <td className="py-3 px-3 text-center">
                        {rd ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                              rd.score >= 3
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-600"
                                : "bg-yellow-950 text-yellow-300 border border-yellow-600"
                            }`}
                          >
                            ✓ {rd.score}/3
                          </span>
                        ) : (
                          <span className="text-stone-500 text-xs">-</span>
                        )}
                      </td>

                      {/* Lembu Amiseno */}
                      <td className="py-3 px-3 text-center">
                        {la ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                              la.score >= 2
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-600"
                                : "bg-yellow-950 text-yellow-300 border border-yellow-600"
                            }`}
                          >
                            ✓ {la.score}/2
                          </span>
                        ) : (
                          <span className="text-stone-500 text-xs">-</span>
                        )}
                      </td>

                      {/* Total Skor */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-extrabold text-yellow-400 font-mono text-sm">
                          {totalScore}
                        </span>
                        <span className="text-stone-400 text-xs">/{maxScore}</span>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentModal(stu);
                            setActiveModalCharId("rara_kuning");
                          }}
                          className="px-3 py-1 rounded bg-amber-900/80 hover:bg-amber-800 border border-amber-600 text-yellow-200 text-xs font-semibold transition active:scale-95 shadow"
                        >
                          👁️ Deleng Detail
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

      {/* ========================================================
          MODAL DETAIL PENGERJAAN MURID (Checklist & Tanda X)
         ======================================================== */}
      {selectedStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-stone-900 border-2 border-yellow-500/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 bg-amber-950/90 border-b border-amber-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif font-black text-yellow-400">
                  Detail Jawaban: {selectedStudentModal.nama_lengkap}
                </h3>
                <p className="text-xs text-stone-300">
                  {selectedStudentModal.nomor_induk
                    ? `NIS: ${selectedStudentModal.nomor_induk}`
                    : "Murid"} • Rekap tanda centang (✓) lan silang (✗)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentModal(null)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Tab Switcher Tokoh */}
            <div className="flex border-b border-amber-900/60 bg-stone-950/60 px-4 pt-2 gap-2 overflow-x-auto">
              {charactersLevel1.map((char) => {
                const sub = submissionMap[selectedStudentModal.id]?.[char.id];
                const isActive = activeModalCharId === char.id;

                return (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => setActiveModalCharId(char.id)}
                    className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      isActive
                        ? "bg-amber-900/80 text-yellow-300 border-t-2 border-yellow-400"
                        : "text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    <span>{char.name}</span>
                    {sub ? (
                      <span className="text-[10px] px-1.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600">
                        {sub.score}
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-500">belum</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {(() => {
                const char = charactersLevel1.find((c) => c.id === activeModalCharId);
                const sub = submissionMap[selectedStudentModal.id]?.[char?.id];

                if (!sub) {
                  return (
                    <div className="py-12 text-center text-stone-400">
                      <p className="text-base font-semibold text-stone-300">
                        Murid durung ngerjakake tantangan {char?.name}.
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        Asil bakal katon kanthi otomatis sawise murid mencet tombol &quot;Priksa Jawaban&quot;.
                      </p>
                    </div>
                  );
                }

                const selectedList = sub.selected_answers || [];

                return (
                  <div className="space-y-4">
                    {/* Ringkasan Skor Tokoh */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs">
                      <div>
                        <span className="text-stone-300">Skor Pengerjaan:</span>{" "}
                        <strong className="text-yellow-400 text-sm font-bold">
                          {sub.score} saka {sub.total_questions} bener
                        </strong>
                      </div>
                      <div className="text-stone-400 text-[11px]">
                        Disubmit: {new Date(sub.submitted_at).toLocaleString("id-ID")}
                      </div>
                    </div>

                    {/* Breakdown Checklist Ciri-Ciri */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                        Analisis Saben Pilihan Jawaban:
                      </p>

                      {char?.options.map((optionText, idx) => {
                        const isChosen = selectedList.includes(optionText);
                        const isCorrectKey = char.correctAnswers.includes(optionText);

                        // True Positive: Murid milih & Bener -> ✓ Centang Hijau
                        // False Positive: Murid milih & Salah -> ✗ Silang Merah
                        // False Negative: Kunci bener nanging ora dipilih -> ⚠️ Luput
                        // True Negative: Kunci salah & ora dipilih -> - Bener ora dipilih
                        let statusBadge;
                        if (isChosen && isCorrectKey) {
                          statusBadge = (
                            <span className="px-2 py-1 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs font-black flex items-center gap-1">
                              ✓ BENER
                            </span>
                          );
                        } else if (isChosen && !isCorrectKey) {
                          statusBadge = (
                            <span className="px-2 py-1 rounded bg-red-950 border border-red-500 text-red-300 text-xs font-black flex items-center gap-1">
                              ✗ SALAH
                            </span>
                          );
                        } else if (!isChosen && isCorrectKey) {
                          statusBadge = (
                            <span className="px-2 py-1 rounded bg-stone-800 border border-stone-600 text-stone-400 text-xs font-semibold">
                              (Jawaban bener ora dicentang)
                            </span>
                          );
                        } else {
                          statusBadge = (
                            <span className="px-2 py-1 rounded bg-stone-900 border border-stone-800 text-stone-500 text-xs">
                              -
                            </span>
                          );
                        }

                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border flex items-center justify-between gap-3 text-xs ${
                              isChosen
                                ? isCorrectKey
                                  ? "bg-emerald-950/30 border-emerald-700/60"
                                  : "bg-red-950/30 border-red-700/60"
                                : "bg-stone-950/40 border-stone-800"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`w-5 h-5 rounded flex items-center justify-center font-black text-xs ${
                                  isChosen
                                    ? "bg-yellow-400 text-stone-950"
                                    : "border border-stone-600 text-stone-600"
                                }`}
                              >
                                {isChosen ? "✓" : ""}
                              </span>
                              <span
                                className={`${
                                  isChosen ? "text-stone-100 font-medium" : "text-stone-400"
                                }`}
                              >
                                {optionText}
                              </span>
                            </div>

                            <div>{statusBadge}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-950/80 border-t border-amber-900/60 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudentModal(null)}
                className="px-4 py-2 rounded-lg bg-amber-900 hover:bg-amber-800 text-yellow-200 text-xs font-bold transition"
              >
                Tutup Rekap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
