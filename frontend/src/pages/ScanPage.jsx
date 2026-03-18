import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import QRScanner from "../components/QRScanner";
import { scanTray } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AdminPageHeader, Badge, Button } from "../components/admin/AdminUI";

const LS_OPERATOR = "mes_operator";

export default function ScanPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const operator = (user?.operator_name || user?.name || "").trim();

  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [scanKey, setScanKey] = useState(0);
  const [manualCode, setManualCode] = useState("");
  const [cooldownActive, setCooldownActive] = useState(
    Boolean(state?.cooldown),
  );
  const manualInputRef = useRef(null);

  // Ref guard — survives stale closures inside QRScanner's useEffect
  const processingRef = useRef(false);

  // ถ้ากลับมาจากหน้า detail → block ให้ไม่รับ QR ทันที​ 1.5 วินาทีเพื่อให้หันกล้องออกจาก QR เดิม
  useEffect(() => {
    if (state?.cooldown) {
      setCooldownActive(true);
      processingRef.current = true;
      const t = setTimeout(() => {
        processingRef.current = false;
        setCooldownActive(false);
      }, 1500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (operator) {
      localStorage.setItem(LS_OPERATOR, operator);
    }
  }, [operator]);

  useEffect(() => {
    const t = setTimeout(() => {
      manualInputRef.current?.focus();
    }, 120);
    return () => clearTimeout(t);
  }, []);

  const handleScan = useCallback(
    async (qrCode) => {
      if (processingRef.current) return;
      const code = String(qrCode || "").trim();
      if (!code) {
        setRequestError("กรุณากรอกรหัสหรือสแกน QR");
        return;
      }
      processingRef.current = true;
      setLoading(true);
      setRequestError(null);
      try {
        const data = await scanTray(code);
        navigate("/scan/detail", { state: { result: data, operator } });
      } catch (e) {
        setRequestError(e.message);
        processingRef.current = false;
      } finally {
        setLoading(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [operator, navigate],
  );

  const reset = () => {
    setRequestError(null);
    setCameraError(null);
    setManualCode("");
    setCooldownActive(false);
    processingRef.current = false;
    setScanKey((k) => k + 1);
    setTimeout(() => {
      manualInputRef.current?.focus();
    }, 120);
  };

  const clearRequestError = () => {
    setRequestError(null);
    processingRef.current = false;
    setTimeout(() => {
      manualInputRef.current?.focus();
    }, 120);
  };

  const submitManualCode = async (e) => {
    e.preventDefault();
    await handleScan(manualCode);
  };

  const statusTone = loading
    ? "amber"
    : cameraError || requestError
      ? "red"
      : cooldownActive
        ? "blue"
        : "green";

  const statusLabel = loading
    ? "กำลังประมวลผล"
    : cameraError
      ? "ใช้การกรอกรหัสแทน"
      : requestError
        ? "ตรวจสอบรหัสอีกครั้ง"
        : cooldownActive
          ? "พักการสแกนชั่วคราว"
          : "พร้อมสแกน";

  return (
    <main className="min-h-screen bg-white pb-24 md:pb-0">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-3 py-2.5 sm:px-6 sm:py-4 md:px-8 md:py-6">
        <AdminPageHeader title="สแกนงาน" />

        <section className="rounded-[28px] border border-neutral-200 bg-white px-4 py-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-400">
                Scan Station
              </p>
              <h2 className="mt-1 text-lg font-bold tracking-[-0.02em] text-neutral-900">
                สแกนถาดงานหรือกรอกรหัสด้วยตนเอง
              </h2>
              <p className="mt-1 text-sm leading-6 text-neutral-500">
                ระบบจะพาไปหน้ารายละเอียดทันทีเมื่อพบรหัสที่ถูกต้อง
              </p>
            </div>
            <Badge color={statusTone} className="shrink-0">
              {statusLabel}
            </Badge>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                ผู้ปฏิบัติงาน
              </div>
              <div className="mt-1 truncate text-sm font-semibold text-neutral-800">
                {operator || "ยังไม่ระบุชื่อผู้ใช้งาน"}
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                วิธีใช้งาน
              </div>
              <div className="mt-1 text-sm font-semibold text-neutral-800">
                สแกนกล้องหรือกรอกโค้ด
              </div>
            </div>
          </div>
        </section>

        {/* Loading */}
        {loading && (
          <div className="flex min-h-[360px] flex-col items-center justify-center">
            <div className="rounded-[24px] border border-dashed border-neutral-200 bg-white px-4 py-10 text-center text-sm font-medium text-neutral-500 w-full shadow-sm">
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

        {/* Scanner + Manual Input */}
        {!loading && (
          <div className="flex flex-col items-center justify-start gap-4">
            <form
              onSubmit={submitManualCode}
              className="w-full rounded-[24px] border border-neutral-200 bg-white shadow-sm p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    กรอกรหัสงาน
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    ใช้เมื่อสแกนไม่ได้ หรือมีรหัสจากเอกสารหน้างาน
                  </p>
                </div>
                {manualCode ? (
                  <button
                    type="button"
                    onClick={() => setManualCode("")}
                    className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100"
                  >
                    ล้าง
                  </button>
                ) : null}
              </div>
              <div className="flex gap-2">
                <input
                  ref={manualInputRef}
                  autoFocus
                  className="flex-1 min-h-12 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-500/10 font-mono"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="เช่น TRAY-000123"
                  autoCapitalize="off"
                  autoCorrect="off"
                  autoComplete="off"
                />
                <Button
                  type="submit"
                  className="shrink-0 px-4"
                  disabled={loading}
                >
                  ยืนยัน
                </Button>
              </div>
            </form>

            <section className="w-full rounded-[24px] border border-neutral-200 bg-white p-3 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3 px-1">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    กล้องสแกน QR
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    จัดให้ QR อยู่ในกรอบ ระบบจะอ่านให้อัตโนมัติ
                  </p>
                </div>
                {(cameraError || requestError) && (
                  <Button variant="secondary" size="compact" onClick={reset}>
                    รีเซ็ต
                  </Button>
                )}
              </div>

              {!cameraError ? (
                <div className="relative w-full aspect-square rounded-[24px] overflow-hidden border border-neutral-200 shadow-sm bg-black">
                  <QRScanner
                    key={scanKey}
                    onScan={handleScan}
                    onError={(e) => {
                      setCameraError("ไม่สามารถเปิดกล้องได้: " + e);
                      setRequestError(null);
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-4 rounded-[24px] border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-sm text-neutral-600">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-danger-100 text-danger-600">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </span>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-neutral-900">
                        กล้องไม่พร้อมใช้งาน
                      </h4>
                      <p className="mt-1 text-sm leading-6 text-neutral-600">
                        {cameraError}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="secondary" onClick={reset}>
                      ลองเปิดกล้องอีกครั้ง
                    </Button>
                    <div className="rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-500">
                      ยังสามารถใช้งานต่อได้ด้วยการกรอกรหัสด้านบน
                    </div>
                  </div>
                </div>
              )}
            </section>

            {requestError && (
              <div className="w-full space-y-4 rounded-[24px] border border-danger-200 bg-danger-50 px-4 py-5 text-sm text-danger-700 shadow-sm">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-danger-500 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-danger-700">
                      ไม่พบข้อมูลจากรหัสนี้
                    </h3>
                    <p className="mt-1 text-danger-600">{requestError}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="secondary" onClick={clearRequestError}>
                    ตรวจสอบอีกครั้ง
                  </Button>
                  <Button variant="primary" onClick={reset}>
                    สแกนใหม่
                  </Button>
                </div>
              </div>
            )}

            <div className="w-full rounded-[24px] border border-neutral-200 bg-white px-4 py-4 shadow-sm">
              <h3 className="text-sm font-bold text-neutral-900">
                ข้อแนะนำหน้างาน
              </h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-600">
                <li>ถืออุปกรณ์ให้นิ่ง 1-2 วินาที เมื่อ QR อยู่ในกรอบ</li>
                <li>หากกล้องไม่พร้อมใช้งาน ให้กรอกรหัสถาดงานแทนได้ทันที</li>
                <li>
                  เมื่อกลับจากหน้ารายละเอียด ระบบจะหน่วงสแกนสั้น ๆ
                  เพื่อกันอ่านซ้ำ
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
