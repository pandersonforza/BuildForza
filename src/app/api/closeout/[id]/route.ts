import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { completed, assigneeId, dueDate, notes } = body;

    const data: Record<string, unknown> = {};
    if (completed !== undefined) data.completed = completed;
    if ('assigneeId' in body) data.assigneeId = assigneeId ?? null;
    if ('dueDate' in body) data.dueDate = dueDate ? new Date(dueDate) : null;
    if ('notes' in body) {
      data.notes = notes ?? null;
      data.notesUpdatedAt = notes ? new Date() : null;
    }

    const item = await prisma.closeoutItem.update({
      where: { id },
      data,
      include: { assignee: { select: { id: true, name: true } } },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Failed to update closeout item:', error);
    return NextResponse.json({ error: 'Failed to update closeout item' }, { status: 500 });
  }
}
