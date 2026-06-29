"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import {
  BarChart3,
  FileText,
  Layers,
  Receipt,
  CheckCircle2,
  TrendingUp,
  Building2,
} from "lucide-react";

// ── App mockup components ────────────────────────────────────────────────────

function MockWindow({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="rounded-xl border border-[#2a3540] bg-[#0f1419] shadow-2xl overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#151c23] border-b border-[#2a3540]">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
          <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
        </div>
        <span className="text-xs text-[#8899a6] ml-2 font-medium">{title}</span>
      </div>
      {children}
    </div>
  );
}

const statusColors: Record<string, string> = {
  Active: "bg-emerald-500/15 text-emerald-400",
  Completed: "bg-sky-500/15 text-sky-400",
  "On Hold": "bg-amber-500/15 text-amber-400",
  Approved: "bg-emerald-500/15 text-emerald-400",
  Submitted: "bg-blue-500/15 text-blue-400",
  Checked: "bg-sky-500/15 text-sky-400",
  Paid: "bg-purple-500/15 text-purple-400",
  Draft: "bg-[#2a3540] text-[#8899a6]",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[status] ?? "bg-[#2a3540] text-[#8899a6]"}`}>
      {status}
    </span>
  );
}

function ProjectsMockup() {
  const projects = [
    { name: "Riverside Commons", address: "1450 River Bend Dr", tenant: "Whole Foods", stage: "Construction", status: "Active", budget: "$4,200,000" },
    { name: "Meridian Office Park", address: "800 Commerce Blvd", tenant: "WeWork", stage: "Pre-Development", status: "Active", budget: "$7,800,000" },
    { name: "Lakeview Flats", address: "220 Lakeview Ave", tenant: "—", stage: "Design", status: "On Hold", budget: "$2,900,000" },
    { name: "Summit Ridge Plaza", address: "555 Summit Dr", tenant: "Target", stage: "Closeout", status: "Completed", budget: "$11,500,000" },
  ];
  return (
    <MockWindow title="PropHound — Projects">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#e8edf2]">All Projects</h2>
          <div className="flex gap-2">
            <div className="h-7 px-3 rounded-md bg-[#2a9a9a] flex items-center text-[11px] font-medium text-white">+ New Project</div>
          </div>
        </div>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-[#2a3540] text-[#8899a6]">
              <th className="text-left pb-2 pr-4">Name</th>
              <th className="text-left pb-2 pr-4">Tenant</th>
              <th className="text-left pb-2 pr-4">Stage</th>
              <th className="text-right pb-2 pr-4">Budget</th>
              <th className="text-left pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.name} className="border-b border-[#2a3540]/50 text-[#e8edf2]">
                <td className="py-2 pr-4">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-[10px] text-[#8899a6]">{p.address}</div>
                </td>
                <td className="py-2 pr-4 text-[#8899a6]">{p.tenant}</td>
                <td className="py-2 pr-4 text-[#8899a6]">{p.stage}</td>
                <td className="py-2 pr-4 text-right font-mono">{p.budget}</td>
                <td className="py-2"><StatusBadge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MockWindow>
  );
}

function BudgetMockup() {
  const categories = [
    { name: "Soft Costs", items: [
      { desc: "Architecture & Engineering", original: "$180,000", revised: "$195,000", actual: "$187,450", pct: 96 },
      { desc: "Permits & Entitlements", original: "$45,000", revised: "$45,000", actual: "$44,200", pct: 98 },
    ]},
    { name: "Hard Costs", items: [
      { desc: "Site Work & Demo", original: "$320,000", revised: "$340,000", actual: "$298,000", pct: 88 },
      { desc: "Concrete & Structural", original: "$890,000", revised: "$890,000", actual: "$712,400", pct: 80 },
      { desc: "Contingency", original: "$150,000", revised: "$185,000", actual: "$0", pct: 0 },
    ]},
  ];
  return (
    <MockWindow title="PropHound — Budget">
      <div className="p-4">
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: "Original Budget", val: "$1,585,000", color: "text-[#e8edf2]" },
            { label: "Revised Budget", val: "$1,655,000", color: "text-[#e8edf2]" },
            { label: "Actual Cost", val: "$1,242,050", color: "text-emerald-400" },
            { label: "Variance", val: "$412,950", color: "text-amber-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-[#2a3540] bg-[#151c23] p-3">
              <div className="text-[10px] text-[#8899a6]">{s.label}</div>
              <div className={`text-sm font-bold mt-0.5 ${s.color}`}>{s.val}</div>
            </div>
          ))}
        </div>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-[#2a3540] text-[#8899a6]">
              <th className="text-left pb-2 pr-4">Line Item</th>
              <th className="text-right pb-2 pr-4">Original</th>
              <th className="text-right pb-2 pr-4">Revised</th>
              <th className="text-right pb-2 pr-4">Actual</th>
              <th className="text-left pb-2 w-20">Progress</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <>
                <tr key={cat.name} className="bg-[#1a2029]/50">
                  <td colSpan={5} className="py-1.5 px-2 text-[10px] font-semibold text-[#2a9a9a] uppercase tracking-wide">{cat.name}</td>
                </tr>
                {cat.items.map((item) => (
                  <tr key={item.desc} className="border-b border-[#2a3540]/40 text-[#e8edf2]">
                    <td className="py-1.5 pr-4">{item.desc}</td>
                    <td className="py-1.5 pr-4 text-right text-[#8899a6] font-mono">{item.original}</td>
                    <td className="py-1.5 pr-4 text-right font-mono">{item.revised}</td>
                    <td className="py-1.5 pr-4 text-right text-emerald-400 font-mono">{item.actual}</td>
                    <td className="py-1.5">
                      <div className="h-1.5 w-full rounded-full bg-[#2a3540]">
                        <div className="h-full rounded-full bg-[#2a9a9a]" style={{ width: `${item.pct}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </MockWindow>
  );
}

