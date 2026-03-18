import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button, MobileCard, Stack } from "../components/admin/AdminUI";
import { buildProfileInfoItems } from "../features/profile/profileShared";
import { AppPageShell } from "../components/layout/PageShell";

export default function UserProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const canManage = ["admin", "superadmin"].includes(user.role);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const infoItems = buildProfileInfoItems(user);

  return (
    <AppPageShell
      title="โปรไฟล์ผู้ใช้"
      maxWidth="max-w-6xl"
      className="md:pb-8"
    >
      <Stack className="gap-3 sm:gap-4">
        <MobileCard className="overflow-hidden p-0">
          <div className="border-b border-neutral-100 px-4 py-3 sm:px-5 sm:py-3.5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-500">
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

          <div className="grid divide-y divide-neutral-100 md:grid-cols-2 md:divide-x md:divide-y-0">
            {infoItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-neutral-50 sm:gap-4 sm:px-5 sm:py-3"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-primary-500 sm:h-10 sm:w-10 sm:rounded-xl">
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-0.5 text-[11px] font-medium text-neutral-400 sm:text-xs">
                    {item.label}
                  </p>
                  <div className="break-words text-sm font-medium leading-5 text-neutral-800">
                    {item.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </MobileCard>

        <MobileCard className="p-3.5 sm:p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => navigate("/profile/edit")}
            >
              แก้ไขข้อมูล
            </Button>
            {canManage ? (
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => navigate("/admin")}
              >
                จัดการระบบ
              </Button>
            ) : null}
            <Button
              variant="danger"
              className="w-full sm:w-auto"
              onClick={handleLogout}
            >
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
          </div>
        </MobileCard>
      </Stack>
    </AppPageShell>
  );
}
