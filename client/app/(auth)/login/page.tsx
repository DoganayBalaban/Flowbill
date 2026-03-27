"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/i18n/context";
import { LoginInput, loginSchema } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  ShieldAlert,
  WifiOff,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

const LOCKOUT_KEY = "login_lockout_until";

function getLockoutSeconds(): number {
  if (typeof window === "undefined") return 0;
  const until = localStorage.getItem(LOCKOUT_KEY);
  if (!until) return 0;
  const remaining = Math.ceil((parseInt(until, 10) - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

function setLockout(retryAfterSeconds: number) {
  const until = Date.now() + retryAfterSeconds * 1000;
  localStorage.setItem(LOCKOUT_KEY, String(until));
}

function clearLockout() {
  localStorage.removeItem(LOCKOUT_KEY);
}

export default function LoginPage() {
  const login = useLogin();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore lockout from localStorage on mount
  useEffect(() => {
    const remaining = getLockoutSeconds();
    if (remaining > 0) startCountdown(remaining);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startCountdown(seconds: number) {
    setCooldown(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          clearLockout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginInput) => {
    login.mutate(data, {
      onError: (error) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const status = (error as any)?.response?.status;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const retryAfter = (error as any)?.response?.headers?.["retry-after"];
        if (status === 429) {
          const seconds = retryAfter ? parseInt(retryAfter, 10) : 15 * 60;
          setLockout(seconds);
          startCountdown(seconds);
        }
      },
    });
  };

  function formatCooldown(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  function getLoginError(error: unknown): { message: string; hint?: string } {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status = (error as any)?.response?.status;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg: string = (error as any)?.response?.data?.message ?? "";

    if (!status) {
      return { message: t("auth.error_no_connection"), hint: t("auth.error_no_connection_hint") };
    }
    if (status === 429) {
      return {
        message: t("auth.error_too_many_attempts"),
        hint: t("auth.error_too_many_attempts_hint"),
      };
    }
    if (status === 401 || msg.toLowerCase().includes("invalid credentials")) {
      return { message: t("auth.error_invalid_credentials"), hint: t("auth.error_invalid_credentials_hint") };
    }
    if (status >= 500) {
      return { message: t("auth.error_server"), hint: t("auth.error_server_hint") };
    }
    return { message: msg || t("auth.error_sign_in_failed"), hint: t("auth.error_try_again") };
  }

  const features = [
    { icon: Clock, text: "Track billable hours effortlessly" },
    { icon: FileText, text: "Generate PDF invoices in one click" },
    { icon: DollarSign, text: "Monitor your finances in real time" },
    { icon: CheckCircle2, text: "Manage clients and projects in one place" },
  ];

  const isLocked = cooldown > 0;

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-gradient-to-br from-violet-950 via-violet-900 to-indigo-900 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-violet-500/20 blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-[80px]" />
        </div>

        <Link href="/" className="relative flex items-center gap-3 w-fit">
          <Image src="/logo-wo-text.png" alt="Flowbill" width={32} height={32} className="rounded" />
          <span className="text-white font-semibold text-lg tracking-tight">Flowbill</span>
        </Link>

        <div className="relative space-y-8">
          <div className="space-y-3">
            <p className="text-violet-300 text-sm font-medium uppercase tracking-widest">
              Welcome back
            </p>
            <h1 className="text-4xl font-bold text-white leading-tight">
              The smarter way to run your freelance business
            </h1>
            <p className="text-violet-200/70 text-base leading-relaxed">
              Everything you need to track time, bill clients, and grow your income — in one clean workspace.
            </p>
          </div>

          <ul className="space-y-3">
            {features.map((f) => (
              <li key={f.text} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <f.icon className="h-4 w-4 text-violet-300" />
                </span>
                <span className="text-violet-100/90 text-sm">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative rounded-2xl bg-white/5 border border-white/10 p-5">
          <p className="text-violet-100/80 text-sm leading-relaxed italic">
            &ldquo;Flowbill cut the time I spend on admin from hours to minutes. I finally know exactly what I&apos;m earning.&rdquo;
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-violet-400/30 flex items-center justify-center text-xs font-bold text-violet-200">
              S
            </div>
            <div>
              <p className="text-white text-xs font-medium">Sara K.</p>
              <p className="text-violet-300/60 text-xs">Freelance Designer</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-background relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
          <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-violet-500/5 blur-[100px]" />
        </div>

        <Link href="/" className="lg:hidden flex items-center gap-2 mb-10">
          <Image src="/logo-wo-text.png" alt="Flowbill" width={28} height={28} className="rounded dark:brightness-200" />
          <span className="font-semibold text-lg tracking-tight">Flowbill</span>
        </Link>

        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">{t("auth.sign_in")}</h2>
            <p className="text-sm text-muted-foreground">{t("auth.sign_in_desc")}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Lockout banner */}
            {isLocked && (
              <div className="rounded-lg border border-orange-300/40 bg-orange-50 dark:bg-orange-950/30 px-4 py-3 text-sm text-orange-700 dark:text-orange-400 flex gap-3">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-medium">{t("auth.error_too_many_attempts")}</p>
                  <p className="text-xs opacity-80">
                    {t("auth.error_lockout_countdown", { time: formatCooldown(cooldown) })}
                  </p>
                </div>
              </div>
            )}

            {/* Regular error banner */}
            {login.error && !isLocked &&
              (() => {
                const err = getLoginError(login.error);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const isNetwork = !(login.error as any)?.response?.status;
                return (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex gap-3">
                    {isNetwork ? (
                      <WifiOff className="h-4 w-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <p className="font-medium">{err.message}</p>
                      {err.hint && <p className="text-destructive/80 text-xs">{err.hint}</p>}
                    </div>
                  </div>
                );
              })()}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                {t("settings.email_address")}
              </Label>
              <Input id="email" type="email" placeholder="you@example.com" className="h-11" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                {t("auth.password")}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-11 pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Link href="/forgot-password" className="text-xs text-violet-600 hover:text-violet-700 hover:underline transition-colors">
                {t("auth.forgot_password")}
              </Link>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 transition-all"
              disabled={login.isPending || isLocked}
            >
              {login.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isLocked ? (
                `${t("auth.error_locked")} (${formatCooldown(cooldown)})`
              ) : (
                t("auth.sign_in")
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {t("auth.no_account")}{" "}
            <Link href="/register" className="font-medium text-violet-600 hover:text-violet-700 hover:underline transition-colors">
              {t("auth.create_free")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
