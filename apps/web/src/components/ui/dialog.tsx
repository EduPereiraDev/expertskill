'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const DialogContext = React.createContext<{ onClose: () => void }>({ onClose: () => {} });

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <DialogContext.Provider value={{ onClose: () => onOpenChange(false) }}>
      <div className="fixed inset-0 z-50">
        <div 
          className="fixed inset-0 bg-black/80" 
          onClick={() => onOpenChange(false)}
        />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6">
            <div onClick={(e) => e.stopPropagation()}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </DialogContext.Provider>
  );
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

export function DialogContent({ children, className, onClose }: DialogContentProps) {
  const ctx = React.useContext(DialogContext);
  const handleClose = onClose || ctx.onClose;

  return (
    <div className={cn(
      'relative bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col',
      className
    )}>
      <button
        onClick={handleClose}
        className="sticky top-0 z-20 self-end shrink-0 m-3 mb-0 rounded-full p-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors"
      >
        <X className="h-4 w-4 text-zinc-300" />
      </button>
      <div className="overflow-y-auto flex-1 px-6 pb-6 -mt-2">
        {children}
      </div>
    </div>
  );
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogHeader({ children, className }: DialogHeaderProps) {
  return (
    <div className={cn('flex flex-col space-y-1.5 p-6 pb-4', className)}>
      {children}
    </div>
  );
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogTitle({ children, className }: DialogTitleProps) {
  return (
    <h2 className={cn('text-xl font-semibold text-white', className)}>
      {children}
    </h2>
  );
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogDescription({ children, className }: DialogDescriptionProps) {
  return (
    <p className={cn('text-sm text-zinc-400', className)}>
      {children}
    </p>
  );
}
