import { useState, useCallback, useEffect, useRef } from 'react';
import QRScanner from '../components/QRScanner';
import { scanTray, createLog, getOperators } from '../api/client';

const LS_OPERATOR = 'mes_operator';

function getInitialStep() {
  return localStorage.getItem(LS_OPERATOR) ? 'done' : 'operator';
}

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

export default function ScanPage() {
  const [setupStep, setSetupStep] = useState(getInitialStep);

  const [operators, setOperators] = useState([]);
  const [operator,  setOperator]  = useState(() => localStorage.getItem(LS_OPERATOR) || '');

  const [scanning,   setScanning]   = useState(true);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [result,     setResult]     = useState(null);
  const [toast, setToast] = useState(null);

  // Ref guard — survives stale closures inside QRScanner's useEffect
  const processingRef = useRef(false);

  useEffect(() => {
    getOperators({ active_only: 'true' }).then(setOperators).catch(() => {});
  }, []);

  // Auto-dismiss toast after 2.5 s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const saveOperator = (e) => {
    e.preventDefault();
    localStorage.setItem(LS_OPERATOR, operator);
    setSetupStep('done');
  };

  const clearSetup = () => {
    processingRef.current = false;
    localStorage.removeItem(LS_OPERATOR);
    setOperator('');
    setSetupStep('operator');
    setScanning(true);
    setResult(null);
    setError(null);
    setToast(null);
  };

  const handleScan = useCallback(async (qrCode) => {
    if (processingRef.current) return;
    processingRef.current = true;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // intentionally empty — processingRef is a stable ref, not reactive state

  const handleAction = useCallback(async (process, action) => {
    if (!result) return;
    setLoading(true);
    setError(null);
    try {
      await createLog({
        tray_id:    result.tray.id,
        process_id: process.id,
        operator:   operator || null,
        action,
      });
      if (navigator.vibrate) navigator.vibrate(100);
      const actionLabel = action === 'start' ? 'เริ่มงาน' : action === 'finish' ? 'เสร็จสิ้น' : 'NG';
      setToast(`${process.name} — ${actionLabel}`);
      if (action === 'start') {
        // อยู่หน้าเดิม re-fetch เพื่ออัปเดตสถานะ
        const fresh = await scanTray(result.tray.qr_code);
        setResult(fresh);
      } else {
        // finish / ng → กลับหน้าสแกนรอถาดถัดไป
        processingRef.current = false;
        setScanning(true);
        setResult(null);
        setError(null);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [result, operator]);

  const reset = () => {
    processingRef.current = false;
    setScanning(true);
    setResult(null);
    setError(null);
  };

  // Derive current process state from scan result
  // currentProcess = first process (by sequence) that hasn't been 'finish'-ed
  const currentProcess = result?.processes.find((p) => p.last_action !== 'finish') ?? null;
  const trayComplete   = !!result && result.processes.length > 0 &&
                         result.processes.every((p) => p.last_action === 'finish');
  const doneCount      = result?.processes.filter((p) => p.last_action === 'finish').length ?? 0;
  const totalCount     = result?.processes.length ?? 0;


  // ── Step 1: Operator Setup ────────────────────────────────────
  if (setupStep === 'operator') {
    return (
      <main className="min-h-screen bg-gray-100 flex flex-col p-4">
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-800">ผู้ปฏิบัติงาน</h1>
            <p className="text-gray-500 mt-2">กรุณาระบุตัวตนเพื่อเริ่มงาน</p>
          </div>

          <form onSubmit={saveOperator} className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 space-y-6">
            <label className="flex flex-col gap-2 text-lg font-semibold text-gray-700">
              เลือกชื่อของคุณ
              {operators.length > 0 ? (
                <select
                  className="border-2 border-gray-300 rounded-2xl px-4 py-4 text-lg focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 bg-gray-50"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  required
                >
                  <option value="">— เลือกรายชื่อ —</option>
                  {operators.map((op) => (
                    <option key={op.id} value={op.name}>
                      {op.name} {op.department ? `(${op.department})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="border-2 border-gray-300 rounded-2xl px-4 py-4 text-lg focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 bg-gray-50"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  placeholder="พิมพ์ชื่อของคุณ..."
                  required
                />
              )}
            </label>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white rounded-2xl py-5 text-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform"
            >
              ถัดไป ➔
            </button>
          </form>
        </div>
      </main>
    );
  }

  // ── Step 2: Scan & Act ────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-100 flex flex-col">
      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 whitespace-nowrap">
          <span className="text-green-400 text-xl">✓</span>
          <span className="font-semibold">บันทึกสำเร็จ — {toast}</span>
        </div>
      )}
      {/* Header */}
      <div className="bg-gray-900 text-white px-4 py-3 pb-4 shadow-md rounded-b-3xl">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold text-lg">
              {operator.charAt(0)}
            </div>
            <div className="leading-tight">
              <div className="font-bold text-lg">{operator}</div>
              <div className="text-blue-200 text-xs">
                {result ? (result.tray.line_name || 'N/A') : 'พร้อมสแกน'}
              </div>
            </div>
          </div>
          <button onClick={clearSetup} className="bg-gray-800 border border-gray-600 text-white text-xs px-3 py-2 rounded-xl active:bg-gray-700">
            เปลี่ยน
          </button>
        </div>
      </div>

      <div className={`flex-1 flex flex-col ${scanning && !loading ? '' : 'p-4 max-w-md mx-auto w-full gap-4'}`}>

        {/* Scanner — edge-to-edge full height */}
        {scanning && !loading && (
          <div className="flex-1 relative bg-black overflow-hidden">
            <QRScanner onScan={handleScan} onError={(e) => setError('ไม่สามารถเปิดกล้องได้: ' + e)} />
            {/* Text overlay at top */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent px-4 pt-5 pb-10 text-center pointer-events-none">
              <h2 className="text-2xl font-bold text-white drop-shadow">สแกน QR Code</h2>
              <p className="text-white/70 text-sm mt-1">สแกนถาดงานเพื่อบันทึกขั้นตอน</p>
            </div>
            {/* Scan frame guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-56 border-2 border-white/50 rounded-2xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl"></div>
              </div>
            </div>
          </div>
        )}

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

        {/* Error */}
        {error && !loading && (
          <div className="flex-1 flex flex-col justify-center">
            <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6 text-center">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-red-700 mb-2">เกิดข้อผิดพลาด</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <button onClick={reset} className="w-full bg-red-600 text-white rounded-2xl py-4 text-lg font-bold active:scale-95 transition-transform shadow-md">
                ลองสแกนใหม่
              </button>
            </div>
          </div>
        )}

        {/* Result View */}
        {result && !error && !loading && (
          <>
            {/* Tray Info */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-blue-50 px-5 py-3 border-b border-blue-100 flex justify-between items-center">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">ถาดงาน</span>
                <span className="text-xs font-bold bg-blue-200 text-blue-800 px-2 py-1 rounded-lg">QTY: {result.tray.qty}</span>
              </div>
              <div className="p-5">
                <p className="text-4xl font-black text-gray-800 font-mono tracking-tight text-center border-b border-dashed border-gray-300 pb-4 mb-4">
                  {result.tray.qr_code}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-400 font-medium mb-0.5">สินค้า</p>
                    <p className="font-bold text-gray-800 text-base">{result.tray.product || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-medium mb-0.5">Batch</p>
                    <p className="font-bold text-gray-800 text-base font-mono">{result.tray.batch_no || '—'}</p>
                  </div>
                </div>
                {/* Progress bar */}
                {totalCount > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>ความคืบหน้า</span>
                      <span>{doneCount}/{totalCount} ขั้นตอน</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Process Progress List */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">ขั้นตอนการผลิต</span>
              </div>
              <div className="divide-y divide-gray-100">
                {result.processes.length === 0 ? (
                  <div className="p-5 text-center text-gray-400">ไม่มีขั้นตอนที่กำหนดสำหรับสายนี้</div>
                ) : result.processes.map((p) => {
                  const isCurrent = !trayComplete && currentProcess?.id === p.id;
                  const isDone    = p.last_action === 'finish';
                  const isNG      = p.last_action === 'ng';
                  const isStarted = p.last_action === 'start';
                  return (
                    <div key={p.id} className={`px-5 py-4 flex items-center gap-4 ${isCurrent ? 'bg-blue-50' : ''}`}>
                      {/* Status circle */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                        isDone    ? 'bg-green-500 text-white' :
                        isNG      ? 'bg-red-500 text-white' :
                        isStarted ? 'bg-blue-500 text-white' :
                        isCurrent ? 'bg-white text-blue-600 border-2 border-blue-400' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {isDone ? '✓' : isNG ? '✗' : isStarted ? '▶' : p.sequence}
                      </div>
                      {/* Name + meta */}
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold truncate ${
                          isCurrent ? 'text-blue-800' :
                          isDone    ? 'text-green-700' :
                          isNG      ? 'text-red-700' :
                          'text-gray-400'
                        }`}>
                          {p.name}
                        </div>
                        {(isDone || isNG || isStarted) && (
                          <div className="text-xs text-gray-500 mt-0.5 flex gap-2 flex-wrap">
                            {p.last_operator && <span>👤 {p.last_operator}</span>}
                            {p.last_logged_at && <span>🕐 {formatTime(p.last_logged_at)}</span>}
                          </div>
                        )}
                        {isCurrent && !p.last_action && <div className="text-xs text-blue-500 font-medium mt-0.5">← ขั้นตอนถัดไป</div>}
                        {isCurrent && isStarted       && <div className="text-xs text-blue-500 font-medium mt-0.5">← กำลังดำเนินการ</div>}
                        {isCurrent && isNG            && <div className="text-xs text-red-500 font-medium mt-0.5">← ต้องแก้ไข</div>}
                      </div>
                      {/* Badge */}
                      {isDone    && <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-lg flex-shrink-0">เสร็จ</span>}
                      {isNG && !isCurrent && <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-lg flex-shrink-0">NG</span>}
                      {isCurrent && <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-lg flex-shrink-0 animate-pulse">ดำเนินการ</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons — shown only for current process */}
            {trayComplete ? (
              <div className="bg-green-50 border-2 border-green-400 rounded-3xl p-6 text-center">
                <div className="text-5xl mb-3">🎉</div>
                <h2 className="text-2xl font-black text-green-700 mb-1">เสร็จสมบูรณ์!</h2>
                <p className="text-green-600">ถาดนี้ผ่านครบทุก {totalCount} ขั้นตอนแล้ว</p>
              </div>
            ) : currentProcess && (
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200">
                <p className="text-center font-bold text-gray-800 text-lg mb-1">{currentProcess.name}</p>
                <p className="text-center text-gray-500 text-sm mb-4">ขั้นตอนที่ {currentProcess.sequence} — เลือกสถานะ</p>
                <div className="grid gap-3">
                  <button
                    onClick={() => handleAction(currentProcess, 'start')}
                    disabled={currentProcess.last_action === 'start'}
                    className="flex items-center justify-center gap-3 bg-blue-600 text-white rounded-2xl py-5 text-2xl font-bold active:scale-95 transition-transform shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>▶</span> เริ่มงาน
                  </button>
                  <button
                    onClick={() => handleAction(currentProcess, 'finish')}
                    disabled={!currentProcess.last_action}
                    className="flex items-center justify-center gap-3 bg-green-500 text-white rounded-2xl py-5 text-2xl font-bold active:scale-95 transition-transform shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>✔</span> เสร็จสิ้น
                  </button>
                  <button
                    onClick={() => handleAction(currentProcess, 'ng')}
                    disabled={!currentProcess.last_action}
                    className="flex items-center justify-center gap-3 bg-red-500 text-white rounded-2xl py-5 text-2xl font-bold active:scale-95 transition-transform shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>✖</span> ของเสีย (NG)
                  </button>
                </div>
              </div>
            )}

            {/* Scan Next */}
            <button
              onClick={reset}
              className="w-full bg-gray-800 text-white rounded-2xl py-5 text-xl font-bold active:bg-gray-700 active:scale-95 transition-transform shadow-md flex items-center justify-center gap-2 mb-4"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              สแกนถาดต่อไป
            </button>
          </>
        )}
      </div>
    </main>
  );
}
