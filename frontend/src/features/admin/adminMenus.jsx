function FactoryIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4"
      />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5.121 17.804A9 9 0 1 1 18.88 17.8M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
      />
    </svg>
  );
}

export const ADMIN_MENUS = [
  {
    id: "lines",
    label: "สายการผลิต",
    shortLabel: "ไลน์",
    icon: <FactoryIcon />,
  },
  {
    id: "trays",
    label: "งาน",
    shortLabel: "งาน",
    icon: <BoxIcon />,
  },
  {
    id: "users",
    label: "ผู้ใช้ระบบ",
    shortLabel: "บัญชี",
    icon: <AccountIcon />,
  },
];
