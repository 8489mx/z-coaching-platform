import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import EditSubscriptionModal from '../components/modals/EditSubscriptionModal';

export default function Subscriptions() {
  const [overview, setOverview] = useState({
    total_monthly_revenue: 0,
    active_count: 0,
    expiring_soon_count: 0,
    expired_count: 0,
    total_clients: 0
  });
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED'
  const [searchTerm, setSearchTerm] = useState('');

  // Modals State
  const [editClient, setEditClient] = useState(null);
  const [editForm, setEditForm] = useState({
    subscription_package: '1_MONTH',
    subscription_price: 1500,
    subscription_start_date: '',
    subscription_end_date: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/subscriptions/overview`);
      const data = await res.json();
      if (data.overview) setOverview(data.overview);
      if (data.clients) setClients(data.clients);
    } catch (e) {
      console.error('fetchSubscriptions error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async (client) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في تجديد اشتراك ${client.full_name || 'المشترك'}؟`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/subscriptions/renew/${client.client_code || client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_code: client.package || '1_MONTH' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تجديد الاشتراك');

      alert('✅ تم تجديد الاشتراك بنجاح!');
      fetchSubscriptions();
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  const handleOpenEdit = (client) => {
    setEditClient(client);
    setEditForm({
      subscription_package: client.package || '1_MONTH',
      subscription_price: client.price || 1500,
      subscription_start_date: client.start_date || '',
      subscription_end_date: client.end_date || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editClient) return;
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/api/v1/subscriptions/update/${editClient.client_code || editClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تحديث بيانات الاشتراك');

      alert('✅ تم تحديث بيانات الاشتراك بنجاح!');
      setEditClient(null);
      fetchSubscriptions();
    } catch (err) {
      alert('خطأ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const sendRenewalWhatsapp = (client) => {
    const phone = (client.phone_number || '').replace(/[^0-9]/g, '');
    const name = client.full_name || 'بطلنا';
    const message = encodeURIComponent(
      `مرحباً يا ${name}! 🏋️‍♂️\nنود تذكيرك بأن اشتراكك في Z Coaching أوشك على الانتهاء.\nلتجديد الاشتراك والاستمرار في تحقيق أهدافك، يرجى التواصل معنا أو تأكيد التجديد.\nبالتوفيق يا بطل! 💪`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const getPackageLabel = (pkg) => {
    switch (pkg) {
      case '1_MONTH': return 'باقة الشهر الواحد (1M)';
      case '3_MONTHS': return 'باقة 3 شهور (3M)';
      case '6_MONTHS': return 'باقة 6 شهور (6M)';
      case '12_MONTHS': return 'باقة السنة (1 Year)';
      default: return pkg || 'باقة شهرية';
    }
  };

  const filteredClients = clients.filter(c => {
    if (filter === 'ACTIVE' && c.status !== 'ACTIVE') return false;
    if (filter === 'EXPIRING_SOON' && c.status !== 'EXPIRING_SOON') return false;
    if (filter === 'EXPIRED' && c.status !== 'EXPIRED') return false;

    if (!searchTerm.trim()) return true;
    const t = searchTerm.trim().toLowerCase();
    const name = (c.full_name || '').toLowerCase();
    const phone = (c.phone_number || '').toLowerCase();
    const code = String(c.client_code || c.id).toLowerCase();
    return name.includes(t) || phone.includes(t) || code.includes(t);
  });

  return (
    <AdminLayout searchTerm={searchTerm} onSearchChange={setSearchTerm}>
      <div className="theme-body">
        <div className="container-fluid">

          {/* 4 Financial Stat Cards */}
          <div className="row row-cols-xxl-4 row-cols-md-2 gy-3 mb-4">
            <div className="col">
              <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: '14px' }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="stat-icon bg-primary-subtle text-primary p-2 rounded-3">
                      <i className="ti ti-cash fs-4"></i>
                    </div>
                    <span className="badge bg-primary-subtle text-primary">شهرياً</span>
                  </div>
                  <h3 className="fw-bold mb-0 text-dark">
                    {Number(overview.total_monthly_revenue || 0).toLocaleString()} <small className="fs-6 text-muted">ج.م</small>
                  </h3>
                  <p className="text-muted small mb-0">إجمالي الدخل الشهري الفعّال</p>
                </div>
              </div>
            </div>

            <div className="col">
              <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: '14px' }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="stat-icon bg-success-subtle text-success p-2 rounded-3">
                      <i className="ti ti-user-check fs-4"></i>
                    </div>
                    <span className="badge bg-success-subtle text-success">اشتراكات سارية</span>
                  </div>
                  <h3 className="fw-bold mb-0 text-dark">{overview.active_count}</h3>
                  <p className="text-muted small mb-0">مشتركين نشطين حالياً</p>
                </div>
              </div>
            </div>

            <div className="col">
              <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: '14px' }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="stat-icon bg-warning-subtle text-warning p-2 rounded-3">
                      <i className="ti ti-clock-pause fs-4"></i>
                    </div>
                    <span className="badge bg-warning-subtle text-warning">أقل من 7 أيام</span>
                  </div>
                  <h3 className="fw-bold mb-0 text-dark">{overview.expiring_soon_count}</h3>
                  <p className="text-muted small mb-0">اشتراكات قاربت على الانتهاء</p>
                </div>
              </div>
            </div>

            <div className="col">
              <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: '14px' }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="stat-icon bg-danger-subtle text-danger p-2 rounded-3">
                      <i className="ti ti-alert-triangle fs-4"></i>
                    </div>
                    <span className="badge bg-danger-subtle text-danger">مطلوب تجديدها</span>
                  </div>
                  <h3 className="fw-bold mb-0 text-dark">{overview.expired_count}</h3>
                  <p className="text-muted small mb-0">اشتراكات منتهية</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="d-flex gap-2 mb-3 flex-wrap">
            <button 
              type="button"
              onClick={() => setFilter('ALL')}
              className={`btn btn-sm rounded-pill px-3 fw-bold ${filter === 'ALL' ? 'btn-primary' : 'btn-white bg-white border'}`}
            >
              جميع المشتركين ({clients.length})
            </button>
            <button 
              type="button"
              onClick={() => setFilter('ACTIVE')}
              className={`btn btn-sm rounded-pill px-3 fw-bold ${filter === 'ACTIVE' ? 'btn-success' : 'btn-white bg-white border'}`}
            >
              الاشتراكات النشطة ({overview.active_count})
            </button>
            <button 
              type="button"
              onClick={() => setFilter('EXPIRING_SOON')}
              className={`btn btn-sm rounded-pill px-3 fw-bold ${filter === 'EXPIRING_SOON' ? 'btn-warning text-dark' : 'btn-white bg-white border'}`}
            >
              قاربت على الانتهاء ({overview.expiring_soon_count})
            </button>
            <button 
              type="button"
              onClick={() => setFilter('EXPIRED')}
              className={`btn btn-sm rounded-pill px-3 fw-bold ${filter === 'EXPIRED' ? 'btn-danger' : 'btn-white bg-white border'}`}
            >
              المنتهية ({overview.expired_count})
            </button>
          </div>

          {/* Subscriptions Table Card */}
          <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: '16px' }}>
            <div className="card-body p-4">
              <div className="table-responsive">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="text-muted mt-2">جاري تحميل بيانات الاشتراكات من MariaDB `z`...</p>
                  </div>
                ) : (
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>المشترك</th>
                        <th>كود العميل</th>
                        <th>الباقة والسعر</th>
                        <th>تاريخ البداية والانتهاء</th>
                        <th>حالة الاشتراك والمتبقي</th>
                        <th className="text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-4 text-muted">
                            لا توجد اشتراكات تطابق الفلتر المحدد.
                          </td>
                        </tr>
                      ) : (
                        filteredClients.map((c) => {
                          const isExpiring = c.status === 'EXPIRING_SOON';
                          const isExpired = c.status === 'EXPIRED';

                          return (
                            <tr key={c.id}>
                              <td>
                                <div className="fw-bold text-dark">{c.full_name || 'مشترك جديد'}</div>
                                <small className="text-muted">{c.phone_number || '-'}</small>
                              </td>
                              <td>
                                <span className="badge bg-primary-subtle text-primary fw-bold px-2 py-1" style={{ borderRadius: '6px' }}>
                                  {c.client_code}
                                </span>
                              </td>
                              <td>
                                <div className="fw-bold text-dark">{getPackageLabel(c.package)}</div>
                                <small className="text-muted">{c.price} ج.م</small>
                              </td>
                              <td>
                                <div className="small">من: <span className="text-dark fw-semibold">{c.start_date}</span></div>
                                <div className="small">إلى: <span className="text-dark fw-semibold">{c.end_date}</span></div>
                              </td>
                              <td>
                                {isExpired ? (
                                  <span className="badge bg-danger-subtle text-danger px-3 py-2 rounded-pill fw-bold">
                                    <i className="ti ti-x me-1"></i> منتهي منذ {Math.abs(c.days_remaining)} يوم
                                  </span>
                                ) : isExpiring ? (
                                  <span className="badge bg-warning-subtle text-warning px-3 py-2 rounded-pill fw-bold">
                                    <i className="ti ti-clock-pause me-1"></i> متبقي {c.days_remaining} أيام
                                  </span>
                                ) : (
                                  <span className="badge bg-success-subtle text-success px-3 py-2 rounded-pill fw-bold">
                                    <i className="ti ti-check me-1"></i> نشط (متبقي {c.days_remaining} يوم)
                                  </span>
                                )}
                              </td>
                              <td className="text-center">
                                <div className="d-flex align-items-center justify-content-center gap-2">
                                  <button 
                                    type="button"
                                    onClick={() => handleRenew(c)}
                                    className="btn btn-outline-success btn-sm rounded-pill px-3 py-1 fw-bold"
                                    title="تجديد الاشتراك للفترة القادمة"
                                  >
                                    <i className="ti ti-refresh me-1"></i> تجديد
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => sendRenewalWhatsapp(c)}
                                    className="btn btn-light btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center"
                                    style={{ width: '32px', height: '32px', border: '1px solid #e2e8f0', color: '#16a34a' }}
                                    title="إرسال تذكير التجديد واتساب"
                                  >
                                    <i className="ti ti-brand-whatsapp"></i>
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => handleOpenEdit(c)}
                                    className="btn btn-light btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center"
                                    style={{ width: '32px', height: '32px', border: '1px solid #e2e8f0' }}
                                    title="تعديل تفاصيل الباقة والتواريخ"
                                  >
                                    <i className="ti ti-edit text-secondary"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Edit Subscription Modal */}
      <EditSubscriptionModal 
        client={editClient}
        onClose={() => setEditClient(null)}
        editForm={editForm}
        setEditForm={setEditForm}
        onSave={handleSaveEdit}
        saving={saving}
      />
    </AdminLayout>
  );
}
