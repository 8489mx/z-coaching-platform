import { ClientCodeBadge, ClientPackageBadge, getClientTier } from '../utils/tierBadgeHelper';
import React, { useState, useEffect } from 'react';
import {  } from 'react-router-dom';
import { CreditCard, Search, Wallet, Users, Hourglass, AlertTriangle, Edit3, PauseCircle, PlayCircle, RotateCw, MessageCircle, Plus, X, CheckCircle2, ChevronDown, Download } from 'lucide-react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import EditSubscriptionModal from '../components/modals/EditSubscriptionModal';
import FlexibleRenewalModal from '../components/modals/FlexibleRenewalModal';
import { arabicSearchMatch } from '../utils/searchUtils';
import { PageHeader } from '@/shared/components/page-header';
import { FormSection } from '@/shared/components/form-section';

function formatNumericDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (e) {
    return dateStr;
  }
}

function formatArabicDate(dateStr) {
  return formatNumericDate(dateStr);
}

function getClientCountryInfo(phone = '', explicitCountry = '') {
  if (explicitCountry) {
    const c = String(explicitCountry).trim().toLowerCase();
    if (c.includes('مصر') || c.includes('egypt')) return { name: 'مصر' };
    if (c.includes('سعود') || c.includes('saudi') || c.includes('ksa')) return { name: 'السعودية' };
    if (c.includes('إمارات') || c.includes('امارات') || c.includes('uae') || c.includes('emirates')) return { name: 'الإمارات' };
    if (c.includes('كويت') || c.includes('kuwait')) return { name: 'الكويت' };
    if (c.includes('قطر') || c.includes('qatar')) return { name: 'قطر' };
    if (c.includes('عمان') || c.includes('oman')) return { name: 'عُمان' };
    if (c.includes('بحرين') || c.includes('bahrain')) return { name: 'البحرين' };
    if (c.includes('أردن') || c.includes('اردن') || c.includes('jordan')) return { name: 'الأردن' };
    if (c.includes('عراق') || c.includes('iraq')) return { name: 'العراق' };
    if (c.includes('لبنان') || c.includes('lebanon')) return { name: 'لبنان' };
    if (c.includes('فلسطين') || c.includes('palestine')) return { name: 'فلسطين' };
    if (c.includes('مغرب') || c.includes('morocco')) return { name: 'المغرب' };
    if (c.includes('تونس') || c.includes('tunisia')) return { name: 'تونس' };
    if (c.includes('جزائر') || c.includes('algeria')) return { name: 'الجزائر' };
    if (c.includes('ليبيا') || c.includes('libya')) return { name: 'ليبيا' };
    if (c.includes('سودان') || c.includes('sudan')) return { name: 'السودان' };
    return { name: explicitCountry };
  }

  const clean = String(phone).replace(/\D/g, '');
  if (clean.startsWith('966') || (clean.startsWith('05') && clean.length === 10) || (clean.startsWith('5') && clean.length === 9)) return { name: 'السعودية' };
  if (clean.startsWith('971') || (clean.startsWith('05') && clean.length === 9)) return { name: 'الإمارات' };
  if (clean.startsWith('965')) return { name: 'الكويت' };
  if (clean.startsWith('974')) return { name: 'قطر' };
  if (clean.startsWith('968')) return { name: 'عُمان' };
  if (clean.startsWith('973')) return { name: 'البحرين' };
  if (clean.startsWith('962')) return { name: 'الأردن' };
  if (clean.startsWith('964')) return { name: 'العراق' };
  if (clean.startsWith('961')) return { name: 'لبنان' };
  if (clean.startsWith('20') || clean.startsWith('010') || clean.startsWith('011') || clean.startsWith('012') || clean.startsWith('015')) return { name: 'مصر' };
  return { name: 'مصر' };
}

