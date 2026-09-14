import { ClientCodeBadge, ClientPackageBadge, getClientTier, getClientCountryInfo, formatTimeAgo } from '../utils/tierBadgeHelper';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Plus, 
  MessageCircle, 
  CheckCircle2, 
  ShieldAlert, 
  ExternalLink, 
  ClipboardList, 
  Search, 
  X, 
  Layers,
  RotateCw,
  Copy,
  Check,
  Smartphone,
  ArrowUpDown,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import NewClientQuickModal from '../components/modals/NewClientQuickModal';
import { PageHeader } from '@/shared/components/page-header';
import { FormSection } from '@/shared/components/form-section';
import { getUpcomingFastingAlert, extractClientFastingProfile } from '../utils/seasonalFastingRadar';
import { arabicSearchMatch } from '../utils/searchUtils';
import { generateWhatsAppUrl } from '../utils/whatsappRemindersEngine';

// Smart 1-Click WhatsApp Pre-filled Message Generator
export function getWhatsAppMessage(action, raw = false) {
  const name = action?.clientName ? action.clientName.replace(/مشترك #\d+/g, '').trim() : '';
  const namePrefix = name ? `أهلاً ${name}، ` : 'أهلاً بك، ';
  const cleanTier = String(action?.tier || '').includes('MAX') ? 'MAX' : 'ELITE';

  let msg = `${namePrefix}تم استلام استمارتك بنجاح، وجاري مراجعة البيانات وإعداد خطتك التدريبية والغذائية.`;
  if (action?.hasInjury && action?.type === 'NEW_INTAKE') {
    msg = `${namePrefix}بخصوص الملاحظات الطبية أو الإصابة المسجلة في الاستمارة، سنقوم بتعديل التمارين وإضافة البدائل المناسبة لك بالكامل.`;
  } else if (action?.hasInjury && action?.type === 'CHECKIN') {
    msg = `${namePrefix}بخصوص الملاحظات الطبية أو ثبات الوزن في التقييم الأسبوعي، سنقوم بتعديل الخطة وتقديم التوجيهات المناسبة لك.`;
  } else if (action?.type === 'CHECKIN') {
    msg = `${namePrefix}تم استلام تقييمك الأسبوعي بنجاح، وجاري الآن مراجعة القياسات والأداء وتحديث الخطة.`;
  } else if (action?.type === 'RENEWAL') {
    msg = `${namePrefix}نود تذكيرك بأن اشتراكك في باقة ${cleanTier} قارب على الانتهاء. لتأكيد التجديد والاستمرار يرجى التواصل معنا.`;
  }

  return raw ? msg : encodeURIComponent(msg);
}

const SORT_OPTIONS = [
  { id: 'DEFAULT', label: 'كود المشترك' },
  { id: 'OLDEST_WAITING', label: 'الأقدم انتظاراً (FIFO)' },
  { id: 'TIER_PRIORITY', label: 'أولوية باقات MAX' },
  { id: 'INJURY_FIRST', label: 'الإصابات وثبات الوزن' }
];

export default function CoachCommandCenter() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'NEW_INTAKE' | 'CHECKIN' | 'INJURY' | 'RENEWAL'
  const [fastingFilter, setFastingFilter] = useState('ALL'); // 'ALL' | 'COPTIC' | 'RAMADAN' | 'INTERMITTENT'
  const [tierFilter, setTierFilter] = useState('ALL'); // 'ALL' | 'MAX' | 'ELITE'
  const [sortBy, setSortBy] = useState('DEFAULT'); // 'DEFAULT' | 'OLDEST_WAITING' | 'TIER_PRIORITY' | 'INJURY_FIRST'
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = React.useRef(null);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [copiedKey, setCopiedKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const seasonalFastingInfo = React.useMemo(() => getUpcomingFastingAlert(), []);
  const [isFastingAlertDismissed, setIsFastingAlertDismissed] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [clients, setClients] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [pendingCheckins, setPendingCheckins] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(String(text));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

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
      setLastRefreshed(new Date());
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
    const rawDate = c?.created_at || c?.updated_at;
    const rawTimestamp = rawDate ? new Date(rawDate).getTime() : Date.now();
    const actionId = `RENEWAL_${cleanCode}`;

    actionsMap.set(actionId, {
      id: actionId,
      clientCode: cleanCode,
      type: 'RENEWAL',
      hasInjury: false,
      clientName: c?.full_name || `مشترك #${cleanCode}`,
      country,
      tier: getClientTier(cleanCode || c),
      phone,
      rawTimestamp,
      isOverdue: false,
      hoursWaiting: 0,
      timeAgo: formatTimeAgo(rawDate),
      summary: `متبقي ${c?.days_remaining || 0} أيام على نهاية باقة الاشتراك.`,
      suggestedAction: 'مراسلة المشترك لتجديد الاشتراك',
      badgeText: 'تجديد قريب',
      actionUrl: `/coach/financials?code=${cleanCode}`,
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
    const actionId = `CHECKIN_${cleanCode}`;
    if (!actionsMap.has(actionId)) {
      const phone = chk?.user?.phone_number || '';
      const country = getClientCountryInfo(phone, chk?.user?.country || '');
      const isPlateau = chk?.analysis_status === 'PLATEAU_DETECTED';
      const isFastingTransition = chk?.fasting_transition === 'ACTIVE';
      const intakeSub = clientIntakeMap.get(cleanCode) || clientIntakeMap.get(phone);
      const fasting = extractClientFastingProfile(chk?.user || chk, intakeSub?.answers);
      const rawDate = chk?.submitted_at || chk?.created_at;
      const rawTimestamp = rawDate ? new Date(rawDate).getTime() : Date.now();
      const hoursWaiting = Math.max(0, Math.floor((Date.now() - rawTimestamp) / (1000 * 60 * 60)));

      actionsMap.set(actionId, {
        id: actionId,
        clientCode: cleanCode,
        type: 'CHECKIN',
        hasInjury: isPlateau,
        clientName: chk?.user?.full_name || `مشترك #${cleanCode}`,
        country,
        tier: getClientTier(cleanCode || chk),
        phone,
        rawTimestamp,
        isOverdue: hoursWaiting >= 24,
        hoursWaiting,
        timeAgo: formatTimeAgo(rawDate),
        summary: isPlateau
          ? 'تم رصد ثبات وزن للأسبوع الثاني على التوالي • يحتاج مراجعة السعرات والنشاط.'
          : (isFastingTransition ? 'انتقال نشط لبروتوكول الصيام • يحتاج اعتماد الوجبات المحدثة.' : 'تم إرسال التقييم الأسبوعي والصور • بانتظار المراجعة والاعتماد.'),
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
    const actionId = `INTAKE_${cleanCode}`;
    if (!actionsMap.has(actionId)) {
      const phone = sub?.user?.phone_number || sub?.phone_number || '';
      const country = getClientCountryInfo(phone, sub?.country || sub?.answers?.personal?.country || sub?.user?.country || '');
      const hasInjury = Boolean(sub?.answers?.injuries_map?.has_injuries || (sub?.answers?.injuries_map?.selected_areas && sub?.answers?.injuries_map?.selected_areas.length > 0));
      const fasting = extractClientFastingProfile(sub?.user || sub, sub?.answers);
      const rawDate = sub?.submitted_at || sub?.created_at || sub?.user?.created_at;
      const rawTimestamp = rawDate ? new Date(rawDate).getTime() : Date.now();
      const hoursWaiting = Math.max(0, Math.floor((Date.now() - rawTimestamp) / (1000 * 60 * 60)));

      actionsMap.set(actionId, {
        id: actionId,
        clientCode: cleanCode,
        type: 'NEW_INTAKE',
        hasInjury,
        clientName: sub?.user?.full_name || sub?.full_name || `مشترك #${cleanCode}`,
        country,
        tier: getClientTier(cleanCode || sub),
        phone,
        rawTimestamp,
        isOverdue: hoursWaiting >= 24,
        hoursWaiting,
        timeAgo: formatTimeAgo(rawDate),
        summary: hasInjury
          ? 'المشترك لديه إصابة / ألم مسجل • مطلوب استبعاد التمارين المجهدة وتجهيز الخطة.'
          : (sub?.status === 'PAID' || sub?.status === 'PAYMENT_CONFIRMED' ? 'تم تأكيد الدفع • الاستمارة جاهزة لإعداد الخطة.' : 'استمارة جديدة بانتظار تجهيز الخطة.'),
        suggestedAction: 'تجهيز واعتماد خطة المشترك',
        badgeText: hasInjury ? 'إصابة مسجلة' : (sub?.status === 'PAID' || sub?.status === 'PAYMENT_CONFIRMED' ? 'مدفوع • بانتظار الخطة' : 'استمارة جديدة'),
        actionUrl: `/coach/editor/${cleanCode}`,
        fastingProfile: fasting,
        isCoptic: fasting.isCoptic,
        isRamadan: fasting.isRamadan,
        isIntermittent: fasting.isIntermittent
      });
    }
  });

  // Convert map values to array
  const dailyActions = Array.from(actionsMap.values());

  const newIntakeCount = dailyActions.filter(a => a.type === 'NEW_INTAKE').length;
  const checkinCount = dailyActions.filter(a => a.type === 'CHECKIN').length;
  const injuryCount = dailyActions.filter(a => a.hasInjury).length;
  const renewalCount = dailyActions.filter(a => a.type === 'RENEWAL').length;
  const allCount = dailyActions.length;

  // Dynamic Live KPIs (The Single Source of Truth for Operational Queues)
  const stats = [
    { 
      type: 'ALL',
      title: 'كافة المهام اليومية', 
      value: allCount.toString(), 
      unit: 'إجراء',
      label: allCount > 0 ? 'طابور التشغيل الموحد' : 'لا توجد مهام معلقة', 
      icon: Layers,
      onClick: () => setActiveTab('ALL'),
      tooltip: 'عرض كافة المتابعات والمهام بدون فلترة'
    },
    { 
      type: 'NEW_INTAKE',
      title: 'استمارات جديدة', 
      value: newIntakeCount.toString(), 
      unit: 'استمارة',
      label: newIntakeCount > 0 ? 'بانتظار الخطة' : 'تم تجهيز الكل', 
      icon: ClipboardList,
      onClick: () => setActiveTab('NEW_INTAKE'),
      tooltip: 'فلترة الاستمارات الجديدة بانتظار إعداد الخطة'
    },
    { 
      type: 'CHECKIN',
      title: 'متابعات أسبوعية', 
      value: checkinCount.toString(), 
      unit: 'تقييم',
      label: checkinCount > 0 ? 'بانتظار الاعتماد' : 'لا توجد تقييمات معلقة', 
      icon: CheckCircle2,
      onClick: () => setActiveTab('CHECKIN'),
      tooltip: 'فلترة المتابعات والتقييمات الأسبوعية الواردة'
    },
    { 
      type: 'INJURY',
      title: 'الإصابات والشكاوى', 
      value: injuryCount.toString(), 
      unit: 'تنبيه',
      label: injuryCount > 0 ? 'حالات نشطة' : 'لا توجد حالات', 
      icon: ShieldAlert,
      onClick: () => setActiveTab('INJURY'),
      tooltip: 'فلترة الإصابات وثبات الوزن والشكاوى'
    },
    { 
      type: 'RENEWAL',
      title: 'تجديد الباقات', 
      value: renewalCount.toString(), 
      unit: 'مشترك',
      label: renewalCount > 0 ? 'متابعة الاشتراكات' : 'لا توجد تجديدات قريبة', 
      icon: Clock,
      onClick: () => setActiveTab('RENEWAL'),
      tooltip: 'فلترة اشتراكات التجديد المستحقة'
    },
  ];

  const filteredActions = dailyActions.filter(act => {
    // 1. Tab filter
    if (activeTab === 'NEW_INTAKE' && act.type !== 'NEW_INTAKE') return false;
    if (activeTab === 'CHECKIN' && act.type !== 'CHECKIN') return false;
    if (activeTab === 'INJURY' && !act.hasInjury) return false;
    if (activeTab === 'RENEWAL' && act.type !== 'RENEWAL') return false;

    // 2. Fasting filter
    if (fastingFilter === 'COPTIC' && !act.isCoptic) return false;
    if (fastingFilter === 'RAMADAN' && !act.isRamadan) return false;
    if (fastingFilter === 'INTERMITTENT' && !act.isIntermittent) return false;

    // 3. Package tier filter
    if (tierFilter !== 'ALL') {
      const cleanTier = String(act.tier || '').toUpperCase();
      if (tierFilter === 'MAX' && !cleanTier.includes('MAX')) return false;
      if (tierFilter === 'ELITE' && cleanTier.includes('MAX')) return false;
    }

    // 4. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      const qClean = q.replace(/^#+/, '');
      const code = String(act.clientCode || '').replace(/^client[-_]?/i, '').replace('#', '');
      const phone = String(act.phone || '');
      const id = String(act.id || '');
      const tier = String(act.tier || '');
      const fastingLabel = String(act.fastingProfile?.primaryFastingBadge?.label || '');
      const intermittentLabel = String(act.fastingProfile?.intermittentBadge?.label || '');
      return (
        arabicSearchMatch(act.clientName, q) ||
        code.toLowerCase().includes(qClean.toLowerCase()) ||
        phone.includes(qClean) ||
        id.toLowerCase().includes(qClean.toLowerCase()) ||
        tier.toLowerCase().includes(qClean.toLowerCase()) ||
        arabicSearchMatch(fastingLabel, q) ||
        arabicSearchMatch(intermittentLabel, q)
      );
    }

    return true;
  });

  // Smart Sorting
  const sortedActions = [...filteredActions].sort((a, b) => {
    if (sortBy === 'OLDEST_WAITING') {
      return (a.rawTimestamp || 0) - (b.rawTimestamp || 0); // oldest first
    }
    if (sortBy === 'TIER_PRIORITY') {
      const aTierScore = String(a.tier || '').includes('MAX') ? 2 : 1;
      const bTierScore = String(b.tier || '').includes('MAX') ? 2 : 1;
      if (bTierScore !== aTierScore) return bTierScore - aTierScore;
      return (a.rawTimestamp || 0) - (b.rawTimestamp || 0);
    }
    if (sortBy === 'INJURY_FIRST') {
      const aScore = a.hasInjury ? 2 : 1;
      const bScore = b.hasInjury ? 2 : 1;
      if (bScore !== aScore) return bScore - aScore;
      return (a.rawTimestamp || 0) - (b.rawTimestamp || 0);
    }
    // DEFAULT: Numeric client code
    return Number(a.clientCode) - Number(b.clientCode);
  });

  const [actionsPage, setActionsPage] = useState(1);
  const actionsPageSize = 25;

  useEffect(() => {
    setActionsPage(1);
  }, [activeTab, fastingFilter, tierFilter, sortBy, searchQuery]);

  const totalActionPages = Math.ceil(sortedActions.length / actionsPageSize) || 1;
  const paginatedActions = sortedActions.slice((actionsPage - 1) * actionsPageSize, actionsPage * actionsPageSize);

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
                title="تحديث البيانات اللحظية من الخادم"
                style={{
                  height: '36px',
                  padding: '0 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '8px',
                  background: '#FFFFFF',
                  color: '#1E293B',
                  border: '1px solid #CBD5E1',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = '#F8FAFC';
                    e.currentTarget.style.borderColor = '#94A3B8';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#FFFFFF';
                  e.currentTarget.style.borderColor = '#CBD5E1';
                }}
              >
                <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>تحديث البيانات</span>
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
                  borderRadius: '8px',
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

        {/* 2. Executive KPI Metric Cards with Dynamic Active Highlights */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {stats.map((st, i) => {
            const IconComponent = st.icon;
            const isActive = activeTab === st.type;
            return (
              <div 
                key={i} 
                onClick={st.onClick}
                title={st.tooltip || ''}
                style={{
                  background: isActive ? '#F8FAFC' : '#FFFFFF',
                  border: isActive ? '2px solid #0F172A' : '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: isActive ? '15px 17px' : '16px 18px',
                  boxShadow: isActive ? '0 4px 14px rgba(15, 23, 42, 0.08)' : '0 1px 3px rgba(15, 23, 42, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  cursor: st.onClick ? 'pointer' : 'default',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (st.onClick && !isActive) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(15, 23, 42, 0.06)';
                    e.currentTarget.style.borderColor = '#CBD5E1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (st.onClick && !isActive) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(15, 23, 42, 0.02)';
                    e.currentTarget.style.borderColor = '#E2E8F0';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: isActive ? '#0F172A' : '#64748B', whiteSpace: 'nowrap' }}>
                    {st.title}
                  </span>
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '8px', 
                    background: isActive ? '#0F172A' : '#F8FAFC', 
                    border: isActive ? '1px solid #0F172A' : '1px solid #E2E8F0', 
                    color: isActive ? '#FFFFFF' : '#0F172A', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}>
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
                  <span style={{ 
                    fontSize: '11px', 
                    color: isActive ? '#0F172A' : '#94A3B8', 
                    fontWeight: isActive ? 800 : 600, 
                    whiteSpace: 'nowrap' 
                  }}>
                    {isActive ? `${st.label} • نشط` : st.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 30-Day Seasonal Fasting Radar Banner (يظهر فقط قبل الموسم بشهر أو أثناء نشاطه) */}
        {seasonalFastingInfo && !isFastingAlertDismissed && (
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRight: '4px solid #0F172A',
            borderRadius: '12px',
            padding: '8px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={15} color="#0F172A" />
              <strong style={{ fontSize: '12.5px', color: '#0F172A' }}>
                رادار التقويم الموسمي: اقتراب {seasonalFastingInfo.name}
              </strong>
              <span style={{ fontSize: '10.5px', fontWeight: 800, background: '#F1F5F9', color: '#0F172A', border: '1px solid #E2E8F0', padding: '1px 7px', borderRadius: '6px' }}>
                {seasonalFastingInfo.statusText}
              </span>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                ({seasonalFastingInfo.description})
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab('ALL');
                  setFastingFilter(seasonalFastingInfo.type === 'COPTIC' ? 'COPTIC' : 'RAMADAN');
                }}
                style={{
                  background: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {seasonalFastingInfo.type === 'COPTIC' ? 'استعراض مشتركي الصيام المسيحي' : 'استعراض مشتركي صيام رمضان'}
              </button>

              <button
                type="button"
                onClick={() => setIsFastingAlertDismissed(true)}
                title="إغلاق التنبيه"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  borderRadius: '8px',
                  padding: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {/* 3. Full-Width Unified Action Queue */}
        <div style={{ width: '100%' }}>
          <FormSection 
            title="المتابعات والمهام اليومية" 
            description="طابور التشغيل الموحد لمعالجة التقييمات، الاستمارات الجديدة، الحالات السريرية، واشتراكات التجديد."
          >
            {/* Dedicated Action Queue Controls Toolbar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '12px'
            }}>
              {/* Active Queue Status Indicator & Tier Filter Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                  طابور العرض: <strong style={{ color: '#0F172A' }}>{stats.find(s => s.type === activeTab)?.title || 'كافة المهام اليومية'}</strong> ({filteredActions.length} إجراء)
                </span>
                {activeTab !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('ALL')}
                    style={{
                      fontSize: '11px',
                      color: '#475569',
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      padding: '2px 8px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                    title="عرض كافة الإجراءات بدون فلترة"
                  >
                    <X size={11} />
                    <span>عرض الكل</span>
                  </button>
                )}

                {/* Tier Filter Pills */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F1F5F9', padding: '3px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  {[
                    { id: 'ALL', label: 'كافة الباقات' },
                    { id: 'MAX', label: 'باقات MAX' },
                    { id: 'ELITE', label: 'باقات ELITE' }
                  ].map(pill => {
                    const isSelected = tierFilter === pill.id;
                    return (
                      <button
                        key={pill.id}
                        type="button"
                        onClick={() => setTierFilter(pill.id)}
                        style={{
                          height: '26px',
                          padding: '0 9px',
                          fontSize: '11px',
                          fontWeight: isSelected ? 800 : 600,
                          color: isSelected ? '#0F172A' : '#64748B',
                          background: isSelected ? '#FFFFFF' : 'transparent',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {pill.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Smart Sort & Search Box */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {/* Custom Curved Dropdown for Smart Sorting */}
                <div style={{ position: 'relative' }} ref={sortRef}>
                  <button
                    type="button"
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      height: '34px',
                      padding: '0 12px',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: '#1E293B',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                      transition: 'all 0.15s ease'
                    }}
                    title="فرز وترتيب الإجراءات"
                  >
                    <ArrowUpDown size={13} color="#64748B" />
                    <span>{SORT_OPTIONS.find(o => o.id === sortBy)?.label || 'الترتيب'}</span>
                    <ChevronDown size={12} color="#94A3B8" />
                  </button>

                  {isSortOpen && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      width: '190px',
                      background: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.15), 0 4px 6px -2px rgba(15, 23, 42, 0.05)',
                      padding: '5px',
                      zIndex: 50,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}>
                      {SORT_OPTIONS.map(opt => {
                        const isSelected = sortBy === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setSortBy(opt.id);
                              setIsSortOpen(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              width: '100%',
                              padding: '7px 10px',
                              borderRadius: '8px',
                              border: 'none',
                              background: isSelected ? '#F1F5F9' : 'transparent',
                              color: isSelected ? '#0F172A' : '#475569',
                              fontSize: '11.5px',
                              fontWeight: isSelected ? 800 : 600,
                              cursor: 'pointer',
                              textAlign: 'right',
                              transition: 'background 0.1s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.background = '#F8FAFC';
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <Check size={13} color="#0F172A" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Search Box */}
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: '0 10px',
                    height: '34px',
                    minWidth: '240px',
                    gap: '6px'
                  }}
                >
                  <Search size={14} color="#94A3B8" />
                  <input
                    type="text"
                    placeholder="بحث بالاسم أو الكود أو الهاتف..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: '12px',
                      width: '100%',
                      color: '#0F172A',
                      fontFamily: 'Cairo, sans-serif'
                    }}
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#94A3B8' }}>
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Active Fasting Filter Indicator (يظهر فقط إذا تم تفعيل الفلترة من الرادار الموسمي) */}
            {fastingFilter !== 'ALL' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                marginBottom: '10px'
              }}>
                <span style={{ fontSize: '11.5px', color: '#475569', fontWeight: 700 }}>
                  فلترة نشطة: {fastingFilter === 'COPTIC' ? 'مشتركي الصيام القبطي' : (fastingFilter === 'RAMADAN' ? 'مشتركي صيام رمضان' : 'مشتركي الصيام المتقطع')} ({filteredActions.length} إجراء)
                </span>
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
                  <span>إلغاء الفلتر (عرض الكل)</span>
                </button>
              </div>
            )}

            {/* 2-Column Responsive Action Cards Grid with Stable Min Height */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', gap: '10px', marginTop: '6px', minHeight: fastingFilter === 'ALL' ? '180px' : 'auto', alignContent: 'start' }}>
              {filteredActions.length === 0 ? (
                fastingFilter === 'ALL' ? (
                  <div style={{ gridColumn: '1 / -1', minHeight: '160px', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F1F5F9', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto' }}>
                      <CheckCircle2 size={18} />
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', marginBottom: '2px' }}>
                      تم إنهاء كافة الإجراءات والمتابعات لليوم
                    </div>
                    <p style={{ fontSize: '11.5px', color: '#64748B', margin: '0 0 10px 0' }}>
                      كافة المراجعات والتنبيهات المندرجة تحت هذا التبويب معتمدة بنسبة 100%.
                    </p>
                  </div>
                ) : null
              ) : (
                paginatedActions.map(action => (
                  <div
                    key={action.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'border-color 0.15s ease'
                    }}
                  >
                    {/* 1. Top Row: Client Details & Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <ClientCodeBadge code={action.clientCode} item={action} />
                        <button
                          type="button"
                          onClick={() => handleCopy(action.clientCode, `code_${action.id}`)}
                          title="نسخ كود المشترك"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            padding: '2px',
                            cursor: 'pointer',
                            color: copiedKey === `code_${action.id}` ? '#16A34A' : '#94A3B8',
                            display: 'inline-flex',
                            alignItems: 'center',
                            borderRadius: '4px',
                            transition: 'color 0.15s ease'
                          }}
                        >
                          {copiedKey === `code_${action.id}` ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>

                      <strong 
                        style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A', cursor: 'pointer' }}
                        onClick={() => navigate(`/customers?code=${action.clientCode}`)}
                        title="فتح ملف المشترك في لوح المتابعة السريع"
                      >
                        {action.clientName}
                      </strong>
                      {action.country && (
                        <span style={{ fontSize: '11px', color: '#1E293B', background: '#F8FAFC', padding: '2px 8px', borderRadius: '6px', border: '1px solid #E2E8F0', fontWeight: 700 }}>
                          {action.country.name}
                        </span>
                      )}
                      <ClientPackageBadge item={action} />

                      {/* Overdue Alert SLA Badge (> 24h) */}
                      {action.isOverdue && (
                        <span style={{
                          fontSize: '10.5px',
                          background: '#FEF2F2',
                          border: '1px solid #FECACA',
                          color: '#DC2626',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }} title={`مر على هذا الإجراء أكثر من 24 ساعة (${Math.round(action.hoursWaiting)} ساعة)`}>
                          <AlertCircle size={11} />
                          <span>متأخر</span>
                        </span>
                      )}

                      {/* High-priority Clinical / Status Badges only (No routine duplicates) */}
                      {action.hasInjury && (
                        <span style={{ fontSize: '10.5px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                          {action.type === 'CHECKIN' ? 'ثبات وزن / Plateau' : 'إصابة مسجلة'}
                        </span>
                      )}
                      {action.type === 'NEW_INTAKE' && (action.badgeText?.includes('مدفوع') || action.badgeText?.includes('الدفع')) && (
                        <span style={{ fontSize: '10.5px', background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                          تم تأكيد الدفع
                        </span>
                      )}
                      {action.fastingProfile?.primaryFastingBadge && (
                        <span style={{ 
                          fontSize: '10.5px', 
                          background: action.fastingProfile.primaryFastingBadge.bg, 
                          border: `1px solid ${action.fastingProfile.primaryFastingBadge.border}`, 
                          color: action.fastingProfile.primaryFastingBadge.color, 
                          padding: '2px 8px', 
                          borderRadius: '6px', 
                          fontWeight: 800 
                        }}>
                          {action.fastingProfile.primaryFastingBadge.label}
                        </span>
                      )}
                      {action.timeAgo && (
                        <span style={{ 
                          fontSize: '10.5px', 
                          color: action.isOverdue ? '#DC2626' : '#64748B', 
                          background: action.isOverdue ? '#FFF5F5' : '#F8FAFC', 
                          border: `1px solid ${action.isOverdue ? '#FED7D7' : '#E2E8F0'}`, 
                          padding: '2px 8px', 
                          borderRadius: '6px', 
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginRight: 'auto'
                        }}>
                          <Clock size={11} color={action.isOverdue ? '#DC2626' : '#94A3B8'} />
                          <span>{action.timeAgo}</span>
                        </span>
                      )}
                    </div>

                    {/* 2. Middle Row: Streamlined Clean Status Summary (No redundant suggested action) */}
                    <div style={{ 
                      background: '#F8FAFC', 
                      border: '1px solid #E2E8F0', 
                      padding: '8px 12px', 
                      borderRadius: '8px', 
                      fontSize: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      lineHeight: 1.45,
                      color: '#334155'
                    }}>
                      <span style={{ color: '#64748B', fontWeight: 700, flexShrink: 0 }}>الحالة والملاحظات:</span>
                      <span style={{ fontWeight: 500 }}>{action.summary}</span>
                    </div>

                    {/* 3. Bottom Row: Streamlined Action Buttons (Aligned to Left) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: 'auto', marginTop: '2px', flexWrap: 'wrap' }}>
                      {/* Copy Phone Number Quick Action */}
                      {action.phone && (
                        <button
                          type="button"
                          onClick={() => handleCopy(action.phone, `phone_${action.id}`)}
                          title="نسخ رقم الهاتف"
                          style={{
                            height: '32px',
                            padding: '0 10px',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            background: '#F8FAFC',
                            color: copiedKey === `phone_${action.id}` ? '#16A34A' : '#475569',
                            fontWeight: 700,
                            fontSize: '11.5px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#F1F5F9';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#F8FAFC';
                          }}
                        >
                          {copiedKey === `phone_${action.id}` ? <Check size={13} /> : <Copy size={13} />}
                          <span>{copiedKey === `phone_${action.id}` ? 'تم النسخ' : 'نسخ الهاتف'}</span>
                        </button>
                      )}

                      {/* WhatsApp 1-Click Message */}
                      {action.phone && (
                        <a
                          href={generateWhatsAppUrl(action.phone, getWhatsAppMessage(action, true))}
                          target="_blank"
                          rel="noreferrer"
                          title="مراسلة عبر واتساب"
                          style={{
                            height: '32px',
                            padding: '0 12px',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            background: '#F8FAFC',
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
                            e.currentTarget.style.background = '#F0FDF4';
                            e.currentTarget.style.borderColor = '#BBF7D0';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#F8FAFC';
                            e.currentTarget.style.borderColor = '#E2E8F0';
                          }}
                        >
                          <MessageCircle size={14} />
                          <span>واتساب</span>
                        </a>
                      )}

                      {/* Client App Portal Quick View */}
                      <a
                        href={`/client?code=${action.clientCode}`}
                        target="_blank"
                        rel="noreferrer"
                        title="معاينة حية لتطبيق المتدرب"
                        style={{
                          height: '32px',
                          padding: '0 10px',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          background: '#F8FAFC',
                          color: '#475569',
                          fontWeight: 700,
                          fontSize: '11.5px',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#F1F5F9';
                          e.currentTarget.style.color = '#0F172A';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#F8FAFC';
                          e.currentTarget.style.color = '#475569';
                        }}
                      >
                        <Smartphone size={13} />
                        <span>تطبيق المتدرب</span>
                      </a>

                      {/* Main Operational Action Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (action.actionUrl) {
                            navigate(action.actionUrl);
                          }
                        }}
                        title="الانتقال إلى المراجعة والإجراء"
                        style={{
                          height: '32px',
                          padding: '0 14px',
                          borderRadius: '8px',
                          background: 'var(--color-primary-light, #F1F5F9)',
                          color: 'var(--primary, #0F172A)',
                          fontWeight: 800,
                          fontSize: '11.5px',
                          border: '1px solid var(--color-primary-border, #CBD5E1)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
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
                          {action.hasInjury
                            ? (action.type === 'CHECKIN' ? 'مراجعة ثبات الوزن' : 'مراجعة وتعديل التمارين')
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

                {/* Clean Executive Pagination Controls for Daily Actions */}
                {totalActionPages > 1 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    color: '#64748B',
                    fontWeight: 600,
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginTop: '10px'
                  }}>
                    <span>
                      عرض الإجراءات من {(actionsPage - 1) * actionsPageSize + 1} إلى {Math.min(actionsPage * actionsPageSize, filteredActions.length)} من أصل {filteredActions.length} إجراء
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setActionsPage(p => Math.max(1, p - 1))}
                        disabled={actionsPage === 1}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          background: actionsPage === 1 ? '#F1F5F9' : '#FFFFFF',
                          color: actionsPage === 1 ? '#94A3B8' : '#0F172A',
                          cursor: actionsPage === 1 ? 'not-allowed' : 'pointer',
                          fontWeight: 700,
                          fontSize: '11px'
                        }}
                      >
                        السابق
                      </button>

                      <span style={{ padding: '0 8px', color: '#0F172A', fontWeight: 800 }}>
                        صفحة {actionsPage} من {totalActionPages}
                      </span>

                      <button
                        type="button"
                        onClick={() => setActionsPage(p => Math.min(totalActionPages, p + 1))}
                        disabled={actionsPage === totalActionPages}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          background: actionsPage === totalActionPages ? '#F1F5F9' : '#FFFFFF',
                          color: actionsPage === totalActionPages ? '#94A3B8' : '#0F172A',
                          cursor: actionsPage === totalActionPages ? 'not-allowed' : 'pointer',
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
