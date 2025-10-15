"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Card, CardContent } from "@/components/ui/Card";
import { usePomodoroTimer } from "@/hooks/usePomodoroTimer";
import { useTimerKeyboardShortcuts } from "@/hooks/useTimerKeyboardShortcuts";

import {
  DEFAULT_MIN_SOUND_DURATION_SECONDS,
  DEFAULT_SOUND_ID,
  playSoundOption,
  type SoundId,
} from "@/lib/soundLibrary";

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
const MIN_SOUND_DURATION_SECONDS = 5;
const MAX_SOUND_DURATION_SECONDS = 900;

export default function PomodoroPanel() {
  const [mode, setMode] = useState<Mode>("pomodoro");
  const [customMinutesInput, setCustomMinutesInput] = useState<string>(
    String(DEFAULT_CUSTOM_MINUTES),
  );
  const [selectedSoundId, setSelectedSoundId] = useState<SoundId>(
    DEFAULT_SOUND_ID,
  );
  const [soundError, setSoundError] = useState<string | null>(null);
  const [minSoundDurationInput, setMinSoundDurationInput] = useState<string>(
    String(DEFAULT_MIN_SOUND_DURATION_SECONDS),
  );
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

  const parsedMinSoundDuration = useMemo(() => {
    const numericValue = Number(minSoundDurationInput);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return DEFAULT_MIN_SOUND_DURATION_SECONDS;
    }

    return Math.max(
      MIN_SOUND_DURATION_SECONDS,
      Math.min(MAX_SOUND_DURATION_SECONDS, Math.floor(numericValue)),
    );
  }, [minSoundDurationInput]);

  const handleTimerComplete = useCallback(() => {
    void (async () => {
      const context = await ensureAudioContext();
      if (context) {
        playSoundOption(context, selectedSoundId, {
          minDurationSeconds: parsedMinSoundDuration,
        });
      }
    })();
  }, [ensureAudioContext, parsedMinSoundDuration, selectedSoundId]);

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

  const handleMinSoundDurationChange = (value: string) => {
    if (/^\d*$/.test(value)) {
      setMinSoundDurationInput(value);
    }
  };

  const handleMinSoundDurationBlur = () => {
    setMinSoundDurationInput(String(parsedMinSoundDuration));
  };

  const handlePreviewSound = useCallback(
    (soundId: SoundId) => {
      void (async () => {
        const context = await ensureAudioContext();
        if (context) {
          playSoundOption(context, soundId, {
            minDurationSeconds: Math.min(
              parsedMinSoundDuration,
              DEFAULT_MIN_SOUND_DURATION_SECONDS,
            ),
          });
        }
      })();
    },
    [ensureAudioContext, parsedMinSoundDuration],
  );

  return (
    <Card className="w-full max-w-2xl text-[#f4f4f5]">
      <CardContent className="flex flex-col gap-6 sm:gap-8">
        <header className="flex flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            FlowGuilt Pomodoro
          </h1>
          <span className="text-xs uppercase tracking-[0.18em] text-zinc-400 sm:text-sm">
            Frontend only MVP
          </span>
        </header>

        <ModeSelector mode={mode} onSelect={setMode} />

        {mode === "custom" && (
          <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-[#161616]/80 p-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
            <label htmlFor="customMinutes" className="text-sm font-medium text-zinc-300">
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
              className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-right text-lg font-semibold text-[#f4f4f5] shadow-inner transition focus:border-[#6C3BF4] focus:outline-none focus:ring-2 focus:ring-[#6C3BF4]/30 sm:w-28"
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
          minSoundDurationSeconds={parsedMinSoundDuration}
          minSoundDurationInput={minSoundDurationInput}
          onMinSoundDurationChange={handleMinSoundDurationChange}
          onMinSoundDurationBlur={handleMinSoundDurationBlur}
          minSoundDurationMin={MIN_SOUND_DURATION_SECONDS}
          minSoundDurationMax={MAX_SOUND_DURATION_SECONDS}
        />
        {soundError && (
          <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            {soundError}
          </p>
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
