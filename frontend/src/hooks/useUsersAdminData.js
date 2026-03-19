import { useMemo } from "react";
import { getUsers } from "../api/client";
import useAdminResourceData from "./useAdminResourceData";

export default function useUsersAdminData() {
  const loadUsersAdminData = useMemo(
    () => async () => {
      const userData = await getUsers();
      return { users: userData };
    },
    [],
  );
  const { data, loading, error, setError, reload } = useAdminResourceData(
    loadUsersAdminData,
    {
      initialData: { users: [] },
      getErrorMessage: (err) =>
        err?.message || "โหลดข้อมูลบัญชีผู้ใช้ไม่สำเร็จ",
    },
  );

  return {
    users: data.users,
    loading,
    error,
    setError,
    reload,
  };
}
