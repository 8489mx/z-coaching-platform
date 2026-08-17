import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

      alert(' تم تجديد الاشتراك بنجاح!');
      fetchSubscriptions();
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء التجديد');
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

  const handleSaveEdit = async () => {
    if (!editClient) return;
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/api/v1/subscriptions/update/${editClient.client_code || editClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تحديث الاشتراك');

      alert(' تم تحديث بيانات الاشتراك بنجاح!');
      setEditClient(null);
      fetchSubscriptions();
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء التحديث');
    } finally {
      setSaving(false);
    }
  };

  const handleSendWhatsAppReminder = (client) => {
    const phone = (client.phone_number || '').replace(/[^0-9]/g, '');
    if (!phone) {
      alert('لا يوجد رقم هاتف مسجل لهذا المشترك');
      return;
    }
    const name = client.full_name || 'بطلنا';
    const message = encodeURIComponent(
      `مرحباً يا ${name}! \nنود تذكيرك بأن اشتراكك في Z Coaching أوشك على الانتهاء.\nلتجديد الاشتراك والاستمرار في تحقيق أهدافك، يرجى التواصل معنا أو تأكيد التجديد.\nبالتوفيق يا بطل! `
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const getPackageLabel = (pkg) => {
    switch (pkg) {
      case '1_MONTH': return 'باقة شهر واحد (1M)';
      case '3_MONTHS': return 'باقة 3 شهور VIP';
      case '6_MONTHS': return 'باقة 6 شهور (6M)';
      case '12_MONTHS': return 'باقة سنة كاملة';
      default: return pkg || 'باقة شهرية';
    }
  };

  const filteredClients = clients.filter(c => {
    if (filter === 'ACTIVE' && c.status !== 'ACTIVE') return false;
    if (filter === 'EXPIRING_SOON' && c.status !== 'EXPIRING_SOON') return false;
    if (filter === 'EXPIRED' && c.status !== 'EXPIRED') return false;

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

    // Standard Search
    const name = (c.full_name || '').toLowerCase();
    const phone = (c.phone_number || '').toLowerCase();
    const code = String(c.client_code || c.id).toLowerCase();
    return name.includes(raw) || phone.includes(raw) || code.includes(raw);
  });

  return (
    <AdminLayout searchTerm={searchTerm} onSearchChange={setSearchTerm}>
      <div className="theme-body">
        <div className="container-fluid">

          {/* 4 Financial Stat Cards (Quiet Luxury Style) */}
          <div className="row g-3 mb-3">
            <div className="col-xl-3 col-sm-6 col-12">
              <div className="card border-0 bg-white h-100 shadow-sm" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#ecfdf5', color: '#059669' }}>
                      <i className="ti ti-wallet fs-6"></i>
                    </div>
                    <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#f8fafc', color: '#059669', fontSize: '0.68rem', border: '1px solid #e2e8f0' }}>
                      شهرياً
                    </span>
                  </div>
                  <div>
                    <h3 className="fw-bold mb-0 text-dark d-flex align-items-baseline gap-1" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>
                      <span>{Number(overview.total_monthly_revenue || 0).toLocaleString()}</span>
                      <span className="fs-6 text-muted fw-normal">ج.م</span>
                    </h3>
                    <p className="text-muted small mb-0 fw-medium" style={{ fontSize: '0.78rem' }}>الدخل الشهري الفعّال</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-sm-6 col-12">
              <div className="card border-0 bg-white h-100 shadow-sm" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#f5f3ff', color: '#261c6a' }}>
                      <i className="ti ti-user-check fs-6"></i>
                    </div>
                    <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#f5f3ff', color: '#261c6a', fontSize: '0.68rem', border: '1px solid #ddd6fe' }}>
                      سارية
                    </span>
                  </div>
                  <div>
                    <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>{overview.active_count}</h3>
                    <p className="text-muted small mb-0 fw-medium" style={{ fontSize: '0.78rem' }}>مشتركين نشطين حالياً</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-sm-6 col-12">
              <div className="card border-0 bg-white h-100 shadow-sm" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fffbeb', color: '#d97706' }}>
                      <i className="ti ti-clock-pause fs-6"></i>
                    </div>
                    <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#fffbeb', color: '#d97706', fontSize: '0.68rem' }}>
                      خلال 7 أيام
                    </span>
                  </div>
                  <div>
                    <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>{overview.expiring_soon_count}</h3>
                    <p className="text-muted small mb-0 fw-medium" style={{ fontSize: '0.78rem' }}>قاربت على الانتهاء</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-sm-6 col-12">
              <div className="card border-0 bg-white h-100 shadow-sm" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626' }}>
                      <i className="ti ti-alert-triangle fs-6"></i>
                    </div>
                    <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.68rem' }}>
                      مطلوب تجديدها
                    </span>
                  </div>
                  <div>
                    <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>{overview.expired_count}</h3>
                    <p className="text-muted small mb-0 fw-medium" style={{ fontSize: '0.78rem' }}>اشتراكات منتهية</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Pills (Quiet Luxury Style) */}
          <div className="d-flex gap-2 mb-3 flex-wrap">
            <button 
              type="button"
              onClick={() => setFilter('ALL')}
              className={`btn btn-sm rounded-pill px-3 fw-bold transition-all ${filter === 'ALL' ? 'text-white shadow-sm' : 'bg-white text-dark border'}`}
              style={{
                background: filter === 'ALL' ? '#261c6a' : '#ffffff',
                borderColor: filter === 'ALL' ? '#261c6a' : '#e2e8f0',
                fontSize: '0.8rem',
                height: '34px'
              }}
            >
              جميع المشتركين ({clients.length})
            </button>
            <button 
              type="button"
              onClick={() => setFilter('ACTIVE')}
              className={`btn btn-sm rounded-pill px-3 fw-bold transition-all ${filter === 'ACTIVE' ? 'text-white shadow-sm' : 'bg-white text-dark border'}`}
              style={{
                background: filter === 'ACTIVE' ? '#261c6a' : '#ffffff',
                borderColor: filter === 'ACTIVE' ? '#261c6a' : '#e2e8f0',
                fontSize: '0.8rem',
                height: '34px'
              }}
            >
              الاشتراكات النشطة ({overview.active_count})
            </button>
            <button 
              type="button"
              onClick={() => setFilter('EXPIRING_SOON')}
              className={`btn btn-sm rounded-pill px-3 fw-bold transition-all ${filter === 'EXPIRING_SOON' ? 'text-white shadow-sm' : 'bg-white text-dark border'}`}
              style={{
                background: filter === 'EXPIRING_SOON' ? '#261c6a' : '#ffffff',
                borderColor: filter === 'EXPIRING_SOON' ? '#261c6a' : '#e2e8f0',
                fontSize: '0.8rem',
                height: '34px'
              }}
            >
              قاربت على الانتهاء ({overview.expiring_soon_count})
            </button>
            <button 
              type="button"
              onClick={() => setFilter('EXPIRED')}
              className={`btn btn-sm rounded-pill px-3 fw-bold transition-all ${filter === 'EXPIRED' ? 'text-white shadow-sm' : 'bg-white text-dark border'}`}
              style={{
                background: filter === 'EXPIRED' ? '#261c6a' : '#ffffff',
                borderColor: filter === 'EXPIRED' ? '#261c6a' : '#e2e8f0',
                fontSize: '0.8rem',
                height: '34px'
              }}
            >
              الاشتراكات المنتهية ({overview.expired_count})
            </button>

            <Link 
              to="/master-settings?tab=packages" 
              className="btn btn-sm rounded-pill px-3 fw-bold ms-auto d-flex align-items-center gap-1 shadow-xs"
              style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.8rem', height: '34px' }}
            >
              <i className="ti ti-crown fs-6"></i>
              <span>تعديل الباقات والأسعار</span>
            </Link>
          </div>

          {/* Subscriptions Table Card */}
          <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div className="card-body p-4">
              <div className="table-responsive">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="text-muted mt-2 small">جاري تحميل بيانات الاشتراكات...</p>
                  </div>
                ) : (
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="border-0 rounded-start">المشترك</th>
                        <th className="border-0">كود العميل</th>
                        <th className="border-0">الباقة والسعر</th>
                        <th className="border-0">تاريخ البداية والانتهاء</th>
                        <th className="border-0">حالة الاشتراك</th>
                        <th className="border-0 rounded-end text-center">إجراءات</th>
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
                                <div className="d-flex align-items-center gap-2">
                                  <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '34px', height: '34px', fontSize: '0.82rem', background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe' }}>
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
                                  {c.client_code}
                                </span>
                              </td>
                              <td>
                                <div className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{getPackageLabel(c.package)}</div>
                                <small className="text-muted" style={{ fontSize: '0.76rem' }}>{c.price} ج.م</small>
                              </td>
                              <td>
                                <div className="small" style={{ fontSize: '0.78rem' }}>من: <span className="text-dark fw-semibold">{c.start_date}</span></div>
                                <div className="small" style={{ fontSize: '0.78rem' }}>إلى: <span className="text-dark fw-semibold">{c.end_date}</span></div>
                              </td>
                              <td>
                                {isExpired ? (
                                  <span className="badge bg-light text-danger border px-2 py-1 rounded-pill fw-semibold" style={{ fontSize: '0.75rem' }}>
                                    <i className="ti ti-x me-1"></i> منتهي ({Math.abs(c.days_remaining)} يوم)
                                  </span>
                                ) : isExpiring ? (
                                  <span className="badge bg-light text-warning border px-2 py-1 rounded-pill fw-semibold" style={{ fontSize: '0.75rem' }}>
                                    <i className="ti ti-clock me-1"></i> متبقي {c.days_remaining} أيام
                                  </span>
                                ) : (
                                  <span className="badge bg-light text-success border px-2 py-1 rounded-pill fw-semibold" style={{ fontSize: '0.75rem' }}>
                                    <i className="ti ti-point-filled me-1"></i> نشط ({c.days_remaining} يوم)
                                  </span>
                                )}
                              </td>
                              <td className="text-center">
                                <div className="d-flex align-items-center justify-content-center gap-2">
                                  <button 
                                    type="button"
                                    onClick={() => handleRenew(c)}
                                    className="btn btn-sm rounded-pill px-3 py-1 fw-semibold shadow-xs"
                                    style={{ fontSize: '0.78rem', background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe' }}
                                    title="تجديد الاشتراك"
                                  >
                                    <i className="ti ti-refresh me-1"></i> تجديد
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => handleOpenEdit(c)}
                                    className="btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center transition-all bg-white border"
                                    style={{ width: '32px', height: '32px', borderColor: '#e2e8f0', color: '#475569' }}
                                    title="تعديل تفاصيل الباقة"
                                  >
                                    <i className="ti ti-edit fs-6"></i>
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => handleSendWhatsAppReminder(c)}
                                    className="btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center transition-all bg-white border"
                                    style={{ width: '32px', height: '32px', borderColor: '#e2e8f0', color: '#16a34a' }}
                                    title="تذكير عبر WhatsApp"
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
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Subscription Modal */}
      <EditSubscriptionModal
        isOpen={!!editClient}
        onClose={() => setEditClient(null)}
        client={editClient}
        editForm={editForm}
        setEditForm={setEditForm}
        onSave={handleSaveEdit}
        saving={saving}
      />
    </AdminLayout>
  );
}
