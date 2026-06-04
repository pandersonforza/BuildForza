import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { lineItemId } = await request.json();
    if (!lineItemId) {
      return NextResponse.json({ error: 'lineItemId is required' }, { status: 400 });
    }

    // Load source line item along with its project id
    const source = await prisma.budgetLineItem.findUnique({
      where: { id: lineItemId },
      include: { category: { select: { projectId: true } } },
    });

    if (!source) {
      return NextResponse.json({ error: 'Line item not found' }, { status: 404 });
    }

    const surplus = source.revisedBudget - source.actualCost;
    if (surplus <= 0) {
      return NextResponse.json({ error: 'No unused budget to move' }, { status: 400 });
    }

    const projectId = source.category.projectId;

    // Find the contingency line item anywhere in this project
    const contingency = await prisma.budgetLineItem.findFirst({
      where: {
        category: { projectId },
        description: { contains: 'contingency', mode: 'insensitive' },
        NOT: { id: lineItemId },
      },
    });

    if (!contingency) {
      return NextResponse.json(
        { error: 'No Contingency line item found in this project' },
        { status: 404 }
      );
    }

    // Atomic swap: trim source to actual, credit contingency
    await prisma.$transaction([
      prisma.budgetLineItem.update({
        where: { id: lineItemId },
        data: { revisedBudget: source.actualCost },
      }),
      prisma.budgetLineItem.update({
        where: { id: contingency.id },
        data: { revisedBudget: { increment: surplus } },
      }),
    ]);

    return NextResponse.json({ moved: surplus, contingencyId: contingency.id });
  } catch (error) {
    console.error('Failed to move budget to contingency:', error);
    return NextResponse.json({ error: 'Failed to move budget to contingency' }, { status: 500 });
  }
}
