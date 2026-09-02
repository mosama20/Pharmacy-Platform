const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const excelPath = 'D:\\chefaa_products.xlsx';
const outputJsonPath = path.join(__dirname, '..', 'src', 'database', 'products.json');

console.log('Reading Excel from:', excelPath);
const workbook = xlsx.readFile(excelPath);
const sheet = workbook.Sheets['المنتجات'] || workbook.Sheets[workbook.SheetNames[0]];
const rawRows = xlsx.utils.sheet_to_json(sheet);

console.log(`Loaded ${rawRows.length} raw products from Excel.`);

function inferCategory(name, desc, brand) {
  const text = `${name} ${desc} ${brand}`.toLowerCase();
  
  if (text.includes('بامبرز') || text.includes('حفاض') || text.includes('أطفال') || text.includes('رضع') || text.includes('حليب اطفال') || text.includes('لهاية') || text.includes('سيريلاك')) {
    return 'الأم والطفل';
  }
  if (text.includes('بشرة') || text.includes('غسول') || text.includes('مرطب') || text.includes('سيروم') || text.includes('واقي شمس') || text.includes('لاروش') || text.includes('سيرافي') || text.includes('حبوب الشباب') || text.includes('تفتيح')) {
    return 'العناية بالبشرة';
  }
  if (text.includes('شعر') || text.includes('شامبو') || text.includes('بلسم') || text.includes('تساقط الشعر') || text.includes('زيت شعر') || text.includes('سيروم شعر')) {
    return 'العناية بالشعر';
  }
  if (text.includes('فيتامين') || text.includes('أوميجا') || text.includes('مكمل غذائي') || text.includes('زنك') || text.includes('كالسيوم') || text.includes('حديد') || text.includes('ماغنسيوم') || text.includes('multivitamin')) {
    return 'الفيتامينات والمكملات';
  }
  if (text.includes('جهاز') || text.includes('ضغط') || text.includes('سكر') || text.includes('ترمومتر') || text.includes('قياس') || text.includes('أومرون') || text.includes('شرائط قياس') || text.includes('إبر')) {
    return 'الأجهزة والمستلزمات الطبية';
  }
  if (text.includes('معجون أسنان') || text.includes('فرشاة') || text.includes('مزيل عرق') || text.includes('صابون') || text.includes('شاور جل') || text.includes('فوط')) {
    return 'العناية الشخصية';
  }
  return 'أدوية وعلاج';
}

function inferActiveIngredient(name, desc) {
  const text = `${name} ${desc}`.toLowerCase();
  if (text.includes('باراسيتامول') || text.includes('paracetamol')) return 'Paracetamol (باراسيتامول)';
  if (text.includes('ايبوبروفين') || text.includes('ibuprofen') || text.includes('بروفين')) return 'Ibuprofen (إيبوبروفين)';
  if (text.includes('اموكسيسيلين') || text.includes('amoxicillin') || text.includes('اوجمنتين')) return 'Amoxicillin + Clavulanic Acid';
  if (text.includes('ميتفورمين') || text.includes('metformin') || text.includes('جلوكوفاج')) return 'Metformin (ميتفورمين)';
  if (text.includes('بيسوبرولول') || text.includes('bisoprolol') || text.includes('كونكور')) return 'Bisoprolol (بيسوبرولول)';
  if (text.includes('اوميبرازول') || text.includes('omeprazole')) return 'Omeprazole (أوميبرازول)';
  if (text.includes('سيتريزين') || text.includes('cetirizine') || text.includes('حساسية')) return 'Cetirizine (سيتريزين)';
  if (text.includes('فيتامين سي') || text.includes('vitamin c')) return 'Vitamin C (حمض الأسكوربيك)';
  if (text.includes('زنك') || text.includes('zinc')) return 'Zinc (زنك)';
  if (text.includes('هيالورونيك') || text.includes('hyaluronic')) return 'Hyaluronic Acid';
  if (text.includes('سيراميد') || text.includes('ceramide')) return 'Essential Ceramides';
  return 'تركيبة طبية معتمدة';
}

const cleanedProducts = [];
let idCounter = 1;

for (const row of rawRows) {
  const nameAr = (row['اسم المنتج'] || '').trim();
  if (!nameAr) continue;

  const brand = (row['البراند'] || '').trim();
  const price = Number(row['السعر']) || 45;
  const desc = (row['الوصف'] || '').trim();
  const isRx = String(row['يحتاج وصفة'] || '').includes('نعم');
  const image = row['رابط الصورة'] || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80';
  const category = inferCategory(nameAr, desc, brand);
  const activeIngredient = inferActiveIngredient(nameAr, desc);

  // Generate English name from product URL or transliteration
  let nameEn = brand ? `${brand} Product` : 'Chefaa Pharmacy Item';
  if (row['رابط المنتج']) {
    const slug = row['رابط المنتج'].split('/').pop().replace(/-/g, ' ');
    if (slug) {
      nameEn = slug.charAt(0).toUpperCase() + slug.slice(1);
    }
  }

  const isHotDeal = idCounter % 7 === 0;
  const discountPercentage = isHotDeal ? (idCounter % 3 === 0 ? 15 : 10) : 0;
  const originalPrice = isHotDeal ? Math.round(price * (1 + discountPercentage / 100)) : price;

  cleanedProducts.push({
    id: `prod_chf_${idCounter}`,
    nameAr,
    nameEn,
    brand: brand || 'شفاء',
    activeIngredient,
    category,
    price,
    originalPrice,
    discountPercentage,
    stock: 50 + (idCounter % 150),
    isPrescriptionRequired: isRx,
    isHotDeal,
    rating: Number((4.5 + (idCounter % 5) * 0.1).toFixed(1)),
    reviewCount: 20 + (idCounter % 280),
    descriptionAr: desc || `منتج ${nameAr} أصلي ومصرح به من صيدليات شفاء وموردين معتمدين.`,
    dosage: isRx ? 'حسب إرشادات الطبيب أو الصيدلي' : 'يستخدم حسب إرشادات النشرة الطبية المرفقة.',
    image,
    tags: [brand, category, isRx ? 'روشتة' : 'عناية', 'صيدلية'].filter(Boolean),
  });

  idCounter++;
}

console.log(`Writing ${cleanedProducts.length} structured products to ${outputJsonPath}...`);
fs.writeFileSync(outputJsonPath, JSON.stringify(cleanedProducts, null, 2), 'utf8');
console.log('✅ Successfully exported all Chefaa Excel products to products.json!');
