import { useEffect, useState } from 'react';
import { getLines, getTrayStats } from '../api/client';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const [lines,   setLines]   = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getLines(), getTrayStats()])
      .then(([l, s]) => { setLines(l); setStats(s); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const activeLines = lines.filter((l) => l.is_active);

  return (
    <main className="min-h-screen bg-white pb-24 md:pb-0">
      <div className="mx-auto max-w-4xl w-full space-y-6 px-4 py-4 sm:px-6 md:px-8 md:py-6">

        {/* ── Hero Section ── */}
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 sm:p-12 shadow-sm text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-slate-50 opacity-50 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-slate-50 opacity-50 pointer-events-none"></div>

          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 relative z-10">VS MES</p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 relative z-10">
            ยินดีต้อนรับสู่พื้นที่ปฏิบัติงาน
          </h1>
          <p className="mt-2 max-w-lg mx-auto text-sm text-slate-500 sm:text-base relative z-10">
            เลือกระบบสแกน QR Code เพื่อเริ่มต้นบันทึกการทำงานของคุณ
          </p>

          <button
            onClick={() => navigate('/scan')}
            className="relative z-10 mt-8 group inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-900 bg-slate-900 px-8 py-5 sm:px-12 sm:py-6 text-xl sm:text-2xl font-bold text-white shadow-sm transition-colors hover:bg-slate-800 active:scale-95"
          >
            <svg className="w-8 h-8 sm:w-10 sm:h-10 group-hover:scale-110 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            สแกนงาน
          </button>
        </div>

        {/* ── Work Status Stats ── */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: 'กำลังดำเนินการ', sub: 'In Progress',
                value: stats.in_progress,
                bg: 'bg-amber-50', border: 'border-amber-200',
                dot: 'bg-amber-500 animate-pulse', text: 'text-amber-700', num: 'text-amber-800',
              },
              {
                label: 'รอดำเนินการ', sub: 'Pending',
                value: stats.pending,
                bg: 'bg-slate-50', border: 'border-slate-200',
                dot: 'bg-slate-400', text: 'text-slate-600', num: 'text-slate-800',
              },
              {
                label: 'เสร็จสิ้น', sub: 'Completed',
                value: stats.completed,
                bg: 'bg-emerald-50', border: 'border-emerald-200',
                dot: 'bg-emerald-500', text: 'text-emerald-700', num: 'text-emerald-800',
              },
              {
                label: 'เกินกำหนด', sub: 'Delayed',
                value: stats.delayed,
                bg: Number(stats.delayed) > 0 ? 'bg-red-50' : 'bg-slate-50',
                border: Number(stats.delayed) > 0 ? 'border-red-200' : 'border-slate-200',
                dot: Number(stats.delayed) > 0 ? 'bg-red-500' : 'bg-slate-300',
                text: Number(stats.delayed) > 0 ? 'text-red-700' : 'text-slate-500',
                num: Number(stats.delayed) > 0 ? 'text-red-800' : 'text-slate-600',
              },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} ${s.border} border rounded-[24px] px-5 py-4 flex flex-col gap-1 shadow-sm`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`}></span>
                  <span className={`text-xs font-semibold ${s.text}`}>{s.label}</span>
                </div>
                <p className={`text-3xl font-black ${s.num} leading-none`}>{s.value ?? 0}</p>
                <p className={`text-xs ${s.text} opacity-70`}>{s.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Status Section ── */}
        <div>
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              ภาพรวมสายการผลิต ({activeLines.length})
            </h2>
          </div>

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white h-28 rounded-[24px] border border-slate-200 shadow-sm animate-pulse"></div>
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-700 text-center">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeLines.length === 0 ? (
                <div className="col-span-full rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  ไม่พบสายการผลิตที่เปิดใช้งาน
                </div>
              ) : (
                activeLines.map((line) => (
                  <div
                    key={line.id}
                    className="rounded-[24px] border border-slate-200 bg-white shadow-sm p-5 hover:shadow-md transition-shadow relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-900 rounded-r-full"></div>

                    <div className="flex justify-between items-start mb-2 pl-3">
                      <p className="text-base font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                        {line.name}
                      </p>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-[11px] font-bold tracking-wide text-emerald-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Active
                      </span>
                    </div>
                    <div className="pl-3">
                      {line.description ? (
                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{line.description}</p>
                      ) : (
                        <p className="text-sm text-slate-400 italic">ไม่มีรายละเอียด</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
