import { useLocation, useNavigate } from "react-router-dom";
import {
  Badge,
  EmptyState,
  MobileCard,
  SearchInput,
  joinClasses,
} from "../admin/AdminUI";
import {
  FILTER_BUTTON_CLASS,
  STATUS_BADGE_COLORS,
  STATUS_LABELS,
  getValidTrayStatusFilter,
} from "./reportShared";

export default function TrayReportPanel({
  data,
  search,
  statusFilter,
  onSearch,
  onStatusChange,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeStatusFilter = getValidTrayStatusFilter(statusFilter);

  const buildProgress = (row) => {
    const totalProcesses = Number(row.total_processes) || 0;
    const passedProcesses = Math.min(
      Number(row.passed_processes) || 0,
      totalProcesses,
    );
    const percent =
      totalProcesses > 0
        ? Math.round((passedProcesses / totalProcesses) * 100)
        : 0;

    return {
      totalProcesses,
      passedProcesses,
      percent,
    };
  };

  const now = new Date();
  const withDelay = data.map((row) => ({
    ...row,
    ...buildProgress(row),
    isDelayed:
      row.due_date &&
      new Date(row.due_date) < now &&
      row.status !== "completed",
  }));

  const counts = {
    all: withDelay.length,
    in_progress: withDelay.filter((row) => row.status === "in_progress").length,
    pending: withDelay.filter((row) => row.status === "pending").length,
    completed: withDelay.filter((row) => row.status === "completed").length,
    delayed: withDelay.filter((row) => row.isDelayed).length,
  };

  const filtered = withDelay.filter((row) => {
    const matchesStatus =
      activeStatusFilter === "all"
        ? true
        : activeStatusFilter === "delayed"
          ? row.isDelayed
          : row.status === activeStatusFilter;
    const keyword = search.trim().toLowerCase();
    const matchesSearch =
      !keyword ||
      row.qr_code.toLowerCase().includes(keyword) ||
      (row.product || "").toLowerCase().includes(keyword) ||
      (row.line_name || "").toLowerCase().includes(keyword);

    return matchesStatus && matchesSearch;
  });

  const filters = [
    { id: "all", label: "ทั้งหมด", count: counts.all },
    { id: "in_progress", label: "กำลังทำ", count: counts.in_progress },
    { id: "pending", label: "รอเริ่ม", count: counts.pending },
    { id: "completed", label: "เสร็จ", count: counts.completed },
    { id: "delayed", label: "ล่าช้า", count: counts.delayed },
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      <SearchInput
        placeholder="ค้นหา QR Code, สินค้า หรือสายการผลิต"
        value={search}
        onChange={(event) => onSearch(event.target.value)}
      />

      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => onStatusChange(filter.id)}
            className={joinClasses(
              FILTER_BUTTON_CLASS,
              activeStatusFilter === filter.id
                ? "border-primary-700 bg-primary-600 text-white"
                : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
            )}
          >
            {filter.label}: {filter.count}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="ไม่พบข้อมูลที่ค้นหา"
          description="ลองเปลี่ยนคำค้นหรือเลือกสถานะอื่น"
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((row) => {
            return (
              <MobileCard
                key={row.tray_id}
                className={joinClasses(
                  "cursor-pointer border-2 transition-all",
                  row.isDelayed
                    ? "border-danger-200 bg-danger-50/40"
                    : "border-neutral-200 hover:border-warning-200",
                )}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() =>
                    navigate(
                      `/report/tray/${encodeURIComponent(row.tray_id)}${location.search}`,
                    )
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-mono text-base font-black tracking-tight text-neutral-900 sm:text-lg">
                        {row.qr_code}
                      </h3>
                      <p className="mt-1 text-xs text-neutral-500">
                        {row.line_name || "—"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge color={STATUS_BADGE_COLORS[row.status] || "gray"}>
                        {STATUS_LABELS[row.status] || row.status}
                      </Badge>
                      {row.isDelayed ? <Badge color="red">ล่าช้า</Badge> : null}
                    </div>
                  </div>
                  {row.product ? (
                    <div className="mt-2 truncate text-sm text-neutral-500">
                      {row.product}
                    </div>
                  ) : null}

                  <div className="mt-3">
                    <div className="flex items-center justify-between gap-3 text-[11px] font-semibold text-neutral-500">
                      <span>ความคืบหน้า</span>
                      <span>
                        {row.passedProcesses}/{row.totalProcesses} ขั้นตอน
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className="h-full rounded-full bg-primary-500 transition-[width]"
                          style={{ width: `${row.percent}%` }}
                        />
                      </div>
                      <div className="shrink-0 text-xs font-bold text-primary-600">
                        {row.percent}%
                      </div>
                    </div>
                  </div>
                </button>
              </MobileCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
