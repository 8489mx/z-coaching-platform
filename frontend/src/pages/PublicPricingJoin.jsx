import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  Crown, 
  Sparkles, 
  ShieldCheck, 
  CreditCard, 
  Smartphone, 
  ArrowLeft,
  Calendar,
  Zap,
  MessageCircle
} from 'lucide-react';
import { SUPPORTED_PACKAGES, PAYMENT_METHODS, generateSecureIntakeToken } from '../utils/onboardingAcquisitionEngine';

export default function PublicPricingJoin() {
  const navigate = useNavigate();
  const [durationMonths, setDurationMonths] = useState(4); // 4 or 8
  const [selectedTier, setSelectedTier] = useState('MAX'); // 'MAX' or 'ELITE'
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.INSTAPAY);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedTokenData, setCompletedTokenData] = useState(null);

  const selectedPackageCode = `${selectedTier}_${durationMonths}M`;
  const currentPackage = SUPPORTED_PACKAGES[selectedPackageCode] || SUPPORTED_PACKAGES.MAX_4M;

  const handleSubmitPayment = (e) => {
    e.preventDefault();
    if (!clientName || !clientPhone) {
      alert('يرجى كتابة الاسم ورقم الهاتف للمتابعة');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const tokenResult = generateSecureIntakeToken({
        client_name: clientName,
        client_email: clientEmail || 'client@example.com',
        client_phone: clientPhone,
        package_code: selectedPackageCode,
        payment_method: paymentMethod,
        payment_reference: 'TXN-' + Math.floor(100000 + Math.random() * 900000)
      });
      setCompletedTokenData(tokenResult);
      setIsProcessing(false);
    }, 600);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(175deg, #0F172A 0%, #1E293B 100%)', color: '#FFFFFF', direction: 'rtl', fontFamily: 'Alexandria, Cairo, sans-serif', padding: '32px 16px' }}>
      <div style={{ maxWidth: '840px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(2, 132, 199, 0.2)', border: '1px solid rgba(2, 132, 199, 0.4)', padding: '4px 12px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', marginBottom: '12px' }}>
            <Sparkles style={{ width: '14px', height: '14px' }} />
            <span>الاشتراك المباشر مع كابتن كريم زكريا</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
            اختر باقتك وانطلق في رحلة التحول الكبرى
          </h1>
          <p style={{ fontSize: '0.86rem', color: '#94A3B8', maxWidth: '520px', margin: '0 auto' }}>
            باقات احترافية محددة بدقة (Elite أو Max) لمدة 4 أشهر أو 8 أشهر للمتابعة الفسيولوجية والسريرية الكاملة.
          </p>

          {/* Duration Selector Tabs */}
          <div style={{ display: 'inline-flex', gap: '6px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.12)', padding: '4px', borderRadius: '14px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => setDurationMonths(4)}
              style={{
                padding: '8px 20px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                background: durationMonths === 4 ? '#0284C7' : 'transparent',
                color: durationMonths === 4 ? '#FFFFFF' : '#94A3B8',
                transition: 'all 0.15s ease'
              }}
            >
              4 شهور (4 شهور)
            </button>
            <button
              type="button"
              onClick={() => setDurationMonths(8)}
              style={{
                padding: '8px 20px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                background: durationMonths === 8 ? '#0284C7' : 'transparent',
                color: durationMonths === 8 ? '#FFFFFF' : '#94A3B8',
                transition: 'all 0.15s ease'
              }}
            >
              8 شهور (8 شهور)
            </button>
          </div>
        </div>

        {completedTokenData ? (
          /* SUCCESS STATE */
          <div style={{ background: '#FFFFFF', color: '#0F172A', borderRadius: '24px', padding: '36px 24px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <Check style={{ width: '36px', height: '36px' }} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 8px 0', color: '#0F172A' }}>
              تم تأكيد الاشتراك بنجاح يا {clientName}!
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#64748B', maxWidth: '480px', margin: '0 auto 20px auto', lineHeight: '1.6' }}>
              تم حجز مقعدك في <strong>{completedTokenData.package_details.name_ar}</strong>. الخطوة التالية هي ملء استمارتك الطبية والتدريبية لتجهيز برنامجك فوراً.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => navigate('/intake/form')}
                style={{ background: '#0284C7', color: '#FFFFFF', border: 'none', padding: '12px 28px', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 800, cursor: 'pointer' }}
              >
                ملء الاستمارة الآن (Intake Form)
              </button>

              <a
                href={completedTokenData.whatsapp_dispatch_url}
                target="_blank"
                rel="noreferrer"
                style={{ background: '#16A34A', color: '#FFFFFF', textDecoration: 'none', padding: '12px 24px', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <MessageCircle style={{ width: '16px', height: '16px' }} />
                <span>تأكيد عبر واتساب الكابتن</span>
              </a>
            </div>
          </div>
        ) : (
          /* PRICING & CHECKOUT FORM */
          <form onSubmit={handleSubmitPayment}>
            
            {/* Packages Grid: 2 TIERS ONLY */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              
              {/* MAX TIER */}
              <div 
                onClick={() => setSelectedTier('MAX')}
                style={{
                  background: selectedTier === 'MAX' ? 'rgba(2, 132, 199, 0.15)' : 'rgba(255,255,255,0.03)',
                  border: selectedTier === 'MAX' ? '2px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '20px',
                  padding: '20px',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#FEF3C7', color: '#92400E', fontSize: '9px', fontWeight: 900, padding: '2px 8px', borderRadius: '6px' }}>
                  الأكثر شمولاً (Max)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Crown style={{ width: '22px', height: '22px', color: '#FBBF24' }} />
                  <strong style={{ fontSize: '1.05rem' }}>باقة ماكس (Max)</strong>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38BDF8', marginBottom: '12px' }}>
                  {durationMonths === 4 ? '2,800' : '4,800'} <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>ج.م / {durationMonths === 4 ? '4 شهور (4 شهور)' : '8 شهور (8 شهور)'}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.78rem', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>✓ متابعة دورية مباشرة عبر الواتساب</li>
                  <li>✓ خطة تغذية مخصصة وتعديل دوري للماكروز</li>
                  <li>✓ برنامج تدريبي كامل للجيم والبيت بالفيديو</li>
                  <li>✓ تحليل مقاطع التكنيك وتطور الأوزان</li>
                </ul>
              </div>

              {/* ELITE TIER */}
              <div 
                onClick={() => setSelectedTier('ELITE')}
                style={{
                  background: selectedTier === 'ELITE' ? 'rgba(2, 132, 199, 0.15)' : 'rgba(255,255,255,0.03)',
                  border: selectedTier === 'ELITE' ? '2px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '20px',
                  padding: '20px',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#E0F2FE', color: '#0369A1', fontSize: '9px', fontWeight: 900, padding: '2px 8px', borderRadius: '6px' }}>
                  كبار المشتركين (Elite VIP)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Zap style={{ width: '20px', height: '20px', color: '#0284C7' }} />
                  <strong style={{ fontSize: '1.05rem' }}>باقة إيليت (Elite)</strong>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38BDF8', marginBottom: '12px' }}>
                  {durationMonths === 4 ? '3,800' : '6,800'} <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>ج.م / {durationMonths === 4 ? '4 شهور (4 شهور)' : '8 شهور (8 شهور)'}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.78rem', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>✓ متابعة VIP وتدريب شخصي مخصص</li>
                  <li>✓ تعديل فوري ومباشر للماكروز والدايت</li>
                  <li>✓ تحليل حركي متقدم وبروتوكول استشفاء</li>
                  <li>✓ دعم سريري وتأهيل كامل للإصابات</li>
                </ul>
              </div>

            </div>

            {/* Client Details Form */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 14px 0', color: '#FFFFFF' }}>
                بيانات المشترك وطريقة السداد
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>الاسم بالكامل *</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="اكتب اسمك..."
                    style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px', color: '#FFFFFF', fontSize: '0.82rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>رقم الواتساب للتواصل *</label>
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="01012345678"
                    style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px', color: '#FFFFFF', fontSize: '0.82rem', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Payment Methods */}
              <label style={{ fontSize: '0.76rem', color: '#94A3B8', display: 'block', marginBottom: '8px' }}>اختر طريقة التحويل</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                {[
                  { id: PAYMENT_METHODS.INSTAPAY, label: 'InstaPay (إنستاباي)', icon: Smartphone },
                  { id: PAYMENT_METHODS.VODAFONE_CASH, label: 'فودافون كاش', icon: Smartphone },
                  { id: PAYMENT_METHODS.STRIPE_CARD, label: 'بطاقة بنكية / فيزا', icon: CreditCard },
                ].map(pm => {
                  const Icon = pm.icon;
                  const isSel = paymentMethod === pm.id;
                  return (
                    <div
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id)}
                      style={{
                        background: isSel ? 'rgba(2, 132, 199, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                        border: isSel ? '1.5px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        padding: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 700
                      }}
                    >
                      <Icon style={{ width: '16px', height: '16px', color: isSel ? '#38BDF8' : '#94A3B8' }} />
                      <span>{pm.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessing}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '14px',
                borderRadius: '14px',
                fontSize: '0.95rem',
                fontWeight: 900,
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(2, 132, 199, 0.3)'
              }}
            >
              {isProcessing ? 'جارٍ تأكيد الاشتراك...' : `تأكيد اشتراك ${currentPackage.name_ar} الآن`}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
