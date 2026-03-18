import { useEffect, useState } from "react";
import { getLines, getTrayStats } from "../api/client";
import { useNavigate } from "react-router-dom";
import { AdminPageHeader } from "../components/admin/AdminUI";

export default function HomePage() {
  const [lines, setLines] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
      <div className="mx-auto w-full max-w-4xl space-y-4 px-3 py-2.5 sm:space-y-6 sm:px-6 sm:py-4 md:px-8 md:py-6">
        <AdminPageHeader title="หน้าหลัก" />

        {/* ── Hero Section ── */}
        <div className="relative overflow-hidden rounded-[22px] border border-neutral-200 bg-white p-4 text-center shadow-sm sm:rounded-[28px] sm:p-10 md:p-12">
          <div className="pointer-events-none absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-neutral-50 opacity-50 sm:-mr-8 sm:-mt-8 sm:h-32 sm:w-32"></div>
          <div className="pointer-events-none absolute bottom-0 left-0 hidden h-24 w-24 -ml-8 -mb-8 rounded-full bg-neutral-50 opacity-50 sm:block"></div>

          <p className="relative z-10 text-sm font-semibold text-neutral-400">
            VS MES
          </p>
          <h1 className="relative z-10 mt-1.5 text-lg font-black tracking-tight text-neutral-900 sm:mt-2 sm:text-3xl">
            พร้อมเริ่มงาน
          </h1>

          <button
            onClick={() => navigate("/scan")}
            className="group relative z-10 mt-5 inline-flex items-center justify-center gap-3 rounded-2xl border border-primary-700 bg-primary-600 px-7 py-4.5 text-lg font-bold text-white shadow-sm transition-colors hover:bg-primary-700 active:scale-95 sm:mt-8 sm:px-12 sm:py-6 sm:text-2xl"
          >
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10 group-hover:scale-110 transition-transform flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
            สแกนงาน
          </button>
        </div>

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
