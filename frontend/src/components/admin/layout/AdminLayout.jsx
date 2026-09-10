import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

export const AdminLayout = ({
  activeTab,
  setActiveTab,
  cmsActiveSubTab,
  setCmsActiveSubTab,
  onRefresh,
  loading,
  onBackToStore,
  pendingOrdersCount = 0,
  pendingRxCount = 0,
  pendingInsuranceCount = 0,
  activeDeliveriesCount = 0,
  readyDeliveriesCount = 0,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-cairo transition-colors duration-200">
      {/* 1. Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cmsActiveSubTab={cmsActiveSubTab}
        setCmsActiveSubTab={setCmsActiveSubTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onBackToStore={onBackToStore}
        pendingOrdersCount={pendingOrdersCount}
        pendingRxCount={pendingRxCount}
        pendingInsuranceCount={pendingInsuranceCount}
        activeDeliveriesCount={activeDeliveriesCount}
        readyDeliveriesCount={readyDeliveriesCount}
      />

      {/* 2. Main Wrapper with Dynamic Left/Right Margin for Collapsible Sidebar */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:mr-20' : 'lg:mr-72'
        }`}
      >
        {/* Top Header */}
        <AdminHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          cmsActiveSubTab={cmsActiveSubTab}
          setMobileOpen={setMobileOpen}
          onRefresh={onRefresh}
          loading={loading}
          onBackToStore={onBackToStore}
        />

        {/* Content Container */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
