import React from 'react';
import Sidebar from './Sidebar';
import AdminHeader from './AdminHeader';

export default function AdminLayout({ 
  children, 
  searchTerm, 
  onSearchChange, 
  searchPlaceholder 
}) {
  return (
    <div className="admin-root" dir="rtl">
      {/* 1. Header */}
      <AdminHeader 
        searchTerm={searchTerm} 
        onSearchChange={onSearchChange} 
        searchPlaceholder={searchPlaceholder} 
      />

      {/* 2. Sidebar */}
      <Sidebar />

      {/* 3. Main Content Container */}
      <div className="themebody-wrap">
        {children}
      </div>
    </div>
  );
}
