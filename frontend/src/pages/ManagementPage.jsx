import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { getLines } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import AdminShell from "../components/admin/AdminShell";
import LinesSection from "../components/admin/LinesSection";
import TraysSection from "../components/admin/TraysSection";
import UsersSection from "../components/admin/UsersSection";
import { ADMIN_MENUS } from "../features/admin/adminMenus";
import {
  createAdminSearch,
  getAdminViewState,
  normalizeAdminSearch,
} from "../features/admin/adminQueryState";
import useAsyncData from "../hooks/useAsyncData";

export default function ManagementPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const { activeMenu, detailMode, detailId, detailSubId } =
    getAdminViewState(searchParams);

  const {
    data: lines,
    loading: linesLoading,
    error: linesError,
    reload: loadLines,
  } = useAsyncData(
    useMemo(() => () => getLines(), []),
    {
      initialData: [],
      getErrorMessage: (err) => err?.message || "โหลดข้อมูลสายการผลิตไม่สำเร็จ",
    },
  );

  useEffect(() => {
    const currentTab = searchParams.get("tab");

    if (currentTab !== activeMenu) {
      setSearchParams(normalizeAdminSearch(searchParams), { replace: true });
    }
  }, [activeMenu, searchParams, setSearchParams]);

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
      menus={ADMIN_MENUS}
      activeMenu={activeMenu}
      onMenuChange={(tabId) => updateAdminView({ tab: tabId })}
    >
      {currentSection}
    </AdminShell>
  );
}
