import { useEffect, useState } from 'react';
import {
  getLines, createLine, updateLine, deleteLine,
  getProcesses, createProcess, updateProcess, deleteProcess,
  getTrays, createTray, updateTray, deleteTray,
  getLogs, createLog, updateLog, deleteLog,
  getOperators, createOperator, updateOperator, deleteOperator,
} from '../api/client';

// ─────────────────────────────────────────
// UI Components ที่ใช้ร่วมกัน
// ─────────────────────────────────────────
function Input({ label, className = '', ...props }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
      {label}
      {props.as === 'select' ? (
        <select
          className={`border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition-shadow ${className}`}
          {...props}
        >
          {props.children}
        </select>
      ) : (
        <input
          className={`border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition-shadow ${className}`}
          {...props}
        />
      )}
    </label>
  );
}

function FormBox({ title, children, onClose }) {
  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 mb-5 animate-fade-in relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-md font-bold text-gray-800">{title}</h3>
        {onClose && (
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        )}
      </div>
      {children}
    </div>
  );
}

function SaveMsg({ msg }) {
  if (!msg) return null;
  const ok = msg.includes('สำเร็จ');
  return (
    <p className={`text-xs font-medium px-3 py-1.5 rounded-lg inline-block ${
      ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
      {ok ? '✓ ' : '⚠️ '}{msg}
    </p>
  );
}

function ActionHeader({ title, onAdd, addText, c }) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">{title}</h3>
      <button
        onClick={onAdd}
        className={`${c.btn} text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors shadow-sm flex items-center gap-1`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        {addText}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab configuration
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  {
    id: 'lines',
    label: 'สายการผลิต & ขั้นตอน',
    enLabel: 'Lines & Processes',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    color: 'blue',
  },
  {
    id: 'trays',
    label: 'ถาดงาน & ประวัติ',
    enLabel: 'Trays & Logs',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
    color: 'amber',
  },
  {
    id: 'operators',
    label: 'ผู้ปฏิบัติงาน',
    enLabel: 'Operators',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    color: 'emerald',
  },
];

const TAB_COLORS = {
  blue:    { tab: 'border-blue-500 bg-blue-50 text-blue-700', btn: 'bg-blue-600 hover:bg-blue-700', header: 'from-blue-500 to-blue-600', rowHover: 'hover:bg-blue-50' },
  amber:   { tab: 'border-amber-500 bg-amber-50 text-amber-700', btn: 'bg-amber-600 hover:bg-amber-700', header: 'from-amber-500 to-amber-600', rowHover: 'hover:bg-amber-50' },
  emerald: { tab: 'border-emerald-500 bg-emerald-50 text-emerald-700', btn: 'bg-emerald-600 hover:bg-emerald-700', header: 'from-emerald-500 to-emerald-600', rowHover: 'hover:bg-emerald-50' },
};

function SectionCard({ tab, count, children }) {
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
// 1. Lines + Processes Panel
// ─────────────────────────────────────────────────────────────────────────────
function LinesAndProcessesPanel({ lines, onRefresh }) {
  const tab = TABS[0];
  const [selectedLineId, setSelectedLineId] = useState(null);

  useEffect(() => {
    if (!selectedLineId && lines.length > 0) setSelectedLineId(lines[0].id);
    else if (lines.length > 0 && !lines.find(l => l.id === selectedLineId)) setSelectedLineId(lines[0].id);
  }, [lines, selectedLineId]);

  const selectedLine = lines.find(l => l.id === selectedLineId);

  return (
    <SectionCard tab={tab} count={lines.length}>
      <div className="grid lg:grid-cols-[1fr_1fr] gap-8">
        <div className="flex flex-col">
          <LinesManager lines={lines} selectedLineId={selectedLineId} onSelect={setSelectedLineId} onRefresh={onRefresh} c={TAB_COLORS[tab.color]} />
        </div>
        <div className="flex flex-col border-t pt-6 lg:border-t-0 lg:pt-0 lg:border-l lg:pl-8 border-gray-200">
          {selectedLine ? (
            <ProcessesManager lineId={selectedLine.id} c={TAB_COLORS[tab.color]} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
              <p>กรุณาเลือกสายการผลิตจากรายชื่อด้านซ้าย</p>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

function LinesManager({ lines, selectedLineId, onSelect, onRefresh, c }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [msg, setMsg] = useState(null);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      if (editId) {
        await updateLine(editId, { name, description: desc });
        setMsg('อัปเดตสำเร็จ');
      } else {
        await createLine({ name, description: desc });
        setMsg('เพิ่มสำเร็จ');
      }
      setTimeout(closeForm, 1500);
      onRefresh();
    } catch (err) { setMsg(err.message); }
  };

  const openAddForm = () => { setEditId(null); setName(''); setDesc(''); setShowForm(true); setMsg(null); };
  const openEditForm = (line, e) => { e.stopPropagation(); setEditId(line.id); setName(line.name); setDesc(line.description || ''); setShowForm(true); setMsg(null); };
  const closeForm = () => { setShowForm(false); setEditId(null); setName(''); setDesc(''); setMsg(null); };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('ยืนยันการลบสายการผลิต?')) return;
    try { await deleteLine(id); onRefresh(); } catch (err) { alert(err.message); }
  };

  return (
    <div className="flex-1 flex flex-col">
      <ActionHeader title="รายการสายการผลิต" onAdd={openAddForm} addText="เพิ่มสายการผลิต" c={c} />

      {showForm && (
        <FormBox title={editId ? 'แก้ไขสายการผลิต' : 'เพิ่มสายการผลิตใหม่'} onClose={closeForm}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input label="ชื่อสายการผลิต *" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="รายละเอียด" value={desc} onChange={(e) => setDesc(e.target.value)} />
            <div className="flex items-center gap-2 pt-2">
              <button type="submit" className={`${c.btn} text-white rounded-lg px-5 py-2 text-sm font-semibold transition-colors`}>
                {editId ? 'บันทึก' : 'เพิ่มข้อมูล'}
              </button>
              <SaveMsg msg={msg} />
            </div>
          </form>
        </FormBox>
      )}

      <div className="rounded-xl border border-gray-200 overflow-hidden flex-1 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-500 text-xs uppercase tracking-wide border-b">
            <tr>
              <th className="px-4 py-3">ชื่อสาย</th>
              <th className="px-4 py-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lines.length === 0 && <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-400">ยังไม่มีข้อมูล</td></tr>}
            {lines.map((l) => {
              const isSelected = selectedLineId === l.id;
              return (
                <tr key={l.id} onClick={() => onSelect(l.id)}
                  className={`cursor-pointer transition-all border-l-4 ${isSelected ? 'bg-blue-50 border-blue-500' : 'bg-white border-transparent hover:bg-gray-50'}`}>
                  <td className="px-4 py-3">
                    <div className={`font-semibold ${isSelected ? 'text-blue-800' : 'text-gray-800'}`}>{l.name}</div>
                    {l.description && <div className="text-xs text-gray-400 mt-0.5">{l.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={(e) => openEditForm(l, e)} className="text-blue-600 hover:text-blue-800 text-xs font-semibold">แก้ไข</button>
                    <button onClick={(e) => handleDelete(l.id, e)} className="text-red-500 hover:text-red-700 text-xs font-semibold">ลบ</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProcessesManager({ lineId, c }) {
  const [procs, setProcs] = useState([]);
  const [name, setName] = useState('');
  const [seq, setSeq] = useState('');
  const [desc, setDesc] = useState('');
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadProcs = () => { if (lineId) getProcesses(lineId).then(setProcs).catch((e) => alert(e.message)); };
  useEffect(() => { loadProcs(); closeForm(); }, [lineId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      if (editId) {
        await updateProcess(editId, { name, sequence: Number(seq), description: desc });
        setMsg('อัปเดตสำเร็จ');
      } else {
        await createProcess({ line_id: Number(lineId), name, sequence: Number(seq), description: desc });
        setMsg('เพิ่มสำเร็จ');
      }
      setTimeout(closeForm, 1500);
      loadProcs();
    } catch (err) { setMsg(err.message); }
  };

  const openAddForm = () => { setEditId(null); setName(''); setSeq(''); setDesc(''); setShowForm(true); setMsg(null); };
  const openEditForm = (p) => { setEditId(p.id); setName(p.name); setSeq(String(p.sequence)); setDesc(p.description || ''); setShowForm(true); setMsg(null); };
  const closeForm = () => { setShowForm(false); setEditId(null); setName(''); setSeq(''); setDesc(''); setMsg(null); };

  const handleDelete = async (id) => {
    if (!confirm('ยืนยันการลบขั้นตอนนี้?')) return;
    try { await deleteProcess(id); loadProcs(); } catch (err) { alert(err.message); }
  };

  return (
    <div className="flex-1 flex flex-col">
      <ActionHeader title="ขั้นตอนในสายนี้" onAdd={openAddForm} addText="เพิ่มขั้นตอน" c={c} />

      {showForm && (
        <FormBox title={editId ? 'แก้ไขขั้นตอน' : 'เพิ่มขั้นตอนใหม่'} onClose={closeForm}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="w-24"><Input label="ลำดับ *" type="number" min="1" value={seq} onChange={(e) => setSeq(e.target.value)} required /></div>
              <div className="flex-1"><Input label="ชื่อขั้นตอน *" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            </div>
            <Input label="รายละเอียด" value={desc} onChange={(e) => setDesc(e.target.value)} />
            <div className="flex items-center gap-2 pt-2">
              <button type="submit" className={`${c.btn} text-white rounded-lg px-5 py-2 text-sm font-semibold transition-colors`}>
                {editId ? 'บันทึก' : 'เพิ่มข้อมูล'}
              </button>
              <SaveMsg msg={msg} />
            </div>
          </form>
        </FormBox>
      )}

      <div className="rounded-xl border border-gray-200 overflow-hidden flex-1 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-500 text-xs uppercase tracking-wide border-b">
            <tr>
              <th className="px-4 py-3 w-12 text-center">ลำดับ</th>
              <th className="px-4 py-3">ชื่อขั้นตอน</th>
              <th className="px-4 py-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {procs.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">ยังไม่มีขั้นตอนในสายนี้</td></tr>}
            {procs.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">{p.sequence}</span>
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button onClick={() => openEditForm(p)} className="text-blue-600 hover:text-blue-800 text-xs font-semibold">แก้ไข</button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold">ลบ</button>
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
// 2. Operators Panel
// ─────────────────────────────────────────────────────────────────────────────
function OperatorsPanel() {
  const [operators, setOperators] = useState([]);
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const tab = TABS[2];
  const c = TAB_COLORS[tab.color];

  const load = () => getOperators().then(setOperators).catch((e) => alert(e.message));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      if (editId) {
        await updateOperator(editId, { name, employee_id: employeeId || null, department: department || null });
        setMsg('อัปเดตสำเร็จ');
      } else {
        await createOperator({ name, employee_id: employeeId || null, department: department || null });
        setMsg('เพิ่มสำเร็จ');
      }
      setTimeout(closeForm, 1500);
      load();
    } catch (err) { setMsg(err.message); }
  };

  const openAddForm = () => { setEditId(null); setName(''); setEmployeeId(''); setDepartment(''); setShowForm(true); setMsg(null); };
  const openEditForm = (op) => { setEditId(op.id); setName(op.name); setEmployeeId(op.employee_id || ''); setDepartment(op.department || ''); setShowForm(true); setMsg(null); };
  const closeForm = () => { setShowForm(false); setEditId(null); setName(''); setEmployeeId(''); setDepartment(''); setMsg(null); };

  const handleToggle = async (op) => {
    try { await updateOperator(op.id, { is_active: !op.is_active }); load(); } catch (err) { alert(err.message); }
  };
  const handleDelete = async (id) => {
    if (!confirm('ยืนยันการลบผู้ปฏิบัติงาน?')) return;
    try { await deleteOperator(id); load(); } catch (err) { alert(err.message); }
  };

  return (
    <SectionCard tab={tab} count={operators.length}>
      <ActionHeader title="รายชื่อผู้ปฏิบัติงาน" onAdd={openAddForm} addText="เพิ่มผู้ปฏิบัติงาน" c={c} />

      {showForm && (
        <FormBox title={editId ? 'แก้ไขผู้ปฏิบัติงาน' : 'เพิ่มผู้ปฏิบัติงานใหม่'} onClose={closeForm}>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Input label="ชื่อ-นามสกุล *" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input label="รหัสพนักงาน" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="เช่น EMP-003" />
              <Input label="แผนก / สาย" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="เช่น SMT" />
            </div>
            <div className="flex items-center gap-2">
              <button type="submit" className={`${c.btn} text-white rounded-lg px-5 py-2 text-sm font-semibold transition-colors`}>
                {editId ? 'บันทึก' : 'เพิ่มข้อมูล'}
              </button>
              <SaveMsg msg={msg} />
            </div>
          </form>
        </FormBox>
      )}

      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-500 text-xs uppercase tracking-wide border-b">
            <tr>
              <th className="px-4 py-3">ชื่อ</th>
              <th className="px-4 py-3">รหัสพนักงาน</th>
              <th className="px-4 py-3">แผนก</th>
              <th className="px-4 py-3 text-center">สถานะ</th>
              <th className="px-4 py-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {operators.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">ยังไม่มีผู้ปฏิบัติงาน</td></tr>
            ) : (
              operators.map((op, i) => (
                <tr key={op.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${c.rowHover} transition-colors`}>
                  <td className="px-4 py-3 font-medium text-gray-800">{op.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{op.employee_id ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{op.department ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleToggle(op)}
                      className={`text-xs rounded-full px-3 py-1 font-semibold transition-colors border ${
                        op.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                      }`}>
                      {op.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => openEditForm(op)} className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold">แก้ไข</button>
                    <button onClick={() => handleDelete(op.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold">ลบ</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Trays Panel & Logs (Master-Detail Layout with Canvas QR Generator)
// ─────────────────────────────────────────────────────────────────────────────
const TRAY_STATUS = ['pending', 'in_progress', 'completed', 'on_hold'];
const STATUS_STYLE = {
  pending: 'bg-gray-100 text-gray-600 border-gray-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  on_hold: 'bg-red-100 text-red-700 border-red-200',
};
const ACTION_STYLE = {
  start:  'bg-blue-100 text-blue-700 border-blue-200',
  finish: 'bg-green-100 text-green-700 border-green-200',
  ng:     'bg-red-100 text-red-600 border-red-200',
};

// ── Sub-panel: Tray Logs (แสดงด้านขวา) ──
function TrayLogsPanel({ tray, onRefreshTray, c }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editLog, setEditLog] = useState(null);
  const [addForm, setAddForm] = useState(false);
  const [procs, setProcs] = useState([]);

  // States สำหรับฟอร์มเพิ่ม Log
  const [formProcessId, setFormProcessId] = useState('');
  const [formOperator, setFormOperator] = useState('');
  const [formAction, setFormAction] = useState('finish');
  const [formNote, setFormNote] = useState('');
  const [msg, setMsg] = useState(null);

  const load = () => {
    setLoading(true);
    getLogs({ tray_id: tray.id }).then(data => { setLogs(data); setLoading(false); }).catch(e => { alert(e.message); setLoading(false); });
  };

  useEffect(() => {
    load();
    if (tray.line_id) getProcesses(tray.line_id).then(setProcs).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tray.id, tray.line_id]);

  const handleSaveEdit = async () => {
    setMsg(null);
    try {
      await updateLog(editLog.id, { operator: editLog.operator || null, action: editLog.action, note: editLog.note || null });
      setMsg('อัปเดตสำเร็จ');
      setEditLog(null);
      load();
      onRefreshTray?.();
    } catch (e) { setMsg(e.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('ลบ log นี้? สถานะถาดจะถูกคำนวณใหม่')) return;
    try { await deleteLog(id); load(); onRefreshTray?.(); } catch (e) { alert(e.message); }
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await createLog({ tray_id: tray.id, process_id: Number(formProcessId), operator: formOperator || null, action: formAction, note: formNote || null });
      setMsg('เพิ่ม log สำเร็จ');
      closeAddForm();
      load();
      onRefreshTray?.();
    } catch (e) { setMsg(e.message); }
  };

  const openAddForm = () => {
    setFormProcessId(procs[0]?.id || ''); setFormOperator(''); setFormAction('finish'); setFormNote('');
    setAddForm(true); setMsg(null);
  };
  const closeAddForm = () => { setAddForm(false); setMsg(null); };

  return (
    <div className="flex-1 flex flex-col">
      <ActionHeader title={`ประวัติการผลิต: ${tray.qr_code}`} onAdd={openAddForm} addText="บันทึก Manual" c={c} />

      {addForm && (
        <FormBox title="เพิ่มประวัติ (Manual)" onClose={closeAddForm}>
          <form onSubmit={handleAddLog} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="ขั้นตอน *" as="select" value={formProcessId} onChange={e => setFormProcessId(e.target.value)} required>
              <option value="">— เลือก —</option>
              {procs.map(p => <option key={p.id} value={p.id}>{p.sequence}. {p.name}</option>)}
            </Input>
            <Input label="ผู้ปฏิบัติ" value={formOperator} onChange={e => setFormOperator(e.target.value)} placeholder="ชื่อผู้ทำ" />
            <Input label="สถานะ (Action) *" as="select" value={formAction} onChange={e => setFormAction(e.target.value)}>
              <option value="start">start</option><option value="finish">finish</option><option value="ng">ng</option>
            </Input>
            <Input label="หมายเหตุ" value={formNote} onChange={e => setFormNote(e.target.value)} placeholder="ไม่บังคับ" />
            <div className="sm:col-span-2 flex items-center gap-2 pt-2">
              <button type="submit" className={`${c.btn} text-white rounded-lg px-5 py-2 text-sm font-semibold transition-colors`}>บันทึก</button>
              <SaveMsg msg={msg} />
            </div>
          </form>
        </FormBox>
      )}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-xs text-gray-500 uppercase tracking-wide border-b">
              <tr>
                <th className="px-3 py-3 text-left">เวลา</th>
                <th className="px-3 py-3 text-left">ขั้นตอน</th>
                <th className="px-3 py-3 text-left">ผู้ปฏิบัติ</th>
                <th className="px-3 py-3 text-center">สถานะ</th>
                <th className="px-3 py-3 text-left">หมายเหตุ</th>
                <th className="px-3 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? <tr><td colSpan={6} className="text-center py-6 text-gray-400">กำลังโหลด...</td></tr> :
               logs.length === 0 ? <tr><td colSpan={6} className="text-center py-6 text-gray-400">ยังไม่มีบันทึกการผลิต</td></tr> :
               logs.map(log =>
                editLog?.id === log.id ? (
                  <tr key={log.id} className="bg-amber-50">
                    <td className="px-3 py-2 text-gray-400 text-xs whitespace-nowrap">{new Date(log.logged_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="px-3 py-2 text-xs text-gray-600"><span className="font-mono text-gray-400 mr-1">#{log.sequence}</span>{log.process_name}</td>
                    <td className="px-3 py-2"><input className="border border-gray-300 rounded px-2 py-1 text-xs w-24 bg-white" value={editLog.operator} onChange={e => setEditLog(v => ({ ...v, operator: e.target.value }))} /></td>
                    <td className="px-3 py-2 text-center">
                      <select className="border border-gray-300 rounded px-2 py-1 text-xs bg-white" value={editLog.action} onChange={e => setEditLog(v => ({ ...v, action: e.target.value }))}>
                        <option value="start">start</option><option value="finish">finish</option><option value="ng">ng</option>
                      </select>
                    </td>
                    <td className="px-3 py-2"><input className="border border-gray-300 rounded px-2 py-1 text-xs w-24 bg-white" value={editLog.note} onChange={e => setEditLog(v => ({ ...v, note: e.target.value }))} /></td>
                    <td className="px-3 py-2 text-right whitespace-nowrap space-x-2">
                      <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-800 text-xs font-semibold">บันทึก</button>
                      <button onClick={() => setEditLog(null)} className="text-gray-400 hover:text-gray-600 text-xs font-medium">ยกเลิก</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(log.logged_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap"><span className="font-mono text-gray-400 text-xs mr-1">#{log.sequence}</span>{log.process_name}</td>
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{log.operator || '—'}</td>
                    <td className="px-3 py-3 text-center"><span className={`text-xs border rounded-full px-2 py-0.5 font-semibold ${ACTION_STYLE[log.action] || 'bg-gray-100 text-gray-500'}`}>{log.action}</span></td>
                    <td className="px-3 py-3 text-gray-500 text-xs max-w-[120px] truncate">{log.note || '—'}</td>
                    <td className="px-3 py-3 text-right whitespace-nowrap space-x-3">
                      <button onClick={() => setEditLog({ id: log.id, operator: log.operator || '', action: log.action, note: log.note || '' })} className="text-blue-600 hover:text-blue-800 text-xs font-medium">แก้ไข</button>
                      <button onClick={() => handleDelete(log.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">ลบ</button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Main Panel: Trays + Logs ──
function TraysPanel({ lines }) {
  const [trays, setTrays] = useState([]);
  const [search, setSearch] = useState('');
  const [filterLine, setFilterLine] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState({ qr_code: '', line_id: '', product: '', batch_no: '', qty: '1', status: 'pending' });
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedTrayId, setSelectedTrayId] = useState(null); // ใช้ ID แทน Object เพื่อ Master-Detail

  const tab = TABS[1];
  const c = TAB_COLORS[tab.color];

  const load = () => getTrays().then(setTrays).catch((e) => alert(e.message));
  useEffect(() => { load(); }, []);

  // เลือกแถวแรกอัตโนมัติ เมื่อข้อมูลโหลดมา
  useEffect(() => {
    if (!selectedTrayId && trays.length > 0) setSelectedTrayId(trays[0].id);
    else if (trays.length > 0 && !trays.find(t => t.id === selectedTrayId)) setSelectedTrayId(trays[0].id);
  }, [trays, selectedTrayId]);

  const selectedTray = trays.find(t => t.id === selectedTrayId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    const payload = {
      qr_code: form.qr_code,
      line_id: form.line_id ? Number(form.line_id) : null,
      product: form.product || null,
      batch_no: form.batch_no || null,
      qty: Number(form.qty) || 1,
      status: form.status || 'pending',
    };
    try {
      if (editId) {
        await updateTray(editId, payload);
        setMsg('อัปเดตสำเร็จ');
      } else {
        await createTray(payload);
        setMsg('เพิ่มสำเร็จ');
      }
      setTimeout(closeForm, 1500);
      load();
    } catch (err) { setMsg(err.message); }
  };

  const openAddForm = () => { setEditId(null); setForm({ qr_code: '', line_id: '', product: '', batch_no: '', qty: '1', status: 'pending' }); setShowForm(true); setMsg(null); };
  const openEditForm = (t, e) => {
    e.stopPropagation(); // ไม่ให้ Trigger การเลือก Row
    setEditId(t.id);
    setForm({ qr_code: t.qr_code, line_id: String(t.line_id || ''), product: t.product || '', batch_no: t.batch_no || '', qty: String(t.qty), status: t.status || 'pending' });
    setShowForm(true); setMsg(null);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); setForm({ qr_code: '', line_id: '', product: '', batch_no: '', qty: '1', status: 'pending' }); setMsg(null); };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('ยืนยันการลบถาด? ประวัติการผลิตทั้งหมดจะถูกลบด้วย')) return;
    try { await deleteTray(id); load(); } catch (err) { alert(err.message); }
  };

  // 💾 ฟังก์ชันสำหรับ วาดฉลาก (Label) บน Canvas และดาวน์โหลด
  const handleDownloadQR = async (tray, e) => {
    e.stopPropagation(); // กันไม่ให้ไปกระตุ้นการเปลี่ยนหน้าต่าง Master Detail
    try {
      // 1. ดึงภาพ QR Code แบบ blob ป้องกันปัญหา CORS
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(tray.qr_code)}`;
      const response = await fetch(qrUrl);
      if (!response.ok) throw new Error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์สร้าง QR ได้');
      const blob = await response.blob();
      const imgUrl = URL.createObjectURL(blob);

      // โหลดรูปมาเก็บใน Object Image
      const img = new Image();
      img.src = imgUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // 2. สร้าง Canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const width = 360;
      const height = 480;
      canvas.width = width;
      canvas.height = height;

      // วาดพื้นหลังสีขาว
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // วาดกรอบเส้นประ (Dashed Border)
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 8]);
      ctx.strokeRect(15, 15, width - 30, height - 30);
      ctx.setLineDash([]); // ล้างค่าเส้นประ

      // วาดรูป QR Code ให้ตกกึ่งกลาง
      const qrSize = 220;
      const qrX = (width - qrSize) / 2;
      const qrY = 50;
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

      // วาดข้อความต่างๆ
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';

      // วาด QR Code Text
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(tray.qr_code, width / 2, qrY + qrSize + 50);

      // วาด Product & Batch (ถ้ามี)
      ctx.font = '18px sans-serif';
      let textY = qrY + qrSize + 90;

      if (tray.product) {
        ctx.fillStyle = '#444444';
        ctx.fillText(`Product: ${tray.product}`, width / 2, textY, width - 60);
        textY += 30;
      }

      if (tray.batch_no) {
        ctx.fillStyle = '#444444';
        ctx.fillText(`Batch: ${tray.batch_no}`, width / 2, textY, width - 60);
      }

      // 3. สร้าง URL ไฟล์ PNG และสั่งดาวน์โหลด
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `QR_Label_${tray.qr_code}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // ล้างข้อมูลภาพในหน่วยความจำ
      URL.revokeObjectURL(imgUrl);
    } catch (error) {
      alert('ไม่สามารถสร้างภาพฉลากได้: ' + error.message);
    }
  };

  const filtered = trays.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.qr_code.toLowerCase().includes(q) || (t.product || '').toLowerCase().includes(q) || (t.batch_no || '').toLowerCase().includes(q);
    const matchLine = !filterLine || String(t.line_id) === filterLine;
    const matchStatus = !filterStatus || t.status === filterStatus;
    return matchSearch && matchLine && matchStatus;
  });

  return (
    <SectionCard tab={tab} count={trays.length}>
      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8">

        {/* ฝั่งซ้าย: จัดการถาดงาน */}
        <div className="flex flex-col">
          <ActionHeader title="รายการถาดงาน" onAdd={openAddForm} addText="สร้างถาดใหม่" c={c} />

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 mb-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
            <input
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[150px] focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="ค้นหา QR, สินค้า..." value={search} onChange={(e) => setSearch(e.target.value)}
            />
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              value={filterLine} onChange={(e) => setFilterLine(e.target.value)}>
              <option value="">ทุกสายการผลิต</option>
              {lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">ทุกสถานะ</option>
              <option value="pending">pending</option>
              <option value="in_progress">in_progress</option>
              <option value="completed">completed</option>
              <option value="on_hold">on_hold</option>
            </select>
          </div>

          {showForm && (
            <FormBox title={editId ? 'แก้ไขถาดงาน' : 'เพิ่มถาดงานใหม่'} onClose={closeForm}>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Input label="QR Code *" value={form.qr_code} onChange={(e) => setForm((f) => ({ ...f, qr_code: e.target.value }))} required disabled={!!editId} className="font-mono bg-gray-50" />
                  <Input label="สายการผลิต" as="select" value={form.line_id} onChange={(e) => setForm((f) => ({ ...f, line_id: e.target.value }))}>
                    <option value="">— ไม่ระบุ —</option>
                    {lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </Input>
                  <Input label="สินค้า / Product" value={form.product} onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))} />
                  <Input label="Batch No." value={form.batch_no} onChange={(e) => setForm((f) => ({ ...f, batch_no: e.target.value }))} className="font-mono" />
                  <Input label="จำนวน (qty)" type="number" min="1" value={form.qty} onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))} />
                  <Input label="สถานะ" as="select" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                    {TRAY_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </Input>
                </div>
                <div className="flex items-center gap-2">
                  <button type="submit" className={`${c.btn} text-white rounded-lg px-5 py-2 text-sm font-semibold transition-colors`}>
                    {editId ? 'บันทึก' : 'สร้างถาด'}
                  </button>
                  <SaveMsg msg={msg} />
                </div>
              </form>
            </FormBox>
          )}

          <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm flex-1">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-left text-gray-500 text-xs uppercase tracking-wide border-b">
                  <tr>
                    <th className="px-4 py-3">QR Code / สินค้า</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">ไม่พบข้อมูล</td></tr>}
                  {filtered.map((t) => {
                    const isSelected = selectedTrayId === t.id;
                    return (
                      <tr key={t.id} onClick={() => setSelectedTrayId(t.id)}
                        className={`cursor-pointer transition-all border-l-4 ${isSelected ? 'bg-amber-50 border-amber-500' : 'bg-white border-transparent hover:bg-gray-50'}`}>
                        <td className="px-4 py-3">
                          <div className={`font-mono font-semibold text-xs ${isSelected ? 'text-amber-800' : 'text-gray-800'}`}>{t.qr_code}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{t.product || '—'} {t.batch_no && `· ${t.batch_no}`}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs rounded-full px-2 py-0.5 font-semibold border ${STATUS_STYLE[t.status] || 'bg-gray-100 text-gray-500'}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                          <button onClick={(e) => handleDownloadQR(t, e)} className="text-gray-500 hover:text-gray-800 text-xs font-semibold">💾 Save Image</button>
                          <button onClick={(e) => openEditForm(t, e)} className="text-amber-600 hover:text-amber-800 text-xs font-semibold">แก้ไข</button>
                          <button onClick={(e) => handleDelete(t.id, e)} className="text-red-500 hover:text-red-700 text-xs font-semibold">ลบ</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ฝั่งขวา: จัดการ Logs */}
        <div className="flex flex-col border-t pt-6 lg:border-t-0 lg:pt-0 lg:border-l lg:pl-8 border-gray-200">
          {selectedTray ? (
            <TrayLogsPanel tray={selectedTray} onRefreshTray={load} c={c} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
              <p>กรุณาเลือกถาดงานจากรายชื่อด้านซ้าย เพื่อดูประวัติการผลิต</p>
            </div>
          )}
        </div>

      </div>
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Export
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lines');

  const loadLines = () => { getLines().then(setLines).catch(console.error).finally(() => setLoading(false)); };
  useEffect(loadLines, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-gray-800 tracking-tight">ระบบจัดการข้อมูล <span className="text-blue-600">Admin</span></h1>
            <p className="text-xs text-gray-500 mt-1">ตั้งค่าสายการผลิต ขั้นตอนการทำงาน และข้อมูลหลัก</p>
          </div>
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
                  isActive ? `${c.tab} border-b-2` : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-400">
            <svg className="animate-spin w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
            กำลังโหลดข้อมูล…
          </div>
        ) : (
          <div className="animate-fade-in-up">
            {activeTab === 'lines' && <LinesAndProcessesPanel lines={lines} onRefresh={loadLines} />}
            {activeTab === 'trays' && <TraysPanel lines={lines} />}
            {activeTab === 'operators' && <OperatorsPanel />}
          </div>
        )}
      </main>
    </div>
  );
}
