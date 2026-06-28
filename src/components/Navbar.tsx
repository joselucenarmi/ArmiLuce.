import { Link } from 'react-router-dom';

export function Navbar() {
  return (
    <nav aria-label="Navigation" className="flex items-center justify-center lg:hidden py-3">
      <Link
        to="/dashboard"
        className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl text-white text-sm font-medium transition-colors"
      >
        Ir a Dashboard
      </Link>
    </nav>

  );
}
