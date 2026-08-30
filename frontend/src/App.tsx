import { BrowserRouter, Routes, Route, NavLink, Link } from 'react-router-dom';
import Landing from './pages/Landing';
import SubmitClaim from './pages/SubmitClaim';
import Dashboard from './pages/Dashboard';
import Verify from './pages/Verify';
import DeployContract from './pages/DeployContract';

function Nav() {
  const link = ({ isActive }: { isActive: boolean }) => ({
    padding: '8px 4px',
    fontSize: 14,
    fontWeight: 500,
    color: isActive ? 'var(--color-accent)' : 'var(--color-ink-muted)',
    borderBottom: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
  });
  return (
    <nav
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
        }}
      >
        <Link
          to="/"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--color-ink)',
          }}
        >
          Redress
        </Link>
        <div style={{ display: 'flex', gap: 24 }}>
          <NavLink to="/submit" style={link}>
            Submit Claim
          </NavLink>
          <NavLink to="/dashboard" style={link}>
            Dashboard
          </NavLink>
          <NavLink to="/verify" style={link}>
            Verify
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/submit" element={<SubmitClaim />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/deploy" element={<DeployContract />} />
      </Routes>
    </BrowserRouter>
  );
}
