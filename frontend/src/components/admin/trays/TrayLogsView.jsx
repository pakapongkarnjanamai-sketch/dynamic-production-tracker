import useTrayLogs from "../../../hooks/useTrayLogs";
import { Badge, EmptyState, ErrorState, LoadingState, Stack } from "../AdminUI";

export default function TrayLogsView({ trayId }) {
  const { logs, loading, error, reload } = useTrayLogs(trayId);

  if (loading) {
    return <LoadingState message="กำลังโหลดประวัติการทำงาน..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={reload} />;
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        title="ยังไม่มีประวัติการทำงาน"
        description="ระบบยังไม่มี log สำหรับงานนี้"
      />
    );
  }

  return (
    <Stack>
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-start justify-between gap-3 rounded-[22px] border border-neutral-200 bg-neutral-50 p-4"
        >
          <div className="space-y-1">
            <h4 className="font-semibold text-neutral-900">
              {log.process_name}
            </h4>
            <p className="text-xs text-neutral-500">
              {log.operator || "ไม่ระบุ"}
              {" • "}
              {new Date(log.logged_at).toLocaleString("th-TH", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </p>
            {log.note ? (
              <p className="text-xs text-neutral-400">Note: {log.note}</p>
            ) : null}
          </div>
          <Badge
            color={
              log.action === "finish"
                ? "green"
                : log.action === "ng"
                  ? "red"
                  : "blue"
            }
          >
            {String(log.action || "").toUpperCase()}
          </Badge>
        </div>
      ))}
    </Stack>
  );
}
