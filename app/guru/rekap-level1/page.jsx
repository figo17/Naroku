"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { charactersLevel1 } from "@/data/charactersLevel1";

export default function RekapLevel1Page() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [checklistSubmissions, setChecklistSubmissions] = useState([]);
  const [essaySubmissions, setEssaySubmissions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Tab: 'uraian' (Tantangan Nulis) atau 'checklist' (Centhang Ciri-ciri)
  const [activeTab, setActiveTab] = useState("uraian");

  // Modal Checklist Detail
  const [selectedStudentModal, setSelectedStudentModal] = useState(null);
  const [activeModalCharId, setActiveModalCharId] = useState("rara_kuning");

  // Modal Uraian Detail
  const [selectedEssayStudent, setSelectedEssayStudent] = useState(null);

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

        // 2. Fetch all Level 1 Checklist submissions
        const { data: subsData, error: subErr } = await supabase
          .from("level1_character_results")
          .select("*")
          .order("submitted_at", { ascending: false });

        if (subErr) console.error("Error loading checklist submissions:", subErr);

        // 3. Fetch all Level 1 Essay answers
        const { data: essayData, error: essayErr } = await supabase
          .from("level1_essay_answers")
          .select("*")
          .order("updated_at", { ascending: false });

        if (essayErr) console.error("Error loading essay submissions:", essayErr);

        setStudents(studentsData || []);
        setChecklistSubmissions(subsData || []);
        setEssaySubmissions(essayData || []);
      } catch (err) {
        console.error("Rekap error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  // Map checklist submissions by user_id and character_id
  const checklistMap = {};
  checklistSubmissions.forEach((sub) => {
    if (!checklistMap[sub.user_id]) {
      checklistMap[sub.user_id] = {};
    }
    checklistMap[sub.user_id][sub.character_id] = sub;
  });

  // Map essay submissions by user_id
  const essayMap = {};
  essaySubmissions.forEach((es) => {
    essayMap[es.user_id] = es;
  });

  // Filter students by search
  const filteredStudents = students.filter((stu) => {
    const q = searchQuery.toLowerCase();
    const name = (stu.nama_lengkap || "").toLowerCase();
    const nis = (stu.nomor_induk || "").toLowerCase();
    return name.includes(q) || nis.includes(q);
  });

  // KPI Calculations
  const totalStudents = students.length;
  const participatedChecklist = Object.keys(checklistMap).length;
  const participatedEssay = Object.keys(essayMap).length;

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-yellow-500 tracking-wide flex items-center gap-3">
            <span>👥</span> Rekap Level 1: Orientasi Tokoh
          </h1>
          <p className="text-sm text-stone-300 mt-1">
            Pantau wangsulan tulisan (uraian) lan asil centhang ciri-ciri paraga crita dening para murid.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-stone-900 border border-amber-900/70 p-1.5 rounded-xl shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab("uraian")}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "uraian"
                ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-stone-950 shadow-md font-black"
                : "text-amber-200/80 hover:text-yellow-300 hover:bg-amber-950/40"
            }`}
          >
            <span>📝</span>
            <span>Jawaban Uraian (Nulis)</span>
            {participatedEssay > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-stone-950/70 text-[10px] text-yellow-300">
                {participatedEssay}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("checklist")}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "checklist"
                ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-stone-950 shadow-md font-black"
                : "text-amber-200/80 hover:text-yellow-300 hover:bg-amber-950/40"
            }`}
          >
            <span>✓</span>
            <span>Rekap Centhang (Kuis)</span>
            {participatedChecklist > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-stone-950/70 text-[10px] text-yellow-300">
                {participatedChecklist}
              </span>
            )}
          </button>
        </div>
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
            {activeTab === "uraian" ? "Sudah Mengisi Uraian Tokoh" : "Sudah Mengerjakan Centhang"}
          </p>
          <div className="mt-2 flex items-baseline">
            <span className="text-3xl font-black text-emerald-400 font-serif">
              {loading
                ? "..."
                : activeTab === "uraian"
                ? participatedEssay
                : participatedChecklist}
            </span>
            <span className="ml-2 text-xs text-stone-400">
              (
              {totalStudents > 0
                ? Math.round(
                    ((activeTab === "uraian" ? participatedEssay : participatedChecklist) /
                      totalStudents) *
                      100
                  )
                : 0}
              %)
            </span>
          </div>
        </div>

        <div className="bg-amber-950/40 border border-amber-800/80 rounded-xl p-5 shadow-lg backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/80">
            {activeTab === "uraian" ? "Kelengkapan Wangsulan" : "Total Jawaban Karakter"}
          </p>
          <div className="mt-2 flex items-baseline">
            <span className="text-3xl font-black text-amber-300 font-serif">
              {loading
                ? "..."
                : activeTab === "uraian"
                ? `${participatedEssay} berkas`
                : `${checklistSubmissions.length} evaluasi`}
            </span>
            <span className="ml-2 text-xs text-stone-400">tersimpan</span>
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

      {/* ========================================================
          TAB 1: TABEL REKAP JAWABAN URAIAN (TANTANGAN NULIS)
         ======================================================== */}
      {activeTab === "uraian" && (
        <div className="bg-stone-900/70 border border-amber-900/60 rounded-xl shadow-xl overflow-hidden">
          <div className="p-4 bg-amber-950/60 border-b border-amber-800/60 flex items-center justify-between">
            <h2 className="font-serif font-bold text-yellow-400 text-sm sm:text-base flex items-center gap-2">
              <span>📜</span> Wangsulan Nulis Paraga (Tokoh 1 - 4)
            </h2>
            <span className="text-xs text-amber-200/70">
              Klik &quot;Deleng Wangsulan&quot; kanggo maca tulisan utuh murid
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-amber-950/80 border-b border-amber-800/80 text-yellow-400 uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Nama Murid</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Tokoh 1 (Rara Kuning)</th>
                  <th className="py-3 px-3">Tokoh 2 (Rara Runting)</th>
                  <th className="py-3 px-3">Tokoh 3 (Resi Darmo)</th>
                  <th className="py-3 px-3">Tokoh 4 (Lembu Amiseno)</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-950/40 text-stone-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-stone-400">
                      <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Memuat data wangsulan murid...
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
                    const essay = essayMap[stu.id];
                    const countFilled = [
                      essay?.tokoh1_answer,
                      essay?.tokoh2_answer,
                      essay?.tokoh3_answer,
                      essay?.tokoh4_answer,
                    ].filter((t) => (t || "").trim().length > 0).length;

                    return (
                      <tr key={stu.id} className="hover:bg-amber-950/20 transition-colors">
                        <td className="py-3 px-4 text-stone-400 font-mono">{idx + 1}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-stone-100">{stu.nama_lengkap}</div>
                          <div className="text-[11px] text-stone-400">
                            {stu.nomor_induk ? `NIS: ${stu.nomor_induk}` : "Murid"}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {countFilled === 4 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600">
                              ✓ Lengkap (4/4)
                            </span>
                          ) : countFilled > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-yellow-950 text-yellow-300 border border-yellow-600">
                              ⏳ Sebagian ({countFilled}/4)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-stone-900 text-stone-400 border border-stone-700">
                              Belum Mengisi
                            </span>
                          )}
                        </td>

                        {/* Tokoh 1 Preview */}
                        <td className="py-3 px-3 max-w-[150px] truncate text-stone-300 text-xs font-serif">
                          {essay?.tokoh1_answer ? (
                            <span>{essay.tokoh1_answer}</span>
                          ) : (
                            <span className="text-stone-500 italic">-</span>
                          )}
                        </td>

                        {/* Tokoh 2 Preview */}
                        <td className="py-3 px-3 max-w-[150px] truncate text-stone-300 text-xs font-serif">
                          {essay?.tokoh2_answer ? (
                            <span>{essay.tokoh2_answer}</span>
                          ) : (
                            <span className="text-stone-500 italic">-</span>
                          )}
                        </td>

                        {/* Tokoh 3 Preview */}
                        <td className="py-3 px-3 max-w-[150px] truncate text-stone-300 text-xs font-serif">
                          {essay?.tokoh3_answer ? (
                            <span>{essay.tokoh3_answer}</span>
                          ) : (
                            <span className="text-stone-500 italic">-</span>
                          )}
                        </td>

                        {/* Tokoh 4 Preview */}
                        <td className="py-3 px-3 max-w-[150px] truncate text-stone-300 text-xs font-serif">
                          {essay?.tokoh4_answer ? (
                            <span>{essay.tokoh4_answer}</span>
                          ) : (
                            <span className="text-stone-500 italic">-</span>
                          )}
                        </td>

                        {/* Aksi Button */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {essay ? (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedEssayStudent({
                                  student: stu,
                                  essay: essay,
                                })
                              }
                              className="px-3 py-1.5 rounded-lg bg-amber-900/60 hover:bg-yellow-600 hover:text-stone-950 text-yellow-400 font-bold text-xs border border-yellow-500/50 transition-all shadow-sm flex items-center gap-1.5 mx-auto"
                            >
                              <span>📖</span> Deleng Wangsulan
                            </button>
                          ) : (
                            <span className="text-stone-500 text-xs">Durung ngirim</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: TABEL REKAP CHECKLIST CENTHANG (KUIS)
         ======================================================== */}
      {activeTab === "checklist" && (
        <div className="bg-stone-900/70 border border-amber-900/60 rounded-xl shadow-xl overflow-hidden">
          <div className="p-4 bg-amber-950/60 border-b border-amber-800/60 flex items-center justify-between">
            <h2 className="font-serif font-bold text-yellow-400 text-sm sm:text-base flex items-center gap-2">
              <span>✓</span> Rekap Centhang Ciri-ciri Tokoh (Level 1 Checklist)
            </h2>
            <span className="text-xs text-amber-200/70">
              Klik &quot;Detail Jawaban&quot; kanggo mriksa opsi sing dipilih murid
            </span>
          </div>

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
                    const stuSubs = checklistMap[stu.id] || {};
                    const rk = stuSubs["rara_kuning"];
                    const rr = stuSubs["rara_runting"];
                    const rd = stuSubs["resi_darmo"];
                    const la = stuSubs["lembu_amiseno"];

                    const totalScore =
                      (rk?.score || 0) + (rr?.score || 0) + (rd?.score || 0) + (la?.score || 0);

                    return (
                      <tr key={stu.id} className="hover:bg-amber-950/20 transition-colors">
                        <td className="py-3 px-4 text-stone-400 font-mono">{idx + 1}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
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
                          <span className="font-mono font-bold text-yellow-400">
                            {totalScore}/11
                          </span>
                        </td>

                        {/* Aksi Button */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentModal(stu);
                              setActiveModalCharId("rara_kuning");
                            }}
                            className="px-3 py-1 rounded bg-amber-900/60 hover:bg-yellow-600 hover:text-stone-950 text-yellow-400 font-bold text-xs border border-yellow-500/50 transition-all shadow-sm"
                          >
                            Detail Jawaban
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
      )}

      {/* ========================================================
          MODAL DETAIL: JAWABAN URAIAN (TANTANGAN NULIS)
         ======================================================== */}
      {selectedEssayStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-3xl bg-stone-900 border-2 border-yellow-500/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 border-b border-amber-800/80 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif font-black text-yellow-400 flex items-center gap-2">
                  <span>📜</span> Wangsulan Uraian: {selectedEssayStudent.student.nama_lengkap}
                </h3>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  {selectedEssayStudent.student.nomor_induk
                    ? `NISN/NIS: ${selectedEssayStudent.student.nomor_induk} • `
                    : ""}
                  Dianyari pungkasan:{" "}
                  {selectedEssayStudent.essay.updated_at
                    ? new Date(selectedEssayStudent.essay.updated_at).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEssayStudent(null)}
                className="w-8 h-8 rounded-full bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 flex items-center justify-center text-sm font-bold transition-all"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: 4 Character Answer Parchment Cards */}
            <div className="p-6 overflow-y-auto space-y-5 bg-[#0a0f0c]">
              {/* Tokoh 1: Rara Kuning */}
              <div className="bg-[#fcf6e5] text-amber-950 rounded-xl p-4 border border-amber-900/30 shadow-md">
                <div className="flex items-center gap-2 border-b border-amber-900/20 pb-2 mb-2 font-bold font-serif text-sm text-amber-900">
                  <span>👸</span>
                  <span>Tokoh 1: Putri Rara Kuning (Dewi Sekartaji)</span>
                </div>
                <div className="font-serif text-sm leading-relaxed whitespace-pre-wrap min-h-[48px]">
                  {selectedEssayStudent.essay.tokoh1_answer ? (
                    selectedEssayStudent.essay.tokoh1_answer
                  ) : (
                    <span className="text-amber-800/50 italic">(Ora ana wangsulan)</span>
                  )}
                </div>
              </div>

              {/* Tokoh 2: Rara Runting */}
              <div className="bg-[#fcf6e5] text-amber-950 rounded-xl p-4 border border-amber-900/30 shadow-md">
                <div className="flex items-center gap-2 border-b border-amber-900/20 pb-2 mb-2 font-bold font-serif text-sm text-amber-900">
                  <span>👑</span>
                  <span>Tokoh 2: Rara Runting (Dewi Kilisuci)</span>
                </div>
                <div className="font-serif text-sm leading-relaxed whitespace-pre-wrap min-h-[48px]">
                  {selectedEssayStudent.essay.tokoh2_answer ? (
                    selectedEssayStudent.essay.tokoh2_answer
                  ) : (
                    <span className="text-amber-800/50 italic">(Ora ana wangsulan)</span>
                  )}
                </div>
              </div>

              {/* Tokoh 3: Resi Darmo */}
              <div className="bg-[#fcf6e5] text-amber-950 rounded-xl p-4 border border-amber-900/30 shadow-md">
                <div className="flex items-center gap-2 border-b border-amber-900/20 pb-2 mb-2 font-bold font-serif text-sm text-amber-900">
                  <span>🧘</span>
                  <span>Tokoh 3: Resi Darmo (Pertapa Suci Gunung Wilis)</span>
                </div>
                <div className="font-serif text-sm leading-relaxed whitespace-pre-wrap min-h-[48px]">
                  {selectedEssayStudent.essay.tokoh3_answer ? (
                    selectedEssayStudent.essay.tokoh3_answer
                  ) : (
                    <span className="text-amber-800/50 italic">(Ora ana wangsulan)</span>
                  )}
                </div>
              </div>

              {/* Tokoh 4: Patih Lembu Amiseno */}
              <div className="bg-[#fcf6e5] text-amber-950 rounded-xl p-4 border border-amber-900/30 shadow-md">
                <div className="flex items-center gap-2 border-b border-amber-900/20 pb-2 mb-2 font-bold font-serif text-sm text-amber-900">
                  <span>🤴</span>
                  <span>Tokoh 4: Patih Lembu Amiseno (Raja Kadiri / Daha)</span>
                </div>
                <div className="font-serif text-sm leading-relaxed whitespace-pre-wrap min-h-[48px]">
                  {selectedEssayStudent.essay.tokoh4_answer ? (
                    selectedEssayStudent.essay.tokoh4_answer
                  ) : (
                    <span className="text-amber-800/50 italic">(Ora ana wangsulan)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-900 border-t border-amber-900/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEssayStudent(null)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 text-stone-950 font-bold text-xs sm:text-sm shadow-md"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL DETAIL: CHECKLIST PILIHAN GANDA (KUIS)
         ======================================================== */}
      {selectedStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-stone-900 border-2 border-yellow-500/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 border-b border-amber-800/80 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif font-black text-yellow-400">
                  Detail Jawaban Centhang: {selectedStudentModal.nama_lengkap}
                </h3>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  {selectedStudentModal.nomor_induk
                    ? `NIS: ${selectedStudentModal.nomor_induk}`
                    : "Murid"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentModal(null)}
                className="w-8 h-8 rounded-full bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 flex items-center justify-center text-sm font-bold transition-all"
              >
                ✕
              </button>
            </div>

            {/* Character Selector Tabs */}
            <div className="flex border-b border-amber-900/60 bg-stone-950/80 px-4 pt-3 gap-2 overflow-x-auto">
              {charactersLevel1.map((char) => {
                const sub = (checklistMap[selectedStudentModal.id] || {})[char.id];
                const isActive = activeModalCharId === char.id;

                return (
                  <button
                    key={char.id}
                    onClick={() => setActiveModalCharId(char.id)}
                    className={`py-2 px-3 rounded-t-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? "bg-stone-900 text-yellow-400 border-t-2 border-yellow-500 border-x border-amber-900/60"
                        : "text-stone-400 hover:text-stone-200 hover:bg-stone-900/40"
                    }`}
                  >
                    <span>{char.name}</span>
                    {sub ? (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600 font-mono">
                        {sub.score}
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-500">(0)</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {(() => {
                const char = charactersLevel1.find((c) => c.id === activeModalCharId);
                const sub = (checklistMap[selectedStudentModal.id] || {})[activeModalCharId];

                if (!char) return null;

                if (!sub) {
                  return (
                    <div className="py-8 text-center text-stone-400 text-sm">
                      Murid durung ngerjakake tantangan kanggo tokoh iki.
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-amber-950/40 border border-amber-800/60">
                      <div>
                        <span className="text-xs text-stone-400">Status Kelulusan:</span>
                        <div className="font-bold text-sm text-yellow-300">
                          {sub.is_passed ? "✓ Lulus Tantangan" : "Belum Lulus"}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-stone-400">Skor Diperoleh:</span>
                        <div className="text-lg font-black font-mono text-emerald-400">
                          {sub.score} / {sub.total_questions}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                        Opsi yang Dipilih Murid:
                      </p>
                      {char.options.map((opt, i) => {
                        const isChosen = (sub.selected_answers || []).includes(opt);
                        const isCorrectAnswer = char.correctIndices.includes(i);

                        return (
                          <div
                            key={i}
                            className={`p-3 rounded-lg border text-xs sm:text-sm flex items-center justify-between transition-all ${
                              isChosen
                                ? isCorrectAnswer
                                  ? "bg-emerald-950/60 border-emerald-500/80 text-emerald-100"
                                  : "bg-red-950/60 border-red-500/80 text-red-100"
                                : isCorrectAnswer
                                ? "bg-stone-900/40 border-stone-800 text-stone-400"
                                : "bg-stone-900/20 border-stone-800/60 text-stone-500"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono text-xs">
                                {isChosen ? (isCorrectAnswer ? "✓" : "✗") : "○"}
                              </span>
                              <span>{opt}</span>
                            </div>
                            <div>
                              {isChosen && isCorrectAnswer && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 font-bold">
                                  Benar (+1)
                                </span>
                              )}
                              {isChosen && !isCorrectAnswer && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-red-900 text-red-300 font-bold">
                                  Salah
                                </span>
                              )}
                              {!isChosen && isCorrectAnswer && (
                                <span className="text-[10px] text-amber-400/80 italic">
                                  (Kunci Jawaban)
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-900 border-t border-amber-900/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudentModal(null)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 text-stone-950 font-bold text-xs sm:text-sm shadow-md"
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
