import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface DevFeeInvoiceData {
  invoiceNumber: string | null;
  vendorName: string;
  amount: number;
  date: Date;
  aiNotes: string | null;
  project: { name: string; address: string | null } | null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * pdf-lib's standard Helvetica font only supports WinAnsi (Latin-1).
 * Replace common Unicode punctuation with ASCII equivalents, then
 * strip anything still outside 0x00–0xFF.
 */
function safe(str: string): string {
  return str
    .replace(/[''ʼ]/g, "'")
    .replace(/[""]/g, '"')
    .replace(/–/g, '-')
    .replace(/—/g, '--')
    .replace(/…/g, '...')
    .replace(/[^\x00-\xFF]/g, '?');
}

interface PdfMeta {
  projectName: string;
  projectAddress: string;
  milestones: { name: string; devFee: number }[];
  approverName: string | null;
}

export async function generateDevFeePdf(invoice: DevFeeInvoiceData): Promise<Buffer> {
  let meta: PdfMeta | null = null;
  const metaMatch = invoice.aiNotes?.match(/__devFeePdfMeta__([\s\S]+)$/);
  if (metaMatch) {
    try { meta = JSON.parse(metaMatch[1]) as PdfMeta; } catch { /* fall back */ }
  }

  const projectName = meta?.projectName || invoice.project?.name || '';
  const projectAddress = meta?.projectAddress || invoice.project?.address || '';
  const milestones = meta?.milestones ?? [];

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 50;
  const lh = 24;
  const teal = rgb(0.16, 0.6, 0.6);
  const dark = rgb(0.1, 0.1, 0.1);
  const muted = rgb(0.45, 0.45, 0.45);

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const draw = (
    str: string,
    x: number,
    yPos: number,
    o?: { bold?: boolean; size?: number; color?: ReturnType<typeof rgb>; right?: boolean }
  ) => {
    const s = safe(str);
    const f = o?.bold ? fontBold : font;
    const sz = o?.size ?? 10;
    const xPos = o?.right ? x - f.widthOfTextAtSize(s, sz) : x;
    page.drawText(s, { x: xPos, y: yPos, font: f, size: sz, color: o?.color ?? dark });
  };

  const hline = (yPos: number, x1 = margin, x2 = pageWidth - margin, w = 0.5, c = rgb(0.8, 0.8, 0.8)) => {
    page.drawLine({ start: { x: x1, y: yPos }, end: { x: x2, y: yPos }, thickness: w, color: c });
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < margin) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  // Header
  draw('DEVELOPMENT FEE INVOICE', margin, y, { bold: true, size: 18, color: teal });
  y -= 10;
  hline(y, margin, pageWidth - margin, 1.5, teal);
  y -= 32;

  // Meta rows
  draw('Invoice Number:', margin, y, { bold: true });
  draw(invoice.invoiceNumber ?? '', margin + 120, y, { color: teal });
  draw('Invoice Date:', pageWidth - margin - 200, y, { bold: true });
  draw(formatDate(new Date(invoice.date)), pageWidth - margin - 100, y);
  y -= lh;

  draw('Billed By:', margin, y, { bold: true });
  draw(invoice.vendorName, margin + 120, y);
  y -= lh;

  draw('Project:', margin, y, { bold: true });
  draw(projectName, margin + 120, y);
  y -= lh;

  if (projectAddress) {
    draw('Address:', margin, y, { bold: true });
    draw(projectAddress, margin + 120, y);
    y -= lh;
  }

  y -= 16;
  hline(y);
  y -= 24;

  // Milestone table header
  draw('Milestone', margin, y, { bold: true, size: 9, color: muted });
  draw('Dev Fee', pageWidth - margin, y, { bold: true, size: 9, color: muted, right: true });
  y -= 6;
  hline(y);
  y -= lh;

  for (const m of milestones) {
    ensureSpace(lh + 4);
    draw(m.name, margin, y);
    draw(formatCurrency(m.devFee), pageWidth - margin, y, { right: true });
    y -= lh;
  }

  // Total
  ensureSpace(lh + 14);
  y -= 4;
  hline(y, margin, pageWidth - margin, 1, dark);
  y -= lh;
  draw('Total', margin, y, { bold: true, size: 12 });
  draw(formatCurrency(invoice.amount), pageWidth - margin, y, { bold: true, size: 12, color: teal, right: true });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
