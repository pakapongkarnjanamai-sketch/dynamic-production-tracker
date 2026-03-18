import { useState } from "react";
import { ErrorState, LoadingState } from "./AdminUI";
import LineEditorView from "./lines/LineEditorView";
import LineListView from "./lines/LineListView";
import ProcessEditorView from "./lines/ProcessEditorView";
import ProcessListView from "./lines/ProcessListView";

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
  const isEditView = view === "edit";
  const isCreateView = view === "create";
  const isProcessListView = view === "processes";
  const isProcessCreateView = view === "process-create";
  const isProcessEditView = view === "process-edit";

  const selectedLine =
    isEditView || isProcessListView || isProcessCreateView || isProcessEditView
      ? lines.find((line) => String(line.id) === String(selectedId)) || null
      : null;

  if (isCreateView || isEditView) {
    return (
      <LineEditorView
        mode={view}
        loading={loading}
        selectedLine={selectedLine}
        onRefresh={onRefresh}
        onClose={onCloseDetail}
        onManageProcesses={onManageProcesses}
      />
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
      <ProcessListView
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
      <ProcessEditorView
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
    <LineListView
      lines={lines}
      loading={loading}
      error={error}
      search={search}
      onSearchChange={setSearch}
      onCreate={onCreate}
      onEdit={onEdit}
      onRefresh={onRefresh}
    />
  );
}
