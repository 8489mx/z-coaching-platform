import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export function TravelConfirmModal({
  travelConfirmTarget,
  onClose,
  onConfirm
}) {
  if (!travelConfirmTarget) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(5px)',
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#0F172A',
          color: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #C4952D',
          padding: '24px 20px',
          direction: 'rtl',
          textAlign: 'center',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div style={{ background: 'rgba(196, 149, 45, 0.15)', border: '1px solid rgba(196, 149, 45, 0.3)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', color: '#F59E0B' }}>
          <AlertTriangle size={24} />
        </div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 900, color: '#F8FAFC' }}>
          تأكيد تفعيل وضع السفر
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.5 }}>
          أنت على وشك تكييف خطتك إلى: <strong style={{ color: '#F59E0B' }}>{travelConfirmTarget.title}</strong>.<br />
          {travelConfirmTarget.desc}<br />
          يمكنك العودة لجدولك الأساسي في الجيم في أي وقت بضغطة زر.
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1,
              background: '#C4952D',
              color: '#0F172A',
              border: 'none',
              borderRadius: '10px',
              padding: '10px',
              fontSize: '0.82rem',
              fontWeight: 900,
              cursor: 'pointer'
            }}
          >
            تأكيد التفعيل
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              padding: '10px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            تراجع
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReturnTravelModal({
  isOpen,
  onClose,
  onReset
}) {
  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(5px)',
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#0F172A',
          color: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #38BDF8',
          padding: '24px 20px',
          direction: 'rtl',
          textAlign: 'center',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', color: '#38BDF8' }}>
          <CheckCircle2 size={24} color="#0284C7" />
        </div>
        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 900, color: '#F8FAFC' }}>
          حمد الله على السلامة يا بطل!
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.5 }}>
          كيف كان نشاطك التدريبي خلال فترة السفر؟ سيتم إعادة ضبط أحمال الأسبوع الأول بما يناسب طاقتك:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            onClick={() => onReset('FULL_WEIGHTS')}
            style={{
              background: '#0284C7',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '11px',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            حافظت على حماسي وتمريني (جاهز للأوزان كاملة)
          </button>
          <button
            type="button"
            onClick={() => onReset('RECOVERY')}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#CBD5E1',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              padding: '11px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            فصلت وريحت تماماً (أسبوع استشفاء تدريجي)
          </button>
        </div>
      </div>
    </div>
  );
}
