import { useState } from "react";
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
import { updateProcess } from "../../../api/client";
import useLineProcesses from "../../../hooks/useLineProcesses";
import {
  AdminDetailHeader,
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  Stack,
  joinClasses,
} from "../AdminUI";

export default function ProcessListView({ line, onBack, onCreate, onEdit }) {
  const [savingOrder, setSavingOrder] = useState(false);
  const { processes, setProcesses, loading, error, setError, reload } =
    useLineProcesses(line.id);

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
        <ErrorState message={error} onRetry={reload} />
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
