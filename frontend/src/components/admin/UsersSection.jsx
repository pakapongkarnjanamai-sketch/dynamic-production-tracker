import { useEffect, useRef, useState } from "react";
import {
  createUser,
  deleteUser,
  getOperators,
  getUsers,
  updateUser,
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
  Stack,
} from "./AdminUI";

const EMPTY_FORM = {
  employeeId: "",
  name: "",
  password: "",
  role: "operator",
  operatorId: "",
  isActive: true,
};

export default function UsersSection({
  currentRole,
  view = "",
  selectedId = "",
  onCreate,
  onEdit,
  onCloseDetail,
}) {
  const [users, setUsers] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const isAutoSaveReadyRef = useRef(false);

  const selectedUser =
    view === "edit"
      ? users.find((user) => String(user.id) === String(selectedId)) || null
      : null;

  const roleOptions =
    currentRole === "superadmin"
      ? ["superadmin", "admin", "operator", "viewer"]
      : ["operator", "viewer"];

  const keyword = search.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    if (!keyword) {
      return true;
    }

    return [user.name, user.employee_id, user.role, user.operator_name]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  });

  const loadData = async () => {
    try {
      setError("");
      setLoading(true);
      const [userData, operatorData] = await Promise.all([
        getUsers(),
        getOperators(),
      ]);
      setUsers(userData);
      setOperators(operatorData);
    } catch (err) {
      setError(err.message || "โหลดข้อมูลบัญชีผู้ใช้ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (view === "edit" && selectedUser) {
      isAutoSaveReadyRef.current = false;
      setForm({
        employeeId: selectedUser.employee_id || "",
        name: selectedUser.name || "",
        password: "",
        role: selectedUser.role || "operator",
        operatorId: selectedUser.operator_id
          ? String(selectedUser.operator_id)
          : "",
        isActive: Boolean(selectedUser.is_active),
      });
    } else if (view === "create") {
      isAutoSaveReadyRef.current = false;
      setForm(EMPTY_FORM);
    }

    setError("");
    setSubmitting(false);
    setPasswordSubmitting(false);
  }, [selectedUser, view]);

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = {
      employee_id: form.employeeId,
      name: form.name,
      role: form.role,
      operator_id: form.operatorId ? Number(form.operatorId) : null,
      is_active: form.isActive,
    };

    if (view !== "edit" || form.password) {
      payload.password = form.password;
    }

    try {
      await createUser(payload);

      await loadData();
      window.setTimeout(() => {
        onCloseDetail();
      }, 700);
    } catch (err) {
      setError(err.message || "บันทึกบัญชีไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (view !== "edit" || !selectedUser) {
      return undefined;
    }

    if (!isAutoSaveReadyRef.current) {
      isAutoSaveReadyRef.current = true;
      return undefined;
    }

    const initialEmployeeId = selectedUser.employee_id || "";
    const initialName = selectedUser.name || "";
    const initialRole = selectedUser.role || "operator";
    const initialOperatorId = selectedUser.operator_id
      ? String(selectedUser.operator_id)
      : "";
    const initialIsActive = Boolean(selectedUser.is_active);
    const isUnchanged =
      form.employeeId === initialEmployeeId &&
      form.name === initialName &&
      form.role === initialRole &&
      form.operatorId === initialOperatorId &&
      form.isActive === initialIsActive;

    if (isUnchanged) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setSubmitting(true);
        await updateUser(selectedUser.id, {
          employee_id: form.employeeId,
          name: form.name,
          role: form.role,
          operator_id: form.operatorId ? Number(form.operatorId) : null,
          is_active: form.isActive,
        });
        await loadData();
      } catch (err) {
        setError(err.message || "บันทึกบัญชีไม่สำเร็จ");
      } finally {
        setSubmitting(false);
      }
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    form.employeeId,
    form.isActive,
    form.name,
    form.operatorId,
    form.role,
    selectedUser,
    view,
  ]);

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
      await loadData();
      onCloseDetail();
    } catch (err) {
      setError(err.message || "ลบบัญชีไม่สำเร็จ");
    }
  };

  if (view === "create" || view === "edit") {
    return (
      <Stack>
        <AdminDetailHeader
          title={view === "edit" ? "แก้ไขบัญชีผู้ใช้" : "สร้างบัญชีผู้ใช้"}
          onBack={onCloseDetail}
        />

        {view === "edit" && !loading && !selectedUser ? (
          <ErrorState
            message="ไม่พบบัญชีผู้ใช้ที่ต้องการแก้ไข"
            onRetry={onCloseDetail}
          />
        ) : (
          <MobileCard className="p-4 sm:p-5">
            {error ? <ErrorState message={error} onRetry={loadData} /> : null}
            <form
              className="space-y-4"
              onSubmit={
                view === "create"
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
                  view === "edit" ? "รหัสผ่านใหม่ (เว้นว่างได้)" : "รหัสผ่าน *"
                }
                type="password"
                value={form.password}
                onChange={handleChange("password")}
                required={view !== "edit"}
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
                label="ผูกกับ Profile พนักงาน (ถ้ามี)"
                value={form.operatorId}
                onChange={handleChange("operatorId")}
              >
                <option value="">— ไม่ผูก —</option>
                {operators.map((operator) => (
                  <option key={operator.id} value={operator.id}>
                    {operator.name}
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
              {view === "create" ? (
                <FormActions>
                  <Button
                    type="submit"
                    className="w-full sm:flex-1"
                    disabled={submitting}
                  >
                    {submitting ? "กำลังบันทึก..." : "สร้างบัญชี"}
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
                        {passwordSubmitting
                          ? "กำลังอัปเดต..."
                          : "อัปเดตรหัสผ่าน"}
                      </Button>
                    </FormActions>
                  ) : null}
                  <FormActions>
                    <Button
                      type="button"
                      variant="danger"
                      className="w-full sm:w-auto"
                      onClick={handleDelete}
                      disabled={submitting || passwordSubmitting}
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

  return (
    <AdminSection
      action={
        <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
          <div className="min-w-0 flex-1">
            <Input
              placeholder="ค้นหาชื่อ รหัส บทบาท หรือ operator"
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
      {loading ? (
        <LoadingState message="กำลังโหลดข้อมูลบัญชีผู้ใช้..." />
      ) : null}
      {!loading && error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : null}
      {!loading && !error && filteredUsers.length === 0 ? (
        <EmptyState
          title={
            users.length === 0 ? "ยังไม่มีบัญชีผู้ใช้" : "ไม่พบบัญชีที่ค้นหา"
          }
          description={
            users.length === 0
              ? "สร้างบัญชีเพื่อกำหนดสิทธิ์และผูกกับข้อมูลพนักงานในระบบ"
              : "ลองเปลี่ยนคำค้น หรือสร้างบัญชีใหม่"
          }
          action={
            users.length === 0 ? (
              <Button onClick={onCreate}>สร้างบัญชีแรก</Button>
            ) : null
          }
        />
      ) : null}

      {!loading && !error && filteredUsers.length > 0 ? (
        <>
          <Stack className="md:hidden">
            {filteredUsers.map((user) => (
              <MobileCard
                key={user.id}
                className="border-2 border-neutral-200 transition-all hover:border-info-200"
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => onEdit(user.id)}
                >
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-neutral-900 sm:text-lg">
                          {user.name}
                        </h3>
                        <p className="mt-1 font-mono text-sm text-neutral-500">
                          {user.employee_id}
                        </p>
                        <p className="mt-1 text-xs text-neutral-400">
                          ผูกกับ: {user.operator_name || "ไม่ผูกข้อมูล"}
                        </p>
                      </div>
                      <Badge
                        color={
                          user.role === "admin" || user.role === "superadmin"
                            ? "blue"
                            : "gray"
                        }
                      >
                        {user.role.toUpperCase()}
                      </Badge>
                    </div>
                    {!user.is_active ? (
                      <Badge color="red" className="mt-2">
                        ระงับการใช้งาน
                      </Badge>
                    ) : null}
                  </div>
                </button>
              </MobileCard>
            ))}
          </Stack>

          <DataTable
            columns={[
              { key: "identity", label: "ชื่อ / รหัส" },
              { key: "role", label: "สิทธิ์" },
              { key: "operator", label: "ผูกกับ Operator" },
              { key: "status", label: "สถานะ" },
            ]}
          >
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="cursor-pointer hover:bg-neutral-50/80"
                onClick={() => onEdit(user.id)}
              >
                <td className="px-5 py-4">
                  <div className="font-semibold text-neutral-900">
                    {user.name}
                  </div>
                  <div className="mt-1 font-mono text-xs text-neutral-500">
                    {user.employee_id}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <Badge
                    color={
                      user.role === "admin" || user.role === "superadmin"
                        ? "blue"
                        : "gray"
                    }
                  >
                    {user.role.toUpperCase()}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-sm text-neutral-500">
                  {user.operator_name || "—"}
                </td>
                <td className="px-5 py-4">
                  <Badge color={user.is_active ? "green" : "red"}>
                    {user.is_active ? "ใช้งาน" : "ระงับ"}
                  </Badge>
                </td>
              </tr>
            ))}
          </DataTable>
        </>
      ) : null}
    </AdminSection>
  );
}
