export const EMPTY_OPERATOR_FORM = {
  name: "",
  employeeId: "",
  department: "",
  isActive: true,
};

export function buildOperatorFormValues(operator) {
  if (!operator) {
    return EMPTY_OPERATOR_FORM;
  }

  return {
    name: operator.name || "",
    employeeId: operator.employee_id || "",
    department: operator.department || "",
    isActive: Boolean(operator.is_active),
  };
}

export function buildOperatorPayload(form) {
  return {
    name: form.name,
    employee_id: form.employeeId || null,
    department: form.department || null,
    is_active: form.isActive,
  };
}
