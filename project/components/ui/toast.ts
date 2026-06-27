import type * as React from 'react';

export type ToastActionElement = React.ReactNode;

export type ToastProps = {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  duration?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};
