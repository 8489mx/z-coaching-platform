import { API_BASE } from '../config/api';
import { getClientTier, getTierColors, ClientCodeBadge, ClientPackageBadge } from '../utils/tierBadgeHelper';
import React, { useState, useMemo } from 'react';
import { Send, MessageSquare, Clock, CheckCircle2, AlertCircle, Copy, Search, RotateCw, ExternalLink, Smartphone, ShieldAlert, Filter, Check, Zap, Flame, CreditCard, UserCheck, Bell, Edit3 } from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import { REMINDER_CATEGORIES, MESSAGE_TEMPLATES, compileReminderMessage, generateWhatsAppUrl, formatWhatsAppPhone } from '../utils/whatsappRemindersEngine';

export default function WhatsAppRemindersHub() {
  const [selectedCategory, setSelectedCategory] = useState('ALL'); // 'ALL' | REMINDER_CATEGORIES keys
  const [selectedTier, setSelectedTier] = useState('ALL'); // 'ALL' | 'MAX' | 'ELITE'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(1);
  const [activeTemplateKey, setActiveTemplateKey] = useState(REMINDER_CATEGORIES.CHECKIN_DUE);
  const [customMessage, setCustomMessage] = useState('');
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
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
            const enriched = data.clients.map((client, idx) => {
              let defaultCat = REMINDER_CATEGORIES.MOTIVATION;
              let daysLeft = client.days_remaining || 0;
              let lastCheckinDays = 0;
              let triggerStatus = 'NORMAL';

              if (client.status === 'EXPIRING_SOON') {
                defaultCat = REMINDER_CATEGORIES.RENEWAL_UPCOMING;
                triggerStatus = 'EXPIRING_SOON';
              } else if (client.status === 'EXPIRED') {
                 defaultCat = REMINDER_CATEGORIES.RENEWAL_UPCOMING;
                 triggerStatus = 'EXPIRED';
              } else if (idx % 3 === 0) {
                 defaultCat = REMINDER_CATEGORIES.CHECKIN_OVERDUE;
                 triggerStatus = 'CHECKIN_OVERDUE';
                 lastCheckinDays = 8;
              }

              const isMax = getClientTier(client) === 'MAX';

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
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        String(c.client_code || c.id).includes(q) ||
        (c.full_name || c.name || '').toLowerCase().includes(q) ||
        (c.phone_number || '').includes(q);

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

  // Sync message when active client or template changes
  React.useEffect(() => {
    if (activeClient) {
      const tpl = MESSAGE_TEMPLATES[activeTemplateKey]?.template || '';
      const compiled = compileReminderMessage(tpl, {
        client_name: activeClient.full_name || activeClient.name,
        package_name: activeClient.pkgLabel === 'MAX' ? 'باقة MAX' : 'باقة إليت (ELITE)',
        days_left: activeClient.daysLeft || 3
      });
      setCustomMessage(compiled);
      setIsEditingTemplate(false);
    }
  }, [activeClient, activeTemplateKey]);

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
          borderRadius: '10px',
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
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div 
              onClick={() => setSelectedCategory(selectedCategory === REMINDER_CATEGORIES.CHECKIN_DUE ? 'ALL' : REMINDER_CATEGORIES.CHECKIN_DUE)}
              style={{ 
                background: selectedCategory === REMINDER_CATEGORIES.CHECKIN_DUE ? '#E0F2FE' : '#F0F9FF', 
                border: selectedCategory === REMINDER_CATEGORIES.CHECKIN_DUE ? '1.5px solid #0284C7' : '1px solid #BAE6FD', 
                padding: '6px 12px', 
                borderRadius: '6px', 
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
                borderRadius: '6px', 
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
                borderRadius: '6px', 
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
                borderRadius: '6px', 
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
          borderRadius: '8px',
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
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
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: isSel ? 800 : 600,
                    border: isSel ? '1px solid #0F172A' : '1px solid #E2E8F0',
                    background: isSel ? '#0F172A' : '#F8FAFC',
                    color: isSel ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.12s ease'
                  }}
                >
                  <span>{cat.label}</span>
                  {cat.count !== undefined && (
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      padding: '0 4px',
                      borderRadius: '6px',
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
            <div style={{ display: 'flex', gap: '3px' }}>
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
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      fontFamily: t.id !== 'ALL' ? 'JetBrains Mono, sans-serif' : 'inherit',
                      border: isSel ? '1px solid #0F172A' : '1px solid #E2E8F0',
                      background: isSel ? '#0F172A' : '#F8FAFC',
                      color: isSel ? '#FFFFFF' : (t.id === 'MAX' ? '#B45309' : t.id === 'ELITE' ? '#0284C7' : '#64748B'),
                      cursor: 'pointer'
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '5px', padding: '0 8px', height: '28px', width: '170px', gap: '4px' }}>
              <Search size={12} color="#94A3B8" />
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
            borderRadius: '10px',
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

                  // Badge config
                  let reasonBadge = { label: 'شيك إن مستحق', bg: '#F0F9FF', border: '#BAE6FD', color: '#0284C7' };
                  if (client.triggerStatus === 'CHECKIN_OVERDUE') {
                    reasonBadge = { label: `متأخر ${client.lastCheckinDays} أيام`, bg: '#FEF2F2', border: '#FECACA', color: '#DC2626' };
                  } else if (client.triggerStatus === 'EXPIRING_SOON') {
                    reasonBadge = { label: `تجديد خلال ${client.daysLeft} يوم`, bg: '#FFFBEB', border: '#FDE68A', color: '#B45309' };
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
                            <span style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              fontFamily: 'JetBrains Mono, sans-serif',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              background: client.isMax ? '#FFFBEB' : '#F0F9FF',
                              border: client.isMax ? '1px solid #FDE68A' : '1px solid #BAE6FD',
                              color: client.isMax ? '#B45309' : '#0284C7'
                            }}>
                              {client.pkgLabel}
                            </span>
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
                          borderRadius: '4px',
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
                            const tpl = MESSAGE_TEMPLATES[client.defaultCat]?.template || '';
                            const msg = compileReminderMessage(tpl, {
                              client_name: client.full_name || client.name,
                              package_name: client.pkgLabel === 'MAX' ? 'باقة MAX' : 'باقة إليت (ELITE)',
                              days_left: client.daysLeft || 3
                            });
                            handleSendWhatsApp(client, msg);
                          }}
                          style={{
                            padding: '4px 9px',
                            borderRadius: '4px',
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
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            position: 'sticky',
            top: '80px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)'
          }}>
            {/* Studio Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
              <div>
                <strong style={{ fontSize: '13.5px', color: '#0F172A', display: 'block' }}>
                  معاينة ومحرر رسالة الواتساب
                </strong>
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  المستلم: <strong style={{ color: '#0F172A' }}>{activeClient ? (activeClient.full_name || activeClient.name) : 'لا يوجد مشترك محدد'}</strong> {activeClient ? `(#${activeClient.client_code || activeClient.id})` : ''}
                </span>
              </div>

              <span style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: '4px',
                background: activeClient?.isMax ? '#FFFBEB' : '#F0F9FF',
                border: activeClient?.isMax ? '1px solid #FDE68A' : '1px solid #BAE6FD',
                color: activeClient?.isMax ? '#B45309' : '#0284C7',
                fontFamily: 'JetBrains Mono'
              }}>
                {activeClient?.pkgLabel}
              </span>
            </div>

            {/* Template Selector Dropdown */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                اختر نموذج الرسالة الجاهزة:
              </label>
              <select
                value={activeTemplateKey}
                onChange={(e) => setActiveTemplateKey(e.target.value)}
                style={{
                  width: '100%',
                  height: '32px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  padding: '0 8px',
                  fontSize: '11.5px',
                  fontFamily: 'Cairo, sans-serif',
                  outline: 'none',
                  background: '#F8FAFC',
                  color: '#0F172A'
                }}
              >
                {Object.values(MESSAGE_TEMPLATES).map(tpl => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.title} ({tpl.category_label})
                  </option>
                ))}
              </select>
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
                    color: '#2563EB',
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
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  padding: '10px',
                  fontSize: '11.5px',
                  fontFamily: 'Cairo, sans-serif',
                  lineHeight: '1.6',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: '#FFFFFF',
                  color: '#0F172A'
                }}
              />
              <span style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px', display: 'block' }}>
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
                borderRadius: '6px',
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
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 700,
            zIndex: 99999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            {toast}
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
