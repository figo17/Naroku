"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const initialRole = searchParams.get("role") || "murid";
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [namaLengkap, setNamaLengkap] = useState("");
  const [nomorInduk, setNomorInduk] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam) {
      setSelectedRole(roleParam);
    }
  }, [searchParams]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (isRegister) {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        if (authData?.user) {
          const { error: profileError } = await supabase.from("profiles").upsert({
            id: authData.user.id,
            nama_lengkap: namaLengkap || email.split("@")[0],
            nomor_induk: nomorInduk || null,
            role: selectedRole,
            class_id: null,
          });

          if (profileError) {
            console.error("Profile error:", profileError);
          }

          setSuccessMessage("Pendaftaran kasil! Mangga mlebu nganggo akun anyar panjenengan.");
          setIsRegister(false);
        }
      } else {
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (signInError) throw signInError;

        if (signInData?.user) {
          const { data: profile, error: profileFetchError } = await supabase
            .from("profiles")
            .select("role, class_id")
            .eq("id", signInData.user.id)
            .single();

          if (profileFetchError) {
            router.push(selectedRole === "guru" ? "/guru" : "/beranda");
            return;
          }

          const userRole = profile?.role || selectedRole;

          if (userRole === "admin") {
            router.push("/admin");
          } else if (userRole === "guru") {
            router.push("/guru");
          } else {
            // Murid diarahkan ke Beranda Utama Rara Kuning
            router.push("/beranda");
          }
        }
      }
    } catch (err) {
      setErrorMessage(err.message || "Dumadi kaluputan nalika proses mlebu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ilustrasi Grojogan Rara Kuning */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/backgrounds/grojogan-rara-kuning.jpg"
          alt="Latar Belakang Grojogan Rara Kuning"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Soft Vignette & Dark Overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/50 to-stone-950/70" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-stone-950/85 border-2 border-yellow-500/60 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md">
        {/* Header Visual */}
        <div className="text-center mb-5">
          <div className="inline-block px-3 py-1 border-b-2 border-yellow-500 mb-2">
            <span className="text-[11px] uppercase tracking-widest text-yellow-500 font-semibold">
              Media Pasinaon Basa Jawa
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-amber-100 tracking-wide drop-shadow-md">
            Haroku Adventure
          </h1>
          <p className="text-xs text-stone-300 mt-1 italic font-serif">
            &quot;Mula Bukan Grojogan Rara Kuning&quot;
          </p>
        </div>

        {/* Selected Role Graphic Banner */}
        <div className="mb-5 flex flex-col items-center">
          <div className="text-xs text-amber-300/80 mb-2 font-medium">Pilih Mode Mlebu:</div>
          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              type="button"
              onClick={() => setSelectedRole("murid")}
              className={`relative h-14 rounded-xl border-2 overflow-hidden transition-all duration-200 ${
                selectedRole === "murid"
                  ? "border-yellow-400 ring-2 ring-yellow-400/50 shadow-lg scale-[1.02]"
                  : "border-stone-700 opacity-60 hover:opacity-90"
              }`}
            >
              <Image
                src="/assets/buttons/btn-login-siswa.png"
                alt="Login Minangka Siswa"
                fill
                sizes="200px"
                className="object-cover object-center"
              />
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole("guru")}
              className={`relative h-14 rounded-xl border-2 overflow-hidden transition-all duration-200 ${
                selectedRole === "guru"
                  ? "border-yellow-400 ring-2 ring-yellow-400/50 shadow-lg scale-[1.02]"
                  : "border-stone-700 opacity-60 hover:opacity-90"
              }`}
            >
              <Image
                src="/assets/buttons/btn-login-guru-clean.png"
                alt="Login Minangka Guru"
                fill
                sizes="200px"
                className="object-cover object-center"
              />
            </button>
          </div>
        </div>

        {/* Tab Toggle Login / Register */}
        <div className="flex border-b border-stone-700 mb-5">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className={`flex-1 py-2 text-center text-sm font-semibold transition-colors duration-200 ${
              !isRegister
                ? "text-yellow-400 border-b-2 border-yellow-500 bg-amber-950/40"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            Mlebu (Login)
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className={`flex-1 py-2 text-center text-sm font-semibold transition-colors duration-200 ${
              isRegister
                ? "text-yellow-400 border-b-2 border-yellow-500 bg-amber-950/40"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            Daftar Akun
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-700 text-red-200 text-xs sm:text-sm rounded-lg flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs sm:text-sm rounded-lg flex items-center gap-2">
            <span>✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-3.5">
          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Jeneng Lengkap (Nama Lengkap)
                </label>
                <input
                  type="text"
                  required
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  placeholder="Tuladha: Dewi Kilisuci"
                  className="w-full px-3 py-2 bg-stone-900/90 border border-stone-700 rounded-lg text-stone-100 text-sm placeholder-stone-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  {selectedRole === "guru" ? "Nomor Induk Pegawai (NIP)" : "Nomor Induk Siswa (NIS)"}
                </label>
                <input
                  type="text"
                  value={nomorInduk}
                  onChange={(e) => setNomorInduk(e.target.value)}
                  placeholder={selectedRole === "guru" ? "Tuladha: 1985..." : "Tuladha: 12345"}
                  className="w-full px-3 py-2 bg-stone-900/90 border border-stone-700 rounded-lg text-stone-100 text-sm placeholder-stone-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Surat Elektronik (Email)
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@gmail.com"
              className="w-full px-3 py-2 bg-stone-900/90 border border-stone-700 rounded-lg text-stone-100 text-sm placeholder-stone-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Tembung Sandi (Password)
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-stone-900/90 border border-stone-700 rounded-lg text-stone-100 text-sm placeholder-stone-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-700 hover:from-amber-600 hover:to-yellow-500 text-stone-950 font-black border-2 border-yellow-400 rounded-xl shadow-lg transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wide uppercase text-sm"
          >
            {loading ? (
              <span className="inline-block animate-pulse">Sedang diproses...</span>
            ) : isRegister ? (
              `Daftar Minangka ${selectedRole === "guru" ? "Guru" : "Siswa"}`
            ) : (
              `Mlebu Minangka ${selectedRole === "guru" ? "Guru" : "Siswa"}`
            )}
          </button>
        </form>

        <div className="mt-5 pt-3 border-t border-stone-800 text-center">
          <p className="text-[11px] text-stone-400">
            Aplikasi Sinau Carita Rakyat Jawa Kanthi Petualangan
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-950 flex items-center justify-center text-yellow-400">Memuat...</div>}>
      <LoginForm />
    </Suspense>
  );
}
