"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib";
import { DEFAULT_SOUND_ID, SOUND_OPTIONS, type SoundId } from "@/lib/soundLibrary";

type SoundSelectorProps = {
  selectedSoundId: SoundId;
  onSelect: (soundId: SoundId) => void;
  onPreview: (soundId: SoundId) => void;
  minSoundDurationSeconds: number;
  minSoundDurationInput: string;
  onMinSoundDurationChange: (value: string) => void;
  onMinSoundDurationBlur: () => void;
  minSoundDurationMin: number;
  minSoundDurationMax: number;
};

export function SoundSelector({
  selectedSoundId,
  onSelect,
  onPreview,
  minSoundDurationSeconds,
  minSoundDurationInput,
  onMinSoundDurationChange,
  onMinSoundDurationBlur,
  minSoundDurationMin,
  minSoundDurationMax,
}: SoundSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleButtonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const selectedSound = useMemo(() => {
    return (
      SOUND_OPTIONS.find((option) => option.id === selectedSoundId) ??
      SOUND_OPTIONS[0]
    );
  }, [selectedSoundId]);

  const defaultSoundLabel = useMemo(() => {
    return (
      SOUND_OPTIONS.find((option) => option.id === DEFAULT_SOUND_ID)?.label ??
      SOUND_OPTIONS[0]?.label ??
      "som"
    );
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        panelRef.current?.contains(target) ||
        toggleButtonRef.current?.contains(target)
      ) {
        return;
      }

      setIsOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <section className="flex flex-col items-end gap-1">
      <p className="text-xs text-zinc-500">
        Som atual:
        <span className="ml-1 font-medium text-zinc-200">
          {selectedSound?.label}
        </span>
      </p>
      <div className="relative">
        <Button
          ref={toggleButtonRef}
          type="button"
          variant="secondary"
          aria-expanded={isOpen}
          aria-controls="sound-selector-panel"
          className={cn(
            "relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#1E1E1E]/80 p-0",
            "text-zinc-200 transition hover:border-[#6C3BF4]/40 hover:text-white",
            isOpen ? "border-[#6C3BF4] text-white" : undefined,
          )}
          onClick={() => setIsOpen((previous) => !previous)}
        >
          <span className="sr-only">
            Selecionar som do alarme. Duração mínima atual {minSoundDurationSeconds} segundos.
          </span>
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18V5l12-2v13" />
            <path d="M6 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            <path d="M18 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          </svg>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-1 right-1 rounded-md border border-[#6C3BF4]/50 bg-[#12092a]/95 px-1.5 py-[1px] text-[10px] font-semibold leading-none text-[#d7c7ff] shadow-[0_0_8px_rgba(108,59,244,0.35)]"
          >
            {minSoundDurationSeconds}s
          </span>
        </Button>

        {isOpen ? (
          <div
            ref={panelRef}
            id="sound-selector-panel"
            role="dialog"
            aria-modal="true"
            className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-white/10 bg-[#141414]/95 p-4 shadow-2xl backdrop-blur"
          >
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-semibold text-zinc-100">Som do alarme</h2>
              <p className="text-xs text-zinc-500">
                Escolha o áudio tocado automaticamente quando o tempo acabar.
              </p>
              <p className="text-[11px] text-zinc-600">
                Som padrão: <span className="text-zinc-300">{defaultSoundLabel}</span>
              </p>
            </div>
            <div className="mt-3 rounded-lg border border-white/5 bg-black/20 p-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#b9a7ff]">
                Duração mínima
              </p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={minSoundDurationMin}
                  max={minSoundDurationMax}
                  value={minSoundDurationInput}
                  onChange={(event) => onMinSoundDurationChange(event.target.value)}
                  onBlur={onMinSoundDurationBlur}
                  className="w-20 rounded-md border border-white/10 bg-[#0d0d0d]/80 px-2 py-1 text-right text-sm font-semibold text-[#f4f4f5] shadow-inner transition focus:border-[#6C3BF4] focus:outline-none focus:ring-1 focus:ring-[#6C3BF4]/40"
                  aria-describedby="sound-duration-help"
                />
                <span className="text-xs text-zinc-400">seg</span>
              </div>
              <p
                id="sound-duration-help"
                className="mt-1 text-[10px] leading-snug text-zinc-500"
              >
                Toca por pelo menos {minSoundDurationSeconds} segundos ou até você interagir.
              </p>
              <p className="mt-1 text-[10px] text-zinc-600">
                Intervalo permitido: {minSoundDurationMin}-{minSoundDurationMax} segundos.
              </p>
            </div>
            <div className="mt-3 flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
              {SOUND_OPTIONS.map((option) => {
                const isSelected = option.id === selectedSoundId;
                return (
                  <label
                    key={option.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 transition",
                      "border-white/5 bg-[#1b1b1b]/80 hover:border-[#6C3BF4]/40",
                      isSelected
                        ? "border-[#6C3BF4] bg-[#211537] shadow-[0_0_18px_rgba(108,59,244,0.25)]"
                        : undefined,
                    )}
                  >
                    <input
                      type="radio"
                      name="alarm-sound"
                      value={option.id}
                      checked={isSelected}
                      onChange={() => {
                        onSelect(option.id);
                        setIsOpen(false);
                      }}
                      className="sr-only"
                    />
                    <div className="flex flex-1 flex-col gap-1">
                      <span className="text-sm font-semibold text-zinc-100">
                        {option.label}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {option.description}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-3 py-1 text-xs font-medium text-zinc-200"
                      onClick={(event) => {
                        event.preventDefault();
                        onPreview(option.id);
                      }}
                    >
                      Testar
                    </Button>
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
