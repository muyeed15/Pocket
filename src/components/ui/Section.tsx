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
      <div className="mb-8 flex min-h-9 items-center justify-between border-b border-neutral-200 pb-3">
        <h2 className="text-xl tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="py-10 text-center text-neutral-400">{children}</p>;
}
