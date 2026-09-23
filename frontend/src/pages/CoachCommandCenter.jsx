import { ClientCodeBadge, ClientPackageBadge, getClientTier, getClientCountryInfo, formatTimeAgo } from '../utils/tierBadgeHelper';
import { buildClientLinks } from '../utils/clientLinks';
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
import { TierFilter } from '@/shared/components/tier-filter';
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
  { id: 'TIER_PRIORITY', label: 'أولوية باقات ماكس' },
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
  const searchInputRef = React.useRef(null);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [_lastRefreshed, setLastRefreshed] = useState(new Date());
  const [copiedKey, setCopiedKey] = useState(null);
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
  const [runningDueCycles, setRunningDueCycles] = useState(false);
  const [cycleRunResult, setCycleRunResult] = useState(null);
  const [cycleRunError, setCycleRunError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(String(text));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

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

  const refreshCycleAttention = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/programs/cycles/attention`);
      if (res.ok) {
        const cycleData = await res.json();
        if (cycleData && typeof cycleData.count === 'number' && Array.isArray(cycleData.clients)) {
          setCycleAttention(cycleData);
        }
      }
    } catch (err) {
      console.error('Error refreshing cycle attention:', err);
    }
  };

  const handleRunDueCycles = async () => {
    if (runningDueCycles) return;
    setRunningDueCycles(true);
    setCycleRunError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/programs/cycles/run-due`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCycleRunResult(null);
        setCycleRunError(data?.error || data?.message || 'فشل تشغيل الدورات المستحقة');
      } else {
        setCycleRunError(null);
        setCycleRunResult(data);
        await refreshCycleAttention();
      }
    } catch (err) {
      setCycleRunResult(null);
      setCycleRunError(err?.message || 'فشل تشغيل الدورات المستحقة');
    } finally {
      setRunningDueCycles(false);
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
        summary: `مر ${audit.daysElapsed} يوماً على آخر شيك إن (تأخير ${audit.daysOverdue} أيام) • نوصي بمراسلته فوراً لتفادي الانقطاع.`,
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

  const newIntakeCount = dailyActions.filter(a => a.type === 'NEW_INTAKE').length;
  const checkinCount = dailyActions.filter(a => a.type === 'CHECKIN').length;
  const overdueCount = dailyActions.filter(a => a.type === 'OVERDUE_CHECKIN').length;
  const injuryCount = dailyActions.filter(a => a.hasInjury).length;
  const renewalCount = dailyActions.filter(a => a.type === 'RENEWAL').length;

  // Dynamic Live KPIs (5 Focused Core Operational Queues)
  const stats = [
    { 
      type: 'NEW_INTAKE',
      title: 'استمارات جديدة', 
      value: newIntakeCount.toString(), 
      unit: 'استمارة',
      label: newIntakeCount > 0 ? 'بانتظار إعداد الخطة' : 'تم إعداد الكل', 
      icon: ClipboardList,
      shortcut: '1',
      onClick: () => setActiveTab(prev => prev === 'NEW_INTAKE' ? 'ALL' : 'NEW_INTAKE'),
      tooltip: 'فلترة الاستمارات الجديدة بانتظار إعداد الخطة (اختصار 1)'
    },
    { 
      type: 'CHECKIN',
      title: 'مراجعة الشيك إن', 
      value: checkinCount.toString(), 
      unit: 'تقييم',
      label: checkinCount > 0 ? 'بانتظار الاعتماد' : 'لا توجد تقييمات معلقة', 
      icon: CheckCircle2,
      shortcut: '2',
      onClick: () => setActiveTab(prev => prev === 'CHECKIN' ? 'ALL' : 'CHECKIN'),
      tooltip: 'فلترة المتابعات والتقييمات الأسبوعية الواردة (اختصار 2)'
    },
    { 
      type: 'OVERDUE',
      title: 'متأخرون عن الشيك إن', 
      value: overdueCount.toString(), 
      unit: 'مشترك',
      label: overdueCount > 0 ? 'تنبيه لمنع الانقطاع (+48س)' : 'الجميع منتظم في الموعد', 
      icon: AlertCircle,
      shortcut: '3',
      onClick: () => setActiveTab(prev => prev === 'OVERDUE' ? 'ALL' : 'OVERDUE'),
      tooltip: 'فلترة المشتركين المتأخرين عن تسليم الشيك إن أكثر من 48 ساعة (اختصار 3)'
    },
    { 
      type: 'RENEWAL',
      title: 'تجديد الباقات', 
      value: renewalCount.toString(), 
      unit: 'مشترك',
      label: renewalCount > 0 ? 'اشتراكات مستحقة' : 'لا توجد تجديدات قريبة', 
      icon: Clock,
      shortcut: '4',
      onClick: () => setActiveTab(prev => prev === 'RENEWAL' ? 'ALL' : 'RENEWAL'),
      tooltip: 'فلترة اشتراكات التجديد المستحقة (اختصار 4)'
    },
    { 
      type: 'INJURY',
      title: 'الإصابات والشكاوى', 
      value: injuryCount.toString(), 
      unit: 'تنبيه',
      label: injuryCount > 0 ? 'حالات نشطة' : 'لا توجد حالات', 
      icon: ShieldAlert,
      shortcut: '5',
      onClick: () => setActiveTab(prev => prev === 'INJURY' ? 'ALL' : 'INJURY'),
      tooltip: 'فلترة الإصابات وثبات الوزن والشكاوى (اختصار 5)'
    },
  ];

  const filteredActions = dailyActions.filter(act => {
    // 1. Tab filter
    if (activeTab === 'NEW_INTAKE' && act.type !== 'NEW_INTAKE') return false;
    if (activeTab === 'CHECKIN' && act.type !== 'CHECKIN') return false;
    if (activeTab === 'OVERDUE' && act.type !== 'OVERDUE_CHECKIN') return false;
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
            // A card with nothing in it stays readable but steps back, so the cards that carry
            // today's work are the ones the eye lands on first.
            const isEmpty = Number(st.value) === 0 && !isActive;
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: isActive ? '#0F172A' : (isEmpty ? '#94A3B8' : '#64748B'), whiteSpace: 'nowrap' }}>
                      {st.title}
                    </span>
                    {st.shortcut && (
                      <span style={{ 
                        fontSize: '9.5px', 
                        color: isActive ? '#0F172A' : '#64748B', 
                        background: isActive ? '#E2E8F0' : '#F1F5F9', 
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
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '8px', 
                    background: isActive ? '#0F172A' : '#F8FAFC', 
                    border: isActive ? '1px solid #0F172A' : '1px solid #E2E8F0', 
                    color: isActive ? '#FFFFFF' : (isEmpty ? '#94A3B8' : '#0F172A'), 
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
                    <span style={{ fontSize: '1.65rem', fontWeight: 900, color: isEmpty ? '#CBD5E1' : '#0F172A', fontFamily: 'JetBrains Mono, Cairo, sans-serif', lineHeight: 1 }}>
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

        {/* كارت متابعة وتنبيهات الدورات التدريبية */}
        {((cycleAttention && cycleAttention.count > 0 && Array.isArray(cycleAttention.clients) && cycleAttention.clients.length > 0) || Boolean(cycleRunResult) || Boolean(cycleRunError)) && (
          <div
            style={{
              background: '#FFFFFF',
              border: cycleAttention?.ended_count > 0 ? '1.5px solid #FECACA' : (cycleRunError ? '1.5px solid #FECACA' : '1.5px solid #FDE68A'),
              borderRadius: '16px',
              padding: '18px 20px',
              boxShadow: (cycleAttention?.ended_count > 0 || cycleRunError)
                ? '0 4px 14px rgba(220, 38, 38, 0.08)'
                : '0 4px 14px rgba(217, 119, 6, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              width: '100%'
            }}
          >
            {/* رأس كارت تنبيهات الدورات التدريبية */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: cycleAttention?.ended_count > 0 ? '#FEF2F2' : '#FFFBEB',
                  border: cycleAttention?.ended_count > 0 ? '1px solid #FECACA' : '1px solid #FDE68A',
                  color: cycleAttention?.ended_count > 0 ? '#DC2626' : '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <AlertCircle size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span>تنبيهات الدورات التدريبية</span>
                    {cycleAttention && cycleAttention.count > 0 && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: '#0F172A',
                        color: '#FFFFFF'
                      }}>
                        {cycleAttention.count} {cycleAttention.count === 1 ? 'مشترك' : 'مشتركين'}
                      </span>
                    )}
                    {cycleAttention?.ended_count > 0 && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: '#DC2626',
                        color: '#FFFFFF'
                      }}>
                        {cycleAttention.ended_count} انتهت دورتهم
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', fontWeight: 600 }}>
                    عملاء انتهت دورتهم التدريبية الحالية أو تنتهي خلال أسبوع وبحاجة لإعداد واعتماد الدورة التالية.
                  </div>
                </div>
              </div>

              {/* زر تجهيز الدورات المستحقة - يظهر فقط عند وجود مشتركين في الكارت */}
              {cycleAttention && cycleAttention.count > 0 && (
                <button
                  type="button"
                  disabled={runningDueCycles}
                  onClick={handleRunDueCycles}
                  style={{
                    height: '36px',
                    padding: '0 16px',
                    borderRadius: '10px',
                    background: runningDueCycles ? '#94A3B8' : '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: runningDueCycles ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    opacity: runningDueCycles ? 0.75 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!runningDueCycles) e.currentTarget.style.background = '#1E293B';
                  }}
                  onMouseLeave={(e) => {
                    if (!runningDueCycles) e.currentTarget.style.background = '#0F172A';
                  }}
                >
                  <RotateCw size={14} className={runningDueCycles ? 'animate-spin' : ''} />
                  <span>{runningDueCycles ? 'جاري التجهيز...' : 'تجهيز الدورات المستحقة'}</span>
                </button>
              )}
            </div>

            {/* في حالة الخطأ من الخادم: إظهار رسالة الخطأ القادمة من الخادم فقط ولا تظهر أي قائمة */}
            {cycleRunError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: '#FEF2F2',
                  border: '1.5px solid #FECACA',
                  color: '#991B1B',
                  fontSize: '13px',
                  fontWeight: 700
                }}
              >
                <AlertCircle size={18} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                <span>{cycleRunError}</span>
              </div>
            )}

            {/* نتيجة تشغيل الدورات المستحقة */}
            {cycleRunResult && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: '#F8FAFC',
                  border: '1.5px solid #E2E8F0'
                }}
              >
                {/* رسالة message_ar كما هي */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13.5px',
                    fontWeight: 800,
                    color: '#0F172A'
                  }}
                >
                  <CheckCircle2 size={18} color="#059669" strokeWidth={2.2} style={{ flexShrink: 0 }} />
                  <span>{cycleRunResult.message_ar}</span>
                </div>

                {/* قائمة الدورات التي نُشرت تلقائياً */}
                {Array.isArray(cycleRunResult.published) && cycleRunResult.published.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#047857', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>نُشرت تلقائياً</span>
                      <span style={{
                        fontSize: '11px',
                        padding: '1px 6px',
                        borderRadius: '6px',
                        background: '#DCFCE7',
                        color: '#15803D',
                        fontWeight: 800
                      }}>
                        {cycleRunResult.published_count}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {cycleRunResult.published.map((p, idx) => (
                        <div
                          key={p.client_code || p.program_id || idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: '#F0FDF4',
                            border: '1px solid #BBF7D0',
                            flexWrap: 'wrap'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#065F46' }}>
                              {p.full_name || `مشترك #${p.client_code}`}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: '#DCFCE7',
                              color: '#166534',
                              border: '1px solid #86EFAC',
                              fontFamily: 'JetBrains Mono, monospace'
                            }}>
                              #{p.client_code}
                            </span>
                          </div>
                          <span style={{
                            fontSize: '11.5px',
                            fontWeight: 800,
                            padding: '3px 10px',
                            borderRadius: '8px',
                            background: '#059669',
                            color: '#FFFFFF'
                          }}>
                            الدورة {p.cycle_number}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* قائمة الدورات التي تنتظر قرار الكوتش */}
                {Array.isArray(cycleRunResult.waiting) && cycleRunResult.waiting.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#B45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>تنتظر قرارك</span>
                      <span style={{
                        fontSize: '11px',
                        padding: '1px 6px',
                        borderRadius: '6px',
                        background: '#FEF3C7',
                        color: '#B45309',
                        fontWeight: 800
                      }}>
                        {cycleRunResult.waiting_count}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {cycleRunResult.waiting.map((w, idx) => (
                        <div
                          key={w.client_code || w.program_id || idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            padding: '12px 14px',
                            borderRadius: '10px',
                            background: '#FFFBEB',
                            border: '1px solid #FDE68A',
                            flexWrap: 'wrap'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 300px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '13px', fontWeight: 800, color: '#92400E' }}>
                                {w.full_name || `مشترك #${w.client_code}`}
                              </span>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background: '#FEF3C7',
                                color: '#92400E',
                                border: '1px solid #FCD34D',
                                fontFamily: 'JetBrains Mono, monospace'
                              }}>
                                #{w.client_code}
                              </span>
                              {w.cycle_number && (
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  background: '#F1F5F9',
                                  color: '#475569'
                                }}>
                                  الدورة {w.cycle_number}
                                </span>
                              )}
                            </div>
                            {/* إظهار reasons_ar لكل منها كما هي نصاً بلا أي استنتاج أو إعادة صياغة */}
                            {Array.isArray(w.reasons_ar) && w.reasons_ar.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {w.reasons_ar.map((reason, rIdx) => (
                                  <div key={rIdx} style={{ fontSize: '12px', color: '#78350F', fontWeight: 600, lineHeight: 1.5 }}>
                                    • {reason}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              w.reasons_ar && (
                                <div style={{ fontSize: '12px', color: '#78350F', fontWeight: 600, lineHeight: 1.5 }}>
                                  • {String(w.reasons_ar)}
                                </div>
                              )
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => navigate(`/coach/editor/${w.client_code}`)}
                            style={{
                              height: '34px',
                              padding: '0 14px',
                              borderRadius: '8px',
                              background: '#D97706',
                              color: '#FFFFFF',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                              transition: 'all 0.15s ease',
                              whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#B45309';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#D97706';
                            }}
                          >
                            <span>فتح المحرر</span>
                            <ExternalLink size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* قائمة المشتركين بحاجة لدورة تدريبية جديدة */}
            {cycleAttention && cycleAttention.count > 0 && Array.isArray(cycleAttention.clients) && cycleAttention.clients.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {cycleAttention.clients.map((client) => {
                  const isEnded = client.status === 'ENDED';
                  return (
                    <div
                      key={client.client_code || client.program_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: isEnded ? '1.5px solid #FECACA' : '1px solid #FDE68A',
                        background: isEnded ? '#FEF2F2' : '#FFFBEB',
                        flexWrap: 'wrap',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 320px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '13.5px', fontWeight: 800, color: isEnded ? '#991B1B' : '#92400E' }}>
                            {client.full_name || `مشترك #${client.client_code}`}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: isEnded ? '#FEE2E2' : '#FEF3C7',
                            color: isEnded ? '#991B1B' : '#92400E',
                            border: isEnded ? '1px solid #FCA5A5' : '1px solid #FCD34D',
                            fontFamily: 'JetBrains Mono, monospace'
                          }}>
                            #{client.client_code}
                          </span>
                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: isEnded ? '#DC2626' : '#D97706',
                            color: '#FFFFFF'
                          }}>
                            {isEnded ? 'انتهت الدورة' : 'تنتهي قريباً'}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '12.5px',
                          color: isEnded ? '#7F1D1D' : '#78350F',
                          fontWeight: 600,
                          lineHeight: 1.5
                        }}>
                          {client.message_ar}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate(`/coach/editor/${client.client_code}`)}
                        style={{
                          height: '34px',
                          padding: '0 14px',
                          borderRadius: '8px',
                          background: isEnded ? '#DC2626' : '#D97706',
                          color: '#FFFFFF',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isEnded ? '#B91C1C' : '#B45309';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isEnded ? '#DC2626' : '#D97706';
                        }}
                      >
                        <span>فتح محرر الكوتش</span>
                        <ExternalLink size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
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

                <TierFilter value={tierFilter} onChange={setTierFilter} />
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
                    ref={searchInputRef}
                    type="text"
                    placeholder="بحث بالاسم أو الكود أو الهاتف... (اضغط / للتركيز)"
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
                            borderRadius: '6px',
                            transition: 'color 0.15s ease'
                          }}
                        >
                          {copiedKey === `code_${action.id}` ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                        <a
                          href={`/client?code=${action.clientCode}`}
                          target="_blank"
                          rel="noreferrer"
                          title="معاينة حية لتطبيق المتدرب"
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            border: '1px solid #E2E8F0',
                            background: '#F8FAFC',
                            color: '#64748B',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textDecoration: 'none',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#F1F5F9';
                            e.currentTarget.style.color = '#0F172A';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#F8FAFC';
                            e.currentTarget.style.color = '#64748B';
                          }}
                        >
                          <Smartphone size={12} />
                        </a>
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

                      {/* Overdue Alert SLA Badge (> 24h or overdue checkin) */}
                      {action.type === 'OVERDUE_CHECKIN' ? (
                        <span style={{
                          fontSize: '10.5px',
                          background: '#FFF7ED',
                          border: '1px solid #FFEDD5',
                          color: '#C2410C',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }} title={action.summary}>
                          <AlertCircle size={11} />
                          <span>تأخر شيك إن ({action.daysOverdue} يوم)</span>
                        </span>
                      ) : action.isOverdue && (
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
                          {action.type === 'CHECKIN' ? 'ثبات وزن' : 'إصابة مسجلة'}
                        </span>
                      )}
                      {action.type === 'NEW_INTAKE' && (action.badgeText?.includes('مدفوع') || action.badgeText?.includes('الدفع')) && (
                        <span style={{ fontSize: '10.5px', background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                          تم الدفع
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
                      <span style={{ color: '#64748B', fontWeight: 700, flexShrink: 0 }}>الملاحظة:</span>
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

                      {/* Main Operational Action Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (action.type === 'OVERDUE_CHECKIN' && action.phone) {
                            window.open(generateWhatsAppUrl(action.phone, getWhatsAppMessage(action, true)), '_blank');
                          } else if (action.actionUrl) {
                            navigate(action.actionUrl);
                          }
                        }}
                        title={action.type === 'OVERDUE_CHECKIN' ? 'مراسلة المشترك لتسليم الشيك إن عبر واتساب' : 'الانتقال إلى المراجعة والإجراء'}
                        style={{
                          height: '32px',
                          padding: '0 14px',
                          borderRadius: '8px',
                          background: action.type === 'OVERDUE_CHECKIN' ? '#16A34A' : 'var(--color-primary-light, #F1F5F9)',
                          color: action.type === 'OVERDUE_CHECKIN' ? '#FFFFFF' : 'var(--primary, #0F172A)',
                          fontWeight: 800,
                          fontSize: '11.5px',
                          border: action.type === 'OVERDUE_CHECKIN' ? '1px solid #15803D' : 'var(--color-primary-border, #CBD5E1)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (action.type === 'OVERDUE_CHECKIN') {
                            e.currentTarget.style.background = '#15803D';
                          } else {
                            e.currentTarget.style.background = 'var(--primary, #0F172A)';
                            e.currentTarget.style.color = '#FFFFFF';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (action.type === 'OVERDUE_CHECKIN') {
                            e.currentTarget.style.background = '#16A34A';
                          } else {
                            e.currentTarget.style.background = 'var(--color-primary-light, #F1F5F9)';
                            e.currentTarget.style.color = 'var(--primary, #0F172A)';
                          }
                        }}
                      >
                        <span>
                          {action.hasInjury
                            ? (action.type === 'CHECKIN' ? 'مراجعة ثبات الوزن' : 'مراجعة وتعديل التمارين')
                            : action.type === 'NEW_INTAKE'
                              ? 'تجهيز واعتماد الخطة'
                              : action.type === 'CHECKIN'
                                ? 'مراجعة التقييم الأسبوعي'
                                : action.type === 'OVERDUE_CHECKIN'
                                  ? 'تنبيه الشيك إن (واتساب)'
                                  : action.type === 'RENEWAL'
                                    ? 'متابعة التجديد'
                                    : 'تجهيز الخطة'}
                        </span>
                        {action.type === 'OVERDUE_CHECKIN' ? (
                          <MessageCircle size={12} />
                        ) : (
                          <ExternalLink size={11} style={{ opacity: 0.7 }} />
                        )}
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
                    borderRadius: '10px',
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
                          borderRadius: '8px',
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
                          borderRadius: '8px',
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
          onClientCreated={(_newClient) => {
            fetchDashboardData();
          }}
        />

      </div>
    </AdminLayout>
  );
}
