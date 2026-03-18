"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/lib/hooks/useAuth";
import { LoginInput, loginSchema } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  WifiOff,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";

function getLoginError(error: unknown): { message: string; hint?: string } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const status = (error as any)?.response?.status;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const msg: string = (error as any)?.response?.data?.message ?? "";

  if (!status) {
    return {
      message: "Unable to connect to the server.",
      hint: "Check your internet connection and try again.",
    };
  }
  if (status === 401 || msg.toLowerCase().includes("invalid credentials")) {
    return {
      message: "Incorrect email or password.",
      hint: "Double-check your details, or reset your password if you've forgotten it.",
    };
  }
  if (status >= 500) {
    return {
      message: "Something went wrong on our end.",
      hint: "Please try again in a moment.",
    };
  }
  return { message: msg || "Sign in failed.", hint: "Please try again." };
}
const features = [
  { icon: Clock, text: "Track billable hours effortlessly" },
  { icon: FileText, text: "Generate PDF invoices in one click" },
  { icon: DollarSign, text: "Monitor your finances in real time" },
  { icon: CheckCircle2, text: "Manage clients and projects in one place" },
];

export default function LoginPage() {
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginInput) => {
    login.mutate(data);
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-gradient-to-br from-violet-950 via-violet-900 to-indigo-900 overflow-hidden">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-violet-500/20 blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-[80px]" />
        </div>

        {/* Logo */}
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

        {/* Center content */}
        <div className="relative space-y-8">
          <div className="space-y-3">
            <p className="text-violet-300 text-sm font-medium uppercase tracking-widest">
              Welcome back
            </p>
            <h1 className="text-4xl font-bold text-white leading-tight">
              The smarter way to run your freelance business
            </h1>
            <p className="text-violet-200/70 text-base leading-relaxed">
              Everything you need to track time, bill clients, and grow your
              income — in one clean workspace.
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

        {/* Bottom quote */}
        <div className="relative rounded-2xl bg-white/5 border border-white/10 p-5">
          <p className="text-violet-100/80 text-sm leading-relaxed italic">
            &ldquo;Flowbill cut the time I spend on admin from hours to minutes.
            I finally know exactly what I&apos;m earning.&rdquo;
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
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
          <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-violet-500/5 blur-[100px]" />
        </div>

        {/* Mobile logo */}
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
          {/* Heading */}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {login.error &&
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
                      {err.hint && (
                        <p className="text-destructive/80 text-xs">
                          {err.hint}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="h-11"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-11"
                {...register("password")}
              />
              <Link
                href="/forgot-password"
                className="text-xs text-violet-600 hover:text-violet-700 hover:underline transition-colors"
              >
                Forgot password?
              </Link>
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 transition-all"
              disabled={login.isPending}
            >
              {login.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-violet-600 hover:text-violet-700 hover:underline transition-colors"
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
