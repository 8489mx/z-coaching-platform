import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Plus,
  ShieldCheck,
  Clock,
  MessageCircle,
  Download,
  ExternalLink,
  Search,
  X,
  ChevronDown,
  Check,
  RotateCw,
  Filter,
  Calendar,
  AlertCircle
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
  const [fastingFilter, setFastingFilter] = useState('ALL'); // 'ALL' | 'INTERMITTENT' | 'RAMADAN' | 'COPTIC'
  
  // Dropdown UI States (Zero Native Dropdowns / Zero Sharp Corners)
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isFastingDropdownOpen, setIsFastingDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);
  const fastingDropdownRef = useRef(null);

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
      if (fastingDropdownRef.current && !fastingDropdownRef.current.contains(e.target)) {
        setIsFastingDropdownOpen(false);
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

    const fasting = extractClientFastingProfile(client);

    // 1. Fasting Filter
    if (fastingFilter === 'COPTIC' && !fasting.isCoptic) return false;
    if (fastingFilter === 'RAMADAN' && !fasting.isRamadan) return false;
    if (fastingFilter === 'INTERMITTENT' && !fasting.isIntermittent) return false;

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
          (fasting.primaryFastingBadge && arabicSearchMatch(fasting.primaryFastingBadge.label, term)) ||
          (fasting.intermittentBadge && arabicSearchMatch(fasting.intermittentBadge.label, term));
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
  }, [searchTerm, tierFilter, statusFilter, fastingFilter, pageSize]);

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
        if (isFastingDropdownOpen) setIsFastingDropdownOpen(false);
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
  }, [searchTerm, isStatusDropdownOpen, isFastingDropdownOpen, selectedDrawerClient, whatsappModalClient, renewalModalClient, isNewClientModalOpen, totalPages]);

  // Aggregate Counters for Filters
  const maxCount = clients.filter(c => getClientTier(c) === 'MAX').length;
  const eliteCount = clients.length - maxCount;
  const activeCount = clients.filter(c => (c.subscription_status || c.status) === 'ACTIVE').length;
  const expiringSoonCount = clients.filter(c => (c.subscription_status || c.status) === 'EXPIRING_SOON').length;
  const expiredCount = clients.filter(c => (c.subscription_status || c.status) === 'EXPIRED').length;
  const frozenCount = clients.filter(c => (c.subscription_status || c.status) === 'FROZEN').length;
  const totalCoptic = clients.filter(c => extractClientFastingProfile(c).isCoptic).length;
  const totalRamadan = clients.filter(c => extractClientFastingProfile(c).isRamadan).length;
  const totalIntermittent = clients.filter(c => extractClientFastingProfile(c).isIntermittent).length;

  const STATUS_OPTIONS = [
    { id: 'ALL', label: 'كافة الحالات', count: clients.length },
    { id: 'ACTIVE', label: 'الاشتراكات السارية', count: activeCount },
    { id: 'EXPIRING_SOON', label: 'أوشكت على الانتهاء', count: expiringSoonCount },
    { id: 'EXPIRED', label: 'المنتهية', count: expiredCount },
    { id: 'FROZEN', label: 'المجمدة مؤقتاً', count: frozenCount },
  ];

  const FASTING_OPTIONS = [
    { id: 'ALL', label: 'كافة أنماط الصيام', count: clients.length },
    { id: 'INTERMITTENT', label: 'صيام متقطع', count: totalIntermittent },
    { id: 'RAMADAN', label: 'صيام رمضان', count: totalRamadan },
    { id: 'COPTIC', label: 'صيام مسيحي', count: totalCoptic },
  ];

  const hasActiveFilters = Boolean(searchTerm.trim() || tierFilter !== 'ALL' || statusFilter !== 'ALL' || fastingFilter !== 'ALL');

  const resetAllFilters = () => {
    setSearchTerm('');
    setTierFilter('ALL');
    setStatusFilter('ALL');
    setFastingFilter('ALL');
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

              {/* Fasting Filter Custom Curved Dropdown */}
              <div ref={fastingDropdownRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setIsFastingDropdownOpen(!isFastingDropdownOpen)}
                  style={{
                    height: '34px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    border: '1px solid #D0D5DD',
                    background: fastingFilter !== 'ALL' ? '#F4F0FD' : '#FFFFFF',
                    color: fastingFilter !== 'ALL' ? '#673DE6' : '#344054',
                    fontSize: '12px',
                    fontWeight: fastingFilter !== 'ALL' ? 700 : 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (fastingFilter === 'ALL') e.currentTarget.style.background = '#F9FAFB';
                  }}
                  onMouseLeave={(e) => {
                    if (fastingFilter === 'ALL') e.currentTarget.style.background = '#FFFFFF';
                  }}
                >
                  <Calendar size={12} color={fastingFilter !== 'ALL' ? '#673DE6' : '#667085'} />
                  <span>{FASTING_OPTIONS.find(o => o.id === fastingFilter)?.label || 'نمط الصيام'}</span>
                  <ChevronDown size={12} color={fastingFilter !== 'ALL' ? '#673DE6' : '#667085'} />
                </button>

                {isFastingDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    right: 0,
                    width: '185px',
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
                    {FASTING_OPTIONS.map(opt => {
                      const isSelected = fastingFilter === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setFastingFilter(opt.id);
                            setIsFastingDropdownOpen(false);
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
                    <th style={{ padding: '12px 16px', textAlign: 'center', width: '85px' }}>الكود</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>المشترك</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', width: '130px' }}>الهاتف</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', width: '100px' }}>الباقة</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', width: '140px' }}>حالة الاشتراك</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', width: '120px' }}>المدة المتبقية</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', width: '250px' }}>إجراءات المشترك</th>
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
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span
                            onClick={() => setSelectedDrawerClient(client)}
                            style={{
                              cursor: 'pointer',
                              display: 'inline-block',
                              fontFamily: 'JetBrains Mono, monospace',
                              fontSize: '12px',
                              fontWeight: 700,
                              color: '#344054',
                              background: '#F2F4F7',
                              border: '1px solid #EAECF0',
                              borderRadius: '6px',
                              padding: '3px 8px',
                              transition: 'all 0.12s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#673DE6';
                              e.currentTarget.style.color = '#673DE6';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#EAECF0';
                              e.currentTarget.style.color = '#344054';
                            }}
                            title="فتح تفاصيل المشترك"
                          >
                            #{cleanCode}
                          </span>
                        </td>

                        {/* 2. Full Name & Fasting Badges */}
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <strong 
                              onClick={() => setSelectedDrawerClient(client)}
                              style={{
                                color: '#111827',
                                fontSize: '13.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'color 0.12s ease'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#673DE6')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = '#111827')}
                              title="فتح لوح تفاصيل المشترك"
                            >
                              {client.full_name || client.name || 'مشترك جديد'}
                            </strong>

                            {fasting.primaryFastingBadge && (
                              <span style={{
                                fontSize: '10.5px',
                                padding: '2px 7px',
                                borderRadius: '6px',
                                background: '#F2F4F7',
                                border: '1px solid #EAECF0',
                                color: '#475467',
                                fontWeight: 600
                              }}>
                                {fasting.primaryFastingBadge.label}
                              </span>
                            )}
                            {fasting.intermittentBadge && (
                              <span style={{
                                fontSize: '10.5px',
                                padding: '2px 7px',
                                borderRadius: '6px',
                                background: '#F2F4F7',
                                border: '1px solid #EAECF0',
                                color: '#475467',
                                fontWeight: 600
                              }}>
                                {fasting.intermittentBadge.label}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Phone */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span dir="ltr" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#475467' }}>
                            {client.phone_number || '-'}
                          </span>
                        </td>

                        {/* 4. Tier Badge */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <ClientPackageBadge item={client} />
                        </td>

                        {/* 5. Subscription Status Badge (Zero Dots / Pure Text) */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {rawStatus === 'FROZEN' ? (
                            <span style={{
                              background: '#F8FAFC',
                              color: '#475467',
                              border: '1px solid #E2E8F0',
                              padding: '3px 10px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              display: 'inline-block'
                            }}>
                              مجمد مؤقتاً
                            </span>
                          ) : rawStatus === 'EXPIRED' ? (
                            <span style={{
                              background: '#FEF3F2',
                              color: '#B42318',
                              border: '1px solid #FECDCA',
                              padding: '3px 10px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              display: 'inline-block'
                            }}>
                              منتهي الصلاحية
                            </span>
                          ) : rawStatus === 'EXPIRING_SOON' ? (
                            <span style={{
                              background: '#FFFAEB',
                              color: '#B54708',
                              border: '1px solid #FEDF89',
                              padding: '3px 10px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              display: 'inline-block'
                            }}>
                              ينتهي قريباً
                            </span>
                          ) : (
                            <span style={{
                              background: '#ECFDF3',
                              color: '#027A48',
                              border: '1px solid #A6F4C7',
                              padding: '3px 10px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              display: 'inline-block'
                            }}>
                              نشط
                            </span>
                          )}
                        </td>

                        {/* 6. Remaining Duration */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: typeof daysRemaining === 'number' 
                              ? (daysRemaining <= 3 ? '#B54708' : '#475467') 
                              : '#667085'
                          }}>
                            {typeof daysRemaining === 'number'
                              ? (daysRemaining > 0 ? `باقي ${daysRemaining} يوم` : (daysRemaining === 0 ? 'ينتهي اليوم' : `متأخر ${Math.abs(daysRemaining)} يوم`))
                              : 'ساري'}
                          </span>
                        </td>

                        {/* 7. Action Buttons (Secondary White Button Style) */}
                        <td style={{ padding: '12px 16px', textAlign: 'left' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {/* Check-in Review */}
                            <a
                              href={`/coach/checkin-review?code=${cleanCode}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                height: '30px',
                                padding: '0 10px',
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
                                gap: '4px',
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
                              title="الانتقال لمراجعة تقييم المشترك في تبويب مستقل"
                            >
                              <span>التقييم</span>
                              <ExternalLink size={11} color="#667085" />
                            </a>

                            {/* Program Editor (Primary Branded Action) */}
                            <a
                              href={`/coach/editor/${cleanCode}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                height: '30px',
                                padding: '0 11px',
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
                              title="فتح محرر الخطة في تبويب مستقل"
                            >
                              <span>الخطة</span>
                              <ExternalLink size={11} color="#673DE6" />
                            </a>

                            {/* WhatsApp */}
                            <button
                              type="button"
                              onClick={() => setWhatsappModalClient(client)}
                              style={{
                                height: '30px',
                                padding: '0 10px',
                                borderRadius: '8px',
                                border: '1px solid #D0D5DD',
                                background: '#FFFFFF',
                                color: '#027A48',
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
                              title="مركز رسائل الواتساب الذكية"
                            >
                              <MessageCircle size={12} color="#027A48" />
                              <span>واتساب</span>
                            </button>

                            {/* Client Profile Drawer */}
                            <button
                              type="button"
                              onClick={() => setSelectedDrawerClient(client)}
                              style={{
                                height: '30px',
                                padding: '0 10px',
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
