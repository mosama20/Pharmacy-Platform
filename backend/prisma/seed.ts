import { PrismaClient, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting deterministic seed...');

  const passwordHash = await bcrypt.hash('ChefaaAdmin@2026', 10);
  const staffHash = await bcrypt.hash('ChefaaStaff@2026', 10);
  const customerHash = await bcrypt.hash('ChefaaCustomer@2026', 10);

  // 1. Users (Seeding / Updating by ID to keep relational integrity intact)
  await prisma.user.upsert({
    where: { id: 'usr_admin_1' },
    update: {
      email: 'admin@chefaa.com',
      password: passwordHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      id: 'usr_admin_1',
      name: 'د. أيمن مسعد (المدير الطبي)',
      email: 'admin@chefaa.com',
      phone: '01000000001',
      password: passwordHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      city: 'القاهرة',
    },
  });

  await prisma.user.upsert({
    where: { id: 'usr_pharm_1' },
    update: {
      email: 'pharmacist@chefaa.com',
      password: staffHash,
      role: Role.PHARMACIST,
      status: UserStatus.ACTIVE,
    },
    create: {
      id: 'usr_pharm_1',
      name: 'د. سارة الصيدلي',
      email: 'pharmacist@chefaa.com',
      phone: '01000000002',
      password: staffHash,
      role: Role.PHARMACIST,
      status: UserStatus.ACTIVE,
      shift: 'صباحي',
      city: 'الجيزة',
    },
  });

  await prisma.user.upsert({
    where: { id: 'usr_cour_1' },
    update: {
      email: 'courier@chefaa.com',
      password: staffHash,
      role: Role.DELIVERY,
      status: UserStatus.ACTIVE,
    },
    create: {
      id: 'usr_cour_1',
      name: 'كابتن محمد سمير',
      email: 'courier@chefaa.com',
      phone: '01000000003',
      password: staffHash,
      role: Role.DELIVERY,
      status: UserStatus.ACTIVE,
      city: 'القاهرة',
    },
  });

  await prisma.user.upsert({
    where: { id: 'usr_cust_1' },
    update: {
      email: 'customer@chefaa.com',
      password: customerHash,
      role: Role.CUSTOMER,
      status: UserStatus.ACTIVE,
    },
    create: {
      id: 'usr_cust_1',
      name: 'أحمد محمود',
      email: 'customer@chefaa.com',
      phone: '01111111111',
      password: customerHash,
      role: Role.CUSTOMER,
      status: UserStatus.ACTIVE,
      points: 150,
      walletBalance: 200,
      city: 'المعادي',
    },
  });

  // 2. Default Categories
  const categories = [
    { id: 'cat_med', name: 'أدوية علاجية', slug: 'medications', iconName: 'Pill', order: 1 },
    { id: 'cat_chronic', name: 'أمراض مزمنة', slug: 'chronic-diseases', iconName: 'HeartPulse', order: 2 },
    { id: 'cat_vit', name: 'فيتامينات ومكملات', slug: 'vitamins', iconName: 'Sparkles', order: 3 },
    { id: 'cat_skin', name: 'العناية بالبشرة', slug: 'skincare', iconName: 'Smile', order: 4 },
    { id: 'cat_baby', name: 'الأم والطفل', slug: 'mom-baby', iconName: 'Baby', order: 5 },
    { id: 'cat_devices', name: 'أجهزة طبية', slug: 'medical-devices', iconName: 'Stethoscope', order: 6 },
    { id: 'cat_hair', name: 'العناية بالشعر', slug: 'haircare', iconName: 'Scissors', order: 7 },
    { id: 'cat_oral', name: 'صحة الفم والأسنان', slug: 'oralcare', iconName: 'Shield', order: 8 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {},
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        iconName: cat.iconName,
        order: cat.order,
      },
    });
  }

  // 3. Promo Codes
  await prisma.promoCode.upsert({
    where: { code: 'CHEFAA2026' },
    update: {},
    create: {
      id: 'promo_chefaa_2026',
      code: 'CHEFAA2026',
      discountPercentage: 15,
      minOrderValue: 200,
      maxDiscount: 100,
      usageLimit: 500,
      isActive: true,
    },
  });

  await prisma.promoCode.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      id: 'promo_welcome_10',
      code: 'WELCOME10',
      discountPercentage: 10,
      minOrderValue: 100,
      maxDiscount: 50,
      usageLimit: 1000,
      isActive: true,
    },
  });

  // 4. Default Platform Settings
  await prisma.platformSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      data: {
        websiteName: 'المنصة الصيدلانية المتكاملة - شفاء',
        brandTagline: 'صيدليتك الذكية في جيبك - توصيل سريع واستشارات فورية',
        brandDescription: 'منصة رعاية صحية متطورة لتوصيل الأدوية والروشتات ومتابعة الأمراض المزمنة في مصر',
        hotline: '19011',
        whatsapp: '+201000000000',
        supportEmail: 'support@chefaa.com',
        deliveryFee: 25,
        freeDeliveryThreshold: 500,
        estimatedDeliveryMin: 45,
        allowPrescriptionUpload: true,
      },
    },
  });

  console.log('✅ Seed finished successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
