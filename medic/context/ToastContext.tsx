import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Toast, ToastType } from '@/components/Toast';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<ToastItem | null>(null);
  const queueRef = useRef<ToastItem[]>([]);
  const idRef = useRef(0);
  const showingRef = useRef(false);

  const showNext = useCallback(() => {
    if (queueRef.current.length === 0) {
      showingRef.current = false;
      setCurrent(null);
      return;
    }
    const next = queueRef.current.shift()!;
    showingRef.current = true;
    setCurrent(next);
  }, []);

  const handleDismiss = useCallback(() => {
    showNext();
  }, [showNext]);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success', duration = 3000) => {
      const item: ToastItem = { id: ++idRef.current, message, type, duration };
      if (!showingRef.current) {
        showingRef.current = true;
        setCurrent(item);
      } else {
        queueRef.current.push(item);
      }
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {current && (
        <Toast
          key={current.id}
          message={current.message}
          type={current.type}
          duration={current.duration}
          onDismiss={handleDismiss}
        />
      )}
    </ToastContext.Provider>
  );
}
