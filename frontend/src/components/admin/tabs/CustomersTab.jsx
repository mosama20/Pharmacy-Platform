import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Phone,
  Mail,
  MapPin,
  User,
  ShoppingBag,
  Shield,
  Stethoscope,
  Truck,
  Headphones,
  UserCheck,
  UserX,
  KeyRound,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  X,
  Lock,
  RefreshCw,
  Coins,
  Award,
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { EmptyState } from '../common/EmptyState';
import { api } from '../../../services/api';

export const CustomersTab = ({
  customers = [],
  allUsers = [],
  onRefreshUsers,
}) => {
  // Use allUsers if available, otherwise fallback to customers
  const usersList = allUsers && allUsers.length > 0 ? allUsers : customers;

  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Modal states
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [newSelectedRole, setNewSelectedRole] = useState('CUSTOMER');

  const [passwordModalUser, setPasswordModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  // Points Modal states
  const [pointsModalUser, setPointsModalUser] = useState(null);
  const [pointsInputValue, setPointsInputValue] = useState(0);
  const [pointsReason, setPointsReason] = useState('');
  const [pointsSuccessMsg, setPointsSuccessMsg] = useState('');
  const [pointsErrorMsg, setPointsErrorMsg] = useState('');

  // Stats calculation
  const stats = useMemo(() => {
    const total = usersList.length;
    const active = usersList.filter((u) => u.status === 'ACTIVE').length;
    const suspended = usersList.filter((u) => u.status === 'SUSPENDED').length;
    const customersCount = usersList.filter((u) => u.role === 'CUSTOMER').length;
    const staffCount = usersList.filter((u) => u.role !== 'CUSTOMER').length;
    return { total, active, suspended, customersCount, staffCount };
  }, [usersList]);

  // Filtered users list
  const filtered = useMemo(() => {
    return usersList.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matches =
          u.name?.toLowerCase().includes(q) ||
          u.phone?.includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.id?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [usersList, roleFilter, statusFilter, search]);

  // Actions
  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const confirmText =
      newStatus === 'SUSPENDED'
        ? `هل أنت متأكد من تجميد وتعليق حساب (${user.name})؟ لن يتمكن من تسجيل الدخول أو استخدام المنصة.`
        : `هل ترغب في إعادة تنشيط وتفعيل حساب (${user.name})؟`;

    if (!window.confirm(confirmText)) return;

    setActionLoadingId(user.id);
    try {
      await api.updateCustomerStatus(user.id, newStatus);
      if (onRefreshUsers) await onRefreshUsers();
    } catch (err) {
      alert('خطأ في تعديل الحالة: ' + (err.message || 'فشل التحديث'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenRoleModal = (user) => {
    setRoleModalUser(user);
    setNewSelectedRole(user.role);
  };

  const handleSaveRole = async () => {
    if (!roleModalUser) return;
    setActionLoadingId(roleModalUser.id);
    try {
      await api.updateUserRole(roleModalUser.id, newSelectedRole);
      setRoleModalUser(null);
      if (onRefreshUsers) await onRefreshUsers();
    } catch (err) {
      alert('خطأ في تغيير الصلاحية: ' + (err.message || 'فشل التحديث'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenPasswordModal = (user) => {
    setPasswordModalUser(user);
    setNewPassword('');
    setPasswordSuccessMsg('');
    setPasswordErrorMsg('');
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!passwordModalUser || !newPassword || newPassword.length < 6) {
      setPasswordErrorMsg('كلمة المرور يجب أن تتكون من 6 خانات على الأقل');
      return;
    }

    setActionLoadingId(passwordModalUser.id);
    setPasswordErrorMsg('');
    setPasswordSuccessMsg('');

    try {
      await api.resetUserPassword(passwordModalUser.id, newPassword);
      setPasswordSuccessMsg('تم تحديث كلمة المرور بنجاح!');
      setTimeout(() => {
        setPasswordModalUser(null);
      }, 1200);
    } catch (err) {
      setPasswordErrorMsg(err.message || 'فشل إعادة تعيين كلمة المرور');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenPointsModal = (user) => {
    setPointsModalUser(user);
    setPointsInputValue(user.points !== undefined ? user.points : 0);
    setPointsReason('');
    setPointsSuccessMsg('');
    setPointsErrorMsg('');
  };

  const handleSavePoints = async (e) => {
    e.preventDefault();
    if (!pointsModalUser) return;
    const num = Number(pointsInputValue);
    if (isNaN(num) || num < 0) {
      setPointsErrorMsg('يرجى إدخال عدد نقاط صحيح وموجب');
      return;
    }

    setActionLoadingId(pointsModalUser.id);
    setPointsErrorMsg('');
    setPointsSuccessMsg('');

    try {
      await api.updateUserPoints(pointsModalUser.id, num, pointsReason);
      setPointsSuccessMsg('تم تحديث رصيد النقاط بنجاح!');
      if (onRefreshUsers) await onRefreshUsers();
      setTimeout(() => {
        setPointsModalUser(null);
      }, 1100);
    } catch (err) {
      setPointsErrorMsg(err.message || 'فشل تحديث رصيد النقاط');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (user) => {
    if (
      !window.confirm(
        `⚠️ تحذير نهائي: هل تريد حقاً حذف حساب (${user.name}) بشكل نهائي من قاعدة البيانات؟`
      )
    ) {
      return;
    }

    setActionLoadingId(user.id);
    try {
      await api.deleteUser(user.id);
      if (onRefreshUsers) await onRefreshUsers();
    } catch (err) {
      alert('خطأ في حذف الحساب: ' + (err.message || 'فشل الحذف'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return {
          label: 'مدير عام (Admin)',
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          icon: Shield,
        };
      case 'PHARMACIST':
        return {
          label: 'د. صيدلي (Pharmacist)',
          color: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800',
          icon: Stethoscope,
        };
      case 'DELIVERY':
        return {
          label: 'كابتن توصيل (Courier)',
          color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          icon: Truck,
        };
      case 'SUPPORT':
        return {
          label: 'خدمة عملاء (Support)',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          icon: Headphones,
        };
      default:
        return {
          label: 'عميل / مريض (Customer)',
          color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          icon: User,
        };
    }
  };

  return (
    <div className="space-y-6 font-cairo">
      {/* Header */}
      <PageHeader
        title="مركز إدارة الحسابات والتحكم الأمني"
        description="التحكم الشامل في حسابات المنظومة: تنشيط، تعليق الحسابات، تغيير الصلاحيات، وإعادة تعيين كلمات المرور"
        badge={`${usersList.length} مستخدم`}
      >
        <button
          onClick={onRefreshUsers}
          className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>تحديث السجلات</span>
        </button>
      </PageHeader>

      {/* Quick KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-500 block">إجمالي الحسابات</span>
          <span className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1 block">
            {stats.total}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/30 shadow-xs">
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-bold">
            حسابات نشطة
          </span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
            {stats.active}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-red-500/30 shadow-xs">
          <span className="text-[11px] text-red-600 dark:text-red-400 block font-bold">
            حسابات معلقة (موقوفة)
          </span>
          <span className="text-xl font-black text-red-600 dark:text-red-400 font-mono mt-1 block">
            {stats.suspended}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-500 block">العملاء والمرضى</span>
          <span className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1 block">
            {stats.customersCount}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-purple-500/30 shadow-xs">
          <span className="text-[11px] text-purple-600 dark:text-purple-400 block font-bold">
            الكادر الطبي والإداري
          </span>
          <span className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono mt-1 block">
            {stats.staffCount}
          </span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        {/* Role Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          {[
            { id: 'ALL', label: 'الكل' },
            { id: 'CUSTOMER', label: 'العملاء' },
            { id: 'PHARMACIST', label: 'الصيادلة' },
            { id: 'DELIVERY', label: 'المناديب' },
            { id: 'ADMIN', label: 'المدراء' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                roleFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 font-bold focus:outline-none"
          >
            <option value="ALL">جميع الحالات</option>
            <option value="ACTIVE">النشطة فقط</option>
            <option value="SUSPENDED">المعلقة فقط</option>
          </select>

          {/* Search Input */}
          <div className="relative min-w-[240px] flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="ابحث بالاسم، الهاتف، أو البريد..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-9 pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="لا توجد حسابات مطابقة"
          description="لم نتمكن من العثور على أي حساب يطابق معايير الفلترة والبحث المدخلة."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="p-4">صاحب الحساب</th>
                  <th className="p-4">بيانات الاتصال</th>
                  <th className="p-4">الرتبة والصلاحية</th>
                  <th className="p-4">نقاط الولاء</th>
                  <th className="p-4">حالة الحساب</th>
                  <th className="p-4">المدينة / العنوان</th>
                  <th className="p-4">تاريخ الإنشاء</th>
                  <th className="p-4 text-center">التحكم والإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((u) => {
                  const roleBadge = getRoleBadge(u.role);
                  const RoleIcon = roleBadge.icon;
                  const isSuspended = u.status === 'SUSPENDED';

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${
                        isSuspended ? 'bg-red-500/5' : ''
                      }`}
                    >
                      {/* User Identity */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                              isSuspended
                                ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {u.name?.charAt(0) || 'م'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {u.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              ID: {u.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="p-4">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block">
                          {u.phone || '—'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono block truncate max-w-[160px]">
                          {u.email || '—'}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${roleBadge.color}`}
                        >
                          <RoleIcon className="w-3.5 h-3.5" />
                          <span>{roleBadge.label}</span>
                        </span>
                      </td>

                      {/* Loyalty Points */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-mono font-black text-xs border border-amber-200/60 dark:border-amber-800/60 shadow-xs">
                            <Coins className="w-3.5 h-3.5 text-amber-500" />
                            <span>{u.points !== undefined ? u.points : 0}</span>
                            <span className="text-[10px] font-normal text-amber-600/70">نقطة</span>
                          </span>
                          <button
                            onClick={() => handleOpenPointsModal(u)}
                            title="تعديل رصيد النقاط"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {isSuspended ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-[10px] font-black border border-red-200 dark:border-red-900/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            <span>موقوف / معلق</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-black border border-emerald-200 dark:border-emerald-900/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>نشط ومعتمد</span>
                          </span>
                        )}
                      </td>

                      {/* City */}
                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        {u.city || u.address || 'القاهرة، مصر'}
                      </td>

                      {/* Date */}
                      <td className="p-4 text-slate-400 text-[11px]">
                        {new Date(u.createdAt || Date.now()).toLocaleDateString('ar-EG')}
                      </td>

                      {/* Admin Action Controls */}
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                          {/* Toggle Active / Suspend */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={actionLoadingId === u.id}
                            title={isSuspended ? 'تفعيل الحساب' : 'تعليق وتجميد الحساب'}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isSuspended
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                            }`}
                          >
                            {isSuspended ? (
                              <UserCheck className="w-4 h-4" />
                            ) : (
                              <UserX className="w-4 h-4" />
                            )}
                          </button>

                          {/* Change Role */}
                          <button
                            onClick={() => handleOpenRoleModal(u)}
                            title="تعديل الصلاحية والرتبة"
                            className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-all cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Adjust Loyalty Points */}
                          <button
                            onClick={() => handleOpenPointsModal(u)}
                            title="تعديل رصيد نقاط الولاء"
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all cursor-pointer"
                          >
                            <Coins className="w-4 h-4" />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => handleOpenPasswordModal(u)}
                            title="إعادة تعيين كلمة المرور"
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all cursor-pointer"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteUser(u)}
                            title="حذف الحساب نهائياً"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Change Role Modal */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                تعديل رتبة وصلاحية الحساب
              </h3>
              <button
                onClick={() => setRoleModalUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              تحديد الصلاحيات الممنوحة للمستخدم <strong>({roleModalUser.name})</strong>:
            </p>

            <div className="space-y-2">
              {[
                {
                  id: 'ADMIN',
                  label: 'مدير النظام (Admin)',
                  desc: 'كامل الصلاحيات وإدارة المنظومة',
                },
                {
                  id: 'PHARMACIST',
                  label: 'صيدلي مراجع (Pharmacist)',
                  desc: 'مراجعة الروشتات، تحضير الأدوية وتسعيرها',
                },
                {
                  id: 'DELIVERY',
                  label: 'كابتن توصيل (Courier)',
                  desc: 'مهام الشحن واستلام الطلبات والتحصيل',
                },
                {
                  id: 'SUPPORT',
                  label: 'خدمة العملاء (Support)',
                  desc: 'متابعة الطلبات وتواصل المرضى',
                },
                {
                  id: 'CUSTOMER',
                  label: 'عميل / مريض (Customer)',
                  desc: 'تصفح المتجر وطلب الأدوية فقط',
                },
              ].map((roleOption) => (
                <label
                  key={roleOption.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    newSelectedRole === roleOption.id
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="roleSelection"
                    checked={newSelectedRole === roleOption.id}
                    onChange={() => setNewSelectedRole(roleOption.id)}
                    className="mt-1 text-emerald-600"
                  />
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      {roleOption.label}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {roleOption.desc}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveRole}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                تأكيد التعديل
              </button>
              <button
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Reset Password Modal */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSavePassword}
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl text-right animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  إعادة تعيين كلمة المرور
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              تعيين كلمة مرور جديدة لحساب <strong>({passwordModalUser.name})</strong>:
            </p>

            {passwordSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                {passwordSuccessMsg}
              </div>
            )}

            {passwordErrorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold">
                {passwordErrorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                كلمة المرور الجديدة
              </label>
              <input
                type="text"
                dir="ltr"
                required
                placeholder="أدخل 6 خانات على الأقل..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <span className="text-[10px] text-slate-400 block">
                سيتم تشفير كلمة المرور فورياً بـ BCrypt وتحديثها في قاعدة البيانات.
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                حفظ كلمة المرور
              </button>
              <button
                type="button"
                onClick={() => setPasswordModalUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 3: Loyalty Points Adjustment Modal */}
      {pointsModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSavePoints}
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl text-right animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                  <Coins className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  تعديل رصيد نقاط العميل
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPointsModalUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">العميل:</span>
                <span className="font-bold text-slate-900 dark:text-white">{pointsModalUser.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">الرصيد الحالي:</span>
                <span className="font-mono font-black text-amber-600 dark:text-amber-400">{pointsModalUser.points || 0} نقطة</span>
              </div>
            </div>

            {pointsSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{pointsSuccessMsg}</span>
              </div>
            )}

            {pointsErrorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{pointsErrorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                الرصيد الجديد للنقاط
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  required
                  value={pointsInputValue}
                  onChange={(e) => setPointsInputValue(e.target.value)}
                  className="w-full pr-3.5 pl-14 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 focus:outline-none focus:border-amber-500"
                />
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">نقطة</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                سبب التعديل / الملاحظة (اختياري)
              </label>
              <input
                type="text"
                placeholder="مثال: مكافأة ولاء، تعويض، تسوية يدوية..."
                value={pointsReason}
                onChange={(e) => setPointsReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-400 block">
                سيتم توثيق هذا الإجراء في سجل الرقابة وتاريخ العمليات (Audit Log).
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={actionLoadingId === pointsModalUser.id}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {actionLoadingId === pointsModalUser.id ? 'جاري الحفظ...' : 'حفظ الرصيد الجديد'}
              </button>
              <button
                type="button"
                onClick={() => setPointsModalUser(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
