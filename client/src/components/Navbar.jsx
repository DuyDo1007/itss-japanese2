import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="navbar-logo-svg">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
            </svg>
          </div>
          <span className="navbar-name">
            <span className="navbar-name-jp">日本語</span>
            <span className="navbar-name-en">EdTech</span>
          </span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className={`navbar-link ${isActive('/') ? 'navbar-link--active' : ''}`}>
            Courses
          </Link>
          <Link to="/upload" className={`navbar-link ${isActive('/upload') ? 'navbar-link--active' : ''}`}>
            Upload Slide
          </Link>
          <Link to="/directory" className={`navbar-link ${isActive('/directory') ? 'navbar-link--active' : ''}`}>
            Directory
          </Link>
        </div>
      </div>
    </nav>
  );
}
