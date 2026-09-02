import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DbService, Order, OrderItem } from '../database/db.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrdersService {
  constructor(private readonly db: DbService) {}

  async findAll(query?: {
    status?: string;
    deliveryType?: string;
    paymentMethod?: string;
    search?: string;
    courierId?: string;
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

    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
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

  async findOne(id: string) {
    const order = this.db.orders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) throw new NotFoundException('الطلب غير موجود');
    return order;
  }

  async create(dto: {
    customerId?: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    deliveryAddress: {
      governorate: string;
      city: string;
      street: string;
      building?: string;
      floor?: string;
      apartment?: string;
      landmark?: string;
    };
    deliveryType?: 'EXPRESS_45M' | 'SCHEDULED' | 'MONTHLY_REFILL';
    scheduledTime?: string;
    paymentMethod?: 'CASH_ON_DELIVERY' | 'CREDIT_CARD' | 'FAWRY' | 'VODAFONE_CASH' | 'VALU';
    items: OrderItem[];
    promoCode?: string;
    notes?: string;
    prescriptionId?: string;
  }) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('السلة فارغة، يرجى إضافة أدوية أو منتجات للطلب');
    }

    const subtotal = dto.items.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0,
    );

    // Default settings
    const defaultDeliveryFee = this.db.settings?.deliveryFee ?? 25;
    const threshold = this.db.settings?.freeDeliveryThreshold ?? 500;
    let deliveryFee = subtotal >= threshold ? 0 : defaultDeliveryFee;
    let discount = 0;

    if (dto.promoCode) {
      const code = dto.promoCode.toUpperCase().trim();
      const promo = this.db.promoCodes.find((p) => p.code === code && p.isActive);
      if (promo && subtotal >= promo.minOrderValue) {
        discount = Math.min(
          Math.round((subtotal * promo.discountPercentage) / 100),
          promo.maxDiscount || 9999
        );
        promo.timesUsed += 1;
      }
    }

    const total = Math.max(0, subtotal + deliveryFee - discount);
    const orderId = `ord_${Date.now()}`;
    const orderNumber = `CHF-2026-${Math.floor(1000 + Math.random() * 9000)}`;

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
      paymentMethod: dto.paymentMethod || 'CASH_ON_DELIVERY',
      paymentStatus: dto.paymentMethod === 'CASH_ON_DELIVERY' ? 'PENDING' : 'PAID',
      items: dto.items,
      subtotal,
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

    // Auto assign courier if any delivery guy exists in the area
    const availableCourier = this.db.users.find(
      (u) => u.role === 'DELIVERY' && u.status === 'ACTIVE'
    );
    if (availableCourier) {
      newOrder.assignedCourierId = availableCourier.id;
      newOrder.assignedCourierName = availableCourier.name;
      newOrder.courierPhone = availableCourier.phone;
    }

    this.db.orders.unshift(newOrder);

    // Update customer points if registered user
    if (dto.customerId) {
      const user = this.db.users.find((u) => u.id === dto.customerId);
      if (user) {
        user.points = (user.points || 0) + Math.floor(total / 10);
      }
    }

    this.db.persist();
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

    // Courier safety check
    if (currentUser?.role === 'DELIVERY' && order.assignedCourierId && order.assignedCourierId !== currentUser.id) {
      throw new BadRequestException('غير مصرح لك بتحديث طلب غير مسند إليك');
    }

    order.status = dto.status;
    order.updatedAt = new Date().toISOString();

    if (dto.lat && dto.lng) {
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
