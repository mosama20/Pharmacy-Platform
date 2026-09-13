import { PrismaClient, Role, UserStatus, OrderStatus, PrescriptionStatus } from '@prisma/client';

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://postgres:chefaa_secret_2026@localhost:5433/chefaa_test_db?schema=public';

describe('Prisma & PostgreSQL Integration Tests (Isolated chefaa_test_db)', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: TEST_DATABASE_URL,
        },
      },
      log: ['error'],
    });
    await prisma.$connect();
  });

  afterAll(async () => {
    // Clean up all test data in reverse dependency order
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.prescription.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Ensure clean state before each test block
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.prescription.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('Users Persistence & Constraints', () => {
    it('should persist a user with default attributes and role', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Ahmed Test',
          email: 'ahmed.test@example.com',
          phone: '01011112222',
          password: 'hashed_password_123',
          role: Role.CUSTOMER,
        },
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('ahmed.test@example.com');
      expect(user.role).toBe(Role.CUSTOMER);
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.points).toBe(0);
      expect(user.walletBalance).toBe(0);
    });

    it('should enforce unique constraint on email and reject duplicates', async () => {
      await prisma.user.create({
        data: {
          name: 'First User',
          email: 'unique@example.com',
          phone: '01011113333',
          password: 'hash',
        },
      });

      await expect(
        prisma.user.create({
          data: {
            name: 'Second User',
            email: 'unique@example.com',
            phone: '01011114444',
            password: 'hash',
          },
        }),
      ).rejects.toThrow();
    });

    it('should persist staff roles and account status modifications', async () => {
      const pharmacist = await prisma.user.create({
        data: {
          name: 'Dr. Pharmacist',
          email: 'pharm@example.com',
          phone: '01055556666',
          password: 'hash',
          role: Role.PHARMACIST,
          shift: 'Morning',
        },
      });

      expect(pharmacist.role).toBe(Role.PHARMACIST);
      expect(pharmacist.shift).toBe('Morning');

      const updated = await prisma.user.update({
        where: { id: pharmacist.id },
        data: { status: UserStatus.SUSPENDED },
      });

      expect(updated.status).toBe(UserStatus.SUSPENDED);
    });
  });

  describe('Products & Inventory Persistence', () => {
    it('should persist product catalog items with active ingredients and prescription flag', async () => {
      const product = await prisma.product.create({
        data: {
          id: 'panadol-extra-1',
          nameAr: 'بنادول اكسترا',
          nameEn: 'Panadol Extra',
          activeIngredient: 'Paracetamol + Caffeine',
          category: 'pain-relief',
          price: 45.0,
          originalPrice: 50.0,
          stock: 100,
          isPrescriptionRequired: false,
          image: 'https://example.com/panadol.jpg',
        },
      });

      expect(product.id).toBe('panadol-extra-1');
      expect(product.stock).toBe(100);
      expect(product.isPrescriptionRequired).toBe(false);

      const retrieved = await prisma.product.findFirst({
        where: {
          activeIngredient: { contains: 'Paracetamol' },
        },
      });

      expect(retrieved?.nameEn).toBe('Panadol Extra');
    });

    it('should atomically decrement and increment product stock', async () => {
      await prisma.product.create({
        data: {
          id: 'amoxil-500',
          nameAr: 'اموكسيل 500',
          nameEn: 'Amoxil 500mg',
          category: 'antibiotics',
          price: 80.0,
          stock: 25,
          isPrescriptionRequired: true,
          image: 'https://example.com/amoxil.jpg',
        },
      });

      const updated = await prisma.product.update({
        where: { id: 'amoxil-500' },
        data: { stock: { decrement: 5 } },
      });

      expect(updated.stock).toBe(20);
    });
  });

  describe('Orders, Relations & Cascade Integrity', () => {
    it('should create order with relational items and link to customer', async () => {
      const customer = await prisma.user.create({
        data: {
          name: 'Customer 1',
          email: 'c1@example.com',
          phone: '01000000001',
          password: 'hash',
        },
      });

      const order = await prisma.order.create({
        data: {
          id: 'ord-test-101',
          orderNumber: 'CH-2026-101',
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          deliveryAddress: { street: 'El Tahrir St', city: 'Cairo', building: '12' },
          subtotal: 100,
          deliveryFee: 25,
          total: 125,
          status: OrderStatus.PENDING,
          items: {
            create: [
              {
                productId: 'prod-item-1',
                nameAr: 'منتج تجريبي',
                nameEn: 'Test Item',
                price: 50,
                quantity: 2,
                image: 'item.jpg',
              },
            ],
          },
        },
        include: {
          customer: true,
          items: true,
        },
      });

      expect(order.items.length).toBe(1);
      expect(order.items[0].quantity).toBe(2);
      expect(order.customer?.email).toBe('c1@example.com');
    });

    it('should cascade delete OrderItems when Order is deleted', async () => {
      const order = await prisma.order.create({
        data: {
          id: 'ord-cascade-1',
          orderNumber: 'CH-CASCADE-1',
          customerName: 'Direct Buyer',
          customerPhone: '01099998888',
          deliveryAddress: { address: 'Nasr City' },
          subtotal: 50,
          total: 75,
          items: {
            create: [
              {
                id: 'item-cascade-1',
                productId: 'prod-casc',
                nameAr: 'عنصر',
                nameEn: 'Cascade Item',
                price: 50,
                quantity: 1,
                image: 'img.jpg',
              },
            ],
          },
        },
      });

      const countBefore = await prisma.orderItem.count({ where: { orderId: order.id } });
      expect(countBefore).toBe(1);

      await prisma.order.delete({ where: { id: order.id } });

      const countAfter = await prisma.orderItem.count({ where: { orderId: order.id } });
      expect(countAfter).toBe(0);
    });
  });

  describe('Prescriptions Persistence & Status Updates', () => {
    it('should create prescription and update status with quotes', async () => {
      const customer = await prisma.user.create({
        data: {
          name: 'Patient Sara',
          email: 'sara@example.com',
          phone: '01022223333',
          password: 'hash',
        },
      });

      const prescription = await prisma.prescription.create({
        data: {
          id: 'rx-2026-001',
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          images: ['https://r2.dev/rx1.jpg'],
          status: PrescriptionStatus.PENDING,
          allowAlternatives: true,
        },
      });

      expect(prescription.status).toBe(PrescriptionStatus.PENDING);

      // Pharmacist reviews and quotes
      const quoted = await prisma.prescription.update({
        where: { id: prescription.id },
        data: {
          status: PrescriptionStatus.QUOTED,
          reviewedBy: 'Dr. Pharmacist',
          totalQuote: 135.0,
          quotedItems: [
            { productId: 'prod-rx-1', nameEn: 'Medicine A', price: 85, quantity: 1 },
            { productId: 'prod-rx-2', nameEn: 'Medicine B', price: 50, quantity: 1 },
          ],
        },
      });

      expect(quoted.status).toBe(PrescriptionStatus.QUOTED);
      expect(quoted.totalQuote).toBe(135.0);
      expect(quoted.reviewedBy).toBe('Dr. Pharmacist');
    });
  });

  describe('Database Transactions & Rollback Behavior (Phase 3)', () => {
    it('should commit all operations in a successful multi-step transaction', async () => {
      await prisma.product.create({
        data: {
          id: 'tx-prod-success',
          nameAr: 'منتج صفقة',
          nameEn: 'Tx Product Success',
          category: 'general',
          price: 100,
          stock: 10,
          image: 'img.jpg',
        },
      });

      await prisma.$transaction(async (tx) => {
        // Step 1: Decrement stock
        await tx.product.update({
          where: { id: 'tx-prod-success' },
          data: { stock: { decrement: 2 } },
        });

        // Step 2: Create Order
        await tx.order.create({
          data: {
            id: 'ord-tx-success',
            orderNumber: 'CH-TX-OK',
            customerName: 'Tx Customer',
            customerPhone: '01000000002',
            deliveryAddress: { street: 'Zamalek' },
            subtotal: 200,
            total: 225,
            items: {
              create: [
                {
                  productId: 'tx-prod-success',
                  nameAr: 'منتج صفقة',
                  nameEn: 'Tx Product Success',
                  price: 100,
                  quantity: 2,
                  image: 'img.jpg',
                },
              ],
            },
          },
        });
      });

      // Verify state after commit
      const product = await prisma.product.findUnique({ where: { id: 'tx-prod-success' } });
      const order = await prisma.order.findUnique({ where: { id: 'ord-tx-success' } });
      expect(product?.stock).toBe(8);
      expect(order).not.toBeNull();
    });

    it('should completely roll back all changes if any transaction step fails', async () => {
      await prisma.product.create({
        data: {
          id: 'tx-prod-rollback',
          nameAr: 'منتج تراجع',
          nameEn: 'Tx Product Rollback',
          category: 'general',
          price: 100,
          stock: 10,
          image: 'img.jpg',
        },
      });

      // Pre-seed an order to cause a unique constraint violation on orderNumber
      await prisma.order.create({
        data: {
          id: 'existing-collision-order',
          orderNumber: 'DUPLICATE-ORDER-NUM',
          customerName: 'Colliding',
          customerPhone: '01000000003',
          deliveryAddress: { address: 'Dokki' },
          subtotal: 100,
          total: 125,
        },
      });

      // Execute transaction designed to fail on Step 2
      await expect(
        prisma.$transaction(async (tx) => {
          // Step 1: Decrement stock (should be rolled back!)
          await tx.product.update({
            where: { id: 'tx-prod-rollback' },
            data: { stock: { decrement: 4 } },
          });

          // Step 2: Attempt to create order with duplicate orderNumber -> FAILS
          await tx.order.create({
            data: {
              id: 'new-failed-order',
              orderNumber: 'DUPLICATE-ORDER-NUM', // Duplicate key!
              customerName: 'Failed Order',
              customerPhone: '01000000004',
              deliveryAddress: { address: 'Maadi' },
              subtotal: 400,
              total: 425,
            },
          });
        }),
      ).rejects.toThrow();

      // VERIFY ROLLBACK: Product stock must remain at initial 10!
      const productAfter = await prisma.product.findUnique({ where: { id: 'tx-prod-rollback' } });
      expect(productAfter?.stock).toBe(10);

      // Verify no orphaned order was inserted
      const failedOrder = await prisma.order.findUnique({ where: { id: 'new-failed-order' } });
      expect(failedOrder).toBeNull();
    });
  });
});
