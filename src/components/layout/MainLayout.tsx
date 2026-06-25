import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { CBMCalculatorWidget } from "@/components/CBMCalculatorWidget";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      {/* pt-14 on mobile clears the fixed top app bar rendered by <Sidebar /> */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0 min-w-0">
        {children}
      </main>
      <CBMCalculatorWidget />
    </div>
  );
}
