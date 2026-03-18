import { useCallback, useEffect, useRef, useState } from "react";

export default function useAdminResourceData(
  loadData,
  { initialData, getErrorMessage } = {},
) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);
  const getErrorMessageRef = useRef(getErrorMessage);

  useEffect(() => {
    getErrorMessageRef.current = getErrorMessage;
  }, [getErrorMessage]);

  const reload = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setError("");
    setLoading(true);

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

      setError(
        getErrorMessageRef.current
          ? getErrorMessageRef.current(err)
          : err?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      );
      return undefined;
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [loadData]);

  useEffect(() => {
    reload();

    return () => {
      requestIdRef.current += 1;
    };
  }, [reload]);

  return {
    data,
    setData,
    loading,
    error,
    setError,
    reload,
  };
}
