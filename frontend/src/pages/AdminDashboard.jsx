import { useEffect, useState } from 'react';
import {
  getLines,   createLine,    updateLine,    deleteLine,
  getProcesses, createProcess, updateProcess, deleteProcess,
  getTrays,   createTray,   updateTray,   deleteTray,
  getOperators, createOperator, updateOperator, deleteOperator,
} from '../api/client';

// ─────────────────────────────────────────
// Tiny helpers
// ─────────────────────────────────────────
function Input({ label, ...props }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
      {label}
      <input
        className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        {...props}
      />
    </label>
  );
}

function FormBox({ children }) {
  return (
    <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4">
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
      {ok ? '✓ ' : '✗ '}{msg}
    </p>
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
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    color: 'blue',
  },
  {
    id: 'trays',
    label: 'ถาดงาน',
    enLabel: 'Trays',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    color: 'amber',
  },
  {
    id: 'operators',
    label: 'ผู้ปฏิบัติงาน',
    enLabel: 'Operators',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'emerald',
  },
];

const TAB_COLORS = {
  blue:    { tab: 'border-blue-500   bg-blue-50   text-blue-700',      btn: 'bg-blue-600   hover:bg-blue-700',      header: 'from-blue-500   to-blue-600',   rowHover: 'hover:bg-blue-50',    subHeader: 'from-blue-400   to-blue-500'   },
  amber:   { tab: 'border-amber-500  bg-amber-50  text-amber-700',     btn: 'bg-amber-600  hover:bg-amber-700',     header: 'from-amber-500  to-amber-600',  rowHover: 'hover:bg-amber-50',   subHeader: 'from-amber-400  to-amber-500'  },
  emerald: { tab: 'border-emerald-500 bg-emerald-50 text-emerald-700', btn: 'bg-emerald-600 hover:bg-emerald-700', header: 'from-emerald-500 to-emerald-600', rowHover: 'hover:bg-emerald-50', subHeader: 'from-emerald-400 to-emerald-500' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Section card wrapper
// ─────────────────────────────────────────────────────────────────────────────
function SectionCard({ tab, count, children }) {
  const c = TAB_COLORS[tab.color];
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
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
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-section header (used inside LinesAndProcessesPanel)
// ─────────────────────────────────────────────────────────────────────────────
function SubSection({ title, enTitle, icon, children }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="bg-gray-700 px-5 py-3 flex items-center gap-2">
        <span className="text-white/80">{icon}</span>
        <span className="text-sm font-bold text-white">{title}</span>
        <span className="text-xs text-white/50 ml-1">/ {enTitle}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lines + Processes combined panel
// ─────────────────────────────────────────────────────────────────────────────
function LinesAndProcessesPanel({ lines, onRefresh }) {
  return (
    <div className="space-y-5">
      <LinesSection lines={lines} onRefresh={onRefresh} />
      <ProcessesSection lines={lines} />
    </div>
  );
}

function LinesSection({ lines, onRefresh }) {
  const [name,   setName]   = useState('');
  const [desc,   setDesc]   = useState('');
  const [msg,    setMsg]    = useState(null);
  const [editId, setEditId] = useState(null);
  const c = TAB_COLORS['blue'];

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
      setName(''); setDesc(''); setEditId(null);
      onRefresh();
    } catch (err) { setMsg(err.message); }
  };

  const handleEdit = (line) => { setEditId(line.id); setName(line.name); setDesc(line.description || ''); };
  const handleDelete = async (id) => {
    if (!confirm('ลบสายการผลิตนี้?')) return;
    try { await deleteLine(id); onRefresh(); } catch (err) { alert(err.message); }
  };

  return (
    <SubSection
      title="สายการผลิต" enTitle="Production Lines"
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      }
    >
      <div className="grid md:grid-cols-[300px_1fr] gap-6">
        {/* ── Form ── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {editId ? 'แก้ไขสายการผลิต' : 'เพิ่มสายการผลิตใหม่'}
          </p>
          <FormBox>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Input label="ชื่อสายการผลิต *" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input label="รายละเอียด"       value={desc} onChange={(e) => setDesc(e.target.value)} />
              <div className="flex items-center gap-2 pt-1">
                <button type="submit"
                  className={`${c.btn} text-white rounded-xl px-5 py-2 text-sm font-semibold transition-colors`}>
                  {editId ? 'บันทึกการแก้ไข' : '+ เพิ่มสายการผลิต'}
                </button>
                {editId && (
                  <button type="button" onClick={() => { setEditId(null); setName(''); setDesc(''); }}
                    className="text-gray-400 hover:text-gray-600 text-sm underline">ยกเลิก</button>
                )}
              </div>
              <SaveMsg msg={msg} />
            </form>
          </FormBox>
        </div>

        {/* ── Table ── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            รายการทั้งหมด
            <span className="ml-2 normal-case text-gray-300 font-normal">{lines.length} สาย</span>
          </p>
          {lines.length === 0 ? (
            <div className="text-center py-10 text-gray-300 text-sm">ยังไม่มีสายการผลิต</div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-2.5">ชื่อสาย</th>
                    <th className="px-4 py-2.5">รายละเอียด</th>
                    <th className="px-4 py-2.5 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={l.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${c.rowHover} transition-colors`}>
                      <td className="px-4 py-2.5 font-semibold text-gray-800">{l.name}</td>
                      <td className="px-4 py-2.5 text-gray-500">{l.description || '—'}</td>
                      <td className="px-4 py-2.5 text-right space-x-3">
                        <button onClick={() => handleEdit(l)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">แก้ไข</button>
                        <button onClick={() => handleDelete(l.id)} className="text-red-400 hover:text-red-600 text-xs font-medium">ลบ</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SubSection>
  );
}

function ProcessesSection({ lines }) {
  const [lineId,  setLineId]  = useState('');
  const [procs,   setProcs]   = useState([]);
  const [name,    setName]    = useState('');
  const [seq,     setSeq]     = useState('');
  const [desc,    setDesc]    = useState('');
  const [editId,  setEditId]  = useState(null);
  const [msg,     setMsg]     = useState(null);
  const c = TAB_COLORS['blue'];

  const loadProcs = (lid) => {
    if (!lid) { setProcs([]); return; }
    getProcesses(lid).then(setProcs).catch((e) => alert(e.message));
  };
  useEffect(() => { loadProcs(lineId); }, [lineId]);

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
      setName(''); setSeq(''); setDesc(''); setEditId(null);
      loadProcs(lineId);
    } catch (err) { setMsg(err.message); }
  };

  const handleEdit = (p) => { setEditId(p.id); setName(p.name); setSeq(String(p.sequence)); setDesc(p.description || ''); };
  const handleDelete = async (id) => {
    if (!confirm('ลบขั้นตอนนี้?')) return;
    try { await deleteProcess(id); loadProcs(lineId); } catch (err) { alert(err.message); }
  };

  return (
    <SubSection
      title="ขั้นตอนการผลิต" enTitle="Processes"
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      }
    >
      {/* Line selector */}
      <div className="flex items-center gap-3 mb-5 p-3 bg-blue-50 border border-blue-100 rounded-xl">
        <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
        </svg>
        <span className="text-sm font-medium text-blue-700 whitespace-nowrap">เลือกสายการผลิต:</span>
        <select
          value={lineId}
          onChange={(e) => { setLineId(e.target.value); setEditId(null); setName(''); setSeq(''); setDesc(''); setMsg(null); }}
          className="border border-blue-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white flex-1 max-w-xs"
        >
          <option value="">— เลือกสายการผลิต —</option>
          {lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {!lineId ? (
        <div className="text-center py-10 text-gray-300">
          <svg className="w-10 h-10 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          <p className="text-sm">กรุณาเลือกสายการผลิตก่อน</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-[300px_1fr] gap-6">
          {/* ── Form ── */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {editId ? 'แก้ไขขั้นตอน' : 'เพิ่มขั้นตอนใหม่'}
            </p>
            <FormBox>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <Input label="ลำดับ (Sequence) *" type="number" min="1" value={seq} onChange={(e) => setSeq(e.target.value)} required />
                <Input label="ชื่อขั้นตอน *"       value={name} onChange={(e) => setName(e.target.value)} required />
                <Input label="รายละเอียด"           value={desc} onChange={(e) => setDesc(e.target.value)} />
                <div className="flex items-center gap-2 pt-1">
                  <button type="submit"
                    className={`${c.btn} text-white rounded-xl px-5 py-2 text-sm font-semibold transition-colors`}>
                    {editId ? 'บันทึกการแก้ไข' : '+ เพิ่มขั้นตอน'}
                  </button>
                  {editId && (
                    <button type="button" onClick={() => { setEditId(null); setName(''); setSeq(''); setDesc(''); }}
                      className="text-gray-400 hover:text-gray-600 text-sm underline">ยกเลิก</button>
                  )}
                </div>
                <SaveMsg msg={msg} />
              </form>
            </FormBox>
          </div>

          {/* ── Table ── */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              ขั้นตอนทั้งหมด
              <span className="ml-2 normal-case text-gray-300 font-normal">{procs.length} ขั้นตอน</span>
            </p>
            {procs.length === 0 ? (
              <div className="text-center py-10 text-gray-300 text-sm">ยังไม่มีขั้นตอน</div>
            ) : (
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-2.5 w-16 text-center">#</th>
                      <th className="px-4 py-2.5">ชื่อขั้นตอน</th>
                      <th className="px-4 py-2.5 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {procs.map((p, i) => (
                      <tr key={p.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${c.rowHover} transition-colors`}>
                        <td className="px-4 py-2.5 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">{p.sequence}</span>
                        </td>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{p.name}</td>
                        <td className="px-4 py-2.5 text-right space-x-3">
                          <button onClick={() => handleEdit(p)}      className="text-blue-500 hover:text-blue-700 text-xs font-medium">แก้ไข</button>
                          <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-600 text-xs font-medium">ลบ</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </SubSection>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Operators panel
// ─────────────────────────────────────────────────────────────────────────────
function OperatorsPanel() {
  const [operators,  setOperators]  = useState([]);
  const [name,       setName]       = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [editId,     setEditId]     = useState(null);
  const [msg,        setMsg]        = useState(null);
  const tab = TABS[2];  // operators is now index 2
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
      setName(''); setEmployeeId(''); setDepartment(''); setEditId(null);
      load();
    } catch (err) { setMsg(err.message); }
  };

  const handleEdit = (op) => { setEditId(op.id); setName(op.name); setEmployeeId(op.employee_id || ''); setDepartment(op.department || ''); };
  const handleToggle = async (op) => {
    try { await updateOperator(op.id, { is_active: !op.is_active }); load(); } catch (err) { alert(err.message); }
  };
  const handleDelete = async (id) => {
    if (!confirm('ลบผู้ปฏิบัติงานนี้?')) return;
    try { await deleteOperator(id); load(); } catch (err) { alert(err.message); }
  };

  const active   = operators.filter((o) => o.is_active).length;
  const inactive = operators.length - active;

  return (
    <SectionCard tab={tab} count={operators.length}>
      {operators.length > 0 && (
        <div className="flex gap-2 mb-5">
          <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold rounded-full px-3 py-1">Active: {active}</span>
          <span className="text-xs bg-gray-100 text-gray-500 font-semibold rounded-full px-3 py-1">Inactive: {inactive}</span>
        </div>
      )}

      <div className="grid md:grid-cols-[320px_1fr] gap-6">
        {/* ── Form ── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {editId ? 'แก้ไขผู้ปฏิบัติงาน' : 'เพิ่มผู้ปฏิบัติงานใหม่'}
          </p>
          <FormBox>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Input label="ชื่อ-นามสกุล *"  value={name}       onChange={(e) => setName(e.target.value)} required />
              <Input label="รหัสพนักงาน"      value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="เช่น EMP-003" />
              <Input label="แผนก / สาย"       value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="เช่น SMT" />
              <div className="flex items-center gap-2 pt-1">
                <button type="submit"
                  className={`${c.btn} text-white rounded-xl px-5 py-2 text-sm font-semibold transition-colors`}>
                  {editId ? 'บันทึกการแก้ไข' : '+ เพิ่มผู้ปฏิบัติงาน'}
                </button>
                {editId && (
                  <button type="button"
                    onClick={() => { setEditId(null); setName(''); setEmployeeId(''); setDepartment(''); }}
                    className="text-gray-400 hover:text-gray-600 text-sm underline">ยกเลิก</button>
                )}
              </div>
              <SaveMsg msg={msg} />
            </form>
          </FormBox>
        </div>

        {/* ── Table ── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">รายชื่อทั้งหมด</p>
          {operators.length === 0 ? (
            <div className="text-center py-10 text-gray-300 text-sm">ยังไม่มีผู้ปฏิบัติงาน</div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-2.5">ชื่อ</th>
                    <th className="px-4 py-2.5">รหัส</th>
                    <th className="px-4 py-2.5">แผนก</th>
                    <th className="px-4 py-2.5 text-center">สถานะ</th>
                    <th className="px-4 py-2.5 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {operators.map((op, i) => (
                    <tr key={op.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${c.rowHover} transition-colors`}>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{op.name}</td>
                      <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{op.employee_id ?? '—'}</td>
                      <td className="px-4 py-2.5 text-gray-500">{op.department ?? '—'}</td>
                      <td className="px-4 py-2.5 text-center">
                        <button onClick={() => handleToggle(op)}
                          className={`text-xs rounded-full px-2.5 py-0.5 font-semibold transition-colors ${
                            op.is_active
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}>
                          {op.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-right space-x-3">
                        <button onClick={() => handleEdit(op)}    className="text-emerald-500 hover:text-emerald-700 text-xs font-medium">แก้ไข</button>
                        <button onClick={() => handleDelete(op.id)} className="text-red-400 hover:text-red-600 text-xs font-medium">ลบ</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Trays panel
// ─────────────────────────────────────────────────────────────────────────────
const TRAY_STATUS = ['pending', 'in_progress', 'done', 'on_hold'];
const STATUS_STYLE = {  // note: TraysPanel uses TABS[1] (amber)
  pending:     'bg-gray-100  text-gray-600',
  in_progress: 'bg-amber-100 text-amber-700',
  done:        'bg-green-100 text-green-700',
  on_hold:     'bg-red-100   text-red-600',
};

function TraysPanel({ lines }) {
  const [trays,      setTrays]      = useState([]);
  const [search,     setSearch]     = useState('');
  const [filterLine, setFilterLine] = useState('');
  const [form,       setForm]       = useState({ qr_code: '', line_id: '', product: '', batch_no: '', qty: '1', status: 'pending' });
  const [editId,     setEditId]     = useState(null);
  const [msg,        setMsg]        = useState(null);
  const [showForm,   setShowForm]   = useState(true);
  const tab = TABS[1];  // trays is now index 1 (amber)
  const c = TAB_COLORS[tab.color];

  const load = () => getTrays().then(setTrays).catch((e) => alert(e.message));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    const payload = {
      qr_code:  form.qr_code,
      line_id:  form.line_id  ? Number(form.line_id)  : null,
      product:  form.product  || null,
      batch_no: form.batch_no || null,
      qty:      Number(form.qty) || 1,
      status:   form.status || 'pending',
    };
    try {
      if (editId) {
        await updateTray(editId, payload);
        setMsg('อัปเดตสำเร็จ');
      } else {
        await createTray(payload);
        setMsg('เพิ่มสำเร็จ');
      }
      setForm({ qr_code: '', line_id: '', product: '', batch_no: '', qty: '1', status: 'pending' });
      setEditId(null);
      load();
    } catch (err) { setMsg(err.message); }
  };

  const handleEdit = (t) => {
    setEditId(t.id);
    setForm({
      qr_code:  t.qr_code,
      line_id:  String(t.line_id || ''),
      product:  t.product  || '',
      batch_no: t.batch_no || '',
      qty:      String(t.qty),
      status:   t.status   || 'pending',
    });
    setShowForm(true);
    setMsg(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('ลบถาดนี้? ประวัติการผลิตทั้งหมดจะถูกลบด้วย')) return;
    try { await deleteTray(id); load(); } catch (err) { alert(err.message); }
  };

  const filtered = trays.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      t.qr_code.toLowerCase().includes(q) ||
      (t.product  || '').toLowerCase().includes(q) ||
      (t.batch_no || '').toLowerCase().includes(q);
    const matchLine = !filterLine || String(t.line_id) === filterLine;
    return matchSearch && matchLine;
  });

  return (
    <SectionCard tab={tab} count={trays.length}>
      {/* ── Collapsible form ── */}
      <div className="mb-5">
        <button
          type="button"
          onClick={() => {
            setShowForm((v) => !v);
            if (editId) { setEditId(null); setForm({ qr_code: '', line_id: '', product: '', batch_no: '', qty: '1', status: 'pending' }); }
          }}
          className={`flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2 border transition-colors ${
            showForm
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : 'bg-white border-gray-200 text-gray-500 hover:border-amber-300'
          }`}
        >
          <span>{showForm ? '▾' : '▸'}</span>
          {editId ? 'แก้ไขถาดงาน' : 'เพิ่มถาดงานใหม่'}
        </button>

        {showForm && (
          <div className="mt-3">
            <FormBox>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">QR Code *</label>
                    <input className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white font-mono"
                      value={form.qr_code} onChange={(e) => setForm((f) => ({ ...f, qr_code: e.target.value }))}
                      placeholder="เช่น TRAY-001" required disabled={!!editId} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">สายการผลิต</label>
                    <select className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                      value={form.line_id} onChange={(e) => setForm((f) => ({ ...f, line_id: e.target.value }))}>
                      <option value="">— ไม่ระบุ —</option>
                      {lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">สถานะ</label>
                    <select className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                      value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                      {TRAY_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">สินค้า / Product</label>
                    <input className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                      value={form.product} onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))} placeholder="ไม่บังคับ" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Batch No.</label>
                    <input className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white font-mono"
                      value={form.batch_no} onChange={(e) => setForm((f) => ({ ...f, batch_no: e.target.value }))} placeholder="ไม่บังคับ" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">จำนวน (qty)</label>
                    <input type="number" min="1"
                      className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                      value={form.qty} onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="submit"
                    className={`${c.btn} text-white rounded-xl px-5 py-2 text-sm font-semibold transition-colors`}>
                    {editId ? 'บันทึกการแก้ไข' : '+ เพิ่มถาด'}
                  </button>
                  {editId && (
                    <button type="button"
                      onClick={() => { setEditId(null); setForm({ qr_code: '', line_id: '', product: '', batch_no: '', qty: '1', status: 'pending' }); }}
                      className="text-gray-400 hover:text-gray-600 text-sm underline">ยกเลิก</button>
                  )}
                  <SaveMsg msg={msg} />
                </div>
              </form>
            </FormBox>
          </div>
        )}
      </div>

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-gray-50 rounded-xl border">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          className="border rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[160px] focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          placeholder="ค้นหา QR, สินค้า, Batch..."
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          value={filterLine} onChange={(e) => setFilterLine(e.target.value)}>
          <option value="">ทุกสาย</option>
          {lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        {(search || filterLine) && (
          <button onClick={() => { setSearch(''); setFilterLine(''); }}
            className="text-xs text-gray-400 hover:text-gray-600 underline">ล้าง</button>
        )}
        <span className="text-xs text-gray-400 ml-auto">{filtered.length}/{trays.length} รายการ</span>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2.5">QR Code</th>
                <th className="px-4 py-2.5">สายการผลิต</th>
                <th className="px-4 py-2.5">สินค้า</th>
                <th className="px-4 py-2.5">Batch</th>
                <th className="px-4 py-2.5 text-center">Qty</th>
                <th className="px-4 py-2.5 text-center">Status</th>
                <th className="px-4 py-2.5 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-300 text-sm">ไม่มีข้อมูลถาด</td></tr>
              )}
              {filtered.map((t, i) => (
                <tr key={t.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${c.rowHover} transition-colors`}>
                  <td className="px-4 py-2.5 font-mono font-semibold text-gray-800 text-xs">{t.qr_code}</td>
                  <td className="px-4 py-2.5 text-gray-600">{t.line_name ?? '—'}</td>
                  <td className="px-4 py-2.5 text-gray-600">{t.product ?? '—'}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{t.batch_no ?? '—'}</td>
                  <td className="px-4 py-2.5 text-center text-gray-700">{t.qty}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-xs rounded-full px-2.5 py-0.5 font-semibold ${STATUS_STYLE[t.status] || 'bg-gray-100 text-gray-500'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right space-x-3">
                    <button onClick={() => handleEdit(t)}      className="text-amber-500 hover:text-amber-700 text-xs font-medium">แก้ไข</button>
                    <button onClick={() => handleDelete(t.id)} className="text-red-400   hover:text-red-600  text-xs font-medium">ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page — tab-driven layout
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [lines,     setLines]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('lines');

  const loadLines = () => {
    getLines().then(setLines).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(loadLines, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ── Sticky header + tab bar ── */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-xs text-gray-400 mt-0.5">ระบบจัดการข้อมูลหลัก · Dynamic Production Tracker</p>
          </div>
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
                {tab.icon}
                <span>{tab.label}</span>
                <span className="hidden sm:inline text-xs opacity-50">/ {tab.enLabel}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* ── Content ── */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex items-center gap-3 text-gray-400">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              กำลังโหลดข้อมูล…
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'lines'     && <LinesAndProcessesPanel lines={lines} onRefresh={loadLines} />}
            {activeTab === 'trays'     && <TraysPanel     lines={lines} />}
            {activeTab === 'operators' && <OperatorsPanel />}
          </>
        )}
      </main>
    </div>
  );
}
