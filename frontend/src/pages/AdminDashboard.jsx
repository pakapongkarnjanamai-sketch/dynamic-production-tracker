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
        className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        {...props}
      />
    </label>
  );
}

function Section({ title, children }) {
  return (
    <section className="bg-white rounded-2xl border shadow-sm p-5 mb-6">
      <h2 className="text-lg font-bold mb-4 text-gray-800">{title}</h2>
      {children}
    </section>
  );
}

// ─────────────────────────────────────────
// Lines panel
// ─────────────────────────────────────────
function LinesPanel({ lines, onRefresh }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [msg,  setMsg]  = useState(null);
  const [editId, setEditId] = useState(null);

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
    } catch (err) {
      setMsg(err.message);
    }
  };

  const handleEdit = (line) => {
    setEditId(line.id);
    setName(line.name);
    setDesc(line.description || '');
  };

  const handleDelete = async (id) => {
    if (!confirm('ลบสายการผลิตนี้?')) return;
    try {
      await deleteLine(id);
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <Section title="จัดการสายการผลิต (Production Lines)">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-5">
        <Input label="ชื่อสายการผลิต *" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="รายละเอียด"       value={desc} onChange={(e) => setDesc(e.target.value)} />
        {msg && <p className="text-sm">{msg}</p>}
        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 text-white rounded-xl px-5 py-2 font-semibold hover:bg-blue-700">
            {editId ? 'บันทึก' : 'เพิ่ม'}
          </button>
          {editId && (
            <button type="button" onClick={() => { setEditId(null); setName(''); setDesc(''); }}
              className="text-gray-500 underline text-sm">
              ยกเลิก
            </button>
          )}
        </div>
      </form>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="pb-2 pr-3">ชื่อ</th>
            <th className="pb-2 pr-3">รายละเอียด</th>
            <th className="pb-2">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.id} className="border-b hover:bg-gray-50">
              <td className="py-2 pr-3 font-medium">{l.name}</td>
              <td className="py-2 pr-3 text-gray-500">{l.description}</td>
              <td className="py-2 flex gap-2">
                <button onClick={() => handleEdit(l)} className="text-blue-500 hover:underline text-xs">แก้ไข</button>
                <button onClick={() => handleDelete(l.id)} className="text-red-500 hover:underline text-xs">ลบ</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

// ─────────────────────────────────────────
// Processes panel
// ─────────────────────────────────────────
function ProcessesPanel({ lines }) {
  const [lineId,   setLineId]   = useState('');
  const [procs,    setProcs]    = useState([]);
  const [name,     setName]     = useState('');
  const [seq,      setSeq]      = useState('');
  const [desc,     setDesc]     = useState('');
  const [editId,   setEditId]   = useState(null);
  const [msg,      setMsg]      = useState(null);

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
    } catch (err) {
      setMsg(err.message);
    }
  };

  const handleEdit = (p) => {
    setEditId(p.id); setName(p.name); setSeq(String(p.sequence)); setDesc(p.description || '');
  };

  const handleDelete = async (id) => {
    if (!confirm('ลบขั้นตอนนี้?')) return;
    try { await deleteProcess(id); loadProcs(lineId); } catch (err) { alert(err.message); }
  };

  return (
    <Section title="จัดการขั้นตอน (Processes)">
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 block mb-1">เลือกสายการผลิต</label>
        <select
          value={lineId}
          onChange={(e) => setLineId(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full max-w-xs"
        >
          <option value="">— เลือกสายการผลิต —</option>
          {lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {lineId && (
        <>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-5">
            <Input label="ชื่อขั้นตอน *"   value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="ลำดับ (Sequence) *" type="number" min="1" value={seq}  onChange={(e) => setSeq(e.target.value)} required />
            <Input label="รายละเอียด"        value={desc} onChange={(e) => setDesc(e.target.value)} />
            {msg && <p className="text-sm">{msg}</p>}
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-600 text-white rounded-xl px-5 py-2 font-semibold hover:bg-blue-700">
                {editId ? 'บันทึก' : 'เพิ่ม'}
              </button>
              {editId && (
                <button type="button" onClick={() => { setEditId(null); setName(''); setSeq(''); setDesc(''); }}
                  className="text-gray-500 underline text-sm">ยกเลิก</button>
              )}
            </div>
          </form>

          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 pr-3">ลำดับ</th>
                <th className="pb-2 pr-3">ชื่อ</th>
                <th className="pb-2">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {procs.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 pr-3 text-center">{p.sequence}</td>
                  <td className="py-2 pr-3 font-medium">{p.name}</td>
                  <td className="py-2 flex gap-2">
                    <button onClick={() => handleEdit(p)}   className="text-blue-500 hover:underline text-xs">แก้ไข</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:underline text-xs">ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </Section>
  );
}

// ─────────────────────────────────────────
// Operators panel
// ─────────────────────────────────────────
function OperatorsPanel() {
  const [operators, setOperators] = useState([]);
  const [name,        setName]        = useState('');
  const [employeeId,  setEmployeeId]  = useState('');
  const [department,  setDepartment]  = useState('');
  const [editId,      setEditId]      = useState(null);
  const [msg,         setMsg]         = useState(null);

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
    } catch (err) {
      setMsg(err.message);
    }
  };

  const handleEdit = (op) => {
    setEditId(op.id);
    setName(op.name);
    setEmployeeId(op.employee_id || '');
    setDepartment(op.department || '');
  };

  const handleToggle = async (op) => {
    try {
      await updateOperator(op.id, { is_active: !op.is_active });
      load();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('ลบผู้ปฏิบัติงานนี้?')) return;
    try { await deleteOperator(id); load(); } catch (err) { alert(err.message); }
  };

  return (
    <Section title="จัดการผู้ปฏิบัติงาน (Operators)">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-5">
        <Input label="ชื่อ-นามสกุล *"    value={name}       onChange={(e) => setName(e.target.value)}       required />
        <Input label="รหัสพนักงาน"        value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="เช่น EMP-003" />
        <Input label="แผนก / สาย"         value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="เช่น SMT" />
        {msg && <p className="text-sm">{msg}</p>}
        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 text-white rounded-xl px-5 py-2 font-semibold hover:bg-blue-700">
            {editId ? 'บันทึก' : 'เพิ่ม'}
          </button>
          {editId && (
            <button type="button"
              onClick={() => { setEditId(null); setName(''); setEmployeeId(''); setDepartment(''); }}
              className="text-gray-500 underline text-sm">
              ยกเลิก
            </button>
          )}
        </div>
      </form>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="pb-2 pr-3">ชื่อ</th>
            <th className="pb-2 pr-3">รหัส</th>
            <th className="pb-2 pr-3">แผนก</th>
            <th className="pb-2 pr-3 text-center">สถานะ</th>
            <th className="pb-2">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {operators.map((op) => (
            <tr key={op.id} className="border-b hover:bg-gray-50">
              <td className="py-2 pr-3 font-medium">{op.name}</td>
              <td className="py-2 pr-3 text-gray-500">{op.employee_id ?? '—'}</td>
              <td className="py-2 pr-3 text-gray-500">{op.department ?? '—'}</td>
              <td className="py-2 pr-3 text-center">
                <button onClick={() => handleToggle(op)}
                  className={`text-xs rounded-full px-3 py-0.5 font-semibold ${op.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {op.is_active ? 'Active' : 'Inactive'}
                </button>
              </td>
              <td className="py-2 flex gap-2">
                <button onClick={() => handleEdit(op)}    className="text-blue-500 hover:underline text-xs">แก้ไข</button>
                <button onClick={() => handleDelete(op.id)} className="text-red-500 hover:underline text-xs">ลบ</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

// ─────────────────────────────────────────
// Trays panel
// ─────────────────────────────────────────
const TRAY_STATUS = ['pending', 'in_progress', 'done', 'on_hold'];
const STATUS_STYLE = {
  pending:     'bg-gray-100 text-gray-600',
  in_progress: 'bg-yellow-100 text-yellow-700',
  done:        'bg-green-100 text-green-700',
  on_hold:     'bg-red-100 text-red-600',
};

function TraysPanel({ lines }) {
  const [trays,      setTrays]      = useState([]);
  const [search,     setSearch]     = useState('');
  const [filterLine, setFilterLine] = useState('');
  const [form,       setForm]       = useState({ qr_code: '', line_id: '', product: '', batch_no: '', qty: '1', status: 'pending' });
  const [editId,     setEditId]     = useState(null);
  const [msg,        setMsg]        = useState(null);

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
    <Section title="จัดการถาดงาน (Trays)">
      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">QR Code *</label>
            <input
              className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.qr_code}
              onChange={(e) => setForm((f) => ({ ...f, qr_code: e.target.value }))}
              placeholder="เช่น TRAY-001"
              required
              disabled={!!editId}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">สายการผลิต</label>
            <select
              className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              value={form.line_id}
              onChange={(e) => setForm((f) => ({ ...f, line_id: e.target.value }))}
            >
              <option value="">— ไม่ระบุ —</option>
              {lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">สถานะ</label>
            <select
              className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              {TRAY_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">สินค้า / Product</label>
            <input
              className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.product}
              onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))}
              placeholder="ไม่บังคับ"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Batch No.</label>
            <input
              className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.batch_no}
              onChange={(e) => setForm((f) => ({ ...f, batch_no: e.target.value }))}
              placeholder="ไม่บังคับ"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">จำนวน (qty)</label>
            <input
              type="number" min="1"
              className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.qty}
              onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
            />
          </div>
        </div>
        {msg && <p className="text-sm mb-2 text-blue-600">{msg}</p>}
        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 text-white rounded-xl px-5 py-2 font-semibold hover:bg-blue-700 text-sm">
            {editId ? 'บันทึก' : 'เพิ่มถาด'}
          </button>
          {editId && (
            <button type="button" onClick={() => { setEditId(null); setForm({ qr_code: '', line_id: '', product: '', batch_no: '', qty: '1', status: 'pending' }); }}
              className="text-gray-500 underline text-sm">
              ยกเลิก
            </button>
          )}
        </div>
      </form>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          className="border rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[160px] focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="ค้นหา QR, สินค้า, Batch..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          value={filterLine}
          onChange={(e) => setFilterLine(e.target.value)}
        >
          <option value="">ทุกสาย</option>
          {lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        {(search || filterLine) && (
          <button onClick={() => { setSearch(''); setFilterLine(''); }} className="text-xs text-gray-400 hover:underline">
            ล้าง
          </button>
        )}
        <span className="text-xs text-gray-400 self-center">{filtered.length} / {trays.length} รายการ</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-5">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-gray-500 border-b bg-gray-50">
              <th className="px-5 pb-2 pt-2">QR Code</th>
              <th className="px-5 pb-2 pt-2">สายการผลิต</th>
              <th className="px-5 pb-2 pt-2">สินค้า</th>
              <th className="px-5 pb-2 pt-2">Batch</th>
              <th className="px-5 pb-2 pt-2 text-center">Qty</th>
              <th className="px-5 pb-2 pt-2 text-center">Status</th>
              <th className="px-5 pb-2 pt-2 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">ไม่มีข้อมูลถาด</td></tr>
            )}
            {filtered.map((t) => (
              <tr key={t.id} className="border-b hover:bg-gray-50">
                <td className="px-5 py-2 font-mono font-semibold text-gray-800">{t.qr_code}</td>
                <td className="px-5 py-2 text-gray-600">{t.line_name ?? '—'}</td>
                <td className="px-5 py-2 text-gray-600">{t.product ?? '—'}</td>
                <td className="px-5 py-2 font-mono text-xs text-gray-500">{t.batch_no ?? '—'}</td>
                <td className="px-5 py-2 text-center">{t.qty}</td>
                <td className="px-5 py-2 text-center">
                  <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${STATUS_STYLE[t.status] || 'bg-gray-100 text-gray-500'}`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-5 py-2 text-right flex gap-2 justify-end">
                  <button onClick={() => handleEdit(t)}       className="text-blue-500 hover:underline text-xs">แก้ไข</button>
                  <button onClick={() => handleDelete(t.id)}  className="text-red-500 hover:underline text-xs">ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────
// Main page
// ─────────────────────────────────────────
export default function AdminDashboard() {
  const [lines,   setLines]   = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLines = () => {
    getLines().then(setLines).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(loadLines, []);

  return (
    <main className="min-h-screen bg-gray-100 p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6">Admin Dashboard</h1>
      {loading ? (
        <p className="text-gray-400 animate-pulse text-center">กำลังโหลด…</p>
      ) : (
        <>
          <LinesPanel lines={lines} onRefresh={loadLines} />
          <ProcessesPanel lines={lines} />
          <TraysPanel lines={lines} />
          <OperatorsPanel />
        </>
      )}
    </main>
  );
}
