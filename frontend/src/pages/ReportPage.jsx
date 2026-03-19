import { useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getLines, getLogs, getLogsSummary, getProcesses } from "../api/client";
import AdminShell from "../components/admin/AdminShell";
import { ErrorState, LoadingState } from "../components/admin/AdminUI";
import {
  getReportViewState,
  normalizeReportSearch,
  REPORT_MENUS,
} from "../features/report/reportQueryState";
import useAsyncData from "../hooks/useAsyncData";
import ProcessReportPanel from "../components/report/ProcessReportPanel";
import TrayReportPanel from "../components/report/TrayReportPanel";
import {
  DEFAULT_REPORT_TAB,
  createReportSearch,
} from "../components/report/reportShared";

export default function ReportPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeTab, search, status } = getReportViewState(searchParams);

  const loadData = useCallback(async () => {
    const [summaryData, logsData, processesData, linesData] = await Promise.all(
      [getLogsSummary(), getLogs({ limit: 2000 }), getProcesses(), getLines()],
    );

    return {
      summaryData,
      logsData,
      processesData,
      linesData,
    };
  }, []);

  const { data, loading, error, reload } = useAsyncData(loadData, {
    initialData: {
      summaryData: [],
      logsData: [],
      processesData: [],
      linesData: [],
    },
    getErrorMessage: (err) => err?.message || "โหลดข้อมูลรายงานไม่สำเร็จ",
  });

  const { summaryData, logsData, processesData, linesData } = data;

  useEffect(() => {
    const currentTab = searchParams.get("tab");
    const currentStatus = searchParams.get("status") || "all";

    if (currentTab !== activeTab || currentStatus !== status) {
      setSearchParams(normalizeReportSearch(searchParams), { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams, status]);

  const handleTabChange = (tabId) => {
    setSearchParams(
      createReportSearch({ tab: tabId, search: "", status: "all" }),
    );
  };

  const handleSearchChange = (value) => {
    setSearchParams(
      createReportSearch({
        tab: activeTab || DEFAULT_REPORT_TAB,
        search: value,
        status,
      }),
      { replace: true },
    );
  };

  const handleStatusChange = (value) => {
    setSearchParams(
      createReportSearch({
        tab: activeTab || DEFAULT_REPORT_TAB,
        search,
        status: value,
      }),
      { replace: true },
    );
  };

  let content;
  if (loading) {
    content = <LoadingState message="กำลังรวบรวมข้อมูลรายงาน..." />;
  } else if (error) {
    content = <ErrorState message={error} onRetry={reload} />;
  } else if (activeTab === "trays") {
    content = (
      <TrayReportPanel
        data={summaryData}
        logs={logsData}
        search={search}
        statusFilter={status}
        onSearch={handleSearchChange}
        onStatusChange={handleStatusChange}
      />
    );
  } else if (activeTab === "processes") {
    content = (
      <ProcessReportPanel
        logs={logsData}
        processes={processesData}
        lines={linesData}
        search={search}
        onSearch={handleSearchChange}
      />
    );
  } else {
    content = (
      <ProcessReportPanel
        logs={logsData}
        processes={processesData}
        lines={linesData}
        search={search}
        onSearch={handleSearchChange}
      />
    );
  }

  return (
    <AdminShell
      title="รายงาน"
      menus={REPORT_MENUS}
      activeMenu={activeTab}
      onMenuChange={handleTabChange}
    >
      {content}
    </AdminShell>
  );
}
