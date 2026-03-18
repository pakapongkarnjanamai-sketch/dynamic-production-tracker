const ACTION_STYLES = {
  start: "bg-info-100 text-info-800 border-info-300",
  finish: "bg-success-100 text-success-800 border-success-300",
  ng: "bg-danger-100 text-danger-800 border-danger-300",
  pending: "bg-neutral-100 text-neutral-600 border-neutral-300",
};

const ACTION_LABELS = {
  start: "▶ เริ่ม",
  finish: "✔ เสร็จ",
  ng: "✖ NG",
  pending: "— รอทำ",
};

export default function StatusBadge({ action = "pending" }) {
  const style = ACTION_STYLES[action] ?? ACTION_STYLES.pending;
  const label = ACTION_LABELS[action] ?? action;
  return (
    <span
      className={`inline-block border rounded-full px-3 py-0.5 text-xs font-semibold ${style}`}
    >
      {label}
    </span>
  );
}
