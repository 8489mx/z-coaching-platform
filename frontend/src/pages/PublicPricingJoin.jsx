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
  MessageCircle,
  X
} from 'lucide-react';
import SubscriptionCardsView from '../components/subscription/SubscriptionCardsView';
import { SUBSCRIPTION_TIERS } from '../config/subscription-tiers';
import { PAYMENT_METHODS, generateSecureIntakeToken } from '../utils/onboardingAcquisitionEngine';

export default function PublicPricingJoin() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null); // { tier: 'MAX' | 'ELITE', durationKey: 'FOUR_MONTHS' | 'EIGHT_MONTHS' }
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.INSTAPAY);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedTokenData, setCompletedTokenData] = useState(null);

  const handleSelectTier = (tier, durationKey) => {
    setSelectedPlan({ tier, durationKey });
  };

  const currentTierData = selectedPlan ? SUBSCRIPTION_TIERS[selectedPlan.tier] : null;
  const currentDurationData = selectedPlan ? currentTierData.durations[selectedPlan.durationKey] : null;

  const handleSubmitPayment = (e) => {
    e.preventDefault();
    if (!clientName || !clientPhone || !selectedPlan) {
      alert('يرجى كتابة الاسم ورقم الهاتف للمتابعة');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const packageCode = `${selectedPlan.tier}_${currentDurationData.id}`;
      const tokenResult = generateSecureIntakeToken({
        client_name: clientName,
        client_email: clientEmail || 'client@example.com',
        client_phone: clientPhone,
        package_code: packageCode,
        payment_method: paymentMethod,
        payment_reference: 'TXN-' + Math.floor(100000 + Math.random() * 900000)
      });
      setCompletedTokenData(tokenResult);
      setIsProcessing(false);
    }, 600);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(175deg, #0F172A 0%, #1E293B 100%)', color: '#FFFFFF', direction: 'rtl', fontFamily: 'Alexandria, Cairo, sans-serif', padding: '36px 16px' }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        
        {/* Top Branding Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(2, 132, 199, 0.2)', border: '1px solid rgba(2, 132, 199, 0.4)', padding: '4px 14px', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 800, color: '#38BDF8', marginBottom: '12px' }}>
            <Sparkles style={{ width: '14px', height: '14px' }} />
            <span>الاشتراك المباشر مع كابتن كريم زكريا</span>
          </div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 900, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
            اختر باقتك وانطلق في رحلة التحول الكبرى
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#94A3B8', maxWidth: '580px', margin: '0 auto' }}>
            باقات احترافية محددة بدقة (ELITE و MAX) للمتابعة الفسيولوجية والسريرية الكاملة.
          </p>
        </div>

        {completedTokenData ? (
          /* SUCCESS STATE */
          <div style={{ background: '#FFFFFF', color: '#0F172A', borderRadius: '28px', padding: '40px 24px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <Check style={{ width: '36px', height: '36px' }} />
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 900, margin: '0 0 8px 0', color: '#0F172A' }}>
              تم تأكيد الاشتراك بنجاح يا {clientName}!
            </h2>
            <p style={{ fontSize: '0.86rem', color: '#64748B', maxWidth: '480px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
              تم حجز مقعدك في <strong>{completedTokenData.package_details.name_ar}</strong>. الخطوة التالية هي ملء استمارتك الطبية والتدريبية لتجهيز برنامجك فوراً.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => navigate('/intake/form')}
                style={{ background: '#00A3FF', color: '#FFFFFF', border: 'none', padding: '12px 28px', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 800, cursor: 'pointer' }}
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
          <div>
            {/* 1. Subscription Cards View */}
            <SubscriptionCardsView onSelectTier={handleSelectTier} />

            {/* 2. Checkout Modal / Drawer when a plan is selected */}
            {selectedPlan && (
              <div 
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(15, 23, 42, 0.8)',
                  backdropFilter: 'blur(8px)',
                  zIndex: 9999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px'
                }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) setSelectedPlan(null);
                }}
              >
                <div 
                  style={{
                    width: '100%',
                    maxWidth: '480px',
                    background: '#FFFFFF',
                    borderRadius: '24px',
                    padding: '24px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    color: '#0F172A',
                    direction: 'rtl'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                        تأكيد الاشتراك في {selectedPlan.tier === 'MAX' ? 'باقة M A X' : 'باقة ELITE'}
                      </h3>
                      <span style={{ fontSize: '0.76rem', color: selectedPlan.tier === 'MAX' ? '#B45309' : '#0284C7', fontWeight: 700 }}>
                        {currentDurationData.label} — {currentDurationData.priceEgp.toLocaleString()} ج.م
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPlan(null)}
                      style={{ background: '#F1F5F9', border: 'none', width: '28px', height: '28px', borderRadius: '8px', color: '#64748B', cursor: 'pointer' }}
                    >
                      <X style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitPayment} className="space-y-3">
                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#475569', display: 'block', fontWeight: 700, marginBottom: '4px' }}>الاسم بالكامل *</label>
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="اكتب اسمك..."
                        style={{ width: '100%', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '10px 14px', color: '#0F172A', fontSize: '0.86rem', outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#475569', display: 'block', fontWeight: 700, marginBottom: '4px' }}>رقم الواتساب للتواصل *</label>
                      <input
                        type="tel"
                        required
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="010XXXXXXXX"
                        style={{ width: '100%', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '10px 14px', color: '#0F172A', fontSize: '0.86rem', outline: 'none', direction: 'ltr', textAlign: 'right' }}
                      />
                    </div>

                    {/* Payment Method Selector */}
                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#475569', display: 'block', fontWeight: 700, marginBottom: '6px' }}>اختر طريقة التحويل</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {[
                          { id: PAYMENT_METHODS.INSTAPAY, label: 'InstaPay إنستاباي', icon: Smartphone },
                          { id: PAYMENT_METHODS.VODAFONE_CASH, label: 'فودافون كاش', icon: Smartphone },
                        ].map(pm => {
                          const Icon = pm.icon;
                          const isSel = paymentMethod === pm.id;
                          return (
                            <div
                              key={pm.id}
                              onClick={() => setPaymentMethod(pm.id)}
                              style={{
                                background: isSel ? '#E0F2FE' : '#F8FAFC',
                                border: isSel ? '1.5px solid #00A3FF' : '1px solid #E2E8F0',
                                borderRadius: '12px',
                                padding: '10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                color: isSel ? '#0284C7' : '#475569'
                              }}
                            >
                              <Icon style={{ width: '16px', height: '16px' }} />
                              <span>{pm.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessing}
                      style={{
                        width: '100%',
                        background: selectedPlan.tier === 'MAX' ? 'linear-gradient(135deg, #D9A738 0%, #BF8D24 100%)' : 'linear-gradient(135deg, #00A3FF 0%, #0284C7 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '14px',
                        borderRadius: '14px',
                        fontSize: '0.92rem',
                        fontWeight: 900,
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        marginTop: '12px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                      }}
                    >
                      {isProcessing ? 'جارٍ تأكيد الاشتراك...' : `تأكيد الاشتراك (${currentDurationData.priceEgp.toLocaleString()} ج.م)`}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
