import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../../config/api';

export default function NewClientQuickModal({ isOpen, onClose, onClientCreated }) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [newClient, setNewClient] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

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
          full_name: fullName.trim() || undefined
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
    ? `مرحباً بك مع كابتن كيمو في منظومة Z Coaching!\n\nيسعدنا بدء رحلتك التدريبية والغذائية معنا.\nيرجى الضغط على الرابط التالي لتعبئة استمارة التقييم الشاملة وسيقوم المحرك الذكي والكابتن بتصميم خطتك المخصصة فوراً:\n\n${intakeLink}\n\nكود اشتراكك: ${newClient.client_code}\nبالتوفيق!`
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
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1055 }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px' }}>
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px' }} dir="rtl">
          
          {/* Header */}
          <div className="modal-header border-0 pb-0 px-4 pt-4 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <div className="p-2 bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                <i className="ti ti-user-plus fs-4"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold text-dark mb-0" style={{ fontSize: '1.1rem' }}>تسجيل عميل جديد وتوليد كود</h5>
                <small className="text-muted" style={{ fontSize: '0.78rem' }}>إنشاء رابط استمارة الاشتراك وإرساله عبر الواتساب</small>
              </div>
            </div>
            <button 
              type="button" 
              className="btn-close" 
              onClick={handleClose} 
              aria-label="Close"
              title="إغلاق (Esc)"
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body px-4 py-3">
            {error && (
              <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3">
                <i className="ti ti-alert-circle me-1"></i> {error}
              </div>
            )}

            {!newClient ? (
              <form onSubmit={handleCreate}>
                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark small mb-1">رقم الواتساب للعميل <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-0"><i className="ti ti-brand-whatsapp text-success fs-5"></i></span>
                    <input 
                      type="tel" 
                      className="form-control bg-light border-0 py-2" 
                      placeholder="مثال: 01012345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold text-dark small mb-1">اسم العميل (اختياري)</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-0"><i className="ti ti-user text-muted fs-5"></i></span>
                    <input 
                      type="text" 
                      className="form-control bg-light border-0 py-2" 
                      placeholder="مثال: أحمد سمير"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="d-flex gap-2 justify-content-end pt-2">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={handleClose}>
                    إلغاء
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm"
                    disabled={loading || !phone.trim()}
                    style={{ background: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)', border: 'none' }}
                  >
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status"></span> جاري التوليد...</>
                    ) : (
                      <><i className="ti ti-sparkles me-1"></i> توليد الكود ورابط الاستمارة</>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-2">
                <div className="mb-3">
                  <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill fw-bold" style={{ fontSize: '0.86rem' }}>
                    <i className="ti ti-check me-1"></i> تم إنشاء العميل بنجاح
                  </span>
                </div>

                <div className="p-3 bg-light rounded-4 text-start mb-3 border">
                  <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                    <span className="text-muted small">كود المشترك:</span>
                    <span className="badge bg-dark px-3 py-1 font-monospace fs-6">{newClient.client_code}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-muted small">رقم الهاتف:</span>
                    <span className="fw-bold text-dark dir-ltr">{newClient.phone_number}</span>
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <button 
                    type="button" 
                    className="btn btn-success py-2 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                    onClick={handleOpenWhatsApp}
                  >
                    <i className="ti ti-brand-whatsapp fs-5"></i>
                    <span>إرسال الرابط عبر الواتساب مباشرة</span>
                  </button>

                  <button 
                    type="button" 
                    className="btn btn-outline-secondary py-2 rounded-pill fw-semibold d-flex align-items-center justify-content-center gap-2"
                    onClick={handleCopyMessage}
                  >
                    <i className={copied ? "ti ti-check text-success" : "ti ti-copy"}></i>
                    <span>{copied ? "تم نسخ رسالة الواتساب والرابط!" : "نسخ رسالة الدعوة للحافظة"}</span>
                  </button>

                  <button 
                    type="button" 
                    className="btn btn-light py-2 rounded-pill text-primary fw-bold"
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
