import StatusBadge from './StatusBadge';

export default function ProcessCard({ process, onAction, disabled = false }) {
  const { name, sequence, last_action } = process;

  return (
    <div className="rounded-2xl border bg-white shadow-sm p-4 flex items-center justify-between gap-3">
      <div>
        <p className="text-xs text-neutral-400 font-medium mb-0.5">ขั้นตอน {sequence}</p>
        <p className="font-semibold text-neutral-800 text-lg">{name}</p>
        <StatusBadge action={last_action} />
      </div>

      {!disabled && (
        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={() => onAction(process, 'start')}
            className="bg-info-600 active:bg-info-700 text-white font-bold rounded-xl px-5 py-3 text-base shadow"
          >
            ▶ เริ่ม
          </button>
          <button
            onClick={() => onAction(process, 'finish')}
            className="bg-success-600 active:bg-success-700 text-white font-bold rounded-xl px-5 py-3 text-base shadow"
          >
            ✔ เสร็จ
          </button>
          <button
            onClick={() => onAction(process, 'ng')}
            className="bg-danger-600 active:bg-danger-700 text-white font-bold rounded-xl px-5 py-3 text-base shadow"
          >
            ✖ NG
          </button>
        </div>
      )}
    </div>
  );
}
