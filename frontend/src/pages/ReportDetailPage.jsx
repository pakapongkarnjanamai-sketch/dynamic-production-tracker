import { useCallback, useMemo } from "react";
import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { getLines, getLogs, getLogsSummary, getProcesses } from "../api/client";
import {
  Badge,
  EmptyState,
  ErrorState,
  LoadingState,
  MobileCard,
  Stack,
  joinClasses,
} from "../components/admin/AdminUI";
import { DetailPageShell } from "../components/layout/PageShell";
import {
  createReportDetailBackLink,
  getReportDetailTitle,
  isValidReportDetailType,
} from "../features/report/reportDetailShared";
import useAsyncData from "../hooks/useAsyncData";
import {
  ACTION_BADGE_COLORS,
  ACTION_LABELS,
  STATUS_BADGE_COLORS,
  STATUS_LABELS,
  buildLineRows,
  formatShortDate,
  formatShortTime,
} from "../components/report/reportShared";

function DetailStatCard({ label, value, tone = "neutral" }) {
  const toneClass = {
    neutral: "text-neutral-900",
    success: "text-success-700",
    danger: "text-danger-700",
    info: "text-info-700",
  };

  return (
    <div
      className={joinClasses(
        "rounded-[18px] bg-neutral-50 px-3 py-3 text-center sm:px-4 sm:py-3.5",
        toneClass[tone] || toneClass.neutral,
      )}
    >
      <div className="text-[11px] font-semibold text-neutral-500">{label}</div>
      <div className="mt-1 text-2xl font-black tracking-tight">{value}</div>
    </div>
  );
}

function DetailLayout({ title, backTo, children }) {
  const navigate = useNavigate();

  return (
    <DetailPageShell title={title} onBack={() => navigate(backTo)}>
      {children}
    </DetailPageShell>
  );
}

function TrayDetailView({ detail }) {
  const { tray, logs, latestLog } = detail;

  return (
    <Stack>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <MobileCard>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-mono text-lg font-black tracking-tight text-neutral-900 sm:text-2xl">
                {tray.qr_code}
              </div>
              <div className="mt-1 text-sm text-neutral-500">
                {tray.product || "ไม่มีชื่อสินค้า"}
              </div>
            </div>
            <Badge color={STATUS_BADGE_COLORS[tray.status] || "gray"}>
              {STATUS_LABELS[tray.status] || tray.status}
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs font-semibold text-neutral-400">
                สายการผลิต
              </div>
              <div className="mt-1 font-semibold text-neutral-900">
                {tray.line_name || "—"}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-neutral-400">
                Batch
              </div>
              <div className="mt-1 font-mono font-semibold text-neutral-900">
                {tray.batch_no || "—"}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-neutral-400">
                กำหนดส่ง
              </div>
              <div className="mt-1 font-semibold text-neutral-900">
                {formatShortDate(tray.due_date)}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-neutral-400">
                ล่าสุด
              </div>
              <div className="mt-1 font-semibold text-neutral-900">
                {latestLog ? latestLog.process_name : "ยังไม่เริ่มงาน"}
              </div>
            </div>
          </div>
        </MobileCard>

        <MobileCard>
          <div className="text-xs font-semibold text-neutral-400">
            กิจกรรมล่าสุด
          </div>
          {latestLog ? (
            <div className="mt-3 space-y-3">
              <div>
                <div className="text-base font-bold text-neutral-900">
                  {latestLog.process_name}
                </div>
                <div className="mt-1 text-sm text-neutral-500">
                  {latestLog.operator || "—"}
                  {" • "}
                  {formatShortTime(latestLog.logged_at)}
                </div>
              </div>
              <Badge color={ACTION_BADGE_COLORS[latestLog.action] || "gray"}>
                {ACTION_LABELS[latestLog.action] || latestLog.action}
              </Badge>
            </div>
          ) : (
            <EmptyState title="ยังไม่มีกิจกรรม" />
          )}
        </MobileCard>
      </div>

      <MobileCard>
        <div className="text-xs font-semibold text-neutral-400">
          ประวัติการทำงาน
        </div>
        {logs.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="ยังไม่มีประวัติ" />
          </div>
        ) : (
          <Stack className="mt-3 space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between gap-3 border-b border-dashed border-neutral-200 pb-3 last:border-b-0 last:pb-0"
              >
                <div className="min-w-0 space-y-1">
                  <div className="text-sm font-semibold text-neutral-900">
                    <span className="mr-1.5 text-neutral-400">
                      #{log.sequence}
                    </span>
                    {log.process_name}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {log.operator || "—"}
                    {" • "}
                    {formatShortTime(log.logged_at)}
                  </div>
                </div>
                <Badge color={ACTION_BADGE_COLORS[log.action] || "gray"}>
                  {ACTION_LABELS[log.action] || log.action}
                </Badge>
              </div>
            ))}
          </Stack>
        )}
      </MobileCard>
    </Stack>
  );
}

