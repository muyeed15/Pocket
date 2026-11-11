import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
};

const VARIANTS = {
  primary:
    'rounded-full bg-black px-6 py-2.5 text-white hover:bg-neutral-800',
  ghost: 'rounded-full px-3 py-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-black',
} as const;

export function Button({
  variant = 'primary',
  type = 'button',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 text-[15px] transition-colors disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  solid?: boolean;
};

export function IconButton({
  label,
  solid = false,
  type = 'button',
  className = '',
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full text-lg transition-colors disabled:opacity-40 ${
        solid
          ? 'bg-black text-white hover:bg-neutral-800'
          : 'text-neutral-500 hover:bg-neutral-100 hover:text-black'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
