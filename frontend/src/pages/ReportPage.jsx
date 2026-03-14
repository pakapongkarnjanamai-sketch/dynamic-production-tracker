import { useEffect, useState } from 'react';
import { getLogsSummary, getLogs } from '../api/client';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration & Helpers
// ─────────────────────────────────────────────────────────────────────────────
const TRAY_STATUS_COLORS = {
  pending:     'bg-gray-100 text-gray-600',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed:   'bg-green-100  text-green-700',
  on_hold:     'bg-red-100    text-red-700',
};

const TABS = [
  {
    id: 'trays', label: 'รายงานถาดงาน', enLabel: 'Tray Status', color: 'amber',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    id: 'processes', label: 'สายการผลิต & ขั้นตอน', enLabel: 'Process Performance', color: 'blue',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 'operators', label: 'ผู้ปฏิบัติงาน', enLabel: 'Operator Performance', color: 'emerald',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const TAB_COLORS = {
  blue:    { tab: 'border-blue-500   bg-blue-50   text-blue-700',      header: 'from-blue-500   to-blue-600'   },
  amber:   { tab: 'border-amber-500  bg-amber-50  text-amber-700',     header: 'from-amber-500  to-amber-600'  },
  emerald: { tab: 'border-emerald-500 bg-emerald-50 text-emerald-700', header: 'from-emerald-500 to-emerald-600' },
};

function SectionCard({ tab, children }) {
  const c = TAB_COLORS[tab.color];
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden mt-6">
      <div className={`bg-gradient-to-r ${c.header} px-6 py-4 flex items-center gap-3 text-white`}>
        <div className="bg-white/20 rounded-lg p-1.5">{tab.icon}</div>
        <div>
          <h2 className="text-base font-bold leading-none">{tab.label}</h2>
          <p className="text-xs text-white/70 mt-0.5">{tab.enLabel}</p>
        </div>
      </div>
      <div className="p-0 sm:p-2">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Tray Report Panel
// ─────────────────────────────────────────────────────────────────────────────
function TrayReportPanel({ data, search, onSearch }) {
  const filtered = data.filter(
    (r) =>
      r.qr_code.toLowerCase().includes(search.toLowerCase()) ||
      (r.product || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.line_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="p-4 flex items-center justify-between border-b bg-gray-50">
        <input
          type="search"
          placeholder="ค้นหา QR / สินค้า / สาย…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-full max-w-xs bg-white"
        />
        <span className="text-xs text-gray-500 font-medium">พบ {filtered.length} รายการ</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b bg-gray-50 uppercase tracking-wider text-xs">
              <th className="px-4 py-3">QR Code</th>
              <th className="px-4 py-3">สินค้า</th>
              <th className="px-4 py-3">Batch</th>
              <th className="px-4 py-3">สายการผลิต</th>
              <th className="px-4 py-3 text-center">สถานะ</th>
              <th className="px-4 py-3 text-center">เสร็จ (ขั้นตอน)</th>
              <th className="px-4 py-3 text-center">NG</th>
              <th className="px-4 py-3">อัปเดตล่าสุด</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">ไม่พบข้อมูล</td></tr>
            )}
            {filtered.map((r) => (
              <tr key={r.tray_id} className="hover:bg-amber-50/50 transition-colors bg-white">
                <td className="px-4 py-3 font-mono font-semibold text-gray-800">{r.qr_code}</td>
                <td className="px-4 py-3 text-gray-600">{r.product ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs font-mono">{r.batch_no ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{r.line_name ?? '—'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs rounded-full px-3 py-0.5 font-semibold ${TRAY_STATUS_COLORS[r.status] ?? ''}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-bold text-green-600">{r.finished_processes ?? 0}</td>
                <td className="px-4 py-3 text-center font-bold text-red-600">{r.ng_count ?? 0}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {r.last_activity ? new Date(r.last_activity).toLocaleString('th-TH') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Lines & Processes Report Panel
// ─────────────────────────────────────────────────────────────────────────────
function ProcessReportPanel({ logs }) {
  // จัดกลุ่มข้อมูล Log ตาม สายการผลิต และ ขั้นตอน
  const stats = logs.reduce((acc, log) => {
    const key = `${log.line_name}-${log.sequence}-${log.process_name}`;
    if (!acc[key]) {
      acc[key] = { line: log.line_name, process: log.process_name, seq: log.sequence, start: 0, finish: 0, ng: 0 };
    }
    if (log.action === 'start') acc[key].start++;
    if (log.action === 'finish') acc[key].finish++;
    if (log.action === 'ng') acc[key].ng++;
    return acc;
  }, {});

  const rows = Object.values(stats).sort((a, b) => a.line.localeCompare(b.line) || a.seq - b.seq);

  let currentLine = null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b bg-gray-50 uppercase tracking-wider text-xs">
            <th className="px-4 py-3">สายการผลิต</th>
            <th className="px-4 py-3">ขั้นตอน</th>
            <th className="px-4 py-3 text-center text-blue-600">▶ เริ่มงาน (Start)</th>
            <th className="px-4 py-3 text-center text-green-600">✔ เสร็จสิ้น (Finish)</th>
            <th className="px-4 py-3 text-center text-red-600">✖ ของเสีย (NG)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">ยังไม่มีประวัติการทำงาน</td></tr>}
          {rows.map((r, i) => {
            const showLine = r.line !== currentLine;
            currentLine = r.line;
            return (
              <tr key={i} className="hover:bg-blue-50/50 transition-colors bg-white">
                <td className="px-4 py-3 font-semibold text-gray-800 border-r border-gray-50">
                  {showLine ? r.line : ''}
                </td>
                <td className="px-4 py-3 text-gray-700 font-medium">
                  <span className="text-xs text-gray-400 mr-2">{r.seq}.</span>{r.process}
                </td>
                <td className="px-4 py-3 text-center font-bold text-blue-600 bg-blue-50/30">{r.start}</td>
                <td className="px-4 py-3 text-center font-bold text-green-600 bg-green-50/30">{r.finish}</td>
                <td className="px-4 py-3 text-center font-bold text-red-600 bg-red-50/30">{r.ng}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Operator Report Panel
// ─────────────────────────────────────────────────────────────────────────────
function OperatorReportPanel({ logs }) {
  // จัดกลุ่มข้อมูล Log ตาม ชื่อผู้ปฏิบัติงาน
  const stats = logs.reduce((acc, log) => {
    const op = log.operator || 'ไม่ระบุชื่อ (Unknown)';
    if (!acc[op]) {
      acc[op] = { name: op, start: 0, finish: 0, ng: 0, lastActive: log.logged_at };
    }
    if (log.action === 'start') acc[op].start++;
    if (log.action === 'finish') acc[op].finish++;
    if (log.action === 'ng') acc[op].ng++;

    // หาเวลาล่าสุดที่ทำงาน
    if (new Date(log.logged_at) > new Date(acc[op].lastActive)) {
      acc[op].lastActive = log.logged_at;
    }
    return acc;
  }, {});

  // เรียงลำดับตามคนที่กด Finish เยอะสุด
  const rows = Object.values(stats).sort((a, b) => b.finish - a.finish);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b bg-gray-50 uppercase tracking-wider text-xs">
            <th className="px-4 py-3">ผู้ปฏิบัติงาน</th>
            <th className="px-4 py-3 text-center text-blue-600">▶ เริ่มงาน (Start)</th>
            <th className="px-4 py-3 text-center text-green-600">✔ เสร็จสิ้น (Finish)</th>
            <th className="px-4 py-3 text-center text-red-600">✖ ของเสีย (NG)</th>
            <th className="px-4 py-3">ทำงานล่าสุดเมื่อ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">ยังไม่มีประวัติการทำงาน</td></tr>}
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-emerald-50/50 transition-colors bg-white">
              <td className="px-4 py-3 font-semibold text-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    {r.name.charAt(0)}
                  </div>
                  {r.name}
                </div>
              </td>
              <td className="px-4 py-3 text-center font-bold text-blue-600 bg-blue-50/30">{r.start}</td>
              <td className="px-4 py-3 text-center font-bold text-green-600 bg-green-50/30">{r.finish}</td>
              <td className="px-4 py-3 text-center font-bold text-red-600 bg-red-50/30">{r.ng}</td>
              <td className="px-4 py-3 text-gray-400 text-xs">
                {r.lastActive ? new Date(r.lastActive).toLocaleString('th-TH') : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Report Page
// ─────────────────────────────────────────────────────────────────────────────
export default function ReportPage() {
  const [activeTab, setActiveTab] = useState('trays');
  const [summaryData, setSummaryData] = useState([]);
  const [logsData, setLogsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const loadData = () => {
    setLoading(true);
    setError(null);

    // ดึงข้อมูล 2 ส่วนพร้อมกัน:
    // 1. Summary ของถาด
    // 2. Logs ย้อนหลัง (limit 2000 เพื่อนำมาจัดกลุ่มหา Performance)
    Promise.all([
      getLogsSummary(),
      getLogs({ limit: 2000 })
    ])
      .then(([summary, logs]) => {
        setSummaryData(summary);
        setLogsData(logs);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const currentTabDef = TABS.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ── Header & Tab Bar ── */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">รายงานผลการผลิต</h1>
            <p className="text-xs text-gray-400 mt-0.5">Production Reports & Analytics</p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 bg-gray-800 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            รีเฟรชข้อมูล
          </button>
        </div>

        <nav className="max-w-5xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const c = TAB_COLORS[tab.color];
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? `${c.tab} border-b-2`
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* ── Content Area ── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <svg className="animate-spin w-8 h-8 mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            กำลังโหลดข้อมูลรายงาน…
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mt-6 text-center">
            {error}
          </div>
        ) : (
          <SectionCard tab={currentTabDef}>
            {activeTab === 'trays'     && <TrayReportPanel data={summaryData} search={search} onSearch={setSearch} />}
            {activeTab === 'processes' && <ProcessReportPanel logs={logsData} />}
            {activeTab === 'operators' && <OperatorReportPanel logs={logsData} />}
          </SectionCard>
        )}
      </main>
    </div>
  );
}
