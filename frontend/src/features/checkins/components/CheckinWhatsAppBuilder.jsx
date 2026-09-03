import React from 'react';
import { MessageCircle, CheckCircle2, Copy } from 'lucide-react';
import { FormSection } from '@/shared/components/form-section';

export default function CheckinWhatsAppBuilder({ 
  coachReply = '', 
  setCoachReply = () => {}, 
  activeCheckin = null,
  onApprove = () => {} 
}) {
  const handleCopy = () => {
    if (!coachReply) return;
    navigator.clipboard.writeText(coachReply);
    alert('تم نسخ رسالة التوجيه للحافظة بنجاح');
  };

  const handleOpenWhatsApp = () => {
    if (!activeCheckin?.client?.phone) return;
    let cleanPhone = String(activeCheckin.client.phone).replace(/\D/g, '');
    if (cleanPhone.startsWith('01')) cleanPhone = '2' + cleanPhone;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(coachReply)}`, '_blank');
  };

  return (
    <FormSection
      title="رسالة الكوتش واعتماد الخطة"
      description="كتابة التوجيه التشجيعي وإرسال التحديث لبرنامج المتدرب."
    >
      <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <textarea
          value={coachReply}
          onChange={(e) => setCoachReply(e.target.value)}
          placeholder="اكتب التوجيه والرد التشجيعي للمتدرب..."
          style={{
            width: '100%',
            height: '115px',
            padding: '8px 10px',
            borderRadius: '6px',
            border: '1px solid #CBD5E1',
            fontSize: '12px',
            outline: 'none',
            resize: 'none',
            boxSizing: 'border-box',
            lineHeight: 1.45,
            color: '#0F172A',
            fontFamily: 'Cairo, sans-serif'
          }}
        />

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              height: '34px',
              padding: '0 10px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#475569',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="نسخ نص الرسالة"
          >
            <Copy size={13} />
            <span>نسخ</span>
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            style={{
              height: '34px',
              padding: '0 12px',
              borderRadius: '6px',
              border: '1px solid #86EFAC',
              background: '#F0FDF4',
              color: '#16A34A',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title="فتح واتساب مباشرة بالرسالة"
          >
            <MessageCircle size={14} />
            <span>واتساب</span>
          </button>

          <button
            type="button"
            onClick={onApprove}
            style={{
              flex: 1,
              height: '34px',
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <CheckCircle2 size={14} />
            <span>اعتماد الخطة</span>
          </button>
        </div>
      </div>
    </FormSection>
  );
}
