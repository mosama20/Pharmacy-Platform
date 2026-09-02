import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService, Order } from '../database/db.service';

export interface LiveTrackingData {
  orderId: string;
  orderNumber: string;
  status: Order['status'];
  pharmacyLocation: {
    lat: number;
    lng: number;
    nameAr: string;
    branchPhone: string;
  };
  customerLocation: {
    lat: number;
    lng: number;
    address: string;
    governorate: string;
    district: string;
  };
  courierLocation: {
    lat: number;
    lng: number;
    speedKmH: number;
    headingDeg: number;
    updatedAt: string;
  };
  courierInfo: {
    id: string;
    name: string;
    phone: string;
    vehicleType: string;
    rating: number;
    tripsCount: number;
    avatar: string;
  };
  routeWaypoints: Array<{ lat: number; lng: number }>;
  distanceRemainingKm: number;
  etaMinutes: number;
  liveStatusText: string;
}

const GOVERNORATE_COORDINATES: Record<string, { lat: number; lng: number; branchCity: string }> = {
  'القاهرة': { lat: 30.0444, lng: 31.2357, branchCity: 'فرع القاهرة الرئيسي (المعادي)' },
  'الجيزة': { lat: 30.0131, lng: 31.2089, branchCity: 'فرع المهندسين والدقي' },
  'الإسكندرية': { lat: 31.2001, lng: 29.9187, branchCity: 'فرع سموحة وسيدي جابر' },
  'الدقهلية': { lat: 31.0409, lng: 31.3785, branchCity: 'فرع المنصورة المشاية' },
  'الغربية': { lat: 30.7865, lng: 31.0004, branchCity: 'فرع طنطا شارع النحاس' },
  'الشرقية': { lat: 30.5877, lng: 31.5020, branchCity: 'فرع الزقازيق القومية' },
  'القليوبية': { lat: 30.4660, lng: 31.1853, branchCity: 'فرع بنها وشبرا' },
  'البحيرة': { lat: 31.0364, lng: 30.4689, branchCity: 'فرع دمنهور' },
  'كفر الشيخ': { lat: 31.1107, lng: 30.9388, branchCity: 'فرع كفر الشيخ' },
  'المنوفية': { lat: 30.5599, lng: 31.0119, branchCity: 'فرع شبين الكوم' },
  'دمياط': { lat: 31.4175, lng: 31.8144, branchCity: 'فرع دمياط ورأس البر' },
  'بورسعيد': { lat: 31.2653, lng: 32.3019, branchCity: 'فرع بورسعيد' },
  'الإسماعيلية': { lat: 30.5965, lng: 32.2715, branchCity: 'فرع الإسماعيلية' },
  'السويس': { lat: 29.9668, lng: 32.5498, branchCity: 'فرع السويس' },
  'الفيوم': { lat: 29.3084, lng: 30.8428, branchCity: 'فرع الفيوم' },
  'بني سويف': { lat: 29.0661, lng: 31.0994, branchCity: 'فرع بني سويف' },
  'المنيا': { lat: 28.0871, lng: 30.7618, branchCity: 'فرع المنيا الكورنيش' },
  'أسيوط': { lat: 27.1783, lng: 31.1859, branchCity: 'فرع أسيوط الجمهورية' },
  'سوهاج': { lat: 26.5590, lng: 31.6957, branchCity: 'فرع سوهاج' },
  'قنا': { lat: 26.1551, lng: 32.7160, branchCity: 'فرع قنا' },
  'الأقصر': { lat: 25.6872, lng: 32.6396, branchCity: 'فرع الأقصر' },
  'أسوان': { lat: 24.0889, lng: 32.8998, branchCity: 'فرع أسوان' },
  'البحر الأحمر': { lat: 27.2579, lng: 33.8116, branchCity: 'فرع الغردقة' },
  'مطروح': { lat: 31.3543, lng: 27.2373, branchCity: 'فرع مرسى مطروح' },
  'جنوب سيناء': { lat: 27.9158, lng: 34.3299, branchCity: 'فرع شرم الشيخ' },
  'شمال سيناء': { lat: 31.1316, lng: 33.8033, branchCity: 'فرع العريش' },
  'الوادي الجديد': { lat: 25.4514, lng: 30.5471, branchCity: 'فرع الخارجة' },
};

@Injectable()
export class TrackingService {
  constructor(private readonly db: DbService) {}

  getLiveTracking(orderId: string): LiveTrackingData {
    const order = this.db.orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!order) {
      throw new NotFoundException('الطلب غير موجود');
    }

    const gov = order.deliveryAddress?.governorate || 'القاهرة';
    const city = order.deliveryAddress?.city || 'المعادي';
    const baseCoords = GOVERNORATE_COORDINATES[gov] || GOVERNORATE_COORDINATES['القاهرة'];

    const storeName = this.db.settings?.websiteName || 'الصيدلية';
    const hotline = this.db.settings?.hotline || '19876';

