"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RekapLevel3Page() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [answers, setAnswers] = useState({});
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [stuRes, ansRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, nama_lengkap, nomor_induk")
            .eq("role", "murid")
            .order("nama_lengkap", { ascending: true }),
          supabase.from("level3_nulis_answers").select("*"),
        ]);
        if (stuRes.error) console.error(stuRes.error);
        if (ansRes.error) console.error(ansRes.error);
        const map = {};
        (ansRes.data || []).forEach((a) => {
          map[a.user_id] = a;
        });
        setStudents(stuRes.data || []);
        setAnswers(map);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (s.nama_lengkap || "").toLowerCase().includes(q) || (s.nomor_induk || "").toLowerCase().includes(q);
  });
  const doneCount = students.filter((s) => answers[s.id]?.narasi?.trim()).length;

  const downloadCSV = () => {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = filtered.map((s, i) => {
      const a = answers[s.id];
      return [i + 1, esc(s.nama_lengkap), esc(s.nomor_induk || "-"), a?.word_count ?? 0, esc(a?.narasi || "-"), esc(a?.updated_at || "-")].join(",");
    });
    const csv = ["No,Nama Murid,NISN,Cacah Tembung,Narasi Level 3,Dianyari", ...rows].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `Rekap_Level3_Haroku_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-yellow-400">✍️ Rekap Level 3 – Nulis Crita</h1>
          <p className="text-stone-400 text-xs sm:text-sm mt-1">
            Narasi Legenda Rara Kuning sing ditulis murid ing Mode Nulis Level 3.
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
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg border border-emerald-500 cursor-pointer"
          >
            📥 Download CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3.5 max-w-md">
        <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800">
          <p className="text-[11px] uppercase font-semibold tracking-wider text-stone-400">Total Murid</p>
          <p className="text-3xl font-extrabold font-serif text-stone-100 mt-1">{students.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80">
          <p className="text-[11px] uppercase font-semibold tracking-wider text-emerald-400">Wis Nulis</p>
          <p className="text-3xl font-extrabold font-serif text-emerald-400 mt-1">
            {doneCount} <span className="text-xs text-stone-400">/ {students.length}</span>
          </p>
        </div>
      </div>

      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-950 border-b border-stone-800 text-[11px] uppercase font-semibold tracking-wider text-stone-400">
            <tr>
              <th className="py-3 px-4">No</th>
              <th className="py-3 px-4">Nama Murid</th>
              <th className="py-3 px-4">Tembung</th>
              <th className="py-3 px-4">Cuplikan Narasi</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-stone-400">Memuat data...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-stone-500">Tidak ada data murid.</td></tr>
            ) : (
              filtered.map((s, i) => {
                const a = answers[s.id];
                return (
                  <tr key={s.id} className="hover:bg-stone-800/40 align-top">
                    <td className="py-3 px-4 text-stone-500 text-xs font-mono">{i + 1}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-stone-100">{s.nama_lengkap || "Tanpa Nama"}</div>
                      <div className="text-[11px] text-stone-400 font-mono">NISN: {s.nomor_induk || "-"}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-bold text-yellow-300">{a?.word_count ?? 0}</td>
                    <td className="py-3 px-4 max-w-[320px]">
                      {a?.narasi?.trim() ? (
                        <p className="text-xs text-stone-200 line-clamp-2 italic font-serif">&ldquo;{a.narasi}&rdquo;</p>
                      ) : (
                        <span className="text-stone-500 text-xs italic">Durung nulis</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        disabled={!a?.narasi?.trim()}
                        onClick={() => setSelected({ student: s, answer: a })}
                        className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/35 disabled:opacity-40 border border-yellow-500/50 text-yellow-300 text-xs font-bold rounded-lg cursor-pointer"
                      >
                        📖 Waca
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-stone-900 border-2 border-yellow-500/80 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="font-serif font-bold text-yellow-400 text-lg">{selected.student.nama_lengkap}</h3>
                <p className="text-xs text-stone-400">
                  {selected.answer.word_count} tembung · Dianyari{" "}
                  {new Date(selected.answer.updated_at).toLocaleString("id-ID")}
                </p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer">✕</button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto p-4 rounded-xl bg-[#fcf6e5] text-amber-950 text-sm font-serif leading-relaxed whitespace-pre-wrap">
              {selected.answer.narasi}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
