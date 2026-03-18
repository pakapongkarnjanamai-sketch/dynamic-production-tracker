import { useMemo } from "react";
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
import { STATUS_COLORS, STATUS_LABELS } from "./trayShared";

export default function TrayListView({
  trays,
  loading,
  error,
  search,
  onSearchChange,
  onCreate,
  onEdit,
  onRefresh,
  onOpenQr,
}) {
  const filteredTrays = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return trays;
    }

    return trays.filter((tray) => {
      return [tray.qr_code, tray.product, tray.batch_no, tray.line_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [search, trays]);

  return (
    <AdminSection
      action={
        <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
          <div className="min-w-0 flex-1">
            <Input
              placeholder="ค้นหา QR Code, ชื่อสินค้า, batch หรือสายการผลิต"
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
      {loading ? <LoadingState message="กำลังโหลดข้อมูลงาน..." /> : null}
      {!loading && error ? (
        <ErrorState message={error} onRetry={onRefresh} />
      ) : null}
      {!loading && !error && filteredTrays.length === 0 ? (
        <EmptyState
          title={trays.length === 0 ? "ยังไม่มีงาน" : "ไม่พบงานที่ค้นหา"}
          description={
            trays.length === 0
              ? "สร้างงานเพื่อเริ่มต้นการสแกนและติดตามงานในหน้างาน"
              : "ลองเปลี่ยนคำค้น หรือสร้างงานใหม่เพิ่มเติม"
          }
          action={
            trays.length === 0 ? (
              <Button onClick={onCreate}>สร้างงานแรก</Button>
            ) : null
          }
        />
      ) : null}

      {!loading && !error && filteredTrays.length > 0 ? (
        <>
          <Stack className="md:hidden">
            {filteredTrays.map((tray) => (
              <MobileCard
                key={tray.id}
                className="border-2 border-neutral-200 transition-all hover:border-info-200"
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => onEdit(tray.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-mono text-base font-black text-neutral-900 sm:text-lg">
                        {tray.qr_code}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-neutral-700">
                        {tray.product || "ไม่มีชื่อสินค้า"}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {tray.line_name || "ไม่ระบุสายการผลิต"}
                        {tray.batch_no ? ` • Batch: ${tray.batch_no}` : ""}
                      </p>
                    </div>
                    <Badge color={STATUS_COLORS[tray.status]}>
                      {STATUS_LABELS[tray.status]}
                    </Badge>
                  </div>
                </button>
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="secondary"
                    size="compact"
                    onClick={() => onOpenQr(tray)}
                  >
                    QR
                  </Button>
                </div>
              </MobileCard>
            ))}
          </Stack>

          <DataTable
            columns={[
              { key: "qr", label: "QR Code" },
              { key: "product", label: "สินค้า / Batch" },
              { key: "line", label: "สายการผลิต" },
              { key: "status", label: "สถานะ" },
              { key: "actions", label: "QR", className: "w-[96px]" },
            ]}
          >
            {filteredTrays.map((tray) => (
              <tr
                key={tray.id}
                className="cursor-pointer hover:bg-neutral-50/80"
                onClick={() => onEdit(tray.id)}
              >
                <td className="px-5 py-4 font-mono font-bold text-neutral-900">
                  {tray.qr_code}
                </td>
                <td className="px-5 py-4">
                  <div className="font-medium text-neutral-900">
                    {tray.product || "—"}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {tray.batch_no ? `Batch: ${tray.batch_no}` : ""}
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-neutral-500">
                  {tray.line_name || "—"}
                </td>
                <td className="px-5 py-4">
                  <Badge color={STATUS_COLORS[tray.status]}>
                    {STATUS_LABELS[tray.status]}
                  </Badge>
                </td>
                <td className="px-5 py-4">
                  <Button
                    variant="secondary"
                    size="compact"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenQr(tray);
                    }}
                  >
                    QR
                  </Button>
                </td>
              </tr>
            ))}
          </DataTable>
        </>
      ) : null}
    </AdminSection>
  );
}
