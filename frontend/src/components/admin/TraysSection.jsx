import { useState } from "react";
import useTraysData from "../../hooks/useTraysData";
import { AdminDetailHeader, ErrorState, LoadingState, Stack } from "./AdminUI";
import TrayEditorView from "./trays/TrayEditorView";
import TrayListView from "./trays/TrayListView";
import TrayLogsView from "./trays/TrayLogsView";
import TrayQrModal from "./trays/TrayQrModal";

export default function TraysSection({
  lines,
  view = "",
  selectedId = "",
  onCreate,
  onEdit,
  onViewLogs,
  onBackFromLogs,
  onCloseDetail,
}) {
  const [search, setSearch] = useState("");
  const [qrTray, setQrTray] = useState(null);
  const { trays, loading, error, setError, reload } = useTraysData();

  const selectedTray =
    view === "edit" || view === "logs"
      ? trays.find((tray) => String(tray.id) === String(selectedId)) || null
      : null;

  const openQrModal = (tray) => {
    setQrTray(tray);
  };

  const closeQrModal = () => {
    setQrTray(null);
  };

  if (view === "create" || view === "edit") {
    return (
      <>
        <TrayEditorView
          lines={lines}
          mode={view}
          loading={loading}
          error={error}
          setError={setError}
          selectedTray={selectedTray}
          onRefresh={reload}
          onClose={onCloseDetail}
          onViewLogs={onViewLogs}
          onOpenQr={openQrModal}
        />

        <TrayQrModal
          tray={qrTray}
          isOpen={Boolean(qrTray)}
          onClose={closeQrModal}
        />
      </>
    );
  }

  if (view === "logs") {
    if (!loading && !selectedTray) {
      return (
        <ErrorState
          message="ไม่พบงานที่ต้องการดูประวัติ"
          onRetry={onCloseDetail}
        />
      );
    }

    return selectedTray ? (
      <Stack>
        <AdminDetailHeader
          title={`ประวัติ: ${selectedTray.qr_code}`}
          onBack={() => onBackFromLogs(selectedTray.id)}
        />
        <TrayLogsView trayId={selectedTray.id} />
      </Stack>
    ) : (
      <LoadingState message="กำลังเตรียมข้อมูลประวัติงาน..." />
    );
  }

  return (
    <>
      <TrayListView
        trays={trays}
        loading={loading}
        error={error}
        search={search}
        onSearchChange={setSearch}
        onCreate={onCreate}
        onEdit={onEdit}
        onRefresh={reload}
        onOpenQr={openQrModal}
      />

      <TrayQrModal
        tray={qrTray}
        isOpen={Boolean(qrTray)}
        onClose={closeQrModal}
      />
    </>
  );
}
