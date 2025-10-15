"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib";

import {
  DEFAULT_PLAYLISTS,
  useBackgroundPlaylist,
  type DefaultPlaylist,
} from "./BackgroundPlaylistProvider";
import { SpotifyPlayerErrorBoundary } from "./SpotifyPlayerErrorBoundary";
import { SpotifyPlayerSurface } from "./SpotifyPlayerSurface";

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

export function BackgroundPlaylistSelector() {
  const {
    activePlaylist,
    setActivePlaylist,
    supportsVolumeControl,
    volume,
    setVolume,
  } = useBackgroundPlaylist();
  const [customInput, setCustomInput] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const [hasCustomPlaylist, setHasCustomPlaylist] = useState(false);
  const [showVolumeControls, setShowVolumeControls] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 640px)");

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
    if (!supportsVolumeControl) {
      setShowVolumeControls(false);
    }
  }, [supportsVolumeControl]);

  useEffect(() => {
    if (activePlaylist.isCustom) {
      setHasCustomPlaylist(true);
    }
  }, [activePlaylist.isCustom]);

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
        {isDesktop ? (
          <SpotifyPlayerErrorBoundary>
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/60 shadow-inner">
              <SpotifyPlayerSurface />
            </div>
          </SpotifyPlayerErrorBoundary>
        ) : (
          <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-zinc-400">
            O player do Spotify aparece como painel flutuante no canto da tela.
          </div>
        )}
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
