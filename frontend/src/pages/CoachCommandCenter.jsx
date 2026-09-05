import { ClientCodeBadge, ClientPackageBadge, getClientTier } from '../utils/tierBadgeHelper';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, Hourglass, Plus, MessageCircle, CheckCircle2, ShieldAlert, Check, ExternalLink, Sparkles, ClipboardList, RefreshCw, Loader2, Search, X } from 'lucide-react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import NewClientQuickModal from '../components/modals/NewClientQuickModal';
import { PageHeader } from '@/shared/components/page-header';
import { FormSection } from '@/shared/components/form-section';
import { getUpcomingFastingAlert, extractClientFastingProfile } from '../utils/seasonalFastingRadar';

// Smart 1-Click WhatsApp Pre-filled Message Generator
export function getWhatsAppMessage(action) {
  const name = action?.clientName ? action.clientName.replace(/مشترك #\d+/g, '').trim() : '';
  const namePrefix = name ? `أهلاً ${name}، ` : 'أهلاً بك، ';
  const cleanTier = String(action?.tier || '').includes('MAX') ? 'MAX' : 'ELITE';

  if (action?.type === 'INJURY') {
    return encodeURIComponent(`${namePrefix}بخصوص الملاحظات الطبية أو الإصابة المسجلة في الاستمارة، سنقوم بتعديل التمارين وإضافة البدائل المناسبة لك بالكامل.`);
  }
  if (action?.type === 'CHECKIN') {
    return encodeURIComponent(`${namePrefix}تم استلام تقييمك الأسبوعي بنجاح، وجاري الآن مراجعة القياسات والأداء وتحديث الخطة.`);
  }
  if (action?.type === 'INACTIVE') {
    return encodeURIComponent(`${namePrefix}طمنا عليك يا بطل، لاحظنا غيابك عن تسجيل تمارينك بقالك كام يوم. لو محتاج أي تعديل أو واجهتك أي صعوبة في الخطة، أنا معاك خطوة بخطوة عشان نوصل لهدفك!`);
  }
  if (action?.type === 'RENEWAL') {
    return encodeURIComponent(`${namePrefix}نود تذكيرك بأن اشتراكك في باقة ${cleanTier} قارب على الانتهاء. لتأكيد التجديد والاستمرار يرجى التواصل معنا.`);
  }
  return encodeURIComponent(`${namePrefix}تم استلام استمارتك بنجاح، وجاري مراجعة البيانات وإعداد خطتك التدريبية والغذائية.`);
}

// Smart Universal Country Detector
export function getClientCountryInfo(phone = '', explicitCountry = '') {
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
    if (c.includes('يمن') || c.includes('yemen')) return { name: 'اليمن' };
    if (c.includes('أمريكا') || c.includes('امريكا') || c.includes('usa') || c.includes('united states')) return { name: 'أمريكا' };
    if (c.includes('بريطانيا') || c.includes('uk') || c.includes('england')) return { name: 'بريطانيا' };
    if (c.includes('ألمانيا') || c.includes('المانيا') || c.includes('germany')) return { name: 'ألمانيا' };
    if (c.includes('كندا') || c.includes('canada')) return { name: 'كندا' };
    return { name: explicitCountry };
  }

  const clean = String(phone).replace(/\D/g, '');
  if (clean.startsWith('966')) return { name: 'السعودية' };
  if (clean.startsWith('971')) return { name: 'الإمارات' };
  if (clean.startsWith('965')) return { name: 'الكويت' };
  if (clean.startsWith('974')) return { name: 'قطر' };
  if (clean.startsWith('968')) return { name: 'عُمان' };
  if (clean.startsWith('973')) return { name: 'البحرين' };
  if (clean.startsWith('962')) return { name: 'الأردن' };
  if (clean.startsWith('964')) return { name: 'العراق' };
  if (clean.startsWith('961')) return { name: 'لبنان' };
  if (clean.startsWith('970') || clean.startsWith('972')) return { name: 'فلسطين' };
  if (clean.startsWith('212')) return { name: 'المغرب' };
  if (clean.startsWith('216')) return { name: 'تونس' };
  if (clean.startsWith('213')) return { name: 'الجزائر' };
  if (clean.startsWith('218')) return { name: 'ليبيا' };
  if (clean.startsWith('249')) return { name: 'السودان' };
  if (clean.startsWith('967')) return { name: 'اليمن' };
  if (clean.startsWith('44')) return { name: 'بريطانيا' };
  if (clean.startsWith('49')) return { name: 'ألمانيا' };
  if (clean.startsWith('33')) return { name: 'فرنسا' };
  if (clean.startsWith('39')) return { name: 'إيطاليا' };
  if (clean.startsWith('90')) return { name: 'تركيا' };
  if (clean.startsWith('1')) return { name: 'أمريكا / كندا' };
  if (clean.startsWith('20') || clean.startsWith('010') || clean.startsWith('011') || clean.startsWith('012') || clean.startsWith('015')) return { name: 'مصر' };
  
  return { name: 'مصر' }; // Default
}

