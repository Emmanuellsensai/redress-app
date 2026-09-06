import { BrowserRouter, Routes, Route, NavLink, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Landing from './pages/Landing';
import SubmitClaim from './pages/SubmitClaim';
import Dashboard from './pages/Dashboard';
import Verify from './pages/Verify';
import DeployContract from './pages/DeployContract';
import { RedressLogo } from './components/ui/RedressLogo';
import { Footer } from './components/layout/Footer';

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const link = ({ isActive }: { isActive: boolean }) => ({
    padding: '8px 4px',
    fontSize: 14,
    fontWeight: 500,
    color: isActive ? 'var(--color-accent)' : 'var(--color-ink-muted)',
    borderBottom: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
    transition: 'color 200ms ease',
  });

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: scrolled
          ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(238, 238, 255, 0.55) 100%)'
          : 'linear-gradient(180deg, rgba(251, 251, 251, 0.95), rgba(251, 251, 251, 0.8))',
        backdropFilter: 'blur(22px) saturate(180%)',
        WebkitBackdropFilter: 'blur(22px) saturate(180%)',
        borderBottom: scrolled
          ? '1px solid rgba(0, 0, 254, 0.14)'
          : '1px solid rgba(228, 228, 231, 0.6)',
        boxShadow: scrolled
          ? '0 10px 32px -20px rgba(0, 0, 254, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.75)'
          : 'inset 0 1px 0 rgba(255, 255, 255, 0.6)',
        transition:
          'background 220ms ease, border-color 220ms ease, box-shadow 220ms ease',
      }}
    >
      {/* Bottom edge highlight for the glass "cap" look */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
          background: scrolled
            ? 'linear-gradient(90deg, rgba(0, 0, 254, 0) 0%, rgba(0, 0, 254, 0.35) 50%, rgba(0, 0, 254, 0) 100%)'
            : 'transparent',
          transition: 'background 220ms ease',
          pointerEvents: 'none',
        }}
      />

      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 68,
        }}
      >
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--color-ink)',
            letterSpacing: '-0.01em',
          }}
        >
          <RedressLogo size={30} />
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
      <Footer />
    </BrowserRouter>
  );
}
