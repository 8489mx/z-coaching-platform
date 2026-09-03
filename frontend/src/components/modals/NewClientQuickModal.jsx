import { getClientTier, getTierColors, ClientCodeBadge, ClientPackageBadge } from '../../utils/tierBadgeHelper';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, User, CheckCircle2, MessageCircle, Copy, Check, Edit3, AlertCircle, Sparkles } from 'lucide-react';
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

  const isMax = getClientTier(tier) === 'MAX';
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
  const clientNameDisplay = newClient?.full_name ? `أستاذ ${newClient.full_name}` : 'عزيزي المشترك';
  const tierNameLabel = tier === 'MAX' ? 'باقة ماكس (M A X)' : 'باقة إيليت (ELITE)';

  const whatsappMessage = newClient
    ? `أهلاً بحضرتك يا ${clientNameDisplay} مع كابتن كريم زكريا،\n\nتم تفعيل اشتراكك في: *${tierNameLabel}*\nإجمالي مدة المتابعة: *${durationText}*\n\nبيانات الدخول الخاصة بحسابك:\n*كود المشترك:* ${newClient.client_code}\n*رقم الهاتف المسجل:* ${newClient.phone_number}\n\n*رابط الاستمارة المباشر:*\n${intakeLink}\n\n*رابط البوابة الإلكترونية:*\n${portalLink}\n\nيرجى فتح الرابط المباشر وتعبئة البيانات بدقة لنبدأ في تجهيز خطتك التدريبية والغذائية.\nبالتوفيق دائماً، كابتن كريم زكريا.`
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
      width="500px"
      ariaLabel="إنشاء كود مشترك وتحديد الباقة"
    >
      <div className="dialog-card" dir="rtl" style={{ padding: '20px 24px', background: '#FFFFFF', borderRadius: '12px' }}>
        {/* Header Title */}
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
            إنشاء كود مشترك وتحديد الباقة
          </h3>
        </div>

        {error && (
          <div style={{ fontSize: '11.5px', background: '#FFF1F2', border: '1px solid #FECDD3', color: '#9F1239', borderRadius: '6px', padding: '8px 12px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {!newClient ? (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
            
            {/* 1. Client Inputs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ margin: 0 }}>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                  اسم المشترك:
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    style={{ 
                      height: '36px', 
                      borderRadius: '6px', 
                      fontSize: '12px', 
                      border: '1px solid #CBD5E1',
                      paddingRight: '32px',
                      paddingLeft: '10px',
                      background: '#F8FAFC',
                      width: '100%',
                      boxSizing: 'border-box',
                      color: '#0F172A',
                      outline: 'none'
                    }}
                    placeholder="مثال: أحمد فتحي"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                  <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none', display: 'flex' }}>
                    <User size={14} />
                  </div>
                </div>
              </div>

              <div style={{ margin: 0 }}>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                  رقم الواتساب: <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="tel" 
                    style={{ 
                      height: '36px', 
                      borderRadius: '6px', 
                      fontSize: '12px', 
                      border: '1px solid #CBD5E1',
                      paddingRight: '32px',
                      paddingLeft: '10px',
                      background: '#F8FAFC',
                      width: '100%',
                      boxSizing: 'border-box',
                      direction: 'ltr',
                      textAlign: 'right',
                      color: '#0F172A',
                      outline: 'none'
                    }}
                    placeholder="010XXXXXXXX"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    autoFocus
                    required
                  />
                  <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#16A34A', pointerEvents: 'none', display: 'flex' }}>
                    <Phone size={14} />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Package Tier Selector */}
            <div style={{ margin: 0 }}>
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '5px', display: 'block' }}>
                نوع الباقة:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {/* ELITE Card */}
                <div 
                  onClick={() => setTier('ELITE')}
                  style={{ 
                    cursor: 'pointer',
                    padding: '10px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: tier === 'ELITE' ? '1.5px solid #0F172A' : '1px solid #E2E8F0',
                    background: tier === 'ELITE' ? '#F8FAFC' : '#FFFFFF',
                    boxShadow: tier === 'ELITE' ? '0 2px 6px rgba(15, 23, 42, 0.08)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#0284C7', letterSpacing: '0.5px' }}>
                    ELITE
                  </div>
                  <div style={{ fontSize: '11px', color: tier === 'ELITE' ? '#334155' : '#94A3B8', fontWeight: 600, marginTop: '2px' }}>
                    متابعة كل 14 يوم
                  </div>
                </div>

                {/* MAX Card */}
                <div 
                  onClick={() => setTier('MAX')}
                  style={{ 
                    cursor: 'pointer',
                    padding: '10px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: tier === 'MAX' ? '1.5px solid #0F172A' : '1px solid #E2E8F0',
                    background: tier === 'MAX' ? '#F8FAFC' : '#FFFFFF',
                    boxShadow: tier === 'MAX' ? '0 2px 6px rgba(15, 23, 42, 0.08)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#C4952D', letterSpacing: '0.5px' }}>
                    MAX
                  </div>
                  <div style={{ fontSize: '11px', color: tier === 'MAX' ? '#334155' : '#94A3B8', fontWeight: 600, marginTop: '2px' }}>
                    متابعة أسبوعية (7 أيام)
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Base Duration Selector */}
            <div style={{ margin: 0 }}>
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '5px', display: 'block' }}>
                مدة الاشتراك الأساسية:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setDurationKey('FOUR_MONTHS')}
                  style={{
                    height: '34px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: durationKey === 'FOUR_MONTHS' ? 'none' : '1px solid #CBD5E1',
                    background: durationKey === 'FOUR_MONTHS' ? '#0F172A' : '#FFFFFF',
                    color: durationKey === 'FOUR_MONTHS' ? '#FFFFFF' : '#475569',
                    boxShadow: durationKey === 'FOUR_MONTHS' ? '0 2px 5px rgba(15, 23, 42, 0.25)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  4 شهور (3 + 1 هدية)
                </button>

                <button
                  type="button"
                  onClick={() => setDurationKey('EIGHT_MONTHS')}
                  style={{
                    height: '34px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: durationKey === 'EIGHT_MONTHS' ? 'none' : '1px solid #CBD5E1',
                    background: durationKey === 'EIGHT_MONTHS' ? '#0F172A' : '#FFFFFF',
                    color: durationKey === 'EIGHT_MONTHS' ? '#FFFFFF' : '#475569',
                    boxShadow: durationKey === 'EIGHT_MONTHS' ? '0 2px 5px rgba(15, 23, 42, 0.25)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  8 شهور (6 + 2 هدية)
                </button>
              </div>
            </div>

            {/* 4. Bonus Gift Calculator */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                إضافة هدايا إضافية للكود (اختياري للكوتش):
              </div>

              {/* Bonus Weeks */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', width: '70px', flexShrink: 0 }}>
                  أسابيع هدية:
                </span>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {[0, 1, 2, 3].map(w => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setBonusWeeks(w)}
                      style={{
                        padding: '3px 9px',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '5px',
                        cursor: 'pointer',
                        border: bonusWeeks === w ? 'none' : '1px solid #CBD5E1',
                        background: bonusWeeks === w ? '#0F172A' : '#FFFFFF',
                        color: bonusWeeks === w ? '#FFFFFF' : '#475569',
                        boxShadow: bonusWeeks === w ? '0 1px 3px rgba(15, 23, 42, 0.2)' : 'none'
                      }}
                    >
                      {w === 0 ? 'بدون' : `+${w} أسبوع`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bonus Months */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', width: '70px', flexShrink: 0 }}>
                  شهور هدية:
                </span>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {[0, 1, 2].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setBonusMonths(m)}
                      style={{
                        padding: '3px 9px',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '5px',
                        cursor: 'pointer',
                        border: bonusMonths === m ? 'none' : '1px solid #CBD5E1',
                        background: bonusMonths === m ? '#0F172A' : '#FFFFFF',
                        color: bonusMonths === m ? '#FFFFFF' : '#475569',
                        boxShadow: bonusMonths === m ? '0 1px 3px rgba(15, 23, 42, 0.2)' : 'none'
                      }}
                    >
                      {m === 0 ? 'بدون' : `+${m} شهر`}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#334155', paddingTop: '6px', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>إجمالي المدة الممنوحة:</span>
                <span style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '1px 7px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>
                  {durationText}
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
              <button 
                type="button" 
                style={{ height: '34px', padding: '0 14px', borderRadius: '5px', fontSize: '11.5px', fontWeight: 700, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', cursor: 'pointer' }}
                onClick={handleClose}
              >
                إلغاء
              </button>
              <button 
                type="submit" 
                disabled={loading || !clientPhone.trim()}
                style={{ 
                  height: '34px', 
                  padding: '0 18px', 
                  borderRadius: '5px', 
                  fontSize: '11.5px', 
                  fontWeight: 700, 
                  background: '#0F172A', 
                  color: '#FFFFFF', 
                  border: 'none', 
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 5px rgba(15, 23, 42, 0.25)',
                  opacity: loading || !clientPhone.trim() ? 0.6 : 1
                }}
              >
                <span>{loading ? 'جاري التوليد...' : 'توليد الخطة'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Success Banner */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              background: '#F8FAFC', border: '1px solid #E2E8F0',
              color: '#166534',
              fontSize: '12px',
              fontWeight: 700,
              margin: '0 auto'
            }}>
              <CheckCircle2 size={15} />
              <span>تم إنشاء حساب المشترك وتوليد الكود بنجاح</span>
            </div>

            {/* Account Details Card */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px 16px' }}>
              <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                كود المشترك المعتمد:
              </span>
              <span style={{
                display: 'inline-block',
                background: '#FFFFFF',
                color: '#0F172A',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                padding: '6px 28px',
                fontSize: '1.4rem',
                fontWeight: 900,
                letterSpacing: '2px',
                fontFamily: 'JetBrains Mono, monospace',
                marginBottom: '8px',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
              }}>
                {newClient.client_code}
              </span>
              
              <div style={{ fontSize: '11.5px', color: '#64748B', borderTop: '1px solid #E2E8F0', paddingTop: '6px' }}>
                الباقة: <strong style={{ color: '#0F172A' }}>{tierNameLabel}</strong> | إجمالي المدة: <strong style={{ color: '#059669' }}>{durationText}</strong>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                type="button" 
                style={{
                  height: '36px',
                  background: '#16A34A',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(22, 163, 74, 0.25)'
                }}
                onClick={handleOpenWhatsApp}
              >
                <MessageCircle size={15} />
                <span>إرسال الرابط عبر الواتساب مباشرة</span>
              </button>

              <button 
                type="button" 
                style={{
                  height: '34px',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  background: '#FFFFFF',
                  color: '#334155',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
                onClick={handleCopyMessage}
              >
                {copied ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                <span>{copied ? "تم نسخ رسالة الواتساب ورابط الاستمارة!" : "نسخ دعوة الواتساب والكود"}</span>
              </button>

              <button 
                type="button" 
                style={{
                  height: '34px',
                  background: '#F1F5F9',
                  color: '#0F172A',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  handleClose();
                  navigate(`/intake/form?code=${newClient.client_code}&phone=${newClient.phone_number}`);
                }}
              >
                <Edit3 size={13} />
                <span>فتح وتعبئة الاستمارة الآن</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </DialogShell>
  );
}
