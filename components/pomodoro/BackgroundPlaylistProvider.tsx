"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";

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
    id: "brazilian-lofi-2",
    name: "Brazilian Lofi",
    description: "Lofi nacional com groove leve e constante.",
    spotifyId: "7K3scENpOi7ZPZUHfnfic3",
  },
] as const;

export type DefaultPlaylist = (typeof DEFAULT_PLAYLISTS)[number];

export type ActivePlaylist = {
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

type BackgroundPlaylistContextValue = {
  activePlaylist: ActivePlaylist;
  setActivePlaylist: (playlist: ActivePlaylist) => void;
  isPlayerReady: boolean;
  supportsVolumeControl: boolean;
  volume: number;
  setVolume: (value: number) => void;
  registerContainer: (element: HTMLDivElement | null) => void;
};

const BackgroundPlaylistContext =
  createContext<BackgroundPlaylistContextValue | null>(null);

const DEFAULT_RANDOM_POOL_SIZE = 20;

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

export function BackgroundPlaylistProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [activePlaylist, setActivePlaylist] = useState<ActivePlaylist>({
    spotifyId: DEFAULT_PLAYLISTS[0].spotifyId,
    label: DEFAULT_PLAYLISTS[0].name,
    isCustom: false,
  });
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [supportsVolumeControl, setSupportsVolumeControl] = useState(false);
  const [volume, setVolume] = useState(70);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  const spotifyApi = useSpotifyIframeApi();
  const controllerRef: MutableRefObject<SpotifyEmbedController | null> =
    useRef<SpotifyEmbedController | null>(null);
  const desiredPlaybackRef = useRef(false);
  const lastPlaybackIntentRef = useRef(false);
  const lastRandomizedPlaylistRef = useRef<string | null>(null);
  const activePlaylistRef = useRef(activePlaylist);
  const volumeRef = useRef(volume);

  useEffect(() => {
    activePlaylistRef.current = activePlaylist;
  }, [activePlaylist]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const registerContainer = useCallback((element: HTMLDivElement | null) => {
    setContainer(element);
  }, []);

  const attemptRandomizedStart = useCallback(
    async (controller: SpotifyEmbedController) => {
      const playlistId = activePlaylistRef.current.spotifyId;
      const playlistUri = `spotify:playlist:${playlistId}`;

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
    [],
  );

  const syncControllerPlayback = useCallback(
    (controller?: SpotifyEmbedController | null) => {
      const target = controller ?? controllerRef.current;
      if (!target) {
        return;
      }

      const shouldPlay = desiredPlaybackRef.current;
      const playlistId = activePlaylistRef.current.spotifyId;

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
    [attemptRandomizedStart],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleSpotifyError = (event: ErrorEvent) => {
      const filename = event.filename ?? "";
      if (typeof filename === "string" && filename.includes("embed-cdn.spotifycdn.com")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        console.warn("Erro suprimido do player do Spotify.", event.error ?? event.message);
        return false;
      }
      return undefined;
    };

    const captureOptions = { capture: true } as const;

    window.addEventListener("error", handleSpotifyError, captureOptions);

    const previousOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      if (typeof source === "string" && source.includes("embed-cdn.spotifycdn.com")) {
        console.warn("Erro suprimido do player do Spotify.", error ?? message);
        return true;
      }

      if (typeof previousOnError === "function") {
        return previousOnError(message, source, lineno, colno, error);
      }

      return false;
    };

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
      window.removeEventListener("error", handleSpotifyError, captureOptions);
      window.onerror = previousOnError ?? null;
      window.removeEventListener("flowguilt:pomodoro-timer-start", handleStart);
      window.removeEventListener("flowguilt:pomodoro-timer-pause", handlePause);
    };
  }, [syncControllerPlayback]);

  useEffect(() => {
    const element = container;

    if (!element) {
      controllerRef.current?.destroy?.();
      controllerRef.current = null;
      setIsPlayerReady(false);
      setSupportsVolumeControl(false);
      return;
    }

    if (!spotifyApi) {
      setIsPlayerReady(false);
      setSupportsVolumeControl(false);
      return;
    }

    let isCancelled = false;

    try {
      spotifyApi.createController(
        element,
        {
          uri: `spotify:playlist:${activePlaylistRef.current.spotifyId}`,
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
            void controller.setVolume?.(volumeRef.current / 100);
          }
          syncControllerPlayback(controller);
          setIsPlayerReady(true);
        },
      );
    } catch (error) {
      console.error("Erro ao inicializar o player do Spotify.", error);
      setIsPlayerReady(false);
      setSupportsVolumeControl(false);
    }

    return () => {
      isCancelled = true;
      const controller = controllerRef.current;
      controllerRef.current = null;

      try {
        controller?.pause?.();
      } catch (error) {
        console.warn("Erro ao pausar o player do Spotify.", error);
      }

      const node = element;
      if (node) {
        try {
          while (node.firstChild) {
            node.removeChild(node.firstChild);
          }
        } catch (error) {
          console.warn("Erro ao limpar container do Spotify.", error);
        }
      }

      setIsPlayerReady(false);
      setSupportsVolumeControl(false);
    };
  }, [container, spotifyApi, syncControllerPlayback]);

  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller) {
      return;
    }

    lastRandomizedPlaylistRef.current = null;
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
  }, [activePlaylist.spotifyId, syncControllerPlayback]);

  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller?.setVolume) {
      return;
    }

    void controller.setVolume(volume / 100);
  }, [volume]);

  useEffect(() => {
    return () => {
      desiredPlaybackRef.current = false;
      controllerRef.current?.pause?.();
      controllerRef.current?.destroy?.();
    };
  }, []);

  const value = useMemo<BackgroundPlaylistContextValue>(
    () => ({
      activePlaylist,
      setActivePlaylist,
      isPlayerReady,
      supportsVolumeControl,
      volume,
      setVolume,
      registerContainer,
    }),
    [
      activePlaylist,
      isPlayerReady,
      registerContainer,
      supportsVolumeControl,
      volume,
    ],
  );

  return (
    <BackgroundPlaylistContext.Provider value={value}>
      {children}
    </BackgroundPlaylistContext.Provider>
  );
}

export function useBackgroundPlaylist(): BackgroundPlaylistContextValue {
  const context = useContext(BackgroundPlaylistContext);
  if (!context) {
    throw new Error(
      "useBackgroundPlaylist deve ser usado dentro de BackgroundPlaylistProvider",
    );
  }
  return context;
}

export { DEFAULT_PLAYLISTS };
