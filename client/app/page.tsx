import LandingNav from "@/components/landing-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Users,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const features = [
  {
    icon: Clock,
    title: "Time Tracking",
    description:
      "Log billable hours per project and task. Start a timer or add entries manually — then see exactly where your time goes.",
  },
  {
    icon: FileText,
    title: "PDF Invoice Generation",
    description:
      "Turn tracked time into a professional PDF invoice in one click. Send it to clients and monitor payment status.",
  },
  {
    icon: Users,
    title: "Client Management",
    description:
      "Keep client contacts, project history, and outstanding invoices organized in one place.",
  },
  {
    icon: BarChart3,
    title: "Financial Dashboard",
    description:
      "See your revenue, outstanding payments, and key metrics at a glance — updated in real time.",
  },
  {
    icon: DollarSign,
    title: "Expense Tracking",
    description:
      "Log project expenses and include them automatically when generating invoices. No more manual math.",
  },
  {
    icon: Bell,
    title: "Real-time Notifications",
    description:
      "Get instant alerts for invoice payments and project changes across all your devices.",
  },
];

const steps = [
  {
    number: "01",
    title: "Add your clients & projects",
    description:
      "Set up your client roster in seconds. Organize work into projects with budgets, deadlines, and Kanban task boards.",
  },
  {
    number: "02",
    title: "Track time as you work",
    description:
      "Hit start on a timer or log hours manually. Assign every entry to a client, project, and task.",
  },
  {
    number: "03",
    title: "Invoice and get paid",
    description:
      "Generate a polished PDF invoice from your tracked hours with one click. Mark it paid when the money arrives.",
  },
];

