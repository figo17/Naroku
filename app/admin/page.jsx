import { createClient } from "@/lib/supabase/server";

export const revalidate = 0; // Dynamic server component

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // 1. Fetch user counts by role
  let totalAdmin = 0;
  let totalGuru = 0;
  let totalMurid = 0;

  try {
    const { data: profiles } = await supabase.from("profiles").select("role");
    if (profiles) {
      profiles.forEach((p) => {
        if (p.role === "admin") totalAdmin++;
        else if (p.role === "guru") totalGuru++;
        else if (p.role === "murid") totalMurid++;
      });
    }
  } catch (err) {
    console.error("Error fetching profiles:", err);
  }

  // 2. Fetch class count
  let totalClasses = 0;
  try {
    const { count } = await supabase
      .from("classes")
      .select("*", { count: "exact", head: true });
    totalClasses = count || 0;
  } catch (err) {
    console.error("Error fetching classes:", err);
  }

  // 3. Fetch quizzes count
  let totalQuizzes = 0;
  try {
    const { count } = await supabase
      .from("quizzes")
      .select("*", { count: "exact", head: true });
    totalQuizzes = count || 0;
  } catch (err) {
    console.error("Error fetching quizzes:", err);
  }

  // 4. Fetch items count
  let totalItems = 0;
  try {
    const { count } = await supabase
      .from("items")
      .select("*", { count: "exact", head: true });
    totalItems = count || 0;
  } catch (err) {
    console.error("Error fetching items:", err);
  }

  const statCards = [
    {
      title: "Gunggung Murid (Siswa)",
      value: totalMurid,
      icon: "🎓",
      desc: "Pemain petualangan aktif",
      color: "border-amber-700 bg-stone-900",
      accent: "text-yellow-400",
    },
    {
      title: "Gunggung Guru",
      value: totalGuru,
      icon: "🧑‍🏫",
      desc: "Pamong kelas & panuntun",
      color: "border-emerald-700 bg-stone-900",
      accent: "text-emerald-400",
    },
    {
      title: "Gunggung Kelas",
      value: totalClasses,
      icon: "🏫",
      desc: "Kamar pasinaon terdaftar",
      color: "border-blue-700 bg-stone-900",
      accent: "text-blue-400",
    },
    {
      title: "Bank Soal (Garapan)",
      value: totalQuizzes,
      icon: "📝",
      desc: "Pitakon evaluasi babak",
      color: "border-purple-700 bg-stone-900",
      accent: "text-purple-400",
    },
    {
      title: "Barang Game (Items)",
      value: totalItems,
      icon: "🎒",
      desc: "Pusaka & piranti crita",
      color: "border-yellow-700 bg-stone-900",
      accent: "text-yellow-500",
    },
    {
      title: "Pangarsa (Admin)",
      value: totalAdmin,
      icon: "🛡️",
      desc: "Pangatur sistem kraton",
      color: "border-stone-700 bg-stone-900",
      accent: "text-stone-300",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-stone-900 border border-yellow-600/50 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-amber-100 flex items-center gap-3">
              <span>Sugeng Rawuh ing Kraton Admin Haroku!</span> 🪓
            </h1>
            <p className="text-stone-300 text-sm mt-1 max-w-2xl leading-relaxed">
              Panel administrasi kagem nata sedaya data pangguna, kelas pasinaon, bank pitakon
              garapan, sarta piranti pusaka wonten ing cariyos Dewi Kilisuci lan Putri Rara Kuning.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-yellow-950/80 border border-yellow-600/60 text-yellow-400 text-xs font-bold rounded-full">
              Sistem Aktif
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className={`border rounded-xl p-5 shadow-md flex items-start justify-between ${card.color}`}
          >
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                {card.title}
              </p>
              <h3 className={`text-3xl font-extrabold mt-2 ${card.accent}`}>
                {card.value}
              </h3>
              <p className="text-xs text-stone-400 mt-1">{card.desc}</p>
            </div>
            <div className="text-3xl p-3 bg-stone-800/80 border border-stone-700 rounded-lg">
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-stone-900 border border-amber-900/60 rounded-xl p-5">
          <h2 className="text-lg font-bold text-yellow-400 mb-2 flex items-center gap-2">
            <span>📜</span> Pedoman Akses Admin
          </h2>
          <ul className="text-sm text-stone-300 space-y-2 list-disc list-inside">
            <li>
              Pangarsa saget ngowahi hak akses (Role) pangguna dados Admin, Guru, utawi Murid.
            </li>
            <li>
              Sedaya kelas saking sedaya bapak/ibu guru saget dipun-kontrol utawi dipun-busek saking panel punika.
            </li>
            <li>
              Priksa master items kagem mesthekaken piranti kados ta <em>wadung</em>, <em>racikan_obat</em>, lan <em>kembang</em> sampun cumepak kagem petualangan.
            </li>
          </ul>
        </div>

        <div className="bg-stone-900 border border-amber-900/60 rounded-xl p-5">
          <h2 className="text-lg font-bold text-emerald-400 mb-2 flex items-center gap-2">
            <span>⚙️</span> Kahanan Server & Basis Data
          </h2>
          <div className="text-sm text-stone-300 space-y-2">
            <p className="flex justify-between border-b border-stone-800 pb-1">
              <span>Database Provider:</span>
              <span className="font-semibold text-stone-200">Supabase (PostgreSQL)</span>
            </p>
            <p className="flex justify-between border-b border-stone-800 pb-1">
              <span>Arsitektur:</span>
              <span className="font-semibold text-stone-200">Next.js App Router (SSR + Client)</span>
            </p>
            <p className="flex justify-between">
              <span>Status Keep-Alive Cron:</span>
              <span className="text-emerald-400 font-semibold">Tansah Siap (/api/keep-alive)</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
