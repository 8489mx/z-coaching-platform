import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  X, 
  Phone, 
  User, 
  CheckCircle2, 
  MessageCircle, 
  Copy, 
  Check, 
  Edit3, 
  AlertCircle 
} from 'lucide-react';
import { API_BASE } from '../../config/api';
import { copyToClipboard } from '../../utils/clipboardUtils';

export default function NewClientQuickModal({ isOpen, onClose, onClientCreated }) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedTier, setSelectedTier] = useState('MAX'); // 'MAX' (Gold) | 'ELITE' (Blue)
  const [selectedDuration, setSelectedDuration] = useState('4M'); // '4M' (4 شهور) | '6M' (6 شهور)
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
    setSelectedTier('MAX');
    setSelectedDuration('4M');
    setNewClient(null);
    setError('');
    setCopied(false);
    onClose();
  };

  const packageCode = `${selectedTier}_${selectedDuration}`;
  const packageLabel = `باقة ${selectedTier === 'MAX' ? 'MAX' : 'ELITE'} — ${selectedDuration === '4M' ? '4 شهور' : '6 شهور'}`;

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
          subscription_package: packageCode,
          subscription_price: selectedTier === 'MAX' ? (selectedDuration === '4M' ? 2800 : 4200) : (selectedDuration === '4M' ? 3800 : 5800)
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
    ? `${window.location.origin}/intake/form?code=${newClient.client_code}&phone=${newClient.phone_number}`
    : '';

  const portalLink = `${window.location.origin}/intake`;
  const clientNameDisplay = newClient?.full_name ? newClient.full_name : 'يا بطل';

  const whatsappMessage = newClient
    ? `مرحباً ${clientNameDisplay} يا بطل!\nتم تأكيد اشتراكك وتفعيل ملفك في المنظومة بنجاح!\n\nبيانات دخول استمارتك الخاصة:\n*كود المشترك:* ${newClient.client_code}\n*رقم الهاتف المسجل:* ${newClient.phone_number}\n\n*رابط استمارتك المباشر:*\n${intakeLink}\n\n*رابط البوابة الموحد:*\n${portalLink}\n\n(افتح الرابط المباشر واملأ بياناتك وصورك بدقة لنبدأ فوراً في تجهيز خطتك المتكاملة!)`
    : '';

  const handleCopyMessage = async () => {
    const success = await copyToClipboard(whatsappMessage);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenWhatsApp = () => {
    if (!newClient) return;
    let cleanPhone = newClient.phone_number.replace(/\D/g, '');
    if (cleanPhone.startsWith('01')) cleanPhone = '2' + cleanPhone;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(waUrl, '_blank');
  };

  const isMax = selectedTier === 'MAX';
  const themeColor = isMax ? '#C89327' : '#00A3FF';
  const themeBg = isMax ? '#FEF9C3' : '#E0F2FE';

  const modalContent = (
    <div 
      className="modal fade show d-block" 
      tabIndex="-1" 
      style={{ 
        backgroundColor: 'rgba(15, 23, 42, 0.7)', 
        backdropFilter: 'blur(8px)', 
        zIndex: 10000,
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        overflowY: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div style={{ width: '100%', maxWidth: '490px', margin: 'auto' }}>
        <div 
          className="modal-content border-0 shadow-2xl bg-white" 
          style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid #E2E8F0' }}
          dir="rtl"
        >
          
          {/* Header */}
          <div className="p-4 bg-white d-flex justify-content-between align-items-center" style={{ borderBottom: '1px solid #F1F5F9' }}>
            <div className="d-flex align-items-center gap-3">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" 
                style={{ 
                  width: '42px', 
                  height: '42px', 
                  background: themeBg, 
                  color: themeColor, 
                  border: `1.5px solid ${themeColor}40` 
                }}
              >
                <UserPlus style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
                <h5 className="modal-title fw-black text-dark mb-0" style={{ fontSize: '1.12rem', letterSpacing: '-0.3px' }}>
                  تسجيل مشترك وتوليد كود
                </h5>
                <small className="text-muted" style={{ fontSize: '0.78rem' }}>إنشاء رابط استمارة الاشتراك وإرساله عبر الواتساب</small>
              </div>
            </div>
            <button 
              type="button" 
              onClick={handleClose} 
              className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: '34px', height: '34px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B', cursor: 'pointer' }}
              title="إغلاق"
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 bg-white">
            {error && (
              <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.8rem' }}>
                <AlertCircle style={{ width: '16px', height: '16px' }} />
                <span>{error}</span>
              </div>
            )}

            {!newClient ? (
              <form onSubmit={handleCreate}>
                
                {/* 1. Phone Input */}
                <div className="mb-3">
                  <label className="form-label fw-bold text-dark small mb-1" style={{ fontSize: '0.82rem' }}>
                    رقم الواتساب للمشترك <span className="text-danger">*</span>
                  </label>
                  <div className="position-relative">
                    <input 
                      type="tel" 
                      className="form-control" 
                      style={{ 
                        height: '46px', 
                        borderRadius: '12px', 
                        fontSize: '0.9rem', 
                        border: '1.5px solid #E2E8F0',
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
                      <Phone style={{ width: '18px', height: '18px' }} />
                    </div>
                  </div>
                  <small className="text-muted d-block mt-1" style={{ fontSize: '0.72rem' }}>سيصل كود الدخول ورابط الاستمارة فوراً على هذا الرقم</small>
                </div>

                {/* 2. Name Input */}
                <div className="mb-3">
                  <label className="form-label fw-bold text-dark small mb-1" style={{ fontSize: '0.82rem' }}>
                    اسم المشترك (اختياري)
                  </label>
                  <div className="position-relative">
                    <input 
                      type="text" 
                      className="form-control" 
                      style={{ 
                        height: '44px', 
                        borderRadius: '12px', 
                        fontSize: '0.88rem', 
                        border: '1.5px solid #E2E8F0',
                        paddingRight: '42px'
                      }}
                      placeholder="اكتب اسم المشترك..."
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                    <div className="position-absolute top-50 end-0 translate-middle-y pe-3 pointer-events-none" style={{ color: '#0284C7' }}>
                      <User style={{ width: '18px', height: '18px' }} />
                    </div>
                  </div>
                </div>

                {/* 3. Package Tier Selector: MAX (Gold) vs ELITE (Blue) */}
                <div className="mb-3">
                  <label className="form-label fw-bold text-dark small mb-2 d-flex justify-content-between align-items-center" style={{ fontSize: '0.82rem' }}>
                    <span>نوع الباقة</span>
                    <span className="badge rounded-pill fw-bold" style={{ background: '#F8FAFC', color: '#64748B', fontSize: '0.7rem', border: '1px solid #E2E8F0' }}>
                      اختر MAX أو ELITE
                    </span>
                  </label>

                  <div className="row g-2">
                    {/* MAX (Gold) */}
                    <div className="col-6">
                      <div 
                        onClick={() => setSelectedTier('MAX')}
                        className="p-3 rounded-3 text-center transition-all h-100 d-flex flex-column align-items-center justify-content-center"
                        style={{ 
                          cursor: 'pointer',
                          background: selectedTier === 'MAX' ? '#FFFBEB' : '#FFFFFF',
                          borderColor: selectedTier === 'MAX' ? '#C89327' : '#E2E8F0',
                          borderWidth: '2px',
                          borderStyle: 'solid',
                          boxShadow: selectedTier === 'MAX' ? '0 4px 14px rgba(200, 147, 39, 0.15)' : 'none',
                          borderRadius: '16px'
                        }}
                      >
                        <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#C89327', letterSpacing: '1px', display: 'block', marginBottom: '2px' }}>
                          MAX
                        </span>
                        <small style={{ fontSize: '0.74rem', color: selectedTier === 'MAX' ? '#92400E' : '#64748B', fontWeight: 700 }}>
                          باقة ماكس الذهبية
                        </small>
                      </div>
                    </div>

                    {/* ELITE (Blue) */}
                    <div className="col-6">
                      <div 
                        onClick={() => setSelectedTier('ELITE')}
                        className="p-3 rounded-3 text-center transition-all h-100 d-flex flex-column align-items-center justify-content-center"
                        style={{ 
                          cursor: 'pointer',
                          background: selectedTier === 'ELITE' ? '#E0F2FE' : '#FFFFFF',
                          borderColor: selectedTier === 'ELITE' ? '#00A3FF' : '#E2E8F0',
                          borderWidth: '2px',
                          borderStyle: 'solid',
                          boxShadow: selectedTier === 'ELITE' ? '0 4px 14px rgba(0, 163, 255, 0.15)' : 'none',
                          borderRadius: '16px'
                        }}
                      >
                        <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#00A3FF', letterSpacing: '1px', display: 'block', marginBottom: '2px' }}>
                          ELITE
                        </span>
                        <small style={{ fontSize: '0.74rem', color: selectedTier === 'ELITE' ? '#0369A1' : '#64748B', fontWeight: 700 }}>
                          باقة إيليت الزرقاء
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Duration Selector: 4 شهور vs 6 شهور */}
                <div className="mb-4">
                  <label className="form-label fw-bold text-dark small mb-2" style={{ fontSize: '0.82rem' }}>
                    مدة الاشتراك
                  </label>

                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDuration('4M')}
                      className="btn flex-fill fw-bold py-2"
                      style={{
                        borderRadius: '12px',
                        fontSize: '0.86rem',
                        border: selectedDuration === '4M' ? `2px solid ${themeColor}` : '1.5px solid #E2E8F0',
                        background: selectedDuration === '4M' ? themeBg : '#FFFFFF',
                        color: selectedDuration === '4M' ? (isMax ? '#92400E' : '#0369A1') : '#64748B',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      4 شهور
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDuration('6M')}
                      className="btn flex-fill fw-bold py-2"
                      style={{
                        borderRadius: '12px',
                        fontSize: '0.86rem',
                        border: selectedDuration === '6M' ? `2px solid ${themeColor}` : '1.5px solid #E2E8F0',
                        background: selectedDuration === '6M' ? themeBg : '#FFFFFF',
                        color: selectedDuration === '6M' ? (isMax ? '#92400E' : '#0369A1') : '#64748B',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      6 شهور
                    </button>
                  </div>

                  {/* Summary Bar */}
                  <div className="mt-2 p-2 px-3 rounded-3 text-center" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 700 }}>
                      الباقة المختارة: <strong style={{ color: themeColor }}>${packageLabel}</strong>
                    </span>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="d-flex gap-2 justify-content-between align-items-center pt-3" style={{ borderTop: '1px solid #F1F5F9' }}>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-light rounded-pill px-4 fw-semibold" 
                    style={{ height: '40px', fontSize: '0.82rem', color: '#475569', border: '1px solid #E2E8F0' }}
                    onClick={handleClose}
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-sm rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2 text-white"
                    disabled={loading || !phone.trim()}
                    style={{ 
                      height: '40px', 
                      fontSize: '0.86rem', 
                      background: `linear-gradient(135deg, ${themeColor} 0%, ${isMax ? '#B45309' : '#0284C7'} 100%)`, 
                      border: 'none', 
                      boxShadow: `0 4px 14px ${themeColor}40`,
                      cursor: 'pointer'
                    }}
                  >
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm"></span> جاري التوليد...</>
                    ) : (
                      <span>إنشاء وتوليد الكود</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-2">
                {/* Success Banner */}
                <div className="text-center mb-3">
                  <span className="badge rounded-pill fw-bold px-3 py-2" style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #DCFCE7', fontSize: '0.84rem' }}>
                    <CheckCircle2 style={{ width: '16px', height: '16px', display: 'inline', marginLeft: '4px' }} />
                    تم إنشاء حساب المشترك بنجاح
                  </span>
                </div>

                {/* Account Details Card */}
                <div className="p-3 rounded-4 mb-4" style={{ background: '#F8FAFC', border: '1.5px dashed #CBD5E1' }}>
                  <div className="d-flex justify-content-between align-items-center mb-2 pb-2" style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <span className="text-muted small" style={{ fontSize: '0.78rem' }}>كود المشترك المعتمد:</span>
                    <span className="badge rounded-pill fw-black font-monospace px-3 py-1" style={{ background: themeBg, color: themeColor, border: `1.5px solid ${themeColor}40`, fontSize: '1.1rem' }}>
                      {newClient.client_code}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted small" style={{ fontSize: '0.78rem' }}>رقم الواتساب:</span>
                    <span className="fw-bold text-dark dir-ltr" style={{ fontSize: '0.86rem' }}>{newClient.phone_number}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted small" style={{ fontSize: '0.78rem' }}>الباقة المسجلة:</span>
                    <span className="fw-bold" style={{ fontSize: '0.82rem', color: themeColor }}>{packageLabel}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-grid gap-2">
                  <button 
                    type="button" 
                    className="btn py-2 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 text-white"
                    style={{ height: '42px', background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)', border: 'none', fontSize: '0.84rem', cursor: 'pointer' }}
                    onClick={handleOpenWhatsApp}
                  >
                    <MessageCircle style={{ width: '18px', height: '18px' }} />
                    <span>إرسال الرابط عبر الواتساب مباشرة</span>
                  </button>

                  <button 
                    type="button" 
                    className="btn btn-light py-2 rounded-pill fw-semibold d-flex align-items-center justify-content-center gap-2"
                    style={{ height: '40px', border: '1px solid #E2E8F0', fontSize: '0.82rem', color: '#334155', cursor: 'pointer' }}
                    onClick={handleCopyMessage}
                  >
                    {copied ? <Check style={{ width: '16px', height: '16px', color: '#16A34A' }} /> : <Copy style={{ width: '16px', height: '16px' }} />}
                    <span>{copied ? "تم نسخ رسالة الواتساب والرابط!" : "نسخ رسالة الدعوة للحافظة"}</span>
                  </button>

                  <button 
                    type="button" 
                    className="btn btn-sm rounded-pill fw-bold mt-1"
                    style={{ height: '36px', background: themeBg, color: themeColor, border: `1.5px solid ${themeColor}40`, fontSize: '0.8rem', cursor: 'pointer' }}
                    onClick={() => {
                      handleClose();
                      navigate(`/intake/form?code=${newClient.client_code}&phone=${newClient.phone_number}`);
                    }}
                  >
                    <Edit3 style={{ width: '14px', height: '14px', display: 'inline', marginLeft: '4px' }} />
                    فتح وتعبئة الاستمارة الآن
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
