import type { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { WhatsAppFab } from "./WhatsAppFab";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <TopBar />
      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-12">
        {children}
      </main>
      <BottomNav />
      <WhatsAppFab />
    </div>
  );
}
