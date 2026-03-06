import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { JudgePage } from "./pages/judge-page";
import { ProofPage } from "./pages/proof-page";
import { SmallvillePage } from "./pages/smallville-page";

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink to={to} className={({ isActive }) => (isActive ? "nav-link nav-link-active" : "nav-link")}>
      {label}
    </NavLink>
  );
}

export function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>CityChain Judge Console</h1>
          <p>Build Games mirror demo surface (CityChain-only)</p>
        </div>
        <nav className="nav-row" aria-label="CityChain routes">
          <NavItem to="/citychain/smallville" label="Smallville" />
          <NavItem to="/citychain/judge" label="Judge" />
          <NavItem to="/citychain/proof" label="Proof" />
        </nav>
      </header>

      <main className="content">
        <Routes>
          <Route path="/citychain/smallville" element={<SmallvillePage />} />
          <Route path="/citychain/judge" element={<JudgePage />} />
          <Route path="/citychain/proof" element={<ProofPage />} />
          <Route path="/citychain" element={<Navigate to="/citychain/smallville" replace />} />
          <Route path="*" element={<Navigate to="/citychain/smallville" replace />} />
        </Routes>
      </main>
    </div>
  );
}
