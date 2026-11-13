'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { IoCheckmark, IoChevronDown, IoClose } from 'react-icons/io5';
import { fieldClass } from './Field';

export interface ComboboxOption {
  value: string;
  label: string;
  hint?: string;
}

interface ComboboxProps {
  name?: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  emptyText?: string;
  className?: string;
  inputClassName?: string;
  required?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
}

export function Combobox({
  name,
  options,
  value,
  onChange,
  placeholder = 'Select or type to search',
  ariaLabel,
  emptyText = 'No matching options',
  className = '',
  inputClassName = '',
  required = false,
  disabled = false,
  allowClear = !required,
}: ComboboxProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const justFocusedRef = useRef(false);

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value]
  );

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const displayValue = query ?? selectedOption?.label ?? '';
  const showClear = allowClear && Boolean(value) && !disabled;

  // Keep native HTML5 required validation accurate
  useEffect(() => {
    if (!inputRef.current) return;
    if (required && !value) {
      inputRef.current.setCustomValidity('Please select an option.');
    } else {
      inputRef.current.setCustomValidity('');
    }
  }, [required, value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery(null);
      }
    }
    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  // Keep keyboard-highlighted option visible inside scrollable list
  useEffect(() => {
    if (!open || !listboxRef.current) return;
    const item = listboxRef.current.children[activeIndex] as
      | HTMLElement
      | undefined;
    item?.scrollIntoView?.({ block: 'nearest' });
  }, [open, activeIndex]);

  const filtered = useMemo(() => {
    const q = displayValue.trim().toLowerCase();
    // If the input matches the currently selected label, show all options so user can switch easily
    if (!q || (selectedOption && q === selectedOption.label.toLowerCase())) {
      return options;
    }
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.hint && o.hint.toLowerCase().includes(q))
    );
  }, [options, displayValue, selectedOption]);

  function selectOption(option: ComboboxOption) {
    onChange(option.value);
    setQuery(null);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setOpen(true);
        setActiveIndex(0);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev <= 0 ? Math.max(0, filtered.length - 1) : prev - 1
      );
    } else if (e.key === 'Enter' && filtered.length > 0) {
      e.preventDefault();
      const target = filtered[activeIndex] ?? filtered[0];
      if (target) selectOption(target);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation?.();
      setOpen(false);
      setQuery(null);
    } else if (e.key === 'Tab') {
      setOpen(false);
      setQuery(null);
    }
  }

  return (
    <div
      ref={containerRef}
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
          setOpen(false);
          setQuery(null);
        }
      }}
      className={`relative ${className}`}
    >
      {name && <input type="hidden" name={name} value={value} />}

      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          required={required}
          disabled={disabled}
          value={displayValue}
          placeholder={placeholder}
          onFocus={(e) => {
            setOpen(true);
            setActiveIndex(0);
            if (selectedOption) {
              justFocusedRef.current = true;
              e.currentTarget.select();
            }
          }}
          onMouseUp={(e) => {
            if (justFocusedRef.current) {
              e.preventDefault();
              justFocusedRef.current = false;
            }
          }}
          onClick={() => {
            if (!disabled && !open) {
              setOpen(true);
              setActiveIndex(0);
            }
          }}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            setOpen(true);
            setActiveIndex(0);
            if (!next.trim() || next !== selectedOption?.label) {
              onChange('');
            }
          }}
          onKeyDown={handleKeyDown}
          className={`${fieldClass} ${showClear ? 'pr-12' : 'pr-7'} ${inputClassName}`}
        />
        {showClear && (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Clear selection"
            onMouseDown={(e) => {
              e.preventDefault();
              onChange('');
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-6 inline-flex size-6 items-center justify-center text-neutral-400 transition-colors hover:text-black"
          >
            <IoClose className="text-sm" />
          </button>
        )}
        <button
          type="button"
          tabIndex={-1}
          aria-label="Toggle options"
          disabled={disabled}
          onMouseDown={(e) => {
            e.preventDefault();
            if (open) {
              setOpen(false);
              setQuery(null);
            } else {
              inputRef.current?.focus();
              setOpen(true);
            }
          }}
          className="absolute right-0 inline-flex size-6 items-center justify-center text-neutral-400 transition-colors hover:text-black"
        >
          <IoChevronDown
            className={`text-sm transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {open && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-2 max-h-60 overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-neutral-400">
              {emptyText}
            </li>
          ) : (
            filtered.map((option, idx) => {
              const isSelected = option.value === value;
              const isActive = idx === activeIndex;
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectOption(option);
                  }}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 transition-colors ${
                    isActive ? 'bg-neutral-100' : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px] text-black">
                      {option.label}
                    </p>
                    {option.hint && (
                      <p className="truncate text-xs text-neutral-400">
                        {option.hint}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <IoCheckmark className="shrink-0 text-sm text-black" />
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
