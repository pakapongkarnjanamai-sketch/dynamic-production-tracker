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

export default function OperatorListView({
  operators,
  loading,
  error,
  search,
  onSearchChange,
  onCreate,
  onEdit,
  onRefresh,
}) {
  const keyword = search.trim().toLowerCase();
  const filteredOperators = operators.filter((operator) => {
    if (!keyword) {
      return true;
    }

    return [operator.name, operator.employee_id, operator.department]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  });

  return (
    <AdminSection
      action={
        <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
          <div className="min-w-0 flex-1">
            <Input
              placeholder="ค้นหาชื่อ รหัส หรือแผนก"
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
      {loading ? <LoadingState message="กำลังโหลดข้อมูลพนักงาน..." /> : null}
      {!loading && error ? (
        <ErrorState message={error} onRetry={onRefresh} />
      ) : null}
      {!loading && !error && filteredOperators.length === 0 ? (
        <EmptyState
          title={
            operators.length === 0
              ? "ยังไม่มีข้อมูลพนักงาน"
              : "ไม่พบพนักงานที่ค้นหา"
          }
          description={
            operators.length === 0
              ? "เริ่มต้นด้วยการสร้างรายชื่อพนักงานเพื่อใช้ในสายการผลิต"
              : "ลองเปลี่ยนคำค้น หรือเพิ่มพนักงานใหม่"
          }
          action={
            operators.length === 0 ? (
              <Button onClick={onCreate}>เพิ่มพนักงานคนแรก</Button>
            ) : null
          }
        />
      ) : null}

      {!loading && !error && filteredOperators.length > 0 ? (
        <>
          <Stack className="md:hidden">
            {filteredOperators.map((operator) => (
              <MobileCard
                key={operator.id}
                className="border-2 border-neutral-200 transition-all hover:border-info-200"
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => onEdit(operator.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-neutral-900 sm:text-lg">
                        {operator.name}
                      </h3>
                      <p className="mt-1 text-sm text-neutral-500">
                        {operator.employee_id || "ไม่มีรหัสพนักงาน"}
                        {" • "}
                        {operator.department || "ไม่ระบุแผนก"}
                      </p>
                    </div>
                    <Badge color={operator.is_active ? "green" : "gray"}>
                      {operator.is_active ? "ใช้งาน" : "ระงับ"}
                    </Badge>
                  </div>
                </button>
              </MobileCard>
            ))}
          </Stack>

          <DataTable
            columns={[
              { key: "name", label: "ชื่อพนักงาน" },
              { key: "meta", label: "รหัส / แผนก" },
              { key: "status", label: "สถานะ" },
            ]}
          >
            {filteredOperators.map((operator) => (
              <tr
                key={operator.id}
                className="cursor-pointer hover:bg-neutral-50/80"
                onClick={() => onEdit(operator.id)}
              >
                <td className="px-5 py-4 font-semibold text-neutral-900">
                  {operator.name}
                </td>
                <td className="px-5 py-4">
                  <div className="font-mono text-xs text-neutral-600">
                    {operator.employee_id || "—"}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {operator.department || "—"}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <Badge color={operator.is_active ? "green" : "gray"}>
                    {operator.is_active ? "ใช้งาน" : "ระงับ"}
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
