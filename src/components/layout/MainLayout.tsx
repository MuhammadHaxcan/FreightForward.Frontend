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
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <CBMCalculatorWidget />
    </div>
  );
}
