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
    <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
      <Button
        type="button"
        onClick={onStartPause}
        className={`w-full sm:w-auto ${startPauseClasses}`}
        aria-label={`${startPauseLabel} timer`}
        title="Espaço: Start/Pause"
      >
        {startPauseLabel}
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={onRestart}
        className="w-full bg-[#1a1a1a] text-zinc-200 hover:brightness-110 focus:ring-[#6c3bf4] sm:w-auto"
        aria-label="Restart timer"
        title="R: Restart"
      >
        Restart
      </Button>
    </div>
  );
}
