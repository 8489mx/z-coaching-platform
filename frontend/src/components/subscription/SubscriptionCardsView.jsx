import React, { useState } from 'react';
import { Check, ArrowLeft, Crown, Zap } from 'lucide-react';
import { SUBSCRIPTION_TIERS } from '../../config/subscription-tiers';

export default function SubscriptionCardsView({ onSelectTier }) {
  const [eliteDuration, setEliteDuration] = useState('FOUR_MONTHS');
  const [maxDuration, setMaxDuration] = useState('FOUR_MONTHS');

  const eliteData = SUBSCRIPTION_TIERS.ELITE;
  const maxData = SUBSCRIPTION_TIERS.MAX;

  return (
    <div className="py-8 px-2 max-w-5xl mx-auto font-sans" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* ================= CARD 1: MAX (Luxury Gold Card) ================= */}
        <div 
          style={{
            background: 'linear-gradient(180deg, #FFFDF5 0%, #FFF9E6 100%)',
            border: '2px solid #E5C158',
            borderRadius: '36px',
            padding: '32px 28px',
            boxShadow: '0 12px 36px rgba(200, 147, 39, 0.12)',
            position: 'relative'
          }}
          className="space-y-6"
        >
          {/* Top Badge */}
          <div 
            style={{
              position: 'absolute',
              top: '-14px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #C89327 0%, #B45309 100%)',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 900,
              padding: '4px 16px',
              borderRadius: '50px',
              boxShadow: '0 4px 12px rgba(200, 147, 39, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Crown style={{ width: '13px', height: '13px' }} />
            <span>تجربة التدريب الخاصة MAX</span>
          </div>

          {/* Header */}
          <div className="text-center space-y-2 pt-2">
            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '4px', color: '#B58A28', margin: 0 }}>
              M A X
            </h3>
            <div style={{ width: '48px', height: '4px', background: '#D4AF37', margin: '6px auto', borderRadius: '50px' }}></div>
            <p style={{ fontSize: '0.82rem', color: '#7A6229', lineHeight: '1.6', fontWeight: 600, margin: 0, padding: '0 8px' }}>
              تجربة التدريب الخاصة والمتابعة اللصيقة: كل مميزات Elite مع تقييم أسبوعي عميق، رسائل صوتية، وتوجيه مباشر.
            </p>
          </div>

          {/* Pricing */}
          <div className="text-center space-y-1">
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748B' }}>ج.م</span>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0F172A' }}>
                {maxData.durations[maxDuration].priceEgp.toLocaleString()}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94A3B8', textDecoration: 'line-through' }}>
              {maxData.durations[maxDuration].originalPriceEgp.toLocaleString()} ج.م
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-2.5 pt-2">
            {maxData.features.slice(0, 6).map((feat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.8rem', color: '#334155', fontWeight: 600, lineHeight: '1.5' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <Check style={{ width: '12px', height: '12px' }} />
                </div>
                <span>{feat}</span>
              </div>
            ))}

            {/* Divider for Max Exclusive */}
            <div style={{ padding: '8px 0', borderTop: '1px solid rgba(229, 193, 88, 0.4)', textAlign: 'center', margin: '12px 0 8px 0' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 900, color: '#92400E', background: '#FEF3C7', padding: '4px 14px', borderRadius: '50px', border: '1px solid #FDE68A' }}>
                إضافات باقة Max الخاصة
              </span>
            </div>

            {maxData.features.slice(6).map((feat, i) => (
              <div key={i + 6} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.8rem', color: '#78350F', fontWeight: 700, lineHeight: '1.5' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#FDE68A', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <Check style={{ width: '12px', height: '12px' }} />
                </div>
                <span>{feat}</span>
              </div>
            ))}
          </div>

          {/* Duration Selector */}
          <div className="pt-2 space-y-2">
            <select
              value={maxDuration}
              onChange={(e) => setMaxDuration(e.target.value)}
              style={{
                width: '100%',
                background: '#FFFFFF',
                border: '1.5px solid #FDE68A',
                borderRadius: '16px',
                padding: '12px 14px',
                fontSize: '0.84rem',
                fontWeight: 800,
                color: '#78350F',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="FOUR_MONTHS">3 شهور + شهر هدية (إجمالي 4 شهور)</option>
              <option value="EIGHT_MONTHS">6 شهور + شهرين هدية (إجمالي 8 شهور)</option>
            </select>
            <div style={{ textAlign: 'center', fontSize: '0.76rem', fontWeight: 800, color: '#92400E' }}>
              إجمالي مدة المتابعة: {maxDuration === 'FOUR_MONTHS' ? '4 شهور (120 يوماً)' : '8 شهور (240 يوماً)'}
            </div>
          </div>

          {/* CTA Button */}
          <button
            type="button"
            onClick={() => onSelectTier && onSelectTier('MAX', maxDuration)}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #D9A738 0%, #BF8D24 100%)',
              color: '#FFFFFF',
              fontWeight: 900,
              padding: '14px',
              borderRadius: '16px',
              fontSize: '0.88rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 6px 20px rgba(200, 147, 39, 0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            <span>اختيار MAX لمدة {maxDuration === 'FOUR_MONTHS' ? '4 شهور' : '8 شهور'}</span>
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* ================= CARD 2: ELITE (Cool Blue Card) ================= */}
        <div 
          style={{
            background: '#FFFFFF',
            border: '2px solid #00A3FF',
            borderRadius: '36px',
            padding: '32px 28px',
            boxShadow: '0 12px 36px rgba(0, 163, 255, 0.12)',
            position: 'relative'
          }}
          className="space-y-6"
        >
          {/* Badge */}
          <div 
            style={{
              position: 'absolute',
              top: '-14px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #00A3FF 0%, #0284C7 100%)',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 900,
              padding: '4px 16px',
              borderRadius: '50px',
              boxShadow: '0 4px 12px rgba(0, 163, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Zap style={{ width: '13px', height: '13px' }} />
            <span>الأكثر مبيعاً</span>
          </div>

          {/* Header */}
          <div className="text-center space-y-2 pt-2">
            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '4px', color: '#00A3FF', margin: 0 }}>
              ELITE
            </h3>
            <div style={{ width: '48px', height: '4px', background: '#00A3FF', margin: '6px auto', borderRadius: '50px' }}></div>
            <p style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: '1.6', fontWeight: 600, margin: 0, padding: '0 8px' }}>
              خطة التحول المتكاملة بنظام تدريبي وغذائي شامل ومتابعة دورية تضمن وصولك لهدفك بأعلى كفاءة.
            </p>
          </div>

          {/* Pricing */}
          <div className="text-center space-y-1">
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748B' }}>ج.م</span>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0F172A' }}>
                {eliteData.durations[eliteDuration].priceEgp.toLocaleString()}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94A3B8', textDecoration: 'line-through' }}>
              {eliteData.durations[eliteDuration].originalPriceEgp.toLocaleString()} ج.م
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-2.5 pt-2">
            {eliteData.features.map((feat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.8rem', color: '#334155', fontWeight: 600, lineHeight: '1.5' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <Check style={{ width: '12px', height: '12px' }} />
                </div>
                <span>{feat}</span>
              </div>
            ))}
          </div>

          {/* Duration Selector */}
          <div className="pt-2 space-y-2">
            <select
              value={eliteDuration}
              onChange={(e) => setEliteDuration(e.target.value)}
              style={{
                width: '100%',
                background: '#F8FAFC',
                border: '1.5px solid #BAE6FD',
                borderRadius: '16px',
                padding: '12px 14px',
                fontSize: '0.84rem',
                fontWeight: 800,
                color: '#0F172A',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="FOUR_MONTHS">3 شهور + شهر هدية (إجمالي 4 شهور)</option>
              <option value="EIGHT_MONTHS">6 شهور + شهرين هدية (إجمالي 8 شهور)</option>
            </select>
            <div style={{ textAlign: 'center', fontSize: '0.76rem', fontWeight: 800, color: '#0284C7' }}>
              إجمالي مدة المتابعة: {eliteDuration === 'FOUR_MONTHS' ? '4 شهور (120 يوماً)' : '8 شهور (240 يوماً)'}
            </div>
          </div>

          {/* CTA Button */}
          <button
            type="button"
            onClick={() => onSelectTier && onSelectTier('ELITE', eliteDuration)}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #00A3FF 0%, #0284C7 100%)',
              color: '#FFFFFF',
              fontWeight: 900,
              padding: '14px',
              borderRadius: '16px',
              fontSize: '0.88rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 6px 20px rgba(0, 163, 255, 0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            <span>اختيار ELITE لمدة {eliteDuration === 'FOUR_MONTHS' ? '4 شهور' : '8 شهور'}</span>
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

      </div>
    </div>
  );
}
