import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import WhatsAppModal from '../components/modals/WhatsAppModal';

export default function Customers() {
  const [phone, setPhone] = useState('');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newlyCreated, setNewlyCreated] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // WhatsApp Hub State
  const [whatsappModalClient, setWhatsappModalClient] = useState(null);

  // Live Search
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/clients`);
      const data = await res.json();
      if (data.clients) {
        setClients(data.clients);
      }
    } catch (e) {
      console.error('fetchClients error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!phone) return;

    try {
      const res = await fetch(`${API_BASE}/api/v1/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phone.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setNewlyCreated(data.client);
        setPhone('');
        fetchClients();
      } else {
        alert(data.error || 'حدث خطأ أثناء إنشاء المشترك');
      }
    } catch (e) {
      alert('خطأ في الاتصال بالخادم');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

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

          {/* Quick Stats Row */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: '16px' }}>
                <div className="card-body p-4 d-flex align-items-center gap-3">
                  <div className="p-3 bg-primary-subtle text-primary rounded-circle">
                    <i className="ti ti-users fs-3"></i>
                  </div>
                  <div>
                    <h3 className="fw-bold mb-0 text-dark">{clients.length}</h3>
                    <small className="text-muted fw-semibold">إجمالي المشتركين المسجلين</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: '16px' }}>
                <div className="card-body p-4 d-flex align-items-center gap-3">
                  <div className="p-3 bg-success-subtle text-success rounded-circle">
                    <i className="ti ti-activity fs-3"></i>
                  </div>
                  <div>
                    <h3 className="fw-bold mb-0 text-dark">{clients.filter(c => c.has_active_program).length}</h3>
                    <small className="text-muted fw-semibold">مشتركين لديهم خطط نشطة</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: '16px' }}>
                <div className="card-body p-4 d-flex align-items-center gap-3">
                  <div className="p-3 bg-warning-subtle text-warning rounded-circle">
                    <i className="ti ti-clock-plus fs-3"></i>
                  </div>
                  <div>
                    <h3 className="fw-bold mb-0 text-dark">{clients.filter(c => !c.has_active_program).length}</h3>
                    <small className="text-muted fw-semibold">بانتظار ملء الاستمارة</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Generate New Client */}
          <div className="card border-0 shadow-sm bg-white mb-4" style={{ borderRadius: '18px' }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="p-2 bg-primary-subtle text-primary rounded-circle">
                  <i className="ti ti-user-plus fs-4"></i>
                </div>
                <div>
                  <h5 className="fw-bold text-dark mb-0">توليد حساب متدرب جديد وكود اشتراك</h5>
                  <small className="text-muted">أدخل رقم هاتف العميل وسيتم إنشاء حسابه وإصدار كود الدخول ورابط الاستمارة فوراً</small>
                </div>
              </div>

              <form onSubmit={handleCreateClient} className="row g-3 align-items-end">
                <div className="col-md-6 col-lg-5">
                  <label className="form-label fw-bold text-dark small">رقم هاتف المشترك (WhatsApp):</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-0"><i className="ti ti-phone text-muted"></i></span>
                    <input 
                      type="text" 
                      className="form-control bg-light border-0 py-2" 
                      placeholder="مثال: 01001234567" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
                <div className="col-md-4 col-lg-3">
                  <button type="submit" className="btn btn-primary w-100 py-2 rounded-pill fw-bold shadow-sm">
                    <i className="ti ti-sparkles me-1"></i> توليد كود المشترك
                  </button>
                </div>
              </form>

              {/* Newly Created Client Badge & Links */}
              {newlyCreated && (
                <div className="mt-4 p-3 rounded-3" style={{ backgroundColor: '#ecfdf5', borderRight: '4px solid #10b981' }}>
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                      <h6 className="fw-bold text-success mb-1">
                        <i className="ti ti-circle-check me-1"></i> تم إنشاء حساب المتدرب بنجاح!
                      </h6>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="badge bg-white text-dark border px-2 py-1">الكود: <strong>{newlyCreated.client_code}</strong></span>
                        <span className="badge bg-white text-dark border px-2 py-1">الهاتف: <strong>{newlyCreated.phone_number}</strong></span>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button 
                        type="button"
                        className="btn btn-sm btn-outline-success rounded-pill px-3 fw-bold"
                        onClick={() => copyToClipboard(`${window.location.origin}/intake/form?code=${newlyCreated.client_code}&phone=${newlyCreated.phone_number}`)}
                      >
                        <i className="ti ti-copy me-1"></i> {copySuccess ? 'تم النسخ!' : 'نسخ رابط الاستمارة'}
                      </button>
                      <button 
                        type="button"
                        className="btn btn-sm btn-success rounded-pill px-3 fw-bold"
                        onClick={() => setWhatsappModalClient(newlyCreated)}
                      >
                        <i className="ti ti-brand-whatsapp me-1"></i> إرسال واتساب
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Master Clients Table */}
          <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: '18px' }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                  <h5 className="fw-bold text-dark mb-1">
                    <i className="ti ti-address-book text-primary me-2"></i> سجل العملاء والمشتركين ({filteredClients.length})
                  </h5>
                  <p className="text-muted small mb-0">جميع المتدربين المسجلين وروابط استماراتهم وخططهم</p>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="border-0 rounded-start">كود المشترك</th>
                      <th className="border-0">اسم المتدرب</th>
                      <th className="border-0">رقم الهاتف</th>
                      <th className="border-0">حالة الخطة</th>
                      <th className="border-0 rounded-end text-center">إجراءات سريعة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4">
                          <div className="spinner-border text-primary" role="status"></div>
                          <p className="mt-2 text-muted small">جاري تحميل بيانات المشتركين...</p>
                        </td>
                      </tr>
                    ) : filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted">
                          لا يوجد عملاء مطابقين للبحث.
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
                            {c.has_active_program ? (
                              <span className="badge bg-success-subtle text-success px-2 py-1 rounded-pill fw-bold">
                                <i className="ti ti-check me-1"></i> تم توليد الخطة
                              </span>
                            ) : (
                              <span className="badge bg-warning-subtle text-warning px-2 py-1 rounded-pill fw-bold">
                                بانتظار الاستمارة
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="d-flex align-items-center justify-content-center gap-1">
                              {c.has_active_program && (
                                <Link 
                                  to={`/user-dashboard?user_id=${c.client_code || c.id}`}
                                  className="btn btn-outline-primary btn-sm rounded-pill px-3 py-1 fw-semibold"
                                  style={{ fontSize: '0.82rem' }}
                                >
                                  عرض الخطة
                                </Link>
                              )}
                              <button 
                                type="button"
                                className="btn btn-sm btn-success rounded-pill px-2 py-1 text-white shadow-sm"
                                onClick={() => setWhatsappModalClient(c)}
                                title="إرسال عبر WhatsApp"
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

      {/* WhatsApp Modal */}
      <WhatsAppModal 
        client={whatsappModalClient} 
        onClose={() => setWhatsappModalClient(null)} 
      />
    </AdminLayout>
  );
}
