import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DbService } from '../src/database/db.service';
import { PrismaService } from '../src/database/prisma.service';

async function main() {
  console.log('🧪 Starting NestJS App with PostgreSQL + Prisma for verification...');
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
  await app.init();

  const db = app.get(DbService);
  const prisma = app.get(PrismaService);

  console.log('📊 Verification of active in-app state:');
  console.log(`- Products in memory: ${db.products.length}`);
  console.log(`- Orders in memory: ${db.orders.length}`);
  console.log(`- Prescriptions in memory: ${db.prescriptions.length}`);
  console.log(`- Categories in memory: ${db.categories.length}`);
  console.log(`- Users in memory: ${db.users.length}`);

  console.log('🐘 Verification of direct PostgreSQL connectivity:');
  const pgUserCount = await prisma.user.count();
  const pgProductCount = await prisma.product.count();
  const pgOrderCount = await prisma.order.count();
  console.log(`- PostgreSQL User count: ${pgUserCount}`);
  console.log(`- PostgreSQL Product count: ${pgProductCount}`);
  console.log(`- PostgreSQL Order count: ${pgOrderCount}`);

  if (db.products.length !== 11600 || pgProductCount !== 11600) {
    throw new Error(`Product count verification failed: memory=${db.products.length}, pg=${pgProductCount}`);
  }

  await app.close();
  console.log('🎉 Verification PASSED: NestJS initialized and connected to PostgreSQL seamlessly!');
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
