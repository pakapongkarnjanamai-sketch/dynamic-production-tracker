import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { getDefaultRouteForRole, useAuth } from './auth/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage       from './pages/LoginPage';
import ScanPage        from './pages/ScanPage';
import TrayDetailPage  from './pages/TrayDetailPage';
import HomePage        from './pages/HomePage';
import ManagementPage  from './pages/ManagementPage';
import ReportPage      from './pages/ReportPage';

// Component สำหรับ Navigation Bar โดยเฉพาะ
function Navigation() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isActive = (path) => path === '/' ? location.pathname === path : location.pathname.startsWith(path);

  if (!user || location.pathname === '/login') return null;

  const canScan = ['operator', 'admin', 'superadmin'].includes(user.role);
  const canManage = ['admin', 'superadmin'].includes(user.role);
  const canReport = ['viewer', 'admin', 'superadmin'].includes(user.role);

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
          <span className="text-blue-500">VS</span> MES
        </div>

        {/* Menu Items */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* ── กลุ่ม Operator ── */}
          {canScan && (
            <div className="flex gap-1 bg-gray-800/50 p-1 rounded-2xl border border-gray-700/50">
              <Link to="/home" className={navItemClass('/home')}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="hidden sm:inline">หน้าหลัก</span>
              </Link>
              <Link to="/scan" className={navItemClass('/scan')}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <span className="hidden sm:inline">สแกนทำงาน</span>
              </Link>
            </div>
          )}

          {/* ตัวคั่นกลาง (แสดงเฉพาะจอกว้าง) */}
          {(canManage || canReport) && <div className="w-px h-6 bg-gray-700 mx-1 hidden sm:block"></div>}

          {/* ── กลุ่ม Management ── */}
          <div className="flex gap-1 items-center">
            {canReport && (
              <Link to="/report" className={navItemClass('/report')}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="hidden sm:inline">รายงาน</span>
              </Link>
            )}
            {canManage && (
              <Link to="/admin" className={navItemClass('/admin')}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden sm:inline">จัดการระบบ</span>
              </Link>
            )}
            <button
              onClick={logout}
              aria-label="ออกจากระบบ"
              title="ออกจากระบบ"
              className="ml-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold bg-gray-800 border border-gray-700 hover:bg-gray-700 flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H9m4 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
              </svg>
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>

      </div>
    </nav>
  );
}

function RoleLanding() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Navigation />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<RoleLanding />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute allowRoles={['operator', 'admin', 'superadmin']}>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scan"
          element={
            <ProtectedRoute allowRoles={['operator', 'admin', 'superadmin']}>
              <ScanPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scan/detail"
          element={
            <ProtectedRoute allowRoles={['operator', 'admin', 'superadmin']}>
              <TrayDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowRoles={['admin', 'superadmin']}>
              <ManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report"
          element={
            <ProtectedRoute allowRoles={['viewer', 'admin', 'superadmin']}>
              <ReportPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
