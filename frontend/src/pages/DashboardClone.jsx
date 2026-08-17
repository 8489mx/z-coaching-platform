import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import ExecutiveKpis from '../components/dashboard/ExecutiveKpis';
import WhatsAppModal from '../components/modals/WhatsAppModal';
import ApproveCheckinModal from '../components/modals/ApproveCheckinModal';

export function formatSubscriptionPackage(pkg) {
  if (!pkg) return 'باقة إيليت (3 شهور + 1 مجاناً)';
  const p = String(pkg).toUpperCase();
  if (p.includes('MAX')) return 'باقة ماكس (3 شهور + 1 مجاناً)';
  if (p.includes('ELITE')) return 'باقة إيليت (3 شهور + 1 مجاناً)';
  if (p.includes('3') || p.includes('VIP')) return 'باقة إيليت (3 شهور + 1 مجاناً)';
  if (p.includes('6')) return 'باقة 6 شهور';
  if (p.includes('12') || p.includes('YEAR')) return 'باقة سنة كاملة';
  if (p.includes('1') || p.includes('MONTH')) return 'باقة إيليت (3 شهور + 1 مجاناً)';
  return pkg;
}

export default function DashboardClone() {
  const [clients, setClients] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [subscriptionsOverview, setSubscriptionsOverview] = useState({
    active_subscriptions: 5,
    expiring_soon: 1,
    expired: 0,
    total_monthly_revenue: 4500,
    clients: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedCheckin, setSelectedCheckin] = useState(null);
  const [coachNotes, setCoachNotes] = useState('');
  const [approving, setApproving] = useState(false);

  // WhatsApp Modal State
  const [whatsappModalClient, setWhatsappModalClient] = useState(null);

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [clientsRes, checkinsRes, subsRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/clients`),
        fetch(`${API_BASE}/api/v1/programs/checkin/pending`),
        fetch(`${API_BASE}/api/v1/subscriptions/overview`)
      ]);

      const clientsData = await clientsRes.json();
      const checkinsData = await checkinsRes.json();
      const subsData = await subsRes.json();

      if (clientsData.clients) setClients(clientsData.clients);
      if (checkinsData.checkins) setCheckins(checkinsData.checkins);
      if (subsData) setSubscriptionsOverview(subsData);
    } catch (e) {
      console.error('fetchDashboardData error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCheckin = async () => {
    if (!selectedCheckin) return;
    try {
      setApproving(true);
      const res = await fetch(`${API_BASE}/api/v1/programs/checkin/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkin_id: selectedCheckin.id,
          coach_notes: coachNotes || 'تمت مراجعة واعتماد المتابعة وتحديث الخطة بنجاح.'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل اعتماد المتابعة');

      alert('تم اعتماد المتابعة وتحديث خطة المتدرب بنجاح في MariaDB z!');
      setSelectedCheckin(null);
      setCoachNotes('');
      fetchDashboardData();
    } catch (err) {
      alert('خطأ: ' + err.message);
    } finally {
      setApproving(false);
    }
  };

  const overdueClients = clients.filter(c => c.phone_number && c.id !== 2);
  const expiringClients = (subscriptionsOverview.clients || []).filter(c => c.status === 'EXPIRING_SOON' || c.status === 'EXPIRED');

  const filteredClients = clients.filter(c => {
    if (!searchTerm.trim()) return true;
    const raw = searchTerm.trim().toLowerCase();

    // Smart # Prefix Search: Specifically and strictly target exact client code
    if (raw.startsWith('#')) {
      const codeQuery = raw.replace(/^#+/, '').trim();
      if (!codeQuery) return true;
      const displayedCode = String(c.client_code || c.id || '').trim().toLowerCase();
      const cleanCode = displayedCode.replace(/^client[-_]?/i, '');
      return displayedCode === codeQuery || cleanCode === codeQuery || displayedCode === `client-${codeQuery}`;
    }

    // Standard Universal Search
    const name = (c.full_name || '').toLowerCase();
    const phone = (c.phone_number || '').toLowerCase();
    const code = String(c.client_code || c.id).toLowerCase();
    const email = (c.email || '').toLowerCase();
    return name.includes(raw) || phone.includes(raw) || code.includes(raw) || email.includes(raw);
  });

  return (
    <AdminLayout searchTerm={searchTerm} onSearchChange={setSearchTerm}>
      <div className="theme-body">
        <div className="container-fluid">
          
          {/* Header Action Bar */}
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
            <div>
              <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2" style={{ letterSpacing: '-0.3px' }}>
                <span>لوحة القيادة المركزية</span>
                <span 
                  className="badge rounded-pill px-3 py-1 fw-semibold" 
                  style={{ fontSize: '0.72rem', background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe' }}
                >
                  Z Coaching V2.0
                </span>
              </h4>
              <p className="text-muted small mb-0">
                مرحباً بك يا كابتن — ملخص المشتركين والمتابعات لليوم
              </p>
            </div>
            
            <div className="d-flex gap-2 flex-wrap">
              <Link 
                to="/master-settings?tab=packages" 
                className="btn btn-sm rounded-pill px-3 py-2 fw-semibold shadow-xs" 
                style={{ fontSize: '0.84rem', background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe' }}
              >
                <i className="ti ti-crown me-1"></i> إدارة الباقات والأسعار
              </Link>
              <Link 
                to="/intake/submissions" 
                className="btn btn-sm rounded-pill px-3 py-2 fw-semibold shadow-xs" 
                style={{ fontSize: '0.84rem', background: '#ffffff', color: '#261c6a', border: '1px solid #c4b5fd' }}
              >
                <i className="ti ti-clipboard-list me-1"></i> استمارات العملاء
              </Link>
              <Link 
                to="/calculator" 
                className="btn btn-light btn-sm rounded-pill px-3 py-2 fw-semibold border" 
                style={{ fontSize: '0.84rem', color: '#475569' }}
              >
                <i className="ti ti-calculator me-1"></i> حاسبة الماكروز
              </Link>
              <Link 
                to="/exercises" 
                className="btn btn-light btn-sm rounded-pill px-3 py-2 fw-semibold border" 
                style={{ fontSize: '0.84rem', color: '#475569' }}
              >
                <i className="ti ti-barbell me-1"></i> مكتبة التمارين
              </Link>
            </div>
          </div>

          {/* Top 4 KPI Cards */}
          <ExecutiveKpis 
            clientsCount={clients.length}
            overdueCount={overdueClients.length}
            expiringCount={subscriptionsOverview.expiring_soon || 0}
            monthlyRevenue={subscriptionsOverview.total_monthly_revenue || 0}
          />

          {/* Master 2-Column Grid */}
          <div className="row g-4 mb-4">
            
            {/* Main Column (8 cols): Master Active Clients */}
            <div className="col-lg-8 col-12 z-animate-in">
              <div className="z-glass-card h-100">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                    <div>
                      <h6 className="fw-bold text-dark mb-1">
                        <i className="ti ti-users-group me-2" style={{ color: '#261c6a' }}></i> قائمة المشتركين الفعّالين
                      </h6>
                      <p className="text-muted small mb-0">إدارة الخطط، الحسابات، ومتابعة الالتزام</p>
                    </div>
                    <Link 
                      to="/customers" 
                      className="btn btn-light btn-sm rounded-pill px-3 fw-semibold border" 
                      style={{ fontSize: '0.78rem', color: '#475569' }}
                    >
                      عرض الكل <i className="ti ti-arrow-left ms-1"></i>
                    </Link>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr className="text-secondary small fw-semibold">
                          <th className="border-0 rounded-start">المتدرب</th>
                          <th className="border-0">كود المشترك</th>
                          <th className="border-0">الخطة</th>
                          <th className="border-0">الحالة</th>
                          <th className="border-0 rounded-end text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan="5" className="text-center py-4 text-muted">جاري تحميل البيانات...</td>
                          </tr>
                        ) : filteredClients.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center py-5">
                              <div className="d-flex flex-column align-items-center justify-content-center">
                                <div className="rounded-circle d-flex align-items-center justify-content-center mb-2" style={{ width: '48px', height: '48px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
                                  <i className="ti ti-users fs-3"></i>
                                </div>
                                <p className="text-muted small mb-1 fw-bold">لا يوجد متدربين مسجلين حالياً في المنظومة.</p>
                                <small className="text-muted">اضغط على «عميل جديد» لإنشاء أول مشترك وتوليد كوده.</small>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredClients.map((c) => (
                            <tr key={c.id}>
                              <td>
                                <div className="d-flex align-items-center gap-3">
                                  <div 
                                    className="rounded-circle d-flex align-items-center justify-content-center fw-bold" 
                                    style={{ width: '34px', height: '34px', fontSize: '0.82rem', background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe' }}
                                  >
                                    {(c.full_name || 'U')[0]}
                                  </div>
                                  <div>
                                    <div className="fw-bold text-dark" style={{ fontSize: '0.88rem' }}>{c.full_name || `المتدرب ${c.id}`}</div>
                                    <small style={{ fontSize: '0.76rem', color: '#64748b' }}>{c.phone_number || '-'}</small>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="badge bg-light text-secondary border px-2 py-1 font-monospace" style={{ fontSize: '0.75rem' }}>
                                  {c.client_code || `CLIENT-${c.id}`}
                                </span>
                              </td>
                              <td>
                                <span className="text-dark small fw-medium">
                                  {formatSubscriptionPackage(c.subscription_package)}
                                </span>
                              </td>
                              <td>
                                <span className="badge bg-light text-success border px-2 py-1 rounded-pill fw-semibold" style={{ fontSize: '0.75rem' }}>
                                  <i className="ti ti-point-filled me-1"></i> نشط
                                </span>
                              </td>
                              <td className="text-center">
                                <div className="d-flex align-items-center justify-content-center gap-2">
                                  <Link 
                                    to={`/user-dashboard?user_id=${c.client_code || c.id}`}
                                    className="btn btn-sm rounded-pill px-3 py-1 fw-semibold shadow-xs"
                                    style={{ fontSize: '0.78rem', background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe' }}
                                    title="عرض خطة المتدرب"
                                  >
                                    <i className="ti ti-eye me-1"></i> الخطة
                                  </Link>
                                  <button 
                                    type="button"
                                    onClick={() => setWhatsappModalClient(c)}
                                    className="btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center transition-all bg-white border"
                                    style={{ 
                                      width: '32px', 
                                      height: '32px', 
                                      borderColor: '#e2e8f0', 
                                      color: '#16a34a' 
                                    }}
                                    title="مراسلة واتساب"
                                  >
                                    <i className="ti ti-brand-whatsapp fs-6"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Column (4 cols): Priority Alerts & Check-ins */}
            <div className="col-lg-4 col-12">
              <div className="d-flex flex-column gap-3">
                
                {/* 1. Priority Alerts Widget (Exact Aesthetic Twin of Weekly Widget) */}
                <div className="z-glass-card">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2" style={{ fontSize: '0.9rem' }}>
                        <i className="ti ti-bell-ringing fs-5" style={{ color: '#dc2626' }}></i>
                        <span>تنبيهات المتابعة المتأخرة</span>
                      </h6>
                      <span 
                        className="badge rounded-pill small fw-bold px-2 py-1"
                        style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2' }}
                      >
                        {overdueClients.length} متأخرين
                      </span>
                    </div>

                    {overdueClients.length === 0 ? (
                      <div className="p-3 text-center bg-light rounded-3 text-muted small">
                        <i className="ti ti-check text-success fs-5 d-block mb-1"></i>
                        جميع المتدربين ملتزمون بالمتابعة!
                      </div>
                    ) : (
                      <div className="p-3 rounded-3 border" style={{ background: '#fbfaff', borderColor: '#ede9fe' }}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <strong className="text-dark small">{overdueClients[0].full_name || `المتدرب ${overdueClients[0].client_code}`}</strong>
                          <span className="badge bg-white text-danger border small">متأخر يومان</span>
                        </div>
                        <small className="d-block text-muted mb-3" style={{ fontSize: '0.78rem' }}>
                          آخر متابعة: <strong>منذ 9 أيام</strong> | الهاتف: <span className="font-monospace text-dark">{overdueClients[0].phone_number || '-'}</span>
                        </small>
                        <button 
                          type="button"
                          onClick={() => setWhatsappModalClient(overdueClients[0])}
                          className="btn btn-sm w-100 rounded-pill fw-bold text-white shadow-sm d-flex align-items-center justify-content-center gap-2"
                          style={{ 
                            height: '38px',
                            fontSize: '0.84rem',
                            background: '#261c6a', 
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(38, 28, 106, 0.25)'
                          }}
                        >
                          <i className="ti ti-brand-whatsapp fs-6 text-light"></i>
                          <span>إرسال تذكير عبر واتساب</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Pending Check-in Review Widget (Exact Symmetric Dimensions) */}
                <div className="z-glass-card">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2" style={{ fontSize: '0.9rem' }}>
                        <i className="ti ti-clipboard-check fs-5" style={{ color: '#261c6a' }}></i>
                        <span>المتابعات الأسبوعية</span>
                      </h6>
                      <span 
                        className="badge rounded-pill small fw-bold px-2 py-1"
                        style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe' }}
                      >
                        {checkins.length} معلقة
                      </span>
                    </div>

                    {checkins.length === 0 ? (
                      <div className="p-3 text-center bg-light rounded-3 text-muted small">
                        <i className="ti ti-check text-success fs-5 d-block mb-1"></i>
                        جميع المتابعات معتمدة ومحدثة!
                      </div>
                    ) : (
                      <div className="p-3 rounded-3 border" style={{ background: '#fbfaff', borderColor: '#ede9fe' }}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <strong className="text-dark small">{checkins[0].full_name || checkins[0].client_code}</strong>
                          <span className="badge bg-white text-dark border small">الأسبوع {checkins[0].week_number || 1}</span>
                        </div>
                        <small className="d-block text-muted mb-3" style={{ fontSize: '0.78rem' }}>
                          متوسط الوزن: <strong>{checkins[0].average_weight || '84.4'} كجم</strong> | الالتزام: <strong>{checkins[0].adherence || '95'}%</strong>
                        </small>
                        <button 
                          type="button"
                          onClick={() => { setSelectedCheckin(checkins[0]); setCoachNotes(''); }}
                          className="btn btn-sm w-100 rounded-pill fw-bold text-white shadow-sm d-flex align-items-center justify-content-center gap-2"
                          style={{ 
                            height: '38px',
                            fontSize: '0.84rem',
                            background: '#261c6a', 
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(38, 28, 106, 0.25)'
                          }}
                        >
                          <i className="ti ti-check fs-6 text-light"></i>
                          <span>مراجعة واعتماد التكيف</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. PR Milestones Widget */}
                <div className="z-glass-card">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2" style={{ fontSize: '0.9rem' }}>
                        <i className="ti ti-trophy fs-5" style={{ color: '#261c6a' }}></i>
                        <span>إنجازات وأرقام قياسية (PRs)</span>
                      </h6>
                      <span className="badge bg-light text-secondary border px-2 py-1 rounded-pill small">اليوم</span>
                    </div>
                    <div className="p-3 text-center bg-light rounded-3 text-muted small">
                      <i className="ti ti-trophy text-muted fs-5 d-block mb-1"></i>
                      لا توجد أرقام قياسية جديدة مسجلة اليوم.
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>

      {/* WhatsApp Modal */}
      <WhatsAppModal 
        isOpen={!!whatsappModalClient}
        onClose={() => setWhatsappModalClient(null)}
        client={whatsappModalClient}
        scenario="checkin_reminder"
      />

      {/* Approve Checkin Modal */}
      <ApproveCheckinModal 
        checkin={selectedCheckin}
        onClose={() => setSelectedCheckin(null)}
        coachNotes={coachNotes}
        setCoachNotes={setCoachNotes}
        onApprove={handleApproveCheckin}
        approving={approving}
      />
    </AdminLayout>
  );
}
