"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function GuruQuizzesPage() {
  const supabase = createClient();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(1); // 1, 2, or 3 for quest_stage
  const [showModal, setShowModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form states
  const [formData, setFormData] = useState({
    quest_stage: 1,
    pertanyaan: "",
    opsi_a: "",
    opsi_b: "",
    opsi_c: "",
    opsi_d: "",
    jawaban_benar: "a",
    poin: 20,
  });

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .order("quest_stage", { ascending: true })
        .order("id", { ascending: true });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (err) {
      console.error("Error fetching quizzes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const openCreateModal = () => {
    setEditingQuiz(null);
    setFormData({
      quest_stage: activeTab,
      pertanyaan: "",
      opsi_a: "",
      opsi_b: "",
      opsi_c: "",
      opsi_d: "",
      jawaban_benar: "a",
      poin: 20,
    });
    setErrorMsg("");
    setShowModal(true);
  };

  const openEditModal = (quiz) => {
    setEditingQuiz(quiz);
    setFormData({
      quest_stage: quiz.quest_stage,
      pertanyaan: quiz.pertanyaan,
      opsi_a: quiz.opsi_a,
      opsi_b: quiz.opsi_b,
      opsi_c: quiz.opsi_c,
      opsi_d: quiz.opsi_d,
      jawaban_benar: quiz.jawaban_benar,
      poin: quiz.poin || 20,
    });
    setErrorMsg("");
    setShowModal(true);
  };

  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    if (!formData.pertanyaan.trim() || !formData.opsi_a.trim() || !formData.opsi_b.trim()) {
      setErrorMsg("Pertanyaan dan opsi jawaban A & B wajib diisi!");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg("");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Pengguna belum login.");

      const payload = {
        quest_stage: parseInt(formData.quest_stage, 10),
        pertanyaan: formData.pertanyaan.trim(),
        opsi_a: formData.opsi_a.trim(),
        opsi_b: formData.opsi_b.trim(),
        opsi_c: formData.opsi_c.trim(),
        opsi_d: formData.opsi_d.trim(),
        jawaban_benar: formData.jawaban_benar.toLowerCase(),
        poin: parseInt(formData.poin, 10) || 20,
        created_by: user.id,
      };

      if (editingQuiz) {
        // Update existing
        const { error } = await supabase
          .from("quizzes")
          .update(payload)
          .eq("id", editingQuiz.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("quizzes")
          .insert([payload]);

        if (error) throw error;
      }

      setShowModal(false);
      fetchQuizzes();
    } catch (err) {
      console.error("Error saving quiz:", err);
      setErrorMsg(err.message || "Gagal menyimpan soal.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    const confirmed = window.confirm("Apakah Anda yakin ingin menghapus soal evaluasi ini?");
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("quizzes")
        .delete()
        .eq("id", quizId);

      if (error) throw error;
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    } catch (err) {
      console.error("Error deleting quiz:", err);
      alert("Gagal menghapus soal: " + err.message);
    }
  };

  const filteredQuizzes = quizzes.filter(
    (q) => Number(q.quest_stage) === Number(activeTab)
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-yellow-500 tracking-wide">
            Bank Soal (Garapan Evaluasi)
          </h1>
          <p className="text-sm text-stone-300 mt-1">
            Kelola soal pilihan ganda bahasa Jawa berdasarkan babak petualangan Dewi Kilisuci.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-amber-700 hover:bg-amber-600 text-stone-100 font-semibold rounded-lg shadow-md transition border border-amber-500"
        >
          <span className="text-lg">＋</span>
          <span>Tambah Soal</span>
        </button>
      </div>

      {/* Quest Stage Filter Tabs */}
      <div className="flex space-x-2 border-b border-stone-800 pb-2 overflow-x-auto">
        {[
          { stage: 1, title: "Babak 1: Goa Selomangleng (Kamus & Basa Ngoko)" },
          { stage: 2, title: "Babak 2: Hutan Klothok (Unggah-Ungguh Krama)" },
          { stage: 3, title: "Babak 3: Puncak Klothok (Basa Rinengga & Paribasan)" },
        ].map((tab) => (
          <button
            key={tab.stage}
            onClick={() => setActiveTab(tab.stage)}
            className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeTab === tab.stage
                ? "bg-amber-800 text-yellow-300 border border-amber-600 shadow"
                : "bg-stone-900/60 text-stone-400 hover:text-stone-200 hover:bg-stone-800"
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>

      {/* Quizzes Table */}
      {loading ? (
        <div className="py-16 text-center text-stone-400">
          <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Memuat bank soal...
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="py-16 text-center bg-stone-900/50 rounded-2xl border border-stone-800 space-y-3">
          <div className="text-4xl">📝</div>
          <p className="text-stone-300 font-medium">Belum ada soal untuk Babak {activeTab}.</p>
          <p className="text-xs text-stone-500">
            Klik tombol Tambah Soal untuk membuat pertanyaan evaluasi murid.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg shadow transition"
          >
            + Buat Soal Babak {activeTab}
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto bg-stone-950/80 border border-amber-900/50 rounded-xl shadow-md">
          <table className="w-full text-left text-xs sm:text-sm text-stone-200">
            <thead className="bg-amber-950/60 text-amber-300 uppercase tracking-wider text-[11px] border-b border-amber-900/70 font-semibold">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Pertanyaan</th>
                <th className="px-4 py-3">Babak</th>
                <th className="px-4 py-3">Poin</th>
                <th className="px-4 py-3">Kunci Jawaban</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {filteredQuizzes.map((q, idx) => (
                <tr key={q.id} className="hover:bg-amber-950/20 transition">
                  <td className="px-4 py-3.5 text-stone-500 font-mono">{idx + 1}</td>
                  <td className="px-4 py-3.5 max-w-md">
                    <p className="font-medium text-stone-100 line-clamp-2">{q.pertanyaan}</p>
                    <div className="mt-1 text-[11px] text-stone-400 grid grid-cols-2 gap-x-2 gap-y-0.5">
                      <span className={q.jawaban_benar === "a" ? "text-emerald-400 font-bold" : ""}>
                        A: {q.opsi_a}
                      </span>
                      <span className={q.jawaban_benar === "b" ? "text-emerald-400 font-bold" : ""}>
                        B: {q.opsi_b}
                      </span>
                      <span className={q.jawaban_benar === "c" ? "text-emerald-400 font-bold" : ""}>
                        C: {q.opsi_c || "-"}
                      </span>
                      <span className={q.jawaban_benar === "d" ? "text-emerald-400 font-bold" : ""}>
                        D: {q.opsi_d || "-"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded text-xs bg-amber-950 text-amber-300 border border-amber-800">
                      Babak {q.quest_stage}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono font-bold text-yellow-400">
                    {q.poin || 20} Pts
                  </td>
                  <td className="px-4 py-3.5 uppercase font-mono font-bold text-emerald-400">
                    Opsi ({q.jawaban_benar})
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(q)}
                      className="px-2.5 py-1 text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 rounded border border-stone-600 transition"
                    >
                      Ubah
                    </button>
                    <button
                      onClick={() => handleDeleteQuiz(q.id)}
                      className="px-2.5 py-1 text-xs bg-red-950/70 hover:bg-red-900 text-red-200 rounded border border-red-800 transition"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Tambah / Edit Soal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-stone-900 border-2 border-amber-700/80 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-stone-100 my-8">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
              <h3 className="font-serif font-bold text-lg text-yellow-400 flex items-center space-x-2">
                <span>📝</span>
                <span>{editingQuiz ? "Ubah Soal Garapan" : "Tambah Soal Garapan Baru"}</span>
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

            <form onSubmit={handleSaveQuiz} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Babak Quest (Stage)
                  </label>
                  <select
                    value={formData.quest_stage}
                    onChange={(e) => setFormData({ ...formData, quest_stage: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-xs sm:text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value={1}>Babak 1 (Goa Selomangleng)</option>
                    <option value={2}>Babak 2 (Hutan Klothok)</option>
                    <option value={3}>Babak 3 (Puncak Klothok)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Nilai Poin Soal
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.poin}
                    onChange={(e) => setFormData({ ...formData, poin: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-xs sm:text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Pertanyaan (Bahasa Jawa) <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tulisen pitakonan ing kene..."
                  value={formData.pertanyaan}
                  onChange={(e) => setFormData({ ...formData, pertanyaan: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-xs sm:text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Options A, B, C, D */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-stone-300">
                  Opsi Pilihan Jawaban & Kunci Jawaban Benar
                </label>

                {["a", "b", "c", "d"].map((opt) => (
                  <div key={opt} className="flex items-center space-x-2">
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="radio"
                        name="jawaban_benar"
                        value={opt}
                        checked={formData.jawaban_benar === opt}
                        onChange={(e) =>
                          setFormData({ ...formData, jawaban_benar: e.target.value })
                        }
                        className="text-amber-600 focus:ring-amber-500 h-4 w-4"
                      />
                      <span className="font-mono font-bold uppercase text-yellow-400 text-xs w-4">
                        {opt}:
                      </span>
                    </label>
                    <input
                      type="text"
                      required={opt === "a" || opt === "b"}
                      placeholder={`Teks pilihan ${opt.toUpperCase()}...`}
                      value={formData[`opsi_${opt}`]}
                      onChange={(e) =>
                        setFormData({ ...formData, [`opsi_${opt}`]: e.target.value })
                      }
                      className="flex-1 px-3 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-xs sm:text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                ))}
                <p className="text-[11px] text-amber-400/80 italic">
                  * Pilih tombol radio di sebelah huruf untuk menandai kunci jawaban yang benar.
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
                  disabled={saving}
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition shadow"
                >
                  {saving ? "Menyimpan..." : "Simpan Soal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
