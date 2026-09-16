import { API_BASE } from '../config/api';
import { getClientTier, getTierColors, ClientCodeBadge, ClientPackageBadge } from '../utils/tierBadgeHelper';
import React, { useState, useMemo } from 'react';
import { Send, MessageSquare, Clock, CheckCircle2, AlertCircle, Copy, Search, RotateCw, ExternalLink, Smartphone, ShieldAlert, Filter, Check, Zap, Flame, CreditCard, UserCheck, Bell, Edit3, ChevronDown, ChevronRight, ChevronLeft, Dumbbell, Link } from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import { REMINDER_CATEGORIES, MESSAGE_TEMPLATES, compileReminderMessage, generateWhatsAppUrl, formatWhatsAppPhone } from '../utils/whatsappRemindersEngine';
import { arabicSearchMatch } from '../utils/searchUtils';

export default function WhatsAppRemindersHub() {
  const [selectedCategory, setSelectedCategory] = useState('ALL'); // 'ALL' | REMINDER_CATEGORIES keys
  const [selectedTier, setSelectedTier] = useState('ALL'); // 'ALL' | 'MAX' | 'ELITE'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(1);
  const [activeTemplateKey, setActiveTemplateKey] = useState(REMINDER_CATEGORIES.CHECKIN_DUE);
  const [customMessage, setCustomMessage] = useState('');
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [dispatchedMap, setDispatchedMap] = useState({});

  // Live Clients API
  const [clientsData, setClientsData] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/v1/subscriptions/overview`);
        if (res.ok) {
          const data = await res.json();
          if (data.clients) {
            const enriched = data.clients.map((client) => {
              const isMax = getClientTier(client) === 'MAX';
              const checkinInterval = isMax ? 7 : 14;
              let defaultCat = REMINDER_CATEGORIES.MOTIVATION;
              let daysLeft = client.days_remaining || 0;
              let lastCheckinDays = 0;
              let triggerStatus = 'NORMAL';

              if (client.checkinSubmissions && client.checkinSubmissions.length > 0) {
                const latestCheckin = client.checkinSubmissions[0];
                const checkinDate = new Date(latestCheckin.createdAt || latestCheckin.created_at || Date.now());
                lastCheckinDays = Math.max(0, Math.round((Date.now() - checkinDate.getTime()) / (1000 * 60 * 60 * 24)));
              } else if (client.createdAt) {
                const joinDate = new Date(client.createdAt);
                lastCheckinDays = Math.max(0, Math.round((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24)));
              }

              if (client.status === 'FROZEN') {
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
              }

              return {
                ...client,
                isMax,
                pkgLabel: isMax ? 'MAX' : 'ELITE',
                defaultCat,
                triggerStatus,
                daysLeft,
                lastCheckinDays
              };
            });
            setClientsData(enriched);
            if (enriched.length > 0) {
               setSelectedClientId(enriched[0].client_code || enriched[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch clients:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const filteredClients = useMemo(() => {
    return clientsData.filter(c => {
      // Search
      const q = searchQuery.trim();
      const qClean = q.toLowerCase().replace(/^#+/, '');
      const matchSearch = !qClean || 
        String(c.client_code || c.id).includes(qClean) ||
        arabicSearchMatch(c.full_name || c.name, q) ||
        (c.phone_number || '').includes(qClean);

      if (!matchSearch) return false;

      // Tier
      if (selectedTier === 'MAX' && !c.isMax) return false;
      if (selectedTier === 'ELITE' && c.isMax) return false;

      // Category
      if (selectedCategory !== 'ALL') {
        if (selectedCategory === REMINDER_CATEGORIES.CHECKIN_DUE && c.defaultCat !== REMINDER_CATEGORIES.CHECKIN_DUE) return false;
        if (selectedCategory === REMINDER_CATEGORIES.CHECKIN_OVERDUE && c.defaultCat !== REMINDER_CATEGORIES.CHECKIN_OVERDUE) return false;
        if (selectedCategory === REMINDER_CATEGORIES.RENEWAL_UPCOMING && c.defaultCat !== REMINDER_CATEGORIES.RENEWAL_UPCOMING) return false;
        if (selectedCategory === REMINDER_CATEGORIES.PLAN_PUBLISHED && c.defaultCat !== REMINDER_CATEGORIES.PLAN_PUBLISHED) return false;
        if (selectedCategory === REMINDER_CATEGORIES.MOTIVATION && c.defaultCat !== REMINDER_CATEGORIES.MOTIVATION) return false;
      }

      return true;
    });
  }, [clientsData, searchQuery, selectedTier, selectedCategory]);

  const activeClient = useMemo(() => {
    return clientsData.find(c => (c.client_code || c.id) == selectedClientId) || clientsData[0];
  }, [clientsData, selectedClientId]);

  const activeIndex = useMemo(() => {
    if (!activeClient || filteredClients.length === 0) return -1;
    return filteredClients.findIndex(c => (c.client_code || c.id) === (activeClient.client_code || activeClient.id));
  }, [filteredClients, activeClient]);

  const handlePrevClient = React.useCallback(() => {
    if (filteredClients.length === 0) return;
    const currentIdx = filteredClients.findIndex(c => (c.client_code || c.id) === (activeClient?.client_code || activeClient?.id));
    const nextIdx = currentIdx > 0 ? currentIdx - 1 : filteredClients.length - 1;
    const target = filteredClients[nextIdx];
    if (target) {
      setSelectedClientId(target.client_code || target.id);
      setActiveTemplateKey(target.defaultCat);
    }
  }, [filteredClients, activeClient]);

  const handleNextClient = React.useCallback(() => {
    if (filteredClients.length === 0) return;
    const currentIdx = filteredClients.findIndex(c => (c.client_code || c.id) === (activeClient?.client_code || activeClient?.id));
    const nextIdx = currentIdx < filteredClients.length - 1 ? currentIdx + 1 : 0;
    const target = filteredClients[nextIdx];
    if (target) {
      setSelectedClientId(target.client_code || target.id);
      setActiveTemplateKey(target.defaultCat);
    }
  }, [filteredClients, activeClient]);

  const getAppOrigin = () => {
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      return window.location.origin;
    }
    return '';
  };

  // Sync message when active client or template changes
  React.useEffect(() => {
    if (activeClient) {
      const origin = getAppOrigin();
      const tpl = MESSAGE_TEMPLATES[activeTemplateKey]?.template || '';
      const compiled = compileReminderMessage(tpl, {
        client_name: activeClient.full_name || activeClient.name || 'عزيزي المشترك',
        package_name: activeClient.pkgLabel === 'MAX' ? 'باقة MAX' : 'باقة إليت (ELITE)',
        days_left: activeClient.daysLeft || 3,
        checkin_url: `${origin}/app/checkin`,
        app_url: `${origin}/app`,
        renewal_url: `${origin}/app/renew`
      });
      setCustomMessage(compiled);
      setIsEditingTemplate(false);
    }
  }, [activeClient, activeTemplateKey]);

  // Global Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInput = activeTag === 'input' || activeTag === 'textarea';

      // Alt + ArrowUp or [ => Prev Client
      if (!isInput && (e.key === '[' || (e.altKey && e.key === 'ArrowUp'))) {
        e.preventDefault();
        handlePrevClient();
      }
      // Alt + ArrowDown or ] => Next Client
      else if (!isInput && (e.key === ']' || (e.altKey && e.key === 'ArrowDown'))) {
        e.preventDefault();
        handleNextClient();
      }
      // Ctrl + Enter or Alt + W => Dispatch WhatsApp
      else if ((e.ctrlKey && e.key === 'Enter') || (e.altKey && (e.key === 'w' || e.key === 'W' || e.key === 'ص'))) {
        e.preventDefault();
        if (activeClient) {
          handleSendWhatsApp(activeClient, customMessage);
        }
      }
      // Alt + C => Copy Message
      else if (!isInput && e.altKey && (e.key === 'c' || e.key === 'C' || e.key === 'ؤ')) {
        e.preventDefault();
        handleCopyMessage(customMessage);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevClient, handleNextClient, activeClient, customMessage]);

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

  const handleSendWhatsApp = (client, msgText) => {
    const textToSend = msgText || customMessage;
    const phone = client?.phone_number || activeClient?.phone_number;
    const url = generateWhatsAppUrl(phone, textToSend);
    
    // Mark as dispatched
    setDispatchedMap(prev => ({
      ...prev,
      [client?.id || activeClient?.id]: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    }));

    showToast(`جاري فتح واتساب لإرسال الرسالة إلى ${client?.full_name || activeClient?.full_name}...`);
    window.open(url, '_blank');
  };

  // Stats Counters
  const dueCheckinsCount = clientsData.filter(c => c.defaultCat === REMINDER_CATEGORIES.CHECKIN_DUE).length;
  const overdueCheckinsCount = clientsData.filter(c => c.defaultCat === REMINDER_CATEGORIES.CHECKIN_OVERDUE).length;
  const renewalsCount = clientsData.filter(c => c.defaultCat === REMINDER_CATEGORIES.RENEWAL_UPCOMING).length;
  const dispatchedCount = Object.keys(dispatchedMap).length;

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
        
        {/* 1. Header Banner & Live Stats */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: '#0284C7', color: '#FFFFFF', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={17} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                  مركز تذكيرات ومتابعات الواتساب الذكي
                </h2>
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  إدارة رسائل الشيك إن الأسبوعي، تذكيرات التجديد، والمتابعة اليومية بنقرة زر واحدة عبر WhatsApp
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Strip (Interactive Filters) */}
          {/* Quick Metrics Strip (Interactive Filters) */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div 
              onClick={() => setSelectedCategory(selectedCategory === REMINDER_CATEGORIES.CHECKIN_DUE ? 'ALL' : REMINDER_CATEGORIES.CHECKIN_DUE)}
              style={{ 
                background: selectedCategory === REMINDER_CATEGORIES.CHECKIN_DUE ? '#E0F2FE' : '#F0F9FF', 
                border: selectedCategory === REMINDER_CATEGORIES.CHECKIN_DUE ? '1.5px solid #0284C7' : '1px solid #BAE6FD', 
                padding: '6px 12px', 
                borderRadius: '8px', 
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.12s ease'
              }}
              title="انقر لفلترة التقييمات المستحقة"
            >
              <span style={{ fontSize: '10px', color: '#0284C7', fontWeight: 700, display: 'block' }}>شيك إن مستحق</span>
              <strong style={{ fontSize: '14px', color: '#0369A1', fontFamily: 'JetBrains Mono' }}>{dueCheckinsCount}</strong>
            </div>

            <div 
              onClick={() => setSelectedCategory(selectedCategory === REMINDER_CATEGORIES.CHECKIN_OVERDUE ? 'ALL' : REMINDER_CATEGORIES.CHECKIN_OVERDUE)}
              style={{ 
                background: selectedCategory === REMINDER_CATEGORIES.CHECKIN_OVERDUE ? '#FEE2E2' : '#FEF2F2', 
                border: selectedCategory === REMINDER_CATEGORIES.CHECKIN_OVERDUE ? '1.5px solid #DC2626' : '1px solid #FECACA', 
                padding: '6px 12px', 
                borderRadius: '8px', 
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.12s ease'
              }}
              title="انقر لفلترة التقييمات المتأخرة"
            >
              <span style={{ fontSize: '10px', color: '#DC2626', fontWeight: 700, display: 'block' }}>تقييم متأخر</span>
              <strong style={{ fontSize: '14px', color: '#991B1B', fontFamily: 'JetBrains Mono' }}>{overdueCheckinsCount}</strong>
            </div>

            <div 
              onClick={() => setSelectedCategory(selectedCategory === REMINDER_CATEGORIES.RENEWAL_UPCOMING ? 'ALL' : REMINDER_CATEGORIES.RENEWAL_UPCOMING)}
              style={{ 
                background: selectedCategory === REMINDER_CATEGORIES.RENEWAL_UPCOMING ? '#FEF3C7' : '#FFFBEB', 
                border: selectedCategory === REMINDER_CATEGORIES.RENEWAL_UPCOMING ? '1.5px solid #B45309' : '1px solid #FDE68A', 
                padding: '6px 12px', 
                borderRadius: '8px', 
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.12s ease'
              }}
              title="انقر لفلترة التجديدات القريبة"
            >
              <span style={{ fontSize: '10px', color: '#B45309', fontWeight: 700, display: 'block' }}>تجديد قريب</span>
              <strong style={{ fontSize: '14px', color: '#92400E', fontFamily: 'JetBrains Mono' }}>{renewalsCount}</strong>
            </div>

            <div 
              onClick={() => setSelectedCategory('ALL')}
              style={{ 
                background: selectedCategory === 'ALL' ? '#D1FAE5' : '#ECFDF5', 
                border: selectedCategory === 'ALL' ? '1.5px solid #059669' : '1px solid #A7F3D0', 
                padding: '6px 12px', 
                borderRadius: '8px', 
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.12s ease'
              }}
              title="انقر لعرض كافة التنبيهات"
            >
              <span style={{ fontSize: '10px', color: '#059669', fontWeight: 700, display: 'block' }}>تم إرسالها اليوم</span>
              <strong style={{ fontSize: '14px', color: '#065F46', fontFamily: 'JetBrains Mono' }}>{dispatchedCount}</strong>
            </div>
          </div>
        </div>

        {/* 2. Operational Filter Bar */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'كافة التنبيهات', count: clientsData.length },
              { id: REMINDER_CATEGORIES.CHECKIN_DUE, label: 'تذكير التقييم', count: dueCheckinsCount },
              { id: REMINDER_CATEGORIES.CHECKIN_OVERDUE, label: 'تأخر التقييم', count: overdueCheckinsCount },
              { id: REMINDER_CATEGORIES.RENEWAL_UPCOMING, label: 'تجديد الاشتراك', count: renewalsCount },
              { id: REMINDER_CATEGORIES.PLAN_PUBLISHED, label: 'جاهزية الخطة' },
              { id: REMINDER_CATEGORIES.MOTIVATION, label: 'تشجيع وتحفيز' }
            ].map(cat => {
              const isSel = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: isSel ? 800 : 600,
                    border: isSel ? '1px solid #0F172A' : '1px solid #E2E8F0',
                    background: isSel ? '#0F172A' : '#F8FAFC',
                    color: isSel ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: isSel ? '0 1px 3px rgba(15, 23, 42, 0.15)' : 'none',
                    transition: 'all 0.12s ease'
                  }}
                >
                  <span>{cat.label}</span>
                  {cat.count !== undefined && (
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      padding: '0 5px',
                      borderRadius: '8px',
                      background: isSel ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                      color: isSel ? '#FFFFFF' : '#0F172A'
                    }}>
                      {cat.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tier Tabs & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', padding: '2px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
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
                      padding: '3px 9px',
                      borderRadius: '6px',
                      fontSize: '10.5px',
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

            <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0 8px', height: '30px', width: '180px', gap: '5px' }}>
              <Search size={13} color="#94A3B8" />
              <input
                type="text"
                placeholder="بحث باسم أو رقم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: '11px', outline: 'none', width: '100%' }}
              />
            </div>
          </div>
        </div>

        {/* 3. Master-Detail Two-Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) 1fr', gap: '16px', alignItems: 'start' }}>
          
          {/* RIGHT COLUMN: Table of Actionable Clients */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)'
          }}>
            <div style={{ padding: '10px 14px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '12.5px', color: '#0F172A' }}>
                قائمة المشتركين ومستحقات المتابعة ({filteredClients.length})
              </strong>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                انقر على أي مشترك لمعاينة وتعديل رسالته
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '640px', overflowY: 'auto' }}>
              {filteredClients.length === 0 ? (
                <div style={{ padding: '40px 10px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>
                  لا توجد تنبيهات مطابقة للفلتر المحدد
                </div>
              ) : (
                filteredClients.map((client) => {
                  const isSelected = activeClient?.id === client.id;
                  const isDispatched = !!dispatchedMap[client.id];
                  const hasInjuries = Boolean(
                    (Array.isArray(client.injuries) && client.injuries.some(i => i && i !== 'none')) ||
                    (typeof client.injuries === 'string' && client.injuries.trim() && client.injuries !== 'none') ||
                    (client.intakeSubmissions?.[0]?.answers?.injuries_map?.has_injuries) ||
                    (client.answers?.injuries_map?.has_injuries)
                  );

                  // Badge config
                  let reasonBadge = { label: 'شيك إن مستحق', bg: '#F0F9FF', border: '#BAE6FD', color: '#0284C7' };
                  if (client.triggerStatus === 'CHECKIN_OVERDUE') {
                    reasonBadge = { label: `متأخر ${client.lastCheckinDays} أيام`, bg: '#FEF2F2', border: '#FECACA', color: '#DC2626' };
                  } else if (client.triggerStatus === 'EXPIRING_SOON') {
                    reasonBadge = { label: `تجديد خلال ${client.daysLeft} يوم`, bg: '#FFFBEB', border: '#FDE68A', color: '#B45309' };
                  } else if (client.triggerStatus === 'EXPIRED') {
                    reasonBadge = { label: 'اشتراك منتهي', bg: '#FEF2F2', border: '#FECACA', color: '#DC2626' };
                  } else if (client.triggerStatus === 'FROZEN') {
                    reasonBadge = { label: 'اشتراك مجمد', bg: '#FFFBEB', border: '#FDE68A', color: '#D97706' };
                  } else if (client.triggerStatus === 'PLAN_UPDATED') {
                    reasonBadge = { label: 'خطة جديدة جاهزة', bg: '#ECFDF5', border: '#A7F3D0', color: '#059669' };
                  }

                  return (
                    <div
                      key={client.id}
                      onClick={() => {
                        setSelectedClientId(client.id);
                        setActiveTemplateKey(client.defaultCat);
                      }}
                      style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid #F1F5F9',
                        background: isSelected ? '#F8FAFC' : '#FFFFFF',
                        borderRight: isSelected ? '3px solid #0F172A' : '3px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      {/* Client Bio */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ClientCodeBadge code={client.client_code || client.id} item={client} size="md" />

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong style={{ fontSize: '12px', color: '#0F172A' }}>
                              {client.full_name || client.name}
                            </strong>
                            <ClientPackageBadge item={client} size="xs" />
                            {hasInjuries && (
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
                          
                          <div style={{ fontSize: '10.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <span style={{ fontFamily: 'JetBrains Mono' }}>{client.phone_number}</span>
                            <span>•</span>
                            <span>{client.goal_label || 'خسارة دهون'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Reason & Action Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '6px',
                          background: reasonBadge.bg,
                          border: `1px solid ${reasonBadge.border}`,
                          color: reasonBadge.color
                        }}>
                          {reasonBadge.label}
                        </span>

                        {isDispatched && (
                          <span style={{ fontSize: '9.5px', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            <CheckCircle2 size={10} />
                            <span>أُرسلت {dispatchedMap[client.id]}</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const origin = getAppOrigin();
                            const tpl = MESSAGE_TEMPLATES[client.defaultCat]?.template || '';
                            const msg = compileReminderMessage(tpl, {
                              client_name: client.full_name || client.name || 'عزيزي المشترك',
                              package_name: client.pkgLabel === 'MAX' ? 'باقة MAX' : 'باقة إليت (ELITE)',
                              days_left: client.daysLeft || 3,
                              checkin_url: `${origin}/app/checkin`,
                              app_url: `${origin}/app`,
                              renewal_url: `${origin}/app/renew`
                            });
                            handleSendWhatsApp(client, msg);
                          }}
                          style={{
                            padding: '4px 9px',
                            borderRadius: '8px',
                            background: '#25D366',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 1px 2px rgba(37, 211, 102, 0.2)'
                          }}
                        >
                          <Send size={11} />
                          <span>إرسال</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* LEFT COLUMN: WhatsApp Interactive Message Studio & Live Customizer */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            position: 'sticky',
            top: '80px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)'
          }}>
            {/* Studio Header & Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '13.5px', color: '#0F172A' }}>
                    معاينة ومحرر رسالة الواتساب
                  </strong>
                  <ClientPackageBadge item={activeClient} size="xs" />
                </div>
                <span style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', display: 'block' }}>
                  المستلم: <strong style={{ color: '#0F172A' }}>{activeClient ? (activeClient.full_name || activeClient.name) : 'لا يوجد مشترك محدد'}</strong> {activeClient ? `(#${activeClient.client_code || activeClient.id})` : ''}
                </span>
              </div>

              {/* Client Quick Stepper */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  onClick={handlePrevClient}
                  disabled={filteredClients.length <= 1}
                  title="المشترك السابق (اختصار: [ أو Alt+Up)"
                  style={{
                    padding: '4px 8px',
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
                    padding: '4px 8px',
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

            {/* Quick Action Links Strip */}
            {activeClient && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexWrap: 'wrap',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '6px 10px'
              }}>
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B' }}>روابط سريعة:</span>
                
                <a
                  href={`/coach/editor/${activeClient.client_code || activeClient.id}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '10.5px',
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
                  <Dumbbell size={11} />
                  <span>محرر الخطة</span>
                  <ExternalLink size={10} />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    const origin = getAppOrigin();
                    navigator.clipboard.writeText(`${origin}/app/checkin`);
                    showToast('تم نسخ رابط الشيك إن للمشترك بنجاح');
                  }}
                  style={{
                    fontSize: '10.5px',
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
                  <Link size={11} />
                  <span>نسخ رابط الشيك إن</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const origin = getAppOrigin();
                    navigator.clipboard.writeText(`${origin}/app`);
                    showToast('تم نسخ رابط تطبيق المتدرب بنجاح');
                  }}
                  style={{
                    fontSize: '10.5px',
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
                  <Smartphone size={11} />
                  <span>رابط التطبيق</span>
                </button>
              </div>
            )}

            {/* Template Selector Custom Curved Dropdown */}
            <div style={{ position: 'relative' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '5px' }}>
                اختر نموذج الرسالة الجاهزة:
              </label>
              
              <button
                type="button"
                onClick={() => setIsTemplateDropdownOpen(prev => !prev)}
                style={{
                  width: '100%',
                  height: '36px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  padding: '0 12px',
                  fontSize: '12px',
                  fontFamily: 'Cairo, sans-serif',
                  background: '#F8FAFC',
                  color: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <span style={{ fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {MESSAGE_TEMPLATES[activeTemplateKey]?.title || 'اختر النموذج'}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '6px',
                    background: '#E2E8F0',
                    color: '#334155',
                    whiteSpace: 'nowrap'
                  }}>
                    {MESSAGE_TEMPLATES[activeTemplateKey]?.category_label || ''}
                  </span>
                </div>
                <ChevronDown size={15} color="#64748B" style={{ transform: isTemplateDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
              </button>

              {isTemplateDropdownOpen && (
                <>
                  <div
                    onClick={() => setIsTemplateDropdownOpen(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      right: 0,
                      left: 0,
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      zIndex: 50,
                      overflow: 'hidden',
                      padding: '4px'
                    }}
                  >
                    {Object.values(MESSAGE_TEMPLATES).map(tpl => {
                      const isSelected = activeTemplateKey === tpl.id;
                      return (
                        <div
                          key={tpl.id}
                          onClick={() => {
                            setActiveTemplateKey(tpl.id);
                            setIsTemplateDropdownOpen(false);
                          }}
                          style={{
                            padding: '9px 12px',
                            borderRadius: '8px',
                            background: isSelected ? '#F1F5F9' : 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            transition: 'background 0.12s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = '#F8FAFC';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <span style={{ fontSize: '11.5px', fontWeight: isSelected ? 800 : 600, color: isSelected ? '#0F172A' : '#334155' }}>
                            {tpl.title}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              fontSize: '9.5px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '6px',
                              background: isSelected ? '#0F172A' : '#E2E8F0',
                              color: isSelected ? '#FFFFFF' : '#475569'
                            }}>
                              {tpl.category_label}
                            </span>
                            {isSelected && <Check size={13} color="#0F172A" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Live Message Body Textarea */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>
                  نص الرسالة المرسلة:
                </label>
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

              <textarea
                rows={9}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  padding: '10px 12px',
                  fontSize: '11.5px',
                  fontFamily: 'Cairo, sans-serif',
                  lineHeight: '1.6',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  transition: 'border-color 0.15s ease'
                }}
              />
              <span style={{ fontSize: '10px', color: '#94A3B8', marginTop: '3px', display: 'block' }}>
                عدد الأحرف: {customMessage.length} • تم تعبئة المتغيرات والروابط التلقائية
              </span>
            </div>

            {/* Main Action WhatsApp Dispatch Button */}
            <button
              type="button"
              onClick={() => handleSendWhatsApp(activeClient, customMessage)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#25D366',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)',
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
              borderRadius: '8px',
              padding: '6px 10px',
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
              <span>•</span>
              <span><strong>]</strong> المشترك التالي</span>
              <span>•</span>
              <span><strong>Ctrl+Enter</strong> إرسال واتساب</span>
              <span>•</span>
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
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '8px 18px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 700,
            zIndex: 99999,
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)'
          }}>
            {toast}
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
