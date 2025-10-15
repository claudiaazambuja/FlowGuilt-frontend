"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib";

import { useBackgroundPlaylist } from "./BackgroundPlaylistProvider";

type SpotifyPlayerSurfaceProps = {
  className?: string;
  placeholder?: React.ReactNode;
};

export function SpotifyPlayerSurface({
  className,
  placeholder,
}: SpotifyPlayerSurfaceProps) {
  const { registerContainer, isPlayerReady } = useBackgroundPlaylist();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    registerContainer(element);

    return () => {
      registerContainer(null);
    };
  }, [registerContainer]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "h-[232px] w-full overflow-hidden",
        !isPlayerReady
          ? "grid place-items-center text-sm text-zinc-400"
          : undefined,
        className,
      )}
    >
      {!isPlayerReady
        ? placeholder ?? <p>Carregando player do Spotify...</p>
        : null}
    </div>
  );
}