// Smart Package Badge Styler (Neutral Box, Colored Text)
export function getPackageBadgeStyle(pkgStr = '') {
  const clean = String(pkgStr || '').trim().toUpperCase();
  const isMax = getClientTier(clean) === 'MAX';
  
  return {
    label: isMax ? 'MAX' : 'ELITE',
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    color: isMax ? '#B45309' : '#0284C7'
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
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (e) {
    return 'اليوم';
  }
}

export default function CoachCommandCenter() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'CHECKIN' | 'CLINICAL' | 'INACTIVE' | 'RENEWAL'
  const [fastingFilter, setFastingFilter] = useState('ALL'); // 'ALL' | 'COPTIC' | 'RAMADAN' | 'INTERMITTENT'
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const seasonalFastingInfo = React.useMemo(() => getUpcomingFastingAlert(), []);

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
  const [pendingCheckins, setPendingCheckins] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [subOverviewRes, intakeRes, checkinRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/v1/subscriptions/overview`),
        fetch(`${API_BASE}/api/v1/intake/submissions`),
        fetch(`${API_BASE}/api/v1/programs/checkin/pending`)
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

      if (checkinRes.status === 'fulfilled' && checkinRes.value && checkinRes.value.ok) {
        try {
          const checkinData = await checkinRes.value.json();
          if (checkinData && Array.isArray(checkinData.checkins)) setPendingCheckins(checkinData.checkins);
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
  const safeCheckins = Array.isArray(pendingCheckins) ? pendingCheckins : [];

  // Build Real-Time Action Queue from Live Pending Intakes, Checkins & Expiring Subscriptions
  const pendingIntakes = safeSubmissions.filter(s => s && (s.status === 'PENDING' || s.status === 'PENDING_COACH_REVIEW' || s.status === 'DRAFT_GENERATED' || s.status === 'PAYMENT_CONFIRMED'));
  const expiringClients = safeClients.filter(c => c && c.status === 'EXPIRING_SOON');

  // Index client intake submissions for instant fasting profile lookup
  const clientIntakeMap = new Map();
  safeSubmissions.forEach(sub => {
    const rawCode = sub?.user?.client_code || sub?.answers?.client_code || sub?.client_code || sub?.user_id || sub?.id || '';
    const cleanCode = String(rawCode).replace(/^client[-_]?/i, '').replace('#', '');
    if (cleanCode && !clientIntakeMap.has(cleanCode)) {
      clientIntakeMap.set(cleanCode, sub);
    }
    const ph = String(sub?.user?.phone_number || sub?.phone_number || '').trim();
    if (ph && !clientIntakeMap.has(ph)) {
      clientIntakeMap.set(ph, sub);
    }
  });

  const actionsMap = new Map();

  // 1. Expiring Subscriptions (Highest Priority for Renewal Outreach)
  expiringClients.forEach(c => {
    const rawCode = c?.client_code || c?.id || '1';
    const cleanCode = String(rawCode).replace(/^client[-_]?/i, '').replace('#', '');
    const phone = c?.phone_number || '';
    const country = getClientCountryInfo(phone, c?.country || '');
    const intakeSub = clientIntakeMap.get(cleanCode) || clientIntakeMap.get(phone);
    const fasting = extractClientFastingProfile(c, intakeSub?.answers);

    actionsMap.set(cleanCode, {
      id: `RENEWAL_${cleanCode}`,
      clientCode: cleanCode,
      type: 'RENEWAL',
      clientName: c?.full_name || `مشترك #${cleanCode}`,
      country,
      tier: getClientTier(cleanCode || c),
      phone,
      timeAgo: formatTimeAgo(c?.created_at || c?.updated_at),
      summary: `متبقي ${c?.days_remaining || 0} أيام على نهاية باقة الاشتراك.`,
      suggestedAction: 'مراسلة المشترك لتجديد الاشتراك',
      badgeText: 'تجديد قريب',
      actionUrl: `/subscriptions?code=${cleanCode}`,
      fastingProfile: fasting,
      isCoptic: fasting.isCoptic,
      isRamadan: fasting.isRamadan,
      isIntermittent: fasting.isIntermittent
    });
  });

  // 2. Pending Check-ins Awaiting Review
  safeCheckins.forEach(chk => {
    const rawCode = chk?.user?.client_code || chk?.client_code || chk?.user_id || '1';
    const cleanCode = String(rawCode).replace(/^client[-_]?/i, '').replace('#', '');
    if (!actionsMap.has(cleanCode)) {
      const phone = chk?.user?.phone_number || '';
      const country = getClientCountryInfo(phone, chk?.user?.country || '');
      const isPlateau = chk?.analysis_status === 'PLATEAU_DETECTED';
      const isFastingTransition = chk?.fasting_transition === 'ACTIVE';
      const intakeSub = clientIntakeMap.get(cleanCode) || clientIntakeMap.get(phone);
      const fasting = extractClientFastingProfile(chk?.user || chk, intakeSub?.answers);

      actionsMap.set(cleanCode, {
        id: `CHECKIN_${cleanCode}`,
        clientCode: cleanCode,
        type: isPlateau ? 'INJURY' : 'CHECKIN',
        hasInjury: isPlateau,
        clientName: chk?.user?.full_name || `مشترك #${cleanCode}`,
        country,
        tier: getClientTier(cleanCode || chk),
        phone,
        timeAgo: formatTimeAgo(chk?.created_at || chk?.updated_at),
        summary: isPlateau 
          ? 'كشف ثبات وزن أيضي (Plateau) • مطلوب تعديل السعرات أو إضافة يوم Refeed.' 
          : (isFastingTransition 
              ? 'طلب تكييف خطة الصيام للأسبوع القادم • مطلوب مراجعة واعتماد جدول الوجبات الجديد.' 
              : 'متابعة أسبوعية واردة بانتظار المراجعة والاعتماد.'),
        suggestedAction: isPlateau ? 'مراجعة ثبات الوزن وتعديل الخطة' : (isFastingTransition ? 'اعتماد خطة الصيام وتعديل الوجبات' : 'مراجعة واعتماد التقييم الأسبوعي'),
        badgeText: isPlateau ? 'ثبات وزن / تعديل' : (isFastingTransition ? 'تكييف الصيام' : 'متابعة واردة'),
        actionUrl: `/coach/checkin-review?code=${cleanCode}`,
        fastingProfile: fasting,
        isCoptic: fasting.isCoptic,
        isRamadan: fasting.isRamadan,
        isIntermittent: fasting.isIntermittent
      });
    }
  });

  // 3. Pending Intakes Awaiting Initial Plan Setup
  pendingIntakes.forEach(sub => {
    const rawCode = sub?.user?.client_code || sub?.answers?.client_code || sub?.client_code || sub?.user_id || sub?.id || '1';
    const cleanCode = String(rawCode).replace(/^client[-_]?/i, '').replace('#', '');
    if (!actionsMap.has(cleanCode)) {
      const phone = sub?.user?.phone_number || sub?.phone_number || '';
      const country = getClientCountryInfo(phone, sub?.country || sub?.answers?.personal?.country || sub?.user?.country || '');
      const hasInjury = Boolean(sub?.answers?.injuries_map?.has_injuries || (sub?.answers?.injuries_map?.selected_areas && sub?.answers?.injuries_map?.selected_areas.length > 0));
      const fasting = extractClientFastingProfile(sub?.user || sub, sub?.answers);

      actionsMap.set(cleanCode, {
        id: `INTAKE_${cleanCode}`,
        clientCode: cleanCode,
        type: hasInjury ? 'INJURY' : 'NEW_INTAKE',
        hasInjury,
        clientName: sub?.user?.full_name || sub?.full_name || `مشترك #${cleanCode}`,
        country,
        tier: getClientTier(cleanCode || sub),
        phone,
        timeAgo: formatTimeAgo(sub?.created_at || sub?.submitted_at || sub?.user?.created_at),
        summary: hasInjury
          ? 'المشترك لديه إصابة / ألم مسجل • مطلوب استبعاد التمارين المجهدة وتجهيز الخطة.'
          : (sub?.status === 'PAID' || sub?.status === 'PAYMENT_CONFIRMED' ? 'تم تأكيد الدفع • الاستمارة جاهزة لإعداد الخطة.' : 'استمارة جديدة بانتظار تجهيز الخطة.'),
        suggestedAction: 'تجهيز واعتماد خطة المشترك',
        badgeText: hasInjury ? 'إصابة مسجلة' : (sub?.status === 'PAID' || sub?.status === 'PAYMENT_CONFIRMED' ? 'مدفوع • بانتظار الخطة' : 'استمارة جديدة'),
        actionUrl: `/coach/editor?user_id=${cleanCode}`,
        fastingProfile: fasting,
        isCoptic: fasting.isCoptic,
        isRamadan: fasting.isRamadan,
        isIntermittent: fasting.isIntermittent
      });
    }
  });

  // Convert map values to array sorted by numeric clientCode
  const dailyActions = Array.from(actionsMap.values()).sort((a, b) => Number(a.clientCode) - Number(b.clientCode));

  const newIntakeCount = dailyActions.filter(a => a.type === 'NEW_INTAKE').length;
  const checkinCount = dailyActions.filter(a => a.type === 'CHECKIN').length;
  const injuryCount = dailyActions.filter(a => a.type === 'INJURY').length;
  const inactiveCount = dailyActions.filter(a => a.type === 'INACTIVE').length;
  const renewalCount = dailyActions.filter(a => a.type === 'RENEWAL').length;
  const allCount = dailyActions.length;
  const copticCount = dailyActions.filter(a => a.isCoptic).length;
  const ramadanCount = dailyActions.filter(a => a.isRamadan).length;
  const intermittentCount = dailyActions.filter(a => a.isIntermittent).length;

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
      title: 'المشتركون النشطون', 
      value: (overview?.active_count ?? safeClients.length).toString(), 
      unit: 'مشترك',
      label: 'حسابات مفعلة', 
      icon: Users,
      onClick: () => navigate('/customers'),
      tooltip: 'عرض سجل المشتركين (CRM)'
    },
    { 
      title: 'استمارات بانتظار المراجعة', 
      value: pendingIntakes.length.toString(), 
      unit: 'استمارة',
      label: 'قيد الانتظار', 
      icon: Clock,
      onClick: () => setActiveTab('NEW_INTAKE'),
      tooltip: 'فلترة الاستمارات الجديدة'
    },
    { 
      title: 'رادار الغياب (> 3 أيام)', 
      value: inactiveCount.toString(), 
      unit: 'مشترك',
      label: inactiveCount > 0 ? 'يحتاجون تشجيع' : 'لا توجد حالات غياب', 
      icon: Sparkles,
      onClick: () => setActiveTab('INACTIVE'),
      tooltip: 'فلترة المشتركين المتأخرين لتحفيزهم قبل التسرب'
    },
    { 
      title: 'تنبيهات الإصابات والشكاوى', 
      value: injuryCount.toString(), 
      unit: 'تنبيه',
      label: injuryCount > 0 ? 'حالات نشطة' : 'لا توجد حالات', 
      icon: ShieldAlert,
      onClick: () => setActiveTab('INJURY'),
      tooltip: 'فلترة الإصابات والشكاوى'
    },
    { 
      title: 'تجديدات قادمة (7 أيام)', 
      value: (overview?.expiring_soon_count ?? expiringClients.length).toString(), 
      unit: 'مشترك',
      label: 'متابعة الاشتراكات', 
      icon: Hourglass,
      onClick: () => setActiveTab('RENEWAL'),
      tooltip: 'فلترة اشتراكات التجديد'
    },
  ];

  const filteredActions = dailyActions.filter(act => {
    // 1. Tab filter
    if (activeTab === 'NEW_INTAKE' && !(act.type === 'NEW_INTAKE' || act.type === 'INJURY')) return false;
    if (activeTab !== 'ALL' && activeTab !== 'NEW_INTAKE' && act.type !== activeTab) return false;

    // 2. Fasting filter
    if (fastingFilter === 'COPTIC' && !act.isCoptic) return false;
    if (fastingFilter === 'RAMADAN' && !act.isRamadan) return false;
    if (fastingFilter === 'INTERMITTENT' && !act.isIntermittent) return false;

    // 3. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase().replace('#', '');
      const name = String(act.clientName || '').toLowerCase();
      const code = String(act.clientCode || '').toLowerCase();
      const phone = String(act.phone || '').toLowerCase();
      const id = String(act.id || '').toLowerCase();
      const tier = String(act.tier || '').toLowerCase();
      const fastingLabel = String(act.fastingProfile?.primaryFastingBadge?.label || '').toLowerCase();
      const intermittentLabel = String(act.fastingProfile?.intermittentBadge?.label || '').toLowerCase();
      return name.includes(q) || code.includes(q) || phone.includes(q) || id.includes(q) || tier.includes(q) || fastingLabel.includes(q) || intermittentLabel.includes(q);
    }

    return true;
  });

  return (
    <AdminLayout>
      <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
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
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                <span>تحديث</span>
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
                  padding: '16px 18px',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
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
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap' }}>{st.title}</span>
                  <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <IconComponent size={15} strokeWidth={2} />
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

        {/* 30-Day Seasonal Fasting Radar Banner */}
        {seasonalFastingInfo && (
          <div style={{
            background: '#0F172A',
            border: '1px solid #C4952D',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 2px 10px rgba(196, 149, 45, 0.12)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'rgba(196, 149, 45, 0.15)', border: '1px solid rgba(196, 149, 45, 0.3)', borderRadius: '6px', padding: '6px', color: '#F59E0B' }}>
                <Sparkles size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '13px', color: '#F8FAFC' }}>
                    رادار التقويم الموسمي: اقتراب {seasonalFastingInfo.name}
                  </strong>
                  <span style={{ fontSize: '11px', fontWeight: 800, background: 'rgba(196, 149, 45, 0.2)', color: '#FBBF24', padding: '1px 7px', borderRadius: '4px' }}>
                    {seasonalFastingInfo.statusText}
                  </span>
                </div>
                <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>
                  {seasonalFastingInfo.description} يمكنك استعراض المشتركين المسجلين لهذا الصيام وتكييف خططهم مسبقاً.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab('ALL');
                  setFastingFilter(seasonalFastingInfo.type === 'COPTIC' ? 'COPTIC' : 'RAMADAN');
                }}
                style={{
                  background: '#C4952D',
                  color: '#0F172A',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '7px 14px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {seasonalFastingInfo.type === 'COPTIC' ? 'استعراض مشتركي الصيام المسيحي' : 'استعراض مشتركي صيام رمضان'}
              </button>

              <button
                type="button"
                onClick={() => navigate(`/customers?fasting=${seasonalFastingInfo.type === 'COPTIC' ? 'COPTIC' : 'RAMADAN'}`)}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#F8FAFC',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '6px',
                  padding: '7px 12px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                كافة المشتركين في قاعدة البيانات
              </button>
            </div>
          </div>
        )}

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
            {/* Fasting Tripartite Filter Bar */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '8px 12px', 
              background: '#F8FAFC', 
              border: '1px solid #E2E8F0', 
              borderRadius: '6px', 
              marginBottom: '10px', 
              flexWrap: 'wrap', 
              gap: '8px' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#475569' }}>
                  فلترة أنماط الصيام:
                </span>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'ALL', label: 'كافة المتابعات', count: dailyActions.length, bg: '#0F172A', color: '#FFFFFF' },
                    { id: 'COPTIC', label: 'صيام مسيحي / قبطي', count: copticCount, bg: '#6D28D9', color: '#FFFFFF' },
                    { id: 'RAMADAN', label: 'صيام رمضان المبارك', count: ramadanCount, bg: '#B45309', color: '#FFFFFF' },
                    { id: 'INTERMITTENT', label: 'صيام متقطع', count: intermittentCount, bg: '#0369A1', color: '#FFFFFF' }
                  ].map(f => {
                    const isSelected = fastingFilter === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFastingFilter(f.id)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '5px',
                          fontSize: '11px',
                          fontWeight: 800,
                          border: isSelected ? 'none' : '1px solid #CBD5E1',
                          cursor: 'pointer',
                          background: isSelected ? f.bg : '#FFFFFF',
                          color: isSelected ? f.color : '#475569',
                          boxShadow: isSelected ? '0 2px 4px rgba(0,0,0,0.12)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {f.label} ({f.count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {fastingFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setFastingFilter('ALL')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748B',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <X size={12} />
                  <span>إلغاء فلتر الصيام (عرض الكل)</span>
                </button>
              )}
            </div>

            {/* 2-Column Responsive Action Cards Grid with Stable Min Height */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', gap: '10px', marginTop: '10px', minHeight: '180px', alignContent: 'start' }}>
              {filteredActions.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', minHeight: '160px', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F1F5F9', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto' }}>
                    <CheckCircle2 size={18} />
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', marginBottom: '2px' }}>
                    {fastingFilter !== 'ALL' ? 'لا توجد إجراءات معلقة حالياً لهذا النوع من الصيام' : 'تم إنهاء كافة الإجراءات والمتابعات لليوم'}
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#64748B', margin: '0 0 10px 0' }}>
                    {fastingFilter !== 'ALL'
                      ? 'كافة المشتركين المندرجين تحت هذا التصنيف معتمدة خططهم ومتابعاتهم، أو لم يحن موعد تقييمهم اليوم.'
                      : 'كافة المراجعات والتنبيهات المندرجة تحت هذا التبويب معتمدة بنسبة 100%.'}
                  </p>
                  {fastingFilter !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => navigate(`/customers?fasting=${fastingFilter}`)}
                      style={{
                        background: '#0F172A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '7px 14px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>عرض كافة مشتركي هذا الصيام في قاعدة البيانات (CRM)</span>
                      <ExternalLink size={12} />
                    </button>
                  )}
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
                      <ClientCodeBadge code={action.clientCode} item={action} />
                      <strong style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>
                        {action.clientName}
                      </strong>
                      {action.country && (
                        <span style={{ fontSize: '11px', color: '#1E293B', background: '#F8FAFC', padding: '1px 7px', borderRadius: '4px', border: '1px solid #E2E8F0', fontWeight: 700 }}>
                          {action.country.name}
                        </span>
                      )}
                      <ClientPackageBadge item={action} />
                      <span style={{ fontSize: '10.5px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        {action.badgeText}
                      </span>
                      {action.fastingProfile?.primaryFastingBadge && (
                        <span style={{ 
                          fontSize: '10.5px', 
                          background: action.fastingProfile.primaryFastingBadge.bg, 
                          border: `1px solid ${action.fastingProfile.primaryFastingBadge.border}`, 
                          color: action.fastingProfile.primaryFastingBadge.color, 
                          padding: '1px 7px', 
                          borderRadius: '4px', 
                          fontWeight: 800 
                        }}>
                          {action.fastingProfile.primaryFastingBadge.label}
                        </span>
                      )}
                      {action.fastingProfile?.intermittentBadge && (
                        <span style={{ 
                          fontSize: '10.5px', 
                          background: action.fastingProfile.intermittentBadge.bg, 
                          border: `1px solid ${action.fastingProfile.intermittentBadge.border}`, 
                          color: action.fastingProfile.intermittentBadge.color, 
                          padding: '1px 7px', 
                          borderRadius: '4px', 
                          fontWeight: 800 
                        }}>
                          {action.fastingProfile.intermittentBadge.label}
                        </span>
                      )}
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
                            href={'https://wa.me/' + ((action.phone.replace(/\D/g, '').startsWith('01')) ? ('2' + action.phone.replace(/\D/g, '')) : action.phone.replace(/\D/g, '')) + '?text=' + getWhatsAppMessage(action)}
                            target="_blank"
                            rel="noreferrer"
                            title="مراسلة عبر واتساب"
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: '1px solid #E2E8F0', background: 'transparent',
                              color: '#16A34A',
                              fontWeight: 700,
                              fontSize: '11.5px',
                              textDecoration: 'none',
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
                          >
                            <MessageCircle size={13} />
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
