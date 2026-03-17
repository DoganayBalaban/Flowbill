"use client";

import { portalApiClient, PortalClient, PortalInvoice } from "@/lib/api/portal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  Download,
  FileText,
  Loader2,
  LogOut,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(Number(amount));
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

function StatusBadge({ status }: { status: string }) {
  if (status === "paid") {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
        Paid
      </Badge>
    );
  }
  if (status === "overdue") {
    return (
      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">
        Overdue
      </Badge>
    );
  }
  return (
    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
      Sent
    </Badge>
  );
}

export default function PortalDashboardPage() {
  const router = useRouter();
  const [client, setClient] = useState<PortalClient | null>(null);
  const [invoices, setInvoices] = useState<PortalInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [loggedOut, setLoggedOut] = useState(false);

  useEffect(() => {
    Promise.all([portalApiClient.getMe(), portalApiClient.getInvoices()])
      .then(([meRes, invoicesRes]) => {
        setClient(meRes.client);
        setInvoices(invoicesRes.invoices);
      })
      .catch(() => {
        setSessionExpired(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadPdf = async (invoiceId: string) => {
    setDownloadingId(invoiceId);
    try {
      const { url } = await portalApiClient.getPdfUrl(invoiceId);
      window.open(url, "_blank");
    } catch {
      // Silently fail — PDF might not be generated yet
    } finally {
      setDownloadingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await portalApiClient.logout();
    } finally {
      setLoggedOut(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (sessionExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-10 max-w-md w-full text-center space-y-4">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="text-xl font-semibold">Session Expired</h1>
          <p className="text-muted-foreground text-sm">
            Your session has expired or is no longer valid. Please ask your
            freelancer to send you a new magic link.
          </p>
        </div>
      </div>
    );
  }

  if (loggedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-10 max-w-md w-full text-center space-y-4">
          <FileText className="mx-auto h-12 w-12 text-slate-400" />
          <h1 className="text-xl font-semibold">You have been logged out</h1>
          <p className="text-muted-foreground text-sm">
            Thank you for using the Client Portal. To access your invoices again,
            ask your freelancer to send you a new link.
          </p>
        </div>
      </div>
    );
  }

  // Stats
  const totalInvoices = invoices.length;
  const paidAmount = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + Number(i.total), 0);
  const pendingAmount = invoices
    .filter((i) => i.status !== "paid")
    .reduce((sum, i) => sum + Number(i.total), 0);
  const currency = invoices[0]?.currency || "USD";

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white px-6 py-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">
            Client Portal
          </p>
          <h1 className="text-xl font-bold">{client?.name}</h1>
          {client?.company && (
            <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-0.5">
              <Building2 className="h-3.5 w-3.5" />
              {client.company}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 bg-transparent"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalInvoices}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Amount</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(pendingAmount, currency)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Paid Amount</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(paidAmount, currency)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Your Invoices
            </CardTitle>
            <CardDescription>
              {totalInvoices} {totalInvoices === 1 ? "invoice" : "invoices"} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="text-muted-foreground">No invoices available yet.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="hidden md:table-cell">Issue Date</TableHead>
                      <TableHead className="hidden md:table-cell">Due Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono text-sm font-medium">
                          <Link
                            href={`/portal/invoices/${invoice.id}`}
                            className="hover:underline text-blue-600 dark:text-blue-400"
                          >
                            {invoice.invoice_number}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={invoice.status} />
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                          {formatDate(invoice.issue_date)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                          {formatDate(invoice.due_date)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/portal/invoices/${invoice.id}`}>
                                View
                              </Link>
                            </Button>
                            {invoice.pdf_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadPdf(invoice.id)}
                                disabled={downloadingId === invoice.id}
                              >
                                {downloadingId === invoice.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pb-6">
          Powered by <strong>Flowbill</strong>
        </p>
      </div>
    </div>
  );
}
