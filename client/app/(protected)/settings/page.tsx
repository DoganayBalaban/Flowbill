"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDeleteAccount, useResendVerification, useUpdateMe, useUser } from "@/lib/hooks/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Briefcase,
  CheckCircle2,
  KeyRound,
  Loader2,
  Shield,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

/* ── Schemas ─────────────────────────────────────────────── */
const profileSchema = z.object({
  first_name: z.string().min(1, "Required").max(100),
  last_name: z.string().min(1, "Required").max(100),
  avatar_url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
});

const workSchema = z.object({
  role: z.enum(["freelancer", "agency"]),
  hourly_rate: z.coerce
    .number()
    .positive("Must be positive")
    .optional()
    .or(z.literal("" as any)),
  currency: z.string().length(3),
  timezone: z.string().min(1),
});

type ProfileForm = z.infer<typeof profileSchema>;
type WorkForm = z.infer<typeof workSchema>;

/* ── Constants ───────────────────────────────────────────── */
const CURRENCIES = [
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "TRY", label: "TRY — Turkish Lira" },
  { code: "JPY", label: "JPY — Japanese Yen" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
  { code: "AUD", label: "AUD — Australian Dollar" },
  { code: "CHF", label: "CHF — Swiss Franc" },
  { code: "CNY", label: "CNY — Chinese Yuan" },
  { code: "INR", label: "INR — Indian Rupee" },
  { code: "BRL", label: "BRL — Brazilian Real" },
  { code: "SGD", label: "SGD — Singapore Dollar" },
  { code: "NOK", label: "NOK — Norwegian Krone" },
  { code: "SEK", label: "SEK — Swedish Krona" },
  { code: "PLN", label: "PLN — Polish Złoty" },
];

const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Sao_Paulo", label: "Brasília Time (BRT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "Europe/Istanbul", label: "Istanbul (TRT)" },
  { value: "Europe/Moscow", label: "Moscow (MSK)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Seoul", label: "Seoul (KST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
  { value: "Pacific/Auckland", label: "Auckland (NZST/NZDT)" },
];

