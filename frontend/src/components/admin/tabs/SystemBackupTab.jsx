import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Cloud,
  HardDrive,
  Download,
  RotateCcw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  ShieldAlert,
  FileArchive,
  Lock,
  Upload,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

export const SystemBackupTab = () => {
  const { user } = useAuth();

  // Data states
  const [loading, setLoading] = useState(true);
  const [backups, setBackups] = useState([]);
  const [driveBackups, setDriveBackups] = useState([]);
  const [lastBackupAt, setLastBackupAt] = useState(null);

  // Configuration form state
  const [config, setConfig] = useState({
    autoBackupEnabled: true,
    autoBackupIntervalHours: 24,
    googleDriveEnabled: false,
    googleDriveFolderId: '',
    googleDriveServiceAccountJson: '',
    googleDriveKeepCount: 10,
    hasGoogleDriveCredentials: false,
  });

  // Action states
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isTestingDrive, setIsTestingDrive] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Restore Modal State
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreFile, setRestoreFile] = useState(null);
  const [selectedExistingBackup, setSelectedExistingBackup] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Factory Reset Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmationCode, setResetConfirmationCode] = useState('');
  const [createSafetyBackup, setCreateSafetyBackup] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  const fileInputRef = useRef(null);

  // Load initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [configData, listData] = await Promise.all([
        api.getBackupConfig().catch(() => null),
        api.listBackups().catch(() => ({ localBackups: [], driveBackups: [] })),
      ]);

      if (configData) {
        setConfig((prev) => ({
          ...prev,
          ...configData,
          googleDriveServiceAccountJson: '', // keep hidden unless entering new
        }));
        if (configData.lastBackupAt) setLastBackupAt(configData.lastBackupAt);
      }

      if (listData) {
        setBackups(listData.localBackups || []);
        setDriveBackups(listData.driveBackups || []);
        if (listData.lastBackupAt) setLastBackupAt(listData.lastBackupAt);
      }
    } catch (err) {
      console.error('Error fetching backup data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save Configuration
  const handleSaveConfig = async (e) => {
    if (e) e.preventDefault();
    setIsSavingConfig(true);
    try {
      const payload = {
        autoBackupEnabled: config.autoBackupEnabled,
        autoBackupIntervalHours: Number(config.autoBackupIntervalHours),
        googleDriveEnabled: config.googleDriveEnabled,
        googleDriveFolderId: config.googleDriveFolderId,
        googleDriveKeepCount: Number(config.googleDriveKeepCount),
      };
      if (config.googleDriveServiceAccountJson.trim()) {
        payload.googleDriveServiceAccountJson = config.googleDriveServiceAccountJson.trim();
      }

      await api.saveBackupConfig(payload);
      alert('تم حفظ إعدادات النسخ الاحتياطي السحابي والجدولة بنجاح!');
      fetchData();
    } catch (err) {
      alert('فشل حفظ الإعدادات: ' + err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Test Google Drive
  const handleTestDrive = async () => {
    setIsTestingDrive(true);
    setTestResult(null);
    try {
      const res = await api.testGoogleDriveConnection(
        config.googleDriveServiceAccountJson.trim() || undefined,
        config.googleDriveFolderId.trim() || undefined,
      );
      setTestResult(res);
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || 'فشل الاتصال بـ Google Drive',
      });
    } finally {
      setIsTestingDrive(false);
    }
  };

  // Create Instant Backup
  const handleCreateBackup = async () => {
    if (!window.confirm('هل تود إنشاء نسخة احتياطية شاملة الآن لكافة الجداول والملفات؟')) return;
    setIsCreatingBackup(true);
    try {
      const res = await api.createBackup(config.googleDriveEnabled);
      alert(`تم إنشاء النسخة بنجاح! (${(res.backup.sizeBytes / (1024 * 1024)).toFixed(2)} MB)`);
      fetchData();
    } catch (err) {
      alert('فشل إنشاء النسخة الاحتياطية: ' + err.message);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Delete Backup
  const handleDeleteBackup = async (filename) => {
    if (!window.confirm(`هل أنت متأكد من حذف النسخة الاحتياطية "${filename}"؟`)) return;
    try {
      await api.deleteBackup(filename);
      fetchData();
    } catch (err) {
      alert('فشل حذف النسخة: ' + err.message);
    }
  };

  // Execute Restore
  const handleExecuteRestore = async () => {
    if (!restoreFile && !selectedExistingBackup) {
      alert('يرجى اختيار ملف النسخة الاحتياطية أولاً');
      return;
    }

    const confirmMsg =
      'تحذير هام جداً: استعادة النسخة الاحتياطية ستقوم باستبدال البيانات الحالية بالبيانات الموجودة في الأرشيف المختار. هل تود الاستمرار؟';
    if (!window.confirm(confirmMsg)) return;

    setIsRestoring(true);
    try {
      if (restoreFile) {
        await api.restoreBackup(restoreFile);
      } else {
        await api.restoreBackup(null, selectedExistingBackup.filename);
      }
      alert('تم استعادة بيانات المنصة بالكامل بنجاح 100%! سيتم إعادة تحميل الصفحة الآن.');
      setIsRestoreModalOpen(false);
      window.location.reload();
    } catch (err) {
      alert('فشل استعادة النسخة الاحتياطية: ' + err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  // Execute Factory Reset
  const handleExecuteReset = async () => {
    if (!resetPassword) {
      alert('يرجى إدخال كلمة مرور الأدمن الحالية');
      return;
    }
    if (resetConfirmationCode.trim() !== 'مسح-كافة-البيانات' && resetConfirmationCode.trim() !== 'RESET-ALL-DATA') {
      alert('يرجى كتابة عبارة التأكيد "مسح-كافة-البيانات" بالضبط لتأكيد العملية.');
      return;
    }

    setIsResetting(true);
    try {
      const res = await api.factoryResetSystem(
        resetPassword,
        resetConfirmationCode.trim(),
        createSafetyBackup,
      );
      alert(res.message || 'تم تصفير الموقع بنجاح!');
      setIsResetModalOpen(false);
      window.location.reload();
    } catch (err) {
      alert('فشل تصفير الموقع: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8 font-cairo">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                إدارة النسخ الاحتياطي والمزامنة السحابية وأمان النظام
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                نسخ شامل لقاعدة البيانات والصور والروشتات، والرفع التلقائي على Google Drive، وإعادة ضبط المصنع
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => setIsRestoreModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>استعادة نسخة سابقة</span>
          </button>

          <button
            onClick={handleCreateBackup}
            disabled={isCreatingBackup}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isCreatingBackup ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isCreatingBackup ? 'جارٍ النسخ الآن...' : 'أخذ نسخة احتياطية شاملة'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Stats & Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Google Drive Status */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              config.googleDriveEnabled && config.hasGoogleDriveCredentials
                ? 'bg-emerald-500/10 text-emerald-600'
                : 'bg-amber-500/10 text-amber-500'
            }`}
          >
            <Cloud className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold text-slate-400 block">حالة Google Drive</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  config.googleDriveEnabled && config.hasGoogleDriveCredentials
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-amber-500'
                }`}
              />
              <span className="text-sm font-black text-slate-900 dark:text-white truncate">
                {config.googleDriveEnabled && config.hasGoogleDriveCredentials
                  ? 'مفعل ومزامن سحابياً'
                  : config.hasGoogleDriveCredentials
                  ? 'تم إدخال المفاتيح (معطل)'
                  : 'غير مفعل بعد'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {driveBackups.length > 0 ? `${driveBackups.length} نسخة على الدرايف` : 'لا توجد نسخ سحابية'}
            </span>
          </div>
        </div>

        {/* Auto Backup Schedule */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold text-slate-400 block">الجدولة التلقائية</span>
            <span className="text-sm font-black text-slate-900 dark:text-white block mt-0.5">
              {config.autoBackupEnabled
                ? `تعمل كل ${config.autoBackupIntervalHours} ساعة`
                : 'النسخ التلقائي متوقف'}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {config.autoBackupEnabled ? 'تُنفذ تلقائياً طالما السيرفر متصل' : 'النسخ يدوي فقط'}
            </span>
          </div>
        </div>

        {/* Last Backup & Local Storage */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <HardDrive className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold text-slate-400 block">آخر نسخة تم أخذها</span>
            <span className="text-sm font-black text-slate-900 dark:text-white block mt-0.5 truncate">
              {lastBackupAt
                ? new Date(lastBackupAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })
                : 'لم يتم النسخ بعد'}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {backups.length} نسخة محلية على السيرفر
            </span>
          </div>
        </div>
      </div>

      {/* 3. Google Drive Configuration Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                إعدادات الربط السحابي مع Google Drive
              </h2>
              <p className="text-xs text-slate-500">
                الربط التلقائي عبر Google Cloud Service Account لرفع النسخ الاحتياطية دورياً
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={config.googleDriveEnabled}
              onChange={(e) => setConfig({ ...config, googleDriveEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600 relative" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {config.googleDriveEnabled ? 'مفعل' : 'معطل'}
            </span>
          </label>
        </div>

        {/* Quick Instructions Banner */}
        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300 space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <Info className="w-4 h-4 shrink-0" />
            <span>طريقة ربط Google Drive مجاناً في دقيقتين:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 pr-2 text-[11px] leading-relaxed text-blue-700 dark:text-blue-300/80">
            <li>أنشئ مجلداً جديداً على Google Drive (مثلاً باسم <code>Chefaa-Backups</code>).</li>
            <li>انسخ الـ <strong>Folder ID</strong> من رابط المجلد في المتصفح وضعه في الحقل بالأسفل.</li>
            <li>
              أنشئ <strong>Service Account</strong> في Google Cloud Console وحمّل مفتاح الـ JSON وضعه
              في خانة المفتاح.
            </li>
            <li>
              شارك المجلد على Google Drive مع البريد الإلكتروني الخاص بالـ Service Account (بصلاحية
              Editor).
            </li>
          </ol>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                معرّف مجلد Google Drive (Folder ID)
              </label>
              <input
                type="text"
                value={config.googleDriveFolderId}
                onChange={(e) => setConfig({ ...config, googleDriveFolderId: e.target.value })}
                placeholder="مثال: 1a2B3c4D5e6F7g8H9i..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                الاحتفاظ بآخر (X) نسخ على الدرايف (Retention)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={config.googleDriveKeepCount}
                onChange={(e) => setConfig({ ...config, googleDriveKeepCount: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                مفتاح حساب الخدمة (Service Account JSON)
              </label>
              {config.hasGoogleDriveCredentials && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                  ✓ المفتاح مسجل حالياً بالسيرفر
                </span>
              )}
            </div>
            <textarea
              rows="3"
              value={config.googleDriveServiceAccountJson}
              onChange={(e) =>
                setConfig({ ...config, googleDriveServiceAccountJson: e.target.value })
              }
              placeholder={
                config.hasGoogleDriveCredentials
                  ? 'المفتاح مسجل مسبقاً بنجاح. الصق هنا فقط إذا كنت تود تغييره أو تحديثه...'
                  : 'الصق محتويات ملف JSON الخاص بـ Service Account هنا...'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 custom-scrollbar"
            />
          </div>

          {/* Test connection result banner */}
          {testResult && (
            <div
              className={`p-3.5 rounded-2xl flex items-center gap-3 text-xs font-bold ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300 border border-red-200 dark:border-red-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              ) : (
                <XCircle className="w-5 h-5 shrink-0 text-red-600" />
              )}
              <div className="flex-1">
                <span>{testResult.message}</span>
                {testResult.email && (
                  <span className="block text-[10px] font-mono text-slate-500 mt-0.5">
                    البريد: {testResult.email}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleTestDrive}
              disabled={isTestingDrive}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              {isTestingDrive ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              )}
              <span>{isTestingDrive ? 'جارٍ الفحص...' : 'فحص الاتصال بـ Google Drive'}</span>
            </button>

            <button
              type="submit"
              disabled={isSavingConfig}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{isSavingConfig ? 'جارٍ الحفظ...' : 'حفظ إعدادات Google Drive'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. Automated Schedule Configuration Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                الجدولة التلقائية للنسخ الاحتياطي (Auto-Backup Scheduler)
              </h2>
              <p className="text-xs text-slate-500">
                يقوم السيرفر بإنشاء النسخة الشاملة ورفعها تلقائياً للسحابة دون أي تدخل منك
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={config.autoBackupEnabled}
              onChange={(e) => setConfig({ ...config, autoBackupEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600 relative" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {config.autoBackupEnabled ? 'مفعل' : 'معطل'}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {[
            { hours: 6, label: 'كل 6 ساعات' },
            { hours: 12, label: 'كل 12 ساعة' },
            { hours: 24, label: 'يومياً (كل 24 ساعة) - موصى به' },
            { hours: 168, label: 'أسبوعياً (كل 7 أيام)' },
          ].map((item) => (
            <button
              key={item.hours}
              type="button"
              onClick={() => setConfig({ ...config, autoBackupIntervalHours: item.hours })}
              className={`px-4 py-3 rounded-2xl border text-xs font-bold text-right transition-all cursor-pointer ${
                config.autoBackupIntervalHours === item.hours
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-black ring-2 ring-purple-600/20'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Backup History List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <FileArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                سجل النسخ الاحتياطية المتوفرة ({backups.length})
              </h2>
              <p className="text-xs text-slate-500">
                يمكنك تحميل أي نسخة لجهازك أو استعادتها بضغطة زر
              </p>
            </div>
          </div>

          <button
            onClick={fetchData}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="تحديث السجل"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {backups.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <FileArchive className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
              لا توجد نسخ احتياطية محفوظة محلياً بعد
            </p>
            <p className="text-xs text-slate-400 mt-1">
              اضغط على "أخذ نسخة احتياطية شاملة" بالأعلى لإنشاء أول نقطة حفظ للموقع.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                  <th className="py-3 px-4">اسم الملف</th>
                  <th className="py-3 px-4">تاريخ الإنشاء</th>
                  <th className="py-3 px-4">الحجم</th>
                  <th className="py-3 px-4">النطاق</th>
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {backups.map((bk) => (
                  <tr
                    key={bk.filename}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <FileArchive className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate max-w-xs">{bk.filename}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {new Date(bk.createdAt).toLocaleString('ar-EG')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300 font-mono">
                      {formatBytes(bk.sizeBytes)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                        قاعدة بيانات + صور وروشتات
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <a
                          href={api.downloadBackupUrl(bk.filename)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                          title="تحميل إلى جهازك"
                        >
                          <Download className="w-4 h-4" />
                        </a>

                        <button
                          onClick={() => {
                            setSelectedExistingBackup(bk);
                            setRestoreFile(null);
                            setIsRestoreModalOpen(true);
                          }}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
                          title="استعادة هذه النسخة"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteBackup(bk.filename)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                          title="حذف النسخة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. High Security Danger Zone: Factory Reset (تصفير ومسح الموقع) */}
      <div className="bg-gradient-to-br from-red-500/5 via-red-500/10 to-transparent dark:from-red-950/40 dark:via-red-950/20 rounded-3xl border-2 border-red-500/30 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-red-600 dark:text-red-400">
                  منطقة الخطر الأمني: إعادة ضبط المصنع (Factory Reset)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                تصفير ومسح شامل لكافة بيانات الموقع نهائياً (الطلبات، الروشتات، اشتراكات الأدوية، المنتجات،
                والعملاء، وملفات الرفع). سيتم الإبقاء فقط على حسابك كمدير للمنصة لتتمكن من الدخول فوراً.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setResetPassword('');
              setResetConfirmationCode('');
              setIsResetModalOpen(true);
            }}
            className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-lg shadow-red-600/30 transition-all cursor-pointer shrink-0"
          >
            بدء تصفير الموقع ومسح كافة البيانات
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* Restore Backup Modal */}
      {/* ---------------------------------------------------- */}
      {isRestoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-base">
                <RotateCcw className="w-5 h-5 text-blue-600" />
                <span>استعادة نسخة احتياطية سابقة</span>
              </div>
              <button
                onClick={() => setIsRestoreModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {selectedExistingBackup ? (
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300 space-y-1">
                <span className="font-bold block">النسخة المختارة للاستعادة:</span>
                <span className="font-mono font-black text-sm block">
                  {selectedExistingBackup.filename}
                </span>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 block">
                  الحجم: {formatBytes(selectedExistingBackup.sizeBytes)} • التاريخ:{' '}
                  {new Date(selectedExistingBackup.createdAt).toLocaleString('ar-EG')}
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  اختر أو اسحب ملف النسخة الاحتياطية (ملف <code>.chefaabak</code> أو <code>.zip</code>):
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition-colors"
                >
                  <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    {restoreFile ? restoreFile.name : 'اضغط لاختيار ملف النسخة من جهازك'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {restoreFile ? formatBytes(restoreFile.size) : 'الملفات المدعومة: .chefaabak, .zip'}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".chefaabak,.zip"
                    onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            <div className="bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>تنبيه هام:</strong> ستؤدي الاستعادة لاستبدال جميع البيانات الحالية بما في ذلك
                المنتجات والطلبات وملفات الصور بما يتوافق مع الأرشيف المختار.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsRestoreModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={isRestoring || (!restoreFile && !selectedExistingBackup)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-lg shadow-blue-600/20 cursor-pointer disabled:opacity-50"
              >
                {isRestoring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                <span>{isRestoring ? 'جارٍ الاستعادة...' : 'تأكيد الاستعادة الآن'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* Factory Reset Modal (Triple Security Confirmation) */}
      {/* ---------------------------------------------------- */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-red-500 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-red-100 dark:border-red-950/80">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-black text-base">
                <ShieldAlert className="w-5 h-5" />
                <span>تأكيد إعادة ضبط المصنع وتصفير الموقع</span>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-red-50 dark:bg-red-950/50 p-4 rounded-2xl border border-red-200 dark:border-red-900 text-xs text-red-800 dark:text-red-300 space-y-2">
              <span className="font-black text-sm block">⚠️ تحذير شديد الأهمية ولا رجعة فيه:</span>
              <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
                <li>سيتم حذف كافة سجلات الطلبات والروشتات واشتراكات الأدوية.</li>
                <li>سيتم حذف كافة المنتجات، الأقسام، الكوبونات، المقالات، والبانرات.</li>
                <li>سيتم تفريغ وحذف جميع الصور والملفات المرفوعة.</li>
                <li>سيتم حذف حسابات العملاء والطاقم، مع <strong>الإبقاء فقط على حسابك كمدير</strong>.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  1. كلمة مرور الأدمن الحالية (لتأكيد الهوية)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الخاصة بحسابك..."
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  2. اكتب عبارة التأكيد <span className="text-red-600 font-mono font-black">مسح-كافة-البيانات</span> بالضبط:
                </label>
                <input
                  type="text"
                  value={resetConfirmationCode}
                  onChange={(e) => setResetConfirmationCode(e.target.value)}
                  placeholder="مسح-كافة-البيانات"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 text-xs font-bold text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono text-center tracking-wider"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={createSafetyBackup}
                  onChange={(e) => setCreateSafetyBackup(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
                />
                <span>أخذ نسخة احتياطية طارئة تلقائياً قبل الحذف وحفظها (موصى به)</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                disabled={
                  isResetting ||
                  !resetPassword ||
                  resetConfirmationCode.trim() !== 'مسح-كافة-البيانات'
                }
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-lg shadow-red-600/30 cursor-pointer disabled:opacity-50"
              >
                {isResetting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{isResetting ? 'جارٍ مسح كافة البيانات...' : 'تأكيد تصفير الموقع نهائياً'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
