import { useMemo } from "react";
import { getOperators, getUsers } from "../api/client";
import useAdminResourceData from "./useAdminResourceData";

export default function useUsersAdminData() {
  const loadUsersAdminData = useMemo(
    () => async () => {
      const [userData, operatorData] = await Promise.all([
        getUsers(),
        getOperators(),
      ]);

      return {
        users: userData,
        operators: operatorData,
      };
    },
    [],
  );
  const { data, loading, error, setError, reload } = useAdminResourceData(
    loadUsersAdminData,
    {
      initialData: { users: [], operators: [] },
      getErrorMessage: (err) =>
        err?.message || "โหลดข้อมูลบัญชีผู้ใช้ไม่สำเร็จ",
    },
  );

  return {
    users: data.users,
    operators: data.operators,
    loading,
    error,
    setError,
    reload,
  };
}
