import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  AdminPageHeader,
  Button,
  MobileCard,
  Stack,
} from "../components/admin/AdminUI";

const roleLabelMap = {
  operator: "พนักงาน",
  viewer: "ดูรายงาน",
  admin: "แอดมิน",
  superadmin: "ซูเปอร์แอดมิน",
};

const roleBadgeColor = {
  operator: "bg-success-500/20 text-success-400 border-success-500/30",
  viewer: "bg-info-500/20 text-info-400 border-info-500/30",
  admin: "bg-warning-500/20 text-warning-400 border-warning-500/30",
  superadmin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function UserProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const canManage = ["admin", "superadmin"].includes(user.role);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const infoItems = [
    {
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
          />
        </svg>
      ),
      label: "รหัสพนักงาน",
      value: user.employee_id,
    },
    {
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
      label: "ชื่อผู้ใช้",
      value: user.name,
    },
    {
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
      label: "สิทธิ์",
      value: (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${roleBadgeColor[user.role] || "bg-neutral-500/20 text-neutral-400 border-neutral-500/30"}`}
        >
          {roleLabelMap[user.role] || user.role}
        </span>
      ),
    },
  ];

  // เพิ่ม operator info ถ้ามี
  if (user.operator_name) {
    infoItems.push({
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      label: "ชื่อพนักงาน",
      value: user.operator_name,
    });
  }

  if (user.operator_department) {
    infoItems.push({
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
      label: "แผนก",
      value: user.operator_department,
    });
  }

  if (user.last_login_at) {
    infoItems.push({
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      label: "เข้าใช้ล่าสุด",
      value: formatDate(user.last_login_at),
    });
  }

  if (user.created_at) {
    infoItems.push({
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      label: "สร้างบัญชี",
      value: formatDate(user.created_at),
    });
  }

  return (
    <main className="min-h-screen bg-white pb-24 md:pb-8">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-3 py-2.5 sm:px-6 sm:py-4 md:px-8 md:py-6">
        <AdminPageHeader title="โปรไฟล์ผู้ใช้" />

        <MobileCard className="overflow-hidden p-0">
          <div className="border-b border-neutral-100 bg-neutral-50 px-5 py-4">
            <h2 className="mt-1 text-lg font-bold tracking-[-0.02em] text-neutral-900">
              ข้อมูลผู้ใช้
            </h2>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-600 text-3xl font-black text-white shadow-sm">
                <span className="select-none">
                  {(user.name || "?").charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-xl font-black tracking-tight text-neutral-900">
                  {user.name}
                </h1>
                <p className="mt-1 font-mono text-sm text-neutral-500">
                  {user.employee_id || "ไม่มีรหัส"}
                </p>
                <div className="mt-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${roleBadgeColor[user.role] || "bg-neutral-100 text-neutral-500 border-neutral-200"}`}
                  >
                    {roleLabelMap[user.role] || user.role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </MobileCard>

        <MobileCard className="overflow-hidden p-0">
          <div className="border-b border-neutral-100 px-4 py-3.5 sm:px-5 sm:py-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-neutral-500">
              <svg
                className="w-4 h-4 text-primary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              ข้อมูลบัญชี
            </h2>
          </div>

          <div className="divide-y divide-neutral-100">
            {infoItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-neutral-50 sm:gap-4 sm:px-5 sm:py-4"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-primary-500 sm:h-10 sm:w-10 sm:rounded-xl">
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-0.5 text-xs font-medium text-neutral-400 sm:text-xs">
                    {item.label}
                  </p>
                  <div className="break-words text-sm font-medium text-neutral-800">
                    {item.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </MobileCard>

        <Stack>
          {canManage ? (
            <MobileCard className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="mt-1 text-lg font-bold tracking-[-0.02em] text-neutral-900">
                    จัดการระบบ
                  </h2>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => navigate("/admin")}
                >
                  เปิดหน้า
                </Button>
              </div>
            </MobileCard>
          ) : null}

          <Button variant="danger" className="w-full" onClick={handleLogout}>
            <span className="inline-flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H9m4 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"
                />
              </svg>
              ออกจากระบบ
            </span>
          </Button>
        </Stack>
      </div>
    </main>
  );
}
