import { Injectable, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from './prisma.service';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: 'ADMIN' | 'PHARMACIST' | 'DELIVERY' | 'SUPPORT' | 'CUSTOMER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  shift?: string;
  nationalId?: string;
  address?: string;
  city?: string;
  points?: number;
  walletBalance?: number;
  createdAt: string;
}

export interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  activeIngredient: string;
  category: string;
  subCategory?: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  stock: number;
  isPrescriptionRequired: boolean;
  isHotDeal?: boolean;
  rating: number;
  reviewCount: number;
  descriptionAr: string;
  dosage: string;
  sideEffects?: string;
  image: string;
  tags: string[];
  alternatives?: string[]; // IDs or names of equivalent generics
}

export interface Prescription {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  governorate: string;
  district: string;
  images: string[];
  imageUrl?: string;
  notes?: string;
  patientNotes?: string;
  allowAlternatives: boolean;
  hasInsurance: boolean;
  insuranceCompany?: string;
  insuranceCardNumber?: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'QUOTED' | 'ACCEPTED' | 'REJECTED' | 'ORDER_CREATED';
  pharmacistNotes?: string;
  reviewedBy?: string;
  quotedItems?: Array<{
    productId?: string;
    productName: string;
    quantity: number;
    price: number;
    dosageNote?: string;
  }>;
  totalQuote?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  nameAr: string;
  nameEn: string;
  price: number;
  quantity: number;
  image: string;
  isPrescriptionRequired?: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
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
  deliveryType: 'EXPRESS_45M' | 'SCHEDULED' | 'MONTHLY_REFILL';
  scheduledTime?: string;
  paymentMethod: 'CASH_ON_DELIVERY' | 'CREDIT_CARD' | 'FAWRY' | 'VODAFONE_CASH' | 'VALU';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  promoCode?: string;
  prescriptionId?: string;
  notes?: string;
  status: 'PENDING' | 'REVIEWED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  assignedCourierId?: string;
  assignedCourierName?: string;
  courierPhone?: string;
  liveCoordinates?: { lat: number; lng: number };
  statusTimeline: Array<{
    status: string;
    titleAr: string;
    timestamp: string;
    note?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface RefillSubscription {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  medicationName: string;
  dosageSchedule: string;
  monthlyQuantity: number;
  price: number;
  deliveryAddress: string;
  governorate: string;
  renewalDay: number; // e.g. 1st or 15th of each month
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  nextRefillDate: string;
  createdAt: string;
}

// CMS Models
export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  bg: string;
  accent: string;
  ctaText: string;
  actionType: 'upload' | 'refill' | 'category' | 'link';
  actionValue?: string;
  img: string;
  order: number;
  isActive: boolean;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  isSpecial?: boolean;
  order: number;
  productCount?: number;
}

export interface PromoCode {
  id: string;
  code: string;
  discountPercentage: number;
  minOrderValue: number;
  maxDiscount: number;
  expiresAt: string;
  usageLimit: number;
  timesUsed: number;
  isActive: boolean;
}

export interface ArticleItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  authorRole: string;
  readTime: string;
  category: string;
  image: string;
  publishedAt: string;
  isFeatured: boolean;
}

export interface MediaAsset {
  id: string;
  name: string;
  url: string;
  alt: string;
  category: string;
  createdAt: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  url: string;
  icon?: string;
  isVisible: boolean;
  order: number;
  openInNewTab?: boolean;
}

export interface FooterColumn {
  title: string;
  links: Array<{ label: string; url: string }>;
}

export interface PlatformSettings {
  websiteName: string;
  brandTagline: string;
  brandDescription: string;
  logoUrl?: string;
  logoText?: string;
  faviconUrl?: string;
  appIconUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  hotline: string;
  whatsapp: string;
  supportEmail: string;
  address: string;
  workingHours: string;
  operatingCities: string[];
  deliveryFee: number;
  freeDeliveryThreshold: number;
  estimatedDeliveryMin: number;
  announcementText: string;
  isAnnouncementActive: boolean;
  allowPrescriptionUpload: boolean;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    tiktok?: string;
  };
  navigationMenu: NavigationItem[];
  footerColumns: FooterColumn[];
  mediaLibrary: MediaAsset[];
}

