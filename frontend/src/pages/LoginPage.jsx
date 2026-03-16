import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDefaultRouteForRole, useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, loading } = useAuth();

  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) {
      navigate(location.state?.from || getDefaultRouteForRole(user.role), { replace: true });
    }
  }, [loading, user, navigate, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const nextUser = await login(employeeId, password);
      navigate(location.state?.from || getDefaultRouteForRole(nextUser.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-4 pt-6 pb-24 sm:px-6 sm:pt-10 md:pb-10 lg:px-8 lg:pt-14">
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm lg:grid lg:grid-cols-[1.05fr_1fr]">
        <section className="bg-slate-900 px-6 py-7 text-white sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">VS MES</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Sign In</h1>
          <p className="mt-3 text-sm text-slate-400">เข้าสู่ระบบเพื่อจัดการสายการผลิต</p>
        </section>

        <section className="px-6 py-7 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              รหัสพนักงาน
              <input
                className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="เช่น EMP-001"
                autoComplete="username"
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              รหัสผ่าน
              <input
                type="password"
                className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน"
                autoComplete="current-password"
                required
              />
            </label>

            {error && (
              <div className="rounded-2xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 active:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
