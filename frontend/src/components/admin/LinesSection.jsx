import { useEffect, useState } from "react";
import {
  createLine,
  createProcess,
  deleteLine,
  deleteProcess,
  getProcesses,
  updateLine,
  updateProcess,
} from "../../api/client";
import {
  AdminSection,
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

const EMPTY_LINE_FORM = {
  name: "",
  description: "",
};

export default function LinesSection({
  lines,
  onRefresh,
  loading = false,
  error = "",
}) {
  const [isLineModalOpen, setIsLineModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [editLine, setEditLine] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_LINE_FORM);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const keyword = search.trim().toLowerCase();
  const filteredLines = lines.filter((line) => {
    if (!keyword) {
      return true;
    }

    return [line.name, line.description]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  });

  const openCreateModal = () => {
    setEditLine(null);
    setForm(EMPTY_LINE_FORM);
    setMessage("");
    setIsLineModalOpen(true);
  };

  const openEditModal = (line) => {
    setEditLine(line);
    setForm({ name: line.name || "", description: line.description || "" });
    setMessage("");
    setIsLineModalOpen(true);
  };

  const closeLineModal = () => {
    setIsLineModalOpen(false);
    setEditLine(null);
    setForm(EMPTY_LINE_FORM);
    setMessage("");
  };

  const openProcessModal = (line) => {
    setSelectedLine(line);
    setIsProcessModalOpen(true);
  };

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      if (editLine) {
        await updateLine(editLine.id, form);
        setMessage("อัปเดตสำเร็จ");
      } else {
        await createLine(form);
        setMessage("เพิ่มสำเร็จ");
      }

      await onRefresh();
      window.setTimeout(() => {
        closeLineModal();
      }, 700);
    } catch (err) {
      setMessage(err.message || "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (lineId) => {
    if (!window.confirm("ยืนยันการลบสายการผลิต?")) {
      return;
    }

    try {
      await deleteLine(lineId);
      closeLineModal();
      await onRefresh();
    } catch (err) {
      setMessage(err.message || "ลบข้อมูลไม่สำเร็จ");
    }
  };

  return (
    <AdminSection
      action={
        <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
          <div className="min-w-0 flex-1">
            <Input
              placeholder="ค้นหาชื่อสายการผลิตหรือรายละเอียด"
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
              <Button onClick={openCreateModal}>เพิ่มสายการผลิตแรก</Button>
            ) : null
          }
        />
      ) : null}

      {!loading && !error && filteredLines.length > 0 ? (
        <>
          <Stack className="md:hidden">
            {filteredLines.map((line) => (
              <MobileCard key={line.id}>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-neutral-900">
                    {line.name}
                  </h3>
                  <p className="text-sm text-neutral-500">
                    {line.description || "ไม่มีรายละเอียด"}
                  </p>
                </div>
                <div className="mt-3 sm:mt-4">
                  <FormActions>
                    <Button
                      size="compact"
                      variant="secondary"
                      className="w-full sm:w-auto"
                      onClick={() => openProcessModal(line)}
                    >
                      จัดการขั้นตอน
                    </Button>
                    <Button
                      size="compact"
                      variant="text"
                      className="w-full sm:w-auto"
                      onClick={() => openEditModal(line)}
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
              { key: "name", label: "ชื่อสายการผลิต" },
              { key: "description", label: "รายละเอียด" },
              { key: "actions", label: "จัดการ", className: "text-right" },
            ]}
          >
            {filteredLines.map((line) => (
              <tr key={line.id} className="hover:bg-neutral-50/80">
                <td className="px-5 py-4 font-semibold text-neutral-900">
                  {line.name}
                </td>
                <td className="px-5 py-4 text-neutral-500">
                  {line.description || "—"}
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => openProcessModal(line)}
                    >
                      จัดการขั้นตอน
                    </Button>
                    <Button variant="text" onClick={() => openEditModal(line)}>
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
        title={editLine ? "แก้ไขสายการผลิต" : "เพิ่มสายการผลิต"}
        description="ระบุชื่อสายการผลิตและรายละเอียดเพื่อให้ทีมงานเลือกใช้งานได้ชัดเจน"
        isOpen={isLineModalOpen}
        onClose={closeLineModal}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="ชื่อสายการผลิต *"
            value={form.name}
            onChange={handleChange("name")}
            required
          />
          <Input
            as="textarea"
            rows={3}
            label="รายละเอียด"
            value={form.description}
            onChange={handleChange("description")}
          />
          <FormActions>
            <Button
              type="submit"
              className="w-full sm:flex-1"
              disabled={submitting}
            >
              {submitting
                ? "กำลังบันทึก..."
                : editLine
                  ? "บันทึกข้อมูล"
                  : "สร้างสายการผลิต"}
            </Button>
            {editLine ? (
              <Button
                type="button"
                variant="danger"
                className="w-full sm:flex-1"
                onClick={() => handleDelete(editLine.id)}
              >
                ลบข้อมูล
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:flex-1"
              onClick={closeLineModal}
            >
              ยกเลิก
            </Button>
          </FormActions>
          <SaveMessage message={message} />
        </form>
      </Modal>

      <Modal
        title={
          selectedLine ? `ขั้นตอนของ ${selectedLine.name}` : "จัดการขั้นตอน"
        }
        description="กำหนดลำดับขั้นตอนของสายการผลิตสำหรับใช้ในการสแกนและบันทึกงาน"
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
      >
        {selectedLine ? <ProcessManager lineId={selectedLine.id} /> : null}
      </Modal>
    </AdminSection>
  );
}

function ProcessManager({ lineId }) {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    sequence: "",
    description: "",
  });

  const loadProcesses = async () => {
    try {
      setError("");
      setLoading(true);
      const data = await getProcesses(lineId);
      setProcesses(data);
    } catch (err) {
      setError(err.message || "โหลดข้อมูลขั้นตอนไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProcesses();
  }, [lineId]);

  const resetForm = () => {
    setEditId(null);
    setForm({ name: "", sequence: "", description: "" });
    setMessage("");
  };

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const payload = {
      name: form.name,
      sequence: Number(form.sequence),
      description: form.description,
    };

    try {
      if (editId) {
        await updateProcess(editId, payload);
        setMessage("อัปเดตสำเร็จ");
      } else {
        await createProcess({ ...payload, line_id: Number(lineId) });
        setMessage("เพิ่มสำเร็จ");
      }
      await loadProcesses();
      resetForm();
    } catch (err) {
      setMessage(err.message || "บันทึกขั้นตอนไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (processItem) => {
    setEditId(processItem.id);
    setForm({
      name: processItem.name || "",
      sequence: String(processItem.sequence || ""),
      description: processItem.description || "",
    });
    setMessage("");
  };

  const handleDelete = async (processId) => {
    if (!window.confirm("ยืนยันการลบขั้นตอน?")) {
      return;
    }

    try {
      await deleteProcess(processId);
      await loadProcesses();
      if (editId === processId) {
        resetForm();
      }
    } catch (err) {
      setMessage(err.message || "ลบขั้นตอนไม่สำเร็จ");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <form
        className="space-y-4 rounded-[22px] border border-neutral-200 bg-neutral-50 p-3.5 sm:rounded-[24px] sm:p-4"
        onSubmit={handleSubmit}
      >
        <div>
          <h4 className="text-sm font-bold text-neutral-900">
            {editId ? "แก้ไขขั้นตอน" : "เพิ่มขั้นตอนใหม่"}
          </h4>
          <p className="mt-1 text-sm text-neutral-500">
            กำหนดลำดับก่อนหลังของ process ในสายการผลิตนี้
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
          <Input
            label="ลำดับ *"
            type="number"
            min="1"
            value={form.sequence}
            onChange={handleChange("sequence")}
            required
          />
          <Input
            label="ชื่อขั้นตอน *"
            value={form.name}
            onChange={handleChange("name")}
            required
          />
        </div>
        <Input
          as="textarea"
          rows={3}
          label="รายละเอียด"
          value={form.description}
          onChange={handleChange("description")}
        />
        <div className="mt-4">
          <FormActions>
            <Button
              type="submit"
              className="w-full sm:flex-1"
              disabled={submitting}
            >
              {submitting
                ? "กำลังบันทึก..."
                : editId
                  ? "บันทึกการแก้ไข"
                  : "+ เพิ่มขั้นตอน"}
            </Button>
            {editId ? (
              <Button
                type="button"
                variant="danger"
                className="w-full sm:flex-1"
                onClick={() => handleDelete(editId)}
              >
                ลบข้อมูล
              </Button>
            ) : null}
            {editId ? (
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:flex-1"
                onClick={resetForm}
              >
                ยกเลิก
              </Button>
            ) : null}
          </FormActions>
        </div>
        <SaveMessage message={message} />
      </form>

      {loading ? <LoadingState message="กำลังโหลดขั้นตอนการผลิต..." /> : null}
      {!loading && error ? (
        <ErrorState message={error} onRetry={loadProcesses} />
      ) : null}
      {!loading && !error && processes.length === 0 ? (
        <EmptyState
          title="ยังไม่มีขั้นตอนในสายการผลิตนี้"
          description="เพิ่ม process อย่างน้อยหนึ่งขั้นตอนเพื่อเริ่มใช้งานในหน้างาน"
        />
      ) : null}

      {!loading && !error && processes.length > 0 ? (
        <Stack>
          {processes.map((processItem) => (
            <div
              key={processItem.id}
              className="flex flex-col gap-3 rounded-[22px] border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                  {processItem.sequence}
                </div>
                <div>
                  <h5 className="font-semibold text-neutral-900">
                    {processItem.name}
                  </h5>
                  {processItem.description ? (
                    <p className="mt-1 text-sm text-neutral-500">
                      {processItem.description}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex gap-2 sm:justify-end">
                <Button variant="text" onClick={() => handleEdit(processItem)}>
                  แก้ไข
                </Button>
              </div>
            </div>
          ))}
        </Stack>
      ) : null}
    </div>
  );
}
