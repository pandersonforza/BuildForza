"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROJECT_GROUPS, PROJECT_STATUSES } from "@/lib/constants";
import { exportReportToExcel, type ProjectCostRow } from "@/lib/reports-export";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function ReportsPage() {
  const [group, setGroup] = useState("All");
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const debounce = useCallback((val: string) => {
    setSearch(val);
    const t = setTimeout(() => setDebouncedSearch(val), 300);
    return () => clearTimeout(t);
  }, []);

  const params = new URLSearchParams();
  if (group !== "All") params.set("group", group);
  if (status !== "All") params.set("status", status);
  if (debouncedSearch) params.set("search", debouncedSearch);
  const queryString = params.toString();

  const { data, isLoading } = useSWR<ProjectCostRow[]>(
    `/api/reports/costs${queryString ? `?${queryString}` : ""}`,
    fetcher
  );

  const rows = data ?? [];

  const totals = rows.reduce(
    (acc, r) => ({
      originalBudget: acc.originalBudget + r.originalBudget,
      revisedBudget: acc.revisedBudget + r.revisedBudget,
      actualCost: acc.actualCost + r.actualCost,
      committedCost: acc.committedCost + r.committedCost,
      variance: acc.variance + r.variance,
      totalInvoices: acc.totalInvoices + r.totalInvoices,
      paidInvoices: acc.paidInvoices + r.paidInvoices,
    }),
    { originalBudget: 0, revisedBudget: 0, actualCost: 0, committedCost: 0, variance: 0, totalInvoices: 0, paidInvoices: 0 }
  );

  const handleExport = () => {
    const name = [
      group !== "All" ? group : "",
      status !== "All" ? status : "",
      "Cost_Report",
    ]
      .filter(Boolean)
      .join("_");
    exportReportToExcel(rows, name || "PropHound_Cost_Report");
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground mt-1">Filter projects and export cost data to Excel.</p>
        </div>
        <Button onClick={handleExport} disabled={rows.length === 0} className="gap-2">
          <Download className="h-4 w-4" />
          Export Excel
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => debounce(e.target.value)}
            className="pl-8 w-56"
          />
        </div>

        <Select value={group} onValueChange={setGroup}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Groups</SelectItem>
            {PROJECT_GROUPS.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            {PROJECT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground ml-auto">
          {rows.length} project{rows.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Project</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Group</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Original Budget</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Revised Budget</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actual Cost TD</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Committed</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Variance</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total Invoices</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Paid Invoices</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                  No projects match the selected filters.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border hover:bg-card/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium">{r.name}</div>
                  {r.tenant && <div className="text-xs text-muted-foreground">{r.tenant}</div>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{r.projectGroup ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.status}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(r.originalBudget)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(r.revisedBudget)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">{fmt(r.actualCost)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{fmt(r.committedCost)}</td>
                <td className={`px-4 py-3 text-right tabular-nums ${r.variance < 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {fmt(r.variance)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{fmt(r.totalInvoices)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(r.paidInvoices)}</td>
              </tr>
            ))}
          </tbody>
          {rows.length > 1 && (
            <tfoot>
              <tr className="border-t-2 border-border bg-card font-semibold">
                <td className="px-4 py-3" colSpan={3}>Total ({rows.length} projects)</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(totals.originalBudget)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(totals.revisedBudget)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(totals.actualCost)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{fmt(totals.committedCost)}</td>
                <td className={`px-4 py-3 text-right tabular-nums ${totals.variance < 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {fmt(totals.variance)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{fmt(totals.totalInvoices)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(totals.paidInvoices)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
