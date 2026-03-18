import { useEffect, useRef, useState } from "react";
import {
  createOperator,
  deleteOperator,
  getOperators,
  updateOperator,
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
  SaveMessage,
  Stack,
} from "./AdminUI";

const EMPTY_FORM = {
  name: "",
  employeeId: "",
  department: "",
  isActive: true,
};

export default function OperatorsSection({
  view = "",
  selectedId = "",
  onCreate,
  onEdit,
  onCloseDetail,
}) {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const isAutoSaveReadyRef = useRef(false);

  const selectedOperator =
    view === "edit"
      ? operators.find(
          (operator) => String(operator.id) === String(selectedId),
        ) || null
      : null;

  const keyword = search.trim().toLowerCase();
  const filteredOperators = operators.filter((operator) => {
    if (!keyword) {
      return true;
    }

    return [operator.name, operator.employee_id, operator.department]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  });

  const loadOperators = async () => {
    try {
      setError("");
      setLoading(true);
      const data = await getOperators();
      setOperators(data);
    } catch (err) {
      setError(err.message || "โหลดข้อมูลพนักงานไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOperators();
  }, []);

  useEffect(() => {
    if (view === "edit" && selectedOperator) {
      isAutoSaveReadyRef.current = false;
      setForm({
        name: selectedOperator.name || "",
        employeeId: selectedOperator.employee_id || "",
        department: selectedOperator.department || "",
        isActive: Boolean(selectedOperator.is_active),
      });
    } else if (view === "create") {
      isAutoSaveReadyRef.current = false;
      setForm(EMPTY_FORM);
    }

    setError("");
    setSubmitting(false);
  }, [selectedOperator, view]);

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = {
      name: form.name,
      employee_id: form.employeeId || null,
      department: form.department || null,
      is_active: form.isActive,
    };

    try {
      await createOperator(payload);

      await loadOperators();
      window.setTimeout(() => {
        onCloseDetail();
      }, 700);
    } catch (err) {
      setError(err.message || "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (view !== "edit" || !selectedOperator) {
      return undefined;
    }

    if (!isAutoSaveReadyRef.current) {
      isAutoSaveReadyRef.current = true;
      return undefined;
    }

    const initialName = selectedOperator.name || "";
    const initialEmployeeId = selectedOperator.employee_id || "";
    const initialDepartment = selectedOperator.department || "";
    const initialIsActive = Boolean(selectedOperator.is_active);
    const isUnchanged =
      form.name === initialName &&
      form.employeeId === initialEmployeeId &&
      form.department === initialDepartment &&
      form.isActive === initialIsActive;

    if (isUnchanged) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setSubmitting(true);
        await updateOperator(selectedOperator.id, {
          name: form.name,
          employee_id: form.employeeId || null,
          department: form.department || null,
          is_active: form.isActive,
        });
        await loadOperators();
      } catch (err) {
        setError(err.message || "บันทึกข้อมูลไม่สำเร็จ");
      } finally {
        setSubmitting(false);
      }
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [form, selectedOperator, view]);

  const handleDelete = async () => {
    if (!selectedOperator || !window.confirm("ยืนยันการลบผู้ปฏิบัติงาน?")) {
      return;
    }

    try {
      await deleteOperator(selectedOperator.id);
      await loadOperators();
      onCloseDetail();
    } catch (err) {
      setError(err.message || "ลบข้อมูลไม่สำเร็จ");
    }
  };

  if (view === "create" || view === "edit") {
    return (
      <Stack>
        <AdminDetailHeader
          title={view === "edit" ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงาน"}
          onBack={onCloseDetail}
        />

        {view === "edit" && !loading && !selectedOperator ? (
          <ErrorState
            message="ไม่พบพนักงานที่ต้องการแก้ไข"
            onRetry={onCloseDetail}
          />
        ) : (
          <MobileCard className="p-4 sm:p-5">
            {error ? (
              <ErrorState message={error} onRetry={loadOperators} />
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
              {view === "create" ? (
                <FormActions>
                  <Button
                    type="submit"
                    className="w-full sm:flex-1"
                    disabled={submitting}
                  >
                    {submitting ? "กำลังบันทึก..." : "เพิ่มรายชื่อ"}
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
              placeholder="ค้นหาชื่อ รหัส หรือแผนก"
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
      {loading ? <LoadingState message="กำลังโหลดข้อมูลพนักงาน..." /> : null}
      {!loading && error ? (
        <ErrorState message={error} onRetry={loadOperators} />
      ) : null}
      {!loading && !error && filteredOperators.length === 0 ? (
        <EmptyState
          title={
            operators.length === 0
              ? "ยังไม่มีข้อมูลพนักงาน"
              : "ไม่พบพนักงานที่ค้นหา"
          }
          description={
            operators.length === 0
              ? "เริ่มต้นด้วยการสร้างรายชื่อพนักงานเพื่อใช้ในสายการผลิต"
              : "ลองเปลี่ยนคำค้น หรือเพิ่มพนักงานใหม่"
          }
          action={
            operators.length === 0 ? (
              <Button onClick={onCreate}>เพิ่มพนักงานคนแรก</Button>
            ) : null
          }
        />
      ) : null}

      {!loading && !error && filteredOperators.length > 0 ? (
        <>
          <Stack className="md:hidden">
            {filteredOperators.map((operator) => (
              <MobileCard
                key={operator.id}
                className="border-2 border-neutral-200 transition-all hover:border-info-200"
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => onEdit(operator.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-neutral-900 sm:text-lg">
                        {operator.name}
                      </h3>
                      <p className="mt-1 text-sm text-neutral-500">
                        {operator.employee_id || "ไม่มีรหัสพนักงาน"}
                        {" • "}
                        {operator.department || "ไม่ระบุแผนก"}
                      </p>
                    </div>
                    <Badge color={operator.is_active ? "green" : "gray"}>
                      {operator.is_active ? "ใช้งาน" : "ระงับ"}
                    </Badge>
                  </div>
                </button>
              </MobileCard>
            ))}
          </Stack>

          <DataTable
            columns={[
              { key: "name", label: "ชื่อพนักงาน" },
              { key: "meta", label: "รหัส / แผนก" },
              { key: "status", label: "สถานะ" },
            ]}
          >
            {filteredOperators.map((operator) => (
              <tr
                key={operator.id}
                className="cursor-pointer hover:bg-neutral-50/80"
                onClick={() => onEdit(operator.id)}
              >
                <td className="px-5 py-4 font-semibold text-neutral-900">
                  {operator.name}
                </td>
                <td className="px-5 py-4">
                  <div className="font-mono text-xs text-neutral-600">
                    {operator.employee_id || "—"}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {operator.department || "—"}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <Badge color={operator.is_active ? "green" : "gray"}>
                    {operator.is_active ? "ใช้งาน" : "ระงับ"}
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
