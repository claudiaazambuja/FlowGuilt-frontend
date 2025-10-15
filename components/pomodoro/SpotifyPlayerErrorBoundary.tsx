"use client";

import { Component, type ReactNode } from "react";

import { cn } from "@/lib";

type SpotifyPlayerErrorBoundaryProps = {
  children: ReactNode;
  className?: string;
};

type SpotifyPlayerErrorBoundaryState = {
  hasError: boolean;
};

export class SpotifyPlayerErrorBoundary
  extends Component<SpotifyPlayerErrorBoundaryProps, SpotifyPlayerErrorBoundaryState>
{
  public state: SpotifyPlayerErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): SpotifyPlayerErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Erro ao carregar o player do Spotify.", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className={cn(
            "grid h-[232px] w-full place-items-center rounded-xl border border-white/10 bg-black/60 px-4 text-center text-sm text-zinc-300",
            this.props.className,
          )}
        >
          <p>
            Não foi possível inicializar o player do Spotify neste navegador.
            Verifique sua conexão e tente novamente.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
