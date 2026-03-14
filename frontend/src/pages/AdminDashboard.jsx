import { useEffect, useState } from 'react';
import {
  getLines,
  createLine, updateLine, deleteLine,
  getProcesses, createProcess, updateProcess, deleteProcess,
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
        setMsg('✅ อัปเดตสำเร็จ');
      } else {
        await createLine({ name, description: desc });
        setMsg('✅ เพิ่มสำเร็จ');
      }
      setName(''); setDesc(''); setEditId(null);
      onRefresh();
    } catch (err) {
      setMsg('❌ ' + err.message);
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
    <Section title="🏭 จัดการสายการผลิต (Production Lines)">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-5">
        <Input label="ชื่อสายการผลิต *" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="รายละเอียด"       value={desc} onChange={(e) => setDesc(e.target.value)} />
        {msg && <p className="text-sm">{msg}</p>}
        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 text-white rounded-xl px-5 py-2 font-semibold hover:bg-blue-700">
            {editId ? 'บันทึก' : '➕ เพิ่ม'}
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
        setMsg('✅ อัปเดตสำเร็จ');
      } else {
        await createProcess({ line_id: Number(lineId), name, sequence: Number(seq), description: desc });
        setMsg('✅ เพิ่มสำเร็จ');
      }
      setName(''); setSeq(''); setDesc(''); setEditId(null);
      loadProcs(lineId);
    } catch (err) {
      setMsg('❌ ' + err.message);
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
    <Section title="⚙️ จัดการขั้นตอน (Processes)">
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
                {editId ? 'บันทึก' : '➕ เพิ่ม'}
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
    <main className="min-h-screen bg-gray-100 p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6">🛠 Admin Dashboard</h1>
      {loading ? (
        <p className="text-gray-400 animate-pulse text-center">กำลังโหลด…</p>
      ) : (
        <>
          <LinesPanel lines={lines} onRefresh={loadLines} />
          <ProcessesPanel lines={lines} />
        </>
      )}
    </main>
  );
}
