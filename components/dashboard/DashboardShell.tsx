"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/narratives", label: "Narratives" },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--page-bg)]">
      {/* Slim top header */}
      <header className="border-b border-[var(--border-subtle)] bg-white">
        <div className="mx-auto flex h-12 max-w-[1120px] items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-[15px] font-medium text-[var(--text-primary)]">
              Brace4Peace
            </Link>
            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-md px-3 py-1.5 text-[13px] transition-all duration-[150ms] ${
                      isActive
                        ? "text-[var(--text-primary)] font-medium"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">
            UNDP East Africa
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>{children}</main>
    </div>
  );
}
