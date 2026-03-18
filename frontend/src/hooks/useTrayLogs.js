import { useEffect, useState } from "react";
import { getLogs } from "../api/client";

export default function useTrayLogs(trayId) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(Boolean(trayId));
  const [error, setError] = useState("");

  const reload = async () => {
    if (!trayId) {
      setLogs([]);
      setError("");
      setLoading(false);
      return [];
    }

    try {
      setError("");
      setLoading(true);
      const data = await getLogs({ tray_id: trayId });
      setLogs(data);
      return data;
    } catch (err) {
      setError(err.message || "โหลดประวัติการทำงานไม่สำเร็จ");
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [trayId]);

  return {
    logs,
    loading,
    error,
    reload,
  };
}
