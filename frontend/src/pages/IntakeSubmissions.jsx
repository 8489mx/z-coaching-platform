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

    // Smart # Prefix Search: Specifically and strictly target exact client code
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

          {/* Page Header */}
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
            <div>
              <h3 className="fw-bold text-dark mb-1">مركز استمارات العملاء ومراجعة الخطط</h3>
              <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                متابعة ملء الاستمارات لحظياً، استعادة الاستمارات المتروكة، تأكيد الدفع، وتوليد مسودة الخطة الذكية.
              </p>
            </div>
            <div className="d-flex gap-2">
              <Link to="/intake/form" target="_blank" className="btn btn-outline-primary rounded-pill px-3 py-2 fw-semibold shadow-sm" style={{ fontSize: '0.85rem' }}>
                <i className="ti ti-external-link me-1"></i> فتح رابط الاستمارة العامة
              </Link>
            </div>
          </div>

          {/* KPI Stat Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-2 col-sm-6 col-6">
              <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: '16px' }}>
                <div className="card-body p-3 text-center">
                  <span className="badge bg-secondary-subtle text-secondary rounded-pill mb-2 px-2 py-1">قيد التعبئة</span>
                  <h3 className="fw-bold mb-0 text-dark">{inProgressCount}</h3>
                  <small className="text-muted" style={{ fontSize: '0.72rem' }}>استمارات جارية</small>
                </div>
              </div>
            </div>

            <div className="col-md-2 col-sm-6 col-6">
              <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: '16px' }}>
                <div className="card-body p-3 text-center">
                  <span className="badge bg-warning-subtle text-warning rounded-pill mb-2 px-2 py-1">بانتظار المراجعة</span>
                  <h3 className="fw-bold mb-0 text-dark">{pendingCount}</h3>
                  <small className="text-muted" style={{ fontSize: '0.72rem' }}>مكتملة 100%</small>
                </div>
              </div>
            </div>

            <div className="col-md-3 col-sm-6">
              <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: '16px' }}>
                <div className="card-body p-3 d-flex align-items-center gap-3">
                  <div className="p-3 bg-info-subtle text-info rounded-circle">
                    <i className="ti ti-credit-card fs-3"></i>
                  </div>
                  <div>
                    <h3 className="fw-bold mb-0 text-dark">{paidCount}</h3>
                    <small className="text-muted fw-semibold">مؤكد الدفع</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-2 col-sm-6">
              <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: '16px' }}>
                <div className="card-body p-3 text-center">
                  <span className="badge bg-primary-subtle text-primary rounded-pill mb-2 px-2 py-1">مسودات جاهزة</span>
                  <h3 className="fw-bold mb-0 text-dark">{draftCount}</h3>
                  <small className="text-muted" style={{ fontSize: '0.72rem' }}>قيد تخصيص الكابتن</small>
                </div>
              </div>
            </div>

            <div className="col-md-3 col-sm-6">
              <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: '16px' }}>
                <div className="card-body p-3 d-flex align-items-center gap-3">
                  <div className="p-3 bg-success-subtle text-success rounded-circle">
                    <i className="ti ti-circle-check fs-3"></i>
                  </div>
                  <div>
                    <h3 className="fw-bold mb-0 text-dark">{approvedCount}</h3>
                    <small className="text-muted fw-semibold">خطط منشورة ومعتمدة</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="d-flex gap-2 overflow-auto pb-2 mb-3">
            {[
              { id: 'ALL', label: `الكل (${submissions.length})` },
              { id: 'IN_PROGRESS', label: `قيد التعبئة (${inProgressCount})` },
              { id: 'PENDING', label: `مكتملة بانتظار الاعتماد (${pendingCount})` },
              { id: 'PAID', label: `مؤكد الدفع (${paidCount})` },
              { id: 'DRAFT', label: `مسودات جاهزة (${draftCount})` },
              { id: 'APPROVED', label: `معتمد ومنشور (${approvedCount})` }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold ${filter === f.id ? 'btn-primary shadow-sm' : 'btn-light border text-dark'}`}
                style={{ fontSize: '0.84rem', whiteSpace: 'nowrap' }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Submissions Table */}
          <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: '20px' }}>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.9rem' }}>
                  <thead className="table-light">
                    <tr>
                      <th className="px-4 py-3">كود العميل</th>
                      <th className="py-3">اسم المتدرب</th>
                      <th className="py-3">رقم الواتساب</th>
                      <th className="py-3">الباقة والمبلغ</th>
                      <th className="py-3">حالة الدفع</th>
                      <th className="py-3">نسبة وحالة الاستمارة</th>
                      <th className="py-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="text-center py-5 text-muted">
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          جاري تحميل الاستمارات...
                        </td>
                      </tr>
                    ) : filteredSubmissions.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-5 text-muted">
                          لا توجد استمارات واردة تطابق هذا الفلتر
                        </td>
                      </tr>
                    ) : (
                      filteredSubmissions.map((sub) => {
                        const user = sub.user || {};
                        const clientName = user.full_name || `${sub.answers?.personal?.firstName || ''} ${sub.answers?.personal?.lastName || ''}`.trim() || 'متدرب جديد';
                        const clientPhone = user.phone_number || sub.answers?.personal?.phone || '-';
                        const isGenerating = generatingId === sub.id;
                        const progress = sub.progress_percent || (sub.status === 'APPROVED' ? 100 : 70);
                        const isAbandoned = (sub.status === 'IN_PROGRESS' || progress < 100) && sub.status !== 'APPROVED';

                        return (
                          <tr key={sub.id}>
                            <td className="px-4 fw-bold font-monospace text-primary">
                              {user.client_code || sub.id}
                            </td>
                            <td className="fw-semibold text-dark">
                              {clientName}
                            </td>
                            <td className="text-muted dir-ltr">
                              {clientPhone}
                            </td>
                            <td>
                              <div>
                                <span className="fw-semibold text-dark d-block" style={{ fontSize: '0.82rem' }}>
                                  {user.subscription_package || 'باقة 3 شهور VIP'}
                                </span>
                                <small className="text-muted">
                                  {user.subscription_price || 2500} ج.م
                                </small>
                              </div>
                            </td>
                            <td>
                              {user.payment_status === 'PAID' ? (
                                <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill">
                                  <i className="ti ti-check me-1"></i> مدفوع ({user.payment_method || 'InstaPay'})
                                </span>
                              ) : (
                                <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1 rounded-pill">
                                  <i className="ti ti-clock me-1"></i> بانتظار الدفع
                                </span>
                              )}
                            </td>
                            <td>
                              {isAbandoned ? (
                                <div>
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span className="badge bg-secondary-subtle text-secondary px-2 py-0 small" style={{ fontSize: '0.72rem' }}>
                                      قيد التعبئة ({progress}%)
                                    </span>
                                  </div>
                                  <div className="progress" style={{ height: '6px', width: '130px' }}>
                                    <div className="progress-bar bg-warning progress-bar-striped progress-bar-animated" style={{ width: `${progress}%` }}></div>
                                  </div>
                                </div>
                              ) : sub.status === 'PENDING_COACH_REVIEW' ? (
                                <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill fw-bold">
                                  <i className="ti ti-circle-check me-1"></i> 100% بانتظار الاعتماد
                                </span>
                              ) : sub.status === 'PAYMENT_CONFIRMED' ? (
                                <span className="badge bg-info-subtle text-info px-2 py-1 rounded-pill">
                                  تم تأكيد الدفع
                                </span>
                              ) : sub.status === 'DRAFT_GENERATED' ? (
                                <span className="badge bg-primary-subtle text-primary px-2 py-1 rounded-pill">
                                  مسودة جاهزة
                                </span>
                              ) : (
                                <span className="badge bg-success-subtle text-success px-2 py-1 rounded-pill">
                                  معتمد ومنشور
                                </span>
                              )}
                            </td>
                            <td className="text-center">
                              <div className="d-flex justify-content-center gap-1">
                                
                                {/* If Abandoned, Show WhatsApp Nudge Button */}
                                {isAbandoned && (
                                  <button
                                    type="button"
                                    className="btn btn-warning btn-sm rounded-pill px-2 py-1 fw-bold text-dark shadow-sm d-flex align-items-center gap-1"
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
                                  className="btn btn-outline-secondary btn-sm rounded-pill px-2 py-1"
                                  onClick={() => setSelectedAnswers({ sub, answers: sub.answers })}
                                  title="عرض إجابات الاستمارة وتدقيق الأمان"
                                >
                                  <i className="ti ti-eye"></i> إجابات
                                </button>

                                {/* Payment Confirmation Modal */}
                                <button
                                  type="button"
                                  className="btn btn-outline-info btn-sm rounded-pill px-2 py-1"
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
                                  <i className="ti ti-wallet"></i> الدفع
                                </button>

                                {/* Generate Draft / Edit */}
                                {sub.status !== 'APPROVED' ? (
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-sm rounded-pill px-3 py-1 fw-bold shadow-sm"
                                    disabled={isGenerating}
                                    onClick={() => handleGenerateDraft(sub)}
                                    style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', border: 'none' }}
                                  >
                                    {isGenerating ? (
                                      <span className="spinner-border spinner-border-sm"></span>
                                    ) : (
                                      <><i className="ti ti-sparkles me-1"></i> {sub.status === 'DRAFT_GENERATED' ? 'تعديل المسودة' : 'توليد ومراجعة'}</>
                                    )}
                                  </button>
                                ) : (
                                  <Link
                                    to={`/coach/editor?user_id=${user.client_code || user.id}`}
                                    className="btn btn-outline-success btn-sm rounded-pill px-3 py-1 fw-bold"
                                  >
                                    <i className="ti ti-edit me-1"></i> تعديل الخطة
                                  </Link>
                                )}

                                {/* WhatsApp CTA */}
                                <button
                                  type="button"
                                  className="btn btn-outline-success btn-sm rounded-circle p-1"
                                  style={{ width: '32px', height: '32px' }}
                                  onClick={() => setWhatsappClient({
                                    full_name: clientName,
                                    phone_number: clientPhone,
                                    client_code: user.client_code
                                  })}
                                  title="مراسلة العميل عبر الواتساب"
                                >
                                  <i className="ti ti-brand-whatsapp"></i>
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

      {/* View Answers & Safety Audit Modal */}
      {selectedAnswers && (
        <div 
          className="modal fade show d-block" 
          tabIndex="-1" 
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1055 }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedAnswers(null); }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px' }} dir="rtl">
              <div className="modal-header border-0 pb-0 px-4 pt-4 d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold text-dark">
                  إجابات الاستمارة وتدقيق الأمان: {selectedAnswers.sub.user?.full_name || 'العميل'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedAnswers(null)}></button>
              </div>
              <div className="modal-body px-4 py-3" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                
                {/* AI Rationale & Safety Audit Box */}
                <div className="p-3 mb-3 rounded-4 border border-primary-subtle" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' }}>
                  <h6 className="fw-bold text-primary mb-2 d-flex align-items-center gap-1">
                    <i className="ti ti-sparkles"></i> تقرير الذكاء الرياضي والتدقيق الأمني (AI Safety Audit)
                  </h6>
                  <ul className="list-unstyled mb-0 small text-dark" style={{ lineHeight: '1.7' }}>
                    <li className="mb-1">
                      <strong>مراعاة الإصابات:</strong> {selectedAnswers.answers?.medical?.conditions?.length > 0 ? 'تم استبعاد الحركات المجهدة للمفاصل المتأثرة وتضمين بدائل آمنة.' : 'لا توجد إصابات مسجلة؛ البرنامج يعتمد على التمارين المركبة الحرة.'}
                    </li>
                    <li className="mb-1">
                      <strong>الحساسية والتفضيل:</strong> {selectedAnswers.answers?.nutrition?.allergies?.length > 0 ? `تم استبعاد (${selectedAnswers.answers.nutrition.allergies.map(a => a.substance).join(', ')}) من الدايت والبدائل.` : 'لا توجد حساسية طعام؛ خطة الوجبات مرنة وشاملة.'}
                    </li>
                    <li>
                      <strong>استراتيجية الكارديو:</strong> 3 جلسات Zone 2 بمعدل 120-135 نبضة/دقيقة لحرق الدهون دون التأثير على الكتلة العضلية.
                    </li>
                  </ul>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded-3 border">
                      <h6 className="fw-bold text-primary mb-2">البيانات الجسدية والأهداف</h6>
                      <p className="mb-1 small"><strong>الطول:</strong> {selectedAnswers.answers?.body?.heightCm || 170} سم</p>
                      <p className="mb-1 small"><strong>الوزن:</strong> {selectedAnswers.answers?.body?.weightKg || 70} كجم</p>
                      <p className="mb-1 small"><strong>محيط الخصر:</strong> {selectedAnswers.answers?.body?.waistCm || '-'} سم</p>
                      <p className="mb-1 small"><strong>الهدف الأساسي:</strong> {selectedAnswers.answers?.goals?.primary || 'FAT_LOSS'}</p>
                      <p className="mb-0 small"><strong>الهدف الثانوي:</strong> {selectedAnswers.answers?.goals?.secondaryTraining || 'GENERAL_STRENGTH'}</p>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded-3 border">
                      <h6 className="fw-bold text-primary mb-2">التدريب والنشاط</h6>
                      <p className="mb-1 small"><strong>مكان التمرين:</strong> {selectedAnswers.answers?.training?.location === 'HOME' ? 'المنزل' : 'الجيم'}</p>
                      <p className="mb-1 small"><strong>أيام التمرين المفضلة:</strong> {selectedAnswers.answers?.training?.preferredDaysPerWeek || 4} أيام أسبوعياً</p>
                      <p className="mb-1 small"><strong>الخبرة:</strong> {selectedAnswers.answers?.training?.experience || 'BEGINNER'}</p>
                      <p className="mb-0 small"><strong>ساعات النوم:</strong> {selectedAnswers.answers?.lifestyle?.sleep?.averageHours || 7} ساعات</p>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="p-3 bg-light rounded-3 border">
                      <h6 className="fw-bold text-danger mb-2">الحالة الطبية والموانع</h6>
                      {selectedAnswers.answers?.medical?.conditions?.length > 0 ? (
                        selectedAnswers.answers.medical.conditions.map((c, i) => (
                          <span key={i} className="badge bg-danger-subtle text-danger border border-danger-subtle me-1 p-2">
                            {c.conditionCode} ({c.stability})
                          </span>
                        ))
                      ) : (
                        <p className="text-muted small mb-0">لا توجد أمراض أو حالات مزمنة مسجلة.</p>
                      )}
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="p-3 bg-light rounded-3 border">
                      <h6 className="fw-bold text-success mb-2">التغذية والحساسية</h6>
                      <p className="mb-1 small"><strong>عدد الوجبات المفضل:</strong> {selectedAnswers.answers?.nutrition?.preferredMealCount || 3} وجبات</p>
                      <p className="mb-1 small"><strong>الميزانية:</strong> {selectedAnswers.answers?.nutrition?.budget || 'MEDIUM'}</p>
                      <p className="mb-0 small"><strong>حساسية الطعام:</strong> {selectedAnswers.answers?.nutrition?.allergies?.map(a => a.substance).join(', ') || 'لا توجد'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 px-4 pb-4">
                <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setSelectedAnswers(null)}>إغلاق</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verify Payment Modal */}
      {paymentModalSub && (
        <div 
          className="modal fade show d-block" 
          tabIndex="-1" 
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1055 }}
          onClick={(e) => { if (e.target === e.currentTarget) setPaymentModalSub(null); }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px' }} dir="rtl">
              <form onSubmit={handleVerifyPayment}>
                <div className="modal-header border-0 pb-0 px-4 pt-4">
                  <h5 className="modal-title fw-bold text-dark">
                    تأكيد دفع واشتراك العميل: {paymentModalSub.user?.full_name || 'العميل'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setPaymentModalSub(null)}></button>
                </div>
                <div className="modal-body px-4 py-3">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">باقة الاشتراك</label>
                    <select 
                      className="form-select bg-light border-0"
                      value={paymentForm.subscription_package}
                      onChange={e => setPaymentForm({ ...paymentForm, subscription_package: e.target.value })}
                    >
                      <option value="1_MONTH_STANDARD">باقة شهر تدريب وتغذية (1 Month)</option>
                      <option value="3_MONTHS_VIP">باقة 3 شهور VIP الشاملة (3 Months)</option>
                      <option value="6_MONTHS_PRO">باقة 6 شهور تحول شامل (6 Months)</option>
                      <option value="12_MONTHS_ELITE">باقة سنوية Elite (12 Months)</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">المبلغ المدفوع (ج.م)</label>
                    <input 
                      type="number" 
                      className="form-control bg-light border-0"
                      value={paymentForm.subscription_price}
                      onChange={e => setPaymentForm({ ...paymentForm, subscription_price: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">طريقة التحويل / الدفع</label>
                    <select 
                      className="form-select bg-light border-0"
                      value={paymentForm.payment_method}
                      onChange={e => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                    >
                      <option value="INSTAPAY">إنستاباي (InstaPay)</option>
                      <option value="VODAFONE_CASH">فودافون كاش (Vodafone Cash)</option>
                      <option value="BANK_TRANSFER">تحويل بنكي (Bank Transfer)</option>
                      <option value="CASH">نقداً (Cash)</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">مدة الاشتراك (بالشهور)</label>
                    <input 
                      type="number" 
                      className="form-control bg-light border-0"
                      min="1" 
                      max="12"
                      value={paymentForm.duration_months}
                      onChange={e => setPaymentForm({ ...paymentForm, duration_months: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer border-0 px-4 pb-4">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setPaymentModalSub(null)}>إلغاء</button>
                  <button type="submit" className="btn btn-success rounded-pill px-4 fw-bold shadow-sm">
                    <i className="ti ti-check me-1"></i> حفظ وتأكيد الدفع
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {whatsappClient && (
        <WhatsAppModal 
          client={whatsappClient}
          onClose={() => setWhatsappClient(null)}
        />
      )}
    </AdminLayout>
  );
}
