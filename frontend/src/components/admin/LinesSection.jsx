import { useEffect, useRef, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  AdminDetailHeader,
  AdminSection,
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  FormActions,
  Input,
  LoadingState,
  MobileCard,
  Stack,
  joinClasses,
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
  view = "",
  selectedId = "",
  selectedProcessId = "",
  onCreate,
  onEdit,
  onManageProcesses,
  onBackFromProcesses,
  onCreateProcess,
  onEditProcess,
  onBackToProcesses,
  onCloseDetail,
}) {
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_LINE_FORM);
  const [submitting, setSubmitting] = useState(false);
  const isAutoSaveReadyRef = useRef(false);
  const isEditView = view === "edit";
  const isCreateView = view === "create";
  const isProcessListView = view === "processes";
  const isProcessCreateView = view === "process-create";
  const isProcessEditView = view === "process-edit";

  const selectedLine =
    isEditView || isProcessListView || isProcessCreateView || isProcessEditView
      ? lines.find((line) => String(line.id) === String(selectedId)) || null
      : null;

  useEffect(() => {
    if (view === "edit" && selectedLine) {
      isAutoSaveReadyRef.current = false;
      setForm({
        name: selectedLine.name || "",
        description: selectedLine.description || "",
      });
    } else if (view === "create") {
      isAutoSaveReadyRef.current = false;
      setForm(EMPTY_LINE_FORM);
    }

    setSubmitting(false);
  }, [selectedLine, view]);

  const keyword = search.trim().toLowerCase();
  const filteredLines = lines.filter((line) => {
    if (!keyword) {
      return true;
    }

    return [line.name, line.description]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  });

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (view === "edit" && selectedLine) {
        await updateLine(selectedLine.id, form);
      } else {
        await createLine(form);
      }

      await onRefresh();
      window.setTimeout(() => {
        onCloseDetail();
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
    onCloseDetail();
  };

  useEffect(() => {
    if (!isEditView || !selectedLine) {
      return undefined;
    }

    if (!isAutoSaveReadyRef.current) {
      isAutoSaveReadyRef.current = true;
      return undefined;
    }

    const initialName = selectedLine.name || "";
    const initialDescription = selectedLine.description || "";
    const isUnchanged =
      form.name === initialName && form.description === initialDescription;

    if (isUnchanged) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setSubmitting(true);
        await updateLine(selectedLine.id, form);
        await onRefresh();
      } finally {
        setSubmitting(false);
      }
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [form, isEditView, onRefresh, selectedLine]);

  if (isCreateView || isEditView) {
    return (
      <Stack>
        <AdminDetailHeader
          title={isEditView ? "แก้ไขสายการผลิต" : "เพิ่มสายการผลิต"}
          onBack={onCloseDetail}
        />

        {isEditView && !loading && !selectedLine ? (
          <ErrorState
            message="ไม่พบสายการผลิตที่ต้องการแก้ไข"
            onRetry={onCloseDetail}
          />
        ) : (
          <>
            <MobileCard className="p-4 sm:p-5">
              <form
                className="space-y-4"
                onSubmit={
                  isCreateView
                    ? handleSubmit
                    : (event) => event.preventDefault()
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
                      disabled={submitting}
                    >
                      {submitting ? "กำลังบันทึก..." : "สร้างสายการผลิต"}
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
                      disabled={submitting}
                    >
                      ลบข้อมูล
                    </Button>
                  </div>
                ) : null}
              </form>
            </MobileCard>
          </>
        )}
      </Stack>
    );
  }

  if (isProcessListView) {
    if (!loading && !selectedLine) {
      return (
        <ErrorState
          message="ไม่พบสายการผลิตที่ต้องการจัดการขั้นตอน"
          onRetry={onCloseDetail}
        />
      );
    }

    return selectedLine ? (
      <ProcessList
        line={selectedLine}
        onBack={() => onBackFromProcesses(selectedLine.id)}
        onCreate={onCreateProcess}
        onEdit={onEditProcess}
      />
    ) : (
      <LoadingState message="กำลังเตรียมข้อมูลสายการผลิต..." />
    );
  }

  if (isProcessCreateView || isProcessEditView) {
    if (!loading && !selectedLine) {
      return (
        <ErrorState
          message="ไม่พบสายการผลิตที่ต้องการจัดการขั้นตอน"
          onRetry={onCloseDetail}
        />
      );
    }

    return selectedLine ? (
      <ProcessEditor
        line={selectedLine}
        processId={selectedProcessId}
        mode={view}
        onBack={() => onBackToProcesses(selectedLine.id)}
      />
    ) : (
      <LoadingState message="กำลังเตรียมข้อมูลขั้นตอน..." />
    );
  }

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
            onClick={onCreate}
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
              <Button onClick={onCreate}>เพิ่มสายการผลิตแรก</Button>
            ) : null
          }
        />
      ) : null}

      {!loading && !error && filteredLines.length > 0 ? (
        <>
          <Stack className="md:hidden">
            {filteredLines.map((line) => (
              <MobileCard
                key={line.id}
                className="border-2 border-neutral-200 transition-all hover:border-info-200"
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => onEdit(line.id)}
                >
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-neutral-900 sm:text-lg">
                      {line.name}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-500">
                      {line.description || "ไม่มีรายละเอียด"}
                    </p>
                  </div>
                </button>
              </MobileCard>
            ))}
          </Stack>

          <DataTable
            columns={[
              { key: "name", label: "ชื่อสายการผลิต" },
              { key: "description", label: "รายละเอียด" },
            ]}
          >
            {filteredLines.map((line) => (
              <tr
                key={line.id}
                className="cursor-pointer hover:bg-neutral-50/80"
                onClick={() => onEdit(line.id)}
              >
                <td className="px-5 py-4 font-semibold text-neutral-900">
                  {line.name}
                </td>
                <td className="px-5 py-4 text-neutral-500">
                  {line.description || "—"}
                </td>
              </tr>
            ))}
          </DataTable>
        </>
      ) : null}
    </AdminSection>
  );
}

