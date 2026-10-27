import { ClientCodeBadge, ClientPackageBadge, getClientTier } from '../utils/tierBadgeHelper';
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Clock, CheckCircle2, CreditCard, FileText, MessageCircle, Eye, Edit3, X, Layers, Copy, Check, Zap } from 'lucide-react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import { TableSearch } from '@/shared/components/table-search';
import { RefreshButton } from '@/shared/components/refresh-button';
import WhatsAppModal from '../components/modals/WhatsAppModal';
import IntakeAuditDetailModal from '../components/intake/IntakeAuditDetailModal';
import { arabicSearchMatch } from '../utils/searchUtils';
import { extractClientFastingProfile } from '../utils/seasonalFastingRadar';
import { formatWhatsAppPhone } from '../utils/whatsappRemindersEngine';
import { copyToClipboard } from '../utils/clipboardUtils';
import { PageHeader } from '@/shared/components/page-header';
import { FormSection } from '@/shared/components/form-section';

function formatSubmissionDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('ar-EG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return '-';
  }
}

export default function IntakeSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL | IN_PROGRESS | PENDING | PAID | DRAFT | APPROVED
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const searchInputRef = useRef(null);

  // Modals state
  const [selectedAnswers, setSelectedAnswers] = useState(null);
  const [whatsappClient, setWhatsappClient] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);
  const [verifyingPaymentId, setVerifyingPaymentId] = useState(null);

  const handleToggleAnswers = (sub) => {
    setSelectedAnswers(sub);
  };

  const handleCopyIntakeLink = async () => {
    const url = `${window.location.origin}/intake/form`;
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
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
      window.open(`/coach/editor/${lookup}?submission_id=${submission.id}`, '_blank');
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
        window.open(`/coach/editor/${lookup}?submission_id=${submission.id}`, '_blank');
        fetchSubmissions();
      } else {
        const reasons = Array.isArray(data.reasons_ar) ? data.reasons_ar : [];
        alert([
          data.error || 'فشل توليد مسودة الخطة',
          ...reasons.map((reason) => `- ${reason}`),
          data.hint_ar || '',
        ].filter(Boolean).join('\n\n'));
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
    { 
      id: 'ALL', 
      title: 'كافة الاستمارات', 
      value: submissions.length, 
      unit: 'استمارة', 
      label: 'إجمالي المسجلين', 
      icon: Layers
    },
    { 
      id: 'IN_PROGRESS', 
      title: 'استمارات جارية', 
      value: inProgressCount, 
      unit: 'استمارة', 
      label: 'قيد التعبئة', 
      icon: Edit3
    },
    { 
      id: 'PENDING', 
      title: 'بانتظار المراجعة', 
      value: pendingCount, 
      unit: 'استمارة', 
      label: 'مكتملة الإجابات', 
      icon: Clock
    },
    { 
      id: 'PAID', 
      title: 'مؤكدة الدفع', 
      value: paidCount, 
      unit: 'استمارة', 
      label: 'تم التحويل', 
      icon: CreditCard
    },
    { 
      id: 'DRAFT', 
      title: 'مسودات الخطط', 
      value: draftCount, 
      unit: 'خطة', 
      label: 'جاهزة للاعتماد', 
      icon: FileText
    },
    { 
      id: 'APPROVED', 
      title: 'البرامج المعتمدة', 
      value: approvedCount, 
      unit: 'برنامج', 
      label: 'منشورة للمتدرب', 
      icon: CheckCircle2
    },
  ];

  return (
    <AdminLayout>
      <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* 1. Page Header */}
        <PageHeader
          title="استمارات المشتركين"
          description="متابعة استمارات المشتركين الجدد وتوليد الخطط واعتمادها فورياً."
          actions={(
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <RefreshButton onClick={fetchSubmissions} loading={loading} shortcut="R" />
              <button
                type="button"
                onClick={handleCopyIntakeLink}
                style={{
                  height: '34px',
                  padding: '0 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '8px',
                  border: '1px solid #D0D5DD',
                  background: '#FFFFFF',
                  color: copiedLink ? '#027A48' : '#344054',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
                  transition: 'all 0.15s ease'
                }}
                title="نسخ رابط استمارة الاشتراك المباشر"
              >
                {copiedLink ? <Check size={14} color="#027A48" /> : <Copy size={14} color="#667085" />}
                <span>{copiedLink ? 'تم نسخ الرابط' : 'نسخ رابط الاستمارة'}</span>
              </button>
              <Link
                to="/intake/form"
                target="_blank"
                style={{
                  height: '34px',
                  padding: '0 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '8px',
                  border: '1px solid #D0D5DD',
                  background: '#FFFFFF',
                  color: '#344054',
                  textDecoration: 'none',
                  boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
              >
                <ExternalLink size={14} color="#667085" />
                <span>فتح الاستمارة</span>
              </Link>
            </div>
          )}
        />

        {/* 2. 6-Column Interactive KPI Filter Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
          {statCards.map((st, i) => {
            const Icon = st.icon;
            const isSel = filter === st.id;
            const isEmpty = Number(st.value) === 0 && !isSel;
            return (
              <div 
                key={i} 
                onClick={() => setFilter(st.id)}
                role="button"
                tabIndex={0}
                style={{
                  background: isSel ? '#FAF5FF' : '#FFFFFF',
                  border: isSel ? '1.5px solid #673DE6' : '1px solid #EAECF0',
                  borderRadius: '14px',
                  padding: '16px 18px',
                  boxShadow: isSel ? '0 1px 3px rgba(103, 61, 230, 0.12)' : '0 1px 2px rgba(16, 24, 40, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: isSel ? '#673DE6' : (isEmpty ? '#98A2B3' : '#475467'), whiteSpace: 'nowrap' }}>{st.title}</span>
                  </div>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: isSel ? '#F4F0FD' : '#F9FAFB',
                    border: isSel ? '1px solid #EDE8FA' : '1px solid #EAECF0',
                    color: isSel ? '#673DE6' : (isEmpty ? '#98A2B3' : '#475467'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}>
                    <Icon size={18} strokeWidth={2.2} color={isSel ? '#673DE6' : (isEmpty ? '#98A2B3' : '#475467')} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '1.65rem', fontWeight: 700, color: isEmpty ? '#CBD5E1' : '#0F172A', fontFamily: 'JetBrains Mono, Cairo, sans-serif', lineHeight: 1 }}>
                      {st.value}
                    </span>
                    {st.unit && (
                      <span style={{ fontSize: '11.5px', fontWeight: 500, color: '#667085' }}>
                        {st.unit}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', color: isSel ? '#673DE6' : '#98A2B3', fontWeight: isSel ? 600 : 500, whiteSpace: 'nowrap' }}>
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
              {/* Search Box */}
              <TableSearch value={searchTerm} onChange={setSearchTerm} inputRef={searchInputRef} placeholder="بحث في الاستمارات" width="220px" />

              {/* Active Filter Indicator Tag */}
              {filter !== 'ALL' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F4F0FD', padding: '4px 12px', borderRadius: '8px', border: '1px solid #EDE8FA', fontSize: '11.5px', color: '#673DE6', fontWeight: 600 }}>
                  <span>التصفية: {statCards.find(c => c.id === filter)?.title}</span>
                  <button
                    type="button"
                    onClick={() => setFilter('ALL')}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#673DE6' }}
                    title="إلغاء التصفية وعرض الكل"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        >
          {loading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>جاري استرجاع الاستمارات...</div>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#101828', marginBottom: '4px' }}>لا توجد استمارات مطابقة</div>
              <small style={{ color: '#667085' }}>لم يتم العثور على أي استمارة مسجلة تحت هذا التصنيف أو البحث.</small>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid #EAECF0', borderRadius: '14px', background: '#FFFFFF', boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #EAECF0', color: '#475467', fontWeight: 600 }}>
                    <th style={{ padding: '12px 16px', textAlign: 'center', width: '85px' }}>كود العميل</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>اسم المتدرب</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', width: '110px' }}>تاريخ التقديم</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', width: '115px' }}>رقم الهاتف</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', width: '90px' }}>الباقة</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', width: '120px' }}>حالة الاستمارة</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', minWidth: '240px' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((sub) => {
                    const rawName = sub.user?.full_name || sub.answers?.personal?.firstName || 'متدرب جديد';
                    const clientPhone = sub.user?.phone_number || sub.answers?.personal?.phone || '-';
                    const rawCode = sub.user?.client_code || sub.answers?.client_code || sub.client_code || '1';
                    const cleanCode = String(rawCode).replace(/^client[-_]?/i, '').replace('#', '');
                    const isApproved = sub.status === 'APPROVED';
                    const isMax = getClientTier(sub) === 'MAX';
                    const rawPrice = sub.user?.subscription_price || sub.subscription_price || (isMax ? 3500 : 2500);
                    const submissionDate = sub.createdAt || sub.created_at || sub.user?.createdAt;

                    // Clean name formatting for simulation / stress-test clients
                    const isSimulatedClient = String(cleanCode).startsWith('JRN_') || rawName.includes(' - ');
                    let displayName = rawName;
                    let scenarioSubtext = null;
                    if (isSimulatedClient && rawName.includes(' - ')) {
                      const parts = rawName.split(' - ');
                      displayName = parts[0].trim();
                      scenarioSubtext = parts.slice(1).join(' - ').trim();
                    }

                    return (
                      <tr 
                        key={sub.id} 
                        style={{ borderBottom: '1px solid #EAECF0', transition: 'background 0.15s ease' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* 1. Code */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <ClientCodeBadge code={cleanCode} item={sub} />
                        </td>

                        {/* 2. Name */}
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <strong style={{ color: '#101828', fontSize: '13px', fontWeight: 600 }}>{displayName}</strong>
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
                                const hasMedical = validConditions.length > 0;

                                const foodAllergies = sub.answers?.food_allergies?.selected || sub.answers?.nutrition?.allergies || [];
                                const validAllergies = Array.isArray(foodAllergies) ? foodAllergies.filter(x => x && x !== 'NONE') : [];
                                const hasAllergies = validAllergies.length > 0;

                                return (
                                  <>
                                    {fasting.primaryFastingBadge && (
                                      <span style={{
                                        fontSize: '10.5px',
                                        padding: '2px 8px', borderRadius: '6px',
                                        background: '#F2F4F7',
                                        border: '1px solid #EAECF0',
                                        color: '#344054',
                                        fontWeight: 600
                                      }}>
                                        {fasting.primaryFastingBadge.label}
                                      </span>
                                    )}
                                    {hasInjuries && (
                                      <span style={{
                                        fontSize: '10.5px',
                                        padding: '2px 8px', borderRadius: '6px',
                                        background: '#FEF3F2',
                                        border: '1px solid #FECDCA',
                                        color: '#B42318',
                                        fontWeight: 600
                                      }} title="توجد إصابات مسجلة">
                                        إصابة
                                      </span>
                                    )}
                                    {hasMedical && (
                                      <span style={{
                                        fontSize: '10.5px',
                                        padding: '2px 8px', borderRadius: '6px',
                                        background: '#FFFAEB',
                                        border: '1px solid #FEDF89',
                                        color: '#B54708',
                                        fontWeight: 600
                                      }} title="توجد حالات طبية مسجلة">
                                        طبي
                                      </span>
                                    )}
                                    {hasAllergies && (
                                      <span style={{
                                        fontSize: '10.5px',
                                        padding: '2px 8px', borderRadius: '6px',
                                        background: '#F2F4F7',
                                        border: '1px solid #EAECF0',
                                        color: '#475467',
                                        fontWeight: 600
                                      }} title="توجد حساسية طعام مسجلة">
                                        حساسية
                                      </span>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                            {scenarioSubtext && (
                              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
                                {scenarioSubtext}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Date */}
                        <td style={{ padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '11.5px', color: '#475467', fontWeight: 500 }}>
                            {formatSubmissionDate(submissionDate)}
                          </span>
                        </td>

                        {/* 4. Phone */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span dir="ltr" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#475467' }}>
                            {clientPhone}
                          </span>
                        </td>

                        {/* 5. Package */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }} title={`سعر الباقة: ${Number(rawPrice).toLocaleString('en-US')} ج.م`}>
                            <ClientPackageBadge item={sub} />
                          </div>
                        </td>

                        {/* 6. Smart Unified Status */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {isApproved ? (
                            <span style={{ background: '#ECFDF3', border: '1px solid #A6F4C7', color: '#027A48', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, display: 'inline-block' }}>
                              معتمد ومنشور
                            </span>
                          ) : sub.status === 'DRAFT_GENERATED' ? (
                            <span style={{ background: '#F4F0FD', border: '1px solid #EDE8FA', color: '#673DE6', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, display: 'inline-block' }}>
                              مسودة جاهزة
                            </span>
                          ) : sub.status === 'PENDING_COACH_REVIEW' ? (
                            sub.payment_status === 'PAID' ? (
                              <span style={{ background: '#EFF8FF', border: '1px solid #B2DDFF', color: '#175CD3', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, display: 'inline-block' }}>
                                بانتظار المراجعة
                              </span>
                            ) : (
                              <span style={{ background: '#FFFAEB', border: '1px solid #FEDF89', color: '#B54708', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, display: 'inline-block' }}>
                                بانتظار السداد
                              </span>
                            )
                          ) : (
                            <span style={{ background: '#F2F4F7', border: '1px solid #EAECF0', color: '#475467', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, display: 'inline-block' }}>
                              قيد التعبئة
                            </span>
                          )}
                        </td>

                        {/* 7. Actions */}
                        <td style={{ padding: '12px 16px', textAlign: 'left' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            
                            {/* WhatsApp Nudge Button */}
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
                                height: '32px', padding: '0 13px', borderRadius: '8px',
                                border: '1px solid #D0D5DD',
                                background: '#FFFFFF',
                                color: '#027A48',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#F9FAFB';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#FFFFFF';
                              }}
                              title={sub.status === 'IN_PROGRESS' ? 'إرسال تذكير لإكمال الاستمارة' : 'مركز رسائل الواتساب'}
                            >
                              <MessageCircle size={13} color="#027A48" />
                              <span>واتساب</span>
                            </button>

                            {/* View Answers */}
                            <button
                              type="button"
                              onClick={() => handleToggleAnswers(sub)}
                              style={{
                                height: '32px', padding: '0 13px', borderRadius: '8px',
                                border: '1px solid #D0D5DD',
                                background: '#FFFFFF',
                                color: '#344054',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                              title="عرض إجابات الاستمارة"
                            >
                              <Eye size={13} color="#667085" />
                              <span>إجابات</span>
                            </button>

                            {/* Direct Verify Payment trigger if not paid */}
                            {sub.status !== 'APPROVED' && sub.payment_status !== 'PAID' && (
                              <button
                                type="button"
                                disabled={verifyingPaymentId === sub.id}
                                onClick={() => handleVerifyPayment(sub)}
                                style={{
                                  height: '32px', padding: '0 13px', borderRadius: '8px',
                                  border: '1px solid #A6F4C7',
                                  background: '#ECFDF3',
                                  color: '#027A48',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  cursor: verifyingPaymentId === sub.id ? 'wait' : 'pointer',
                                  boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = '#D1FADF')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = '#ECFDF3')}
                                title="تأكيد استلام التحويل وتفعيل الحساب فوراً"
                              >
                                {verifyingPaymentId === sub.id ? 'جاري التأكيد...' : 'تأكيد الدفع'}
                              </button>
                            )}

                            {/* Generate / Edit Program CTA - Primary Purple Style */}
                            {(() => {
                              const isDraft = sub.status === 'DRAFT_GENERATED';
                              const isPending = !isApproved && !isDraft;
                              const btnBg = isApproved ? '#FFFFFF' : (isDraft ? '#F4F0FD' : '#673DE6');
                              const btnColor = isApproved ? '#344054' : (isDraft ? '#673DE6' : '#FFFFFF');
                              const btnBorder = isApproved ? '1px solid #D0D5DD' : (isDraft ? '1px solid #DDD6FE' : '1px solid #673DE6');
                              const btnText = isApproved ? 'تعديل الخطة' : (isDraft ? 'فتح بالمحرر' : (generatingId === sub.id ? 'جاري التوليد...' : 'توليد الخطة'));

                              return (
                                <button
                                  type="button"
                                  onClick={() => handleGenerateDraft(sub)}
                                  disabled={generatingId === sub.id}
                                  style={{
                                    height: '32px',
                                    padding: '0 14px',
                                    borderRadius: '8px',
                                    border: btnBorder,
                                    background: btnBg,
                                    color: btnColor,
                                    fontSize: '11.5px',
                                    fontWeight: 700,
                                    cursor: generatingId === sub.id ? 'wait' : 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    boxShadow: isPending ? '0 1px 3px rgba(103, 61, 230, 0.25)' : '0 1px 2px rgba(16, 24, 40, 0.05)',
                                    transition: 'all 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (isPending) e.currentTarget.style.background = '#5025D1';
                                    else if (isDraft) e.currentTarget.style.background = '#EDE8FA';
                                    else e.currentTarget.style.background = '#F9FAFB';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = btnBg;
                                  }}
                                  title={isApproved ? 'تعديل خطة المتدرب بالمحرر' : isDraft ? 'فتح المسودة بالمحرر' : 'توليد مسودة الخطة الذكية آلياً'}
                                >
                                  {isPending ? <Zap size={13} color="#FBBF24" /> : <Edit3 size={13} color={btnColor} />}
                                  <span>{btnText}</span>
                                </button>
                              );
                            })()}
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
