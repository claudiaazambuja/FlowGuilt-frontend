"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib";

const DEFAULT_PLAYLISTS = [
  {
    id: "serotonin",
    name: "Serotonin",
    description: "Para focar com gás total.",
    spotifyId: "4dx7CqzVnWkTvTox9poIYF",
  },
  {
    id: "brazilian-lofi",
    name: "Brazilian Lofi",
    description: "Lofi nacional com groove leve e constante.",
    spotifyId: "7K3scENpOi7ZPZUHfnfic3",
  },
  {
    id: "eletronics-lofi",
    name: "Eletronics",
    description: "Ser constante e fluído.",
    spotifyId: "4rCCdVVzrdSOoyvBXGdnGL",
  },
] as const;

type DefaultPlaylist = (typeof DEFAULT_PLAYLISTS)[number];

type ActivePlaylist = {
  spotifyId: string;
  label: string;
  isCustom: boolean;
};

type SpotifyEmbedPlayOptions = {
  uri: string;
  index?: { position: number };
};

type SpotifyEmbedController = {
  loadUri: (uri: string) => Promise<void> | void;
  setVolume?: (value: number) => Promise<void> | void;
  play: (options?: SpotifyEmbedPlayOptions) => Promise<void> | void;
  pause: () => Promise<void> | void;
  togglePlay?: () => Promise<void> | void;
  destroy?: () => void;
  getCurrentState?: () => Promise<unknown> | unknown;

};

type SpotifyIframeApi = {
  createController: (
    element: HTMLElement,
    options: {
      uri: string;
      width?: string | number;
      height?: string | number;
      theme?: "dark" | "light";
    },
    callback: (controller: SpotifyEmbedController) => void,
  ) => void;
};

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIframeApi) => void;
    SpotifyIframeApi?: SpotifyIframeApi;
  }
}

function useSpotifyIframeApi() {
  const [api, setApi] = useState<SpotifyIframeApi | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return window.SpotifyIframeApi ?? null;
  });

  useEffect(() => {
    if (typeof window === "undefined" || api) {
      return;
    }

    const existingApi = window.SpotifyIframeApi;
    if (existingApi) {
      setApi(existingApi);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    document.body.appendChild(script);

    const handleReady = (iframeApi: SpotifyIframeApi) => {
      window.SpotifyIframeApi = iframeApi;
      setApi(iframeApi);
    };

    window.onSpotifyIframeApiReady = handleReady;

    return () => {
      if (window.onSpotifyIframeApiReady === handleReady) {
        window.onSpotifyIframeApiReady = undefined;
      }
    };
  }, [api]);

  return api;
}

