import { useState } from "react";
import useUsersAdminData from "../../hooks/useUsersAdminData";
import UserEditorView from "./users/UserEditorView";
import UserListView from "./users/UserListView";

export default function UsersSection({
  currentRole,
  view = "",
  selectedId = "",
  onCreate,
  onEdit,
  onCloseDetail,
}) {
  const [search, setSearch] = useState("");
  const { users, operators, loading, error, setError, reload } =
    useUsersAdminData();

  const selectedUser =
    view === "edit"
      ? users.find((user) => String(user.id) === String(selectedId)) || null
      : null;

  if (view === "create" || view === "edit") {
    return (
      <UserEditorView
        currentRole={currentRole}
        mode={view}
        loading={loading}
        error={error}
        setError={setError}
        operators={operators}
        selectedUser={selectedUser}
        onRefresh={reload}
        onClose={onCloseDetail}
      />
    );
  }

  return (
    <UserListView
      users={users}
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
