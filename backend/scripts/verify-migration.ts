import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const jsonPath = path.join(__dirname, '../data/storage.json');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  console.log('🔍 Validating PostgreSQL vs storage.json record counts:');

  const [
    userCount,
    productCount,
    categoryCount,
    orderCount,
    orderItemCount,
    prescriptionCount,
    refillCount,
    promoCodeCount,
    bannerCount,
    articleCount,
    settingsCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.category.count(),
    prisma.order.count(),
    prisma.orderItem.count(),
    prisma.prescription.count(),
    prisma.refillSubscription.count(),
    prisma.promoCode.count(),
    prisma.heroBanner.count(),
    prisma.article.count(),
    prisma.platformSettings.count(),
  ]);

  console.log(`- Users:         PG=${userCount} vs JSON=${data.users?.length} (+ ${userCount - (data.users?.length || 0)} referenced customers)`);
  console.log(`- Products:      PG=${productCount} vs JSON=${data.products?.length}`);
  console.log(`- Categories:    PG=${categoryCount} vs JSON=${data.categories?.length}`);
  console.log(`- Orders:        PG=${orderCount} vs JSON=${data.orders?.length}`);
  console.log(`- OrderItems:    PG=${orderItemCount}`);
  console.log(`- Prescriptions: PG=${prescriptionCount} vs JSON=${data.prescriptions?.length}`);
  console.log(`- Refills:       PG=${refillCount} vs JSON=${data.refills?.length}`);
  console.log(`- PromoCodes:    PG=${promoCodeCount} vs JSON=${data.promoCodes?.length}`);
  console.log(`- Banners:       PG=${bannerCount} vs JSON=${data.banners?.length}`);
  console.log(`- Articles:      PG=${articleCount} vs JSON=${data.articles?.length}`);
  console.log(`- Settings:      PG=${settingsCount}`);

  // Validate relationships
  const sampleOrder = await prisma.order.findFirst({
    include: { items: true, customer: true },
  });
  console.log('\n🔗 Sample Order Relationship Test:');
  console.log(`- Order Number: ${sampleOrder?.orderNumber}`);
  console.log(`- Customer: ${sampleOrder?.customer?.name} (${sampleOrder?.customer?.email})`);
  console.log(`- Items count: ${sampleOrder?.items.length}`);

  // Validate critical checks
  if (productCount !== (data.products?.length || 0)) {
    throw new Error(`Product count mismatch: PG=${productCount}, JSON=${data.products?.length}`);
  }
  if (orderCount !== (data.orders?.length || 0)) {
    throw new Error(`Order count mismatch: PG=${orderCount}, JSON=${data.orders?.length}`);
  }
  if (prescriptionCount !== (data.prescriptions?.length || 0)) {
    throw new Error(`Prescription count mismatch: PG=${prescriptionCount}, JSON=${data.prescriptions?.length}`);
  }

  console.log('\n🎉 ALL MIGRATION INTEGRITY CHECKS PASSED!');
}

main()
  .catch((e) => {
    console.error('❌ Validation failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