/* ── Avatar ──────────────────────────────────────────────── */
function AvatarPreview({
  firstName,
  lastName,
  email,
  avatarUrl,
  size = "lg",
}: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
  avatarUrl?: string | null;
  size?: "sm" | "lg";
}) {
  const initials = [firstName?.[0], lastName?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || email?.[0]?.toUpperCase() || "?";

  const dim = size === "lg" ? "h-20 w-20 text-2xl" : "h-10 w-10 text-sm";

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt="Avatar"
        className={`${dim} rounded-full object-cover ring-4 ring-background shadow`}
      />
    );
  }

  return (
    <div
      className={`${dim} rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-700 dark:text-violet-300 font-bold ring-4 ring-background shadow`}
    >
      {initials}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { data: user, isLoading } = useUser();
  const updateMe = useUpdateMe();
  const deleteAccount = useDeleteAccount();
  const resendVerification = useResendVerification();
  const [deletePassword, setDeletePassword] = useState("");

  /* Profile form */
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { first_name: "", last_name: "", avatar_url: "" },
  });

  /* Work form */
  const workForm = useForm<WorkForm>({
    resolver: zodResolver(workSchema),
    defaultValues: {
      role: "freelancer",
      hourly_rate: undefined,
      currency: "USD",
      timezone: "UTC",
    },
  });

  /* Populate forms once user data is available */
  useEffect(() => {
    if (!user) return;
    profileForm.reset({
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      avatar_url: user.avatar_url ?? "",
    });
    workForm.reset({
      role: (user.role as "freelancer" | "agency") ?? "freelancer",
      hourly_rate: user.hourly_rate ?? undefined,
      currency: user.currency ?? "USD",
      timezone: user.timezone ?? "UTC",
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onSaveProfile = (data: ProfileForm) => {
    updateMe.mutate(
      {
        first_name: data.first_name,
        last_name: data.last_name,
        avatar_url: data.avatar_url || undefined,
      },
      {
        onSuccess: () => toast.success("Profile updated"),
        onError: () => toast.error("Failed to update profile"),
      }
    );
  };

  const onSaveWork = (data: WorkForm) => {
    updateMe.mutate(
      {
        role: data.role,
        hourly_rate: data.hourly_rate ? Number(data.hourly_rate) : undefined,
        currency: data.currency,
        timezone: data.timezone,
      },
      {
        onSuccess: () => toast.success("Work preferences updated"),
        onError: () => toast.error("Failed to update preferences"),
      }
    );
  };

  const avatarUrl = profileForm.watch("avatar_url");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your profile, billing preferences, and account security.
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="work" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Work
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <Shield className="h-4 w-4" />
            Account
          </TabsTrigger>
        </TabsList>

        {/* ── Profile Tab ──────────────────────────────────── */}
        <TabsContent value="profile">
          <form onSubmit={profileForm.handleSubmit(onSaveProfile)}>
            <Card>
              <CardHeader>
                <CardTitle>Profile information</CardTitle>
                <CardDescription>
                  Your name and avatar are shown on invoices and in the app.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-5">
                  <AvatarPreview
                    firstName={profileForm.watch("first_name") || user?.first_name}
                    lastName={profileForm.watch("last_name") || user?.last_name}
                    email={user?.email}
                    avatarUrl={avatarUrl || user?.avatar_url}
                  />
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="avatar_url" className="text-sm font-medium">
                      Avatar URL
                    </Label>
                    <Input
                      id="avatar_url"
                      placeholder="https://example.com/avatar.jpg"
                      className="h-10"
                      {...profileForm.register("avatar_url")}
                    />
                    {profileForm.formState.errors.avatar_url && (
                      <p className="text-xs text-destructive">
                        {profileForm.formState.errors.avatar_url.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Paste an image URL, or leave blank to use your initials.
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="first_name" className="text-sm font-medium">
                      First name
                    </Label>
                    <Input
                      id="first_name"
                      className="h-10"
                      {...profileForm.register("first_name")}
                    />
                    {profileForm.formState.errors.first_name && (
                      <p className="text-xs text-destructive">
                        {profileForm.formState.errors.first_name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="last_name" className="text-sm font-medium">
                      Last name
                    </Label>
                    <Input
                      id="last_name"
                      className="h-10"
                      {...profileForm.register("last_name")}
                    />
                    {profileForm.formState.errors.last_name && (
                      <p className="text-xs text-destructive">
                        {profileForm.formState.errors.last_name.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>

              <Separator />
              <div className="flex justify-end px-6 py-4">
                <Button
                  type="submit"
                  disabled={updateMe.isPending}
                  className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-500/20"
                >
                  {updateMe.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save profile
                </Button>
              </div>
            </Card>
          </form>
        </TabsContent>

        {/* ── Work Tab ─────────────────────────────────────── */}
        <TabsContent value="work">
          <form onSubmit={workForm.handleSubmit(onSaveWork)}>
            <Card>
              <CardHeader>
                <CardTitle>Work preferences</CardTitle>
                <CardDescription>
                  These defaults are used when creating time entries and
                  invoices. You can always override them per project or client.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Role */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Account type</Label>
                  <Controller
                    name="role"
                    control={workForm.control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="freelancer">
                            Freelancer — solo work
                          </SelectItem>
                          <SelectItem value="agency">
                            Agency — team or studio
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* Hourly rate */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="hourly_rate"
                    className="text-sm font-medium"
                  >
                    Default hourly rate
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {workForm.watch("currency") || "USD"}
                    </span>
                    <Input
                      id="hourly_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="h-10 pl-12"
                      {...workForm.register("hourly_rate")}
                    />
                  </div>
                  {workForm.formState.errors.hourly_rate?.message && (
                    <p className="text-xs text-destructive">
                      {String(workForm.formState.errors.hourly_rate.message)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Used as the default rate for new time entries and projects.
                  </p>
                </div>

                {/* Currency */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    Default currency
                  </Label>
                  <Controller
                    name="currency"
                    control={workForm.control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    Used on new invoices. Existing invoices keep their own
                    currency.
                  </p>
                </div>

                {/* Timezone */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Timezone</Label>
                  <Controller
                    name="timezone"
                    control={workForm.control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    Affects how dates and times are displayed throughout the
                    app.
                  </p>
                </div>
              </CardContent>

              <Separator />
              <div className="flex justify-end px-6 py-4">
                <Button
                  type="submit"
                  disabled={updateMe.isPending}
                  className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-500/20"
                >
                  {updateMe.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save preferences
                </Button>
              </div>
            </Card>
          </form>
        </TabsContent>

        {/* ── Account Tab ──────────────────────────────────── */}
        <TabsContent value="account" className="space-y-4">
          {/* Account info */}
          <Card>
            <CardHeader>
              <CardTitle>Account information</CardTitle>
              <CardDescription>
                Your login email and plan details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Email address</Label>
                <div className="flex items-center gap-3">
                  <Input
                    value={user?.email ?? ""}
                    readOnly
                    className="h-10 bg-muted/50 text-muted-foreground cursor-not-allowed"
                  />
                  {user?.email_verified ? (
                    <Badge
                      variant="secondary"
                      className="gap-1 text-emerald-600 bg-emerald-500/10 border-emerald-500/20 shrink-0"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Verified
                    </Badge>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="secondary"
                        className="gap-1 text-amber-600 bg-amber-500/10 border-amber-500/20"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Unverified
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={resendVerification.isPending || resendVerification.isSuccess}
                        onClick={() => user?.email && resendVerification.mutate(user.email, {
                          onSuccess: () => toast.success("Verification email sent"),
                          onError: () => toast.error("Failed to send verification email"),
                        })}
                      >
                        {resendVerification.isPending
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : resendVerification.isSuccess
                          ? "Sent"
                          : "Resend"
                        }
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Email changes require contacting support.
                </p>
              </div>

              <Separator />

              {/* Plan */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Current plan</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.plan_expires_at
                      ? `Renews ${new Date(user.plan_expires_at).toLocaleDateString("en-US", { dateStyle: "medium" })}`
                      : "No expiry date"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      user?.plan === "free"
                        ? "bg-muted text-muted-foreground"
                        : user?.plan === "pro"
                        ? "bg-violet-600 text-white"
                        : "bg-amber-500 text-white"
                    }
                  >
                    {user?.plan?.toUpperCase() ?? "FREE"}
                  </Badge>
                  <Link
                    href="/settings/billing"
                    className="text-xs text-primary underline-offset-4 hover:underline"
                  >
                    Manage
                  </Link>
                </div>
              </div>

              <Separator />

              {/* Member since */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Member since</span>
                <span className="font-medium">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString("en-US", {
                        dateStyle: "medium",
                      })
                    : "—"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Password */}
          <Card>
            <CardHeader>
              <CardTitle>Password & security</CardTitle>
              <CardDescription>
                Update your password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Change password</p>
                <p className="text-xs text-muted-foreground">
                  You&apos;ll receive a reset link at your registered email
                  address.
                </p>
              </div>
              <Button asChild variant="outline" className="shrink-0 gap-2">
                <Link href="/forgot-password">
                  <KeyRound className="h-4 w-4" />
                  Reset password
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-destructive">Danger zone</CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Delete account</p>
                <p className="text-xs text-muted-foreground">
                  All your data — clients, invoices, projects — will be
                  permanently removed.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="shrink-0 gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your data including
                      clients, projects, invoices, and time entries. Your active
                      subscription will also be cancelled. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-1.5 py-2">
                    <Label htmlFor="delete-password" className="text-sm font-medium">
                      Confirm your password
                    </Label>
                    <Input
                      id="delete-password"
                      type="password"
                      placeholder="Enter your password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeletePassword("")}>
                      Cancel
                    </AlertDialogCancel>
                    <Button
                      variant="destructive"
                      disabled={!deletePassword || deleteAccount.isPending}
                      onClick={() =>
                        deleteAccount.mutate(deletePassword, {
                          onError: () => toast.error("Incorrect password or server error"),
                        })
                      }
                    >
                      {deleteAccount.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Yes, delete my account
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
