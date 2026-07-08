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

const HEADERS = ["Project", "Address", "Current Budget", "Paid Invoices", "Remaining"];
const COL_COUNT = HEADERS.length;
const CURRENCY_COLS = [2, 3, 4];

export async function exportReportToExcel(
  rows: ProjectCostRow[],
  filename = "PropHound_Cost_Report",
  opts?: { group?: string; status?: string; search?: string }
) {
  const XLSX = await import("xlsx");

  const aoa: (string | number | null)[][] = [];

  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  // Header block
  aoa.push(["PROPHOUND  |  COST REPORT", ...Array(COL_COUNT - 1).fill(null)]);
  aoa.push([`Generated: ${dateStr}`, ...Array(COL_COUNT - 1).fill(null)]);

  const filterParts: string[] = [];
  if (opts?.group) filterParts.push(`Group: ${opts.group}`);
  if (opts?.status) filterParts.push(`Status: ${opts.status}`);
  if (opts?.search) filterParts.push(`Search: "${opts.search}"`);
  if (filterParts.length > 0) {
    aoa.push([`Filters: ${filterParts.join("   |   ")}`, ...Array(COL_COUNT - 1).fill(null)]);
  }

  aoa.push(Array(COL_COUNT).fill(null)); // blank separator
  aoa.push([...HEADERS]);

  const HEADER_ROW = aoa.length - 1;

  // Data rows
  for (const r of rows) {
    aoa.push([r.name, r.address ?? "", r.revisedBudget, r.paidInvoices, r.variance]);
  }

  // Totals row
  aoa.push([
    `TOTAL (${rows.length} project${rows.length === 1 ? "" : "s"})`,
    "",
    rows.reduce((s, r) => s + r.revisedBudget, 0),
    rows.reduce((s, r) => s + r.paidInvoices, 0),
    rows.reduce((s, r) => s + r.variance, 0),
  ]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Merge header rows across all columns
  const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: COL_COUNT - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: COL_COUNT - 1 } },
  ];
  if (filterParts.length > 0) {
    merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: COL_COUNT - 1 } });
  }
  ws["!merges"] = merges;

  // Apply currency number format to monetary cells
  const DATA_START = HEADER_ROW + 1;
  const TOTAL_ROW_IDX = aoa.length - 1;

  for (let ri = DATA_START; ri <= TOTAL_ROW_IDX; ri++) {
    for (const ci of CURRENCY_COLS) {
      const addr = XLSX.utils.encode_cell({ r: ri, c: ci });
      if (ws[addr] && typeof ws[addr].v === "number") {
        ws[addr].z = '"$"#,##0';
      }
    }
  }

  // Column widths
  ws["!cols"] = [
    { wch: 30 }, // Project
    { wch: 32 }, // Address
    { wch: 18 }, // Revised Budget
    { wch: 15 }, // Remaining
    { wch: 15 }, // Paid Invoices
  ];

  // Taller title row
  ws["!rows"] = [{ hpt: 22 }, { hpt: 14 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Cost Report");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
