"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useResetPassword } from "@/lib/hooks/useAuth";
import {
  ResetPasswordInput,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Check,
  KeyRound,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

/* ── Shared left panel ─────────────────────────────────── */
function LeftPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-gradient-to-br from-violet-950 via-violet-900 to-indigo-900 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-violet-500/20 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-[80px]" />
      </div>

      <Link href="/" className="relative flex items-center gap-3 w-fit">
        <Image
          src="/logo-wo-text.png"
          alt="Flowbill"
          width={32}
          height={32}
          className="rounded"
        />
        <span className="text-white font-semibold text-lg tracking-tight">
          Flowbill
        </span>
      </Link>

      <div className="relative space-y-8">
        <div className="space-y-3">
          <p className="text-violet-300 text-sm font-medium uppercase tracking-widest">
            Almost there
          </p>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Create a strong new password
          </h1>
          <p className="text-violet-200/70 text-base leading-relaxed">
            Choose a password you haven&apos;t used before. A strong password
            keeps your client data, invoices, and time logs safe.
          </p>
        </div>

        <ul className="space-y-3">
          {[
            { icon: ShieldCheck, text: "At least 8 characters long" },
            {
              icon: ShieldCheck,
              text: "Mix of uppercase and lowercase letters",
            },
            {
              icon: ShieldCheck,
              text: "At least one number and special character",
            },
          ].map((item) => (
            <li key={item.text} className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <item.icon className="h-4 w-4 text-violet-300" />
              </span>
              <span className="text-violet-100/90 text-sm">{item.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative rounded-2xl bg-white/5 border border-white/10 p-5">
        <p className="text-violet-100/70 text-sm leading-relaxed">
          <span className="font-semibold text-white">Tip:</span> Use a
          passphrase — a short sentence or a few random words — for a password
          that&apos;s both strong and easy to remember.
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const params = useParams();
  const token = params.token as string;
  const [success, setSuccess] = useState(false);
  const resetPassword = useResetPassword();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

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
      ? { text: "Weak", color: "bg-red-500" }
      : strengthCount <= 3
        ? { text: "Fair", color: "bg-amber-500" }
        : strengthCount === 4
          ? { text: "Good", color: "bg-blue-500" }
          : { text: "Strong", color: "bg-emerald-500" };

  const onSubmit = (data: ResetPasswordInput) => {
    resetPassword.mutate(
      { token, password: data.password },
      { onSuccess: () => setSuccess(true) },
    );
  };

  /* ── Success state ─────────────────────────────────────── */
  if (success) {
    return (
      <div className="min-h-screen flex">
        <LeftPanel />

        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-background relative">
          <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
            <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-violet-500/5 blur-[100px]" />
          </div>

          <Link href="/" className="lg:hidden flex items-center gap-2 mb-10">
            <Image
              src="/logo-wo-text.png"
              alt="Flowbill"
              width={28}
              height={28}
              className="rounded dark:brightness-200"
            />
            <span className="font-semibold text-lg tracking-tight">
              Flowbill
            </span>
          </Link>

          <div className="w-full max-w-sm space-y-8 text-center">
            <div className="flex justify-center">
              <div className="relative">
                <div className="h-20 w-20 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                  <KeyRound className="h-9 w-9 text-violet-600" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">
                Password updated
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Your password has been changed successfully. You can now sign in
                with your new password.
              </p>
            </div>

            <Button
              asChild
              className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20"
            >
              <Link href="/login">
                Sign in to your account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Form state ────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex">
      <LeftPanel />

      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-background relative overflow-y-auto">
        <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
          <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-violet-500/5 blur-[100px]" />
        </div>

        <Link href="/" className="lg:hidden flex items-center gap-2 mb-10">
          <Image
            src="/logo-wo-text.png"
            alt="Flowbill"
            width={28}
            height={28}
            className="rounded dark:brightness-200"
          />
          <span className="font-semibold text-lg tracking-tight">Flowbill</span>
        </Link>

        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <KeyRound className="h-6 w-6 text-violet-600" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">
                Set a new password
              </h2>
              <p className="text-sm text-muted-foreground">
                Must be different from your previous password.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {resetPassword.error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(resetPassword.error as any).response?.data?.message ||
                  "Reset link is invalid or has expired. Please request a new one."}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                New password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-11"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}

              {password && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i <= strengthCount
                              ? strengthLabel.color
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {strengthLabel.text}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {[
                      { ok: passwordChecks.length, label: "8+ characters" },
                      {
                        ok: passwordChecks.uppercase,
                        label: "Uppercase letter",
                      },
                      {
                        ok: passwordChecks.lowercase,
                        label: "Lowercase letter",
                      },
                      { ok: passwordChecks.number, label: "Number" },
                      {
                        ok: passwordChecks.special,
                        label: "Special character",
                      },
                    ].map((c) => (
                      <div
                        key={c.label}
                        className={`flex items-center gap-1 text-xs transition-colors ${
                          c.ok ? "text-emerald-600" : "text-muted-foreground"
                        }`}
                      >
                        {c.ok ? (
                          <Check className="h-3 w-3 shrink-0" />
                        ) : (
                          <X className="h-3 w-3 shrink-0" />
                        )}
                        {c.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="h-11"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 transition-all"
              disabled={resetPassword.isPending}
            >
              {resetPassword.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Update password"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-medium text-violet-600 hover:text-violet-700 hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
