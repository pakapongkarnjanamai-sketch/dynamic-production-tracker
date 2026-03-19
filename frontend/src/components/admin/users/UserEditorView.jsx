import { useEffect, useMemo, useState } from "react";
import { createUser, deleteUser, updateUser } from "../../../api/client";
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
  buildUserFormValues,
  buildUserPayload,
  EMPTY_USER_FORM,
  getUserRoleOptions,
} from "./userShared";

export default function UserEditorView({
  currentRole,
  mode,
  loading,
  error,
  setError,
  selectedUser,
  onRefresh,
  onClose,
}) {
  const [form, setForm] = useState(EMPTY_USER_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const roleOptions = getUserRoleOptions(currentRole);
  const isEditView = mode === "edit";
  const isCreateView = mode === "create";
  const initialForm = useMemo(
    () => buildUserFormValues(selectedUser),
    [selectedUser],
  );

  useEffect(() => {
    if (isEditView && selectedUser) {
      setForm(initialForm);
    } else if (isCreateView) {
      setForm(EMPTY_USER_FORM);
    }

    setError("");
    setSubmitting(false);
    setPasswordSubmitting(false);
  }, [initialForm, isCreateView, isEditView, selectedUser, setError]);

  const autoSaving = useAutoSaveForm({
    enabled: isEditView && Boolean(selectedUser),
    values: {
      employeeId: form.employeeId,
      name: form.name,
      role: form.role,
      isActive: form.isActive,
    },
    initialValues: {
      employeeId: initialForm.employeeId,
      name: initialForm.name,
      role: initialForm.role,
      isActive: initialForm.isActive,
    },
    resetKey: `${mode}:${selectedUser?.id || "new"}`,
    onSave: async (nextForm) => {
      await updateUser(selectedUser.id, buildUserPayload(nextForm));
      await onRefresh();
    },
    onError: (err) => {
      setError(err.message || "บันทึกบัญชีไม่สำเร็จ");
    },
  });

  const isSubmitting = submitting || passwordSubmitting || autoSaving;

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await createUser(buildUserPayload(form, { includePassword: true }));
      await onRefresh();
      window.setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setError(err.message || "บันทึกบัญชีไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!selectedUser || !form.password) {
      return;
    }

    try {
      setPasswordSubmitting(true);
      setError("");
      await updateUser(selectedUser.id, {
        password: form.password,
      });
      setForm((current) => ({ ...current, password: "" }));
    } catch (err) {
      setError(err.message || "อัปเดตรหัสผ่านไม่สำเร็จ");
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser || !window.confirm("ยืนยันการลบผู้ใช้งานระบบ?")) {
      return;
    }

    try {
      await deleteUser(selectedUser.id);
      await onRefresh();
      onClose();
    } catch (err) {
      setError(err.message || "ลบบัญชีไม่สำเร็จ");
    }
  };

  return (
    <Stack>
      <AdminDetailHeader
        title={mode === "edit" ? "แก้ไขบัญชีผู้ใช้" : "สร้างบัญชีผู้ใช้"}
        onBack={onClose}
      />

      {mode === "edit" && !loading && !selectedUser ? (
        <ErrorState
          message="ไม่พบบัญชีผู้ใช้ที่ต้องการแก้ไข"
          onRetry={onClose}
        />
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
              label="รหัสประจำตัว (Login ID) *"
              value={form.employeeId}
              onChange={handleChange("employeeId")}
              required
            />
            <Input
              label="ชื่อผู้ใช้งาน *"
              value={form.name}
              onChange={handleChange("name")}
              required
            />
            <Input
              label={
                mode === "edit" ? "รหัสผ่านใหม่ (เว้นว่างได้)" : "รหัสผ่าน *"
              }
              type="password"
              value={form.password}
              onChange={handleChange("password")}
              required={mode !== "edit"}
            />
            <Input
              as="select"
              label="สิทธิ์ (Role) *"
              value={form.role}
              onChange={handleChange("role")}
            >
              {roleOptions.map((roleItem) => (
                <option key={roleItem} value={roleItem}>
                  {roleItem.toUpperCase()}
                </option>
              ))}
            </Input>
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
              <option value="false">ระงับบัญชี</option>
            </Input>
            {mode === "create" ? (
              <FormActions>
                <Button
                  type="submit"
                  className="w-full sm:flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "กำลังบันทึก..." : "สร้างบัญชี"}
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
              <>
                {form.password ? (
                  <FormActions>
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full sm:w-auto"
                      onClick={handlePasswordSubmit}
                      disabled={passwordSubmitting}
                    >
                      {passwordSubmitting ? "กำลังอัปเดต..." : "อัปเดตรหัสผ่าน"}
                    </Button>
                  </FormActions>
                ) : null}
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
              </>
            ) : null}
          </form>
        </MobileCard>
      )}
    </Stack>
  );
}
