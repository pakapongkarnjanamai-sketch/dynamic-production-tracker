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
		<div className="min-h-screen bg-[#F2F2F7] pb-24 md:pb-0">
			<div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-4 sm:px-6 md:px-8 md:py-6">
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

				<div className="min-w-0 flex-1 space-y-4 sm:space-y-6">
					<div className="space-y-4 sm:space-y-6">{children}</div>
				</div>
			</div>

			<nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
				<div className="grid grid-cols-4 gap-1 px-2 pb-safe pt-2">
					{menus.map((menu) => {
						const isActive = menu.id === activeMenu;
						return (
							<button
								key={menu.id}
								type="button"
								onClick={() => onMenuChange(menu.id)}
								className={joinClasses(
									'flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-semibold transition-colors',
									isActive ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700',
								)}
							>
								<span className={joinClasses('h-5 w-5', isActive ? 'text-white' : 'text-slate-400')}>{menu.icon}</span>
								<span className="truncate">{menu.shortLabel || menu.label}</span>
							</button>
						);
					})}
				</div>
			</nav>
		</div>
	);
}
