import type { ReactNode } from "react";
import DashboardParticles from "@/components/three/DashboardParticles";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <DashboardParticles />
      {children}
    </div>
  );
}
