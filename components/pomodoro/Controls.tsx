import { Button } from "@/components/ui/Button";

type ControlsProps = {
  running: boolean;
  onStartPause: () => void;
  onRestart: () => void;
};

export function Controls({ running, onStartPause, onRestart }: ControlsProps) {
  const startPauseLabel = running ? "Pause" : "Start";
  const startPauseClasses = running
    ? "bg-[#6c3bf4] text-white hover:brightness-110 focus:ring-[#6c3bf4]"
    : "bg-[#1db954] text-black hover:brightness-110 focus:ring-[#1db954]";

  return (
    <div className="flex items-center justify-center gap-3">
      <Button
        type="button"
        onClick={onStartPause}
        className={startPauseClasses}
        aria-label={`${startPauseLabel} timer`}
        title="Espaço: Start/Pause"
      >
        {startPauseLabel}
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={onRestart}
        className="bg-[#1a1a1a] text-zinc-200 hover:brightness-110 focus:ring-[#6c3bf4]"
        aria-label="Restart timer"
        title="R: Restart"
      >
        Restart
      </Button>
    </div>
  );
}
