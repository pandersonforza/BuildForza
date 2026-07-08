import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.invoice.updateMany({
    where: { status: { in: ['Pending Review', 'Checked'] } },
    data: { status: 'Submitted' },
  });
  console.log(`Updated ${result.count} invoice(s) to Submitted.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
