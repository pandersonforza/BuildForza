import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { generateDevFeePdf } from '@/lib/generate-dev-fee-pdf';

export const maxDuration = 60;

/** Sanitize a string for use as a filename. */
function safeFilename(str: string): string {
  return str.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim();
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json() as { invoiceIds: string[] };
    const { invoiceIds } = body;

    if (!invoiceIds?.length) {
      return NextResponse.json({ error: 'No invoice IDs provided' }, { status: 400 });
    }

    const invoices = await prisma.invoice.findMany({
      where: { id: { in: invoiceIds } },
      select: {
        id: true,
        invoiceNumber: true,
        vendorName: true,
        amount: true,
        date: true,
        filePath: true,
        aiNotes: true,
        project: { select: { name: true, address: true } },
      },
      orderBy: { date: 'asc' },
    });

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const zip = new JSZip();

    // Track filenames to avoid collisions
    const seen = new Map<string, number>();

    for (const invoice of invoices) {
      let pdfBuffer: Buffer | null = null;

      if (invoice.invoiceNumber?.startsWith('DF-')) {
        // Generate dev fee PDF on the fly
        try {
          pdfBuffer = await generateDevFeePdf(invoice);
        } catch (err) {
          console.error(`Failed to generate PDF for invoice ${invoice.id}:`, err);
          continue;
        }
      } else if (invoice.filePath?.startsWith('http')) {
        // Fetch stored PDF from Vercel Blob
        try {
          const res = await fetch(invoice.filePath, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (res.ok) {
            pdfBuffer = Buffer.from(await res.arrayBuffer());
          }
        } catch (err) {
          console.error(`Failed to fetch PDF for invoice ${invoice.id}:`, err);
          continue;
        }
      }

      if (!pdfBuffer) continue;

      // Build a readable filename: "VendorName - INV-0001.pdf"
      const parts = [safeFilename(invoice.vendorName ?? 'Invoice')];
      if (invoice.invoiceNumber) parts.push(safeFilename(invoice.invoiceNumber));
      let base = parts.join(' - ');

      // Deduplicate
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      const filename = count === 0 ? `${base}.pdf` : `${base} (${count}).pdf`;

      zip.file(filename, pdfBuffer);
    }

    if (zip.files && Object.keys(zip.files).length === 0) {
      return NextResponse.json({ error: 'No PDFs could be generated for the selected invoices' }, { status: 404 });
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="invoices.zip"',
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Failed to generate invoice ZIP:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
