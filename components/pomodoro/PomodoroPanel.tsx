"use client";

import { useMemo, useState } from "react";

import { Card, CardContent } from "@/components/ui/Card";
import { usePomodoroTimer } from "@/hooks/usePomodoroTimer";
import { useTimerKeyboardShortcuts } from "@/hooks/useTimerKeyboardShortcuts";

import { Controls } from "./Controls";
import { ModeSelector, type Mode } from "./ModeSelector";
import { TimeCircle } from "./TimeCircle";

const PRESET_SECONDS: Record<Exclude<Mode, "custom">, number> = {
  pomodoro: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

const DEFAULT_CUSTOM_MINUTES = 30;
const MIN_CUSTOM_MINUTES = 1;
const MAX_CUSTOM_MINUTES = 180;

export default function PomodoroPanel() {
  const [mode, setMode] = useState<Mode>("pomodoro");
  const [customMinutesInput, setCustomMinutesInput] = useState<string>(
    String(DEFAULT_CUSTOM_MINUTES),
  );

  const parsedCustomMinutes = useMemo(() => {
    const numericValue = Number(customMinutesInput);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return DEFAULT_CUSTOM_MINUTES;
    }

    return Math.max(
      MIN_CUSTOM_MINUTES,
      Math.min(MAX_CUSTOM_MINUTES, Math.floor(numericValue)),
    );
  }, [customMinutesInput]);

  const totalSeconds = useMemo(() => {
    return mode === "custom"
      ? parsedCustomMinutes * 60
      : PRESET_SECONDS[mode];
  }, [mode, parsedCustomMinutes]);

  const { secondsLeft, isRunning, startPause, restart } = usePomodoroTimer(
    totalSeconds,
  );

  useTimerKeyboardShortcuts({ onRestart: restart, onStartPause: startPause });

  const handleCustomMinutesChange = (value: string) => {
    if (/^\d*$/.test(value)) {
      setCustomMinutesInput(value);
    }
  };

  const handleCustomMinutesBlur = () => {
    setCustomMinutesInput(String(parsedCustomMinutes));
  };

  return (
    <Card className="w-full max-w-xl border border-[#1f1f1f] bg-[#131313] text-[#f2f2f2] shadow-[0_0_40px_rgba(108,59,244,0.25)]">
      <CardContent className="flex flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            FlowGuilt Pomodoro
          </h1>
          <span className="text-xs sm:text-sm text-zinc-400">
            Frontend only MVP
          </span>
        </header>

        <ModeSelector mode={mode} onSelect={setMode} />

        {mode === "custom" && (
          <div className="flex flex-wrap items-end gap-3">
            <label
              htmlFor="customMinutes"
              className="text-sm font-medium text-zinc-300"
            >
              Minutos personalizados
            </label>
            <input
              id="customMinutes"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              min={MIN_CUSTOM_MINUTES}
              max={MAX_CUSTOM_MINUTES}
              value={customMinutesInput}
              onChange={(event) => handleCustomMinutesChange(event.target.value)}
              onBlur={handleCustomMinutesBlur}
              className="w-28 rounded-md border border-[#2a2a2a] bg-[#0e0e0e] px-3 py-2 text-right text-lg font-semibold text-[#f2f2f2] outline-none transition focus:border-[#6c3bf4] focus:ring-2 focus:ring-[#6c3bf4]/40"
            />
            <span className="text-xs text-zinc-500">
              {MIN_CUSTOM_MINUTES}-{MAX_CUSTOM_MINUTES} minutos
            </span>
          </div>
        )}

        <TimeCircle seconds={secondsLeft} total={totalSeconds} />

        <Controls
          running={isRunning}
          onStartPause={startPause}
          onRestart={restart}
        />
      </CardContent>
    </Card>
  );
}
