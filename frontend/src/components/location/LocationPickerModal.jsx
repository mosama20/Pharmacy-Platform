import React, { useState, useMemo } from 'react';
import {
  MapPin,
  X,
  Check,
  Building2,
  Navigation,
  Search,
  Crosshair,
  Loader2,
  AlertCircle,
  Sparkles,
  Map,
} from 'lucide-react';
import { useLocation } from '../../context/LocationContext';

export const LocationPickerModal = () => {
  const {
    isLocationModalOpen,
    setIsLocationModalOpen,
    selectedGovernorate,
    selectedDistrict,
    updateLocation,
    detectLiveLocation,
    gpsLoading,
    gpsError,
    isGpsActive,
    userCoordinates,
    egyptGovernorates,
  } = useLocation();

  const [activeGov, setActiveGov] = useState(selectedGovernorate);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered districts/villages across all governorates when searching
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    const results = [];

    egyptGovernorates.forEach((gov) => {
      gov.districts.forEach((dist) => {
        if (dist.toLowerCase().includes(q) || gov.nameAr.toLowerCase().includes(q)) {
          results.push({
            govName: gov.nameAr,
            districtName: dist,
          });
        }
      });
    });

    return results;
  }, [searchQuery, egyptGovernorates]);

  if (!isLocationModalOpen) return null;

  const currentGov =
    egyptGovernorates.find((g) => g.nameAr === activeGov) || egyptGovernorates[0];

  const handleUseGps = async () => {
    const success = await detectLiveLocation();
    if (success) {
      setTimeout(() => {
        setIsLocationModalOpen(false);
      }, 600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl glass-card shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                حدد موقع التوصيل في مصر
                <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full font-normal">
                  27 محافظة وجميع القرى
                </span>
              </h3>
              <p className="text-xs text-emerald-100">
                لربط طلبك بأقرب صيدلية متوفر لديها المخزون وأسرع كابتن توصيل
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsLocationModalOpen(false)}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Live GPS Instant Button */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Crosshair className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-right">
                <h4 className="font-bold text-xs text-emerald-950 dark:text-emerald-200">
                  تحديد الموقع الفعلي المباشر (Live GPS)
                </h4>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  كشف المحافظة والمدينة والشارع عبر الـ GPS تلقائياً
                </p>
              </div>
            </div>

            <button
              onClick={handleUseGps}
              disabled={gpsLoading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 disabled:opacity-50 transition-all shrink-0"
            >
              {gpsLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري تحديد إحداثياتك...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  تحديد موقعي الآن
                </>
              )}
            </button>
          </div>

          {gpsError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{gpsError}</span>
            </div>
          )}

          {/* Search Bar for Cities & Villages */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن اسم قريتك أو مدينتك أو مركزك في أي محافظة..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                مسح
              </button>
            )}
          </div>

          {/* Search Results Mode */}
          {searchResults ? (
            <div className="space-y-2">
              <h5 className="font-bold text-xs text-slate-600 dark:text-slate-400">
                نتائج البحث ({searchResults.length} منطقة/قرية):
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <div className="col-span-2 py-8 text-center text-xs text-slate-400">
                    لم نجد قرية أو منطقة مطابقة لهذا الاسم. يمكنك اختيار المحافظة والمنطقة يدوياً من القائمة.
                  </div>
                ) : (
                  searchResults.map((res, idx) => (
                    <button
                      key={idx}
                      onClick={() => updateLocation(res.govName, res.districtName)}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-right hover:border-emerald-500 transition-all flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {res.districtName}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          محافظة {res.govName}
                        </span>
                      </div>
                      <Map className="w-4 h-4 text-emerald-600" />
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Governorate Tabs + District Selection */
            <div className="space-y-4">
              {/* Governorates Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  اختر المحافظة (27 محافظة):
                </label>
                <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
                  {egyptGovernorates.map((gov) => (
                    <button
                      key={gov.id}
                      onClick={() => setActiveGov(gov.nameAr)}
                      className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        activeGov === gov.nameAr
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {gov.nameAr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Districts & Villages Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                  <span>المدن والمراكز والقرى في {activeGov} ({currentGov.districts.length}):</span>
                  <span className="text-[11px] text-emerald-600 font-normal">
                    تغطية كاملة وتوصيل سريع
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1">
                  {currentGov.districts.map((dist) => {
                    const isCurrent =
                      selectedGovernorate === activeGov &&
                      selectedDistrict === dist;
                    return (
                      <button
                        key={dist}
                        onClick={() => updateLocation(activeGov, dist)}
                        className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold border transition-all text-right ${
                          isCurrent
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
                        }`}
                      >
                        <span className="truncate">{dist}</span>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mr-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <Building2 className="w-4 h-4" />
            <span>موقعك الحالي: <strong>{selectedGovernorate} - {selectedDistrict}</strong></span>
          </div>
          <button
            onClick={() => setIsLocationModalOpen(false)}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold hover:bg-slate-300 text-slate-800 dark:text-slate-200 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
