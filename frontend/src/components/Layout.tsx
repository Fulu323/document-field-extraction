import { NavLink, Outlet } from 'react-router-dom';

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'nav-link nav-link-active' : 'nav-link';
}

export default function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-title">Document Field Extraction</div>
        <nav className="app-nav">
          <NavLink to="/upload" className={navClass}>
            Upload
          </NavLink>
          <NavLink to="/documents" className={navClass}>
            Documents
          </NavLink>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
