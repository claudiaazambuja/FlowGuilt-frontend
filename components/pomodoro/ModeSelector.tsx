import { Button } from "@/components/ui/Button";

export type Mode = "pomodoro" | "short" | "long" | "custom";

export function ModeSelector({ mode, onSelect }: { mode: Mode; onSelect: (m: Mode) => void; }) {
  const modes: Mode[] = ["pomodoro", "short", "long", "custom"];
  return (
    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mb-5">
      {modes.map((m) => (
        <Button
          key={m}
          variant={mode === m ? "primary" : "secondary"}
          onClick={() => onSelect(m)}
          className={mode === m
            ? "bg-[#1DB954] hover:brightness-110 text-black"
            : "bg-[#232323] hover:brightness-110 text-zinc-200 border-0"}
        >
          {m === "pomodoro" && "Pomodoro 25m"}
          {m === "short" && "Short Break 5m"}
          {m === "long" && "Long Break 15m"}
          {m === "custom" && "Custom"}
        </Button>
      ))}
    </div>
  );
}
