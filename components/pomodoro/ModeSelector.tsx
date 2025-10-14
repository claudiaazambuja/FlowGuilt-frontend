import { Button } from "@/components/ui/Button";

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
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      {OPTIONS.map((option) => {
        const isActive = option.mode === mode;
        return (
          <Button
            key={option.mode}
            type="button"
            variant={isActive ? "primary" : "secondary"}
            onClick={() => onSelect(option.mode)}
            aria-pressed={isActive}
            className={
              isActive
                ? "bg-[#1db954] text-black hover:brightness-110"
                : "bg-[#1a1a1a] text-zinc-200 hover:brightness-110"
            }
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
