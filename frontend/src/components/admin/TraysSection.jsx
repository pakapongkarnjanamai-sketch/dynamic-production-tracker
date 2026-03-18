import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  createTray,
  deleteTray,
  getLogs,
  getTrays,
  updateTray,
} from "../../api/client";
import {
  AdminDetailHeader,
  AdminSection,
  Badge,
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  FormActions,
  Input,
  LoadingState,
  MobileCard,
  Modal,
  Stack,
} from "./AdminUI";

const TRAY_STATUSES = ["pending", "in_progress", "completed", "on_hold"];

const STATUS_LABELS = {
  pending: "รอทำ",
  in_progress: "กำลังทำ",
  completed: "เสร็จสิ้น",
  on_hold: "รอแก้ไข",
};

const STATUS_COLORS = {
  pending: "gray",
  in_progress: "amber",
  completed: "green",
  on_hold: "red",
};

const EMPTY_FORM = {
  qr_code: "",
  line_id: "",
  product: "",
  batch_no: "",
  qty: "1",
  status: "pending",
  due_date: "",
};

function buildTrayQrLabel(tray) {
  if (!tray) return "";
  return tray.product ? `${tray.qr_code} • ${tray.product}` : tray.qr_code;
}

function downloadQrImage(dataUrl, fileName) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}

