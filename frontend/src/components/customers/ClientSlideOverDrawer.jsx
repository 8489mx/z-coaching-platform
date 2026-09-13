import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  MessageCircle, 
  Pause, 
  Play, 
  CreditCard, 
  Clock, 
  Calendar, 
  Scale, 
  TrendingDown, 
  TrendingUp, 
  Minus, 
  FileText, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sliders,
  Loader2
} from 'lucide-react';
import { API_BASE } from '../../config/api';
import { ClientCodeBadge, ClientPackageBadge } from '../../utils/tierBadgeHelper';
import { extractClientFastingProfile } from '../../utils/seasonalFastingRadar';

export default function ClientSlideOverDrawer({
  isOpen,
  onClose,
  client,
  onToggleFreeze,
  freezingClientId,
  onOpenWhatsApp,
  onOpenRenewal
}) {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [checkinData, setCheckinData] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [restTimerEnabled, setRestTimerEnabled] = useState(Boolean(client?.enable_rest_timer));
  const [weightLoggingEnabled, setWeightLoggingEnabled] = useState(Boolean(client?.enable_weight_logging));
  const [updatingFlag, setUpdatingFlag] = useState(null);

  useEffect(() => {
    if (client) {
      setRestTimerEnabled(Boolean(client.enable_rest_timer));
      setWeightLoggingEnabled(Boolean(client.enable_weight_logging));
    }
  }, [client]);

  const handleToggleFlag = async (flagName, currentValue) => {
    if (!client?.id) return;
    try {
      setUpdatingFlag(flagName);
      const nextVal = !currentValue;
      const res = await fetch(`${API_BASE}/api/v1/clients/${client.id}/feature-flags`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [flagName]: nextVal })
      });
      if (res.ok) {
        if (flagName === 'enable_rest_timer') setRestTimerEnabled(nextVal);
        if (flagName === 'enable_weight_logging') setWeightLoggingEnabled(nextVal);
        client[flagName] = nextVal;
      }
    } catch (err) {
      console.error('Toggle feature flag error:', err);
    } finally {
      setUpdatingFlag(null);
    }
  };

  const cleanCode = client ? String(client.client_code || client.id || '').replace(/^client[-_]?/i, '') : '';

  useEffect(() => {
    if (!isOpen || !cleanCode) {
      setCheckinData(null);
      return;
    }

    const fetchClientCheckins = async () => {
      try {
        setLoadingStats(true);
        const res = await fetch(`${API_BASE}/api/v1/checkin/client/${cleanCode}`);
        if (res.ok) {
          const data = await res.json();
          setCheckinData(data);
        }
      } catch (err) {
        console.error('Drawer checkin fetch error:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchClientCheckins();
  }, [isOpen, cleanCode]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (selectedPhoto) {
          setSelectedPhoto(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, selectedPhoto]);

  if (!isOpen || !client) return null;

  const fasting = extractClientFastingProfile(client);

  const handleCopyPhone = () => {
    if (client.phone_number) {
      navigator.clipboard.writeText(client.phone_number);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const submissions = checkinData?.submissions || checkinData?.checkins || [];
  const totalCheckins = submissions.length;
  const latestSubmission = totalCheckins > 0 ? submissions[0] : null;
  const initialWeight = checkinData?.initialWeight || client?.starting_weight || (submissions.length > 0 ? submissions[submissions.length - 1]?.weight_kg : null);
  const currentWeight = latestSubmission?.weight_kg || checkinData?.currentWeight || client?.current_weight;
  
  let weightDiff = null;
  if (initialWeight && currentWeight && !isNaN(initialWeight) && !isNaN(currentWeight)) {
    weightDiff = (parseFloat(currentWeight) - parseFloat(initialWeight)).toFixed(1);
  }

  // Get photos from latest submission or client
  const latestPhotos = [];
  if (latestSubmission?.photos && Array.isArray(latestSubmission.photos)) {
    latestSubmission.photos.forEach(p => {
      if (typeof p === 'string') latestPhotos.push({ url: p });
      else if (p.url) latestPhotos.push(p);
    });
  } else if (latestSubmission?.photo_urls) {
    Object.entries(latestSubmission.photo_urls).forEach(([k, v]) => {
      if (v) latestPhotos.push({ label: k, url: v });
    });
  }

  return (
    <div 
      dir="rtl"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-start',
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        transition: 'background 0.2s ease'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Slide-over Content Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          height: '100%',
          background: '#FFFFFF',
          boxShadow: '4px 0 25px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            background: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ClientCodeBadge code={cleanCode} item={client} />
            <div>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: '#0F172A', lineHeight: 1.3 }}>
                {client.full_name || client.name || 'مشترك جديد'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <ClientPackageBadge item={client} />
                {client.subscription_status === 'FROZEN' ? (
                  <span style={{ fontSize: '10.5px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }}>
                    مجمد مؤقتاً
                  </span>
                ) : client.subscription_status === 'EXPIRED' ? (
                  <span style={{ fontSize: '10.5px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                    منتهي الصلاحية
                  </span>
                ) : (
                  <span style={{ fontSize: '10.5px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}>
                    نشط ({client.days_remaining !== undefined ? `${client.days_remaining} يوم متبقي` : 'ساري'})
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            title="إغلاق (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* 1. Quick Actions Toolbar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <button
              type="button"
              onClick={() => window.open(`/coach/editor/${cleanCode}`, '_blank')}
              style={{
                padding: '9px 12px',
                borderRadius: '7px',
                background: '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(15, 23, 42, 0.18)'
              }}
            >
              <FileText size={13} />
              <span>محرر الخطة (تبويب جديد)</span>
              <ExternalLink size={11} color="#94A3B8" />
            </button>

            <button
              type="button"
              onClick={() => window.open(`/coach/checkin-review?code=${cleanCode}`, '_blank')}
              style={{
                padding: '9px 12px',
                borderRadius: '7px',
                background: '#F8FAFC',
                color: '#0F172A',
                border: '1px solid #CBD5E1',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Scale size={13} color="#0284C7" />
              <span>مراجعة التقييمات</span>
              <ExternalLink size={11} color="#94A3B8" />
            </button>

            <button
              type="button"
              onClick={() => onOpenWhatsApp(client)}
              style={{
                padding: '8px 12px',
                borderRadius: '7px',
                background: '#F0FDF4',
                color: '#16A34A',
                border: '1px solid #86EFAC',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <MessageCircle size={13} />
              <span>مراسلة واتساب</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenRenewal(client)}
              style={{
                padding: '8px 12px',
                borderRadius: '7px',
                background: '#F0F9FF',
                color: '#0284C7',
                border: '1px solid #BAE6FD',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <CreditCard size={13} />
              <span>تجديد الاشتراك</span>
            </button>
          </div>

          {/* 2. Contact & Identity Card */}
          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', letterSpacing: '0.5px' }}>
              معلومات الاتصال والاشتراك
            </span>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>رقم الهاتف:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span dir="ltr" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                  {client.phone_number || 'غير مسجل'}
                </span>
                {client.phone_number && (
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    style={{
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      borderRadius: '4px',
                      padding: '2px 5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: copiedPhone ? '#16A34A' : '#64748B'
                    }}
                    title="نسخ رقم الهاتف"
                  >
                    {copiedPhone ? <Check size={11} /> : <Copy size={11} />}
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>فترة الاشتراك:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: '#0F172A', fontWeight: 700 }}>
                <span>{client.subscription_start_date ? new Date(client.subscription_start_date).toLocaleDateString('en-CA') : '-'}</span>
                <span style={{ color: '#94A3B8' }}>إلى</span>
                <span>{client.subscription_end_date ? new Date(client.subscription_end_date).toLocaleDateString('en-CA') : '-'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>حالة التجميد:</span>
              <button
                type="button"
                disabled={freezingClientId === client.id}
                onClick={() => onToggleFreeze(client)}
                style={{
                  padding: '3px 9px',
                  borderRadius: '5px',
                  border: client.subscription_status === 'FROZEN' ? '1px solid #86EFAC' : '1px solid #CBD5E1',
                  background: client.subscription_status === 'FROZEN' ? '#F0FDF4' : '#FFFFFF',
                  color: client.subscription_status === 'FROZEN' ? '#16A34A' : '#475569',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: freezingClientId === client.id ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {client.subscription_status === 'FROZEN' ? <Play size={11} /> : <Pause size={11} />}
                <span>{client.subscription_status === 'FROZEN' ? 'استئناف الاشتراك وتمديد المدة' : 'تجميد الاشتراك مؤقتاً'}</span>
              </button>
            </div>

            {/* Fasting Badges */}
            {(fasting.primaryFastingBadge || fasting.intermittentBadge) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '6px', borderTop: '1px dashed #E2E8F0' }}>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>نمط التغذية:</span>
                {fasting.primaryFastingBadge && (
                  <span style={{
                    fontSize: '10.5px',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: fasting.primaryFastingBadge.bg,
                    border: `1px solid ${fasting.primaryFastingBadge.border}`,
                    color: fasting.primaryFastingBadge.color,
                    fontWeight: 800
                  }}>
                    {fasting.primaryFastingBadge.label}
                  </span>
                )}
                {fasting.intermittentBadge && (
                  <span style={{
                    fontSize: '10.5px',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: fasting.intermittentBadge.bg,
                    border: `1px solid ${fasting.intermittentBadge.border}`,
                    color: fasting.intermittentBadge.color,
                    fontWeight: 800
                  }}>
                    {fasting.intermittentBadge.label}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Feature Flags Management Card (أعلام الميزات للمشترك) */}
          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sliders size={14} color="#0284C7" />
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A' }}>
                  إعدادات الميزات الاختيارية للمتدرب
                </span>
              </div>
              <span style={{ fontSize: '10px', color: '#64748B' }}>
                تحكم فوري بحساب المتدرب
              </span>
            </div>

            {/* Rest Timer Flag */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '10px 12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <div>
                <strong style={{ fontSize: '11.5px', color: '#0F172A', display: 'block' }}>مؤقت فترات الراحة</strong>
                <span style={{ fontSize: '10px', color: '#64748B' }}>معطل افتراضياً لمنع التشتت أثناء الجلسة</span>
              </div>
              <button
                type="button"
                disabled={updatingFlag === 'enable_rest_timer'}
                onClick={() => handleToggleFlag('enable_rest_timer', restTimerEnabled)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: updatingFlag === 'enable_rest_timer' ? 'wait' : 'pointer',
                  background: restTimerEnabled ? '#DCFCE7' : '#F1F5F9',
                  color: restTimerEnabled ? '#166534' : '#64748B',
                  border: restTimerEnabled ? '1px solid #86EFAC' : '1px solid #CBD5E1',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {updatingFlag === 'enable_rest_timer' && <Loader2 size={10} className="animate-spin" />}
                <span>{restTimerEnabled ? 'مفعل' : 'معطل'}</span>
              </button>
            </div>

            {/* Weight Logging Flag */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '10px 12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <div>
                <strong style={{ fontSize: '11.5px', color: '#0F172A', display: 'block' }}>تسجيل أوزان التمارين</strong>
                <span style={{ fontSize: '10px', color: '#64748B' }}>معطل افتراضياً (الجدول مرجع استرشادي)</span>
              </div>
              <button
                type="button"
                disabled={updatingFlag === 'enable_weight_logging'}
                onClick={() => handleToggleFlag('enable_weight_logging', weightLoggingEnabled)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: updatingFlag === 'enable_weight_logging' ? 'wait' : 'pointer',
                  background: weightLoggingEnabled ? '#DCFCE7' : '#F1F5F9',
                  color: weightLoggingEnabled ? '#166534' : '#64748B',
                  border: weightLoggingEnabled ? '1px solid #86EFAC' : '1px solid #CBD5E1',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {updatingFlag === 'enable_weight_logging' && <Loader2 size={10} className="animate-spin" />}
                <span>{weightLoggingEnabled ? 'مفعل' : 'معطل'}</span>
              </button>
            </div>
          </div>

          {/* 3. Progress & Weight Tracker Section */}
          <div
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', letterSpacing: '0.5px' }}>
                مؤشرات الوزن والتطور
              </span>
              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>
                {loadingStats ? 'جاري التحديث...' : `إجمالي التقييمات: ${totalCheckins}`}
              </span>
            </div>

            {loadingStats ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8', fontSize: '12px' }}>
                جاري جلب بيانات المتابعة...
              </div>
            ) : totalCheckins === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', background: '#F8FAFC', borderRadius: '6px', border: '1px dashed #CBD5E1' }}>
                <span style={{ fontSize: '12px', color: '#64748B', display: 'block', fontWeight: 600 }}>
                  لم يتم تسجيل أي تقييم أسبوعي للمشترك حتى الآن.
                </span>
                <small style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px', display: 'block' }}>
                  ستظهر صور التحول وتدرج الأوزان هنا فور اعتماد أول تقييم.
                </small>
              </div>
            ) : (
              <>
                {/* Weight Comparison Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <div style={{ background: '#F8FAFC', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#64748B', display: 'block', fontWeight: 700 }}>وزن البداية</span>
                    <strong style={{ fontSize: '14px', color: '#0F172A', fontFamily: 'JetBrains Mono, sans-serif' }}>
                      {initialWeight ? `${initialWeight} كجم` : '-'}
                    </strong>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#64748B', display: 'block', fontWeight: 700 }}>أحدث وزن</span>
                    <strong style={{ fontSize: '14px', color: '#0F172A', fontFamily: 'JetBrains Mono, sans-serif' }}>
                      {currentWeight ? `${currentWeight} كجم` : '-'}
                    </strong>
                  </div>

                  <div style={{ 
                    background: weightDiff && parseFloat(weightDiff) < 0 ? '#F0FDF4' : weightDiff && parseFloat(weightDiff) > 0 ? '#FEF3C7' : '#F8FAFC', 
                    padding: '8px 10px', 
                    borderRadius: '6px', 
                    border: `1px solid ${weightDiff && parseFloat(weightDiff) < 0 ? '#BBF7D0' : weightDiff && parseFloat(weightDiff) > 0 ? '#FDE68A' : '#E2E8F0'}`, 
                    textAlign: 'center' 
                  }}>
                    <span style={{ fontSize: '10px', color: '#64748B', display: 'block', fontWeight: 700 }}>فارق الوزن</span>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 800, fontSize: '14px', fontFamily: 'JetBrains Mono, sans-serif', color: weightDiff && parseFloat(weightDiff) < 0 ? '#16A34A' : weightDiff && parseFloat(weightDiff) > 0 ? '#B45309' : '#0F172A' }}>
                      {weightDiff && parseFloat(weightDiff) < 0 ? <TrendingDown size={13} /> : weightDiff && parseFloat(weightDiff) > 0 ? <TrendingUp size={13} /> : <Minus size={13} />}
                      <span>{weightDiff !== null ? `${Math.abs(weightDiff)} كجم` : '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Latest Check-in Snapshot */}
                {latestSubmission && (
                  <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#334155' }}>
                        آخر تقييم: {latestSubmission.createdAt ? new Date(latestSubmission.createdAt).toLocaleDateString('en-CA') : 'أسبوعي'}
                      </span>
                      {latestSubmission.compliance_score && (
                        <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #DBEAFE' }}>
                          الالتزام: {latestSubmission.compliance_score}%
                        </span>
                      )}
                    </div>
                    {latestSubmission.notes && (
                      <p style={{ margin: 0, fontSize: '11.5px', color: '#475569', lineHeight: 1.5, background: '#FFFFFF', padding: '6px 8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                        "{latestSubmission.notes}"
                      </p>
                    )}
                  </div>
                )}

                {/* Latest Photos Preview */}
                {latestPhotos.length > 0 && (
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', display: 'block', marginBottom: '6px' }}>
                      صور التطور الأحدث:
                    </span>
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                      {latestPhotos.map((photo, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedPhoto(photo.url)}
                          style={{
                            width: '72px',
                            height: '90px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            border: '1px solid #CBD5E1',
                            cursor: 'pointer',
                            flexShrink: 0,
                            position: 'relative'
                          }}
                          title="انقر للتكبير دون مغادرة الصفحة"
                        >
                          <img
                            src={photo.url}
                            alt="Progress preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 4. Full Timeline Profile Link */}
          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => window.open(`/customers/${cleanCode}`, '_blank')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Clock size={13} color="#475569" />
              <span>فتح ملف التطور الزمني المتكامل (في نافذة جديدة)</span>
              <ExternalLink size={11} color="#94A3B8" />
            </button>
          </div>

        </div>
      </div>

      {/* Photo Preview Lightbox Modal */}
      {selectedPhoto && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setSelectedPhoto(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img
              src={selectedPhoto}
              alt="Full Preview"
              style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '8px', objectFit: 'contain' }}
            />
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              style={{
                position: 'absolute',
                top: '-12px',
                right: '-12px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#FFFFFF',
                border: 'none',
                color: '#0F172A',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
