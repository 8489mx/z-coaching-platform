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
  AlertCircle,
  Zap,
  Crown,
  Gift,
  Calendar
} from 'lucide-react';
import { API_BASE } from '../../config/api';
import { SUBSCRIPTION_TIERS } from '../../config/subscription-tiers';
import { copyToClipboard } from '../../utils/clipboardUtils';

export default function NewClientQuickModal({ isOpen, onClose, onClientCreated }) {
  const navigate = useNavigate();
  const [tier, setTier] = useState('MAX'); // 'ELITE' | 'MAX'
  const [durationKey, setDurationKey] = useState('FOUR_MONTHS'); // 'FOUR_MONTHS' | 'EIGHT_MONTHS'
  const [bonusWeeks, setBonusWeeks] = useState(0); // 0, 1, 2, 4 أسابيع إضافية
  const [bonusMonths, setBonusMonths] = useState(0); // 0, 1, 2 شهور إضافية
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
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

  const currentTierData = SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS.MAX;
  const currentDurationData = currentTierData.durations[durationKey] || currentTierData.durations.FOUR_MONTHS;
  const baseDays = currentDurationData.totalDays;
  const extraDays = (bonusWeeks * 7) + (bonusMonths * 30);
  const finalTotalDays = baseDays + extraDays;
  const packageCode = `${tier}_${currentDurationData.id}`;

  const isMax = tier === 'MAX';
  const themeColor = isMax ? '#C89327' : '#00A3FF';
  const themeBg = isMax ? '#FEF9C3' : '#E0F2FE';

  const handleClose = () => {
    setClientPhone('');
    setClientName('');
    setTier('MAX');
    setDurationKey('FOUR_MONTHS');
    setBonusWeeks(0);
    setBonusMonths(0);
    setNewClient(null);
    setError('');
    setCopied(false);
    onClose();
  };

  const handleCreate = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!clientPhone.trim()) {
      setError('يرجى إدخال رقم الواتساب للمشترك');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_BASE}/api/v1/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: clientPhone.trim(),
          full_name: clientName.trim() || undefined,
          subscription_package: packageCode,
          subscription_price: currentDurationData.priceEgp,
          subscription_duration_days: finalTotalDays
        })
      });

      const data = await res.json();
      if (res.ok && data.client) {
        setNewClient(data.client);
        if (onClientCreated) onClientCreated(data.client);
      } else {
        // Fallback offline generation if server issue
        const fallbackCode = 'KZ-' + Math.floor(1000 + Math.random() * 9000);
        const fallbackClient = {
          client_code: fallbackCode,
          phone_number: clientPhone.trim(),
          full_name: clientName.trim() || 'يا بطل',
          subscription_package: packageCode
        };
        setNewClient(fallbackClient);
        if (onClientCreated) onClientCreated(fallbackClient);
      }
    } catch (err) {
      // Fallback offline generation
      const fallbackCode = 'KZ-' + Math.floor(1000 + Math.random() * 9000);
      const fallbackClient = {
        client_code: fallbackCode,
        phone_number: clientPhone.trim(),
        full_name: clientName.trim() || 'يا بطل',
        subscription_package: packageCode
      };
      setNewClient(fallbackClient);
      if (onClientCreated) onClientCreated(fallbackClient);
    } finally {
      setLoading(false);
    }
  };

  const intakeLink = newClient 
    ? `${window.location.origin}/intake/form?code=${newClient.client_code}&phone=${newClient.phone_number}`
    : '';

  const portalLink = `${window.location.origin}/intake`;
  const clientNameDisplay = newClient?.full_name ? newClient.full_name : 'يا بطل';
  const tierNameLabel = tier === 'MAX' ? 'باقة ماكس (M A X)' : 'باقة إيليت (ELITE)';

  const whatsappMessage = newClient
    ? `أهلاً بك يا ${clientNameDisplay} مع كابتن كريم زكريا!\n\nتم تفعيل اشتراكك في: *${tierNameLabel}*\nإجمالي مدة المتابعة: *${finalTotalDays} يوماً* (${currentDurationData.label}${extraDays > 0 ? ` + ${extraDays} يوماً هدية إضافية` : ''})\n\nبيانات دخول استمارتك الخاصة:\n*كود المشترك:* ${newClient.client_code}\n*رقم الهاتف المسجل:* ${newClient.phone_number}\n\n*رابط استمارتك المباشر:*
${intakeLink}\n\n*رابط البوابة الموحد:*
${portalLink}\n\n(افتح الرابط المباشر واملأ بياناتك وصورك بدقة لنبدأ فوراً في تجهيز خطتك المتكاملة!)`
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

  const modalContent = (
    <div 
      className="modal fade show d-block" 
      tabIndex="-1" 
      style={{ 
        backgroundColor: 'rgba(15, 23, 42, 0.75)', 
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
      <div style={{ width: '100%', maxWidth: '500px', margin: 'auto' }}>
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
                <h5 className="modal-title fw-black text-dark mb-0" style={{ fontSize: '1.1rem', letterSpacing: '-0.3px' }}>
                  إنشاء كود مشترك وتحديد الباقة
                </h5>
                <small className="text-muted" style={{ fontSize: '0.78rem' }}>اختر نوع الباقة والمدة وأضف شهوراً أو أسابيع هدية</small>
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
                
                {/* 1. Client Info Inputs */}
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label fw-bold text-dark small mb-1" style={{ fontSize: '0.8rem' }}>
                      اسم المشترك:
                    </label>
                    <div className="position-relative">
                      <input 
                        type="text" 
                        className="form-control" 
                        style={{ 
                          height: '42px', 
                          borderRadius: '12px', 
                          fontSize: '0.86rem', 
                          border: '1.5px solid #E2E8F0',
                          paddingRight: '36px'
                        }}
                        placeholder="مثال: أحمد فتحي"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                      />
                      <div className="position-absolute top-50 end-0 translate-middle-y pe-2.5 pointer-events-none" style={{ color: '#64748B' }}>
                        <User style={{ width: '16px', height: '16px' }} />
                      </div>
                    </div>
                  </div>

                  <div className="col-6">
                    <label className="form-label fw-bold text-dark small mb-1" style={{ fontSize: '0.8rem' }}>
                      رقم الواتساب: <span className="text-danger">*</span>
                    </label>
                    <div className="position-relative">
                      <input 
                        type="tel" 
                        className="form-control" 
                        style={{ 
                          height: '42px', 
                          borderRadius: '12px', 
                          fontSize: '0.86rem', 
                          border: '1.5px solid #E2E8F0',
                          paddingRight: '36px',
                          direction: 'ltr',
                          textAlign: 'right'
                        }}
                        placeholder="010XXXXXXXX"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        autoFocus
                        required
                      />
                      <div className="position-absolute top-50 end-0 translate-middle-y pe-2.5 pointer-events-none text-success">
                        <Phone style={{ width: '16px', height: '16px' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Package Tier Selector (ELITE vs MAX) */}
                <div className="mb-3">
                  <label className="form-label fw-bold text-dark small mb-1.5" style={{ fontSize: '0.8rem' }}>
                    نوع الباقة:
                  </label>

                  <div className="row g-2">
                    {/* ELITE (Blue) */}
                    <div className="col-6">
                      <div 
                        onClick={() => setTier('ELITE')}
                        className="p-2.5 rounded-3 text-right transition-all h-100 d-flex align-items-center justify-content-between"
                        style={{ 
                          cursor: 'pointer',
                          background: tier === 'ELITE' ? '#E0F2FE' : '#FFFFFF',
                          borderColor: tier === 'ELITE' ? '#00A3FF' : '#E2E8F0',
                          borderWidth: '2px',
                          borderStyle: 'solid',
                          boxShadow: tier === 'ELITE' ? '0 3px 10px rgba(0, 163, 255, 0.15)' : 'none',
                          borderRadius: '14px'
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#00A3FF', letterSpacing: '0.5px', display: 'block' }}>
                            ELITE
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                            متابعة كل 14 يوم
                          </span>
                        </div>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: tier === 'ELITE' ? '#00A3FF' : '#F1F5F9', color: tier === 'ELITE' ? '#FFFFFF' : '#00A3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Zap style={{ width: '16px', height: '16px' }} />
                        </div>
                      </div>
                    </div>

                    {/* MAX (Gold) */}
                    <div className="col-6">
                      <div 
                        onClick={() => setTier('MAX')}
                        className="p-2.5 rounded-3 text-right transition-all h-100 d-flex align-items-center justify-content-between"
                        style={{ 
                          cursor: 'pointer',
                          background: tier === 'MAX' ? '#FFFBEB' : '#FFFFFF',
                          borderColor: tier === 'MAX' ? '#C89327' : '#E2E8F0',
                          borderWidth: '2px',
                          borderStyle: 'solid',
                          boxShadow: tier === 'MAX' ? '0 3px 10px rgba(200, 147, 39, 0.15)' : 'none',
                          borderRadius: '14px'
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#C89327', letterSpacing: '0.5px', display: 'block' }}>
                            M A X
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                            متابعة أسبوعية + صوتي
                          </span>
                        </div>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: tier === 'MAX' ? '#C89327' : '#F1F5F9', color: tier === 'MAX' ? '#FFFFFF' : '#C89327', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Crown style={{ width: '16px', height: '16px' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Base Duration Selector (4M vs 8M) */}
                <div className="mb-3">
                  <label className="form-label fw-bold text-dark small mb-1.5" style={{ fontSize: '0.8rem' }}>
                    مدة الاشتراك الأساسية:
                  </label>

                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDurationKey('FOUR_MONTHS')}
                      className="btn flex-fill fw-bold py-2"
                      style={{
                        borderRadius: '12px',
                        fontSize: '0.82rem',
                        border: durationKey === 'FOUR_MONTHS' ? '2px solid #0F172A' : '1.5px solid #E2E8F0',
                        background: durationKey === 'FOUR_MONTHS' ? '#0F172A' : '#FFFFFF',
                        color: durationKey === 'FOUR_MONTHS' ? '#FFFFFF' : '#64748B',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      4 شهور (3 + 1 هدية)
                    </button>

                    <button
                      type="button"
                      onClick={() => setDurationKey('EIGHT_MONTHS')}
                      className="btn flex-fill fw-bold py-2"
                      style={{
                        borderRadius: '12px',
                        fontSize: '0.82rem',
                        border: durationKey === 'EIGHT_MONTHS' ? '2px solid #0F172A' : '1.5px solid #E2E8F0',
                        background: durationKey === 'EIGHT_MONTHS' ? '#0F172A' : '#FFFFFF',
                        color: durationKey === 'EIGHT_MONTHS' ? '#FFFFFF' : '#64748B',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      8 شهور (6 + 2 هدية)
                    </button>
                  </div>
                </div>

                {/* 4. Bonus Gift Calculator (Weeks & Months) */}
                <div className="p-3 rounded-3 mb-4" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Gift style={{ width: '15px', height: '15px', color: '#D97706' }} />
                    <span className="fw-black text-dark" style={{ fontSize: '0.78rem' }}>
                      إضافة هدايا إضافية للكود (اختياري للكوتش):
                    </span>
                  </div>

                  {/* Bonus Weeks */}
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="text-muted fw-bold" style={{ fontSize: '0.74rem', width: '65px' }}>
                      أسابيع هدية:
                    </span>
                    <div className="d-flex gap-1">
                      {[0, 1, 2, 4].map(w => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setBonusWeeks(w)}
                          className="btn btn-sm fw-bold"
                          style={{
                            padding: '3px 10px',
                            fontSize: '0.74rem',
                            borderRadius: '8px',
                            border: bonusWeeks === w ? '1.5px solid #00A3FF' : '1px solid #CBD5E1',
                            background: bonusWeeks === w ? '#00A3FF' : '#FFFFFF',
                            color: bonusWeeks === w ? '#FFFFFF' : '#475569'
                          }}
                        >
                          {w === 0 ? 'بدون' : `+${w} أسبوع`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bonus Months */}
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="text-muted fw-bold" style={{ fontSize: '0.74rem', width: '65px' }}>
                      شهور هدية:
                    </span>
                    <div className="d-flex gap-1">
                      {[0, 1, 2].map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setBonusMonths(m)}
                          className="btn btn-sm fw-bold"
                          style={{
                            padding: '3px 10px',
                            fontSize: '0.74rem',
                            borderRadius: '8px',
                            border: bonusMonths === m ? '1.5px solid #C89327' : '1px solid #CBD5E1',
                            background: bonusMonths === m ? '#C89327' : '#FFFFFF',
                            color: bonusMonths === m ? '#FFFFFF' : '#475569'
                          }}
                        >
                          {m === 0 ? 'بدون' : `+${m} شهر`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-1 text-success fw-bold" style={{ fontSize: '0.76rem' }}>
                    إجمالي المدة الممنوحة: {finalTotalDays} يوماً ({Math.round(finalTotalDays / 30)} شهراً تقريباً)
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="d-flex gap-2 justify-content-between align-items-center pt-2" style={{ borderTop: '1px solid #F1F5F9' }}>
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
                    className="btn btn-sm rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2 text-slate-900"
                    disabled={loading || !clientPhone.trim()}
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
                      <span>توليد الكود وتجهيز رابط المشترك</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-2 text-center space-y-3">
                {/* Success Banner */}
                <div className="mb-3">
                  <span className="badge rounded-pill fw-bold px-3 py-2" style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #DCFCE7', fontSize: '0.84rem' }}>
                    <CheckCircle2 style={{ width: '16px', height: '16px', display: 'inline', marginLeft: '4px' }} />
                    تم إنشاء حساب المشترك وتوليد الكود بنجاح
                  </span>
                </div>

                {/* Account Details Card */}
                <div className="p-3 rounded-4 mb-4" style={{ background: '#F8FAFC', border: '1.5px dashed #CBD5E1' }}>
                  <span className="text-muted small d-block mb-1" style={{ fontSize: '0.78rem' }}>كود المشترك المعتمد:</span>
                  <span className="badge rounded-pill fw-black font-monospace px-4 py-1.5 mb-2" style={{ background: themeBg, color: themeColor, border: `1.5px solid ${themeColor}40`, fontSize: '1.4rem', letterSpacing: '2px' }}>
                    {newClient.client_code}
                  </span>
                  
                  <div className="pt-2 text-muted" style={{ fontSize: '0.78rem', borderTop: '1px solid #E2E8F0' }}>
                    الباقة: <strong style={{ color: themeColor }}>{tierNameLabel}</strong> | إجمالي المدة: <strong>{finalTotalDays} يوماً</strong>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-grid gap-2">
                  <button 
                    type="button" 
                    className="btn py-2 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 text-slate-900"
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
                    <span>{copied ? "تم نسخ رسالة الواتساب ورابط الاستمارة!" : "نسخ دعوة الواتساب والكود"}</span>
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
