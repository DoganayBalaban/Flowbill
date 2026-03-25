"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useLogout, useUser } from "@/lib/hooks/useAuth";
import {
  FileText,
  FolderOpen,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Receipt,
  Settings,
  Timer,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Projects", href: "/projects", icon: FolderOpen },
  { label: "Invoices", href: "/invoices", icon: FileText },
  { label: "Time", href: "/time-entries", icon: Timer },
  { label: "Expenses", href: "/expenses", icon: Receipt },
];

function UserAvatar({
  firstName,
  lastName,
  email,
  avatarUrl,
}: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
  avatarUrl?: string | null;
}) {
  const initials =
    [firstName?.[0], lastName?.[0]].filter(Boolean).join("").toUpperCase() ||
    email?.[0]?.toUpperCase() ||
    "?";

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt="Avatar"
        className="h-8 w-8 rounded-full object-cover ring-2 ring-background"
      />
    );
  }

  return (
    <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-700 dark:text-violet-300 text-xs font-bold ring-2 ring-background">
      {initials}
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { data: user } = useUser();
  const logout = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sayfa değişince mobil menüyü kapat
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl gap-3 mx-auto flex h-14 items-center px-6">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2.5 shrink-0"
        >
          <Image
            src="/logo-wo-text.png"
            alt="Flowbill"
            width={30}
            height={30}
            className="rounded"
          />
          <span className="font-semibold text-lg tracking-tight">Flowbill</span>
        </Link>

        {/* Nav Links — sadece desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={
                    isActive
                      ? "font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          <Separator orientation="vertical" className="h-5 hidden sm:block" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                aria-label="User menu"
              >
                <UserAvatar
                  firstName={user?.first_name}
                  lastName={user?.last_name}
                  email={user?.email}
                  avatarUrl={user?.avatar_url}
                />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium leading-none">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground leading-none mt-1">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                {logout.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Hamburger — sadece mobile */}
          <button
            className="md:hidden flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menü */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background px-4 py-3 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={`w-full justify-start ${
                    isActive
                      ? "font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
