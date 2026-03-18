import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getDefaultRouteForRole, useAuth } from "../auth/AuthContext";

function formatRetryAfterSeconds(seconds) {
  const totalSeconds = Number(seconds);
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return "อีกสักครู่";
  }

  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  if (minutes <= 0) {
    return `${remainingSeconds} วินาที`;
  }

  if (remainingSeconds === 0) {
    return `${minutes} นาที`;
  }

  return `${minutes} นาที ${remainingSeconds} วินาที`;
}

function getLoginErrorMessage(error) {
  if (error?.status === 429) {
    const waitTime = formatRetryAfterSeconds(error.retryAfterSeconds);
    return `พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอ ${waitTime} แล้วลองใหม่อีกครั้ง`;
  }

  return error?.message || "เข้าสู่ระบบไม่สำเร็จ";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, loading } = useAuth();

  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      navigate(location.state?.from || getDefaultRouteForRole(user.role), {
        replace: true,
      });
    }
  }, [loading, user, navigate, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const nextUser = await login(employeeId, password);
      navigate(location.state?.from || getDefaultRouteForRole(nextUser.role), {
        replace: true,
      });
    } catch (err) {
      setError(getLoginErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-3 pt-3 pb-24 sm:px-6 sm:pt-10 md:pb-10 lg:px-8 lg:pt-14">
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-[22px] border border-neutral-200 bg-white shadow-sm sm:rounded-[28px] lg:grid lg:grid-cols-[1.05fr_1fr]">
        <section className="bg-neutral-900 px-4 py-4 text-white sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <p className="text-sm font-semibold text-neutral-400">VS MES</p>
          <h1 className="mt-1.5 text-xl font-black tracking-tight sm:mt-2 sm:text-4xl">
            เข้าสู่ระบบ
          </h1>
        </section>

        <section className="px-4 py-4 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-neutral-700 sm:gap-2">
              รหัสพนักงาน
              <input
                className="min-h-12 rounded-2xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-500/10 sm:px-4 sm:py-3 sm:text-sm"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="เช่น EMP-001"
                autoComplete="username"
                required
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-neutral-700 sm:gap-2">
              รหัสผ่าน
              <input
                type="password"
                className="min-h-12 rounded-2xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-500/10 sm:px-4 sm:py-3 sm:text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน"
                autoComplete="current-password"
                required
              />
            </label>

            {error && (
              <div className="rounded-2xl bg-danger-100 px-4 py-3 text-sm font-semibold text-danger-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center rounded-xl border border-primary-700 bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 active:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:py-3.5"
            >
              {submitting ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
