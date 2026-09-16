import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Check, 
  Copy, 
  AlertTriangle, 
  ShieldCheck, 
  Activity, 
  TrendingUp, 
  Clock, 
  Target 
} from 'lucide-react';
import { generateWhatsAppUrl } from '../../utils/whatsappRemindersEngine';

export default function ClientRetentionRadarModal({
  isOpen,
  onClose,
  evaluation,
  phoneNumber = '',
  onToast = () => {}
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !evaluation) return null;

  const score = evaluation.total_retention_score || 0;
  const isHigh = evaluation.category === 'HIGH_PROPENSITY';
  const isAtRisk = evaluation.category === 'AT_RISK';

  const badgeColor = isHigh ? '#059669' : isAtRisk ? '#DC2626' : '#D97706';
  const badgeBg = isHigh ? '#ECFDF5' : isAtRisk ? '#FEF2F2' : '#FFFBEB';
  const badgeBorder = isHigh ? '#A7F3D0' : isAtRisk ? '#FECACA' : '#FDE68A';

  const handleCopyMessage = () => {
    if (evaluation.whatsapp_outreach_message) {
      navigator.clipboard.writeText(evaluation.whatsapp_outreach_message);
      setCopied(true);
      onToast('تم نسخ رسالة التواصل بنجاح');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendWhatsApp = () => {
    if (!phoneNumber) {
      onToast('رقم هاتف المشترك غير مسجل');
      return;
    }
    const url = generateWhatsAppUrl(phoneNumber, evaluation.whatsapp_outreach_message);
    window.open(url, '_blank');
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'Cairo, sans-serif'
      }}
      onClick={onClose}
    >
      <div 
        dir="rtl"
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid #E2E8F0',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#F8FAFC',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              background: '#0F172A', 
              color: '#FFFFFF', 
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Activity size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                تحليل رادار الاحتفاظ والتجديد
              </h3>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                {evaluation.client_name} ({evaluation.client_code || 'كود غير مسجل'})
              </span>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: '#F1F5F9',
              borderRadius: '8px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Main Score & Propensity Card */}
          <div style={{
            background: badgeBg,
            border: `1px solid ${badgeBorder}`,
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: '#FFFFFF',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '10.5px',
                fontWeight: 800,
                color: badgeColor,
                marginBottom: '6px',
                border: `1px solid ${badgeBorder}`
              }}>
                {isHigh ? <ShieldCheck size={12} /> : isAtRisk ? <AlertTriangle size={12} /> : <Target size={12} />}
                <span>{evaluation.status_title_ar}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#334155', fontWeight: 600, lineHeight: 1.5 }}>
                {evaluation.recommended_action_ar}
              </div>
            </div>

            <div style={{ textAlign: 'center', minWidth: '70px' }}>
              <div style={{
                fontSize: '28px',
                fontWeight: 900,
                color: badgeColor,
                fontFamily: 'JetBrains Mono, Cairo, sans-serif',
                lineHeight: 1
              }}>
                {score}
              </div>
              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>من 100 نقطة</span>
            </div>
          </div>

          {/* Breakdown Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '10px 12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>الالتزام العام</span>
                <strong style={{ fontSize: '12px', color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>
                  {evaluation.score_breakdown?.adherence || 0} / 35
                </strong>
              </div>
              <div style={{ fontSize: '10.5px', color: '#334155', fontWeight: 600 }}>
                متوسط الالتزام: {evaluation.adherence_rate}%
              </div>
            </div>

            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '10px 12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>التقدم القياسي</span>
                <strong style={{ fontSize: '12px', color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>
                  {evaluation.score_breakdown?.progress || 0} / 30
                </strong>
              </div>
              <div style={{ fontSize: '10.5px', color: '#334155', fontWeight: 600 }}>
                تغير الوزن: {evaluation.biometric_delta_kg > 0 ? `-${evaluation.biometric_delta_kg}` : evaluation.biometric_delta_kg} كجم
              </div>
            </div>

            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '10px 12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>الانتظام والراحة</span>
                <strong style={{ fontSize: '12px', color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>
                  {evaluation.score_breakdown?.consistency || 0} / 20
                </strong>
              </div>
              <div style={{ fontSize: '10.5px', color: '#334155', fontWeight: 600 }}>
                معدل تسليم التقارير وجودة النوم
              </div>
            </div>

            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '10px 12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>أجل الاشتراك</span>
                <strong style={{ fontSize: '12px', color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>
                  {evaluation.score_breakdown?.urgency || 0} / 15
                </strong>
              </div>
              <div style={{ fontSize: '10.5px', color: '#334155', fontWeight: 600 }}>
                متبقي {evaluation.days_until_expiry} يوم على التجديد
              </div>
            </div>

          </div>

          {/* Risk Factors Section */}
          {evaluation.risk_factors && evaluation.risk_factors.length > 0 && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '10px',
              padding: '12px 14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#DC2626', fontWeight: 800, fontSize: '11.5px' }}>
                <AlertTriangle size={14} />
                <span>عوامل الخطورة المرصودة (Risk Indicators)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {evaluation.risk_factors.map((rf, idx) => (
                  <div key={idx} style={{ fontSize: '11px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#DC2626', display: 'inline-block' }}></span>
                    <span>{rf}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tactical Outreach Message Generator */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A' }}>
                رسالة المبادرة التكتيكية المقترحة (WhatsApp Script)
              </span>
              <button
                type="button"
                onClick={handleCopyMessage}
                style={{
                  background: copied ? '#ECFDF5' : '#FFFFFF',
                  border: copied ? '1px solid #A7F3D0' : '1px solid #CBD5E1',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: copied ? '#059669' : '#475569',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
              </button>
            </div>

            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '11px',
              color: '#334155',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap'
            }}>
              {evaluation.whatsapp_outreach_message}
            </div>

            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                style={{
                  background: '#25D366',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Send size={13} />
                <span>إرسال فوري عبر واتساب</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
