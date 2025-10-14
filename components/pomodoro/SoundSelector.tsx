import { Button } from "@/components/ui/Button";
import { SOUND_OPTIONS, type SoundId } from "@/lib/soundLibrary";

type SoundSelectorProps = {
  selectedSoundId: SoundId;
  onSelect: (soundId: SoundId) => void;
  onPreview: (soundId: SoundId) => void;
};

export function SoundSelector({
  selectedSoundId,
  onSelect,
  onPreview,
}: SoundSelectorProps) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-medium text-zinc-300">Som do alarme</h2>
        <p className="text-xs text-zinc-500">
          Escolha o som tocado automaticamente quando o tempo acabar.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {SOUND_OPTIONS.map((option) => {
          const isSelected = option.id === selectedSoundId;
          return (
            <label
              key={option.id}
              className={`group relative flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 transition ${
                isSelected
                  ? "border-[#6c3bf4] bg-[#1a132d]"
                  : "border-[#232323] bg-[#0f0f0f] hover:border-[#6c3bf4]/40"
              }`}
            >
              <input
                type="radio"
                name="alarm-sound"
                value={option.id}
                checked={isSelected}
                onChange={() => onSelect(option.id)}
                className="sr-only"
              />
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-sm font-semibold text-zinc-100">
                  {option.label}
                </span>
                <span className="text-xs text-zinc-500">{option.description}</span>
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
    </section>
  );
}
