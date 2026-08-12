import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

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

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const ids: string[] = body.ids ?? [];
    const label: string = body.label ?? '';

    if (!ids.length) {
      return NextResponse.json({ error: 'No invoice IDs provided' }, { status: 400 });
    }

    const invoices = await prisma.invoice.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        invoiceNumber: true,
        vendorName: true,
        amount: true,
        date: true,
        status: true,
        project: {
          select: { name: true, projectGroup: true },
        },
      },
      orderBy: [{ project: { projectGroup: 'asc' } }, { date: 'asc' }],
    });

    // Group by projectGroup, preserving DB sort order
    const dbGroups = await prisma.group.findMany({ orderBy: { sortOrder: 'asc' }, select: { name: true } });
    const groupOrder = dbGroups.map((g) => g.name);

    type InvoiceRow = typeof invoices[number];
    const groupMap = new Map<string, InvoiceRow[]>();
    for (const g of groupOrder) groupMap.set(g, []);
    groupMap.set('Unassigned', []);
    for (const inv of invoices) {
      const key = inv.project?.projectGroup ?? 'Unassigned';
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(inv);
    }
    const groupEntries = [...groupMap.entries()].filter(([, r]) => r.length > 0);

    // ── Build PDF ─────────────────────────────────────────────
    const doc = await PDFDocument.create();
    const font     = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth  = 612;
    const pageHeight = 792;
    const margin     = 45;
    const contentWidth = pageWidth - margin * 2;

    // 6-column layout: Vendor | Invoice # | Project | Date | Status | Amount
    const col = {
      vendor:  { x: margin,       w: 115 },
      inv:     { x: margin + 115, w: 65  },
      project: { x: margin + 180, w: 125 },
      date:    { x: margin + 305, w: 72  },
      status:  { x: margin + 377, w: 78  },
      amount:  { x: margin + contentWidth, w: 0 }, // right-aligned to edge
    };

    const teal  = rgb(0.16, 0.6, 0.6);
    const dark  = rgb(0.1,  0.1, 0.1);
    const muted = rgb(0.45, 0.45, 0.45);
    const light = rgb(0.92, 0.92, 0.92);

    const statusColor = (s: string) => {
      if (s === 'Approved') return teal;
      if (s === 'Paid')     return muted;
      if (s === 'Rejected') return rgb(0.7, 0.2, 0.2);
      return rgb(0.75, 0.5, 0); // Submitted — amber
    };

    let page = doc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const draw = (
      str: string,
      x: number,
      yPos: number,
      o?: { bold?: boolean; size?: number; color?: ReturnType<typeof rgb>; right?: boolean; maxW?: number }
    ) => {
      let s = safe(str);
      const f  = o?.bold ? fontBold : font;
      const sz = o?.size ?? 9;
      if (o?.maxW) {
        while (s.length > 1 && f.widthOfTextAtSize(s, sz) > o.maxW) s = s.slice(0, -1);
        if (s !== safe(str)) s = s.slice(0, -1) + '.';
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

    const grandTotal = invoices.reduce((s, i) => s + i.amount, 0);
    const grandCount = invoices.length;

    // ── Cover / summary page ──────────────────────────────────
    draw('INVOICE REPORT', margin, y, { bold: true, size: 16, color: teal });
    y -= 14;
    if (label) {
      draw(label, margin, y, { size: 9, color: muted });
      y -= 12;
    }
    draw(`Generated ${formatDate(new Date())}  |  ${grandCount} invoice${grandCount !== 1 ? 's' : ''}`, margin, y, { size: 8, color: muted });
    y -= 8;
    hline(y, margin, pageWidth - margin, 1.5, teal);
    y -= 22;

    // Summary table
    draw('SUMMARY', margin, y, { bold: true, size: 9, color: muted });
    y -= 6;
    hline(y);
    y -= 14;

    draw('Group',    margin,       y, { bold: true, size: 8, color: muted });
    draw('Invoices', margin + 140, y, { bold: true, size: 8, color: muted });
    draw('Total',    pageWidth - margin, y, { bold: true, size: 8, color: muted, right: true });
    y -= 4;
    hline(y);
    y -= 12;

    for (const [group, rows] of groupEntries) {
      draw(group, margin + 8, y, { size: 9 });
      draw(String(rows.length), margin + 140, y, { size: 9, color: muted });
      draw(formatCurrency(rows.reduce((s, r) => s + r.amount, 0)), pageWidth - margin, y, { size: 9, right: true });
      y -= 13;
    }

    y -= 2;
    hline(y, margin, pageWidth - margin, 0.75, rgb(0.7, 0.7, 0.7));
    y -= 12;
    draw('TOTAL', margin, y, { bold: true, size: 9 });
    draw(String(grandCount), margin + 140, y, { bold: true, size: 9 });
    draw(formatCurrency(grandTotal), pageWidth - margin, y, { bold: true, size: 11, color: teal, right: true });

    // ── Detail pages (one per group, overflows to new pages automatically) ──
    for (const [group, rows] of groupEntries) {
      const subtotal = rows.reduce((s, r) => s + r.amount, 0);

      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;

      draw(group.toUpperCase(), margin, y, { bold: true, size: 14, color: teal });
      y -= 8;
      hline(y, margin, pageWidth - margin, 1.5, teal);
      y -= 20;

      // Column headers
      draw('Vendor',    col.vendor.x,  y, { bold: true, size: 8, color: muted });
      draw('Invoice #', col.inv.x,     y, { bold: true, size: 8, color: muted });
      draw('Project',   col.project.x, y, { bold: true, size: 8, color: muted });
      draw('Date',      col.date.x,    y, { bold: true, size: 8, color: muted });
      draw('Status',    col.status.x,  y, { bold: true, size: 8, color: muted });
      draw('Amount',    col.amount.x,  y, { bold: true, size: 8, color: muted, right: true });
      y -= 5;
      hline(y);
      y -= 13;

      for (const inv of rows) {
        ensureSpace(16);
        const sc = statusColor(inv.status);
        draw(inv.vendorName ?? '',       col.vendor.x,  y, { size: 9, maxW: col.vendor.w  - 4 });
        draw(inv.invoiceNumber ?? '-',   col.inv.x,     y, { size: 9, maxW: col.inv.w     - 4 });
        draw(inv.project?.name ?? '-',   col.project.x, y, { size: 9, maxW: col.project.w - 4 });
        draw(formatDate(inv.date),       col.date.x,    y, { size: 9, maxW: col.date.w    - 4 });
        draw(inv.status,                 col.status.x,  y, { size: 9, maxW: col.status.w  - 4, color: sc });
        draw(formatCurrency(inv.amount), col.amount.x,  y, { size: 9, right: true });
        y -= 13;
        hline(y, margin, pageWidth - margin, 0.3, rgb(0.94, 0.94, 0.94));
        y -= 2;
      }

      ensureSpace(20);
      y -= 4;
      hline(y, margin, pageWidth - margin, 0.75, rgb(0.7, 0.7, 0.7));
      y -= 12;
      draw(`${group} Subtotal`, margin, y, { bold: true, size: 9 });
      draw(`${rows.length} invoice${rows.length !== 1 ? 's' : ''}`, col.inv.x, y, { size: 8, color: muted });
      draw(formatCurrency(subtotal), col.amount.x, y, { bold: true, size: 10, color: teal, right: true });
      y -= 24;
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
        'Content-Disposition': `attachment; filename="Invoices_${dateStr}.pdf"`,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Failed to generate invoice report:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
