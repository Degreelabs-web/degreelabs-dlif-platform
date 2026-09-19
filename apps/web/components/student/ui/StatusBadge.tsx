"use client";

import { ReactNode } from "react";

export type StatusVariant =
  | "success"
  | "warning"
  | "danger"
  | "primary"
  | "info"
  | "purple"
  | "secondary"
  | "pink"
  | "indigo";

interface StatusBadgeProps {
  variant?: StatusVariant;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function StatusBadge({
  variant = "secondary",
  children,
  icon,
  className = "",
}: StatusBadgeProps) {
  const badgeClass = variant === "pink" ? "badge-pink" : `badge-${variant}`;

  return (
    <span className={`status-pill ${badgeClass} ${className}`}>
      {icon && <span className="mr-1 shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
