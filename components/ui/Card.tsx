interface Props {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function Card({ children, className = "", title }: Props) {
  return (
    <div
      className={`rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur ${className}`}
    >
      {title && (
        <div className="border-b border-slate-800 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
