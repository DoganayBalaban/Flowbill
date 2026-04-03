"use client";

import { InvoicePaymentDialog } from "@/components/invoice-payment-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/lib/i18n/context";
import {
  useDownloadPdf,
  useGeneratePdf,
  useInvoice,
  useSendInvoiceEmail,
} from "@/lib/hooks/useInvoices";
import {
  ArrowLeft,
  CreditCard,
  Download,
  FileText,
  Loader2,
  Mail,
  RefreshCw,
  Send,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

// ── Helpers ────────────────────────────────────────────────────────────────

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: "outline",
    sent: "default",
    paid: "secondary",
    overdue: "destructive",
    cancelled: "destructive",
  };
  return map[status] || "secondary";
}

function getPdfStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    not_generated: "outline",
    processing: "default",
    generated: "secondary",
    failed: "destructive",
  };
  return map[status] || "outline";
}

function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(amount));
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(dateStr));
}

// ── Component ──────────────────────────────────────────────────────────────

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;
  const { t } = useTranslation();

  const { data: invoice, isLoading, error } = useInvoice(invoiceId);
  const generatePdf = useGeneratePdf();
  const downloadPdf = useDownloadPdf();
  const sendEmail = useSendInvoiceEmail();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-center py-20">
        <p className="text-destructive text-lg">{t("invoices.invoice_not_found")}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("invoices.go_back")}
        </Button>
      </div>
    );
  }

  const totalPaid = invoice.payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
  const remainingBalance = Number(invoice.total) - totalPaid;

  const handleGeneratePdf = () => {
    generatePdf.mutate(
      { id: invoiceId },
      {
        onSuccess: () =>
          toast.info(t("invoices.toast_generating_pdf"), {
            description: t("invoices.toast_pdf_desc"),
          }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (err: any) =>
          toast.error(err?.response?.data?.message ?? t("invoices.toast_pdf_error")),
      },
    );
  };

  const handleDownloadPdf = () => {
    downloadPdf.mutate(invoiceId, {
      onError: () => toast.error(t("invoices.toast_pdf_not_ready")),
    });
  };

  const handleSendEmail = () => {
    const isDraft = invoice?.status === "draft";
    sendEmail.mutate(invoiceId, {
      onSuccess: () =>
        toast.info(isDraft ? t("invoices.toast_send_draft") : t("invoices.toast_send_queued")),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError: (err: any) =>
        toast.error(err?.response?.data?.message ?? t("invoices.toast_send_error")),
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{invoice.invoice_number}</h1>
            <p className="text-sm text-muted-foreground">
              {invoice.client?.name} • {invoice.client?.email}
            </p>
          </div>
          <Badge variant={getStatusVariant(invoice.status)} className="ml-2">
            {t(`invoices.status_${invoice.status}`)}
          </Badge>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {invoice.status === "draft" && (
            <Button size="sm" onClick={handleSendEmail} disabled={sendEmail.isPending}>
              {sendEmail.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {t("invoices.send_invoice")}
            </Button>
          )}

          {invoice.status !== "draft" && (
            <>
              {invoice.pdf_status === "generated" ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={downloadPdf.isPending}>
                    <Download className="mr-2 h-4 w-4" />
                    {t("invoices.download_pdf")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      generatePdf.mutate(
                        { id: invoiceId, force: true },
                        {
                          onSuccess: () => toast.info(t("invoices.toast_regenerating")),
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          onError: (err: any) =>
                            toast.error(err?.response?.data?.message ?? t("invoices.toast_regenerate_error")),
                        },
                      )
                    }
                    disabled={generatePdf.isPending}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t("invoices.regenerate")}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGeneratePdf}
                  disabled={generatePdf.isPending || invoice.pdf_status === "processing"}
                >
                  {generatePdf.isPending || invoice.pdf_status === "processing" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  {t("invoices.generate_pdf")}
                </Button>
              )}
              {invoice.status !== "cancelled" && (
                <Button variant="outline" size="sm" onClick={handleSendEmail} disabled={sendEmail.isPending}>
                  {sendEmail.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  {t("invoices.resend_email")}
                </Button>
              )}
            </>
          )}


          {invoice.status !== "paid" && invoice.status !== "cancelled" && invoice.status !== "draft" && (
            <Button size="sm" onClick={() => setPaymentDialogOpen(true)}>
              <CreditCard className="mr-2 h-4 w-4" />
              {t("invoices.record_payment")}
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Info + Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">{t("invoices.invoice_details")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">{t("clients.col_issue_date")}</p>
                <p className="font-medium">{formatDate(invoice.issue_date)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("clients.col_due_date")}</p>
                <p className="font-medium">{formatDate(invoice.due_date)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("invoices.col_currency")}</p>
                <p className="font-medium">{invoice.currency}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("invoices.col_pdf_status")}</p>
                <Badge variant={getPdfStatusVariant(invoice.pdf_status)} className="mt-0.5">
                  {invoice.pdf_status === "not_generated"
                    ? t("invoices.pdf_not_generated")
                    : invoice.pdf_status === "processing"
                    ? t("invoices.pdf_processing")
                    : invoice.pdf_status === "generated"
                    ? t("invoices.pdf_ready")
                    : t("invoices.pdf_failed")}
                </Badge>
              </div>
            </div>

            {(invoice.notes || invoice.terms) && (
              <>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {invoice.notes && (
                    <div>
                      <p className="text-muted-foreground mb-1">{t("invoices.col_notes")}</p>
                      <p className="whitespace-pre-wrap">{invoice.notes}</p>
                    </div>
                  )}
                  {invoice.terms && (
                    <div>
                      <p className="text-muted-foreground mb-1">{t("invoices.col_terms")}</p>
                      <p className="whitespace-pre-wrap">{invoice.terms}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("invoices.summary_title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("invoices.subtotal")}</span>
              <span>{formatCurrency(Number(invoice.subtotal), invoice.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("invoices.tax")}</span>
              <span>{formatCurrency(Number(invoice.tax), invoice.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("invoices.discount")}</span>
              <span>-{formatCurrency(Number(invoice.discount), invoice.currency)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>{t("invoices.total")}</span>
              <span>{formatCurrency(Number(invoice.total), invoice.currency)}</span>
            </div>
            {totalPaid > 0 && (
              <>
                <div className="flex justify-between text-green-600">
                  <span>{t("invoices.paid_label")}</span>
                  <span>{formatCurrency(totalPaid, invoice.currency)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>{t("invoices.remaining")}</span>
                  <span>{formatCurrency(remainingBalance, invoice.currency)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice Items */}
      {invoice.invoice_items && invoice.invoice_items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("invoices.invoice_items_title")}</CardTitle>
            <CardDescription>
              {invoice.invoice_items.length === 1
                ? t("invoices.items_found_one", { count: "1" })
                : t("invoices.items_found_other", { count: String(invoice.invoice_items.length) })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("expenses.col_description")}</TableHead>
                    <TableHead className="text-right">{t("invoices.col_qty")}</TableHead>
                    <TableHead className="text-right">{t("invoices.col_rate")}</TableHead>
                    <TableHead className="text-right">{t("invoices.col_amount")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.invoice_items.map((item, index) => (
                    <TableRow key={item.id ?? index}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.rate, invoice.currency)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.amount, invoice.currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments History */}
      {invoice.payments && invoice.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("invoices.payment_history")}</CardTitle>
            <CardDescription>
              {invoice.payments.length === 1
                ? t("invoices.payments_found_one", { count: "1" })
                : t("invoices.payments_found_other", { count: String(invoice.payments.length) })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("expenses.col_date")}</TableHead>
                    <TableHead>{t("invoices.col_method")}</TableHead>
                    <TableHead>{t("invoices.col_reference")}</TableHead>
                    <TableHead className="text-right">{t("invoices.col_amount")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.payments.map((payment, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(payment.paid_at)}</TableCell>
                      <TableCell>{payment.payment_method || "—"}</TableCell>
                      <TableCell>{payment.reference_number || "—"}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(payment.amount, invoice.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <InvoicePaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        invoiceId={invoiceId}
        remainingBalance={remainingBalance}
        currency={invoice.currency}
      />
    </div>
  );
}
