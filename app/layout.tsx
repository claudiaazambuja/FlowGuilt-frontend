import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FlowGuilt Pomodoro",
  description: "Pomodoro frontend MVP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
