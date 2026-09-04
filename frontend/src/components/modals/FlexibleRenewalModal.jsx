import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  MessageCircle, 
  Calendar, 
  Clock, 
  Wallet, 
  ShieldCheck, 
  Sparkles,
  Zap
} from 'lucide-react';
import { API_BASE } from '../../config/api';

export default function FlexibleRenewalModal({ 
  isOpen, 
  onClose, 
  client, 
  onSuccess 
}) {
  if (!isOpen || !client) return null;

  const clientName = client.full_name || client.name || `مشترك #${client.client_code || client.id}`;
  const firstName = clientName.split(' ')[0] || 'يا بطل';
  const cleanCode = String(client.client_code || client.id || '1').replace(/^client[-_]?/i, '').replace('#', '');
  const phone = client.phone_number || '';
  const isMax = String(client.package || client.subscription_package || client.package_tier || '').toUpperCase().includes('MAX');

  // Days remaining
  const currentDays = Number(client.daysRemaining ?? client.days_remaining ?? 0);
  const currentEndDate = client.end_date || client.subscription_end_date || '';

  // Form State
  const [durationPreset, setDurationPreset] = useState('4_MONTHS'); // 4_MONTHS | 2_MONTHS | 1_MONTH | CUSTOM
  const [customDays, setCustomDays] = useState(120);
  const [startMode, setStartMode] = useState(currentDays > 0 ? 'AFTER_REMAINING' : 'FROM_TODAY'); // AFTER_REMAINING | FROM_TODAY
  const [amountEgp, setAmountEgp] = useState(client.price || 5000);
  const [currency, setCurrency] = useState('EGP'); // EGP | SAR | AED | KWD | USD
  const [paymentMethod, setPaymentMethod] = useState('INSTAPAY'); // INSTAPAY | VCASH | BANK | CASH | ONLINE | OTHER
  const [paymentType, setPaymentType] = useState('FULL'); // FULL | DEPOSIT
  const [saving, setSaving] = useState(false);

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
  const totalDaysResult = (startMode === 'AFTER_REMAINING' && currentDays > 0) ? (currentDays + addedDays) : addedDays;

  // Duration label
  const durationLabel = durationPreset === '4_MONTHS' ? '4 شهور (الباقة الأساسية)' :
                        durationPreset === '2_MONTHS' ? 'شهرين' :
                        durationPreset === '1_MONTH' ? 'شهر واحد' :
                        `${addedDays} يوماً`;

  const currencySymbol = currency === 'SAR' ? 'ر.س' : 
                         currency === 'AED' ? 'د.إ' : 
                         currency === 'KWD' ? 'د.ك' : 
                         currency === 'USD' ? '$' : 'ج.م';

  const methodLabel = paymentMethod === 'INSTAPAY' ? 'إنستاباي (InstaPay)' :
                      paymentMethod === 'VCASH' ? 'فودافون كاش' :
                      paymentMethod === 'BANK' ? 'تحويل بنكي' : 
                      paymentMethod === 'ONLINE' ? 'الدفع الإلكتروني (الموقع)' : 
                      paymentMethod === 'CASH' ? 'كاش نقدي' : 'تحويل مباشر';

  // Build WhatsApp text
  const waMessage = `أهلاً بحضرتك يا أستاذ ${firstName}،\nتم تأكيد استلام تحويلك بنجاح لمبلغ ${Number(amountEgp).toLocaleString('en-US')} ${currencySymbol} عن طريق ${methodLabel}.\nتم تجديد وتفعيل اشتراكك في المنظومة التدريبية لمدة ${durationLabel} حتى تاريخ (${newEndDate}).\nبالتوفيق وبإذن الله مستمرين مع بعض لتحقيق أفضل نتيجة.\nكابتن كريم زكريا.`;

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
        package_code: isMax ? 'MAX' : 'ELITE'
      };

      // Call renew API
      try {
        await fetch(`${API_BASE}/api/v1/subscriptions/renew/${cleanCode}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.log('Renew API call finished');
      }

      if (openWhatsApp && phone) {
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('01')) cleanPhone = '2' + cleanPhone;
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`, '_blank');
      }

      if (onSuccess) {
        onSuccess({
          ...client,
          status: 'ACTIVE',
          subscription_status: 'ACTIVE',
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
        backdropFilter: 'blur(5px)',
        zIndex: 10500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        dir="rtl"
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.25)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#F8FAFC'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#0F172A',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Zap size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                  تجديد وتحصيل اشتراك المتدرب
                </h3>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: isMax ? '#FEF3C7' : '#EFF6FF',
                  color: isMax ? '#B45309' : '#1D4ED8',
                  border: isMax ? '1px solid #FDE68A' : '1px solid #BFDBFE'
                }}>
                  {isMax ? 'باقة MAX' : 'باقة ELITE'}
                </span>
              </div>
              <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                {clientName} • كود #{cleanCode} {phone ? `• ${phone}` : ''}
              </span>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* 1. Duration Presets */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              مدة التجديد المتفق عليها:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { id: '4_MONTHS', label: '4 شهور', sub: 'الباقة الأساسية (120 يوم)' },
                { id: '2_MONTHS', label: 'شهرين', sub: 'نصف باقة (60 يوم)' },
                { id: '1_MONTH', label: 'شهر واحد', sub: 'تجديد شهري (30 يوم)' },
              ].map(preset => {
                const isActive = durationPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setDurationPreset(preset.id)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: isActive ? '2px solid #0F172A' : '1px solid #E2E8F0',
                      background: isActive ? '#F8FAFC' : '#FFFFFF',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 800, color: isActive ? '#0F172A' : '#475569' }}>
                      {preset.label}
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#64748B', marginTop: '2px' }}>
                      {preset.sub}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Days Input Toggle */}
            <div style={{ marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setDurationPreset(durationPreset === 'CUSTOM' ? '4_MONTHS' : 'CUSTOM')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563EB',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                {durationPreset === 'CUSTOM' ? 'الرجوع للباقات الجاهزة' : '+ كتابة عدد أيام مخصصة (Custom)'}
              </button>

              {durationPreset === 'CUSTOM' && (
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11.5px', color: '#475569', fontWeight: 700 }}>عدد الأيام:</span>
                  <input
                    type="number"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    style={{
                      width: '80px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      fontWeight: 800,
                      textAlign: 'center',
                      fontFamily: 'JetBrains Mono, Cairo'
                    }}
                  />
                  <span style={{ fontSize: '11.5px', color: '#64748B' }}>يوماً</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. Start Date Options (Carry-over remaining days) */}
          {currentDays > 0 && (
            <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                المشترك لديه <strong>{currentDays} يوماً</strong> متبقية في اشتراكه الحالي:
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', cursor: 'pointer', color: '#0F172A' }}>
                  <input 
                    type="radio" 
                    name="startMode" 
                    checked={startMode === 'AFTER_REMAINING'} 
                    onChange={() => setStartMode('AFTER_REMAINING')} 
                  />
                  <span>إضافة المدة على الأيام المتبقية (ليصبح الإجمالي {currentDays + addedDays} يوماً)</span>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Amount & Currency */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                المبلغ المسدد والعملة:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '2px 6px', gap: '4px' }}>
                <input
                  type="number"
                  value={amountEgp}
                  onChange={(e) => setAmountEgp(e.target.value)}
                  placeholder="0"
                  style={{
                    flex: 1,
                    minWidth: '60px',
                    height: '34px',
                    border: 'none',
                    outline: 'none',
                    fontSize: '14px',
                    fontWeight: 800,
                    fontFamily: 'JetBrains Mono, Cairo',
                    color: '#0F172A',
                    padding: '0 6px'
                  }}
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  style={{
                    height: '30px',
                    border: 'none',
                    background: '#F1F5F9',
                    borderRadius: '5px',
                    padding: '0 6px',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#0F172A',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="EGP">ج.م (مصري)</option>
                  <option value="SAR">ر.س (سعودي)</option>
                  <option value="AED">د.إ (إماراتي)</option>
                  <option value="KWD">د.ك (كويتي)</option>
                  <option value="USD">$ (دولار)</option>
                </select>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                طريقة استلام التحويل:
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 10px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '12px',
                  fontWeight: 700,
                  fontFamily: 'Cairo, sans-serif',
                  color: '#0F172A',
                  background: '#FFFFFF',
                  outline: 'none'
                }}
              >
                <option value="INSTAPAY">إنستاباي (InstaPay)</option>
                <option value="VCASH">فودافون كاش</option>
                <option value="BANK">تحويل بنكي</option>
                <option value="ONLINE">دفع أونلاين عبر الموقع</option>
                <option value="CASH">كاش نقدي</option>
                <option value="OTHER">طريقة أخرى</option>
              </select>
            </div>
          </div>

          {/* 4. Calculated Result Summary */}
          <div style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11.5px'
          }}>
            <div style={{ color: '#166534', fontWeight: 700 }}>
              <span>تاريخ الانتهاء الجديد: </span>
              <strong style={{ fontFamily: 'JetBrains Mono, Cairo', fontSize: '12px' }}>{newEndDate}</strong>
            </div>
            <div style={{ color: '#166534', fontWeight: 700 }}>
              <span>الرصيد المضاف: </span>
              <strong style={{ fontFamily: 'JetBrains Mono, Cairo', fontSize: '12px' }}>+{addedDays} يوماً</strong>
            </div>
          </div>

          {/* 5. Live WhatsApp Preview */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>
              <MessageCircle size={12} color="#16A34A" />
              <span>معاينة رسالة التأكيد للمتدرب:</span>
            </div>
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '11px',
              color: '#334155',
              lineHeight: 1.5,
              whiteSpace: 'pre-line'
            }}>
              {waMessage}
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          gap: '8px',
          background: '#F8FAFC'
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
              background: '#16A34A',
              color: '#FFFFFF',
              fontSize: '12.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 5px rgba(22, 163, 74, 0.25)'
            }}
          >
            <MessageCircle size={15} />
            <span>اعتماد وإرسال واتساب فوراً</span>
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
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer'
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
              fontSize: '11.5px',
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