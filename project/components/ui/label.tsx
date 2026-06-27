import * as React from 'react';
import { cn } from '@/lib/utils';

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  className?: string;
};

export function Label({ className = '', ...props }: LabelProps) {
  return <label className={cn('block text-sm font-medium text-slate-700', className)} {...props} />;
}
