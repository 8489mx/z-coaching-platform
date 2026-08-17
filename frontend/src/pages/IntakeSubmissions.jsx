import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import WhatsAppModal from '../components/modals/WhatsAppModal';

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
    subscription_package: '3_MONTHS_VIP',
    subscription_price: 2500,
    payment_method: 'INSTAPAY',
    duration_months: 3
  });
  const [whatsappClient, setWhatsappClient] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

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
    try {
      setGeneratingId(submission.id);
      const res = await fetch(`${API_BASE}/api/v1/intake/${submission.id}/generate-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (res.ok) {
        const lookup = submission.user?.client_code || submission.user?.id || '1';
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
    const intakeUrl = `${window.location.protocol}//${window.location.hostname}:5173/intake/form?code=${user.client_code}&phone=${clientPhone}`;

    let cleanPhone = clientPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('01')) cleanPhone = '2' + cleanPhone;

    const message = `أهلاً يا ${clientName}! 🏋️\nلاحظنا أنك اقتربت من إنهاء استمارة اشتراكك في Z Coaching (متبقي خطوات بسيطة فقط).\nاضغط على الرابط التالي لإكمالها وسيبدأ كابتن كيمو بتجهيز وتفعيل خطتك فوراً:\n\n${intakeUrl}\n\nبالتوفيق يا بطل!`;
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

    // Smart # Prefix Search
    if (raw.startsWith('#')) {
      const codeQuery = raw.replace(/^#+/, '').trim();
      if (!codeQuery) return true;
      const clientCode = String(sub.user?.client_code || '').toLowerCase();
      const cleanCode = clientCode.replace(/^client[-_]?/i, '');
      return clientCode === codeQuery || cleanCode === codeQuery || clientCode === `client-${codeQuery}`;
    }

    // Standard Search
    const name = (sub.user?.full_name || sub.answers?.personal?.firstName || '').toLowerCase();
    const phone = (sub.user?.phone_number || sub.answers?.personal?.phone || '').toLowerCase();
    const code = String(sub.user?.client_code || '').toLowerCase();
    return name.includes(raw) || phone.includes(raw) || code.includes(raw);
  });

  const inProgressCount = submissions.filter(s => s.status === 'IN_PROGRESS' || ((s.progress_percent || 100) < 100 && s.status !== 'APPROVED')).length;
  const pendingCount = submissions.filter(s => s.status === 'PENDING_COACH_REVIEW').length;
  const paidCount = submissions.filter(s => s.status === 'PAYMENT_CONFIRMED').length;
  const draftCount = submissions.filter(s => s.status === 'DRAFT_GENERATED').length;
  const approvedCount = submissions.filter(s => s.status === 'APPROVED').length;

  return (
    <AdminLayout searchTerm={searchTerm} onSearchChange={setSearchTerm} searchPlaceholder="بحث في استمارات العملاء بالاسم، الهاتف أو الكود...">
      <div className="theme-body">
        <div className="container-fluid">

          {/* Page Header (Consistent with Dashboard) */}
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h4 className="fw-bold text-dark mb-0" style={{ letterSpacing: '-0.3px', fontSize: '1.25rem' }}>
                  مركز استمارات العملاء ومراجعة الخطط
                </h4>
                <span className="badge rounded-pill fw-bold" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.7rem' }}>
                  Z COACHING V2.0
                </span>
              </div>
              <p className="text-muted small mb-0" style={{ fontSize: '0.8rem' }}>
                متابعة ملء الاستمارات لحظياً، استعادة الاستمارات المتروكة، وتوليد مسودة الخطة الذكية
              </p>
            </div>
            <div className="d-flex gap-2">
              <Link 
                to="/intake/form" 
                target="_blank" 
                className="btn btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-1 shadow-sm text-white" 
                style={{ 
                  height: '34px', 
                  fontSize: '0.8rem',
                  background: '#261c6a',
                  border: 'none',
                  boxShadow: '0 3px 10px rgba(38, 28, 106, 0.28)'
                }}
              >
                <i className="ti ti-external-link fs-6"></i> 
                <span>فتح رابط الاستمارة العامة</span>
              </Link>
            </div>
          </div>

          {/* 5 KPI Stat Cards (Exact Universal Design) */}
          <div className="row row-cols-xxl-5 row-cols-md-3 row-cols-sm-2 g-3 mb-3">
            {/* 1. In Progress */}
            <div className="col">
              <div className="card border-0 bg-white h-100 shadow-sm" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#f8fafc', color: '#64748b', fontSize: '0.68rem', border: '1px solid #e2e8f0' }}>
                      جارية
                    </span>
                    <div className="d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#f1f5f9', color: '#64748b' }}>
                      <i className="ti ti-pencil fs-6"></i>
                    </div>
                  </div>
                  <div>
                    <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>{inProgressCount}</h3>
                    <p className="text-muted small mb-0 fw-medium" style={{ fontSize: '0.76rem' }}>قيد التعبئة</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Pending Coach Review */}
            <div className="col">
              <div className="card border-0 bg-white h-100 shadow-sm" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#fffbeb', color: '#d97706', fontSize: '0.68rem', border: '1px solid #fde68a' }}>
                      مكتملة 100%
                    </span>
                    <div className="d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fffbeb', color: '#d97706' }}>
                      <i className="ti ti-clock fs-6"></i>
                    </div>
                  </div>
                  <div>
                    <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>{pendingCount}</h3>
                    <p className="text-muted small mb-0 fw-medium" style={{ fontSize: '0.76rem' }}>بانتظار الاعتماد</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Paid */}
            <div className="col">
              <div className="card border-0 bg-white h-100 shadow-sm" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.68rem', border: '1px solid #a7f3d0' }}>
                      InstaPay
                    </span>
                    <div className="d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#ecfdf5', color: '#059669' }}>
                      <i className="ti ti-credit-card fs-6"></i>
                    </div>
                  </div>
                  <div>
                    <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>{paidCount}</h3>
                    <p className="text-muted small mb-0 fw-medium" style={{ fontSize: '0.76rem' }}>مؤكد الدفع</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Draft Generated */}
            <div className="col">
              <div className="card border-0 bg-white h-100 shadow-sm" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#f5f3ff', color: '#261c6a', fontSize: '0.68rem', border: '1px solid #ddd6fe' }}>
                      تخصيص الكابتن
                    </span>
                    <div className="d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#f5f3ff', color: '#261c6a' }}>
                      <i className="ti ti-sparkles fs-6"></i>
                    </div>
                  </div>
                  <div>
                    <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>{draftCount}</h3>
                    <p className="text-muted small mb-0 fw-medium" style={{ fontSize: '0.76rem' }}>مسودات جاهزة</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Approved & Active */}
            <div className="col">
              <div className="card border-0 bg-white h-100 shadow-sm" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#f5f3ff', color: '#261c6a', fontSize: '0.68rem', border: '1px solid #ddd6fe' }}>
                      منشورة ومفعلة
                    </span>
                    <div className="d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#f5f3ff', color: '#261c6a' }}>
                      <i className="ti ti-circle-check fs-6"></i>
                    </div>
                  </div>
                  <div>
                    <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>{approvedCount}</h3>
                    <p className="text-muted small mb-0 fw-medium" style={{ fontSize: '0.76rem' }}>خطط معتمدة</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Pills (Quiet Luxury Style) */}
          <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
            {[
              { id: 'ALL', label: `الكل (${submissions.length})` },
              { id: 'IN_PROGRESS', label: `قيد التعبئة (${inProgressCount})` },
              { id: 'PENDING', label: `بانتظار الاعتماد (${pendingCount})` },
              { id: 'PAID', label: `مؤكد الدفع (${paidCount})` },
              { id: 'DRAFT', label: `مسودات جاهزة (${draftCount})` },
              { id: 'APPROVED', label: `معتمد ومنشور (${approvedCount})` }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`btn btn-sm rounded-pill px-3 fw-bold transition-all ${filter === f.id ? 'text-white shadow-xs' : 'bg-white text-dark border'}`}
                style={{
                  background: filter === f.id ? '#261c6a' : '#ffffff',
                  borderColor: filter === f.id ? '#261c6a' : '#e2e8f0',
                  fontSize: '0.8rem',
                  height: '34px',
                  whiteSpace: 'nowrap'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Submissions Table */}
          <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div className="card-body p-4">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="border-0 rounded-start">كود العميل</th>
                      <th className="border-0">اسم المتدرب</th>
                      <th className="border-0">رقم الهاتف</th>
                      <th className="border-0">الباقة والمبلغ</th>
                      <th className="border-0">حالة الدفع</th>
                      <th className="border-0">حالة الاستمارة</th>
                      <th className="border-0 rounded-end text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="text-center py-5 text-muted small">
                          <span className="spinner-border spinner-border-sm me-2 text-primary" role="status"></span>
                          جاري تحميل الاستمارات...
                        </td>
                      </tr>
                    ) : filteredSubmissions.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4 text-muted small">
                          لا توجد استمارات واردة تطابق هذا الفلتر.
                        </td>
                      </tr>
                    ) : (
                      filteredSubmissions.map((sub) => {
                        const user = sub.user || {};
                        const clientName = user.full_name || `${sub.answers?.personal?.firstName || ''} ${sub.answers?.personal?.lastName || ''}`.trim() || `متدرب ${sub.id}`;
                        const clientPhone = user.phone_number || sub.answers?.personal?.phone || '-';
                        const isGenerating = generatingId === sub.id;
                        const progress = sub.progress_percent || (sub.status === 'APPROVED' ? 100 : 70);
                        const isAbandoned = (sub.status === 'IN_PROGRESS' || progress < 100) && sub.status !== 'APPROVED';

                        return (
                          <tr key={sub.id}>
                            <td>
                              <span className="badge bg-light text-secondary border px-2 py-1 font-monospace" style={{ fontSize: '0.75rem' }}>
                                {user.client_code || sub.id}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '34px', height: '34px', fontSize: '0.82rem', background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe' }}>
                                  {(clientName || 'U')[0]}
                                </div>
                                <span className="fw-bold text-dark" style={{ fontSize: '0.88rem' }}>{clientName}</span>
                              </div>
                            </td>
                            <td>
                              <span className="text-muted" dir="ltr" style={{ fontSize: '0.8rem' }}>{clientPhone}</span>
                            </td>
                            <td>
                              <div>
                                <span className="fw-semibold text-dark d-block" style={{ fontSize: '0.82rem' }}>
                                  {user.subscription_package || 'باقة 3 شهور VIP'}
                                </span>
                                <small className="text-muted" style={{ fontSize: '0.76rem' }}>
                                  {user.subscription_price || 2500} ج.م
                                </small>
                              </div>
                            </td>
                            <td>
                              {user.payment_status === 'PAID' ? (
                                <span className="badge bg-light text-success border px-2 py-1 rounded-pill fw-semibold" style={{ fontSize: '0.75rem' }}>
                                  <i className="ti ti-point-filled me-1"></i> مدفوع ({user.payment_method || 'InstaPay'})
                                </span>
                              ) : (
                                <span className="badge bg-light text-warning border px-2 py-1 rounded-pill fw-semibold" style={{ fontSize: '0.75rem' }}>
                                  <i className="ti ti-clock me-1"></i> بانتظار الدفع
                                </span>
                              )}
                            </td>
                            <td>
                              {isAbandoned ? (
                                <div>
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span className="badge bg-light text-muted border px-2 py-0" style={{ fontSize: '0.7rem' }}>
                                      قيد التعبئة ({progress}%)
                                    </span>
                                  </div>
                                  <div className="progress" style={{ height: '4px', width: '120px', background: '#f1f5f9' }}>
                                    <div className="progress-bar bg-warning" style={{ width: `${progress}%` }}></div>
                                  </div>
                                </div>
                              ) : sub.status === 'PENDING_COACH_REVIEW' ? (
                                <span className="badge bg-light text-warning border px-2 py-1 rounded-pill fw-semibold" style={{ fontSize: '0.75rem' }}>
                                  <i className="ti ti-clock-pause me-1"></i> 100% بانتظار الاعتماد
                                </span>
                              ) : sub.status === 'PAYMENT_CONFIRMED' ? (
                                <span className="badge bg-light text-info border px-2 py-1 rounded-pill fw-semibold" style={{ fontSize: '0.75rem' }}>
                                  تم تأكيد الدفع
                                </span>
                              ) : sub.status === 'DRAFT_GENERATED' ? (
                                <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.75rem' }}>
                                  مسودة جاهزة
                                </span>
                              ) : (
                                <span className="badge bg-light text-success border px-2 py-1 rounded-pill fw-semibold" style={{ fontSize: '0.75rem' }}>
                                  <i className="ti ti-point-filled me-1"></i> معتمد ومنشور
                                </span>
                              )}
                            </td>
                            <td className="text-center">
                              <div className="d-flex align-items-center justify-content-center gap-2">
                                
                                {/* If Abandoned, Show WhatsApp Nudge Button */}
                                {isAbandoned && (
                                  <button
                                    type="button"
                                    className="btn btn-sm rounded-pill px-2 py-1 fw-bold shadow-xs d-flex align-items-center gap-1"
                                    style={{ fontSize: '0.76rem', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}
                                    onClick={() => handleSendNudge(sub)}
                                    title="إرسال تذكير عبر الواتساب لإكمال الاستمارة"
                                  >
                                    <i className="ti ti-brand-whatsapp fs-6 text-success"></i>
                                    <span>تذكير إكمال</span>
                                  </button>
                                )}

                                {/* View Answers Modal */}
                                <button
                                  type="button"
                                  className="btn btn-sm rounded-pill px-2 py-1 fw-semibold bg-white border"
                                  style={{ fontSize: '0.76rem', color: '#475569', height: '30px' }}
                                  onClick={() => setSelectedAnswers({ sub, answers: sub.answers })}
                                  title="عرض إجابات الاستمارة وتدقيق الأمان"
                                >
                                  <i className="ti ti-eye me-1"></i> إجابات
                                </button>

                                {/* Payment Confirmation Modal */}
                                <button
                                  type="button"
                                  className="btn btn-sm rounded-pill px-2 py-1 fw-semibold bg-white border"
                                  style={{ fontSize: '0.76rem', color: '#059669', height: '30px' }}
                                  onClick={() => {
                                    setPaymentModalSub(sub);
                                    setPaymentForm({
                                      subscription_package: user.subscription_package || '3_MONTHS_VIP',
                                      subscription_price: user.subscription_price || 2500,
                                      payment_method: user.payment_method || 'INSTAPAY',
                                      duration_months: 3
                                    });
                                  }}
                                  title="تأكيد الدفع والباقة"
                                >
                                  <i className="ti ti-wallet me-1"></i> الدفع
                                </button>

                                {/* Generate Draft / Edit */}
                                {sub.status !== 'APPROVED' ? (
                                  <button
                                    type="button"
                                    className="btn btn-sm rounded-pill px-3 py-1 fw-bold text-white shadow-xs d-flex align-items-center gap-1"
                                    disabled={isGenerating}
                                    onClick={() => handleGenerateDraft(sub)}
                                    style={{ fontSize: '0.76rem', background: '#261c6a', border: 'none', height: '30px' }}
                                  >
                                    {isGenerating ? (
                                      <span className="spinner-border spinner-border-sm"></span>
                                    ) : (
                                      <><i className="ti ti-sparkles"></i> {sub.status === 'DRAFT_GENERATED' ? 'تعديل المسودة' : 'توليد ومراجعة'}</>
                                    )}
                                  </button>
                                ) : (
                                  <Link
                                    to={`/coach/editor?user_id=${user.client_code || user.id}`}
                                    className="btn btn-sm rounded-pill px-3 py-1 fw-semibold shadow-xs"
                                    style={{ fontSize: '0.76rem', background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', height: '30px' }}
                                  >
                                    <i className="ti ti-edit me-1"></i> تعديل الخطة
                                  </Link>
                                )}

                                {/* WhatsApp CTA */}
                                <button
                                  type="button"
                                  className="btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center transition-all bg-white border"
                                  style={{ width: '30px', height: '30px', borderColor: '#e2e8f0', color: '#16a34a' }}
                                  onClick={() => setWhatsappClient({
                                    full_name: clientName,
                                    client_code: user.client_code || sub.id,
                                    phone_number: clientPhone
                                  })}
                                  title="مراسلة سريعة عبر الواتساب"
                                >
                                  <i className="ti ti-brand-whatsapp fs-6"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Answers Audit Modal */}
      {selectedAnswers && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }} dir="rtl">
              <div className="modal-header border-bottom p-4 bg-white d-flex justify-content-between align-items-center" style={{ borderColor: '#f1f5f9' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px', background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe' }}>
                    <i className="ti ti-clipboard-list fs-5"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark mb-0" style={{ fontSize: '1.05rem' }}>بيانات استمارة المتدرب</h5>
                    <small className="text-muted" style={{ fontSize: '0.78rem' }}>مراجعة إجابات التقييم الشامل والأمان الحركي</small>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setSelectedAnswers(null)} 
                  className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '34px', height: '34px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}
                  title="إغلاق"
                >
                  <i className="ti ti-x fs-6"></i>
                </button>
              </div>
              <div className="modal-body p-4 bg-white" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <pre className="bg-light p-3 rounded-3 text-dark small" style={{ direction: 'ltr', textAlign: 'left', fontSize: '0.8rem' }}>
                  {JSON.stringify(selectedAnswers.answers, null, 2)}
                </pre>
              </div>
              <div className="modal-footer bg-light border-top p-3 d-flex justify-content-end" style={{ borderColor: '#f1f5f9' }}>
                <button type="button" className="btn btn-light btn-sm rounded-pill px-4 border text-dark" style={{ height: '36px' }} onClick={() => setSelectedAnswers(null)}>
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {paymentModalSub && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }} dir="rtl">
              <div className="modal-header border-bottom p-4 bg-white d-flex justify-content-between align-items-center" style={{ borderColor: '#f1f5f9' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                    <i className="ti ti-wallet fs-5"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark mb-0" style={{ fontSize: '1.05rem' }}>تأكيد دفع الاشتراك</h5>
                    <small className="text-muted" style={{ fontSize: '0.78rem' }}>تفعيل باقة المشترك والبدء في تصميم الخطة</small>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setPaymentModalSub(null)} 
                  className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '34px', height: '34px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}
                  title="إغلاق"
                >
                  <i className="ti ti-x fs-6"></i>
                </button>
              </div>
              <form onSubmit={handleVerifyPayment}>
                <div className="modal-body p-4 bg-white">
                  <div className="mb-3">
                    <label className="form-label fw-bold text-dark small">نوع الباقة</label>
                    <select 
                      className="form-select"
                      style={{ height: '38px', borderRadius: '10px', fontSize: '0.82rem' }}
                      value={paymentForm.subscription_package}
                      onChange={(e) => setPaymentForm({ ...paymentForm, subscription_package: e.target.value })}
                    >
                      <option value="ELITE_3_PLUS_1">باقة إيليت (3 شهور + 1 شهر مجاناً)</option>
                      <option value="MAX_3_PLUS_1">باقة ماكس VIP (3 شهور + 1 شهر مجاناً)</option>
                      <option value="1_MONTH">باقة شهر واحد</option>
                      <option value="3_MONTHS_VIP">باقة 3 شهور VIP</option>
                      <option value="6_MONTHS">باقة 6 شهور</option>
                      <option value="12_MONTHS">باقة سنة كاملة</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold text-dark small">المبلغ المدفوع (ج.م)</label>
                    <input 
                      type="number"
                      className="form-control"
                      style={{ height: '38px', borderRadius: '10px', fontSize: '0.82rem' }}
                      value={paymentForm.subscription_price}
                      onChange={(e) => setPaymentForm({ ...paymentForm, subscription_price: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label fw-bold text-dark small">طريقة الدفع</label>
                    <select 
                      className="form-select"
                      style={{ height: '38px', borderRadius: '10px', fontSize: '0.82rem' }}
                      value={paymentForm.payment_method}
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                    >
                      <option value="INSTAPAY">انستاباي (InstaPay)</option>
                      <option value="VODAFONE_CASH">فودافون كاش (Vodafone Cash)</option>
                      <option value="CREDIT_CARD">بطاقة بنكية / فيزا</option>
                      <option value="CASH">نقداً في الجيم</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer bg-light border-top p-3 d-flex justify-content-between" style={{ borderColor: '#f1f5f9' }}>
                  <button type="button" className="btn btn-light btn-sm rounded-pill px-4 border text-dark" style={{ height: '36px' }} onClick={() => setPaymentModalSub(null)}>
                    إلغاء
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm rounded-pill px-4 fw-bold" style={{ height: '36px' }}>
                    تأكيد وتفعيل الاشتراك 
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Hub Modal */}
      <WhatsAppModal 
        client={whatsappClient}
        onClose={() => setWhatsappClient(null)}
      />
    </AdminLayout>
  );
}
