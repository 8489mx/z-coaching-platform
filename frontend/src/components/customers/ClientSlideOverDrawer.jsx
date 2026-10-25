import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  MessageCircle,
  Pause,
  Play,
  CreditCard,
  Clock,
  Scale,
  TrendingDown,
  TrendingUp,
  Minus,
  FileText,
  Copy,
  Check,
  Calendar,
  Phone,
  Activity,
  Utensils
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

  const cleanCode = client ? String(client.client_code || client.id || '').replace(/^client[-_]?/i, '') : '';

  useEffect(() => {
    if (!isOpen || !cleanCode) {
      setCheckinData(null);
      return;
    }

    const fetchClientCheckins = async () => {
      try {
        setLoadingStats(true);
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/v1/checkin/client/${cleanCode}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
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

  const getWeightVal = (sub) => {
    if (!sub) return null;
    const val = sub.average_weight_kg ?? sub.weight_kg ?? sub.weight;
    return (val !== null && val !== undefined && !isNaN(val)) ? parseFloat(val) : null;
  };

  const oldestSub = totalCheckins > 0 ? submissions[totalCheckins - 1] : null;
  const oldestWeight = getWeightVal(oldestSub);
  const latestWeight = getWeightVal(latestSubmission);

  const initialWeight = oldestWeight 
    ?? (client?.starting_weight ? parseFloat(client.starting_weight) : null)
    ?? (client?.start_weight_kg ? parseFloat(client.start_weight_kg) : null)
    ?? (client?.weight_kg ? parseFloat(client.weight_kg) : null);

  const currentWeight = latestWeight 
    ?? (client?.current_weight ? parseFloat(client.current_weight) : null)
    ?? (client?.current_weight_kg ? parseFloat(client.current_weight_kg) : null)
    ?? initialWeight;

  let weightDiff = null;
  if (initialWeight !== null && currentWeight !== null && !isNaN(initialWeight) && !isNaN(currentWeight)) {
    weightDiff = (currentWeight - initialWeight).toFixed(1);
  }

  // Get photos from checkinData or latest submission
  const latestPhotos = [];
  if (Array.isArray(checkinData?.photos) && checkinData.photos.length > 0) {
    checkinData.photos.forEach(p => {
      const url = typeof p === 'string' ? p : (p.photo_url || p.url || p.file_path);
      if (url) latestPhotos.push({ url });
    });
  } else if (latestSubmission?.photos && Array.isArray(latestSubmission.photos)) {
    latestSubmission.photos.forEach(p => {
      const url = typeof p === 'string' ? p : (p.photo_url || p.url || p.file_path);
      if (url) latestPhotos.push({ url });
    });
  }

  const clientName = client.full_name || client.name || 'مشترك جديد';
  const clientInitial = clientName.trim().charAt(0) || 'م';

  const isFrozen = client.subscription_status === 'FROZEN';
  const isExpired = client.subscription_status === 'EXPIRED';

  const daysRemaining = client.days_remaining !== undefined ? client.days_remaining : client.daysRemaining;

  const startDateStr = client.subscription_start_date ? new Date(client.subscription_start_date).toLocaleDateString('en-CA') : '-';
  const endDateStr = client.subscription_end_date ? new Date(client.subscription_end_date).toLocaleDateString('en-CA') : '-';

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
          background: '#FAFAFA',
          borderLeft: '1px solid #E2E8F0',
          boxShadow: '-4px 0 25px rgba(0, 0, 0, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid #EAECF0',
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            {/* Client Code Box */}
            <div
              dir="ltr"
              style={{
                minWidth: '42px',
                height: '34px',
                padding: '0 10px',
                borderRadius: '8px',
                background: '#F4F0FD',
                color: '#673DE6',
                border: '1px solid #EDE8FA',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 800,
                fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '0.3px',
                flexShrink: 0
              }}
            >
              #{cleanCode}
            </div>

            <div style={{ minWidth: 0 }}>
              <h2 style={{
                margin: 0,
                fontSize: '14.5px',
                fontWeight: 800,
                color: '#101828',
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {clientName}
              </h2>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                <ClientPackageBadge item={client} />
                {isFrozen ? (
                  <span style={{ fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }}>
                    مجمد مؤقتاً
                  </span>
                ) : isExpired ? (
                  <span style={{ fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                    منتهي الصلاحية
                  </span>
                ) : (
                  <span style={{ fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}>
                    نشط {daysRemaining !== undefined ? `· ${daysRemaining} يوم متبقي` : ''}
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
              borderRadius: '8px',
              border: '1px solid #D0D5DD',
              background: '#FFFFFF',
              color: '#475467',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#101828'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#475467'; }}
            title="إغلاق (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* 1. Quick Actions Toolbar (6 Cohesive Buttons) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            
            {/* Action 1: Plan Editor (Primary Action) */}
            <button
              type="button"
              onClick={() => window.open(`/coach/editor/${cleanCode}`, '_blank')}
              style={{
                height: '38px',
                padding: '0 12px',
                borderRadius: '9px',
                background: '#673DE6',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 1px 3px rgba(103, 61, 230, 0.25)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#5025D1'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#673DE6'; }}
            >
              <FileText size={14} />
              <span>محرر الخطة</span>
              <ExternalLink size={11} color="#D8B4FE" />
            </button>

            {/* Action 2: Check-in Review */}
            <button
              type="button"
              onClick={() => window.open(`/coach/checkin-review?code=${cleanCode}`, '_blank')}
              style={{
                height: '38px',
                padding: '0 12px',
                borderRadius: '9px',
                background: '#FFFFFF',
                color: '#101828',
                border: '1px solid #D0D5DD',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#673DE6'; e.currentTarget.style.color = '#673DE6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#D0D5DD'; e.currentTarget.style.color = '#101828'; }}
            >
              <Scale size={14} color="#673DE6" />
              <span>مراجعة التقييمات</span>
              <ExternalLink size={11} color="#94A3B8" />
            </button>

            {/* Action 3: WhatsApp Chat */}
            <button
              type="button"
              onClick={() => onOpenWhatsApp(client)}
              style={{
                height: '38px',
                padding: '0 12px',
                borderRadius: '9px',
                background: '#F0FDF4',
                color: '#166534',
                border: '1px solid #BBF7D0',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#DCFCE7'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#F0FDF4'; }}
            >
              <MessageCircle size={14} />
              <span>مراسلة واتساب</span>
            </button>

            {/* Action 4: Renewal */}
            <button
              type="button"
              onClick={() => onOpenRenewal(client)}
              style={{
                height: '38px',
                padding: '0 12px',
                borderRadius: '9px',
                background: '#F0F9FF',
                color: '#0369A1',
                border: '1px solid #BAE6FD',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#E0F2FE'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#F0F9FF'; }}
            >
              <CreditCard size={14} />
              <span>تجديد الاشتراك</span>
            </button>

            {/* Action 5: Freeze / Resume */}
            <button
              type="button"
              disabled={freezingClientId === client.id}
              onClick={() => onToggleFreeze && onToggleFreeze(client)}
              style={{
                height: '38px',
                padding: '0 12px',
                borderRadius: '9px',
                background: isFrozen ? '#F0FDF4' : '#FFFBEB',
                color: isFrozen ? '#166534' : '#B45309',
                border: isFrozen ? '1px solid #BBF7D0' : '1px solid #FDE68A',
                fontSize: '12px',
                fontWeight: 800,
                cursor: freezingClientId === client.id ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = isFrozen ? '#DCFCE7' : '#FEF3C7'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = isFrozen ? '#F0FDF4' : '#FFFBEB'; }}
            >
              {isFrozen ? <Play size={14} /> : <Pause size={14} />}
              <span>{isFrozen ? 'استئناف الاشتراك' : 'تجميد مؤقت'}</span>
            </button>

            {/* Action 6: Timeline Progress */}
            <button
              type="button"
              onClick={() => window.open(`/coach/timeline/${cleanCode}`, '_blank')}
              style={{
                height: '38px',
                padding: '0 12px',
                borderRadius: '9px',
                background: '#F8FAFC',
                color: '#344054',
                border: '1px solid #D0D5DD',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#673DE6'; e.currentTarget.style.color = '#673DE6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#D0D5DD'; e.currentTarget.style.color = '#344054'; }}
            >
              <TrendingUp size={14} color="#673DE6" />
              <span>سجل التطور</span>
              <ExternalLink size={11} color="#94A3B8" />
            </button>
          </div>

          {/* 2. Contact & Identity Card */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #EAECF0',
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: '#F4F0FD',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#673DE6'
              }}>
                <Phone size={13} />
              </div>
              <strong style={{ fontSize: '12.5px', color: '#101828', fontWeight: 800 }}>معلومات الاتصال والاشتراك</strong>
            </div>

            {/* Phone Row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 10px',
              background: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid #F1F5F9'
            }}>
              <span style={{ fontSize: '11.5px', color: '#475467', fontWeight: 700 }}>رقم الهاتف:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span dir="ltr" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12.5px', fontWeight: 800, color: '#101828' }}>
                  {client.phone_number || 'غير مسجل'}
                </span>
                {client.phone_number && (
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    style={{
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      borderRadius: '6px',
                      padding: '3px 6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: copiedPhone ? '#16A34A' : '#475467',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      transition: 'all 0.12s ease'
                    }}
                    title="نسخ رقم الهاتف"
                  >
                    {copiedPhone ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedPhone ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Dates Row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 10px',
              background: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid #F1F5F9'
            }}>
              <span style={{ fontSize: '11.5px', color: '#475467', fontWeight: 700 }}>فترة الاشتراك:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div dir="ltr" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#101828', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
                  <span>{startDateStr}</span>
                  <span style={{ color: '#94A3B8' }}>←</span>
                  <span>{endDateStr}</span>
                </div>
              </div>
            </div>

            {/* Status & Fasting Meta Row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 10px',
              background: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid #F1F5F9'
            }}>
              <span style={{ fontSize: '11.5px', color: '#475467', fontWeight: 700 }}>خطة التغذية والحالة:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {fasting.primaryFastingBadge && (
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '6px',
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
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: fasting.intermittentBadge.bg,
                    border: `1px solid ${fasting.intermittentBadge.border}`,
                    color: fasting.intermittentBadge.color,
                    fontWeight: 800
                  }}>
                    {fasting.intermittentBadge.label}
                  </span>
                )}
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: isFrozen ? '#FEF3C7' : isExpired ? '#FEF2F2' : '#F0FDF4',
                  color: isFrozen ? '#B45309' : isExpired ? '#DC2626' : '#166534',
                  border: isFrozen ? '1px solid #FDE68A' : isExpired ? '1px solid #FECACA' : '1px solid #BBF7D0'
                }}>
                  {isFrozen ? 'مجمد مؤقتاً' : isExpired ? 'منتهي الصلاحية' : 'اشتراك ساري'}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Progress & Weight Tracker Section */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #EAECF0',
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB'
                }}>
                  <Activity size={13} />
                </div>
                <strong style={{ fontSize: '12.5px', color: '#101828', fontWeight: 800 }}>مؤشرات الوزن والتطور</strong>
              </div>

              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '6px',
                background: totalCheckins > 0 ? '#F0FDF4' : '#F1F5F9',
                color: totalCheckins > 0 ? '#166534' : '#475467',
                border: totalCheckins > 0 ? '1px solid #BBF7D0' : '1px solid #E2E8F0'
              }}>
                {loadingStats ? 'جاري التحديث...' : `إجمالي التقييمات: ${totalCheckins}`}
              </span>
            </div>

            {loadingStats ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '12px', fontWeight: 600 }}>
                جاري جلب بيانات المتابعة...
              </div>
            ) : totalCheckins === 0 && !initialWeight ? (
              <div style={{ padding: '16px', textAlign: 'center', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
                <span style={{ fontSize: '12px', color: '#475467', display: 'block', fontWeight: 700 }}>
                  لم يتم تسجيل أي تقييم أسبوعي للمشترك حتى الآن.
                </span>
                <small style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>
                  ستظهر صور التحول وتدرج الأوزان هنا فور اعتماد أول تقييم.
                </small>
              </div>
            ) : (
              <>
                {/* Weight Comparison Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {/* Initial Weight */}
                  <div style={{ background: '#F8FAFC', padding: '10px 8px', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block', fontWeight: 700, marginBottom: '2px' }}>وزن البداية</span>
                    <strong style={{ fontSize: '14.5px', color: '#101828', fontFamily: 'JetBrains Mono, sans-serif', fontWeight: 800 }}>
                      {initialWeight !== null ? `${initialWeight} كجم` : '-'}
                    </strong>
                  </div>

                  {/* Current Weight */}
                  <div style={{ background: '#F8FAFC', padding: '10px 8px', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block', fontWeight: 700, marginBottom: '2px' }}>أحدث وزن</span>
                    <strong style={{ fontSize: '14.5px', color: '#101828', fontFamily: 'JetBrains Mono, sans-serif', fontWeight: 800 }}>
                      {currentWeight !== null ? `${currentWeight} كجم` : '-'}
                    </strong>
                  </div>

                  {/* Weight Difference */}
                  <div style={{ 
                    background: weightDiff && parseFloat(weightDiff) < 0 ? '#F0FDF4' : weightDiff && parseFloat(weightDiff) > 0 ? '#FFFBEB' : '#F8FAFC', 
                    padding: '10px 8px', 
                    borderRadius: '8px', 
                    border: `1px solid ${weightDiff && parseFloat(weightDiff) < 0 ? '#BBF7D0' : weightDiff && parseFloat(weightDiff) > 0 ? '#FDE68A' : '#E2E8F0'}`, 
                    textAlign: 'center' 
                  }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block', fontWeight: 700, marginBottom: '2px' }}>فارق الوزن</span>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                      fontWeight: 800,
                      fontSize: '14.5px',
                      fontFamily: 'JetBrains Mono, sans-serif',
                      color: weightDiff && parseFloat(weightDiff) < 0 ? '#166534' : weightDiff && parseFloat(weightDiff) > 0 ? '#B45309' : '#101828'
                    }}>
                      {weightDiff && parseFloat(weightDiff) < 0 ? <TrendingDown size={14} /> : weightDiff && parseFloat(weightDiff) > 0 ? <TrendingUp size={14} /> : <Minus size={14} />}
                      <span>{weightDiff !== null ? `${Math.abs(weightDiff)} كجم` : '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Latest Check-in Snapshot */}
                {latestSubmission && (
                  <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#101828' }}>
                        آخر تقييم: {latestSubmission.createdAt ? new Date(latestSubmission.createdAt).toLocaleDateString('en-CA') : 'أسبوعي'}
                      </span>
                      {(latestSubmission.nutrition_adherence_percent !== undefined || latestSubmission.compliance_score !== undefined) && (
                        <span style={{ fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #DBEAFE' }}>
                          الالتزام: {latestSubmission.nutrition_adherence_percent ?? latestSubmission.compliance_score}%
                        </span>
                      )}
                    </div>
                    {(latestSubmission.coach_notes || latestSubmission.notes || latestSubmission.client_notes) && (
                      <p style={{ margin: 0, fontSize: '11.5px', color: '#334155', lineHeight: 1.6, background: '#FFFFFF', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                        "{latestSubmission.coach_notes || latestSubmission.notes || latestSubmission.client_notes}"
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
                            width: '74px',
                            height: '92px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid #CBD5E1',
                            cursor: 'pointer',
                            flexShrink: 0,
                            position: 'relative',
                            boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)'
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

        </div>

        {/* 4. Sticky Bottom Footer (Full Timeline Profile Link) */}
        <div style={{
          position: 'sticky',
          bottom: 0,
          background: '#FFFFFF',
          borderTop: '1px solid #EAECF0',
          padding: '12px 16px',
          marginTop: 'auto',
          zIndex: 10
        }}>
          <button
            type="button"
            onClick={() => window.open(`/customers/${cleanCode}`, '_blank')}
            style={{
              width: '100%',
              height: '38px',
              borderRadius: '9px',
              border: '1px solid #D0D5DD',
              background: '#FFFFFF',
              color: '#344054',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#673DE6'; e.currentTarget.style.color = '#673DE6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#D0D5DD'; e.currentTarget.style.color = '#344054'; }}
          >
            <Clock size={14} color="#673DE6" />
            <span>فتح ملف التطور الزمني المتكامل (في نافذة جديدة)</span>
            <ExternalLink size={12} color="#94A3B8" />
          </button>
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
              style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '10px', objectFit: 'contain' }}
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
                color: '#101828',
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