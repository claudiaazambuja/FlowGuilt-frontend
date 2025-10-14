import { Button } from "@/components/ui/Button";

export function Controls({ running, onStartPause, onRestart }:{
  running: boolean; onStartPause: () => void; onRestart: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      <Button onClick={onStartPause}
        className={running ? "bg-[#6C3BF4] hover:brightness-110 text-white"
                           : "bg-[#1DB954] hover:brightness-110 text-black"}>
        {running ? "Pause" : "Start"}
      </Button>
      <Button variant="secondary" onClick={onRestart}
        className="bg-[#232323] hover:brightness-110 text-zinc-200 border-0">
        Restart
      </Button>
    </div>
  );
}
