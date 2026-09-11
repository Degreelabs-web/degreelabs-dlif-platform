"use client";

import { useEffect, useRef, useState } from "react";
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
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                aria-label={`Actions for ${label}`}
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
                <EllipsisVertical className="h-4 w-4" />
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                >
                    {onView && (
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                setOpen(false);
                                onView();
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
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
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
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
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4" />
                                {deleteLabel}
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}