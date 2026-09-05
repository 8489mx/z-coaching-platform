import { ClientCodeBadge, ClientPackageBadge, getClientTier } from '../utils/tierBadgeHelper';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ExternalLink, Search, Clock, CheckCircle2, CreditCard, FileText, Send, Check, MessageCircle, Eye, Edit3, X } from 'lucide-react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import WhatsAppModal from '../components/modals/WhatsAppModal';
import IntakeAuditDetailModal from '../components/intake/IntakeAuditDetailModal';
import { arabicSearchMatch } from '../utils/searchUtils';
import { PageHeader } from '@/shared/components/page-header';
import { FormSection } from '@/shared/components/form-section';

export default function IntakeSubmissions() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL | IN_PROGRESS | PENDING | PAID | DRAFT | APPROVED
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [selectedAnswers, setSelectedAnswers] = useState(null);
  const [paymentModalSub, setPaymentModalSub] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    subscription_package: '3_MONTHS_MAX',
    subscription_price: 2500,
    payment_method: 'INSTAPAY',
    duration_months: 3
  });
  const [whatsappClient, setWhatsappClient] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);

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
      if (e.key === 'Escape' || e.keyCode === 27) {
        if (paymentModalSub) setPaymentModalSub(null);
        if (whatsappClient) setWhatsappClient(null);
        if (selectedAnswers) setSelectedAnswers(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paymentModalSub, whatsappClient, selectedAnswers]);

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

  const handleVerifyPayment = async (e) => {
    e.preventDefault();
    if (!paymentModalSub) return;

    try {
      const res = await fetch(`${API_BASE}/api/v1/intake/${paymentModalSub.id}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm)
      });

      if (res.ok) {
        setPaymentModalSub(null);
        fetchSubmissions();
      } else {
        alert('حدث خطأ أثناء تأكيد الدفع');
      }
    } catch (e) {
      alert('خطأ في الاتصال بالخادم');
    }
  };

  const handleGenerateDraft = async (submission) => {
    const lookup = submission.user?.client_code || submission.user?.id || '1';
    if (submission.status === 'DRAFT_GENERATED' || submission.status === 'APPROVED') {
      navigate(`/coach/editor?user_id=${lookup}`);
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
        navigate(`/coach/editor?user_id=${lookup}&submission_id=${submission.id}`);
      } else {
        alert(data.error || 'فشل توليد مسودة الخطة');
      }
    } catch (e) {
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

    let cleanPhone = clientPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('01')) cleanPhone = '2' + cleanPhone;

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
    { title: 'استمارات جارية', value: inProgressCount, unit: 'استمارة', label: 'قيد التعبئة', icon: Edit3 },
    { title: 'بانتظار المراجعة', value: pendingCount, unit: 'استمارة', label: 'مكتملة الإجابات', icon: Clock },
    { title: 'مؤكدة الدفع', value: paidCount, unit: 'استمارة', label: 'تم التحويل', icon: CreditCard },
    { title: 'مسودات الخطط', value: draftCount, unit: 'خطة', label: 'جاهزة للاعتماد', icon: FileText },
    { title: 'البرامج المعتمدة', value: approvedCount, unit: 'برنامج', label: 'منشورة للمتدرب', icon: CheckCircle2 },
  ];

  return (
    <AdminLayout>
      <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* 1. Page Header */}
        <PageHeader
          title="مركز استمارات العملاء ومراجعة الخطط"
          description="متابعة ملء الاستمارات لحظياً، استعادة الاستمارات المتروكة، وتوليد مسودة الخطة الذكية."
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
                borderRadius: '6px',
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
              <span>فتح رابط الاستمارة العامة</span>
            </Link>
          )}
        />

        {/* 2. 5-Column Horizontal Balanced KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          {statCards.map((st, i) => {
            const Icon = st.icon;
            return (
              <div 
                key={i} 
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap' }}>{st.title}</span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={14} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo, sans-serif', lineHeight: 1 }}>
                      {st.value}
                    </span>
                    {st.unit && (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>
                        {st.unit}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '10.5px', color: '#94A3B8', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {st.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. Submissions Table & Filter Section */}
        <FormSection
          title="قائمة الاستمارات المسجلة"
          description="كافة الاستمارات الواردة مع إمكانية مراجعة الإجابات، تأكيد التحويل، وتوليد البرامج."
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
                  placeholder="بحث في الاستمارات..."
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
                {searchTerm && (
                  <button type="button" onClick={() => setSearchTerm('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#94A3B8' }}>
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: '3px', background: '#F1F5F9', padding: '3px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                {[
                  { id: 'ALL', label: `الكل (${submissions.length})` },
                  { id: 'IN_PROGRESS', label: `قيد التعبئة (${inProgressCount})` },
                  { id: 'PENDING', label: `بانتظار الاعتماد (${pendingCount})` },
                  { id: 'PAID', label: `مؤكد الدفع (${paidCount})` },
                  { id: 'DRAFT', label: `مسودات (${draftCount})` },
                  { id: 'APPROVED', label: `معتمد (${approvedCount})` },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilter(tab.id)}
                    style={{
                      padding: '4px 9px',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      background: filter === tab.id ? '#0F172A' : 'transparent',
                      color: filter === tab.id ? '#FFFFFF' : '#64748B',
                      boxShadow: filter === tab.id ? '0 2px 5px rgba(15, 23, 42, 0.25)' : 'none',
                      transition: 'background 0.12s ease, color 0.12s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        >
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
              جاري تحميل الاستمارات...
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F1F5F9', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto' }}>
                <CheckCircle2 size={18} />
              </div>
              <strong style={{ fontSize: '13px', color: '#0F172A', display: 'block', marginBottom: '2px' }}>لا توجد استمارات مطابقة</strong>
              <small style={{ fontSize: '11.5px', color: '#64748B' }}>لم يتم العثور على أي استمارة مسجلة تحت هذا التصنيف أو البحث.</small>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 700 }}>
                    <th style={{ padding: '10px 14px', textAlign: 'center', width: '85px' }}>كود العميل</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>اسم المتدرب</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>رقم الهاتف</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>الباقة والمبلغ</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>حالة الدفع</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>حالة الاستمارة</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>الإجراءات</th>
                  </tr>
                </thead>
                                <tbody>
                  {filteredSubmissions.map((sub) => {
                    const clientName = sub.user?.full_name || sub.answers?.personal?.firstName || 'متدرب جديد';
                    const clientPhone = sub.user?.phone_number || sub.answers?.personal?.phone || '-';
                    const rawCode = sub.user?.client_code || sub.answers?.client_code || sub.client_code || '1';
                    const cleanCode = String(rawCode).replace(/^client[-_]?/i, '').replace('#', '');
                    const rawPkg = sub.user?.subscription_package || sub.package_name || sub.subscription_package || sub.user?.package || 'ELITE';
                    const clean = String(rawPkg).trim().toUpperCase();
                    const isMax = getClientTier(sub) === 'MAX';
                    const label = isMax ? 'MAX' : 'ELITE';
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
                          <strong style={{ color: '#0F172A', fontSize: '13px', display: 'block' }}>{clientName}</strong>
                        </td>

                        {/* 3. Phone */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span dir="ltr" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11.5px', color: '#475569' }}>
                            {clientPhone}
                          </span>
                        </td>

                        {/* 4. Package & Price */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
                            <ClientPackageBadge item={sub} />
                            <span style={{ color: '#475569', fontSize: '11px', fontWeight: 800, fontFamily: 'JetBrains Mono, Cairo, sans-serif', textAlign: 'center' }}>
                              {`${Number(rawPrice).toLocaleString('en-US')} ج.م`}
                            </span>
                          </div>
                        </td>

                        {/* 5. Payment Status */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          {sub.payment_status === 'PAID' || sub.status === 'PAYMENT_CONFIRMED' || sub.status === 'APPROVED' ? (
                            <span style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#16A34A', padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700, display: 'inline-block' }}>
                              مدفوع (مؤكد)
                            </span>
                          ) : (
                            <span style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#D97706', padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700, display: 'inline-block' }}>
                              بانتظار الدفع
                            </span>
                          )}
                        </td>

                        {/* 6. Intake Status */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          {sub.status === 'APPROVED' ? (
                            <span style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#16A34A', padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 800, display: 'inline-block' }}>
                              معتمد ومنشور
                            </span>
                          ) : sub.status === 'DRAFT_GENERATED' ? (
                            <span style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0284C7', padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700, display: 'inline-block' }}>
                              مسودة جاهزة
                            </span>
                          ) : sub.status === 'PENDING_COACH_REVIEW' ? (
                            <span style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#D97706', padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700, display: 'inline-block' }}>
                              بانتظار المراجعة
                            </span>
                          ) : (
                            <span style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B', padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700, display: 'inline-block' }}>
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
                              onClick={() => handleSendNudge(sub)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                border: '1px solid #E2E8F0', background: 'transparent',
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
                              title="تواصل وتذكير واتساب"
                            >
                              <MessageCircle size={13} />
                              <span>واتساب</span>
                            </button>

                            {/* View Answers */}
                            <button
                              type="button"
                              onClick={() => handleToggleAnswers(sub)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '5px',
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

                            {/* Verify Payment Modal trigger if not paid */}
                            {sub.status !== 'APPROVED' && sub.payment_status !== 'PAID' && (
                              <button
                                type="button"
                                onClick={() => setPaymentModalSub(sub)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '5px',
                                  border: '1px solid #CBD5E1',
                                  background: '#FFFFFF',
                                  color: '#0F172A',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                تأكيد الدفع
                              </button>
                            )}

                            {/* Generate / Edit Program CTA in #0F172A */}
                            <button
                              type="button"
                              onClick={() => handleGenerateDraft(sub)}
                              disabled={generatingId === sub.id}
                              style={{
                                padding: '4px 12px',
                                borderRadius: '5px',
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

        {/* Payment Confirmation Modal */}
        {paymentModalSub && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
            <div style={{ background: '#FFFFFF', borderRadius: '12px', width: '400px', maxWidth: '90vw', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <strong style={{ fontSize: '14px', color: '#0F172A' }}>تأكيد استلام الدفع وتفعيل الباقة</strong>
                <button type="button" onClick={() => setPaymentModalSub(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={16} /></button>
              </div>
              <form onSubmit={handleVerifyPayment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', color: '#64748B', display: 'block', marginBottom: '4px' }}>اسم المشترك</label>
                  <input type="text" disabled value={paymentModalSub.user?.full_name || 'متدرب جديد'} style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', color: '#64748B', display: 'block', marginBottom: '4px' }}>المبلغ المستلم (ج.م)</label>
                  <input type="number" value={paymentForm.subscription_price} onChange={(e) => setPaymentForm({ ...paymentForm, subscription_price: Number(e.target.value) })} style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button type="button" onClick={() => setPaymentModalSub(null)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>إلغاء</button>
                  <button type="submit" style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: '#0F172A', color: '#FFFFFF', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>تأكيد وتفعيل</button>
                </div>
              </form>
            </div>
          </div>
        )}

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
