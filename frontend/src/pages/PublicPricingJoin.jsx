import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, MessageCircle } from 'lucide-react';
import { getStoredCoachConfig } from '../utils/themeAndCoachConfig';
import { formatWhatsAppPhone } from '../utils/whatsappRemindersEngine';

export default function PublicPricingJoin() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(175deg, #0F172A 0%, #1E293B 100%)', color: '#FFFFFF', direction: 'rtl', fontFamily: 'Alexandria, Cairo, sans-serif', padding: '60px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '540px', width: '100%', background: '#FFFFFF', color: '#0F172A', borderRadius: '24px', padding: '40px 28px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
        
        <div style={{ width: '68px', height: '68px', borderRadius: '24px', background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', fontWeight: 900, fontSize: '1.4rem' }}>
          KZ
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FEF3C7', color: '#92400E', padding: '4px 12px', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 800, marginBottom: '16px' }}>
          <Crown style={{ width: '14px', height: '14px' }} />
          <span>منظومة التدريب الخاصة · كابتن كريم زكريا</span>
        </div>

        <h1 style={{ fontSize: '1.55rem', fontWeight: 900, margin: '0 0 12px 0', color: '#0F172A' }}>
          الانضمام والمتابعة الشخصية
        </h1>

        <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: '1.7', margin: '0 auto 26px auto' }}>
          نظراً لأن كل متدرب يحصل على خطة فسيولوجية وغذائية مخصصة بالجرام ومتابعة دورية دقيقة، فإن قبول المشتركين يتم يدوياً وحصرياً بعد التنسيق المباشر مع الكابتن للتأكد من الجاهزية والالتزام.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(() => {
            const coachConfig = getStoredCoachConfig();
            const coachWhatsApp = formatWhatsAppPhone(coachConfig?.whatsappNumber || coachConfig?.supportWhatsapp || '201001060503');
            return (
              <a
                href={`https://wa.me/${coachWhatsApp}?text=مرحباً%20كابتن%20كريم،%20أرغب%20في%20الاستفسار%20عن%20تفاصيل%20الاشتراك%20والباقات%20المتاحة`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: '#16A34A',
                  color: '#FFFFFF',
                  padding: '13px 20px',
                  borderRadius: '20px',
                  textDecoration: 'none',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                  transition: 'all 0.15s ease'
                }}
              >
                <MessageCircle style={{ width: '18px', height: '18px' }} />
                <span>تواصل مباشرة عبر WhatsApp</span>
              </a>
            );
          })()}

          <button
            type="button"
            onClick={() => navigate('/renew')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: '#FEF3C7',
              color: '#92400E',
              padding: '11px 20px',
              borderRadius: '20px',
              border: '1px solid #FDE68A',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.85rem'
            }}
          >
            <span>أنا مشترك وأرغب في تجديد باقتي أونلاين</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/client/login')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: '#F1F5F9',
              color: '#334155',
              padding: '11px 20px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}
          >
            <span>أنا مشترك بالفعل (تسجيل الدخول بالكود)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
