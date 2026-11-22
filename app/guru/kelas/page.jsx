"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { generateClassCode } from "@/lib/utils";

export default function GuruKelasPage() {
  const supabase = createClient();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  // Form states
  const [namaKelas, setNamaKelas] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [previewCode, setPreviewCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch classes
      const { data: classList, error: classError } = await supabase
        .from("classes")
        .select(`
          id,
          nama_kelas,
          deskripsi,
          class_code,
          created_at,
          teacher_id
        `)
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });

      if (classError) throw classError;

      // Fetch student counts for each class
      const classesWithCount = await Promise.all(
        (classList || []).map(async (cls) => {
          const { count, error: countErr } = await supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("class_id", cls.id);

          return {
            ...cls,
            studentCount: countErr ? 0 : count || 0,
          };
        })
      );

      setClasses(classesWithCount);
    } catch (err) {
      console.error("Error loading classes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const openCreateModal = () => {
    setNamaKelas("");
    setDeskripsi("");
    setPreviewCode(generateClassCode(6));
    setErrorMsg("");
    setShowModal(true);
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!namaKelas.trim()) {
      setErrorMsg("Nama kelas wajib diisi!");
      return;
    }

    try {
      setCreating(true);
      setErrorMsg("");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Pengguna belum login.");

      const newCode = previewCode || generateClassCode(6);

      const { data, error } = await supabase
        .from("classes")
        .insert([
          {
            nama_kelas: namaKelas.trim(),
            deskripsi: deskripsi.trim(),
            class_code: newCode,
            teacher_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation on class_code
          setErrorMsg("Kode kelas sudah digunakan, coba generate ulang kode.");
          setPreviewCode(generateClassCode(6));
          return;
        }
        throw error;
      }

      setShowModal(false);
      fetchClasses();
    } catch (err) {
      console.error("Failed to create class:", err);
      setErrorMsg(err.message || "Gagal membuat kelas. Silakan coba lagi.");
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-yellow-500 tracking-wide">
            Manajemen Kelas
          </h1>
          <p className="text-sm text-stone-300 mt-1">
            Buat kelas, bagikan kode kelas 6 karakter kepada murid, dan pantau aktivitas belajar.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-amber-700 hover:bg-amber-600 text-stone-100 font-semibold rounded-lg shadow-md transition border border-amber-500"
        >
          <span className="text-lg">＋</span>
          <span>Buat Kelas Baru</span>
        </button>
      </div>

      {/* Class List */}
      {loading ? (
        <div className="py-16 text-center text-stone-400">
          <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Memuat daftar kelas...
        </div>
      ) : classes.length === 0 ? (
        <div className="py-16 text-center bg-stone-900/50 rounded-2xl border border-stone-800 space-y-4">
          <div className="text-5xl">🏫</div>
          <h3 className="text-lg font-serif font-bold text-amber-200">Belum Ada Kelas</h3>
          <p className="text-sm text-stone-400 max-w-md mx-auto">
            Anda belum membuat kelas petualangan bahasa Jawa. Tekan tombol di bawah untuk membuat kelas pertama Anda.
          </p>
          <button
            onClick={openCreateModal}
            className="px-6 py-2.5 bg-amber-700 hover:bg-amber-600 text-white font-medium rounded-lg shadow transition"
          >
            Buat Kelas Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="bg-amber-950/30 border border-amber-900/80 hover:border-amber-600/90 rounded-xl p-5 shadow-lg flex flex-col justify-between transition group relative overflow-hidden"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-serif font-bold text-lg text-yellow-400 leading-snug line-clamp-1">
                    {cls.nama_kelas}
                  </h2>
                </div>

                {/* Class Code Highlight */}
                <div className="mt-3 p-3 bg-stone-950/80 rounded-lg border border-amber-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                      Kode Kelas (6 Digit)
                    </span>
                    <span className="text-xl font-mono font-black text-amber-300 tracking-widest">
                      {cls.class_code}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(cls.class_code)}
                    className="px-3 py-1.5 text-xs bg-amber-900/70 hover:bg-amber-800 text-yellow-300 rounded border border-amber-700 transition"
                    title="Salin Kode Kelas"
                  >
                    {copiedCode === cls.class_code ? "Tersalin! ✓" : "Salin"}
                  </button>
                </div>

                <p className="text-xs text-stone-300 mt-3 line-clamp-2 min-h-[32px]">
                  {cls.deskripsi || "Tidak ada deskripsi tambahan."}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 text-emerald-400 font-medium">
                  <span>👥</span>
                  <span>{cls.studentCount} Murid Terdaftar</span>
                </div>
                <Link
                  href={`/guru/kelas/${cls.id}`}
                  className="px-3 py-1.5 bg-amber-800/60 hover:bg-amber-700 text-stone-100 font-medium rounded transition"
                >
                  Detail →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Buat Kelas Baru */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-stone-900 border-2 border-amber-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-stone-100">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
              <h3 className="font-serif font-bold text-lg text-yellow-400 flex items-center space-x-2">
                <span>➕</span>
                <span>Buat Kelas Baru</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-stone-400 hover:text-white text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-950/80 border border-red-700 text-red-200 text-xs rounded-lg">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Nama Kelas <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bahasa Jawa Kelas 7A"
                  value={namaKelas}
                  onChange={(e) => setNamaKelas(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Deskripsi / Keterangan (Opsional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Kelas pembelajaran cerita rakyat Haroku Dewi Kilisuci tahun ajaran 2026/2027"
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Generated Class Code Preview */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Kode Kelas Otomatis
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={previewCode}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg font-mono font-bold text-lg text-yellow-400 text-center tracking-widest cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setPreviewCode(generateClassCode(6))}
                    className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs rounded-lg border border-stone-600 whitespace-nowrap"
                    title="Acak Ulang Kode"
                  >
                    🔄 Acak
                  </button>
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Kode ini akan dibagikan kepada murid untuk bergabung ke dalam kelas Anda.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-sm transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition shadow"
                >
                  {creating ? "Menyimpan..." : "Buat Kelas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