@Injectable()
export class DbService implements OnModuleInit {
  public users: User[] = [];
  public products: Product[] = [];
  public prescriptions: Prescription[] = [];
  public orders: Order[] = [];
  public refills: RefillSubscription[] = [];

  // CMS Collections
  public banners: HeroBanner[] = [];
  public categories: CategoryItem[] = [];
  public promoCodes: PromoCode[] = [];
  public articles: ArticleItem[] = [];
  public settings: PlatformSettings = {
    websiteName: 'الصيدلية الذكية',
    brandTagline: 'صيدليتك أونلاين 24/7',
    brandDescription: 'منصة الرعاية الصحية والصيدلية الإلكترونية الشاملة، تهدف لتمكين المرضى وعائلاتهم من طلب وتكرار أدويتهم واحتياجاتهم الصحية بسهولة وسرعة وأمان.',
    logoText: 'صـ',
    logoUrl: '',
    faviconUrl: '',
    appIconUrl: '',
    primaryColor: '#059669',
    accentColor: '#0d9488',
    hotline: '19876',
    whatsapp: '01012345678',
    supportEmail: 'admin@pharmacy.com',
    address: 'شارع التسعين، التجمع الخامس، القاهرة، جمهورية مصر العربية',
    workingHours: 'خدمة 24 ساعة طوال أيام الأسبوع',
    operatingCities: ['القاهرة', 'الجيزة', 'الإسكندرية', 'المنصورة', 'طنطا', 'أسيوط', 'الإسماعيلية'],
    deliveryFee: 25,
    freeDeliveryThreshold: 500,
    estimatedDeliveryMin: 35,
    announcementText: '🎉 خصم 15% على جميع مستلزمات العناية بالبشرة والفيتامينات بكود: WELCOME15',
    isAnnouncementActive: true,
    allowPrescriptionUpload: true,
    seoTitle: 'الصيدلية الذكية | صيدليتك أونلاين - أسرع توصيل دواء',
    seoDescription: 'اطلب كل احتياجاتك من الصيدلية أونلاين، ارفع الروشتة، اسأل صيدلي، وباقة الدواء الشهري مع أسرع خدمة توصيل.',
    seoKeywords: 'صيدلية اونلاين, دواء, توصيل ادوية, روشتة, دواء شهري, مستحضرات تجميل, فيتامينات',
    socialLinks: {
      facebook: 'https://facebook.com',
      instagram: 'https://instagram.com',
      twitter: 'https://twitter.com',
      linkedin: 'https://linkedin.com',
      youtube: 'https://youtube.com',
      tiktok: 'https://tiktok.com',
    },
    navigationMenu: [
      { id: 'nav_upload', label: 'ارفع الروشتة', url: '#upload', icon: 'FileText', isVisible: true, order: 1 },
      { id: 'nav_refill', label: 'الدواء الشهري', url: '#refill', icon: 'Clock', isVisible: true, order: 2 },
      { id: 'nav_deals', label: 'عروض التوفير', url: '#deals', icon: 'Flame', isVisible: true, order: 3 },
      { id: 'nav_articles', label: 'نصائح طبية', url: '#articles', icon: 'BookOpen', isVisible: true, order: 4 },
    ],
    footerColumns: [
      {
        title: 'خدماتنا',
        links: [
          { label: 'ارفع الروشتة واطلب دواك', url: '#upload' },
          { label: 'باقة الدواء الشهري للمزمن', url: '#refill' },
          { label: 'محرك البحث عن بدائل الأدوية', url: '#search' },
          { label: 'عروض وخصومات Big Save', url: '#deals' },
        ],
      },
      {
        title: 'الأقسام الأكثر طلباً',
        links: [
          { label: 'مسكنات وخافض للحرارة', url: '#cat_meds' },
          { label: 'علاج السكر والضغط والقلب', url: '#cat_chronic' },
          { label: 'منتجات العناية بالبشرة والشعر', url: '#cat_skin' },
          { label: 'الفيتامينات والمكملات الغذائية', url: '#cat_supp' },
          { label: 'أجهزة قياس السكر وضغط الدم', url: '#cat_devices' },
        ],
      },
    ],
    mediaLibrary: [
      {
        id: 'med_1',
        name: 'بنادول إكسترا 500 مجم',
        url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
        alt: 'صورة عبوة بنادول إكسترا مسكن للألم',
        category: 'أدوية',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'med_2',
        name: 'باقة رعاية الأم والطفل',
        url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
        alt: 'مستحضرات العناية والطفل',
        category: 'عناية',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'med_3',
        name: 'مكملات غذائية وفيتامين د',
        url: 'https://images.unsplash.com/photo-1577401239170-897942555fb3?auto=format&fit=crop&w=600&q=80',
        alt: 'فيتامينات ومكملات صحية',
        category: 'مكملات',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'med_4',
        name: 'أجهزة قياس الضغط والسكر',
        url: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=600&q=80',
        alt: 'جهاز ضغط ديجيتال أومرون',
        category: 'أجهزة',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'med_5',
        name: 'استشارة طبية وصيدلية',
        url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80',
        alt: 'صيدلي يفحص روشتة طبية',
        category: 'استشارات',
        createdAt: new Date().toISOString(),
      },
    ],
  };

