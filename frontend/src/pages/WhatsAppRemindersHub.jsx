import { API_BASE } from '../config/api';
import { buildClientLinks } from '../utils/clientLinks';
import { getClientTier, ClientCodeBadge, ClientPackageBadge } from '../utils/tierBadgeHelper';
import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { 
  Send, MessageSquare, CheckCircle2, Copy, ExternalLink, 
  Smartphone, ShieldAlert, Check, ChevronRight, ChevronLeft, 
  Dumbbell, Link, Clock, AlertTriangle, Sparkles, Utensils, 
  Activity, Flame, RotateCcw, User, HeartPulse
} from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import { TableSearch } from '@/shared/components/table-search';
import { RefreshButton } from '@/shared/components/refresh-button';
import { 
  REMINDER_CATEGORIES, 
  TEMPLATE_GROUPS, 
  MESSAGE_TEMPLATES, 
  compileReminderMessage, 
  generateWhatsAppUrl 
} from '../utils/whatsappRemindersEngine';
import { arabicSearchMatch } from '../utils/searchUtils';
import { CLINICAL_MASTER_BLUEPRINTS, STRESS_TEST_CLIENTS } from '../data/stressTestClientsBlueprints';

// استخراج وإثراء بيانات الخطة الحيوية للمشترك
function getEnrichedPlanSummary(client) {
  if (!client) {
    return {
      trainingSplit: 'علوي / سفلي متوازن',
      trainingDays: 4,
      nutritionCalories: 2150,
      nutritionProtein: 150,
      nutritionCarbs: 220,
      nutritionFat: 60,
      cardioSessions: 3,
      cardioSteps: '8,000 خطوة يومياً',
      cleanGoal: 'تحسين اللياقة والصحة'
    };
  }

  const codeKey = String(client.client_code || client.id || '').replace(/^#+/, '').trim();
  const bp = CLINICAL_MASTER_BLUEPRINTS[codeKey];
  const existing = client.plan_summary || {};

  const trainingSplit = existing.trainingSplit || bp?.training?.split_name || (client.training_env_label ? `جدول مخصص (${client.training_env_label})` : 'علوي / سفلي متوازن');
  const trainingDays = existing.trainingDays || client.training_days || (bp?.training?.sessions?.length) || 4;
  const nutritionCalories = existing.nutritionCalories || bp?.nutrition?.targets?.calories || 2150;
  const nutritionProtein = existing.nutritionProtein || bp?.nutrition?.targets?.protein || 150;
  const nutritionCarbs = existing.nutritionCarbs || bp?.nutrition?.targets?.carbs || 220;
  const nutritionFat = existing.nutritionFat || bp?.nutrition?.targets?.fats || 60;
  const cardioSessions = existing.cardioSessions !== undefined ? existing.cardioSessions : (bp ? 3 : 3);
  const cardioSteps = existing.cardioSteps || client.neat_label || '8,000 خطوة يومياً';
  const cleanGoal = existing.cleanGoal || client.goal_label || client.primary_goal || 'تحسين اللياقة البدنية';

  return {
    trainingSplit,
    trainingDays,
    nutritionCalories,
    nutritionProtein,
    nutritionCarbs,
    nutritionFat,
    cardioSessions,
    cardioSteps,
    cleanGoal
  };
}

export default function WhatsAppRemindersHub() {
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // 'ALL' | 'DUE' | 'OVERDUE' | 'NEW' | 'RENEWAL' | 'ON_TRACK'
  const [selectedTier, setSelectedTier] = useState('ALL'); // 'ALL' | 'MAX' | 'ELITE'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(null);
  
  // Template States
  const [activeGroup, setActiveGroup] = useState('ALL');
  const [activeTemplateKey, setActiveTemplateKey] = useState(REMINDER_CATEGORIES.CHECKIN_DUE);
  const [customMessage, setCustomMessage] = useState('');
  
  const textareaRef = useRef(null);
  const [toast, setToast] = useState(null);
  const [dispatchedMap, setDispatchedMap] = useState({});

  // Live Clients API Data
  const [clientsData, setClientsData] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAppOrigin = useCallback(() => {
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      return window.location.origin;
    }
    return '';
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('coach_token') || localStorage.getItem('admin_token');
      
      let fetchedList = [];
      try {
        const res = await fetch(`${API_BASE}/api/v1/clients`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.clients) && data.clients.length > 0) {
            fetchedList = data.clients;
          }
        }
      } catch (e) {
        console.warn('Clients API fetch failed, trying fallback:', e);
      }

      // إذا تعذر جلب المشتركين من المسار الرئيسي، يتم الجلب الاحتياطي
      if (!fetchedList.length) {
        try {
          const resFallback = await fetch(`${API_BASE}/api/v1/subscriptions/overview`);
          if (resFallback.ok) {
            const dataFallback = await resFallback.json();
            if (Array.isArray(dataFallback.clients) && dataFallback.clients.length > 0) {
              fetchedList = dataFallback.clients;
            }
          }
        } catch {
          // fallback to stress test data
          fetchedList = STRESS_TEST_CLIENTS;
        }
      }

      if (!fetchedList.length) {
        fetchedList = STRESS_TEST_CLIENTS;
      }

      const enriched = fetchedList.map((client) => {
        const isMax = getClientTier(client) === 'MAX';
        const checkinInterval = isMax ? 7 : 14;
        let defaultCat = REMINDER_CATEGORIES.CHECKIN_DUE;
        let daysLeft = client.days_remaining !== undefined ? client.days_remaining : (client.daysRemaining || 30);
        let lastCheckinDays = -1;
        let triggerStatus = 'ON_TRACK';

        if (client.checkinSubmissions && client.checkinSubmissions.length > 0) {
          const latestCheckin = client.checkinSubmissions[0];
          const checkinDate = new Date(latestCheckin.createdAt || latestCheckin.created_at || Date.now());
          lastCheckinDays = Math.max(0, Math.round((Date.now() - checkinDate.getTime()) / (1000 * 60 * 60 * 24)));
        }

        if (client.status === 'FROZEN' || client.subscription_status === 'FROZEN') {
          defaultCat = REMINDER_CATEGORIES.MOTIVATION;
          triggerStatus = 'FROZEN';
        } else if (client.status === 'EXPIRING_SOON' || (daysLeft > 0 && daysLeft <= 3)) {
          defaultCat = REMINDER_CATEGORIES.RENEWAL_UPCOMING;
          triggerStatus = 'EXPIRING_SOON';
        } else if (client.status === 'EXPIRED' || daysLeft <= 0) {
          defaultCat = REMINDER_CATEGORIES.RENEWAL_UPCOMING;
          triggerStatus = 'EXPIRED';
        } else if (lastCheckinDays > checkinInterval) {
          defaultCat = REMINDER_CATEGORIES.CHECKIN_OVERDUE;
          triggerStatus = 'CHECKIN_OVERDUE';
        } else if (lastCheckinDays >= checkinInterval - 1) {
          defaultCat = REMINDER_CATEGORIES.CHECKIN_DUE;
          triggerStatus = 'CHECKIN_DUE';
        } else if (lastCheckinDays === -1) {
          // لم يُرسل شيك إن بعد - مشترك جديد
          defaultCat = REMINDER_CATEGORIES.TRAINING_LAUNCH;
          triggerStatus = 'NEW_CLIENT';
        } else {
          defaultCat = REMINDER_CATEGORIES.MOTIVATION;
          triggerStatus = 'ON_TRACK';
        }

        const planSummary = getEnrichedPlanSummary(client);

        return {
          ...client,
          isMax,
          pkgLabel: isMax ? 'MAX' : 'ELITE',
          defaultCat,
          triggerStatus,
          daysLeft,
          lastCheckinDays,
          planSummary
        };
      });

      // ترتيب المشتركين تصاعدياً برقم المشترك من #01 إلى #18
      enriched.sort((a, b) => {
        const numA = parseInt(String(a.client_code || a.id).replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(String(b.client_code || b.id).replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      });

      setClientsData(enriched);
      if (enriched.length > 0 && !selectedClientId) {
        setSelectedClientId(enriched[0].id);
        setActiveTemplateKey(enriched[0].defaultCat);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedClientId]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // فلترة قائمة المشتركين
  const filteredClients = useMemo(() => {
    return clientsData.filter(c => {
      // 1. فلتر البحث
      const q = searchQuery.trim();
      const qClean = q.toLowerCase().replace(/^#+/, '');
      const matchSearch = !qClean || 
        String(c.client_code || c.id).includes(qClean) ||
        arabicSearchMatch(c.full_name || c.name, q) ||
        (c.phone_number || '').includes(qClean) ||
        (c.planSummary?.trainingSplit && arabicSearchMatch(c.planSummary.trainingSplit, q)) ||
        (c.planSummary?.cleanGoal && arabicSearchMatch(c.planSummary.cleanGoal, q));

      if (!matchSearch) return false;

      // 2. فلتر الباقة
      if (selectedTier === 'MAX' && !c.isMax) return false;
      if (selectedTier === 'ELITE' && c.isMax) return false;

      // 3. فلتر الحالة الموحد
      if (selectedFilter === 'DUE' && c.triggerStatus !== 'CHECKIN_DUE') return false;
      if (selectedFilter === 'OVERDUE' && c.triggerStatus !== 'CHECKIN_OVERDUE') return false;
      if (selectedFilter === 'NEW' && c.triggerStatus !== 'NEW_CLIENT') return false;
      if (selectedFilter === 'RENEWAL' && c.triggerStatus !== 'EXPIRING_SOON' && c.triggerStatus !== 'EXPIRED') return false;
      if (selectedFilter === 'ON_TRACK' && c.triggerStatus !== 'ON_TRACK') return false;

      return true;
    });
  }, [clientsData, searchQuery, selectedTier, selectedFilter]);

  // المشترك النشط المختار
  const activeClient = useMemo(() => {
    if (!filteredClients.length) return clientsData[0] || null;
    if (selectedClientId !== null && selectedClientId !== undefined) {
      const matchInFiltered = filteredClients.find(c => String(c.id) === String(selectedClientId));
      if (matchInFiltered) return matchInFiltered;
      const matchInAll = clientsData.find(c => String(c.id) === String(selectedClientId));
      if (matchInAll) return matchInAll;
    }
    return filteredClients[0] || clientsData[0] || null;
  }, [filteredClients, clientsData, selectedClientId]);

  const activeIndex = useMemo(() => {
    if (!activeClient || filteredClients.length === 0) return -1;
    return filteredClients.findIndex(c => String(c.id) === String(activeClient.id));
  }, [filteredClients, activeClient]);

  const handlePrevClient = useCallback(() => {
    if (filteredClients.length === 0) return;
    const currentIdx = filteredClients.findIndex(c => String(c.id) === String(activeClient?.id));
    const nextIdx = currentIdx > 0 ? currentIdx - 1 : filteredClients.length - 1;
    const target = filteredClients[nextIdx];
    if (target) {
      setSelectedClientId(target.id);
      setActiveTemplateKey(target.defaultCat);
    }
  }, [filteredClients, activeClient]);

  const handleNextClient = useCallback(() => {
    if (filteredClients.length === 0) return;
    const currentIdx = filteredClients.findIndex(c => String(c.id) === String(activeClient?.id));
    const nextIdx = currentIdx < filteredClients.length - 1 ? currentIdx + 1 : 0;
    const target = filteredClients[nextIdx];
    if (target) {
      setSelectedClientId(target.id);
      setActiveTemplateKey(target.defaultCat);
    }
  }, [filteredClients, activeClient]);

  // تحديث نص الرسالة التلقائي عند تغيير المشترك أو القالب
  useEffect(() => {
    if (activeClient) {
      const origin = getAppOrigin();
      const tpl = MESSAGE_TEMPLATES[activeTemplateKey]?.template || '';
      const plan = activeClient.planSummary || getEnrichedPlanSummary(activeClient);
      
      const compiled = compileReminderMessage(tpl, {
        client_name: activeClient.full_name || activeClient.name || 'عزيزي المشترك',
        package_name: activeClient.pkgLabel === 'MAX' ? 'باقة MAX' : 'باقة إليت (ELITE)',
        days_left: activeClient.daysLeft || 3,
        training_split: plan.trainingSplit,
        training_days: `${plan.trainingDays} أيام`,
        calories: `${plan.nutritionCalories} سعرة`,
        protein: `${plan.nutritionProtein}g`,
        carbs: `${plan.nutritionCarbs}g`,
        fats: `${plan.nutritionFat}g`,
        cardio_sessions: `${plan.cardioSessions} جلسات/أسبوع`,
        daily_steps: plan.cardioSteps,
        goal: plan.cleanGoal,
        ...buildClientLinks(activeClient.client_code, origin)
      });
      setCustomMessage(compiled);
    }
  }, [activeClient, activeTemplateKey, getAppOrigin]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopyMessage = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast('تم نسخ نص الرسالة للحافظة بنجاح');
    }
  };

  const handleResetToTemplate = () => {
    if (activeClient) {
      const origin = getAppOrigin();
      const tpl = MESSAGE_TEMPLATES[activeTemplateKey]?.template || '';
      const plan = activeClient.planSummary || getEnrichedPlanSummary(activeClient);
      const compiled = compileReminderMessage(tpl, {
        client_name: activeClient.full_name || activeClient.name || 'عزيزي المشترك',
        package_name: activeClient.pkgLabel === 'MAX' ? 'باقة MAX' : 'باقة إليت (ELITE)',
        days_left: activeClient.daysLeft || 3,
        training_split: plan.trainingSplit,
        training_days: `${plan.trainingDays} أيام`,
        calories: `${plan.nutritionCalories} سعرة`,
        protein: `${plan.nutritionProtein}g`,
        carbs: `${plan.nutritionCarbs}g`,
        fats: `${plan.nutritionFat}g`,
        cardio_sessions: `${plan.cardioSessions} جلسات/أسبوع`,
        daily_steps: plan.cardioSteps,
        goal: plan.cleanGoal,
        ...buildClientLinks(activeClient.client_code, origin)
      });
      setCustomMessage(compiled);
      showToast('تمت إعادة ضبط الرسالة إلى النص القياسي للقالب');
    }
  };

  const handleInsertVariable = (valToInsert) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const textBefore = customMessage.substring(0, start);
      const textAfter = customMessage.substring(end);
      const newMsg = `${textBefore}${valToInsert}${textAfter}`;
      setCustomMessage(newMsg);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + valToInsert.length, start + valToInsert.length);
      }, 0);
    } else {
      setCustomMessage(prev => `${prev} ${valToInsert}`);
    }
    showToast(`تم إدراج: ${valToInsert}`);
  };

  const handleSendWhatsApp = (client, msgText) => {
    const textToSend = msgText || customMessage;
    const phone = client?.phone_number || activeClient?.phone_number;
    const url = generateWhatsAppUrl(phone, textToSend);
    
    setDispatchedMap(prev => ({
      ...prev,
      [client?.id || activeClient?.id]: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    }));

    showToast(`جاري فتح واتساب للمشترك ${client?.full_name || activeClient?.full_name}...`);
    window.open(url, '_blank');
  };

  // اختصارات لوحة المفاتيح
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInput = activeTag === 'input' || activeTag === 'textarea';

      // Alt + ArrowUp أو [ => المشترك السابق
      if (!isInput && (e.key === '[' || (e.altKey && e.key === 'ArrowUp'))) {
        e.preventDefault();
        handlePrevClient();
      }
      // Alt + ArrowDown أو ] => المشترك التالي
      else if (!isInput && (e.key === ']' || (e.altKey && e.key === 'ArrowDown'))) {
        e.preventDefault();
        handleNextClient();
      }
      // Ctrl + Enter أو Alt + W => إرسال واتساب
      else if ((e.ctrlKey && e.key === 'Enter') || (e.altKey && (e.key === 'w' || e.key === 'W' || e.key === 'ص'))) {
        e.preventDefault();
        if (activeClient) {
          handleSendWhatsApp(activeClient, customMessage);
        }
      }
      // Alt + C => نسخ النص
      else if (!isInput && e.altKey && (e.key === 'c' || e.key === 'C' || e.key === 'ؤ')) {
        e.preventDefault();
        handleCopyMessage(customMessage);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevClient, handleNextClient, activeClient, customMessage]);

  // الإحصائيات الفورية
  const dueCheckinsCount = clientsData.filter(c => c.triggerStatus === 'CHECKIN_DUE').length;
  const overdueCheckinsCount = clientsData.filter(c => c.triggerStatus === 'CHECKIN_OVERDUE').length;
  const newClientsCount = clientsData.filter(c => c.triggerStatus === 'NEW_CLIENT').length;
  const renewalsCount = clientsData.filter(c => c.triggerStatus === 'EXPIRING_SOON' || c.triggerStatus === 'EXPIRED').length;
  const onTrackCount = clientsData.filter(c => c.triggerStatus === 'ON_TRACK').length;

  // القوالب المفلترة حسب التبويب النشط
  const filteredTemplates = useMemo(() => {
    const all = Object.values(MESSAGE_TEMPLATES);
    if (activeGroup === 'ALL') return all;
    return all.filter(t => t.group === activeGroup);
  }, [activeGroup]);

  const activePlan = activeClient?.planSummary || getEnrichedPlanSummary(activeClient);
  const hasInjuries = Boolean(
    (Array.isArray(activeClient?.injuries) && activeClient.injuries.some(i => i && i !== 'none')) ||
    (typeof activeClient?.injuries === 'string' && activeClient.injuries.trim() && activeClient.injuries !== 'none') ||
    (activeClient?.intakeSubmissions?.[0]?.answers?.injuries_map?.has_injuries) ||
    (activeClient?.answers?.injuries_map?.has_injuries)
  );

  return (
    <AdminLayout fullWidth={true}>
      <div 
        dir="rtl" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '14px', 
          fontFamily: 'Cairo, sans-serif',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        
        {/* 1. Header Command Bar: Live Stats & Unified Filters */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #EAECF0',
          borderRadius: '14px',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)'
        }}>
          {/* Page Title & Subtitle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#F4F0FD', color: '#673DE6', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                مركز رسائل الواتساب والمتابعة الفنية
              </h2>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                إدارة رسائل الشيك إن الدوري، ومتابعة برامج التدريب والتغذية والكارديو بنقرة واحدة عبر واتساب.
              </span>
            </div>
          </div>

          {/* Unified Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <RefreshButton onClick={fetchClients} loading={loading} />

            {[
              { id: 'ALL', label: 'كافة المشتركين', count: clientsData.length, color: '#0F172A', bg: '#F1F5F9' },
              { id: 'DUE', label: 'شيك إن مستحق', count: dueCheckinsCount, color: '#0284C7', bg: '#F0F9FF' },
              { id: 'OVERDUE', label: 'تقييم متأخر', count: overdueCheckinsCount, color: '#DC2626', bg: '#FEF2F2' },
              { id: 'NEW', label: 'مشتركون جدد', count: newClientsCount, color: '#2563EB', bg: '#EFF6FF' },
              { id: 'RENEWAL', label: 'تجديد قريب', count: renewalsCount, color: '#D97706', bg: '#FFFBEB' },
              { id: 'ON_TRACK', label: 'ملتزمون بالخطة', count: onTrackCount, color: '#166534', bg: '#F0FDF4' }
            ].map(f => {
              const isSel = selectedFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFilter(f.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    fontWeight: isSel ? 700 : 600,
                    border: isSel ? '1px solid #0F172A' : '1px solid #E2E8F0',
                    background: isSel ? '#0F172A' : '#FFFFFF',
                    color: isSel ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: isSel ? '0 1px 3px rgba(15, 23, 42, 0.12)' : 'none',
                    transition: 'all 0.12s ease'
                  }}
                >
                  <span>{f.label}</span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    fontFamily: 'JetBrains Mono, monospace',
                    padding: '1px 6px',
                    borderRadius: '6px',
                    background: isSel ? 'rgba(255,255,255,0.2)' : f.bg,
                    color: isSel ? '#FFFFFF' : f.color
                  }}>
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tier Switch & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '3px', background: '#F1F5F9', padding: '3px', borderRadius: '8px', border: '1px solid #EAECF0' }}>
              {[
                { id: 'ALL', label: 'الكل' },
                { id: 'MAX', label: 'MAX' },
                { id: 'ELITE', label: 'ELITE' }
              ].map(t => {
                const isSel = selectedTier === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTier(t.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 800,
                      fontFamily: t.id !== 'ALL' ? 'JetBrains Mono, sans-serif' : 'inherit',
                      border: 'none',
                      background: isSel ? '#0F172A' : 'transparent',
                      color: isSel ? '#FFFFFF' : (t.id === 'MAX' ? '#B45309' : t.id === 'ELITE' ? '#0284C7' : '#64748B'),
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <TableSearch 
              value={searchQuery} 
              onChange={setSearchQuery} 
              placeholder="بحث بالاسم أو الرقم أو الخطة..." 
              width="210px" 
              showShortcut={false} 
            />
          </div>
        </div>

        {/* 2. Two-Column Workspace: Left = Studio & 360 Blueprint, Right = Clients Queue */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) 1fr', gap: '16px', alignItems: 'start' }}>
          
          {/* RIGHT COLUMN: Actionable Clients List (#01 to #18) */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #EAECF0',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)'
          }}>
            <div style={{ padding: '12px 18px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '13px', color: '#0F172A', fontWeight: 700 }}>
                قائمة المشتركين ({filteredClients.length})
              </strong>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                انقر على المشترك لمعاينة وتعديل خطته ورسالته
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '720px', overflowY: 'auto' }}>
              {filteredClients.length === 0 ? (
                <div style={{ padding: '40px 10px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>
                  لا توجد تنبيهات مطابقة للفلتر المحدد
                </div>
              ) : (
                filteredClients.map((client) => {
                  const isSelected = activeClient ? String(activeClient.id) === String(client.id) : false;
                  const isDispatched = !!dispatchedMap[client.id];
                  const plan = client.planSummary || getEnrichedPlanSummary(client);
                  
                  const clientHasInjuries = Boolean(
                    (Array.isArray(client.injuries) && client.injuries.some(i => i && i !== 'none')) ||
                    (typeof client.injuries === 'string' && client.injuries.trim() && client.injuries !== 'none') ||
                    (client.intakeSubmissions?.[0]?.answers?.injuries_map?.has_injuries) ||
                    (client.answers?.injuries_map?.has_injuries)
                  );

                  let reasonBadge = { label: 'ملتزم بالخطة', bg: '#F0FDF4', border: '#BBF7D0', color: '#166534' };
                  if (client.triggerStatus === 'CHECKIN_OVERDUE') {
                    reasonBadge = { label: `متأخر ${client.lastCheckinDays} أيام`, bg: '#FEF2F2', border: '#FECACA', color: '#DC2626' };
                  } else if (client.triggerStatus === 'CHECKIN_DUE') {
                    reasonBadge = { label: 'شيك إن مستحق', bg: '#F0F9FF', border: '#BAE6FD', color: '#0284C7' };
                  } else if (client.triggerStatus === 'NEW_CLIENT') {
                    reasonBadge = { label: 'مشترك جديد', bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' };
                  } else if (client.triggerStatus === 'EXPIRING_SOON') {
                    reasonBadge = { label: `تجديد خلال ${client.daysLeft} يوم`, bg: '#FFFBEB', border: '#FDE68A', color: '#B45309' };
                  } else if (client.triggerStatus === 'EXPIRED') {
                    reasonBadge = { label: 'اشتراك منتهي', bg: '#FEF2F2', border: '#FECACA', color: '#DC2626' };
                  } else if (client.triggerStatus === 'FROZEN') {
                    reasonBadge = { label: 'اشتراك مجمد', bg: '#FFFBEB', border: '#FDE68A', color: '#D97706' };
                  }

                  return (
                    <div
                      key={client.id}
                      onClick={() => {
                        setSelectedClientId(client.id);
                        setActiveTemplateKey(client.defaultCat);
                      }}
                      style={{
                        padding: '12px 14px',
                        borderBottom: '1px solid #F1F5F9',
                        background: isSelected ? '#F8FAFC' : '#FFFFFF',
                        borderRight: isSelected ? '3px solid #673DE6' : '3px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      {/* Bio & Blueprint Snippet */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <ClientCodeBadge code={client.client_code || client.id} item={client} size="md" />

                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '12.5px', color: '#0F172A', whiteSpace: 'nowrap' }}>
                              {client.full_name || client.name}
                            </strong>
                            <ClientPackageBadge item={client} size="xs" />
                            {clientHasInjuries && (
                              <span 
                                style={{
                                  fontSize: '9.5px',
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: '6px',
                                  background: '#FEF2F2',
                                  border: '1px solid #FECACA',
                                  color: '#DC2626',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                                title="تنبيه طبي: المشترك لديه إصابة مسجلة"
                              >
                                <ShieldAlert size={10} />
                                <span>إصابة</span>
                              </span>
                            )}
                          </div>
                          
                          {/* Training, Nutrition & Cardio Badges */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '10px', color: '#475569', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1px 6px', borderRadius: '6px' }}>
                              {plan.trainingSplit} ({plan.trainingDays}d)
                            </span>
                            <span style={{ fontSize: '10px', color: '#0284C7', background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '1px 6px', borderRadius: '6px' }}>
                              {plan.nutritionCalories} سعرة ({plan.nutritionProtein}g بروتين)
                            </span>
                            <span style={{ fontSize: '10px', color: '#D97706', background: '#FFFBEB', border: '1px solid #FDE68A', padding: '1px 6px', borderRadius: '6px' }}>
                              {plan.cardioSessions} جلسات كارديو
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Reason Badge & Status */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: reasonBadge.bg,
                          border: `1px solid ${reasonBadge.border}`,
                          color: reasonBadge.color,
                          whiteSpace: 'nowrap'
                        }}>
                          {reasonBadge.label}
                        </span>

                        {isDispatched && (
                          <span style={{ fontSize: '9.5px', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 size={10} />
                            <span>أُرسلت {dispatchedMap[client.id]}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* LEFT COLUMN: 360 Blueprint Card & Interactive Message Studio */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #EAECF0',
            borderRadius: '14px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            position: 'sticky',
            top: '80px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)'
          }}>
            {/* Header: Recipient & Stepper */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '14px', color: '#0F172A' }}>
                    معاينة ومحرر رسالة الواتساب
                  </strong>
                  <ClientPackageBadge item={activeClient} size="xs" />
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>المستلم:</span>
                  {activeClient && (
                    <ClientCodeBadge code={activeClient.client_code || activeClient.id} item={activeClient} size="xs" />
                  )}
                  <strong style={{ color: '#0F172A' }}>{activeClient ? (activeClient.full_name || activeClient.name) : 'لا يوجد مشترك محدد'}</strong>
                  <span style={{ color: '#94A3B8' }}>•</span>
                  <span style={{ fontFamily: 'JetBrains Mono', color: '#475569' }}>{activeClient?.phone_number}</span>
                </div>
              </div>

              {/* Client Quick Stepper */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  onClick={handlePrevClient}
                  disabled={filteredClients.length <= 1}
                  title="المشترك السابق (اختصار: [ أو Alt+Up)"
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    background: '#F8FAFC',
                    cursor: filteredClients.length <= 1 ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: filteredClients.length <= 1 ? '#94A3B8' : '#334155',
                    transition: 'all 0.12s ease'
                  }}
                >
                  <ChevronRight size={13} />
                  <span>السابق</span>
                </button>

                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#475569',
                  fontFamily: 'JetBrains Mono, monospace',
                  padding: '0 4px',
                  minWidth: '42px',
                  textAlign: 'center'
                }}>
                  {filteredClients.length > 0 && activeIndex >= 0 ? `${activeIndex + 1} / ${filteredClients.length}` : '0 / 0'}
                </span>

                <button
                  type="button"
                  onClick={handleNextClient}
                  disabled={filteredClients.length <= 1}
                  title="المشترك التالي (اختصار: ] أو Alt+Down)"
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    background: '#F8FAFC',
                    cursor: filteredClients.length <= 1 ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: filteredClients.length <= 1 ? '#94A3B8' : '#334155',
                    transition: 'all 0.12s ease'
                  }}
                >
                  <span>التالي</span>
                  <ChevronLeft size={13} />
                </button>
              </div>
            </div>

            {/* Client 360 Blueprint Card (التدريب، التغذية، الكارديو) */}
            {activeClient && (
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={13} color="#673DE6" />
                    <strong style={{ fontSize: '11.5px', color: '#0F172A' }}>
                      ملخص الخطة الفعالة: {activePlan.cleanGoal}
                    </strong>
                  </div>
                  {hasInjuries && (
                    <span style={{ fontSize: '10px', color: '#DC2626', fontWeight: 700, background: '#FEF2F2', padding: '1px 6px', borderRadius: '6px', border: '1px solid #FECACA', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <ShieldAlert size={10} />
                      <span>حالة طبية مسجلة</span>
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {/* Pillar 1: Training */}
                  <div style={{ background: '#FFFFFF', border: '1px solid #EAECF0', borderRadius: '8px', padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B', fontSize: '10px', fontWeight: 700, marginBottom: '2px' }}>
                      <Dumbbell size={11} color="#673DE6" />
                      <span>التدريب</span>
                    </div>
                    <strong style={{ fontSize: '11px', color: '#0F172A', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={activePlan.trainingSplit}>
                      {activePlan.trainingSplit}
                    </strong>
                    <span style={{ fontSize: '10px', color: '#64748B' }}>
                      {activePlan.trainingDays} أيام / أسبوع
                    </span>
                  </div>

                  {/* Pillar 2: Nutrition */}
                  <div style={{ background: '#FFFFFF', border: '1px solid #EAECF0', borderRadius: '8px', padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B', fontSize: '10px', fontWeight: 700, marginBottom: '2px' }}>
                      <Utensils size={11} color="#0284C7" />
                      <span>التغذية</span>
                    </div>
                    <strong style={{ fontSize: '11px', color: '#0F172A', display: 'block' }}>
                      {activePlan.nutritionCalories} سعرة
                    </strong>
                    <span style={{ fontSize: '10px', color: '#0284C7', fontWeight: 700 }}>
                      {activePlan.nutritionProtein}g بروتين ({activePlan.nutritionCarbs}g C / {activePlan.nutritionFat}g F)
                    </span>
                  </div>

                  {/* Pillar 3: Cardio */}
                  <div style={{ background: '#FFFFFF', border: '1px solid #EAECF0', borderRadius: '8px', padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B', fontSize: '10px', fontWeight: 700, marginBottom: '2px' }}>
                      <Flame size={11} color="#D97706" />
                      <span>الكارديو والنشاط</span>
                    </div>
                    <strong style={{ fontSize: '11px', color: '#0F172A', display: 'block' }}>
                      {activePlan.cardioSessions} جلسات / أسبوع
                    </strong>
                    <span style={{ fontSize: '10px', color: '#64748B' }}>
                      {activePlan.cardioSteps}
                    </span>
                  </div>
                </div>

                {/* Quick Action Links Strip */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingTop: '4px', borderTop: '1px dashed #E2E8F0' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>روابط سريعة:</span>
                  
                  <a
                    href={`/coach/editor/${activeClient.client_code || activeClient.id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#0284C7',
                      textDecoration: 'none',
                      background: '#FFFFFF',
                      border: '1px solid #BAE6FD',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Dumbbell size={10} />
                    <span>محرر الخطة</span>
                    <ExternalLink size={9} />
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      const origin = getAppOrigin();
                      navigator.clipboard.writeText(buildClientLinks(activeClient?.client_code, origin).checkin_url);
                      showToast('تم نسخ رابط الشيك إن بنجاح');
                    }}
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#475569',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Link size={10} />
                    <span>نسخ رابط الشيك إن</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const origin = getAppOrigin();
                      navigator.clipboard.writeText(buildClientLinks(activeClient?.client_code, origin).app_url);
                      showToast('تم نسخ رابط التطبيق بنجاح');
                    }}
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#475569',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Smartphone size={10} />
                    <span>رابط التطبيق</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const origin = getAppOrigin();
                      navigator.clipboard.writeText(buildClientLinks(activeClient?.client_code, origin).renewal_url);
                      showToast('تم نسخ رابط التجديد بنجاح');
                    }}
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#475569',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Sparkles size={10} />
                    <span>رابط التجديد</span>
                  </button>
                </div>
              </div>
            )}

            {/* Template Selector with Group Tabs */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>
                  نماذج الرسائل المتخصصة:
                </label>
                <span style={{ fontSize: '10px', color: '#94A3B8' }}>
                  {filteredTemplates.length} نماذج متاحة
                </span>
              </div>

              {/* Group Tabs */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {TEMPLATE_GROUPS.map(g => {
                  const isSel = activeGroup === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setActiveGroup(g.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '10.5px',
                        fontWeight: isSel ? 800 : 600,
                        border: isSel ? '1px solid #673DE6' : '1px solid #E2E8F0',
                        background: isSel ? '#F4F0FD' : '#FFFFFF',
                        color: isSel ? '#673DE6' : '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>

              {/* Template Pills Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '6px', maxHeight: '140px', overflowY: 'auto', padding: '2px' }}>
                {filteredTemplates.map(tpl => {
                  const isSel = activeTemplateKey === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => setActiveTemplateKey(tpl.id)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: isSel ? '1.5px solid #0F172A' : '1px solid #E2E8F0',
                        background: isSel ? '#0F172A' : '#FFFFFF',
                        color: isSel ? '#FFFFFF' : '#334155',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          background: isSel ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                          color: isSel ? '#FFFFFF' : '#64748B'
                        }}>
                          {tpl.category_label}
                        </span>
                        {isSel && <Check size={12} color="#FFFFFF" />}
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: isSel ? 700 : 600, lineHeight: '1.3' }}>
                        {tpl.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Variable Insert Chips */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B' }}>
                  إدراج سريع للمتغيرات في الرسالة:
                </span>
                <span style={{ fontSize: '9.5px', color: '#94A3B8' }}>
                  انقر للإدراج في موضع المؤشر
                </span>
              </div>

              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {[
                  { label: 'الاسم', val: activeClient?.full_name || 'عزيزي المشترك' },
                  { label: `السعرات (${activePlan.nutritionCalories})`, val: `${activePlan.nutritionCalories} سعرة` },
                  { label: `البروتين (${activePlan.nutritionProtein}g)`, val: `${activePlan.nutritionProtein}g بروتين` },
                  { label: `التقسيم (${activePlan.trainingSplit})`, val: activePlan.trainingSplit },
                  { label: `أيام التمرين (${activePlan.trainingDays}d)`, val: `${activePlan.trainingDays} أيام` },
                  { label: `الكارديو (${activePlan.cardioSessions} جلسات)`, val: `${activePlan.cardioSessions} جلسات أسبوعياً` },
                  { label: 'رابط الشيك إن', val: buildClientLinks(activeClient?.client_code, getAppOrigin()).checkin_url },
                  { label: 'رابط التطبيق', val: buildClientLinks(activeClient?.client_code, getAppOrigin()).app_url },
                  { label: 'رابط التجديد', val: buildClientLinks(activeClient?.client_code, getAppOrigin()).renewal_url }
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleInsertVariable(chip.val)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      background: '#F8FAFC',
                      color: '#334155',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      transition: 'all 0.12s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#FFFFFF';
                      e.currentTarget.style.borderColor = '#673DE6';
                      e.currentTarget.style.color = '#673DE6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#F8FAFC';
                      e.currentTarget.style.borderColor = '#CBD5E1';
                      e.currentTarget.style.color = '#334155';
                    }}
                  >
                    <span>+</span>
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Message Body Textarea */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>
                  نص الرسالة المرسلة:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleResetToTemplate}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#64748B',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                    title="استرجاع النص القياسي للقالب المحدد"
                  >
                    <RotateCcw size={11} />
                    <span>إعادة ضبط للقالب</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyMessage(customMessage)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#0284C7',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    <Copy size={11} />
                    <span>نسخ النص</span>
                  </button>
                </div>
              </div>

              <textarea
                ref={textareaRef}
                rows={8}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '1.5px solid #CBD5E1',
                  padding: '12px 14px',
                  fontSize: '12px',
                  fontFamily: 'Cairo, sans-serif',
                  lineHeight: '1.65',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  transition: 'border-color 0.15s ease'
                }}
                onFocus={(e) => (e.target.style.borderColor = '#673DE6')}
                onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
              />
              <span style={{ fontSize: '10px', color: '#94A3B8', marginTop: '3px', display: 'block' }}>
                عدد الأحرف: {customMessage.length} • تم تعبئة وتحديث المتغيرات والروابط التلقائية
              </span>
            </div>

            {/* Main Action WhatsApp Dispatch Button */}
            <button
              type="button"
              onClick={() => handleSendWhatsApp(activeClient, customMessage)}
              style={{
                width: '100%',
                padding: '12px 18px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #25D366 0%, #1EBE5D 100%)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              <Send size={15} />
              <span>إرسال فوري إلى ({activeClient?.full_name || activeClient?.name}) عبر واتساب</span>
            </button>

            {/* Keyboard Shortcuts Helper Strip */}
            <div style={{
              background: '#F8FAFC',
              border: '1px dashed #CBD5E1',
              borderRadius: '10px',
              padding: '6px 12px',
              fontSize: '10px',
              color: '#64748B',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              flexWrap: 'wrap'
            }}>
              <span><strong>[</strong> المشترك السابق</span>
              <span style={{ color: '#D0D5DD' }}>|</span>
              <span><strong>]</strong> المشترك التالي</span>
              <span style={{ color: '#D0D5DD' }}>|</span>
              <span><strong>Ctrl+Enter</strong> إرسال واتساب</span>
              <span style={{ color: '#D0D5DD' }}>|</span>
              <span><strong>Alt+C</strong> نسخ النص</span>
            </div>
          </div>

        </div>

        {/* Floating Confirmation Toast */}
        {toast && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#673DE6',
            color: '#FFFFFF',
            padding: '8px 18px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 700,
            zIndex: 99999,
            boxShadow: '0 4px 16px rgba(103, 61, 230, 0.35)'
          }}>
            {toast}
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
