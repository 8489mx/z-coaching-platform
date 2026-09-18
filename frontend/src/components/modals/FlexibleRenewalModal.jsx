import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  CheckCircle2, 
  MessageCircle, 
  Zap,
  ChevronDown,
  Check
} from 'lucide-react';
import { API_BASE } from '../../config/api';
import { formatWhatsAppPhone } from '../../utils/whatsappRemindersEngine';

export const CURRENCIES = [
  { id: 'EGP', symbol: 'ج.م', label: 'ج.م (جنيه مصري)' },
  { id: 'SAR', symbol: 'ر.س', label: 'ر.س (ريال سعودي)' },
  { id: 'AED', symbol: 'د.إ', label: 'د.إ (درهم إماراتي)' },
  { id: 'KWD', symbol: 'د.ك', label: 'د.ك (دينار كويتي)' },
  { id: 'USD', symbol: '$', label: '$ (دولار أمريكي)' },
];

export const PAYMENT_METHODS = [
  { id: 'INSTAPAY', label: 'إنستاباي (InstaPay)' },
  { id: 'VCASH', label: 'فودافون كاش' },
  { id: 'BANK', label: 'تحويل بنكي' },
  { id: 'ONLINE', label: 'دفع إلكتروني (الموقع)' },
  { id: 'CASH', label: 'كاش نقدي' },
  { id: 'OTHER', label: 'طريقة أخرى' },
];

export const RENEWAL_PRICING_MATRIX = {
  '4_MONTHS': { MAX: 6000, ELITE: 4500 },
  '2_MONTHS': { MAX: 3500, ELITE: 2800 },
  '1_MONTH': { MAX: 2000, ELITE: 1600 },
};

function formatArabicDate(isoDateStr) {
  if (!isoDateStr) return '';
  const parts = isoDateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const monthName = months[monthIndex] || parts[1];
    return `${day} ${monthName} ${year}`;
  }
  return isoDateStr;
}

