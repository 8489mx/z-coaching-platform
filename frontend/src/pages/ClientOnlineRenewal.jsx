import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Crown,
  Copy,
  Check,
  MessageCircle,
  User
} from 'lucide-react';
import { API_BASE } from '../config/api';
import { getStoredCoachConfig } from '../utils/themeAndCoachConfig';
import { formatWhatsAppPhone } from '../utils/whatsappRemindersEngine';

export default function ClientOnlineRenewal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryCode = searchParams.get('code') || searchParams.get('user_id') || '';

  const storedCode = localStorage.getItem('kz_client_code') || localStorage.getItem('client_code') || '';
  const initialCode = queryCode || storedCode || '';

  const [clientCode, setClientCode] = useState(initialCode);
  const [clientName, setClientName] = useState('');
  const [_clientPhone, setClientPhone] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(4); // 4 | 2 | 1 months
  const [selectedTier, setSelectedTier] = useState('MAX'); // MAX | ELITE
  const [paymentMethod, setPaymentMethod] = useState('INSTAPAY'); // INSTAPAY | VCASH | BANK
  const [refNumber, setRefNumber] = useState('');
  const [copiedField, setCopiedField] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Default Pricing per package
  const pricingMap = {
    4: { MAX: 6000, ELITE: 4500, label: '4 شهور (الباقة الأساسية الكاملة)', days: 120 },
    2: { MAX: 3500, ELITE: 2800, label: 'شهرين (نصف باقة)', days: 60 },
    1: { MAX: 2000, ELITE: 1600, label: 'شهر واحد (تجديد شهري)', days: 30 },
  };

  const currentPrice = pricingMap[selectedDuration]?.[selectedTier] || 6000;

  // Auto-fetch client info if code provided
  useEffect(() => {
    if (clientCode) {
      const clean = String(clientCode).replace(/^#+/, '').replace(/^client[-_]?/i, '').trim().toLowerCase();
      if (clean) {
        fetch(`${API_BASE}/api/v1/clients`)
          .then(res => res.json())
          .then(data => {
            if (data.clients && Array.isArray(data.clients)) {
              const found = data.clients.find(c => {
                const cCode = String(c.client_code || '').replace(/^#+/, '').trim().toLowerCase();
                const cId = String(c.id || '').trim().toLowerCase();
                return cCode === clean || cId === clean;
              });
              if (found) {
                setClientName(found.full_name || found.name || '');
                setClientPhone(found.phone_number || '');
                const isMax = String(found.package || found.subscription_package || found.package_tier || '').toUpperCase().includes('MAX');
                setSelectedTier(isMax ? 'MAX' : 'ELITE');
              }
            }
          })
          .catch(() => {});
      }
    }
  }, [clientCode]);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);

    const cleanCode = String(clientCode || '').replace(/^#+/, '').replace(/^client[-_]?/i, '').trim();

    setSubmittedSuccess(true);
    setSubmitting(false);

    // Build WhatsApp message to Coach Karim
    const methodArabic = paymentMethod === 'INSTAPAY' ? 'إنستاباي (InstaPay)' :
                         paymentMethod === 'VCASH' ? 'فودافون كاش' : 'تحويل بنكي';
    
    const waText = encodeURIComponent(
      `مساء الخير يا كابتن كريم!\n` +
      `أنا المشترك: ${clientName || 'بطل'}\n` +
      `كود الاشتراك: #${cleanCode || clientCode}\n` +
      `قمت بطلب تجديد: باقة ${selectedDuration} شهور (${selectedTier === 'MAX' ? 'باقة MAX' : 'باقة ELITE'}) بمبلغ ${currentPrice.toLocaleString('en-US')} ج.م.\n` +
      `طريقة التحويل: ${methodArabic}\n` +
      `الرقم المرجعي / اسم المحول: ${refNumber || 'تم الإرسال'}\n` +
      `برجاء تأكيد التفعيل واستمرار الخطة!`
    );

    // Open WhatsApp
    const coachConfig = getStoredCoachConfig();
    const coachWhatsApp = formatWhatsAppPhone(coachConfig?.whatsappNumber || coachConfig?.supportWhatsapp || '201001060503');
    window.open(`https://wa.me/${coachWhatsApp}?text=${waText}`, '_blank');
  };

  return (
    <div 
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
        color: '#FFFFFF',
        fontFamily: 'Cairo, sans-serif',
        padding: '40px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '560px',
          background: '#FFFFFF',
          borderRadius: '24px',
          color: '#0F172A',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          border: '1px solid #E2E8F0'
        }}
      >
        {/* Top Header */}
        <div style={{
          background: '#0F172A',
          color: '#FFFFFF',
          padding: '24px 20px',
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto',
            color: '#FFFFFF',
            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.35)'
          }}>
            <Crown size={26} />
          </div>

          <h1 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 900 }}>
            تجديد وتفعيل الباقة التدريبية
          </h1>
          <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
            كابتن كريم زكريا • منظومة التدريب والمتابعة الخاصة
          </p>
        </div>

        {submittedSuccess ? (
          <div style={{ padding: '36px 24px', textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#DCFCE7',
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              تم إرسال طلب التجديد بنجاح!
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748B', lineHeight: 1.6, marginBottom: '24px' }}>
              تم تسجيل بيانات التجديد بنجاح وفتح محادثة الواتساب مع الكابتن لتأكيد التفعيل الفوري لحسابك واستمرار خطتك.
            </p>

            <button
              type="button"
              onClick={() => navigate('/client/today')}
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '10px',
                background: '#0F172A',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              الرجوع لتطبيق المشترك ومتابعة اليوم
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
            
            {/* 1. Client Identity */}
            <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '20px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} color="#0F172A" />
                <span>بيانات المشترك:</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#64748B', fontWeight: 700, marginBottom: '4px' }}>
                    كود المشترك الخاص بك:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 15 أو #15"
                    value={clientCode}
                    onChange={(e) => setClientCode(e.target.value)}
                    style={{
                      width: '100%',
                      height: '36px',
                      padding: '0 10px',
                      borderRadius: '9999px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      fontWeight: 800,
                      color: '#0F172A',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#64748B', fontWeight: 700, marginBottom: '4px' }}>
                    اسمك المسجل:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="اسمك ثلاثي"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    style={{
                      width: '100%',
                      height: '36px',
                      padding: '0 10px',
                      borderRadius: '9999px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#0F172A',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 2. Package Selection */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                اختر مدة الباقة المراد تجديدها:
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { duration: 4, label: '4 شهور', sub: 'الباقة الأساسية', badge: 'الأكثر توفيراً' },
                  { duration: 2, label: 'شهرين', sub: 'نصف باقة', badge: null },
                  { duration: 1, label: 'شهر واحد', sub: 'تجديد شهري', badge: null },
                ].map((item) => {
                  const isActive = selectedDuration === item.duration;
                  return (
                    <div
                      key={item.duration}
                      onClick={() => setSelectedDuration(item.duration)}
                      style={{
                        padding: '12px 8px',
                        borderRadius: '10px',
                        border: isActive ? '2px solid #0F172A' : '1px solid #E2E8F0',
                        background: isActive ? '#F8FAFC' : '#FFFFFF',
                        cursor: 'pointer',
                        textAlign: 'center',
                        position: 'relative',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      {item.badge && (
                        <span style={{
                          position: 'absolute',
                          top: '-8px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: '#D97706',
                          color: '#FFFFFF',
                          fontSize: '8.5px',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '10px',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.badge}
                        </span>
                      )}
                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: isActive ? '#0F172A' : '#475569' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '9.5px', color: '#64748B', marginTop: '2px' }}>
                        {item.sub}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total Price Bar */}
            <div style={{
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '10px',
              padding: '10px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div>
                <span style={{ fontSize: '11.5px', color: '#166534', fontWeight: 700, display: 'block' }}>
                  إجمالي قيمة التجديد ({selectedDuration} شهور):
                </span>
                <span style={{ fontSize: '10px', color: '#15803D' }}>
                  {pricingMap[selectedDuration]?.days} يوماً متابعة شاملة
                </span>
              </div>
              <strong style={{ fontSize: '18px', fontWeight: 900, color: '#166534', fontFamily: 'JetBrains Mono, Cairo' }}>
                {currentPrice.toLocaleString('en-US')} ج.م
              </strong>
            </div>

            {/* 3. Payment Method Details */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                طريقة التحويل (اختر لتحويل المبلغ):
              </label>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                {[
                  { id: 'INSTAPAY', label: 'إنستاباي (InstaPay)' },
                  { id: 'VCASH', label: 'فودافون كاش' },
                  { id: 'BANK', label: 'تحويل بنكي' },
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: '9999px',
                      border: paymentMethod === m.id ? '2px solid #0F172A' : '1px solid #E2E8F0',
                      background: paymentMethod === m.id ? '#0F172A' : '#FFFFFF',
                      color: paymentMethod === m.id ? '#FFFFFF' : '#475569',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Payment Info Card */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 14px' }}>
                {paymentMethod === 'INSTAPAY' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block' }}>معرف إنستاباي (IPA / Phone):</span>
                      <strong style={{ fontSize: '14px', color: '#0F172A', fontFamily: 'monospace' }}>01001060503</strong>
                      <small style={{ display: 'block', fontSize: '10px', color: '#94A3B8' }}>كابتن كريم زكريا</small>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('01001060503', 'instapay')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '9999px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        color: '#0F172A',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copiedField === 'instapay' ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
                      <span>{copiedField === 'instapay' ? 'تم النسخ!' : 'نسخ'}</span>
                    </button>
                  </div>
                )}

                {paymentMethod === 'VCASH' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block' }}>رقم محفظة فودافون كاش:</span>
                      <strong style={{ fontSize: '14px', color: '#0F172A', fontFamily: 'monospace' }}>01001060503</strong>
                      <small style={{ display: 'block', fontSize: '10px', color: '#94A3B8' }}>تحويل أموال كاش</small>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('01001060503', 'vcash')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '9999px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        color: '#0F172A',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copiedField === 'vcash' ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
                      <span>{copiedField === 'vcash' ? 'تم النسخ!' : 'نسخ'}</span>
                    </button>
                  </div>
                )}

                {paymentMethod === 'BANK' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block' }}>رقم الحساب البنكي / IBAN:</span>
                      <strong style={{ fontSize: '12.5px', color: '#0F172A', fontFamily: 'monospace' }}>EG12000000000001001060503</strong>
                      <small style={{ display: 'block', fontSize: '10px', color: '#94A3B8' }}>البنك التجاري الدولي (CIB)</small>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('EG12000000000001001060503', 'bank')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '9999px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        color: '#0F172A',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copiedField === 'bank' ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
                      <span>{copiedField === 'bank' ? 'تم النسخ!' : 'نسخ'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Reference Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                الرقم المرجعي للتحويل أو اسم الحساب المحول منه:
              </label>
              <input
                type="text"
                placeholder="مثال: رقم العملية أو اسم صاحب الحساب"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 10px',
                  borderRadius: '9999px',
                  border: '1px solid #CBD5E1',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Submit & WhatsApp Button */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                height: '46px',
                borderRadius: '10px',
                border: 'none',
                background: '#16A34A',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
              }}
            >
              <MessageCircle size={18} />
              <span>تأكيد التحويل وإرسال إشعار التجديد للكابتن عبر واتساب</span>
            </button>

          </form>
        )}

      </div>
    </div>
  );
}
