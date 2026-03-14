import { useEffect, useState } from 'react';
import {
  getLines,   createLine,    updateLine,    deleteLine,
  getProcesses, createProcess, updateProcess, deleteProcess,
  getTrays,   createTray,   updateTray,   deleteTray,
  getLogs,    createLog,    updateLog,    deleteLog,
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
// Lines + Processes combined panel (Master-Detail Layout)
// ─────────────────────────────────────────────────────────────────────────────
function LinesAndProcessesPanel({ lines, onRefresh }) {
  const tab = TABS[0];
  const [selectedLineId, setSelectedLineId] = useState(null);

  useEffect(() => {
    if (!selectedLineId && lines.length > 0) {
      setSelectedLineId(lines[0].id);
    } else if (lines.length > 0 && !lines.find(l => l.id === selectedLineId)) {
      setSelectedLineId(lines[0].id);
    }
  }, [lines, selectedLineId]);

  const selectedLine = lines.find(l => l.id === selectedLineId);

  return (
    <SectionCard tab={tab} count={lines.length}>
      <div className="grid lg:grid-cols-[1fr_1fr] gap-8">

        {/* ฝั่งซ้าย: จัดการสายการผลิต */}
        <div className="flex flex-col">

          <LinesManager
            lines={lines}
            selectedLineId={selectedLineId}
            onSelect={setSelectedLineId}
            onRefresh={onRefresh}
            c={TAB_COLORS[tab.color]}
          />
        </div>

        {/* ฝั่งขวา: จัดการขั้นตอน (แสดงตามสายที่เลือก) */}
        <div className="flex flex-col border-t pt-6 lg:border-t-0 lg:pt-0 lg:border-l lg:pl-8 border-gray-200">
          {selectedLine ? (
            <>

              <ProcessesManager
                lineId={selectedLine.id}
                c={TAB_COLORS[tab.color]}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
              <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>กรุณาเลือกสายการผลิตจากรายชื่อด้านซ้าย</p>
            </div>
          )}
        </div>

      </div>
    </SectionCard>
  );
}

function LinesManager({ lines, selectedLineId, onSelect, onRefresh, c }) {
  const [name,   setName]   = useState('');
  const [desc,   setDesc]   = useState('');
  const [msg,    setMsg]    = useState(null);
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
      setName(''); setDesc(''); setEditId(null);
      setShowForm(false);
      onRefresh();
    } catch (err) { setMsg(err.message); }
  };

  const handleEdit = (line, e) => {
    e.stopPropagation();
    setEditId(line.id); setName(line.name); setDesc(line.description || ''); setShowForm(true);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('ลบสายการผลิตนี้?')) return;
    try { await deleteLine(id); onRefresh(); } catch (err) { alert(err.message); }
  };

  return (
    <div className="space-y-4 flex-1 flex flex-col">
      <div>
        <button
          type="button"
          onClick={() => {
            setShowForm(!showForm);
            if (editId) { setEditId(null); setName(''); setDesc(''); }
          }}
          className={`flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2 border transition-colors ${
            showForm ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300'
          }`}
        >
          <span>{showForm ? '▾' : '▸'}</span>
          {editId ? 'แก้ไขสายการผลิต' : 'เพิ่มสายการผลิตใหม่'}
        </button>
      </div>

      {showForm && (
        <FormBox>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input label="ชื่อสายการผลิต *" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="รายละเอียด" value={desc} onChange={(e) => setDesc(e.target.value)} />
            <div className="flex items-center gap-2 pt-1">
              <button type="submit" className={`${c.btn} text-white rounded-xl px-5 py-2 text-sm font-semibold transition-colors`}>
                {editId ? 'บันทึก' : '+ เพิ่ม'}
              </button>
              {editId && (
                <button type="button" onClick={() => { setEditId(null); setName(''); setDesc(''); setShowForm(false); }} className="text-gray-400 hover:text-gray-600 text-sm underline">ยกเลิก</button>
              )}
              <SaveMsg msg={msg} />
            </div>
          </form>
        </FormBox>
      )}

      <div className="rounded-xl border overflow-hidden flex-1">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide border-b">
            <tr>
              <th className="px-4 py-2.5">ชื่อสาย</th>
              <th className="px-4 py-2.5 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lines.length === 0 && <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-400">ยังไม่มีข้อมูล</td></tr>}
            {lines.map((l) => {
              const isSelected = selectedLineId === l.id;
              return (
                <tr
                  key={l.id}
                  onClick={() => onSelect(l.id)}
                  className={`cursor-pointer transition-all border-l-4 ${
                    isSelected
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className={`font-semibold ${isSelected ? 'text-blue-800' : 'text-gray-800'}`}>{l.name}</div>
                    {l.description && <div className="text-xs text-gray-400 mt-0.5">{l.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={(e) => handleEdit(l, e)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">แก้ไข</button>
                    <button onClick={(e) => handleDelete(l.id, e)} className="text-red-400 hover:text-red-600 text-xs font-medium">ลบ</button>
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
  const [procs,   setProcs]   = useState([]);
  const [name,    setName]    = useState('');
  const [seq,     setSeq]     = useState('');
  const [desc,    setDesc]    = useState('');
  const [editId,  setEditId]  = useState(null);
  const [msg,     setMsg]     = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadProcs = () => {
    if (!lineId) return;
    getProcesses(lineId).then(setProcs).catch((e) => alert(e.message));
  };
  useEffect(() => { loadProcs(); }, [lineId]);

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
      setShowForm(false);
      loadProcs();
    } catch (err) { setMsg(err.message); }
  };

  const handleEdit = (p) => { setEditId(p.id); setName(p.name); setSeq(String(p.sequence)); setDesc(p.description || ''); setShowForm(true); };
  const handleDelete = async (id) => {
    if (!confirm('ลบขั้นตอนนี้?')) return;
    try { await deleteProcess(id); loadProcs(); } catch (err) { alert(err.message); }
  };

  return (
    <div className="space-y-4 flex-1 flex flex-col">
      <div>
        <button
          type="button"
          onClick={() => {
            setShowForm(!showForm);
            if (editId) { setEditId(null); setName(''); setSeq(''); setDesc(''); }
          }}
          className={`flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2 border transition-colors ${
            showForm ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300'
          }`}
        >
          <span>{showForm ? '▾' : '▸'}</span>
          {editId ? 'แก้ไขขั้นตอน' : 'เพิ่มขั้นตอนใหม่'}
        </button>
      </div>

      {showForm && (
        <FormBox>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="w-20"><Input label="ลำดับ *" type="number" min="1" value={seq} onChange={(e) => setSeq(e.target.value)} required /></div>
              <div className="flex-1"><Input label="ชื่อขั้นตอน *" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            </div>
            <Input label="รายละเอียด" value={desc} onChange={(e) => setDesc(e.target.value)} />
            <div className="flex items-center gap-2 pt-1">
              <button type="submit" className={`${c.btn} text-white rounded-xl px-5 py-2 text-sm font-semibold transition-colors`}>
                {editId ? 'บันทึก' : '+ เพิ่ม'}
              </button>
              {editId && (
                <button type="button" onClick={() => { setEditId(null); setName(''); setSeq(''); setDesc(''); setShowForm(false); }} className="text-gray-400 hover:text-gray-600 text-sm underline">ยกเลิก</button>
              )}
              <SaveMsg msg={msg} />
            </div>
          </form>
        </FormBox>
      )}

      <div className="rounded-xl border overflow-hidden flex-1 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide border-b">
            <tr>
              <th className="px-4 py-2.5 w-12 text-center">#</th>
              <th className="px-4 py-2.5">ชื่อขั้นตอน</th>
              <th className="px-4 py-2.5 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {procs.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">ยังไม่มีขั้นตอนในสายนี้</td></tr>}
            {procs.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5 text-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">{p.sequence}</span>
                </td>
                <td className="px-4 py-2.5 font-medium text-gray-800">{p.name}</td>
                <td className="px-4 py-2.5 text-right space-x-3">
                  <button onClick={() => handleEdit(p)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">แก้ไข</button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-600 text-xs font-medium">ลบ</button>
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
// Operators panel
// ─────────────────────────────────────────────────────────────────────────────
function OperatorsPanel() {
  const [operators,  setOperators]  = useState([]);
  const [name,       setName]       = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [editId,     setEditId]     = useState(null);
  const [msg,        setMsg]        = useState(null);
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
const STATUS_STYLE = {
  pending:     'bg-gray-100  text-gray-600',
  in_progress: 'bg-amber-100 text-amber-700',
  done:        'bg-green-100 text-green-700',
  completed:   'bg-green-100 text-green-700',
  on_hold:     'bg-red-100   text-red-600',
};

const ACTION_STYLE = {
  start:  'bg-blue-100 text-blue-700',
  finish: 'bg-green-100 text-green-700',
  ng:     'bg-red-100 text-red-600',
};

// ─────────────────────────────────────────────────────────────────────────────
// TrayLogsPanel — inline panel: view / add / edit / delete production logs
// ─────────────────────────────────────────────────────────────────────────────
function TrayLogsPanel({ tray, onClose, onRefreshTray }) {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [editLog, setEditLog] = useState(null);
  const [addForm, setAddForm] = useState(null);
  const [procs,   setProcs]   = useState([]);
  const [msg,     setMsg]     = useState(null);

  const load = () => {
    setLoading(true);
    getLogs({ tray_id: tray.id })
      .then(data => { setLogs(data); setLoading(false); })
      .catch(e  => { alert(e.message); setLoading(false); });
  };

  useEffect(() => {
    load();
    if (tray.line_id) {
      getProcesses(tray.line_id).then(setProcs).catch(() => {});
    }
  }, [tray.id]);

  const handleSaveEdit = async () => {
    setMsg(null);
    try {
      await updateLog(editLog.id, {
        operator: editLog.operator || null,
        action:   editLog.action,
        note:     editLog.note     || null,
      });
      setMsg('อัปเดตสำเร็จ');
      setEditLog(null);
      load();
      onRefreshTray?.();
    } catch (e) { setMsg(e.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('ลบ log นี้? สถานะถาดจะถูกคำนวณใหม่')) return;
    try {
      await deleteLog(id);
      load();
      onRefreshTray?.();
    } catch (e) { alert(e.message); }
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await createLog({
        tray_id:    tray.id,
        process_id: Number(addForm.process_id),
        operator:   addForm.operator || null,
        action:     addForm.action,
        note:       addForm.note     || null,
      });
      setMsg('เพิ่ม log สำเร็จ');
      setAddForm(null);
      load();
      onRefreshTray?.();
    } catch (e) { setMsg(e.message); }
  };

  return (
    <div className="mt-6 rounded-2xl border border-indigo-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3 text-white">
          <div className="bg-white/20 rounded-lg p-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-white/70">ประวัติการผลิต</p>
            <h3 className="text-sm font-bold font-mono leading-none">{tray.qr_code}
              {tray.line_name && <span className="font-normal text-white/70 ml-2 font-sans">· {tray.line_name}</span>}
              {tray.product   && <span className="font-normal text-white/70 ml-2 font-sans">· {tray.product}</span>}
            </h3>
          </div>
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white text-lg leading-none transition-colors">✕</button>
      </div>

      {/* Add log toggle + form */}
      <div className="px-5 pt-4">
          {!addForm ? (
            <button
              onClick={() => setAddForm({ process_id: procs[0]?.id || '', operator: '', action: 'finish', note: '' })}
              className="text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-100 transition-colors"
            >
              + เพิ่ม Log ใหม่
            </button>
          ) : (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-1">
              <form onSubmit={handleAddLog} className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">ขั้นตอน *</label>
                  <select
                    className="border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={addForm.process_id}
                    onChange={e => setAddForm(f => ({ ...f, process_id: e.target.value }))}
                    required
                  >
                    <option value="">— เลือก —</option>
                    {procs.map(p => <option key={p.id} value={p.id}>{p.sequence}. {p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">ผู้ปฏิบัติ</label>
                  <input
                    className="border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 w-32"
                    value={addForm.operator}
                    onChange={e => setAddForm(f => ({ ...f, operator: e.target.value }))}
                    placeholder="ชื่อ"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Action *</label>
                  <select
                    className="border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={addForm.action}
                    onChange={e => setAddForm(f => ({ ...f, action: e.target.value }))}
                  >
                    <option value="start">start</option>
                    <option value="finish">finish</option>
                    <option value="ng">ng</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">หมายเหตุ</label>
                  <input
                    className="border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 w-36"
                    value={addForm.note}
                    onChange={e => setAddForm(f => ({ ...f, note: e.target.value }))}
                    placeholder="ไม่บังคับ"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors">เพิ่ม</button>
                  <button type="button" onClick={() => setAddForm(null)} className="text-gray-400 hover:text-gray-600 text-sm underline">ยกเลิก</button>
                </div>
              </form>
            </div>
          )}
        </div>

      {/* Logs table */}
      <div className="px-5 pb-5">
          {loading ? (
            <p className="text-center text-gray-400 py-10 text-sm">กำลังโหลด...</p>
          ) : logs.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-sm">ยังไม่มีบันทึกการผลิต</p>
          ) : (
            <div className="rounded-xl border overflow-hidden mt-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b">
                  <tr>
                    <th className="px-3 py-2.5 text-left">เวลา</th>
                    <th className="px-3 py-2.5 text-left">ขั้นตอน</th>
                    <th className="px-3 py-2.5 text-left">ผู้ปฏิบัติ</th>
                    <th className="px-3 py-2.5 text-center">Action</th>
                    <th className="px-3 py-2.5 text-left">หมายเหตุ</th>
                    <th className="px-3 py-2.5 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map(log =>
                    editLog?.id === log.id ? (
                      <tr key={log.id} className="bg-amber-50">
                        <td className="px-3 py-2 text-gray-400 text-xs whitespace-nowrap">
                          {new Date(log.logged_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600">
                          <span className="font-mono text-gray-400 mr-1">#{log.sequence}</span>{log.process_name}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            className="border rounded px-2 py-1 text-xs w-28 bg-white"
                            value={editLog.operator}
                            onChange={e => setEditLog(v => ({ ...v, operator: e.target.value }))}
                            placeholder="ชื่อ"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <select
                            className="border rounded px-2 py-1 text-xs bg-white"
                            value={editLog.action}
                            onChange={e => setEditLog(v => ({ ...v, action: e.target.value }))}
                          >
                            <option value="start">start</option>
                            <option value="finish">finish</option>
                            <option value="ng">ng</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            className="border rounded px-2 py-1 text-xs w-36 bg-white"
                            value={editLog.note}
                            onChange={e => setEditLog(v => ({ ...v, note: e.target.value }))}
                            placeholder="หมายเหตุ"
                          />
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap space-x-2">
                          <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-800 text-xs font-semibold">บันทึก</button>
                          <button onClick={() => setEditLog(null)} className="text-gray-400 hover:text-gray-600 text-xs">ยกเลิก</button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2.5 text-gray-400 text-xs whitespace-nowrap">
                          {new Date(log.logged_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="px-3 py-2.5 text-gray-700">
                          <span className="font-mono text-gray-400 text-xs mr-1">#{log.sequence}</span>{log.process_name}
                        </td>
                        <td className="px-3 py-2.5 text-gray-600">{log.operator || '—'}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`text-xs rounded-full px-2.5 py-0.5 font-semibold ${ACTION_STYLE[log.action] || 'bg-gray-100 text-gray-500'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-gray-500 text-xs max-w-[160px] truncate">{log.note || '—'}</td>
                        <td className="px-3 py-2.5 text-right whitespace-nowrap space-x-3">
                          <button
                            onClick={() => setEditLog({ id: log.id, operator: log.operator || '', action: log.action, note: log.note || '' })}
                            className="text-amber-500 hover:text-amber-700 text-xs font-medium"
                          >แก้ไข</button>
                          <button onClick={() => handleDelete(log.id)} className="text-red-400 hover:text-red-600 text-xs font-medium">ลบ</button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        {msg && <div className="mt-3"><SaveMsg msg={msg} /></div>}
      </div>
    </div>
  );
}

function TraysPanel({ lines }) {
  const [trays,        setTrays]        = useState([]);
  const [search,       setSearch]       = useState('');
  const [filterLine,   setFilterLine]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [form,         setForm]         = useState({ qr_code: '', line_id: '', product: '', batch_no: '', qty: '1', status: 'pending' });
  const [editId,       setEditId]       = useState(null);
  const [msg,          setMsg]          = useState(null);
  const [showForm,     setShowForm]     = useState(true);
  const [selectedTray, setSelectedTray] = useState(null);
  const tab = TABS[1];
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

  // 🖨️ ฟังก์ชันสำหรับพิมพ์ QR Code
  const handlePrint = (tray) => {
    // ใช้ API ฟรีในการสร้างรูป QR Code จาก text (ไม่ต้องลง library เพิ่ม)
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(tray.qr_code)}`;

    // สร้างหน้าต่างใหม่
    const printWindow = window.open('', '_blank', 'width=400,height=400');

    // เขียน HTML สำหรับหน้าพิมพ์ฉลาก (Label)
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR - ${tray.qr_code}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              text-align: center;
              padding: 20px;
              margin: 0;
            }
            .label-container {
              display: inline-block;
              border: 1px dashed #ccc;
              padding: 20px;
              border-radius: 12px;
              min-width: 200px;
            }
            .qr-image { width: 150px; height: 150px; margin-bottom: 15px; }
            .qr-text { font-size: 20px; font-weight: bold; margin: 0 0 10px 0; }
            .info-text { font-size: 14px; color: #555; margin: 4px 0; }

            /* ซ่อนขอบและ margin เมื่อสั่งพิมพ์จริง */
            @media print {
              body { padding: 0; }
              .label-container { border: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            <img class="qr-image" src="${qrImageUrl}" alt="QR Code" onload="window.print(); window.onafterprint = function(){ window.close(); }" />
            <p class="qr-text">${tray.qr_code}</p>
            ${tray.product ? `<p class="info-text">Product: <b>${tray.product}</b></p>` : ''}
            ${tray.batch_no ? `<p class="info-text">Batch: <b>${tray.batch_no}</b></p>` : ''}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filtered = trays.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      t.qr_code.toLowerCase().includes(q) ||
      (t.product  || '').toLowerCase().includes(q) ||
      (t.batch_no || '').toLowerCase().includes(q);
    const matchLine   = !filterLine   || String(t.line_id) === filterLine;
    const matchStatus = !filterStatus || t.status === filterStatus;
    return matchSearch && matchLine && matchStatus;
  });

  const statusCounts = trays.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {});

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

      {/* ── Status summary pills ── */}
      {trays.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(statusCounts).map(([s, n]) => (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
              className={`text-xs font-semibold rounded-full px-3 py-1 border transition-colors ${
                filterStatus === s
                  ? `${STATUS_STYLE[s] || 'bg-gray-100 text-gray-600'} border-current`
                  : 'bg-white text-gray-500 border-gray-200 hover:border-amber-300'
              }`}
            >
              {s}: {n}
            </button>
          ))}
        </div>
      )}

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
          <option value="">ทั้งหมด</option>
          {lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select
          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">ทุกสถานะ</option>
          <option value="pending">pending</option>
          <option value="in_progress">in_progress</option>
          <option value="completed">completed</option>
          <option value="on_hold">on_hold</option>
        </select>
        {(search || filterLine || filterStatus) && (
          <button onClick={() => { setSearch(''); setFilterLine(''); setFilterStatus(''); }}
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
                  <td className="px-4 py-2.5 text-right space-x-3 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedTray(selectedTray?.id === t.id ? null : t)}
                      className={`text-xs font-medium transition-colors ${
                        selectedTray?.id === t.id
                          ? 'text-indigo-700 font-semibold'
                          : 'text-indigo-500 hover:text-indigo-700'
                      }`}
                    >📋 Logs</button>
                    <button onClick={() => handlePrint(t)}     className="text-gray-500 hover:text-gray-800 text-xs font-medium">🖨️ พิมพ์ QR</button>
                    <button onClick={() => handleEdit(t)}      className="text-amber-500 hover:text-amber-700 text-xs font-medium">แก้ไข</button>
                    <button onClick={() => handleDelete(t.id)} className="text-red-400   hover:text-red-600  text-xs font-medium">ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {selectedTray && (
        <TrayLogsPanel
          tray={selectedTray}
          onClose={() => setSelectedTray(null)}
          onRefreshTray={load}
        />
      )}
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