function printQrImage(dataUrl, title) {
  const printWindow = window.open("", "_blank", "width=720,height=860");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            margin: 0;
            padding: 32px;
            font-family: "Noto Sans Thai", "Segoe UI", sans-serif;
            color: #0f172a;
          }
          .wrap {
            display: flex;
            min-height: calc(100vh - 64px);
            align-items: center;
            justify-content: center;
          }
          .card {
            width: 100%;
            max-width: 420px;
            border: 1px solid #e5e7eb;
            border-radius: 24px;
            padding: 24px;
            text-align: center;
          }
          img {
            width: 100%;
            max-width: 280px;
            height: auto;
          }
          h1 {
            margin: 0 0 16px;
            font-size: 20px;
          }
          p {
            margin: 12px 0 0;
            color: #475569;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="card">
            <h1>${title}</h1>
            <img src="${dataUrl}" alt="${title}" />
            <p>${title}</p>
          </div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function TrayQrModal({ tray, isOpen, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !tray?.qr_code) {
      setQrDataUrl("");
      setError("");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const generate = async () => {
      try {
        setLoading(true);
        setError("");
        const dataUrl = await QRCode.toDataURL(tray.qr_code, {
          width: 320,
          margin: 1,
          color: {
            dark: "#0f172a",
            light: "#ffffff",
          },
        });
        if (!cancelled) {
          setQrDataUrl(dataUrl);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "สร้างรูป QR ไม่สำเร็จ");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    generate();

    return () => {
      cancelled = true;
    };
  }, [isOpen, tray]);

  const fileName = `${tray?.qr_code || "tray"}.png`;
  const label = buildTrayQrLabel(tray);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="QR Code"
      description={tray?.qr_code || ""}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            ปิด
          </Button>
          <Button
            variant="secondary"
            onClick={() => printQrImage(qrDataUrl, label)}
            disabled={!qrDataUrl || loading}
          >
            พิมพ์
          </Button>
          <Button
            onClick={() => downloadQrImage(qrDataUrl, fileName)}
            disabled={!qrDataUrl || loading}
          >
            ดาวน์โหลด
          </Button>
        </div>
      }
    >
      {loading ? (
        <LoadingState message="กำลังสร้างรูป QR..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="space-y-4 text-center">
          <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={label}
                className="mx-auto w-full max-w-[280px] rounded-[16px] bg-white p-3"
              />
            ) : null}
          </div>
          <div>
            <div className="font-mono text-base font-black text-neutral-900">
              {tray?.qr_code}
            </div>
            <div className="mt-1 text-sm text-neutral-500">
              {tray?.product || "ไม่มีชื่อสินค้า"}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function TraysSection({
  lines,
  view = "",
  selectedId = "",
  onCreate,
  onEdit,
  onViewLogs,
  onBackFromLogs,
  onCloseDetail,
}) {
  const [trays, setTrays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [qrTray, setQrTray] = useState(null);
  const isAutoSaveReadyRef = useRef(false);

  const selectedTray =
    view === "edit" || view === "logs"
      ? trays.find((tray) => String(tray.id) === String(selectedId)) || null
      : null;

  const loadTrays = async () => {
    try {
      setError("");
      setLoading(true);
      const data = await getTrays();
      setTrays(data);
    } catch (err) {
      setError(err.message || "โหลดข้อมูลงานไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrays();
  }, []);

  useEffect(() => {
    if (view === "edit" && selectedTray) {
      isAutoSaveReadyRef.current = false;
      setForm({
        qr_code: selectedTray.qr_code,
        line_id: selectedTray.line_id ? String(selectedTray.line_id) : "",
        product: selectedTray.product || "",
        batch_no: selectedTray.batch_no || "",
        qty: String(selectedTray.qty || 1),
        status: selectedTray.status || "pending",
        due_date: selectedTray.due_date
          ? new Date(selectedTray.due_date).toISOString().slice(0, 16)
          : "",
      });
    } else if (view === "create") {
      isAutoSaveReadyRef.current = false;
      setForm(EMPTY_FORM);
    }

    setError("");
    setSubmitting(false);
  }, [selectedTray, view]);

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

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = {
      ...form,
      line_id: form.line_id ? Number(form.line_id) : null,
      qty: Number(form.qty) || 1,
      due_date: form.due_date || null,
    };

    try {
      await createTray(payload);

      await loadTrays();
      window.setTimeout(() => {
        onCloseDetail();
      }, 700);
    } catch (err) {
      setError(err.message || "บันทึกงานไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (view !== "edit" || !selectedTray) {
      return undefined;
    }

    if (!isAutoSaveReadyRef.current) {
      isAutoSaveReadyRef.current = true;
      return undefined;
    }

    const initialLineId = selectedTray.line_id
      ? String(selectedTray.line_id)
      : "";
    const initialProduct = selectedTray.product || "";
    const initialBatchNo = selectedTray.batch_no || "";
    const initialQty = String(selectedTray.qty || 1);
    const initialStatus = selectedTray.status || "pending";
    const initialDueDate = selectedTray.due_date
      ? new Date(selectedTray.due_date).toISOString().slice(0, 16)
      : "";
    const isUnchanged =
      form.line_id === initialLineId &&
      form.product === initialProduct &&
      form.batch_no === initialBatchNo &&
      form.qty === initialQty &&
      form.status === initialStatus &&
      form.due_date === initialDueDate;

    if (isUnchanged) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setSubmitting(true);
        await updateTray(selectedTray.id, {
          qr_code: selectedTray.qr_code,
          line_id: form.line_id ? Number(form.line_id) : null,
          product: form.product,
          batch_no: form.batch_no,
          qty: Number(form.qty) || 1,
          status: form.status,
          due_date: form.due_date || null,
        });
        await loadTrays();
      } catch (err) {
        setError(err.message || "บันทึกงานไม่สำเร็จ");
      } finally {
        setSubmitting(false);
      }
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [form, selectedTray, view]);

  const handleDelete = async () => {
    if (!selectedTray || !window.confirm("ยืนยันการลบงาน?")) {
      return;
    }

    try {
      await deleteTray(selectedTray.id);
      await loadTrays();
      onCloseDetail();
    } catch (err) {
      setError(err.message || "ลบงานไม่สำเร็จ");
    }
  };

  const openQrModal = (tray) => {
    setQrTray(tray);
  };

  const closeQrModal = () => {
    setQrTray(null);
  };

  if (view === "create" || view === "edit") {
    return (
      <>
        <Stack>
          <AdminDetailHeader
            title={view === "edit" ? "แก้ไขงาน" : "เพิ่มงาน"}
            onBack={onCloseDetail}
          />

          {view === "edit" && !loading && !selectedTray ? (
            <ErrorState
              message="ไม่พบงานที่ต้องการแก้ไข"
              onRetry={onCloseDetail}
            />
          ) : (
            <Stack>
              {view === "edit" && selectedTray ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    size="compact"
                    className="w-full sm:w-auto"
                    onClick={() => openQrModal(selectedTray)}
                  >
                    ดู QR
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="compact"
                    className="w-full sm:w-auto"
                    onClick={() => onViewLogs(selectedTray.id)}
                  >
                    ดูประวัติ
                  </Button>
                </div>
              ) : null}

              <MobileCard className="p-4 sm:p-5">
                {error ? (
                  <ErrorState message={error} onRetry={loadTrays} />
                ) : null}
                <form
                  className="space-y-4"
                  onSubmit={
                    view === "create"
                      ? handleSubmit
                      : (event) => event.preventDefault()
                  }
                >
                  <Input
                    label="QR Code *"
                    value={form.qr_code}
                    onChange={handleChange("qr_code")}
                    required
                    disabled={view === "edit"}
                    className="font-mono"
                  />
                  <Input
                    as="select"
                    label="สายการผลิต"
                    value={form.line_id}
                    onChange={handleChange("line_id")}
                  >
                    <option value="">— ไม่ระบุ —</option>
                    {lines.map((line) => (
                      <option key={line.id} value={line.id}>
                        {line.name}
                      </option>
                    ))}
                  </Input>
                  <Input
                    label="สินค้า (Product)"
                    value={form.product}
                    onChange={handleChange("product")}
                  />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Batch No."
                      value={form.batch_no}
                      onChange={handleChange("batch_no")}
                    />
                    <Input
                      label="จำนวน (Qty)"
                      type="number"
                      min="1"
                      value={form.qty}
                      onChange={handleChange("qty")}
                    />
                  </div>
                  <Input
                    as="select"
                    label="สถานะ"
                    value={form.status}
                    onChange={handleChange("status")}
                  >
                    {TRAY_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </Input>
                  <Input
                    label="กำหนดส่ง (Due Date)"
                    type="datetime-local"
                    value={form.due_date}
                    onChange={handleChange("due_date")}
                  />
                  {view === "create" ? (
                    <FormActions>
                      <Button
                        type="submit"
                        className="w-full sm:flex-1"
                        disabled={submitting}
                      >
                        {submitting ? "กำลังบันทึก..." : "สร้างงาน"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full sm:flex-1"
                        onClick={onCloseDetail}
                      >
                        ยกเลิก
                      </Button>
                    </FormActions>
                  ) : null}
                  {view === "edit" ? (
                    <FormActions>
                      <Button
                        type="button"
                        variant="danger"
                        className="w-full sm:w-auto"
                        onClick={handleDelete}
                        disabled={submitting}
                      >
                        ลบข้อมูล
                      </Button>
                    </FormActions>
                  ) : null}
                </form>
              </MobileCard>
            </Stack>
          )}
        </Stack>

        <TrayQrModal
          tray={qrTray}
          isOpen={Boolean(qrTray)}
          onClose={closeQrModal}
        />
      </>
    );
  }

  if (view === "logs") {
    if (!loading && !selectedTray) {
      return (
        <ErrorState
          message="ไม่พบงานที่ต้องการดูประวัติ"
          onRetry={onCloseDetail}
        />
      );
    }

    return selectedTray ? (
      <Stack>
        <AdminDetailHeader
          title={`ประวัติ: ${selectedTray.qr_code}`}
          onBack={() => onBackFromLogs(selectedTray.id)}
        />
        <TrayLogs trayId={selectedTray.id} />
      </Stack>
    ) : (
      <LoadingState message="กำลังเตรียมข้อมูลประวัติงาน..." />
    );
  }

  return (
    <AdminSection
      action={
        <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
          <div className="min-w-0 flex-1">
            <Input
              placeholder="ค้นหา QR Code, ชื่อสินค้า, batch หรือสายการผลิต"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
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
        <ErrorState message={error} onRetry={loadTrays} />
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
                    onClick={() => openQrModal(tray)}
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
                      openQrModal(tray);
                    }}
                  >
                    QR
                  </Button>
                </td>
              </tr>
            ))}
          </DataTable>

          <TrayQrModal
            tray={qrTray}
            isOpen={Boolean(qrTray)}
            onClose={closeQrModal}
          />
        </>
      ) : null}
    </AdminSection>
  );
}