function ProcessList({ line, onBack, onCreate, onEdit }) {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingOrder, setSavingOrder] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const loadProcesses = async () => {
    try {
      setError("");
      setLoading(true);
      const data = await getProcesses(line.id);
      setProcesses(
        [...data].sort(
          (left, right) => Number(left.sequence) - Number(right.sequence),
        ),
      );
    } catch (err) {
      setError(err.message || "โหลดข้อมูลขั้นตอนไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProcesses();
  }, [line.id]);

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id || savingOrder) {
      return;
    }

    const oldIndex = processes.findIndex(
      (processItem) => String(processItem.id) === String(active.id),
    );
    const newIndex = processes.findIndex(
      (processItem) => String(processItem.id) === String(over.id),
    );

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const previousProcesses = processes;
    const reorderedProcesses = arrayMove(processes, oldIndex, newIndex).map(
      (processItem, index) => ({
        ...processItem,
        sequence: index + 1,
      }),
    );

    setProcesses(reorderedProcesses);
    setSavingOrder(true);
    setError("");

    try {
      const changedProcesses = reorderedProcesses.filter(
        (processItem, index) => {
          const previousProcess = previousProcesses.find(
            (item) => String(item.id) === String(processItem.id),
          );
          return Number(previousProcess?.sequence) !== index + 1;
        },
      );

      await Promise.all(
        changedProcesses.map((processItem) =>
          updateProcess(processItem.id, {
            name: processItem.name,
            sequence: processItem.sequence,
            description: processItem.description,
          }),
        ),
      );
    } catch (err) {
      setProcesses(previousProcesses);
      setError(err.message || "บันทึกลำดับขั้นตอนไม่สำเร็จ");
    } finally {
      setSavingOrder(false);
    }
  };

  return (
    <Stack>
      <AdminDetailHeader
        title={`${line.name}`}
        onBack={onBack}
        action={
          <Button
            type="button"
            variant="secondary"
            onClick={() => onCreate(line.id)}
          >
            + เพิ่ม
          </Button>
        }
      />

      {!loading && !error ? (
        <p className="text-sm text-neutral-500">
          ลากที่ปุ่มด้านขวาของแต่ละรายการเพื่อสลับลำดับขั้นตอน
        </p>
      ) : null}

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={processes.map((processItem) => String(processItem.id))}
            strategy={verticalListSortingStrategy}
          >
            <Stack>
              {processes.map((processItem) => (
                <SortableProcessRow
                  key={processItem.id}
                  processItem={processItem}
                  disabled={savingOrder}
                  onEdit={() => onEdit(line.id, processItem.id)}
                />
              ))}
            </Stack>
          </SortableContext>
        </DndContext>
      ) : null}
    </Stack>
  );
}

