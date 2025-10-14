import { useEffect } from "react";

type Options = {
  onStartPause: () => void;
  onRestart: () => void;
};

const INTERACTIVE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function useTimerKeyboardShortcuts({ onRestart, onStartPause }: Options) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName ?? "";

      if (target?.isContentEditable || INTERACTIVE_TAGS.has(tagName)) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        onStartPause();
        return;
      }

      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        onRestart();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onRestart, onStartPause]);
}