function InvoicesMockup() {
  const invoices = [
    { vendor: "Apex Concrete LLC", number: "INV-2847", amount: "$48,200", date: "Jun 12", status: "Checked", project: "Riverside Commons" },
    { vendor: "Meridian Electrical", number: "INV-1093", amount: "$12,750", date: "Jun 10", status: "Approved", project: "Summit Ridge Plaza" },
    { vendor: "PacWest Framing", number: "INV-0441", amount: "$87,500", date: "Jun 8", status: "Submitted", project: "Riverside Commons" },
    { vendor: "Design Studio Co.", number: "INV-3310", amount: "$9,400", date: "Jun 5", status: "Paid", project: "Meridian Office Park" },
    { vendor: "City Permits Dept", number: "INV-0882", amount: "$3,200", date: "Jun 1", status: "Draft", project: "Lakeview Flats" },
  ];
  return (
    <MockWindow title="PropHound — Invoices">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {["All", "Submitted", "Checked", "Approved", "Paid"].map((f, i) => (
            <div key={f} className={`px-3 py-1 rounded-full text-[11px] font-medium cursor-pointer ${i === 0 ? "bg-[#2a9a9a] text-white" : "bg-[#1a2029] text-[#8899a6]"}`}>{f}</div>
          ))}
        </div>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-[#2a3540] text-[#8899a6]">
              <th className="text-left pb-2 pr-4">Vendor</th>
              <th className="text-left pb-2 pr-4">Invoice #</th>
              <th className="text-left pb-2 pr-4">Project</th>
              <th className="text-right pb-2 pr-4">Amount</th>
              <th className="text-left pb-2 pr-4">Date</th>
              <th className="text-left pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.number} className="border-b border-[#2a3540]/50 text-[#e8edf2]">
                <td className="py-2 pr-4 font-medium">{inv.vendor}</td>
                <td className="py-2 pr-4 text-[#8899a6] font-mono">{inv.number}</td>
                <td className="py-2 pr-4 text-[#8899a6]">{inv.project}</td>
                <td className="py-2 pr-4 text-right font-mono">{inv.amount}</td>
                <td className="py-2 pr-4 text-[#8899a6]">{inv.date}</td>
                <td className="py-2"><StatusBadge status={inv.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MockWindow>
  );
}

function DrawsMockup() {
  const draws = [
    { number: "Draw #4", amount: "$287,450", submitted: "Jun 14", status: "Approved", invoices: 12 },
    { number: "Draw #3", amount: "$341,200", submitted: "May 2", status: "Paid", invoices: 18 },
    { number: "Draw #2", amount: "$198,750", submitted: "Mar 28", status: "Paid", invoices: 9 },
    { number: "Draw #1", amount: "$124,300", submitted: "Feb 10", status: "Paid", invoices: 6 },
  ];
  return (
    <MockWindow title="PropHound — Draw Requests">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#e8edf2]">Riverside Commons — Draws</h2>
          <div className="h-7 px-3 rounded-md bg-[#2a9a9a] flex items-center text-[11px] font-medium text-white">+ New Draw</div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Total Drawn", val: "$951,700" },
            { label: "This Draw", val: "$287,450" },
            { label: "Remaining Budget", val: "$703,300" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-[#2a3540] bg-[#151c23] p-3">
              <div className="text-[10px] text-[#8899a6]">{s.label}</div>
              <div className="text-sm font-bold text-[#2a9a9a] mt-0.5">{s.val}</div>
            </div>
          ))}
        </div>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-[#2a3540] text-[#8899a6]">
              <th className="text-left pb-2 pr-4">Draw</th>
              <th className="text-right pb-2 pr-4">Amount</th>
              <th className="text-left pb-2 pr-4">Submitted</th>
              <th className="text-center pb-2 pr-4">Invoices</th>
              <th className="text-left pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {draws.map((d) => (
              <tr key={d.number} className="border-b border-[#2a3540]/50 text-[#e8edf2]">
                <td className="py-2 pr-4 font-medium">{d.number}</td>
                <td className="py-2 pr-4 text-right font-mono">{d.amount}</td>
                <td className="py-2 pr-4 text-[#8899a6]">{d.submitted}</td>
                <td className="py-2 pr-4 text-center text-[#8899a6]">{d.invoices}</td>
                <td className="py-2"><StatusBadge status={d.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MockWindow>
  );
}

// ── Feature tabs ─────────────────────────────────────────────────────────────

const TABS = [
  { id: "projects", label: "Projects", icon: Building2, mockup: ProjectsMockup },
  { id: "budget",   label: "Budget",   icon: BarChart3,  mockup: BudgetMockup  },
  { id: "invoices", label: "Invoices", icon: Receipt,    mockup: InvoicesMockup },
  { id: "draws",    label: "Draws",    icon: Layers,     mockup: DrawsMockup   },
];

function FeatureTabs() {
  const [active, setActive] = useState("projects");
  const ActiveMockup = TABS.find((t) => t.id === active)?.mockup ?? ProjectsMockup;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-center flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              active === id
                ? "bg-[#2a9a9a] text-white shadow-lg shadow-[#2a9a9a]/20"
                : "bg-[#151c23] text-[#8899a6] border border-[#2a3540] hover:border-[#2a9a9a]/50 hover:text-[#e8edf2]"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
      <div className="relative">
        {/* Glow behind mockup */}
        <div className="absolute inset-0 bg-[#2a9a9a]/5 rounded-2xl blur-3xl -z-10" />
        <ActiveMockup />
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f1419] flex flex-col text-[#e8edf2] overflow-x-hidden">

      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-[#2a3540]">
        <Logo size="md" />
        <Link
          href="/login"
          className="px-4 py-2 rounded-md text-sm font-medium border border-[#2a3540] text-[#8899a6] hover:border-[#2a9a9a] hover:text-[#e8edf2] transition-colors"
        >
          Sign In
        </Link>
      </header>

      {/* Hero */}
      <section className="relative flex flex-col items-center text-center px-6 pt-20 pb-16 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#2a9a9a]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-10 left-1/4 w-[300px] h-[300px] bg-[#2a9a9a]/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#2a3540] bg-[#151c23] text-xs text-[#2a9a9a] font-medium mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2a9a9a] animate-pulse" />
            Built for commercial real estate developers
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Manage every project{" "}
            <span className="bg-gradient-to-r from-[#2a9a9a] via-[#3abfbf] to-[#2a9a9a]/60 bg-clip-text text-transparent">
              from bid to closeout
            </span>
          </h1>

          <p className="text-lg text-[#8899a6] max-w-xl mx-auto leading-relaxed">
            PropHound brings budgets, draw requests, invoices, and milestone
            tracking into one purpose-built platform for development teams.
          </p>

          <div className="flex items-center justify-center gap-4 pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-[#2a9a9a] text-white px-7 py-3 text-sm font-semibold shadow-lg shadow-[#2a9a9a]/25 hover:bg-[#2a9a9a]/90 transition-colors"
            >
              Sign In to Your Account
            </Link>
          </div>
        </div>
      </section>

      {/* Feature mockup tabs */}
      <section className="px-6 pb-20 max-w-5xl mx-auto w-full">
        <FeatureTabs />
      </section>

      {/* Feature highlights */}
      <section className="border-t border-[#2a3540] bg-[#151c23]/50 px-8 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            Everything your team needs in one place
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: BarChart3,
                title: "Live Budget Tracking",
                desc: "Compare original, revised, committed, and actual costs line by line. See variance and progress at a glance.",
              },
              {
                icon: Layers,
                title: "Draw Management",
                desc: "Build and submit draw requests, attach invoices, and generate lender-ready PDF reports automatically.",
              },
              {
                icon: Receipt,
                title: "AI Invoice Parsing",
                desc: "Upload PDFs and let AI extract vendor, amount, date, and suggest the right project and line item.",
              },
              {
                icon: CheckCircle2,
                title: "Approval Workflows",
                desc: "Four-step invoice review — Submitted, Checked, Approved, Paid — with clear ownership at every stage.",
              },
              {
                icon: TrendingUp,
                title: "Milestone Tracking",
                desc: "Define dev fee milestones, track completion, and generate professional dev fee invoices in one click.",
              },
              {
                icon: FileText,
                title: "Document Control",
                desc: "Store contracts, invoices, and agreements with every project. Accessible by the whole team, always.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-[#2a3540] bg-[#151c23] p-6 space-y-3 hover:border-[#2a9a9a]/40 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-[#2a9a9a]/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-[#2a9a9a]" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-[#8899a6] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-8 py-20 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#2a9a9a]/5 to-transparent pointer-events-none" />
        <div className="relative max-w-xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold">Ready to get started?</h2>
          <p className="text-[#8899a6]">
            Sign in to your PropHound account and take control of your development projects.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-[#2a9a9a] text-white px-8 py-3 text-sm font-semibold shadow-lg shadow-[#2a9a9a]/25 hover:bg-[#2a9a9a]/90 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#2a3540] px-8 py-5 text-center text-xs text-[#8899a6]">
        &copy; 2025 PropHound. All rights reserved.
      </footer>
    </div>
  );
}
