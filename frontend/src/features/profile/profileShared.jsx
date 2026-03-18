export const ROLE_LABELS = {
  operator: "พนักงาน",
  viewer: "ดูรายงาน",
  admin: "แอดมิน",
  superadmin: "ซูเปอร์แอดมิน",
};

export const ROLE_BADGE_COLORS = {
  operator: "bg-success-500/20 text-success-400 border-success-500/30",
  viewer: "bg-info-500/20 text-info-400 border-info-500/30",
  admin: "bg-warning-500/20 text-warning-400 border-warning-500/30",
  superadmin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

function ProfileIdIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
      />
    </svg>
  );
}

function ProfileUserIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function ProfileRoleIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function ProfileOperatorIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

function ProfileDepartmentIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  );
}

function ProfileTimeIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ProfileCreatedIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

export function formatProfileDate(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function buildProfileInfoItems(user) {
  const items = [
    {
      icon: <ProfileIdIcon />,
      label: "รหัสพนักงาน",
      value: user.employee_id,
    },
    {
      icon: <ProfileUserIcon />,
      label: "ชื่อผู้ใช้",
      value: user.name,
    },
    {
      icon: <ProfileRoleIcon />,
      label: "สิทธิ์",
      value: (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${ROLE_BADGE_COLORS[user.role] || "bg-neutral-500/20 text-neutral-400 border-neutral-500/30"}`}
        >
          {ROLE_LABELS[user.role] || user.role}
        </span>
      ),
    },
  ];

  if (user.operator_name) {
    items.push({
      icon: <ProfileOperatorIcon />,
      label: "ชื่อพนักงาน",
      value: user.operator_name,
    });
  }

  if (user.operator_department) {
    items.push({
      icon: <ProfileDepartmentIcon />,
      label: "แผนก",
      value: user.operator_department,
    });
  }

  if (user.last_login_at) {
    items.push({
      icon: <ProfileTimeIcon />,
      label: "เข้าใช้ล่าสุด",
      value: formatProfileDate(user.last_login_at),
    });
  }

  if (user.created_at) {
    items.push({
      icon: <ProfileCreatedIcon />,
      label: "สร้างบัญชี",
      value: formatProfileDate(user.created_at),
    });
  }

  return items;
}
