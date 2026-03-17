const BUTTON_STYLES = {
  primary:
    "border-primary-700 bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800",
  secondary:
    "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100",
  danger:
    "border-danger-200 bg-danger-50 text-danger-700 hover:bg-danger-100 active:bg-danger-200",
  text: "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100",
};

const BADGE_STYLES = {
  gray: "border-neutral-200 bg-neutral-100 text-neutral-600",
  amber: "border-warning-200 bg-warning-100 text-warning-700",
  green: "border-success-200 bg-success-100 text-success-700",
  red: "border-danger-200 bg-danger-100 text-danger-700",
  blue: "border-info-200 bg-info-100 text-info-700",
};

const BUTTON_SIZES = {
  default: "min-h-10 px-3.5 py-2 text-sm",
  compact: "min-h-9 px-3 py-2 text-sm sm:min-h-8 sm:py-1.5 sm:text-[13px]",
};

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export function AdminPageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="rounded-[24px] border border-neutral-200 bg-white px-4 py-4 shadow-sm sm:rounded-[28px] sm:px-6 sm:py-5">
      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1.5 sm:space-y-2">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-400">
              {eyebrow}
            </p>
          ) : null}
          <div className="space-y-1">
            <h1 className="text-xl font-black tracking-tight text-neutral-900 sm:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="max-w-3xl text-sm text-neutral-500 sm:text-base">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {action ? <div className="w-full lg:w-auto">{action}</div> : null}
      </div>
    </div>
  );
}

export function AdminSection({ title, description, action, children }) {
  const hasHeader = title || description || action;

  return (
    <section className="space-y-3 sm:space-y-4">
      {hasHeader ? (
        <div className="flex flex-col gap-2.5 sm:gap-3 sm:flex-row sm:items-start sm:justify-between">
          {title || description ? (
            <div className="space-y-1">
              {title ? (
                <h2 className="text-base font-bold text-neutral-900 sm:text-xl">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p className="text-sm text-neutral-500">{description}</p>
              ) : null}
            </div>
          ) : null}
          {action ? (
            <div
              className={joinClasses(
                "w-full",
                title || description ? "sm:w-auto" : "",
              )}
            >
              {action}
            </div>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "default",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={joinClasses(
        "inline-flex items-center justify-center rounded-xl border font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-50",
        BUTTON_SIZES[size] || BUTTON_SIZES.default,
        BUTTON_STYLES[variant] || BUTTON_STYLES.primary,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  as = "input",
  className = "",
  hint,
  children,
  ...props
}) {
  const Element = as;

  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-neutral-700 sm:gap-2">
      {label ? <span>{label}</span> : null}
      <Element
        className={joinClasses(
          "min-h-12 rounded-2xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-500/10 sm:px-4 sm:py-3 sm:text-sm",
          as === "textarea" ? "resize-y" : "",
          className,
        )}
        {...props}
      >
        {children}
      </Element>
      {hint ? (
        <span className="text-xs font-normal text-neutral-400">{hint}</span>
      ) : null}
    </label>
  );
}

export function Badge({ children, color = "gray", className = "" }) {
  return (
    <span
      className={joinClasses(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide",
        BADGE_STYLES[color] || BADGE_STYLES.gray,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Modal({
  title,
  description,
  isOpen,
  onClose,
  children,
  footer,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/45 px-4 pb-safe pt-6 backdrop-blur-sm sm:px-6">
      <div className="mx-auto flex min-h-full max-w-xl items-end sm:items-center">
        <div className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-2xl sm:rounded-[28px]">
          <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-4 py-4 sm:gap-4 sm:px-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-900 sm:text-lg">
                {title}
              </h3>
              {description ? (
                <p className="text-sm text-neutral-500">{description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
              aria-label="ปิดหน้าต่าง"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            {children}
          </div>
          {footer ? (
            <div className="border-t border-neutral-100 px-4 py-4 sm:px-6">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function SaveMessage({ message }) {
  if (!message) return null;

  const isError = !message.includes("สำเร็จ");

  return (
    <div
      className={joinClasses(
        "rounded-2xl px-4 py-3 text-sm font-semibold",
        isError
          ? "bg-danger-100 text-danger-700"
          : "bg-success-100 text-success-700",
      )}
    >
      {message}
    </div>
  );
}

export function LoadingState({ message = "กำลังโหลด..." }) {
  return (
    <div className="rounded-[22px] border border-dashed border-neutral-200 bg-white px-4 py-8 text-center text-sm font-medium text-neutral-500 sm:rounded-[24px] sm:py-10">
      {message}
    </div>
  );
}

export function ErrorState({
  message = "เกิดข้อผิดพลาดในการโหลดข้อมูล",
  onRetry,
}) {
  return (
    <div className="space-y-3 rounded-[22px] border border-danger-200 bg-danger-50 px-4 py-4 text-sm text-danger-700 sm:space-y-4 sm:rounded-[24px] sm:py-5">
      <p>{message}</p>
      {onRetry ? (
        <Button
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={onRetry}
        >
          ลองใหม่
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-[22px] border border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-center sm:rounded-[24px] sm:py-10">
      <div className="mx-auto max-w-sm space-y-1.5 sm:space-y-2">
        <h3 className="text-base font-bold text-neutral-900">{title}</h3>
        {description ? (
          <p className="text-sm text-neutral-500">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function MobileCard({ children, className = "" }) {
  return (
    <div
      className={joinClasses(
        "rounded-[22px] border border-neutral-200 bg-white p-3.5 shadow-sm sm:rounded-[24px] sm:p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DataTable({ columns, children }) {
  return (
    <div className="hidden overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-sm md:block">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-50 text-neutral-500">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={joinClasses(
                  "px-5 py-4 font-semibold",
                  column.className,
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">{children}</tbody>
      </table>
    </div>
  );
}

export function SearchInput(props) {
  return (
    <Input {...props} className={joinClasses("bg-white", props.className)} />
  );
}

export function FormActions({ children }) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-2">
      {children}
    </div>
  );
}

export function Stack({ children, className = "" }) {
  return (
    <div className={joinClasses("space-y-3 sm:space-y-4", className)}>
      {children}
    </div>
  );
}

export { joinClasses };
