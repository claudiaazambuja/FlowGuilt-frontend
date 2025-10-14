import { useCallback, useEffect, useRef, useState } from "react";

type UsePomodoroTimerOptions = {
  onComplete?: () => void;
};

export function usePomodoroTimer(
  initialSeconds: number,
  { onComplete }: UsePomodoroTimerOptions = {},
) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const lastTickRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    setIsRunning(false);
    lastTickRef.current = null;
  }, [initialSeconds]);

  useEffect(() => {
    if (!isRunning) {
      lastTickRef.current = null;
      return;
    }

    let animationFrameId: number;

    const tick = (timestamp: number) => {
      if (lastTickRef.current == null) {
        lastTickRef.current = timestamp;
      } else {
        const delta = timestamp - lastTickRef.current;
        if (delta >= 1000) {
          const elapsedSeconds = Math.floor(delta / 1000);
          if (elapsedSeconds > 0) {
            setSecondsLeft((previous) => Math.max(0, previous - elapsedSeconds));
            const remainder = delta % 1000;
            lastTickRef.current = timestamp - remainder;
          }
        }
      }

      animationFrameId = window.requestAnimationFrame(tick);
    };

    animationFrameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [isRunning]);

  useEffect(() => {
    if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    }
  }, [isRunning, secondsLeft]);

  const startPause = useCallback(() => {
    setIsRunning((previous) => {
      if (!previous && secondsLeft === 0) {
        setSecondsLeft(initialSeconds);
        lastTickRef.current = null;
        return true;
      }
      return !previous;
    });
  }, [initialSeconds, secondsLeft]);

  const restart = useCallback(() => {
    setSecondsLeft(initialSeconds);
    setIsRunning(false);
    lastTickRef.current = null;
  }, [initialSeconds]);

  return { secondsLeft, isRunning, startPause, restart } as const;
}
