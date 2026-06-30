export interface ProjectCostRow {
  id: string;
  name: string;
  address: string | null;
  tenant: string | null;
  status: string;
  stage: string | null;
  projectGroup: string | null;
  originalBudget: number;
  revisedBudget: number;
  actualCost: number;
  committedCost: number;
  variance: number;
  totalInvoices: number;
  paidInvoices: number;
}

function fmt(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function exportReportToExcel(rows: ProjectCostRow[], filename = "PropHound_Cost_Report") {
  const XLSX = await import("xlsx");

  const data = rows.map((r) => ({
    "Project": r.name,
    "Address": r.address ?? "",
    "Tenant": r.tenant ?? "",
    "Group": r.projectGroup ?? "",
    "Status": r.status,
    "Stage": r.stage ?? "",
    "Original Budget": fmt(r.originalBudget),
    "Revised Budget": fmt(r.revisedBudget),
    "Actual Cost TD": fmt(r.actualCost),
    "Committed Cost": fmt(r.committedCost),
    "Variance": fmt(r.variance),
    "Total Invoices": fmt(r.totalInvoices),
    "Paid Invoices": fmt(r.paidInvoices),
  }));

  // Totals row
  data.push({
    "Project": "TOTAL",
    "Address": "",
    "Tenant": "",
    "Group": "",
    "Status": "",
    "Stage": "",
    "Original Budget": fmt(rows.reduce((s, r) => s + r.originalBudget, 0)),
    "Revised Budget": fmt(rows.reduce((s, r) => s + r.revisedBudget, 0)),
    "Actual Cost TD": fmt(rows.reduce((s, r) => s + r.actualCost, 0)),
    "Committed Cost": fmt(rows.reduce((s, r) => s + r.committedCost, 0)),
    "Variance": fmt(rows.reduce((s, r) => s + r.variance, 0)),
    "Total Invoices": fmt(rows.reduce((s, r) => s + r.totalInvoices, 0)),
    "Paid Invoices": fmt(rows.reduce((s, r) => s + r.paidInvoices, 0)),
  });

  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 28 }, // Project
    { wch: 28 }, // Address
    { wch: 18 }, // Tenant
    { wch: 10 }, // Group
    { wch: 12 }, // Status
    { wch: 16 }, // Stage
    { wch: 16 }, // Original Budget
    { wch: 16 }, // Revised Budget
    { wch: 16 }, // Actual Cost TD
    { wch: 16 }, // Committed Cost
    { wch: 14 }, // Variance
    { wch: 16 }, // Total Invoices
    { wch: 14 }, // Paid Invoices
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Cost Report");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
