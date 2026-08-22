import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/layout/AdminLayout';

const DEFAULT_SETTINGS = {
  coach_name: 'كابتن Z Coaching',
  academy_name: 'Z Coaching Master Platform',
  phone_number: '01000000000',
  email: 'coach@zcoaching.com',
  gym_logo_url: '/admin-dashboard_data/logo/z_dumbbell_flat.jpg',
  pdf_footer_note: 'اشرب 3 إلى 4 لتر ماء يومياً | استهدف 8,000 إلى 10,000 خطوة يومياً | نم 7 إلى 8 ساعات لنوم عميق واستشفاء عضلي ممتاز.',
  whatsapp_prefix: 'مرحباً بك في منظومة Z Coaching '
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
    window.dispatchEvent(new Event('coach_settings_updated'));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    alert('تم حفظ وتطبيق إعدادات هوية الكابتن بنجاح!');
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
    alert(' تم تغيير كلمة المرور بنجاح!');
    setSecurityForm({ current_password: '', new_password: '', confirm_password: '' });
  };

  return (
    <AdminLayout>
      <div className="theme-body">
        <div className="container-fluid" style={{ maxWidth: '1000px' }}>
          
          {/* Page Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div>
              <h4 className="fw-bold text-dark mb-1">إعدادات وهوية المدرب والمنظومة</h4>
              <p className="text-muted small mb-0">تخصيص اللوجو واسم الأكاديمية ورقم الواتساب ورسائل التوقيع على خطط المتدربين</p>
            </div>
            {savedSuccess && (
              <span className="badge rounded-pill fw-bold py-2 px-3" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #dcfce7' }}>
                <i className="ti ti-check me-1"></i> تم حفظ التعديلات بنجاح
              </span>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="d-flex gap-2 mb-4 flex-wrap">
            <button 
              type="button"
              onClick={() => setActiveTab('branding')}
              className={`btn btn-sm rounded-pill px-4 fw-bold transition-all ${activeTab === 'branding' ? 'text-white shadow-sm' : 'bg-white text-dark border'}`}
              style={{
                background: activeTab === 'branding' ? '#0284C7' : '#ffffff',
                borderColor: activeTab === 'branding' ? '#0284C7' : '#e2e8f0',
                fontSize: '0.84rem',
                height: '36px'
              }}
            >
              هوية الجيم والأكاديمية
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('security')}
              className={`btn btn-sm rounded-pill px-4 fw-bold transition-all ${activeTab === 'security' ? 'text-white shadow-sm' : 'bg-white text-dark border'}`}
              style={{
                background: activeTab === 'security' ? '#0284C7' : '#ffffff',
                borderColor: activeTab === 'security' ? '#0284C7' : '#e2e8f0',
                fontSize: '0.84rem',
                height: '36px'
              }}
            >
              الأمان وكلمة المرور
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('whatsapp')}
              className={`btn btn-sm rounded-pill px-4 fw-bold transition-all ${activeTab === 'whatsapp' ? 'text-white shadow-sm' : 'bg-white text-dark border'}`}
              style={{
                background: activeTab === 'whatsapp' ? '#0284C7' : '#ffffff',
                borderColor: activeTab === 'whatsapp' ? '#0284C7' : '#e2e8f0',
                fontSize: '0.84rem',
                height: '36px'
              }}
            >
              قوالب رسائل الواتساب
            </button>
          </div>

          {/* 1. Branding Settings Tab */}
          {activeTab === 'branding' && (
            <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: '18px', border: '1px solid #e2e8f0' }}>
              <div className="card-body p-4">
                <form onSubmit={handleSaveSettings}>
                  
                  {/* Gym Logo Upload Preview */}
                  <div className="p-4 rounded-4 border mb-4 d-flex align-items-center gap-4 flex-wrap" style={{ background: '#F0F9FF', borderColor: '#F0F9FF' }}>
                    <img 
                      src={settings.gym_logo_url || '/admin-dashboard_data/logo/z_dumbbell_flat.jpg'} 
                      alt="Gym Logo" 
                      className="rounded-4 border shadow-sm bg-white p-1"
                      style={{ width: '90px', height: '90px', objectFit: 'cover' }}
                    />
                    <div>
                      <h6 className="fw-bold text-dark mb-1">لوجو الأكاديمية / المدرب</h6>
                      <p className="text-muted small mb-2">يظهر في ترويسة جميع لوحات التحكم وملفات الـ PDF المطبوعة للمتدربين</p>
                      <input 
                        type="file" 
                        accept="image/*" 
                        id="logoUploadInput"
                        style={{ display: 'none' }}
                        onChange={handleLogoUpload}
                      />
                      <label htmlFor="logoUploadInput" className="btn btn-sm rounded-pill px-3 fw-semibold shadow-xs" style={{ fontSize: '0.78rem', background: '#E5F0FF', color: '#0284C7', border: '1px solid #BAE6FD' }}>
                        <i className="ti ti-upload me-1"></i> تغيير اللوجو
                      </label>
                    </div>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-dark">اسم المدرب الكامل</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={settings.coach_name}
                        onChange={(e) => setSettings({ ...settings, coach_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-dark">اسم الأكاديمية / الجيم</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={settings.academy_name}
                        onChange={(e) => setSettings({ ...settings, academy_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-dark">رقم هاتف الواتساب المعتمد</label>
                      <input 
                        type="tel" 
                        className="form-control" 
                        value={settings.phone_number}
                        onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-dark">البريد الإلكتروني</label>
                      <input 
                        type="email" 
                        className="form-control" 
                        value={settings.email}
                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-bold small text-dark">ملاحظة التذييل في ملف الـ PDF المطبوع (PDF Footer)</label>
                      <textarea 
                        className="form-control" 
                        rows="3"
                        value={settings.pdf_footer_note}
                        onChange={(e) => setSettings({ ...settings, pdf_footer_note: e.target.value })}
                      ></textarea>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary rounded-pill px-5 fw-bold shadow-sm"
                    style={{ height: '40px', background: '#0284C7', border: 'none', boxShadow: '0 4px 14px rgba(38, 28, 106, 0.28)' }}
                  >
                    <i className="ti ti-device-floppy me-1"></i> حفظ وتطبيق الهوية
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 2. Security Tab */}
          {activeTab === 'security' && (
            <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: '18px', border: '1px solid #e2e8f0' }}>
              <div className="card-body p-4">
                <form onSubmit={handleChangePassword}>
                  <div className="row g-3 mb-4" style={{ maxWidth: '500px' }}>
                    <div className="col-12">
                      <label className="form-label fw-bold small text-dark">كلمة المرور الحالية</label>
                      <input 
                        type="password" 
                        className="form-control" 
                        value={securityForm.current_password}
                        onChange={(e) => setSecurityForm({ ...securityForm, current_password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-bold small text-dark">كلمة المرور الجديدة</label>
                      <input 
                        type="password" 
                        className="form-control" 
                        value={securityForm.new_password}
                        onChange={(e) => setSecurityForm({ ...securityForm, new_password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-bold small text-dark">تأكيد كلمة المرور الجديدة</label>
                      <input 
                        type="password" 
                        className="form-control" 
                        value={securityForm.confirm_password}
                        onChange={(e) => setSecurityForm({ ...securityForm, confirm_password: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary rounded-pill px-5 fw-bold shadow-sm"
                    style={{ height: '40px', background: '#0284C7', border: 'none' }}
                  >
                    <i className="ti ti-lock me-1"></i> تحديث كلمة المرور
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 3. WhatsApp Templates Tab */}
          {activeTab === 'whatsapp' && (
            <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: '18px', border: '1px solid #e2e8f0' }}>
              <div className="card-body p-4">
                <form onSubmit={handleSaveSettings}>
                  <div className="mb-4">
                    <label className="form-label fw-bold small text-dark">رسالة الترحيب الافتراضية (WhatsApp Header)</label>
                    <textarea 
                      className="form-control" 
                      rows="3"
                      value={settings.whatsapp_prefix}
                      onChange={(e) => setSettings({ ...settings, whatsapp_prefix: e.target.value })}
                    ></textarea>
                    <small className="text-muted">تُضاف هذه الرسالة تلقائياً قبل أي رابط أو استمارة يتم إرسالها للمشتركين</small>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary rounded-pill px-5 fw-bold shadow-sm"
                    style={{ height: '40px', background: '#0284C7', border: 'none' }}
                  >
                    <i className="ti ti-device-floppy me-1"></i> حفظ قوالب الواتساب
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </AdminLayout>
  );
}
