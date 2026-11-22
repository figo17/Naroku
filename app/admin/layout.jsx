"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState(null);

  useEffect(() => {
    async function checkAdminAuth() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          router.replace("/login");
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, nama_lengkap, role")
          .eq("id", session.user.id)
          .single();

        if (error || !profile || profile.role !== "admin") {
          router.replace("/login");
          return;
        }

        setAdminProfile(profile);
      } catch (err) {
        console.error("Auth check failed:", err);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    checkAdminAuth();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center text-yellow-500">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-stone-300 font-serif">Mriksa Idin Akses Admin...</p>
      </div>
    );
  }

  const navLinks = [
    { label: "Dashboard", href: "/admin", icon: "🏛️" },
    { label: "Manajemen User", href: "/admin/users", icon: "👥" },
    { label: "Manajemen Kelas", href: "/admin/kelas", icon: "🏫" },
    { label: "Master Items", href: "/admin/items", icon: "🎒" },
  ];

  return (
    <div className="min-h-screen flex bg-stone-950 text-stone-100 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-stone-900 border-r border-amber-900/60 flex flex-col shrink-0">
        {/* Logo / Branding */}
        <div className="p-5 border-b border-amber-900/40 bg-stone-900/80">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👑</span>
            <div>
              <h2 className="font-extrabold text-amber-100 text-lg tracking-wide leading-tight">
                Haroku Admin
              </h2>
              <p className="text-xs text-yellow-500/80 uppercase font-semibold">
                Kraton Control
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition duration-150 ${
                  isActive
                    ? "bg-amber-900/70 text-yellow-400 border border-yellow-600/50 shadow-sm"
                    : "text-stone-300 hover:bg-stone-800/80 hover:text-stone-100"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar / App Info */}
        <div className="p-4 border-t border-amber-900/40 text-xs text-stone-400">
          Haroku Adventure v1.0
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-stone-900/90 border-b border-amber-900/50 px-6 flex items-center justify-between sticky top-0 z-20 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="text-stone-400 text-sm">Pranata /</span>
            <span className="text-yellow-500 font-medium text-sm capitalize">
              {pathname === "/admin"
                ? "Ringkasan"
                : pathname.replace("/admin/", "").replace("-", " ")}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-amber-100">
                {adminProfile?.nama_lengkap || "Pangarsa Admin"}
              </p>
              <p className="text-xs text-yellow-500 uppercase font-medium">Administrator</p>
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 text-xs font-semibold rounded transition duration-150"
            >
              Metu (Logout)
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto bg-stone-950">
          {children}
        </main>
      </div>
    </div>
  );
}
