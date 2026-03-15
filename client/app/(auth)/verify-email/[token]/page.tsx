"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useResendVerification, useVerifyEmail } from "@/lib/hooks/useAuth";
import { ArrowRight, Loader2, MailCheck, MailX, Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Status = "loading" | "success" | "error" | "resent";

/* ── Shared split layout ───────────────────────────────────── */
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
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

        <div className="relative space-y-4">
          <p className="text-violet-300 text-sm font-medium uppercase tracking-widest">
            One last step
          </p>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Confirming your email address
          </h1>
          <p className="text-violet-200/70 text-base leading-relaxed">
            Email verification keeps your account secure and ensures you receive
            important updates about your invoices and projects.
          </p>
        </div>

        <div className="relative rounded-2xl bg-white/5 border border-white/10 p-5">
          <p className="text-violet-100/70 text-sm leading-relaxed">
            <span className="font-semibold text-white">Almost done.</span> Once
            verified, you&apos;ll have full access to time tracking, invoicing,
            and everything Flowbill has to offer.
          </p>
        </div>
      </div>

      {/* Right panel */}
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
          <span className="font-semibold text-lg tracking-tight">Flowbill</span>
        </Link>

        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  const params = useParams();
  const token = params.token as string;
  const verifyEmail = useVerifyEmail();
  const resendVerification = useResendVerification();
  const [status, setStatus] = useState<Status>("loading");
  const [resendEmail, setResendEmail] = useState("");

  useEffect(() => {
    if (token) {
      verifyEmail.mutate(token, {
        onSuccess: () => setStatus("success"),
        onError: () => setStatus("error"),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleResend = () => {
    if (!resendEmail) return;
    resendVerification.mutate(resendEmail, {
      onSuccess: () => setStatus("resent"),
    });
  };

  /* ── Loading ─────────────────────────────────────────────── */
  if (status === "loading") {
    return (
      <Layout>
        <div className="space-y-8 text-center">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-2xl bg-violet-500/10 flex items-center justify-center">
              <Loader2 className="h-9 w-9 text-violet-600 animate-spin" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              Verifying your email
            </h2>
            <p className="text-sm text-muted-foreground">
              Just a moment while we confirm your address…
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  /* ── Success ─────────────────────────────────────────────── */
  if (status === "success") {
    return (
      <Layout>
        <div className="space-y-8 text-center">
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                <MailCheck className="h-9 w-9 text-violet-600" />
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
              Email verified!
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your email address has been confirmed. You now have full access to
              your Flowbill account.
            </p>
          </div>

          <Button
            asChild
            className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20"
          >
            <Link href="/dashboard">
              Go to dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  /* ── Resent ──────────────────────────────────────────────── */
  if (status === "resent") {
    return (
      <Layout>
        <div className="space-y-8 text-center">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-2xl bg-violet-500/10 flex items-center justify-center">
              <MailCheck className="h-9 w-9 text-violet-600" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Check your inbox</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If an unverified account exists for <strong>{resendEmail}</strong>,
              a new verification link has been sent. It expires in 24 hours.
            </p>
          </div>
          <Button asChild variant="outline" className="w-full h-11">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  /* ── Error ───────────────────────────────────────────────── */
  return (
    <Layout>
      <div className="space-y-8 text-center">
        <div className="flex justify-center">
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <MailX className="h-9 w-9 text-destructive" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-destructive flex items-center justify-center shadow-lg">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Verification failed</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This link is invalid or has expired. Verification links are only
            valid for 24 hours.
          </p>
        </div>

        <div className="space-y-3 text-left">
          <p className="text-sm font-medium text-center">Resend verification email</p>
          <Input
            type="email"
            placeholder="Enter your email address"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleResend()}
            className="h-11"
          />
          <Button
            onClick={handleResend}
            disabled={!resendEmail || resendVerification.isPending}
            className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 gap-2"
          >
            {resendVerification.isPending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Send className="h-4 w-4" />
            }
            Send new link
          </Button>
          <Button asChild variant="ghost" className="w-full h-11">
            <Link href="/login">
              Back to sign in
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
