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
        background: 'rgba(15, 23, 42, 0.45)',
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
          background: '#FFFFFF',
          color: '#0F172A',
          borderRadius: '16px',
          border: '1px solid #FDE68A',
          padding: '24px 20px',
          direction: 'rtl',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)'
        }}
      >
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', color: '#D97706' }}>
          <AlertTriangle size={24} />
        </div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 900, color: '#0F172A' }}>
          تأكيد تفعيل وضع السفر
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: '#64748B', lineHeight: 1.5 }}>
          أنت على وشك تكييف خطتك إلى: <strong style={{ color: '#B45309' }}>{travelConfirmTarget.title}</strong>.<br />
          {travelConfirmTarget.desc}<br />
          يمكنك العودة لجدولك الأساسي في الجيم في أي وقت بضغطة زر.
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1,
              background: '#D97706',
              color: '#FFFFFF',
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
              background: '#F1F5F9',
              color: '#475569',
              border: '1px solid #E2E8F0',
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
        background: 'rgba(15, 23, 42, 0.45)',
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
          background: '#FFFFFF',
          color: '#0F172A',
          borderRadius: '16px',
          border: '1px solid #BAE6FD',
          padding: '24px 20px',
          direction: 'rtl',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)'
        }}
      >
        <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', color: '#0284C7' }}>
          <CheckCircle2 size={24} color="#0284C7" />
        </div>
        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 900, color: '#0F172A' }}>
          حمد الله على السلامة يا بطل!
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '0.78rem', color: '#64748B', lineHeight: 1.5 }}>
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
              background: '#F8FAFC',
              color: '#475569',
              border: '1px solid #E2E8F0',
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
