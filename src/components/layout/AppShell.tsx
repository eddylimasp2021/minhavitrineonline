import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { WhatsAppFab } from "./WhatsAppFab";
import { track } from "@/hooks/use-track";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    track("page_view", { path: pathname });
  }, [pathname]);

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
