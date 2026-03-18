import { useEffect, useState } from "react";
import {
  createOperator,
  deleteOperator,
  updateOperator,
} from "../../../api/client";
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
  buildOperatorFormValues,
  buildOperatorPayload,
  EMPTY_OPERATOR_FORM,
} from "./operatorShared";

export default function OperatorEditorView({
  mode,
  loading,
  error,
  setError,
  selectedOperator,
  onRefresh,
  onClose,
}) {
  const [form, setForm] = useState(EMPTY_OPERATOR_FORM);
  const [submitting, setSubmitting] = useState(false);
  const isEditView = mode === "edit";
  const isCreateView = mode === "create";
  const initialForm = buildOperatorFormValues(selectedOperator);

  useEffect(() => {
    if (isEditView && selectedOperator) {
      setForm(initialForm);
    } else if (isCreateView) {
      setForm(EMPTY_OPERATOR_FORM);
    }

    setError("");
    setSubmitting(false);
  }, [initialForm, isCreateView, isEditView, selectedOperator, setError]);

  const autoSaving = useAutoSaveForm({
    enabled: isEditView && Boolean(selectedOperator),
    values: form,
    initialValues: initialForm,
    resetKey: `${mode}:${selectedOperator?.id || "new"}`,
    onSave: async (nextForm) => {
      await updateOperator(selectedOperator.id, buildOperatorPayload(nextForm));
      await onRefresh();
    },
    onError: (err) => {
      setError(err.message || "บันทึกข้อมูลไม่สำเร็จ");
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
      await createOperator(buildOperatorPayload(form));
      await onRefresh();
      window.setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setError(err.message || "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOperator || !window.confirm("ยืนยันการลบผู้ปฏิบัติงาน?")) {
      return;
    }

    try {
      await deleteOperator(selectedOperator.id);
      await onRefresh();
      onClose();
    } catch (err) {
      setError(err.message || "ลบข้อมูลไม่สำเร็จ");
    }
  };

  return (
    <Stack>
      <AdminDetailHeader
        title={mode === "edit" ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงาน"}
        onBack={onClose}
      />

      {mode === "edit" && !loading && !selectedOperator ? (
        <ErrorState message="ไม่พบพนักงานที่ต้องการแก้ไข" onRetry={onClose} />
      ) : (
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
              label="ชื่อ-นามสกุล *"
              value={form.name}
              onChange={handleChange("name")}
              required
            />
            <Input
              label="รหัสพนักงาน"
              value={form.employeeId}
              onChange={handleChange("employeeId")}
            />
            <Input
              label="แผนก / สายการผลิต"
              value={form.department}
              onChange={handleChange("department")}
            />
            <Input
              as="select"
              label="สถานะการใช้งาน"
              value={String(form.isActive)}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  isActive: event.target.value === "true",
                }))
              }
            >
              <option value="true">ใช้งาน</option>
              <option value="false">ระงับ</option>
            </Input>
            {mode === "create" ? (
              <FormActions>
                <Button
                  type="submit"
                  className="w-full sm:flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "กำลังบันทึก..." : "เพิ่มรายชื่อ"}
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
      )}
    </Stack>
  );
}
