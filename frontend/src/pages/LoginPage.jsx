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
    <main className="min-h-screen bg-gray-100 px-4 pt-6 pb-10 sm:px-6 sm:pt-10 lg:px-8 lg:pt-14">
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm lg:grid lg:grid-cols-[1.05fr_1fr]">
        <section className="bg-gray-900 px-6 py-7 text-white sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="text-sm uppercase tracking-[0.3em] text-blue-300 mb-2">VS MES</div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Sign In</h1>
        </section>

        <section className="px-6 py-7 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              รหัสพนักงาน
              <input
                className="border border-gray-300 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="เช่น EMP-001"
                autoComplete="username"
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              รหัสผ่าน
              <input
                type="password"
                className="border border-gray-300 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน"
                autoComplete="current-password"
                required
              />
            </label>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-2xl py-3.5 font-bold transition-colors"
            >
              {submitting ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
