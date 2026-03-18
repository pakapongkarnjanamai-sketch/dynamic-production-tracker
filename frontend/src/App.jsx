import { Suspense, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";
import { getDefaultRouteForRole, useAuth } from "./auth/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const ScanPage = lazy(() => import("./pages/ScanPage"));
const TrayDetailPage = lazy(() => import("./pages/TrayDetailPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const ManagementPage = lazy(() => import("./pages/ManagementPage"));
const ReportDetailPage = lazy(() => import("./pages/ReportDetailPage"));
const ReportPage = lazy(() => import("./pages/ReportPage"));
const EditProfilePage = lazy(() => import("./pages/EditProfilePage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));

function RouteLoadingFallback() {
  return (
    <div className="min-h-screen bg-white px-4 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-3xl rounded-[24px] border border-neutral-200 bg-neutral-50 px-6 py-12 text-center text-sm font-medium text-neutral-500 shadow-sm">
        กำลังโหลดหน้า...
      </div>
    </div>
  );
}

// Component สำหรับ Navigation Bar โดยเฉพาะ
function Navigation() {
  const { user } = useAuth();
  const location = useLocation();
  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === path;
    }

    if (path === "/scan") {
      return (
        location.pathname.startsWith("/scan") ||
        location.pathname.startsWith("/trays/")
      );
    }

    return location.pathname.startsWith(path);
  };

  if (!user || location.pathname === "/login") return null;

  const canScan = ["operator", "admin", "superadmin"].includes(user.role);
  const canReport = ["viewer", "admin", "superadmin"].includes(user.role);

  // ── Desktop nav item class ──
  const desktopNavItemClass = (path) => `
    flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all font-medium text-sm whitespace-nowrap
    ${
      isActive(path)
        ? "bg-primary-600 text-white shadow-md"
        : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
    }
  `;

  // ── Mobile bottom nav item class ──
  const mobileNavItemClass = (path) => `
    flex min-w-[48px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium whitespace-nowrap transition-all
    ${
      isActive(path)
        ? "bg-primary-600 text-white shadow-md"
        : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
    }
  `;

  return (
    <>
      {/* ══════ Desktop Top Nav Bar ══════ */}
      <nav className="sticky top-0 z-50 hidden border-b border-neutral-800 bg-neutral-900/95 p-3 text-white shadow-lg backdrop-blur md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-4">
            <div className="flex flex-shrink-0 items-center gap-2 font-black text-xl tracking-tight text-white">
              <span className="text-primary-400">VS</span> MES
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* ── กลุ่ม Operator ── */}
            {canScan && (
              <div className="flex gap-1 bg-neutral-800/50 p-1 rounded-2xl border border-neutral-700/50">
                <Link to="/home" className={desktopNavItemClass("/home")}>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  <span>หน้าหลัก</span>
                </Link>
                <Link to="/scan" className={desktopNavItemClass("/scan")}>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                  <span>สแกนทำงาน</span>
                </Link>
              </div>
            )}

            {/* ตัวคั่นกลาง */}
            {canReport && <div className="w-px h-6 bg-neutral-700 mx-1"></div>}

            {/* ── กลุ่ม Management ── */}
            <div className="flex items-center gap-1">
              {canReport && (
                <Link to="/report" className={desktopNavItemClass("/report")}>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <span>รายงาน</span>
                </Link>
              )}
              <Link
                to="/profile"
                aria-label="โปรไฟล์"
                title="โปรไฟล์"
                className="ml-1 flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-2.5 py-2 text-xs font-semibold hover:bg-neutral-700 sm:px-3"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>โปรไฟล์</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ══════ Mobile Bottom Nav Bar ══════ */}
      <nav className="fixed inset-x-0 bottom-0 z-50 bg-neutral-900 px-1 py-1.5 pb-safe text-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-around gap-0.5 overflow-x-auto hide-scrollbar">
          {canScan && (
            <>
              <Link to="/home" className={mobileNavItemClass("/home")}>
                <svg
                  className="w-5 h-5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span>หน้าหลัก</span>
              </Link>
              <Link to="/scan" className={mobileNavItemClass("/scan")}>
                <svg
                  className="w-5 h-5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
                <span>สแกนงาน</span>
              </Link>
            </>
          )}
          {canReport && (
            <Link to="/report" className={mobileNavItemClass("/report")}>
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span>รายงาน</span>
            </Link>
          )}
          <Link to="/profile" className={mobileNavItemClass("/profile")}>
            <svg
              className="w-5 h-5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span>โปรไฟล์</span>
          </Link>
        </div>
      </nav>
    </>
  );
}

function RoleLanding() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
}

export default function App() {
  return (
    <BrowserRouter
      basename={import.meta.env.BASE_URL}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Navigation />
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/" element={<RoleLanding />} />

          <Route
            path="/home"
            element={
              <ProtectedRoute allowRoles={["operator", "admin", "superadmin"]}>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scan"
            element={
              <ProtectedRoute allowRoles={["operator", "admin", "superadmin"]}>
                <ScanPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trays/:qrCode"
            element={
              <ProtectedRoute allowRoles={["operator", "admin", "superadmin"]}>
                <TrayDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowRoles={["admin", "superadmin"]}>
                <ManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report"
            element={
              <ProtectedRoute allowRoles={["viewer", "admin", "superadmin"]}>
                <ReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report/:detailType/:detailId"
            element={
              <ProtectedRoute allowRoles={["viewer", "admin", "superadmin"]}>
                <ReportDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute
                allowRoles={["operator", "viewer", "admin", "superadmin"]}
              >
                <UserProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute
                allowRoles={["operator", "viewer", "admin", "superadmin"]}
              >
                <EditProfilePage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
