import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Portal | Flowbill",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {children}
    </div>
  );
}
