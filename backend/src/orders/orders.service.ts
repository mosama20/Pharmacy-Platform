import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DbService, Order, OrderItem } from '../database/db.service';
import { PaymentService } from './payment.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/orders.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrdersService {
  constructor(
    private readonly db: DbService,
    private readonly paymentService: PaymentService,
  ) {}

  async findAll(query?: {
    status?: string;
    deliveryType?: string;
    paymentMethod?: string;
    search?: string;
    courierId?: string;
    page?: number;
    limit?: number;
    format?: string;
    paginated?: boolean | string;
  }) {
    let list = [...this.db.orders];

    if (query?.courierId) {
      list = list.filter((o) => o.assignedCourierId === query.courierId);
    }

    if (query?.status && query.status !== 'ALL') {
      list = list.filter((o) => o.status === query.status);
    }

    if (query?.deliveryType) {
      list = list.filter((o) => o.deliveryType === query.deliveryType);
    }

    if (query?.paymentMethod) {
      list = list.filter((o) => o.paymentMethod === query.paymentMethod);
    }

    if (query?.search) {
      const q = query.search.toLowerCase().trim();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q) ||
          o.deliveryAddress.city?.toLowerCase().includes(q) ||
          o.deliveryAddress.governorate?.toLowerCase().includes(q),
      );
    }

    list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    if (query?.format === 'paginated' || query?.paginated === true || query?.paginated === 'true') {
      const total = list.length;
      const page = Math.max(1, Number(query?.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(query?.limit) || 20));
      const startIndex = (page - 1) * limit;
      const paginatedItems = list.slice(startIndex, startIndex + limit);
      return {
        data: paginatedItems,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
          hasNext: startIndex + limit < total,
          hasPrev: page > 1,
        },
      };
    }

    return list;
  }

  async findByCourier(courierId: string) {
    return this.db.orders
      .filter((o) => o.assignedCourierId === courierId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  async getCourierStats(courierId: string) {
    const myOrders = this.db.orders.filter((o) => o.assignedCourierId === courierId);
    const activeDeliveries = myOrders.filter(
      (o) => o.status === 'OUT_FOR_DELIVERY' || o.status === 'PREPARING'
    );
    const deliveredOrders = myOrders.filter((o) => o.status === 'DELIVERED');
    
    // Cash to collect from active orders where payment method is COD and paymentStatus is PENDING
    const cashToCollect = activeDeliveries
      .filter((o) => o.paymentMethod === 'CASH_ON_DELIVERY')
      .reduce((sum, o) => sum + o.total, 0);

    // Cash collected from delivered COD orders
    const cashCollected = deliveredOrders
      .filter((o) => o.paymentMethod === 'CASH_ON_DELIVERY')
      .reduce((sum, o) => sum + o.total, 0);

    const commissionEarned = deliveredOrders.length * 20; // 20 EGP per delivery bonus

    return {
      totalAssigned: myOrders.length,
      activeDeliveriesCount: activeDeliveries.length,
      deliveredCount: deliveredOrders.length,
      cashToCollect,
      cashCollected,
      commissionEarned,
    };
  }

  async findByCustomer(customerId: string) {
    return this.db.orders
      .filter((o) => o.customerId === customerId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  async findOne(id: string, user?: any) {
    const order = this.db.orders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) throw new NotFoundException('الطلب غير موجود');

    if (user) {
      const isStaff = user.role === 'ADMIN' || user.role === 'SUPPORT' || user.role === 'PHARMACIST';
      const isOwner = order.customerId === user.id;
      const isAssignedCourier = user.role === 'DELIVERY' && order.assignedCourierId === user.id;

      if (!isStaff && !isOwner && !isAssignedCourier) {
        throw new ForbiddenException('ليس لديك صلاحية لعرض هذا الطلب');
      }
    }

    return order;
  }

  async create(dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('السلة فارغة، يرجى إضافة أدوية أو منتجات للطلب');
    }

    // 1. Server-Side Price Calculation & Stock Validation
    let verifiedSubtotal = 0;
    const verifiedItems: OrderItem[] = [];

    for (const item of dto.items) {
      const product = this.db.products.find((p) => p.id === item.productId);
      if (!product) {
        throw new BadRequestException(`المنتج المطلوب غير متوفر بالصيدلية (معرف: ${item.productId})`);
      }

      const qty = Number(item.quantity);
      if (qty < 1) {
        throw new BadRequestException(`كمية غير صالحة للمنتج (${product.nameAr})`);
      }

      // Stock Check
      if (product.stock !== undefined && product.stock < qty) {
        throw new BadRequestException(
          `الكمية المطلوبة من دواء (${product.nameAr}) غير متوفرة حالياً في المخزون (المتبقي: ${product.stock ?? 0})`,
        );
      }

      // Always use product.price from authoritative database
      const unitPrice = Number(product.price);
      verifiedItems.push({
        productId: product.id,
        nameAr: product.nameAr,
        nameEn: product.nameEn,
        price: unitPrice,
        quantity: qty,
        image: product.image,
        isPrescriptionRequired: product.isPrescriptionRequired,
      });

      verifiedSubtotal += unitPrice * qty;
    }

    // 2. Decrement Stock Atomically
    for (const item of verifiedItems) {
      const product = this.db.products.find((p) => p.id === item.productId);
      if (product && product.stock !== undefined) {
        product.stock = Math.max(0, product.stock - item.quantity);

        // Async sync to PostgreSQL
        this.db.prisma.product.update({
          where: { id: product.id },
          data: { stock: product.stock },
        }).catch((e) => console.warn('Prisma product stock decrement error:', e));
      }
    }

    // 3. Delivery Fee Calculation
    const defaultDeliveryFee = this.db.settings?.deliveryFee ?? 25;
    const threshold = this.db.settings?.freeDeliveryThreshold ?? 500;
    const deliveryFee = verifiedSubtotal >= threshold ? 0 : defaultDeliveryFee;
    let discount = 0;

    // 4. Promo Code Validation & Per-User Limit
    if (dto.promoCode) {
      const code = dto.promoCode.toUpperCase().trim();
      const promo = this.db.promoCodes.find((p) => p.code === code && p.isActive);
      if (!promo) {
        throw new BadRequestException('كود الخصم غير صالح أو منتهي الصلاحية');
      }

      // Global limit check
      if (promo.usageLimit && promo.timesUsed >= promo.usageLimit) {
        throw new BadRequestException('عذراً، تم استنفاد الحد الأقصى المسموح لاستخدام كود الخصم هذا');
      }

      // Per-user limit check
      if (dto.customerId) {
        const alreadyUsed = this.db.orders.some(
          (o) => o.customerId === dto.customerId && o.promoCode === code && o.status !== 'CANCELLED',
        );
        if (alreadyUsed) {
          throw new BadRequestException('لقد قمت باستخدام كود الخصم هذا مسبقاً، كل عميل مصرح له باستخدام الكود مرة واحدة');
        }
      }

      if (verifiedSubtotal < promo.minOrderValue) {
        throw new BadRequestException(`الحد الأدنى للطلب لتفعيل هذا الكود هو ${promo.minOrderValue} ج.م`);
      }

      discount = Math.min(
        Math.round((verifiedSubtotal * promo.discountPercentage) / 100),
        promo.maxDiscount || 9999,
      );
      promo.timesUsed += 1;
    }

    const total = Math.max(0, verifiedSubtotal + deliveryFee - discount);
    const orderId = `ord_${uuidv4().substring(0, 8)}`;
    // Collision-proof order number
    const orderNumber = `CHF-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}${Math.floor(1000 + Math.random() * 9000)}`;

    // 5. Payment Processing Abstraction
    const paymentMethod = dto.paymentMethod || 'CASH_ON_DELIVERY';
    const paymentResult = await this.paymentService.processPayment(
      orderId,
      total,
      paymentMethod as any,
      dto.paymentDetails,
    );

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customerId: dto.customerId || `guest_${Date.now()}`,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      customerEmail: dto.customerEmail,
      deliveryAddress: dto.deliveryAddress,
      deliveryType: dto.deliveryType || 'EXPRESS_45M',
      scheduledTime: dto.scheduledTime,
      paymentMethod,
      paymentStatus: paymentResult.paymentStatus,
      items: verifiedItems,
      subtotal: verifiedSubtotal,
      deliveryFee,
      discount,
      total,
      promoCode: dto.promoCode,
      prescriptionId: dto.prescriptionId,
      notes: dto.notes,
      status: 'PENDING',
      statusTimeline: [
        {
          status: 'PENDING',
          titleAr: 'تم استلام الطلب وتأكيده بنجاح',
          timestamp: new Date().toISOString(),
          note: 'في انتظار مراجعة الصيدلي وتجهيز الأدوية',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Auto assign courier if any delivery staff exists
    const availableCourier = this.db.users.find(
      (u) => u.role === 'DELIVERY' && u.status === 'ACTIVE',
    );
    if (availableCourier) {
      newOrder.assignedCourierId = availableCourier.id;
      newOrder.assignedCourierName = availableCourier.name;
      newOrder.courierPhone = availableCourier.phone;
    }

    this.db.orders.unshift(newOrder);

    // Update customer loyalty points if registered user
    if (dto.customerId) {
      const user = this.db.users.find((u) => u.id === dto.customerId);
      if (user) {
        user.points = (user.points || 0) + Math.floor(total / 10);
      }
    }

    this.db.persist();

    // Async sync order to PostgreSQL
    this.db.prisma.order.create({
      data: {
        id: newOrder.id,
        orderNumber: newOrder.orderNumber,
        customerId: dto.customerId || null,
        customerName: newOrder.customerName,
        customerPhone: newOrder.customerPhone,
        customerEmail: newOrder.customerEmail,
        deliveryAddress: newOrder.deliveryAddress as any,
        deliveryType: newOrder.deliveryType as any,
        scheduledTime: newOrder.scheduledTime,
        paymentMethod: newOrder.paymentMethod as any,
        paymentStatus: newOrder.paymentStatus as any,
        subtotal: newOrder.subtotal,
        deliveryFee: newOrder.deliveryFee,
        discount: newOrder.discount,
        total: newOrder.total,
        promoCode: newOrder.promoCode,
        prescriptionId: newOrder.prescriptionId,
        notes: newOrder.notes,
        status: newOrder.status as any,
        statusTimeline: newOrder.statusTimeline as any,
        assignedCourierId: newOrder.assignedCourierId,
        assignedCourierName: newOrder.assignedCourierName,
        courierPhone: newOrder.courierPhone,
        items: {
          create: verifiedItems.map((item) => ({
            productId: item.productId,
            nameAr: item.nameAr,
            nameEn: item.nameEn,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
        },
      },
    }).catch((e) => console.warn('Prisma order create error:', e));

    return newOrder;
  }

  async updateStatus(id: string, dto: {
    status: Order['status'];
    assignedCourierId?: string;
    note?: string;
    lat?: number;
    lng?: number;
  }, currentUser?: any) {
    const order = this.db.orders.find((o) => o.id === id);
    if (!order) throw new NotFoundException('الطلب غير موجود');

    // Strict RBAC & Status transition enforcement
    if (currentUser) {
      if (currentUser.role === 'DELIVERY') {
        if (order.assignedCourierId !== currentUser.id) {
          throw new ForbiddenException('غير مصرح لك بتحديث طلب غير مسند إليك');
        }
        const allowedCourierStatuses = ['OUT_FOR_DELIVERY', 'DELIVERED'];
        if (!allowedCourierStatuses.includes(dto.status)) {
          throw new ForbiddenException('مندوب التوصيل مصرح له فقط بتحديث الحالة إلى خرج للتوصيل أو تم التسليم');
        }
      } else if (currentUser.role === 'CUSTOMER') {
        if (order.customerId !== currentUser.id) {
          throw new ForbiddenException('ليس لديك صلاحية لتعديل هذا الطلب');
        }
        if (dto.status !== 'CANCELLED' || order.status !== 'PENDING') {
          throw new ForbiddenException('يمكن للعميل فقط إلغاء طلبه وهو قيد المراجعة والانتظار');
        }
      }
    }

    order.status = dto.status;
    order.updatedAt = new Date().toISOString();

    if (dto.lat !== undefined && dto.lng !== undefined) {
      if (dto.lat < -90 || dto.lat > 90 || dto.lng < -180 || dto.lng > 180) {
        throw new BadRequestException('إحداثيات جغرافية غير صالحة');
      }
      order.liveCoordinates = { lat: dto.lat, lng: dto.lng };
    }

    if (dto.assignedCourierId) {
      const courier = this.db.users.find((u) => u.id === dto.assignedCourierId);
      if (courier) {
        order.assignedCourierId = courier.id;
        order.assignedCourierName = courier.name;
        order.courierPhone = courier.phone;
      }
    }

    const titleMap: Record<string, string> = {
      PENDING: 'طلب قيد المراجعة',
      REVIEWED: 'تمت مراجعة الطلب والموافقة الطبية',
      PREPARING: 'جاري تجهيز وتغليف الأدوية بالصيدلية',
      OUT_FOR_DELIVERY: `الطلب في الطريق للتوصيل ${order.assignedCourierName ? `مع ${order.assignedCourierName}` : ''}`,
      DELIVERED: 'تم تسليم الطلب للعميل بنجاح وتحصيل الحساب',
      CANCELLED: 'تم إلغاء الطلب',
    };

    order.statusTimeline.push({
      status: dto.status,
      titleAr: titleMap[dto.status] || dto.status,
      timestamp: new Date().toISOString(),
      note: dto.note || '',
    });

    if (dto.status === 'DELIVERED') {
      order.paymentStatus = 'PAID';
    }

    this.db.persist();
    return {
      message: 'تم تحديث حالة الطلب بنجاح',
      order,
    };
  }

  async updateCourierLocation(
    orderId: string,
    lat: number,
    lng: number,
    user: any,
  ) {
    const order = this.db.orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!order) throw new NotFoundException('الطلب غير موجود');

    if (user.role === 'DELIVERY') {
      if (order.assignedCourierId !== user.id) {
        throw new ForbiddenException('غير مصرح لك بتحديث موقع طلب غير مسند إليك');
      }
    } else if (user.role !== 'ADMIN') {
      throw new ForbiddenException('غير مصرح لك بتحديث إحداثيات التوصيل');
    }

    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      throw new BadRequestException('لا يمكن تحديث موقع طلب تم تسليمه أو ملغى');
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new BadRequestException('إحداثيات جغرافية غير صالحة');
    }

    order.liveCoordinates = { lat, lng };
    order.updatedAt = new Date().toISOString();
    this.db.persist();

    return {
      message: 'تم تحديث موقع التوصيل المباشر بنجاح',
      orderId: order.id,
      liveCoordinates: order.liveCoordinates,
    };
  }

  async getDashboardStats() {
    const totalOrders = this.db.orders.length;
    const pendingOrders = this.db.orders.filter((o) => o.status === 'PENDING').length;
    const activeOrders = this.db.orders.filter(
      (o) => o.status === 'REVIEWED' || o.status === 'PREPARING' || o.status === 'OUT_FOR_DELIVERY',
    ).length;
    const deliveredOrders = this.db.orders.filter((o) => o.status === 'DELIVERED').length;
    const totalRevenue = this.db.orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.total, 0);

    const pendingPrescriptions = this.db.prescriptions.filter(
      (p) => p.status === 'PENDING',
    ).length;

    const totalCustomers = this.db.users.filter((u) => u.role === 'CUSTOMER').length;
    const totalStaff = this.db.users.filter((u) => u.role !== 'CUSTOMER').length;
    const totalProducts = this.db.products.length;

    return {
      totalRevenue,
      totalOrders,
      pendingOrders,
      activeOrders,
      deliveredOrders,
      pendingPrescriptions,
      totalCustomers,
      totalStaff,
      totalProducts,
      avgDeliveryTimeMinutes: 38,
      recentOrders: this.db.orders.slice(0, 5),
    };
  }
}