export default function FlexibleRenewalModal({ 
  isOpen, 
  onClose, 
  client, 
  onSuccess 
}) {
  const currentTier = String(client?.package || client?.subscription_package || client?.package_tier || '').toUpperCase().includes('MAX') ? 'MAX' : 'ELITE';

  // Form State
  const [durationPreset, setDurationPreset] = useState('4_MONTHS'); // 4_MONTHS | 2_MONTHS | 1_MONTH | CUSTOM
  const [targetTier, setTargetTier] = useState(currentTier); // MAX | ELITE
  const [customDays, setCustomDays] = useState(120);
  const [startMode, setStartMode] = useState('AFTER_REMAINING'); // AFTER_REMAINING | FROM_TODAY
  const [amountEgp, setAmountEgp] = useState(6000);
  const [currency, setCurrency] = useState('EGP'); // EGP | SAR | AED | KWD | USD
  const [paymentMethod, setPaymentMethod] = useState('INSTAPAY'); // INSTAPAY | VCASH | BANK | CASH | ONLINE | OTHER
  const [paymentType, setPaymentType] = useState('FULL'); // FULL | DEPOSIT
  const [saving, setSaving] = useState(false);

  // Custom Dropdowns State
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isPaymentMethodOpen, setIsPaymentMethodOpen] = useState(false);
  const currencyRef = useRef(null);
  const paymentMethodRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (currencyRef.current && !currencyRef.current.contains(e.target)) {
        setIsCurrencyOpen(false);
      }
      if (paymentMethodRef.current && !paymentMethodRef.current.contains(e.target)) {
        setIsPaymentMethodOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (client) {
      const cDays = Number(client.daysRemaining ?? client.days_remaining ?? 0);
      setStartMode(cDays > 0 ? 'AFTER_REMAINING' : 'FROM_TODAY');
      const initialTier = String(client.package || client.subscription_package || client.package_tier || '').toUpperCase().includes('MAX') ? 'MAX' : 'ELITE';
      setTargetTier(initialTier);
      const initialPrice = RENEWAL_PRICING_MATRIX['4_MONTHS']?.[initialTier] || client.price || (initialTier === 'MAX' ? 6000 : 4500);
      setAmountEgp(initialPrice);
    }
  }, [client]);

  if (!isOpen || !client) return null;

  const clientName = client.full_name || client.name || `مشترك #${client.client_code || client.id}`;
  const cleanCode = String(client.client_code || client.id || '1').replace(/^client[-_]?/i, '').replace('#', '');
  const phone = client.phone_number || '';

  // Greeting logic - prevents awkward "يا أستاذ متدرب"
  const isGenericName = !clientName || clientName.includes('متدرب جديد') || clientName.includes('قيد التعبئة') || clientName.toLowerCase().includes('client');
  const greetingText = isGenericName ? 'أهلاً بحضرتك يا فندم،' : `أهلاً بحضرتك يا أستاذ ${clientName.split(' ')[0]}،`;

  // Handler for changing target tier
  const handleSelectTier = (newTier) => {
    setTargetTier(newTier);
    if (durationPreset !== 'CUSTOM' && RENEWAL_PRICING_MATRIX[durationPreset]?.[newTier]) {
      setAmountEgp(RENEWAL_PRICING_MATRIX[durationPreset][newTier]);
    }
  };

  // Handler for changing duration preset
  const handleSelectPreset = (presetId) => {
    setDurationPreset(presetId);
    if (presetId !== 'CUSTOM' && RENEWAL_PRICING_MATRIX[presetId]?.[targetTier]) {
      setAmountEgp(RENEWAL_PRICING_MATRIX[presetId][targetTier]);
    }
  };

  // Days remaining
  const currentDays = Number(client.daysRemaining ?? client.days_remaining ?? 0);
  const currentEndDate = client.end_date || client.subscription_end_date || '';

  // Compute total added days
  const addedDays = durationPreset === '4_MONTHS' ? 120 :
                    durationPreset === '2_MONTHS' ? 60 :
                    durationPreset === '1_MONTH' ? 30 :
                    Math.max(1, Number(customDays) || 30);

  // Compute new end date
  const computeNewDate = () => {
    let base = new Date();
    if (startMode === 'AFTER_REMAINING' && currentEndDate) {
      const parsed = new Date(currentEndDate);
      if (!isNaN(parsed.getTime()) && parsed > base) {
        base = parsed;
      }
    }
    const target = new Date(base.getTime() + (addedDays * 24 * 60 * 60 * 1000));
    return target.toISOString().split('T')[0];
  };

  const newEndDate = computeNewDate();
  const displayEndDate = formatArabicDate(newEndDate);
  const totalDaysResult = (startMode === 'AFTER_REMAINING' && currentDays > 0) ? (currentDays + addedDays) : addedDays;

  // Duration label
  const durationLabel = durationPreset === '4_MONTHS' ? '4 شهور (الباقة الأساسية)' :
                        durationPreset === '2_MONTHS' ? 'شهرين (60 يوماً)' :
                        durationPreset === '1_MONTH' ? 'شهر واحد (30 يوماً)' :
                        `${addedDays} يوماً`;

  const currencySymbol = currency === 'SAR' ? 'ر.س' : 
                         currency === 'AED' ? 'د.إ' : 
                         currency === 'KWD' ? 'د.ك' : 
                         currency === 'USD' ? '$' : 'ج.م';

  const methodLabel = paymentMethod === 'INSTAPAY' ? 'إنستاباي (InstaPay)' :
                      paymentMethod === 'VCASH' ? 'فودافون كاش' :
                      paymentMethod === 'BANK' ? 'تحويل بنكي' : 
                      paymentMethod === 'ONLINE' ? 'الدفع الإلكتروني' : 
                      paymentMethod === 'CASH' ? 'كاش نقدي' : 'تحويل مباشر';

  // Clean WhatsApp confirmation text
  const waMessage = `${greetingText}\nتم تأكيد استلام تحويلك بنجاح لمبلغ ${Number(amountEgp).toLocaleString('en-US')} ${currencySymbol} عن طريق ${methodLabel}.\nتم تفعيل اشتراكك في المنظومة التدريبية (باقة ${targetTier}) لمدة ${durationLabel} حتى ${displayEndDate}.\nبالتوفيق ومستمرون معاً لتحقيق أفضل نتيجة.\nكابتن كريم زكريا.`;

  const handleSave = async (openWhatsApp = false) => {
    setSaving(true);
    try {
      const payload = {
        client_code: cleanCode,
        duration_days: addedDays,
        new_end_date: newEndDate,
        amount_paid_egp: Number(amountEgp) || 0,
        payment_method: paymentMethod,
        payment_type: paymentType,
        package_code: targetTier
      };

      // Call renew API
      try {
        await fetch(`${API_BASE}/api/v1/subscriptions/renew/${cleanCode}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch {
        console.log('Renew API call finished');
      }

      if (openWhatsApp && phone) {
        const cleanPhone = formatWhatsAppPhone(phone);
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`, '_blank');
      }

      if (onSuccess) {
        onSuccess({
          ...client,
          status: 'ACTIVE',
          subscription_status: 'ACTIVE',
          package_tier: targetTier,
          subscription_package: targetTier,
          pkgLabel: targetTier,
          isMax: targetTier === 'MAX',
          days_remaining: totalDaysResult,
          daysRemaining: totalDaysResult,
          end_date: newEndDate,
          price: Number(amountEgp)
        });
      }

      onClose();
    } catch (e) {
      console.error('Renewal save error:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 10500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box'
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        dir="rtl"
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92vh',
          boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.25)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        <style>{`
          .renewal-num-input::-webkit-outer-spin-button,
          .renewal-num-input::-webkit-inner-spin-button {
            -webkit-appearance: none !important;
            margin: 0 !important;
          }
          .renewal-num-input {
            -moz-appearance: textfield !important;
          }
        `}</style>
        {/* Modal Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#FFFFFF',
          flexShrink: 0,
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: '#0F172A',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Zap size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800, color: '#0F172A' }}>
                  تجديد وتحصيل الاشتراك
                </h3>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '5px',
                  background: currentTier === 'MAX' ? '#0F172A' : '#F1F5F9',
                  color: currentTier === 'MAX' ? '#FFFFFF' : '#475569',
                  border: '1px solid #E2E8F0'
                }}>
                  {currentTier === 'MAX' ? 'باقة MAX الحالية' : 'باقة ELITE الحالية'}
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{clientName}</span>
                <span>•</span>
                <bdi style={{ fontWeight: 700 }}>#{cleanCode}</bdi>
                {phone && (
                  <>
                    <span>•</span>
                    <bdi dir="ltr">{phone}</bdi>
                  </>
                )}
              </div>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            style={{
              border: 'none',
              background: '#F8FAFC',
              color: '#64748B',
              cursor: 'pointer',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.12s ease'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ 
          padding: '16px 20px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px', 
          boxSizing: 'border-box',
          overflowY: 'auto',
          overflowX: 'hidden',
          flex: 1
        }}>
          
          {/* 1. Target Package Selection */}
          <div style={{ width: '100%', boxSizing: 'border-box' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
              باقة التجديد المستهدفة:
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
              {/* ELITE Option */}
              <button
                type="button"
                onClick={() => handleSelectTier('ELITE')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: targetTier === 'ELITE' ? '2px solid #0F172A' : '1px solid #E2E8F0',
                  background: targetTier === 'ELITE' ? '#F8FAFC' : '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'right',
                  transition: 'all 0.12s ease',
                  boxSizing: 'border-box',
                  boxShadow: targetTier === 'ELITE' ? '0 2px 6px rgba(15, 23, 42, 0.08)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                    باقة إيليت (ELITE)
                  </span>
                  {targetTier === 'ELITE' && <CheckCircle2 size={15} color="#0F172A" />}
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748B', lineHeight: '1.4' }}>
                  متابعة نصف شهرية كل 14 يوماً
                </div>
              </button>

              {/* MAX Option */}
              <button
                type="button"
                onClick={() => handleSelectTier('MAX')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: targetTier === 'MAX' ? '2px solid #0F172A' : '1px solid #E2E8F0',
                  background: targetTier === 'MAX' ? '#F8FAFC' : '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'right',
                  transition: 'all 0.12s ease',
                  boxSizing: 'border-box',
                  boxShadow: targetTier === 'MAX' ? '0 2px 6px rgba(15, 23, 42, 0.08)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                    باقة ماكس (MAX)
                  </span>
                  {targetTier === 'MAX' && <CheckCircle2 size={15} color="#0F172A" />}
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748B', lineHeight: '1.4' }}>
                  متابعة أسبوعية دقيقة كل 7 أيام
                </div>
              </button>
            </div>
          </div>

          {/* 2. Duration Presets */}
          <div style={{ width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>
                مدة التجديد:
              </label>
              <button
                type="button"
                onClick={() => setDurationPreset(durationPreset === 'CUSTOM' ? '4_MONTHS' : 'CUSTOM')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#475569',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {durationPreset === 'CUSTOM' ? 'الرجوع للمدد الجاهزة' : 'تحديد أيام يدوياً'}
              </button>
            </div>

            {durationPreset !== 'CUSTOM' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                {[
                  { id: '4_MONTHS', label: '4 شهور', sub: '120 يوماً' },
                  { id: '2_MONTHS', label: 'شهرين', sub: '60 يوماً' },
                  { id: '1_MONTH', label: 'شهر واحد', sub: '30 يوماً' },
                ].map(preset => {
                  const isActive = durationPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.id)}
                      style={{
                        width: '100%',
                        padding: '8px 6px',
                        borderRadius: '8px',
                        border: isActive ? '1.5px solid #0F172A' : '1px solid #E2E8F0',
                        background: isActive ? '#0F172A' : '#FFFFFF',
                        color: isActive ? '#FFFFFF' : '#475569',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.12s ease',
                        boxSizing: 'border-box'
                      }}
                    >
                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: isActive ? '#FFFFFF' : '#0F172A' }}>
                        {preset.label}
                      </div>
                      <div style={{ fontSize: '10px', color: isActive ? '#CBD5E1' : '#64748B', marginTop: '2px' }}>
                        {preset.sub}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F8FAFC', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', width: '100%', boxSizing: 'border-box' }}>
                <span style={{ fontSize: '12px', color: '#475569', fontWeight: 700 }}>عدد الأيام المخصصة:</span>
                <input
                  type="number"
                  className="renewal-num-input"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  style={{
                    width: '80px',
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    fontWeight: 800,
                    textAlign: 'center',
                    fontFamily: 'JetBrains Mono, Cairo',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: '12px', color: '#64748B' }}>يوماً</span>
              </div>
            )}
          </div>

          {/* Start Date Options (Carry-over remaining days) */}
          {currentDays > 0 && (
            <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                المشترك لديه <strong>{currentDays} يوماً</strong> متبقية في اشتراكه الحالي:
              </div>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', cursor: 'pointer', color: '#0F172A' }}>
                  <input 
                    type="radio" 
                    name="startMode" 
                    checked={startMode === 'AFTER_REMAINING'} 
                    onChange={() => setStartMode('AFTER_REMAINING')} 
                  />
                  <span>إضافة المدة على الأيام المتبقية (الإجمالي {currentDays + addedDays} يوماً)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', cursor: 'pointer', color: '#0F172A' }}>
                  <input 
                    type="radio" 
                    name="startMode" 
                    checked={startMode === 'FROM_TODAY'} 
                    onChange={() => setStartMode('FROM_TODAY')} 
                  />
                  <span>بدء الحساب من اليوم ({addedDays} يوماً)</span>
                </label>
              </div>
            </div>
          )}

          {/* 3. Amount & Payment Method */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
            {/* Amount */}
            <div ref={currencyRef} style={{ width: '100%', boxSizing: 'border-box', position: 'relative', zIndex: isCurrencyOpen ? 50 : 2 }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                المبلغ المسدد:
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'stretch',
                height: '40px',
                borderRadius: '8px',
                border: isCurrencyOpen ? '1.5px solid #0F172A' : '1px solid #CBD5E1',
                background: '#FFFFFF',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease'
              }}>
                <input
                  type="number"
                  className="renewal-num-input"
                  value={amountEgp}
                  onChange={(e) => setAmountEgp(e.target.value)}
                  placeholder="0"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: '100%',
                    border: 'none',
                    outline: 'none',
                    padding: '0 12px',
                    fontSize: '15px',
                    fontWeight: 800,
                    fontFamily: 'JetBrains Mono, Cairo, sans-serif',
                    color: '#0F172A',
                    background: 'transparent',
                    boxSizing: 'border-box',
                    textAlign: 'right',
                    borderTopRightRadius: '7px',
                    borderBottomRightRadius: '7px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCurrencyOpen(!isCurrencyOpen);
                    setIsPaymentMethodOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: isCurrencyOpen ? '#F1F5F9' : '#F8FAFC',
                    border: 'none',
                    borderRight: '1px solid #E2E8F0',
                    borderTopLeftRadius: '7px',
                    borderBottomLeftRadius: '7px',
                    padding: '0 10px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    flexShrink: 0,
                    height: '100%',
                    transition: 'all 0.15s ease',
                    outline: 'none'
                  }}
                >
                  <span style={{
                    fontSize: '12.5px',
                    fontWeight: 800,
                    color: '#0F172A',
                    fontFamily: 'Cairo, sans-serif'
                  }}>
                    {currencySymbol}
                  </span>
                  <ChevronDown 
                    size={13} 
                    color="#64748B" 
                    style={{ 
                      transform: isCurrencyOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.15s ease'
                    }} 
                  />
                </button>
              </div>

              {/* Curved Custom Currency Dropdown */}
              {isCurrencyOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 5px)',
                  left: 0,
                  width: '175px',
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.18), 0 4px 8px -2px rgba(15, 23, 42, 0.06)',
                  padding: '5px',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  boxSizing: 'border-box'
                }}>
                  {CURRENCIES.map((curr) => {
                    const isSelected = currency === curr.id;
                    return (
                      <button
                        key={curr.id}
                        type="button"
                        onClick={() => {
                          setCurrency(curr.id);
                          setIsCurrencyOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: 'none',
                          background: isSelected ? '#0F172A' : 'transparent',
                          color: isSelected ? '#FFFFFF' : '#334155',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: isSelected ? 800 : 700,
                          fontFamily: 'Cairo, sans-serif',
                          textAlign: 'right',
                          transition: 'all 0.1s ease',
                          boxSizing: 'border-box'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = '#F8FAFC';
                            e.currentTarget.style.color = '#0F172A';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#334155';
                          }
                        }}
                      >
                        <span>{curr.label}</span>
                        {isSelected && <Check size={13} color="#FFFFFF" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div ref={paymentMethodRef} style={{ width: '100%', boxSizing: 'border-box', position: 'relative', zIndex: isPaymentMethodOpen ? 50 : 2 }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                طريقة التحويل:
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsPaymentMethodOpen(!isPaymentMethodOpen);
                  setIsCurrencyOpen(false);
                }}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: isPaymentMethodOpen ? '1.5px solid #0F172A' : '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.15s ease'
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'Cairo, sans-serif', color: '#0F172A' }}>
                  {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label || paymentMethod}
                </span>
                <ChevronDown 
                  size={14} 
                  color="#64748B" 
                  style={{ 
                    transform: isPaymentMethodOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s ease'
                  }} 
                />
              </button>

              {/* Curved Custom Payment Method Dropdown */}
              {isPaymentMethodOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 5px)',
                  right: 0,
                  width: '100%',
                  minWidth: '190px',
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.18), 0 4px 8px -2px rgba(15, 23, 42, 0.06)',
                  padding: '5px',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  boxSizing: 'border-box'
                }}>
                  {PAYMENT_METHODS.map((method) => {
                    const isSelected = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(method.id);
                          setIsPaymentMethodOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: 'none',
                          background: isSelected ? '#0F172A' : 'transparent',
                          color: isSelected ? '#FFFFFF' : '#334155',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: isSelected ? 800 : 700,
                          fontFamily: 'Cairo, sans-serif',
                          textAlign: 'right',
                          transition: 'all 0.1s ease',
                          boxSizing: 'border-box'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = '#F8FAFC';
                            e.currentTarget.style.color = '#0F172A';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#334155';
                          }
                        }}
                      >
                        <span>{method.label}</span>
                        {isSelected && <Check size={13} color="#FFFFFF" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 4. Calculated Result Summary */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            textAlign: 'center',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div>
              <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700 }}>الباقة المعتمدة</div>
              <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                {targetTier === 'MAX' ? 'ماكس (MAX)' : 'إيليت (ELITE)'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700 }}>الرصيد المضاف</div>
              <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                +{addedDays} يوماً
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700 }}>تاريخ الانتهاء الجديد</div>
              <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                {displayEndDate}
              </div>
            </div>
          </div>

          {/* 5. Live WhatsApp Preview */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '10px 12px',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#0F172A' }}>
                <MessageCircle size={13} color="#059669" />
                <span>نص رسالة التأكيد عبر الواتساب:</span>
              </div>
            </div>
            <div style={{
              background: '#F8FAFC',
              borderRadius: '6px',
              padding: '8px 10px',
              fontSize: '11.5px',
              color: '#334155',
              lineHeight: 1.6,
              whiteSpace: 'pre-line',
              fontFamily: 'Cairo, sans-serif'
            }}>
              {waMessage}
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          gap: '8px',
          background: '#FFFFFF',
          flexShrink: 0,
          boxSizing: 'border-box'
        }}>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(true)}
            style={{
              flex: 1,
              height: '38px',
              borderRadius: '8px',
              border: 'none',
              background: '#059669',
              color: '#FFFFFF',
              fontSize: '12.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.12s ease'
            }}
          >
            <MessageCircle size={15} />
            <span>اعتماد وتأكيد عبر الواتساب</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(false)}
            style={{
              height: '38px',
              padding: '0 14px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#0F172A',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.12s ease'
            }}
          >
            <span>حفظ فقط</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              height: '38px',
              padding: '0 12px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              color: '#64748B',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <span>إلغاء</span>
          </button>
        </div>

      </div>
    </div>
  );
}
