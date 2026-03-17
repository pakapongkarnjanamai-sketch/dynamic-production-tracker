import { joinClasses } from "./AdminUI";

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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-3 py-2.5 sm:px-6 sm:py-4 md:flex-row md:gap-6 md:px-8 md:py-6">
        <aside className="sticky top-20 hidden w-72 shrink-0 self-start flex-col rounded-[32px] border border-neutral-200 bg-white p-4 shadow-sm md:flex">
          <div className="border-b border-neutral-100 px-3 pb-4 pt-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-400">
              Admin Console
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-neutral-900">
              การจัดการระบบ
            </h2>
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
                    "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-primary-600 text-white shadow-sm"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
                  )}
                >
                  <span
                    className={joinClasses(
                      "shrink-0",
                      isActive ? "text-white" : "text-neutral-400",
                    )}
                  >
                    {menu.icon}
                  </span>
                  <span className="truncate">{menu.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex flex-1 flex-col gap-3 sm:gap-4">
          <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-1 hide-scrollbar sm:-mx-6 sm:gap-2 sm:px-6 md:hidden">
            {menus.map((menu) => {
              const isActive = menu.id === activeMenu;
              return (
                <button
                  key={menu.id}
                  type="button"
                  onClick={() => onMenuChange(menu.id)}
                  className={joinClasses(
                    "flex min-w-[84px] shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors sm:min-w-[92px] sm:gap-2 sm:rounded-2xl",
                    isActive
                      ? "border-primary-600 bg-primary-600 text-white shadow-sm"
                      : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
                  )}
                >
                  <span
                    className={joinClasses(
                      "shrink-0",
                      isActive ? "text-white" : "text-neutral-400",
                    )}
                  >
                    {menu.icon}
                  </span>
                  <span className="truncate">
                    {menu.shortLabel || menu.label}
                  </span>
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
