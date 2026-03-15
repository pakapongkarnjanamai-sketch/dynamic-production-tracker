import { useEffect, useState, Fragment } from 'react';
import {
  getLines, createLine, updateLine, deleteLine,
  getProcesses, createProcess, updateProcess, deleteProcess,
  getTrays, createTray, updateTray, deleteTray,
  getLogs, createLog, updateLog, deleteLog,
  getOperators, createOperator, updateOperator, deleteOperator,
  getUsers, createUser, updateUser, deleteUser,
} from '../api/client';
import { useAuth } from '../auth/AuthContext';

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
      {onAdd && (
        <button
          onClick={onAdd}
          className={`${c.btn} text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors shadow-sm flex items-center gap-1`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          {addText}
        </button>
      )}
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
  {
    id: 'users',
    label: 'ผู้ใช้งานระบบ',
    enLabel: 'Users',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1118.88 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    color: 'rose',
  },
];

const TAB_COLORS = {
  blue:    { tab: 'border-blue-500 bg-blue-50 text-blue-700', btn: 'bg-blue-600 hover:bg-blue-700', header: 'from-blue-500 to-blue-600', rowHover: 'hover:bg-blue-50' },
  amber:   { tab: 'border-amber-500 bg-amber-50 text-amber-700', btn: 'bg-amber-600 hover:bg-amber-700', header: 'from-amber-500 to-amber-600', rowHover: 'hover:bg-amber-50' },
  emerald: { tab: 'border-emerald-500 bg-emerald-50 text-emerald-700', btn: 'bg-emerald-600 hover:bg-emerald-700', header: 'from-emerald-500 to-emerald-600', rowHover: 'hover:bg-emerald-50' },
  rose:    { tab: 'border-rose-500 bg-rose-50 text-rose-700', btn: 'bg-rose-600 hover:bg-rose-700', header: 'from-rose-500 to-rose-600', rowHover: 'hover:bg-rose-50' },
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
  return (
    <SectionCard tab={tab} count={lines.length}>
      <LinesManager lines={lines} onRefresh={onRefresh} c={TAB_COLORS[tab.color]} />
    </SectionCard>
  );
}