function extractSpotifyPlaylistId(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const urlMatch = trimmed.match(/playlist\/(\w+)(?:\?|$)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }

  if (/^[a-zA-Z0-9]+$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

const DEFAULT_RANDOM_POOL_SIZE = 20;

function isFinitePositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function extractPlaylistLength(state: unknown): number | null {
  if (!state || typeof state !== "object") {
    return null;
  }

  const candidatePaths: Array<Array<string>> = [
    ["context", "metadata", "current_context", "metadata", "length"],
    ["context", "metadata", "length"],
    ["metadata", "current_context", "metadata", "length"],
    ["metadata", "context", "metadata", "length"],
    ["metadata", "track_count"],
  ];

  for (const path of candidatePaths) {
    let current: unknown = state;
    for (const key of path) {
      if (!current || typeof current !== "object") {
        current = undefined;
        break;
      }
      current = (current as Record<string, unknown>)[key];
    }

    if (isFinitePositiveNumber(current)) {
      return current;
    }
  }

  const metadata = (state as Record<string, unknown>).metadata;
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const nextTracks = Array.isArray(
    (metadata as Record<string, unknown>).next_tracks,
  )
    ? ((metadata as Record<string, unknown>).next_tracks as unknown[]).length
    : 0;
  const previousTracks = Array.isArray(
    (metadata as Record<string, unknown>).previous_tracks,
  )
    ? ((metadata as Record<string, unknown>).previous_tracks as unknown[])
        .length
    : 0;
  const hasCurrentTrack = Boolean(
    (metadata as Record<string, unknown>).current_track,
  );

  const inferredLength = nextTracks + previousTracks + (hasCurrentTrack ? 1 : 0);

  return inferredLength > 0 ? inferredLength : null;
}

export function BackgroundPlaylistSelector() {
  const [activePlaylist, setActivePlaylist] = useState<ActivePlaylist>({
    spotifyId: DEFAULT_PLAYLISTS[0].spotifyId,
    label: DEFAULT_PLAYLISTS[0].name,
    isCustom: false,
  });
  const [customInput, setCustomInput] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const [hasCustomPlaylist, setHasCustomPlaylist] = useState(false);
  const [volume, setVolume] = useState(70);
  const [showVolumeControls, setShowVolumeControls] = useState(false);
  const [supportsVolumeControl, setSupportsVolumeControl] = useState(false);
  const spotifyApi = useSpotifyIframeApi();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<SpotifyEmbedController | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const desiredPlaybackRef = useRef(false);
  const lastPlaybackIntentRef = useRef(false);
  const lastRandomizedPlaylistRef = useRef<string | null>(null);

  const attemptRandomizedStart = useCallback(
    async (controller: SpotifyEmbedController) => {
      const playlistUri = `spotify:playlist:${activePlaylist.spotifyId}`;

      const trackCount = await (async () => {
        if (typeof controller.getCurrentState !== "function") {
          return null;
        }

        try {
          const state = await controller.getCurrentState();
          const extracted = extractPlaylistLength(state);
          return extracted && extracted > 1 ? extracted : null;
        } catch {
          return null;
        }
      })();

      const poolSize = trackCount ?? DEFAULT_RANDOM_POOL_SIZE;
      const safePool = Math.max(1, poolSize);
      const primaryIndex = Math.floor(Math.random() * safePool);
      const fallbackIndex = primaryIndex > 0 ? Math.floor(primaryIndex / 2) : 0;
      const indicesToTry = Array.from(
        new Set([primaryIndex, fallbackIndex, 0]).values(),
      );

      for (const index of indicesToTry) {
        try {
          const maybeResult = controller.play({
            uri: playlistUri,
            index: { position: index },
          });

          if (
            maybeResult &&
            typeof (maybeResult as Promise<unknown>).then === "function"
          ) {
            await maybeResult;
          }

          return true;
        } catch {
          // Continua tentando com o próximo índice candidato.
        }
      }

      return false;
    },
    [activePlaylist.spotifyId],
  );

  const syncControllerPlayback = useCallback(
    (controller?: SpotifyEmbedController | null) => {
      const target = controller ?? controllerRef.current;
      if (!target) {
        return;
      }

      const shouldPlay = desiredPlaybackRef.current;
      const playlistId = activePlaylist.spotifyId;

      if (!shouldPlay) {
        lastPlaybackIntentRef.current = false;
        lastRandomizedPlaylistRef.current = null;
        target.pause?.();
        return;
      }

      const wasPlaying = lastPlaybackIntentRef.current;
      const playlistChanged = lastRandomizedPlaylistRef.current !== playlistId;

      lastPlaybackIntentRef.current = true;

      if (!wasPlaying || playlistChanged) {
        void (async () => {
          const didRandomize = await attemptRandomizedStart(target);

          if (!desiredPlaybackRef.current) {
            target.pause?.();
            return;
          }

          if (!didRandomize) {
            target.play?.();
          }

          lastRandomizedPlaylistRef.current = playlistId;
        })();
        return;
      }

      target.play?.();
    },
    [activePlaylist.spotifyId, attemptRandomizedStart],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStart = () => {
      desiredPlaybackRef.current = true;
      syncControllerPlayback();
    };

    const handlePause = () => {
      desiredPlaybackRef.current = false;
      syncControllerPlayback();
    };

    window.addEventListener("flowguilt:pomodoro-timer-start", handleStart);
    window.addEventListener("flowguilt:pomodoro-timer-pause", handlePause);

    return () => {
      window.removeEventListener("flowguilt:pomodoro-timer-start", handleStart);
      window.removeEventListener("flowguilt:pomodoro-timer-pause", handlePause);
    };
  }, []);

  const handleSelectDefault = (playlist: DefaultPlaylist) => {
    setActivePlaylist({
      spotifyId: playlist.spotifyId,
      label: playlist.name,
      isCustom: false,
    });
    setCustomError(null);
  };

  const handleCustomSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const playlistId = extractSpotifyPlaylistId(customInput);

    if (!playlistId) {
      setCustomError("Não foi possível reconhecer esse link de playlist.");
      return;
    }

    setActivePlaylist({
      spotifyId: playlistId,
      label: "Sua playlist",
      isCustom: true,
    });
    setHasCustomPlaylist(true);
    setCustomError(null);
  };

  useEffect(() => {
    if (!spotifyApi || controllerRef.current || !containerRef.current) {
      return;
    }

    let isCancelled = false;

    spotifyApi.createController(
      containerRef.current,
      {
        uri: `spotify:playlist:${activePlaylist.spotifyId}`,
        width: "100%",
        height: "232",
        theme: "dark",
      },
      (controller) => {
        if (isCancelled) {
          controller.destroy?.();
          return;
        }
        controllerRef.current = controller;
        const canSetVolume = typeof controller.setVolume === "function";
        setSupportsVolumeControl(canSetVolume);
        if (canSetVolume) {
          controller.setVolume?.(volume / 100);
        } else {
          setShowVolumeControls(false);
        }
        syncControllerPlayback(controller);
        setIsPlayerReady(true);
      },
    );

    return () => {
      isCancelled = true;
      controllerRef.current?.destroy?.();
      controllerRef.current = null;
      setIsPlayerReady(false);
      setSupportsVolumeControl(false);
      setShowVolumeControls(false);
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
    // Apenas inicializa uma vez, os updates são tratados em outros efeitos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotifyApi]);

  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller) {
      return;
    }
    const maybePromise = controller.loadUri(
      `spotify:playlist:${activePlaylist.spotifyId}`,
    );

    if (
      maybePromise &&
      typeof (maybePromise as Promise<unknown>).then === "function"
    ) {
      void (maybePromise as Promise<unknown>).then(() => {
        syncControllerPlayback(controllerRef.current);
      });
    } else {
      syncControllerPlayback(controller);
    }
  }, [activePlaylist.spotifyId]);

  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller?.setVolume) {
      return;
    }

    void controller.setVolume(volume / 100);
  }, [volume]);

  const handleVolumeChange = (value: number) => {
    setVolume(Math.min(100, Math.max(0, value)));
  };

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-white/5 bg-[#161616]/90 p-4 shadow-xl">
      <header className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-zinc-100">
          Ambiente sonoro de fundo
        </h2>
        <p className="text-sm text-zinc-400">
          Escolha uma das playlists sugeridas ou cole o link da sua playlist do
          Spotify. Sempre que você alternar, apenas a playlist selecionada
          permanecerá tocando.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {DEFAULT_PLAYLISTS.map((playlist) => {
          const isActive =
            !activePlaylist.isCustom &&
            activePlaylist.spotifyId === playlist.spotifyId;

          return (
            <div
              key={playlist.id}
              className={cn(
                "flex flex-col justify-between gap-3 rounded-lg border border-white/10 bg-black/40 p-3 transition",
                isActive
                  ? "border-[#1DB954]/60 shadow-[0_0_18px_rgba(29,185,84,0.25)]"
                  : "hover:border-white/20",
              )}
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-100">
                  {playlist.name}
                </p>
                <p className="text-xs text-zinc-400">{playlist.description}</p>
              </div>
              <Button
                type="button"
                variant={isActive ? "primary" : "secondary"}
                className="text-xs"
                onClick={() => handleSelectDefault(playlist)}
                aria-pressed={isActive}
              >
                {isActive ? "Selecionada" : "Ouvir playlist"}
              </Button>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={handleCustomSubmit}
        className="flex flex-col gap-3 rounded-lg border border-dashed border-white/10 bg-black/40 p-3 sm:flex-row sm:items-center"
      >
        <div className="flex-1 space-y-1">
          <label
            htmlFor="customPlaylist"
            className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400"
          >
            Adicionar playlist personalizada
          </label>
          <input
            id="customPlaylist"
            name="customPlaylist"
            value={customInput}
            onChange={(event) => setCustomInput(event.target.value)}
            placeholder="Cole aqui o link da playlist do Spotify"
            className="w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[#6C3BF4] focus:outline-none focus:ring-2 focus:ring-[#6C3BF4]/30"
          />
          {customError ? (
            <p className="text-xs text-amber-300">{customError}</p>
          ) : hasCustomPlaylist ? (
            <p className="text-xs text-emerald-300">
              Playlist personalizada pronta para tocar.
            </p>
          ) : null}
        </div>
        <Button type="submit" className="whitespace-nowrap text-xs">
          Usar minha playlist
        </Button>
      </form>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">
          Reprodução atual
        </p>
        <div className="overflow-hidden rounded-xl border border-white/10 bg-black/60 shadow-inner">
          <div
            ref={containerRef}
            className={cn(
              "h-[232px] w-full",
              !isPlayerReady ? "grid place-items-center text-sm text-zinc-400" : undefined,
            )}
          >
            {!isPlayerReady && <p>Carregando player do Spotify...</p>}
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-black/40 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-zinc-300">Controle de volume</p>
            <Button
              type="button"
              variant="secondary"
              className="text-xs"
              onClick={() => setShowVolumeControls((prev) => !prev)}
              aria-expanded={showVolumeControls}
              disabled={!supportsVolumeControl}
            >
              {supportsVolumeControl
                ? showVolumeControls
                  ? "Ocultar medidor"
                  : "Medir volume"
                : "Indisponível"}
            </Button>
          </div>
          {supportsVolumeControl ? (
            showVolumeControls && (
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="playlistVolume"
                  className="text-xs uppercase tracking-[0.14em] text-zinc-400"
                >
                  Volume atual: {volume}%
                </label>
                <input
                  id="playlistVolume"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={volume}
                  onChange={(event) => handleVolumeChange(Number(event.target.value))}
                  className="accent-[#1DB954]"
                />
              </div>
            )
          ) : (
            <p className="text-xs text-amber-300">
              Ajuste o volume diretamente no player do Spotify.
            </p>
          )}
        </div>
        <p className="text-xs text-zinc-400">
          {activePlaylist.isCustom
            ? "Tocando a sua playlist do Spotify."
            : `Tocando: ${activePlaylist.label}.`}
        </p>
      </div>
    </section>
  );
}
