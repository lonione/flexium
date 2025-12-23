export default function EmptyState({ title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border bg-background p-10 text-center shadow-sm">
      <div className="text-lg font-semibold">{title}</div>
      <div className="max-w-md text-sm text-muted-foreground">{subtitle}</div>
      {action ? <div className="pt-3">{action}</div> : null}
    </div>
  );
}
