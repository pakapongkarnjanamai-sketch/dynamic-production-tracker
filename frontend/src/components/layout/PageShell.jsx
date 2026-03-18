import {
  AdminDetailHeader,
  AdminPageHeader,
  joinClasses,
} from "../admin/AdminUI";

export function PageShell({
  children,
  className = "",
  containerClassName = "",
}) {
  return (
    <main
      className={joinClasses("min-h-screen bg-white pb-24 md:pb-0", className)}
    >
      <div
        className={joinClasses(
          "mx-auto flex min-w-0 w-full flex-col px-3 py-2.5 sm:px-6 sm:py-4 md:px-8 md:py-6",
          containerClassName,
        )}
      >
        {children}
      </div>
    </main>
  );
}

export function AppPageShell({
  children,
  title,
  onBack,
  action,
  eyebrow,
  className = "",
  containerClassName = "",
  maxWidth = "max-w-7xl",
  gapClassName = "gap-4",
  contentClassName = "space-y-4 sm:space-y-6",
}) {
  return (
    <PageShell
      className={className}
      containerClassName={joinClasses(
        maxWidth,
        gapClassName,
        containerClassName,
      )}
    >
      <AdminPageHeader
        title={title}
        onBack={onBack}
        action={action}
        eyebrow={eyebrow}
      />
      <div className={joinClasses("min-w-0", contentClassName)}>{children}</div>
    </PageShell>
  );
}

export function DetailPageShell({
  children,
  title,
  onBack,
  action,
  className = "",
  containerClassName = "",
  maxWidth = "max-w-6xl",
  gapClassName = "gap-3 sm:gap-4",
  contentClassName = "space-y-3 sm:space-y-4",
}) {
  return (
    <PageShell
      className={className}
      containerClassName={joinClasses(
        maxWidth,
        gapClassName,
        containerClassName,
      )}
    >
      <AdminDetailHeader title={title} onBack={onBack} action={action} />
      <div className={joinClasses("min-w-0", contentClassName)}>{children}</div>
    </PageShell>
  );
}
