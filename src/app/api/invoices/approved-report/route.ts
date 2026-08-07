import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { PROJECT_GROUPS } from '@/lib/constants';

export const maxDuration = 30;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function safe(str: string): string {
  return str
    .replace(/[''ʼ]/g, "'")
    .replace(/[""]/g, '"')
    .replace(/–/g, '-')
    .replace(/—/g, '--')
    .replace(/…/g, '...')
    .replace(/[^\x00-\xFF]/g, '?');
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const invoices = await prisma.invoice.findMany({
      where: { status: { in: ['Approved', 'Paid'] } },
      select: {
        id: true,
        invoiceNumber: true,
        vendorName: true,
        amount: true,
        date: true,
        status: true,
        approver: true,
        project: {
          select: { name: true, projectGroup: true },
        },
      },
      orderBy: [{ project: { projectGroup: 'asc' } }, { date: 'asc' }],
    });

    // Split by status, then group each by projectGroup
    type InvoiceRow = typeof invoices[number];

    const buildGroups = (rows: InvoiceRow[]) => {
      const map = new Map<string, InvoiceRow[]>();
      for (const g of PROJECT_GROUPS) map.set(g, []);
      map.set('Unassigned', []);
      for (const inv of rows) {
        const key = inv.project?.projectGroup ?? 'Unassigned';
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(inv);
      }
      return [...map.entries()].filter(([, r]) => r.length > 0);
    };

    const approvedGroups = buildGroups(invoices.filter(i => i.status === 'Approved'));
    const paidGroups     = buildGroups(invoices.filter(i => i.status === 'Paid'));

    // ── Build PDF ─────────────────────────────────────────────
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 612;
    const pageHeight = 792;
    const margin = 45;
    const contentWidth = pageWidth - margin * 2;

    // Column x positions and widths
    const col = {
      vendor:  { x: margin,            w: 130 },
      inv:     { x: margin + 130,      w: 72  },
      project: { x: margin + 202,      w: 148 },
      date:    { x: margin + 350,      w: 82  },
      amount:  { x: margin + contentWidth, w: 0 }, // right-aligned to edge
    };

    const teal  = rgb(0.16, 0.6, 0.6);
    const dark  = rgb(0.1, 0.1, 0.1);
    const muted = rgb(0.45, 0.45, 0.45);
    const light = rgb(0.92, 0.92, 0.92);

    let page = doc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const draw = (
      str: string,
      x: number,
      yPos: number,
      o?: { bold?: boolean; size?: number; color?: ReturnType<typeof rgb>; right?: boolean; maxW?: number }
    ) => {
      let s = safe(str);
      const f = o?.bold ? fontBold : font;
      const sz = o?.size ?? 9;

      // Truncate if wider than maxW
      if (o?.maxW) {
        while (s.length > 1 && f.widthOfTextAtSize(s, sz) > o.maxW) {
          s = s.slice(0, -1);
        }
        if (s !== safe(str)) s = s.slice(0, -1) + '…'.replace(/[^\x00-\xFF]/g, '.');
      }

      const xPos = o?.right ? x - f.widthOfTextAtSize(s, sz) : x;
      page.drawText(s, { x: xPos, y: yPos, font: f, size: sz, color: o?.color ?? dark });
    };

    const hline = (yPos: number, x1 = margin, x2 = pageWidth - margin, w = 0.5, c = light) => {
      page.drawLine({ start: { x: x1, y: yPos }, end: { x: x2, y: yPos }, thickness: w, color: c });
    };

    const ensureSpace = (needed: number) => {
      if (y - needed < margin + 20) {
        page = doc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
    };

    // ── Page header ───────────────────────────────────────────
    draw('APPROVED & PAID INVOICES', margin, y, { bold: true, size: 16, color: teal });
    y -= 12;
    draw(`Generated ${formatDate(new Date())}`, margin, y, { size: 8, color: muted });
    y -= 8;
    hline(y, margin, pageWidth - margin, 1.5, teal);
    y -= 20;

    const grey = rgb(0.4, 0.4, 0.4);

    const approvedTotal = approvedGroups.reduce((s, [, r]) => s + r.reduce((a, i) => a + i.amount, 0), 0);
    const approvedCount = approvedGroups.reduce((s, [, r]) => s + r.length, 0);
    const paidTotal     = paidGroups.reduce((s, [, r]) => s + r.reduce((a, i) => a + i.amount, 0), 0);
    const paidCount     = paidGroups.reduce((s, [, r]) => s + r.length, 0);
    const grandTotal    = approvedTotal + paidTotal;
    const grandCount    = approvedCount + paidCount;

    // ── Summary table ─────────────────────────────────────────
    draw('SUMMARY', margin, y, { bold: true, size: 9, color: muted });
    y -= 6;
    hline(y);
    y -= 14;

    draw('Group', margin, y, { bold: true, size: 8, color: muted });
    draw('Invoices', margin + 120, y, { bold: true, size: 8, color: muted });
    draw('Total', pageWidth - margin, y, { bold: true, size: 8, color: muted, right: true });
    y -= 4;
    hline(y);
    y -= 12;

    // Approved sub-header
    draw('APPROVED — AWAITING PAYMENT', margin, y, { bold: true, size: 8, color: teal });
    y -= 11;
    for (const [group, rows] of approvedGroups) {
      draw(group, margin + 8, y, { size: 9 });
      draw(String(rows.length), margin + 120, y, { size: 9, color: muted });
      draw(formatCurrency(rows.reduce((s, r) => s + r.amount, 0)), pageWidth - margin, y, { size: 9, right: true });
      y -= 13;
    }
    draw('Approved Total', margin, y, { bold: true, size: 9 });
    draw(String(approvedCount), margin + 120, y, { bold: true, size: 9 });
    draw(formatCurrency(approvedTotal), pageWidth - margin, y, { bold: true, size: 9, color: teal, right: true });
    y -= 16;

    // Paid sub-header
    draw('PAID', margin, y, { bold: true, size: 8, color: grey });
    y -= 11;
    for (const [group, rows] of paidGroups) {
      draw(group, margin + 8, y, { size: 9, color: muted });
      draw(String(rows.length), margin + 120, y, { size: 9, color: muted });
      draw(formatCurrency(rows.reduce((s, r) => s + r.amount, 0)), pageWidth - margin, y, { size: 9, color: muted, right: true });
      y -= 13;
    }
    draw('Paid Total', margin, y, { bold: true, size: 9, color: muted });
    draw(String(paidCount), margin + 120, y, { bold: true, size: 9, color: muted });
    draw(formatCurrency(paidTotal), pageWidth - margin, y, { bold: true, size: 9, color: muted, right: true });
    y -= 16;

    hline(y, margin, pageWidth - margin, 0.75, rgb(0.7, 0.7, 0.7));
    y -= 12;
    draw('GRAND TOTAL', margin, y, { bold: true, size: 9 });
    draw(String(grandCount), margin + 120, y, { bold: true, size: 9 });
    draw(formatCurrency(grandTotal), pageWidth - margin, y, { bold: true, size: 11, color: teal, right: true });
    y -= 28;

    // ── Helper to render a set of groups ─────────────────────
    const drawGroups = (groups: [string, typeof invoices][], sectionColor: ReturnType<typeof rgb>) => {
      for (const [group, rows] of groups) {
        const subtotal = rows.reduce((s, r) => s + r.amount, 0);

        page = doc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;

        draw(group.toUpperCase(), margin, y, { bold: true, size: 14, color: sectionColor });
        y -= 8;
        hline(y, margin, pageWidth - margin, 1.5, sectionColor);
        y -= 20;

        draw('Vendor',    col.vendor.x,  y, { bold: true, size: 8, color: muted });
        draw('Invoice #', col.inv.x,     y, { bold: true, size: 8, color: muted });
        draw('Project',   col.project.x, y, { bold: true, size: 8, color: muted });
        draw('Date',      col.date.x,    y, { bold: true, size: 8, color: muted });
        draw('Amount',    col.amount.x,  y, { bold: true, size: 8, color: muted, right: true });
        y -= 5;
        hline(y);
        y -= 13;

        for (const inv of rows) {
          ensureSpace(16);
          draw(inv.vendorName ?? '',       col.vendor.x,  y, { size: 9, maxW: col.vendor.w - 4, color: sectionColor === grey ? muted : dark });
          draw(inv.invoiceNumber ?? '-',   col.inv.x,     y, { size: 9, maxW: col.inv.w - 4,    color: sectionColor === grey ? muted : dark });
          draw(inv.project?.name ?? '-',   col.project.x, y, { size: 9, maxW: col.project.w - 4, color: sectionColor === grey ? muted : dark });
          draw(formatDate(inv.date),       col.date.x,    y, { size: 9, maxW: col.date.w - 4,   color: sectionColor === grey ? muted : dark });
          draw(formatCurrency(inv.amount), col.amount.x,  y, { size: 9, right: true,             color: sectionColor === grey ? muted : dark });
          y -= 13;
          hline(y, margin, pageWidth - margin, 0.3, rgb(0.94, 0.94, 0.94));
          y -= 2;
        }

        ensureSpace(20);
        y -= 4;
        hline(y, margin, pageWidth - margin, 0.75, rgb(0.7, 0.7, 0.7));
        y -= 12;
        draw(`${group} Subtotal`, margin, y, { bold: true, size: 9, color: sectionColor === grey ? muted : dark });
        draw(`${rows.length} invoice${rows.length !== 1 ? 's' : ''}`, col.inv.x, y, { size: 8, color: muted });
        draw(formatCurrency(subtotal), col.amount.x, y, { bold: true, size: 10, color: sectionColor, right: true });
        y -= 24;
      }
    };

    // ── Approved detail pages ─────────────────────────────────
    if (approvedGroups.length > 0) drawGroups(approvedGroups, teal);

    // ── Paid detail pages ─────────────────────────────────────
    if (paidGroups.length > 0) {
      // Section divider page for Paid
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
      draw('PAID INVOICES', margin, y, { bold: true, size: 16, color: grey });
      y -= 8;
      hline(y, margin, pageWidth - margin, 1.5, grey);
      drawGroups(paidGroups, grey);
    }

    // ── Grand total ───────────────────────────────────────────
    ensureSpace(40);
    y -= 8;
    hline(y, margin, pageWidth - margin, 1.5, teal);
    y -= 14;
    draw('GRAND TOTAL', margin, y, { bold: true, size: 11 });
    draw(`${grandCount} invoice${grandCount !== 1 ? 's' : ''}`, margin + 90, y, { size: 8, color: muted });
    draw(formatCurrency(grandTotal), col.amount.x, y, { bold: true, size: 13, color: teal, right: true });

    const pdfBytes = await doc.save();

    const dateStr = new Date().toISOString().slice(0, 10);
    return new NextResponse(new Uint8Array(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Approved_Paid_Invoices_${dateStr}.pdf"`,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Failed to generate approved invoices report:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
