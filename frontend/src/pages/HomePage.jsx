import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLines, getLogsSummary, getTrayStats } from "../api/client";
import { AdminPageHeader } from "../components/admin/AdminUI";
import { createReportSearch } from "../components/report/reportShared";

export default function HomePage() {
  const navigate = useNavigate();
  const [lines, setLines] = useState([]);
  const [traySummary, setTraySummary] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getLines(), getTrayStats(), getLogsSummary()])
      .then(([l, s, summary]) => {
        setLines(l);
        setStats(s);
        setTraySummary(summary);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const activeLines = lines.filter((l) => l.is_active);
  const activeJobs = traySummary
    .filter((tray) => tray.status === "in_progress")
    .map((tray) => {
      const totalProcesses = Number(tray.total_processes) || 0;
      const passedProcesses = Math.min(
        Number(tray.passed_processes) || 0,
        totalProcesses,
      );
      const progress =
        totalProcesses > 0
          ? Math.round((passedProcesses / totalProcesses) * 100)
          : 0;

      return {
        ...tray,
        totalProcesses,
        passedProcesses,
        progress,
      };
    });

  const statusCards = stats
    ? [
        {
          id: "in_progress",
          label: "กำลังทำ",
          value: stats.in_progress,
          bg: "bg-warning-50",
          border: "border-warning-200",
          dot: "bg-warning-500 animate-pulse",
          text: "text-warning-700",
          num: "text-warning-800",
          bar: "bg-warning-500",
        },
        {
          id: "pending",
          label: "รอทำ",
          value: stats.pending,
          bg: "bg-neutral-50",
          border: "border-neutral-200",
          dot: "bg-neutral-400",
          text: "text-neutral-600",
          num: "text-neutral-800",
          bar: "bg-neutral-400",
        },
        {
          id: "completed",
          label: "เสร็จสิ้น",
          value: stats.completed,
          bg: "bg-success-50",
          border: "border-success-200",
          dot: "bg-success-500",
          text: "text-success-700",
          num: "text-success-800",
          bar: "bg-success-500",
        },
        {
          id: "delayed",
          label: "เกินกำหนด",
          value: stats.delayed,
          bg: Number(stats.delayed) > 0 ? "bg-danger-50" : "bg-neutral-50",
          border:
            Number(stats.delayed) > 0
              ? "border-danger-200"
              : "border-neutral-200",
          dot: Number(stats.delayed) > 0 ? "bg-danger-500" : "bg-neutral-300",
          text:
            Number(stats.delayed) > 0 ? "text-danger-700" : "text-neutral-500",
          num:
            Number(stats.delayed) > 0 ? "text-danger-800" : "text-neutral-600",
          bar: Number(stats.delayed) > 0 ? "bg-danger-500" : "bg-neutral-300",
        },
      ]
    : [];
  const totalTrackedJobs = statusCards.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0,
  );

  return (
    <main className="min-h-screen bg-white pb-24 md:pb-0">
      <div className="mx-auto w-full max-w-7xl space-y-4 px-3 py-2.5 sm:space-y-6 sm:px-6 sm:py-4 md:px-8 md:py-6">
        <AdminPageHeader title="หน้าหลัก" />

        {/* ── Work Status Stats ── */}
        {stats && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {statusCards.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() =>
                  navigate(
                    `/report${createReportSearch({
                      tab: "trays",
                      status: s.id,
                    })}`,
                  )
                }
                className={`${s.bg} ${s.border} flex flex-col gap-1 rounded-[20px] border px-3 py-2.5 shadow-sm sm:rounded-[24px] sm:px-5 sm:py-4`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`}></span>
                  <span className={`text-xs font-semibold ${s.text}`}>
                    {s.label}
                  </span>
                </div>
                <p
                  className={`text-xl font-black leading-none sm:text-3xl ${s.num}`}
                >
                  {s.value ?? 0}
                </p>
              </button>
            ))}
          </div>
        )}

        {stats && (
          <div className="rounded-[20px] border border-neutral-200 bg-white p-3.5 shadow-sm sm:rounded-[24px] sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-neutral-900">
                สัดส่วนสถานะงาน
              </h2>
              <span className="text-xs font-semibold text-neutral-500">
                รวม {totalTrackedJobs}
              </span>
            </div>

            <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-neutral-100">
              {statusCards.map((item) => {
                const width =
                  totalTrackedJobs > 0
                    ? (Number(item.value || 0) / totalTrackedJobs) * 100
                    : 0;

                return width > 0 ? (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={`${item.label} ${item.value}`}
                    onClick={() =>
                      navigate(
                        `/report${createReportSearch({
                          tab: "trays",
                          status: item.id,
                        })}`,
                      )
                    }
                    className={`${item.bar} h-full transition-opacity hover:opacity-80`}
                    style={{ width: `${width}%` }}
                  />
                ) : null;
              })}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {statusCards.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    navigate(
                      `/report${createReportSearch({
                        tab: "trays",
                        status: item.id,
                      })}`,
                    )
                  }
                  className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-left text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100"
                >
                  <span className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
                    {item.label}
                  </span>
                  <span className="font-bold text-neutral-900">
                    {item.value ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-2.5 sm:space-y-3">
            <div className="px-1 sm:px-2">
              <h2 className="text-base font-bold text-neutral-900 sm:text-lg">
                งานที่กำลังทำอยู่
              </h2>
            </div>

            {activeJobs.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-500 sm:rounded-[24px]">
                ไม่มีงานที่กำลังทำ
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                {activeJobs.map((job) => (
                  <button
                    key={job.tray_id}
                    type="button"
                    onClick={() =>
                      navigate(
                        `/report/tray/${encodeURIComponent(job.tray_id)}${createReportSearch(
                          {
                            tab: "trays",
                            status: "in_progress",
                          },
                        )}`,
                      )
                    }
                    className="rounded-[20px] border border-warning-200 bg-warning-50/50 p-3.5 shadow-sm sm:rounded-[24px] sm:p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-mono text-base font-black text-neutral-900">
                          {job.qr_code}
                        </div>
                        <div className="mt-1 truncate text-sm text-neutral-500">
                          {job.product || "ไม่มีชื่อสินค้า"}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-warning-200 bg-white px-2.5 py-1 text-[11px] font-bold text-warning-700">
                        <span className="h-2 w-2 rounded-full bg-warning-500 animate-pulse"></span>
                        กำลังทำ
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 text-xs text-neutral-500">
                      <span className="truncate">
                        {job.line_name || "ไม่ระบุไลน์"}
                      </span>
                      <span>
                        {job.passedProcesses}/{job.totalProcesses}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white">
                        <div
                          className="h-full rounded-full bg-warning-500 transition-[width]"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <div className="shrink-0 text-xs font-bold text-warning-700">
                        {job.progress}%
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Status Section ── */}
        <div>
          {loading && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-[20px] border border-neutral-200 bg-white shadow-sm animate-pulse sm:h-28 sm:rounded-[24px]"
                ></div>
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-[22px] border border-danger-200 bg-danger-50 px-4 py-4 text-center text-sm text-danger-700 sm:rounded-[24px] sm:py-5">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {activeLines.length === 0 ? (
                <div className="col-span-full rounded-[20px] border border-dashed border-neutral-200 bg-neutral-50 px-4 py-7 text-center text-sm text-neutral-500 sm:rounded-[24px] sm:py-10">
                  ไม่มีไลน์ที่ใช้งาน
                </div>
              ) : (
                activeLines.map((line) => (
                  <button
                    key={line.id}
                    type="button"
                    onClick={() =>
                      navigate(
                        `/report/line/${encodeURIComponent(line.id)}${createReportSearch(
                          {
                            tab: "processes",
                          },
                        )}`,
                      )
                    }
                    className="group relative overflow-hidden rounded-[20px] border border-neutral-200 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md sm:rounded-[24px] sm:p-5"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-600 rounded-r-full"></div>

                    <div className="flex justify-between items-start mb-2 pl-3">
                      <p className="text-base font-bold text-neutral-900 group-hover:text-neutral-700 transition-colors">
                        {line.name}
                      </p>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-success-200 bg-success-100 px-2.5 py-1 text-[11px] font-bold tracking-wide text-success-700">
                        <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse"></span>{" "}
                        Active
                      </span>
                    </div>
                    <div className="pl-3">
                      {line.description ? (
                        <p className="text-sm text-neutral-500 line-clamp-2 leading-relaxed">
                          {line.description}
                        </p>
                      ) : (
                        <p className="text-sm text-neutral-400 italic">
                          ไม่มีข้อมูล
                        </p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
