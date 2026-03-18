import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { getLines, getLogs, getLogsSummary, getProcesses } from "../api/client";
import {
  AdminDetailHeader,
  Badge,
  EmptyState,
  ErrorState,
  LoadingState,
  MobileCard,
  Stack,
  joinClasses,
} from "../components/admin/AdminUI";
import {
  ACTION_BADGE_COLORS,
  ACTION_LABELS,
  STATUS_BADGE_COLORS,
  STATUS_LABELS,
  buildLineRows,
  buildOperatorRows,
  createReportSearch,
  formatShortDate,
  formatShortTime,
} from "../components/report/reportShared";

const DETAIL_LABELS = {
  tray: "รายละเอียดงาน",
  line: "รายละเอียดสายการผลิต",
  operator: "รายละเอียดผู้ปฏิบัติงาน",
};

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
    <div className="min-h-screen bg-white pb-24 md:pb-0">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4 md:px-8 md:py-6">
        <AdminDetailHeader title={title} onBack={() => navigate(backTo)} />
        {children}
      </div>
    </div>
  );
}

function TrayDetailView({ detail }) {
  const { tray, logs, latestLog } = detail;

  return (
    <Stack>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <DetailStatCard
          label="สถานะ"
          value={STATUS_LABELS[tray.status] || tray.status}
          tone="info"
        />
        <DetailStatCard
          label="เริ่มงาน"
          value={detail.startCount}
          tone="info"
        />
        <DetailStatCard
          label="เสร็จสิ้น"
          value={detail.finishCount}
          tone="success"
        />
        <DetailStatCard label="ของเสีย" value={detail.ngCount} tone="danger" />
      </div>

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
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
                สายการผลิต
              </div>
              <div className="mt-1 font-semibold text-neutral-900">
                {tray.line_name || "—"}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Batch
              </div>
              <div className="mt-1 font-mono font-semibold text-neutral-900">
                {tray.batch_no || "—"}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
                กำหนดส่ง
              </div>
              <div className="mt-1 font-semibold text-neutral-900">
                {formatShortDate(tray.due_date)}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
                ล่าสุด
              </div>
              <div className="mt-1 font-semibold text-neutral-900">
                {latestLog ? latestLog.process_name : "ยังไม่เริ่มงาน"}
              </div>
            </div>
          </div>
        </MobileCard>

        <MobileCard>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
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
            <EmptyState
              title="ยังไม่มีกิจกรรม"
              description="งานนี้ยังไม่พบประวัติการดำเนินงาน"
            />
          )}
        </MobileCard>
      </div>

      <MobileCard>
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
          ประวัติการทำงาน
        </div>
        {logs.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              title="ยังไม่มีประวัติการผลิต"
              description="ระบบยังไม่พบ log ของงานรายการนี้"
            />
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
        <EmptyState
          title="ยังไม่มีขั้นตอนในสายการผลิตนี้"
          description="เพิ่ม process เพื่อให้ระบบแสดงรายละเอียดในรายงานได้"
        />
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

function OperatorDetailView({ detail }) {
  const historyItems = detail.history.slice(0, 30);

  return (
    <Stack>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <DetailStatCard label="เริ่มงาน" value={detail.start} tone="info" />
        <DetailStatCard
          label="เสร็จสิ้น"
          value={detail.finish}
          tone="success"
        />
        <DetailStatCard label="ของเสีย" value={detail.ng} tone="danger" />
        <DetailStatCard
          label="ประวัติทั้งหมด"
          value={detail.history.length}
          tone="neutral"
        />
      </div>

      <MobileCard>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-success-200 bg-success-100 text-lg font-bold text-success-700">
            {detail.name.charAt(0)}
          </div>
          <div>
            <div className="text-lg font-bold text-neutral-900">
              {detail.name}
            </div>
            <div className="text-sm text-neutral-500">
              สรุปการทำงานล่าสุดของผู้ปฏิบัติงาน
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-dashed border-neutral-200 pt-3.5">
          {detail.currentTask ? (
            <>
              <div className="mb-1 flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-info-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-info-700">
                  กำลังทำอยู่
                </span>
              </div>
              <div className="text-sm font-bold text-neutral-900">
                {detail.currentTask.process_name}
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 text-xs text-neutral-500">
                <span className="font-mono">{detail.currentTask.qr_code}</span>
                <span>{formatShortTime(detail.currentTask.logged_at)}</span>
              </div>
            </>
          ) : detail.latestLog ? (
            <>
              <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-500">
                ทำล่าสุด
              </div>
              <div className="text-sm font-bold text-neutral-900">
                {detail.latestLog.process_name}
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 text-xs text-neutral-500">
                <span className="font-mono">{detail.latestLog.qr_code}</span>
                <span>{formatShortTime(detail.latestLog.logged_at)}</span>
              </div>
            </>
          ) : (
            <div className="text-center text-xs text-neutral-400">
              — ไม่มีข้อมูลล่าสุด —
            </div>
          )}
        </div>
      </MobileCard>

      <MobileCard>
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
            ประวัติล่าสุด
          </div>
          {detail.history.length > historyItems.length ? (
            <div className="text-xs text-neutral-400">
              แสดง {historyItems.length} จาก {detail.history.length}
            </div>
          ) : null}
        </div>

        {historyItems.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              title="ยังไม่มีประวัติการทำงาน"
              description="ระบบยังไม่พบกิจกรรมของผู้ปฏิบัติงานรายนี้"
            />
          </div>
        ) : (
          <Stack className="mt-3 space-y-2">
            {historyItems.map((historyItem) => (
              <div
                key={historyItem.id}
                className="flex items-center justify-between gap-3 border-b border-dashed border-neutral-200 pb-3 text-xs last:border-b-0 last:pb-0"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="truncate font-semibold text-neutral-700">
                    {historyItem.process_name}
                  </div>
                  <div className="mt-0.5 flex justify-between gap-2 text-neutral-400">
                    <span className="truncate font-mono">
                      {historyItem.qr_code}
                    </span>
                    <span>{formatShortTime(historyItem.logged_at)}</span>
                  </div>
                </div>
                <Badge
                  color={ACTION_BADGE_COLORS[historyItem.action] || "gray"}
                >
                  {ACTION_LABELS[historyItem.action] || historyItem.action}
                </Badge>
              </div>
            ))}
          </Stack>
        )}
      </MobileCard>
    </Stack>
  );
}

