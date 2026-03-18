import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getLines } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import AdminShell from "../components/admin/AdminShell";
import LinesSection from "../components/admin/LinesSection";
import OperatorsSection from "../components/admin/OperatorsSection";
import TraysSection from "../components/admin/TraysSection";
import UsersSection from "../components/admin/UsersSection";

const ADMIN_TABS = ["lines", "trays", "operators", "users"];
const DEFAULT_ADMIN_TAB = "lines";

function getValidAdminTab(value) {
  return ADMIN_TABS.includes(value) ? value : DEFAULT_ADMIN_TAB;
}

function createAdminSearch({
  tab = DEFAULT_ADMIN_TAB,
  mode = "",
  id = "",
  subId = "",
}) {
  const params = new URLSearchParams();
  params.set("tab", getValidAdminTab(tab));

  if (mode) {
    params.set("mode", mode);
  }

  if (id) {
    params.set("id", String(id));
  }

  if (subId) {
    params.set("subId", String(subId));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

function FactoryIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4"
      />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
      />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5.121 17.804A9 9 0 1 1 18.88 17.8M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
      />
    </svg>
  );
}

export default function ManagementPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [lines, setLines] = useState([]);
  const [linesLoading, setLinesLoading] = useState(true);
  const [linesError, setLinesError] = useState("");

  const activeMenu = getValidAdminTab(searchParams.get("tab"));
  const detailMode = searchParams.get("mode") || "";
  const detailId = searchParams.get("id") || "";
  const detailSubId = searchParams.get("subId") || "";

  const menus = useMemo(
    () => [
      {
        id: "lines",
        label: "สายการผลิต",
        shortLabel: "ไลน์",
        icon: <FactoryIcon />,
      },
      { id: "trays", label: "งาน", shortLabel: "งาน", icon: <BoxIcon /> },
      {
        id: "operators",
        label: "พนักงาน",
        shortLabel: "ทีม",
        icon: <UsersIcon />,
      },
      {
        id: "users",
        label: "ผู้ใช้ระบบ",
        shortLabel: "บัญชี",
        icon: <AccountIcon />,
      },
    ],
    [],
  );

  const loadLines = async () => {
    try {
      setLinesError("");
      setLinesLoading(true);
      const data = await getLines();
      setLines(data);
    } catch (err) {
      setLinesError(err.message || "โหลดข้อมูลสายการผลิตไม่สำเร็จ");
    } finally {
      setLinesLoading(false);
    }
  };

  useEffect(() => {
    loadLines();
  }, []);

  useEffect(() => {
    const currentTab = searchParams.get("tab");
    const currentMode = searchParams.get("mode") || "";
    const currentId = searchParams.get("id") || "";
    const currentSubId = searchParams.get("subId") || "";
    const normalizedTab = getValidAdminTab(currentTab);

    if (currentTab !== normalizedTab) {
      setSearchParams(
        createAdminSearch({
          tab: normalizedTab,
          mode: currentMode,
          id: currentId,
          subId: currentSubId,
        }),
        { replace: true },
      );
    }
  }, [searchParams, setSearchParams]);

  const updateAdminView = ({
    tab = activeMenu,
    mode = "",
    id = "",
    subId = "",
  }) => {
    setSearchParams(createAdminSearch({ tab, mode, id, subId }));
  };

  const closeDetail = () => {
    setSearchParams(createAdminSearch({ tab: activeMenu }), { replace: true });
  };

  let currentSection;

  switch (activeMenu) {
    case "trays":
      currentSection = (
        <TraysSection
          lines={lines}
          view={detailMode}
          selectedId={detailId}
          onCreate={() => updateAdminView({ tab: "trays", mode: "create" })}
          onEdit={(trayId) =>
            updateAdminView({ tab: "trays", mode: "edit", id: trayId })
          }
          onViewLogs={(trayId) =>
            updateAdminView({ tab: "trays", mode: "logs", id: trayId })
          }
          onBackFromLogs={(trayId) =>
            updateAdminView({ tab: "trays", mode: "edit", id: trayId })
          }
          onCloseDetail={closeDetail}
        />
      );
      break;
    case "operators":
      currentSection = (
        <OperatorsSection
          view={detailMode}
          selectedId={detailId}
          onCreate={() => updateAdminView({ tab: "operators", mode: "create" })}
          onEdit={(operatorId) =>
            updateAdminView({ tab: "operators", mode: "edit", id: operatorId })
          }
          onCloseDetail={closeDetail}
        />
      );
      break;
    case "users":
      currentSection = (
        <UsersSection
          currentRole={user?.role || "admin"}
          view={detailMode}
          selectedId={detailId}
          onCreate={() => updateAdminView({ tab: "users", mode: "create" })}
          onEdit={(userId) =>
            updateAdminView({ tab: "users", mode: "edit", id: userId })
          }
          onCloseDetail={closeDetail}
        />
      );
      break;
    case "lines":
    default:
      currentSection = (
        <LinesSection
          lines={lines}
          loading={linesLoading}
          error={linesError}
          onRefresh={loadLines}
          view={detailMode}
          selectedId={detailId}
          selectedProcessId={detailSubId}
          onCreate={() => updateAdminView({ tab: "lines", mode: "create" })}
          onEdit={(lineId) =>
            updateAdminView({ tab: "lines", mode: "edit", id: lineId })
          }
          onManageProcesses={(lineId) =>
            updateAdminView({ tab: "lines", mode: "processes", id: lineId })
          }
          onBackFromProcesses={(lineId) =>
            updateAdminView({ tab: "lines", mode: "edit", id: lineId })
          }
          onCreateProcess={(lineId) =>
            updateAdminView({
              tab: "lines",
              mode: "process-create",
              id: lineId,
            })
          }
          onEditProcess={(lineId, processId) =>
            updateAdminView({
              tab: "lines",
              mode: "process-edit",
              id: lineId,
              subId: processId,
            })
          }
          onBackToProcesses={(lineId) =>
            updateAdminView({ tab: "lines", mode: "processes", id: lineId })
          }
          onCloseDetail={closeDetail}
        />
      );
      break;
  }

  return (
    <AdminShell
      title="จัดการข้อมูลระบบ"
      description="กำหนดค่าข้อมูลหลักของระบบและดูแลรายการใช้งาน"
      showPageHeader={!detailMode}
      showMobileMenu={!detailMode}
      menus={menus}
      activeMenu={activeMenu}
      onMenuChange={(tabId) => updateAdminView({ tab: tabId })}
    >
      {currentSection}
    </AdminShell>
  );
}
