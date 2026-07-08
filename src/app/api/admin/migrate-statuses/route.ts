import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await prisma.invoice.updateMany({
    where: { status: { in: ['Pending Review', 'Checked'] } },
    data: { status: 'Submitted' },
  });

  return NextResponse.json({ updated: result.count });
}