const mockStats = [
  {
    label: "Monthly Revenue",
    value: "$8,240",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    label: "Hours Tracked",
    value: "142 h",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    label: "Active Projects",
    value: "7",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    label: "Outstanding",
    value: "$1,800",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
];

const chartBars = [38, 62, 48, 80, 55, 92, 68, 85, 58, 96, 72, 100];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <LandingNav />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-36 pb-24 md:pt-48 md:pb-36">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[700px] w-[900px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[120px]" />
          <div className="absolute top-60 right-0 h-[400px] w-[400px] rounded-full bg-indigo-500/8 blur-[100px]" />
        </div>

        <div className="container mx-auto max-w-6xl px-4 text-center">
          <Badge
            variant="secondary"
            className="mb-6 gap-1.5 rounded-full py-1.5 px-4 text-sm font-medium"
          >
            <Zap className="h-3.5 w-3.5 text-violet-500" />
            Free to use · No credit card required
          </Badge>

          <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight md:text-7xl leading-[1.08] mb-6">
            Run your freelance business.{" "}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent font-[family-name:var(--font-playfair)] italic">
              Not spreadsheets.
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed mb-10">
            Stop juggling a dozen tools. Flowbill brings time tracking,
            invoicing, project management, and client insights into one clean
            workspace — so you can focus on the work that pays.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
            <Button
              asChild
              size="lg"
              className="h-12 w-full sm:w-auto px-8 text-base bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25"
            >
              <Link href="/register">
                Get started free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 w-full sm:w-auto px-8 text-base"
            >
              <Link href="/login">Sign in to your account</Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 mb-16">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            No setup fees. Cancel anytime.
          </p>

          {/* ── Dashboard Mockup ── */}
          <div className="relative mx-auto max-w-5xl">
            <div className="rounded-2xl border bg-card shadow-[0_32px_80px_-12px_rgba(0,0,0,0.15)] overflow-hidden">
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/40">
                <span className="h-3 w-3 rounded-full bg-red-400/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
                <div className="mx-4 flex-1 flex justify-center">
                  <div className="h-5 w-52 rounded-md bg-muted" />
                </div>
              </div>

              {/* Mock UI */}
              <div className="p-5 bg-background">
                {/* Stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {mockStats.map((s) => (
                    <div
                      key={s.label}
                      className="rounded-xl border bg-card p-3.5"
                    >
                      <div
                        className={`mb-2 inline-flex h-7 w-7 items-center justify-center rounded-lg ${s.bg}`}
                      >
                        <span className={`text-xs font-bold ${s.color}`}>
                          {s.label[0]}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-none mb-1">
                        {s.label}
                      </p>
                      <p className={`text-xl font-bold ${s.color}`}>
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Chart + clients */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 rounded-xl border bg-card p-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-semibold">Revenue overview</p>
                      <span className="text-xs text-muted-foreground rounded-full border px-2.5 py-0.5">
                        Last 12 months
                      </span>
                    </div>
                    <div className="flex items-end gap-1.5 h-24">
                      {chartBars.map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t-sm"
                          style={{
                            height: `${h}%`,
                            background: `oklch(0.6 0.2 ${264 + i * 3} / ${0.5 + (h / 100) * 0.5})`,
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border bg-card p-4">
                    <p className="text-sm font-semibold mb-3">Active clients</p>
                    <div className="space-y-2.5">
                      {[
                        {
                          name: "Acme Corp",
                          hours: "48h",
                          dot: "bg-violet-500",
                        },
                        { name: "Studio 99", hours: "31h", dot: "bg-blue-500" },
                        {
                          name: "DevHouse",
                          hours: "27h",
                          dot: "bg-emerald-500",
                        },
                        { name: "Pixel Co", hours: "19h", dot: "bg-amber-500" },
                      ].map((c) => (
                        <div key={c.name} className="flex items-center gap-2.5">
                          <span
                            className={`h-2 w-2 rounded-full shrink-0 ${c.dot}`}
                          />
                          <span className="text-xs text-muted-foreground flex-1">
                            {c.name}
                          </span>
                          <span className="text-xs font-medium">{c.hours}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Glow below mockup */}
            <div className="pointer-events-none absolute -bottom-6 left-1/2 -z-10 h-20 w-3/4 -translate-x-1/2 rounded-full bg-violet-500/20 blur-2xl" />
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section id="features" className="py-28 bg-muted/25">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 rounded-full">
              Features
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              Everything you need. Nothing you don&apos;t.
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Built for solo freelancers and small agencies who want a leaner,
              smarter way to run their business.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <Card
                key={f.title}
                className="group border-border/60 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-200"
              >
                <CardContent className="p-6">
                  <div className="mb-4 h-11 w-11 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/15 transition-colors">
                    <f.icon className="h-5 w-5 text-violet-600" />
                  </div>
                  <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section id="how-it-works" className="py-28">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 rounded-full">
              How it works
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              Up and running in minutes
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              No complex setup. No onboarding calls. Just a simple system that
              gets out of your way.
            </p>
          </div>

          <div className="relative grid md:grid-cols-3 gap-10">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-7 left-[22%] right-[22%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-start">
                <div className="mb-5 h-14 w-14 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0">
                  <span className="text-white font-bold text-sm">
                    {step.number}
                  </span>
                </div>
                <h3 className="font-semibold text-xl mb-2">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section id="pricing" className="py-28 bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 rounded-full">
              Pricing
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Start free. Upgrade when you&apos;re ready. No hidden fees, no
              surprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
            {/* Free */}
            <Card className="flex flex-col">
              <CardContent className="pt-6 flex flex-col flex-1">
                <div className="mb-4">
                  <p className="font-semibold text-base mb-1">Free</p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold">$0</span>
                    <span className="text-muted-foreground text-sm pb-1">
                      /month
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs mt-2">
                    Perfect for getting started.
                  </p>
                </div>
                <Separator className="mb-4" />
                <ul className="space-y-2.5 flex-1 mb-6">
                  {[
                    "3 active clients",
                    "10 invoices/month",
                    "Time tracking",
                    "Client portal",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/register">Get started free</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Starter */}
            <Card className="flex flex-col">
              <CardContent className="pt-6 flex flex-col flex-1">
                <div className="mb-4">
                  <p className="font-semibold text-base mb-1">Starter</p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold">$9</span>
                    <span className="text-muted-foreground text-sm pb-1">
                      /month
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs mt-2">
                    For solo freelancers.
                  </p>
                </div>
                <Separator className="mb-4" />
                <ul className="space-y-2.5 flex-1 mb-6">
                  {[
                    "10 active clients",
                    "Unlimited invoices",
                    "Time tracking",
                    "PDF generation",
                    "Client portal",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/register">Get started</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Pro — highlighted */}
            <Card className="flex flex-col border-violet-500 ring-1 ring-violet-500 relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <Badge className="bg-violet-600 text-white text-xs px-3 rounded-full shadow">
                  Most Popular
                </Badge>
              </div>
              <CardContent className="pt-6 flex flex-col flex-1">
                <div className="mb-4">
                  <p className="font-semibold text-base mb-1">Pro</p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold">$19</span>
                    <span className="text-muted-foreground text-sm pb-1">
                      /month
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs mt-2">
                    For established freelancers.
                  </p>
                </div>
                <Separator className="mb-4" />
                <ul className="space-y-2.5 flex-1 mb-6">
                  {[
                    "Unlimited clients",
                    "Unlimited invoices",
                    "Time tracking",
                    "PDF generation",
                    "Client portal",
                    "Expense tracking",
                    "Advanced reports",
                    "Priority support",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20"
                >
                  <Link href="/register">Get started</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Agency */}
            <Card className="flex flex-col">
              <CardContent className="pt-6 flex flex-col flex-1">
                <div className="mb-4">
                  <p className="font-semibold text-base mb-1">Agency</p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold">$49</span>
                    <span className="text-muted-foreground text-sm pb-1">
                      /month
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs mt-2">
                    Built for teams &amp; agencies.
                  </p>
                </div>
                <Separator className="mb-4" />
                <ul className="space-y-2.5 flex-1 mb-6">
                  {[
                    "Everything in Pro",
                    "Team members",
                    "Role-based access",
                    "Client branding",
                    "API access",
                    "Dedicated support",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/register">Get started</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Stats banner ─────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-r from-violet-600 to-indigo-600">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center text-white">
            {[
              { value: "< 10 min", label: "per day to manage your business" },
              { value: "1-click", label: "PDF invoice generation" },
              { value: "100%", label: "of your work tracked and billable" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-5xl font-bold mb-2">{s.value}</div>
                <div className="text-violet-200 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="relative py-36 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute bottom-0 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-violet-500/8 blur-[100px]" />
        </div>

        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-5xl font-bold tracking-tight mb-5">
            Start managing smarter today
          </h2>
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
            Join freelancers who&apos;ve traded chaotic spreadsheets for a
            system that works.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <Button
              asChild
              size="lg"
              className="h-12 w-full sm:w-auto px-10 text-base bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25"
            >
              <Link href="/register">
                Get started free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 w-full sm:w-auto px-10 text-base"
            >
              <Link href="/login">Sign in to your account</Link>
            </Button>
          </div>

          <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            Free to use. No credit card required.
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t py-10">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo-wo-text.png"
                alt="Flowbill"
                width={26}
                height={26}
                className="rounded"
              />
              <span className="font-semibold tracking-tight">Flowbill</span>
            </div>

            <Separator orientation="vertical" className="hidden md:block h-4" />

            <nav className="flex items-center gap-6">
              <a
                href="#features"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                How it works
              </a>
              <a
                href="#pricing"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </a>
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Register
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
            </nav>

            <p className="text-sm text-muted-foreground">
              Built for freelancers who value their time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
