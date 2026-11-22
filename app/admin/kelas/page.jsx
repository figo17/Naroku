"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminKelasPage() {
  const supabase = createClient();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });

  const fetchClasses = async () => {
    setLoading(true);
    try {
      // 1. Fetch classes
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("id, nama_kelas, deskripsi, class_code, teacher_id, created_at")
        .order("created_at", { ascending: false });

      if (classError) throw classError;

      // 2. Fetch teachers from profiles
      const teacherIds = Array.from(new Set((classData || []).map((c) => c.teacher_id).filter(Boolean)));
      let teacherMap = {};
      if (teacherIds.length > 0) {
        const { data: teacherProfiles } = await supabase
          .from("profiles")
          .select("id, nama_lengkap")
          .in("id", teacherIds);

        if (teacherProfiles) {
          teacherProfiles.forEach((t) => {
            teacherMap[t.id] = t.nama_lengkap;
          });
        }
      }

      // 3. Fetch student counts for each class
      const { data: students } = await supabase
        .from("profiles")
        .select("id, class_id")
        .eq("role", "murid")
        .not("class_id", "is", null);

      const countMap = {};
      if (students) {
        students.forEach((s) => {
          countMap[s.class_id] = (countMap[s.class_id] || 0) + 1;
        });
      }

      // Combine info
      const enriched = (classData || []).map((c) => ({
        ...c,
        teacher_name: teacherMap[c.teacher_id] || "Guru mboten dipun-mangertosi",
        student_count: countMap[c.id] || 0,
      }));

      setClasses(enriched);
    } catch (err) {
      console.error("Error fetching admin classes:", err);
      setStatusMessage({ text: "Gagal ngunggah data kelas: " + err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleDeleteClass = async (classId, className) => {
    const confirmDelete = window.confirm(
      `Apa panjenengan yakin badhe mbusek kelas "${className}"? Murid ing kelas punika badhe medal dados boten gadhah kelas.`
    );
    if (!confirmDelete) return;

    setDeletingId(classId);
    try {
      // 1. Set murid class_id to NULL first to be safe
      await supabase
        .from("profiles")
        .update({ class_id: null })
        .eq("class_id", classId);

      // 2. Delete class
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", classId);

      if (error) throw error;

      setClasses((prev) => prev.filter((c) => c.id !== classId));
      setStatusMessage({ text: `Kelas "${className}" kasil dipun-busek!`, type: "success" });
      setTimeout(() => setStatusMessage({ text: "", type: "" }), 3000);
    } catch (err) {
      alert("Gagal mbusek kelas: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const matchName = c.nama_kelas?.toLowerCase().includes(search.toLowerCase());
      const matchCode = c.class_code?.toLowerCase().includes(search.toLowerCase());
      const matchTeacher = c.teacher_name?.toLowerCase().includes(search.toLowerCase());
      return matchName || matchCode || matchTeacher;
    });
  }, [classes, search]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-amber-100 flex items-center gap-2">
            <span>🏫</span> Manajemen Sedaya Kelas (Master Kelas)
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Ningali, madosi, lan ngatur sedaya kelas pasinaon saking sedaya bapak/ibu guru.
          </p>
        </div>
      </div>

      {/* Alert status */}
      {statusMessage.text && (
        <div
          className={`p-3 text-sm rounded-lg flex items-center gap-2 ${
            statusMessage.type === "success"
              ? "bg-emerald-950/80 border border-emerald-700 text-emerald-300"
              : "bg-red-950/80 border border-red-700 text-red-300"
          }`}
        >
          <span>{statusMessage.type === "success" ? "✓" : "⚠️"}</span>
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-stone-900 border border-amber-900/60 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Goleki jeneng kelas, kode, utawa pamong guru..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-stone-200 placeholder-stone-500 text-sm focus:outline-none focus:border-yellow-500"
          />
        </div>

        <div className="text-xs text-stone-400">
          Gunggung Kelas Kadhaftar: <span className="font-bold text-yellow-500">{filteredClasses.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-stone-900 border border-amber-900/60 rounded-xl overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-300">
            <thead className="bg-stone-800/80 text-yellow-500 uppercase text-xs font-semibold border-b border-amber-900/40">
              <tr>
                <th className="py-3 px-4">Jeneng Kelas</th>
                <th className="py-3 px-4">Kode Unik (6 Karakter)</th>
                <th className="py-3 px-4">Pamong (Guru)</th>
                <th className="py-3 px-4">Cacah Murid</th>
                <th className="py-3 px-4 text-center">Tumindak (Aksi)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-stone-500">
                    Ngunggah data kelas saking kraton...
                  </td>
                </tr>
              ) : filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-stone-500">
                    Ora ana data kelas sing ditemokake.
                  </td>
                </tr>
              ) : (
                filteredClasses.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-800/40 transition">
                    <td className="py-3 px-4 font-bold text-amber-100">
                      {item.nama_kelas}
                      {item.deskripsi && (
                        <p className="text-xs font-normal text-stone-400 mt-0.5 line-clamp-1">
                          {item.deskripsi}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-yellow-400 tracking-wider">
                      <span className="px-2.5 py-1 bg-yellow-950/70 border border-yellow-700/80 rounded">
                        {item.class_code}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-200">
                      {item.teacher_name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 bg-emerald-950/70 border border-emerald-700 text-emerald-300 rounded-full text-xs font-semibold">
                        {item.student_count} Murid
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteClass(item.id, item.nama_kelas)}
                        disabled={deletingId === item.id}
                        className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 text-xs font-semibold rounded transition disabled:opacity-50"
                      >
                        {deletingId === item.id ? "Mbusek..." : "Busek Kelas"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
