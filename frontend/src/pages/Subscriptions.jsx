import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import NotificationsDropdown from '../components/NotificationsDropdown';

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

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        setEditClient(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3000/api/v1/subscriptions/overview');
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
      const res = await fetch(`http://localhost:3000/api/v1/subscriptions/renew/${client.client_code || client.id}`, {
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
      const res = await fetch(`http://localhost:3000/api/v1/subscriptions/update/${editClient.client_code || editClient.id}`, {
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
    const phoneClean = (client.phone_number || '').replace(/[^0-9]/g, '');
    const name = client.full_name || 'بطل FitNexus';
    const text = `مرحباً يا ${name}! 💳\nنود تذكيرك بقرب موعد تجديد اشتراكك في باقة (${getPackageLabel(client.package)}).\nتاريخ انتهاء الفترة الحالية: ${client.end_date}.\nيسعدنا استمرارك معنا لتحقيق أهدافك القادمة! 💪`;
    window.open(`https://wa.me/${phoneClean}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getPackageLabel = (pkg) => {
    switch (pkg) {
      case '1_MONTH': return 'شهر واحد';
      case '3_MONTHS': return '3 شهور (باقة ربع سنوية)';
      case '6_MONTHS': return '6 شهور (باقة نصف سنوية)';
      case '12_MONTHS': return 'سنة كاملة (باقة سنوية)';
      default: return 'شهر واحد';
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
    const pkg = (c.package || '').toLowerCase();
    return name.includes(t) || phone.includes(t) || code.includes(t) || pkg.includes(t);
  });

  return (
    <div className="codex-wrapper" dir="rtl" style={{ minHeight: '100vh', backgroundColor: '#f6f8fb', fontFamily: 'Cairo, Tajawal, sans-serif' }}>
      {/* 1. Header */}
      <header className="codex-header">
        <div className="header-contian d-flex justify-content-between align-items-center">
          <div className="header-left d-flex align-items-center">
            <div className="input-group" style={{ minWidth: '320px' }}>
              <span className="input-group-text pe-0"><i className="ti ti-search text-muted"></i></span>
              <input 
                type="text" 
                placeholder="بحث لحظي في المشتركين، الباقات، التجديدات..." 
                className="form-control" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="header-right d-flex align-items-center justify-content-end gap-3 pe-2">
            <NotificationsDropdown />

            <Link to="/" className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-semibold">
              <i className="ti ti-arrow-right me-1"></i> لوحة التحكم
            </Link>

            <div className="d-flex align-items-center gap-2 py-1 px-3 bg-light rounded-pill border ms-2">
              <img className="img-fluid rounded-circle border" src="/admin-dashboard_data/logo/z_coaching_logo.jpg" alt="Coach Logo" width="36" height="36" />
              <div className="d-none d-md-block text-end pe-1">
                <span className="fw-bold d-block text-dark lh-1" style={{ fontSize: '0.9rem' }}>الإدارة المالية</span>
                <small className="text-muted" style={{ fontSize: '0.72rem' }}>الاشتراكات والتجديدات</small>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Sidebar (Right Side RTL) */}
      <aside className="codex-sidebar">
        <div 
          className="codex-brand" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            textAlign: 'center', 
            padding: '14px 10px 8px 10px',
            width: '100%',
            border: 'none',
            background: 'transparent'
          }}
        >
          <Link 
            to="/" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              textDecoration: 'none',
              width: '100%',
              margin: '0 auto'
            }}
          >
            <img 
              src="/admin-dashboard_data/logo/z_clean_symbol.jpg?v=2" 
              alt="Z Logo" 
              style={{ 
                height: '76px', 
                width: '76px', 
                objectFit: 'contain', 
                margin: '0 auto',
                display: 'block'
              }} 
            />
            <span 
              style={{ 
                fontSize: '0.92rem', 
                letterSpacing: '4px', 
                fontWeight: '900',
                background: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'block',
                marginTop: '-4px',
                lineHeight: '1.2',
                textAlign: 'center',
                width: '100%'
              }}
            >
              COACHING
            </span>
          </Link>
        </div>

        <div className="codex-menuwrapper custom-scroll" data-simplebar>
          <ul className="codex-menu">
            <li className="menu-item">
              <Link to="/">
                <div className="icon-item"><i className="ti ti-layout-dashboard"></i></div>
                <span>لوحة التحكم الرئيسية</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/user-dashboard">
                <div className="icon-item"><i className="ti ti-user-circle"></i></div>
                <span>واجهة المتدرب</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/progress">
                <div className="icon-item"><i className="ti ti-chart-line"></i></div>
                <span>تطور القياسات والصور</span>
              </Link>
            </li>
            <li className="menu-item active">
              <Link to="/subscriptions">
                <div className="icon-item"><i className="ti ti-credit-card"></i></div>
                <span>الاشتراكات والمالية</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/exercises">
                <div className="icon-item"><i className="ti ti-barbell"></i></div>
                <span>مكتبة التمارين</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/calculator">
                <div className="icon-item"><i className="ti ti-calculator"></i></div>
                <span>حاسبة الماكروز والسعرات</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/customers">
                <div className="icon-item"><i className="ti ti-user-plus"></i></div>
                <span>إدارة المشتركين والأكواد</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/profile">
                <div className="icon-item"><i className="ti ti-settings"></i></div>
                <span>إعدادات وهوية المدرب</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/mobile">
                <div className="icon-item"><i className="ti ti-device-mobile"></i></div>
                <span>تطبيق المتدرب (Mobile)</span>
              </Link>
            </li>
          </ul>
        </div>

        <div className="sidebarpro-sec">
          <img className="img-fluid" src="/admin-dashboard_data/pro-sec.png" alt="pro" />
          <h6 className="mb-1 fw-bold text-black">الإدارة المالية</h6>
          <p className="small text-muted mb-0">تتبع دقيق للإيرادات وتواريخ التجديد</p>
        </div>
      </aside>

      {/* 3. Main Content Workspace */}
      <main className="themebody-wrap">
        <div className="theme-body">
          <div className="container-fluid">
            
            {/* Page Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <div>
                <h4 className="fw-bold text-dark mb-1">إدارة الاشتراكات وتجديدات المشتركين</h4>
                <p className="text-muted small mb-0">متابعة الباقات، تواريخ انتهاء الاشتراك، التجديد الفوري وإرسال تذكيرات الدفع</p>
              </div>
            </div>

            {/* Financial Stat Cards */}
            <div className="row row-cols-xxl-4 row-cols-md-2 gy-3 mb-4">
              <div className="col">
                <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: '14px' }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="stat-icon bg-success-subtle text-success p-2 rounded-3">
                        <i className="ti ti-currency-pound fs-4"></i>
                      </div>
                      <span className="badge bg-success-subtle text-success">الدخل الفعّال</span>
                    </div>
                    <h3 className="fw-bold mb-0 text-dark">{overview.total_monthly_revenue.toLocaleString('ar-EG')} <small className="fs-6 text-muted">ج.م</small></h3>
                    <p className="text-muted small mb-0">إجمالي إيرادات الاشتراكات النشطة</p>
                  </div>
                </div>
              </div>

              <div className="col">
                <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: '14px' }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="stat-icon bg-primary-subtle text-primary p-2 rounded-3">
                        <i className="ti ti-user-check fs-4"></i>
                      </div>
                      <span className="badge bg-primary-subtle text-primary">{overview.active_count} مشترك</span>
                    </div>
                    <h3 className="fw-bold mb-0 text-dark">{overview.active_count}</h3>
                    <p className="text-muted small mb-0">الاشتراكات الفعّالة حالياً</p>
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
                onClick={() => setFilter('ALL')}
                className={`btn btn-sm rounded-pill px-3 fw-bold ${filter === 'ALL' ? 'btn-primary' : 'btn-white bg-white border'}`}
              >
                جميع المشتركين ({clients.length})
              </button>
              <button 
                onClick={() => setFilter('ACTIVE')}
                className={`btn btn-sm rounded-pill px-3 fw-bold ${filter === 'ACTIVE' ? 'btn-success' : 'btn-white bg-white border'}`}
              >
                الاشتراكات النشطة ({overview.active_count})
              </button>
              <button 
                onClick={() => setFilter('EXPIRING_SOON')}
                className={`btn btn-sm rounded-pill px-3 fw-bold ${filter === 'EXPIRING_SOON' ? 'btn-warning text-dark' : 'btn-white bg-white border'}`}
              >
                قاربت على الانتهاء ({overview.expiring_soon_count})
              </button>
              <button 
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
                                      onClick={() => handleRenew(c)}
                                      className="btn btn-outline-success btn-sm rounded-pill px-3 py-1 fw-bold"
                                      title="تجديد الاشتراك للفترة القادمة"
                                    >
                                      <i className="ti ti-refresh me-1"></i> تجديد
                                    </button>
                                    <button 
                                      onClick={() => sendRenewalWhatsapp(c)}
                                      className="btn btn-light btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center"
                                      style={{ width: '32px', height: '32px', border: '1px solid #e2e8f0', color: '#16a34a' }}
                                      title="إرسال تذكير التجديد واتساب"
                                    >
                                      <i className="ti ti-brand-whatsapp"></i>
                                    </button>
                                    <button 
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
      </main>

      {/* 4. Edit Subscription Modal */}
      {editClient && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px' }}>
              <div className="modal-header border-bottom p-4">
                <h5 className="modal-title fw-bold text-dark mb-0">
                  تعديل اشتراك: {editClient.full_name || 'المشترك'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setEditClient(null)}></button>
              </div>

              <form onSubmit={handleSaveEdit}>
                <div className="modal-body p-4">
                  <div className="form-group mb-3">
                    <label className="form-label fw-bold text-dark small">نوع الباقة</label>
                    <select 
                      className="form-select"
                      value={editForm.subscription_package}
                      onChange={(e) => setEditForm({ ...editForm, subscription_package: e.target.value })}
                    >
                      <option value="1_MONTH">شهر واحد (1 Month)</option>
                      <option value="3_MONTHS">3 شهور (3 Months)</option>
                      <option value="6_MONTHS">6 شهور (6 Months)</option>
                      <option value="12_MONTHS">سنة كاملة (1 Year)</option>
                    </select>
                  </div>

                  <div className="form-group mb-3">
                    <label className="form-label fw-bold text-dark small">سعر الاشتراك (ج.م)</label>
                    <input 
                      type="number"
                      className="form-control"
                      value={editForm.subscription_price}
                      onChange={(e) => setEditForm({ ...editForm, subscription_price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-bold text-dark small">تاريخ البدء</label>
                      <input 
                        type="date"
                        className="form-control"
                        value={editForm.subscription_start_date}
                        onChange={(e) => setEditForm({ ...editForm, subscription_start_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold text-dark small">تاريخ الانتهاء</label>
                      <input 
                        type="date"
                        className="form-control"
                        value={editForm.subscription_end_date}
                        onChange={(e) => setEditForm({ ...editForm, subscription_end_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top p-3 d-flex justify-content-between">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setEditClient(null)}>
                    إلغاء
                  </button>
                  <button type="submit" disabled={saving} className="btn btn-primary rounded-pill px-4 fw-bold">
                    {saving ? 'جاري الحفظ...' : 'حفظ التعديلات 💾'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
