"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForgotPassword } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/i18n/context";
import { ForgotPasswordInput, forgotPasswordSchema } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

function LeftPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-gradient-to-br from-violet-950 via-violet-900 to-indigo-900 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-violet-500/20 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-[80px]" />
      </div>

      <Link href="/" className="relative flex items-center gap-3 w-fit">
        <Image src="/logo-wo-text.png" alt="Flowbill" width={32} height={32} className="rounded brightness-200" />
        <span className="text-white font-semibold text-lg tracking-tight">Flowbill</span>
      </Link>

      <div className="relative space-y-8">
        <div className="space-y-3">
          <p className="text-violet-300 text-sm font-medium uppercase tracking-widest">Account recovery</p>
          <h1 className="text-4xl font-bold text-white leading-tight">We&apos;ll get you back in seconds</h1>
          <p className="text-violet-200/70 text-base leading-relaxed">
            Enter the email linked to your account and we&apos;ll send a secure reset link straight to your inbox.
          </p>
        </div>

        <ul className="space-y-3">
          {[
            { icon: Mail, text: "Reset link sent to your inbox" },
            { icon: ShieldCheck, text: "Link expires after 1 hour for security" },
            { icon: KeyRound, text: "Choose a new password immediately" },
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
          <span className="font-semibold text-white">Tip:</span> Check your spam folder if the email doesn&apos;t arrive within a couple of minutes.
        </p>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = useState(false);
  const forgotPassword = useForgotPassword();
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = (data: ForgotPasswordInput) => {
    forgotPassword.mutate(data.email, { onSuccess: () => setEmailSent(true) });
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex">
        <LeftPanel />
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-background relative">
          <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
            <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-violet-500/5 blur-[100px]" />
          </div>

          <Link href="/" className="lg:hidden flex items-center gap-2 mb-10">
            <Image src="/logo-wo-text.png" alt="Flowbill" width={28} height={28} className="rounded dark:brightness-200" />
            <span className="font-semibold text-lg tracking-tight">Flowbill</span>
          </Link>

          <div className="w-full max-w-sm space-y-8 text-center">
            <div className="flex justify-center">
              <div className="relative">
                <div className="h-20 w-20 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                  <Mail className="h-9 w-9 text-violet-600" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">{t("auth.check_inbox")}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t("auth.check_inbox_desc", { email: getValues("email") })}
              </p>
            </div>

            <div className="rounded-xl border bg-muted/40 p-4 text-left space-y-2">
              <p className="text-xs font-medium text-foreground">{t("auth.didnt_receive")}</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>{t("auth.check_spam")}</li>
                <li>{t("auth.check_email_correct")}</li>
                <li>{t("auth.check_wait")}</li>
              </ul>
            </div>

            <Button asChild variant="outline" className="w-full h-11">
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("auth.back_to_sign_in")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <LeftPanel />
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-background relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
          <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-violet-500/5 blur-[100px]" />
        </div>

        <Link href="/" className="lg:hidden flex items-center gap-2 mb-10">
          <Image src="/logo-wo-text.png" alt="Flowbill" width={28} height={28} className="rounded dark:brightness-200" />
          <span className="font-semibold text-lg tracking-tight">Flowbill</span>
        </Link>

        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <KeyRound className="h-6 w-6 text-violet-600" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">{t("auth.forgot_password_title")}</h2>
              <p className="text-sm text-muted-foreground">{t("auth.forgot_password_desc")}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {forgotPassword.error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(forgotPassword.error as any).response?.data?.message || t("auth.error_generic")}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">{t("settings.email_address")}</Label>
              <Input id="email" type="email" placeholder="you@example.com" className="h-11" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 transition-all"
              disabled={forgotPassword.isPending}
            >
              {forgotPassword.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.send_reset_link")}
            </Button>
          </form>

          <Button asChild variant="ghost" className="w-full h-10 text-muted-foreground">
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("auth.back_to_sign_in")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
