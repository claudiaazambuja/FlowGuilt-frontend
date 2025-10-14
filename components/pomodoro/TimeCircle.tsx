import { formatTime } from "@/utils/time";

export function TimeCircle({ seconds, total }: { seconds: number; total: number; }) {
  const progress = total ? 1 - seconds / total : 0;
  return (
    <div className="flex flex-col items-center mb-6">
      <div className="relative grid place-items-center rounded-full" style={{ width: 220, height: 220 }}>
        <div aria-hidden className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(#6C3BF4 ${progress * 360}deg, #232323 ${progress * 360}deg)`,
            filter: "drop-shadow(0 0 16px rgba(108,59,244,0.35))",
          }} />
        <div className="absolute inset-[10px] rounded-full" style={{ background: "#0E0E0E" }} />
        <div className="relative text-5xl font-bold tabular-nums">{formatTime(seconds)}</div>
      </div>
      <div className="mt-6 text-xs text-zinc-400">
        Espaço = Start/Pause  R = Restart
      </div>
    </div>
  );
}
