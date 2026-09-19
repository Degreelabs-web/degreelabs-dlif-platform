"use client";

import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  subvalue?: ReactNode;
  pill?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  subvalue,
  pill,
  icon,
  className = "",
}: StatCardProps) {
  return (
    <div className={`card-custom flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="stat-value">{value}</span>
          {subvalue && <span className="text-xs text-slate-400 font-normal">{subvalue}</span>}
        </div>
        {pill && <div>{pill}</div>}
      </div>
    </div>
  );
}
