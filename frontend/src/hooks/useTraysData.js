import { useMemo } from "react";
import { getTrays } from "../api/client";
import useAdminResourceData from "./useAdminResourceData";

export default function useTraysData() {
  const loadTrays = useMemo(() => () => getTrays(), []);
  const {
    data: trays,
    setData: setTrays,
    loading,
    error,
    setError,
    reload,
  } = useAdminResourceData(loadTrays, {
    initialData: [],
    getErrorMessage: (err) => err?.message || "โหลดข้อมูลงานไม่สำเร็จ",
  });

  return {
    trays,
    setTrays,
    loading,
    error,
    setError,
    reload,
  };
}
