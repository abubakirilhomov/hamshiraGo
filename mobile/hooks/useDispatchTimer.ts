import { useCallback, useEffect, useRef, useState } from 'react';
import type { OrderStatus } from '@/types/order';

interface UseDispatchTimerResult {
  elapsedSeconds: number;
  resetTimer: () => void;
}

export function useDispatchTimer(
  orderStatus: OrderStatus | undefined,
  createdAt: string | undefined,
): UseDispatchTimerResult {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (orderStatus !== 'CREATED') {
      setElapsedSeconds(0);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
      return;
    }
    if (createdAt) {
      const startMs = new Date(createdAt).getTime();
      const tick = () => setElapsedSeconds(Math.floor((Date.now() - startMs) / 1000));
      tick();
      elapsedTimerRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, [orderStatus, createdAt]);

  const resetTimer = useCallback(() => {
    setElapsedSeconds(0);
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  return { elapsedSeconds, resetTimer };
}
