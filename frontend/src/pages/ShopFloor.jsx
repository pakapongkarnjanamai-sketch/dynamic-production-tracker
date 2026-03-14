import { useEffect, useState } from 'react';
import { getLines } from '../api/client';
import { useNavigate } from 'react-router-dom';

export default function ShopFloor() {
  const [lines,   setLines]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getLines()
      .then(setLines)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const activeLines = lines.filter((l) => l.is_active);

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-6">

        {/* ── Hero Section ── */}
        <div className="bg-white rounded-[2rem] p-8 sm:p-12 shadow-sm border border-gray-200 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-blue-50 opacity-50 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-green-50 opacity-50 pointer-events-none"></div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-3 relative z-10">
            ยินดีต้อนรับสู่พื้นที่ปฏิบัติงาน
          </h1>
          <p className="text-gray-500 text-base sm:text-lg mb-8 relative z-10">
            เลือกระบบสแกน QR Code เพื่อเริ่มต้นบันทึกการทำงานของคุณ
          </p>

          <button
            onClick={() => navigate('/scan')}
            className="relative z-10 group inline-flex items-center justify-center px-8 py-5 sm:px-12 sm:py-6 text-xl sm:text-2xl font-bold text-white transition-all duration-200 bg-blue-600 rounded-3xl hover:bg-blue-700 active:scale-95 shadow-xl shadow-blue-200"
          >
            <svg className="w-8 h-8 sm:w-10 sm:h-10 mr-3 group-hover:scale-110 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            เข้าสู่โหมดสแกนทำงาน
          </button>
        </div>

        {/* ── Status Section ── */}
        <div>
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              ภาพรวมสายการผลิต ({activeLines.length})
            </h2>
          </div>

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white h-28 rounded-3xl border border-gray-100 shadow-sm animate-pulse"></div>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-3xl text-center">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeLines.length === 0 ? (
                <div className="col-span-full text-center py-10 bg-white rounded-3xl border border-gray-200 text-gray-400">
                  ไม่พบสายการผลิตที่เปิดใช้งาน
                </div>
              ) : (
                activeLines.map((line) => (
                  <div
                    key={line.id}
                    className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>

                    <div className="flex justify-between items-start mb-2 pl-2">
                      <p className="text-lg font-bold text-gray-800 group-hover:text-blue-700 transition-colors">
                        {line.name}
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-1 font-bold">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Active
                      </span>
                    </div>
                    <div className="pl-2">
                      {line.description ? (
                        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{line.description}</p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">ไม่มีรายละเอียด</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
