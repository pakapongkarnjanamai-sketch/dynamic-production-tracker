import { useEffect, useRef, useState } from "react";
import { getProcesses } from "../api/client";

function sortProcessesBySequence(processes) {
  return [...processes].sort(
    (left, right) => Number(left.sequence) - Number(right.sequence),
  );
}

export default function useLineProcesses(lineId) {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(Boolean(lineId));
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  const loadProcesses = async () => {
    if (!lineId) {
      setProcesses([]);
      setLoading(false);
      setError("");
      return [];
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      setError("");
      setLoading(true);
      const data = await getProcesses(lineId);

      if (requestId !== requestIdRef.current) {
        return [];
      }

      const nextProcesses = sortProcessesBySequence(data);
      setProcesses(nextProcesses);
      return nextProcesses;
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setError(err.message || "โหลดข้อมูลขั้นตอนไม่สำเร็จ");
      }
      return [];
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadProcesses();
  }, [lineId]);

  return {
    processes,
    setProcesses,
    loading,
    error,
    setError,
    reload: loadProcesses,
  };
}
