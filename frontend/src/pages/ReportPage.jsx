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
// 1. Tray Report Panel & Details (Expandable Row Layout)
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
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">
          ประวัติการผลิต: <span className="font-mono text-amber-700">{tray.qr_code}</span>
        </h3>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-xs text-gray-500 uppercase tracking-wide border-b sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left">เวลา</th>
                <th className="px-4 py-3 text-left">ขั้นตอน</th>
                <th className="px-4 py-3 text-left">ผู้ปฏิบัติ</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">กำลังโหลดข้อมูล...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">ยังไม่มีประวัติการผลิต</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(log.logged_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3 text-gray-800 whitespace-nowrap font-medium">
                      <span className="font-mono text-gray-400 text-xs mr-2">#{log.sequence}</span>
                      {log.process_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{log.operator || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs border rounded-full px-3 py-1 font-semibold ${ACTION_STYLE[log.action] || 'bg-gray-100 text-gray-500'}`}>
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

function TrayReportPanel({ data, logs, search, onSearch, c }) {
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
      statusFilter === 'all'
        ? true
        : statusFilter === 'delayed'
          ? r.isDelayed
          : r.status === statusFilter;

    const q = search.toLowerCase();
    const matchesSearch =
      r.qr_code.toLowerCase().includes(q) ||
      (r.product || '').toLowerCase().includes(q) ||
      (r.line_name || '').toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  const toggleRow = (id) => setSelectedTrayId(prev => prev === id ? null : id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">ภาพรวมถาดงาน</h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button onClick={() => setStatusFilter('all')}
            className={`text-xs font-semibold rounded-full px-3 py-1 border transition-colors ${statusFilter === 'all' ? 'bg-gray-700 text-white border-gray-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
            ทั้งหมด: <strong>{withDelay.length}</strong>
          </button>
          <button onClick={() => setStatusFilter('in_progress')}
            className={`text-xs font-medium rounded-full px-3 py-1 border transition-colors ${statusFilter === 'in_progress' ? 'bg-amber-600 text-white border-amber-600' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'}`}>
            กำลังดำเนินการ: <strong>{inProgressCount}</strong>
          </button>
          <button onClick={() => setStatusFilter('pending')}
            className={`text-xs font-medium rounded-full px-3 py-1 border transition-colors ${statusFilter === 'pending' ? 'bg-gray-600 text-white border-gray-600' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'}`}>
            รอดำเนิน: <strong>{pendingCount}</strong>
          </button>
          <button onClick={() => setStatusFilter('completed')}
            className={`text-xs font-medium rounded-full px-3 py-1 border transition-colors ${statusFilter === 'completed' ? 'bg-green-600 text-white border-green-600' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'}`}>
            เสร็จสิ้น: <strong>{completedCount}</strong>
          </button>
          <button onClick={() => setStatusFilter('delayed')}
            className={`text-xs font-semibold rounded-full px-3 py-1 border transition-colors ${statusFilter === 'delayed' ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'}`}>
            เกินกำหนด: <strong>{delayCount}</strong>
          </button>
          <div className="flex flex-wrap gap-2">
            {statusFilter !== 'all' && <span className="text-xs text-gray-500 px-2 py-1">กำลังกรอง: {statusFilter}</span>}
          </div>
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

        {/* Master-Detail Expandable Table */}
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm flex-1">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left text-gray-500 text-xs uppercase tracking-wide border-b sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3">QR Code</th>
                  <th className="px-4 py-3">สินค้า</th>
                  <th className="px-4 py-3">อยู่ที่ขั้นตอน</th>
                  <th className="px-4 py-3">ผู้ปฏิบัติล่าสุด</th>
                  <th className="px-4 py-3 text-center">สถานะ</th>
                  <th className="px-4 py-3">กำหนดส่ง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">ไม่พบข้อมูล</td></tr>
                )}
                {filtered.map((r) => {
                  const latest = latestLogByTray[String(r.tray_id)] || null;
                  const isExpanded = selectedTrayId === r.tray_id;
                  return (
                    <Fragment key={r.tray_id}>
                      <tr
                        onClick={() => toggleRow(r.tray_id)}
                        className={`cursor-pointer transition-all border-l-4 ${
                          isExpanded ? 'bg-amber-50 border-amber-500'
                          : r.isDelayed ? 'bg-red-50/60 border-red-300'
                          : 'bg-white border-transparent hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <svg className={`w-4 h-4 transition-transform shrink-0 ${isExpanded ? 'rotate-90 text-amber-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            <div>
                              <div className={`font-mono font-semibold text-xs ${isExpanded ? 'text-amber-800' : 'text-gray-800'}`}>{r.qr_code}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{r.line_name || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          <div>{r.product ?? '—'}</div>
                          {r.batch_no && <div className="text-xs text-gray-400 font-mono mt-0.5">{r.batch_no}</div>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {latest ? (
                            <div className="text-sm font-medium text-gray-800">
                              <span className="text-xs text-gray-400 mr-1">#{latest.sequence}</span>
                              {latest.process_name}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300">ยังไม่เริ่ม</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-sm">
                          {latest?.operator || <span className="text-xs text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs rounded-full px-3 py-1 font-semibold border ${TRAY_STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {r.status}
                          </span>
                          {r.isDelayed && (
                            <span className="ml-1 text-xs rounded-full px-2 py-0.5 font-semibold border bg-red-100 text-red-700 border-red-300">เกินกำหนด</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {r.due_date ? (
                            <span className={`text-xs whitespace-nowrap ${r.isDelayed ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                              {new Date(r.due_date).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded View */}
                      {isExpanded && (
                        <tr className="bg-amber-50/30">
                          <td colSpan={6} className="p-0 border-b-4 border-amber-200">
                            <div className="p-4 md:p-6 shadow-inner">
                              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                                <TrayLogsViewPanel tray={r} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Lines & Processes Report Panel (Expandable Rows Layout)
// ─────────────────────────────────────────────────────────────────────────────
function ProcessReportPanel({ logs, processes, lines, c }) {
  const [expandedLineId, setExpandedLineId] = useState(null);

  const sortedLogs = [...logs].sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // หางานที่กำลังทำอยู่ (ล่าสุดคือ start)
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

  // เตรียมโครงสร้างขั้นตอนทั้งหมดเพื่อโชว์ในตารางย่อย
  const statsByProcess = processes.reduce((acc, p) => {
    acc[p.id] = {
      id: p.id,
      line_id: p.line_id,
      process: p.name,
      seq: p.sequence,
      activeItems: (activeByProcess[p.id] || []).sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at)),
      start: 0,
      finish: 0,
      ng: 0
    };
    return acc;
  }, {});

  // นับจำนวนสะสม
  logs.forEach((log) => {
    const key = log.process_id;
    if (statsByProcess[key]) {
      if (log.action === 'start') statsByProcess[key].start++;
      if (log.action === 'finish') statsByProcess[key].finish++;
      if (log.action === 'ng') statsByProcess[key].ng++;
    }
  });

  // จับกลุ่ม Master Row ตามสายการผลิต
  const lineData = lines.map((line) => {
    const procs = Object.values(statsByProcess)
      .filter((p) => p.line_id === line.id)
      .sort((a, b) => a.seq - b.seq);

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

    return {
      ...line,
      finishToday,
      ngToday,
      processes: procs
    };
  });

  const toggleRow = (id) => setExpandedLineId((prev) => (prev === id ? null : id));

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">ประสิทธิภาพรายสายการผลิต</h3>
      </div>

      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left text-gray-500 text-xs uppercase tracking-wide border-b sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3">สายการผลิต</th>
                <th className="px-4 py-3 text-center text-green-600">วันนี้เสร็จ (OK)</th>
                <th className="px-4 py-3 text-center text-red-600">วันนี้เสีย (NG)</th>
                <th className="px-4 py-3 text-right">จำนวนขั้นตอน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lineData.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">ไม่มีข้อมูลสายการผลิต</td></tr>
              )}
              {lineData.map((line) => {
                const isExpanded = expandedLineId === line.id;
                return (
                  <Fragment key={line.id}>
                    {/* Master Row */}
                    <tr
                      onClick={() => toggleRow(line.id)}
                      className={`cursor-pointer transition-all border-l-4 ${
                        isExpanded ? 'bg-blue-50 border-blue-500' : 'bg-white border-transparent hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        <div className="flex items-center gap-2">
                          <svg className={`w-4 h-4 transition-transform shrink-0 ${isExpanded ? 'rotate-90 text-blue-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          {line.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-green-600">
                        {line.finishToday > 0 ? (
                          <span className="bg-green-100 px-3 py-1 rounded-full">{line.finishToday}</span>
                        ) : '0'}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-red-600">
                        {line.ngToday > 0 ? (
                          <span className="bg-red-100 px-3 py-1 rounded-full">{line.ngToday}</span>
                        ) : '0'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {line.processes.length} ขั้นตอน
                      </td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {isExpanded && (
                      <tr className="bg-blue-50/30">
                        <td colSpan={4} className="p-0 border-b-4 border-blue-200">
                          <div className="p-4 md:p-6 shadow-inner">
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 text-xs text-gray-500 font-semibold uppercase tracking-wide">
                                รายละเอียดขั้นตอน: {line.name}
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-100 text-left text-gray-500 text-xs uppercase tracking-wide border-b">
                                    <tr>
                                      <th className="px-4 py-3">ขั้นตอน</th>
                                      <th className="px-4 py-3 text-center text-blue-600">เริ่มสะสม</th>
                                      <th className="px-4 py-3 text-center text-green-600">เสร็จสะสม</th>
                                      <th className="px-4 py-3 text-center text-red-600">NG สะสม</th>
                                      <th className="px-4 py-3 text-left text-blue-600">กำลังทำอยู่</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {line.processes.length === 0 && (
                                      <tr><td colSpan={5} className="text-center py-6 text-gray-400">ยังไม่มีขั้นตอนในสายการผลิตนี้</td></tr>
                                    )}
                                    {line.processes.map((p) => (
                                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mr-2">{p.seq}</span>
                                          {p.process}
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-blue-600 bg-blue-50/30">{p.start}</td>
                                        <td className="px-4 py-3 text-center font-bold text-green-600 bg-green-50/30">{p.finish}</td>
                                        <td className="px-4 py-3 text-center font-bold text-red-600 bg-red-50/30">{p.ng}</td>
                                        <td className="px-4 py-3 text-xs bg-blue-50/20">
                                          {p.activeItems.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                              {p.activeItems.slice(0, 4).map((item) => (
                                                <span key={`${item.qr_code}-${item.logged_at}`} className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 text-blue-700 px-2 py-0.5 font-semibold">
                                                  {item.qr_code}
                                                </span>
                                              ))}
                                              {p.activeItems.length > 4 && (
                                                <span className="inline-flex items-center rounded-full border border-blue-200 bg-white text-blue-600 px-2 py-0.5 font-semibold">
                                                  +{p.activeItems.length - 4}
                                                </span>
                                              )}
                                            </div>
                                          ) : (
                                            <span className="text-gray-400">—</span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
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
// 3. Operator Report Panel (Expandable Rows Layout)
// ─────────────────────────────────────────────────────────────────────────────
function OperatorReportPanel({ logs, c }) {
  const [expandedOperator, setExpandedOperator] = useState(null);
  const HISTORY_LIMIT = 20;

  const sortedLogs = [...logs].sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));

  // หางานล่าสุดที่ทำอยู่
  const latestByTask = sortedLogs.reduce((acc, log) => {
    const key = `${log.tray_id}-${log.process_id}`;
    if (!acc[key]) acc[key] = log;
    return acc;
  }, {});

  const stats = sortedLogs.reduce((acc, log) => {
    const op = log.operator || 'ไม่ระบุชื่อ (Unknown)';
    if (!acc[op]) {
      acc[op] = {
        name: op,
        start: 0,
        finish: 0,
        ng: 0,
        lastActive: log.logged_at,
        latestLog: log,
        history: [],
      };
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

  const actionText = {
    start: 'เริ่มงาน',
    finish: 'เสร็จสิ้น',
    ng: 'NG',
  };

  const toggleOperator = (name) => setExpandedOperator((prev) => (prev === name ? null : name));

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
                <th className="px-4 py-3">งานล่าสุด / กำลังทำ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 && <tr><td colSpan={2} className="text-center py-8 text-gray-400">ยังไม่มีประวัติการทำงาน</td></tr>}
              {rows.map((r) => {
                const isExpanded = expandedOperator === r.name;
                return (
                  <Fragment key={r.name}>
                    {/* Master Row */}
                    <tr
                      onClick={() => toggleOperator(r.name)}
                      className={`cursor-pointer transition-all border-l-4 ${
                        isExpanded ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-transparent hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        <div className="flex items-center gap-2">
                          <svg className={`w-4 h-4 transition-transform shrink-0 ${isExpanded ? 'rotate-90 text-emerald-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                            {r.name.charAt(0)}
                          </div>
                          {r.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {r.currentTask ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 text-blue-700 px-2 py-0.5 font-semibold">กำลังทำ</span>
                            <div className="text-gray-700 font-medium">{r.currentTask.process_name} · {r.currentTask.qr_code}</div>
                            <div className="text-gray-400">เริ่มเมื่อ {new Date(r.currentTask.logged_at).toLocaleString('th-TH')}</div>
                          </div>
                        ) : r.latestLog ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 text-gray-600 px-2 py-0.5 font-semibold">ล่าสุด</span>
                            <div className="text-gray-700 font-medium">{actionText[r.latestLog.action] || r.latestLog.action} · {r.latestLog.process_name} · {r.latestLog.qr_code}</div>
                            <div className="text-gray-400">{new Date(r.latestLog.logged_at).toLocaleString('th-TH')}</div>
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {isExpanded && (
                      <tr className="bg-emerald-50/30">
                        <td colSpan={2} className="p-0 border-b-4 border-emerald-200">
                          <div className="p-4 md:p-6 shadow-inner">
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 text-xs text-gray-500 font-semibold uppercase tracking-wide flex items-center justify-between gap-2">
                                <span>ประวัติการทำงานล่าสุดของ {r.name}</span>
                                <span>แสดงล่าสุด {HISTORY_LIMIT} รายการ</span>
                              </div>
                              <div className="overflow-x-auto max-h-[340px]">
                                <table className="w-full text-xs">
                                  <thead className="bg-gray-100 text-gray-500 uppercase tracking-wide sticky top-0 z-10">
                                    <tr>
                                      <th className="px-3 py-2 text-left">เวลา</th>
                                      <th className="px-3 py-2 text-left">QR</th>
                                      <th className="px-3 py-2 text-left">ขั้นตอน</th>
                                      <th className="px-3 py-2 text-center">สถานะ</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {r.history.slice(0, HISTORY_LIMIT).map((h) => (
                                      <tr key={h.id} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{new Date(h.logged_at).toLocaleString('th-TH')}</td>
                                        <td className="px-3 py-2 text-gray-700 font-mono whitespace-nowrap">{h.qr_code}</td>
                                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                                          <span className="text-gray-400 mr-1">#{h.sequence}</span>{h.process_name}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                          <span className={`text-[11px] border rounded-full px-2 py-0.5 font-semibold ${ACTION_STYLE[h.action] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                            {h.action}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
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
      getLogsSummary(),
      getLogs({ limit: 2000 }),
      getProcesses(),
      getLines(),
    ])
      .then(([summary, logs, processes, lines]) => {
        setSummaryData(summary);
        setLogsData(logs);
        setProcessesData(processes);
        setLinesData(lines);
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
              {activeTab === 'trays'     && <TrayReportPanel data={summaryData} logs={logsData} search={search} onSearch={setSearch} c={currentTabColors} />}
              {activeTab === 'processes' && <ProcessReportPanel logs={logsData} processes={processesData} lines={linesData} c={currentTabColors} />}
              {activeTab === 'operators' && <OperatorReportPanel logs={logsData} c={currentTabColors} />}
            </SectionCard>
          </div>
        )}
      </main>
    </div>
  );
}
