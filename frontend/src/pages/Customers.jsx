import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Plus,
  Clock,
  MessageCircle,
  Download,
  ExternalLink,
  X,
  ChevronDown,
  Check,
  RotateCw,
  Filter,
  Target
} from 'lucide-react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import WhatsAppModal from '../components/modals/WhatsAppModal';
import FlexibleRenewalModal from '../components/modals/FlexibleRenewalModal';
import NewClientQuickModal from '../components/modals/NewClientQuickModal';
import { ClientCodeBadge, ClientPackageBadge, getClientTier } from '../utils/tierBadgeHelper';
import { arabicSearchMatch } from '../utils/searchUtils';
import { extractClientFastingProfile } from '../utils/seasonalFastingRadar';
import ClientSlideOverDrawer from '../components/customers/ClientSlideOverDrawer';
import { TableSearch } from '@/shared/components/table-search';
import { TierFilter } from '@/shared/components/tier-filter';
import { RefreshButton } from '@/shared/components/refresh-button';

export default function Customers() {
  const [searchParams] = useSearchParams();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [selectedDrawerClient, setSelectedDrawerClient] = useState(null);
  const searchInputRef = useRef(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL'); // 'ALL' | 'MAX' | 'ELITE'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'FROZEN'
  const [goalFilter, setGoalFilter] = useState('ALL'); // 'ALL' | 'FAT_LOSS' | 'MUSCLE_GAIN' | 'RECOMP' | 'HEALTH'
  
  // Dropdown UI States (Zero Native Dropdowns / Zero Sharp Corners)
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isGoalDropdownOpen, setIsGoalDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);
  const goalDropdownRef = useRef(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modals & Actions State
  const [whatsappModalClient, setWhatsappModalClient] = useState(null);
  const [renewalModalClient, setRenewalModalClient] = useState(null);
  const [freezingClientId, setFreezingClientId] = useState(null);

  // Fetch Clients Data
  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/clients`);
      const data = await res.json();
      if (data.clients) setClients(data.clients);
    } catch (e) {
      console.error('fetchClients error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Handle Outside Click for Custom Curved Dropdowns
  useEffect(() => {
    function handleClickOutside(e) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setIsStatusDropdownOpen(false);
      }
      if (goalDropdownRef.current && !goalDropdownRef.current.contains(e.target)) {
        setIsGoalDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle URL query parameters (code, fasting, search)
  useEffect(() => {
    const codeParam = searchParams.get('code') || searchParams.get('id') || searchParams.get('client_code');
    const fastingParam = searchParams.get('fasting');
    const searchParam = searchParams.get('search') || searchParams.get('q');

    if (fastingParam && ['INTERMITTENT', 'RAMADAN', 'COPTIC', 'ALL'].includes(fastingParam.toUpperCase())) {
      setFastingFilter(fastingParam.toUpperCase());
    }

    if (searchParam) {
      setSearchTerm(searchParam);
    }

    if (codeParam && clients.length > 0) {
      const cleanParam = String(codeParam).replace(/^#+/, '').replace(/^client[-_]?/i, '').toLowerCase();
      const matched = clients.find(c => {
        const cCode = String(c.client_code || c.id || '').replace(/^#+/, '').replace(/^client[-_]?/i, '').toLowerCase();
        return cCode === cleanParam || String(c.id).toLowerCase() === cleanParam;
      });
      if (matched) {
        setSelectedDrawerClient(matched);
      }
    }
  }, [searchParams, clients]);

  // Export to CSV
  const exportClientsToCSV = () => {
    if (!clients || clients.length === 0) {
      alert('لا توجد بيانات مشتركين لتصديرها حالياً.');
      return;
    }

    const headers = ['الكود', 'الاسم بالكامل', 'رقم الهاتف', 'الباقة', 'حالة الاشتراك', 'تاريخ البدء', 'تاريخ الانتهاء', 'الأيام المتبقية'];
    const rows = clients.map(c => [
      c.client_code || c.id,
      `"${(c.full_name || c.name || '').replace(/"/g, '""')}"`,
      `"${c.phone_number || ''}"`,
      c.subscription_package || c.package || 'ELITE',
      c.subscription_status || c.status || 'ACTIVE',
      c.subscription_start_date ? new Date(c.subscription_start_date).toLocaleDateString('en-CA') : '',
      c.subscription_end_date ? new Date(c.subscription_end_date).toLocaleDateString('en-CA') : '',
      c.days_remaining ?? ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Z_Coaching_Clients_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toggle Subscription Freeze
  const handleToggleFreeze = async (client) => {
    const isCurrentlyFrozen = client.subscription_status === 'FROZEN';
    const targetStatus = isCurrentlyFrozen ? 'ACTIVE' : 'FROZEN';
    const confirmMsg = isCurrentlyFrozen 
      ? `هل ترغب في استئناف اشتراك المشترك (${client.full_name || client.name}) وإضافة أيام التجميد لتاريخ الانتهاء الجديد؟`
      : `هل ترغب في تجميد اشتراك المشترك (${client.full_name || client.name}) مؤقتاً؟`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setFreezingClientId(client.id);
      const res = await fetch(`${API_BASE}/api/v1/coach/toggle-freeze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: client.client_code || client.id,
          status: targetStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        if (selectedDrawerClient && (selectedDrawerClient.id === client.id || selectedDrawerClient.client_code === client.client_code)) {
          setSelectedDrawerClient(prev => prev ? ({ ...prev, subscription_status: targetStatus }) : null);
        }
        fetchClients();
      } else {
        alert(data.message || 'حدث خطأ أثناء تعديل حالة التجميد');
      }
    } catch (err) {
      console.error('Toggle freeze error:', err);
      alert('تعذر الاتصال بالخادم لتعديل حالة التجميد');
    } finally {
      setFreezingClientId(null);
    }
  };

  // Filter Clients
  const filteredClients = clients.filter(client => {
    const term = searchTerm.trim().toLowerCase().replace(/^#+/, '');
    const cleanClientCode = String(client.client_code || client.id || '').replace(/^#+/, '').replace(/^client[-_]?/i, '');
    const termCode = term.replace(/^client[-_]?/i, '');

    // 1. Goal Filter
    if (goalFilter !== 'ALL') {
      const g = String(client.plan_summary?.cleanGoal || client.goal || '').toLowerCase();
      if (goalFilter === 'FAT_LOSS' && !g.includes('تنشيف')) return false;
      if (goalFilter === 'MUSCLE_GAIN' && !g.includes('تضخيم')) return false;
      if (goalFilter === 'RECOMP' && !g.includes('تشكيل') && !g.includes('ريكومب')) return false;
      if (goalFilter === 'HEALTH' && !g.includes('صحة') && !g.includes('لياقة')) return false;
    }

    // 2. Status Filter
    if (statusFilter !== 'ALL') {
      const rawStatus = String(client.subscription_status || client.status || 'ACTIVE').toUpperCase();
      if (statusFilter === 'ACTIVE' && rawStatus !== 'ACTIVE') return false;
      if (statusFilter === 'EXPIRING_SOON' && rawStatus !== 'EXPIRING_SOON') return false;
      if (statusFilter === 'EXPIRED' && rawStatus !== 'EXPIRED') return false;
      if (statusFilter === 'FROZEN' && rawStatus !== 'FROZEN') return false;
    }

    // 3. Search Matching
    let matchesSearch = true;
    if (term) {
      if (/^\d+$/.test(termCode)) {
        matchesSearch = cleanClientCode === termCode ||
          (term.length >= 4 && client.phone_number && client.phone_number.includes(term)) ||
          arabicSearchMatch(client.full_name, term);
      } else {
        matchesSearch = arabicSearchMatch(client.full_name, term) ||
          cleanClientCode === termCode ||
          (client.phone_number && client.phone_number.includes(term)) ||
          (client.plan_summary?.cleanGoal && arabicSearchMatch(client.plan_summary.cleanGoal, term)) ||
          (client.plan_summary?.trainingSplit && arabicSearchMatch(client.plan_summary.trainingSplit, term));
      }
    }

    // 4. Package Tier Filter
    const resolvedTier = getClientTier(client);
    if (tierFilter === 'MAX' && resolvedTier !== 'MAX') return false;
    if (tierFilter === 'ELITE' && resolvedTier !== 'ELITE') return false;

    return matchesSearch;
  });

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, tierFilter, statusFilter, goalFilter, pageSize]);

  const totalPages = Math.ceil(filteredClients.length / pageSize) || 1;
  const paginatedClients = filteredClients.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Keyboard Shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) {
        if (e.key === 'Escape') {
          if (searchTerm) setSearchTerm('');
          else e.target.blur();
        }
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (searchTerm) setSearchTerm('');
        if (isStatusDropdownOpen) setIsStatusDropdownOpen(false);
        if (isGoalDropdownOpen) setIsGoalDropdownOpen(false);
        if (selectedDrawerClient) setSelectedDrawerClient(null);
        if (whatsappModalClient) setWhatsappModalClient(null);
        if (renewalModalClient) setRenewalModalClient(null);
        if (isNewClientModalOpen) setIsNewClientModalOpen(false);
      } else if (e.key === '1') {
        setTierFilter('ALL');
      } else if (e.key === '2') {
        setTierFilter('MAX');
      } else if (e.key === '3') {
        setTierFilter('ELITE');
      } else if (e.key === '[') {
        setCurrentPage(p => Math.max(1, p - 1));
      } else if (e.key === ']') {
        setCurrentPage(p => Math.min(totalPages, p + 1));
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchTerm, isStatusDropdownOpen, isGoalDropdownOpen, selectedDrawerClient, whatsappModalClient, renewalModalClient, isNewClientModalOpen, totalPages]);

  // Aggregate Counters for Filters
  const maxCount = clients.filter(c => getClientTier(c) === 'MAX').length;
  const eliteCount = clients.length - maxCount;
  const activeCount = clients.filter(c => (c.subscription_status || c.status) === 'ACTIVE').length;
  const expiringSoonCount = clients.filter(c => (c.subscription_status || c.status) === 'EXPIRING_SOON').length;
  const expiredCount = clients.filter(c => (c.subscription_status || c.status) === 'EXPIRED').length;
  const frozenCount = clients.filter(c => (c.subscription_status || c.status) === 'FROZEN').length;

  const fatLossCount = clients.filter(c => (c.plan_summary?.cleanGoal || '').includes('تنشيف')).length;
  const muscleGainCount = clients.filter(c => (c.plan_summary?.cleanGoal || '').includes('تضخيم')).length;
  const recompCount = clients.filter(c => (c.plan_summary?.cleanGoal || '').includes('تشكيل') || (c.plan_summary?.cleanGoal || '').includes('ريكومب')).length;
  const healthCount = clients.filter(c => (c.plan_summary?.cleanGoal || '').includes('صحة') || (c.plan_summary?.cleanGoal || '').includes('لياقة')).length;

  const STATUS_OPTIONS = [
    { id: 'ALL', label: 'كافة الحالات', count: clients.length },
    { id: 'ACTIVE', label: 'الاشتراكات السارية', count: activeCount },
    { id: 'EXPIRING_SOON', label: 'أوشكت على الانتهاء', count: expiringSoonCount },
    { id: 'EXPIRED', label: 'المنتهية', count: expiredCount },
    { id: 'FROZEN', label: 'المجمدة مؤقتاً', count: frozenCount },
  ];

  const GOAL_OPTIONS = [
    { id: 'ALL', label: 'كافة الأهداف الرياضية', count: clients.length },
    { id: 'FAT_LOSS', label: 'تنشيف ونزول دهون', count: fatLossCount },
    { id: 'MUSCLE_GAIN', label: 'تضخيم وبناء عضلي', count: muscleGainCount },
    { id: 'RECOMP', label: 'إعادة تشكيل (ريكومب)', count: recompCount },
    { id: 'HEALTH', label: 'صحة عامة ولياقة', count: healthCount },
  ];

  const hasActiveFilters = Boolean(searchTerm.trim() || tierFilter !== 'ALL' || statusFilter !== 'ALL' || goalFilter !== 'ALL');

  const resetAllFilters = () => {
    setSearchTerm('');
    setTierFilter('ALL');
    setStatusFilter('ALL');
    setGoalFilter('ALL');
  };

  return (
    <AdminLayout onOpenNewClient={() => setIsNewClientModalOpen(true)}>
      <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: "'Cairo', sans-serif" }}>
        
        {/* 1. Hostinger Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
              إدارة المشتركين
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#667085', fontWeight: 500 }}>
              متابعة حسابات المشتركين، الباقات المعتمدة، الاشتراكات السارية، وإجراء المتابعات الفورية
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <RefreshButton onClick={fetchClients} loading={loading} title="تحديث قائمة المشتركين" />

            <button
              type="button"
              onClick={exportClientsToCSV}
              style={{
                height: '34px',
                padding: '0 14px',
                borderRadius: '8px',
                border: '1px solid #D0D5DD',
                background: '#FFFFFF',
                color: '#344054',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F9FAFB';
                e.currentTarget.style.borderColor = '#CBD5E1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#FFFFFF';
                e.currentTarget.style.borderColor = '#D0D5DD';
              }}
              title="تصدير جدول المشتركين بترميز عربي متوافق مع Excel"
            >
              <Download size={14} color="#027A48" />
              <span>تصدير Excel / CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setIsNewClientModalOpen(true)}
              style={{
                height: '36px',
                padding: '0 18px',
                fontSize: '12.5px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '8px',
                background: '#673DE6',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(103, 61, 230, 0.25)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#5025D1';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#673DE6';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <Plus size={15} strokeWidth={2.2} />
              <span>إضافة مشترك جديد</span>
            </button>
          </div>
        </div>

        {/* 2. Main Data Card — Unified Hostinger Data Table Card */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #EAECF0',
          borderRadius: '14px',
          boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          
          {/* Top Filter & Search Toolbar */}
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid #EAECF0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            background: '#FFFFFF'
          }}>
            
            {/* Right: Search + Filter Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1, minWidth: '320px' }}>
              
              {/* Unified Hostinger Search Box */}
              <TableSearch
                value={searchTerm}
                onChange={setSearchTerm}
                inputRef={searchInputRef}
                placeholder="بحث بالاسم، الكود (#101)، الهاتف... (/)"
                width="280px"
              />

              {/* Tier Segmented Pills */}
              <TierFilter
                value={tierFilter}
                onChange={setTierFilter}
                counts={{ ALL: clients.length, MAX: maxCount, ELITE: eliteCount }}
              />

              {/* Status Filter Custom Curved Dropdown */}
              <div ref={statusDropdownRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  style={{
                    height: '34px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    border: '1px solid #D0D5DD',
                    background: statusFilter !== 'ALL' ? '#F4F0FD' : '#FFFFFF',
                    color: statusFilter !== 'ALL' ? '#673DE6' : '#344054',
                    fontSize: '12px',
                    fontWeight: statusFilter !== 'ALL' ? 700 : 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (statusFilter === 'ALL') e.currentTarget.style.background = '#F9FAFB';
                  }}
                  onMouseLeave={(e) => {
                    if (statusFilter === 'ALL') e.currentTarget.style.background = '#FFFFFF';
                  }}
                >
                  <Filter size={12} color={statusFilter !== 'ALL' ? '#673DE6' : '#667085'} />
                  <span>{STATUS_OPTIONS.find(o => o.id === statusFilter)?.label || 'حالة الاشتراك'}</span>
                  <ChevronDown size={12} color={statusFilter !== 'ALL' ? '#673DE6' : '#667085'} />
                </button>

                {isStatusDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    right: 0,
                    width: '190px',
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #EAECF0',
                    boxShadow: '0 10px 25px -4px rgba(16, 24, 40, 0.12)',
                    padding: '6px',
                    zIndex: 50,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}>
                    {STATUS_OPTIONS.map(opt => {
                      const isSelected = statusFilter === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setStatusFilter(opt.id);
                            setIsStatusDropdownOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '10px',
                            border: 'none',
                            background: isSelected ? '#F4F0FD' : 'transparent',
                            color: isSelected ? '#673DE6' : '#344054',
                            fontSize: '12px',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            textAlign: 'right',
                            transition: 'background 0.12s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = '#F9FAFB';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <span>{opt.label}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '11px', color: isSelected ? '#673DE6' : '#98A2B3', fontWeight: 600 }}>
                              ({opt.count})
                            </span>
                            {isSelected && <Check size={13} color="#673DE6" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Goal Filter Custom Curved Dropdown */}
              <div ref={goalDropdownRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setIsGoalDropdownOpen(!isGoalDropdownOpen)}
                  style={{
                    height: '34px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    border: '1px solid #D0D5DD',
                    background: goalFilter !== 'ALL' ? '#F4F0FD' : '#FFFFFF',
                    color: goalFilter !== 'ALL' ? '#673DE6' : '#344054',
                    fontSize: '12px',
                    fontWeight: goalFilter !== 'ALL' ? 700 : 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (goalFilter === 'ALL') e.currentTarget.style.background = '#F9FAFB';
                  }}
                  onMouseLeave={(e) => {
                    if (goalFilter === 'ALL') e.currentTarget.style.background = '#FFFFFF';
                  }}
                >
                  <Target size={12} color={goalFilter !== 'ALL' ? '#673DE6' : '#667085'} />
                  <span>{GOAL_OPTIONS.find(o => o.id === goalFilter)?.label || 'الهدف الرياضي'}</span>
                  <ChevronDown size={12} color={goalFilter !== 'ALL' ? '#673DE6' : '#667085'} />
                </button>

                {isGoalDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    right: 0,
                    width: '195px',
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #EAECF0',
                    boxShadow: '0 10px 25px -4px rgba(16, 24, 40, 0.12)',
                    padding: '6px',
                    zIndex: 50,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}>
                    {GOAL_OPTIONS.map(opt => {
                      const isSelected = goalFilter === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setGoalFilter(opt.id);
                            setIsGoalDropdownOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '10px',
                            border: 'none',
                            background: isSelected ? '#F4F0FD' : 'transparent',
                            color: isSelected ? '#673DE6' : '#344054',
                            fontSize: '12px',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            textAlign: 'right',
                            transition: 'background 0.12s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = '#F9FAFB';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <span>{opt.label}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '11px', color: isSelected ? '#673DE6' : '#98A2B3', fontWeight: 600 }}>
                              ({opt.count})
                            </span>
                            {isSelected && <Check size={13} color="#673DE6" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reset Filters Button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  style={{
                    height: '34px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    border: '1px solid #EAECF0',
                    background: '#F9FAFB',
                    color: '#667085',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'color 0.12s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#B42318')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#667085')}
                >
                  <X size={13} />
                  <span>إعادة ضبط</span>
                </button>
              )}
            </div>

            {/* Left: Summary Count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12.5px', color: '#667085', fontWeight: 500 }}>
                عرض <strong style={{ color: '#111827', fontWeight: 700 }}>{filteredClients.length}</strong> من أصل <strong style={{ color: '#111827', fontWeight: 700 }}>{clients.length}</strong> مشترك
              </span>
            </div>
          </div>

          {/* Table Container */}
          {loading ? (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}>
              <RotateCw size={24} className="animate-spin" color="#673DE6" />
              <span style={{ fontSize: '13px', color: '#667085', fontWeight: 600 }}>
                جاري تحميل قائمة المشتركين...
              </span>
            </div>
          ) : filteredClients.length === 0 ? (
            <div style={{
              padding: '48px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#F2F4F7',
                color: '#475467',
                border: '1px solid #EAECF0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto'
              }}>
                <Users size={20} strokeWidth={1.8} />
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                لا يوجد مشتركون مطابقون
              </div>
              <p style={{ fontSize: '12.5px', color: '#667085', margin: '0 0 14px 0', maxWidth: '420px', lineHeight: 1.5 }}>
                {hasActiveFilters 
                  ? 'لم يتم العثور على أي مشترك يطابق معايير الفلترة أو البحث المحددة.' 
                  : 'لم يتم تسجيل أي مشتركين في النظام حتى الآن.'}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  style={{
                    height: '32px',
                    padding: '0 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    border: '1px solid #D0D5DD',
                    color: '#344054',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F9FAFB';
                    e.currentTarget.style.borderColor = '#CBD5E1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#FFFFFF';
                    e.currentTarget.style.borderColor = '#D0D5DD';
                  }}
                >
                  مسح الفلاتر والبحث
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #EAECF0', color: '#475467', fontWeight: 600, fontSize: '12px' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'center', width: '75px' }}>الكود</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', minWidth: '170px' }}>المشترك</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', width: '135px' }}>الهدف الرياضي</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', width: '135px' }}>التدريب</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', width: '135px' }}>التغذية</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', width: '115px' }}>الكارديو</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', width: '140px' }}>الاشتراك والصلاحية</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', width: '220px' }}>إجراءات المشترك</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedClients.map((client) => {
                    const cleanCode = String(client.client_code || client.id).replace(/^client[-_]?/i, '');
                    const fasting = extractClientFastingProfile(client);
                    const rawStatus = String(client.subscription_status || client.status || 'ACTIVE').toUpperCase();
                    const daysRemaining = client.days_remaining;

                    return (
                      <tr 
                        key={client.id} 
                        style={{ borderBottom: '1px solid #F2F4F7', transition: 'background 0.12s ease' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* 1. Client Code */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span
                            onClick={() => setSelectedDrawerClient(client)}
                            style={{ cursor: 'pointer', display: 'inline-block' }}
                            title="فتح تفاصيل المشترك"
                          >
                            <ClientCodeBadge item={client} />
                          </span>
                        </td>

                        {/* 2. Full Name & Sub-meta */}
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <strong 
                              onClick={() => setSelectedDrawerClient(client)}
                              style={{
                                color: '#111827',
                                fontSize: '13.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'color 0.12s ease'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#673DE6')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = '#111827')}
                              title="فتح لوح تفاصيل المشترك"
                            >
                              {client.full_name || client.name || 'مشترك جديد'}
                            </strong>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span dir="ltr" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#667085' }}>
                                {client.phone_number || '-'}
                              </span>
                              {fasting.intermittentBadge && (
                                <span style={{ fontSize: '9.5px', padding: '1px 5px', borderRadius: '4px', background: '#E0F2FE', color: '#0284C7', fontWeight: 700 }}>
                                  {fasting.intermittentBadge.shortLabel}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 3. Fitness Goal & Medical Alert */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '8px',
                              background: '#F4F0FD',
                              color: '#673DE6',
                              border: '1px solid #EDE8FA',
                              display: 'inline-block'
                            }}>
                              {client.plan_summary?.cleanGoal || 'لياقة وصحة'}
                            </span>
                            {client.plan_summary?.hasMedical && (
                              <span style={{
                                fontSize: '9.5px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '6px',
                                background: '#FEF3F2',
                                color: '#B42318',
                                border: '1px solid #FECDCA',
                                display: 'inline-block'
                              }}>
                                متابعة طبية
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 4. Training (Split & Days) */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#101828' }}>
                              {client.plan_summary?.trainingSplit || 'علوي / سفلي'}
                            </span>
                            <span style={{ fontSize: '10.5px', color: '#667085', fontWeight: 600 }}>
                              {client.plan_summary?.trainingDays || 4} أيام / أسبوع
                            </span>
                          </div>
                        </td>

                        {/* 5. Nutrition (Calories & Protein) */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                            <strong style={{ fontSize: '12px', color: '#101828', fontFamily: 'JetBrains Mono, monospace' }}>
                              {Number(client.plan_summary?.nutritionCalories || 2150).toLocaleString()} سعرة
                            </strong>
                            <span style={{ fontSize: '10.5px', color: '#027A48', fontWeight: 700, background: '#ECFDF3', border: '1px solid #A6F4C7', padding: '1px 6px', borderRadius: '6px' }}>
                              {client.plan_summary?.nutritionProtein || 160}g بروتين
                            </span>
                          </div>
                        </td>

                        {/* 6. Cardio */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#175CD3',
                            background: '#EFF8FF',
                            border: '1px solid #B2DDFF',
                            padding: '2px 8px',
                            borderRadius: '8px',
                            display: 'inline-block'
                          }}>
                            {client.plan_summary?.cardioSessions || 3} جلسات / أسبوع
                          </span>
                        </td>

                        {/* 7. Subscription Tier & Expiration Badge */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <ClientPackageBadge item={client} />
                            <span style={{
                              fontSize: '10.5px',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '6px',
                              display: 'inline-block',
                              background: rawStatus === 'FROZEN' ? '#F8FAFC' : rawStatus === 'EXPIRED' ? '#FEF3F2' : (daysRemaining <= 3 ? '#FFFAEB' : '#ECFDF3'),
                              color: rawStatus === 'FROZEN' ? '#475467' : rawStatus === 'EXPIRED' ? '#B42318' : (daysRemaining <= 3 ? '#B54708' : '#027A48'),
                              border: rawStatus === 'FROZEN' ? '1px solid #E2E8F0' : rawStatus === 'EXPIRED' ? '1px solid #FECDCA' : (daysRemaining <= 3 ? '1px solid #FEDF89' : '1px solid #A6F4C7')
                            }}>
                              {rawStatus === 'FROZEN' ? 'مجمد مؤقتاً' : (rawStatus === 'EXPIRED' ? `منتهي (متأخر ${Math.abs(daysRemaining || 0)} يوم)` : (daysRemaining === 0 ? 'ينتهي اليوم' : `باقي ${daysRemaining} يوم`))}
                            </span>
                          </div>
                        </td>

                        {/* 8. Action Buttons */}
                        <td style={{ padding: '12px 14px', textAlign: 'left' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            {/* Program Editor (Primary Branded Action) */}
                            <a
                              href={`/coach/editor/${cleanCode}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                height: '30px',
                                padding: '0 10px',
                                borderRadius: '8px',
                                border: '1px solid #DDD6FE',
                                background: '#F4F0FD',
                                color: '#673DE6',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 1px 2px rgba(103, 61, 230, 0.08)',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#EDE8FA';
                                e.currentTarget.style.borderColor = '#C4B5FD';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#F4F0FD';
                                e.currentTarget.style.borderColor = '#DDD6FE';
                              }}
                              title="فتح محرر الخطة التدريبية والغذائية بالكامل"
                            >
                              <span>الخطة</span>
                              <ExternalLink size={11} color="#673DE6" />
                            </a>

                            {/* Check-in Review */}
                            <a
                              href={`/coach/checkin-review?code=${cleanCode}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                height: '30px',
                                padding: '0 9px',
                                borderRadius: '8px',
                                border: '1px solid #D0D5DD',
                                background: '#FFFFFF',
                                color: '#344054',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                textDecoration: 'none',
                                boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#F9FAFB';
                                e.currentTarget.style.borderColor = '#CBD5E1';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#FFFFFF';
                                e.currentTarget.style.borderColor = '#D0D5DD';
                              }}
                              title="الانتقال لمراجعة التقييم الأسبوعي"
                            >
                              <span>التقييم</span>
                              <ExternalLink size={10} color="#667085" />
                            </a>

                            {/* WhatsApp */}
                            <button
                              type="button"
                              onClick={() => setWhatsappModalClient(client)}
                              style={{
                                height: '30px',
                                padding: '0 8px',
                                borderRadius: '8px',
                                border: '1px solid #D0D5DD',
                                background: '#FFFFFF',
                                color: '#027A48',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#F9FAFB';
                                e.currentTarget.style.borderColor = '#CBD5E1';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#FFFFFF';
                                e.currentTarget.style.borderColor = '#D0D5DD';
                              }}
                              title="مركز رسائل الواتساب الذكية"
                            >
                              <MessageCircle size={13} color="#027A48" />
                            </button>

                            {/* Client Profile Drawer */}
                            <button
                              type="button"
                              onClick={() => setSelectedDrawerClient(client)}
                              style={{
                                height: '30px',
                                padding: '0 9px',
                                borderRadius: '8px',
                                border: '1px solid #D0D5DD',
                                background: '#FFFFFF',
                                color: '#344054',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#F9FAFB';
                                e.currentTarget.style.borderColor = '#CBD5E1';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#FFFFFF';
                                e.currentTarget.style.borderColor = '#D0D5DD';
                              }}
                              title="عرض تفاصيل المشترك وسجل التطور"
                            >
                              <Clock size={12} color="#667085" />
                              <span>الملف</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. Hostinger Data Table Pagination Footer */}
          {!loading && filteredClients.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 18px',
              background: '#FFFFFF',
              borderTop: '1px solid #EAECF0',
              fontSize: '12px',
              color: '#475467',
              fontWeight: 500,
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              {/* Record Summary */}
              <span>
                عرض المشتركين من <strong style={{ color: '#111827' }}>{(currentPage - 1) * pageSize + 1}</strong> إلى <strong style={{ color: '#111827' }}>{Math.min(currentPage * pageSize, filteredClients.length)}</strong> من أصل <strong style={{ color: '#111827' }}>{filteredClients.length}</strong> مشترك
              </span>

              {/* Pagination Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Page Size Selector */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                  <span style={{ fontSize: '11.5px', color: '#667085' }}>لكل صفحة:</span>
                  {[25, 50, 100].map(sz => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setPageSize(sz)}
                      style={{
                        padding: '2px 7px',
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: pageSize === sz ? '#673DE6' : '#EAECF0',
                        background: pageSize === sz ? '#F4F0FD' : '#FFFFFF',
                        color: pageSize === sz ? '#673DE6' : '#475467',
                        fontSize: '11.5px',
                        fontWeight: pageSize === sz ? 700 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      {sz}
                    </button>
                  ))}
                </div>

                {/* Prev Button */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    height: '30px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid #D0D5DD',
                    background: currentPage === 1 ? '#F9FAFB' : '#FFFFFF',
                    color: currentPage === 1 ? '#98A2B3' : '#344054',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '12px',
                    boxShadow: currentPage === 1 ? 'none' : '0 1px 2px rgba(16, 24, 40, 0.03)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== 1) e.currentTarget.style.background = '#F9FAFB';
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== 1) e.currentTarget.style.background = '#FFFFFF';
                  }}
                >
                  السابق
                </button>

                {/* Page Indicator */}
                <span style={{ padding: '0 6px', color: '#111827', fontWeight: 600, fontSize: '12px' }}>
                  صفحة {currentPage} من {totalPages}
                </span>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    height: '30px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid #D0D5DD',
                    background: currentPage === totalPages ? '#F9FAFB' : '#FFFFFF',
                    color: currentPage === totalPages ? '#98A2B3' : '#344054',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '12px',
                    boxShadow: currentPage === totalPages ? 'none' : '0 1px 2px rgba(16, 24, 40, 0.03)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== totalPages) e.currentTarget.style.background = '#F9FAFB';
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== totalPages) e.currentTarget.style.background = '#FFFFFF';
                  }}
                >
                  التالي
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modals & Slide-over Drawers (100% Functionality Preserved) */}
        {whatsappModalClient && (
          <WhatsAppModal
            isOpen={Boolean(whatsappModalClient)}
            onClose={() => setWhatsappModalClient(null)}
            client={whatsappModalClient}
          />
        )}

        <NewClientQuickModal
          isOpen={isNewClientModalOpen}
          onClose={() => setIsNewClientModalOpen(false)}
          onClientCreated={() => fetchClients()}
        />

        <FlexibleRenewalModal
          isOpen={Boolean(renewalModalClient)}
          onClose={() => setRenewalModalClient(null)}
          client={renewalModalClient}
          onSuccess={() => {
            setRenewalModalClient(null);
            fetchClients();
          }}
        />

        <ClientSlideOverDrawer
          isOpen={Boolean(selectedDrawerClient)}
          onClose={() => setSelectedDrawerClient(null)}
          client={selectedDrawerClient}
          onToggleFreeze={handleToggleFreeze}
          freezingClientId={freezingClientId}
          onOpenWhatsApp={(client) => setWhatsappModalClient(client)}
          onOpenRenewal={(client) => setRenewalModalClient(client)}
        />

      </div>
    </AdminLayout>
  );
}
