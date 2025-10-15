"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib";

import { useBackgroundPlaylist } from "./BackgroundPlaylistProvider";
import { SpotifyPlayerErrorBoundary } from "./SpotifyPlayerErrorBoundary";
import { SpotifyPlayerSurface } from "./SpotifyPlayerSurface";

export function MobileSpotifyPlayer() {
  const isMobile = useMediaQuery("(max-width: 639px)");
  const { activePlaylist } = useBackgroundPlaylist();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
  } | null>(null);
  const [position, setPosition] = useState({ top: 120, left: 16 });
  const [isDragging, setIsDragging] = useState(false);

  const clampPosition = useCallback((desired: { top: number; left: number }) => {
    const panel = panelRef.current;
    const width = panel?.offsetWidth ?? 0;
    const height = panel?.offsetHeight ?? 0;
    const padding = 12;
    const maxLeft = Math.max(padding, window.innerWidth - width - padding);
    const maxTop = Math.max(padding, window.innerHeight - height - padding);

    return {
      top: Math.min(Math.max(desired.top, padding), maxTop),
      left: Math.min(Math.max(desired.left, padding), maxLeft),
    };
  }, []);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState) {
        return;
      }

      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;

      setPosition((previous) =>
        clampPosition({
          left: dragState.startLeft + deltaX,
          top: dragState.startTop + deltaY,
        }),
      );
    },
    [clampPosition],
  );

  const handlePointerUp = useCallback(() => {
    if (!dragStateRef.current) {
      return;
    }

    dragStateRef.current = null;
    setIsDragging(false);
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  }, [handlePointerMove]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!panelRef.current) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      dragStateRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        startLeft: position.left,
        startTop: position.top,
      };

      setIsDragging(true);
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [handlePointerMove, handlePointerUp, position.left, position.top],
  );

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  useEffect(() => {
    if (!isMobile) {
      return;
    }

    const updateInitialPosition = () => {
      const panel = panelRef.current;
      const width = panel?.offsetWidth ?? 320;
      const height = panel?.offsetHeight ?? 260;
      const padding = 12;
      const desiredTop = Math.max(padding, window.innerHeight - height - padding);
      const desiredLeft = Math.max(
        padding,
        window.innerWidth / 2 - width / 2,
      );

      setPosition((previous) => {
        if (previous.top === desiredTop && previous.left === desiredLeft) {
          return previous;
        }
        return { top: desiredTop, left: desiredLeft };
      });
    };

    const raf = window.requestAnimationFrame(updateInitialPosition);
    window.addEventListener("resize", updateInitialPosition);

    return () => {
      window.removeEventListener("resize", updateInitialPosition);
      window.cancelAnimationFrame(raf);
    };
  }, [isMobile]);

  if (!isMobile) {
    return null;
  }

  return (
    <div className="sm:hidden">
      <div
        ref={panelRef}
        className="fixed z-40 w-[calc(100vw-32px)] max-w-sm"
        style={{ top: position.top, left: position.left }}
      >
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#161616]/95 shadow-2xl backdrop-blur">
          <div
            onPointerDown={handlePointerDown}
            className={cn(
              "flex cursor-move items-center justify-center gap-2 border-b border-white/5 bg-black/30 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400",
              isDragging ? "cursor-grabbing select-none" : undefined,
            )}
          >
            <span aria-hidden="true">⠿</span>
            <span>Arraste o player</span>
          </div>
          <div className="p-3">
            <SpotifyPlayerErrorBoundary className="overflow-hidden rounded-xl border border-white/10 bg-black/60">
              <SpotifyPlayerSurface className="overflow-hidden rounded-xl" />
            </SpotifyPlayerErrorBoundary>
          </div>
          <p className="px-4 pb-4 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
            {activePlaylist.isCustom
              ? "Sua playlist está pronta para tocar."
              : `Tocando: ${activePlaylist.label}.`}
          </p>
        </div>
      </div>
    </div>
  );
}
