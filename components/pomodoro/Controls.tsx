import { Button } from "@/components/ui/Button";
import { cn } from "@/lib";

type ControlsProps = {
  running: boolean;
  onStartPause: () => void;
  onRestart: () => void;
};

export function Controls({ running, onStartPause, onRestart }: ControlsProps) {
  const startPauseLabel = running ? "Pause" : "Start";
  const startPauseClasses = running
    ? "bg-[#6C3BF4] text-white shadow-[0_0_30px_rgba(108,59,244,0.35)] focus-visible:ring-[#6C3BF4]"
    : "bg-[#1DB954] text-black shadow-[0_0_30px_rgba(29,185,84,0.35)] focus-visible:ring-[#1DB954]";

  return (
    <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
      <Button
        type="button"
        onClick={onStartPause}
        className={cn("w-full sm:w-auto", startPauseClasses)}
        aria-label={`${startPauseLabel} timer`}
        title="Espaço: Start/Pause"
      >
        {startPauseLabel}
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={onRestart}
        className="w-full border border-white/5 bg-[#1A1A1A] text-zinc-200 hover:brightness-110 focus-visible:ring-[#6C3BF4] sm:w-auto"
        aria-label="Restart timer"
        title="R: Restart"
      >
        Restart
      </Button>
    </div>
  );
}
