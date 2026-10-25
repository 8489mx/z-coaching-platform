import { ClientCodeBadge, ClientPackageBadge, getClientTier, getClientCountryInfo, formatTimeAgo } from '../utils/tierBadgeHelper';
import { buildClientLinks } from '../utils/clientLinks';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock,
  Dumbbell, 
  MessageCircle, 
  CheckCircle2, 
  ExternalLink, 
  ClipboardList,  
  RotateCw, 
  Check,
  ArrowUpDown, 
  AlertCircle, 
  ChevronDown,
  HeartPulse,
  RefreshCw,
  CalendarX
} from 'lucide-react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import NewClientQuickModal from '../components/modals/NewClientQuickModal';
import { PageHeader } from '@/shared/components/page-header';
import { TierFilter } from '@/shared/components/tier-filter';
import { TableSearch } from '@/shared/components/table-search';
import { RefreshButton } from '@/shared/components/refresh-button';
import { FormSection } from '@/shared/components/form-section';
import { extractClientFastingProfile } from '../utils/seasonalFastingRadar';
import { arabicSearchMatch } from '../utils/searchUtils';
import { generateWhatsAppUrl } from '../utils/whatsappRemindersEngine';
import { evaluateClientCheckinOverdue } from '../utils/overdueCheckinEngine';

