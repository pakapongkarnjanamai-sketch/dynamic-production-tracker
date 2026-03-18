import {
  AdminSection,
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  MobileCard,
  Stack,
} from "../AdminUI";

export default function LineListView({
  lines,
  loading,
  error,
  search,
  onSearchChange,
  onCreate,
  onEdit,
  onRefresh,
}) {
  const keyword = search.trim().toLowerCase();
  const filteredLines = lines.filter((line) => {
    if (!keyword) {
      return true;
    }

    return [line.name, line.description]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  });

  return (
    <AdminSection
      action={
        <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
          <div className="min-w-0 flex-1">
            <Input
              placeholder="ค้นหาชื่อสายการผลิตหรือรายละเอียด"
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
      {loading ? <LoadingState message="กำลังโหลดข้อมูลสายการผลิต..." /> : null}
      {!loading && error ? (
        <ErrorState message={error} onRetry={onRefresh} />
      ) : null}
      {!loading && !error && filteredLines.length === 0 ? (
        <EmptyState
          title={
            lines.length === 0
              ? "ยังไม่มีสายการผลิต"
              : "ไม่พบสายการผลิตที่ค้นหา"
          }
          description={
            lines.length === 0
              ? "สร้างสายการผลิตก่อน เพื่อกำหนด process ให้กับงานแต่ละรายการ"
              : "ลองเปลี่ยนคำค้น หรือเพิ่มสายการผลิตใหม่"
          }
          action={
            lines.length === 0 ? (
              <Button onClick={onCreate}>เพิ่มสายการผลิตแรก</Button>
            ) : null
          }
        />
      ) : null}

      {!loading && !error && filteredLines.length > 0 ? (
        <>
          <Stack className="md:hidden">
            {filteredLines.map((line) => (
              <MobileCard
                key={line.id}
                className="border-2 border-neutral-200 transition-all hover:border-info-200"
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => onEdit(line.id)}
                >
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-neutral-900 sm:text-lg">
                      {line.name}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-500">
                      {line.description || "ไม่มีรายละเอียด"}
                    </p>
                  </div>
                </button>
              </MobileCard>
            ))}
          </Stack>

          <DataTable
            columns={[
              { key: "name", label: "ชื่อสายการผลิต" },
              { key: "description", label: "รายละเอียด" },
            ]}
          >
            {filteredLines.map((line) => (
              <tr
                key={line.id}
                className="cursor-pointer hover:bg-neutral-50/80"
                onClick={() => onEdit(line.id)}
              >
                <td className="px-5 py-4 font-semibold text-neutral-900">
                  {line.name}
                </td>
                <td className="px-5 py-4 text-neutral-500">
                  {line.description || "—"}
                </td>
              </tr>
            ))}
          </DataTable>
        </>
      ) : null}
    </AdminSection>
  );
}
