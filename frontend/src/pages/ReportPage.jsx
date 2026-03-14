import { useEffect, useState } from 'react';
import { getLogsSummary, getLogs } from '../api/client';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration & Helpers
// ─────────────────────────────────────────────────────────────────────────────
const TRAY_STATUS_COLORS = {
  pending:     'bg-gray-100 text-gray-600 border-gray-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  completed:   'bg-green-100 text-green-700 border-green-200',
  on_hold:     'bg-red-100 text-red-700 border-red-200',
};

const ACTION_STYLE = {
  start:  'bg-blue-100 text-blue-700 border-blue-200',
  finish: 'bg-green-100 text-green-700 border-green-200',
  ng:     'bg-red-100 text-red-600 border-red-200',
};

const TABS = [
  {
    id: 'trays', label: 'รายงานถาดงาน', enLabel: 'Tray Status', color: 'amber',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    id: 'processes', label: 'สายการผลิต & ขั้นตอน', enLabel: 'Process Performance', color: 'blue',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 'operators', label: 'ผู้ปฏิบัติงาน', enLabel: 'Operator Performance', color: 'emerald',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const TAB_COLORS = {
  blue:    { tab: 'border-blue-500 bg-blue-50 text-blue-700', header: 'from-blue-500 to-blue-600', rowHover: 'hover:bg-blue-50' },
  amber:   { tab: 'border-amber-500 bg-amber-50 text-amber-700', header: 'from-amber-500 to-amber-600', rowHover: 'hover:bg-amber-50' },
  emerald: { tab: 'border-emerald-500 bg-emerald-50 text-emerald-700', header: 'from-emerald-500 to-emerald-600', rowHover: 'hover:bg-emerald-50' },
};

function SectionCard({ tab, children, count }) {
  const c = TAB_COLORS[tab.color];
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className={`bg-gradient-to-r ${c.header} px-6 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3 text-white">
          <div className="bg-white/20 rounded-lg p-1.5">{tab.icon}</div>
          <div>
            <h2 className="text-base font-bold leading-none">{tab.label}</h2>
            <p className="text-xs text-white/70 mt-0.5">{tab.enLabel}</p>
          </div>
        </div>
        {count != null && (
          <span className="bg-white/20 text-white text-xs font-semibold rounded-full px-3 py-1">
            {count} รายการ
          </span>
        )}
      </div>
      <div className="p-6 bg-gray-50/30">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Tray Report Panel & Details (Master-Detail)
// ─────────────────────────────────────────────────────────────────────────────

// ── Sub-panel: แสดงประวัติของถาดงาน (View Only) ──
function TrayLogsViewPanel({ tray }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // ดึงประวัติเฉพาะของ tray_id ที่ถูกเลือก
    getLogs({ tray_id: tray.tray_id })
      .then(setLogs)
      .catch((e) => alert(e.message))
      .finally(() => setLoading(false));
  }, [tray.tray_id]);

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">
          ประวัติการผลิต: <span className="font-mono text-amber-700">{tray.qr_code}</span>
        </h3>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm flex-1">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-xs text-gray-500 uppercase tracking-wide border-b sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3 text-left">เวลา</th>
                <th className="px-3 py-3 text-left">ขั้นตอน</th>
                <th className="px-3 py-3 text-left">ผู้ปฏิบัติ</th>
                <th className="px-3 py-3 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400">กำลังโหลดข้อมูล...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400">ยังไม่มีประวัติการผลิต</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(log.logged_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      <span className="font-mono text-gray-400 text-xs mr-1">#{log.sequence}</span>
                      {log.process_name}
                    </td>
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{log.operator || '—'}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-xs border rounded-full px-2 py-0.5 font-semibold ${ACTION_STYLE[log.action] || 'bg-gray-100 text-gray-500'}`}>
                        {log.action}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Main Panel: สรุปถาดงาน ──
function TrayReportPanel({ data, search, onSearch, c }) {
  const [selectedTrayId, setSelectedTrayId] = useState(null);

  const filtered = data.filter(
    (r) =>
      r.qr_code.toLowerCase().includes(search.toLowerCase()) ||
      (r.product || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.line_name || '').toLowerCase().includes(search.toLowerCase())
  );

  // เลือกถาดแรกอัตโนมัติ
  useEffect(() => {
    if (!selectedTrayId && filtered.length > 0) setSelectedTrayId(filtered[0].tray_id);
    else if (filtered.length > 0 && !filtered.find(t => t.tray_id === selectedTrayId)) setSelectedTrayId(filtered[0].tray_id);
  }, [filtered, selectedTrayId]);

  const selectedTray = filtered.find(t => t.tray_id === selectedTrayId);

  return (
    <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8">
      {/* ฝั่งซ้าย: ตารางสรุปถาดงาน */}
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">ภาพรวมถาดงาน</h3>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <input
            type="search"
            placeholder="ค้นหา QR / สินค้า / สายการผลิต…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          />
          <span className="text-xs text-gray-500 font-medium ml-auto px-2">พบ {filtered.length} รายการ</span>
        </div>

        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm flex-1">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left text-gray-500 text-xs uppercase tracking-wide border-b sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3">QR Code</th>
                  <th className="px-4 py-3">สินค้า</th>
                  <th className="px-4 py-3 text-center">สถานะ</th>
                  <th className="px-4 py-3 text-center">เสร็จ/NG</th>
                  <th className="px-4 py-3">อัปเดตล่าสุด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">ไม่พบข้อมูล</td></tr>
                )}
                {filtered.map((r) => {
                  const isSelected = selectedTrayId === r.tray_id;
                  return (
                    <tr
                      key={r.tray_id}
                      onClick={() => setSelectedTrayId(r.tray_id)}
                      className={`cursor-pointer transition-all border-l-4 ${isSelected ? 'bg-amber-50 border-amber-500' : 'bg-white border-transparent hover:bg-gray-50'}`}
                    >
                      <td className="px-4 py-3">
                        <div className={`font-mono font-semibold text-xs ${isSelected ? 'text-amber-800' : 'text-gray-800'}`}>{r.qr_code}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{r.line_name || '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>{r.product ?? '—'}</div>
                        {r.batch_no && <div className="text-xs text-gray-400 font-mono mt-0.5">{r.batch_no}</div>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs rounded-full px-3 py-1 font-semibold border ${TRAY_STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-green-600 mr-2">{r.finished_processes ?? 0}</span>
                        <span className="font-bold text-red-600">{r.ng_count ?? 0}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {r.last_activity ? new Date(r.last_activity).toLocaleString('th-TH') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ฝั่งขวา: รายละเอียดประวัติ (Logs) */}
      <div className="flex flex-col border-t pt-6 lg:border-t-0 lg:pt-0 lg:border-l lg:pl-8 border-gray-200">
        {selectedTray ? (
          <TrayLogsViewPanel tray={selectedTray} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
            <p>กรุณาเลือกถาดงานจากรายชื่อด้านซ้าย เพื่อดูประวัติการผลิต</p>
          </div>
        )}
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Lines & Processes Report Panel
// ─────────────────────────────────────────────────────────────────────────────
function ProcessReportPanel({ logs, c }) {
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
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">ประสิทธิภาพรายขั้นตอน</h3>
      </div>
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left text-gray-500 text-xs uppercase tracking-wide border-b">
              <tr>
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
                  <tr key={i} className={`bg-white ${c.rowHover} transition-colors`}>
                    <td className="px-4 py-3 font-semibold text-gray-800 border-r border-gray-100">
                      {showLine ? r.line : ''}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mr-2">{r.seq}</span>
                      {r.process}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-blue-600 bg-blue-50/50">{r.start}</td>
                    <td className="px-4 py-3 text-center font-bold text-green-600 bg-green-50/50">{r.finish}</td>
                    <td className="px-4 py-3 text-center font-bold text-red-600 bg-red-50/50">{r.ng}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Operator Report Panel
// ─────────────────────────────────────────────────────────────────────────────
function OperatorReportPanel({ logs, c }) {
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
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">ภาพรวมผู้ปฏิบัติงาน</h3>
      </div>
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left text-gray-500 text-xs uppercase tracking-wide border-b">
              <tr>
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
                <tr key={i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${c.rowHover} transition-colors`}>
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        {r.name.charAt(0)}
                      </div>
                      {r.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-blue-600 bg-blue-50/50">{r.start}</td>
                  <td className="px-4 py-3 text-center font-bold text-green-600 bg-green-50/50">{r.finish}</td>
                  <td className="px-4 py-3 text-center font-bold text-red-600 bg-red-50/50">{r.ng}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {r.lastActive ? new Date(r.lastActive).toLocaleString('th-TH') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
  const currentTabColors = TAB_COLORS[currentTabDef.color];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ── Header & Tab Bar ── */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-gray-800 tracking-tight">รายงานผลการผลิต <span className="text-blue-600">Analytics</span></h1>
            <p className="text-xs text-gray-500 mt-1">สรุปข้อมูลการทำงาน ประสิทธิภาพสายการผลิต และผู้ปฏิบัติงาน</p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 bg-gray-800 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-700 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            รีเฟรชข้อมูล
          </button>
        </div>

        <nav className="max-w-6xl mx-auto px-6 flex gap-2 overflow-x-auto hide-scrollbar">
          {TABS.map((tab) => {
            const c = TAB_COLORS[tab.color];
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? `${c.tab} border-b-2`
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
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
      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-400">
            <svg className="animate-spin w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            กำลังโหลดข้อมูลรายงาน…
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center">
            {error}
          </div>
        ) : (
          <div className="animate-fade-in-up">
            <SectionCard tab={currentTabDef}>
              {activeTab === 'trays'     && <TrayReportPanel data={summaryData} search={search} onSearch={setSearch} c={currentTabColors} />}
              {activeTab === 'processes' && <ProcessReportPanel logs={logsData} c={currentTabColors} />}
              {activeTab === 'operators' && <OperatorReportPanel logs={logsData} c={currentTabColors} />}
            </SectionCard>
          </div>
        )}
      </main>
    </div>
  );
}
