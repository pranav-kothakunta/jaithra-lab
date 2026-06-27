import * as React from 'react';
import { cn } from '@/lib/utils';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  className?: string;
  onValueChange?: (value: string) => void;
};

type SelectItemProps = React.OptionHTMLAttributes<HTMLOptionElement> & {
  value: string;
};

const baseSelectClasses =
  'w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition duration-150 ease-in-out focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60';

export function Select({ className = '', children, onValueChange, ...props }: SelectProps) {
  return (
    <select
      className={cn(baseSelectClasses, className)}
      onChange={(event) => {
        onValueChange?.(event.target.value);
        if (props.onChange) props.onChange(event as any);
      }}
      {...props}
    >
      {children}
    </select>
  );
}

export function SelectTrigger({ className = '', ...props }: SelectProps) {
  return <select className={cn(baseSelectClasses, className)} {...props} />;
}

export function SelectValue({ className = '', ...props }: SelectProps) {
  return <span className={cn('text-sm text-slate-900', className)} {...props} />;
}

export function SelectContent({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white shadow-sm', className)} {...props}>
      {children}
    </div>
  );
}

export function SelectItem({ className = '', ...props }: SelectItemProps) {
  return <option className={cn('text-sm text-slate-900', className)} {...props} />;
}
