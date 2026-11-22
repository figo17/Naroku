"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminItemsPage() {
  const supabase = createClient();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });

  // Modal create/edit state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [code, setCode] = useState("");
  const [namaItem, setNamaItem] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("items")
        .select("code, nama_item, deskripsi, icon_url")
        .order("nama_item", { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error("Error fetching items:", err);
      setStatusMessage({ text: "Gagal ngunggah data items: " + err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Open modal create
  const handleOpenCreate = () => {
    setIsEditing(false);
    setCode("");
    setNamaItem("");
    setDeskripsi("");
    setIconUrl("");
    setModalError("");
    setIsModalOpen(true);
  };

  // Open modal edit
  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setCode(item.code);
    setNamaItem(item.nama_item);
    setDeskripsi(item.deskripsi);
    setIconUrl(item.icon_url);
    setModalError("");
    setIsModalOpen(true);
  };

  // Save item (Create or Update)
  const handleSubmitItem = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError("");

    try {
      const payload = {
        code: code.trim().toLowerCase(),
        nama_item: namaItem.trim(),
        deskripsi: deskripsi.trim(),
        icon_url: iconUrl.trim() || "/sprites/item_placeholder.png",
      };

      if (isEditing) {
        const { error } = await supabase
          .from("items")
          .update(payload)
          .eq("code", code);

        if (error) throw error;
        setStatusMessage({ text: `Item "${payload.nama_item}" kasil dianyari!`, type: "success" });
      } else {
        const { error } = await supabase.from("items").insert([payload]);
        if (error) throw error;
        setStatusMessage({ text: `Item anyar "${payload.nama_item}" kasil ditambahaken!`, type: "success" });
      }

      setIsModalOpen(false);
      fetchItems();
      setTimeout(() => setStatusMessage({ text: "", type: "" }), 3000);
    } catch (err) {
      setModalError(err.message || "Gagal nyimpen item");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete item
  const handleDeleteItem = async (itemCode, itemName) => {
    const confirmDel = window.confirm(
      `Apa panjenengan yakin badhe mbusek item "${itemName}" (${itemCode})?`
    );
    if (!confirmDel) return;

    try {
      const { error } = await supabase.from("items").delete().eq("code", itemCode);
      if (error) throw error;

      setItems((prev) => prev.filter((it) => it.code !== itemCode));
      setStatusMessage({ text: `Item "${itemName}" kasil dipun-busek!`, type: "success" });
      setTimeout(() => setStatusMessage({ text: "", type: "" }), 3000);
    } catch (err) {
      alert("Gagal mbusek item: " + err.message);
    }
  };

  // Seed default items: wadung, racikan_obat, kembang
  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const defaultItems = [
        {
          code: "wadung",
          nama_item: "Wadung (Kapak Tradisional)",
          deskripsi: "Piranti pusaka saka Resi ing Gunung Wilis kanggo mbukak dalan lan ngethok wit rintangan.",
          icon_url: "/sprites/wadung.png",
        },
        {
          code: "racikan_obat",
          nama_item: "Racikan Obat Herbal",
          deskripsi: "Bahan jamu lan tanduran obat kang diracik kanggo nambani lelarane Putri Rara Kuning.",
          icon_url: "/sprites/racikan_obat.png",
        },
        {
          code: "kembang",
          nama_item: "Kembang Wijayakusuma / Sesaji",
          deskripsi: "Kembang wangi kang dipigunakake kanggo sarana donga lan pamulihan ing Grojogan Rara Kuning.",
          icon_url: "/sprites/kembang.png",
        },
      ];

      const { error } = await supabase.from("items").upsert(defaultItems, {
        onConflict: "code",
      });

      if (error) throw error;

      setStatusMessage({
        text: "Kasil nyuntikake (seed) 3 data item gawan: wadung, racikan_obat, kembang!",
        type: "success",
      });
      fetchItems();
      setTimeout(() => setStatusMessage({ text: "", type: "" }), 4000);
    } catch (err) {
      alert("Gagal seed default items: " + err.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-amber-100 flex items-center gap-2">
            <span>🎒</span> Master Data Barang (Items)
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Nata sedaya data pusaka, piranti, lan barang inventaris murid ing njero game Haroku.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-stone-100 font-semibold rounded-lg shadow transition text-xs border border-emerald-600 flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>🌱</span> {seeding ? "Nyuntikake..." : "Seed Data Gawan"}
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-stone-950 font-bold rounded-lg shadow transition text-xs flex items-center gap-1.5"
          >
            <span>➕</span> Tambah Item Anyar
          </button>
        </div>
      </div>

      {/* Alert Status */}
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

      {/* Items Table */}
      <div className="bg-stone-900 border border-amber-900/60 rounded-xl overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-300">
            <thead className="bg-stone-800/80 text-yellow-500 uppercase text-xs font-semibold border-b border-amber-900/40">
              <tr>
                <th className="py-3 px-4">Kode Item (PK)</th>
                <th className="py-3 px-4">Ikon</th>
                <th className="py-3 px-4">Jeneng Item</th>
                <th className="py-3 px-4">Katrangan (Deskripsi)</th>
                <th className="py-3 px-4 text-center">Tumindak (Aksi)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-stone-500">
                    Ngunggah data master items...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-stone-500">
                    Dereng wonten item kadhaftar. Mangga klik tombol "Seed Data Gawan" ing nginggil.
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it.code} className="hover:bg-stone-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-yellow-400">
                      <span className="px-2 py-0.5 bg-yellow-950/70 border border-yellow-800 rounded text-xs">
                        {it.code}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-9 h-9 rounded bg-stone-800 border border-stone-700 flex items-center justify-center overflow-hidden text-lg">
                        {it.code === "wadung" ? (
                          "🪓"
                        ) : it.code === "racikan_obat" ? (
                          "🧪"
                        ) : it.code === "kembang" ? (
                          "🌸"
                        ) : (
                          "📦"
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-100">
                      {it.nama_item}
                    </td>
                    <td className="py-3 px-4 text-stone-300 text-xs max-w-xs sm:max-w-md">
                      {it.deskripsi}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(it)}
                          className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-yellow-400 border border-stone-600 rounded text-xs transition"
                        >
                          Owah
                        </button>
                        <button
                          onClick={() => handleDeleteItem(it.code, it.nama_item)}
                          className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 rounded text-xs transition"
                        >
                          Busek
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-stone-900 border-2 border-yellow-600/70 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <h2 className="text-lg font-bold text-amber-100 mb-4 flex items-center gap-2">
              <span>🎒</span> {isEditing ? "Owah Data Item" : "Tambah Item Anyar"}
            </h2>

            {modalError && (
              <div className="mb-4 p-2.5 bg-red-950/80 border border-red-700 text-red-200 text-xs rounded">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmitItem} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Kode Item (Kudu Unik, Huruf Cilik)
                </label>
                <input
                  type="text"
                  required
                  disabled={isEditing}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Tuladha: wadung"
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded text-stone-100 text-sm focus:outline-none focus:border-yellow-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Jeneng Item
                </label>
                <input
                  type="text"
                  required
                  value={namaItem}
                  onChange={(e) => setNamaItem(e.target.value)}
                  placeholder="Tuladha: Wadung (Kapak)"
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded text-stone-100 text-sm focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Katrangan (Deskripsi)
                </label>
                <textarea
                  rows={3}
                  required
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Katrangan gunane piranti ing njero crita..."
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded text-stone-100 text-sm focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  URL Ikon / Gambar
                </label>
                <input
                  type="text"
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                  placeholder="/sprites/wadung.png"
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded text-stone-100 text-sm focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-stone-950 font-bold text-sm rounded-lg transition disabled:opacity-50"
                >
                  {submitting ? "Nyimpen..." : "Simpen Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
