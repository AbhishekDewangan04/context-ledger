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
    <div className="relative min-h-screen">
      <DashboardParticles />
      {children}
    </div>
  );
}
