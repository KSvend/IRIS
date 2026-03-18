interface Props {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function Card({ children, className = "", title }: Props) {
  return (
    <div
      className={`rounded-lg bg-white shadow-[var(--shadow-soft)] ${className}`}
    >
      {title && (
        <div className="border-b border-[var(--divider)] px-6 py-4">
          <h3 className="text-[13px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)]">{title}</h3>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
