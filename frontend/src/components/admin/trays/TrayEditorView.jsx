import { useEffect, useState } from "react";
import { createTray, deleteTray, updateTray } from "../../../api/client";
import useAutoSaveForm from "../../../hooks/useAutoSaveForm";
import {
  AdminDetailHeader,
  Button,
  ErrorState,
  FormActions,
  Input,
  MobileCard,
  Stack,
} from "../AdminUI";
import {
  buildTrayFormValues,
  buildTrayPayload,
  EMPTY_TRAY_FORM,
  STATUS_LABELS,
  TRAY_STATUSES,
} from "./trayShared";

export default function TrayEditorView({
  lines,
  mode,
  loading,
  error,
  setError,
  selectedTray,
  onRefresh,
  onClose,
  onViewLogs,
  onOpenQr,
}) {
  const [form, setForm] = useState(EMPTY_TRAY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const isEditView = mode === "edit";
  const isCreateView = mode === "create";
  const initialForm = buildTrayFormValues(selectedTray);

  useEffect(() => {
    if (isEditView && selectedTray) {
      setForm(initialForm);
    } else if (isCreateView) {
      setForm(EMPTY_TRAY_FORM);
    }

    setError("");
    setSubmitting(false);
  }, [initialForm, isCreateView, isEditView, selectedTray, setError]);

  const autoSaving = useAutoSaveForm({
    enabled: isEditView && Boolean(selectedTray),
    values: form,
    initialValues: initialForm,
    resetKey: `${mode}:${selectedTray?.id || "new"}`,
    onSave: async (nextForm) => {
      await updateTray(selectedTray.id, {
        qr_code: selectedTray.qr_code,
        ...buildTrayPayload(nextForm),
      });
      await onRefresh();
    },
    onError: (err) => {
      setError(err.message || "บันทึกงานไม่สำเร็จ");
    },
  });

  const isSubmitting = submitting || autoSaving;

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await createTray(buildTrayPayload(form));
      await onRefresh();
      window.setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setError(err.message || "บันทึกงานไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTray || !window.confirm("ยืนยันการลบงาน?")) {
      return;
    }

    try {
      await deleteTray(selectedTray.id);
      await onRefresh();
      onClose();
    } catch (err) {
      setError(err.message || "ลบงานไม่สำเร็จ");
    }
  };

  return (
    <Stack>
      <AdminDetailHeader
        title={mode === "edit" ? "แก้ไขงาน" : "เพิ่มงาน"}
        onBack={onClose}
      />

      {mode === "edit" && !loading && !selectedTray ? (
        <ErrorState message="ไม่พบงานที่ต้องการแก้ไข" onRetry={onClose} />
      ) : (
        <Stack>
          {mode === "edit" && selectedTray ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                size="compact"
                className="w-full sm:w-auto"
                onClick={() => onOpenQr(selectedTray)}
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
            {error ? <ErrorState message={error} onRetry={onRefresh} /> : null}
            <form
              className="space-y-4"
              onSubmit={
                mode === "create"
                  ? handleSubmit
                  : (event) => event.preventDefault()
              }
            >
              <Input
                label="QR Code *"
                value={form.qr_code}
                onChange={handleChange("qr_code")}
                required
                disabled={mode === "edit"}
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
              {mode === "create" ? (
                <FormActions>
                  <Button
                    type="submit"
                    className="w-full sm:flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "กำลังบันทึก..." : "สร้างงาน"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full sm:flex-1"
                    onClick={onClose}
                  >
                    ยกเลิก
                  </Button>
                </FormActions>
              ) : null}
              {mode === "edit" ? (
                <FormActions>
                  <Button
                    type="button"
                    variant="danger"
                    className="w-full sm:w-auto"
                    onClick={handleDelete}
                    disabled={isSubmitting}
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
  );
}