function SortableProcessRow({ processItem, disabled, onEdit }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: String(processItem.id),
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={joinClasses(
        "flex w-full items-start gap-3 rounded-[22px] border border-neutral-200 bg-white p-4 text-left sm:items-center sm:justify-between",
        isDragging ? "shadow-lg ring-2 ring-primary-200" : "",
      )}
    >
      <button
        type="button"
        onClick={onEdit}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
          {processItem.sequence}
        </div>
        <div className="min-w-0">
          <h5 className="font-semibold text-neutral-900">{processItem.name}</h5>
          {processItem.description ? (
            <p className="mt-1 text-sm text-neutral-500">
              {processItem.description}
            </p>
          ) : null}
        </div>
      </button>

      <button
        type="button"
        aria-label={`ลากเพื่อสลับลำดับ ${processItem.name}`}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-400 transition hover:bg-neutral-50 hover:text-neutral-700"
        {...attributes}
        {...listeners}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01"
          />
        </svg>
      </button>
    </div>
  );
}

function ProcessEditor({ line, processId, mode, onBack }) {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isAutoSaveReadyRef = useRef(false);
  const [form, setForm] = useState({
    name: "",
    sequence: "",
    description: "",
  });

  const isEditMode = mode === "process-edit";
  const selectedProcess = isEditMode
    ? processes.find(
        (processItem) => String(processItem.id) === String(processId),
      ) || null
    : null;

  const loadProcesses = async () => {
    try {
      setError("");
      setLoading(true);
      const data = await getProcesses(line.id);
      setProcesses(data);
    } catch (err) {
      setError(err.message || "โหลดข้อมูลขั้นตอนไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProcesses();
  }, [line.id]);

  useEffect(() => {
    if (isEditMode && selectedProcess) {
      isAutoSaveReadyRef.current = false;
      setForm({
        name: selectedProcess.name || "",
        sequence: String(selectedProcess.sequence || ""),
        description: selectedProcess.description || "",
      });
    }

    if (!isEditMode) {
      isAutoSaveReadyRef.current = false;
      setForm({ name: "", sequence: "", description: "" });
    }
  }, [isEditMode, selectedProcess]);

  useEffect(() => {
    if (!isEditMode || !selectedProcess) {
      return undefined;
    }

    if (!isAutoSaveReadyRef.current) {
      isAutoSaveReadyRef.current = true;
      return undefined;
    }

    const initialName = selectedProcess.name || "";
    const initialSequence = String(selectedProcess.sequence || "");
    const initialDescription = selectedProcess.description || "";
    const isUnchanged =
      form.name === initialName &&
      form.sequence === initialSequence &&
      form.description === initialDescription;

    if (isUnchanged) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setSubmitting(true);
        await updateProcess(selectedProcess.id, {
          name: form.name,
          sequence: Number(form.sequence),
          description: form.description,
        });
        await loadProcesses();
      } catch (err) {
        setError(err.message || "บันทึกขั้นตอนไม่สำเร็จ");
      } finally {
        setSubmitting(false);
      }
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [form, isEditMode, selectedProcess]);

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

      {error ? <ErrorState message={error} onRetry={loadProcesses} /> : null}

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
                disabled={submitting}
              >
                ลบข้อมูล
              </Button>
            </FormActions>
          ) : (
            <FormActions>
              <Button
                type="submit"
                className="w-full sm:flex-1"
                disabled={submitting}
              >
                {submitting ? "กำลังบันทึก..." : "+ เพิ่มขั้นตอน"}
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
