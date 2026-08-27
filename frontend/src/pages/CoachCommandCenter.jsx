import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  Hourglass, 
  Plus, 
  MessageCircle, 
  CheckCircle2, 
  ShieldAlert, 
  Check,
  ExternalLink,
  Sparkles,
  ClipboardList,
  RefreshCw,
  Loader2,
  Search
} from 'lucide-react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import NewClientQuickModal from '../components/modals/NewClientQuickModal';
import { PageHeader } from '@/shared/components/page-header';
import { FormSection } from '@/shared/components/form-section';

// Smart 1-Click WhatsApp Pre-filled Message Generator
export function getWhatsAppMessage(action) {
  const name = action?.clientName ? action.clientName.replace(/مشترك #\d+/g, 'يا بطل').trim() : 'يا بطل';
  const cleanTier = String(action?.tier || '').includes('MAX') ? 'MAX' : 'ELITE';

  if (action?.type === 'INJURY') {
    return encodeURIComponent(`أهلاً يا ${name}! قرأت تفاصيل الإصابة / الألم اللي سجلته في الاستمارة، لا تقلق بنعدل التمارين ونحط بدائل آمنة تناسبك 100% 🛡️`);
  }
  if (action?.type === 'CHECKIN') {
    return encodeURIComponent(`أهلاً يا ${name}! استلمت تقييمك الأسبوعي وجاري الآن مراجعة القياسات والأداء وتحديث الخطة 💪`);
  }
  if (action?.type === 'RENEWAL') {
    return encodeURIComponent(`أهلاً يا ${name}! نود تذكيرك بأن اشتراكك في باقة ${cleanTier} قارب على الانتهاء. لتجديد الاشتراك والاستمرار في تحقيق أهدافك تواصل معنا 🌟`);
  }
  return encodeURIComponent(`أهلاً يا ${name}! استلمت استمارتك بنجاح وجاري الآن مراجعة بياناتك وتجهيز خطتك التدريبية والغذائية المخصصة 🚀✨`);
}

// Smart Universal Country & Flag Detector
export function getClientCountryInfo(phone = '', explicitCountry = '') {
  if (explicitCountry) {
    const c = String(explicitCountry).trim().toLowerCase();
    if (c.includes('مصر') || c.includes('egypt')) return { name: 'مصر', flag: '🇪🇬' };
    if (c.includes('سعود') || c.includes('saudi') || c.includes('ksa')) return { name: 'السعودية', flag: '🇸🇦' };
    if (c.includes('إمارات') || c.includes('امارات') || c.includes('uae') || c.includes('emirates')) return { name: 'الإمارات', flag: '🇦🇪' };
    if (c.includes('كويت') || c.includes('kuwait')) return { name: 'الكويت', flag: '🇰🇼' };
    if (c.includes('قطر') || c.includes('qatar')) return { name: 'قطر', flag: '🇶🇦' };
    if (c.includes('عمان') || c.includes('oman')) return { name: 'عُمان', flag: '🇴🇲' };
    if (c.includes('بحرين') || c.includes('bahrain')) return { name: 'البحرين', flag: '🇧🇭' };
    if (c.includes('أردن') || c.includes('اردن') || c.includes('jordan')) return { name: 'الأردن', flag: '🇯🇴' };
    if (c.includes('عراق') || c.includes('iraq')) return { name: 'العراق', flag: '🇮🇶' };
    if (c.includes('لبنان') || c.includes('lebanon')) return { name: 'لبنان', flag: '🇱🇧' };
    if (c.includes('فلسطين') || c.includes('palestine')) return { name: 'فلسطين', flag: '🇵🇸' };
    if (c.includes('مغرب') || c.includes('morocco')) return { name: 'المغرب', flag: '🇲🇦' };
    if (c.includes('تونس') || c.includes('tunisia')) return { name: 'تونس', flag: '🇹🇳' };
    if (c.includes('جزائر') || c.includes('algeria')) return { name: 'الجزائر', flag: '🇩🇿' };
    if (c.includes('ليبيا') || c.includes('libya')) return { name: 'ليبيا', flag: '🇱🇾' };
    if (c.includes('سودان') || c.includes('sudan')) return { name: 'السودان', flag: '🇸🇩' };
    if (c.includes('يمن') || c.includes('yemen')) return { name: 'اليمن', flag: '🇾🇪' };
    if (c.includes('أمريكا') || c.includes('امريكا') || c.includes('usa') || c.includes('united states')) return { name: 'أمريكا', flag: '🇺🇸' };
    if (c.includes('بريطانيا') || c.includes('uk') || c.includes('england')) return { name: 'بريطانيا', flag: '🇬🇧' };
    if (c.includes('ألمانيا') || c.includes('المانيا') || c.includes('germany')) return { name: 'ألمانيا', flag: '🇩🇪' };
    if (c.includes('كندا') || c.includes('canada')) return { name: 'كندا', flag: '🇨🇦' };
    return { name: explicitCountry, flag: '🌍' };
  }

  const clean = String(phone).replace(/\D/g, '');
  if (clean.startsWith('966')) return { name: 'السعودية', flag: '🇸🇦' };
  if (clean.startsWith('971')) return { name: 'الإمارات', flag: '🇦🇪' };
  if (clean.startsWith('965')) return { name: 'الكويت', flag: '🇰🇼' };
  if (clean.startsWith('974')) return { name: 'قطر', flag: '🇶🇦' };
  if (clean.startsWith('968')) return { name: 'عُمان', flag: '🇴🇲' };
  if (clean.startsWith('973')) return { name: 'البحرين', flag: '🇧🇭' };
  if (clean.startsWith('962')) return { name: 'الأردن', flag: '🇯🇴' };
  if (clean.startsWith('964')) return { name: 'العراق', flag: '🇮🇶' };
  if (clean.startsWith('961')) return { name: 'لبنان', flag: '🇱🇧' };
  if (clean.startsWith('970') || clean.startsWith('972')) return { name: 'فلسطين', flag: '🇵🇸' };
  if (clean.startsWith('212')) return { name: 'المغرب', flag: '🇲🇦' };
  if (clean.startsWith('216')) return { name: 'تونس', flag: '🇹🇳' };
  if (clean.startsWith('213')) return { name: 'الجزائر', flag: '🇩🇿' };
  if (clean.startsWith('218')) return { name: 'ليبيا', flag: '🇱🇾' };
  if (clean.startsWith('249')) return { name: 'السودان', flag: '🇸🇩' };
  if (clean.startsWith('967')) return { name: 'اليمن', flag: '🇾🇪' };
  if (clean.startsWith('44')) return { name: 'بريطانيا', flag: '🇬🇧' };
  if (clean.startsWith('49')) return { name: 'ألمانيا', flag: '🇩🇪' };
  if (clean.startsWith('33')) return { name: 'فرنسا', flag: '🇫🇷' };
  if (clean.startsWith('39')) return { name: 'إيطاليا', flag: '🇮🇹' };
  if (clean.startsWith('90')) return { name: 'تركيا', flag: '🇹🇷' };
  if (clean.startsWith('1')) return { name: 'أمريكا / كندا', flag: '🇺🇸' };
  if (clean.startsWith('20') || clean.startsWith('010') || clean.startsWith('011') || clean.startsWith('012') || clean.startsWith('015')) return { name: 'مصر', flag: '🇪🇬' };
  
  return { name: 'مصر', flag: '🇪🇬' }; // Default
}

// Smart Package Badge Styler (Gold for MAX, Light Blue for ELITE)
export function getPackageBadgeStyle(pkgStr = '') {
  const clean = String(pkgStr || '').trim().toUpperCase();
  const isMax = clean.includes('MAX') || clean.includes('ماكس');
  
  let label = String(pkgStr || '')
    .replace(/_VIP/gi, '')
    .replace(/_4M/gi, '')
    .replace(/_8M/gi, '')
    .replace(/_3_PLUS_1/gi, '')
    .replace(/_TRANSFORM/gi, '')
    .replace(/ VIP/gi, '')
    .replace(/باقة ماكس VIP/g, 'MAX')
    .replace(/باقة ماكس/g, 'MAX')
    .replace(/باقة إيليت/g, 'ELITE')
    .replace(/باقة /g, '')
    .trim();

  if (!label || label === 'MAX' || label === 'ELITE') label = isMax ? 'MAX' : 'ELITE';

  return {
    label,
    background: '#F1F5F9',
    border: '1px solid #E2E8F0',
    color: isMax ? '#C4952D' : '#0284C7'
  };
}

// Relative / Clean Time Ago Formatter
export function formatTimeAgo(dateStr) {
  if (!dateStr) return 'اليوم';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'اليوم';
    const now = new Date();
    const diffMs = now - d;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'الآن';
    if (diffHours < 24) return `منذ ${diffHours} س`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    return d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
  } catch (e) {
    return 'اليوم';
  }
}

