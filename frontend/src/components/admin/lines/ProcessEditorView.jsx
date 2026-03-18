import { useEffect, useState } from "react";
import {
  createProcess,
  deleteProcess,
  updateProcess,
} from "../../../api/client";
import useAutoSaveForm from "../../../hooks/useAutoSaveForm";
import useLineProcesses from "../../../hooks/useLineProcesses";
import {
  AdminDetailHeader,
  Button,
  ErrorState,
  FormActions,
  Input,
  Stack,
} from "../AdminUI";

export default function ProcessEditorView({ line, processId, mode, onBack }) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    sequence: "",
    description: "",
  });

  const isEditMode = mode === "process-edit";
  const { processes, loading, error, setError, reload } = useLineProcesses(
    line.id,
  );
  const selectedProcess = isEditMode
    ? processes.find(
        (processItem) => String(processItem.id) === String(processId),
      ) || null
    : null;
  const initialForm = selectedProcess
    ? {
        name: selectedProcess.name || "",
        sequence: String(selectedProcess.sequence || ""),
        description: selectedProcess.description || "",
      }
    : { name: "", sequence: "", description: "" };

  useEffect(() => {
    if (isEditMode && selectedProcess) {
      setForm(initialForm);
    }

    if (!isEditMode) {
      setForm({ name: "", sequence: "", description: "" });
    }
  }, [initialForm, isEditMode, selectedProcess]);

  const autoSaving = useAutoSaveForm({
    enabled: isEditMode && Boolean(selectedProcess),
    values: form,
    initialValues: initialForm,
    resetKey: `${mode}:${line.id}:${selectedProcess?.id || "new"}`,
    onSave: async (nextForm) => {
      await updateProcess(selectedProcess.id, {
        name: nextForm.name,
        sequence: Number(nextForm.sequence),
        description: nextForm.description,
      });
      await reload();
    },
    onError: (err) => {
      setError(err.message || "บันทึกขั้นตอนไม่สำเร็จ");
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

    const payload = {
      name: form.name,
      sequence: Number(form.sequence),
      description: form.description,
    };

    try {
      if (isEditMode && selectedProcess) {
        await updateProcess(selectedProcess.id, payload);
      } else {
        await createProcess({ ...payload, line_id: Number(line.id) });
      }
      onBack();
    } catch (err) {
      setError(err.message || "บันทึกขั้นตอนไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProcess || !window.confirm("ยืนยันการลบขั้นตอน?")) {
      return;
    }

    try {
      await deleteProcess(selectedProcess.id);
      onBack();
    } catch (err) {
      setError(err.message || "ลบขั้นตอนไม่สำเร็จ");
    }
  };

  return (
    <Stack>
      <AdminDetailHeader
        title={isEditMode ? "แก้ไขขั้นตอน" : "เพิ่มขั้นตอนใหม่"}
        onBack={onBack}
      />

      {isEditMode && !loading && !selectedProcess ? (
        <ErrorState message="ไม่พบขั้นตอนที่ต้องการแก้ไข" onRetry={onBack} />
      ) : null}

      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {!error && (!isEditMode || selectedProcess) ? (
        <form
          className="space-y-4 rounded-[22px] border border-neutral-200 bg-neutral-50 p-3.5 sm:rounded-[24px] sm:p-4"
          onSubmit={
            isEditMode ? (event) => event.preventDefault() : handleSubmit
          }
        >
          <div>
            <h4 className="text-sm font-bold text-neutral-900">
              {isEditMode ? line.name : `เพิ่มขั้นตอนใน ${line.name}`}
            </h4>
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
          {isEditMode ? (
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
          ) : (
            <FormActions>
              <Button
                type="submit"
                className="w-full sm:flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? "กำลังบันทึก..." : "+ เพิ่มขั้นตอน"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:flex-1"
                onClick={onBack}
              >
                ยกเลิก
              </Button>
            </FormActions>
          )}
        </form>
      ) : null}
    </Stack>
  );
}
