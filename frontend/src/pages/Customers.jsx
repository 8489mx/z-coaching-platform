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
    const raw = searchTerm.trim().toLowerCase();

    // Smart # Prefix Search
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

  const activeProgramsCount = clients.filter(c => c.has_active_program).length;
  const pendingIntakeCount = clients.filter(c => !c.has_active_program).length;

  return (
    <AdminLayout searchTerm={searchTerm} onSearchChange={setSearchTerm} searchPlaceholder="بحث في المشتركين بالاسم، الهاتف أو الكود...">
      <div className="theme-body">
        <div className="container-fluid">

          {/* Page Header (Consistent with Dashboard) */}
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h4 className="fw-bold text-dark mb-0" style={{ letterSpacing: '-0.3px', fontSize: '1.25rem' }}>
                  إدارة وسجل المشتركين (Client Hub)
                </h4>
                <span className="badge rounded-pill fw-bold" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.7rem' }}>
                  Z COACHING V2.0
                </span>
              </div>
              <p className="text-muted small mb-0" style={{ fontSize: '0.8rem' }}>
                توليد حسابات المتدربين الجدد، إصدار أكواد الاشتراك، ومتابعة تفعيل الخطط
              </p>
            </div>
            <span className="badge rounded-pill px-3 py-2 fw-semibold" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.78rem' }}>
              إجمالي المسجلين: {clients.length} مشترك
            </span>
          </div>

          {/* 3 Universal KPI Stat Cards */}
          <div className="row g-3 mb-3">
            {/* 1. Total Registered Clients */}
            <div className="col-md-4 col-sm-6 col-12">
              <div className="card border-0 bg-white h-100 shadow-sm" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#f5f3ff', color: '#261c6a', fontSize: '0.68rem', border: '1px solid #ddd6fe' }}>
                      إجمالي المسجلين
                    </span>
                    <div className="d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#f5f3ff', color: '#261c6a' }}>
                      <i className="ti ti-users fs-6"></i>
                    </div>
                  </div>
                  <div>
                    <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>{clients.length}</h3>
                    <p className="text-muted small mb-0 fw-medium" style={{ fontSize: '0.76rem' }}>إجمالي المشتركين المسجلين في المنظومة</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Active Program Clients */}
            <div className="col-md-4 col-sm-6 col-12">
              <div className="card border-0 bg-white h-100 shadow-sm" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.68rem', border: '1px solid #a7f3d0' }}>
                      خطة نشطة
                    </span>
                    <div className="d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#ecfdf5', color: '#059669' }}>
                      <i className="ti ti-activity fs-6"></i>
                    </div>
                  </div>
                  <div>
                    <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>{activeProgramsCount}</h3>
                    <p className="text-muted small mb-0 fw-medium" style={{ fontSize: '0.76rem' }}>مشتركون لديهم خطط تدريب وتغذية نشطة</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Pending Intake */}
            <div className="col-md-4 col-sm-12 col-12">
              <div className="card border-0 bg-white h-100 shadow-sm" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#fffbeb', color: '#d97706', fontSize: '0.68rem', border: '1px solid #fde68a' }}>
                      بانتظار الاستمارة
                    </span>
                    <div className="d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fffbeb', color: '#d97706' }}>
                      <i className="ti ti-clock-plus fs-6"></i>
                    </div>
                  </div>
                  <div>
                    <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>{pendingIntakeCount}</h3>
                    <p className="text-muted small mb-0 fw-medium" style={{ fontSize: '0.76rem' }}>بانتظار ملء الاستمارة وتأكيد الدفع</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Client Generator Card (Compact & Proportional) */}
          <div className="card border-0 shadow-sm bg-white mb-3" style={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div className="card-body p-3 px-4">
              <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe' }}>
                  <i className="ti ti-user-plus fs-6"></i>
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.92rem' }}>توليد حساب متدرب جديد وكود اشتراك</h6>
                  <small className="text-muted" style={{ fontSize: '0.76rem' }}>أدخل رقم هاتف العميل وسيتم إصدار كود الدخول ورابط الاستمارة فوراً</small>
                </div>
              </div>

              <form onSubmit={handleCreateClient} className="row g-2 align-items-center">
                <div className="col-md-6 col-lg-5">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white border" style={{ borderColor: '#e2e8f0', borderRadius: '0 10px 10px 0' }}>
                      <i className="ti ti-phone text-muted"></i>
                    </span>
                    <input 
                      type="text" 
                      className="form-control bg-white" 
                      style={{ height: '38px', borderRadius: '10px 0 0 10px', fontSize: '0.82rem', borderColor: '#e2e8f0' }}
                      placeholder="رقم الهاتف (مثال: 01001234567)" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
                <div className="col-auto">
                  <button 
                    type="submit" 
                    className="btn btn-sm rounded-pill px-4 fw-bold shadow-xs d-flex align-items-center gap-1 text-white"
                    style={{ height: '38px', background: '#261c6a', border: 'none', fontSize: '0.82rem' }}
                  >
                    <i className="ti ti-sparkles"></i> 
                    <span>توليد كود المشترك</span>
                  </button>
                </div>
              </form>

              {/* Newly Created Client Badge & Links */}
              {newlyCreated && (
                <div className="mt-3 p-3 rounded-3" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRight: '4px solid #16a34a' }}>
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                      <h6 className="fw-bold text-success mb-1" style={{ fontSize: '0.88rem' }}>
                        <i className="ti ti-circle-check me-1"></i> تم إنشاء حساب المتدرب بنجاح!
                      </h6>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="badge bg-white text-dark border px-2 py-1 font-monospace" style={{ fontSize: '0.75rem' }}>كود: {newlyCreated.client_code}</span>
                        <span className="badge bg-white text-dark border px-2 py-1" style={{ fontSize: '0.75rem' }}>هاتف: {newlyCreated.phone_number}</span>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button 
                        type="button"
                        className="btn btn-sm rounded-pill px-3 fw-semibold bg-white border"
                        style={{ height: '32px', fontSize: '0.78rem', color: '#16a34a', borderColor: '#86efac' }}
                        onClick={() => copyToClipboard(`${window.location.origin}/intake/form?code=${newlyCreated.client_code}&phone=${newlyCreated.phone_number}`)}
                      >
                        <i className="ti ti-copy me-1"></i> {copySuccess ? 'تم النسخ!' : 'نسخ رابط الاستمارة'}
                      </button>
                      <button 
                        type="button"
                        className="btn btn-sm rounded-pill px-3 fw-bold text-white shadow-xs"
                        style={{ height: '32px', fontSize: '0.78rem', background: '#16a34a', border: 'none' }}
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
          <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                  <h5 className="fw-bold text-dark mb-0" style={{ fontSize: '0.98rem' }}>
                    <i className="ti ti-users text-primary me-2"></i> سجل العملاء والمشتركين ({filteredClients.length})
                  </h5>
                  <p className="text-muted small mb-0" style={{ fontSize: '0.78rem' }}>جميع المتدربين المسجلين وروابط استماراتهم وخططهم</p>
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
                        <td colSpan="5" className="text-center py-5 text-muted small">
                          <span className="spinner-border spinner-border-sm me-2 text-primary" role="status"></span>
                          جاري استرجاع بيانات المشتركين...
                        </td>
                      </tr>
                    ) : filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted small">
                          لا يوجد مشتركون يطابقون كلمة البحث.
                        </td>
                      </tr>
                    ) : (
                      filteredClients.map((client) => {
                        const intakeUrl = `${window.location.origin}/intake/form?code=${client.client_code}&phone=${client.phone_number}`;

                        return (
                          <tr key={client.id}>
                            <td>
                              <span className="badge bg-light text-secondary border px-2 py-1 font-monospace" style={{ fontSize: '0.76rem' }}>
                                {client.client_code}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '34px', height: '34px', fontSize: '0.82rem', background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe' }}>
                                  {(client.full_name || 'U')[0]}
                                </div>
                                <span className="fw-bold text-dark" style={{ fontSize: '0.88rem' }}>{client.full_name || `متدرب ${client.client_code}`}</span>
                              </div>
                            </td>
                            <td>
                              <span className="text-muted" dir="ltr" style={{ fontSize: '0.8rem' }}>{client.phone_number || '-'}</span>
                            </td>
                            <td>
                              {client.has_active_program ? (
                                <span className="badge bg-light text-success border px-2 py-1 rounded-pill fw-semibold" style={{ fontSize: '0.75rem' }}>
                                  <i className="ti ti-point-filled me-1"></i> خطة مفعلة
                                </span>
                              ) : (
                                <span className="badge bg-light text-warning border px-2 py-1 rounded-pill fw-semibold" style={{ fontSize: '0.75rem' }}>
                                  <i className="ti ti-clock me-1"></i> بانتظار الاستمارة
                                </span>
                              )}
                            </td>
                            <td className="text-center">
                              <div className="d-flex align-items-center justify-content-center gap-2">
                                
                                {/* Edit / View Plan Button */}
                                <Link
                                  to={`/coach/editor?user_id=${client.client_code}`}
                                  className="btn btn-sm rounded-pill px-3 py-1 fw-semibold shadow-xs d-flex align-items-center gap-1"
                                  style={{ fontSize: '0.76rem', background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', height: '30px' }}
                                  title="فتح محرر وتخصيص الخطة"
                                >
                                  <i className="ti ti-edit"></i>
                                  <span>الخطة</span>
                                </Link>

                                {/* WhatsApp CTA */}
                                <button
                                  type="button"
                                  className="btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center transition-all bg-white border"
                                  style={{ width: '30px', height: '30px', borderColor: '#e2e8f0', color: '#16a34a' }}
                                  onClick={() => setWhatsappModalClient(client)}
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

      {/* WhatsApp Modal Hub */}
      <WhatsAppModal 
        client={whatsappModalClient} 
        onClose={() => setWhatsappModalClient(null)} 
      />
    </AdminLayout>
  );
}
