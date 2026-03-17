import { useEffect, useMemo, useState } from "react";
import {
  createTray,
  deleteTray,
  getLogs,
  getTrays,
  updateTray,
} from "../../api/client";
import {
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
  SaveMessage,
  Stack,
} from "./AdminUI";

const TRAY_STATUSES = ["pending", "in_progress", "completed", "on_hold"];

const STATUS_LABELS = {
  pending: "รอดำเนินการ",
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

export default function TraysSection({ lines }) {
  const [trays, setTrays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editTray, setEditTray] = useState(null);
  const [selectedTray, setSelectedTray] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const resetForm = () => {
    setEditTray(null);
    setForm(EMPTY_FORM);
    setMessage("");
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (tray) => {
    setEditTray(tray);
    setForm({
      qr_code: tray.qr_code,
      line_id: tray.line_id ? String(tray.line_id) : "",
      product: tray.product || "",
      batch_no: tray.batch_no || "",
      qty: String(tray.qty || 1),
      status: tray.status || "pending",
      due_date: tray.due_date
        ? new Date(tray.due_date).toISOString().slice(0, 16)
        : "",
    });
    setMessage("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const payload = {
      ...form,
      line_id: form.line_id ? Number(form.line_id) : null,
      qty: Number(form.qty) || 1,
      due_date: form.due_date || null,
    };

    try {
      if (editTray) {
        await updateTray(editTray.id, payload);
        setMessage("อัปเดตสำเร็จ");
      } else {
        await createTray(payload);
        setMessage("เพิ่มสำเร็จ");
      }

      await loadTrays();
      window.setTimeout(() => {
        closeModal();
      }, 700);
    } catch (err) {
      setMessage(err.message || "บันทึกงานไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (trayId) => {
    if (!window.confirm("ยืนยันการลบงาน?")) {
      return;
    }

    try {
      await deleteTray(trayId);
      closeModal();
      await loadTrays();
    } catch (err) {
      setError(err.message || "ลบงานไม่สำเร็จ");
    }
  };

  const openLogs = (tray) => {
    setSelectedTray(tray);
    setIsLogModalOpen(true);
  };

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
            onClick={openCreateModal}
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
              <Button onClick={openCreateModal}>สร้างงานแรก</Button>
            ) : null
          }
        />
      ) : null}

      {!loading && !error && filteredTrays.length > 0 ? (
        <>
          <Stack className="md:hidden">
            {filteredTrays.map((tray) => (
              <MobileCard key={tray.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="font-mono text-base font-black text-neutral-900">
                      {tray.qr_code}
                    </h3>
                    <p className="text-sm font-semibold text-neutral-700">
                      {tray.product || "ไม่มีชื่อสินค้า"}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {tray.line_name || "ไม่ระบุสายการผลิต"}
                      {tray.batch_no ? ` • Batch: ${tray.batch_no}` : ""}
                    </p>
                  </div>
                  <Badge color={STATUS_COLORS[tray.status]}>
                    {STATUS_LABELS[tray.status]}
                  </Badge>
                </div>
                <div className="mt-3 sm:mt-4">
                  <FormActions>
                    <Button
                      size="compact"
                      variant="secondary"
                      className="w-full sm:w-auto"
                      onClick={() => openLogs(tray)}
                    >
                      ดูประวัติ
                    </Button>
                    <Button
                      size="compact"
                      variant="text"
                      className="w-full sm:w-auto"
                      onClick={() => openEditModal(tray)}
                    >
                      แก้ไข
                    </Button>
                  </FormActions>
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
              { key: "actions", label: "จัดการ", className: "text-right" },
            ]}
          >
            {filteredTrays.map((tray) => (
              <tr key={tray.id} className="hover:bg-neutral-50/80">
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
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => openLogs(tray)}>
                      ดูประวัติ
                    </Button>
                    <Button variant="text" onClick={() => openEditModal(tray)}>
                      แก้ไข
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </>
      ) : null}

      <Modal
        title={editTray ? "แก้ไขงาน" : "เพิ่มงาน"}
        description="กำหนด QR Code และข้อมูลงานเพื่อใช้ติดตามสถานะในสายการผลิต"
        isOpen={isModalOpen}
        onClose={closeModal}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="QR Code *"
            value={form.qr_code}
            onChange={handleChange("qr_code")}
            required
            disabled={Boolean(editTray)}
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
          <FormActions>
            <Button
              type="submit"
              className="w-full sm:flex-1"
              disabled={submitting}
            >
              {submitting
                ? "กำลังบันทึก..."
                : editTray
                  ? "บันทึกข้อมูล"
                  : "สร้างงาน"}
            </Button>
            {editTray ? (
              <Button
                type="button"
                variant="danger"
                className="w-full sm:flex-1"
                onClick={() => handleDelete(editTray.id)}
              >
                ลบข้อมูล
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:flex-1"
              onClick={closeModal}
            >
              ยกเลิก
            </Button>
          </FormActions>
          <SaveMessage message={message} />
        </form>
      </Modal>

      <Modal
        title={
          selectedTray ? `ประวัติ: ${selectedTray.qr_code}` : "ประวัติการทำงาน"
        }
        description="ตรวจสอบเหตุการณ์ล่าสุดของงานนี้จาก log ในระบบ"
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
      >
        {selectedTray ? <TrayLogs trayId={selectedTray.id} /> : null}
      </Modal>
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
