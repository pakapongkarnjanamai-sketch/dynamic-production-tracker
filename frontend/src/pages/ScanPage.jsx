import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import QRScanner from "../components/QRScanner";
import { scanTray } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function ScanPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const operator = (user?.operator_name || user?.name || "").trim();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scanKey, setScanKey] = useState(0);
  const [manualCode, setManualCode] = useState("");
  const manualInputRef = useRef(null);

  // Ref guard — survives stale closures inside QRScanner's useEffect
  const processingRef = useRef(false);

  // ถ้ากลับมาจากหน้า detail → block ให้ไม่รับ QR ทันที​ 1.5 วินาทีเพื่อให้หันกล้องออกจาก QR เดิม
  useEffect(() => {
    if (state?.cooldown) {
      processingRef.current = true;
      const t = setTimeout(() => {
        processingRef.current = false;
      }, 1500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        setError("กรุณากรอกรหัสหรือสแกน QR");
        return;
      }
      processingRef.current = true;
      setLoading(true);
      setError(null);
      try {
        const data = await scanTray(code);
        navigate("/scan/detail", { state: { result: data, operator } });
      } catch (e) {
        setError(e.message);
        processingRef.current = false;
      } finally {
        setLoading(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [operator, navigate],
  );

  const reset = () => {
    setError(null);
    setManualCode("");
    processingRef.current = false;
    setScanKey((k) => k + 1);
    setTimeout(() => {
      manualInputRef.current?.focus();
    }, 120);
  };

  const submitManualCode = async (e) => {
    e.preventDefault();
    await handleScan(manualCode);
  };

  return (
    <main className="min-h-screen bg-white flex flex-col pb-24 md:pb-0">
      {/* Header */}
      <div className="bg-neutral-900 text-white px-4 py-3 shadow-sm z-20 relative">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 text-sm font-bold text-white border border-neutral-600">
              {operator.charAt(0)}
            </div>
            <div className="leading-tight">
              <div className="font-bold text-base">{operator}</div>
              <div className="text-neutral-400 text-xs">พร้อมสแกน</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col w-full px-4 py-4 max-w-md mx-auto gap-4">
        {/* Loading */}
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

        {/* Scanner + Manual Input */}
        {!loading && (
          <div className="flex-1 flex flex-col items-center justify-start gap-4">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-neutral-900 sm:text-xl">
                สแกน QR Code
              </h2>
              <p className="text-sm text-neutral-500">
                เล็งกล้องไปที่ QR Code หรือพิมพ์รหัสด้านล่าง
              </p>
            </div>

            {!error && (
              <div className="w-full aspect-video rounded-[24px] overflow-hidden border border-neutral-200 shadow-sm bg-black">
                <QRScanner
                  key={scanKey}
                  onScan={handleScan}
                  onError={(e) => setError("ไม่สามารถเปิดกล้องได้: " + e)}
                />
              </div>
            )}

            {error && (
              <div className="w-full space-y-4 rounded-[24px] border border-danger-200 bg-danger-50 px-4 py-5 text-sm text-danger-700">
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
                      เกิดข้อผิดพลาด
                    </h3>
                    <p className="mt-1 text-danger-600">{error}</p>
                  </div>
                </div>
                <button
                  onClick={reset}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 active:bg-neutral-100 sm:w-auto"
                >
                  ลองใหม่
                </button>
              </div>
            )}

            <form
              onSubmit={submitManualCode}
              className="w-full rounded-[24px] border border-neutral-200 bg-white shadow-sm p-4 space-y-3"
            >
              <label className="block text-sm font-semibold text-neutral-700">
                สแกนด้วยเครื่องอ่านหรือพิมพ์รหัส
              </label>
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
                <button
                  type="submit"
                  className="shrink-0 inline-flex items-center justify-center rounded-xl border border-primary-700 bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50"
                  disabled={loading}
                >
                  ยืนยัน
                </button>
              </div>
              <p className="text-xs font-normal text-neutral-400">
                กด Enter ได้ทันที เหมาะกับเครื่องอ่านบาร์โค้ดแบบคีย์บอร์ด
              </p>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
