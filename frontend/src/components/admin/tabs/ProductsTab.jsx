import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Filter,
  FileSpreadsheet,
  Download,
  Layers,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { EmptyState } from '../common/EmptyState';
import { api } from '../../../services/api';

export const ProductsTab = ({
  products = [],
  onOpenNewProductModal,
  onOpenExcelImportModal,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [selectedMainCat, setSelectedMainCat] = useState('ALL');
  const [selectedSubCat, setSelectedSubCat] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Extract unique main categories
  const mainCategories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return ['ALL', ...Array.from(cats)];
  }, [products]);

  // Extract subcategories based on selected main category
  const subCategories = useMemo(() => {
    if (selectedMainCat === 'ALL') {
      const subs = new Set(products.map((p) => p.subCategory).filter(Boolean));
      return ['ALL', ...Array.from(subs)];
    }
    const filteredByMain = products.filter((p) => p.category === selectedMainCat);
    const subs = new Set(filteredByMain.map((p) => p.subCategory).filter(Boolean));
    return ['ALL', ...Array.from(subs)];
  }, [products, selectedMainCat]);

  // Handle main category change
  const handleMainCatChange = (cat) => {
    setSelectedMainCat(cat);
    setSelectedSubCat('ALL'); // reset subcategory when main changes
    setPage(1);
  };

  const handleSubCatChange = (sub) => {
    setSelectedSubCat(sub);
    setPage(1);
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesMain = selectedMainCat === 'ALL' || p.category === selectedMainCat;
      const matchesSub = selectedSubCat === 'ALL' || p.subCategory === selectedSubCat;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.nameAr?.toLowerCase().includes(q) ||
        p.nameEn?.toLowerCase().includes(q) ||
        p.activeIngredient?.toLowerCase().includes(q) ||
        p.id?.toLowerCase().includes(q);
      return matchesMain && matchesSub && matchesSearch;
    });
  }, [products, selectedMainCat, selectedSubCat, search]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const handleDownloadTemplate = () => {
    window.open(api.downloadExcelTemplateUrl(), '_blank');
  };

  return (
    <div className="space-y-6 font-cairo">
      <PageHeader
        title="المخزون والأدوية والمنتجات"
        description="إدارة قاعدة بيانات الأدوية المصنفة، مستويات المخزون، والأسعار عبر شيت الإكسيل"
        badge={`${products.length.toLocaleString('ar-EG')} صنف مسجل في الكتالوج`}
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-all"
              title="إعادة تحميل الكتالوج"
            >
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              <span>تحديث الكتالوج</span>
            </button>
          )}

          {/* Excel Import Button */}
          <button
            onClick={onOpenExcelImportModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 inline-flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>استيراد من شيت إكسيل</span>
          </button>

          {/* Download Template Button */}
          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>قالب Excel</span>
          </button>

          {/* New Product Modal */}
          <button
            onClick={onOpenNewProductModal}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 inline-flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة صنف يدوي</span>
          </button>
        </div>
      </PageHeader>

      {/* Hierarchical Filter & Search Section */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        {/* Top Filter Row: Main Category and Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Main Category Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {mainCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleMainCatChange(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedMainCat === cat
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat === 'ALL' ? 'جميع الأقسام الرئيسية' : cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[260px] shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              placeholder="ابحث بالاسم أو المادة أو الكود..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-xs"
            />
          </div>
        </div>

        {/* Subcategories Row (if more than 1 subcategory exists) */}
        {subCategories.length > 2 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto custom-scrollbar">
            <span className="text-[11px] text-slate-400 font-bold whitespace-nowrap flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              <span>الأقسام الفرعية:</span>
            </span>
            <div className="flex gap-1 flex-nowrap">
              {subCategories.map((sub) => (
                <button
                  key={sub}
                  onClick={() => handleSubCatChange(sub)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedSubCat === sub
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {sub === 'ALL' ? 'الكل الفرعي' : sub}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="لا توجد أدوية أو منتجات مطابقة"
          description="لم يتم العثور على نتائج في هذا التصنيف. يمكنك استيراد البيانات من شيت الإكسيل بضغطة زر واحدة."
          actionLabel="استيراد من شيت الإكسيل"
          onAction={onOpenExcelImportModal}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
          <div className="p-3 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              عرض <strong className="text-slate-800 dark:text-slate-200 font-mono">
                {filteredProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredProducts.length)}
              </strong> من إجمالي نتائج مطابقة:{' '}
              <strong className="text-slate-800 dark:text-slate-200 font-mono">{filteredProducts.length.toLocaleString('ar-EG')}</strong>
              {' '}(من إجمالي الكتالوج المسجل:{' '}
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">{products.length.toLocaleString('ar-EG')}</strong> صنف)
            </div>
            {selectedMainCat !== 'ALL' && (
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] w-fit">
                قسم: {selectedMainCat} {selectedSubCat !== 'ALL' && `> ${selectedSubCat}`}
              </span>
            )}
          </div>

          <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="p-4">الدواء / المنتج</th>
                  <th className="p-4">القسم والتصنيف</th>
                  <th className="p-4">البراند / المادة الفعالة</th>
                  <th className="p-4">السعر</th>
                  <th className="p-4">المخزون المتاح</th>
                  <th className="p-4">شروط الصرف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedProducts.map((p) => {
                  const isLowStock = p.stock <= 15;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Product Name & Image */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.nameAr}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-white"
                            onError={(e) => {
                              e.target.src =
                                'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80';
                            }}
                          />
                          <div className="max-w-xs">
                            <span className="font-bold text-slate-900 dark:text-white block line-clamp-1">
                              {p.nameAr}
                            </span>
                            {p.id && (
                              <span className="text-[10px] text-slate-400 font-mono block">
                                SKU: {p.id.replace('prod_', '')}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] block w-fit">
                          {p.category}
                        </span>
                        {p.subCategory && (
                          <span className="text-[10px] text-slate-400 block mt-1">
                            {p.subCategory}
                          </span>
                        )}
                      </td>

                      {/* Active Ingredient / Brand */}
                      <td className="p-4 text-slate-600 dark:text-slate-400 text-[11px] max-w-[180px]">
                        <span className="font-bold text-slate-700 dark:text-slate-300 block">
                          {p.activeIngredient || '—'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="p-4">
                        <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400 block">
                          {p.price} ج.م
                        </span>
                        {p.originalPrice > p.price && (
                          <span className="text-[10px] text-slate-400 line-through font-mono">
                            {p.originalPrice} ج.م
                          </span>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          {isLowStock ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 font-bold font-mono text-[11px] inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{p.stock} (مخزون منخفض)</span>
                            </span>
                          ) : (
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {p.stock} عبوة
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Rx / Deal Badges */}
                      <td className="p-4 space-y-1">
                        {p.isPrescriptionRequired ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[10px] block w-fit">
                            يتطلب روشتة (Rx)
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 block">
                            صرف بدون روشتة (OTC)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 bg-slate-50/80 dark:bg-slate-800/60 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">عدد العناصر بالصفحة:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">
                صفحة <strong className="text-slate-900 dark:text-white font-mono">{currentPage}</strong> من{' '}
                <strong className="text-slate-900 dark:text-white font-mono">{totalPages}</strong>
              </span>

              <div className="flex items-center gap-1 mr-2">
                <button
                  onClick={() => setPage(1)}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-all"
                  title="الصفحة الأولى"
                >
                  الأولى
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-all"
                  title="الصفحة السابقة"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-all"
                  title="الصفحة التالية"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-all"
                  title="الصفحة الأخيرة"
                >
                  الأخيرة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
