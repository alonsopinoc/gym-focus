import { createContext, useContext } from 'react';

export const TimerContext = createContext(null);

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer debe usarse dentro de <TimerProvider>');
  return ctx;
}
