"use client";

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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateMe, useUser } from "@/lib/hooks/useAuth";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Loader2,
  User,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Timezone data
const timezones = [
  { value: "Europe/Istanbul", label: "Istanbul (UTC+3)" },
  { value: "Europe/London", label: "London (UTC+0)" },
  { value: "Europe/Paris", label: "Paris (UTC+1)" },
  { value: "Europe/Berlin", label: "Berlin (UTC+1)" },
  { value: "America/New_York", label: "New York (UTC-5)" },
  { value: "America/Los_Angeles", label: "Los Angeles (UTC-8)" },
  { value: "Asia/Tokyo", label: "Tokyo (UTC+9)" },
  { value: "Asia/Dubai", label: "Dubai (UTC+4)" },
  { value: "UTC", label: "UTC" },
];

// Currency data
const currencies = [
  { value: "TRY", label: "₺ Turkish Lira (TRY)" },
  { value: "USD", label: "$ US Dollar (USD)" },
  { value: "EUR", label: "€ Euro (EUR)" },
  { value: "GBP", label: "£ British Pound (GBP)" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useUser();
  const updateMe = useUpdateMe();

  const [step, setStep] = useState(1);
  const totalSteps = 2;

  // Form state
  const [role, setRole] = useState<"freelancer" | "agency">("freelancer");
  const [timezone, setTimezone] = useState("Europe/Istanbul");
  const [currency, setCurrency] = useState("USD");
  const [hourlyRate, setHourlyRate] = useState("");

  // Redirect if already completed onboarding
  useEffect(() => {
    if (!userLoading && user?.is_onboarding_completed) {
      router.push("/dashboard");
    }
  }, [user, userLoading, router]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
  }, [user, userLoading, router]);

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    updateMe.mutate(
      {
        role,
        timezone,
        currency,
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        is_onboarding_completed: true,
      },
      {
        onSuccess: () => {
          router.push("/dashboard");
        },
      }
    );
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const progressValue = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/50">
      {/* Logo */}
      <div className="w-full flex justify-center pt-8 pb-4">
        <Image
          className="dark:invert"
          src="/flowbill-logo.png"
          alt="Flowbill Logo"
          width={180}
          height={86}
          priority
        />
      </div>

      {/* Header with progress */}
      <div className="w-full max-w-2xl mx-auto px-4 pb-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round(progressValue)}% complete</span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Step 1: Business Type */}
          {step === 1 && (
            <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
              <CardHeader className="text-center space-y-4 pb-8">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl md:text-3xl font-bold">
                    Welcome, {user?.first_name}! 👋
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Help us personalize Flowbill for you
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium mb-4 block">
                    What type of work do you do?
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setRole("freelancer")}
                      className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                        role === "freelancer"
                          ? "border-primary bg-primary/5 shadow-lg"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            role === "freelancer"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <User className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">Freelancer</h3>
                          <p className="text-sm text-muted-foreground">
                            Independent professional
                          </p>
                        </div>
                        {role === "freelancer" && (
                          <Check className="h-5 w-5 text-primary ml-auto" />
                        )}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole("agency")}
                      className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                        role === "agency"
                          ? "border-primary bg-primary/5 shadow-lg"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            role === "agency"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">Agency</h3>
                          <p className="text-sm text-muted-foreground">
                            Working with a team
                          </p>
                        </div>
                        {role === "agency" && (
                          <Check className="h-5 w-5 text-primary ml-auto" />
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleNext} size="lg" className="gap-2">
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Basic Settings */}
          {step === 2 && (
            <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
              <CardHeader className="text-center space-y-4 pb-8">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl md:text-3xl font-bold">
                    Basic Settings
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Set your timezone, currency and hourly rate
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger id="timezone">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger id="currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">
                    Hourly Rate (optional)
                  </Label>
                  <div className="relative">
                    <Input
                      id="hourlyRate"
                      type="number"
                      placeholder="0.00"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      className="pl-8"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {currency === "TRY"
                        ? "₺"
                        : currency === "USD"
                        ? "$"
                        : currency === "EUR"
                        ? "€"
                        : "£"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This will be your default hourly rate for projects. You can change it later.
                  </p>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    size="lg"
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleComplete}
                    size="lg"
                    className="gap-2"
                    disabled={updateMe.isPending}
                  >
                    {updateMe.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      <>
                        Complete
                        <Check className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-center text-sm text-muted-foreground">
        <p>© 2026 Flowbill. All rights reserved.</p>
      </div>
    </div>
  );
}
