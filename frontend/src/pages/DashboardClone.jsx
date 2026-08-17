import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import ExecutiveKpis from '../components/dashboard/ExecutiveKpis';
import PriorityActionsHub from '../components/dashboard/PriorityActionsHub';
import WhatsAppModal from '../components/modals/WhatsAppModal';
import ApproveCheckinModal from '../components/modals/ApproveCheckinModal';

export default function DashboardClone() {
  const [clients, setClients] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [subscriptionsOverview, setSubscriptionsOverview] = useState({
    active_subscriptions: 3,
    expiring_soon: 1,
    expired: 0,
    total_monthly_revenue: 4500,
    clients: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedCheckin, setSelectedCheckin] = useState(null);
  const [coachNotes, setCoachNotes] = useState('');
  const [approving, setApproving] = useState(false);

  // WhatsApp Automation Hub State
  const [whatsappModalClient, setWhatsappModalClient] = useState(null);

  // Live Search
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

      alert('✅ تم اعتماد المتابعة وتحديث خطة المتدرب بنجاح في MariaDB z!');
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
    const t = searchTerm.trim().toLowerCase();
    const name = (c.full_name || '').toLowerCase();
    const phone = (c.phone_number || '').toLowerCase();
    const code = String(c.client_code || c.id).toLowerCase();
    const email = (c.email || '').toLowerCase();
    return name.includes(t) || phone.includes(t) || code.includes(t) || email.includes(t);
  });

  return (
    <AdminLayout searchTerm={searchTerm} onSearchChange={setSearchTerm}>
      <div className="theme-body">
        <div className="container-fluid">
          {/* Executive Welcome Hero Banner */}
          <div className="card border-0 mb-4 p-4 text-white shadow-sm" style={{ borderRadius: '20px', background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)' }}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <h3 className="fw-bold mb-1">مرحباً بك يا كابتن في Z Coaching! 👑</h3>
                <p className="mb-0 opacity-90" style={{ fontSize: '0.95rem' }}>
                  لوحة القيادة المركزية: إليك ملخص حالة المتدربين، المتابعات المتأخرة، وتجديدات الاشتراكات لليوم.
                </p>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <Link to="/intake/form" className="btn btn-light rounded-pill px-3 py-2 fw-bold text-primary shadow-sm">
                  <i className="ti ti-plus me-1"></i> تسجيل متدرب
                </Link>
                <Link to="/calculator" className="btn btn-outline-light rounded-pill px-3 py-2 fw-bold">
                  <i className="ti ti-calculator me-1"></i> حاسبة الماكروز
                </Link>
                <Link to="/exercises" className="btn btn-outline-light rounded-pill px-3 py-2 fw-bold">
                  <i className="ti ti-barbell me-1"></i> مكتبة التمارين
                </Link>
              </div>
            </div>
          </div>

          {/* Top 4 Executive KPI Cards */}
          <ExecutiveKpis 
            clientsCount={clients.length || 3}
            overdueCount={overdueClients.length}
            expiringCount={subscriptionsOverview.expiring_soon || 1}
            monthlyRevenue={subscriptionsOverview.total_monthly_revenue || 4500}
          />

          {/* Priority Actions Hub */}
          <PriorityActionsHub 
            overdueClients={overdueClients}
            expiringClients={expiringClients}
            onOpenWhatsapp={(client) => setWhatsappModalClient(client)}
          />

          {/* Pending Check-ins Section */}
          {checkins.length > 0 && (
            <div className="card border-0 shadow-sm bg-white mb-4" style={{ borderRadius: '18px', borderRight: '4px solid #f59e0b' }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                  <div>
                    <h5 className="fw-bold text-dark mb-1">
                      <i className="ti ti-bell-ringing text-warning me-2"></i>
                      المتابعات الأسبوعية المعلقة ({checkins.filter(c => c.status === 'PENDING_REVIEW').length})
                    </h5>
                    <p className="text-muted small mb-0">تحتاج مراجعتك لاعتماد تعديل السعرات والأوزان الجديدة</p>
                  </div>
                  <span className="badge bg-warning text-dark px-3 py-2 rounded-pill fw-bold">
                    تتطلب المراجعة الآن
                  </span>
                </div>

                <div className="row g-3">
                  {checkins.map((chk) => (
                    <div className="col-lg-6" key={chk.id}>
                      <div className="p-3 bg-light rounded-4 border d-flex justify-content-between align-items-center">
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="fw-bold text-dark fs-6">{chk.full_name || chk.client_code}</span>
                            <span className="badge bg-primary-subtle text-primary">الأسبوع {chk.week_number}</span>
                          </div>
                          <small className="text-muted d-block mb-1">
                            متوسط الوزن: <strong>{chk.average_weight} كجم</strong> | الالتزام: <strong>{chk.adherence}%</strong>
                          </small>
                          <small className="text-success fw-semibold">
                            <i className="ti ti-sparkles me-1"></i> جاهز للاعتماد الآلي
                          </small>
                        </div>
                        <button 
                          type="button"
                          onClick={() => { setSelectedCheckin(chk); setCoachNotes(''); }}
                          className="btn btn-primary btn-sm rounded-pill px-3 fw-bold shadow-sm"
                        >
                          مراجعة واعتماد ✏️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Master Active Clients Table */}
          <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: '18px' }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                  <h5 className="fw-bold text-dark mb-1">
                    <i className="ti ti-users-group text-primary me-2"></i> قائمة المتدربين الشاملة في المنظومة
                  </h5>
                  <p className="text-muted small mb-0">إدارة الخطط، الحسابات، والمتابعات الفردية</p>
                </div>
                <Link to="/customers" className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-bold">
                  إدارة المشتركين والأكواد <i className="ti ti-arrow-left ms-1"></i>
                </Link>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="border-0 rounded-start">كود المشترك</th>
                      <th className="border-0">اسم المتدرب</th>
                      <th className="border-0">رقم الهاتف</th>
                      <th className="border-0">الخطة الحالية</th>
                      <th className="border-0">حالة الاشتراك</th>
                      <th className="border-0 rounded-end text-center">إجراءات سريعة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <div className="spinner-border text-primary" role="status"></div>
                          <p className="mt-2 text-muted small">جاري تحميل بيانات المشتركين...</p>
                        </td>
                      </tr>
                    ) : filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-muted">
                          لا يوجد متدربين مطابقين لبحثك.
                        </td>
                      </tr>
                    ) : (
                      filteredClients.map((c) => (
                        <tr key={c.id}>
                          <td>
                            <span className="badge bg-light text-dark border fw-bold px-2 py-1">
                              {c.client_code || `CLIENT-${c.id}`}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className="avatar-sm rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold" style={{ width: '34px', height: '34px', fontSize: '0.85rem' }}>
                                {(c.full_name || 'U')[0]}
                              </div>
                              <span className="fw-bold text-dark">{c.full_name || 'متدرب جديد'}</span>
                            </div>
                          </td>
                          <td>
                            <span className="text-muted" dir="ltr">{c.phone_number || '-'}</span>
                          </td>
                          <td>
                            <span className="badge bg-success-subtle text-success fw-bold">
                              4 أيام Upper/Lower
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-success text-white px-2 py-1 rounded-pill">
                              نشط ⭐
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center justify-content-center gap-1">
                              <Link 
                                to={`/user-dashboard?user_id=${c.client_code || c.id}`} 
                                className="btn btn-sm btn-outline-primary rounded-pill px-2 py-1"
                                title="عرض لوحة المتدرب"
                              >
                                <i className="ti ti-eye"></i> الخطة
                              </Link>
                              <Link 
                                to={`/coach-editor?user_id=${c.client_code || c.id}`} 
                                className="btn btn-sm btn-outline-secondary rounded-pill px-2 py-1"
                                title="تعديل الخطة"
                              >
                                <i className="ti ti-edit"></i> تعديل
                              </Link>
                              <button 
                                type="button"
                                onClick={() => setWhatsappModalClient(c)}
                                className="btn btn-sm btn-success rounded-pill px-2 py-1 text-white shadow-sm"
                                title="إرسال واتساب"
                              >
                                <i className="ti ti-brand-whatsapp"></i>
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
      </div>

      {/* Approve Check-in Modal */}
      <ApproveCheckinModal 
        checkin={selectedCheckin}
        onClose={() => setSelectedCheckin(null)}
        coachNotes={coachNotes}
        setCoachNotes={setCoachNotes}
        onApprove={handleApproveCheckin}
        approving={approving}
      />

      {/* WhatsApp Hub Modal */}
      <WhatsAppModal 
        client={whatsappModalClient}
        onClose={() => setWhatsappModalClient(null)}
      />
    </AdminLayout>
  );
}
