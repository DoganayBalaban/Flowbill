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
import { Client } from "@/lib/api/clients";
import { useCreateClient, useUpdateClient } from "@/lib/hooks/useClients";
import { createClientSchema } from "@/lib/validations/clients";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
}

type FormData = z.infer<typeof createClientSchema>;

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
}: ClientFormDialogProps) {
  const isEditing = !!client;
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
      hourly_rate: undefined,
    },
  });

  useEffect(() => {
    if (open && client) {
      reset({
        name: client.name,
        company: client.company || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        notes: client.notes || "",
        hourly_rate: client.hourly_rate ?? undefined,
      });
    } else if (open) {
      reset({
        name: "",
        company: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
        hourly_rate: undefined,
      });
    }
  }, [open, client, reset]);

  const onSubmit = (data: FormData) => {
    // Clean empty strings, undefined, and NaN values
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(
        ([, v]) => v !== "" && v !== undefined && !(typeof v === "number" && isNaN(v))
      )
    );

    if (isEditing && client) {
      updateClient.mutate(
        { id: client.id, data: cleaned },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    } else {
      createClient.mutate(cleaned as { name: string }, {
        onSuccess: () => {
          onOpenChange(false);
        },
      });
    }
  };

  const isPending = createClient.isPending || updateClient.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Client" : "New Client"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the client's information."
              : "Add a new client to your workspace."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Client name"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                placeholder="Company name"
                {...register("company")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="client@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+1 555 123 4567"
                {...register("phone")}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Address"
                {...register("address")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
              <Input
                id="hourly_rate"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("hourly_rate", { valueAsNumber: true })}
              />
              {errors.hourly_rate && (
                <p className="text-sm text-destructive">
                  {errors.hourly_rate.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Notes about this client..."
              rows={3}
              {...register("notes")}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
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
