import { useState } from "react";
import useOperatorsData from "../../hooks/useOperatorsData";
import OperatorEditorView from "./operators/OperatorEditorView";
import OperatorListView from "./operators/OperatorListView";

export default function OperatorsSection({
  view = "",
  selectedId = "",
  onCreate,
  onEdit,
  onCloseDetail,
}) {
  const [search, setSearch] = useState("");
  const { operators, loading, error, setError, reload } = useOperatorsData();

  const selectedOperator =
    view === "edit"
      ? operators.find(
          (operator) => String(operator.id) === String(selectedId),
        ) || null
      : null;

  if (view === "create" || view === "edit") {
    return (
      <OperatorEditorView
        mode={view}
        loading={loading}
        error={error}
        setError={setError}
        selectedOperator={selectedOperator}
        onRefresh={reload}
        onClose={onCloseDetail}
      />
    );
  }

  return (
    <OperatorListView
      operators={operators}
      loading={loading}
      error={error}
      search={search}
      onSearchChange={setSearch}
      onCreate={onCreate}
      onEdit={onEdit}
      onRefresh={reload}
    />
  );
}
