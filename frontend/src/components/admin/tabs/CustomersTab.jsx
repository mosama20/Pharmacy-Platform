import React, { useState } from 'react';
import { ShieldCheck, Search, Phone, Mail, MapPin, User, ShoppingBag } from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { EmptyState } from '../common/EmptyState';

export const CustomersTab = ({ customers = [] }) => {
  const [search, setSearch] = useState('');

  const filtered = customers.filter(
    (c) =>
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-cairo">
      <PageHeader
        title="دليل وسجلات العملاء"
        description="بيانات المرضى والعملاء المسجلين، العناوين المحفوظة، وسجلات الطلبات"
        badge={`${customers.length} عميل`}
      />

      <div className="flex justify-end">
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            placeholder="ابحث باسم العميل، الهاتف، أو البريد..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-xs"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="لا يوجد عملاء مطابقون"
          description="لم نتمكن من العثور على أي عميل مطابق لبيانات البحث المدخلة."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="p-4">العميل</th>
                  <th className="p-4">رقم الهاتف</th>
                  <th className="p-4">البريد الإلكتروني</th>
                  <th className="p-4">المدينة / العنوان</th>
                  <th className="p-4">تاريخ التسجيل</th>
                  <th className="p-4 text-left">التواصل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((cust) => (
                  <tr
                    key={cust.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-sm shrink-0">
                          {cust.name?.charAt(0) || 'ع'}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {cust.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            ID: {cust.id.slice(-6)}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {cust.phone || '—'}
                    </td>

                    <td className="p-4 text-slate-500 dark:text-slate-400 font-mono">
                      {cust.email || '—'}
                    </td>

                    <td className="p-4 text-slate-700 dark:text-slate-300">
                      {cust.address || cust.city || 'القاهرة، مصر'}
                    </td>

                    <td className="p-4 text-slate-400">
                      {new Date(cust.createdAt || Date.now()).toLocaleDateString('ar-EG')}
                    </td>

                    <td className="p-4 text-left">
                      {cust.phone && (
                        <a
                          href={`tel:${cust.phone}`}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold inline-flex items-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>اتصال</span>
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
