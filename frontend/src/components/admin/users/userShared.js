export const EMPTY_USER_FORM = {
  employeeId: "",
  name: "",
  password: "",
  role: "operator",
  operatorId: "",
  isActive: true,
};

export function getUserRoleOptions(currentRole) {
  return currentRole === "superadmin"
    ? ["superadmin", "admin", "operator", "viewer"]
    : ["operator", "viewer"];
}

export function buildUserFormValues(user) {
  if (!user) {
    return EMPTY_USER_FORM;
  }

  return {
    employeeId: user.employee_id || "",
    name: user.name || "",
    password: "",
    role: user.role || "operator",
    operatorId: user.operator_id ? String(user.operator_id) : "",
    isActive: Boolean(user.is_active),
  };
}

export function buildUserPayload(form, { includePassword = false } = {}) {
  const payload = {
    employee_id: form.employeeId,
    name: form.name,
    role: form.role,
    operator_id: form.operatorId ? Number(form.operatorId) : null,
    is_active: form.isActive,
  };

  if (includePassword && form.password) {
    payload.password = form.password;
  }

  return payload;
}

export function getUserRoleBadgeColor(role) {
  return role === "admin" || role === "superadmin" ? "blue" : "gray";
}
