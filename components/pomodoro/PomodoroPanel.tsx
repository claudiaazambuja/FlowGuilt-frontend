"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Card, CardContent } from "@/components/ui/Card";
import { usePomodoroTimer } from "@/hooks/usePomodoroTimer";
import { useTimerKeyboardShortcuts } from "@/hooks/useTimerKeyboardShortcuts";

import { playSoundOption, type SoundId } from "@/lib/soundLibrary";

import { Controls } from "./Controls";
import { ModeSelector, type Mode } from "./ModeSelector";
import { SoundSelector } from "./SoundSelector";
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
  const [selectedSoundId, setSelectedSoundId] = useState<SoundId>(
    "bright-beep",
  );
  const [soundError, setSoundError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const ensureAudioContext = useCallback(async () => {
    if (typeof window === "undefined") {
      return null;
    }

    const extendedWindow = window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    };

    const AudioContextConstructor =
      window.AudioContext ?? extendedWindow.webkitAudioContext;

    if (!AudioContextConstructor) {
      setSoundError("Seu navegador não suporta reprodução de áudio.");
      return null;
    }

    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new AudioContextConstructor();
      } catch (error) {
        console.error("Não foi possível criar o contexto de áudio.", error);
        setSoundError("Não foi possível iniciar o áudio neste navegador.");
        return null;
      }
    }

    try {
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }
      setSoundError(null);
      return audioContextRef.current;
    } catch (error) {
      console.warn("Reprodução bloqueada até interação do usuário.", error);
      setSoundError(
        "O navegador bloqueou o áudio. Interaja com a página e tente novamente.",
      );
      return null;
    }
  }, []);

  useEffect(() => {
    return () => {
      const context = audioContextRef.current;
      if (context && context.state !== "closed") {
        context.close().catch(() => {
          // Ignora erros ao encerrar o contexto durante o unmount.
        });
      }
    };
  }, []);

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

  const handleTimerComplete = useCallback(() => {
    void (async () => {
      const context = await ensureAudioContext();
      if (context) {
        playSoundOption(context, selectedSoundId);
      }
    })();
  }, [ensureAudioContext, selectedSoundId]);

  const { secondsLeft, isRunning, startPause, restart } = usePomodoroTimer(
    totalSeconds,
    { onComplete: handleTimerComplete },
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

  const handlePreviewSound = useCallback(
    (soundId: SoundId) => {
      void (async () => {
        const context = await ensureAudioContext();
        if (context) {
          playSoundOption(context, soundId);
        }
      })();
    },
    [ensureAudioContext],
  );

  return (
    <Card className="w-full max-w-2xl border border-[#1f1f1f] bg-[#131313] text-[#f2f2f2] shadow-[0_0_40px_rgba(108,59,244,0.25)]">
      <CardContent className="flex flex-col gap-6 sm:gap-8">
        <header className="flex flex-col items-center gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            FlowGuilt Pomodoro
          </h1>
          <span className="text-xs text-zinc-400 sm:text-sm">
            Frontend only MVP
          </span>
        </header>

        <ModeSelector mode={mode} onSelect={setMode} />

        {mode === "custom" && (
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-end">
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
              className="w-full rounded-md border border-[#2a2a2a] bg-[#0e0e0e] px-3 py-2 text-right text-lg font-semibold text-[#f2f2f2] outline-none transition focus:border-[#6c3bf4] focus:ring-2 focus:ring-[#6c3bf4]/40 sm:w-28"
            />
            <span className="text-xs text-zinc-500">
              {MIN_CUSTOM_MINUTES}-{MAX_CUSTOM_MINUTES} minutos
            </span>
          </div>
        )}

        <SoundSelector
          selectedSoundId={selectedSoundId}
          onSelect={setSelectedSoundId}
          onPreview={handlePreviewSound}
        />
        {soundError && (
          <p className="text-xs text-amber-400">{soundError}</p>
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
