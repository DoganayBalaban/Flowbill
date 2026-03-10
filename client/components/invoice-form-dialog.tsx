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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Invoice } from "@/lib/api/invoices";
import { useClients } from "@/lib/hooks/useClients";
import { useCreateInvoice, useUpdateInvoice } from "@/lib/hooks/useInvoices";
import {
  CreateInvoiceInputData,
  createInvoiceSchema,
} from "@/lib/validations/invoices";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

interface InvoiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: Invoice | null;
}

export function InvoiceFormDialog({
  open,
  onOpenChange,
  invoice,
}: InvoiceFormDialogProps) {
  const isEditing = !!invoice;
  const { data: clientsData } = useClients();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateInvoiceInputData>({
    resolver: zodResolver(createInvoiceSchema) as any,
    defaultValues: {
      clientId: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      items: [{ description: "", quantity: 1, rate: 0 }],
      tax: 0,
      discount: 0,
      currency: "USD",
      notes: "",
      terms: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    if (open) {
      if (invoice) {
        reset({
          clientId: invoice.client_id,
          issueDate: invoice.issue_date?.split("T")[0] ?? "",
          dueDate: invoice.due_date?.split("T")[0] ?? "",
          items: invoice.invoice_items?.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
          })) ?? [{ description: "", quantity: 1, rate: 0 }],
          tax: Number(invoice.tax) || 0,
          discount: Number(invoice.discount) || 0,
          currency: invoice.currency || "USD",
          notes: invoice.notes ?? "",
          terms: invoice.terms ?? "",
        });
      } else {
        reset({
          clientId: "",
          issueDate: new Date().toISOString().split("T")[0],
          dueDate: "",
          items: [{ description: "", quantity: 1, rate: 0 }],
          tax: 0,
          discount: 0,
          currency: "USD",
          notes: "",
          terms: "",
        });
      }
    }
  }, [open, invoice, reset]);

  const onSubmit = (data: CreateInvoiceInputData) => {
    if (isEditing && invoice) {
      updateInvoice.mutate(
        {
          id: invoice.id,
          data: {
            issue_date: data.issueDate,
            due_date: data.dueDate,
            notes: data.notes || undefined,
            terms: data.terms || undefined,
            invoice_items: data.items,
          },
        },
        {
          onSuccess: () => {
            toast.success("Invoice updated");
            onOpenChange(false);
          },
          onError: () => {
            toast.error("Failed to update invoice");
          },
        },
      );
    } else {
      createInvoice.mutate(data, {
        onSuccess: () => {
          toast.success("Invoice created");
          onOpenChange(false);
        },
        onError: () => {
          toast.error("Failed to create invoice");
        },
      });
    }
  };

  const isPending = createInvoice.isPending || updateInvoice.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Invoice" : "New Invoice"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the invoice's information."
              : "Create a new invoice."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label>Client *</Label>
            <Controller
              control={control}
              name="clientId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientsData?.clients?.map(
                      (client: { id: string; name: string }) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.clientId && (
              <p className="text-sm text-destructive">
                {errors.clientId.message}
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Issue Date *</Label>
              <Input type="date" {...register("issueDate")} />
              {errors.issueDate && (
                <p className="text-sm text-destructive">
                  {errors.issueDate.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Input type="date" {...register("dueDate")} />
              {errors.dueDate && (
                <p className="text-sm text-destructive">
                  {errors.dueDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ description: "", quantity: 1, rate: 0 })
                }
              >
                <Plus className="mr-1 h-3 w-3" />
                Add Item
              </Button>
            </div>
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_80px_100px_36px] gap-2 text-xs text-muted-foreground font-medium">
              <span>Description</span>
              <span>Qty</span>
              <span>Rate</span>
              <span />
            </div>
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-[1fr_80px_100px_36px] gap-2 items-start"
              >
                <div>
                  <Input
                    placeholder="e.g. Web Design Service"
                    {...register(`items.${index}.description`)}
                  />
                  {errors.items?.[index]?.description && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.items[index].description?.message}
                    </p>
                  )}
                </div>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 10"
                  {...register(`items.${index}.quantity`, {
                    valueAsNumber: true,
                  })}
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 500"
                  {...register(`items.${index}.rate`, {
                    valueAsNumber: true,
                  })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive"
                  onClick={() => fields.length > 1 && remove(index)}
                  disabled={fields.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {errors.items && !Array.isArray(errors.items) && (
              <p className="text-sm text-destructive">{errors.items.message}</p>
            )}
          </div>

          {/* Tax & Discount */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tax (%)</Label>
              <Input
                type="number"
                step="0.01"
                {...register("tax", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Discount (%)</Label>
              <Input
                type="number"
                step="0.01"
                {...register("discount", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="TRY">TRY</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Invoice notes..."
                {...register("notes")}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Terms</Label>
              <Textarea
                placeholder="Payment terms..."
                {...register("terms")}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
