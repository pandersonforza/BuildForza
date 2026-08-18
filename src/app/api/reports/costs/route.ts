import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const group = searchParams.get("group");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const projects = await prisma.project.findMany({
      where: {
        ...(group ? { projectGroup: group } : {}),
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { address: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        address: true,
        tenant: true,
        status: true,
        projectGroup: true,
        budgetCategories: {
          select: {
            lineItems: {
              select: {
                originalBudget: true,
                revisedBudget: true,
                actualCost: true,
                committedCost: true,
              },
            },
          },
        },
        invoices: {
          select: {
            amount: true,
            status: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const result = projects.map((p) => {
      const lineItems = p.budgetCategories.flatMap((c) => c.lineItems);

      const originalBudget = lineItems.reduce((s, li) => s + li.originalBudget, 0);
      const revisedBudget = lineItems.reduce((s, li) => s + li.revisedBudget, 0);
      const actualCost = lineItems.reduce((s, li) => s + li.actualCost, 0);
      const committedCost = lineItems.reduce((s, li) => s + li.committedCost, 0);

      const totalInvoices = p.invoices.reduce((s, inv) => s + inv.amount, 0);
      const paidInvoices = p.invoices
        .filter((inv) => inv.status === "Paid")
        .reduce((s, inv) => s + inv.amount, 0);

      return {
        id: p.id,
        name: p.name,
        address: p.address,
        tenant: p.tenant,
        status: p.status,
        projectGroup: p.projectGroup,
        originalBudget,
        revisedBudget,
        actualCost,
        committedCost,
        variance: revisedBudget - actualCost,
        totalInvoices,
        paidInvoices,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
