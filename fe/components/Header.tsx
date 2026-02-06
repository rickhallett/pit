export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b-4 border-white bg-black">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 border-2 border-accent bg-accent"></div>
            <h1 className="text-xl font-black tracking-tighter text-white">
              THE PIT
            </h1>
          </div>
          <nav className="hidden gap-6 md:flex">
            <a
              href="#how"
              className="text-sm font-bold uppercase tracking-wider text-white transition-colors hover:text-accent"
            >
              How it works
            </a>
            <a
              href="#arena"
              className="text-sm font-bold uppercase tracking-wider text-white transition-colors hover:text-accent"
            >
              Arena
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
