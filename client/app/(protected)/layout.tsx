"use client";

import { Navbar } from "@/components/navbar";
import { useUser } from "@/lib/hooks/useAuth";
import { usePlanLimitToast } from "@/lib/hooks/usePlanLimitToast";
import { useSocket } from "@/lib/hooks/useSocket";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user } = useUser();
  useSocket(user?.id);
  usePlanLimitToast();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
