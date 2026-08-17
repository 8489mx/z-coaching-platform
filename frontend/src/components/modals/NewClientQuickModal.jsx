import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../../config/api';

const DEFAULT_PACKAGES = [
  {
    id: "ELITE_3_PLUS_1",
    name_ar: "باقة إيليت",
    badge_ar: "3 شهور + 1 مجاناً",
    featuresText: "تغذية وتدريب ذكي ومتابعة",
    price_egp: 2500,
    active: true
  },
  {
    id: "MAX_3_PLUS_1",
    name_ar: "باقة ماكس",
    badge_ar: "3 شهور + 1 مجاناً",
    featuresText: "VIP متابعة وتكنيك فيديو",
    price_egp: 3500,
    active: true
  }
];

export default function NewClientQuickModal({ isOpen, onClose, onClientCreated }) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [subscriptionPackage, setSubscriptionPackage] = useState('ELITE_3_PLUS_1');
  const [availablePackages, setAvailablePackages] = useState(DEFAULT_PACKAGES);
  const [loading, setLoading] = useState(false);
  const [newClient, setNewClient] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin-settings/packages`);
      const data = await res.json();
      if (data.packages && data.packages.length > 0) {
        setAvailablePackages(data.packages.filter(p => p.active !== false));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setPhone('');
    setFullName('');
    setSubscriptionPackage('ELITE_3_PLUS_1');
    setNewClient(null);
    setError('');
    setCopied(false);
    onClose();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('يرجى إدخال رقم الواتساب للعميل');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_BASE}/api/v1/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phone.trim(),
          full_name: fullName.trim() || undefined,
          subscription_package: subscriptionPackage
        })
      });

      const data = await res.json();
      if (res.ok && data.client) {
        setNewClient(data.client);
        if (onClientCreated) onClientCreated(data.client);
      } else {
        setError(data.error || 'حدث خطأ أثناء إنشاء كود العميل');
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const intakeLink = newClient 
    ? `${window.location.protocol}//${window.location.hostname}:5173/intake/form?code=${newClient.client_code}&phone=${newClient.phone_number}`
    : '';

  const whatsappMessage = newClient
    ? `مرحباً بك في منظومة Z Coaching!\n\nيسعدنا بدء رحلتك التدريبية والغذائية معنا.\nيرجى الضغط على الرابط التالي لتعبئة استمارة التقييم الشاملة وسيقوم المحرك الذكي والكابتن بتصميم خطتك المخصصة فوراً:\n\n${intakeLink}\n\nكود اشتراكك: ${newClient.client_code}\nبالتوفيق!`
    : '';

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    if (!newClient) return;
    let cleanPhone = newClient.phone_number.replace(/\D/g, '');
    if (cleanPhone.startsWith('01')) cleanPhone = '2' + cleanPhone;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div 
      className="modal fade show d-block" 
      tabIndex="-1" 
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', zIndex: 1060 }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
        <div 
          className="modal-content border-0 shadow-2xl bg-white" 
          style={{ borderRadius: '24px', overflow: 'hidden' }}
          dir="rtl"
        >
          
          {/* Header */}
          <div className="modal-header border-bottom p-4 bg-white d-flex justify-content-between align-items-center" style={{ borderColor: '#f1f5f9' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px', background: '#f5f3ff', color: '#261c6a', border: '1.5px solid #ddd6fe' }}>
                <i className="ti ti-user-plus fs-5"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold text-dark mb-0" style={{ fontSize: '1.08rem', letterSpacing: '-0.3px' }}>
                  تسجيل عميل جديد وتوليد كود
                </h5>
                <small className="text-muted" style={{ fontSize: '0.78rem' }}>إنشاء رابط استمارة الاشتراك وإرساله عبر الواتساب</small>
              </div>
            </div>
            <button 
              type="button" 
              onClick={handleClose} 
              className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: '34px', height: '34px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}
              title="إغلاق (Esc)"
            >
              <i className="ti ti-x fs-6"></i>
            </button>
          </div>

          {/* Body */}
          <div className="modal-body p-4 bg-white">
            {error && (
              <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.8rem' }}>
                <i className="ti ti-alert-circle fs-5"></i>
                <span>{error}</span>
              </div>
            )}

            {!newClient ? (
              <form onSubmit={handleCreate}>
                {/* Phone Input */}
                <div className="mb-3">
                  <label className="form-label fw-bold text-dark small mb-1" style={{ fontSize: '0.82rem' }}>
                    رقم الواتساب للعميل <span className="text-danger">*</span>
                  </label>
                  <div className="position-relative">
                    <input 
                      type="tel" 
                      className="form-control" 
                      style={{ 
                        height: '46px', 
                        borderRadius: '12px', 
                        fontSize: '0.88rem', 
                        border: '1.5px solid #e2e8f0',
                        paddingRight: '42px',
                        direction: 'ltr',
                        textAlign: 'right'
                      }}
                      placeholder="010XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoFocus
                      required
                    />
                    <div className="position-absolute top-50 end-0 translate-middle-y pe-3 pointer-events-none text-success">
                      <i className="ti ti-brand-whatsapp fs-5"></i>
                    </div>
                  </div>
                  <small className="text-muted d-block mt-1" style={{ fontSize: '0.72rem' }}>سيصل كود الدخول ورابط الاستمارة فوراً على هذا الرقم</small>
                </div>

                {/* Name Input */}
                <div className="mb-3">
                  <label className="form-label fw-bold text-dark small mb-1" style={{ fontSize: '0.82rem' }}>
                    اسم العميل (اختياري)
                  </label>
                  <div className="position-relative">
                    <input 
                      type="text" 
                      className="form-control" 
                      style={{ 
                        height: '42px', 
                        borderRadius: '12px', 
                        fontSize: '0.86rem', 
                        border: '1.5px solid #e2e8f0',
                        paddingRight: '42px'
                      }}
                      placeholder="اكتب اسم العميل..."
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                    <div className="position-absolute top-50 end-0 translate-middle-y pe-3 pointer-events-none" style={{ color: '#261c6a' }}>
                      <i className="ti ti-user fs-5"></i>
                    </div>
                  </div>
                </div>

                {/* Dynamic Package Selection */}
                <div className="mb-4">
                  <label className="form-label fw-bold text-dark small mb-2 d-flex justify-content-between align-items-center" style={{ fontSize: '0.82rem' }}>
                    <span>باقة الاشتراك المسددة</span>
                    <span className="badge rounded-pill fw-bold" style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.68rem', border: '1px solid #a7f3d0' }}>
                      الأسعار والباقات المعتمدة
                    </span>
                  </label>

                  <div className="row g-2">
                    {availablePackages.map((pkg) => {
                      const isSelected = subscriptionPackage === pkg.id;
                      const badgeText = pkg.badge_ar || `${pkg.duration_months || 3} شهور ${pkg.free_months ? `+ ${pkg.free_months} مجاناً` : ''}`;
                      const subtext = Array.isArray(pkg.features) && pkg.features.length > 0 
                        ? pkg.features[0] 
                        : (pkg.featuresText || 'تغذية وتدريب ذكي ومتابعة');

                      return (
                        <div key={pkg.id} className={availablePackages.length > 2 ? "col-4" : "col-6"}>
                          <div 
                            onClick={() => setSubscriptionPackage(pkg.id)}
                            className="p-3 rounded-3 border text-center transition-all h-100 d-flex flex-column justify-content-between"
                            style={{ 
                              cursor: 'pointer',
                              background: isSelected ? '#f5f3ff' : '#ffffff',
                              borderColor: isSelected ? '#261c6a' : '#e2e8f0',
                              borderWidth: isSelected ? '2px' : '1px',
                              boxShadow: isSelected ? '0 4px 12px rgba(38,28,106,0.12)' : 'none'
                            }}
                          >
                            <div>
                              <div className="d-flex align-items-center justify-content-center gap-1 mb-1">
                                <i className={`ti ${pkg.id.includes('MAX') ? 'ti-flame' : 'ti-crown'} fs-5`} style={{ color: pkg.id.includes('MAX') ? '#d97706' : '#261c6a' }}></i>
                                <strong className="d-block text-dark text-truncate" style={{ fontSize: '0.88rem' }}>{pkg.name_ar}</strong>
                              </div>
                              <span className="badge rounded-pill fw-bold text-muted d-block mb-1 text-truncate" style={{ fontSize: '0.66rem', background: '#f8fafc' }}>
                                {badgeText}
                              </span>
                            </div>
                            <small className="text-muted d-block text-truncate" style={{ fontSize: '0.7rem' }}>{subtext}</small>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="d-flex gap-2 justify-content-between align-items-center pt-2 border-top" style={{ borderColor: '#f1f5f9' }}>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-light rounded-pill px-3 fw-semibold border" 
                    style={{ height: '36px', fontSize: '0.8rem', color: '#475569' }}
                    onClick={handleClose}
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-sm rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2 text-white"
                    disabled={loading || !phone.trim()}
                    style={{ 
                      height: '36px', 
                      fontSize: '0.82rem', 
                      background: 'linear-gradient(135deg, #261c6a 0%, #4338ca 100%)', 
                      border: 'none', 
                      boxShadow: '0 2px 10px rgba(38, 28, 106, 0.22)' 
                    }}
                  >
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm"></span> جاري التوليد...</>
                    ) : (
                      <><i className="ti ti-sparkles fs-6"></i> إنشاء العميل</>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-2">
                {/* Success Banner */}
                <div className="text-center mb-3">
                  <span className="badge rounded-pill fw-bold px-3 py-2" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #dcfce7', fontSize: '0.84rem' }}>
                    <i className="ti ti-circle-check me-1"></i> تم إنشاء حساب العميل بنجاح
                  </span>
                </div>

                {/* Account Details Card */}
                <div className="p-3 rounded-4 mb-4 border" style={{ background: '#fbfaff', borderColor: '#ede9fe' }}>
                  <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom" style={{ borderColor: '#ede9fe' }}>
                    <span className="text-muted small" style={{ fontSize: '0.78rem' }}>كود المشترك المعتمد:</span>
                    <span className="badge rounded-pill fw-bold font-monospace px-3 py-1" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.88rem' }}>
                      {newClient.client_code}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted small" style={{ fontSize: '0.78rem' }}>رقم الواتساب:</span>
                    <span className="fw-bold text-dark dir-ltr" style={{ fontSize: '0.86rem' }}>{newClient.phone_number}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-grid gap-2">
                  <button 
                    type="button" 
                    className="btn py-2 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 text-white"
                    style={{ height: '42px', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', border: 'none', fontSize: '0.84rem' }}
                    onClick={handleOpenWhatsApp}
                  >
                    <i className="ti ti-brand-whatsapp fs-5"></i>
                    <span>إرسال الرابط عبر الواتساب مباشرة</span>
                  </button>

                  <button 
                    type="button" 
                    className="btn btn-light py-2 rounded-pill fw-semibold d-flex align-items-center justify-content-center gap-2"
                    style={{ height: '40px', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#334155' }}
                    onClick={handleCopyMessage}
                  >
                    <i className={copied ? "ti ti-check text-success" : "ti ti-copy"}></i>
                    <span>{copied ? "تم نسخ رسالة الواتساب والرابط!" : "نسخ رسالة الدعوة للحافظة"}</span>
                  </button>

                  <button 
                    type="button" 
                    className="btn btn-sm rounded-pill fw-bold mt-1"
                    style={{ height: '36px', background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.8rem' }}
                    onClick={() => {
                      handleClose();
                      navigate(`/intake/form?code=${newClient.client_code}&phone=${newClient.phone_number}`);
                    }}
                  >
                    <i className="ti ti-edit me-1"></i> فتح وتعبئة الاستمارة الآن
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
