"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    EllipsisVertical,
    Eye,
    Pencil,
    Trash2,
} from "lucide-react";

interface EntityActionsMenuProps {
    label: string;
    onView?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    deleteLabel?: string;
}

export function EntityActionsMenu({
    label,
    onView,
    onEdit,
    onDelete,
    deleteLabel = "Delete",
}: EntityActionsMenuProps) {
    const [open, setOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    function openMenu(button: HTMLButtonElement) {
        const rect = button.getBoundingClientRect();
        const menuWidth = 176;
        const actionCount = [onView, onEdit, onDelete].filter(Boolean).length;
        const hasDeleteDivider = Boolean(onDelete && (onView || onEdit));
        const menuHeight = actionCount * 42 + (hasDeleteDivider ? 9 : 0) + 12;
        const gap = 8;
        const viewportPadding = 12;
        const spaceBelow = window.innerHeight - rect.bottom;
        const top =
            spaceBelow >= menuHeight + gap
                ? rect.bottom + gap
                : Math.max(viewportPadding, rect.top - menuHeight - gap);
        const left = Math.min(
            window.innerWidth - menuWidth - viewportPadding,
            Math.max(viewportPadding, rect.right - menuWidth)
        );

        setMenuPosition({ top, left });
        setOpen(true);
    }

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node) &&
                !menuRef.current?.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setOpen(false);
            }
        }

        function closeMenu() {
            setOpen(false);
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        window.addEventListener("resize", closeMenu);
        window.addEventListener("scroll", closeMenu, true);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
            window.removeEventListener("resize", closeMenu);
            window.removeEventListener("scroll", closeMenu, true);
        };
    }, []);

    return (
        <div ref={containerRef} className="relative shrink-0">
            <button
                type="button"
                aria-label={`Actions for ${label}`}
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={(event) => {
                    if (open) {
                        setOpen(false);
                    } else {
                        openMenu(event.currentTarget);
                    }
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-slate-500 hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700"
            >
                <EllipsisVertical className="h-4 w-4" />
            </button>

            {open && typeof document !== "undefined" && createPortal(
                <div
                    ref={menuRef}
                    role="menu"
                    aria-label={`Actions for ${label}`}
                    style={{ top: menuPosition.top, left: menuPosition.left }}
                    className="fixed z-[100] w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 text-left shadow-xl shadow-blue-950/15"
                >
                    {onView && (
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                setOpen(false);
                                onView();
                            }}
                            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700"
                        >
                            <Eye className="h-4 w-4" />
                            View details
                        </button>
                    )}

                    {onEdit && (
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                setOpen(false);
                                onEdit();
                            }}
                            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700"
                        >
                            <Pencil className="h-4 w-4" />
                            Edit
                        </button>
                    )}

                    {onDelete && (
                        <>
                            <div className="my-1 border-t border-slate-100" />

                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    setOpen(false);
                                    onDelete();
                                }}
                                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4" />
                                {deleteLabel}
                            </button>
                        </>
                    )}
                </div>,
                document.body
            )}
        </div>
    );
}
