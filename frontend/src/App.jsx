import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import ScanPage        from './pages/ScanPage';
import ShopFloor       from './pages/ShopFloor';
import AdminDashboard  from './pages/AdminDashboard';
import ReportPage      from './pages/ReportPage';

// Component สำหรับ Navigation Bar โดยเฉพาะ
function Navigation() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  // Helper สำหรับจัดสไตล์ปุ่มเมนู
  const navItemClass = (path) => `
    flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all font-medium text-sm whitespace-nowrap
    ${isActive(path)
      ? 'bg-blue-600 text-white shadow-md'
      : 'text-gray-300 hover:bg-gray-800 hover:text-white'}
  `;

  return (
    <nav className="bg-gray-900 text-white p-3 shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 overflow-x-auto hide-scrollbar">

        {/* Logo */}
        <div className="flex items-center gap-2 font-black text-xl tracking-tight text-white flex-shrink-0 mr-2 sm:mr-4">
          <span className="text-blue-500">Lite</span>MES
        </div>

        {/* Menu Items */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* ── กลุ่ม Operator ── */}
          <div className="flex gap-1 bg-gray-800/50 p-1 rounded-2xl border border-gray-700/50">
            <Link to="/" className={navItemClass('/')}>
              <span className="text-lg">🏠</span>
              <span className="hidden sm:inline">หน้าหลัก</span>
            </Link>
            <Link to="/scan" className={navItemClass('/scan')}>
              <span className="text-lg">📷</span>
              <span className="hidden sm:inline">สแกนทำงาน</span>
            </Link>
          </div>

          {/* ตัวคั่นกลาง (แสดงเฉพาะจอกว้าง) */}
          <div className="w-px h-6 bg-gray-700 mx-1 hidden sm:block"></div>

          {/* ── กลุ่ม Management ── */}
          <div className="flex gap-1">
            <Link to="/report" className={navItemClass('/report')}>
              <span className="text-lg">📊</span>
              <span className="hidden sm:inline">รายงาน</span>
            </Link>
            <Link to="/admin" className={navItemClass('/admin')}>
              <span className="text-lg">⚙️</span>
              <span className="hidden sm:inline">จัดการระบบ</span>
            </Link>
          </div>
        </div>

      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/"       element={<ShopFloor />} />
        <Route path="/scan"   element={<ScanPage />} />
        <Route path="/admin"  element={<AdminDashboard />} />
        <Route path="/report" element={<ReportPage />} />
      </Routes>
    </BrowserRouter>
  );
}
