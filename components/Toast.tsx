import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';

const toastStyles: Record<string, string> = {
  info: 'border-primary/60 bg-black/80 text-white',
  success: 'border-success/80 bg-black/80 text-success',
  error: 'border-failure/80 bg-black/80 text-failure',
};

export const ToastStack: React.FC = () => {
  const toasts = useAppStore((state) => state.toasts);
  const removeToast = useAppStore((state) => state.removeToast);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((toast) =>
      window.setTimeout(() => removeToast(toast.id), 2600)
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [toasts, removeToast]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`rounded-2xl border-2 px-4 py-3 text-sm font-bold shadow-[0_0_20px_rgba(0,0,0,0.4)] ${
              toastStyles[toast.kind]
            }`}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
