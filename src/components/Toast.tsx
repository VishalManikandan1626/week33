import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastProps {
  key?: string;
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-white dark:bg-zinc-900 border-emerald-500/20 dark:border-emerald-500/10 shadow-emerald-500/5',
    error: 'bg-white dark:bg-zinc-900 border-rose-500/20 dark:border-rose-500/10 shadow-rose-500/5',
    warning: 'bg-white dark:bg-zinc-900 border-amber-500/20 dark:border-amber-500/10 shadow-amber-500/5',
    info: 'bg-white dark:bg-zinc-900 border-blue-500/20 dark:border-blue-500/10 shadow-blue-500/5',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
      className={`flex items-center gap-3 p-4 rounded-xl border shadow-lg ${bgColors[toast.type]} max-w-sm pointer-events-auto`}
    >
      <div className="flex-shrink-0">{icons[toast.type]}</div>
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 flex-grow pr-2">
        {toast.text}
      </p>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none px-4 sm:px-0">
      <AnimatePresence mode="pop-layout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
}
