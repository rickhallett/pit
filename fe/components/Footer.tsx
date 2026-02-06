export default function Footer() {
  return (
    <footer className="border-t-4 border-white bg-black py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 border-2 border-accent bg-accent"></div>
            <span className="text-sm font-black uppercase tracking-tighter text-white">
              The Pit
            </span>
          </div>
          <p className="text-center text-sm text-zinc-400">
            © 2025 The Pit. All ideas enter. Only one survives.
          </p>
          <div className="flex gap-4">
            <a
              href="#"
              className="text-sm font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:text-accent"
            >
              Twitter
            </a>
            <a
              href="#"
              className="text-sm font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:text-accent"
            >
              Discord
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