export default function CoachCommandCenter() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'CHECKIN' | 'CLINICAL' | 'INACTIVE' | 'RENEWAL'
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Live Server Data
  const [overview, setOverview] = useState({
    total_monthly_revenue: 0,
    active_count: 0,
    expiring_soon_count: 0,
    expired_count: 0,
    total_clients: 0
  });
  const [clients, setClients] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [subOverviewRes, intakeRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/v1/subscriptions/overview`),
        fetch(`${API_BASE}/api/v1/intake/submissions`)
      ]);

      if (subOverviewRes.status === 'fulfilled' && subOverviewRes.value && subOverviewRes.value.ok) {
        try {
          const subData = await subOverviewRes.value.json();
          if (subData && subData.overview) setOverview(subData.overview);
          if (subData && Array.isArray(subData.clients)) setClients(subData.clients);
        } catch (e) {}
      }

      if (intakeRes.status === 'fulfilled' && intakeRes.value && intakeRes.value.ok) {
        try {
          const intakeData = await intakeRes.value.json();
          if (intakeData && Array.isArray(intakeData.submissions)) setSubmissions(intakeData.submissions);
        } catch (e) {}
      }
    } catch (err) {
      console.error('Error fetching dashboard live data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Safe Arrays
  const safeSubmissions = Array.isArray(submissions) ? submissions : [];
  const safeClients = Array.isArray(clients) ? clients : [];

  // Build Real-Time Action Queue from Live Pending Intakes & Expiring Subscriptions
  const pendingIntakes = safeSubmissions.filter(s => s && s.status !== 'APPROVED');
  const expiringClients = safeClients.filter(c => c && c.status === 'EXPIRING_SOON');

  const dailyActions = [
    // 1. Pending Intakes Awaiting Review / Generation
    ...pendingIntakes.map(sub => {
      const phone = sub?.user?.phone_number || sub?.phone_number || '';
      const country = getClientCountryInfo(phone, sub?.country || sub?.answers?.personal?.country || sub?.user?.country || '');
      const hasInjury = Boolean(sub?.answers?.injuries_map?.has_injuries || (sub?.answers?.injuries_map?.selected_areas && sub?.answers?.injuries_map?.selected_areas.length > 0));
      return {
        id: `INTAKE_${sub?.id || Math.random()}`,
        type: hasInjury ? 'INJURY' : 'NEW_INTAKE',
        hasInjury,
        clientName: sub?.user?.full_name || sub?.full_name || `مشترك #${sub?.user?.client_code || sub?.user_id || sub?.id || ''}`,
        country,
        tier: sub?.subscription_package || sub?.user?.subscription_package || 'ELITE_4M',
        phone,
        timeAgo: formatTimeAgo(sub?.created_at || sub?.submitted_at || sub?.user?.created_at),
        summary: hasInjury
          ? 'المشترك لديه إصابة / ألم مسجل • مطلوب استبعاد التمارين المجهدة وتجهيز الخطة.'
          : (sub?.status === 'PAID' ? 'تم تأكيد الدفع • الاستمارة جاهزة لإعداد الخطة.' : 'استمارة جديدة بانتظار تجهيز الخطة.'),
        suggestedAction: 'تجهيز واعتماد خطة المشترك',
        badgeText: hasInjury ? 'إصابة مسجلة' : (sub?.status === 'PAID' ? 'مدفوع • بانتظار الخطة' : 'استمارة جديدة'),
        actionUrl: `/coach/editor?user_id=${sub?.user_id || sub?.user?.id || sub?.id || ''}`
      };
    }),
    // 2. Expiring Subscriptions Awaiting Renewal Outreach
    ...expiringClients.map(c => {
      const phone = c?.phone_number || '';
      const country = getClientCountryInfo(phone, c?.country || '');
      return {
        id: `RENEWAL_${c?.id || Math.random()}`,
        type: 'RENEWAL',
        clientName: c?.full_name || `مشترك #${c?.client_code || ''}`,
        country,
        tier: c?.package || c?.package_code || 'MAX_4M',
        phone,
        timeAgo: formatTimeAgo(c?.created_at || c?.updated_at),
        summary: `متبقي ${c?.days_remaining || 0} أيام على نهاية باقة الاشتراك.`,
        suggestedAction: 'مراسلة المشترك لتجديد الاشتراك',
        badgeText: 'تجديد قريب',
        actionUrl: `/subscriptions`
      };
    })
  ];

  const newIntakeCount = dailyActions.filter(a => a.type === 'NEW_INTAKE').length;
  const checkinCount = dailyActions.filter(a => a.type === 'CHECKIN').length;
  const injuryCount = dailyActions.filter(a => a.type === 'INJURY').length;
  const inactiveCount = dailyActions.filter(a => a.type === 'INACTIVE').length;
  const renewalCount = dailyActions.filter(a => a.type === 'RENEWAL').length;
  const allCount = dailyActions.length;

  const TABS = [
    { id: 'ALL', label: 'الكل', count: allCount },
    { id: 'NEW_INTAKE', label: 'استمارات جديدة', count: newIntakeCount },
    { id: 'CHECKIN', label: 'متابعات أسبوعية', count: checkinCount },
    { id: 'INJURY', label: 'الإصابات والشكاوى', count: injuryCount, isAlert: injuryCount > 0 },
    { id: 'INACTIVE', label: 'المتأخرون', count: inactiveCount },
    { id: 'RENEWAL', label: 'تجديد الباقات', count: renewalCount },
  ];

  // Dynamic Live KPIs (Interactive Click-to-Filter)
  const stats = [
    { 
      title: 'إجمالي المشتركين النشطين', 
      value: (overview?.active_count ?? safeClients.length).toString(), 
      trend: (overview?.active_count || 0) > 0 ? '+100%' : '0%', 
      trendLabel: 'حسابات مفعلة', 
      icon: Users,
      onClick: () => navigate('/customers'),
      tooltip: 'عرض سجل المشتركين (CRM)'
    },
    { 
      title: 'استمارات وتقييمات معلقة', 
      value: pendingIntakes.length.toString(), 
      trend: pendingIntakes.length > 0 ? 'مطلوب مراجعة' : 'مكتمل', 
      trendLabel: 'طابور المهام', 
      icon: Clock,
      onClick: () => setActiveTab('NEW_INTAKE'),
      tooltip: 'فلترة الاستمارات الجديدة'
    },
    { 
      title: 'تنبيهات الإصابات والشكاوى', 
      value: injuryCount.toString(), 
      trend: injuryCount > 0 ? 'مطلوب تدخل' : 'آمن', 
      trendLabel: injuryCount > 0 ? 'حالات نشطة' : 'استقرار تام', 
      icon: ShieldAlert,
      onClick: () => setActiveTab('INJURY'),
      tooltip: 'فلترة الإصابات والشكاوى'
    },
    { 
      title: 'تجديدات خلال 7 أيام', 
      value: (overview?.expiring_soon_count ?? expiringClients.length).toString(), 
      trend: expiringClients.length > 0 ? 'تنبيه' : 'لا يوجد', 
      trendLabel: 'متابعة مالية', 
      icon: Hourglass,
      onClick: () => setActiveTab('RENEWAL'),
      tooltip: 'فلترة اشتراكات التجديد'
    },
  ];

  const filteredActions = dailyActions.filter(act => {
    // 1. Tab filter
    if (activeTab === 'NEW_INTAKE' && !(act.type === 'NEW_INTAKE' || act.type === 'INJURY')) return false;
    if (activeTab !== 'ALL' && activeTab !== 'NEW_INTAKE' && act.type !== activeTab) return false;

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const name = String(act.clientName || '').toLowerCase();
      const phone = String(act.phone || '').toLowerCase();
      const id = String(act.id || '').toLowerCase();
      const tier = String(act.tier || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || id.includes(q) || tier.includes(q);
    }

    return true;
  });

  return (
    <AdminLayout onOpenNewClient={() => setIsNewClientModalOpen(true)}>
      <div className="page-stack" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* 1. Page Header */}
        <PageHeader
          title="لوحة التحكم والمتابعة اليومية"
          description="متابعة المشتركين، الاستمارات الجديدة، والخطط المطلوب اعتمادها اليوم."
          actions={(
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={fetchDashboardData}
                disabled={loading}
                title="تحديث فوري للبيانات"
                style={{
                  height: '36px',
                  padding: '0 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '6px',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  border: '1px solid #CBD5E1',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                  transition: 'all 0.15s ease'
                }}
              >
                <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                <span>{loading ? 'جاري التحديث...' : 'تحديث'}</span>
              </button>
              <button 
                type="button" 
                onClick={() => setIsNewClientModalOpen(true)}
                style={{
                  height: '36px',
                  padding: '0 16px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '6px',
                  background: 'var(--primary, #0F172A)',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.25)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--primary2, #334155)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--primary, #0F172A)')}
              >
                <Plus size={15} />
                <span>كود مشترك جديد</span>
              </button>
            </div>
          )}
        />

        {/* 2. Executive KPI Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          {stats.map((st, i) => {
            const IconComponent = st.icon;
            return (
              <div 
                key={i} 
                onClick={st.onClick}
                title={st.tooltip || ''}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  cursor: st.onClick ? 'pointer' : 'default',
                  transition: 'all 0.18s ease'
                }}
                onMouseEnter={(e) => {
                  if (st.onClick) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(15, 23, 42, 0.06)';
                    e.currentTarget.style.borderColor = '#CBD5E1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (st.onClick) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(15, 23, 42, 0.02)';
                    e.currentTarget.style.borderColor = '#E2E8F0';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>{st.title}</span>
                  <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconComponent size={15} strokeWidth={2} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo, sans-serif', lineHeight: 1 }}>
                    {st.value}
                  </span>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '2px 7px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700 }}>
                    <span dir="ltr" style={{ fontWeight: 800 }}>{st.trend}</span>
                    <span>{st.trendLabel}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. Full-Width Unified Action Queue */}
        <div style={{ width: '100%' }}>
          <FormSection 
            title="المتابعات اليومية" 
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
                    width: '200px',
                    gap: '6px'
                  }}
                >
                  <Search size={13} color="#94A3B8" />
                  <input
                    type="text"
                    placeholder="بحث في المتابعات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: '11.5px',
                      width: '100%',
                      color: '#0F172A'
                    }}
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#94A3B8' }}>
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div style={{ display: 'flex', gap: '3px', background: '#F1F5F9', padding: '3px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: '4px 9px',
                        borderRadius: '5px',
                        fontSize: '11px',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        background: activeTab === tab.id ? '#0F172A' : 'transparent',
                        color: activeTab === tab.id ? '#FFFFFF' : '#64748B',
                        boxShadow: activeTab === tab.id ? '0 2px 5px rgba(15, 23, 42, 0.25)' : 'none',
                        transition: 'background 0.12s ease, color 0.12s ease'
                      }}
                    >
                      {tab.label} ({tab.count ?? 0})
                    </button>
                  ))}
                </div>
              </div>
            )}
          >
              {/* 2-Column Responsive Action Cards Grid with Stable Min Height */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', gap: '10px', marginTop: '10px', minHeight: '180px', alignContent: 'start' }}>
                {filteredActions.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', minHeight: '160px', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F1F5F9', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto' }}>
                      <CheckCircle2 size={18} />
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', marginBottom: '2px' }}>
                      تم إنهاء كافة الإجراءات والمتابعات لليوم
                    </div>
                    <p style={{ fontSize: '11.5px', color: '#64748B', margin: 0 }}>
                      كافة المراجعات والتنبيهات المندرجة تحت هذا التبويب معتمدة بنسبة 100%.
                    </p>
                  </div>
                ) : (
                  filteredActions.map(action => (
                    <div
                      key={action.id}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '7px',
                        transition: 'border-color 0.15s ease'
                      }}
                    >
                      {/* 1. Top Row: Client Details & Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ 
                          fontFamily: 'JetBrains Mono, monospace', 
                          fontWeight: 800, 
                          fontSize: '11px', 
                          background: '#F0F9FF', 
                          border: '1px solid #BAE6FD', 
                          color: '#0284C7', 
                          padding: '2px 7px', 
                          borderRadius: '4px' 
                        }}>
                          {'#' + action.id.replace('INTAKE_', '').replace('RENEWAL_', '').replace('ACT_0', '')}
                        </span>
                        <strong style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>
                          {action.clientName}
                        </strong>
                        {action.country && (
                          <span style={{ fontSize: '11px', color: '#1E293B', background: '#F8FAFC', padding: '1px 7px', borderRadius: '4px', border: '1px solid #E2E8F0', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span>{action.country.flag}</span>
                            <span>{action.country.name}</span>
                          </span>
                        )}
                        {(() => {
                          const pkg = getPackageBadgeStyle(action.tier);
                          return (
                            <span style={{ 
                              fontSize: '11px', 
                              background: pkg.background, 
                              border: pkg.border, 
                              color: pkg.color, 
                              padding: '1px 7px', 
                              borderRadius: '4px', 
                              fontWeight: 800,
                              fontFamily: 'JetBrains Mono, Cairo, sans-serif'
                            }}>
                              {pkg.label}
                            </span>
                          );
                        })()}
                        <span style={{ fontSize: '10.5px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          {action.badgeText}
                        </span>
                        {action.timeAgo && (
                          <span style={{ 
                            fontSize: '10.5px', 
                            color: '#64748B', 
                            background: '#F8FAFC', 
                            border: '1px solid #E2E8F0', 
                            padding: '1px 6px', 
                            borderRadius: '4px', 
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <Clock size={10} color="#94A3B8" />
                            <span>{action.timeAgo}</span>
                          </span>
                        )}
                      </div>

                      {/* 2. Middle Row: Compact Inline Summary & Decision */}
                      <div style={{ 
                        background: '#F8FAFC', 
                        border: '1px solid #E2E8F0', 
                        padding: '6px 10px', 
                        borderRadius: '5px', 
                        fontSize: '11.5px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        gap: '10px',
                        flexWrap: 'wrap',
                        lineHeight: 1.4
                      }}>
                        <div style={{ color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: '#64748B', fontWeight: 600 }}>الحالة:</span>
                          <span>{action.summary}</span>
                        </div>
                        <div style={{ color: '#0F172A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: '#64748B', fontWeight: 600 }}>القرار المقترح:</span>
                          <strong style={{ color: '#0F172A' }}>{action.suggestedAction}</strong>
                        </div>
                      </div>

                      {/* 3. Bottom Row: Compact Action Buttons (Aligned to Left) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: 'auto' }}>
                        {action.phone && (
                          <a
                            href={'https://wa.me/' + action.phone.replace(/\D/g, '') + '?text=' + getWhatsAppMessage(action)}
                            target="_blank"
                            rel="noreferrer"
                            title="مراسلة سريعة برسالة ترحيبية جاهزة"
                            style={{
                              padding: '4px 10px',
                              borderRadius: '5px',
                              border: '1px solid #22C55E',
                              background: '#FFFFFF',
                              color: '#0F172A',
                              fontWeight: 700,
                              fontSize: '11.5px',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>واتساب</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (action.actionUrl) {
                              window.open(action.actionUrl, '_blank');
                            }
                          }}
                          title="فتح في علامة تبويب جديدة"
                          style={{
                            padding: '5px 12px',
                            borderRadius: '6px',
                            background: 'var(--color-primary-light, #F1F5F9)',
                            color: 'var(--primary, #0F172A)',
                            fontWeight: 800,
                            fontSize: '11.5px',
                            border: '1px solid var(--color-primary-border, #CBD5E1)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--primary, #0F172A)';
                            e.currentTarget.style.color = '#FFFFFF';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--color-primary-light, #F1F5F9)';
                            e.currentTarget.style.color = 'var(--primary, #0F172A)';
                          }}
                        >
                          <span>
                            {action.type === 'INJURY'
                              ? 'مراجعة وتعديل التمارين'
                              : action.type === 'NEW_INTAKE'
                                ? 'تجهيز واعتماد الخطة'
                                : action.type === 'CHECKIN'
                                  ? 'مراجعة التقييم الأسبوعي'
                                  : action.type === 'RENEWAL'
                                    ? 'متابعة التجديد'
                                    : 'تجهيز الخطة'}
                          </span>
                          <ExternalLink size={11} style={{ opacity: 0.7 }} />
                        </button>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </FormSection>
          </div>

        {/* New Client Modal */}
        <NewClientQuickModal
          isOpen={isNewClientModalOpen}
          onClose={() => setIsNewClientModalOpen(false)}
          onClientCreated={(newClient) => {
            fetchDashboardData();
          }}
        />

      </div>
    </AdminLayout>
  );
}
