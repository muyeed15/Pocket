import React from 'react';

export function Section({
  title,
  action,
  className = '',
  children,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={className}>
      <div className="mb-5 flex min-h-8 items-center justify-between border-b border-neutral-200 pb-2.5 sm:mb-6">
        <h2 className="text-lg tracking-tight sm:text-xl">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`py-7 text-center text-sm text-neutral-400 sm:py-9 ${className}`}>
      {children}
    </div>
  );
}
