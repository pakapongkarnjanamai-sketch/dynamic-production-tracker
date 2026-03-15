import { useEffect, useState } from 'react';
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
// UI Components (Clean, Minimal, Responsive)
// ─────────────────────────────────────────
function Input({ label, className = '', ...props }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
      {label}
      {props.as === 'select' ? (
        <select
          className={`bg-white border border-slate-300 rounded-lg px-3 py-3 md:py-2.5 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-shadow ${className}`}
          {...props}
        >
          {props.children}
        </select>
      ) : (
        <input
          className={`bg-white border border-slate-300 rounded-lg px-3 py-3 md:py-2.5 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-shadow ${className}`}
          {...props}
        />
      )}
    </label>
  );
}

function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = "inline-flex items-center justify-center font-semibold rounded-lg text-sm md:text-sm transition-colors px-4 py-3 md:py-2.5 focus:outline-none";
  const styles = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 shadow-sm",
    secondary: "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100 shadow-sm",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200",
    text: "text-blue-600 hover:bg-blue-50 active:bg-blue-100 px-3 py-1.5",
  };
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

function Badge({ children, color = 'gray' }) {
  const colors = {
    gray: "bg-slate-100 text-slate-600 border-slate-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return (
    <span className={`text-[11px] px-2.5 py-1 md:py-0.5 rounded-md font-bold border ${colors[color]}`}>
      {children}
    </span>
  );
}