function TrayLogs({ trayId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLogs = async () => {
    try {
      setError("");
      setLoading(true);
      const data = await getLogs({ tray_id: trayId });
      setLogs(data);
    } catch (err) {
      setError(err.message || "โหลดประวัติการทำงานไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [trayId]);

  if (loading) {
    return <LoadingState message="กำลังโหลดประวัติการทำงาน..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadLogs} />;
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        title="ยังไม่มีประวัติการทำงาน"
        description="ระบบยังไม่มี log สำหรับงานนี้"
      />
    );
  }

  return (
    <Stack>
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-start justify-between gap-3 rounded-[22px] border border-neutral-200 bg-neutral-50 p-4"
        >
          <div className="space-y-1">
            <h4 className="font-semibold text-neutral-900">
              {log.process_name}
            </h4>
            <p className="text-xs text-neutral-500">
              {log.operator || "ไม่ระบุ"}
              {" • "}
              {new Date(log.logged_at).toLocaleString("th-TH", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </p>
            {log.note ? (
              <p className="text-xs text-neutral-400">Note: {log.note}</p>
            ) : null}
          </div>
          <Badge
            color={
              log.action === "finish"
                ? "green"
                : log.action === "ng"
                  ? "red"
                  : "blue"
            }
          >
            {String(log.action || "").toUpperCase()}
          </Badge>
        </div>
      ))}
    </Stack>
  );
}
