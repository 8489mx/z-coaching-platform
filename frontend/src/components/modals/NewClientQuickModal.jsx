import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle2, MessageCircle, Copy, Check, Edit3, AlertCircle, UserPlus } from 'lucide-react';
import { API_BASE } from '../../config/api';
import { SUBSCRIPTION_TIERS } from '../../config/subscription-tiers';
import { copyToClipboard } from '../../utils/clipboardUtils';
import { formatWhatsAppPhone } from '../../utils/whatsappRemindersEngine';

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
        setError(data.error || 'فشل تسجيل المشترك في قاعدة البيانات. يرجى التحقق من الاتصال والمحاولة مرة أخرى.');
      }
    } catch (err) {
      console.error("Client creation error:", err);
      setError('تعذر الاتصال بالخادم لتسجيل المشترك. يرجى التحقق من اتصال الإنترنت ثم المحاولة ثانية.');
    } finally {
      setLoading(false);
    }
  };

  const intakeLink = newClient 
    ? `${window.location.origin}/intake/form?code=${newClient.client_code}&phone=${newClient.phone_number}`
    : '';

  const portalLink = `${window.location.origin}/intake`;
  const clientNameDisplay = newClient?.full_name ? `أستاذ ${newClient.full_name}` : 'عزيزي المشترك';
  const tierNameLabel = tier === 'MAX' ? 'باقة MAX' : 'باقة ELITE';

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
    const cleanPhone = formatWhatsAppPhone(newClient.phone_number);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'Cairo, sans-serif'
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div 
        dir="rtl"
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92vh',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #EAECF0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header - Signature Platform Style */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #EAECF0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#FFFFFF',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '9999px',
              background: '#F4F0FD',
              color: '#673DE6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <UserPlus size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#101828' }}>
                إنشاء كود مشترك وتحديد الباقة
              </h3>
              <span style={{ fontSize: '11.5px', color: '#667085' }}>
                إصدار كود المشترك، وتعيين فئة المتابعة والمدة الزمنية
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9999px',
              border: '1px solid #EAECF0',
              background: '#F8FAFC',
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FEF3F2';
              e.currentTarget.style.color = '#B42318';
              e.currentTarget.style.borderColor = '#FECDCA';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F8FAFC';
              e.currentTarget.style.color = '#64748B';
              e.currentTarget.style.borderColor = '#EAECF0';
            }}
          >
            <X size={15} />
          </button>
        </div>

        {error && (
          <div style={{
            margin: '14px 20px 0 20px',
            fontSize: '12px',
            background: '#FEF3F2',
            border: '1px solid #FECDCA',
            color: '#B42318',
            borderRadius: '9999px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 700
          }}>
            <AlertCircle size={15} color="#B42318" />
            <span>{error}</span>
          </div>
        )}

        {!newClient ? (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            
            {/* Form Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              
              {/* 1. Client Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#344054', marginBottom: '5px', display: 'block' }}>
                    اسم المشترك
                  </label>
                  <input 
                    type="text" 
                    style={{ 
                      height: '38px', 
                      borderRadius: '9999px', 
                      fontSize: '13px', 
                      border: '1px solid #D0D5DD',
                      padding: '0 12px',
                      background: '#FFFFFF',
                      width: '100%',
                      boxSizing: 'border-box',
                      color: '#101828',
                      outline: 'none',
                      transition: 'border-color 0.15s ease'
                    }}
                    placeholder="مثال: أحمد فتحي"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#344054', marginBottom: '5px', display: 'block' }}>
                    رقم الواتساب <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input 
                    type="tel" 
                    style={{ 
                      height: '38px', 
                      borderRadius: '9999px', 
                      fontSize: '13px', 
                      border: '1px solid #D0D5DD',
                      padding: '0 12px',
                      background: '#FFFFFF',
                      width: '100%',
                      boxSizing: 'border-box',
                      direction: 'ltr',
                      textAlign: 'right',
                      color: '#101828',
                      outline: 'none',
                      transition: 'border-color 0.15s ease',
                      fontFamily: 'JetBrains Mono, Cairo, sans-serif'
                    }}
                    placeholder="010XXXXXXXX"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* 2. Package Tier Selector */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#344054', marginBottom: '6px', display: 'block' }}>
                  نوع باقة المتابعة
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {/* ELITE Card */}
                  <div 
                    role="button"
                    tabIndex={0}
                    onClick={() => setTier('ELITE')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setTier('ELITE'); }}
                    style={{ 
                      cursor: 'pointer',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      textAlign: 'right',
                      border: tier === 'ELITE' ? '2px solid #673DE6' : '1px solid #EAECF0',
                      background: tier === 'ELITE' ? '#F4F0FD' : '#FFFFFF',
                      boxShadow: tier === 'ELITE' ? '0 2px 6px rgba(103, 61, 230, 0.12)' : 'none',
                      transition: 'all 0.15s ease',
                      boxSizing: 'border-box'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 800, color: tier === 'ELITE' ? '#673DE6' : '#101828' }}>
                        باقة ELITE
                      </span>
                      {tier === 'ELITE' && <CheckCircle2 size={16} color="#673DE6" />}
                    </div>
                    <div style={{ fontSize: '11px', color: tier === 'ELITE' ? '#5025D1' : '#667085', fontWeight: 600 }}>
                      متابعة نصف شهرية (كل 14 يوماً)
                    </div>
                  </div>

                  {/* MAX Card */}
                  <div 
                    role="button"
                    tabIndex={0}
                    onClick={() => setTier('MAX')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setTier('MAX'); }}
                    style={{ 
                      cursor: 'pointer',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      textAlign: 'right',
                      border: tier === 'MAX' ? '2px solid #673DE6' : '1px solid #EAECF0',
                      background: tier === 'MAX' ? '#F4F0FD' : '#FFFFFF',
                      boxShadow: tier === 'MAX' ? '0 2px 6px rgba(103, 61, 230, 0.12)' : 'none',
                      transition: 'all 0.15s ease',
                      boxSizing: 'border-box'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 800, color: tier === 'MAX' ? '#673DE6' : '#101828' }}>
                        باقة MAX
                      </span>
                      {tier === 'MAX' && <CheckCircle2 size={16} color="#673DE6" />}
                    </div>
                    <div style={{ fontSize: '11px', color: tier === 'MAX' ? '#5025D1' : '#667085', fontWeight: 600 }}>
                      متابعة أسبوعية دقيقة (كل 7 أيام)
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Base Duration Segmented Control */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#344054', marginBottom: '6px', display: 'block' }}>
                  مدة الاشتراك الأساسية
                </label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '4px',
                  background: '#F2F4F7',
                  padding: '4px',
                  borderRadius: '10px',
                  border: '1px solid #EAECF0'
                }}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setDurationKey('FOUR_MONTHS')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setDurationKey('FOUR_MONTHS'); }}
                    style={{
                      height: '34px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: durationKey === 'FOUR_MONTHS' ? '#673DE6' : 'transparent',
                      color: durationKey === 'FOUR_MONTHS' ? '#FFFFFF' : '#475467',
                      boxShadow: durationKey === 'FOUR_MONTHS' ? '0 1px 3px rgba(103, 61, 230, 0.25)' : 'none',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    4 شهور (3 + 1 هدية)
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setDurationKey('EIGHT_MONTHS')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setDurationKey('EIGHT_MONTHS'); }}
                    style={{
                      height: '34px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: durationKey === 'EIGHT_MONTHS' ? '#673DE6' : 'transparent',
                      color: durationKey === 'EIGHT_MONTHS' ? '#FFFFFF' : '#475467',
                      boxShadow: durationKey === 'EIGHT_MONTHS' ? '0 1px 3px rgba(103, 61, 230, 0.25)' : 'none',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    8 شهور (6 + 2 هدية)
                  </div>
                </div>
              </div>

              {/* 4. Bonus Gift Section */}
              <div style={{ background: '#F9FAFB', border: '1px solid #EAECF0', borderRadius: '20px', padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#101828' }}>
                    هدايا ومكافآت إضافية للكود (اختياري)
                  </span>
                  <span style={{ 
                    background: '#ECFDF3', 
                    border: '1px solid #A6F4C7', 
                    color: '#027A48', 
                    padding: '2px 10px', 
                    borderRadius: '9999px', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    fontFamily: 'JetBrains Mono, Cairo, sans-serif' 
                  }}>
                    المدة الإجمالية: {durationText}
                  </span>
                </div>

                {/* Bonus Weeks */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#475467', width: '75px', flexShrink: 0 }}>
                    أسابيع إضافية:
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[0, 1, 2, 3].map(w => {
                      const isSel = bonusWeeks === w;
                      return (
                        <div
                          key={w}
                          role="button"
                          tabIndex={0}
                          onClick={() => setBonusWeeks(w)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setBonusWeeks(w); }}
                          style={{
                            padding: '3px 10px',
                            fontSize: '11px',
                            fontWeight: isSel ? 700 : 600,
                            borderRadius: '9999px',
                            cursor: 'pointer',
                            border: isSel ? '1px solid #673DE6' : '1px solid #D0D5DD',
                            background: isSel ? '#673DE6' : '#FFFFFF',
                            color: isSel ? '#FFFFFF' : '#344054',
                            boxShadow: isSel ? '0 1px 3px rgba(103, 61, 230, 0.2)' : 'none',
                            transition: 'all 0.12s ease'
                          }}
                        >
                          {w === 0 ? 'بدون' : `+${w} أسبوع`}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bonus Months */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#475467', width: '75px', flexShrink: 0 }}>
                    شهور إضافية:
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[0, 1, 2].map(m => {
                      const isSel = bonusMonths === m;
                      return (
                        <div
                          key={m}
                          role="button"
                          tabIndex={0}
                          onClick={() => setBonusMonths(m)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setBonusMonths(m); }}
                          style={{
                            padding: '3px 10px',
                            fontSize: '11px',
                            fontWeight: isSel ? 700 : 600,
                            borderRadius: '9999px',
                            cursor: 'pointer',
                            border: isSel ? '1px solid #673DE6' : '1px solid #D0D5DD',
                            background: isSel ? '#673DE6' : '#FFFFFF',
                            color: isSel ? '#FFFFFF' : '#344054',
                            boxShadow: isSel ? '0 1px 3px rgba(103, 61, 230, 0.2)' : 'none',
                            transition: 'all 0.12s ease'
                          }}
                        >
                          {m === 0 ? 'بدون' : `+${m} شهر`}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* Footer - Exactly Matching EditPackageModal & System Architecture */}
            <div style={{
              padding: '14px 20px',
              background: '#F9FAFB',
              borderTop: '1px solid #EAECF0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              flexShrink: 0
            }}>
              <button 
                type="button" 
                onClick={handleClose}
                style={{
                  height: '36px',
                  padding: '0 16px',
                  borderRadius: '9999px',
                  border: '1px solid #D0D5DD',
                  background: '#FFFFFF',
                  color: '#344054',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                إلغاء
              </button>

              <button 
                type="submit" 
                disabled={loading || !clientPhone.trim()}
                style={{ 
                  height: '36px', 
                  padding: '0 20px', 
                  borderRadius: '9999px', 
                  fontSize: '12.5px', 
                  fontWeight: 700, 
                  background: '#673DE6', 
                  color: '#FFFFFF', 
                  border: 'none', 
                  cursor: clientPhone.trim() ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(103, 61, 230, 0.25)',
                  opacity: loading || !clientPhone.trim() ? 0.6 : 1,
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!loading && clientPhone.trim()) e.currentTarget.style.background = '#5025D1';
                }}
                onMouseLeave={(e) => {
                  if (!loading && clientPhone.trim()) e.currentTarget.style.background = '#673DE6';
                }}
              >
                <span>{loading ? 'جاري التوليد...' : 'توليد كود المشترك'}</span>
              </button>
            </div>

          </form>
        ) : (
          <div style={{ padding: '24px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Success Banner */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '9999px',
              background: '#ECFDF3',
              border: '1px solid #A6F4C7',
              color: '#027A48',
              fontSize: '12.5px',
              fontWeight: 700,
              margin: '0 auto'
            }}>
              <CheckCircle2 size={16} color="#027A48" />
              <span>تم إنشاء حساب المشترك وتوليد الكود بنجاح</span>
            </div>

            {/* Account Details Card */}
            <div style={{ background: '#F9FAFB', border: '1px solid #EAECF0', borderRadius: '20px', padding: '16px' }}>
              <span style={{ fontSize: '11.5px', color: '#64748B', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                كود المشترك المعتمد:
              </span>
              <span style={{
                display: 'inline-block',
                background: '#FFFFFF',
                color: '#673DE6',
                border: '1.5px solid #DDD6FE',
                borderRadius: '9999px',
                padding: '8px 32px',
                fontSize: '1.5rem',
                fontWeight: 900,
                letterSpacing: '2px',
                fontFamily: 'JetBrains Mono, monospace',
                marginBottom: '10px',
                boxShadow: '0 2px 6px rgba(103, 61, 230, 0.1)'
              }}>
                {newClient.client_code}
              </span>
              
              <div style={{ fontSize: '12px', color: '#64748B', borderTop: '1px solid #EAECF0', paddingTop: '8px' }}>
                الباقة: <strong style={{ color: '#101828' }}>{tierNameLabel}</strong> • إجمالي المدة: <strong style={{ color: '#027A48' }}>{durationText}</strong>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                type="button" 
                style={{
                  height: '38px',
                  background: '#25D366',
                  border: 'none',
                  borderRadius: '9999px',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(37, 211, 102, 0.25)',
                  transition: 'all 0.15s ease'
                }}
                onClick={handleOpenWhatsApp}
              >
                <MessageCircle size={16} />
                <span>إرسال الرابط عبر الواتساب مباشرة</span>
              </button>

              <button 
                type="button" 
                style={{
                  height: '38px',
                  border: '1px solid #D0D5DD',
                  borderRadius: '9999px',
                  background: '#FFFFFF',
                  color: '#344054',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onClick={handleCopyMessage}
              >
                {copied ? <Check size={15} color="#027A48" /> : <Copy size={15} />}
                <span>{copied ? "تم نسخ رسالة الواتساب ورابط الاستمارة!" : "نسخ دعوة الواتساب والكود"}</span>
              </button>

              <button 
                type="button" 
                style={{
                  height: '38px',
                  background: '#F4F0FD',
                  color: '#673DE6',
                  border: '1px solid #DDD6FE',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
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
    </div>
  );
}
