import { useState, useCallback, useEffect } from 'react';
import QRScanner   from '../components/QRScanner';
import ProcessCard from '../components/ProcessCard';
import { scanTray, createLog, getOperators } from '../api/client';

const LS_OPERATOR = 'mes_operator';

export default function ScanPage() {
  const [operators,  setOperators]  = useState([]);
  const [operator,   setOperator]   = useState(() => localStorage.getItem(LS_OPERATOR) || '');
  const [setupDone,  setSetupDone]  = useState(() => !!localStorage.getItem(LS_OPERATOR));

  const [scanning,   setScanning]   = useState(true);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [result,     setResult]     = useState(null);
  const [lastAction, setLastAction] = useState(null);

  useEffect(() => {
    getOperators({ active_only: 'true' }).then(setOperators).catch(() => {});
  }, []);

  const saveSetup = (e) => {
    e.preventDefault();
    localStorage.setItem(LS_OPERATOR, operator);
    setSetupDone(true);
  };

  const handleScan = useCallback(async (qrCode) => {
    if (!scanning || loading) return;
    setScanning(false);
    setLoading(true);
    setError(null);
    try {
      const data = await scanTray(qrCode);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [scanning, loading]);

  const handleAction = useCallback(async (process, action) => {
    if (!result) return;
    try {
      await createLog({
        tray_id:    result.tray.id,
        process_id: process.id,
        operator:   operator || null,
        action,
      });
      setResult((prev) => ({
        ...prev,
        processes: prev.processes.map((p) =>
          p.id === process.id ? { ...p, last_action: action } : p
        ),
      }));
      setLastAction({ process: process.name, action });
    } catch (e) {
      setError(e.message);
    }
  }, [result, operator]);

  const reset = () => {
    setScanning(true);
    setResult(null);
    setError(null);
    setLastAction(null);
  };

  // ── Setup form ────────────────────────────────────────────────
  if (!setupDone) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 max-w-md mx-auto flex flex-col justify-center">
        <h1 className="text-2xl font-bold text-center mb-6">เลือกผู้ปฏิบัติงาน</h1>
        <form onSubmit={saveSetup} className="bg-white rounded-2xl shadow border p-6 space-y-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            ผู้ปฏิบัติงาน *
            {operators.length > 0 ? (
              <select
                className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                required
              >
                <option value="">— เลือกผู้ปฏิบัติงาน —</option>
                {operators.map((op) => (
                  <option key={op.id} value={op.name}>
                    {op.name}{op.employee_id ? ` (${op.employee_id})` : ''}{op.department ? ` — ${op.department}` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="กรอกชื่อผู้ปฏิบัติงาน"
                required
              />
            )}
          </label>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white rounded-xl py-3 font-bold hover:bg-blue-700"
          >
            ยืนยัน — เริ่มสแกน
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center mb-2">สแกน QR Code</h1>

      {/* Operator banner */}
      <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 mb-4 text-sm">
        <span className="text-blue-700">
          👤 <span className="font-semibold">{operator}</span>
        </span>
        <button
          onClick={() => { setSetupDone(false); reset(); }}
          className="text-xs text-blue-500 underline"
        >
          เปลี่ยน
        </button>
      </div>

      {scanning && (
        <QRScanner onScan={handleScan} onError={(e) => setError(e)} />
      )}

      {loading && (
        <div className="text-center py-10 text-gray-500 animate-pulse text-xl">
          กำลังโหลดข้อมูล…
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-300 rounded-2xl p-4 mt-4 text-red-700 text-center">
          {error}
          <br />
          <button onClick={reset} className="mt-3 underline text-sm">ลองใหม่</button>
        </div>
      )}

      {result && !error && (
        <div className="mt-4 space-y-4">
          <div className="bg-white rounded-2xl shadow p-4 border">
            <p className="text-xs text-gray-400 font-medium mb-1">ถาดงาน</p>
            <p className="text-2xl font-bold">{result.tray.qr_code}</p>
            <p className="text-gray-600 text-sm mt-1">
              สายการผลิต: <span className="font-semibold">{result.tray.line_name}</span>
            </p>
            {result.tray.product && (
              <p className="text-gray-600 text-sm">
                สินค้า: <span className="font-semibold">{result.tray.product}</span>
                {result.tray.batch_no && ` (Batch: ${result.tray.batch_no})`}
              </p>
            )}
            <p className="text-gray-600 text-sm">จำนวน: {result.tray.qty} ชิ้น</p>
          </div>

          {lastAction && (
            <div className="bg-green-50 border border-green-300 rounded-xl p-3 text-green-800 text-sm text-center">
              บันทึกแล้ว: {lastAction.process} → {lastAction.action.toUpperCase()}
            </div>
          )}

          <div className="space-y-3">
            {result.processes.map((p) => (
              <ProcessCard key={p.id} process={p} onAction={handleAction} />
            ))}
          </div>

          <button
            onClick={reset}
            className="w-full mt-4 bg-gray-800 text-white rounded-2xl py-4 text-lg font-bold active:bg-gray-900"
          >
            สแกนถาดอื่น
          </button>
        </div>
      )}
    </main>
  );
}
