const ACTION_STYLES = {
  start:  'bg-green-100 text-green-800 border-green-300',
  finish: 'bg-blue-100  text-blue-800  border-blue-300',
  ng:     'bg-red-100   text-red-800   border-red-300',
  pending:'bg-gray-100  text-gray-600  border-gray-300',
};

const ACTION_LABELS = {
  start:  '▶ เริ่ม',
  finish: '✔ เสร็จ',
  ng:     '✖ NG',
  pending:'— รอดำเนินการ',
};

export default function StatusBadge({ action = 'pending' }) {
  const style = ACTION_STYLES[action] ?? ACTION_STYLES.pending;
  const label = ACTION_LABELS[action] ?? action;
  return (
    <span className={`inline-block border rounded-full px-3 py-0.5 text-xs font-semibold ${style}`}>
      {label}
    </span>
  );
}
