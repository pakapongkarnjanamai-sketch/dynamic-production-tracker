import { useEffect, useState } from "react";
import {
  Badge,
  EmptyState,
  ErrorState,
  LoadingState,
  Stack,
} from "../admin/AdminUI";
import { getLogs } from "../../api/client";
import {
  ACTION_BADGE_COLORS,
  ACTION_LABELS,
  formatShortTime,
} from "./reportShared";

export default function TrayLogsViewPanel({ tray }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setError("");
        setLoading(true);
        const data = await getLogs({ tray_id: tray.tray_id });
        setLogs(data);
      } catch (err) {
        setError(err.message || "โหลดประวัติการทำงานไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [tray.tray_id]);

  return (
    <div className="mt-4 border-t border-neutral-100 pt-4">
      <h4 className="text-[11px] font-bold text-neutral-400">
        ประวัติการทำงาน
      </h4>
      <div className="mt-3">
        {loading ? (
          <LoadingState message="กำลังโหลดประวัติการทำงาน..." />
        ) : null}
        {!loading && error ? <ErrorState message={error} /> : null}
        {!loading && !error && logs.length === 0 ? (
          <EmptyState
            title="ยังไม่มีประวัติการผลิต"
            description="ระบบยังไม่พบ log ของงานรายการนี้"
          />
        ) : null}
        {!loading && !error && logs.length > 0 ? (
          <Stack className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between gap-3 rounded-[18px] border border-neutral-200 bg-neutral-50 p-3 sm:rounded-[20px]"
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
        ) : null}
      </div>
    </div>
  );
}
