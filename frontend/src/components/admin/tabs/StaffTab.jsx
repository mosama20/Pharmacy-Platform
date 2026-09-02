import React from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  Shield,
  Stethoscope,
  Truck,
  Headphones,
  Building,
  Clock,
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { EmptyState } from '../common/EmptyState';

export const StaffTab = ({
  staffList = [],
  onOpenNewStaffModal,
  onDeleteStaff,
}) => {
  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return {
          label: 'مدير النظام (Admin)',
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
          icon: Shield,
        };
      case 'PHARMACIST':
        return {
          label: 'صيدلي مراجع (Pharmacist)',
          color: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
          icon: Stethoscope,
        };
      case 'DELIVERY':
        return {
          label: 'مندوب توصيل (Courier)',
          color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
          icon: Truck,
        };
      case 'SUPPORT':
        return {
          label: 'خدمة العملاء (Support)',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
          icon: Headphones,
        };
      default:
        return {
          label: role,
          color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
          icon: Users,
        };
    }
  };

  return (
    <div className="space-y-6 font-cairo">
      <PageHeader
        title="إدارة حسابات الموظفين والصلاحيات"
        description="التحكم في مستخدمي النظام والصيادلة والمناديب وتوزيع الورديات"
        badge={`${staffList.length} موظف`}
      >
        <button
          onClick={onOpenNewStaffModal}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 inline-flex items-center gap-1.5 cursor-pointer transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>إضافة حساب موظف جديد</span>
        </button>
      </PageHeader>

      {staffList.length === 0 ? (
        <EmptyState
          icon={Users}
          title="لا يوجد موظفون مسجلون"
          description="أضف حسابات الكادر الطبي والتشغيلي لمنحهم الصلاحيات المناسبة."
          actionLabel="إضافة موظف"
          onAction={onOpenNewStaffModal}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="p-4">الموظف</th>
                  <th className="p-4">بيانات الاتصال</th>
                  <th className="p-4">الدور الوظيفي</th>
                  <th className="p-4">الوردية / الشفت</th>
                  <th className="p-4">الفرع / المدينة</th>
                  <th className="p-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {staffList.map((st) => {
                  const badge = getRoleBadge(st.role);
                  const Icon = badge.icon;

                  return (
                    <tr
                      key={st.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Name & Avatar */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-sm shrink-0">
                            {st.name?.charAt(0) || 'م'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {st.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              ID: {st.id.slice(-6)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="p-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        <span className="block">{st.email}</span>
                        <span className="text-slate-400 block mt-0.5">{st.phone}</span>
                      </td>

                      {/* Role Badge */}
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-xl font-bold text-[11px] inline-flex items-center gap-1.5 ${badge.color}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Shift */}
                      <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                        {st.shift || 'صباحي (8 ص - 4 م)'}
                      </td>

                      {/* City */}
                      <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                        {st.city || 'القاهرة'}
                      </td>

                      {/* Delete */}
                      <td className="p-4 text-left">
                        <button
                          onClick={() => onDeleteStaff(st.id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                          title="حذف حساب الموظف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
