"use client";

import { ReactNode } from "react";

interface SectionCardProps {
  title?: string;
  icon?: ReactNode;
  description?: string;
  badge?: ReactNode;
  headerAction?: ReactNode;
  footerAction?: ReactNode;
  children: ReactNode;
  className?: string;
  isClickable?: boolean;
}

export function SectionCard({
  title,
  icon,
  description,
  badge,
  headerAction,
  footerAction,
  children,
  className = "",
  isClickable = false,
}: SectionCardProps) {
  return (
    <section
      className={`card-custom flex flex-col justify-between ${
        !isClickable ? "hover:!shadow-[var(--dl-shadow-subtle)] hover:!border-[#e2e8f0]" : ""
      } ${className}`}
    >
      <div>
        {(title || icon || headerAction || badge) && (
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2 mb-4">
            <div className="flex items-center gap-2 min-w-0">
              {icon && <span className="shrink-0 text-brand-600">{icon}</span>}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {title && <h3 className="card-title truncate">{title}</h3>}
                  {badge}
                </div>
                {description && (
                  <p className="text-xs text-slate-500 truncate mt-0.5">{description}</p>
                )}
              </div>
            </div>
            {headerAction && <div className="shrink-0">{headerAction}</div>}
          </div>
        )}
        <div>{children}</div>
      </div>

      {footerAction && (
        <div className="pt-3 mt-4 border-t border-slate-100">{footerAction}</div>
      )}
    </section>
  );
}
