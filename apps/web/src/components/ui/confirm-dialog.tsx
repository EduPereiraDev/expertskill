'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
import { Button } from './button';
import { AlertTriangle, Trash2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}

interface ConfirmProviderProps {
  children: ReactNode;
}

export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    resolvePromise?.(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolvePromise?.(false);
  };

  const getIcon = () => {
    switch (options?.type) {
      case 'danger':
        return <Trash2 className="h-6 w-6 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-amber-400" />;
      default:
        return <Info className="h-6 w-6 text-blue-400" />;
    }
  };

  const getIconBg = () => {
    switch (options?.type) {
      case 'danger':
        return 'bg-red-500/10';
      case 'warning':
        return 'bg-amber-500/10';
      default:
        return 'bg-blue-500/10';
    }
  };

  const getConfirmButtonClass = () => {
    switch (options?.type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white';
      default:
        return 'bg-purple-600 hover:bg-purple-700 text-white';
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 p-6">
          <DialogHeader className="pb-0">
            <div className="flex items-start gap-4">
              <div className={cn('p-3 rounded-full flex-shrink-0', getIconBg())}>
                {getIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-semibold text-white">
                  {options?.title}
                </DialogTitle>
                <DialogDescription className="mt-2 text-zinc-400">
                  {options?.message}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6 pt-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              {options?.cancelText || 'Cancelar'}
            </Button>
            <Button
              onClick={handleConfirm}
              className={getConfirmButtonClass()}
            >
              {options?.confirmText || 'Confirmar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
