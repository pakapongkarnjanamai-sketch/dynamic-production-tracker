import { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { scanTray, createLog } from "../api/client";
import { AdminDetailHeader } from "../components/admin/AdminUI";

const LS_OPERATOR = "mes_operator";

// ส่ง cooldown: true เสมอเมื่อกลับไปหน้าสแกน
const goScan = (navigate) => navigate("/scan", { state: { cooldown: true } });

function formatTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TrayDetailPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [result, setResult] = useState(state?.result ?? null);
  const [operator] = useState(
    () => state?.operator || localStorage.getItem(LS_OPERATOR) || "",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // ถ้าเข้าตรงโดยไม่มี state → กลับไปหน้าสแกน
  useEffect(() => {
    if (!result) navigate("/scan", { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-dismiss toast after 2.5 s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleAction = useCallback(
    async (process, action) => {
      setLoading(true);
      setError(null);
      try {
        await createLog({
          tray_id: result.tray.id,
          process_id: process.id,
          operator: operator || null,
          action,
        });
        if (navigator.vibrate) navigator.vibrate(100);
        const actionLabel =
          action === "start" ? "เริ่มงาน" : action === "finish" ? "OK" : "NG";
        setToast(`${process.name} — ${actionLabel}`);
        if (action === "start") {
          const fresh = await scanTray(result.tray.qr_code);
          setResult(fresh);
        } else {
          goScan(navigate);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [result, operator, navigate],
  );

  const currentProcess =
    result?.tray.status === "ng"
      ? null
      : (result?.processes.find((p) => p.last_action !== "finish") ?? null);
  const trayComplete =
    !!result &&
    result.processes.length > 0 &&
    result.processes.every((p) => p.last_action === "finish");
  const trayNg = result?.tray.status === "ng";
  const doneCount =
    result?.processes.filter((p) => p.last_action === "finish").length ?? 0;
  const totalCount = result?.processes.length ?? 0;

  const startTime = result?.tray.started_at ?? null;
  const finishTime = result?.tray.finished_at ?? null;

  if (!result) return null;

  return (
    <main className="min-h-screen bg-white flex flex-col pb-24 md:pb-0">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-28 md:bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-neutral-900 text-white px-5 py-3 shadow-2xl flex items-center gap-3 whitespace-nowrap">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success-500 text-xs font-bold">
            ✓
          </span>
          <span className="font-semibold text-sm">บันทึกสำเร็จ — {toast}</span>
        </div>
      )}

      <AdminDetailHeader
        title={result.tray.qr_code}
        onBack={() => goScan(navigate)}
      />

      {/* Content */}
      <div className="flex-1 flex flex-col w-full px-4 py-4 max-w-md mx-auto gap-4">
        {/* Loading overlay */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="rounded-[24px] border border-dashed border-neutral-200 bg-white px-4 py-10 text-center text-sm font-medium text-neutral-500 w-full">
              <svg
                className="animate-spin w-10 h-10 mb-3 text-neutral-400 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              กำลังประมวลผล...
            </div>
          </div>
        )}

        {!loading && (
          <>
            {/* Error */}
            {error && (
              <div className="space-y-4 rounded-[24px] border border-danger-200 bg-danger-50 px-4 py-5 text-sm text-danger-700">
                <p>{error}</p>
              </div>
            )}

            {/* Tray Info */}
            <div className="rounded-[28px] border border-neutral-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-neutral-100 bg-neutral-50 px-5 py-3 flex justify-between items-center">
                <span className="text-xs font-semibold text-neutral-400">
                  งาน
                </span>
                <span className="inline-flex items-center rounded-full border border-info-200 bg-info-100 px-2.5 py-1 text-[11px] font-bold tracking-wide text-info-700">
                  QTY: {result.tray.qty}
                </span>
              </div>
              <div className="p-5">
                <p className="text-3xl font-black text-neutral-900 font-mono tracking-tight text-center border-b border-dashed border-neutral-200 pb-4 mb-4">
                  {result.tray.qr_code}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-neutral-400 font-medium text-xs mb-0.5">
                      สินค้า
                    </p>
                    <p className="font-bold text-neutral-900 text-base">
                      {result.tray.product || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-400 font-medium text-xs mb-0.5">
                      Batch
                    </p>
                    <p className="font-bold text-neutral-900 text-base font-mono">
                      {result.tray.batch_no || "—"}
                    </p>
                  </div>
                </div>
                {totalCount > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-neutral-500 mb-1">
                      <span>ความคืบหน้า</span>
                      <span className="font-semibold">
                        {doneCount}/{totalCount} ขั้นตอน
                      </span>
                    </div>
                    <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-neutral-400 mt-2">
                      <span>
                        เริ่ม: {startTime ? formatTime(startTime) : "—"}
                      </span>
                      <span>
                        เสร็จ: {finishTime ? formatTime(finishTime) : "—"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Process Progress List */}
            <div className="rounded-[28px] border border-neutral-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-neutral-100 bg-neutral-50 px-5 py-3">
                <span className="text-xs font-semibold text-neutral-400">
                  ขั้นตอนการผลิต
                </span>
              </div>
              <div className="divide-y divide-neutral-100">
                {result.processes.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-neutral-500">
                    ไม่มีขั้นตอนที่กำหนดสำหรับสายนี้
                  </div>
                ) : (
                  result.processes.map((p) => {
                    const isCurrent =
                      !trayComplete && !trayNg && currentProcess?.id === p.id;
                    const isDone = p.last_action === "finish";
                    const isNG = p.last_action === "ng";
                    const isStarted = p.last_action === "start";
                    return (
                      <div
                        key={p.id}
                        className={`px-5 py-4 flex items-center gap-4 ${isCurrent ? "bg-info-50" : ""}`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            isDone
                              ? "bg-success-500 text-white"
                              : isNG
                                ? "bg-danger-500 text-white"
                                : isStarted
                                  ? "bg-info-500 text-white"
                                  : isCurrent
                                    ? "bg-white text-info-600 border-2 border-info-400"
                                    : "bg-neutral-100 text-neutral-400"
                          }`}
                        >
                          {isDone
                            ? "✓"
                            : isNG
                              ? "✗"
                              : isStarted
                                ? "▶"
                                : p.sequence}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`font-bold truncate ${
                              isCurrent
                                ? "text-info-800"
                                : isDone
                                  ? "text-success-700"
                                  : isNG
                                    ? "text-danger-700"
                                    : "text-neutral-400"
                            }`}
                          >
                            {p.name}
                          </div>
                          {(isDone || isNG || isStarted) && (
                            <div className="text-xs text-neutral-500 mt-0.5 flex flex-col gap-0.5">
                              {p.start_logged_at && (
                                <span>
                                  ▶ เริ่ม {formatTime(p.start_logged_at)}
                                  {p.start_operator
                                    ? ` · ${p.start_operator}`
                                    : ""}
                                </span>
                              )}
                              {p.finish_logged_at && (
                                <span
                                  className={
                                    p.last_action === "ng"
                                      ? "text-danger-500"
                                      : "text-success-600"
                                  }
                                >
                                  {p.last_action === "ng" ? "✗ NG" : "✓ เสร็จ"}{" "}
                                  {formatTime(p.finish_logged_at)}
                                  {p.finish_operator
                                    ? ` · ${p.finish_operator}`
                                    : ""}
                                </span>
                              )}
                            </div>
                          )}
                          {isCurrent && !p.last_action && (
                            <div className="text-xs text-info-500 font-medium mt-0.5">
                              ← ขั้นตอนถัดไป
                            </div>
                          )}
                          {isCurrent && isStarted && (
                            <div className="text-xs text-info-500 font-medium mt-0.5">
                              ← กำลังทำ
                            </div>
                          )}
                          {isCurrent && isNG && (
                            <div className="text-xs text-danger-500 font-medium mt-0.5">
                              ← ต้องแก้ไข
                            </div>
                          )}
                        </div>
                        {isDone && (
                          <span className="inline-flex items-center rounded-full border border-success-200 bg-success-100 px-2.5 py-1 text-[11px] font-bold text-success-700 shrink-0">
                            เสร็จ
                          </span>
                        )}
                        {isNG && !isCurrent && (
                          <span className="inline-flex items-center rounded-full border border-danger-200 bg-danger-100 px-2.5 py-1 text-[11px] font-bold text-danger-700 shrink-0">
                            NG
                          </span>
                        )}
                        {isCurrent && !p.last_action && (
                          <span className="inline-flex items-center rounded-full border border-info-200 bg-info-100 px-2.5 py-1 text-[11px] font-bold text-info-700 shrink-0">
                            ขั้นตอนถัดไป
                          </span>
                        )}
                        {isCurrent && isStarted && (
                          <span className="inline-flex items-center rounded-full border border-info-200 bg-info-100 px-2.5 py-1 text-[11px] font-bold text-info-700 shrink-0 animate-pulse">
                            ดำเนินการ
                          </span>
                        )}
                        {isCurrent && isNG && (
                          <span className="inline-flex items-center rounded-full border border-danger-200 bg-danger-100 px-2.5 py-1 text-[11px] font-bold text-danger-700 shrink-0">
                            ต้องแก้ไข
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {trayComplete ? (
              <div className="rounded-[28px] border-2 border-success-300 bg-success-50 p-6 text-center">
                <div className="text-5xl mb-3">🎉</div>
                <h2 className="text-2xl font-black text-success-700 mb-1">
                  เสร็จสมบูรณ์!
                </h2>
                <p className="text-success-600 text-sm">
                  งานนี้ผ่านครบทุก {totalCount} ขั้นตอนแล้ว
                </p>
              </div>
            ) : trayNg ? (
              <div className="rounded-[28px] border-2 border-danger-300 bg-danger-50 p-6 text-center">
                <div className="text-5xl mb-3">✖</div>
                <h2 className="text-2xl font-black text-danger-700 mb-1">
                  งานจบด้วย NG
                </h2>
                <p className="text-danger-600 text-sm">
                  งานนี้สิ้นสุดที่ขั้นตอน {currentProcess?.sequence || "ล่าสุด"}{" "}
                  ด้วยสถานะ NG
                </p>
              </div>
            ) : (
              currentProcess && (
                <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm">
                  <p className="text-center font-bold text-neutral-900 text-lg mb-1">
                    {currentProcess.name}
                  </p>
                  <p className="text-center text-neutral-500 text-sm mb-4">
                    ขั้นตอนที่ {currentProcess.sequence} — เลือกสถานะ
                  </p>
                  <div className="grid gap-3">
                    <button
                      onClick={() => handleAction(currentProcess, "start")}
                      disabled={currentProcess.last_action === "start"}
                      className="flex items-center justify-center gap-3 rounded-2xl border border-info-600 bg-info-600 py-5 text-2xl font-bold text-white shadow-sm transition-colors hover:bg-info-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>▶</span> เริ่มงาน
                    </button>
                    <button
                      onClick={() => handleAction(currentProcess, "finish")}
                      disabled={!currentProcess.last_action}
                      className="flex items-center justify-center gap-3 rounded-2xl border border-success-600 bg-success-600 py-5 text-2xl font-bold text-white shadow-sm transition-colors hover:bg-success-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>✔</span> เสร็จสิ้น (OK)
                    </button>
                    <button
                      onClick={() => handleAction(currentProcess, "ng")}
                      disabled={!currentProcess.last_action}
                      className="flex items-center justify-center gap-3 rounded-2xl border border-danger-600 bg-danger-600 py-5 text-2xl font-bold text-white shadow-sm transition-colors hover:bg-danger-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>✖</span> ของเสีย (NG)
                    </button>
                  </div>
                </div>
              )
            )}

            {/* Scan Next */}
            <button
              onClick={() => goScan(navigate)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-primary-700 bg-primary-600 py-5 text-xl font-bold text-white shadow-sm transition-colors hover:bg-primary-700 active:scale-95 mb-4"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              สแกนใหม่
            </button>
          </>
        )}
      </div>
    </main>
  );
}
