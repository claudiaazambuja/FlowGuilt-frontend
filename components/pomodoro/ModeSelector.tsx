import { Button } from "@/components/ui/Button";
import { cn } from "@/lib";

export type Mode = "pomodoro" | "short" | "long" | "custom";

const OPTIONS: Array<{ mode: Mode; label: string }> = [
  { mode: "pomodoro", label: "Pomodoro · 25m" },
  { mode: "short", label: "Short Break · 5m" },
  { mode: "long", label: "Long Break · 15m" },
  { mode: "custom", label: "Custom" },
];

type ModeSelectorProps = {
  mode: Mode;
  onSelect: (mode: Mode) => void;
};

export function ModeSelector({ mode, onSelect }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:flex md:flex-wrap">
      {OPTIONS.map((option) => {
        const isActive = option.mode === mode;

        return (
          <Button
            key={option.mode}
            type="button"
            variant="secondary"
            onClick={() => onSelect(option.mode)}
            aria-pressed={isActive}
            data-active={isActive}
            className={cn(
              "w-full md:flex-1 border border-white/5 bg-[#151515] text-zinc-200 transition-all duration-200 hover:brightness-110",
              "data-[active=true]:border-[#1DB954]/40 data-[active=true]:bg-[#1DB954] data-[active=true]:text-black",
              isActive ? "shadow-[0_0_25px_rgba(29,185,84,0.25)]" : undefined,
            )}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
