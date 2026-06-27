import * as React from 'react';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  className?: string;
  variant?: string;
};

export function Badge({ className = '', variant, ...props }: BadgeProps) {
  return <span className={className} data-variant={variant} {...props} />;
}