  private storageDir = path.join(process.cwd(), 'data');
  private storageFile = path.join(process.cwd(), 'data', 'storage.json');
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor(public readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.initializeData();
  }

  private async initializeData() {
    try {
      console.log('🔌 Loading data from PostgreSQL via Prisma...');
      const [
        users,
        products,
        categories,
        orders,
        prescriptions,
        refills,
        banners,
        promoCodes,
        articles,
        settingsRecord,
      ] = await Promise.all([
        this.prisma.user.findMany(),
        this.prisma.product.findMany(),
        this.prisma.category.findMany({ orderBy: { order: 'asc' } }),
        this.prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' } }),
        this.prisma.prescription.findMany({ orderBy: { createdAt: 'desc' } }),
        this.prisma.refillSubscription.findMany(),
        this.prisma.heroBanner.findMany({ orderBy: { order: 'asc' } }),
        this.prisma.promoCode.findMany(),
        this.prisma.article.findMany(),
        this.prisma.platformSettings.findUnique({ where: { id: 'default' } }),
      ]);

      if (products.length > 0) {
        this.users = users.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
        } as any));
        this.products = products.map((p) => ({
          ...p,
          descriptionAr: p.descriptionAr || '',
          dosage: p.dosage || '',
          tags: p.tags || [],
          alternatives: p.alternatives || [],
        } as any));
        this.categories = categories as any;
        this.orders = orders.map((o) => ({
          ...o,
          deliveryAddress: o.deliveryAddress as any,
          liveCoordinates: o.liveCoordinates as any,
          statusTimeline: (o.statusTimeline as any) || [],
          createdAt: o.createdAt.toISOString(),
          updatedAt: o.updatedAt.toISOString(),
          items: o.items.map((it) => ({
            productId: it.productId,
            nameAr: it.nameAr,
            nameEn: it.nameEn,
            price: it.price,
            quantity: it.quantity,
            image: it.image,
            isPrescriptionRequired: it.isPrescriptionRequired,
          })),
        } as any));
        this.prescriptions = prescriptions.map((p) => ({
          ...p,
          quotedItems: p.quotedItems as any,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        } as any));
        this.refills = refills.map((r) => ({
          ...r,
          nextRefillDate: r.nextRefillDate ? r.nextRefillDate.toISOString() : '',
          createdAt: r.createdAt.toISOString(),
        } as any));
        this.banners = banners as any;
        this.promoCodes = promoCodes.map((pr) => ({
          ...pr,
          expiresAt: pr.expiresAt ? pr.expiresAt.toISOString() : '',
        } as any));
        this.articles = articles.map((a) => ({
          ...a,
          publishedAt: a.publishedAt ? a.publishedAt.toISOString() : '',
        } as any));
        if (settingsRecord && settingsRecord.data) {
          this.settings = { ...this.settings, ...(settingsRecord.data as any) };
        }
        console.log(`✅ PostgreSQL Storage Loaded Successfully (${this.orders.length} orders, ${this.prescriptions.length} prescriptions, ${this.products.length} products).`);
        return;
      }
    } catch (err) {
      console.warn('⚠️ Could not connect to PostgreSQL on init, attempting fallback to storage.json:', err);
    }

    // Fallback if PostgreSQL is empty or during initialization
    if (fs.existsSync(this.storageFile)) {
      try {
        const raw = fs.readFileSync(this.storageFile, 'utf8');
        const data = JSON.parse(raw);
        this.users = data.users || [];
        this.products = data.products || [];
        this.prescriptions = (data.prescriptions || []).map((p: any) => ({
          ...p,
          imageUrl: p.imageUrl || (p.images && p.images[0]) || '',
          patientNotes: p.patientNotes || p.notes || '',
        }));
        this.orders = data.orders || [];
        this.refills = data.refills || [];
        this.banners = data.banners || [];
        this.categories = data.categories || [];
        this.promoCodes = data.promoCodes || [];
        this.articles = data.articles || [];
        if (data.settings) {
          this.settings = { ...this.settings, ...data.settings };
        }
        console.log(`💾 JSON Backup Storage Loaded (${this.orders.length} orders, ${this.products.length} products).`);
        return;
      } catch (e) {
        console.error('Failed to load storage file:', e);
      }
    }

    await this.seedDatabase();
  }

  public persist() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.persistNow();
    }, 200);
  }

  public async persistNow() {
    try {
      // Async background sync to PostgreSQL for mutations
      if (this.settings) {
        await this.prisma.platformSettings.upsert({
          where: { id: 'default' },
          update: { data: this.settings as any },
          create: { id: 'default', data: this.settings as any },
        }).catch((e) => console.error('Prisma settings sync error:', e));
      }
    } catch (err) {
      console.error('❌ Error syncing to PostgreSQL:', err);
    }
  }

  private async seedDatabase() {
    const passwordHash = await bcrypt.hash('admin123', 10);
    const userPassHash = await bcrypt.hash('123456', 10);

    // 1. Staff & Users
    this.users = [
      {
        id: 'usr_admin_1',
        name: 'د. أيمن مسعد (المدير الطبي والمسؤول)',
        email: 'admin@pharmacy.com',
        phone: '01012345678',
        password: passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        shift: 'صباحي (8 ص - 4 م)',
        nationalId: '29501010123456',
        city: 'القاهرة',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_pharm_1',
        name: 'د. سارة محمود (صيدلانية مراجعة وإكلينيكية)',
        email: 'pharmacist@pharmacy.com',
        phone: '01123456789',
        password: passwordHash,
        role: 'PHARMACIST',
        status: 'ACTIVE',
        shift: 'مسائي (4 م - 12 ص)',
        nationalId: '29802020123456',
        city: 'الجيزة',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_cour_1',
        name: 'كابتن أحمد علي (مندوب توصيل سريع)',
        email: 'courier@pharmacy.com',
        phone: '01234567890',
        password: passwordHash,
        role: 'DELIVERY',
        status: 'ACTIVE',
        shift: 'كامل (10 ص - 8 م)',
        nationalId: '29903030123456',
        city: 'القاهرة - المعادي',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_supp_1',
        name: 'مروة الشافعي (خدمة العملاء والدعم)',
        email: 'support@pharmacy.com',
        phone: '01098765432',
        password: passwordHash,
        role: 'SUPPORT',
        status: 'ACTIVE',
        shift: 'صباحي (9 ص - 5 م)',
        city: 'القاهرة',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_cust_1',
        name: 'محمد إبراهيم حسن',
        email: 'user@gmail.com',
        phone: '01005556677',
        password: userPassHash,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        address: 'شارع 9، المعادي، القاهرة',
        city: 'القاهرة',
        points: 450,
        walletBalance: 120,
        createdAt: new Date().toISOString(),
      },
    ];

    // 2. Dynamic Products Catalog (Managed via Excel Import and Dashboard)
    this.products = [];

    // 3. Seed Prescriptions
    this.prescriptions = [
      {
        id: 'rx_101',
        customerId: 'usr_cust_1',
        customerName: 'محمد إبراهيم حسن',
        customerPhone: '01005556677',
        customerAddress: 'شارع 9، المعادي، القاهرة',
        governorate: 'القاهرة',
        district: 'المعادي',
        images: ['https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80'],
        imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
        notes: 'يرجى مراجعة بديل الأوجمنتين إذا لم يتوفر، وإضافة شريط بنادول إكسترا.',
        patientNotes: 'يرجى مراجعة بديل الأوجمنتين إذا لم يتوفر، وإضافة شريط بنادول إكسترا.',
        allowAlternatives: true,
        hasInsurance: false,
        status: 'PENDING',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'rx_102',
        customerId: 'usr_cust_2',
        customerName: 'فاطمة الزهراء علي',
        customerPhone: '01199887766',
        customerAddress: 'عمارات الضباط، مصطفى النحاس، مدينة نصر',
        governorate: 'القاهرة',
        district: 'مدينة نصر',
        images: ['https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80'],
        imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80',
        notes: 'عندي تأمين أكسا كير رقم 448920.',
        patientNotes: 'عندي تأمين أكسا كير رقم 448920.',
        allowAlternatives: false,
        hasInsurance: true,
        insuranceCompany: 'AXA Health Insurance',
        insuranceCardNumber: 'AXA-9948201',
        status: 'QUOTED',
        pharmacistNotes: 'تم تدقيق الروشتة وإضافة أدوية علاج الحساسية وبخاخ الصدر المسجل بالروشتة.',
        reviewedBy: 'د. سارة محمود',
        quotedItems: [
          { productId: 'prod_1', productName: 'بانادول إكسترا 500 مجم (24 قرص)', quantity: 1, price: 52.0, dosageNote: 'قرص كل 8 ساعات' },
          { productId: 'prod_3', productName: 'أوجمنتين 1 جم مضاد حيوي (14 قرص)', quantity: 2, price: 270.0, dosageNote: 'قرص كل 12 ساعة بعد الأكل' },
        ],
        totalQuote: 322.0,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        updatedAt: new Date(Date.now() - 1800000).toISOString(),
      },
    ];

    // 4. Seed Orders
    this.orders = [
      {
        id: 'ord_1001',
        orderNumber: 'ORD-2026-9812',
        customerId: 'usr_cust_1',
        customerName: 'محمد إبراهيم حسن',
        customerPhone: '01005556677',
        customerEmail: 'user@gmail.com',
        deliveryAddress: {
          governorate: 'القاهرة',
          city: 'المعادي',
          street: 'شارع النصر متفرع من شارع 9',
          building: 'عمارة 14',
          floor: 'الدور 4',
          apartment: 'شقة 402',
          landmark: 'بجوار الميدان',
        },
        deliveryType: 'EXPRESS_45M',
        paymentMethod: 'CASH_ON_DELIVERY',
        paymentStatus: 'PENDING',
        items: [
          { productId: 'prod_1', nameAr: 'بانادول إكسترا 500 مجم', nameEn: 'Panadol Extra', price: 52.0, quantity: 2, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=200&q=80' },
          { productId: 'prod_5', nameAr: 'لاروش بوزيه إيفاكلار جل', nameEn: 'La Roche Effaclar', price: 480.0, quantity: 1, image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80' },
        ],
        subtotal: 584.0,
        deliveryFee: 25.0,
        discount: 25.0,
        total: 584.0,
        promoCode: 'WELCOME15',
        status: 'OUT_FOR_DELIVERY',
        assignedCourierId: 'usr_cour_1',
        assignedCourierName: 'كابتن أحمد علي',
        courierPhone: '01234567890',
        liveCoordinates: { lat: 29.9602, lng: 31.2569 },
        statusTimeline: [
          { status: 'PENDING', titleAr: 'تم استلام الطلب', timestamp: new Date(Date.now() - 30 * 60000).toISOString() },
          { status: 'REVIEWED', titleAr: 'تمت المراجعة من الصيدلي', timestamp: new Date(Date.now() - 20 * 60000).toISOString() },
          { status: 'PREPARING', titleAr: 'جاري التجهيز والتغليف الآمن', timestamp: new Date(Date.now() - 12 * 60000).toISOString() },
          { status: 'OUT_FOR_DELIVERY', titleAr: 'خرج للتوصيل مع الكابتن أحمد', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
        ],
        createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
      },
      {
        id: 'ord_1002',
        orderNumber: 'ORD-2026-9813',
        customerId: 'usr_cust_3',
        customerName: 'داليا الشرقاوي',
        customerPhone: '01288334455',
        deliveryAddress: {
          governorate: 'الجيزة',
          city: 'الدقي',
          street: 'شارع مصدق',
          building: 'برج الأطباء',
          floor: 'الدور 2',
          apartment: 'عيادة 5',
          landmark: 'أمام محطة مترو الدقي',
        },
        deliveryType: 'SCHEDULED',
        scheduledTime: 'اليوم بين 6:00 م و 8:00 م',
        paymentMethod: 'VODAFONE_CASH',
        paymentStatus: 'PAID',
        items: [
          { productId: 'prod_7', nameAr: 'أوميجا 3 بلس كبسولات', nameEn: 'Omega 3 Plus', price: 110.0, quantity: 2, image: 'https://images.unsplash.com/photo-1577401239170-897942555fb3?auto=format&fit=crop&w=200&q=80' },
          { productId: 'prod_10', nameAr: 'جهاز قياس ضغط الدم ديجيتال أومرون', nameEn: 'Omron M2', price: 1850.0, quantity: 1, image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=200&q=80' },
        ],
        subtotal: 2070.0,
        deliveryFee: 0.0,
        discount: 100.0,
        total: 1970.0,
        status: 'PREPARING',
        assignedCourierId: 'usr_cour_1',
        assignedCourierName: 'كابتن أحمد علي',
        courierPhone: '01234567890',
        statusTimeline: [
          { status: 'PENDING', titleAr: 'تم استلام الطلب', timestamp: new Date(Date.now() - 45 * 60000).toISOString() },
          { status: 'REVIEWED', titleAr: 'تمت مراجعة المنتجات وتوافرها', timestamp: new Date(Date.now() - 35 * 60000).toISOString() },
          { status: 'PREPARING', titleAr: 'جاري التجهيز في الصيدلية المركزية', timestamp: new Date(Date.now() - 10 * 60000).toISOString() },
        ],
        createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 60000).toISOString(),
      },
      {
        id: 'ord_1000',
        orderNumber: 'ORD-2026-9810',
        customerId: 'usr_cust_1',
        customerName: 'محمد إبراهيم حسن',
        customerPhone: '01005556677',
        deliveryAddress: {
          governorate: 'القاهرة',
          city: 'المعادي',
          street: 'شارع 9',
          building: 'عمارة 14',
          floor: '4',
          apartment: '402',
        },
        deliveryType: 'EXPRESS_45M',
        paymentMethod: 'CASH_ON_DELIVERY',
        paymentStatus: 'PAID',
        items: [
          { productId: 'prod_2', nameAr: 'كونكور 5 مجم لعلاج الضغط', nameEn: 'Concor 5mg', price: 62.0, quantity: 2, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=200&q=80' }
        ],
        subtotal: 124.0,
        deliveryFee: 25.0,
        discount: 0,
        total: 149.0,
        status: 'DELIVERED',
        assignedCourierId: 'usr_cour_1',
        assignedCourierName: 'كابتن أحمد علي',
        courierPhone: '01234567890',
        statusTimeline: [
          { status: 'DELIVERED', titleAr: 'تم تسليم الطلب وتحصيل المبلغ بنجاح', timestamp: new Date(Date.now() - 120 * 60000).toISOString() }
        ],
        createdAt: new Date(Date.now() - 150 * 60000).toISOString(),
        updatedAt: new Date(Date.now() - 120 * 60000).toISOString(),
      },
      {
        id: 'ord_1003',
        orderNumber: 'ORD-2026-9814',
        customerId: 'usr_cust_4',
        customerName: 'كريم عبد العزيز',
        customerPhone: '01099221144',
        deliveryAddress: {
          governorate: 'الإسكندرية',
          city: 'سموحة',
          street: 'شارع فوزي معاذ',
          building: 'عمارة 8',
          floor: 'الدور 7',
          apartment: 'شقة 14',
        },
        deliveryType: 'EXPRESS_45M',
        paymentMethod: 'CREDIT_CARD',
        paymentStatus: 'PAID',
        items: [
          { productId: 'prod_6', nameAr: 'سيرافي لوشن مرطب للبشرة الجافة', nameEn: 'CeraVe Lotion', price: 520.0, quantity: 1, image: 'https://images.unsplash.com/photo-1608248597359-00989f66a88b?auto=format&fit=crop&w=200&q=80' },
        ],
        subtotal: 520.0,
        deliveryFee: 20.0,
        discount: 0,
        total: 540.0,
        status: 'PENDING',
        statusTimeline: [
          { status: 'PENDING', titleAr: 'طلب جديد بانتظار مراجعة الصيدلي', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
        ],
        createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
      },
    ];

    // 5. Seed Refills
    this.refills = [
      {
        id: 'refill_1',
        customerId: 'usr_cust_1',
        customerName: 'محمد إبراهيم حسن',
        customerPhone: '01005556677',
        medicationName: 'جلوكوفاج 1000 مجم + كونكور 5 مجم (باقة السكر والضغط)',
        dosageSchedule: 'قرص جلوكوفاج بعد الغداء + قرص كونكور صباحاً',
        monthlyQuantity: 2,
        price: 147.0,
        deliveryAddress: 'شارع 9، المعادي، القاهرة',
        governorate: 'القاهرة',
        renewalDay: 1,
        status: 'ACTIVE',
        nextRefillDate: '2026-10-01',
        createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
      },
    ];

    // 6. Seed CMS Banners
    this.banners = [
      {
        id: 'ban_1',
        title: 'صيدليتك أونلاين الأسرع في التوصيل',
        subtitle: 'ارفع الروشتة أو اطلب دواك وهيصلك لحد باب البيت خلال 30-45 دقيقة',
        tag: '⚡ توصيل فوري بجميع المحافظات',
        bg: 'from-emerald-900 via-teal-900 to-slate-900',
        accent: 'emerald',
        ctaText: 'ارفع الروشتة الآن',
        actionType: 'upload',
        img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
        order: 1,
        isActive: true,
      },
      {
        id: 'ban_2',
        title: 'باقة الدواء الشهري للمزمن',
        subtitle: 'تكرار وتوصيل تلقائي لأدوية السكر والضغط والقلب كل 30 يوماً مع توصيل مجاني',
        tag: '💊 رعاية صحية مستمرة',
        bg: 'from-teal-950 via-cyan-950 to-slate-900',
        accent: 'cyan',
        ctaText: 'اشترك في باقة الدواء الشهري',
        actionType: 'refill',
        img: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=600&q=80',
        order: 2,
        isActive: true,
      },
      {
        id: 'ban_3',
        title: 'عروض التوفير الكبرى (Big Save)',
        subtitle: 'خصومات تصل إلى 25% على منتجات العناية بالبشرة، المكملات الغذائية، ومستلزمات الطفل',
        tag: '🔥 عروض حصرية لفترة محدودة',
        bg: 'from-rose-950 via-slate-900 to-slate-900',
        accent: 'rose',
        ctaText: 'تصفح عروض التوفير',
        actionType: 'category',
        actionValue: 'عروض التوفير (Big Save)',
        img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
        order: 3,
        isActive: true,
      },
    ];

    // 7. Seed Categories
    this.categories = [
      { id: 'cat_all', name: 'الكل', slug: 'all', iconName: 'Layers', order: 1 },
      { id: 'cat_meds', name: 'أدوية وعلاج', slug: 'meds', iconName: 'Pill', order: 2 },
      { id: 'cat_skin', name: 'العناية بالبشرة', slug: 'skin', iconName: 'Sparkles', order: 3 },
      { id: 'cat_supp', name: 'الفيتامينات والمكملات', slug: 'supplements', iconName: 'HeartPulse', order: 4 },
      { id: 'cat_baby', name: 'الأم والطفل', slug: 'baby', iconName: 'Baby', order: 5 },
      { id: 'cat_devices', name: 'الأجهزة والمستلزمات الطبية', slug: 'devices', iconName: 'Smile', order: 6 },
      { id: 'cat_deals', name: 'عروض التوفير (Big Save)', slug: 'deals', iconName: 'Flame', isSpecial: true, order: 7 },
    ];

    // 8. Seed Promo Codes
    this.promoCodes = [
      {
        id: 'promo_1',
        code: 'WELCOME15',
        discountPercentage: 15,
        minOrderValue: 200,
        maxDiscount: 100,
        expiresAt: '2026-12-31',
        usageLimit: 1000,
        timesUsed: 42,
        isActive: true,
      },
      {
        id: 'promo_2',
        code: 'WELCOME50',
        discountPercentage: 20,
        minOrderValue: 150,
        maxDiscount: 50,
        expiresAt: '2026-12-31',
        usageLimit: 500,
        timesUsed: 19,
        isActive: true,
      },
    ];

    // 9. Seed Medical Articles & Health Tips
    this.articles = [
      {
        id: 'art_1',
        title: 'كيف تضبط جرعات أدوية السكر والضغط مع وجبات اليوم؟',
        summary: 'إرشادات طبية من صيادلة معتمدين لتجنب هبوط السكر ومضاعفات ضغط الدم عند تناول الأدوية.',
        content: 'يعتبر الالتزام بمواعيد تناول أدوية السكر (مثل الميتفورمين وجلوكوفاج) بعد الوجبات مباشرة أمراً حاسماً لتجنب اضطرابات المعدة، بينما يفضل أخذ أدوية الضغط صباحاً في نفس الموعد يومياً...',
        author: 'د. سارة محمود',
        authorRole: 'صيدلانية إكلينيكية',
        readTime: '3 دقائق',
        category: 'صحة الأمراض المزمنة',
        image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=400&q=80',
        publishedAt: '2026-08-28',
        isFeatured: true,
      },
      {
        id: 'art_2',
        title: 'دليلك الشامل لروتين العناية بالبشرة المعرضة لحب الشباب',
        summary: 'المكونات الفعالة مثل حمض الساليسيليك والنياسيناميد وأفضل طرق استخدام الغسول والمرطب.',
        content: 'البشرة المعرضة للحبوب تحتاج إلى تنظيف لطيف مرتين يومياً باستخدام غسول جل رغوي، مع استخدام مرطب خفيف غير زؤاني (Non-Comedogenic) مثل حمض الهيالورونيك والسيراميد...',
        author: 'د. أيمن مسعد',
        authorRole: 'استشاري صيدلي',
        readTime: '4 دقائق',
        category: 'العناية بالبشرة',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80',
        publishedAt: '2026-08-30',
        isFeatured: true,
      },
      {
        id: 'art_3',
        title: 'أهمية فيتامين د وأوميجا 3 لدعم المناعة وصحة المفاصل',
        summary: 'متى تحتاج لتحليل فيتامين د والجرعات الوقائية الآمنة للأطفال والبالغين.',
        content: 'يلعب فيتامين د دوراً رئيسياً في امتصاص الكالسيوم وتقوية الجهاز المناعي. ينصح بتناوله مع وجبة تحتوي على دهون صحية لزيادة الامتصاص بنسبة تفوق 30%...',
        author: 'د. هاني عادل',
        authorRole: 'أخصائي تغذية علاجية',
        readTime: '2 دقيقة',
        category: 'فيتامينات ومكملات',
        image: 'https://images.unsplash.com/photo-1577401239170-897942555fb3?auto=format&fit=crop&w=400&q=80',
        publishedAt: '2026-08-25',
        isFeatured: true,
      },
    ];
  }
}
