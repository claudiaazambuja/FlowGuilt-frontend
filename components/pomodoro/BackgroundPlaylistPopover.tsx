"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib";

import { BackgroundPlaylistSelector } from "./BackgroundPlaylistSelector";

export function BackgroundPlaylistPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }

      if (
        panelRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }

      setIsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative flex flex-col items-center">
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

      <div
        className={cn(
          "absolute top-full z-50 mt-3 w-full max-w-xl",
          "transition-opacity duration-150 ease-out",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        role="dialog"
        aria-modal="false"
        aria-label="Configurações do ambiente sonoro de fundo"
        aria-hidden={!isOpen}
      >
        <div ref={panelRef} className="relative">
          <BackgroundPlaylistSelector />
        </div>
      </div>
    </div>
  );
}
