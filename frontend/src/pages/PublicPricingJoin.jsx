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
  const [selectedPackage, setSelectedPackage] = useState(SUPPORTED_PACKAGES.MAX_3_PLUS_1.code);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.INSTAPAY);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedTokenData, setCompletedTokenData] = useState(null);

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
        package_code: selectedPackage,
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
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(2, 132, 199, 0.2)', border: '1px solid rgba(2, 132, 199, 0.4)', padding: '4px 12px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', marginBottom: '12px' }}>
            <Sparkles style={{ width: '14px', height: '14px' }} />
            <span>الاشتراك المباشر مع كابتن كريم زكريا</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
            اختر باقتك وانطلق في رحلة التحول الكبرى
          </h1>
          <p style={{ fontSize: '0.86rem', color: '#94A3B8', maxWidth: '520px', margin: '0 auto' }}>
            اشتراك شامل 16 أسبوعاً (3 شهور + شهر مجاناً) مع المتابعة الفسيولوجية والسريرية الدقيقة.
          </p>
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
            
            {/* Packages Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              
              {/* MAX VIP */}
              <div 
                onClick={() => setSelectedPackage(SUPPORTED_PACKAGES.MAX_3_PLUS_1.code)}
                style={{
                  background: selectedPackage === SUPPORTED_PACKAGES.MAX_3_PLUS_1.code ? 'rgba(2, 132, 199, 0.15)' : 'rgba(255,255,255,0.03)',
                  border: selectedPackage === SUPPORTED_PACKAGES.MAX_3_PLUS_1.code ? '2px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '20px',
                  padding: '20px',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#FEF3C7', color: '#92400E', fontSize: '9px', fontWeight: 900, padding: '2px 8px', borderRadius: '6px' }}>
                  الأكثر طلباً (VIP)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Crown style={{ width: '22px', height: '22px', color: '#FBBF24' }} />
                  <strong style={{ fontSize: '1.05rem' }}>باقة ماكس VIP</strong>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38BDF8', marginBottom: '12px' }}>
                  4,500 <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>ج.م / 16 أسبوعاً</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.78rem', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>✓ متابعة أسبوعية دقيقة (كل 7 أيام)</li>
                  <li>✓ تعديل فوري للماكروز والتمارين بنقرة زر</li>
                  <li>✓ تواصل مباشر على الواتساب مع كابتن كريم</li>
                  <li>✓ صلاحية تجميد حتى 21 يوماً</li>
                </ul>
              </div>

              {/* ELITE */}
              <div 
                onClick={() => setSelectedPackage(SUPPORTED_PACKAGES.ELITE_3_PLUS_1.code)}
                style={{
                  background: selectedPackage === SUPPORTED_PACKAGES.ELITE_3_PLUS_1.code ? 'rgba(2, 132, 199, 0.15)' : 'rgba(255,255,255,0.03)',
                  border: selectedPackage === SUPPORTED_PACKAGES.ELITE_3_PLUS_1.code ? '2px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '20px',
                  padding: '20px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Zap style={{ width: '20px', height: '20px', color: '#0284C7' }} />
                  <strong style={{ fontSize: '1.05rem' }}>باقة إيليت</strong>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38BDF8', marginBottom: '12px' }}>
                  3,000 <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>ج.م / 16 أسبوعاً</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.78rem', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>✓ متابعة نصف شهرية (كل 14 يوماً)</li>
                  <li>✓ برنامج التغذية والتدريب التكيفي الكامل</li>
                  <li>✓ الوصول الشامل لتطبيق المشترك التفاعلي</li>
                  <li>✓ صلاحية تجميد حتى 21 يوماً</li>
                </ul>
              </div>

            </div>

            {/* Inputs Form */}
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '0.94rem', fontWeight: 800, marginBottom: '14px', margin: '0 0 14px 0' }}>بيانات المشترك وطريقة الدفع</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>الاسم بالكامل</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: سارة المنصوري"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', padding: '10px', color: '#FFFFFF', fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>رقم الهاتف / الواتساب</label>
                  <input
                    type="tel"
                    required
                    placeholder="مثال: 01011111110"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', padding: '10px', color: '#FFFFFF', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '8px' }}>اختر طريقة الدفع</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {[
                    { id: PAYMENT_METHODS.INSTAPAY, label: 'InstaPay (إنستاباي)' },
                    { id: PAYMENT_METHODS.VODAFONE_CASH, label: 'Vodafone Cash (فودافون كاش)' },
                    { id: PAYMENT_METHODS.CREDIT_CARD, label: 'بطاقة بنكية (Credit/Debit)' }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      style={{
                        background: paymentMethod === m.id ? '#0284C7' : 'rgba(255,255,255,0.08)',
                        border: paymentMethod === m.id ? '1px solid #38BDF8' : '1px solid transparent',
                        color: '#FFFFFF',
                        borderRadius: '10px',
                        padding: '8px 14px',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* CTA Button */}
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
                fontSize: '0.94rem',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 10px 20px rgba(2, 132, 199, 0.3)'
              }}
            >
              {isProcessing ? 'جاري تأكيد الدفع وتوليد الاستمارة...' : 'تأكيد الاشتراك والانتقال للاستمارة 🚀'}
            </button>

          </form>
        )}

      </div>
    </div>
  );
}
