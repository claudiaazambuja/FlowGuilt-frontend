export type SoundId = "bright-beep" | "soft-chime" | "digital-click";

export type SoundOption = {
  id: SoundId;
  label: string;
  description: string;
};

type Envelope = {
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
};

type ToneSegment = Envelope & {
  type: OscillatorType;
  frequency: number;
  duration: number;
  startOffset?: number;
  gain?: number;
};

const SOUND_SEGMENTS: Record<SoundId, ToneSegment[]> = {
  "bright-beep": [
    {
      type: "square",
      frequency: 880,
      duration: 0.5,
      attack: 0.005,
      decay: 0.12,
      sustain: 0.3,
      release: 0.18,
      gain: 0.35,
    },
  ],
  "soft-chime": [
    {
      type: "sine",
      frequency: 523.25,
      duration: 1.4,
      attack: 0.02,
      decay: 0.3,
      sustain: 0.35,
      release: 0.5,
      gain: 0.28,
    },
    {
      type: "sine",
      frequency: 659.25,
      duration: 1.2,
      attack: 0.02,
      decay: 0.28,
      sustain: 0.3,
      release: 0.45,
      gain: 0.22,
      startOffset: 0.05,
    },
    {
      type: "sine",
      frequency: 783.99,
      duration: 1.2,
      attack: 0.02,
      decay: 0.26,
      sustain: 0.25,
      release: 0.45,
      gain: 0.18,
      startOffset: 0.12,
    },
  ],
  "digital-click": [
    {
      type: "triangle",
      frequency: 1500,
      duration: 0.2,
      attack: 0.002,
      decay: 0.05,
      sustain: 0.1,
      release: 0.08,
      gain: 0.3,
    },
    {
      type: "square",
      frequency: 2200,
      duration: 0.16,
      attack: 0.002,
      decay: 0.04,
      sustain: 0.08,
      release: 0.08,
      gain: 0.22,
      startOffset: 0.03,
    },
  ],
};

export const SOUND_OPTIONS: SoundOption[] = [
  {
    id: "bright-beep",
    label: "Bipe brilhante",
    description: "Alerta curto e nítido para chamar atenção imediatamente.",
  },
  {
    id: "soft-chime",
    label: "Sino suave",
    description: "Acorde gentil com harmônicos em cascata.",
  },
  {
    id: "digital-click",
    label: "Clique digital",
    description: "Estalo eletrônico rápido e discreto.",
  },
];

function scheduleSegment(context: AudioContext, segment: ToneSegment) {
  const attack = segment.attack ?? 0.01;
  const decay = segment.decay ?? 0.1;
  const sustain = segment.sustain ?? 0.5;
  const release = segment.release ?? 0.2;
  const gainLevel = segment.gain ?? 0.3;
  const startTime = context.currentTime + (segment.startOffset ?? 0);
  const endTime = startTime + segment.duration;
  const releaseStart = Math.max(startTime + attack + decay, endTime - release);
  const sustainLevel = gainLevel * sustain;

  const oscillator = context.createOscillator();
  oscillator.type = segment.type;
  oscillator.frequency.setValueAtTime(segment.frequency, startTime);

  const gainNode = context.createGain();
  gainNode.gain.setValueAtTime(0, context.currentTime);
  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  gainNode.gain.cancelScheduledValues(startTime);
  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(Math.max(gainLevel, 0.0001), startTime + attack);
  gainNode.gain.exponentialRampToValueAtTime(
    Math.max(sustainLevel, 0.0001),
    startTime + attack + decay,
  );
  gainNode.gain.setValueAtTime(Math.max(sustainLevel, 0.0001), releaseStart);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

  oscillator.start(startTime);
  oscillator.stop(endTime + 0.05);
  oscillator.onended = () => {
    oscillator.disconnect();
    gainNode.disconnect();
  };
}

export function playSoundOption(context: AudioContext, soundId: SoundId) {
  const segments = SOUND_SEGMENTS[soundId];
  if (!segments) {
    return;
  }

  segments.forEach((segment) => {
    scheduleSegment(context, segment);
  });
}
