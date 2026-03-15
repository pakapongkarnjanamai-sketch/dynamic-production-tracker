import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import QRScanner from '../components/QRScanner';
import { scanTray } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function ScanPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const operator = (user?.operator_name || user?.name || '').trim();

  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [scanKey,  setScanKey]  = useState(0);
  const [manualCode, setManualCode] = useState('');

  // Ref guard — survives stale closures inside QRScanner's useEffect
  const processingRef = useRef(false);

  // ถ้ากลับมาจากหน้า detail → block ให้ไม่รับ QR ทันที​ 1.5 วินาทีเพื่อให้หันกล้องออกจาก QR เดิม
  useEffect(() => {
    if (state?.cooldown) {
      processingRef.current = true;
      const t = setTimeout(() => { processingRef.current = false; }, 1500);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScan = useCallback(async (qrCode) => {
    if (processingRef.current) return;
    const code = String(qrCode || '').trim();
    if (!code) {
      setError('กรุณากรอกรหัสหรือสแกน QR');
      return;
    }
    processingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const data = await scanTray(code);
      navigate('/scan/detail', { state: { result: data, operator } });
    } catch (e) {
      setError(e.message);
      processingRef.current = false;
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operator, navigate]);

  const reset = () => {
    setError(null);
    setManualCode('');
    processingRef.current = false;
    setScanKey((k) => k + 1);
  };

  const submitManualCode = async (e) => {
    e.preventDefault();
    await handleScan(manualCode);
  };

// ── Step 2: Scan ────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white px-4 py-3 shadow-md z-20 relative">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold text-lg shadow-inner">
              {operator.charAt(0)}
            </div>
            <div className="leading-tight">
              <div className="font-bold text-lg">{operator}</div>
              <div className="text-blue-200 text-xs">พร้อมสแกน</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col w-full p-4 max-w-md mx-auto gap-4">

        {/* Loading */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <svg className="animate-spin w-12 h-12 mb-4 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-lg font-medium animate-pulse">กำลังประมวลผล...</p>
          </div>
        )}

        {/* Scanner + Manual Input */}
        {!loading && (
          <div className="flex-1 flex flex-col items-center justify-start gap-4 pt-2">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800">สแกน QR Code</h2>
              <p className="text-gray-500 text-sm mt-1">สแกนถาดงานเพื่อบันทึกขั้นตอน</p>
            </div>

            {!error && (
              <div className="w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-black">
                <QRScanner key={scanKey} onScan={handleScan} onError={(e) => setError('ไม่สามารถเปิดกล้องได้: ' + e)} />
              </div>
            )}

            {error && (
              <div className="w-full bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <h2 className="text-base font-bold text-red-700">เกิดข้อผิดพลาด</h2>
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                  </div>
                  <button onClick={reset} className="bg-red-600 text-white rounded-lg px-3 py-2 text-sm font-bold active:scale-95 transition-transform shadow-sm">
                    ลองใหม่
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={submitManualCode} className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">สแกนด้วยเครื่องอ่านหรือพิมพ์รหัส</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 border-2 border-gray-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="เช่น TRAY-000123"
                  autoCapitalize="off"
                  autoCorrect="off"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="shrink-0 bg-blue-600 text-white rounded-xl px-4 py-3 font-bold active:scale-95 transition-transform disabled:opacity-60"
                  disabled={loading}
                >
                  ยืนยัน
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">กด Enter ได้ทันที เหมาะกับเครื่องอ่านบาร์โค้ดแบบคีย์บอร์ด</p>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
