"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminUsersPage() {
  const supabase = createClient();

  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createNama, setCreateNama] = useState("");
  const [createNomorInduk, setCreateNomorInduk] = useState("");
  const [createRole, setCreateRole] = useState("murid");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch classes to map class_id -> nama_kelas
      const { data: classList } = await supabase
        .from("classes")
        .select("id, nama_kelas");

      const classMap = {};
      if (classList) {
        classList.forEach((c) => {
          classMap[c.id] = c.nama_kelas;
        });
      }
      setClasses(classMap);

      // 2. Fetch profiles
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, nama_lengkap, nomor_induk, role, class_id, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(profiles || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Change Role
  const handleRoleChange = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setActionSuccess("Role pangguna kasil diowahi!");
      setTimeout(() => setActionSuccess(""), 3000);
    } catch (err) {
      alert("Gagal ngowahi role: " + err.message);
    }
  };

  // Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError("");

    try {
      // Create user in auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: createEmail,
        password: createPassword,
      });

      if (signUpError) throw signUpError;

      if (authData?.user) {
        // Upsert profile
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: authData.user.id,
          nama_lengkap: createNama,
          nomor_induk: createNomorInduk || null,
          role: createRole,
          class_id: null,
        });

        if (profileError) throw profileError;

        setIsModalOpen(false);
        setCreateEmail("");
        setCreatePassword("");
        setCreateNama("");
        setCreateNomorInduk("");
        setCreateRole("murid");

        setActionSuccess("Pangguna anyar kasil kadhaftaraken!");
        setTimeout(() => setActionSuccess(""), 3000);
        fetchData();
      }
    } catch (err) {
      setModalError(err.message || "Gagal nambahaken pangguna");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter & Search
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.nama_lengkap?.toLowerCase().includes(search.toLowerCase()) ||
        u.nomor_induk?.toLowerCase().includes(search.toLowerCase()) ||
        u.id?.toLowerCase().includes(search.toLowerCase());

      const matchRole = roleFilter === "all" || u.role === roleFilter;

      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-amber-100 flex items-center gap-2">
            <span>👥</span> Manajemen Pangguna (Users)
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Nata akun pangguna, ngowahi hak akses (role), lan ngatur pendaftaran anyar.
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setModalError("");
          }}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-stone-950 font-bold rounded-lg shadow-md transition flex items-center justify-center gap-2 text-sm"
        >
          <span>➕</span> Tambah Pangguna Anyar
        </button>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-sm rounded-lg flex items-center gap-2">
          <span>✓</span>
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-stone-900 border border-amber-900/60 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Goleki jeneng utawa nomor induk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-stone-200 placeholder-stone-500 text-sm focus:outline-none focus:border-yellow-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-stone-400 font-semibold whitespace-nowrap">
            Filter Role:
          </label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-stone-200 text-sm focus:outline-none focus:border-yellow-500"
          >
            <option value="all">Kabeh Role (All)</option>
            <option value="admin">Admin</option>
            <option value="guru">Guru</option>
            <option value="murid">Murid</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-stone-900 border border-amber-900/60 rounded-xl overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-300">
            <thead className="bg-stone-800/80 text-yellow-500 uppercase text-xs font-semibold border-b border-amber-900/40">
              <tr>
                <th className="py-3 px-4">Jeneng Lengkap</th>
                <th className="py-3 px-4">No. Induk (NIS/NIP)</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Hak Akses (Role)</th>
                <th className="py-3 px-4">Owah Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-stone-500">
                    Ngunggah data pangguna...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-stone-500">
                    Ora ana data pangguna sing cocog.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-stone-800/40 transition">
                    <td className="py-3 px-4 font-medium text-stone-100">
                      {user.nama_lengkap || "-"}
                    </td>
                    <td className="py-3 px-4 text-stone-400">
                      {user.nomor_induk || "-"}
                    </td>
                    <td className="py-3 px-4">
                      {user.class_id && classes[user.class_id] ? (
                        <span className="px-2 py-0.5 bg-blue-950/70 border border-blue-800 text-blue-300 rounded text-xs font-medium">
                          {classes[user.class_id]}
                        </span>
                      ) : (
                        <span className="text-stone-500 text-xs italic">
                          Dereng mlebet
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                          user.role === "admin"
                            ? "bg-purple-950/80 border-purple-700 text-purple-300"
                            : user.role === "guru"
                            ? "bg-emerald-950/80 border-emerald-700 text-emerald-300"
                            : "bg-amber-950/80 border-yellow-700 text-yellow-300"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="px-2 py-1 bg-stone-800 border border-stone-700 rounded text-xs text-stone-200 focus:outline-none focus:border-yellow-500"
                      >
                        <option value="admin">Admin</option>
                        <option value="guru">Guru</option>
                        <option value="murid">Murid</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-stone-900 border-2 border-yellow-600/70 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <h2 className="text-lg font-bold text-amber-100 mb-4 flex items-center gap-2">
              <span>👤</span> Tambah Akun Pangguna Anyar
            </h2>

            {modalError && (
              <div className="mb-4 p-2.5 bg-red-950/80 border border-red-700 text-red-200 text-xs rounded">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Jeneng Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={createNama}
                  onChange={(e) => setCreateNama(e.target.value)}
                  placeholder="Tuladha: Raden Danang"
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded text-stone-100 text-sm focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Nomor Induk (NIS / NIP)
                </label>
                <input
                  type="text"
                  value={createNomorInduk}
                  onChange={(e) => setCreateNomorInduk(e.target.value)}
                  placeholder="Tuladha: 198501..."
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded text-stone-100 text-sm focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Email Akun
                </label>
                <input
                  type="email"
                  required
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="user@sekolah.sch.id"
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded text-stone-100 text-sm focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="Min. 6 karakter"
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded text-stone-100 text-sm focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Hak Akses (Role)
                </label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded text-stone-100 text-sm focus:outline-none focus:border-yellow-500"
                >
                  <option value="murid">Murid (Siswa)</option>
                  <option value="guru">Guru (Pamong)</option>
                  <option value="admin">Admin (Pangarsa)</option>
                </select>
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
                  {submitting ? "Nyimpen..." : "Simpen Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
