import { useEffect, useState } from 'react';
import { getLogsSummary } from '../api/client';
import StatusBadge from '../components/StatusBadge';

const TRAY_STATUS_COLORS = {
  pending:     'bg-gray-100 text-gray-600',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed:   'bg-green-100  text-green-700',
  on_hold:     'bg-red-100    text-red-700',
};

export default function ReportPage() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [search,  setSearch]  = useState('');

  const load = () => {
    setLoading(true);
    getLogsSummary()
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = rows.filter(
    (r) =>
      r.qr_code.toLowerCase().includes(search.toLowerCase()) ||
      (r.product || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.line_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-gray-100 p-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-3xl font-bold">รายงานการผลิต</h1>
        <div className="flex gap-2">
          <input
            type="search"
            placeholder="ค้นหา QR / สินค้า / สาย…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-56"
          />
          <button
            onClick={load}
            className="bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-blue-700"
          >
            รีเฟรช
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-400 animate-pulse text-center">กำลังโหลด…</p>}
      {error   && <p className="text-red-500 text-center">{error}</p>}

      {!loading && !error && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b bg-gray-50">
                <th className="px-4 py-3">QR Code</th>
                <th className="px-4 py-3">สินค้า</th>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3">สาย</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3 text-center">เสร็จ</th>
                <th className="px-4 py-3 text-center">NG</th>
                <th className="px-4 py-3">กิจกรรมล่าสุด</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">
                    ไม่พบข้อมูล
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={r.tray_id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-semibold">{r.qr_code}</td>
                  <td className="px-4 py-3">{r.product ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{r.batch_no ?? '—'}</td>
                  <td className="px-4 py-3">{r.line_name ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs rounded-full px-3 py-0.5 font-semibold ${TRAY_STATUS_COLORS[r.status] ?? ''}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-green-600">
                    {r.finished_processes ?? 0}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-red-600">
                    {r.ng_count ?? 0}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {r.last_activity
                      ? new Date(r.last_activity).toLocaleString('th-TH')
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
