import { useEffect, useState } from "react";
import {
  createUser,
  deleteUser,
  getOperators,
  getUsers,
  updateUser,
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

const EMPTY_FORM = {
  employeeId: "",
  name: "",
  password: "",
  role: "operator",
  operatorId: "",
  isActive: true,
};

export default function UsersSection({ currentRole }) {
  const [users, setUsers] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const resetForm = () => {
    setEditUser(null);
    setForm(EMPTY_FORM);
    setMessage("");
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditUser(user);
    setForm({
      employeeId: user.employee_id || "",
      name: user.name || "",
      password: "",
      role: user.role || "operator",
      operatorId: user.operator_id ? String(user.operator_id) : "",
      isActive: Boolean(user.is_active),
    });
    setMessage("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const payload = {
      employee_id: form.employeeId,
      name: form.name,
      role: form.role,
      operator_id: form.operatorId ? Number(form.operatorId) : null,
      is_active: form.isActive,
    };

    if (!editUser || form.password) {
      payload.password = form.password;
    }

    try {
      if (editUser) {
        await updateUser(editUser.id, payload);
        setMessage("อัปเดตสำเร็จ");
      } else {
        await createUser(payload);
        setMessage("เพิ่มสำเร็จ");
      }

      await loadData();
      window.setTimeout(() => {
        closeModal();
      }, 700);
    } catch (err) {
      setMessage(err.message || "บันทึกบัญชีไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("ยืนยันการลบผู้ใช้งานระบบ?")) {
      return;
    }

    try {
      await deleteUser(userId);
      closeModal();
      await loadData();
    } catch (err) {
      setError(err.message || "ลบบัญชีไม่สำเร็จ");
    }
  };

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
            onClick={openCreateModal}
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
              <Button onClick={openCreateModal}>สร้างบัญชีแรก</Button>
            ) : null
          }
        />
      ) : null}

      {!loading && !error && filteredUsers.length > 0 ? (
        <>
          <Stack className="md:hidden">
            {filteredUsers.map((user) => (
              <MobileCard key={user.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-neutral-900">
                      {user.name}
                    </h3>
                    <p className="font-mono text-sm text-neutral-500">
                      {user.employee_id}
                    </p>
                    <p className="text-xs text-neutral-400">
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
                  <Badge color="red" className="mt-1">
                    ระงับการใช้งาน
                  </Badge>
                ) : null}
                <div className="mt-3 sm:mt-4">
                  <FormActions>
                    <Button
                      size="compact"
                      variant="secondary"
                      className="w-full sm:w-auto"
                      onClick={() => openEditModal(user)}
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
              { key: "identity", label: "ชื่อ / รหัส" },
              { key: "role", label: "สิทธิ์" },
              { key: "operator", label: "ผูกกับ Operator" },
              { key: "status", label: "สถานะ" },
              { key: "actions", label: "จัดการ", className: "text-right" },
            ]}
          >
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-neutral-50/80">
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
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <Button variant="text" onClick={() => openEditModal(user)}>
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
        title={editUser ? "แก้ไขบัญชีผู้ใช้" : "สร้างบัญชีผู้ใช้"}
        description="ระบุ login, role และการผูกกับข้อมูลพนักงานหน้างาน"
        isOpen={isModalOpen}
        onClose={closeModal}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
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
            label={editUser ? "รหัสผ่านใหม่ (เว้นว่างได้)" : "รหัสผ่าน *"}
            type="password"
            value={form.password}
            onChange={handleChange("password")}
            required={!editUser}
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
          <FormActions>
            <Button
              type="submit"
              className="w-full sm:flex-1"
              disabled={submitting}
            >
              {submitting
                ? "กำลังบันทึก..."
                : editUser
                  ? "บันทึกข้อมูล"
                  : "สร้างบัญชี"}
            </Button>
            {editUser ? (
              <Button
                type="button"
                variant="danger"
                className="w-full sm:flex-1"
                onClick={() => handleDelete(editUser.id)}
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
    </AdminSection>
  );
}
