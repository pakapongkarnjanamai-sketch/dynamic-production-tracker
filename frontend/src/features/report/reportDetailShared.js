import { createReportSearch } from "../../components/report/reportShared";

export const REPORT_DETAIL_LABELS = {
  tray: "งาน",
  line: "ไลน์",
  operator: "พนักงาน",
};

export function isValidReportDetailType(value) {
  return ["tray", "line", "operator"].includes(value);
}

export function createReportDetailBackLink(searchParams) {
  return `/report${createReportSearch({
    tab: searchParams.get("tab") || undefined,
    search: searchParams.get("search") || "",
    status: searchParams.get("status") || "all",
  })}`;
}

export function getReportDetailTitle(detailType, detail) {
  if (!detail) {
    return REPORT_DETAIL_LABELS[detailType];
  }

  if (detailType === "tray") {
    return detail.tray.qr_code;
  }

  return detail.name;
}
