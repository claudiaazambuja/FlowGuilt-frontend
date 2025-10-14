"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Controls } from "./Controls";
import { ModeSelector, type Mode } from "./ModeSelector";
import { TimeCircle } from "./TimeCircle";
import { usePomodoroTimer } from "@/hooks/usePomodoroTimer";

const PRESETS: Record<Exclude<Mode,"custom">, number> = {
  pomodoro: 25*60, short: 5*60, long: 15*60,
};

export default function PomodoroPanel() {
  const [mode, setMode] = useState<Mode>("pomodoro");
  const [customMinutes, setCustomMinutes] = useState(30);

  const totalSeconds = useMemo(
    () => mode === "custom" ? Math.max(1, Math.floor(customMinutes)) * 60 : PRESETS[mode],
    [mode, customMinutes]
  );

  const { secondsLeft, isRunning, startPause, restart } = usePomodoroTimer(totalSeconds);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); startPause(); }
      if (e.key.toLowerCase() === "r") { e.preventDefault(); restart(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [startPause, restart]);

  return (
    <Card className="w-full max-w-xl border-0 shadow-xl" style={{ background: "#151515", color: "#F2F2F2" }}>
      <CardContent>
        <header className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold">FlowGuilt  Pomodoro</h1>
          <span className="text-xs sm:text-sm text-zinc-400">Frontend only</span>
        </header>

        <ModeSelector mode={mode} onSelect={setMode} />

        {mode === "custom" && (
          <div className="mb-6 flex items-center gap-3">
            <label htmlFor="customMinutes" className="text-sm text-zinc-300">Minutos personalizados</label>
            <input id="customMinutes" type="number" min={1} max={180}
              value={customMinutes}
              onChange={(e) => setCustomMinutes(Number(e.target.value))}
              className="w-28 rounded-md bg-[#0E0E0E] border border-[#2a2a2a] px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-[#6C3BF4]" />
          </div>
        )}

        <TimeCircle seconds={secondsLeft} total={totalSeconds} />
        <Controls running={isRunning} onStartPause={startPause} onRestart={restart} />
      </CardContent>
    </Card>
  );
}
