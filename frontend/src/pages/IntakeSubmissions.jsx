import { ClientCodeBadge, ClientPackageBadge, getClientTier } from '../utils/tierBadgeHelper';
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Search, Clock, CheckCircle2, CreditCard, FileText, MessageCircle, Eye, Edit3, X, Layers, TrendingUp, RefreshCw } from 'lucide-react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import WhatsAppModal from '../components/modals/WhatsAppModal';
import IntakeAuditDetailModal from '../components/intake/IntakeAuditDetailModal';
import { arabicSearchMatch } from '../utils/searchUtils';
import { extractClientFastingProfile } from '../utils/seasonalFastingRadar';
import { formatWhatsAppPhone } from '../utils/whatsappRemindersEngine';
import { PageHeader } from '@/shared/components/page-header';
import { FormSection } from '@/shared/components/form-section';

export default function IntakeSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL | IN_PROGRESS | PENDING | PAID | DRAFT | APPROVED
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);

  // Modals state
  const [selectedAnswers, setSelectedAnswers] = useState(null);
  const [whatsappClient, setWhatsappClient] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);
  const [verifyingPaymentId, setVerifyingPaymentId] = useState(null);

  const handleToggleAnswers = (sub) => {
    setSelectedAnswers(sub);
  };

  useEffect(() => {
    fetchSubmissions();
    const interval = setInterval(fetchSubmissions, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      const isInputActive = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.isContentEditable
      );

      if (e.key === 'Escape' || e.keyCode === 27) {
        if (whatsappClient) {
          setWhatsappClient(null);
          return;
        }
        if (selectedAnswers) {
          setSelectedAnswers(null);
          return;
        }
        if (searchTerm) {
          setSearchTerm('');
          return;
        }
        if (isInputActive) {
          activeEl.blur();
        }
        return;
      }

      if (isInputActive) return;

      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        fetchSubmissions();
        return;
      }

      if (['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        e.preventDefault();
        const keyMap = {
          '1': 'ALL',
          '2': 'IN_PROGRESS',
          '3': 'PENDING',
          '4': 'PAID',
          '5': 'DRAFT',
          '6': 'APPROVED'
        };
        if (keyMap[e.key]) {
          setFilter(keyMap[e.key]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [whatsappClient, selectedAnswers, searchTerm]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/intake/submissions`);
      const data = await res.json();
      if (data.submissions) {
        setSubmissions(data.submissions);
      }
    } catch (e) {
      console.error('fetchSubmissions error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (sub) => {
    const clientName = sub.user?.full_name || sub.answers?.personal?.firstName || 'المشترك';
    const isMax = getClientTier(sub) === 'MAX';
    const rawPkg = sub.user?.subscription_package || sub.package_name || (isMax ? 'MAX_3_PLUS_1' : 'ELITE_3_PLUS_1');
    const rawPrice = sub.user?.subscription_price || sub.subscription_price || (isMax ? 3500 : 2500);

    if (!window.confirm(`هل ترغب في تأكيد استلام سداد اشتراك (${clientName}) وتفعيل الحساب فوراً؟`)) {
      return;
    }

    try {
      setVerifyingPaymentId(sub.id);
      const res = await fetch(`${API_BASE}/api/v1/intake/${sub.id}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_package: rawPkg,
          subscription_price: rawPrice,
          payment_method: sub.user?.payment_method || 'INSTAPAY',
          duration_months: 4
        })
      });

      if (res.ok) {
        fetchSubmissions();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'حدث خطأ أثناء تأكيد الدفع');
      }
    } catch {
      alert('خطأ في الاتصال بالخادم');
    } finally {
      setVerifyingPaymentId(null);
    }
  };

  const handleGenerateDraft = async (submission) => {
    const lookup = submission.user?.client_code || submission.user?.id || '1';
    if (submission.status === 'DRAFT_GENERATED' || submission.status === 'APPROVED') {
      window.open(`/coach/editor?user_id=${lookup}`, '_blank');
      return;
    }

    try {
      setGeneratingId(submission.id);
      const res = await fetch(`${API_BASE}/api/v1/intake/${submission.id}/generate-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (res.ok) {
        window.open(`/coach/editor?user_id=${lookup}&submission_id=${submission.id}`, '_blank');
        fetchSubmissions();
      } else {
        alert(data.error || 'فشل توليد مسودة الخطة');
      }
    } catch {
      alert('خطأ أثناء توليد المسودة');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleSendNudge = (sub) => {
    const user = sub.user || {};
    const clientName = user.full_name || sub.answers?.personal?.firstName || 'البطل';
    const clientPhone = user.phone_number || sub.answers?.personal?.phone || '';
    const intakeUrl = `${window.location.origin}/intake/form?code=${user.client_code}&phone=${clientPhone}`;

    const cleanPhone = formatWhatsAppPhone(clientPhone);

    const message = `أهلاً يا ${clientName}!\nلاحظنا أنك اقتربت من إنهاء استمارة اشتراكك في Z Coaching (متبقي خطوات بسيطة فقط).\nاضغط على الرابط التالي لإكمالها وسيبدأ الكابتن بتجهيز وتفعيل خطتك فوراً:\n\n${intakeUrl}\n\nبالتوفيق!`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const filteredSubmissions = submissions.filter(sub => {
    if (filter === 'IN_PROGRESS' && sub.status !== 'IN_PROGRESS' && (sub.progress_percent || 100) === 100) return false;
    if (filter === 'PENDING' && sub.status !== 'PENDING_COACH_REVIEW') return false;
    if (filter === 'PAID' && sub.status !== 'PAYMENT_CONFIRMED') return false;
    if (filter === 'DRAFT' && sub.status !== 'DRAFT_GENERATED') return false;
    if (filter === 'APPROVED' && sub.status !== 'APPROVED') return false;

    if (!searchTerm.trim()) return true;
    const raw = searchTerm.trim().toLowerCase();

    if (raw.startsWith('#')) {
      const codeQuery = raw.replace(/^#+/, '').trim();
      if (!codeQuery) return true;
      const clientCode = String(sub.user?.client_code || '').toLowerCase();
      const cleanCode = clientCode.replace(/^client[-_]?/i, '');
      return clientCode === codeQuery || cleanCode === codeQuery || clientCode === `client-${codeQuery}`;
    }

    return (
      arabicSearchMatch(sub.user?.full_name, searchTerm) ||
      arabicSearchMatch(sub.answers?.personal?.firstName, searchTerm) ||
      arabicSearchMatch(sub.answers?.personal?.lastName, searchTerm) ||
      arabicSearchMatch(sub.user?.phone_number, searchTerm) ||
      arabicSearchMatch(sub.answers?.personal?.phone, searchTerm) ||
      arabicSearchMatch(sub.user?.client_code, searchTerm)
    );
  });

  const inProgressCount = submissions.filter(s => s.status === 'IN_PROGRESS' || ((s.progress_percent || 100) < 100 && s.status !== 'APPROVED')).length;
  const pendingCount = submissions.filter(s => s.status === 'PENDING_COACH_REVIEW').length;
  const paidCount = submissions.filter(s => s.status === 'PAYMENT_CONFIRMED').length;
  const draftCount = submissions.filter(s => s.status === 'DRAFT_GENERATED').length;
  const approvedCount = submissions.filter(s => s.status === 'APPROVED').length;

  const statCards = [
    { id: 'ALL', title: 'كافة الاستمارات', value: submissions.length, unit: 'استمارة', label: 'إجمالي المسجلين', icon: Layers, shortcut: '1' },
    { id: 'IN_PROGRESS', title: 'استمارات جارية', value: inProgressCount, unit: 'استمارة', label: 'قيد التعبئة', icon: Edit3, shortcut: '2' },
    { id: 'PENDING', title: 'بانتظار المراجعة', value: pendingCount, unit: 'استمارة', label: 'مكتملة الإجابات', icon: Clock, shortcut: '3' },
    { id: 'PAID', title: 'مؤكدة الدفع', value: paidCount, unit: 'استمارة', label: 'تم التحويل', icon: CreditCard, shortcut: '4' },
    { id: 'DRAFT', title: 'مسودات الخطط', value: draftCount, unit: 'خطة', label: 'جاهزة للاعتماد', icon: FileText, shortcut: '5' },
    { id: 'APPROVED', title: 'البرامج المعتمدة', value: approvedCount, unit: 'برنامج', label: 'منشورة للمتدرب', icon: CheckCircle2, shortcut: '6' },
  ];

  return (
    <AdminLayout>
      <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* 1. Page Header */}
        <PageHeader
          title="استمارات المشتركين"
          description="متابعة استمارات المشتركين الجدد وتوليد الخطط واعتمادها فورياً."
          actions={(
            <Link
              to="/intake/form"
              target="_blank"
              style={{
                height: '36px',
                padding: '0 16px',
                fontSize: '12.5px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '8px',
                background: '#0F172A',
                color: '#FFFFFF',
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.25)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#0F172A')}
            >
              <ExternalLink size={14} />
              <span>رابط الاستمارة</span>
            </Link>
          )}
        />

        {/* 2. 6-Column Interactive KPI Filter Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          {statCards.map((st, i) => {
            const Icon = st.icon;
            const isSel = filter === st.id;
            // Same rule as the daily dashboard: an empty count steps back instead of shouting zero.
            const isEmpty = Number(st.value) === 0 && !isSel;
            return (
              <div 
                key={i} 
                onClick={() => setFilter(st.id)}
                role="button"
                tabIndex={0}
                style={{
                  background: isSel ? '#F8FAFC' : '#FFFFFF',
                  border: isSel ? '2px solid #0F172A' : '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  boxShadow: isSel ? '0 4px 12px rgba(15, 23, 42, 0.08)' : '0 1px 3px rgba(15, 23, 42, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: isSel ? 800 : 700, color: isSel ? '#0F172A' : (isEmpty ? '#94A3B8' : '#64748B'), whiteSpace: 'nowrap' }}>{st.title}</span>
                    <span style={{
                      fontSize: '9.5px',
                      fontFamily: 'JetBrains Mono, monospace',
                      padding: '1px 5px',
                      borderRadius: '6px',
                      background: isSel ? '#0F172A' : '#F1F5F9',
                      color: isSel ? '#FFFFFF' : '#64748B',
                      border: `1px solid ${isSel ? '#0F172A' : '#CBD5E1'}`,
                      fontWeight: 700
                    }}>
                      [{st.shortcut}]
                    </span>
                  </div>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: isSel ? '#0F172A' : '#F8FAFC',
                    border: isSel ? '1px solid #0F172A' : '1px solid #E2E8F0',
                    color: isSel ? '#FFFFFF' : (isEmpty ? '#94A3B8' : '#0F172A'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}>
                    <Icon size={14} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: isEmpty ? '#CBD5E1' : '#0F172A', fontFamily: 'JetBrains Mono, Cairo, sans-serif', lineHeight: 1 }}>
                      {st.value}
                    </span>
                    {st.unit && (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>
                        {st.unit}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '10.5px', color: isSel ? '#0F172A' : '#94A3B8', fontWeight: isSel ? 700 : 600, whiteSpace: 'nowrap' }}>
                    {st.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. Submissions Table & Clean Toolbar */}
        <FormSection
          title="قائمة الاستمارات المسجلة"
          description="كافة الاستمارات الواردة مع إمكانية مراجعة الإجابات، تأكيد التحويل، وتوليد البرامج."
          actions={(
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Refresh Button */}
              <button
                type="button"
                onClick={fetchSubmissions}
                disabled={loading}
                style={{
                  height: '32px',
                  padding: '0 10px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                title="تحديث البيانات لحظياً [R]"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                <span>تحديث</span>
                <span style={{ fontSize: '9px', opacity: 0.7, fontFamily: 'JetBrains Mono, monospace' }}>[R]</span>
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
                  width: '210px',
                  gap: '6px'
                }}
              >
                <Search size={13} color="#94A3B8" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="بحث في الاستمارات... [/]"
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
                {searchTerm ? (
                  <button type="button" onClick={() => setSearchTerm('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#94A3B8' }}>
                    <X size={12} />
                  </button>
                ) : (
                  <span style={{ fontSize: '9.5px', color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace', padding: '1px 5px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px' }}>/</span>
                )}
              </div>

              {/* Active Filter Indicator Tag */}
              {filter !== 'ALL' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', padding: '4px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '11px', color: '#0F172A', fontWeight: 700 }}>
                  <span>التصفية: {statCards.find(c => c.id === filter)?.title}</span>
                  <button
                    type="button"
                    onClick={() => setFilter('ALL')}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#64748B' }}
                    title="إلغاء التصفية وعرض الكل"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          )}
        >
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
              جاري تحميل الاستمارات...
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F1F5F9', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto' }}>
                <CheckCircle2 size={18} />
              </div>
              <strong style={{ fontSize: '13px', color: '#0F172A', display: 'block', marginBottom: '2px' }}>لا توجد استمارات مطابقة</strong>
              <small style={{ fontSize: '11.5px', color: '#64748B' }}>لم يتم العثور على أي استمارة مسجلة تحت هذا التصنيف أو البحث.</small>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 700 }}>
                    <th style={{ padding: '10px 14px', textAlign: 'center', width: '85px' }}>كود العميل</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>اسم المتدرب</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', width: '110px' }}>رقم الهاتف</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', width: '85px' }}>الباقة</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', width: '90px' }}>السعر</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', width: '100px' }}>حالة الدفع</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', width: '100px' }}>حالة الاستمارة</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', minWidth: '300px' }}>الإجراءات</th>
                  </tr>
                </thead>
                                <tbody>
                  {filteredSubmissions.map((sub) => {
                    const clientName = sub.user?.full_name || sub.answers?.personal?.firstName || 'متدرب جديد';
                    const clientPhone = sub.user?.phone_number || sub.answers?.personal?.phone || '-';
                    const rawCode = sub.user?.client_code || sub.answers?.client_code || sub.client_code || '1';
                    const cleanCode = String(rawCode).replace(/^client[-_]?/i, '').replace('#', '');
                    const rawPkg = sub.user?.subscription_package || sub.package_name || sub.subscription_package || sub.user?.package || 'ELITE';
                    const _clean = String(rawPkg).trim().toUpperCase();
                    const isMax = getClientTier(sub) === 'MAX';
                    const rawPrice = sub.user?.subscription_price || sub.subscription_price || (isMax ? 3500 : 2500);

                    return (
                      <tr 
                        key={sub.id} 
                        style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* 1. Code */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <ClientCodeBadge code={cleanCode} item={sub} />
                        </td>

                        {/* 2. Name */}
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <strong style={{ color: '#0F172A', fontSize: '13px' }}>{clientName}</strong>
                            {(() => {
                              const fasting = extractClientFastingProfile(sub, sub.answers);
                              const injuries = sub.answers?.injuries_map?.selected_areas || sub.answers?.training?.selectedInjuries || [];
                              const validInjuries = Array.isArray(injuries) ? injuries.filter(x => x && x !== 'NONE') : [];
                              const hasInjuries = validInjuries.length > 0;

                              const medicalConds = sub.answers?.medical_conditions?.selected || sub.answers?.medical?.conditions || [];
                              const validConditions = Array.isArray(medicalConds) ? medicalConds.filter(x => {
                                const code = typeof x === 'string' ? x : x?.conditionCode;
                                return code && code !== 'NONE';
                              }) : [];
                              const hasConditions = validConditions.length > 0;

                              const allergies = sub.answers?.strict_allergies || sub.answers?.nutrition?.excludedFoodsList || [];
                              const validAllergies = Array.isArray(allergies) ? allergies.filter(x => x && x !== 'NONE') : [];
                              const hasAllergies = validAllergies.length > 0;

                              return (
                                <>
                                  {fasting.primaryFastingBadge && (
                                    <span style={{
                                      fontSize: '10px',
                                      padding: '2px 7px',
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
                                      padding: '2px 7px',
                                      borderRadius: '6px',
                                      background: fasting.intermittentBadge.bg,
                                      border: `1px solid ${fasting.intermittentBadge.border}`,
                                      color: fasting.intermittentBadge.color,
                                      fontWeight: 800
                                    }}>
                                      {fasting.intermittentBadge.label}
                                    </span>
                                  )}
                                  {hasInjuries && (
                                    <span style={{
                                      fontSize: '10px',
                                      padding: '2px 7px',
                                      borderRadius: '6px',
                                      background: '#FEF2F2',
                                      border: '1px solid #FECACA',
                                      color: '#DC2626',
                                      fontWeight: 800
                                    }} title="توجد إصابات مسجلة بالاستمارة">
                                      إصابة
                                    </span>
                                  )}
                                  {hasConditions && (
                                    <span style={{
                                      fontSize: '10px',
                                      padding: '2px 7px',
                                      borderRadius: '6px',
                                      background: '#FFFBEB',
                                      border: '1px solid #FDE68A',
                                      color: '#D97706',
                                      fontWeight: 800
                                    }} title="توجد حالات صحية مسجلة">
                                      حالة صحية
                                    </span>
                                  )}
                                  {hasAllergies && (
                                    <span style={{
                                      fontSize: '10px',
                                      padding: '2px 7px',
                                      borderRadius: '6px',
                                      background: '#FDF2F8',
                                      border: '1px solid #FBCFE8',
                                      color: '#DB2777',
                                      fontWeight: 800
                                    }} title="توجد حساسيات طعام مسجلة">
                                      حساسية
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </td>

                        {/* 3. Phone */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span dir="ltr" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11.5px', color: '#475569' }}>
                            {clientPhone}
                          </span>
                        </td>

                        {/* 4. Package */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <ClientPackageBadge item={sub} />
                        </td>

                        {/* 5. Price */}
                        <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span style={{ 
                            background: '#F8FAFC', 
                            border: '1px solid #E2E8F0', 
                            padding: '3px 9px', 
                            borderRadius: '6px', 
                            display: 'inline-flex',
                            alignItems: 'baseline',
                            gap: '3px',
                            justifyContent: 'center'
                          }}>
                            <span style={{ 
                              color: '#0F172A', 
                              fontSize: '11px', 
                              fontWeight: 800, 
                              fontFamily: 'JetBrains Mono, Cairo, sans-serif'
                            }}>
                              {Number(rawPrice).toLocaleString('en-US')}
                            </span>
                            <span style={{ 
                              fontSize: '9.5px', 
                              fontWeight: 700, 
                              color: '#64748B', 
                              fontFamily: 'Cairo, sans-serif' 
                            }}>
                              ج.م
                            </span>
                          </span>
                        </td>

                        {/* 5. Payment Status */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          {sub.payment_status === 'PAID' || sub.status === 'PAYMENT_CONFIRMED' || sub.status === 'APPROVED' ? (
                            <span style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#16A34A', padding: '2px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 700, display: 'inline-block' }}>
                              مدفوع (مؤكد)
                            </span>
                          ) : (
                            <span style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#D97706', padding: '2px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 700, display: 'inline-block' }}>
                              بانتظار الدفع
                            </span>
                          )}
                        </td>

                        {/* 6. Intake Status */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          {sub.status === 'APPROVED' ? (
                            <span style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#16A34A', padding: '2px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 800, display: 'inline-block' }}>
                              معتمد ومنشور
                            </span>
                          ) : sub.status === 'DRAFT_GENERATED' ? (
                            <span style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0284C7', padding: '2px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 700, display: 'inline-block' }}>
                              مسودة جاهزة
                            </span>
                          ) : sub.status === 'PENDING_COACH_REVIEW' ? (
                            <span style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#D97706', padding: '2px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 700, display: 'inline-block' }}>
                              بانتظار المراجعة
                            </span>
                          ) : (
                            <span style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B', padding: '2px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 700, display: 'inline-block' }}>
                              قيد التعبئة
                            </span>
                          )}
                        </td>

                        {/* 7. Actions */}
                        <td style={{ padding: '10px 14px', textAlign: 'left' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            
                            {/* WhatsApp Nudge Button */}
                            {/* WhatsApp Nudge / Chat */}
                            <button
                              type="button"
                              onClick={() => {
                                if (sub.status === 'IN_PROGRESS') {
                                  handleSendNudge(sub);
                                } else {
                                  setWhatsappClient({
                                    ...(sub.user || {}),
                                    client_code: sub.user?.client_code || sub.answers?.client_code || sub.client_code,
                                    full_name: sub.user?.full_name || sub.answers?.personal?.firstName || 'مشتركنا',
                                    phone_number: sub.user?.phone_number || sub.answers?.personal?.phone || ''
                                  });
                                }
                              }}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '8px',
                                border: '1px solid #E2E8F0',
                                background: 'transparent',
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
                              title={sub.status === 'IN_PROGRESS' ? 'إرسال تذكير لإكمال الاستمارة' : 'مركز رسائل الواتساب'}
                            >
                              <MessageCircle size={13} />
                              <span>واتساب</span>
                            </button>

                            {/* View Answers */}
                            <button
                              type="button"
                              onClick={() => handleToggleAnswers(sub)}
                              style={{
                                padding: '5px 9px',
                                borderRadius: '8px',
                                border: '1px solid #CBD5E1',
                                background: '#FFFFFF',
                                color: '#475569',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="عرض إجابات الاستمارة"
                            >
                              <Eye size={12} />
                              <span>إجابات</span>
                            </button>

                            {/* Timeline Profile Link */}
                            {cleanCode && cleanCode !== '1' && (
                              <Link
                                to={`/coach/timeline/${cleanCode}`}
                                style={{
                                  padding: '5px 9px',
                                  borderRadius: '8px',
                                  border: '1px solid #CBD5E1',
                                  background: '#FFFFFF',
                                  color: '#475569',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                                title="سجل التطور الزمني والمقارنات"
                              >
                                <TrendingUp size={12} />
                                <span>التطور</span>
                              </Link>
                            )}

                            {/* Direct Verify Payment trigger if not paid */}
                            {sub.status !== 'APPROVED' && sub.payment_status !== 'PAID' && (
                              <button
                                type="button"
                                disabled={verifyingPaymentId === sub.id}
                                onClick={() => handleVerifyPayment(sub)}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '8px',
                                  border: '1px solid #86EFAC',
                                  background: '#F0FDF4',
                                  color: '#16A34A',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: verifyingPaymentId === sub.id ? 'wait' : 'pointer'
                                }}
                                title="تأكيد استلام التحويل وتفعيل الحساب فوراً"
                              >
                                {verifyingPaymentId === sub.id ? 'جاري التأكيد...' : 'تأكيد الدفع'}
                              </button>
                            )}

                            {/* Generate / Edit Program CTA in #0F172A */}
                            <button
                              type="button"
                              onClick={() => handleGenerateDraft(sub)}
                              disabled={generatingId === sub.id}
                              style={{
                                padding: '5px 12px',
                                borderRadius: '8px',
                                background: '#0F172A',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 2px 5px rgba(15, 23, 42, 0.25)',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = '#0F172A')}
                            >
                              <span>{sub.status === 'APPROVED' ? 'تعديل الخطة' : sub.status === 'DRAFT_GENERATED' ? 'فتح بالمحرر' : 'توليد الخطة'}</span>
                            </button>
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

        {/* Intake Audit Details Modal */}
        {selectedAnswers && (
          <IntakeAuditDetailModal
            submission={selectedAnswers}
            isOpen={Boolean(selectedAnswers)}
            onClose={() => setSelectedAnswers(null)}
            onGenerateDraft={handleGenerateDraft}
            generatingId={generatingId}
          />
        )}

        {/* WhatsApp Modal */}
        {whatsappClient && (
          <WhatsAppModal
            isOpen={Boolean(whatsappClient)}
            onClose={() => setWhatsappClient(null)}
            client={whatsappClient}
          />
        )}

      </div>
    </AdminLayout>
  );
}