// Modal Component
function Modal({ title, isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-5 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

function SaveMsg({ msg }) {
  if (!msg) return null;
  const isError = !msg.includes('สำเร็จ');
  return (
    <div className={`mt-4 p-3 rounded-xl text-sm font-bold text-center ${isError ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
      {msg}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Lines & Processes View
// ─────────────────────────────────────────────────────────────────────────────
function LinesView({ lines, onRefresh }) {
  const [isLineModalOpen, setIsLineModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [msg, setMsg] = useState(null);

  const openLineModal = (line = null) => {
    setEditData(line); setName(line ? line.name : ''); setDesc(line ? line.description || '' : ''); setMsg(null); setIsLineModalOpen(true);
  };

  const handleLineSubmit = async (e) => {
    e.preventDefault(); setMsg(null);
    try {
      if (editData) { await updateLine(editData.id, { name, description: desc }); setMsg('อัปเดตสำเร็จ'); }
      else { await createLine({ name, description: desc }); setMsg('เพิ่มสำเร็จ'); }
      setTimeout(() => { setIsLineModalOpen(false); onRefresh(); }, 1000);
    } catch (err) { setMsg(err.message); }
  };

  const handleDeleteLine = async (id) => {
    if (confirm('ยืนยันการลบสายการผลิต?')) { try { await deleteLine(id); onRefresh(); } catch (err) { alert(err.message); } }
  };

  const openProcessModal = (line) => { setSelectedLine(line); setIsProcessModalOpen(true); };

  return (
    <div className="animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">

        <Button onClick={() => openLineModal()} className="w-full sm:w-auto">+ เพิ่มสายการผลิต</Button>
      </div>

      {lines.length === 0 ? (
        <div className="text-center py-10 text-slate-400 bg-white rounded-xl border border-slate-200">ยังไม่มีข้อมูล</div>
      ) : (
        <>
          {/* Mobile View (Cards) */}
          <div className="md:hidden space-y-4">
            {lines.map((l) => (
              <div key={l.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="font-bold text-lg text-slate-800">{l.name}</div>
                <div className="text-sm text-slate-500 mt-1">{l.description || 'ไม่มีรายละเอียด'}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="secondary" className="flex-1 text-xs py-2" onClick={() => openProcessModal(l)}>จัดการขั้นตอน</Button>
                  <Button variant="text" className="text-xs bg-slate-50 border border-slate-100" onClick={() => openLineModal(l)}>แก้ไข</Button>
                  <Button variant="danger" className="text-xs" onClick={() => handleDeleteLine(l.id)}>ลบ</Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View (Table) */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">ชื่อสายการผลิต</th>
                  <th className="px-5 py-4 font-semibold">รายละเอียด</th>
                  <th className="px-5 py-4 font-semibold text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lines.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-800">{l.name}</td>
                    <td className="px-5 py-4 text-slate-500">{l.description || '—'}</td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <Button variant="secondary" onClick={() => openProcessModal(l)}>จัดการขั้นตอน</Button>
                      <Button variant="text" onClick={() => openLineModal(l)}>แก้ไข</Button>
                      <Button variant="danger" onClick={() => handleDeleteLine(l.id)}>ลบ</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modals */}
      <Modal title={editData ? 'แก้ไขสายการผลิต' : 'เพิ่มสายการผลิต'} isOpen={isLineModalOpen} onClose={() => setIsLineModalOpen(false)}>
        <form onSubmit={handleLineSubmit} className="flex flex-col gap-4">
          <Input label="ชื่อสายการผลิต *" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="รายละเอียด" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <Button type="submit" className="w-full mt-2">{editData ? 'บันทึกข้อมูล' : 'สร้างสายการผลิต'}</Button>
        </form>
        <SaveMsg msg={msg} />
      </Modal>

      <Modal title={`ขั้นตอน: ${selectedLine?.name}`} isOpen={isProcessModalOpen} onClose={() => setIsProcessModalOpen(false)}>
        {selectedLine && <ProcessManager lineId={selectedLine.id} />}
      </Modal>
    </div>
  );
}

function ProcessManager({ lineId }) {
  const [procs, setProcs] = useState([]);
  const [name, setName] = useState('');
  const [seq, setSeq] = useState('');
  const [desc, setDesc] = useState('');
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState(null);

  const loadProcs = () => { getProcesses(lineId).then(setProcs).catch(console.log); };
  useEffect(() => { loadProcs(); }, [lineId]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setMsg(null);
    try {
      if (editId) { await updateProcess(editId, { name, sequence: Number(seq), description: desc }); setMsg('อัปเดตสำเร็จ'); }
      else { await createProcess({ line_id: Number(lineId), name, sequence: Number(seq), description: desc }); setMsg('เพิ่มสำเร็จ'); }
      setTimeout(() => { resetForm(); loadProcs(); }, 1000);
    } catch (err) { setMsg(err.message); }
  };

  const resetForm = () => { setEditId(null); setName(''); setSeq(''); setDesc(''); setMsg(null); };
  const editProc = (p) => { setEditId(p.id); setName(p.name); setSeq(String(p.sequence)); setDesc(p.description || ''); setMsg(null); };
  const deleteProc = async (id) => { if (confirm('ยืนยันการลบขั้นตอน?')) { try { await deleteProcess(id); loadProcs(); } catch (err) { alert(err.message); } } };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
        <h4 className="font-semibold text-sm text-slate-700">{editId ? 'แก้ไขขั้นตอน' : 'เพิ่มขั้นตอนใหม่'}</h4>
        <div className="flex gap-3">
          <div className="w-1/3"><Input label="ลำดับ *" type="number" min="1" value={seq} onChange={(e) => setSeq(e.target.value)} required /></div>
          <div className="flex-1"><Input label="ชื่อขั้นตอน *" value={name} onChange={(e) => setName(e.target.value)} required /></div>
        </div>
        <Input label="รายละเอียด" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <div className="flex gap-2 mt-2">
          <Button type="submit" className="flex-1">{editId ? 'บันทึกการแก้ไข' : '+ เพิ่มขั้นตอน'}</Button>
          {editId && <Button type="button" variant="secondary" onClick={resetForm}>ยกเลิก</Button>}
        </div>
        <SaveMsg msg={msg} />
      </form>

      <div className="space-y-2">
        {procs.length === 0 ? <p className="text-center text-sm text-slate-400 py-4">ยังไม่มีขั้นตอนในสายการผลิตนี้</p> :
          procs.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">{p.sequence}</span>
                <div>
                  <div className="font-semibold text-sm text-slate-800">{p.name}</div>
                  {p.description && <div className="text-xs text-slate-500">{p.description}</div>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="text" className="px-2" onClick={() => editProc(p)}>แก้ไข</Button>
                <button onClick={() => deleteProc(p.id)} className="text-red-500 hover:bg-red-50 px-2 py-1.5 rounded-md text-xs font-semibold">ลบ</button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Trays View
// ─────────────────────────────────────────────────────────────────────────────
function TraysView({ lines }) {
  const [trays, setTrays] = useState([]);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [selectedTray, setSelectedTray] = useState(null);
  const [form, setForm] = useState({ qr_code: '', line_id: '', product: '', batch_no: '', qty: '1', status: 'pending', due_date: '' });
  const [msg, setMsg] = useState(null);

  const TRAY_STATUS = ['pending', 'in_progress', 'completed', 'on_hold'];
  const STATUS_LABELS = { pending: 'รอดำเนินการ', in_progress: 'กำลังทำ', completed: 'เสร็จสิ้น', on_hold: 'รอแก้ไข' };
  const STATUS_COLORS = { pending: 'gray', in_progress: 'amber', completed: 'green', on_hold: 'red' };

  const load = () => getTrays().then(setTrays).catch(console.log);
  useEffect(() => { load(); }, []);

  const openModal = (tray = null) => {
    setEditData(tray);
    if (tray) setForm({ qr_code: tray.qr_code, line_id: String(tray.line_id || ''), product: tray.product || '', batch_no: tray.batch_no || '', qty: String(tray.qty), status: tray.status || 'pending', due_date: tray.due_date ? new Date(tray.due_date).toISOString().slice(0, 16) : '' });
    else setForm({ qr_code: '', line_id: '', product: '', batch_no: '', qty: '1', status: 'pending', due_date: '' });
    setMsg(null); setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setMsg(null);
    const payload = { ...form, line_id: form.line_id ? Number(form.line_id) : null, qty: Number(form.qty) || 1 };
    try {
      if (editData) { await updateTray(editData.id, payload); setMsg('อัปเดตสำเร็จ'); }
      else { await createTray(payload); setMsg('เพิ่มสำเร็จ'); }
      setTimeout(() => { setIsModalOpen(false); load(); }, 1000);
    } catch (err) { setMsg(err.message); }
  };

  const handleDelete = async (id) => { if (confirm('ยืนยันการลบถาดงาน?')) { try { await deleteTray(id); load(); } catch (err) { alert(err.message); } } };
  const openLogs = (tray) => { setSelectedTray(tray); setIsLogModalOpen(true); };
  const filtered = trays.filter((t) => !search || t.qr_code.toLowerCase().includes(search.toLowerCase()) || (t.product || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">

        <Button onClick={() => openModal()} className="w-full sm:w-auto">+ สร้างถาดงาน</Button>
      </div>

      <div className="mb-4">
        <input
          className="w-full md:w-80 bg-white border border-slate-300 rounded-lg px-4 py-3 md:py-2.5 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow"
          placeholder="🔍 ค้นหา QR Code หรือ ชื่อสินค้า..."
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-slate-400 bg-white rounded-xl border border-slate-200">ไม่พบข้อมูลถาดงาน</div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {filtered.map((t) => (
              <div key={t.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-mono font-black text-lg text-slate-800">{t.qr_code}</div>
                  <Badge color={STATUS_COLORS[t.status]}>{STATUS_LABELS[t.status]}</Badge>
                </div>
                <div className="text-sm font-semibold text-slate-700">{t.product || 'ไม่มีชื่อสินค้า'}</div>
                <div className="text-xs text-slate-500 mt-1">{t.line_name || 'ไม่ระบุสายการผลิต'} {t.batch_no && `• Batch: ${t.batch_no}`}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="secondary" className="flex-1 text-xs py-2" onClick={() => openLogs(t)}>ดูประวัติ</Button>
                  <Button variant="text" className="text-xs bg-slate-50 border border-slate-100" onClick={() => openModal(t)}>แก้ไข</Button>
                  <Button variant="danger" className="text-xs" onClick={() => handleDelete(t.id)}>ลบ</Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">QR Code</th>
                  <th className="px-5 py-4 font-semibold">สินค้า (Batch)</th>
                  <th className="px-5 py-4 font-semibold">สายการผลิต</th>
                  <th className="px-5 py-4 font-semibold">สถานะ</th>
                  <th className="px-5 py-4 font-semibold text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-800">{t.qr_code}</td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-800">{t.product || '—'}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{t.batch_no ? `Batch: ${t.batch_no}` : ''}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{t.line_name || '—'}</td>
                    <td className="px-5 py-4"><Badge color={STATUS_COLORS[t.status]}>{STATUS_LABELS[t.status]}</Badge></td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <Button variant="secondary" onClick={() => openLogs(t)}>ดูประวัติ</Button>
                      <Button variant="text" onClick={() => openModal(t)}>แก้ไข</Button>
                      <Button variant="danger" onClick={() => handleDelete(t.id)}>ลบ</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modals */}
      <Modal title={editData ? 'แก้ไขถาดงาน' : 'เพิ่มถาดงาน'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="QR Code *" value={form.qr_code} onChange={(e) => setForm({ ...form, qr_code: e.target.value })} required disabled={!!editData} className="font-mono bg-slate-50" />
          <Input label="สายการผลิต" as="select" value={form.line_id} onChange={(e) => setForm({ ...form, line_id: e.target.value })}><option value="">— ไม่ระบุ —</option>{lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Input>
          <Input label="สินค้า (Product)" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Batch No." value={form.batch_no} onChange={(e) => setForm({ ...form, batch_no: e.target.value })} />
            <Input label="จำนวน (Qty)" type="number" min="1" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
          </div>
          <Input label="สถานะ" as="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{TRAY_STATUS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</Input>
          <Input label="กำหนดส่ง (Due Date)" type="datetime-local" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          <Button type="submit" className="w-full mt-2">{editData ? 'บันทึกข้อมูล' : 'สร้างถาดงาน'}</Button>
        </form>
        <SaveMsg msg={msg} />
      </Modal>

      <Modal title={`ประวัติ: ${selectedTray?.qr_code}`} isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)}>
        {selectedTray && <TrayLogs trayId={selectedTray.id} />}
      </Modal>
    </div>
  );
}

function TrayLogs({ trayId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getLogs({ tray_id: trayId }).then(setLogs).catch(console.log).finally(()=>setLoading(false)); }, [trayId]);

  if (loading) return <div className="text-center py-6 text-slate-500 text-sm">กำลังโหลด...</div>;
  if (logs.length === 0) return <div className="text-center py-6 text-slate-400 text-sm">ยังไม่มีประวัติการทำงาน</div>;

  return (
    <div className="space-y-3">
      {logs.map(log => (
        <div key={log.id} className="p-4 border border-slate-100 bg-slate-50 rounded-xl flex justify-between items-start gap-3">
          <div>
            <div className="font-semibold text-sm text-slate-800">{log.process_name}</div>
            <div className="text-xs text-slate-500 mt-1">👤 {log.operator || 'ไม่ระบุ'} • 🕒 {new Date(log.logged_at).toLocaleString('th-TH', {dateStyle:'short', timeStyle:'short'})}</div>
            {log.note && <div className="text-xs text-slate-400 mt-1.5 p-1.5 bg-white rounded border border-slate-100">Note: {log.note}</div>}
          </div>
          <Badge color={log.action === 'finish' ? 'green' : log.action === 'ng' ? 'red' : 'blue'}>{log.action.toUpperCase()}</Badge>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Operators View
// ─────────────────────────────────────────────────────────────────────────────
function OperatorsView() {
  const [operators, setOperators] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [msg, setMsg] = useState(null);

  const load = () => getOperators().then(setOperators).catch(console.log);
  useEffect(() => { load(); }, []);

  const openModal = (op = null) => {
    setEditData(op); setName(op ? op.name : ''); setEmployeeId(op ? op.employee_id || '' : ''); setDepartment(op ? op.department || '' : '');
    setMsg(null); setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setMsg(null);
    try {
      if (editData) { await updateOperator(editData.id, { name, employee_id: employeeId || null, department: department || null }); setMsg('อัปเดตสำเร็จ'); }
      else { await createOperator({ name, employee_id: employeeId || null, department: department || null }); setMsg('เพิ่มสำเร็จ'); }
      setTimeout(() => { setIsModalOpen(false); load(); }, 1000);
    } catch (err) { setMsg(err.message); }
  };

  const handleToggle = async (op) => { try { await updateOperator(op.id, { is_active: !op.is_active }); load(); } catch (err) { alert(err.message); } };
  const handleDelete = async (id) => { if (confirm('ยืนยันการลบผู้ปฏิบัติงาน?')) { try { await deleteOperator(id); load(); } catch (err) { alert(err.message); } } };

  return (
    <div className="animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">

        <Button onClick={() => openModal()} className="w-full sm:w-auto">+ เพิ่มพนักงาน</Button>
      </div>

      {operators.length === 0 ? (
        <div className="text-center py-10 text-slate-400 bg-white rounded-xl border border-slate-200">ยังไม่มีข้อมูล</div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {operators.map((op) => (
              <div key={op.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-lg text-slate-800">{op.name}</div>
                  <button onClick={() => handleToggle(op)} className="active:opacity-50 transition-opacity">
                    <Badge color={op.is_active ? 'green' : 'gray'}>{op.is_active ? 'ใช้งาน' : 'ระงับ'}</Badge>
                  </button>
                </div>
                <div className="text-sm text-slate-500">{op.employee_id || 'ไม่มีรหัส'} • {op.department || 'ไม่ระบุแผนก'}</div>
                <div className="mt-4 flex gap-2">
                  <Button variant="secondary" className="flex-1 text-xs py-2" onClick={() => openModal(op)}>แก้ไขข้อมูล</Button>
                  <Button variant="danger" className="text-xs" onClick={() => handleDelete(op.id)}>ลบ</Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">ชื่อพนักงาน</th>
                  <th className="px-5 py-4 font-semibold">รหัส / แผนก</th>
                  <th className="px-5 py-4 font-semibold">สถานะ</th>
                  <th className="px-5 py-4 font-semibold text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {operators.map((op) => (
                  <tr key={op.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-800">{op.name}</td>
                    <td className="px-5 py-4">
                      <div className="text-slate-600 font-mono text-xs">{op.employee_id || '—'}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{op.department || '—'}</div>
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => handleToggle(op)} className="hover:opacity-80 transition-opacity">
                        <Badge color={op.is_active ? 'green' : 'gray'}>{op.is_active ? 'ใช้งาน' : 'ระงับ'}</Badge>
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <Button variant="text" onClick={() => openModal(op)}>แก้ไข</Button>
                      <Button variant="danger" onClick={() => handleDelete(op.id)}>ลบ</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal title={editData ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงาน'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="ชื่อ-นามสกุล *" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="รหัสพนักงาน" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
          <Input label="แผนก / สายการผลิต" value={department} onChange={(e) => setDepartment(e.target.value)} />
          <Button type="submit" className="w-full mt-2">{editData ? 'บันทึกข้อมูล' : 'เพิ่มรายชื่อ'}</Button>
        </form>
        <SaveMsg msg={msg} />
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Users View
// ─────────────────────────────────────────────────────────────────────────────
function UsersView({ currentRole }) {
  const [users, setUsers] = useState([]);
  const [operators, setOperators] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('operator');
  const [operatorId, setOperatorId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [msg, setMsg] = useState(null);

  const roleOptions = currentRole === 'superadmin' ? ['superadmin', 'admin', 'operator', 'viewer'] : ['operator', 'viewer'];

  const load = () => { Promise.all([getUsers(), getOperators()]).then(([u, o]) => { setUsers(u); setOperators(o); }).catch(console.log); };
  useEffect(() => { load(); }, []);

  const openModal = (u = null) => {
    setEditData(u); setEmployeeId(u ? u.employee_id : ''); setName(u ? u.name : ''); setPassword(''); setRole(u ? u.role : 'operator');
    setOperatorId(u && u.operator_id ? String(u.operator_id) : ''); setIsActive(u ? Boolean(u.is_active) : true);
    setMsg(null); setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setMsg(null);
    const payload = { employee_id: employeeId, name, role, operator_id: operatorId ? Number(operatorId) : null, is_active: isActive };
    if (!editData || password) payload.password = password;
    try {
      if (editData) { await updateUser(editData.id, payload); setMsg('อัปเดตสำเร็จ'); }
      else { await createUser(payload); setMsg('เพิ่มสำเร็จ'); }
      setTimeout(() => { setIsModalOpen(false); load(); }, 1000);
    } catch (err) { setMsg(err.message); }
  };

  const handleDelete = async (id) => { if (confirm('ยืนยันการลบผู้ใช้งานระบบ?')) { try { await deleteUser(id); load(); } catch (err) { alert(err.message); } } };

  return (
    <div className="animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">

        <Button onClick={() => openModal()} className="w-full sm:w-auto">+ สร้างบัญชี</Button>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-10 text-slate-400 bg-white rounded-xl border border-slate-200">ยังไม่มีข้อมูล</div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {users.map((u) => (
              <div key={u.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-lg text-slate-800">{u.name}</div>
                  <Badge color={u.role === 'admin' || u.role === 'superadmin' ? 'blue' : 'gray'}>{u.role.toUpperCase()}</Badge>
                </div>
                <div className="text-sm text-slate-500 mb-1">Login ID: <span className="font-mono">{u.employee_id}</span></div>
                <div className="text-xs text-slate-400 mb-2">ผูกกับ: {u.operator_name || 'ไม่ผูกข้อมูล'}</div>
                {!u.is_active && <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md">ระงับการใช้งาน</span>}
                <div className="mt-4 flex gap-2">
                  <Button variant="secondary" className="flex-1 text-xs py-2" onClick={() => openModal(u)}>แก้ไข</Button>
                  <Button variant="danger" className="text-xs" onClick={() => handleDelete(u.id)}>ลบ</Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">ชื่อ / รหัส</th>
                  <th className="px-5 py-4 font-semibold">สิทธิ์ (Role)</th>
                  <th className="px-5 py-4 font-semibold">ผูกบัญชี Operator</th>
                  <th className="px-5 py-4 font-semibold">สถานะ</th>
                  <th className="px-5 py-4 font-semibold text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{u.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{u.employee_id}</div>
                    </td>
                    <td className="px-5 py-4"><Badge color={u.role === 'admin' || u.role === 'superadmin' ? 'blue' : 'gray'}>{u.role.toUpperCase()}</Badge></td>
                    <td className="px-5 py-4 text-slate-600 text-xs">{u.operator_name || '—'}</td>
                    <td className="px-5 py-4"><Badge color={u.is_active ? 'green' : 'red'}>{u.is_active ? 'ใช้งาน' : 'ระงับ'}</Badge></td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <Button variant="text" onClick={() => openModal(u)}>แก้ไข</Button>
                      <Button variant="danger" onClick={() => handleDelete(u.id)}>ลบ</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal title={editData ? 'แก้ไขบัญชีผู้ใช้' : 'สร้างบัญชีผู้ใช้'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="รหัสประจำตัว (Login ID) *" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required />
          <Input label="ชื่อผู้ใช้งาน *" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label={editData ? 'รหัสผ่านใหม่ (เว้นว่างได้)' : 'รหัสผ่าน *'} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required={!editData} />
          <Input as="select" label="สิทธิ์ (Role) *" value={role} onChange={(e) => setRole(e.target.value)}>
            {roleOptions.map((r) => <option key={r} value={r}>{r.toUpperCase()}</option>)}
          </Input>
          <Input as="select" label="ผูกกับ Profile พนักงาน (ถ้ามี)" value={operatorId} onChange={(e) => setOperatorId(e.target.value)}>
            <option value="">— ไม่ผูก —</option>
            {operators.map((op) => <option key={op.id} value={op.id}>{op.name}</option>)}
          </Input>
          <Input as="select" label="สถานะการใช้งาน" value={String(isActive)} onChange={(e) => setIsActive(e.target.value === 'true')}>
            <option value="true">ใช้งาน</option><option value="false">ระงับบัญชี</option>
          </Input>
          <Button type="submit" className="w-full mt-2">{editData ? 'บันทึกข้อมูล' : 'สร้างบัญชี'}</Button>
        </form>
        <SaveMsg msg={msg} />
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Layout (Responsive Sidebar & Bottom Nav)
// ─────────────────────────────────────────────────────────────────────────────
export default function ManagementPage() {
  const { user } = useAuth();
  const [lines, setLines] = useState([]);
  const [activeMenu, setActiveMenu] = useState('lines');

  const loadLines = () => { getLines().then(setLines).catch(console.error); };
  useEffect(() => { loadLines(); }, []);

  const MENUS = [
    { id: 'lines', label: 'สายการผลิต', icon: <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
    { id: 'trays', label: 'ถาดงาน', icon: <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
    { id: 'operators', label: 'พนักงาน', icon: <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { id: 'users', label: 'ผู้ใช้ระบบ', icon: <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1118.88 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ];

  return (
    // เว้นระยะด้านล่าง (pb-20) สำหรับมือถือ เผื่อเนื้อหาโดน Bottom Nav ทับ
    <div className="min-h-screen flex bg-slate-50 font-sans pb-20 md:pb-0">

      {/* ── Sidebar (Fixed on Left for Desktop) ── */}
      <aside className="w-64 bg-white border-r border-slate-200 shrink-0 hidden md:flex flex-col h-[calc(100vh-64px)] sticky top-16">
        <div className="p-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">การตั้งค่า</h1>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {MENUS.map(m => (
            <button
              key={m.id}
              onClick={() => setActiveMenu(m.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                activeMenu === m.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className={activeMenu === m.id ? 'text-white' : 'text-slate-400'}>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 max-w-6xl w-full mx-auto">
        {activeMenu === 'lines' && <LinesView lines={lines} onRefresh={loadLines} />}
        {activeMenu === 'trays' && <TraysView lines={lines} />}
        {activeMenu === 'operators' && <OperatorsView />}
        {activeMenu === 'users' && <UsersView currentRole={user?.role || 'admin'} />}
      </main>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 z-40 pb-safe">
        {MENUS.map(m => (
          <button
            key={m.id}
            onClick={() => setActiveMenu(m.id)}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              activeMenu === m.id ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className={activeMenu === m.id ? 'text-slate-900' : 'text-slate-400'}>{m.icon}</span>
            <span className="text-[10px] font-bold">{m.label.split(' ')[0]}</span>
          </button>
        ))}
      </nav>

    </div>
  );
}
