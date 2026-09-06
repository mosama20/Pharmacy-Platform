import { PrismaClient, Role, UserStatus, OrderStatus, DeliveryType, PaymentMethod, PaymentStatus, PrescriptionStatus, RefillStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const jsonPath = path.join(__dirname, '../data/storage.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Storage file not found at ${jsonPath}`);
  }

  console.log('📖 Reading storage.json...');
  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(raw);

  console.log('🚀 Starting data migration into PostgreSQL...');

  // 1. Users & Guest Customers
  console.log('👤 Migrating users...');
  const userMap = new Set<string>();

  for (const u of data.users || []) {
    userMap.add(u.id);
    const password = u.password?.startsWith('$2') 
      ? u.password 
      : bcrypt.hashSync(u.password || 'ChefaaSecure2026!', 10);

    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        name: u.name,
        email: u.email,
        phone: u.phone,
        password,
        role: (u.role as Role) || Role.CUSTOMER,
        status: (u.status as UserStatus) || UserStatus.ACTIVE,
        shift: u.shift || null,
        nationalId: u.nationalId || null,
        address: u.address || null,
        city: u.city || null,
        points: u.points || 0,
        walletBalance: u.walletBalance || 0,
        createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
      },
      create: {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        password,
        role: (u.role as Role) || Role.CUSTOMER,
        status: (u.status as UserStatus) || UserStatus.ACTIVE,
        shift: u.shift || null,
        nationalId: u.nationalId || null,
        address: u.address || null,
        city: u.city || null,
        points: u.points || 0,
        walletBalance: u.walletBalance || 0,
        createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
      },
    });
  }

  // Ensure any orphaned customer referenced in orders/prescriptions is created as a customer
  const referencedCustomerIds = new Set<string>();
  (data.orders || []).forEach((o: any) => { if (o.customerId) referencedCustomerIds.add(o.customerId); });
  (data.prescriptions || []).forEach((p: any) => { if (p.customerId) referencedCustomerIds.add(p.customerId); });
  (data.refills || []).forEach((r: any) => { if (r.customerId) referencedCustomerIds.add(r.customerId); });

  for (const custId of referencedCustomerIds) {
    if (!userMap.has(custId)) {
      console.log(`Creating placeholder user for referenced customer: ${custId}`);
      const orderMatch = (data.orders || []).find((o: any) => o.customerId === custId);
      const rxMatch = (data.prescriptions || []).find((p: any) => p.customerId === custId);
      const name = orderMatch?.customerName || rxMatch?.customerName || 'عميل تشافي';
      const phone = orderMatch?.customerPhone || rxMatch?.customerPhone || '01000000000';
      const email = orderMatch?.customerEmail || `${custId.toLowerCase()}@chefaa.internal`;

      await prisma.user.upsert({
        where: { id: custId },
        update: {},
        create: {
          id: custId,
          name,
          email,
          phone,
          password: bcrypt.hashSync('GuestAccount2026!', 10),
          role: Role.CUSTOMER,
          status: UserStatus.ACTIVE,
        },
      });
      userMap.add(custId);
    }
  }

  // 2. Categories
  console.log('📁 Migrating categories...');
  for (const c of data.categories || []) {
    await prisma.category.upsert({
      where: { id: c.id },
      update: {
        name: c.name,
        slug: c.slug,
        iconName: c.iconName || null,
        isSpecial: Boolean(c.isSpecial),
        order: c.order || 0,
        productCount: c.productCount || 0,
      },
      create: {
        id: c.id,
        name: c.name,
        slug: c.slug,
        iconName: c.iconName || null,
        isSpecial: Boolean(c.isSpecial),
        order: c.order || 0,
        productCount: c.productCount || 0,
      },
    });
  }

  // 3. Products
  console.log(`📦 Migrating ${data.products?.length || 0} products...`);
  const products = data.products || [];
  const chunkSize = 1000;
  for (let i = 0; i < products.length; i += chunkSize) {
    const chunk = products.slice(i, i + chunkSize);
    const mapped = chunk.map((p: any) => ({
      id: p.id,
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      activeIngredient: p.activeIngredient || null,
      category: p.category,
      subCategory: p.subCategory || null,
      price: Number(p.price) || 0,
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      discountPercentage: p.discountPercentage ? Number(p.discountPercentage) : null,
      stock: Number(p.stock) || 0,
      isPrescriptionRequired: Boolean(p.isPrescriptionRequired),
      isHotDeal: Boolean(p.isHotDeal),
      rating: Number(p.rating) || 5.0,
      reviewCount: Number(p.reviewCount) || 0,
      descriptionAr: p.descriptionAr || null,
      dosage: p.dosage || null,
      sideEffects: p.sideEffects || null,
      image: p.image || '/images/default-medicine.png',
      tags: Array.isArray(p.tags) ? p.tags : [],
      alternatives: Array.isArray(p.alternatives) ? p.alternatives : [],
    }));

    await prisma.product.createMany({
      data: mapped,
      skipDuplicates: true,
    });
    console.log(`  ✓ Inserted products ${i + 1} to ${Math.min(i + chunkSize, products.length)}`);
  }

  // 4. Promo Codes
  console.log('🏷️ Migrating promo codes...');
  for (const promo of data.promoCodes || []) {
    await prisma.promoCode.upsert({
      where: { id: promo.id },
      update: {
        code: promo.code,
        discountPercentage: Number(promo.discountPercentage) || 0,
        minOrderValue: Number(promo.minOrderValue) || 0,
        maxDiscount: Number(promo.maxDiscount) || 9999,
        expiresAt: promo.expiresAt ? new Date(promo.expiresAt) : null,
        usageLimit: Number(promo.usageLimit) || 100,
        timesUsed: Number(promo.timesUsed) || 0,
        isActive: Boolean(promo.isActive),
      },
      create: {
        id: promo.id,
        code: promo.code,
        discountPercentage: Number(promo.discountPercentage) || 0,
        minOrderValue: Number(promo.minOrderValue) || 0,
        maxDiscount: Number(promo.maxDiscount) || 9999,
        expiresAt: promo.expiresAt ? new Date(promo.expiresAt) : null,
        usageLimit: Number(promo.usageLimit) || 100,
        timesUsed: Number(promo.timesUsed) || 0,
        isActive: Boolean(promo.isActive),
      },
    });
  }

  // 5. Prescriptions
  console.log('📋 Migrating prescriptions...');
  for (const rx of data.prescriptions || []) {
    await prisma.prescription.upsert({
      where: { id: rx.id },
      update: {
        customerId: userMap.has(rx.customerId) ? rx.customerId : null,
        customerName: rx.customerName,
        customerPhone: rx.customerPhone,
        customerAddress: rx.customerAddress || null,
        governorate: rx.governorate || null,
        district: rx.district || null,
        images: Array.isArray(rx.images) ? rx.images : (rx.imageUrl ? [rx.imageUrl] : []),
        imageUrl: rx.imageUrl || null,
        notes: rx.notes || null,
        patientNotes: rx.patientNotes || null,
        allowAlternatives: rx.allowAlternatives !== undefined ? Boolean(rx.allowAlternatives) : true,
        hasInsurance: Boolean(rx.hasInsurance),
        insuranceCompany: rx.insuranceCompany || null,
        insuranceCardNumber: rx.insuranceCardNumber || null,
        status: (rx.status as PrescriptionStatus) || PrescriptionStatus.PENDING,
        pharmacistNotes: rx.pharmacistNotes || null,
        reviewedBy: rx.reviewedBy || null,
        quotedItems: rx.quotedItems || null,
        totalQuote: rx.totalQuote ? Number(rx.totalQuote) : null,
        createdAt: rx.createdAt ? new Date(rx.createdAt) : new Date(),
        updatedAt: rx.updatedAt ? new Date(rx.updatedAt) : new Date(),
      },
      create: {
        id: rx.id,
        customerId: userMap.has(rx.customerId) ? rx.customerId : null,
        customerName: rx.customerName,
        customerPhone: rx.customerPhone,
        customerAddress: rx.customerAddress || null,
        governorate: rx.governorate || null,
        district: rx.district || null,
        images: Array.isArray(rx.images) ? rx.images : (rx.imageUrl ? [rx.imageUrl] : []),
        imageUrl: rx.imageUrl || null,
        notes: rx.notes || null,
        patientNotes: rx.patientNotes || null,
        allowAlternatives: rx.allowAlternatives !== undefined ? Boolean(rx.allowAlternatives) : true,
        hasInsurance: Boolean(rx.hasInsurance),
        insuranceCompany: rx.insuranceCompany || null,
        insuranceCardNumber: rx.insuranceCardNumber || null,
        status: (rx.status as PrescriptionStatus) || PrescriptionStatus.PENDING,
        pharmacistNotes: rx.pharmacistNotes || null,
        reviewedBy: rx.reviewedBy || null,
        quotedItems: rx.quotedItems || null,
        totalQuote: rx.totalQuote ? Number(rx.totalQuote) : null,
        createdAt: rx.createdAt ? new Date(rx.createdAt) : new Date(),
        updatedAt: rx.updatedAt ? new Date(rx.updatedAt) : new Date(),
      },
    });
  }

  // 6. Orders
  console.log('🛒 Migrating orders...');
  for (const o of data.orders || []) {
    await prisma.order.upsert({
      where: { id: o.id },
      update: {
        orderNumber: o.orderNumber,
        customerId: userMap.has(o.customerId) ? o.customerId : null,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        customerEmail: o.customerEmail || null,
        deliveryAddress: o.deliveryAddress,
        deliveryType: (o.deliveryType as DeliveryType) || DeliveryType.EXPRESS_45M,
        scheduledTime: o.scheduledTime || null,
        paymentMethod: (o.paymentMethod as PaymentMethod) || PaymentMethod.CASH_ON_DELIVERY,
        paymentStatus: (o.paymentStatus as PaymentStatus) || PaymentStatus.PENDING,
        subtotal: Number(o.subtotal) || 0,
        deliveryFee: Number(o.deliveryFee) || 0,
        discount: Number(o.discount) || 0,
        total: Number(o.total) || 0,
        promoCode: o.promoCode || null,
        prescriptionId: o.prescriptionId || null,
        notes: o.notes || null,
        status: (o.status as OrderStatus) || OrderStatus.PENDING,
        assignedCourierId: o.assignedCourierId || null,
        assignedCourierName: o.assignedCourierName || null,
        courierPhone: o.courierPhone || null,
        liveCoordinates: o.liveCoordinates || null,
        statusTimeline: o.statusTimeline || null,
        createdAt: o.createdAt ? new Date(o.createdAt) : new Date(),
        updatedAt: o.updatedAt ? new Date(o.updatedAt) : new Date(),
      },
      create: {
        id: o.id,
        orderNumber: o.orderNumber,
        customerId: userMap.has(o.customerId) ? o.customerId : null,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        customerEmail: o.customerEmail || null,
        deliveryAddress: o.deliveryAddress,
        deliveryType: (o.deliveryType as DeliveryType) || DeliveryType.EXPRESS_45M,
        scheduledTime: o.scheduledTime || null,
        paymentMethod: (o.paymentMethod as PaymentMethod) || PaymentMethod.CASH_ON_DELIVERY,
        paymentStatus: (o.paymentStatus as PaymentStatus) || PaymentStatus.PENDING,
        subtotal: Number(o.subtotal) || 0,
        deliveryFee: Number(o.deliveryFee) || 0,
        discount: Number(o.discount) || 0,
        total: Number(o.total) || 0,
        promoCode: o.promoCode || null,
        prescriptionId: o.prescriptionId || null,
        notes: o.notes || null,
        status: (o.status as OrderStatus) || OrderStatus.PENDING,
        assignedCourierId: o.assignedCourierId || null,
        assignedCourierName: o.assignedCourierName || null,
        courierPhone: o.courierPhone || null,
        liveCoordinates: o.liveCoordinates || null,
        statusTimeline: o.statusTimeline || null,
        createdAt: o.createdAt ? new Date(o.createdAt) : new Date(),
        updatedAt: o.updatedAt ? new Date(o.updatedAt) : new Date(),
      },
    });

    // Delete existing items and recreate
    await prisma.orderItem.deleteMany({ where: { orderId: o.id } });
    if (Array.isArray(o.items) && o.items.length > 0) {
      await prisma.orderItem.createMany({
        data: o.items.map((it: any) => ({
          orderId: o.id,
          productId: it.productId,
          nameAr: it.nameAr,
          nameEn: it.nameEn,
          price: Number(it.price) || 0,
          quantity: Number(it.quantity) || 1,
          image: it.image || '/images/default-medicine.png',
          isPrescriptionRequired: Boolean(it.isPrescriptionRequired),
        })),
      });
    }
  }

  // 7. Refills
  console.log('🔄 Migrating refill subscriptions...');
  for (const r of data.refills || []) {
    await prisma.refillSubscription.upsert({
      where: { id: r.id },
      update: {
        customerId: userMap.has(r.customerId) ? r.customerId : null,
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        medicationName: r.medicationName,
        dosageSchedule: r.dosageSchedule,
        monthlyQuantity: Number(r.monthlyQuantity) || 1,
        price: Number(r.price) || 0,
        deliveryAddress: r.deliveryAddress,
        governorate: r.governorate,
        renewalDay: Number(r.renewalDay) || 1,
        status: (r.status as RefillStatus) || RefillStatus.ACTIVE,
        nextRefillDate: r.nextRefillDate ? new Date(r.nextRefillDate) : null,
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
      },
      create: {
        id: r.id,
        customerId: userMap.has(r.customerId) ? r.customerId : null,
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        medicationName: r.medicationName,
        dosageSchedule: r.dosageSchedule,
        monthlyQuantity: Number(r.monthlyQuantity) || 1,
        price: Number(r.price) || 0,
        deliveryAddress: r.deliveryAddress,
        governorate: r.governorate,
        renewalDay: Number(r.renewalDay) || 1,
        status: (r.status as RefillStatus) || RefillStatus.ACTIVE,
        nextRefillDate: r.nextRefillDate ? new Date(r.nextRefillDate) : null,
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
      },
    });
  }

  // 8. Banners
  console.log('🖼️ Migrating hero banners...');
  for (const b of data.banners || []) {
    await prisma.heroBanner.upsert({
      where: { id: b.id },
      update: {
        title: b.title,
        subtitle: b.subtitle || null,
        tag: b.tag || null,
        bg: b.bg || null,
        accent: b.accent || null,
        ctaText: b.ctaText || null,
        actionType: b.actionType || 'link',
        actionValue: b.actionValue || null,
        img: b.img,
        order: Number(b.order) || 0,
        isActive: Boolean(b.isActive),
      },
      create: {
        id: b.id,
        title: b.title,
        subtitle: b.subtitle || null,
        tag: b.tag || null,
        bg: b.bg || null,
        accent: b.accent || null,
        ctaText: b.ctaText || null,
        actionType: b.actionType || 'link',
        actionValue: b.actionValue || null,
        img: b.img,
        order: Number(b.order) || 0,
        isActive: Boolean(b.isActive),
      },
    });
  }

  // 9. Articles
  console.log('📰 Migrating articles...');
  for (const a of data.articles || []) {
    await prisma.article.upsert({
      where: { id: a.id },
      update: {
        title: a.title,
        summary: a.summary || null,
        content: a.content,
        author: a.author,
        authorRole: a.authorRole || null,
        readTime: a.readTime || null,
        category: a.category,
        image: a.image,
        publishedAt: a.publishedAt ? new Date(a.publishedAt) : new Date(),
        isFeatured: Boolean(a.isFeatured),
      },
      create: {
        id: a.id,
        title: a.title,
        summary: a.summary || null,
        content: a.content,
        author: a.author,
        authorRole: a.authorRole || null,
        readTime: a.readTime || null,
        category: a.category,
        image: a.image,
        publishedAt: a.publishedAt ? new Date(a.publishedAt) : new Date(),
        isFeatured: Boolean(a.isFeatured),
      },
    });
  }

  // 10. Settings
  if (data.settings) {
    console.log('⚙️ Migrating platform settings...');
    await prisma.platformSettings.upsert({
      where: { id: 'default' },
      update: { data: data.settings },
      create: { id: 'default', data: data.settings },
    });
  }

  console.log('✅ Data migration completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
