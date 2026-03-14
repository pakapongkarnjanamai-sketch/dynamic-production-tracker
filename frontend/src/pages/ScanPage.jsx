import { useState, useCallback } from 'react';
import QRScanner   from '../components/QRScanner';
import ProcessCard from '../components/ProcessCard';
import { scanTray, createLog } from '../api/client';

export default function ScanPage() {
  const [scanning,  setScanning]  = useState(true);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [result,    setResult]    = useState(null); // { tray, processes }
  const [lastAction, setLastAction] = useState(null);

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
        action,
      });
      // Optimistically update last_action in UI
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
  }, [result]);

  const reset = () => {
    setScanning(true);
    setResult(null);
    setError(null);
    setLastAction(null);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center mb-4">📷 สแกน QR Code</h1>

      {/* Scanner */}
      {scanning && (
        <QRScanner onScan={handleScan} onError={(e) => setError(e)} />
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-10 text-gray-500 animate-pulse text-xl">
          กำลังโหลดข้อมูล…
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-300 rounded-2xl p-4 mt-4 text-red-700 text-center">
          ⚠️ {error}
          <br />
          <button onClick={reset} className="mt-3 underline text-sm">
            ลองใหม่
          </button>
        </div>
      )}

      {/* Result */}
      {result && !error && (
        <div className="mt-4 space-y-4">
          {/* Tray Info */}
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

          {/* Last action toast */}
          {lastAction && (
            <div className="bg-green-50 border border-green-300 rounded-xl p-3 text-green-800 text-sm text-center">
              ✅ บันทึกแล้ว: {lastAction.process} → {lastAction.action.toUpperCase()}
            </div>
          )}

          {/* Process Cards */}
          <div className="space-y-3">
            {result.processes.map((p) => (
              <ProcessCard
                key={p.id}
                process={p}
                onAction={handleAction}
              />
            ))}
          </div>

          <button
            onClick={reset}
            className="w-full mt-4 bg-gray-800 text-white rounded-2xl py-4 text-lg font-bold active:bg-gray-900"
          >
            🔄 สแกนถาดอื่น
          </button>
        </div>
      )}
    </main>
  );
}