    // Local Pharmacy Branch for this Governorate
    const pharmacyLocation = {
      lat: baseCoords.lat + 0.015,
      lng: baseCoords.lng - 0.012,
      nameAr: `${storeName} - ${baseCoords.branchCity}`,
      branchPhone: hotline,
    };

    // Destination coordinates for the customer
    let destLat = order.liveCoordinates?.lat || baseCoords.lat - 0.018;
    let destLng = order.liveCoordinates?.lng || baseCoords.lng + 0.022;

    const customerLocation = {
      lat: destLat,
      lng: destLng,
      address: `${order.deliveryAddress?.street || 'شارع رئيسي'}، ${city}، ${gov}`,
      governorate: gov,
      district: city,
    };

    // Calculate dynamic progression
    let progressRatio = 0.05;
    if (order.status === 'REVIEWED') progressRatio = 0.15;
    if (order.status === 'PREPARING') progressRatio = 0.3;
    if (order.status === 'OUT_FOR_DELIVERY') {
      const secondsSinceUpdate = Math.floor((Date.now() - new Date(order.updatedAt || order.createdAt).getTime()) / 1000);
      progressRatio = Math.min(0.95, 0.35 + (secondsSinceUpdate % 90) * 0.007);
    }
    if (order.status === 'DELIVERED') progressRatio = 1.0;

    // Courier position interpolated along direct route
    const currentLat = pharmacyLocation.lat + (destLat - pharmacyLocation.lat) * progressRatio;
    const currentLng = pharmacyLocation.lng + (destLng - pharmacyLocation.lng) * progressRatio;

    // Calculate heading angle
    const dLng = destLng - pharmacyLocation.lng;
    const dLat = destLat - pharmacyLocation.lat;
    const headingDeg = Math.round((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;

    // Haversine remaining distance calculation
    const R = 6371; // Earth radius in km
    const dLatRad = ((destLat - currentLat) * Math.PI) / 180;
    const dLngRad = ((destLng - currentLng) * Math.PI) / 180;
    const a =
      Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) +
      Math.cos((currentLat * Math.PI) / 180) *
        Math.cos((destLat * Math.PI) / 180) *
        Math.sin(dLngRad / 2) *
        Math.sin(dLngRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceRemainingKm = Number((R * c).toFixed(1));

    const etaMinutes = order.status === 'DELIVERED' ? 0 : Math.max(2, Math.round(distanceRemainingKm * 2.5) + (order.status === 'PREPARING' ? 10 : 0));

    // Dynamic Waypoints for Interactive Map
    const routeWaypoints = [
      { lat: pharmacyLocation.lat, lng: pharmacyLocation.lng },
      {
        lat: pharmacyLocation.lat + (destLat - pharmacyLocation.lat) * 0.25 + 0.002,
        lng: pharmacyLocation.lng + (destLng - pharmacyLocation.lng) * 0.25 - 0.003,
      },
      {
        lat: pharmacyLocation.lat + (destLat - pharmacyLocation.lat) * 0.5 - 0.002,
        lng: pharmacyLocation.lng + (destLng - pharmacyLocation.lng) * 0.5 + 0.003,
      },
      { lat: currentLat, lng: currentLng },
      {
        lat: pharmacyLocation.lat + (destLat - pharmacyLocation.lat) * 0.75 + 0.001,
        lng: pharmacyLocation.lng + (destLng - pharmacyLocation.lng) * 0.75 - 0.001,
      },
      { lat: destLat, lng: destLng },
    ];

    let liveStatusText = 'تم استلام طلبك وجاري مراجعته وتأكيده من الصيدلي المناوب';
    if (order.status === 'REVIEWED') liveStatusText = 'تمت مراجعة الوصفة وتأكيد الطلب';
    if (order.status === 'PREPARING') liveStatusText = 'الصيدلي يقوم الآن بتجهيز وتغليف الأدوية بصندوق التبريد الآمن';
    if (order.status === 'OUT_FOR_DELIVERY') liveStatusText = `الكابتن في الطريق إليك (على بعد ${distanceRemainingKm} كم - يصل خلال ${etaMinutes} دقيقة)`;
    if (order.status === 'DELIVERED') liveStatusText = 'تم تسليم الطلب بنجاح. نتمنى لك دوام الصحة والعافية!';

    const courier = this.db.users.find((u) => u.id === order.assignedCourierId) || {
      id: 'usr_courier_1',
      name: 'كابتن محمود رضا',
      phone: '01012345678',
    };

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      pharmacyLocation,
      customerLocation,
      courierLocation: {
        lat: currentLat,
        lng: currentLng,
        speedKmH: order.status === 'OUT_FOR_DELIVERY' ? 34 : 0,
        headingDeg,
        updatedAt: new Date().toISOString(),
      },
      courierInfo: {
        id: courier.id,
        name: courier.name,
        phone: courier.phone,
        vehicleType: 'سكوتر / دراجة نارية مجهزة بصندوق حفظ حراري',
        rating: 4.95,
        tripsCount: 462,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      },
      routeWaypoints,
      distanceRemainingKm,
      etaMinutes,
      liveStatusText,
    };
  }
}
