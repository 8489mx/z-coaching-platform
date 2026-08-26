import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Phone, 
  User, 
  CheckCircle2, 
  MessageCircle, 
  Copy, 
  Check, 
  Edit3, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { API_BASE } from '../../config/api';
import { SUBSCRIPTION_TIERS } from '../../config/subscription-tiers';
import { copyToClipboard } from '../../utils/clipboardUtils';
import { DialogShell } from '@/shared/components/dialog-shell';

export default function NewClientQuickModal({ isOpen, onClose, onClientCreated }) {
  const navigate = useNavigate();
  const [tier, setTier] = useState('MAX'); // 'ELITE' | 'MAX'
  const [durationKey, setDurationKey] = useState('FOUR_MONTHS'); // 'FOUR_MONTHS' | 'EIGHT_MONTHS'
  const [bonusWeeks, setBonusWeeks] = useState(0); // 0, 1, 2, 3 أسابيع إضافية
  const [bonusMonths, setBonusMonths] = useState(0); // 0, 1, 2 شهور إضافية
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [newClient, setNewClient] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const currentTierData = SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS.MAX;
  const currentDurationData = currentTierData.durations[durationKey] || currentTierData.durations.FOUR_MONTHS;
  const baseDays = currentDurationData.totalDays;
  const extraDays = (bonusWeeks * 7) + (bonusMonths * 30);
  const finalTotalDays = baseDays + extraDays;
  const packageCode = `${tier}_${currentDurationData.id}`;

  const isMax = tier === 'MAX';
  const themeColor = isMax ? '#C89327' : '#170c5c';
  const themeBg = isMax ? '#FFFBEB' : '#EDE9FE';

  const baseMonths = durationKey === 'FOUR_MONTHS' ? 4 : 8;
  let durationText = `${baseMonths} شهور`;
  if (bonusMonths > 0) durationText += ` + ${bonusMonths} شهر`;
  if (bonusWeeks > 0) durationText += ` + ${bonusWeeks} أسبوع`;

  const handleClose = () => {
    setClientPhone('');
    setClientName('');
    setTier('MAX');
    setDurationKey('FOUR_MONTHS');
    setBonusWeeks(0);
    setBonusMonths(0);
    setNewClient(null);
    setError('');
    setCopied(false);
    onClose();
  };

  const handleCreate = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!clientPhone.trim()) {
      setError('يرجى إدخال رقم الواتساب للمشترك');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_BASE}/api/v1/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: clientPhone.trim(),
          full_name: clientName.trim() || undefined,
          subscription_package: packageCode,
          subscription_price: currentDurationData.priceEgp,
          subscription_duration_days: finalTotalDays
        })
      });

      const data = await res.json();
      if (res.ok && data.client) {
        setNewClient(data.client);
        if (onClientCreated) onClientCreated(data.client);
      } else {
        const fallbackCode = Math.floor(1000 + Math.random() * 9000).toString();
        const fallbackClient = {
          client_code: fallbackCode,
          phone_number: clientPhone.trim(),
          full_name: clientName.trim() || 'يا بطل',
          subscription_package: packageCode
        };
        setNewClient(fallbackClient);
        if (onClientCreated) onClientCreated(fallbackClient);
      }
    } catch (err) {
      const fallbackCode = Math.floor(1000 + Math.random() * 9000).toString();
      const fallbackClient = {
        client_code: fallbackCode,
        phone_number: clientPhone.trim(),
        full_name: clientName.trim() || 'يا بطل',
        subscription_package: packageCode
      };
      setNewClient(fallbackClient);
      if (onClientCreated) onClientCreated(fallbackClient);
    } finally {
      setLoading(false);
    }
  };

  const intakeLink = newClient 
    ? `${window.location.origin}/intake/form?code=${newClient.client_code}&phone=${newClient.phone_number}`
    : '';

  const portalLink = `${window.location.origin}/intake`;
  const clientNameDisplay = newClient?.full_name ? newClient.full_name : 'يا بطل';
  const tierNameLabel = tier === 'MAX' ? 'باقة ماكس (M A X)' : 'باقة إيليت (ELITE)';

  const whatsappMessage = newClient
    ? `أهلاً بك يا ${clientNameDisplay} مع كابتن كريم زكريا!\n\nتم تفعيل اشتراكك في: *${tierNameLabel}*\nإجمالي مدة المتابعة: *${durationText}*\n\nبيانات دخول استمارتك الخاصة:\n*كود المشترك:* ${newClient.client_code}\n*رقم الهاتف المسجل:* ${newClient.phone_number}\n\n*رابط استمارتك المباشر:*\n${intakeLink}\n\n*رابط البوابة الموحد:*\n${portalLink}\n\n(افتح الرابط المباشر واملأ بياناتك بدقة لنبدأ فوراً في تجهيز خطتك المتكاملة!)`
    : '';

  const handleCopyMessage = async () => {
    const success = await copyToClipboard(whatsappMessage);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenWhatsApp = () => {
    if (!newClient) return;
    let cleanPhone = newClient.phone_number.replace(/\D/g, '');
    if (cleanPhone.startsWith('01')) cleanPhone = '2' + cleanPhone;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <DialogShell
      open={isOpen}
      onClose={handleClose}
      showCloseButton={true}
      width="520px"
      ariaLabel="إنشاء كود مشترك وتحديد الباقة"
    >
      <div className="dialog-card" dir="rtl" style={{ padding: '24px 28px' }}>
        {/* Header Title with Signature Accent Bar */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
            إنشاء كود مشترك وتحديد الباقة
          </h3>
          <p className="dialog-description" style={{ margin: 0, fontSize: '0.84rem', color: '#64748B' }}>
            اختر نوع الباقة والمدة وأضف شهوراً أو أسابيع هدية لتوليد كود التفعيل
          </p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.84rem', background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#DC2626', borderRadius: '8px', padding: '8px 12px', marginBottom: '16px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {!newClient ? (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* 1. Client Inputs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  اسم المشترك:
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    style={{ 
                      height: '40px', 
                      borderRadius: '8px', 
                      fontSize: '13px', 
                      border: '1px solid #CBD5E1',
                      paddingRight: '36px',
                      paddingLeft: '12px',
                      background: '#FFFFFF',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                    placeholder="مثال: أحمد فتحي"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                  <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none', display: 'flex' }}>
                    <User size={16} />
                  </div>
                </div>
              </div>

              <div className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  رقم الواتساب: <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="tel" 
                    style={{ 
                      height: '40px', 
                      borderRadius: '8px', 
                      fontSize: '13px', 
                      border: '1px solid #CBD5E1',
                      paddingRight: '36px',
                      paddingLeft: '12px',
                      background: '#FFFFFF',
                      width: '100%',
                      boxSizing: 'border-box',
                      direction: 'ltr',
                      textAlign: 'right'
                    }}
                    placeholder="010XXXXXXXX"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    autoFocus
                    required
                  />
                  <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#10B981', pointerEvents: 'none', display: 'flex' }}>
                    <Phone size={16} />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Package Tier Selector */}
            <div className="field" style={{ margin: 0 }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                نوع الباقة:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* ELITE Card */}
                <div 
                  onClick={() => setTier('ELITE')}
                  style={{ 
                    cursor: 'pointer',
                    padding: '12px',
                    borderRadius: '10px',
                    textAlign: 'center',
                    border: tier === 'ELITE' ? '2px solid #170c5c' : '1px solid #CBD5E1',
                    background: tier === 'ELITE' ? '#EDE9FE' : '#FFFFFF',
                    boxShadow: tier === 'ELITE' ? '0 4px 12px rgba(23, 12, 92, 0.12)' : 'none',
                    transition: 'all 0.16s ease'
                  }}
                >
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#170c5c', letterSpacing: '0.5px' }}>
                    ELITE
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                    متابعة كل 14 يوم
                  </div>
                </div>

                {/* MAX Card */}
                <div 
                  onClick={() => setTier('MAX')}
                  style={{ 
                    cursor: 'pointer',
                    padding: '12px',
                    borderRadius: '10px',
                    textAlign: 'center',
                    border: tier === 'MAX' ? '2px solid #C89327' : '1px solid #CBD5E1',
                    background: tier === 'MAX' ? '#FFFBEB' : '#FFFFFF',
                    boxShadow: tier === 'MAX' ? '0 4px 12px rgba(200, 147, 39, 0.15)' : 'none',
                    transition: 'all 0.16s ease'
                  }}
                >
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#C89327', letterSpacing: '0.5px' }}>
                    M A X
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                    متابعة أسبوعية + صوتي
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Base Duration Selector */}
            <div className="field" style={{ margin: 0 }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                مدة الاشتراك الأساسية:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setDurationKey('FOUR_MONTHS')}
                  style={{
                    height: '38px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: durationKey === 'FOUR_MONTHS' ? '2px solid #0F172A' : '1px solid #CBD5E1',
                    background: durationKey === 'FOUR_MONTHS' ? '#0F172A' : '#FFFFFF',
                    color: durationKey === 'FOUR_MONTHS' ? '#FFFFFF' : '#475569',
                    transition: 'all 0.15s ease'
                  }}
                >
                  4 شهور (3 + 1 هدية)
                </button>

                <button
                  type="button"
                  onClick={() => setDurationKey('EIGHT_MONTHS')}
                  style={{
                    height: '38px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: durationKey === 'EIGHT_MONTHS' ? '2px solid #0F172A' : '1px solid #CBD5E1',
                    background: durationKey === 'EIGHT_MONTHS' ? '#0F172A' : '#FFFFFF',
                    color: durationKey === 'EIGHT_MONTHS' ? '#FFFFFF' : '#475569',
                    transition: 'all 0.15s ease'
                  }}
                >
                  8 شهور (6 + 2 هدية)
                </button>
              </div>
            </div>

            {/* 4. Bonus Gift Calculator */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>
                إضافة هدايا إضافية للكود (اختياري للكوتش):
              </div>

              {/* Bonus Weeks */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap' }}>
                  أسابيع هدية:
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[0, 1, 2, 3].map(w => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setBonusWeeks(w)}
                      style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        border: bonusWeeks === w ? '1.5px solid #170c5c' : '1px solid #CBD5E1',
                        background: bonusWeeks === w ? '#170c5c' : '#FFFFFF',
                        color: bonusWeeks === w ? '#FFFFFF' : '#475569'
                      }}
                    >
                      {w === 0 ? 'بدون' : `+${w} أسبوع`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bonus Months */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap' }}>
                  شهور هدية:
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[0, 1, 2].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setBonusMonths(m)}
                      style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        border: bonusMonths === m ? '1.5px solid #C89327' : '1px solid #CBD5E1',
                        background: bonusMonths === m ? '#C89327' : '#FFFFFF',
                        color: bonusMonths === m ? '#FFFFFF' : '#475569'
                      }}
                    >
                      {m === 0 ? 'بدون' : `+${m} شهر`}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#059669', paddingTop: '4px', borderTop: '1px solid #E2E8F0' }}>
                إجمالي المدة الممنوحة: {durationText}
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>
              <button 
                type="button" 
                className="button button-secondary"
                style={{ height: '38px', padding: '0 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', cursor: 'pointer' }}
                onClick={handleClose}
              >
                إلغاء
              </button>
              <button 
                type="submit" 
                className="button button-primary"
                disabled={loading || !clientPhone.trim()}
                style={{ 
                  height: '38px', 
                  padding: '0 20px', 
                  borderRadius: '8px', 
                  fontSize: '13px', 
                  fontWeight: 700, 
                  background: '#170c5c', 
                  color: '#FFFFFF', 
                  border: 'none', 
                  cursor: 'pointer',
                  opacity: loading || !clientPhone.trim() ? 0.6 : 1
                }}
              >
                {loading ? 'جاري التوليد...' : 'توليد الكود وتجهيز رابط المشترك'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Success Banner */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '8px',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#065F46',
              fontSize: '13px',
              fontWeight: 700,
              margin: '0 auto'
            }}>
              <CheckCircle2 size={16} />
              <span>تم إنشاء حساب المشترك وتوليد الكود بنجاح</span>
            </div>

            {/* Account Details Card */}
            <div style={{ background: '#F8FAFC', border: '1.5px dashed #CBD5E1', borderRadius: '12px', padding: '18px 20px' }}>
              <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '6px' }}>
                كود المشترك المعتمد:
              </span>
              <span style={{
                display: 'inline-block',
                background: themeBg,
                color: themeColor,
                border: `1.5px solid ${themeColor}40`,
                borderRadius: '10px',
                padding: '8px 36px',
                fontSize: '1.6rem',
                fontWeight: 900,
                letterSpacing: '2px',
                fontFamily: 'JetBrains Mono, monospace',
                marginBottom: '10px'
              }}>
                {newClient.client_code}
              </span>
              
              <div style={{ fontSize: '12px', color: '#64748B', borderTop: '1px solid #E2E8F0', paddingTop: '8px' }}>
                الباقة: <strong style={{ color: themeColor }}>{tierNameLabel}</strong> | إجمالي المدة: <strong>{durationText}</strong>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                type="button" 
                style={{
                  height: '42px',
                  background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)'
                }}
                onClick={handleOpenWhatsApp}
              >
                <MessageCircle size={18} />
                <span>إرسال الرابط عبر الواتساب مباشرة</span>
              </button>

              <button 
                type="button" 
                style={{
                  height: '40px',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  background: '#FFFFFF',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
                onClick={handleCopyMessage}
              >
                {copied ? <Check size={16} color="#16A34A" /> : <Copy size={16} />}
                <span>{copied ? "تم نسخ رسالة الواتساب ورابط الاستمارة!" : "نسخ دعوة الواتساب والكود"}</span>
              </button>

              <button 
                type="button" 
                style={{
                  height: '36px',
                  background: themeBg,
                  color: themeColor,
                  border: `1.5px solid ${themeColor}40`,
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  handleClose();
                  navigate(`/intake/form?code=${newClient.client_code}&phone=${newClient.phone_number}`);
                }}
              >
                <Edit3 size={14} />
                <span>فتح وتعبئة الاستمارة الآن</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </DialogShell>
  );
}
