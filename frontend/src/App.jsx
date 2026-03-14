import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ScanPage        from './pages/ScanPage';
import ShopFloor       from './pages/ShopFloor';
import AdminDashboard  from './pages/AdminDashboard';
import ReportPage      from './pages/ReportPage';

export default function App() {
  return (
    <BrowserRouter>
      <nav className="bg-gray-900 text-white px-4 py-3 flex gap-4 items-center text-sm font-medium">
        <span className="font-bold text-lg mr-2">Lite MES</span>
        <Link to="/"         className="hover:text-green-400 transition-colors">Shop Floor</Link>
        <Link to="/scan"     className="hover:text-green-400 transition-colors">Scan QR</Link>
        <Link to="/admin"    className="hover:text-green-400 transition-colors">Admin</Link>
        <Link to="/report"   className="hover:text-green-400 transition-colors">Report</Link>
      </nav>

      <Routes>
        <Route path="/"       element={<ShopFloor />} />
        <Route path="/scan"   element={<ScanPage />} />
        <Route path="/admin"  element={<AdminDashboard />} />
        <Route path="/report" element={<ReportPage />} />
      </Routes>
    </BrowserRouter>
  );
}
