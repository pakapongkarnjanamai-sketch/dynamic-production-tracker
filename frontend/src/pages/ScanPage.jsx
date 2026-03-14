import { useState, useCallback, useEffect } from 'react';
import QRScanner   from '../components/QRScanner';
import { scanTray, createLog, getOperators, getLines, getProcesses } from '../api/client';

const LS_OPERATOR     = 'mes_operator';
const LS_LINE_ID      = 'mes_line_id';
const LS_LINE_NAME    = 'mes_line_name';
const LS_PROCESS_ID   = 'mes_process_id';
const LS_PROCESS_NAME = 'mes_process_name';

function getInitialStep() {
  if (!localStorage.getItem(LS_OPERATOR)) return 'operator';
  if (!localStorage.getItem(LS_LINE_ID))  return 'lineprocess';
  return 'done';
}

export default function ScanPage() {
  const [setupStep,  setSetupStep]  = useState(getInitialStep);

  // operator
  const [operators,  setOperators]  = useState([]);
  const [operator,   setOperator]   = useState(() => localStorage.getItem(LS_OPERATOR) || '');

  // line + process
  const [lines,          setLines]          = useState([]);
  const [selectedLineId, setSelectedLineId] = useState(() => localStorage.getItem(LS_LINE_ID) || '');
  const [lineProcesses,  setLineProcesses]  = useState([]);
  const [selectedProcId, setSelectedProcId] = useState(() => localStorage.getItem(LS_PROCESS_ID) || '');

  const [scanning,   setScanning]   = useState(true);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [result,     setResult]     = useState(null);
  const [lastAction, setLastAction] = useState(null);

  useEffect(() => {
    getOperators({ active_only: 'true' }).then(setOperators).catch(() => {});
    getLines().then(setLines).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedLineId) { setLineProcesses([]); return; }
    getProcesses(selectedLineId).then(setLineProcesses).catch(() => setLineProcesses([]));
  }, [selectedLineId]);

  const saveOperator = (e) => {
    e.preventDefault();
    localStorage.setItem(LS_OPERATOR, operator);
    setSetupStep('lineprocess');
  };

  const saveLineProcess = (e) => {
    e.preventDefault();
    const line = lines.find((l) => String(l.id) === String(selectedLineId));
    const proc = lineProcesses.find((p) => String(p.id) === String(selectedProcId));
    if (!line || !proc) return;
    localStorage.setItem(LS_LINE_ID,       line.id);
    localStorage.setItem(LS_LINE_NAME,     line.name);
    localStorage.setItem(LS_PROCESS_ID,    proc.id);
    localStorage.setItem(LS_PROCESS_NAME,  proc.name);
    setSetupStep('done');
  };

  const clearSetup = () => {
    [LS_OPERATOR, LS_LINE_ID, LS_LINE_NAME, LS_PROCESS_ID, LS_PROCESS_NAME].forEach((k) =>
      localStorage.removeItem(k)
    );
    setOperator('');
    setSelectedLineId('');
    setSelectedProcId('');
    setSetupStep('operator');
    reset();
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
    setLoading(true);
    setError(null);
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

      // ให้หน้าจอสั่นเล็กน้อยเพื่อเป็น feedback (ถ้ามือถือรองรับ)
      if (navigator.vibrate) navigator.vibrate(100);

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [result, operator]);

  const reset = () => {
    setScanning(true);
    setResult(null);
    setError(null);
    setLastAction(null);
  };

  // ── Step 1: Select Operator ───────────────────────────────────
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

  // ── Step 2: Select Line + Process ────────────────────────────
  if (setupStep === 'lineprocess') {
    return (
      <main className="min-h-screen bg-gray-100 flex flex-col p-4">
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-800">สถานีทำงาน</h1>
            <p className="text-gray-500 mt-2">เลือกสายการผลิตและขั้นตอนของคุณ</p>
          </div>

          <form onSubmit={saveLineProcess} className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 space-y-5">
            <label className="flex flex-col gap-2 text-lg font-semibold text-gray-700">
              สายการผลิต
              <select
                className="border-2 border-gray-300 rounded-2xl px-4 py-4 text-lg focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 bg-gray-50"
                value={selectedLineId}
                onChange={(e) => { setSelectedLineId(e.target.value); setSelectedProcId(''); }}
                required
              >
                <option value="">— เลือกสาย —</option>
                {lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-lg font-semibold text-gray-700">
              ขั้นตอน
              <select
                className="border-2 border-gray-300 rounded-2xl px-4 py-4 text-lg focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 bg-gray-50 disabled:opacity-50"
                value={selectedProcId}
                onChange={(e) => setSelectedProcId(e.target.value)}
                required
                disabled={!selectedLineId || lineProcesses.length === 0}
              >
                <option value="">— เลือกขั้นตอน —</option>
                {lineProcesses.map((p) => <option key={p.id} value={p.id}>{p.sequence}. {p.name}</option>)}
              </select>
            </label>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setSetupStep('operator')}
                className="w-1/3 border-2 border-gray-300 text-gray-600 rounded-2xl py-4 text-lg font-bold active:scale-95 transition-transform"
              >
                กลับ
              </button>
              <button
                type="submit"
                className="w-2/3 bg-blue-600 text-white rounded-2xl py-4 text-lg font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform"
              >
                เริ่มสแกน 📷
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  // ── Step 3: Main Scanning & Action ───────────────────────────
  const lineName    = localStorage.getItem(LS_LINE_NAME)    || '';
  const processName = localStorage.getItem(LS_PROCESS_NAME) || '';
  const activeProcessId = Number(localStorage.getItem(LS_PROCESS_ID));

  const visibleProcesses = result ? result.processes.filter((p) => p.id === activeProcessId) : [];
  const activeProcess = visibleProcesses[0]; // ขั้นตอนปัจจุบันที่ operator กำลังทำ

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col">
      {/* ── Status Header ── */}
      <div className="bg-gray-900 text-white px-4 py-3 pb-4 shadow-md rounded-b-3xl">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold text-lg">
              {operator.charAt(0)}
            </div>
            <div className="leading-tight">
              <div className="font-bold text-lg">{operator}</div>
              <div className="text-blue-200 text-xs">
                {lineName} ➔ {processName}
              </div>
            </div>
          </div>
          <button onClick={clearSetup} className="bg-gray-800 border border-gray-600 text-white text-xs px-3 py-2 rounded-xl active:bg-gray-700">
            เปลี่ยน
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 max-w-md mx-auto w-full flex flex-col">

        {/* ── Scanner View ── */}
        {scanning && (
          <div className="flex-1 flex flex-col justify-center">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-200">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">สแกน QR Code</h2>
                <p className="text-gray-500 text-sm">สแกนใบนำงาน หรือ ถาดงาน</p>
              </div>
              <div className="rounded-2xl overflow-hidden bg-black relative">
                <QRScanner onScan={handleScan} onError={(e) => setError(e)} />
              </div>
            </div>
          </div>
        )}

        {/* ── Loading State ── */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <svg className="animate-spin w-12 h-12 mb-4 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-lg font-medium animate-pulse">กำลังประมวลผล...</p>
          </div>
        )}

        {/* ── Error State ── */}
        {error && !loading && (
          <div className="flex-1 flex flex-col justify-center mt-4">
            <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6 text-center">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-red-700 mb-2">เกิดข้อผิดพลาด</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                onClick={reset}
                className="w-full bg-red-600 text-white rounded-2xl py-4 text-lg font-bold active:scale-95 transition-transform shadow-md"
              >
                ลองสแกนใหม่
              </button>
            </div>
          </div>
        )}

        {/* ── Result & Action View ── */}
        {result && !error && !loading && (
          <div className="flex flex-col gap-4 py-2 animate-fade-in-up">

            {/* Tray Info Card (Ticket Style) */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-blue-50 px-5 py-3 border-b border-blue-100 flex justify-between items-center">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">ข้อมูลถาดงาน</span>
                <span className="text-xs font-bold bg-blue-200 text-blue-800 px-2 py-1 rounded-lg">QTY: {result.tray.qty}</span>
              </div>
              <div className="p-5">
                <div className="text-center border-b border-dashed border-gray-300 pb-4 mb-4">
                  <p className="text-4xl font-black text-gray-800 font-mono tracking-tight">{result.tray.qr_code}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 font-medium mb-0.5">สินค้า</p>
                    <p className="font-bold text-gray-800 text-base">{result.tray.product || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-medium mb-0.5">Batch</p>
                    <p className="font-bold text-gray-800 text-base font-mono">{result.tray.batch_no || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Feedback Banner */}
            {lastAction && (
              <div className="bg-green-100 border-2 border-green-400 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-xl flex-shrink-0">✓</div>
                <div>
                  <p className="text-green-800 font-bold leading-tight">บันทึกข้อมูลสำเร็จ!</p>
                  <p className="text-green-700 text-sm">สถานะ: {lastAction.action.toUpperCase()}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {activeProcess ? (
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200">
                <p className="text-center text-gray-500 font-medium text-sm mb-4">เลือกการทำงานสำหรับขั้นตอนนี้</p>
                <div className="grid gap-3">
                  <button
                    onClick={() => handleAction(activeProcess, 'start')}
                    className="flex items-center justify-center gap-3 bg-blue-600 text-white rounded-2xl py-5 text-2xl font-bold active:scale-95 transition-transform shadow-md"
                  >
                    <span>▶</span> เริ่มงาน
                  </button>
                  <button
                    onClick={() => handleAction(activeProcess, 'finish')}
                    className="flex items-center justify-center gap-3 bg-green-500 text-white rounded-2xl py-5 text-2xl font-bold active:scale-95 transition-transform shadow-md"
                  >
                    <span>✔</span> เสร็จสิ้น
                  </button>
                  <button
                    onClick={() => handleAction(activeProcess, 'ng')}
                    className="flex items-center justify-center gap-3 bg-red-500 text-white rounded-2xl py-5 text-2xl font-bold active:scale-95 transition-transform shadow-md"
                  >
                    <span>✖</span> ของเสีย (NG)
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center text-yellow-800">
                ไม่พบขั้นตอน <span className="font-bold">{processName}</span> ในถาดนี้
              </div>
            )}

            {/* Scan Next Button */}
            <button
              onClick={reset}
              className="mt-2 w-full bg-gray-800 text-white rounded-2xl py-5 text-xl font-bold active:bg-gray-700 active:scale-95 transition-transform shadow-md flex items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              สแกนถาดต่อไป
            </button>

          </div>
        )}
      </div>

      {/* CSS Animation for smooth entrance */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease-out forwards;
        }
      `}} />
    </main>
  );
}
