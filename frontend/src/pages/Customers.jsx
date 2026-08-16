import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../config/api';

export default function Customers() {
  const [phone, setPhone] = useState('');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newlyCreated, setNewlyCreated] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // WhatsApp Hub State
  const [whatsappModalClient, setWhatsappModalClient] = useState(null);
  const [whatsappTemplate, setWhatsappTemplate] = useState('intake');
  const [whatsappCustomText, setWhatsappCustomText] = useState('');
  const [whatsappCopied, setWhatsappCopied] = useState(false);

  // Live Search
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClients();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        setWhatsappModalClient(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
      if (!res.ok) {
        throw new Error(data.error || 'فشل إنشاء العميل');
      }

      setNewlyCreated(data.user);
      setPhone('');
      fetchClients();
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  const copyClientLink = (client) => {
    const intakeUrl = `${window.location.origin}/intake/form?code=${client.client_code}&phone=${client.phone_number}`;
    navigator.clipboard.writeText(intakeUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  // WhatsApp Helpers
  const openWhatsappModal = (client, template = 'intake') => {
    setWhatsappModalClient(client);
    setWhatsappTemplate(template);
    setWhatsappCustomText(generateWhatsappMessage(client, template));
  };

  const generateWhatsappMessage = (client, template) => {
    if (!client) return '';
    const origin = window.location.origin;
    const code = client.client_code || client.id;
    const phone = client.phone_number || '';
    const name = client.full_name && client.full_name !== 'null' ? client.full_name : 'بطل FitNexus';

    switch (template) {
      case 'intake':
        return `مرحباً بك يا ${name}! 🏋️‍♂️\nيرجى استكمال استمارة البيانات والقياسات التدريبية والغذائية لبدء تصميم خطتك المخصصة بدقة عبر الرابط التالي:\n${origin}/intake/form?code=${code}&phone=${phone}`;
      case 'plan_ready':
        return `أهلاً بك يا ${name}! 🚀\nتم تجهيز وتفعيل خطتك التدريبية والغذائية للأسبوع الأول بنجاح على منظومة FitNexus.\n\n📱 يمكنك استعراض خطتك عبر:\n${origin}/user-dashboard?user_id=${code}\n\n📄 أو تحميل الخطة كملف PDF:\n${origin}/pdf?user_id=${code}\n\nبالتوفيق يا بطل! 💪`;
      case 'checkin_reminder':
        return `مرحباً يا ${name}! ⏰\nتذكير بموعد إرسال المتابعة الأسبوعية (أوزان الـ 7 أيام ومحيط الخصر).\nيرجى الدخول على حسابك لتسجيل التقرير حتى يتم تحديث وتكييف خطتك للأسبوع التالي:\n${origin}/user-dashboard?user_id=${code}`;
      case 'checkin_approved':
        return `عاش يا ${name}! 🏆\nتمت مراجعة واعتماد متابعتك الأسبوعية وتحديث جدول التمارين والسعرات للأسبوع التالي بنجاح.\nتفقد خطتك المحدثة الآن:\n${origin}/user-dashboard?user_id=${code}`;
      default:
        return '';
    }
  };

  const handleTemplateChange = (template) => {
    setWhatsappTemplate(template);
    setWhatsappCustomText(generateWhatsappMessage(whatsappModalClient, template));
  };

  const sendWhatsappDirect = () => {
    if (!whatsappModalClient) return;
    const phoneClean = (whatsappModalClient.phone_number || '').replace(/[^0-9]/g, '');
    const msgEncoded = encodeURIComponent(whatsappCustomText);
    window.open(`https://wa.me/${phoneClean}?text=${msgEncoded}`, '_blank');
  };

  const copyWhatsappText = () => {
    navigator.clipboard.writeText(whatsappCustomText);
    setWhatsappCopied(true);
    setTimeout(() => setWhatsappCopied(false), 2500);
  };

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
                placeholder="بحث لحظي بالاسم، الهاتف، أو الكود..." 
                className="form-control" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="header-right d-flex align-items-center justify-content-end gap-3 pe-2">
            <div className="d-flex align-items-center gap-2 py-1 px-3 bg-light rounded-pill border ms-2">
              <img className="img-fluid rounded-circle border" src="/admin-dashboard_data/avtar/profile.png" alt="Coach Logo" width="36" height="36" />
              <div className="d-none d-md-block text-end pe-1">
                <span className="fw-bold d-block text-dark lh-1" style={{ fontSize: '0.9rem' }}>لوحة تحكم المدرب</span>
                <small className="text-muted" style={{ fontSize: '0.72rem' }}>إدارة الحسابات</small>
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
            <li className="menu-item">
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
            <li className="menu-item active">
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

        <div className="sidebarpro-sec mt-3 mb-4 mx-3 p-3 text-center" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill fw-bold" style={{ fontSize: '0.74rem' }}>
              <i className="ti ti-circle-filled me-1" style={{ fontSize: '7px' }}></i> محرك الذكاء نشط
            </span>
          </div>
          <h6 className="mb-1 fw-bold text-dark" style={{ fontSize: '0.88rem' }}>Z Coaching Platform</h6>
          <p className="text-muted mb-3" style={{ fontSize: '0.74rem' }}>النظام يعمل بكفاءة 100%</p>
          <Link 
            to="/intake/form" 
            className="btn btn-sm w-100 rounded-pill fw-bold text-white shadow-sm"
            style={{ 
              background: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)',
              padding: '8px 14px',
              fontSize: '0.86rem',
              border: 'none'
            }}
          >
            <i className="ti ti-user-plus me-1"></i> تسجيل مشترك جديد
          </Link>
        </div>
      </aside>

      {/* 3. Main Content Workspace */}
      <main className="themebody-wrap">
        <div className="theme-body">
          <div className="container-fluid">
            
            {/* Page Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <div>
                <h4 className="fw-bold text-dark mb-1">توليد أكواد المشتركين وإدارة الحسابات</h4>
                <p className="text-muted small mb-0">إضافة رقم هاتف المتدرب لإنشاء كود اشتراك تلقائي وإرسال رابط استمارة البيانات المباشر</p>
              </div>
              <Link to="/" className="btn btn-outline-secondary rounded-pill px-3 py-2 fw-semibold">
                <i className="ti ti-arrow-right me-1"></i> العودة للرئيسية
              </Link>
            </div>

            {/* Quick Registration Card */}
            <div className="card border-0 shadow-sm bg-white mb-4" style={{ borderRadius: '16px' }}>
              <div className="card-body p-4">
                <form onSubmit={handleCreateClient}>
                  <div className="row g-3 align-items-end">
                    <div className="col-lg-8 col-md-7">
                      <label className="form-label fw-bold text-dark mb-2">رقم هاتف المشترك (WhatsApp)</label>
                      <div className="input-group input-group-lg">
                        <span className="input-group-text bg-light border-end-0">
                          <i className="ti ti-phone text-muted"></i>
                        </span>
                        <input 
                          type="tel" 
                          className="form-control border-start-0 ps-0" 
                          placeholder="مثال: 01012345678" 
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          style={{ fontSize: '1rem' }}
                        />
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-5">
                      <button type="submit" className="btn btn-primary btn-lg w-100 rounded-pill fw-bold" style={{ height: '48px' }}>
                        <i className="ti ti-plus me-1"></i> توليد كود المشترك
                      </button>
                    </div>
                  </div>
                </form>

                {/* Newly Created Success Alert */}
                {newlyCreated && (
                  <div className="alert alert-success mt-3 mb-0 border-0 p-3 rounded-3 d-flex justify-content-between align-items-center flex-wrap gap-2" style={{ backgroundColor: '#ecfdf5', color: '#065f46' }}>
                    <div>
                      <div className="fw-bold mb-1">
                        <i className="ti ti-check me-1"></i> تم إنشاء حساب المشترك وتوليد الكود بنجاح
                      </div>
                      <div className="small">
                        كود المشترك: <span className="badge bg-primary px-2 py-1 fs-6 ms-1">{newlyCreated.client_code}</span> | الهاتف: <span className="fw-semibold">{newlyCreated.phone_number}</span>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button onClick={() => copyClientLink(newlyCreated)} className="btn btn-outline-dark btn-sm rounded-pill px-3 fw-semibold">
                        <i className="ti ti-copy me-1"></i> {copySuccess ? 'تم النسخ' : 'نسخ الرابط'}
                      </button>
                      <button onClick={() => openWhatsappModal(newlyCreated, 'intake')} className="btn btn-success btn-sm rounded-pill px-3 fw-semibold">
                        <i className="ti ti-brand-whatsapp me-1"></i> إرسال عبر واتساب
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Clients Table Card */}
            <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: '16px' }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                  <div>
                    <h5 className="fw-bold text-dark mb-1">سجل المشتركين ({clients.length})</h5>
                    <p className="text-muted small mb-0">قائمة بجميع المشتركين المسجلين وحالة ملء الاستمارة الخاصة بكل متدرب</p>
                  </div>
                  {copySuccess && (
                    <span className="badge bg-success-subtle text-success py-2 px-3 rounded-pill fw-semibold">
                      <i className="ti ti-check me-1"></i> تم نسخ الرابط إلى الحافظة
                    </span>
                  )}
                </div>

                <div className="table-responsive">
                  {loading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status"></div>
                      <p className="text-muted small mt-2">جاري تحميل البيانات...</p>
                    </div>
                  ) : (
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>كود العميل</th>
                          <th>رقم الهاتف</th>
                          <th>اسم المتدرب</th>
                          <th>حالة الاستمارة</th>
                          <th>تاريخ التسجيل</th>
                          <th className="text-center" style={{ minWidth: '220px' }}>الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clients.filter(c => {
                          if (!searchTerm.trim()) return true;
                          const t = searchTerm.trim().toLowerCase();
                          const name = (c.full_name || '').toLowerCase();
                          const phone = (c.phone_number || '').toLowerCase();
                          const code = String(c.client_code || c.id).toLowerCase();
                          return name.includes(t) || phone.includes(t) || code.includes(t);
                        }).length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center py-4 text-muted">
                              {searchTerm ? `لا يوجد مشتركون يطابقون كلمة البحث: "${searchTerm}"` : 'لا يوجد مشتركون مسجلون حالياً. أضف رقم هاتف أعلاه لتوليد أول كود مشترك.'}
                            </td>
                          </tr>
                        ) : (
                          clients.filter(c => {
                            if (!searchTerm.trim()) return true;
                            const t = searchTerm.trim().toLowerCase();
                            const name = (c.full_name || '').toLowerCase();
                            const phone = (c.phone_number || '').toLowerCase();
                            const code = String(c.client_code || c.id).toLowerCase();
                            return name.includes(t) || phone.includes(t) || code.includes(t);
                          }).map((c) => {
                            const hasIntake = c.intakeSubmissions && c.intakeSubmissions.length > 0;
                            return (
                              <tr key={c.id}>
                                <td>
                                  <span className="badge bg-primary-subtle text-primary fw-bold px-3 py-2" style={{ fontSize: '0.85rem', borderRadius: '8px' }}>
                                    {c.client_code || `CLIENT-${c.id}`}
                                  </span>
                                </td>
                                <td className="fw-semibold text-dark">{c.phone_number || '-'}</td>
                                <td>
                                  {c.full_name && c.full_name !== 'null' ? (
                                    <span className="fw-bold text-dark">{c.full_name}</span>
                                  ) : (
                                    <span className="text-muted small">
                                      <i className="ti ti-clock me-1"></i> في انتظار ملء البيانات
                                    </span>
                                  )}
                                </td>
                                <td>
                                  {hasIntake ? (
                                    <span className="badge bg-success-subtle text-success py-2 px-3 rounded-pill fw-semibold">
                                      الخطة جاهزة
                                    </span>
                                  ) : (
                                    <span className="badge bg-warning-subtle text-warning py-2 px-3 rounded-pill fw-semibold">
                                      في الانتظار
                                    </span>
                                  )}
                                </td>
                                <td className="text-muted small">{new Date(c.createdAt).toLocaleDateString('ar-EG')}</td>
                                <td>
                                  <div className="d-flex align-items-center justify-content-center gap-2">
                                    <button 
                                      onClick={() => copyClientLink(c)}
                                      className="btn btn-light btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center"
                                      style={{ width: '34px', height: '34px', border: '1px solid #e2e8f0' }}
                                      title="نسخ رابط الاستمارة"
                                    >
                                      <i className="ti ti-copy text-secondary"></i>
                                    </button>
                                    <button 
                                      onClick={() => openWhatsappModal(c, hasIntake ? 'plan_ready' : 'intake')}
                                      className="btn btn-light btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center"
                                      style={{ width: '34px', height: '34px', border: '1px solid #e2e8f0', color: '#16a34a' }}
                                      title="إرسال رسائل واتساب ذكية"
                                    >
                                      <i className="ti ti-brand-whatsapp"></i>
                                    </button>
                                    {hasIntake ? (
                                      <Link 
                                        to={`/user-dashboard?user_id=${c.client_code || c.id}`}
                                        className="btn btn-primary btn-sm rounded-pill px-3 py-1 fw-semibold"
                                        style={{ fontSize: '0.82rem' }}
                                      >
                                        عرض الخطة <i className="ti ti-arrow-left ms-1"></i>
                                      </Link>
                                    ) : (
                                      <Link 
                                        to={`/intake/form?code=${c.client_code}&phone=${c.phone_number}`}
                                        className="btn btn-outline-primary btn-sm rounded-pill px-3 py-1 fw-semibold"
                                        style={{ fontSize: '0.82rem' }}
                                      >
                                        تعبئة الاستمارة
                                      </Link>
                                    )}
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

      {/* 4. Smart WhatsApp Automation Hub Modal */}
      {whatsappModalClient && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px' }}>
              <div className="modal-header border-bottom p-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2 bg-success-subtle text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                    <i className="ti ti-brand-whatsapp fs-4"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark mb-0">
                      مركز رسائل الواتساب الذكية: {whatsappModalClient.full_name || 'المتدرب'}
                    </h5>
                    <small className="text-muted">الهاتف: {whatsappModalClient.phone_number || '-'} | الكود: {whatsappModalClient.client_code}</small>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setWhatsappModalClient(null)}></button>
              </div>

              <div className="modal-body p-4">
                {/* Template Selector Pills */}
                <label className="form-label fw-bold text-dark mb-2">اختر قالب الرسالة:</label>
                <div className="d-flex gap-2 flex-wrap mb-4">
                  <button 
                    className={`btn btn-sm rounded-pill px-3 fw-bold ${whatsappTemplate === 'intake' ? 'btn-success' : 'btn-light border'}`}
                    onClick={() => handleTemplateChange('intake')}
                  >
                    📝 رابط الاستمارة
                  </button>
                  <button 
                    className={`btn btn-sm rounded-pill px-3 fw-bold ${whatsappTemplate === 'plan_ready' ? 'btn-success' : 'btn-light border'}`}
                    onClick={() => handleTemplateChange('plan_ready')}
                  >
                    🏋️‍♂️ جاهزية الخطة والـ PDF
                  </button>
                  <button 
                    className={`btn btn-sm rounded-pill px-3 fw-bold ${whatsappTemplate === 'checkin_reminder' ? 'btn-success' : 'btn-light border'}`}
                    onClick={() => handleTemplateChange('checkin_reminder')}
                  >
                    ⏰ تذكير المتابعة الأسبوعية
                  </button>
                  <button 
                    className={`btn btn-sm rounded-pill px-3 fw-bold ${whatsappTemplate === 'checkin_approved' ? 'btn-success' : 'btn-light border'}`}
                    onClick={() => handleTemplateChange('checkin_approved')}
                  >
                    🏆 اعتماد الخطة والتكيّف
                  </button>
                </div>

                {/* Message Preview & Editor Textarea */}
                <div className="form-group mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label fw-bold text-dark mb-0">معاينة وتخصيص نص الرسالة:</label>
                    <button 
                      onClick={copyWhatsappText} 
                      className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-0"
                      style={{ fontSize: '0.8rem' }}
                    >
                      <i className="ti ti-copy me-1"></i> {whatsappCopied ? 'تم النسخ!' : 'نسخ النص'}
                    </button>
                  </div>
                  <textarea 
                    className="form-control bg-light" 
                    rows="6" 
                    value={whatsappCustomText}
                    onChange={(e) => setWhatsappCustomText(e.target.value)}
                    style={{ fontSize: '0.95rem', lineHeight: '1.7', borderRadius: '12px' }}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer border-top p-3 d-flex justify-content-between">
                <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setWhatsappModalClient(null)}>
                  إغلاق
                </button>
                <button 
                  type="button" 
                  className="btn btn-success rounded-pill px-4 fw-bold shadow-sm" 
                  onClick={sendWhatsappDirect}
                >
                  <i className="ti ti-brand-whatsapp me-1"></i> إرسال عبر WhatsApp 💬
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