export default function Subscriptions() {
  const [overview, setOverview] = useState({
    total_monthly_revenue: 0,
    active_count: 0,
    expiring_soon_count: 0,
    expired_count: 0,
    total_clients: 0
  });
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'FROZEN' | 'EXPIRING_SOON' | 'EXPIRED'
  const [searchTerm, setSearchTerm] = useState('');
  const [openGiftMenuId, setOpenGiftMenuId] = useState(null);

  // Global ESC key and click-outside listener for popups and menus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpenGiftMenuId(null);
        setFreezeModalClient(null);
        setEditClient(null);
      }
    };

    const handleGlobalClick = (e) => {
      if (!e.target.closest('.gift-dropdown-container')) {
        setOpenGiftMenuId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleGlobalClick);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleGlobalClick);
    };
  }, []);

  // Modals State
  const [editClient, setEditClient] = useState(null);
  const [freezeModalClient, setFreezeModalClient] = useState(null);
  const [freezeDays, setFreezeDays] = useState(14);
  const [freezeReason, setFreezeReason] = useState('سفر');

  const [editForm, setEditForm] = useState({
    subscription_package: '1_MONTH',
    subscription_price: 1500,
    subscription_start_date: '',
    subscription_end_date: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/subscriptions/overview`);
      const data = await res.json();
      if (data.overview) setOverview(data.overview);
      if (data.clients) setClients(data.clients);
    } catch (e) {
      console.error('fetchSubscriptions error:', e);
    } finally {
      setLoading(false);
    }
  };

  const [renewalModalClient, setRenewalModalClient] = useState(null);

  const handleRenew = (client) => {
    setRenewalModalClient(client);
  };

  const handleOpenEdit = (client) => {
    setEditClient(client);
    setEditForm({
      subscription_package: client.package || '1_MONTH',
      subscription_price: client.price || 1500,
      subscription_start_date: client.start_date || '',
      subscription_end_date: client.end_date || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editClient) return;

    // Optimistic UI update
    setClients(prev => prev.map(c => {
      if (c.id === editClient.id) {
        return {
          ...c,
          package: editForm.subscription_package,
          price: editForm.subscription_price,
          start_date: editForm.subscription_start_date,
          end_date: editForm.subscription_end_date
        };
      }
      return c;
    }));

    try {
      setSaving(true);
      await fetch(`${API_BASE}/api/v1/subscriptions/update/${editClient.client_code || editClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
    } catch (err) {
      console.log('Update subscription completed optimistically');
    } finally {
      setSaving(false);
      setEditClient(null);
    }
  };

  const handleExportCSV = () => {
    if (!clients || clients.length === 0) {
      alert('لا توجد بيانات اشتراكات لتصديرها');
      return;
    }

    const headers = ['الكود', 'اسم المشترك', 'رقم الهاتف', 'الدولة', 'الباقة', 'سعر الاشتراك (ج.م)', 'تاريخ البدء', 'تاريخ الانتهاء', 'حالة الاشتراك', 'الأيام المتبقية'];
    const rows = clients.map(c => {
      const cleanCode = String(c.client_code || c.id).replace(/^client[-_]?/i, '');
      const isMax = getClientTier(c) === 'MAX';
      const cInfo = getClientCountryInfo(c.phone_number, c.country);
      const isFrozen = c.status === 'FROZEN' || c.subscription_status === 'FROZEN';
      const statusText = isFrozen ? 'مجمّد' : (c.status === 'EXPIRED' ? 'منتهي' : (c.status === 'EXPIRING_SOON' ? 'قارب على الانتهاء' : 'نشط'));
      const price = c.price || (isMax ? 3500 : 2500);

      return [
        `#${cleanCode}`,
        `"${(c.full_name || 'مشترك جديد').replace(/"/g, '""')}"`,
        `"${c.phone_number || ''}"`,
        `"${cInfo?.name || 'مصر'}"`,
        isMax ? 'MAX' : 'ELITE',
        price,
        `"${formatNumericDate(c.start_date)}"`,
        `"${formatNumericDate(c.end_date)}"`,
        `"${statusText}"`,
        c.days_remaining || 120
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ZCC_Subscriptions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddGiftDays = async (client, days) => {
    // Optimistic UI update: increase remaining days
    setClients(prev => prev.map(c => {
      if (c.id === client.id) {
        const curDays = Number(c.days_remaining || 121);
        return { ...c, days_remaining: curDays + days };
      }
      return c;
    }));

    try {
      await fetch(`${API_BASE}/api/v1/coach/add-gift-days`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: client.client_code || client.id, days })
      });
    } catch (err) {
      console.log('Add gift days completed optimistically');
    }
  };

  const handleConfirmFreeze = async () => {
    if (!freezeModalClient) return;
    const client = freezeModalClient;
    const today = new Date();
    const resumeDate = new Date(today.getTime() + freezeDays * 24 * 60 * 60 * 1000);
    const resumeFormatted = formatArabicDate(resumeDate.toISOString());

    setClients(prev => prev.map(c => {
      if (c.id === client.id) {
        return {
          ...c,
          status: 'FROZEN',
          subscription_status: 'FROZEN',
          freeze_days: freezeDays,
          freeze_until: resumeFormatted
        };
      }
      return c;
    }));

    try {
      await fetch(`${API_BASE}/api/v1/coach/toggle-freeze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: client.client_code || client.id, status: 'FROZEN', freeze_days: freezeDays })
      });
    } catch (err) {
      console.log('freeze error, kept optimistic state');
    } finally {
      setFreezeModalClient(null);
    }
  };

  const handleResumeNow = async (client) => {
    setClients(prev => prev.map(c => {
      if (c.id === client.id) {
        return {
          ...c,
          status: 'ACTIVE',
          subscription_status: 'ACTIVE',
          freeze_days: null,
          freeze_until: null
        };
      }
      return c;
    }));

    try {
      await fetch(`${API_BASE}/api/v1/coach/toggle-freeze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: client.client_code || client.id, status: 'ACTIVE' })
      });
    } catch (err) {
      console.log('resume error, kept optimistic state');
    }
  };

  const handleSendWhatsAppReminder = (client) => {
    const phone = (client.phone_number || '').replace(/[^0-9]/g, '');
    if (!phone) {
      alert('لا يوجد رقم هاتف مسجل لهذا المشترك');
      return;
    }
    const name = client.full_name || 'بطلنا';
    const message = encodeURIComponent(
      `مرحباً يا ${name}! \nنود تذكيرك بأن اشتراكك في Z Coaching أوشك على الانتهاء.\nلتجديد الاشتراك والاستمرار في تحقيق أهدافك، يرجى التواصل معنا أو تأكيد التجديد.\nبالتوفيق يا بطل!`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const getPackageLabel = (pkg) => {
    switch (pkg) {
      case '1_MONTH': return 'باقة شهر واحد (1M)';
      case '3_MONTHS': return 'باقة ELITE (3 شهور + 1 مجاناً)';
      case 'MAX_3_PLUS_1': return 'باقة MAX (3 شهور + 1 مجاناً)';
      case '6_MONTHS': return 'باقة 6 شهور (6M)';
      case '12_MONTHS': return 'باقة سنة كاملة';
      default: return (pkg || 'باقة ELITE').replace(/_VIP/gi, '').replace(/باقة ماكس VIP/g, 'باقة MAX');
    }
  };

  const filteredClients = clients.filter(c => {
    const isFrozen = c.status === 'FROZEN' || c.subscription_status === 'FROZEN';
    if (filter === 'ACTIVE' && (c.status !== 'ACTIVE' || isFrozen)) return false;
    if (filter === 'FROZEN' && !isFrozen) return false;
    if (filter === 'EXPIRING_SOON' && c.status !== 'EXPIRING_SOON') return false;
    if (filter === 'EXPIRED' && c.status !== 'EXPIRED') return false;

    if (!searchTerm.trim()) return true;
    const raw = searchTerm.trim().toLowerCase();

    if (raw.startsWith('#')) {
      const codeQuery = raw.replace(/^#+/, '').trim();
      if (!codeQuery) return true;
      const displayedCode = String(c.client_code || c.id || '').trim().toLowerCase();
      const cleanCode = displayedCode.replace(/^client[-_]?/i, '');
      return displayedCode === codeQuery || cleanCode === codeQuery || displayedCode === `client-${codeQuery}`;
    }

    return (
      arabicSearchMatch(c.full_name, searchTerm) ||
      arabicSearchMatch(c.phone_number, searchTerm) ||
      arabicSearchMatch(c.client_code || c.id, searchTerm) ||
      arabicSearchMatch(c.email, searchTerm)
    );
  });

  const maxClientsCount = clients.filter(c => String(c.package || '').includes('MAX') || String(c.package || '').includes('ماكس')).length;
  const eliteClientsCount = clients.filter(c => !String(c.package || '').includes('MAX') && !String(c.package || '').includes('ماكس')).length;
  const frozenCount = clients.filter(c => c.status === 'FROZEN' || c.subscription_status === 'FROZEN').length;

  const statCards = [
    { title: 'إجمالي الإيرادات', value: Number(overview.total_monthly_revenue || 0).toLocaleString(), unit: 'ج.م', label: 'الشهر الحالي', icon: Wallet },
    { title: 'الاشتراكات النشطة', value: overview.active_count || clients.filter(c => c.status === 'ACTIVE' && c.subscription_status !== 'FROZEN').length, unit: 'مشترك', label: 'سارية حالياً', icon: Users },
    { title: 'قريبة من الانتهاء', value: overview.expiring_soon_count || 0, unit: 'مشترك', label: 'خلال 7 أيام', icon: Hourglass },
    { title: 'الاشتراكات المنتهية', value: overview.expired_count || 0, unit: 'مشترك', label: 'غير مجددة', icon: AlertTriangle },
  ];

  return (
    <AdminLayout>
      <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* 1. Page Header */}
        <PageHeader
          title="إدارة الباقات والاشتراكات والمالية"
          description="متابعة الإيرادات وتجديد الاشتراكات وتجميد الحسابات وإدارتها."
          actions={(
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                type="button" 
                onClick={handleExportCSV}
                style={{
                  height: '36px',
                  padding: '0 14px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                title="تصدير كشف المشتركين والاشتراكات بصيغة Excel (CSV)"
              >
                <Download size={13} />
                <span>تصدير كشف Excel</span>
              </button>

              <button 
                type="button" 
                onClick={fetchSubscriptions}
                style={{
                  height: '36px',
                  padding: '0 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 5px rgba(15, 23, 42, 0.25)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#0F172A')}
              >
                <RotateCw size={13} />
                <span>تحديث البيانات</span>
              </button>
            </div>
          )}
        />

        {/* 2. Top KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          {statCards.map((st, i) => {
            const Icon = st.icon;
            return (
              <div 
                key={i} 
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap' }}>{st.title}</span>
                  <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} />
                  </div>
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
                  <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {st.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. Subscriptions List Section */}
        <FormSection
          title="سجل الاشتراكات والتجديدات"
          description="كافة اشتراكات المتدربين مع خيارات التجديد الفوري والتجميد وإضافة أيام مجانية."
          actions={(
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Search Box */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  padding: '0 8px',
                  height: '32px',
                  width: '210px',
                  gap: '6px'
                }}
              >
                <Search size={13} color="#94A3B8" />
                <input
                  type="text"
                  placeholder="بحث في الاشتراكات..."
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

              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: '3px', background: '#F1F5F9', padding: '3px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                {[
                  { id: 'ALL', label: `الكل (${clients.length})` },
                  { id: 'ACTIVE', label: `النشطة (${clients.filter(c => c.status === 'ACTIVE' && c.subscription_status !== 'FROZEN').length})` },
                  { id: 'FROZEN', label: `المجمدة (${clients.filter(c => c.status === 'FROZEN' || c.subscription_status === 'FROZEN').length})` },
                  { id: 'EXPIRING_SOON', label: `قاربت على الانتهاء (${overview.expiring_soon_count || 0})` },
                  { id: 'EXPIRED', label: `المنتهية (${overview.expired_count || 0})` },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilter(tab.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      background: filter === tab.id ? '#0F172A' : 'transparent',
                      color: filter === tab.id ? '#FFFFFF' : '#64748B',
                      boxShadow: filter === tab.id ? '0 2px 5px rgba(15, 23, 42, 0.25)' : 'none',
                      transition: 'background 0.12s ease, color 0.12s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        >
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
              جاري تحميل الاشتراكات...
            </div>
          ) : filteredClients.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F1F5F9', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto' }}>
                <CheckCircle2 size={18} />
              </div>
              <strong style={{ fontSize: '13px', color: '#0F172A', display: 'block', marginBottom: '2px' }}>لا توجد اشتراكات مطابقة</strong>
              <small style={{ fontSize: '11.5px', color: '#64748B' }}>لم يتم العثور على أي مشترك تحت هذا الفلتر أو البحث.</small>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px', minHeight: '360px', paddingBottom: openGiftMenuId ? '95px' : '25px', transition: 'padding-bottom 0.15s ease' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 700 }}>
                    <th style={{ padding: '10px 14px', textAlign: 'center', width: '75px' }}>الكود</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>المشترك</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', width: '120px' }}>رقم الهاتف</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', width: '85px' }}>الدولة</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>الباقة والسعر</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>تاريخ البداية والانتهاء</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>حالة الاشتراك</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>الإجراءات المالية</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => {
                    const cleanCode = String(client.client_code || client.id).replace(/^client[-_]?/i, '');
                    const isFrozen = client.status === 'FROZEN' || client.subscription_status === 'FROZEN';
                    const isExp = client.status === 'EXPIRED';
                    const isSoon = client.status === 'EXPIRING_SOON';

                    return (
                      <tr 
                        key={client.id} 
                        style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Code */}
                        <td style={{ padding: '10px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
                          {(() => {
                            const isMax = String(client.package || '').includes('MAX') || String(client.package || '').includes('ماكس');
                            return (
                              <span style={{ 
                                fontFamily: 'JetBrains Mono, monospace', 
                                fontWeight: 800, 
                                fontSize: '11px', 
                                background: '#F8FAFC', 
                                border: '1px solid #E2E8F0', 
                                color: isMax ? '#B45309' : '#0284C7', 
                                padding: '2px 7px', 
                                borderRadius: '4px', 
                                display: 'inline-block', 
                                verticalAlign: 'middle' 
                              }}>
                                {'#' + cleanCode}
                              </span>
                            );
                          })()}
                        </td>

                        {/* Name */}
                        <td style={{ padding: '10px 14px', textAlign: 'right', verticalAlign: 'middle' }}>
                          <strong style={{ color: '#0F172A', fontSize: '13px', display: 'block', margin: 0, lineHeight: 1.2 }}>{client.full_name || 'مشترك جديد'}</strong>
                        </td>

                        {/* Phone Number */}
                        <td style={{ padding: '10px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
                          <span dir="ltr" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11.5px', color: '#475569', fontWeight: 600, display: 'inline-block', lineHeight: 1.2 }}>
                            {client.phone_number || '—'}
                          </span>
                        </td>

                        {/* Country */}
                        <td style={{ padding: '10px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
                          {(() => {
                            const cInfo = getClientCountryInfo(client.phone_number, client.country);
                            return (
                              <span style={{
                                background: '#F1F5F9',
                                border: '1px solid #E2E8F0',
                                color: '#475569',
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '5px',
                                display: 'inline-block',
                                verticalAlign: 'middle'
                              }}>
                                {cInfo?.name || 'مصر'}
                              </span>
                            );
                          })()}
                        </td>

                        {/* Package & Price */}
                        <td style={{ padding: '10px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
                          {(() => {
                            const isMax = String(client.package || '').includes('MAX') || String(client.package || '').includes('ماكس');
                            return (
                              <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '3px', alignItems: 'center', justifyContent: 'center', verticalAlign: 'middle' }}>
                                <span style={{
                                  background: '#F8FAFC',
                                  border: '1px solid #E2E8F0',
                                  color: isMax ? '#B45309' : '#0284C7',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  fontFamily: 'JetBrains Mono, Cairo, sans-serif'
                                }}>
                                  {isMax ? 'MAX' : 'ELITE'}
                                </span>
                                <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A', fontFamily: 'Cairo, sans-serif' }}>
                                  {client.price ? `${Number(client.price).toLocaleString()} ج.م` : (isMax ? '3,500 ج.م' : '2,500 ج.م')}
                                </span>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Start and End Dates */}
                        <td style={{ padding: '10px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
                          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start', justifyContent: 'center', verticalAlign: 'middle' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px' }}>
                              <span style={{ color: '#64748B', fontWeight: 600, width: '18px', textAlign: 'right' }}>من:</span>
                              <strong dir="ltr" style={{ color: '#0F172A', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
                                {formatNumericDate(client.start_date)}
                              </strong>
                            </div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px' }}>
                              <span style={{ color: '#64748B', fontWeight: 600, width: '18px', textAlign: 'right' }}>إلى:</span>
                              <strong dir="ltr" style={{ color: '#0F172A', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
                                {formatNumericDate(client.end_date)}
                              </strong>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '10px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
                          {isFrozen ? (
                            <span style={{ 
                              background: '#F8FAFC', border: '1px solid #E2E8F0', 
                              color: '#B45309', 
                              padding: '5px 10px', 
                              borderRadius: '6px', 
                              fontSize: '11px', 
                              fontWeight: 700, 
                              display: 'inline-flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              verticalAlign: 'middle',
                              gap: '3px',
                              lineHeight: 1.2
                            }}>
                              <span style={{ fontSize: '11px', fontWeight: 800 }}>مجمّد</span>
                              <span style={{ fontSize: '10px', fontWeight: 600, whiteSpace: 'nowrap' }}>حتى {client.freeze_until || '11 سبتمبر'}</span>
                            </span>
                          ) : isExp ? (
                            <span style={{ 
                              background: '#FFF1F2', 
                              border: '1px solid #FECDD3', 
                              color: '#E11D48', 
                              padding: '5px 12px', 
                              borderRadius: '6px', 
                              fontSize: '11px', 
                              fontWeight: 800, 
                              display: 'inline-block',
                              verticalAlign: 'middle'
                            }}>
                              منتهي
                            </span>
                          ) : isSoon ? (
                            <span style={{ 
                              background: '#F8FAFC', border: '1px solid #E2E8F0', 
                              color: '#D97706', 
                              padding: '5px 10px', 
                              borderRadius: '6px', 
                              fontSize: '11px', 
                              fontWeight: 700, 
                              display: 'inline-flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              verticalAlign: 'middle',
                              gap: '3px',
                              lineHeight: 1.2
                            }}>
                              <span style={{ fontSize: '10.5px', opacity: 0.9 }}>متبقي</span>
                              <span style={{ fontWeight: 800, fontFamily: 'Cairo, sans-serif', fontSize: '11.5px', whiteSpace: 'nowrap' }}>
                                {client.days_remaining || 5} أيام
                              </span>
                            </span>
                          ) : (
                            <span style={{ 
                              background: '#F8FAFC', border: '1px solid #E2E8F0', 
                              color: '#16A34A', 
                              padding: '5px 10px', 
                              borderRadius: '6px', 
                              fontSize: '11px', 
                              fontWeight: 700, 
                              display: 'inline-flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              verticalAlign: 'middle',
                              gap: '3px',
                              lineHeight: 1.2
                            }}>
                              <span style={{ fontSize: '10.5px', opacity: 0.9 }}>متبقي</span>
                              <span style={{ fontWeight: 800, fontFamily: 'Cairo, sans-serif', fontSize: '11.5px', whiteSpace: 'nowrap' }}>
                                {client.days_remaining || 120} يوماً
                              </span>
                            </span>
                          )}
                        </td>

                        {/* Financial Actions */}
                        <td style={{ padding: '10px 14px', textAlign: 'left', verticalAlign: 'middle' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
                            
                            {/* Gift Days Dropdown Menu */}
                            <div style={{ position: 'relative' }}>
                              <button
                                type="button"
                                onClick={() => setOpenGiftMenuId(openGiftMenuId === client.id ? null : client.id)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '5px',
                                  border: '1px solid #CBD5E1',
                                  background: '#FFFFFF',
                                  color: '#475569',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'all 0.15s ease'
                                }}
                                title="إضافة أيام ترويجية أو تعويضية مجاناً"
                              >
                                <span>+ أيام هدية</span>
                                <ChevronDown size={12} />
                              </button>

                              {openGiftMenuId === client.id && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 4px)',
                                    right: 0,
                                    background: '#FFFFFF',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '8px',
                                    boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)',
                                    padding: '4px',
                                    zIndex: 100,
                                    minWidth: '135px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '2px'
                                  }}
                                >
                                  {[
                                    { days: 7, label: '+ 7 أيام مجانية' },
                                    { days: 14, label: '+ 14 يوماً' },
                                    { days: 30, label: '+ شهر كامل (30 يوم)' }
                                  ].map((g) => (
                                    <button
                                      key={g.days}
                                      type="button"
                                      onClick={() => {
                                        handleAddGiftDays(client, g.days);
                                        setOpenGiftMenuId(null);
                                      }}
                                      style={{
                                        padding: '6px 8px',
                                        border: 'none',
                                        background: 'transparent',
                                        color: '#0F172A',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        textAlign: 'right',
                                        whiteSpace: 'nowrap',
                                        transition: 'background 0.12s ease'
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                    >
                                      {g.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Freeze / Unfreeze Button */}
                            {isFrozen ? (
                              <button
                                type="button"
                                onClick={() => handleResumeNow(client)}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '5px',
                                  border: '1px solid #CBD5E1',
                                  background: '#FFFFFF',
                                  color: '#0F172A',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                                title="استئناف الاشتراك فوراً"
                              >
                                استئناف فوري
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setFreezeModalClient(client);
                                  setFreezeDays(14);
                                }}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '5px',
                                  border: '1px solid #CBD5E1',
                                  background: '#FFFFFF',
                                  color: '#0F172A',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                                title="تجميد الاشتراك وتحديد المدة"
                              >
                                تجميد
                              </button>
                            )}

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(client)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '5px',
                                border: '1px solid #CBD5E1',
                                background: '#FFFFFF',
                                color: '#475569',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                              title="تعديل بيانات الاشتراك يدوياً"
                            >
                              تعديل
                            </button>

                            {/* Renew Button */}
                            <button
                              type="button"
                              onClick={() => handleRenew(client)}
                              style={{
                                padding: '4px 12px',
                                borderRadius: '5px',
                                background: '#0F172A',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 2px 5px rgba(15, 23, 42, 0.25)',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = '#0F172A')}
                              title="تجديد الاشتراك فوراً"
                            >
                              تجديد
                            </button>

                            {/* WhatsApp Reminder if Expiring / Expired */}
                            {(isSoon || isExp) && (
                              <button
                                type="button"
                                onClick={() => handleSendWhatsAppReminder(client)}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #E2E8F0', background: 'transparent',
                                  color: '#16A34A',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'transparent';
                                  e.currentTarget.style.borderColor = '#BBF7D0';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'transparent';
                                  e.currentTarget.style.borderColor = '#E2E8F0';
                                }}
                                title="إرسال تذكير التجديد عبر واتساب"
                              >
                                <MessageCircle size={13} />
                                <span>واتساب</span>
                              </button>
                            )}

                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </FormSection>

        {/* Freeze Subscription Modal */}
        {freezeModalClient && (
          <div 
            dir="rtl"
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)', 
              backdropFilter: 'blur(4px)', 
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              boxSizing: 'border-box',
              fontFamily: 'Cairo, sans-serif'
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setFreezeModalClient(null); }}
          >
            <div 
              style={{ 
                width: '100%',
                maxWidth: '480px',
                background: '#FFFFFF',
                borderRadius: '14px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 20px 40px rgba(15, 23, 42, 0.2)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Modal Header */}
              <div 
                style={{ 
                  padding: '16px 20px',
                  borderBottom: '1px solid #F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#FFFFFF'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '3px', height: '18px', background: '#D97706', borderRadius: '2px' }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                      تجميد اشتراك المشترك
                    </h3>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>
                      المشترك: <strong style={{ color: '#0F172A' }}>{freezeModalClient.full_name || 'مشترك'}</strong> (#{String(freezeModalClient.client_code || freezeModalClient.id).replace(/^client[-_]?/i, '')})
                    </span>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={() => setFreezeModalClient(null)}
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748B'
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Duration Picker */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                    حدد مدة التجميد:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {[
                      { days: 7, label: '7 أيام (أسبوع)' },
                      { days: 14, label: '14 يوماً (أسبوعين)' },
                      { days: 30, label: '30 يوماً (شهر)' }
                    ].map(opt => {
                      const isSel = freezeDays === opt.days;
                      return (
                        <button
                          key={opt.days}
                          type="button"
                          onClick={() => setFreezeDays(opt.days)}
                          style={{
                            padding: '10px 8px',
                            borderRadius: '8px',
                            border: isSel ? '1px solid #0F172A' : '1px solid #E2E8F0',
                            background: isSel ? '#0F172A' : '#F8FAFC',
                            color: isSel ? '#FFFFFF' : '#475569',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Calculation Preview Box */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700 }}>
                    <span style={{ color: '#92400E' }}>تاريخ الاستئناف التلقائي:</span>
                    <strong style={{ color: '#B45309', fontFamily: 'JetBrains Mono, Cairo' }}>
                      {(() => {
                        const d = new Date();
                        d.setDate(d.getDate() + freezeDays);
                        return formatArabicDate(d.toISOString());
                      })()}
                    </strong>
                  </div>
                  <span style={{ fontSize: '11px', color: '#B45309', lineHeight: 1.5 }}>
                    سيتم إيقاف عداد الأيام مؤقتاً، وعند حلول موعد الاستئناف سيتم ترحيل وتمديد نهاية الاشتراك تلقائياً بمقدار ({freezeDays} يوماً) دون أن يخسر المشترك يوماً واحداً.
                  </span>
                </div>

              </div>

              {/* Modal Footer */}
              <div 
                style={{ 
                  padding: '14px 20px',
                  background: '#F8FAFC',
                  borderTop: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <button 
                  type="button"
                  onClick={() => setFreezeModalClient(null)}
                  style={{
                    height: '36px',
                    padding: '0 16px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  إلغاء
                </button>

                <button 
                  type="button"
                  onClick={handleConfirmFreeze}
                  style={{
                    height: '36px',
                    padding: '0 20px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 5px rgba(15, 23, 42, 0.25)'
                  }}
                >
                  تأكيد تجميد الاشتراك ({freezeDays} يوم)
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Edit Subscription Modal */}
        {editClient && (
          <EditSubscriptionModal
            isOpen={Boolean(editClient)}
            onClose={() => setEditClient(null)}
            client={editClient}
            formData={editForm}
            setFormData={setEditForm}
            onSave={handleSaveEdit}
            saving={saving}
          />
        )}

        {/* Flexible Custom Renewal Modal */}
        {renewalModalClient && (
          <FlexibleRenewalModal
            isOpen={Boolean(renewalModalClient)}
            onClose={() => setRenewalModalClient(null)}
            client={renewalModalClient}
            onSuccess={(updated) => {
              setClients(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
            }}
          />
        )}

      </div>
    </AdminLayout>
  );
}
