import type { Metadata } from "next";
import type { ReactNode } from "react";
import DashboardParticles from "@/components/three/DashboardParticles";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="halo-liquid opacity-35 fixed inset-0 pointer-events-none" aria-hidden="true" />
      <DashboardParticles />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
