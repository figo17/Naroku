"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function GuruKelasDetailPage({ params }) {
  // Support both React 19 / Next.js 15 unwrapped params or standard object
  const resolvedParams = typeof params?.then === "function" ? use(params) : params;
  const classId = resolvedParams?.id;

  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const loadClassDetail = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      // 1. Fetch class details
      const { data: cls, error: clsError } = await supabase
        .from("classes")
        .select("*")
        .eq("id", classId)
        .single();

      if (clsError || !cls) {
        setErrorMessage("Kelas tidak ditemukan atau Anda tidak memiliki akses.");
        setLoading(false);
        return;
      }

      setClassData(cls);

      // 2. Fetch students in this class
      const { data: studentList, error: stuError } = await supabase
        .from("profiles")
        .select("id, nama_lengkap, nomor_induk, role, class_id")
        .eq("class_id", classId);

      if (stuError) {
        console.error("Error fetching students:", stuError);
      }

      const studentsWithProgress = await Promise.all(
        (studentList || []).map(async (stu) => {
          // Get student game progress
          const { data: prog } = await supabase
            .from("game_progress")
            .select("current_map, quest_stage, is_completed")
            .eq("user_id", stu.id)
            .maybeSingle();

          // Get latest quiz results for this student
          const { data: quizRes } = await supabase
            .from("quiz_results")
            .select("skor, is_correct, created_at")
            .eq("user_id", stu.id)
            .order("created_at", { ascending: false });

          // Calculate total score or average
          let totalScore = 0;
          if (quizRes && quizRes.length > 0) {
            totalScore = quizRes.reduce((acc, curr) => acc + (curr.skor || 0), 0);
          }

          return {
            ...stu,
            progress: prog || {
              current_map: "map1_goa",
              quest_stage: 1,
              is_completed: false,
            },
            quizCount: quizRes?.length || 0,
            totalScore: totalScore,
          };
        })
      );

      setStudents(studentsWithProgress);
    } catch (err) {
      console.error("Error in loadClassDetail:", err);
      setErrorMessage(err.message || "Gagal memuat detail kelas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classId) {
      loadClassDetail();
    }
  }, [classId]);

  const copyCode = () => {
    if (!classData?.class_code) return;
    navigator.clipboard.writeText(classData.class_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRemoveStudent = async (studentId, studentName) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin mengeluarkan murid "${studentName}" dari kelas ini?`
    );
    if (!confirmed) return;

    try {
      setActionLoading(studentId);
      const { error } = await supabase
        .from("profiles")
        .update({ class_id: null })
        .eq("id", studentId);

      if (error) throw error;

      // Update state locally
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
    } catch (err) {
      console.error("Error removing student:", err);
      alert("Gagal mengeluarkan murid: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadCSV = () => {
    if (!students || students.length === 0) {
      alert("Belum ada data murid untuk diunduh.");
      return;
    }

    // CSV Headers
    const headers = [
      "No",
      "Nama Lengkap",
      "Nomor Induk / NISN",
      "Babak Quest Saat Ini",
      "Peta Terakhir",
      "Status Tamat",
      "Jumlah Soal Dikerjakan",
      "Total Skor Evaluasi",
    ];

    // CSV Rows
    const rows = students.map((s, index) => [
      index + 1,
      `"${(s.nama_lengkap || "").replace(/"/g, '""')}"`,
      `"${s.nomor_induk || "-"}"`,
      s.progress?.quest_stage || 1,
      s.progress?.current_map || "-",
      s.progress?.is_completed ? "Tamat" : "Sedang Berjalan",
      s.quizCount || 0,
      s.totalScore || 0,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const fileName = `Rekap_Kelas_${(classData?.nama_kelas || "Haroku").replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-stone-400">
        <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="font-serif text-amber-200">Memuat rincian kelas...</p>
      </div>
    );
  }

  if (errorMessage || !classData) {
    return (
      <div className="p-8 bg-stone-900 border border-stone-800 rounded-xl text-center space-y-4">
        <div className="text-4xl text-red-500">⚠️</div>
        <p className="text-red-300">{errorMessage || "Kelas tidak ditemukan"}</p>
        <Link
          href="/guru/kelas"
          className="inline-block px-4 py-2 bg-amber-800 hover:bg-amber-700 text-stone-100 rounded-lg text-sm"
        >
          ← Kembali ke Daftar Kelas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back button and breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/guru/kelas"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-amber-400 hover:text-amber-300 transition"
        >
          <span>← Kembali ke Semua Kelas</span>
        </Link>

        {/* CSV Download Button */}
        <button
          onClick={handleDownloadCSV}
          disabled={students.length === 0}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg border border-emerald-600 shadow transition"
        >
          <span>📥</span>
          <span>Download Rekap CSV</span>
        </button>
      </div>

      {/* Class Banner Card */}
      <div className="bg-amber-950/40 border-2 border-amber-800/80 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-900/80 text-yellow-400 border border-amber-700 mb-1">
            Kelas Aktif
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-yellow-400">
            {classData.nama_kelas}
          </h1>
          <p className="text-sm text-stone-300">
            {classData.deskripsi || "Tidak ada deskripsi kelas."}
          </p>
          <p className="text-xs text-stone-500">
            Dibuat pada: {new Date(classData.created_at).toLocaleDateString("id-ID", { dateStyle: "long" })}
          </p>
        </div>

        {/* Class Code Highlight Badge */}
        <div className="bg-stone-950 p-5 rounded-xl border border-amber-700/80 flex flex-col items-center justify-center min-w-[200px] shadow-inner text-center">
          <span className="text-[11px] font-bold uppercase text-stone-400 tracking-wider">
            Kode Kelas Murid
          </span>
          <span className="text-3xl font-mono font-black text-yellow-400 tracking-widest my-1">
            {classData.class_code}
          </span>
          <button
            onClick={copyCode}
            className="mt-2 w-full px-3 py-1.5 text-xs font-semibold bg-amber-900/70 hover:bg-amber-800 text-yellow-300 rounded border border-amber-700 transition"
          >
            {copiedCode ? "✓ Kode Tersalin" : "Salin Kode"}
          </button>
        </div>
      </div>

      {/* Student List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif font-bold text-amber-200 flex items-center space-x-2">
            <span>👥</span>
            <span>Daftar Murid Terdaftar ({students.length})</span>
          </h2>
        </div>

        {students.length === 0 ? (
          <div className="py-12 text-center bg-stone-900/60 rounded-xl border border-stone-800 space-y-2">
            <p className="text-stone-300 font-medium">Belum ada murid yang bergabung.</p>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Bagikan kode kelas <strong className="text-yellow-400 font-mono">{classData.class_code}</strong> ke murid Anda saat mereka login ke Haroku Adventure.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-stone-950/80 border border-amber-900/50 rounded-xl shadow-md">
            <table className="w-full text-left text-xs sm:text-sm text-stone-200">
              <thead className="bg-amber-950/60 text-amber-300 uppercase tracking-wider text-[11px] border-b border-amber-900/70 font-semibold">
                <tr>
                  <th className="px-4 py-3">No</th>
                  <th className="px-4 py-3">Nama Lengkap</th>
                  <th className="px-4 py-3">NISN / No. Induk</th>
                  <th className="px-4 py-3">Babak Quest</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Skor Quiz</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {students.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-amber-950/20 transition">
                    <td className="px-4 py-3.5 text-stone-500 font-mono">{idx + 1}</td>
                    <td className="px-4 py-3.5 font-medium text-white flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-amber-900/80 text-yellow-300 flex items-center justify-center font-bold text-xs border border-amber-700">
                        {student.nama_lengkap?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <span>{student.nama_lengkap || "Tanpa Nama"}</span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-stone-400">
                      {student.nomor_induk || "-"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-950 text-amber-300 border border-amber-800">
                        Babak {student.progress?.quest_stage || 1}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {student.progress?.is_completed ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          ✓ Tamat
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-800 text-stone-300">
                          Sedang Bermain
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-yellow-400">
                      {student.totalScore} Poin
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleRemoveStudent(student.id, student.nama_lengkap)}
                        disabled={actionLoading === student.id}
                        className="px-2.5 py-1 text-xs bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 rounded transition disabled:opacity-50"
                        title="Keluarkan murid dari kelas"
                      >
                        {actionLoading === student.id ? "..." : "Keluarkan"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
