"use client";

import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  breadcrumbs?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  badge,
  breadcrumbs,
  action,
}: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="space-y-1 min-w-0">
        {breadcrumbs && <div className="mb-1">{breadcrumbs}</div>}
        {badge && <div className="mb-1.5 flex flex-wrap items-center gap-2">{badge}</div>}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="text-muted-dl max-w-3xl">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2.5 shrink-0 pt-1 sm:pt-0">{action}</div>}
    </header>
  );
}
