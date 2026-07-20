import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const DEFAULT_ITEMS: { category: string; title: string; sortOrder: number }[] = [
  // 1. Deal Setup & Team Coordination
  { category: "1. Deal Setup & Team Coordination", sortOrder: 0, title: "Confirm decision to sell and target closing date with ownership / investment committee" },
  { category: "1. Deal Setup & Team Coordination", sortOrder: 1, title: "Identify buyer and confirm letter of intent key terms" },
  { category: "1. Deal Setup & Team Coordination", sortOrder: 2, title: "Assemble deal team: legal counsel, title company, broker, lender contact, accountant" },
  { category: "1. Deal Setup & Team Coordination", sortOrder: 3, title: "Open a shared closing folder / data room and assign document owners" },
  { category: "1. Deal Setup & Team Coordination", sortOrder: 4, title: "Prepare and circulate a closing timeline with critical dates and responsibilities" },
  // 2. Legal & Corporate
  { category: "2. Legal & Corporate", sortOrder: 0, title: "Gather entity formation docs, operating agreement, and authorizing resolutions" },
  { category: "2. Legal & Corporate", sortOrder: 1, title: "Obtain internal approvals / consents required to sell" },
  { category: "2. Legal & Corporate", sortOrder: 2, title: "Review and prepare the Purchase & Sale Agreement (PSA) with counsel" },
  { category: "2. Legal & Corporate", sortOrder: 3, title: "Confirm any rights of first refusal, buy-sell, or partner consents are cleared" },
  // 3. Title, Survey & Legal Description
  { category: "3. Title, Survey & Legal Description", sortOrder: 0, title: "Order updated title commitment / preliminary title report" },
  { category: "3. Title, Survey & Legal Description", sortOrder: 1, title: "Review and clear title exceptions, liens, and encumbrances" },
  { category: "3. Title, Survey & Legal Description", sortOrder: 2, title: "Confirm easements, CC&Rs, and access agreements are recorded and disclosed" },
  { category: "3. Title, Survey & Legal Description", sortOrder: 3, title: "Resolve any outstanding mechanic's liens and obtain lien waivers" },
  { category: "3. Title, Survey & Legal Description", sortOrder: 4, title: "Confirm title insurance policy / endorsements the buyer will require" },
  // 4. Entitlements, Permits & Compliance
  { category: "4. Entitlements, Permits & Compliance", sortOrder: 0, title: "Compile approved site plan, zoning approvals, and entitlement conditions" },
  { category: "4. Entitlements, Permits & Compliance", sortOrder: 1, title: "Confirm all development conditions of approval are satisfied and documented" },
  { category: "4. Entitlements, Permits & Compliance", sortOrder: 2, title: "Gather building permits and confirm all are finaled / signed off" },
  { category: "4. Entitlements, Permits & Compliance", sortOrder: 3, title: "Obtain Certificate(s) of Occupancy (temporary and/or final)" },
  { category: "4. Entitlements, Permits & Compliance", sortOrder: 4, title: "Confirm impact fees, bonds, and development agreement obligations are satisfied" },
  { category: "4. Entitlements, Permits & Compliance", sortOrder: 5, title: "Assemble environmental reports (Phase I / Phase II) and any remediation sign-offs" },
  // 5. Construction Closeout
  { category: "5. Construction Closeout", sortOrder: 0, title: "Confirm substantial and final completion with general contractor" },
  { category: "5. Construction Closeout", sortOrder: 1, title: "Obtain final signed-off inspections from all jurisdictions" },
  { category: "5. Construction Closeout", sortOrder: 2, title: "Collect as-built drawings and final approved plans" },
  { category: "5. Construction Closeout", sortOrder: 3, title: "Assemble warranties (roof, HVAC, structural, equipment) and transfer to buyer" },
  { category: "5. Construction Closeout", sortOrder: 4, title: "Collect operation & maintenance (O&M) manuals and equipment cut sheets" },
  { category: "5. Construction Closeout", sortOrder: 5, title: "Obtain final lien waivers from GC and all subcontractors / suppliers" },
  { category: "5. Construction Closeout", sortOrder: 6, title: "Reconcile final contract sum, change orders, and retainage release" },
  { category: "5. Construction Closeout", sortOrder: 7, title: "Prepare punch list status and document any open / carried items" },
  // 6. Financial, Lender & Tax
  { category: "6. Financial, Lender & Tax", sortOrder: 0, title: "Obtain construction loan payoff statement / lender demand" },
  { category: "6. Financial, Lender & Tax", sortOrder: 1, title: "Coordinate loan payoff, reconveyance, and release of deeds of trust" },
  { category: "6. Financial, Lender & Tax", sortOrder: 2, title: "Confirm real estate tax status; prepare property tax proration" },
  { category: "6. Financial, Lender & Tax", sortOrder: 3, title: "Reconcile project budget vs. actual costs (final development cost summary)" },
  { category: "6. Financial, Lender & Tax", sortOrder: 4, title: "Confirm insurance in place through closing and closeout after" },
  { category: "6. Financial, Lender & Tax", sortOrder: 5, title: "Prepare closing statement / settlement statement review with title & accounting" },
  // 7. Leasing & Tenancy
  { category: "7. Leasing & Tenancy", sortOrder: 0, title: "Compile executed leases, amendments, and guaranties" },
  { category: "7. Leasing & Tenancy", sortOrder: 1, title: "Prepare current rent roll and reconcile to leases" },
  { category: "7. Leasing & Tenancy", sortOrder: 2, title: "Obtain estoppel certificates from tenants" },
  { category: "7. Leasing & Tenancy", sortOrder: 3, title: "Obtain subordination, non-disturbance and attornment (SNDA) agreements as needed" },
  { category: "7. Leasing & Tenancy", sortOrder: 4, title: "Reconcile security deposits, prepaid rent, and CAM / operating expense reconciliations" },
  { category: "7. Leasing & Tenancy", sortOrder: 5, title: "Confirm all Tis and leasing commissions have been paid" },
  // 8. Property Diligence Package for Buyer
  { category: "8. Property Diligence Package for Buyer", sortOrder: 0, title: "Compile service contracts and vendor agreements (assign or terminate as needed)" },
  { category: "8. Property Diligence Package for Buyer", sortOrder: 1, title: "Gather utility accounts, meters, and transfer instructions" },
  { category: "8. Property Diligence Package for Buyer", sortOrder: 2, title: "Assemble operating statements / income & expense history" },
  { category: "8. Property Diligence Package for Buyer", sortOrder: 3, title: "Provide zoning report, appraisal (if applicable), and property condition report" },
  // 9. Purchase & Sale / Closing Mechanics
  { category: "9. Purchase & Sale / Closing Mechanics", sortOrder: 0, title: "Finalize and execute the PSA and any amendments" },
  { category: "9. Purchase & Sale / Closing Mechanics", sortOrder: 1, title: "Confirm earnest money deposited and escrow instructions opened" },
  { category: "9. Purchase & Sale / Closing Mechanics", sortOrder: 2, title: "Track buyer due diligence period and contingency removals" },
  { category: "9. Purchase & Sale / Closing Mechanics", sortOrder: 3, title: "Prepare deed, bill of sale, assignment of leases/contracts, and FIRPTA affidavit" },
  { category: "9. Purchase & Sale / Closing Mechanics", sortOrder: 4, title: "Prepare and review final settlement statement and prorations" },
  { category: "9. Purchase & Sale / Closing Mechanics", sortOrder: 5, title: "Coordinate signing, funding, and recording with title/escrow" },
  { category: "9. Purchase & Sale / Closing Mechanics", sortOrder: 6, title: "Confirm net sale proceeds wire and distribution instructions" },
  // 10. Post-Closing
  { category: "10. Post-Closing", sortOrder: 0, title: "Confirm deed recording and receipt of final title policy" },
  { category: "10. Post-Closing", sortOrder: 1, title: "Deliver original documents and full closing binder to all parties" },
  { category: "10. Post-Closing", sortOrder: 2, title: "Notify tenants, vendors, and utilities of ownership change" },
  { category: "10. Post-Closing", sortOrder: 3, title: "Close out project accounts, bonds, and remaining lender obligations" },
  { category: "10. Post-Closing", sortOrder: 4, title: "Distribute proceeds and prepare final accounting to investors / partners" },
  { category: "10. Post-Closing", sortOrder: 5, title: "Conduct project post-mortem / lessons-learned review" },
];

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

    let items = await prisma.closeoutItem.findMany({
      where: { projectId },
      include: { assignee: { select: { id: true, name: true } } },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });

    if (items.length === 0) {
      await prisma.closeoutItem.createMany({
        data: DEFAULT_ITEMS.map((item) => ({ ...item, projectId })),
      });
      items = await prisma.closeoutItem.findMany({
        where: { projectId },
        include: { assignee: { select: { id: true, name: true } } },
        orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
      });
    }

    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to fetch closeout items:', error);
    return NextResponse.json({ error: 'Failed to fetch closeout items' }, { status: 500 });
  }
}
