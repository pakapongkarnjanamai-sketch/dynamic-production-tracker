import { useEffect, useState } from 'react';
import { getLines } from '../api/client';
import { Link } from 'react-router-dom';

export default function ShopFloor() {
  const [lines,   setLines]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    getLines()
      .then(setLines)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-2">🏭 หน้างาน Shop Floor</h1>
      <p className="text-center text-gray-500 text-sm mb-6">
        เลือกสายการผลิต หรือสแกน QR Code เพื่อเริ่มงาน
      </p>

      <div className="flex justify-center mb-8">
        <Link
          to="/scan"
          className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-2xl font-bold rounded-2xl px-10 py-5 shadow-lg"
        >
          📷 สแกน QR Code
        </Link>
      </div>

      <h2 className="text-xl font-semibold mb-3 text-gray-700">สายการผลิต</h2>

      {loading && <p className="text-gray-400 animate-pulse">กำลังโหลด…</p>}
      {error   && <p className="text-red-500">⚠️ {error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {lines
          .filter((l) => l.is_active)
          .map((line) => (
            <div
              key={line.id}
              className="bg-white rounded-2xl border shadow-sm p-5"
            >
              <p className="text-lg font-bold text-gray-800">{line.name}</p>
              {line.description && (
                <p className="text-sm text-gray-500 mt-1">{line.description}</p>
              )}
              <span className="inline-block mt-3 text-xs bg-green-100 text-green-700 rounded-full px-3 py-0.5 font-medium">
                ✅ Active
              </span>
            </div>
          ))}
      </div>
    </main>
  );
}
