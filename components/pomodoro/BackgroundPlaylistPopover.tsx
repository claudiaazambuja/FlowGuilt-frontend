"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib";

import { BackgroundPlaylistSelector } from "./BackgroundPlaylistSelector";

type BackgroundPlaylistPopoverProps = {
  initialOpen?: boolean;
  showTrigger?: boolean;
  dismissible?: boolean;
};

export function BackgroundPlaylistPopover({
  initialOpen = false,
  showTrigger = true,
  dismissible = true,
}: BackgroundPlaylistPopoverProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ top: 120, left: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const hasUserPositionedRef = useRef(false);
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
  } | null>(null);

  const clampPosition = useCallback(
    (desired: { top: number; left: number }) => {
      const panel = panelRef.current;
      const width = panel?.offsetWidth ?? 0;
      const height = panel?.offsetHeight ?? 0;
      const padding = 16;
      const maxLeft = Math.max(padding, window.innerWidth - width - padding);
      const maxTop = Math.max(padding, window.innerHeight - height - padding);

      return {
        top: Math.min(Math.max(desired.top, padding), maxTop),
        left: Math.min(Math.max(desired.left, padding), maxLeft),
      };
    },
    [],
  );

  const updatePosition = useCallback(
    (desired: { top: number; left: number }) => {
      setPosition((previous) => {
        const next = clampPosition(desired);
        if (previous.top === next.top && previous.left === next.left) {
          return previous;
        }
        return next;
      });
    },
    [clampPosition],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState) {
        return;
      }

      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;

      updatePosition({
        left: dragState.startLeft + deltaX,
        top: dragState.startTop + deltaY,
      });
    },
    [updatePosition],
  );

  const handlePointerUp = useCallback(() => {
    if (!dragStateRef.current) {
      return;
    }

    dragStateRef.current = null;
    hasUserPositionedRef.current = true;
    setIsDragging(false);
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  }, [handlePointerMove]);

  const handleDragStart = useCallback(
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
    setIsOpen(initialOpen);
  }, [initialOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }

      if (panelRef.current?.contains(target)) {
        return;
      }

      if (showTrigger && triggerRef.current?.contains(target)) {
        return;
      }

      if (dismissible) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dismissible) {
        setIsOpen(false);
      }
    };

    if (dismissible) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    const updateInitialPosition = () => {
      if (!panelRef.current) {
        return;
      }

      if (!hasUserPositionedRef.current) {
        if (showTrigger && triggerRef.current) {
          const triggerRect = triggerRef.current.getBoundingClientRect();
          const panelWidth = panelRef.current.offsetWidth;
          const desiredLeft = triggerRect.left + triggerRect.width / 2 - panelWidth / 2;
          const desiredTop = triggerRect.bottom + 12;
          updatePosition({
            top: desiredTop,
            left: desiredLeft,
          });
          return;
        }

        const panelWidth = panelRef.current.offsetWidth;
        const panelHeight = panelRef.current.offsetHeight;
        updatePosition({
          top: window.innerHeight / 2 - panelHeight / 2,
          left: window.innerWidth / 2 - panelWidth / 2,
        });
        return;
      }

      setPosition((prev) => {
        const next = clampPosition(prev);
        if (next.top === prev.top && next.left === prev.left) {
          return prev;
        }
        return next;
      });
    };

    const raf = window.requestAnimationFrame(updateInitialPosition);

    const handleResize = () => {
      setPosition((prev) => {
        const next = clampPosition(prev);
        if (next.top === prev.top && next.left === prev.left) {
          return prev;
        }
        return next;
      });
    };

    window.addEventListener("resize", handleResize);
    return () => {
      if (dismissible) {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      }

      window.removeEventListener("resize", handleResize);
      window.cancelAnimationFrame(raf);
    };
  }, [clampPosition, dismissible, isOpen, showTrigger, updatePosition]);

  return (
    <div className="relative flex flex-col items-center">
      {showTrigger && (
        <Button
          ref={triggerRef}
          type="button"
          variant="secondary"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        >
          Ambiente sonoro
        </Button>
      )}

      <div
        ref={panelRef}
        className={cn(
          "fixed z-50 w-full max-w-xl transition-opacity duration-150 ease-out",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        style={{ top: position.top, left: position.left }}
        role="dialog"
        aria-modal="false"
        aria-label="Configurações do ambiente sonoro de fundo"
        aria-hidden={!isOpen}
      >
        <div className="overflow-hidden rounded-xl border border-white/5 bg-[#161616]/90 shadow-2xl backdrop-blur">
          <div
            onPointerDown={handleDragStart}
            className={cn(
              "flex cursor-move items-center justify-center gap-2 border-b border-white/5 bg-black/20 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-zinc-400",
              isDragging ? "cursor-grabbing select-none" : undefined,
            )}
          >
            <span aria-hidden="true">⠿</span>
            <span>Arraste para mover</span>
          </div>
          <BackgroundPlaylistSelector />
        </div>
      </div>
    </div>
  );
}
