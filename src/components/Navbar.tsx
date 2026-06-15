import { Link } from 'react-router-dom';

export function Navbar() {
  return (
    <nav className="hidden" aria-label="Navigation">
      <Link to="/dashboard" className="sr-only">
        Dashboard
      </Link>
    </nav>
  );
}
