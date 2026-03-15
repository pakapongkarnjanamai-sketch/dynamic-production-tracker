import { useEffect, useMemo, useState } from 'react';
import { getLines } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import AdminShell from '../components/admin/AdminShell';
import LinesSection from '../components/admin/LinesSection';
import OperatorsSection from '../components/admin/OperatorsSection';
import TraysSection from '../components/admin/TraysSection';
import UsersSection from '../components/admin/UsersSection';

function FactoryIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
      />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5.121 17.804A9 9 0 1 1 18.88 17.8M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
      />
    </svg>
  );
}

export default function ManagementPage() {
  const { user } = useAuth();
  const [lines, setLines] = useState([]);
  const [linesLoading, setLinesLoading] = useState(true);
  const [linesError, setLinesError] = useState('');
  const [activeMenu, setActiveMenu] = useState('lines');

  const menus = useMemo(
    () => [
      { id: 'lines', label: 'สายการผลิต', shortLabel: 'ไลน์', icon: <FactoryIcon /> },
      { id: 'trays', label: 'งาน', shortLabel: 'งาน', icon: <BoxIcon /> },
      { id: 'operators', label: 'พนักงาน', shortLabel: 'ทีม', icon: <UsersIcon /> },
      { id: 'users', label: 'ผู้ใช้ระบบ', shortLabel: 'บัญชี', icon: <AccountIcon /> },
    ],
    [],
  );

  const loadLines = async () => {
    try {
      setLinesError('');
      setLinesLoading(true);
      const data = await getLines();
      setLines(data);
    } catch (err) {
      setLinesError(err.message || 'โหลดข้อมูลสายการผลิตไม่สำเร็จ');
    } finally {
      setLinesLoading(false);
    }
  };

  useEffect(() => {
    loadLines();
  }, []);

  let currentSection;

  switch (activeMenu) {
    case 'trays':
      currentSection = <TraysSection lines={lines} />;
      break;
    case 'operators':
      currentSection = <OperatorsSection />;
      break;
    case 'users':
      currentSection = <UsersSection currentRole={user?.role || 'admin'} />;
      break;
    case 'lines':
    default:
      currentSection = (
        <LinesSection
          lines={lines}
          loading={linesLoading}
          error={linesError}
          onRefresh={loadLines}
        />
      );
      break;
  }

  return (
    <AdminShell
      title="จัดการข้อมูลระบบ"
      description="ดูแลสายการผลิต งาน พนักงาน และสิทธิ์ผู้ใช้งานในมุมมองเดียวที่ออกแบบให้ใช้งานบนมือถือได้ดีขึ้น"
      menus={menus}
      activeMenu={activeMenu}
      onMenuChange={setActiveMenu}
    >
      {currentSection}
    </AdminShell>
  );
}
