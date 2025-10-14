import { useCallback, useEffect, useRef, useState } from "react";

export function usePomodoroTimer(initialSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const lastTick = useRef<number | null>(null);

  useEffect(() => { setSecondsLeft(initialSeconds); setIsRunning(false); }, [initialSeconds]);

  useEffect(() => {
    if (!isRunning) { lastTick.current = null; return; }
    let raf: number;
    const loop = (ts: number) => {
      if (lastTick.current == null) lastTick.current = ts;
      const delta = ts - lastTick.current;
      if (delta >= 1000) {
        setSecondsLeft((p) => Math.max(0, p - Math.floor(delta / 1000)));
        lastTick.current = ts;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isRunning]);

  useEffect(() => { if (secondsLeft === 0 && isRunning) setIsRunning(false); }, [secondsLeft, isRunning]);

  const startPause = useCallback(() => setIsRunning((v) => !v), []);
  const restart = useCallback(() => { setSecondsLeft(initialSeconds); setIsRunning(false); }, [initialSeconds]);

  return { secondsLeft, isRunning, startPause, restart } as const;
}
