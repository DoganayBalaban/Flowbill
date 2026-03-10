"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMarkAsPaid } from "@/lib/hooks/useInvoices";
import {
  MarkAsPaidFormData,
  markAsPaidSchema,
} from "@/lib/validations/invoices";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface InvoicePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  remainingBalance?: number;
  currency?: string;
}

export function InvoicePaymentDialog({
  open,
  onOpenChange,
  invoiceId,
  remainingBalance,
  currency = "USD",
}: InvoicePaymentDialogProps) {
  const markAsPaid = useMarkAsPaid();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MarkAsPaidFormData>({
    resolver: zodResolver(markAsPaidSchema) as any,
    defaultValues: {
      paidAt: new Date().toISOString().split("T")[0],
      amount: undefined,
      paymentMethod: "",
      referenceNumber: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        paidAt: new Date().toISOString().split("T")[0],
        amount: remainingBalance ?? undefined,
        paymentMethod: "",
        referenceNumber: "",
        notes: "",
      });
    }
  }, [open, remainingBalance, reset]);

  const onSubmit = (data: MarkAsPaidFormData) => {
    const cleanData = {
      ...data,
      amount: data.amount && !isNaN(data.amount) ? data.amount : undefined,
      paymentMethod: data.paymentMethod || undefined,
      referenceNumber: data.referenceNumber || undefined,
      notes: data.notes || undefined,
    };

    markAsPaid.mutate(
      { id: invoiceId, data: cleanData },
      {
        onSuccess: () => {
          toast.success("Payment recorded");
          onOpenChange(false);
        },
        onError: () => {
          toast.error("Failed to record payment");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Enter payment details for this invoice.
            {remainingBalance !== undefined && (
              <span className="block mt-1 font-medium">
                Remaining balance:{" "}
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency,
                }).format(remainingBalance)}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Payment Date</Label>
              <Input type="date" {...register("paidAt")} />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Full payment"
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">
                  {errors.amount.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Input
                placeholder="Bank transfer, credit card..."
                {...register("paymentMethod")}
              />
            </div>
            <div className="space-y-2">
              <Label>Reference #</Label>
              <Input
                placeholder="Transaction reference number"
                {...register("referenceNumber")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea
              placeholder="Payment note..."
              {...register("notes")}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={markAsPaid.isPending}>
              {markAsPaid.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
