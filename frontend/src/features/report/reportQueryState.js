import {
  createReportSearch,
  getValidReportTab,
  getValidTrayStatusFilter,
  TABS,
} from "../../components/report/reportShared";

export const REPORT_MENUS = TABS.map((tab) => ({
  id: tab.id,
  label: tab.label,
  shortLabel: tab.shortLabel,
  icon: tab.icon,
}));

export function getReportViewState(searchParams) {
  return {
    activeTab: getValidReportTab(searchParams.get("tab")),
    search: searchParams.get("search") || "",
    status: getValidTrayStatusFilter(searchParams.get("status") || "all"),
  };
}

export function normalizeReportSearch(searchParams) {
  return createReportSearch({
    tab: getValidReportTab(searchParams.get("tab")),
    search: searchParams.get("search") || "",
    status: getValidTrayStatusFilter(searchParams.get("status") || "all"),
  });
}
