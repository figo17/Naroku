export const metadata = {
  title: 'Haroku Adventure - Petualangan 2D Dewi Kilisuci',
  description: 'Media pembelajaran interaktif cerita rakyat Mula Bukan Grojogan Rara Kuning berbasis 2D Top-Down RPG Grid',
};

export default function GameLayout({ children }) {
  return (
    <div className="w-screen h-screen overflow-hidden bg-stone-950 text-stone-100 select-none flex flex-col relative font-sans">
      {children}
    </div>
  );
}
