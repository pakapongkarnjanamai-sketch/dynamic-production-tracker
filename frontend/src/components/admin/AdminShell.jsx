import { joinClasses } from './AdminUI';

export default function AdminShell({
	title,
	description,
	menus,
	activeMenu,
	onMenuChange,
	action,
	children,
}) {
	return (
		<div className="min-h-screen bg-white pb-24 md:pb-0">
			<div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-4 sm:px-6 md:px-8 md:py-6 flex-col md:flex-row">
				<aside className="sticky top-20 hidden w-72 shrink-0 self-start flex-col rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm md:flex">
					<div className="border-b border-slate-100 px-3 pb-4 pt-2">
						<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Admin Console</p>
						<h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">การจัดการระบบ</h2>
					</div>

					<nav className="mt-4 space-y-2">
						{menus.map((menu) => {
							const isActive = menu.id === activeMenu;
							return (
								<button
									key={menu.id}
									type="button"
									onClick={() => onMenuChange(menu.id)}
									className={joinClasses(
										'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-colors',
										isActive
											? 'bg-slate-900 text-white shadow-sm'
											: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
									)}
								>
									<span className={joinClasses('shrink-0', isActive ? 'text-white' : 'text-slate-400')}>{menu.icon}</span>
									<span className="truncate">{menu.label}</span>
								</button>
							);
						})}
					</nav>
				</aside>

				<div className="min-w-0 flex-1 flex flex-col gap-4">
					<div className="md:hidden flex gap-2 overflow-x-auto pb-1 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
						{menus.map((menu) => {
							const isActive = menu.id === activeMenu;
							return (
								<button
									key={menu.id}
									type="button"
									onClick={() => onMenuChange(menu.id)}
									className={joinClasses(
										'flex min-w-[100px] shrink-0 items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-colors',
										isActive
											? 'border-slate-900 bg-slate-900 text-white shadow-sm'
											: 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900',
									)}
								>
									<span className={joinClasses('shrink-0', isActive ? 'text-white' : 'text-slate-400')}>{menu.icon}</span>
									<span className="truncate">{menu.shortLabel || menu.label}</span>
								</button>
							);
						})}
					</div>

					<div>{children}</div>
				</div>
			</div>
		</div>
	);
}
