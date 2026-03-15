const BUTTON_STYLES = {
	primary: 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950',
	secondary: 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100',
	danger: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 active:bg-red-200',
	text: 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100',
};

const BADGE_STYLES = {
	gray: 'border-slate-200 bg-slate-100 text-slate-600',
	amber: 'border-amber-200 bg-amber-100 text-amber-700',
	green: 'border-emerald-200 bg-emerald-100 text-emerald-700',
	red: 'border-red-200 bg-red-100 text-red-700',
	blue: 'border-sky-200 bg-sky-100 text-sky-700',
};

const BUTTON_SIZES = {
	default: 'min-h-10 px-3.5 py-2 text-sm',
	compact: 'min-h-8 px-3 py-1.5 text-[13px]',
};

function joinClasses(...values) {
	return values.filter(Boolean).join(' ');
}

export function AdminPageHeader({ eyebrow, title, description, action }) {
	return (
		<div className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div className="space-y-2">
					{eyebrow ? (
						<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
							{eyebrow}
						</p>
					) : null}
					<div className="space-y-1">
						<h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
							{title}
						</h1>
						{description ? <p className="max-w-3xl text-sm text-slate-500 sm:text-base">{description}</p> : null}
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
		<section className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
			{hasHeader ? (
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					{title || description ? (
						<div className="space-y-1">
							{title ? <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h2> : null}
							{description ? <p className="text-sm text-slate-500">{description}</p> : null}
						</div>
					) : null}
					{action ? <div className={joinClasses('w-full', title || description ? 'sm:w-auto' : '')}>{action}</div> : null}
				</div>
			) : null}
			{children}
		</section>
	);
}

export function Button({ children, className = '', variant = 'primary', size = 'default', type = 'button', ...props }) {
	return (
		<button
			type={type}
			className={joinClasses(
				'inline-flex items-center justify-center rounded-xl border font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:opacity-50',
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

export function Input({ label, as = 'input', className = '', hint, children, ...props }) {
	const Element = as;

	return (
		<label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
			{label ? <span>{label}</span> : null}
			<Element
				className={joinClasses(
					'min-h-12 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10',
					as === 'textarea' ? 'resize-y' : '',
					className,
				)}
				{...props}
			>
				{children}
			</Element>
			{hint ? <span className="text-xs font-normal text-slate-400">{hint}</span> : null}
		</label>
	);
}

export function Badge({ children, color = 'gray', className = '' }) {
	return (
		<span
			className={joinClasses(
				'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide',
				BADGE_STYLES[color] || BADGE_STYLES.gray,
				className,
			)}
		>
			{children}
		</span>
	);
}

export function Modal({ title, description, isOpen, onClose, children, footer }) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 bg-slate-950/45 px-4 pb-safe pt-6 backdrop-blur-sm sm:px-6">
			<div className="mx-auto flex min-h-full max-w-xl items-end sm:items-center">
				<div className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
					<div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
						<div className="space-y-1">
							<h3 className="text-lg font-bold text-slate-900">{title}</h3>
							{description ? <p className="text-sm text-slate-500">{description}</p> : null}
						</div>
						<button
							type="button"
							onClick={onClose}
							className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
							aria-label="ปิดหน้าต่าง"
						>
							<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
					<div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
					{footer ? <div className="border-t border-slate-100 px-5 py-4 sm:px-6">{footer}</div> : null}
				</div>
			</div>
		</div>
	);
}

export function SaveMessage({ message }) {
	if (!message) return null;

	const isError = !message.includes('สำเร็จ');

	return (
		<div
			className={joinClasses(
				'rounded-2xl px-4 py-3 text-sm font-semibold',
				isError ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700',
			)}
		>
			{message}
		</div>
	);
}

export function LoadingState({ message = 'กำลังโหลด...' }) {
	return (
		<div className="rounded-[24px] border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm font-medium text-slate-500">
			{message}
		</div>
	);
}

export function ErrorState({ message = 'เกิดข้อผิดพลาดในการโหลดข้อมูล', onRetry }) {
	return (
		<div className="space-y-4 rounded-[24px] border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-700">
			<p>{message}</p>
			{onRetry ? (
				<Button variant="secondary" className="w-full sm:w-auto" onClick={onRetry}>
					ลองใหม่
				</Button>
			) : null}
		</div>
	);
}

export function EmptyState({ title, description, action }) {
	return (
		<div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
			<div className="mx-auto max-w-sm space-y-2">
				<h3 className="text-base font-bold text-slate-900">{title}</h3>
				{description ? <p className="text-sm text-slate-500">{description}</p> : null}
			</div>
			{action ? <div className="mt-4">{action}</div> : null}
		</div>
	);
}

export function MobileCard({ children, className = '' }) {
	return <div className={joinClasses('rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm', className)}>{children}</div>;
}

export function DataTable({ columns, children }) {
	return (
		<div className="hidden overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm md:block">
			<table className="w-full text-left text-sm">
				<thead className="bg-slate-50 text-slate-500">
					<tr>
						{columns.map((column) => (
							<th key={column.key} className={joinClasses('px-5 py-4 font-semibold', column.className)}>
								{column.label}
							</th>
						))}
					</tr>
				</thead>
				<tbody className="divide-y divide-slate-100">{children}</tbody>
			</table>
		</div>
	);
}

export function SearchInput(props) {
	return (
		<Input
			{...props}
			className={joinClasses('bg-white', props.className)}
		/>
	);
}

export function FormActions({ children }) {
	return <div className="flex flex-wrap gap-2">{children}</div>;
}

export function Stack({ children, className = '' }) {
	return <div className={joinClasses('space-y-4', className)}>{children}</div>;
}

export { joinClasses };
