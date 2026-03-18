import {
  AdminSection,
  Badge,
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  MobileCard,
  Stack,
} from "../AdminUI";
import { getUserRoleBadgeColor } from "./userShared";

export default function UserListView({
  users,
  loading,
  error,
  search,
  onSearchChange,
  onCreate,
  onEdit,
  onRefresh,
}) {
  const keyword = search.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    if (!keyword) {
      return true;
    }

    return [user.name, user.employee_id, user.role, user.operator_name]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  });

  return (
    <AdminSection
      action={
        <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
          <div className="min-w-0 flex-1">
            <Input
              placeholder="ค้นหาชื่อ รหัส บทบาท หรือ operator"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
          <Button
            className="w-full shrink-0 whitespace-nowrap sm:w-auto"
            onClick={onCreate}
          >
            + เพิ่ม
          </Button>
        </div>
      }
    >
      {loading ? (
        <LoadingState message="กำลังโหลดข้อมูลบัญชีผู้ใช้..." />
      ) : null}
      {!loading && error ? (
        <ErrorState message={error} onRetry={onRefresh} />
      ) : null}
      {!loading && !error && filteredUsers.length === 0 ? (
        <EmptyState
          title={
            users.length === 0 ? "ยังไม่มีบัญชีผู้ใช้" : "ไม่พบบัญชีที่ค้นหา"
          }
          description={
            users.length === 0
              ? "สร้างบัญชีเพื่อกำหนดสิทธิ์และผูกกับข้อมูลพนักงานในระบบ"
              : "ลองเปลี่ยนคำค้น หรือสร้างบัญชีใหม่"
          }
          action={
            users.length === 0 ? (
              <Button onClick={onCreate}>สร้างบัญชีแรก</Button>
            ) : null
          }
        />
      ) : null}

      {!loading && !error && filteredUsers.length > 0 ? (
        <>
          <Stack className="md:hidden">
            {filteredUsers.map((user) => (
              <MobileCard
                key={user.id}
                className="border-2 border-neutral-200 transition-all hover:border-info-200"
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => onEdit(user.id)}
                >
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-neutral-900 sm:text-lg">
                          {user.name}
                        </h3>
                        <p className="mt-1 font-mono text-sm text-neutral-500">
                          {user.employee_id}
                        </p>
                        <p className="mt-1 text-xs text-neutral-400">
                          ผูกกับ: {user.operator_name || "ไม่ผูกข้อมูล"}
                        </p>
                      </div>
                      <Badge color={getUserRoleBadgeColor(user.role)}>
                        {user.role.toUpperCase()}
                      </Badge>
                    </div>
                    {!user.is_active ? (
                      <Badge color="red" className="mt-2">
                        ระงับการใช้งาน
                      </Badge>
                    ) : null}
                  </div>
                </button>
              </MobileCard>
            ))}
          </Stack>

          <DataTable
            columns={[
              { key: "identity", label: "ชื่อ / รหัส" },
              { key: "role", label: "สิทธิ์" },
              { key: "operator", label: "ผูกกับ Operator" },
              { key: "status", label: "สถานะ" },
            ]}
          >
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="cursor-pointer hover:bg-neutral-50/80"
                onClick={() => onEdit(user.id)}
              >
                <td className="px-5 py-4">
                  <div className="font-semibold text-neutral-900">
                    {user.name}
                  </div>
                  <div className="mt-1 font-mono text-xs text-neutral-500">
                    {user.employee_id}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <Badge color={getUserRoleBadgeColor(user.role)}>
                    {user.role.toUpperCase()}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-sm text-neutral-500">
                  {user.operator_name || "—"}
                </td>
                <td className="px-5 py-4">
                  <Badge color={user.is_active ? "green" : "red"}>
                    {user.is_active ? "ใช้งาน" : "ระงับ"}
                  </Badge>
                </td>
              </tr>
            ))}
          </DataTable>
        </>
      ) : null}
    </AdminSection>
  );
}
