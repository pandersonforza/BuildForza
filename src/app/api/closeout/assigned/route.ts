import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const items = await prisma.closeoutItem.findMany({
      where: { assigneeId: user.id, completed: false },
      include: { project: { select: { id: true, name: true } } },
      orderBy: [{ dueDate: 'asc' }, { category: 'asc' }, { sortOrder: 'asc' }],
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to fetch assigned closeout items:', error);
    return NextResponse.json({ error: 'Failed to fetch assigned closeout items' }, { status: 500 });
  }
}
