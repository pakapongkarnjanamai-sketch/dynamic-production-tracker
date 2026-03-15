import { useEffect, useState, Fragment } from 'react';
import { getLogsSummary, getLogs, getProcesses, getLines } from '../api/client';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration & Helpers
// ─────────────────────────────────────────────────────────────────────────────
const TRAY_STATUS_COLORS = {
  pending:     'bg-gray-100 text-gray-600 border-gray-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  completed:   'bg-green-100 text-green-700 border-green-200',
  on_hold:     'bg-red-100 text-red-700 border-red-200',
};

const STATUS_LABELS = {
  pending: 'รอดำเนินการ',
  in_progress: 'กำลังดำเนินการ',
  completed: 'เสร็จสิ้น',
  on_hold: 'หยุดพัก / รอแก้ไข',
};

const ACTION_LABELS = {
  start: 'เริ่มงาน',
  finish: 'เสร็จสิ้น (OK)',
  ng: 'ของเสีย (NG)',
};

const ACTION_STYLE = {
  start:  'bg-blue-100 text-blue-700 border-blue-200',
  finish: 'bg-green-100 text-green-700 border-green-200',
  ng:     'bg-red-100 text-red-600 border-red-200',
};

const TABS = [
  {
    id: 'trays', label: 'รายงานงาน', enLabel: 'Work Status', color: 'amber',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    id: 'processes', label: 'สายการผลิต', enLabel: 'Performance', color: 'blue',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 'operators', label: 'ผู้ปฏิบัติงาน', enLabel: 'Operators', color: 'emerald',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const TAB_COLORS = {
  blue:    { tab: 'border-blue-500 bg-blue-50 text-blue-700', header: 'from-blue-500 to-blue-600' },
  amber:   { tab: 'border-amber-500 bg-amber-50 text-amber-700', header: 'from-amber-500 to-amber-600' },
  emerald: { tab: 'border-emerald-500 bg-emerald-50 text-emerald-700', header: 'from-emerald-500 to-emerald-600' },
};

function SectionCard({ tab, children, count }) {
  const c = TAB_COLORS[tab.color];
  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden mb-6">
      <div className={`bg-gradient-to-r ${c.header} px-5 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3 text-white">
          <div className="bg-white/20 rounded-xl p-2">{tab.icon}</div>
          <div>
            <h2 className="text-lg font-bold leading-none">{tab.label}</h2>
            <p className="text-xs text-white/80 mt-1">{tab.enLabel}</p>
          </div>
        </div>
        {count != null && (
          <span className="bg-white/20 text-white text-xs font-semibold rounded-full px-3 py-1 border border-white/30">
            {count} รายการ
          </span>
        )}
      </div>
      <div className="p-4 sm:p-6 bg-gray-50/30">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Tray Report Panel & Details (Mobile-First Card Layout)
// ─────────────────────────────────────────────────────────────────────────────

function TrayLogsViewPanel({ tray }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLogs({ tray_id: tray.tray_id })
      .then(setLogs)
      .catch((e) => alert(e.message))
      .finally(() => setLoading(false));
  }, [tray.tray_id]);

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">ประวัติการทำงาน</h4>
      {loading ? (
        <div className="text-center py-4 text-gray-400 text-sm">กำลังโหลด...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-4 text-gray-400 text-sm">ยังไม่มีประวัติการผลิต</div>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {logs.map((log) => (
            <div key={log.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <div className="font-semibold text-gray-800 text-sm">
                  <span className="text-gray-400 mr-1.5">#{log.sequence}</span>{log.process_name}
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  👤 {log.operator || '—'} · 🕒 {new Date(log.logged_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <span className={`text-[10px] border rounded-full px-2.5 py-1 font-bold ${ACTION_STYLE[log.action] || 'bg-gray-100 text-gray-500'}`}>
                {ACTION_LABELS[log.action] || log.action}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TrayReportPanel({ data, logs, search, onSearch }) {
  const [selectedTrayId, setSelectedTrayId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const latestLogByTray = [...logs].sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at)).reduce((acc, log) => {
    const key = String(log.tray_id);
    if (!acc[key]) acc[key] = log;
    return acc;
  }, {});

  const now = new Date();
  const withDelay = data.map((r) => ({
    ...r,
    isDelayed: r.due_date && new Date(r.due_date) < now && r.status !== 'completed',
  }));

  const pendingCount = withDelay.filter((r) => r.status === 'pending').length;
  const inProgressCount = withDelay.filter((r) => r.status === 'in_progress').length;
  const completedCount = withDelay.filter((r) => r.status === 'completed').length;
  const delayCount = withDelay.filter((r) => r.isDelayed).length;

  const filtered = withDelay.filter((r) => {
    const matchesStatus =
      statusFilter === 'all' ? true : statusFilter === 'delayed' ? r.isDelayed : r.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      r.qr_code.toLowerCase().includes(q) ||
      (r.product || '').toLowerCase().includes(q) ||
      (r.line_name || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const toggleRow = (id) => setSelectedTrayId(prev => prev === id ? null : id);

  return (
    <div className="flex flex-col gap-4">

      {/* ── Scrollable Filter Badges ── */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
        <button onClick={() => setStatusFilter('all')}
          className={`flex-shrink-0 text-sm font-semibold rounded-xl px-4 py-2 border transition-colors ${statusFilter === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300'}`}>
          ทั้งหมด: {withDelay.length}
        </button>
        <button onClick={() => setStatusFilter('in_progress')}
          className={`flex-shrink-0 text-sm font-semibold rounded-xl px-4 py-2 border transition-colors ${statusFilter === 'in_progress' ? 'bg-amber-600 text-white border-amber-600' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
          กำลังทำ: {inProgressCount}
        </button>
        <button onClick={() => setStatusFilter('pending')}
          className={`flex-shrink-0 text-sm font-semibold rounded-xl px-4 py-2 border transition-colors ${statusFilter === 'pending' ? 'bg-gray-600 text-white border-gray-600' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
          รอเริ่ม: {pendingCount}
        </button>
        <button onClick={() => setStatusFilter('completed')}
          className={`flex-shrink-0 text-sm font-semibold rounded-xl px-4 py-2 border transition-colors ${statusFilter === 'completed' ? 'bg-green-600 text-white border-green-600' : 'bg-green-50 text-green-700 border-green-200'}`}>
          เสร็จ: {completedCount}
        </button>
        <button onClick={() => setStatusFilter('delayed')}
          className={`flex-shrink-0 text-sm font-semibold rounded-xl px-4 py-2 border transition-colors ${statusFilter === 'delayed' ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 text-red-700 border-red-300'}`}>
          ล่าช้า: {delayCount}
        </button>
      </div>

      {/* ── Search Bar ── */}
      <div className="flex items-center bg-white p-2 rounded-2xl border border-gray-200 shadow-sm">
        <svg className="w-5 h-5 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input
          type="search"
          placeholder="ค้นหา QR / สินค้า..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="flex-1 outline-none text-base px-3 py-1.5 bg-transparent w-full"
        />
      </div>

      {/* ── Card List ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-2">
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">
            ไม่พบข้อมูลที่ค้นหา
          </div>
        )}
        {filtered.map((r) => {
          const latest = latestLogByTray[String(r.tray_id)] || null;
          const isExpanded = selectedTrayId === r.tray_id;

          return (
            <div
              key={r.tray_id}
              className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-all cursor-pointer ${
                isExpanded ? 'border-amber-400 ring-2 ring-amber-50'
                : r.isDelayed ? 'border-red-300 bg-red-50/30'
                : 'border-gray-200 hover:border-amber-300'
              }`}
              onClick={() => toggleRow(r.tray_id)}
            >
              {/* Header: QR & Status */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-mono font-black text-gray-800 text-lg tracking-tight">{r.qr_code}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{r.line_name || '—'}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`text-[10px] rounded-full px-2.5 py-1 font-bold border ${TRAY_STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {STATUS_LABELS[r.status] || r.status}
                  </span>
                  {r.isDelayed && <span className="text-[10px] rounded-full px-2.5 py-1 font-bold border bg-red-100 text-red-700 border-red-300">ล่าช้า</span>}
                </div>
              </div>

              {/* Body: Product */}
              <div className="mb-4 bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="text-sm font-bold text-gray-800">{r.product || 'ไม่มีชื่อสินค้า'}</div>
                {r.batch_no && <div className="text-xs text-gray-500 font-mono mt-1">Batch: {r.batch_no}</div>}
              </div>

              {/* Footer: Current Status & Due Date */}
              <div className="flex justify-between items-end text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <span className="font-medium">{latest ? latest.process_name : 'ยังไม่เริ่มงาน'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span>{latest?.operator || '—'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-gray-400 mb-0.5">กำหนดส่ง</div>
                  <div className={`font-semibold ${r.isDelayed ? 'text-red-600' : 'text-gray-700'}`}>
                    {r.due_date ? new Date(r.due_date).toLocaleDateString('th-TH') : '—'}
                  </div>
                </div>
              </div>

              {/* Expanded Detail */}
              {isExpanded && <TrayLogsViewPanel tray={r} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Lines & Processes Report Panel (Mobile-First Card Layout)
// ─────────────────────────────────────────────────────────────────────────────
function ProcessReportPanel({ logs, processes, lines }) {
  const [expandedLineId, setExpandedLineId] = useState(null);

  const sortedLogs = [...logs].sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const latestByTask = sortedLogs.reduce((acc, log) => {
    const taskKey = `${log.tray_id}-${log.process_id}`;
    if (!acc[taskKey]) acc[taskKey] = log;
    return acc;
  }, {});

  const activeByProcess = Object.values(latestByTask).reduce((acc, log) => {
    if (log.action !== 'start') return acc;
    const processKey = String(log.process_id);
    if (!acc[processKey]) acc[processKey] = [];
    acc[processKey].push({ qr_code: log.qr_code, logged_at: log.logged_at });
    return acc;
  }, {});

  const statsByProcess = processes.reduce((acc, p) => {
    acc[p.id] = {
      id: p.id, line_id: p.line_id, process: p.name, seq: p.sequence,
      activeItems: (activeByProcess[p.id] || []).sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at)),
      start: 0, finish: 0, ng: 0
    };
    return acc;
  }, {});

  logs.forEach((log) => {
    const key = log.process_id;
    if (statsByProcess[key]) {
      if (log.action === 'start') statsByProcess[key].start++;
      if (log.action === 'finish') statsByProcess[key].finish++;
      if (log.action === 'ng') statsByProcess[key].ng++;
    }
  });

  const lineData = lines.map((line) => {
    const procs = Object.values(statsByProcess).filter((p) => p.line_id === line.id).sort((a, b) => a.seq - b.seq);
    let finishToday = 0;
    let ngToday = 0;
    logs.forEach((log) => {
      const p = statsByProcess[log.process_id];
      if (p && p.line_id === line.id) {
        const loggedAt = new Date(log.logged_at);
        if (loggedAt >= todayStart) {
          if (log.action === 'finish') finishToday++;
          if (log.action === 'ng') ngToday++;
        }
      }
    });
    return { ...line, finishToday, ngToday, processes: procs };
  });

  const toggleRow = (id) => setExpandedLineId((prev) => (prev === id ? null : id));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {lineData.length === 0 && (
        <div className="col-span-full text-center py-10 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">
          ไม่มีข้อมูลสายการผลิต
        </div>
      )}
      {lineData.map((line) => {
        const isExpanded = expandedLineId === line.id;
        return (
          <div key={line.id} className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-all ${isExpanded ? 'border-blue-400 ring-2 ring-blue-50' : 'border-gray-200'}`}>

            {/* Header */}
            <div className="flex justify-between items-start mb-4 cursor-pointer" onClick={() => toggleRow(line.id)}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                  <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{line.name}</h3>
                  <p className="text-xs text-gray-500">{line.processes.length} ขั้นตอนการผลิต</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mb-2" onClick={() => !isExpanded && toggleRow(line.id)}>
              <div className="bg-green-50/50 rounded-xl p-3 border border-green-100 flex flex-col items-center justify-center">
                <span className="text-xs text-green-600 font-semibold mb-1">วันนี้เสร็จ (OK)</span>
                <span className="text-2xl font-black text-green-600">{line.finishToday}</span>
              </div>
              <div className="bg-red-50/50 rounded-xl p-3 border border-red-100 flex flex-col items-center justify-center">
                <span className="text-xs text-red-600 font-semibold mb-1">วันนี้เสีย (NG)</span>
                <span className="text-2xl font-black text-red-600">{line.ngToday}</span>
              </div>
            </div>

            {/* Expanded Process Details */}
            {isExpanded && (
              <div className="mt-5 pt-5 border-t border-gray-100 space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">รายละเอียดแยกตามขั้นตอน</h4>
                {line.processes.length === 0 ? (
                  <div className="text-center py-4 text-gray-400 text-sm">ยังไม่มีขั้นตอนในสายการผลิตนี้</div>
                ) : line.processes.map((p) => (
                  <div key={p.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">{p.seq}</span>
                      {p.process}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                      <div className="bg-white py-1.5 rounded-lg border border-gray-100"><span className="block text-gray-400 mb-0.5">เริ่มงาน</span><span className="font-bold text-blue-600">{p.start}</span></div>
                      <div className="bg-white py-1.5 rounded-lg border border-gray-100"><span className="block text-gray-400 mb-0.5">เสร็จสิ้น</span><span className="font-bold text-green-600">{p.finish}</span></div>
                      <div className="bg-white py-1.5 rounded-lg border border-gray-100"><span className="block text-gray-400 mb-0.5">ของเสีย</span><span className="font-bold text-red-600">{p.ng}</span></div>
                    </div>

                    {/* Active tasks running in this process */}
                    <div className="mt-2 pt-2 border-t border-gray-200 border-dashed">
                      <div className="text-[10px] text-gray-500 mb-1.5">กำลังทำอยู่ ({p.activeItems.length})</div>
                      {p.activeItems.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {p.activeItems.slice(0, 5).map((item) => (
                            <span key={`${item.qr_code}-${item.logged_at}`} className="inline-flex items-center rounded-md bg-blue-50 text-blue-700 px-2 py-1 font-mono text-[10px] font-bold border border-blue-200">
                              {item.qr_code}
                            </span>
                          ))}
                          {p.activeItems.length > 5 && (
                            <span className="inline-flex items-center rounded-md bg-gray-100 text-gray-600 px-2 py-1 text-[10px] font-bold">
                              +{p.activeItems.length - 5}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Operator Report Panel (Mobile-First Card Layout)
// ─────────────────────────────────────────────────────────────────────────────
function OperatorReportPanel({ logs }) {
  const [expandedOperator, setExpandedOperator] = useState(null);
  const HISTORY_LIMIT = 5;

  const sortedLogs = [...logs].sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));

  const latestByTask = sortedLogs.reduce((acc, log) => {
    const key = `${log.tray_id}-${log.process_id}`;
    if (!acc[key]) acc[key] = log;
    return acc;
  }, {});

  const stats = sortedLogs.reduce((acc, log) => {
    const op = log.operator || 'ไม่ระบุชื่อ (Unknown)';
    if (!acc[op]) {
      acc[op] = { name: op, start: 0, finish: 0, ng: 0, lastActive: log.logged_at, latestLog: log, history: [] };
    }
    if (log.action === 'start') acc[op].start++;
    if (log.action === 'finish') acc[op].finish++;
    if (log.action === 'ng') acc[op].ng++;
    acc[op].history.push(log);
    return acc;
  }, {});

  Object.values(stats).forEach((row) => {
    const activeLogs = Object.values(latestByTask).filter(
      (taskLog) => taskLog.action === 'start' && (taskLog.operator || 'ไม่ระบุชื่อ (Unknown)') === row.name
    );
    row.currentTask = activeLogs.sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at))[0] || null;
  });

  const rows = Object.values(stats).sort((a, b) => b.finish - a.finish);
  const toggleOperator = (name) => setExpandedOperator((prev) => (prev === name ? null : name));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {rows.length === 0 && (
         <div className="col-span-full text-center py-10 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">
           ยังไม่มีประวัติการทำงานของผู้ปฏิบัติงาน
         </div>
      )}
      {rows.map((r) => {
        const isExpanded = expandedOperator === r.name;
        return (
          <div
            key={r.name}
            className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-all cursor-pointer ${
              isExpanded ? 'border-emerald-400 ring-2 ring-emerald-50' : 'border-gray-200 hover:border-emerald-300'
            }`}
            onClick={() => toggleOperator(r.name)}
          >
            {/* Header: Avatar & Name */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg border-2 border-emerald-200 shrink-0">
                {r.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-800 text-lg truncate">{r.name}</div>
                <div className="text-xs text-emerald-600 font-semibold bg-emerald-50 inline-block px-2 py-0.5 rounded-md mt-1">
                  ยอดงานเสร็จ: {r.finish}
                </div>
              </div>
            </div>

            {/* Current / Latest Task */}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              {r.currentTask ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">กำลังทำอยู่</span>
                  </div>
                  <div className="font-bold text-gray-800 text-sm truncate">{r.currentTask.process_name}</div>
                  <div className="font-mono text-gray-500 text-xs mt-0.5">{r.currentTask.qr_code}</div>
                </>
              ) : r.latestLog ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">ทำล่าสุด</span>
                  </div>
                  <div className="font-bold text-gray-800 text-sm truncate">
                    <span className={`text-[10px] mr-1.5 px-1.5 py-0.5 rounded ${ACTION_STYLE[r.latestLog.action] || 'bg-gray-200 text-gray-700'}`}>
                      {ACTION_LABELS[r.latestLog.action] || r.latestLog.action}
                    </span>
                    {r.latestLog.process_name}
                  </div>
                  <div className="flex justify-between items-end mt-1">
                    <div className="font-mono text-gray-500 text-xs">{r.latestLog.qr_code}</div>
                    <div className="text-[10px] text-gray-400">{new Date(r.latestLog.logged_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </>
              ) : (
                <div className="text-xs text-gray-400 text-center py-2">— ไม่มีข้อมูลล่าสุด —</div>
              )}
            </div>

            {/* Expanded History */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">ประวัติล่าสุด (สูงสุด {HISTORY_LIMIT} รายการ)</h4>
                </div>
                <div className="space-y-2">
                  {r.history.slice(0, HISTORY_LIMIT).map((h) => (
                    <div key={h.id} className="flex justify-between items-center text-xs">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="font-semibold text-gray-700 truncate">{h.process_name}</div>
                        <div className="text-gray-400 flex justify-between mt-0.5">
                          <span className="font-mono">{h.qr_code}</span>
                          <span>{new Date(h.logged_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] border rounded-md px-2 py-1 font-bold shrink-0 ${ACTION_STYLE[h.action] || 'bg-gray-100 text-gray-500'}`}>
                        {ACTION_LABELS[h.action] || h.action}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
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
  const [processesData, setProcessesData] = useState([]);
  const [linesData, setLinesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      getLogsSummary(), getLogs({ limit: 2000 }), getProcesses(), getLines(),
    ])
      .then(([summary, logs, processes, lines]) => {
        setSummaryData(summary); setLogsData(logs); setProcessesData(processes); setLinesData(lines);
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight">รายงานผล <span className="text-blue-600">Analytics</span></h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">สรุปภาพรวมและประสิทธิภาพการผลิต</p>
          </div>
        </div>

        <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 sm:gap-2 overflow-x-auto hide-scrollbar pb-0.5">
          {TABS.map((tab) => {
            const c = TAB_COLORS[tab.color];
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-[3px] whitespace-nowrap transition-colors ${
                  isActive ? `${c.tab} border-b-[3px] rounded-t-xl bg-opacity-50` : 'border-transparent text-gray-500 hover:text-gray-800'
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg className="animate-spin w-10 h-10 mb-4 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="font-semibold text-sm animate-pulse">กำลังรวบรวมข้อมูล...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-2 border-red-200 text-red-600 p-5 rounded-2xl text-center font-bold shadow-sm">
            ⚠️ {error}
          </div>
        ) : (
          <div className="animate-fade-in-up">
            <SectionCard tab={currentTabDef}>
              {activeTab === 'trays'     && <TrayReportPanel data={summaryData} logs={logsData} search={search} onSearch={setSearch} />}
              {activeTab === 'processes' && <ProcessReportPanel logs={logsData} processes={processesData} lines={linesData} />}
              {activeTab === 'operators' && <OperatorReportPanel logs={logsData} />}
            </SectionCard>
          </div>
        )}
      </main>
    </div>
  );
}
