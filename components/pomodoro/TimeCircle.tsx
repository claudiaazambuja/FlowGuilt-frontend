import { formatTime } from "@/utils/time";

type TimeCircleProps = {
  seconds: number;
  total: number;
};

export function TimeCircle({ seconds, total }: TimeCircleProps) {
  const progress = total > 0 ? 1 - seconds / total : 0;
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const progressAngle = clampedProgress * 360;

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="relative grid place-items-center rounded-full"
        style={{ width: 240, height: 240 }}
        aria-label="Tempo restante"
      >
        <div
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(#1db954 0deg ${progressAngle}deg, #6c3bf4 ${progressAngle}deg 360deg)`,
            filter: "drop-shadow(0 0 24px rgba(108,59,244,0.45))",
            transition: "background 0.3s ease",
          }}
        />
        <div
          className="absolute inset-[12px] rounded-full border border-[#1f1f1f]"
          style={{ background: "#0c0c0c" }}
        />
        <div className="relative text-5xl font-bold tabular-nums" role="timer" aria-live="polite">
          {formatTime(seconds)}
        </div>
      </div>
      <p className="text-xs text-zinc-400">
        Espaço = Start/Pause · R = Restart
      </p>
    </div>
  );
}
