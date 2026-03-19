import { useEffect, useMemo, useState } from "react";
import { createLine, deleteLine, updateLine } from "../../../api/client";
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

const EMPTY_LINE_FORM = {
  name: "",
  description: "",
};

export default function LineEditorView({
  mode,
  loading,
  selectedLine,
  onRefresh,
  onClose,
  onManageProcesses,
}) {
  const [form, setForm] = useState(EMPTY_LINE_FORM);
  const [submitting, setSubmitting] = useState(false);
  const isEditView = mode === "edit";
  const isCreateView = mode === "create";
  const initialForm = useMemo(
    () =>
      selectedLine
        ? {
            name: selectedLine.name || "",
            description: selectedLine.description || "",
          }
        : EMPTY_LINE_FORM,
    [selectedLine],
  );

  useEffect(() => {
    if (isEditView && selectedLine) {
      setForm(initialForm);
    } else if (isCreateView) {
      setForm(EMPTY_LINE_FORM);
    }

    setSubmitting(false);
  }, [initialForm, isCreateView, isEditView, selectedLine]);

  const autoSaving = useAutoSaveForm({
    enabled: isEditView && Boolean(selectedLine),
    values: form,
    initialValues: initialForm,
    resetKey: `${mode}:${selectedLine?.id || "new"}`,
    onSave: async (nextForm) => {
      await updateLine(selectedLine.id, nextForm);
      await onRefresh();
    },
  });

  const isSubmitting = submitting || autoSaving;

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (isEditView && selectedLine) {
        await updateLine(selectedLine.id, form);
      } else {
        await createLine(form);
      }

      await onRefresh();
      window.setTimeout(() => {
        onClose();
      }, 700);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLine || !window.confirm("ยืนยันการลบสายการผลิต?")) {
      return;
    }

    await deleteLine(selectedLine.id);
    await onRefresh();
    onClose();
  };

  return (
    <Stack>
      <AdminDetailHeader
        title={isEditView ? "แก้ไขสายการผลิต" : "เพิ่มสายการผลิต"}
        onBack={onClose}
      />

      {isEditView && !loading && !selectedLine ? (
        <ErrorState
          message="ไม่พบสายการผลิตที่ต้องการแก้ไข"
          onRetry={onClose}
        />
      ) : (
        <MobileCard className="p-4 sm:p-5">
          <form
            className="space-y-4"
            onSubmit={
              isCreateView ? handleSubmit : (event) => event.preventDefault()
            }
          >
            <Input
              label="ชื่อสายการผลิต *"
              value={form.name}
              onChange={handleChange("name")}
              required
            />
            <Input
              as="textarea"
              rows={4}
              label="รายละเอียด"
              value={form.description}
              onChange={handleChange("description")}
            />
            {isCreateView ? (
              <FormActions>
                <Button
                  type="submit"
                  className="w-full sm:flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "กำลังบันทึก..." : "สร้างสายการผลิต"}
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
            {isEditView ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={() => onManageProcesses(selectedLine.id)}
                >
                  ขั้นตอน
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  className="w-full sm:w-auto"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  ลบข้อมูล
                </Button>
              </div>
            ) : null}
          </form>
        </MobileCard>
      )}
    </Stack>
  );
}
