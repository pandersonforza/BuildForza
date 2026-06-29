import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-border/50">
        <Logo size="md" />
        <Link
          href="/login"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign In
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="max-w-2xl mx-auto space-y-8">
          <Logo size="lg" className="mx-auto" />

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Project management built for{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                real estate developers
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Track budgets, draws, invoices, and milestones across every project in one place.
            </p>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-8 py-3 text-sm font-semibold shadow hover:bg-primary/90 transition-colors"
          >
            Sign In to Your Account
          </Link>
        </div>
      </main>

      {/* Features */}
      <section className="border-t border-border/50 px-8 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          <div className="space-y-2">
            <h3 className="font-semibold">Budget Tracking</h3>
            <p className="text-sm text-muted-foreground">
              Monitor original vs. revised budgets, committed costs, and actual spend across every line item.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Draw Management</h3>
            <p className="text-sm text-muted-foreground">
              Create and track draw requests, link invoices, and generate lender-ready reports.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Invoice Workflow</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered invoice parsing with a structured review and approval process.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 px-8 py-5 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} PropHound. All rights reserved.
      </footer>
    </div>
  );
}
