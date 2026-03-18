import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getLines, getLogs, getLogsSummary, getProcesses } from "../api/client";
import AdminShell from "../components/admin/AdminShell";
import { ErrorState, LoadingState } from "../components/admin/AdminUI";
import OperatorReportPanel from "../components/report/OperatorReportPanel";
import ProcessReportPanel from "../components/report/ProcessReportPanel";
import TrayReportPanel from "../components/report/TrayReportPanel";
import {
  DEFAULT_REPORT_TAB,
  TABS,
  createReportSearch,
  getValidReportTab,
  getValidTrayStatusFilter,
} from "../components/report/reportShared";

export default function ReportPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [summaryData, setSummaryData] = useState([]);
  const [logsData, setLogsData] = useState([]);
  const [processesData, setProcessesData] = useState([]);
  const [linesData, setLinesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const activeTab = getValidReportTab(searchParams.get("tab"));
  const search = searchParams.get("search") || "";
  const status = getValidTrayStatusFilter(searchParams.get("status") || "all");

  const menus = useMemo(
    () =>
      TABS.map((tab) => ({
        id: tab.id,
        label: tab.label,
        shortLabel: tab.shortLabel,
        icon: tab.icon,
      })),
    [],
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [summary, logs, processes, lines] = await Promise.all([
        getLogsSummary(),
        getLogs({ limit: 2000 }),
        getProcesses(),
        getLines(),
      ]);
      setSummaryData(summary);
      setLogsData(logs);
      setProcessesData(processes);
      setLinesData(lines);
    } catch (err) {
      setError(err.message || "โหลดข้อมูลรายงานไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const currentTab = searchParams.get("tab");
    const currentSearch = searchParams.get("search") || "";
    const currentStatus = searchParams.get("status") || "all";
    const normalizedTab = getValidReportTab(currentTab);
    const normalizedStatus = getValidTrayStatusFilter(currentStatus);

    if (currentTab !== normalizedTab || currentStatus !== normalizedStatus) {
      setSearchParams(
        createReportSearch({
          tab: normalizedTab,
          search: currentSearch,
          status: normalizedStatus,
        }),
        { replace: true },
      );
    }
  }, [searchParams, setSearchParams]);

  const handleTabChange = (tabId) => {
    setSearchParams(createReportSearch({ tab: tabId, search: "", status: "all" }));
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
    content = <ErrorState message={error} onRetry={loadData} />;
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
      <OperatorReportPanel
        logs={logsData}
        search={search}
        onSearch={handleSearchChange}
      />
    );
  }

  return (
    <AdminShell
      title="รายงาน"
      menus={menus}
      activeMenu={activeTab}
      onMenuChange={handleTabChange}
    >
      {content}
    </AdminShell>
  );
}
