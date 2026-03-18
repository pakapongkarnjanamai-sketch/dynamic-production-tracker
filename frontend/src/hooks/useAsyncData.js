import { useCallback, useEffect, useRef, useState } from "react";

export default function useAsyncData(
  loadData,
  { enabled = true, initialData, getErrorMessage } = {},
) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);
  const getErrorMessageRef = useRef(getErrorMessage);

  useEffect(() => {
    getErrorMessageRef.current = getErrorMessage;
  }, [getErrorMessage]);

  const reload = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);
    setError("");

    try {
      const nextData = await loadData();
      if (requestIdRef.current !== requestId) {
        return undefined;
      }

      setData(nextData);
      return nextData;
    } catch (err) {
      if (requestIdRef.current !== requestId) {
        return undefined;
      }

      const nextError = getErrorMessageRef.current
        ? getErrorMessageRef.current(err)
        : err?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล";

      setError(nextError);
      return undefined;
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [loadData]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return undefined;
    }

    reload();

    return () => {
      requestIdRef.current += 1;
    };
  }, [enabled, reload]);

  return {
    data,
    setData,
    loading,
    error,
    reload,
  };
}