// Smart 1-Click WhatsApp Pre-filled Message Generator with Direct Action URLs
// مقصود: ثابت أو دالة مشتركة بجوار المكوّن. تحذير Fast Refresh في بيئة التطوير فقط ولا أثر له على الإنتاج.
// eslint-disable-next-line react/only-export-components
export function getWhatsAppMessage(action, raw = false) {
  const name = action?.clientName ? action.clientName.replace(/مشترك #\d+/g, '').trim() : '';
  const namePrefix = name ? `أهلاً ${name}، ` : 'أهلاً بك، ';
  const cleanTier = String(action?.tier || '').includes('MAX') ? 'MAX' : 'ELITE';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const cleanCode = action?.clientCode || '';
  const { renewal_url: renewalUrl, app_url: appUrl, checkin_url: checkinUrl } = buildClientLinks(cleanCode, origin);

  let msg = `${namePrefix}تم استلام استمارتك بنجاح، وجاري مراجعة البيانات وإعداد خطتك التدريبية والغذائية. يمكنك استعراض تطبيقك عبر الرابط:\n${appUrl}`;
  if (action?.type === 'OVERDUE_CHECKIN') {
    const greeting = name ? `صباح الفل يا ${name}، ` : 'صباح الفل يا بطل، ';
    msg = `${greeting}حبينا نطمن عليك! مستنيين شيك إنك وصورك الأسبوعية عشان نراجع التطور في الميزان ومحيطات الجسم ونحدث خطتك للأسبوع الجديد.\n\nرابط تسجيل الشيك إن في دقيقة:\n${checkinUrl}`;
  } else if (action?.hasInjury && action?.type === 'NEW_INTAKE') {
    msg = `${namePrefix}بخصوص الملاحظات الطبية أو الإصابة المسجلة في الاستمارة، سنقوم بتعديل التمارين وإضافة البدائل المناسبة لك بالكامل.\nرابط تطبيقك:\n${appUrl}`;
  } else if (action?.hasInjury && action?.type === 'CHECKIN') {
    msg = `${namePrefix}بخصوص الملاحظات الطبية أو ثبات الوزن في التقييم الأسبوعي، سنقوم بتعديل الخطة وتقديم التوجيهات المناسبة لك.\nرابط تطبيقك:\n${appUrl}`;
  } else if (action?.type === 'CHECKIN') {
    msg = `${namePrefix}تم استلام تقييمك الأسبوعي بنجاح، وجاري الآن مراجعة القياسات والأداء وتحديث الخطة.\nرابط تطبيقك:\n${appUrl}`;
  } else if (action?.type === 'RENEWAL') {
    msg = `${namePrefix}نود تذكيرك بأن اشتراكك في باقة ${cleanTier} قارب على الانتهاء. لتأكيد التجديد والاستمرار يمكنك إتمام التجديد مباشرة عبر الرابط:\n${renewalUrl}`;
  }

  return raw ? msg : encodeURIComponent(msg);
}

const SORT_OPTIONS = [
  { id: 'DEFAULT', label: 'كود المشترك' },
  { id: 'OLDEST_WAITING', label: 'الأقدم انتظاراً' },
  { id: 'TIER_PRIORITY', label: 'أولوية باقات MAX' },
  { id: 'INJURY_FIRST', label: 'الإصابات وثبات الوزن' }
];

export default function CoachCommandCenter() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'CYCLES' | 'CHECKIN' | 'NEW_INTAKE' | 'OVERDUE'
  const [tierFilter, setTierFilter] = useState('ALL'); // 'ALL' | 'MAX' | 'ELITE'
  const [sortBy, setSortBy] = useState('DEFAULT'); // 'DEFAULT' | 'OLDEST_WAITING' | 'TIER_PRIORITY' | 'INJURY_FIRST'
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = React.useRef(null);
  const searchInputRef = React.useRef(null);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    function handleClickOutside(event) {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) {
        if (e.key === 'Escape') {
          if (searchQuery) setSearchQuery('');
          else e.target.blur();
        }
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (searchQuery) setSearchQuery('');
        if (isNewClientModalOpen) setIsNewClientModalOpen(false);
        if (isSortOpen) setIsSortOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, isNewClientModalOpen, isSortOpen]);

  const [clients, setClients] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [pendingCheckins, setPendingCheckins] = useState([]);
  const [cycleAttention, setCycleAttention] = useState({ count: 0, ended_count: 0, clients: [] });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const ensureCoachSession = async () => {
    const existingToken = localStorage.getItem('token');
    const existingUser = localStorage.getItem('user');
    let isValid = false;
    if (existingToken && existingUser) {
      try {
        const u = JSON.parse(existingUser);
        if (u && (u.role === 'ADMIN' || u.role === 'COACH')) {
          isValid = true;
        }
      } catch {}
    }
    if (!isValid) {
      // No staff session: coaches authenticate with email + password on the login page.
      window.location.href = '/login';
    }
    return isValid;
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      if (!(await ensureCoachSession())) return;
      const [subOverviewRes, intakeRes, checkinRes, cycleAttentionRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/v1/subscriptions/overview`),
        fetch(`${API_BASE}/api/v1/intake/submissions`),
        fetch(`${API_BASE}/api/v1/programs/checkin/pending`),
        fetch(`${API_BASE}/api/v1/programs/cycles/attention`)
      ]);

      if (subOverviewRes.status === 'fulfilled' && subOverviewRes.value && subOverviewRes.value.ok) {
        try {
          const subData = await subOverviewRes.value.json();
          if (subData && Array.isArray(subData.clients)) setClients(subData.clients);
        } catch {}
      }

      if (intakeRes.status === 'fulfilled' && intakeRes.value && intakeRes.value.ok) {
        try {
          const intakeData = await intakeRes.value.json();
          if (intakeData && Array.isArray(intakeData.submissions)) setSubmissions(intakeData.submissions);
        } catch {}
      }

      if (checkinRes.status === 'fulfilled' && checkinRes.value && checkinRes.value.ok) {
        try {
          const checkinData = await checkinRes.value.json();
          if (checkinData && Array.isArray(checkinData.checkins)) setPendingCheckins(checkinData.checkins);
        } catch {}
      }

      if (cycleAttentionRes.status === 'fulfilled' && cycleAttentionRes.value && cycleAttentionRes.value.ok) {
        try {
          const cycleData = await cycleAttentionRes.value.json();
          if (cycleData && typeof cycleData.count === 'number' && Array.isArray(cycleData.clients)) {
            setCycleAttention(cycleData);
          }
        } catch {}
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

  // 1. Due Training Cycles (Top Priority for Training Program Engineering)
  if (cycleAttention && Array.isArray(cycleAttention.clients)) {
    cycleAttention.clients.forEach(c => {
      const cleanCode = String(c.client_code || '').replace(/^client[-_]?/i, '').replace('#', '');
      const actionId = `CYCLE_${cleanCode}`;
      if (!actionsMap.has(actionId)) {
        const isEnded = c.status === 'ENDED';
        actionsMap.set(actionId, {
          id: actionId,
          clientCode: cleanCode,
          type: 'CYCLE_DUE',
          hasInjury: false,
          clientName: c.full_name || `مشترك #${cleanCode}`,
          country: getClientCountryInfo(c.phone_number || '', c.country || ''),
          tier: getClientTier(cleanCode),
          phone: c.phone_number || '',
          cycleNumber: c.cycle_number,
          rawTimestamp: Date.now() + (isEnded ? 10000000 : 5000000),
          isOverdue: isEnded,
          hoursWaiting: 0,
          timeAgo: isEnded ? 'انتهت الدورة' : 'شارفت على الانتهاء',
          summary: c.message_ar || (isEnded ? 'الدورة التدريبية الحالية انتهت وبحاجة لاعتماد الدورة التالية.' : 'الدورة التدريبية تشارف على الانتهاء وبحاجة للتجهيز.'),
          suggestedAction: isEnded ? 'اعتماد الدورة التدريبية' : 'تجهيز الدورة التدريبية',
          badgeText: isEnded ? 'دورة منتهية' : 'تجهيز دورة',
          actionUrl: `/coach/editor/${cleanCode}`,
          btnText: isEnded ? 'اعتماد الدورة' : 'تجهيز الدورة'
        });
      }
    });
  }

  // 2. Expiring Subscriptions (Highest Priority for Renewal Outreach)
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
          ? 'تم رصد ثبات وزن للأسبوع الثاني على التوالي | يحتاج مراجعة السعرات والنشاط.'
          : (isFastingTransition ? 'انتقال نشط لبروتوكول الصيام | يحتاج اعتماد الوجبات المحدثة.' : 'تم إرسال التقييم الأسبوعي والصور | بانتظار المراجعة والاعتماد.'),
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
          ? 'المشترك لديه إصابة / ألم مسجل | مطلوب استبعاد التمارين المجهدة وتجهيز الخطة.'
          : (sub?.status === 'PAID' || sub?.status === 'PAYMENT_CONFIRMED' ? 'تم تأكيد الدفع | الاستمارة جاهزة لإعداد الخطة.' : 'استمارة جديدة بانتظار تجهيز الخطة.'),
        suggestedAction: 'تجهيز واعتماد خطة المشترك',
        badgeText: hasInjury ? 'إصابة مسجلة' : (sub?.status === 'PAID' || sub?.status === 'PAYMENT_CONFIRMED' ? 'مدفوع - بانتظار الخطة' : 'استمارة جديدة'),
        actionUrl: `/coach/editor/${cleanCode}`,
        fastingProfile: fasting,
        isCoptic: fasting.isCoptic,
        isRamadan: fasting.isRamadan,
        isIntermittent: fasting.isIntermittent
      });
    }
  });

  // 4. Overdue Check-ins (Active Clients Missed Scheduled Check-in > 48h)
  safeClients.forEach(c => {
    const rawCode = c?.client_code || c?.id || '1';
    const cleanCode = String(rawCode).replace(/^client[-_]?/i, '').replace('#', '');
    const checkinActionId = `CHECKIN_${cleanCode}`;
    const overdueActionId = `OVERDUE_${cleanCode}`;

    if (actionsMap.has(checkinActionId)) return;

    const audit = evaluateClientCheckinOverdue(c);
    if (audit.isOverdue) {
      const phone = c?.phone_number || '';
      const country = getClientCountryInfo(phone, c?.country || '');
      const intakeSub = clientIntakeMap.get(cleanCode) || clientIntakeMap.get(phone);
      const fasting = extractClientFastingProfile(c, intakeSub?.answers);
      const rawTimestamp = audit.referenceDate ? new Date(audit.referenceDate).getTime() : Date.now();

      actionsMap.set(overdueActionId, {
        id: overdueActionId,
        clientCode: cleanCode,
        type: 'OVERDUE_CHECKIN',
        hasInjury: false,
        clientName: c?.full_name || `مشترك #${cleanCode}`,
        country,
        tier: getClientTier(cleanCode || c),
        phone,
        rawTimestamp,
        isOverdue: true,
        hoursWaiting: audit.daysOverdue * 24,
        daysOverdue: audit.daysOverdue,
        daysElapsed: audit.daysElapsed,
        urgency: audit.urgency,
        timeAgo: `متأخر ${audit.daysOverdue} أيام`,
        summary: `مر ${audit.daysElapsed} يوماً على آخر شيك إن (تأخير ${audit.daysOverdue} أيام) | نوصي بمراسلته فوراً لتفادي الانقطاع.`,
        suggestedAction: 'إرسال تنبيه ودود للمشترك عبر واتساب',
        badgeText: `تأخر ${audit.daysOverdue} يوم`,
        actionUrl: `/customers?code=${cleanCode}`,
        fastingProfile: fasting,
        isCoptic: fasting.isCoptic,
        isRamadan: fasting.isRamadan,
        isIntermittent: fasting.isIntermittent
      });
    }
  });

  // Convert map values to array
  const dailyActions = Array.from(actionsMap.values());

    const cycleCount = dailyActions.filter(a => a.type === 'CYCLE_DUE').length;
  const newIntakeCount = dailyActions.filter(a => a.type === 'NEW_INTAKE').length;
  const checkinCount = dailyActions.filter(a => a.type === 'CHECKIN').length;
  const overdueCount = dailyActions.filter(a => a.type === 'OVERDUE_CHECKIN').length;
  const injuryCount = dailyActions.filter(a => a.hasInjury).length;
  const renewalCount = dailyActions.filter(a => a.type === 'RENEWAL').length;

  // Unified Hostinger Semantic Squircle Visuals Generator for Dashboard Actions (Calm Luxury Tones)
  const getActionSquircleVisuals = (action) => {
    const isCycleDue = action.type === 'CYCLE_DUE';
    const isEndedCycle = isCycleDue && action.isOverdue;
    const isOverdue = action.type === 'OVERDUE_CHECKIN' || (!isCycleDue && action.isOverdue);
    const isNew = action.type === 'NEW_INTAKE';
    const isCheckin = action.type === 'CHECKIN';
    const isRenewal = action.type === 'RENEWAL';
    const isInjury = action.hasInjury;

    if (isInjury) {
      return {
        icon: HeartPulse,
        bg: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)',
        border: '1px solid #FECDD3',
        color: '#BE123C',
        shadow: '0 1px 2px rgba(190, 18, 60, 0.06)'
      };
    }
    if (isEndedCycle || isOverdue) {
      return {
        icon: isEndedCycle ? CalendarX : AlertCircle,
        bg: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
        border: '1px solid #FECACA',
        color: '#B91C1C',
        shadow: '0 1px 2px rgba(185, 28, 28, 0.06)'
      };
    }
    if (isRenewal) {
      return {
        icon: RefreshCw,
        bg: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
        border: '1px solid #FDE68A',
        color: '#B45309',
        shadow: '0 1px 2px rgba(180, 83, 9, 0.06)'
      };
    }
    if (isNew) {
      return {
        icon: ClipboardList,
        bg: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
        border: '1px solid #BFDBFE',
        color: '#1D4ED8',
        shadow: '0 1px 2px rgba(29, 78, 216, 0.06)'
      };
    }
    if (isCheckin) {
      return {
        icon: CheckCircle2,
        bg: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
        border: '1px solid #BBF7D0',
        color: '#059669',
        shadow: '0 1px 2px rgba(5, 150, 105, 0.06)'
      };
    }
    if (isCycleDue) {
      return {
        icon: RotateCw,
        bg: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
        border: '1px solid #E9D7FE',
        color: '#673DE6',
        shadow: '0 1px 2px rgba(103, 61, 230, 0.06)'
      };
    }

    return {
      icon: Dumbbell,
      bg: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
      border: '1px solid #C7D2FE',
      color: '#4338CA',
      shadow: '0 1px 2px rgba(67, 56, 202, 0.06)'
    };
  };

  // Dynamic Live KPIs (5 Focused Core Operational Filter Cards for Coach Workflow)
  const stats = [
    { 
      type: 'ALL',
      title: 'كافة المهام اليومية', 
      value: dailyActions.length.toString(), 
      unit: 'مهمة',
      label: dailyActions.length > 0 ? 'إجمالي طابور العمليات' : 'لا توجد مهام معلقة', 
      icon: Dumbbell,
      visuals: {
        bg: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
        border: '1px solid #E2E8F0',
        color: '#475569',
        shadow: '0 1px 3px rgba(71, 85, 105, 0.08)'
      },
      shortcut: '1',
      onClick: () => setActiveTab('ALL'),
      tooltip: 'عرض كافة المهام والمتابعات اليومية معاً (اختصار 1)',
      theme: {
        bg: '#F8FAFC',
        border: '#E2E8F0',
        color: '#0F172A',
        activeBg: '#F4F5F6',
        activeBorder: '#71717A'
      }
    },
    { 
      type: 'CYCLES',
      title: 'دورات مستحقة', 
      value: (cycleAttention?.count || cycleCount || 0).toString(), 
      unit: 'دورة',
      label: cycleAttention?.ended_count > 0 ? `${cycleAttention.ended_count} دورة منتهية` : (cycleCount > 0 ? 'تحديث الجداول' : 'كافة الدورات سارية'), 
      icon: RotateCw,
      visuals: {
        bg: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
        border: '1px solid #E9D7FE',
        color: '#673DE6',
        shadow: '0 1px 3px rgba(103, 61, 230, 0.08)'
      },
      shortcut: '2',
      onClick: () => setActiveTab(prev => prev === 'CYCLES' ? 'ALL' : 'CYCLES'),
      tooltip: 'فلترة الدورات التدريبية المنتهية أو التي تشارف على الانتهاء (اختصار 2)',
      theme: {
        bg: '#F5F3FF',
        border: '#DDD6FE',
        color: '#673DE6',
        activeBg: '#FAF5FF',
        activeBorder: '#673DE6'
      }
    },
    { 
      type: 'CHECKIN',
      title: 'مراجعة الشيك إن', 
      value: checkinCount.toString(), 
      unit: 'تقييم',
      label: checkinCount > 0 ? 'بانتظار الاعتماد' : 'لا توجد تقييمات معلقة', 
      icon: CheckCircle2,
      visuals: {
        bg: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
        border: '1px solid #BBF7D0',
        color: '#059669',
        shadow: '0 1px 3px rgba(16, 185, 129, 0.08)'
      },
      shortcut: '3',
      onClick: () => setActiveTab(prev => prev === 'CHECKIN' ? 'ALL' : 'CHECKIN'),
      tooltip: 'فلترة المتابعات والتقييمات الأسبوعية الواردة (اختصار 3)',
      theme: {
        bg: '#ECFDF5',
        border: '#A7F3D0',
        color: '#059669',
        activeBg: '#F0FDF4',
        activeBorder: '#059669'
      }
    },
    { 
      type: 'NEW_INTAKE',
      title: 'استمارات جديدة', 
      value: newIntakeCount.toString(), 
      unit: 'استمارة',
      label: newIntakeCount > 0 ? 'بانتظار إعداد الخطة' : 'تم إعداد الكل', 
      icon: ClipboardList,
      visuals: {
        bg: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
        border: '1px solid #BFDBFE',
        color: '#1D4ED8',
        shadow: '0 1px 3px rgba(37, 99, 235, 0.08)'
      },
      shortcut: '4',
      onClick: () => setActiveTab(prev => prev === 'NEW_INTAKE' ? 'ALL' : 'NEW_INTAKE'),
      tooltip: 'فلترة الاستمارات الجديدة بانتظار إعداد الخطة (اختصار 4)',
      theme: {
        bg: '#EFF6FF',
        border: '#BFDBFE',
        color: '#2563EB',
        activeBg: '#F8FAFF',
        activeBorder: '#2563EB'
      }
    },
    { 
      type: 'OVERDUE',
      title: 'متأخرون عن الشيك إن', 
      value: overdueCount.toString(), 
      unit: 'مشترك',
      label: overdueCount > 0 ? 'تأخر (+48س) عن التسليم' : 'الجميع منتظم في الموعد', 
      icon: AlertCircle,
      visuals: {
        bg: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
        border: '1px solid #FDE68A',
        color: '#B45309',
        shadow: '0 1px 3px rgba(217, 119, 6, 0.08)'
      },
      shortcut: '5',
      onClick: () => setActiveTab(prev => prev === 'OVERDUE' ? 'ALL' : 'OVERDUE'),
      tooltip: 'فلترة المشتركين المتأخرين عن تسليم الشيك إن أكثر من 48 ساعة (اختصار 5)',
      theme: {
        bg: '#FFFBEB',
        border: '#FDE68A',
        color: '#D97706',
        activeBg: '#FFFDF5',
        activeBorder: '#D97706'
      }
    },
  ];

  const filteredActions = dailyActions.filter(act => {
    // 1. Tab filter
    if (activeTab === 'CYCLES' && act.type !== 'CYCLE_DUE') return false;
    if (activeTab === 'NEW_INTAKE' && act.type !== 'NEW_INTAKE') return false;
    if (activeTab === 'CHECKIN' && act.type !== 'CHECKIN') return false;
    if (activeTab === 'OVERDUE' && act.type !== 'OVERDUE_CHECKIN') return false;

    // 2. Package tier filter
    if (tierFilter !== 'ALL') {
      const cleanTier = String(act.tier || '').toUpperCase();
      if (tierFilter === 'MAX' && !cleanTier.includes('MAX')) return false;
      if (tierFilter === 'ELITE' && cleanTier.includes('MAX')) return false;
    }

    // 3. Search query filter
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
  }, [activeTab, tierFilter, sortBy, searchQuery]);

  const totalActionPages = Math.ceil(sortedActions.length / actionsPageSize) || 1;
  const paginatedActions = sortedActions.slice((actionsPage - 1) * actionsPageSize, actionsPage * actionsPageSize);

  return (
    <AdminLayout onOpenNewClient={() => setIsNewClientModalOpen(true)}>
      <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: "'Cairo', sans-serif" }}>
        
        {/* 1. Executive Operations Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
              غرفة العمليات والمتابعة اليومية
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#667085', fontWeight: 500 }}>
              متابعة الدورات التدريبية، اعتماد التقييمات الأسبوعية، والبرامج الجديدة للمشتركين
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: '#667085', fontWeight: 500 }}>
              {loading ? 'جاري التحديث...' : `آخر تحديث: ${lastRefreshed.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`}
            </span>
            <RefreshButton onClick={fetchDashboardData} loading={loading} />
          </div>
        </div>

        {/* 2. Refined Calm Hostinger KPI Metric Cards & Filter Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {stats.map((st, i) => {
            const IconComponent = st.icon;
            const isActive = activeTab === st.type;
            const isEmpty = Number(st.value) === 0 && !isActive;

            return (
              <div 
                key={i} 
                onClick={st.onClick}
                title={st.tooltip || ''}
                style={{
                  background: '#FFFFFF',
                  border: isActive ? '1.5px solid #673DE6' : '1px solid #EAECF0',
                  boxShadow: isActive 
                    ? '0 0 0 1px #673DE6, 0 4px 14px rgba(103, 61, 230, 0.12)' 
                    : '0 1px 3px rgba(16, 24, 40, 0.04), 0 1px 2px rgba(16, 24, 40, 0.02)',
                  borderRadius: '14px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  cursor: st.onClick ? 'pointer' : 'default',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (st.onClick && !isActive) {
                    e.currentTarget.style.borderColor = '#D0D5DD';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px -4px rgba(16, 24, 40, 0.08), 0 2px 6px rgba(16, 24, 40, 0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (st.onClick && !isActive) {
                    e.currentTarget.style.borderColor = '#EAECF0';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(16, 24, 40, 0.04), 0 1px 2px rgba(16, 24, 40, 0.02)';
                  }
                }}
              >
                {/* Top Row: Title + Muted Squircle Icon */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: isActive ? '#673DE6' : '#667085',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {st.title}
                    </span>
                  </div>
                  <div style={{ 
                    width: '38px', 
                    height: '38px', 
                    borderRadius: '10px', 
                    background: st.visuals.bg, 
                    border: st.visuals.border,
                    boxShadow: st.visuals.shadow,
                    color: st.visuals.color, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}>
                    <IconComponent size={19} strokeWidth={2.2} color={st.visuals.color} />
                  </div>
                </div>

                {/* Bottom Row: Number + Context Subtitle */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{
                      fontSize: '1.75rem',
                      fontWeight: 700,
                      color: isEmpty ? '#CBD5E1' : '#0F172A',
                      lineHeight: 1.15
                    }}>
                      {st.value}
                    </span>
                    {st.unit && (
                      <span style={{ fontSize: '11.5px', fontWeight: 500, color: '#667085' }}>
                        {st.unit}
                      </span>
                    )}
                  </div>
                  <span style={{ 
                    fontSize: '11.5px', 
                    color: isActive ? '#673DE6' : '#667085', 
                    fontWeight: isActive ? 600 : 500, 
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {isActive ? `${st.label} (محدد)` : st.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. Hostinger Unified Action Queue Section */}
        <div style={{ width: '100%' }}>
          <FormSection 
            title="طابور المتابعة والعمليات اليومية" 
            description="إدارة وتحديث البرامج التدريبية، اعتماد الدورات، ومراجعة التقييمات الأسبوعية الواردة."
          >
            {/* Single Integrated Controls Toolbar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '16px',
              paddingBottom: '14px',
              borderBottom: '1px solid #EAECF0'
            }}>
              {/* Right: Counter and Tier Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: '#344054',
                  background: '#F2F4F7',
                  border: '1px solid #EAECF0',
                  padding: '4px 12px',
                  borderRadius: '8px'
                }}>
                  {filteredActions.length} إجراء متاح
                </span>

                <TierFilter value={tierFilter} onChange={setTierFilter} />
              </div>

              {/* Left: Sort Dropdown & Search */}
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
                      height: '32px',
                      padding: '0 14px',
                      background: '#FFFFFF',
                      border: '1px solid #D0D5DD',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#344054',
                      cursor: 'pointer',
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
                    title="فرز وترتيب الإجراءات"
                  >
                    <ArrowUpDown size={12} color="#667085" />
                    <span>{SORT_OPTIONS.find(o => o.id === sortBy)?.label || 'الترتيب'}</span>
                    <ChevronDown size={12} color="#667085" />
                  </button>

                  {isSortOpen && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      width: '190px',
                      background: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #EAECF0',
                      boxShadow: '0 12px 32px rgba(16, 24, 40, 0.12), 0 2px 6px rgba(16, 24, 40, 0.04)',
                      padding: '8px',
                      zIndex: 50,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px'
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
                              padding: '8px 12px',
                              borderRadius: '8px',
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
                            {isSelected && <Check size={13} color="#673DE6" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Search Box */}
                <TableSearch value={searchQuery} onChange={setSearchQuery} inputRef={searchInputRef} />
              </div>
            </div>

            {/* 2-Column Responsive Action Cards Grid with Hostinger Calm Elegance */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: '14px', marginTop: '6px', minHeight: '180px', alignContent: 'start' }}>
              {filteredActions.length === 0 ? (
                (() => {
                  const isTrulyAllCompleted = dailyActions.length === 0;
                  const isSearching = Boolean(searchQuery.trim());

                  if (isTrulyAllCompleted) {
                    return (
                      <div style={{
                        gridColumn: '1 / -1',
                        minHeight: '180px',
                        padding: '36px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        background: '#FAFAFB',
                        border: '1px solid #EAECF0',
                        borderRadius: '14px'
                      }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                          border: '1px solid #BBF7D0',
                          color: '#059669',
                          boxShadow: '0 1px 3px rgba(16, 185, 129, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 12px auto'
                        }}>
                          <CheckCircle2 size={22} strokeWidth={2.2} color="#059669" />
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                          تم إنهاء كافة الإجراءات والمتابعات لليوم بنجاح
                        </div>
                        <p style={{ fontSize: '12.5px', color: '#667085', margin: 0, maxWidth: '420px', lineHeight: 1.5 }}>
                          كافة المهام والمراجعات اليومية معتمدة ومكتملة، ولا توجد أي طلبات معلقة حالياً في أي قسم.
                        </p>
                      </div>
                    );
                  }

                  if (isSearching) {
                    return (
                      <div style={{
                        gridColumn: '1 / -1',
                        minHeight: '180px',
                        padding: '36px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        background: '#FAFAFB',
                        border: '1px solid #EAECF0',
                        borderRadius: '14px'
                      }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
                          border: '1px solid #E2E8F0',
                          color: '#475569',
                          boxShadow: '0 1px 3px rgba(71, 85, 105, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 12px auto'
                        }}>
                          <ClipboardList size={22} strokeWidth={2.0} color="#475569" />
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                          لا توجد نتائج مطابقة للبحث
                        </div>
                        <p style={{ fontSize: '12.5px', color: '#667085', margin: '0 0 14px 0', maxWidth: '420px', lineHeight: 1.5 }}>
                          لم نعثر على أي إجراء يطابق «{searchQuery.trim()}». يمكنك تعديل عبارة البحث أو مسحها.
                        </p>
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          style={{
                            height: '32px',
                            padding: '0 14px',
                            fontSize: '12px',
                            fontWeight: 600,
                            borderRadius: '8px',
                            background: '#FFFFFF',
                            border: '1px solid #D0D5DD',
                            color: '#344054',
                            cursor: 'pointer'
                          }}
                        >
                          مسح البحث
                        </button>
                      </div>
                    );
                  }

                  const tabTitles = {
                    CHECKIN: 'لا توجد مراجعات شيك إن معلقة حالياً',
                    CYCLES: 'لا توجد دورات تدريبية مستحقة التجهيز حالياً',
                    NEW_INTAKE: 'لا توجد استمارات جديدة بانتظار إعداد البرنامج',
                    OVERDUE: 'لا يوجد مشتركون متأخرون عن تسليم الشيك إن',
                    INJURY: 'لا توجد بلاغات إصابة معلقة تتطلب المتابعة',
                    RENEWAL: 'لا توجد اشتراكات مستحقة التجديد حالياً'
                  };

                  const title = tabTitles[activeTab] || 'لا توجد مهام معلقة تحت هذا القسم';

                  return (
                    <div style={{
                      gridColumn: '1 / -1',
                      minHeight: '180px',
                      padding: '36px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      background: '#FAFAFB',
                      border: '1px solid #EAECF0',
                      borderRadius: '14px'
                    }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
                        border: '1px solid #E9D7FE',
                        color: '#673DE6',
                        boxShadow: '0 1px 3px rgba(103, 61, 230, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px auto'
                      }}>
                        <CheckCircle2 size={22} strokeWidth={2.2} color="#673DE6" />
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                        {title}
                      </div>
                      <p style={{ fontSize: '12.5px', color: '#667085', margin: '0 0 14px 0', maxWidth: '420px', lineHeight: 1.5 }}>
                        هذا القسم مكتمل بالكامل، وتوجد {dailyActions.length} مهمة معلقة في أقسام أخرى يمكنك متابعتها الآن.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('ALL');
                          setTierFilter('ALL');
                        }}
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
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
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
                        <span>عرض كافة المهام المعلقة ({dailyActions.length})</span>
                      </button>
                    </div>
                  );
                })()
              ) : (
                paginatedActions.map(action => (
                  <div
                    key={action.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #EAECF0',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '100%',
                      boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04), 0 1px 2px rgba(16, 24, 40, 0.02)',
                      transition: 'border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => { 
                      e.currentTarget.style.borderColor = '#D0D5DD'; 
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(16, 24, 40, 0.08), 0 2px 6px rgba(16, 24, 40, 0.04)';
                    }}
                    onMouseLeave={(e) => { 
                      e.currentTarget.style.borderColor = '#EAECF0'; 
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(16, 24, 40, 0.04), 0 1px 2px rgba(16, 24, 40, 0.02)';
                    }}
                  >
                    {/* Top Row: Squircle Icon, Client Code, Name, Tier Badge & Time Ago */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: '#FFFFFF',
                      borderBottom: '1px solid #F9FAFB',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                        {(() => {
                          const v = getActionSquircleVisuals(action);
                          const ActIcon = v.icon;
                          return (
                            <div 
                              style={{ 
                                width: '34px', 
                                height: '34px', 
                                borderRadius: '10px',
                                background: v.bg, 
                                border: v.border,
                                color: v.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: v.shadow
                              }}
                              title={action.badgeText || ''}
                            >
                              <ActIcon size={16} strokeWidth={2.2} color={v.color} />
                            </div>
                          );
                        })()}

                        <span style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          fontFamily: 'JetBrains Mono, monospace',
                          color: '#475467',
                          background: '#F2F4F7',
                          border: '1px solid #EAECF0',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          flexShrink: 0
                        }}>
                          #{action.clientCode}
                        </span>

                        <strong 
                          style={{
                            fontSize: '13.5px',
                            fontWeight: 700,
                            color: '#111827',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '220px',
                            transition: 'color 0.15s ease'
                          }}
                          onClick={() => navigate(action.actionUrl || `/coach/editor/${action.clientCode}`)}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#673DE6'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#111827'; }}
                          title={action.clientName}
                        >
                          {action.clientName}
                        </strong>

                        {action.tier && (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            fontFamily: 'JetBrains Mono, Cairo, sans-serif',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: '#F8FAFC',
                            color: String(action.tier).includes('MAX') ? '#B45309' : '#0284C7',
                            border: '1px solid #EAECF0',
                            flexShrink: 0
                          }}>
                            {String(action.tier).includes('MAX') ? 'باقة MAX' : 'باقة ELITE'}
                          </span>
                        )}

                        {action.cycleNumber && (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#673DE6',
                            background: '#F4F0FD',
                            border: '1px solid #EDE8FA',
                            padding: '2px 8px',
                            borderRadius: '8px',
                            flexShrink: 0
                          }}>
                            الدورة {action.cycleNumber}
                          </span>
                        )}
                      </div>

                      {action.timeAgo && (
                        <span style={{
                          fontSize: '11.5px',
                          color: '#667085',
                          fontWeight: 500,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          flexShrink: 0
                        }}>
                          <Clock size={12} color="#98A2B3" />
                          <span>{action.timeAgo}</span>
                        </span>
                      )}
                    </div>

                    {/* Middle Row: Multi-line Readable Summary Text */}
                    <div style={{ padding: '12px 16px', background: '#FFFFFF', flex: 1 }}>
                      <p 
                        title={action.summary}
                        style={{
                          margin: 0,
                          fontSize: '12.5px',
                          color: '#374151',
                          fontWeight: 500,
                          lineHeight: 1.55,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          minHeight: '38px'
                        }}
                      >
                        {action.summary}
                      </p>
                    </div>

                    {/* Bottom Row: Restrained Status Pill & Hostinger Secondary Action Button */}
                    {(() => {
                      const isCycleDue = action.type === 'CYCLE_DUE';
                      const isEndedCycle = isCycleDue && action.isOverdue;
                      const isOverdue = action.type === 'OVERDUE_CHECKIN' || (!isCycleDue && action.isOverdue);
                      const isNew = action.type === 'NEW_INTAKE';
                      const isCheckin = action.type === 'CHECKIN';
                      const isRenewal = action.type === 'RENEWAL';
                      const isInjury = action.hasInjury;

                      // Calm Semantic Status Pill
                      let pillBg = '#F2F4F7';
                      let pillColor = '#344054';
                      let pillBorder = '#EAECF0';
                      let pillText = action.badgeText || 'إجراء مطلوب';

                      if (isEndedCycle) {
                        pillBg = '#FEF3F2';
                        pillColor = '#B42318';
                        pillBorder = '#FECDCA';
                        pillText = 'دورة منتهية';
                      } else if (isOverdue || isInjury) {
                        pillBg = '#FFFAEB';
                        pillColor = '#B54708';
                        pillBorder = '#FEDF89';
                        pillText = isInjury ? (isCheckin ? 'ثبات وزن' : 'إصابة مسجلة') : `تأخر ${action.daysOverdue || 2} يوم`;
                      } else if (isCycleDue || isRenewal) {
                        pillBg = '#F4F0FD';
                        pillColor = '#673DE6';
                        pillBorder = '#EDE8FA';
                        pillText = isCycleDue ? 'تجهيز دورة' : 'تجديد قريب';
                      } else if (isCheckin) {
                        pillBg = '#ECFDF3';
                        pillColor = '#027A48';
                        pillBorder = '#D1FADF';
                        pillText = 'متابعة واردة';
                      } else if (isNew) {
                        pillBg = '#F4F0FD';
                        pillColor = '#673DE6';
                        pillBorder = '#EDE8FA';
                        pillText = 'استمارة جديدة';
                      }

                      // Button text
                      let btnText = action.btnText || 'مراجعة التقييم';
                      if (isEndedCycle) btnText = 'اعتماد الدورة';
                      else if (isCycleDue) btnText = 'تجهيز الدورة';
                      else if (isOverdue) btnText = 'تنبيه الشيك إن (واتساب)';
                      else if (isInjury) btnText = isCheckin ? 'مراجعة ثبات الوزن' : 'مراجعة التمارين';
                      else if (isNew) btnText = 'تجهيز الخطة';
                      else if (isRenewal) btnText = 'متابعة التجديد';
                      else if (isCheckin) btnText = 'مراجعة التقييم';

                      const isUrgentAction = isEndedCycle;
                      const isWhatsAppAction = action.type === 'OVERDUE_CHECKIN';

                      return (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          padding: '10px 16px',
                          borderTop: '1px solid #F2F4F7',
                          background: '#FAFAFB',
                          marginTop: 'auto'
                        }}>
                          {/* Calm Semantic Status Badge */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: pillColor,
                              background: pillBg,
                              border: `1px solid ${pillBorder}`,
                              padding: '3px 10px',
                              borderRadius: '8px',
                              lineHeight: 1.3
                            }}>
                              {pillText}
                            </span>
                          </div>

                          {/* Hostinger Secondary White Button (Or Royal Purple for Critical) */}
                          <button
                            type="button"
                            onClick={() => {
                              if (action.type === 'OVERDUE_CHECKIN' && action.phone) {
                                window.open(generateWhatsAppUrl(action.phone, getWhatsAppMessage(action, true)), '_blank');
                              } else if (action.actionUrl) {
                                navigate(action.actionUrl);
                              }
                            }}
                            style={{
                              height: '32px',
                              padding: '0 14px',
                              borderRadius: '8px',
                              background: isUrgentAction ? '#673DE6' : '#FFFFFF',
                              color: isUrgentAction ? '#FFFFFF' : (isWhatsAppAction ? '#027A48' : '#344054'),
                              border: isUrgentAction ? '1px solid #673DE6' : '1px solid #D0D5DD',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              flexShrink: 0,
                              boxShadow: isUrgentAction ? '0 1px 2px rgba(103, 61, 230, 0.2)' : '0 1px 2px rgba(16, 24, 40, 0.03)',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { 
                              if (isUrgentAction) {
                                e.currentTarget.style.background = '#5025D1';
                              } else if (isWhatsAppAction) {
                                e.currentTarget.style.background = '#F0FDF4';
                                e.currentTarget.style.borderColor = '#059669';
                              } else {
                                e.currentTarget.style.background = '#F9FAFB';
                                e.currentTarget.style.borderColor = '#673DE6';
                                e.currentTarget.style.color = '#673DE6';
                              }
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => { 
                              if (isUrgentAction) {
                                e.currentTarget.style.background = '#673DE6';
                              } else if (isWhatsAppAction) {
                                e.currentTarget.style.background = '#FFFFFF';
                                e.currentTarget.style.borderColor = '#D0D5DD';
                              } else {
                                e.currentTarget.style.background = '#FFFFFF';
                                e.currentTarget.style.borderColor = '#D0D5DD';
                                e.currentTarget.style.color = '#344054';
                              }
                              e.currentTarget.style.transform = 'none';
                            }}
                          >
                            <span>{btnText}</span>
                            {isWhatsAppAction ? <MessageCircle size={13} /> : <ExternalLink size={12} />}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                ))
              )}
            </div>

            {/* Clean Hostinger Table Pagination Controls */}
            {totalActionPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 0 0 0',
                borderTop: '1px solid #EAECF0',
                fontSize: '12px',
                color: '#667085',
                fontWeight: 500,
                flexWrap: 'wrap',
                gap: '10px',
                marginTop: '16px'
              }}>
                <span>
                  عرض <strong style={{ color: '#111827' }}>{(actionsPage - 1) * actionsPageSize + 1}</strong> إلى <strong style={{ color: '#111827' }}>{Math.min(actionsPage * actionsPageSize, filteredActions.length)}</strong> من أصل <strong style={{ color: '#111827' }}>{filteredActions.length}</strong> إجراء
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setActionsPage(p => Math.max(1, p - 1))}
                    disabled={actionsPage === 1}
                    style={{
                      height: '32px',
                      padding: '0 14px',
                      borderRadius: '8px',
                      border: '1px solid #D0D5DD',
                      background: '#FFFFFF',
                      color: actionsPage === 1 ? '#98A2B3' : '#344054',
                      cursor: actionsPage === 1 ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: '12px',
                      transition: 'all 0.15s ease',
                      opacity: actionsPage === 1 ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => { if (actionsPage > 1) e.currentTarget.style.background = '#F9FAFB'; }}
                    onMouseLeave={(e) => { if (actionsPage > 1) e.currentTarget.style.background = '#FFFFFF'; }}
                  >
                    السابق
                  </button>

                  <span style={{ 
                    padding: '0 12px', 
                    color: '#344054', 
                    fontWeight: 600, 
                    fontSize: '12px', 
                    background: '#F2F4F7', 
                    borderRadius: '8px', 
                    height: '30px', 
                    display: 'inline-flex', 
                    alignItems: 'center' 
                  }}>
                    صفحة {actionsPage} من {totalActionPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setActionsPage(p => Math.min(totalActionPages, p + 1))}
                    disabled={actionsPage === totalActionPages}
                    style={{
                      height: '32px',
                      padding: '0 14px',
                      borderRadius: '8px',
                      border: '1px solid #D0D5DD',
                      background: '#FFFFFF',
                      color: actionsPage === totalActionPages ? '#98A2B3' : '#344054',
                      cursor: actionsPage === totalActionPages ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: '12px',
                      transition: 'all 0.15s ease',
                      opacity: actionsPage === totalActionPages ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => { if (actionsPage < totalActionPages) e.currentTarget.style.background = '#F9FAFB'; }}
                    onMouseLeave={(e) => { if (actionsPage < totalActionPages) e.currentTarget.style.background = '#FFFFFF'; }}
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}

          </FormSection>
        </div>

        {/* New Client Modal */}
        <NewClientQuickModal
          isOpen={isNewClientModalOpen}
          onClose={() => setIsNewClientModalOpen(false)}
          onClientCreated={(_newClient) => {
            fetchDashboardData();
          }}
        />

      </div>
    </AdminLayout>
  );
}