export default function ReportDetailPage() {
  const { detailType, detailId } = useParams();
  const [searchParams] = useSearchParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const backTo = useMemo(
    () =>
      `/report${createReportSearch({
        tab: searchParams.get("tab") || undefined,
        search: searchParams.get("search") || "",
      })}`,
    [searchParams],
  );

  const isValidType = ["tray", "line", "operator"].includes(detailType);

  const loadDetail = useCallback(async () => {
    if (!isValidType || !detailId) {
      return;
    }

    try {
      setLoading(true);
      setError("");

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

        setDetail({
          tray,
          logs: sortedLogs,
          latestLog: sortedLogs[0] || null,
          startCount: logs.filter((log) => log.action === "start").length,
          finishCount: logs.filter((log) => log.action === "finish").length,
          ngCount: logs.filter((log) => log.action === "ng").length,
        });
        return;
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

        setDetail(lineDetail);
        return;
      }

      const logs = await getLogs({ limit: 2000 });
      const operatorRows = buildOperatorRows(logs);
      const operatorDetail = operatorRows.find((row) => row.name === detailId);
      if (!operatorDetail) {
        throw new Error("ไม่พบข้อมูลผู้ปฏิบัติงานที่เลือก");
      }

      setDetail(operatorDetail);
    } catch (err) {
      setError(err.message || "โหลดรายละเอียดรายงานไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [detailId, detailType, isValidType]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  if (!isValidType) {
    return <Navigate to={backTo} replace />;
  }

  const title = detail
    ? detailType === "tray"
      ? detail.tray.qr_code
      : detail.name
    : DETAIL_LABELS[detailType];

  return (
    <DetailLayout title={title} backTo={backTo}>
      {loading ? <LoadingState message="กำลังโหลดรายละเอียดรายงาน..." /> : null}
      {!loading && error ? (
        <ErrorState message={error} onRetry={loadDetail} />
      ) : null}
      {!loading && !error && !detail ? (
        <EmptyState
          title="ไม่พบข้อมูลรายละเอียด"
          description="ข้อมูลที่เลือกอาจถูกลบหรือไม่มีสิทธิ์เข้าถึง"
        />
      ) : null}
      {!loading && !error && detail && detailType === "tray" ? (
        <TrayDetailView detail={detail} />
      ) : null}
      {!loading && !error && detail && detailType === "line" ? (
        <LineDetailView detail={detail} />
      ) : null}
      {!loading && !error && detail && detailType === "operator" ? (
        <OperatorDetailView detail={detail} />
      ) : null}
    </DetailLayout>
  );
}
