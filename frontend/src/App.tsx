import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import SubmitClaim from './pages/SubmitClaim';
import Dashboard from './pages/Dashboard';
import Verify from './pages/Verify';
import DeployContract from './pages/DeployContract';

export default function App() {
  return (
    <BrowserRouter>
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
