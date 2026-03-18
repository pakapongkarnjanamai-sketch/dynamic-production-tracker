import { useEffect, useState } from "react";
import { getLines, getTrayStats } from "../api/client";
import { AdminPageHeader } from "../components/admin/AdminUI";

export default function HomePage() {
  const [lines, setLines] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getLines(), getTrayStats()])
      .then(([l, s]) => {
        setLines(l);
        setStats(s);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const activeLines = lines.filter((l) => l.is_active);

  return (
    <main className="min-h-screen bg-white pb-24 md:pb-0">
      <div className="mx-auto w-full max-w-7xl space-y-4 px-3 py-2.5 sm:space-y-6 sm:px-6 sm:py-4 md:px-8 md:py-6">
        <AdminPageHeader title="หน้าหลัก" />

        {/* ── Work Status Stats ── */}
        {stats && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {[
              {
                label: "กำลังดำเนินการ",
                value: stats.in_progress,
                bg: "bg-warning-50",
                border: "border-warning-200",
                dot: "bg-warning-500 animate-pulse",
                text: "text-warning-700",
                num: "text-warning-800",
              },
              {
                label: "รอดำเนินการ",
                value: stats.pending,
                bg: "bg-neutral-50",
                border: "border-neutral-200",
                dot: "bg-neutral-400",
                text: "text-neutral-600",
                num: "text-neutral-800",
              },
              {
                label: "เสร็จสิ้น",
                value: stats.completed,
                bg: "bg-success-50",
                border: "border-success-200",
                dot: "bg-success-500",
                text: "text-success-700",
                num: "text-success-800",
              },
              {
                label: "เกินกำหนด",
                value: stats.delayed,
                bg:
                  Number(stats.delayed) > 0 ? "bg-danger-50" : "bg-neutral-50",
                border:
                  Number(stats.delayed) > 0
                    ? "border-danger-200"
                    : "border-neutral-200",
                dot:
                  Number(stats.delayed) > 0
                    ? "bg-danger-500"
                    : "bg-neutral-300",
                text:
                  Number(stats.delayed) > 0
                    ? "text-danger-700"
                    : "text-neutral-500",
                num:
                  Number(stats.delayed) > 0
                    ? "text-danger-800"
                    : "text-neutral-600",
              },
            ].map((s) => (
              <div
                key={s.label}
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
              </div>
            ))}
          </div>
        )}

        {/* ── Status Section ── */}
        <div>
          <div className="mb-2.5 flex items-center justify-between px-1 sm:mb-4 sm:px-2">
            <h2 className="flex items-center gap-2 text-base font-bold text-neutral-900 sm:text-xl">
              <svg
                className="w-5 h-5 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              ภาพรวมสายการผลิต ({activeLines.length})
            </h2>
          </div>

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
                  <div
                    key={line.id}
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
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