function LineDetailView({ detail }) {
  const activeTrayCount = detail.processes.reduce(
    (count, processItem) => count + processItem.activeItems.length,
    0,
  );

  return (
    <Stack>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <DetailStatCard
          label="จำนวนขั้นตอน"
          value={detail.processes.length}
          tone="neutral"
        />
        <DetailStatCard
          label="งานค้างในไลน์"
          value={activeTrayCount}
          tone="info"
        />
        <DetailStatCard
          label="วันนี้เสร็จ"
          value={detail.finishToday}
          tone="success"
        />
        <DetailStatCard
          label="วันนี้เสีย"
          value={detail.ngToday}
          tone="danger"
        />
      </div>

      {detail.processes.length === 0 ? (
        <EmptyState title="ยังไม่มีขั้นตอน" />
      ) : (
        <Stack>
          {detail.processes.map((processItem) => (
            <MobileCard key={processItem.id}>
              <div className="flex items-center gap-2 text-sm font-bold text-neutral-900">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-info-100 text-xs text-info-700">
                  {processItem.seq}
                </span>
                <span className="min-w-0 truncate">{processItem.process}</span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs">
                <div>
                  <div className="text-neutral-400">เริ่มงาน</div>
                  <div className="font-bold text-info-700">
                    {processItem.start}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-400">เสร็จสิ้น</div>
                  <div className="font-bold text-success-700">
                    {processItem.finish}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-400">ของเสีย</div>
                  <div className="font-bold text-danger-700">
                    {processItem.ng}
                  </div>
                </div>
              </div>

              <div className="mt-3 border-t border-dashed border-neutral-200 pt-3">
                <div className="mb-2 text-[11px] text-neutral-500">
                  กำลังทำอยู่ ({processItem.activeItems.length})
                </div>
                {processItem.activeItems.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {processItem.activeItems.map((item) => (
                      <Badge
                        key={`${item.qr_code}-${item.logged_at}`}
                        color="blue"
                        className="font-mono"
                      >
                        {item.qr_code}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs italic text-neutral-400">—</div>
                )}
              </div>
            </MobileCard>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

export default function ReportDetailPage() {
  const { detailType, detailId } = useParams();
  const [searchParams] = useSearchParams();

  const backTo = useMemo(
    () => createReportDetailBackLink(searchParams),
    [searchParams],
  );

  const isValidType = isValidReportDetailType(detailType);

  const loadDetail = useCallback(async () => {
    if (detailType === "tray") {
      const [summary, logs] = await Promise.all([
        getLogsSummary(),
        getLogs({ tray_id: detailId }),
      ]);
      const tray = summary.find(
        (row) => String(row.tray_id) === String(detailId),
      );
      if (!tray) {
        throw new Error("ไม่พบข้อมูลงานที่เลือก");
      }

      const sortedLogs = [...logs].sort(
        (a, b) => new Date(b.logged_at) - new Date(a.logged_at),
      );

      return {
        tray,
        logs: sortedLogs,
        latestLog: sortedLogs[0] || null,
        startCount: logs.filter((log) => log.action === "start").length,
        finishCount: logs.filter((log) => log.action === "finish").length,
        ngCount: logs.filter((log) => log.action === "ng").length,
      };
    }

    if (detailType === "line") {
      const [lines, processes, logs] = await Promise.all([
        getLines(),
        getProcesses(),
        getLogs({ limit: 2000 }),
      ]);
      const lineRows = buildLineRows({ logs, processes, lines });
      const lineDetail = lineRows.find(
        (row) => String(row.id) === String(detailId),
      );
      if (!lineDetail) {
        throw new Error("ไม่พบข้อมูลสายการผลิตที่เลือก");
      }

      return lineDetail;
    }

    throw new Error("ไม่พบประเภทรายงานที่เลือก");
  }, [detailId, detailType]);

  const {
    data: detail,
    loading,
    error,
    reload: loadDetailRetry,
  } = useAsyncData(loadDetail, {
    enabled: isValidType && Boolean(detailId),
    initialData: null,
    getErrorMessage: (err) => err?.message || "โหลดรายละเอียดรายงานไม่สำเร็จ",
  });

  if (!isValidType) {
    return <Navigate to={backTo} replace />;
  }

  const title = getReportDetailTitle(detailType, detail);

  return (
    <DetailLayout title={title} backTo={backTo}>
      {loading ? <LoadingState message="กำลังโหลดรายละเอียดรายงาน..." /> : null}
      {!loading && error ? (
        <ErrorState message={error} onRetry={loadDetailRetry} />
      ) : null}
      {!loading && !error && !detail ? (
        <EmptyState title="ไม่พบข้อมูล" />
      ) : null}
      {!loading && !error && detail && detailType === "tray" ? (
        <TrayDetailView detail={detail} />
      ) : null}
      {!loading && !error && detail && detailType === "line" ? (
        <LineDetailView detail={detail} />
      ) : null}
    </DetailLayout>
  );
}