function LinesManager({ lines, onRefresh, c }) {
  const [selectedLineId, setSelectedLineId] = useState(null);
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

  const toggleRow = (id) => setSelectedLineId(prev => prev === id ? null : id);

  return (
    <div className="flex-1 flex flex-col">
      <ActionHeader title="รายการสายการผลิต" onAdd={openAddForm} addText="เพิ่มสายการผลิต" c={c} />

      {showForm && (
        <FormBox title={editId ? 'แก้ไขสายการผลิต' : 'เพิ่มสายการผลิตใหม่'} onClose={closeForm}>
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row md:items-end gap-3">
            <div className="flex-1"><Input label="ชื่อสายการผลิต *" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="flex-[2]"><Input label="รายละเอียด" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
            <div className="flex items-center gap-2 pt-2 md:pt-0">
              <button type="submit" className={`${c.btn} text-white rounded-lg px-5 py-2 text-sm font-semibold transition-colors`}>
                {editId ? 'บันทึก' : 'เพิ่มข้อมูล'}
              </button>
            </div>
          </form>
          <div className="mt-2"><SaveMsg msg={msg} /></div>
        </FormBox>
      )}

      <div className="rounded-xl border border-gray-200 overflow-hidden flex-1 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left text-gray-500 text-xs uppercase tracking-wide border-b">
              <tr>
                <th className="px-4 py-3">ชื่อสายการผลิต</th>
                <th className="px-4 py-3">รายละเอียด</th>
                <th className="px-4 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lines.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">ยังไม่มีข้อมูล</td></tr>}
              {lines.map((l) => {
                const isExpanded = selectedLineId === l.id;
                return (
                  <Fragment key={l.id}>
                    <tr onClick={() => toggleRow(l.id)}
                      className={`cursor-pointer transition-all border-l-4 ${isExpanded ? 'bg-blue-50 border-blue-500' : 'bg-white border-transparent hover:bg-gray-50'}`}>
                      <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <svg className={`w-4 h-4 transition-transform shrink-0 ${isExpanded ? 'rotate-90 text-blue-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          <span>{l.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{l.description || '—'}</td>
                      <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                        <button onClick={(e) => openEditForm(l, e)} className="text-blue-600 hover:text-blue-800 text-xs font-semibold">แก้ไข</button>
                        <button onClick={(e) => handleDelete(l.id, e)} className="text-red-500 hover:text-red-700 text-xs font-semibold">ลบ</button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-blue-50/30">
                        <td colSpan={3} className="p-0 border-b-4 border-blue-200">
                          <div className="p-4 md:p-6 shadow-inner">
                            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm relative">
                              <ProcessesManager lineId={l.id} lineName={l.name} c={c} />
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

function ProcessesManager({ lineId, lineName, c }) {
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
      <ActionHeader title={`ขั้นตอนของสาย: ${lineName}`} onAdd={openAddForm} addText="เพิ่มขั้นตอน" c={c} />

      {showForm && (
        <FormBox title={editId ? 'แก้ไขขั้นตอน' : 'เพิ่มขั้นตอนใหม่'} onClose={closeForm}>
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row md:items-end gap-3">
            <div className="w-24"><Input label="ลำดับ *" type="number" min="1" value={seq} onChange={(e) => setSeq(e.target.value)} required /></div>
            <div className="flex-1"><Input label="ชื่อขั้นตอน *" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="flex-1"><Input label="รายละเอียด" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
            <div className="flex items-center gap-2 pt-2 md:pt-0">
              <button type="submit" className={`${c.btn} text-white rounded-lg px-5 py-2 text-sm font-semibold transition-colors`}>
                {editId ? 'บันทึก' : 'เพิ่มข้อมูล'}
              </button>
            </div>
          </form>
          <div className="mt-2"><SaveMsg msg={msg} /></div>
        </FormBox>
      )}

      <div className="rounded-xl border border-gray-200 overflow-hidden flex-1 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left text-gray-500 text-xs uppercase tracking-wide border-b">
              <tr>
                <th className="px-4 py-3 w-12 text-center">ลำดับ</th>
                <th className="px-4 py-3">ชื่อขั้นตอน</th>
                <th className="px-4 py-3">รายละเอียด</th>
                <th className="px-4 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {procs.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">ยังไม่มีขั้นตอนในสายนี้</td></tr>}
              {procs.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">{p.sequence}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.description || '—'}</td>
                  <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                    <button onClick={() => openEditForm(p)} className="text-blue-600 hover:text-blue-800 text-xs font-semibold">แก้ไข</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold">ลบ</button>
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
        <div className="overflow-x-auto">
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
                        {op.is_active ? 'ใช้งาน' : 'ระงับการใช้งาน'}
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
      </div>
    </SectionCard>
  );
}

function UsersPanel({ currentRole }) {
  const [users, setUsers] = useState([]);
  const [operators, setOperators] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('operator');
  const [operatorId, setOperatorId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const tab = TABS[3];
  const c = TAB_COLORS[tab.color];

  const roleOptions = currentRole === 'superadmin'
    ? ['superadmin', 'admin', 'operator', 'viewer']
    : ['operator', 'viewer'];

  const load = () => {
    Promise.all([getUsers(), getOperators()])
      .then(([userRows, operatorRows]) => {
        setUsers(userRows);
        setOperators(operatorRows);
      })
      .catch((e) => alert(e.message));
  };

  useEffect(() => { load(); }, []);

  const openAddForm = () => {
    setEditId(null);
    setEmployeeId('');
    setName('');
    setPassword('');
    setRole('operator');
    setOperatorId('');
    setIsActive(true);
    setMsg(null);
    setShowForm(true);
  };

  const openEditForm = (u) => {
    setEditId(u.id);
    setEmployeeId(u.employee_id || '');
    setName(u.name || '');
    setPassword('');
    setRole(u.role);
    setOperatorId(u.operator_id ? String(u.operator_id) : '');
    setIsActive(Boolean(u.is_active));
    setMsg(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setEmployeeId('');
    setName('');
    setPassword('');
    setRole('operator');
    setOperatorId('');
    setIsActive(true);
    setMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    const payload = {
      employee_id: employeeId,
      name,
      role,
      operator_id: operatorId ? Number(operatorId) : null,
      is_active: isActive,
    };

    if (!editId) {
      payload.password = password;
    } else if (password) {
      payload.password = password;
    }

    try {
      if (editId) {
        await updateUser(editId, payload);
        setMsg('อัปเดตสำเร็จ');
      } else {
        await createUser(payload);
        setMsg('เพิ่มสำเร็จ');
      }
      load();
      setTimeout(closeForm, 1500);
    } catch (err) {
      setMsg(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('ยืนยันการลบผู้ใช้งานระบบ?')) return;
    try {
      await deleteUser(id);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <SectionCard tab={tab} count={users.length}>
      <ActionHeader title="บัญชีผู้ใช้งานระบบ" onAdd={openAddForm} addText="เพิ่มผู้ใช้" c={c} />

      {showForm && (
        <FormBox title={editId ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'} onClose={closeForm}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="รหัสพนักงาน *" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required />
              <Input label="ชื่อ *" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input label={editId ? 'รหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)' : 'รหัสผ่าน *'} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required={!editId} />
              <Input as="select" label="สิทธิ์ *" value={role} onChange={(e) => setRole(e.target.value)}>
                {roleOptions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </Input>
              <Input as="select" label="ผูกกับ Operator (ถ้ามี)" value={operatorId} onChange={(e) => setOperatorId(e.target.value)}>
                <option value="">— ไม่ผูก —</option>
                {operators.map((op) => (
                  <option key={op.id} value={op.id}>{op.name}{op.department ? ` (${op.department})` : ''}</option>
                ))}
              </Input>
              <Input as="select" label="สถานะ" value={String(isActive)} onChange={(e) => setIsActive(e.target.value === 'true')}>
                <option value="true">ใช้งาน</option>
                <option value="false">ระงับการใช้งาน</option>
              </Input>
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left text-gray-500 text-xs uppercase tracking-wide border-b">
              <tr>
                <th className="px-4 py-3">ชื่อ</th>
                <th className="px-4 py-3">รหัสพนักงาน</th>
                <th className="px-4 py-3">สิทธิ์</th>
                <th className="px-4 py-3">Operator</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">ยังไม่มีผู้ใช้งานระบบ</td></tr>
              ) : (
                users.map((u, i) => (
                  <tr key={u.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${c.rowHover} transition-colors`}>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs whitespace-nowrap">{u.employee_id}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{u.role}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{u.operator_name || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs rounded-full px-3 py-1 font-semibold border ${u.is_active ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {u.is_active ? 'ใช้งาน' : 'ระงับการใช้งาน'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                      <button onClick={() => openEditForm(u)} className="text-rose-600 hover:text-rose-800 text-xs font-semibold">แก้ไข</button>
                      <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold">ลบ</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Trays Panel & Logs
// ─────────────────────────────────────────────────────────────────────────────
const TRAY_STATUS = ['pending', 'in_progress', 'completed', 'on_hold'];
const STATUS_LABELS = {
  pending: 'รอดำเนินการ',
  in_progress: 'กำลังดำเนินการ',
  completed: 'เสร็จสิ้น',
  on_hold: 'หยุดพัก / รอแก้ไข',
};
const STATUS_STYLE = {
  pending: 'bg-gray-100 text-gray-600 border-gray-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  on_hold: 'bg-red-100 text-red-700 border-red-200',
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

function TrayLogsPanel({ tray, onRefreshTray, c }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editLog, setEditLog] = useState(null);
  const [addForm, setAddForm] = useState(false);
  const [procs, setProcs] = useState([]);

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
      <ActionHeader title={`ประวัติการผลิต: ถาด ${tray.qr_code}`} onAdd={openAddForm} addText="บันทึก Manual" c={c} />

      {addForm && (
        <FormBox title="เพิ่มประวัติ (Manual)" onClose={closeAddForm}>
          <form onSubmit={handleAddLog} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Input label="ขั้นตอน *" as="select" value={formProcessId} onChange={e => setFormProcessId(e.target.value)} required>
              <option value="">— เลือก —</option>
              {procs.map(p => <option key={p.id} value={p.id}>{p.sequence}. {p.name}</option>)}
            </Input>
            <Input label="ผู้ปฏิบัติ" value={formOperator} onChange={e => setFormOperator(e.target.value)} placeholder="ชื่อผู้ทำ" />
            <Input label="สถานะ (Action) *" as="select" value={formAction} onChange={e => setFormAction(e.target.value)}>
              <option value="start">เริ่มงาน</option><option value="finish">เสร็จสิ้น (OK)</option><option value="ng">ของเสีย (NG)</option>
            </Input>
            <Input label="หมายเหตุ" value={formNote} onChange={e => setFormNote(e.target.value)} placeholder="ไม่บังคับ" />
            <div className="sm:col-span-4 flex items-center gap-2 pt-2">
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
                <th className="px-4 py-3 text-left">เวลา</th>
                <th className="px-4 py-3 text-left">ขั้นตอน</th>
                <th className="px-4 py-3 text-left">ผู้ปฏิบัติ</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3 text-left">หมายเหตุ</th>
                <th className="px-4 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? <tr><td colSpan={6} className="text-center py-6 text-gray-400">กำลังโหลด...</td></tr> :
               logs.length === 0 ? <tr><td colSpan={6} className="text-center py-6 text-gray-400">ยังไม่มีบันทึกการผลิต</td></tr> :
               logs.map(log =>
                editLog?.id === log.id ? (
                  <tr key={log.id} className="bg-amber-50">
                    <td className="px-4 py-2 text-gray-400 text-xs whitespace-nowrap">{new Date(log.logged_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="px-4 py-2 text-xs text-gray-600 whitespace-nowrap"><span className="font-mono text-gray-400 mr-1">#{log.sequence}</span>{log.process_name}</td>
                    <td className="px-4 py-2"><input className="border border-gray-300 rounded px-2 py-1 text-xs w-full min-w-[100px] bg-white" value={editLog.operator} onChange={e => setEditLog(v => ({ ...v, operator: e.target.value }))} /></td>
                    <td className="px-4 py-2 text-center">
                      <select className="border border-gray-300 rounded px-2 py-1 text-xs bg-white" value={editLog.action} onChange={e => setEditLog(v => ({ ...v, action: e.target.value }))}>
                        <option value="start">เริ่มงาน</option><option value="finish">เสร็จสิ้น (OK)</option><option value="ng">ของเสีย (NG)</option>
                      </select>
                    </td>
                    <td className="px-4 py-2"><input className="border border-gray-300 rounded px-2 py-1 text-xs w-full min-w-[120px] bg-white" value={editLog.note} onChange={e => setEditLog(v => ({ ...v, note: e.target.value }))} /></td>
                    <td className="px-4 py-2 text-right whitespace-nowrap space-x-3">
                      <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-800 text-xs font-semibold">บันทึก</button>
                      <button onClick={() => setEditLog(null)} className="text-gray-400 hover:text-gray-600 text-xs font-medium">ยกเลิก</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{new Date(log.logged_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="px-4 py-3 text-gray-800 whitespace-nowrap font-medium"><span className="font-mono text-gray-400 text-xs mr-1">#{log.sequence}</span>{log.process_name}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{log.operator || '—'}</td>
                    <td className="px-4 py-3 text-center"><span className={`text-xs border rounded-full px-2 py-0.5 font-semibold ${ACTION_STYLE[log.action] || 'bg-gray-100 text-gray-500'}`}>{ACTION_LABELS[log.action] || log.action}</span></td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">{log.note || '—'}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-3">
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

function TraysPanel({ lines }) {
  const [trays, setTrays] = useState([]);
  const [search, setSearch] = useState('');
  const [filterLine, setFilterLine] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState({ qr_code: '', line_id: '', product: '', batch_no: '', qty: '1', status: 'pending', due_date: '' });
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedTrayId, setSelectedTrayId] = useState(null);

  const tab = TABS[1];
  const c = TAB_COLORS[tab.color];

  const load = () => getTrays().then(setTrays).catch((e) => alert(e.message));
  useEffect(() => { load(); }, []);

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
      due_date: form.due_date || null,
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

  const openAddForm = () => { setEditId(null); setForm({ qr_code: '', line_id: '', product: '', batch_no: '', qty: '1', status: 'pending', due_date: '' }); setShowForm(true); setMsg(null); };
  const openEditForm = (t, e) => {
    e.stopPropagation();
    setEditId(t.id);
    const dueDateLocal = t.due_date ? new Date(t.due_date).toISOString().slice(0, 16) : '';
    setForm({ qr_code: t.qr_code, line_id: String(t.line_id || ''), product: t.product || '', batch_no: t.batch_no || '', qty: String(t.qty), status: t.status || 'pending', due_date: dueDateLocal });
    setShowForm(true); setMsg(null);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); setForm({ qr_code: '', line_id: '', product: '', batch_no: '', qty: '1', status: 'pending', due_date: '' }); setMsg(null); };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('ยืนยันการลบถาด? ประวัติการผลิตทั้งหมดจะถูกลบด้วย')) return;
    try { await deleteTray(id); load(); } catch (err) { alert(err.message); }
  };

  const toggleRow = (id) => setSelectedTrayId(prev => prev === id ? null : id);

  const handleDownloadQR = async (tray, e) => {
    e.stopPropagation();
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(tray.qr_code)}`;
      const response = await fetch(qrUrl);
      if (!response.ok) throw new Error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์สร้าง QR ได้');
      const blob = await response.blob();
      const imgUrl = URL.createObjectURL(blob);

      const img = new Image();
      img.src = imgUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const width = 360;
      const height = 480;
      canvas.width = width;
      canvas.height = height;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 8]);
      ctx.strokeRect(15, 15, width - 30, height - 30);
      ctx.setLineDash([]);

      const qrSize = 220;
      const qrX = (width - qrSize) / 2;
      const qrY = 50;
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';

      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(tray.qr_code, width / 2, qrY + qrSize + 50);

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

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `QR_Label_${tray.qr_code}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

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
      <div className="flex flex-col">
        <ActionHeader title="รายการถาดงาน" onAdd={openAddForm} addText="สร้างถาดใหม่" c={c} />

        <div className="flex flex-wrap items-center gap-3 mb-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <input
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-amber-400"
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
            {TRAY_STATUS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>

        {showForm && (
          <FormBox title={editId ? 'แก้ไขถาดงาน' : 'เพิ่มถาดงานใหม่'} onClose={closeForm}>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <Input label="QR Code *" value={form.qr_code} onChange={(e) => setForm((f) => ({ ...f, qr_code: e.target.value }))} required disabled={!!editId} className="font-mono bg-gray-50" />
                <Input label="สายการผลิต" as="select" value={form.line_id} onChange={(e) => setForm((f) => ({ ...f, line_id: e.target.value }))}>
                  <option value="">— ไม่ระบุ —</option>
                  {lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </Input>
                <Input label="สินค้า / Product" value={form.product} onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))} />
                <Input label="Batch No." value={form.batch_no} onChange={(e) => setForm((f) => ({ ...f, batch_no: e.target.value }))} className="font-mono" />
                <Input label="จำนวน (qty)" type="number" min="1" value={form.qty} onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))} />
                <Input label="สถานะ" as="select" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                  {TRAY_STATUS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </Input>
                <Input label="กำหนดส่ง (Due Date)" type="datetime-local" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} className="md:col-span-2" />
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
                  <th className="px-4 py-3">QR Code</th>
                  <th className="px-4 py-3">สินค้า / Batch</th>
                  <th className="px-4 py-3">สายการผลิต</th>
                  <th className="px-4 py-3 text-center">สถานะ</th>
                  <th className="px-4 py-3">กำหนดส่ง</th>
                  <th className="px-4 py-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">ไม่พบข้อมูล</td></tr>}
                {filtered.map((t) => {
                  const isExpanded = selectedTrayId === t.id;
                  const isDelayed = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed';
                  return (
                    <Fragment key={t.id}>
                      {/* Master Row */}
                      <tr onClick={() => toggleRow(t.id)}
                        className={`cursor-pointer transition-all border-l-4 ${isExpanded ? 'bg-amber-50 border-amber-500' : isDelayed ? 'bg-red-50/60 border-red-300' : 'bg-white border-transparent hover:bg-gray-50'}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <svg className={`w-4 h-4 transition-transform shrink-0 ${isExpanded ? 'rotate-90 text-amber-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            <span className={`font-mono font-bold ${isExpanded ? 'text-amber-800' : 'text-gray-800'}`}>{t.qr_code}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-700">{t.product || '—'}</div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">{t.batch_no || '—'}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{t.line_name || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs rounded-full px-2 py-0.5 font-semibold border ${STATUS_STYLE[t.status] || 'bg-gray-100 text-gray-500'}`}>
                            {STATUS_LABELS[t.status] || t.status}
                          </span>
                          {isDelayed && <span className="ml-1 text-xs rounded-full px-2 py-0.5 font-semibold border bg-red-100 text-red-700 border-red-300">ล่าช้า</span>}
                        </td>
                        <td className="px-4 py-3">
                          {t.due_date ? (
                            <span className={`text-xs ${isDelayed ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                              {new Date(t.due_date).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                          <button onClick={(e) => handleDownloadQR(t, e)} className="text-gray-500 hover:text-gray-800 text-xs font-semibold">ปริ้นท์ QR</button>
                          <button onClick={(e) => openEditForm(t, e)} className="text-amber-600 hover:text-amber-800 text-xs font-semibold">แก้ไข</button>
                          <button onClick={(e) => handleDelete(t.id, e)} className="text-red-500 hover:text-red-700 text-xs font-semibold">ลบ</button>
                        </td>
                      </tr>

                      {/* Detail Row */}
                      {isExpanded && (
                        <tr className="bg-amber-50/30">
                          <td colSpan={6} className="p-0 border-b-4 border-amber-200">
                            <div className="p-4 md:p-6 shadow-inner">
                              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm relative">
                                <TrayLogsPanel tray={t} onRefreshTray={load} c={c} />
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
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Export
// ─────────────────────────────────────────────────────────────────────────────
export default function ManagementPage() {
  const { user } = useAuth();
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
            <h1 className="text-xl font-extrabold text-gray-800 tracking-tight">จัดการระบบ <span className="text-blue-600">Management</span></h1>
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
            {activeTab === 'users' && <UsersPanel currentRole={user?.role || 'admin'} />}
          </div>
        )}
      </main>
    </div>
  );
}
