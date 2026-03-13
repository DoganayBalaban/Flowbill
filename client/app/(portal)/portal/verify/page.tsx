"use client";

import { portalApiClient } from "@/lib/api/portal";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("No token provided. Please use the link from your email.");
      return;
    }

    portalApiClient
      .verify(token)
      .then(() => {
        setStatus("success");
        setTimeout(() => router.push("/portal/dashboard"), 1500);
      })
      .catch((err: any) => {
        setStatus("error");
        setErrorMsg(
          err?.response?.data?.message ?? "This link is invalid or has expired.",
        );
      });
  }, [token, router]);

  return (
    <>
      {status === "loading" && (
        <>
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
          <h1 className="text-xl font-semibold">Verifying your link...</h1>
          <p className="text-muted-foreground text-sm">Please wait a moment.</p>
        </>
      )}
      {status === "success" && (
        <>
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <h1 className="text-xl font-semibold">Verified!</h1>
          <p className="text-muted-foreground text-sm">Redirecting to your portal...</p>
        </>
      )}
      {status === "error" && (
        <>
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="text-xl font-semibold">Link Invalid</h1>
          <p className="text-muted-foreground text-sm">{errorMsg}</p>
          <p className="text-xs text-muted-foreground">
            Please ask your freelancer to send a new link.
          </p>
        </>
      )}
    </>
  );
}

export default function PortalVerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-10 max-w-md w-full text-center space-y-4">
        <Suspense fallback={<Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />}>
          <VerifyContent />
        </Suspense>
      </div>
    </div>
  );
}
