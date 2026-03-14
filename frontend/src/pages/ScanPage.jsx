import { useState, useCallback, useEffect } from 'react';
import QRScanner   from '../components/QRScanner';
import ProcessCard from '../components/ProcessCard';
import { scanTray, createLog, getOperators, getLines, getProcesses } from '../api/client';

const LS_OPERATOR   = 'mes_operator';
const LS_LINE_ID    = 'mes_line_id';
const LS_LINE_NAME  = 'mes_line_name';
const LS_PROCESS_ID = 'mes_process_id';
const LS_PROCESS_NAME = 'mes_process_name';

// setup steps: 'operator' | 'lineprocess' | 'done'
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

  // Load processes whenever the selected line changes
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

  // ── Step 1: Select Operator ───────────────────────────────────
  if (setupStep === 'operator') {
    return (
      <main className="min-h-screen bg-gray-50 p-4 max-w-md mx-auto flex flex-col justify-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</span>
          <span className="text-sm text-gray-400">ผู้ปฏิบัติงาน</span>
          <span className="flex-1 h-px bg-gray-200 mx-1" />
          <span className="w-7 h-7 rounded-full bg-gray-200 text-gray-400 text-xs font-bold flex items-center justify-center">2</span>
          <span className="text-sm text-gray-400">สายการผลิต & ขั้นตอน</span>
        </div>
        <h1 className="text-2xl font-bold text-center mb-6">เลือกผู้ปฏิบัติงาน</h1>
        <form onSubmit={saveOperator} className="bg-white rounded-2xl shadow border p-6 space-y-4">
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
            ถัดไป →
          </button>
        </form>
      </main>
    );
  }

  // ── Step 2: Select Line + Process ────────────────────────────
  if (setupStep === 'lineprocess') {
    return (
      <main className="min-h-screen bg-gray-50 p-4 max-w-md mx-auto flex flex-col justify-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="w-7 h-7 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">✓</span>
          <span className="text-sm text-gray-400">{operator}</span>
          <span className="flex-1 h-px bg-gray-200 mx-1" />
          <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">2</span>
          <span className="text-sm text-gray-400">สายการผลิต & ขั้นตอน</span>
        </div>
        <h1 className="text-2xl font-bold text-center mb-6">เลือกสายการผลิต & ขั้นตอน</h1>
        <form onSubmit={saveLineProcess} className="bg-white rounded-2xl shadow border p-6 space-y-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            สายการผลิต *
            <select
              className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              value={selectedLineId}
              onChange={(e) => { setSelectedLineId(e.target.value); setSelectedProcId(''); }}
              required
            >
              <option value="">— เลือกสายการผลิต —</option>
              {lines.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            ขั้นตอน *
            <select
              className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white disabled:bg-gray-100"
              value={selectedProcId}
              onChange={(e) => setSelectedProcId(e.target.value)}
              required
              disabled={!selectedLineId || lineProcesses.length === 0}
            >
              <option value="">— เลือกขั้นตอน —</option>
              {lineProcesses.map((p) => (
                <option key={p.id} value={p.id}>{p.sequence}. {p.name}</option>
              ))}
            </select>
          </label>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setSetupStep('operator')}
              className="flex-1 border border-gray-300 text-gray-700 rounded-xl py-3 font-bold hover:bg-gray-50"
            >
              ← ย้อนกลับ
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white rounded-xl py-3 font-bold hover:bg-blue-700"
            >
              ยืนยัน — เริ่มสแกน
            </button>
          </div>
        </form>
      </main>
    );
  }

  const lineName    = localStorage.getItem(LS_LINE_NAME)    || '';
  const processName = localStorage.getItem(LS_PROCESS_NAME) || '';
  const activeProcessId = Number(localStorage.getItem(LS_PROCESS_ID));

  // Show only the process matching the selected station
  const visibleProcesses = result
    ? result.processes.filter((p) => p.id === activeProcessId)
    : [];

  return (
    <main className="min-h-screen bg-gray-50 p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center mb-2">สแกน QR Code</h1>

      {/* Info banner */}
      <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 mb-4 text-sm">
        <div className="text-blue-700 space-y-0.5 leading-tight">
          <div>👤 <span className="font-semibold">{operator}</span></div>
          <div className="text-xs text-blue-500">
            🏭 {lineName} &nbsp;›&nbsp; ⚙️ {processName}
          </div>
        </div>
        <button
          onClick={clearSetup}
          className="text-xs text-blue-500 underline shrink-0 ml-2"
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
            {visibleProcesses.length > 0 ? (
              visibleProcesses.map((p) => (
                <ProcessCard key={p.id} process={p} onAction={handleAction} />
              ))
            ) : (
              <div className="text-center text-gray-400 text-sm py-4 bg-white rounded-2xl border">
                ไม่พบขั้นตอน <span className="font-semibold">{processName}</span> ในถาดนี้
              </div>
            )}
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
