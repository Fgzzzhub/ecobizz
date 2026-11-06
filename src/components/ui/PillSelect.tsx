'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface PillSelectOption {
  value: string;
  label: string;
  /** Visually separates the option (e.g. "add new" action) */
  isAction?: boolean;
}

interface PillSelectProps {
  value: string;
  options: PillSelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  testId?: string;
  className?: string;
  align?: 'left' | 'right';
}

/**
 * Themed dropdown that follows the Bento pill style instead of the native <select>.
 */
export function PillSelect({
  value,
  options,
  onChange,
  ariaLabel,
  testId,
  className = '',
  align = 'right',
}: PillSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-testid={testId}
        onClick={() => setOpen((v) => !v)}
        className="min-h-[40px] w-full px-4 py-1.5 rounded-full border border-[var(--line)] bg-[var(--bg-paper-card)] text-[var(--ink)] text-xs font-medium inline-flex items-center justify-between gap-2 apple-press cursor-pointer hover:border-[var(--line-hover)]"
      >
        <span className="truncate">{current?.label ?? ''}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 text-[var(--ink-muted)] transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className={`apple-scale-in absolute z-50 mt-2 min-w-full w-max max-w-[280px] max-h-72 overflow-auto p-1.5 rounded-[22px] border border-[var(--line)] bg-[var(--bg-paper-card)] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.35)] ${
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
          }`}
        >
          {options.map((opt) => {
            const selected = opt.value === value;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setOpen(false);
                  onChange(opt.value);
                }}
                className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                  opt.isAction
                    ? 'mt-1 border-t border-[var(--line)] rounded-t-none text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--bg-paper-subtle)]'
                    : selected
                    ? 'bg-[var(--accent-bg)] text-[var(--accent-ink)]'
                    : 'text-[var(--ink)] hover:bg-[var(--bg-paper-subtle)]'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {selected && !opt.isAction && (
                  <Check className="w-3.5 h-3.5 shrink-0" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
