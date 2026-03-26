"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegister } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/i18n/context";
import { RegisterInput, registerSchema } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  BarChart3,
  Check,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  UserRoundX,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

type RegisterError =
  | { kind: "email_taken" }
  | { kind: "network" }
  | { kind: "server" }
  | { kind: "generic"; message: string };

function getRegisterError(error: unknown): RegisterError {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const status = (error as any)?.response?.status;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const msg: string = (error as any)?.response?.data?.message ?? "";

  if (!status) return { kind: "network" };
  if (status === 400 && msg.toLowerCase().includes("already exists")) return { kind: "email_taken" };
  if (status >= 500) return { kind: "server" };
  return { kind: "generic", message: msg || "Registration failed." };
}

const perks = [
  { icon: Clock, text: "Unlimited time tracking" },
  { icon: FileText, text: "Professional PDF invoicing" },
  { icon: BarChart3, text: "Real-time financial dashboard" },
  { icon: Zap, text: "Up and running in under 5 minutes" },
];

export default function RegisterPage() {
  const registerMutation = useRegister();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const password = useWatch({ control, name: "password", defaultValue: "" });

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const strengthCount = Object.values(passwordChecks).filter(Boolean).length;
  const strengthLabel =
    strengthCount <= 1
      ? { text: t("auth.strength_weak"), color: "bg-red-500" }
      : strengthCount <= 3
        ? { text: t("auth.strength_fair"), color: "bg-amber-500" }
        : strengthCount === 4
          ? { text: t("auth.strength_good"), color: "bg-blue-500" }
          : { text: t("auth.strength_strong"), color: "bg-emerald-500" };

  const onSubmit = (data: RegisterInput) => {
    registerMutation.mutate(data);
  };

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
            <p className="text-violet-300 text-sm font-medium uppercase tracking-widest">Free to get started</p>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Join freelancers who work smarter, not harder
            </h1>
            <p className="text-violet-200/70 text-base leading-relaxed">
              Manage your clients, projects, and invoices without the chaos. Everything in one place, ready in minutes.
            </p>
          </div>

          <ul className="space-y-3">
            {perks.map((p) => (
              <li key={p.text} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <p.icon className="h-4 w-4 text-violet-300" />
                </span>
                <span className="text-violet-100/90 text-sm">{p.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative grid grid-cols-2 gap-3">
          {[
            { value: "< 10 min", label: "daily admin time" },
            { value: "1-click", label: "invoice generation" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-white font-bold text-2xl">{s.value}</p>
              <p className="text-violet-300/70 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-background relative overflow-y-auto">
        <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
          <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-violet-500/5 blur-[100px]" />
        </div>

        <Link href="/" className="lg:hidden flex items-center gap-2 mb-10">
          <Image src="/logo-wo-text.png" alt="Flowbill" width={28} height={28} className="rounded dark:brightness-200" />
          <span className="font-semibold text-lg tracking-tight">Flowbill</span>
        </Link>

        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">{t("auth.create_account")}</h2>
            <p className="text-sm text-muted-foreground">{t("auth.create_account_desc")}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {registerMutation.error &&
              (() => {
                const err = getRegisterError(registerMutation.error);

                if (err.kind === "email_taken") {
                  return (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400 flex gap-3">
                      <UserRoundX className="h-4 w-4 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-medium">{t("auth.error_email_taken")}</p>
                        <p className="text-xs opacity-80">
                          <Link href="/login" className="underline underline-offset-2 hover:opacity-100">
                            {t("auth.error_email_taken_sign_in")}
                          </Link>{" "}
                          {t("auth.error_email_taken_or")}
                        </p>
                      </div>
                    </div>
                  );
                }

                if (err.kind === "network") {
                  return (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex gap-3">
                      <WifiOff className="h-4 w-4 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-medium">{t("auth.error_no_connection")}</p>
                        <p className="text-xs text-destructive/80">{t("auth.error_no_connection_hint")}</p>
                      </div>
                    </div>
                  );
                }

                const message = err.kind === "server" ? t("auth.error_server") : err.message;
                const hint = err.kind === "server" ? t("auth.error_server_hint") : t("auth.error_try_again");

                return (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex gap-3">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-medium">{message}</p>
                      <p className="text-xs text-destructive/80">{hint}</p>
                    </div>
                  </div>
                );
              })()}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">{t("settings.first_name")}</Label>
                <Input id="firstName" placeholder="John" className="h-11" {...register("firstName")} />
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">{t("settings.last_name")}</Label>
                <Input id="lastName" placeholder="Doe" className="h-11" {...register("lastName")} />
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">{t("settings.email_address")}</Label>
              <Input id="email" type="email" placeholder="you@example.com" className="h-11" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">{t("auth.password")}</Label>
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
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}

              {password && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strengthCount ? strengthLabel.color : "bg-muted"}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{strengthLabel.text}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {[
                      { ok: passwordChecks.length, label: t("auth.check_8_chars") },
                      { ok: passwordChecks.uppercase, label: t("auth.check_uppercase") },
                      { ok: passwordChecks.lowercase, label: t("auth.check_lowercase") },
                      { ok: passwordChecks.number, label: t("auth.check_number") },
                      { ok: passwordChecks.special, label: t("auth.check_special") },
                    ].map((c) => (
                      <div key={c.label} className={`flex items-center gap-1 text-xs transition-colors ${c.ok ? "text-emerald-600" : "text-muted-foreground"}`}>
                        {c.ok ? <Check className="h-3 w-3 shrink-0" /> : <X className="h-3 w-3 shrink-0" />}
                        {c.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 transition-all"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.create_account_btn")}
            </Button>

            <p className="text-center text-xs text-muted-foreground leading-relaxed">
              {t("auth.terms_agree")}{" "}
              <Link href="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors">
                {t("auth.terms_of_service")}
              </Link>{" "}
              {t("auth.and")}{" "}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">
                {t("auth.privacy_policy")}
              </Link>
              .
            </p>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {t("auth.already_have_account")}{" "}
            <Link href="/login" className="font-medium text-violet-600 hover:text-violet-700 hover:underline transition-colors">
              {t("auth.sign_in")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
