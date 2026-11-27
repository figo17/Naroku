"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function GuruLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace("/login");
          return;
        }

        const { data: userProfile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError || !userProfile || userProfile.role !== "guru") {
          // If not guru, kick back to login or appropriate screen
          router.replace("/login");
          return;
        }

        setProfile(userProfile);
      } catch (err) {
        console.error("Auth check error:", err);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router, supabase]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/guru", icon: "📊" },
    { label: "Rekap Level 1", href: "/guru/rekap-level1", icon: "👥" },
    { label: "Rekap Level 2", href: "/guru/rekap-level2", icon: "🌿" },
    { label: "Rekap Level 3", href: "/guru/rekap-level3", icon: "✍️" },
    { label: "Galeri Apresiasi", href: "/level3/apresiasi", icon: "🏆" },
    { label: "Kelas Saya", href: "/guru/kelas", icon: "🏫" },
    { label: "Bank Soal", href: "/guru/quizzes", icon: "📝" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center text-stone-100">
        <div className="w-12 h-12 border-4 border-amber-600 border-t-amber-400 rounded-full animate-spin mb-4"></div>
        <p className="font-serif tracking-widest text-amber-200">Memuat Portal Guru...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-amber-950 border-b border-amber-800">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">⚔️</span>
          <span className="font-serif font-bold text-lg text-yellow-500 tracking-wider">HAROKU GURU</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded bg-amber-900 text-stone-200 hover:bg-amber-800 focus:outline-none"
        >
          {sidebarOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-amber-950/95 border-r border-amber-800 flex flex-col justify-between transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Logo / Title */}
          <div className="p-6 border-b border-amber-800/80 hidden md:block">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">📜</span>
              <div>
                <h1 className="font-serif font-black text-xl text-yellow-500 tracking-wider">HAROKU</h1>
                <p className="text-xs text-amber-300/80 font-mono tracking-widest uppercase">Portal Guru</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-amber-800 text-yellow-400 border border-amber-600 shadow-md"
                      : "text-stone-300 hover:bg-amber-900/60 hover:text-white"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-amber-800/80 bg-amber-950/60">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-amber-800 border-2 border-yellow-500/70 flex items-center justify-center font-bold text-yellow-300">
              {profile?.nama_lengkap ? profile.nama_lengkap.charAt(0).toUpperCase() : "G"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-stone-100 truncate">
                {profile?.nama_lengkap || "Guru"}
              </p>
              <p className="text-xs text-amber-400 font-mono truncate">
                NIP: {profile?.nomor_induk || "-"}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-red-200 bg-red-950/60 hover:bg-red-900 border border-red-800 rounded-lg transition"
          >
            <span>🚪</span>
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-stone-900 overflow-y-auto min-h-screen">
        {/* Top bar on desktop */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-stone-950/70 border-b border-amber-900/40 backdrop-blur">
          <div>
            <h2 className="text-lg font-serif font-bold text-amber-200">
              Wilujeng Sumping, {profile?.nama_lengkap || "Guru"}
            </h2>
            <p className="text-xs text-stone-400">Selamat datang di Panel Manajemen Pembelajaran Haroku</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
              Role: Guru Pengajar
            </span>
          </div>
        </header>

        {/* Page children */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
