import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const DEFAULT_SETTINGS = {
  coach_name: 'كابتن كيمو المحروقي',
  academy_name: 'Z Coaching Academy',
  phone_number: '01205004949',
  email: 'coach@zcoaching.com',
  gym_logo_url: '/admin-dashboard_data/logo/z_coaching_logo.jpg',
  pdf_footer_note: '💧 اشرب 3 إلى 4 لتر ماء يومياً | 🚶‍♂️ استهدف 8,000 إلى 10,000 خطوة يومياً | 😴 نم 7 إلى 8 ساعات لنوم عميق واستشفاء عضلي ممتاز.',
  whatsapp_prefix: 'مرحباً بك مع كابتن كيمو في منظومة Z Coaching 🏋️‍♂️'
};

export default function ProfileClone() {
  const [activeTab, setActiveTab] = useState('branding'); // 'branding' | 'security' | 'whatsapp'
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Security Form State
  const [securityForm, setSecurityForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    const stored = localStorage.getItem('fitnexus_coach_settings');
    if (stored) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('fitnexus_coach_settings', JSON.stringify(settings));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    alert('✅ تم حفظ وتطبيق إعدادات هوية الكابتن بنجاح!');
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setSettings(prev => ({ ...prev, gym_logo_url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (securityForm.new_password !== securityForm.confirm_password) {
      alert('كلمة المرور الجديدة غير متطابقة مع تأكيد كلمة المرور');
      return;
    }
    alert('✅ تم تغيير كلمة المرور بنجاح!');
    setSecurityForm({ current_password: '', new_password: '', confirm_password: '' });
  };

  return (
    <div className="codex-wrapper" dir="rtl" style={{ minHeight: '100vh', backgroundColor: '#f6f8fb', fontFamily: 'Cairo, Tajawal, sans-serif' }}>
      {/* 1. Header */}
      <header className="codex-header">
        <div className="header-contian d-flex justify-content-between align-items-center">
          <div className="header-left d-flex align-items-center gap-3">
            <h5 className="fw-bold text-dark mb-0">إعدادات الملف الشخصي وهوية المدرب</h5>
          </div>

          <div className="header-right d-flex align-items-center justify-content-end gap-3 pe-2">
            <Link to="/" className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-semibold">
              <i className="ti ti-arrow-right me-1"></i> لوحة التحكم
            </Link>

            <div className="d-flex align-items-center gap-2 py-1 px-3 bg-light rounded-pill border ms-2">
              <img className="img-fluid rounded-circle border" src={settings.gym_logo_url || "/admin-dashboard_data/avtar/profile.png"} alt="Coach Logo" width="36" height="36" />
              <div className="d-none d-md-block text-end pe-1">
                <span className="fw-bold d-block text-dark lh-1" style={{ fontSize: '0.9rem' }}>{settings.coach_name}</span>
                <small className="text-muted" style={{ fontSize: '0.72rem' }}>Master Coach 👑</small>
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
              src={settings.gym_logo_url || "/admin-dashboard_data/logo/z_clean_symbol.jpg?v=2"} 
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
            <li className="menu-item">
              <Link to="/customers">
                <div className="icon-item"><i className="ti ti-user-plus"></i></div>
                <span>إدارة المشتركين والأكواد</span>
              </Link>
            </li>
            <li className="menu-item active">
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

      {/* 3. Main Workspace */}
      <main className="themebody-wrap">
        <div className="theme-body">
          <div className="container-fluid" style={{ maxWidth: '1000px' }}>
            
            {/* Page Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <div>
                <h4 className="fw-bold text-dark mb-1">إعدادات وهوية المدرب والجيم</h4>
                <p className="text-muted small mb-0">تخصيص اللوجو واسم الأكاديمية ورقم الواتساب ورسائل التوقيع على خطط المتدربين</p>
              </div>
              {savedSuccess && (
                <span className="badge bg-success-subtle text-success py-2 px-3 rounded-pill fw-bold">
                  <i className="ti ti-check me-1"></i> تم حفظ التعديلات بنجاح
                </span>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="d-flex gap-2 mb-4">
              <button 
                onClick={() => setActiveTab('branding')}
                className={`btn rounded-pill px-4 fw-bold ${activeTab === 'branding' ? 'btn-primary shadow-sm' : 'btn-white bg-white border'}`}
              >
                🏢 هوية الجيم والأكاديمية
              </button>
              <button 
                onClick={() => setActiveTab('security')}
                className={`btn rounded-pill px-4 fw-bold ${activeTab === 'security' ? 'btn-primary shadow-sm' : 'btn-white bg-white border'}`}
              >
                🔒 الأمان وكلمة المرور
              </button>
            </div>

            {/* TAB 1: BRANDING & IDENTITY */}
            {activeTab === 'branding' && (
              <form onSubmit={handleSaveSettings}>
                <div className="card border-0 shadow-sm bg-white mb-4" style={{ borderRadius: '16px' }}>
                  <div className="card-body p-4">
                    <h5 className="fw-bold text-dark mb-4">
                      <i className="ti ti-badge text-primary me-2"></i> الهوية والبيانات التجارية
                    </h5>

                    {/* Logo Upload Box */}
                    <div className="d-flex align-items-center gap-4 mb-4 p-3 bg-light rounded-4 border">
                      <img 
                        src={settings.gym_logo_url} 
                        alt="Logo Preview" 
                        className="rounded-circle border bg-white p-1 shadow-sm" 
                        width="80" 
                        height="80" 
                        style={{ objectFit: 'contain' }}
                      />
                      <div>
                        <h6 className="fw-bold text-dark mb-1">شعار الجيم / الأكاديمية (Logo)</h6>
                        <p className="small text-muted mb-2">يظهر في أعلى صفحات المتدربين وفي ملفات الـ PDF المطبوعة</p>
                        <label className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-semibold" style={{ cursor: 'pointer' }}>
                          <i className="ti ti-upload me-1"></i> رفع لوجو جديد
                          <input type="file" accept="image/*" className="d-none" onChange={handleLogoUpload} />
                        </label>
                      </div>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-bold text-dark small">اسم الكابتن / المدرب</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={settings.coach_name}
                          onChange={(e) => setSettings({ ...settings, coach_name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-bold text-dark small">اسم الأكاديمية / الجيم</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={settings.academy_name}
                          onChange={(e) => setSettings({ ...settings, academy_name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-bold text-dark small">رقم هاتف الواتساب المعتمد</label>
                        <input 
                          type="tel" 
                          className="form-control" 
                          value={settings.phone_number}
                          onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-bold text-dark small">البريد الإلكتروني</label>
                        <input 
                          type="email" 
                          className="form-control" 
                          value={settings.email}
                          onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-bold text-dark small">التوجيهات والإرشادات الافتراضية أسفل خطط الـ PDF</label>
                        <textarea 
                          className="form-control" 
                          rows="3"
                          value={settings.pdf_footer_note}
                          onChange={(e) => setSettings({ ...settings, pdf_footer_note: e.target.value })}
                        ></textarea>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-top d-flex justify-content-end">
                      <button type="submit" className="btn btn-primary rounded-pill px-5 fw-bold shadow-sm">
                        حفظ وتطبيق إعدادات الهوية 💾
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 2: SECURITY & PASSWORD */}
            {activeTab === 'security' && (
              <form onSubmit={handleChangePassword}>
                <div className="card border-0 shadow-sm bg-white mb-4" style={{ borderRadius: '16px' }}>
                  <div className="card-body p-4">
                    <h5 className="fw-bold text-dark mb-4">
                      <i className="ti ti-lock text-primary me-2"></i> تأمين الحساب وكلمة المرور
                    </h5>

                    <div className="row g-3" style={{ maxWidth: '600px' }}>
                      <div className="col-12">
                        <label className="form-label fw-bold text-dark small">كلمة المرور الحالية</label>
                        <input 
                          type="password" 
                          className="form-control" 
                          value={securityForm.current_password}
                          onChange={(e) => setSecurityForm({ ...securityForm, current_password: e.target.value })}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-bold text-dark small">كلمة المرور الجديدة</label>
                        <input 
                          type="password" 
                          className="form-control" 
                          value={securityForm.new_password}
                          onChange={(e) => setSecurityForm({ ...securityForm, new_password: e.target.value })}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-bold text-dark small">تأكيد كلمة المرور الجديدة</label>
                        <input 
                          type="password" 
                          className="form-control" 
                          value={securityForm.confirm_password}
                          onChange={(e) => setSecurityForm({ ...securityForm, confirm_password: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-top d-flex justify-content-start">
                      <button type="submit" className="btn btn-primary rounded-pill px-5 fw-bold shadow-sm">
                        تحديث كلمة المرور 🔒
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
