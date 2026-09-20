import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  ShieldCheck,
  Clock,
  MessageCircle,
  X,
  Download,
  ExternalLink
} from 'lucide-react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import WhatsAppModal from '../components/modals/WhatsAppModal';
import FlexibleRenewalModal from '../components/modals/FlexibleRenewalModal';
import { PageHeader } from '@/shared/components/page-header';
import { FormSection } from '@/shared/components/form-section';
import NewClientQuickModal from '../components/modals/NewClientQuickModal';
import { ClientCodeBadge, ClientPackageBadge, getClientTier } from '../utils/tierBadgeHelper';
import { arabicSearchMatch } from '../utils/searchUtils';
import { extractClientFastingProfile } from '../utils/seasonalFastingRadar';
import ClientSlideOverDrawer from '../components/customers/ClientSlideOverDrawer';

export default function Customers() {
  const [searchParams] = useSearchParams();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [selectedDrawerClient, setSelectedDrawerClient] = useState(null);
  const searchInputRef = useRef(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL'); // 'ALL' | 'MAX' | 'ELITE'
  const [fastingFilter, setFastingFilter] = useState('ALL'); // 'ALL' | 'INTERMITTENT' | 'RAMADAN' | 'COPTIC'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // WhatsApp & Renewal Hub State
  const [whatsappModalClient, setWhatsappModalClient] = useState(null);
  const [renewalModalClient, setRenewalModalClient] = useState(null);
  const [freezingClientId, setFreezingClientId] = useState(null);

  useEffect(() => {
    fetchClients();
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

  const _handleSuperAdminOverrideCheckin = (clientId) => {
    window.location.href = `/check-in?user_id=${clientId}&override=true`;
  };

  // Filter Clients
  const filteredClients = clients.filter(client => {
    const term = searchTerm.trim().toLowerCase().replace(/^#+/, '');
    const cleanClientCode = String(client.client_code || client.id || '').replace(/^#+/, '').replace(/^client[-_]?/i, '');
    const termCode = term.replace(/^client[-_]?/i, '');

    const fasting = extractClientFastingProfile(client);

    // Fasting Filter
    if (fastingFilter === 'COPTIC' && !fasting.isCoptic) return false;
    if (fastingFilter === 'RAMADAN' && !fasting.isRamadan) return false;
    if (fastingFilter === 'INTERMITTENT' && !fasting.isIntermittent) return false;

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

    const resolvedTier = getClientTier(client);

    if (tierFilter === 'MAX' && resolvedTier !== 'MAX') return false;
    if (tierFilter === 'ELITE' && resolvedTier !== 'ELITE') return false;

    return matchesSearch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, tierFilter, fastingFilter]);

  const totalPages = Math.ceil(filteredClients.length / pageSize) || 1;
  const paginatedClients = filteredClients.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
  }, [searchTerm, selectedDrawerClient, whatsappModalClient, renewalModalClient, isNewClientModalOpen, totalPages]);

  const maxCount = clients.filter(c => getClientTier(c) === 'MAX').length;
  const eliteCount = clients.length - maxCount;
  const activeCount = clients.filter(c => (c.subscription_status || c.status) === 'ACTIVE').length;
  const totalCoptic = clients.filter(c => extractClientFastingProfile(c).isCoptic).length;
  const totalRamadan = clients.filter(c => extractClientFastingProfile(c).isRamadan).length;
  const totalIntermittent = clients.filter(c => extractClientFastingProfile(c).isIntermittent).length;

  const statCards = [
    { id: 'ALL', title: 'إجمالي المشتركين', value: clients.length, unit: 'مشترك', label: 'كافة المسجلين', icon: Users, shortcut: '1', isFilter: true },
    { 
      id: 'MAX',
      title: 'مشتركو باقة MAX', 
      value: maxCount, 
      unit: 'مشترك', 
      label: 'متابعة أسبوعية',
      badgeText: 'MAX',
      badgeColor: '#D97706',
      shortcut: '2',
      isFilter: true
    },
    { 
      id: 'ELITE',
      title: 'مشتركو باقة ELITE', 
      value: eliteCount, 
      unit: 'مشترك', 
      label: 'متابعة كل أسبوعين',
      badgeText: 'ELITE',
      badgeColor: '#0284C7',
      shortcut: '3',
      isFilter: true
    },
    { id: 'ACTIVE_STAT', title: 'الاشتراكات السارية', value: activeCount, unit: 'مشترك', label: 'حسابات نشطة', icon: ShieldCheck, isFilter: false },
  ];

  return (
    <AdminLayout>
      <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* 1. Page Header */}
        <PageHeader
          title="قائمة المشتركين"
          description="متابعة حسابات المشتركين والباقات المعتمدة وإجراء المتابعات الفورية."
          actions={(
            <button
              type="button"
              onClick={() => setIsNewClientModalOpen(true)}
              style={{
                height: '36px',
                padding: '0 16px',
                background: '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 5px rgba(15, 23, 42, 0.25)'
              }}
            >
              <Plus size={15} />
              <span>إضافة مشترك جديد +</span>
            </button>
          )}
        />

        {/* 2. 4-Column KPI Stats (Interactive Filter Cards) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          {statCards.map((st, i) => {
            const Icon = st.icon;
            const isSel = st.isFilter && tierFilter === st.id;
            return (
              <div 
                key={i} 
                onClick={() => { if (st.isFilter) setTierFilter(st.id); }}
                role={st.isFilter ? "button" : undefined}
                tabIndex={st.isFilter ? 0 : undefined}
                style={{
                  background: isSel ? '#F8FAFC' : '#FFFFFF',
                  border: isSel ? '2px solid #0F172A' : '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '16px 18px',
                  boxShadow: isSel ? '0 4px 12px rgba(15, 23, 42, 0.08)' : '0 1px 3px rgba(15, 23, 42, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  cursor: st.isFilter ? 'pointer' : 'default',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: isSel ? 800 : 700, color: isSel ? '#0F172A' : '#64748B', whiteSpace: 'nowrap' }}>{st.title}</span>
                    {st.shortcut && (
                      <span style={{ 
                        fontSize: '9.5px', 
                        color: isSel ? '#0F172A' : '#64748B', 
                        background: isSel ? '#E2E8F0' : '#F1F5F9', 
                        border: '1px solid #CBD5E1', 
                        padding: '1px 5px', 
                        borderRadius: '6px', 
                        fontWeight: 800,
                        fontFamily: 'JetBrains Mono, monospace'
                      }}>
                        {st.shortcut}
                      </span>
                    )}
                  </div>
                  {st.badgeText ? (
                    <div 
                      style={{ 
                        height: '28px',
                        padding: '0 8px',
                        borderRadius: '8px', 
                        background: isSel ? '#0F172A' : '#F8FAFC', 
                        border: isSel ? '1px solid #0F172A' : '1px solid #E2E8F0', 
                        color: isSel ? '#FFFFFF' : st.badgeColor, 
                        fontSize: '11px', 
                        fontWeight: 900, 
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        letterSpacing: '0.5px',
                        fontFamily: 'JetBrains Mono, Cairo, sans-serif',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {st.badgeText}
                    </div>
                  ) : (
                    <div style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      background: isSel ? '#0F172A' : '#F8FAFC',
                      border: isSel ? '1px solid #0F172A' : '1px solid #E2E8F0',
                      color: isSel ? '#FFFFFF' : '#0F172A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}>
                      <Icon size={15} />
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo, sans-serif', lineHeight: 1 }}>
                      {st.value}
                    </span>
                    {st.unit && (
                      <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B' }}>
                        {st.unit}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', color: isSel ? '#0F172A' : '#94A3B8', fontWeight: isSel ? 700 : 600, whiteSpace: 'nowrap' }}>
                    {st.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. Clients Table Section */}
        <FormSection
          title="قائمة المشتركين المعتمدين"
          description="إدارة كافة المشتركين المسجلين في النظام، ومتابعة الخطط والتقييمات."
          actions={(
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Export to Excel / CSV */}
              <button
                type="button"
                onClick={exportClientsToCSV}
                style={{
                  height: '32px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
                title="تصدير جدول المشتركين بترميز عربي متوافق مع Excel"
              >
                <Download size={13} color="#16A34A" />
                <span>تصدير Excel / CSV</span>
              </button>

              {/* Search Box */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '0 8px',
                  height: '32px',
                  width: '230px',
                  gap: '6px'
                }}
              >
                <Search size={13} color="#94A3B8" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="بحث بالاسم، الهاتف، أو الكود... (اضغط /)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '11.5px',
                    width: '100%',
                    color: '#0F172A'
                  }}
                />
                {searchTerm && (
                  <button type="button" onClick={() => setSearchTerm('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#94A3B8' }}>
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Active Tier Filter Indicator Tag */}
              {tierFilter !== 'ALL' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', padding: '4px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '11px', color: '#0F172A', fontWeight: 700 }}>
                  <span>باقة: {tierFilter === 'MAX' ? 'ماكس (MAX)' : 'إيليت (ELITE)'}</span>
                  <button
                    type="button"
                    onClick={() => setTierFilter('ALL')}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#64748B' }}
                    title="إلغاء التصفية وعرض كافة الباقات"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Fasting Filter Pills */}
              <div style={{ display: 'flex', gap: '3px', background: '#F1F5F9', padding: '3px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                {[
                  { id: 'ALL', label: 'كافة الأنماط', count: clients.length },
                  { id: 'INTERMITTENT', label: 'متقطع', count: totalIntermittent },
                  { id: 'RAMADAN', label: 'رمضان', count: totalRamadan },
                  { id: 'COPTIC', label: 'مسيحي', count: totalCoptic }
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFastingFilter(f.id)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      background: fastingFilter === f.id ? '#0F172A' : 'transparent',
                      color: fastingFilter === f.id ? '#FFFFFF' : '#64748B',
                      boxShadow: fastingFilter === f.id ? '0 2px 5px rgba(15, 23, 42, 0.25)' : 'none',
                      transition: 'background 0.12s ease, color 0.12s ease'
                    }}
                  >
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>
            </div>
          )}
        >
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
              جاري تحميل المشتركين...
            </div>
          ) : filteredClients.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F1F5F9', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto' }}>
                <Users size={18} />
              </div>
              <strong style={{ fontSize: '13px', color: '#0F172A', display: 'block', marginBottom: '2px' }}>لا يوجد مشتركون مطابقون</strong>
              <small style={{ fontSize: '11.5px', color: '#64748B' }}>لم يتم العثور على أي مشترك تحت هذا البحث أو الفلتر.</small>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 700 }}>
                    <th style={{ padding: '10px 14px', textAlign: 'center', width: '85px' }}>الكود</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>المشترك</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>الهاتف</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>الباقة</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>حالة الاشتراك</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>إجراءات سريعة</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedClients.map((client) => {
                    const cleanCode = String(client.client_code || client.id).replace(/^client[-_]?/i, '');

                    return (
                      <tr 
                        key={client.id} 
                        style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Code */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span
                            onClick={() => setSelectedDrawerClient(client)}
                            style={{ cursor: 'pointer', display: 'inline-block' }}
                            title="فتح لوح تفاصيل المشترك السريع"
                          >
                            <ClientCodeBadge code={cleanCode} item={client} />
                          </span>
                        </td>

                        {/* Name */}
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <strong 
                              onClick={() => setSelectedDrawerClient(client)}
                              style={{ color: '#0F172A', fontSize: '13px', cursor: 'pointer' }}
                              title="فتح لوح تفاصيل المشترك السريع"
                            >
                              {client.full_name || 'مشترك جديد'}
                            </strong>
                            {(() => {
                              const fasting = extractClientFastingProfile(client);
                              return (
                                <>
                                  {fasting.primaryFastingBadge && (
                                    <span style={{
                                      fontSize: '10px',
                                      padding: '1px 6px',
                                      borderRadius: '6px',
                                      background: fasting.primaryFastingBadge.bg,
                                      border: `1px solid ${fasting.primaryFastingBadge.border}`,
                                      color: fasting.primaryFastingBadge.color,
                                      fontWeight: 800
                                    }}>
                                      {fasting.primaryFastingBadge.label}
                                    </span>
                                  )}
                                  {fasting.intermittentBadge && (
                                    <span style={{
                                      fontSize: '10px',
                                      padding: '1px 6px',
                                      borderRadius: '6px',
                                      background: fasting.intermittentBadge.bg,
                                      border: `1px solid ${fasting.intermittentBadge.border}`,
                                      color: fasting.intermittentBadge.color,
                                      fontWeight: 800
                                    }}>
                                      {fasting.intermittentBadge.label}
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </td>

                        {/* Phone */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span dir="ltr" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11.5px', color: '#475569' }}>
                            {client.phone_number}
                          </span>
                        </td>

                        {/* Tier */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <ClientPackageBadge item={client} />
                        </td>

                        {/* Status */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          {client.subscription_status === 'FROZEN' ? (
                            <span style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, display: 'inline-block' }}>
                              مجمد مؤقتاً
                            </span>
                          ) : client.subscription_status === 'EXPIRED' ? (
                            <span style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, display: 'inline-block' }}>
                              منتهي الصلاحية
                            </span>
                          ) : client.subscription_status === 'EXPIRING_SOON' ? (
                            <span style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, display: 'inline-block' }}>
                              ينتهي خلال {client.days_remaining} يوم
                            </span>
                          ) : (
                            <span style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, display: 'inline-block' }}>
                              نشط ({client.days_remaining !== undefined ? `${client.days_remaining} يوم` : 'معتمد'})
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '10px 14px', textAlign: 'left' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            {/* 1. Check-in Review Dashboard Link (New Tab) */}
                            <a
                              href={`/coach/checkin-review?code=${cleanCode}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: '4px 10px',
                                borderRadius: '8px',
                                background: '#0F172A',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                fontWeight: 800,
                                textDecoration: 'none',
                                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.2)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = '#0F172A')}
                              title="الانتقال لمراجعة تقييم المشترك في تبويب مستقل"
                            >
                              <span>التقييم</span>
                              <ExternalLink size={10} style={{ opacity: 0.8 }} />
                            </a>

                            {/* 2. Program Editor Button (New Tab) */}
                            <a
                              href={`/coach/editor/${cleanCode}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: '4px 9px',
                                borderRadius: '8px',
                                border: '1px solid #CBD5E1',
                                background: '#FFFFFF',
                                color: '#0F172A',
                                fontSize: '11px',
                                fontWeight: 700,
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                              title="فتح محرر الخطة في تبويب مستقل"
                            >
                              <span>الخطة</span>
                              <ExternalLink size={10} style={{ opacity: 0.7 }} />
                            </a>

                            {/* 3. WhatsApp Modal Trigger */}
                            <button
                              type="button"
                              onClick={() => setWhatsappModalClient(client)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '8px',
                                border: '1px solid #86EFAC',
                                background: '#F0FDF4',
                                color: '#16A34A',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#DCFCE7';
                                e.currentTarget.style.borderColor = '#4ADE80';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#F0FDF4';
                                e.currentTarget.style.borderColor = '#86EFAC';
                              }}
                              title="مركز رسائل الواتساب الذكية"
                            >
                              <MessageCircle size={12} />
                              <span>واتساب</span>
                            </button>

                            {/* 4. Client Slide-over Drawer Trigger (Hub for Profile, Freeze, Renew & Timeline) */}
                            <button
                              type="button"
                              onClick={() => setSelectedDrawerClient(client)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '8px',
                                border: '1px solid #E2E8F0',
                                background: '#F8FAFC',
                                color: '#334155',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#F1F5F9';
                                e.currentTarget.style.borderColor = '#CBD5E1';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#F8FAFC';
                                e.currentTarget.style.borderColor = '#E2E8F0';
                              }}
                              title="عرض تفاصيل المشترك، تجميد/تجديد الاشتراك، وسجل التطور"
                            >
                              <Clock size={12} color="#475569" />
                              <span>الملف</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Clean Executive Pagination Bar */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: '#F8FAFC',
                  borderTop: '1px solid #E2E8F0',
                  fontSize: '11.5px',
                  color: '#64748B',
                  fontWeight: 600,
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <span>
                    عرض المشتركين من {(currentPage - 1) * pageSize + 1} إلى {Math.min(currentPage * pageSize, filteredClients.length)} من أصل {filteredClients.length} مشترك
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        background: currentPage === 1 ? '#F1F5F9' : '#FFFFFF',
                        color: currentPage === 1 ? '#94A3B8' : '#0F172A',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        fontWeight: 700,
                        fontSize: '11px'
                      }}
                    >
                      السابق
                    </button>

                    <span style={{ padding: '0 8px', color: '#0F172A', fontWeight: 800 }}>
                      صفحة {currentPage} من {totalPages}
                    </span>

                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        background: currentPage === totalPages ? '#F1F5F9' : '#FFFFFF',
                        color: currentPage === totalPages ? '#94A3B8' : '#0F172A',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        fontWeight: 700,
                        fontSize: '11px'
                      }}
                    >
                      التالي
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </FormSection>

        {/* WhatsApp Modal */}
        {whatsappModalClient && (
          <WhatsAppModal
            isOpen={Boolean(whatsappModalClient)}
            onClose={() => setWhatsappModalClient(null)}
            client={whatsappModalClient}
          />
        )}

        {/* New Client Quick Creation Modal */}
        <NewClientQuickModal
          isOpen={isNewClientModalOpen}
          onClose={() => setIsNewClientModalOpen(false)}
          onClientCreated={() => fetchClients()}
        />

        {/* Flexible Renewal Modal */}
        <FlexibleRenewalModal
          isOpen={Boolean(renewalModalClient)}
          onClose={() => setRenewalModalClient(null)}
          client={renewalModalClient}
          onSuccess={() => {
            setRenewalModalClient(null);
            fetchClients();
          }}
        />

        {/* Client Slide-Over Details Drawer */}
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
