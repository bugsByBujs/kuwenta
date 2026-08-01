export function ScreenHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-3 px-4 pb-2 pt-6">
      <div>
        <h1 className="text-[2.8rem] leading-none">{title}</h1>
        {subtitle && <p className="mt-1 text-[1.4rem] text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
