import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const roleLabelMap = {
  operator: 'พนักงาน (Operator)',
  viewer: 'ผู้ดูรายงาน (Viewer)',
  admin: 'แอดมิน (Admin)',
  superadmin: 'ซุปเปอร์แอดมิน (Super Admin)',
};

const roleBadgeColor = {
  operator:   'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  viewer:     'bg-sky-500/20 text-sky-400 border-sky-500/30',
  admin:      'bg-amber-500/20 text-amber-400 border-amber-500/30',
  superadmin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function UserProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const infoItems = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
        </svg>
      ),
      label: 'รหัสพนักงาน',
      value: user.employee_id,
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      label: 'ชื่อผู้ใช้',
      value: user.name,
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      label: 'สิทธิ์การใช้งาน',
      value: (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${roleBadgeColor[user.role] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
          {roleLabelMap[user.role] || user.role}
        </span>
      ),
    },
  ];

  // เพิ่ม operator info ถ้ามี
  if (user.operator_name) {
    infoItems.push({
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      label: 'ชื่อ Operator',
      value: user.operator_name,
    });
  }

  if (user.operator_department) {
    infoItems.push({
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      label: 'แผนก',
      value: user.operator_department,
    });
  }

  if (user.last_login_at) {
    infoItems.push({
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'เข้าสู่ระบบล่าสุด',
      value: formatDate(user.last_login_at),
    });
  }

  if (user.created_at) {
    infoItems.push({
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: 'วันที่สร้างบัญชี',
      value: formatDate(user.created_at),
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pb-24 md:pb-8 pt-4 px-4">
      <div className="max-w-lg mx-auto">

        {/* ── Header Card ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 mb-6 shadow-2xl shadow-blue-900/30">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />

          <div className="relative flex flex-col items-center text-center gap-3">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center shadow-lg">
              <span className="text-3xl font-black text-white select-none">
                {(user.name || '?').charAt(0).toUpperCase()}
              </span>
            </div>

            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">{user.name}</h1>
              <p className="text-blue-200 text-sm mt-0.5">{user.employee_id}</p>
            </div>

            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${roleBadgeColor[user.role] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
              {roleLabelMap[user.role] || user.role}
            </span>
          </div>
        </div>

        {/* ── Info Card ── */}
        <div className="rounded-2xl bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 shadow-xl overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-700/50">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ข้อมูลบัญชี
            </h2>
          </div>

          <div className="divide-y divide-gray-700/40">
            {infoItems.map((item, idx) => (
              <div key={idx} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-700/30 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-700/60 flex items-center justify-center text-blue-400">
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 font-medium mb-0.5">{item.label}</p>
                  <div className="text-sm text-gray-200 font-medium break-all">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Logout Button ── */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-red-600/20 border border-red-500/30 text-red-400 font-semibold text-sm hover:bg-red-600/30 hover:border-red-500/50 hover:text-red-300 active:scale-[0.98] transition-all shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H9m4 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
          </svg>
          ออกจากระบบ
        </button>

      </div>
    </div>
  );
}
