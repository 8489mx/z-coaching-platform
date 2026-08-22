import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import AdminHeader from './AdminHeader';

export default function AdminLayout({ 
  children, 
  searchTerm, 
  onSearchChange, 
  searchPlaceholder 
}) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('z_sidebar_collapsed');
    if (saved !== null) return saved === 'true';
    return window.innerWidth < 1200;
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1200 && !isCollapsed) {
        setIsCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('z_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div 
      className={`admin-root ${isCollapsed ? 'sidebar-collapsed' : ''}`} 
      dir="rtl"
    >
      {/* 1. Header */}
      <AdminHeader 
        searchTerm={searchTerm} 
        onSearchChange={onSearchChange} 
        searchPlaceholder={searchPlaceholder} 
        isCollapsed={isCollapsed}
        onToggleSidebar={toggleSidebar}
      />

      {/* 2. Sidebar (Always visible: Full 245px or Mini 72px) */}
      <Sidebar 
        isCollapsed={isCollapsed} 
        onToggleSidebar={toggleSidebar} 
      />

      {/* 3. Main Content Container */}
      <div className="themebody-wrap">
        {children}
      </div>
    </div>
  );
}
