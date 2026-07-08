"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select";
import { PROJECT_GROUPS, PROJECT_STATUSES } from "@/lib/constants";
import { exportReportToExcel, type ProjectCostRow } from "@/lib/reports-export";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function ReportsPage() {
  const [group, setGroup] = useState("All");
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rows, setRows] = useState<ProjectCostRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(val), 300);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (group !== "All") params.set("group", group);
    if (status !== "All") params.set("status", status);
    if (debouncedSearch) params.set("search", debouncedSearch);
    const qs = params.toString();

    setIsLoading(true);
    fetch(`/api/reports/costs${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => setIsLoading(false));
  }, [group, status, debouncedSearch]);

  const totals = rows.reduce(
    (acc, r) => ({
      revisedBudget: acc.revisedBudget + r.revisedBudget,
      variance: acc.variance + r.variance,
      paidInvoices: acc.paidInvoices + r.paidInvoices,
    }),
    { revisedBudget: 0, variance: 0, paidInvoices: 0 }
  );

  const handleExport = () => {
    const date = new Date().toISOString().slice(0, 10);
    const name = [
      group !== "All" ? group : "",
      status !== "All" ? status : "",
      "Cost_Report",
      date,
    ]
      .filter(Boolean)
      .join("_");
    exportReportToExcel(rows, name || `PropHound_Cost_Report_${date}`, {
      group: group !== "All" ? group : undefined,
      status: status !== "All" ? status : undefined,
      search: debouncedSearch || undefined,
    });
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
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8 w-56"
          />
        </div>

        <SelectNative
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          className="w-36"
          options={[
            { value: "All", label: "All Groups" },
            ...PROJECT_GROUPS.map((g) => ({ value: g, label: g })),
          ]}
        />

        <SelectNative
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-36"
          options={[
            { value: "All", label: "All Statuses" },
            ...PROJECT_STATUSES.map((s) => ({ value: s, label: s })),
          ]}
        />

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
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Address</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Revised Budget</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Variance</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Paid Invoices</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No projects match the selected filters.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border hover:bg-card/50 transition-colors">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.address ?? "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(r.revisedBudget)}</td>
                <td className={`px-4 py-3 text-right tabular-nums ${r.variance < 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {fmt(r.variance)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(r.paidInvoices)}</td>
              </tr>
            ))}
          </tbody>
          {rows.length > 1 && (
            <tfoot>
              <tr className="border-t-2 border-border bg-card font-semibold">
                <td className="px-4 py-3" colSpan={2}>Total ({rows.length} projects)</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(totals.revisedBudget)}</td>
                <td className={`px-4 py-3 text-right tabular-nums ${totals.variance < 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {fmt(totals.variance)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(totals.paidInvoices)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
