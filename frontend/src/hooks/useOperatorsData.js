import { useMemo } from "react";
import { getOperators } from "../api/client";
import useAdminResourceData from "./useAdminResourceData";

export default function useOperatorsData() {
  const loadOperators = useMemo(() => () => getOperators(), []);
  const {
    data: operators,
    loading,
    error,
    setError,
    reload,
  } = useAdminResourceData(loadOperators, {
    initialData: [],
    getErrorMessage: (err) => err?.message || "โหลดข้อมูลพนักงานไม่สำเร็จ",
  });

  return {
    operators,
    loading,
    error,
    setError,
    reload,
  };
}
