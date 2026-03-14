import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { scanTray, createLog } from '../api/client';

const LS_OPERATOR = 'mes_operator';

// ส่ง cooldown: true เสมอเมื่อกลับไปหน้าสแกน
const goScan = (navigate) => navigate('/scan', { state: { cooldown: true } });

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

export default function TrayDetailPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [result,   setResult]   = useState(state?.result ?? null);
  const [operator] = useState(() => state?.operator || localStorage.getItem(LS_OPERATOR) || '');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [toast,    setToast]    = useState(null);

  // ถ้าเข้าตรงโดยไม่มี state → กลับไปหน้าสแกน
  useEffect(() => {
    if (!result) navigate('/scan', { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-dismiss toast after 2.5 s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleAction = useCallback(async (process, action) => {
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
      const actionLabel = action === 'start' ? 'เริ่มงาน' : action === 'finish' ? 'OK' : 'NG';
      setToast(`${process.name} — ${actionLabel}`);
      if (action === 'start') {
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
  }, [result, operator, navigate]);

  const currentProcess = result?.processes.find((p) => p.last_action !== 'finish') ?? null;
  const trayComplete   = !!result && result.processes.length > 0 &&
                         result.processes.every((p) => p.last_action === 'finish');
  const doneCount      = result?.processes.filter((p) => p.last_action === 'finish').length ?? 0;
  const totalCount     = result?.processes.length ?? 0;

  const startTime  = result?.tray.started_at  ?? null;
  const finishTime = result?.tray.finished_at ?? null;

  if (!result) return null;

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 whitespace-nowrap">
          <span className="text-green-400 text-xl">✓</span>
          <span className="font-semibold">บันทึกสำเร็จ — {toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-900 text-white px-4 py-3 shadow-md z-20 relative">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => goScan(navigate)}
              className="w-9 h-9 bg-gray-800 border border-gray-600 rounded-xl flex items-center justify-center active:bg-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="leading-tight">
              <div className="font-bold text-base">{result.tray.qr_code}</div>
              <div className="text-blue-200 text-xs">{result.tray.line_name || 'N/A'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center font-bold text-sm shadow-inner">
              {operator.charAt(0)}
            </div>
            <span className="text-sm font-medium text-gray-200">{operator}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col w-full p-4 max-w-md mx-auto gap-4">

        {/* Loading overlay */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <svg className="animate-spin w-12 h-12 mb-4 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-lg font-medium animate-pulse">กำลังประมวลผล...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* Error */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-4 text-center">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

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
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>🕐 เริ่ม: {startTime ? formatTime(startTime) : '—'}</span>
                      <span>✅ เสร็จ: {finishTime ? formatTime(finishTime) : '—'}</span>
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
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                        isDone    ? 'bg-green-500 text-white' :
                        isNG      ? 'bg-red-500 text-white' :
                        isStarted ? 'bg-blue-500 text-white' :
                        isCurrent ? 'bg-white text-blue-600 border-2 border-blue-400' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {isDone ? '✓' : isNG ? '✗' : isStarted ? '▶' : p.sequence}
                      </div>
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
                          <div className="text-xs text-gray-500 mt-0.5 flex flex-col gap-0.5">
                            {p.start_logged_at && (
                              <span>▶ เริ่ม {formatTime(p.start_logged_at)}{p.start_operator ? ` · ${p.start_operator}` : ''}</span>
                            )}
                            {p.finish_logged_at && (
                              <span className={p.last_action === 'ng' ? 'text-red-500' : 'text-green-600'}>
                                {p.last_action === 'ng' ? '✗ NG' : '✓ เสร็จ'} {formatTime(p.finish_logged_at)}{p.finish_operator ? ` · ${p.finish_operator}` : ''}
                              </span>
                            )}
                          </div>
                        )}
                        {isCurrent && !p.last_action && <div className="text-xs text-blue-500 font-medium mt-0.5">← ขั้นตอนถัดไป</div>}
                        {isCurrent && isStarted       && <div className="text-xs text-blue-500 font-medium mt-0.5">← กำลังดำเนินการ</div>}
                        {isCurrent && isNG            && <div className="text-xs text-red-500 font-medium mt-0.5">← ต้องแก้ไข</div>}
                      </div>
                      {isDone && <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-lg flex-shrink-0">เสร็จ</span>}
                      {isNG && !isCurrent && <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-lg flex-shrink-0">NG</span>}
                      {isCurrent && !p.last_action && <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-lg flex-shrink-0">ขั้นตอนถัดไป</span>}
                      {isCurrent && isStarted && <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-lg flex-shrink-0 animate-pulse">ดำเนินการ</span>}
                      {isCurrent && isNG && <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-lg flex-shrink-0">ต้องแก้ไข</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
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
                    <span>✔</span> เสร็จสิ้น (OK)
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
              onClick={() => goScan(navigate)}
              className="w-full bg-gray-800 text-white rounded-2xl py-5 text-xl font-bold active:bg-gray-700 active:scale-95 transition-transform shadow-md flex items-center justify-center gap-2 mb-4"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              สแกนใหม่
            </button>
          </>
        )}
      </div>
    </main>
  );
}
