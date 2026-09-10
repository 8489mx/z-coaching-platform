import React, { useState, useEffect, useMemo } from 'react';
import { User, Activity, TrendingUp, TrendingDown, Calendar, Settings2, ChevronRight, Target, ArrowRightLeft, CheckCircle2, MessageCircle, ExternalLink, ZoomIn, X, Clock, Dumbbell, Scale, Flame, AlertCircle, HeartPulse } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import { API_BASE } from '../config/api';
import LabBiomarkersReviewStudio from '../components/clinical/LabBiomarkersReviewStudio';
import { ClientCodeBadge, ClientPackageBadge } from '../utils/tierBadgeHelper';
import { generateWhatsAppUrl } from '../utils/whatsappRemindersEngine';
import { extractClientFastingProfile } from '../utils/seasonalFastingRadar';

const PERIODIZATION_PHASES = [
  { id: 'FAT_LOSS', label: 'تنشيف (Cut)', desc: 'عجز سعرات مدروس لحرق الدهون والحفاظ على الكتلة العضلية', icon: TrendingDown, color: '#E11D48', bg: '#FFF1F2' },
  { id: 'DIET_BREAK', label: 'صيانة واستشفاء (Diet Break)', desc: 'ثبات السعرات لراحة الجهاز العصبي وإعادة ضبط الهرمونات', icon: Activity, color: '#D97706', bg: '#FFFBEB' },
  { id: 'LEAN_BULK', label: 'تضخيم صافي (Lean Bulk)', desc: 'فائض سعرات مقنن لبناء النسيج العضلي بأقل اكتساب دهون', icon: TrendingUp, color: '#16A34A', bg: '#F0FDF4' },
  { id: 'MINI_CUT', label: 'تنشيف سريع (Mini-Cut)', desc: 'عجز مكثف لفترة وجيزة (3-4 أسابيع) لخفض الدهون والعودة للبناء', icon: Flame, color: '#9333EA', bg: '#FAF5FF' }
];

export default function ClientTimelineProfile() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [currentPhase, setCurrentPhase] = useState('FAT_LOSS');
  const [isChangingPhase, setIsChangingPhase] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [phaseMessage, setPhaseMessage] = useState('');
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);

  // Clean and parse ID / Code
  const cleanId = useMemo(() => String(id || '1').replace(/^#+/, '').replace(/^client[-_]?/i, ''), [id]);

  useEffect(() => {
    fetchClientProfile();
  }, [cleanId]);

  const fetchClientProfile = async () => {
    try {
      setLoading(true);

      // 1. Fetch Client Check-in and Photos Data
      let checkinsData = [];
      let photosData = [];
      let resolvedUser = null;

      try {
        const res = await fetch(`${API_BASE}/api/v1/checkin/client/${cleanId}`);
        if (res.ok) {
          const data = await res.json();
          checkinsData = data.checkins || [];
          photosData = data.photos || [];
          if (data.user) resolvedUser = data.user;
        }
      } catch (err) {
        console.warn('Checkin API error:', err);
      }

      // 2. Fetch Clients List for full User Identity & Subscription
      try {
        const clientsRes = await fetch(`${API_BASE}/api/v1/clients`);
        if (clientsRes.ok) {
          const clientsJson = await clientsRes.json();
          const matched = (clientsJson.clients || []).find(c => {
            const strippedCode = String(c.client_code || c.id || '').replace(/^#+/, '').replace(/^client[-_]?/i, '');
            return strippedCode === cleanId ||
              String(c.id) === cleanId ||
              (c.phone_number && c.phone_number.includes(cleanId));
          });
          if (matched) {
            resolvedUser = { ...(resolvedUser || {}), ...matched };
          }
        }
      } catch (err) {
        console.warn('Clients API error:', err);
      }

      // 3. Set resolved or baseline client identity
      const finalClient = resolvedUser || {
        id: cleanId,
        client_code: cleanId,
        full_name: `متدرب #${cleanId}`,
        phone_number: '01000000000',
        subscription_package: 'MAX',
        subscription_status: 'ACTIVE',
        days_remaining: 60,
        current_weight: checkinsData[0]?.average_weight_kg || 80
      };

      setClient(finalClient);
      setCheckins(checkinsData);
      setPhotos(photosData);

      // Determine initial phase
      if (finalClient.phase) {
        setCurrentPhase(finalClient.phase);
      }
    } catch (err) {
      console.error('fetchClientProfile global error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhaseChange = (phaseId) => {
    setCurrentPhase(phaseId);
    setIsChangingPhase(false);
    setPhaseMessage('تم تحديث المرحلة الفسيولوجية بنجاح.');
    setTimeout(() => setPhaseMessage(''), 4000);
  };

  // Group Photos by Angle (FRONT, SIDE, BACK)
  const photosByAngle = useMemo(() => {
    const grouped = { FRONT: [], SIDE: [], BACK: [] };
    photos.forEach(p => {
      const pose = (p.pose || 'FRONT').toUpperCase();
      if (grouped[pose]) grouped[pose].push(p);
      else grouped.FRONT.push(p);
    });
    return grouped;
  }, [photos]);

  const clientName = client?.full_name || `متدرب #${cleanId}`;
  const clientCode = client?.client_code || cleanId;
  const isMaxTier = String(client?.subscription_package || '').toUpperCase().includes('MAX');

  if (loading) {
    return (
      <AdminLayout>
        <div dir="rtl" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cairo, Tajawal, sans-serif' }}>
          <div style={{ textAlign: 'center', color: '#64748B', fontSize: '14px', fontWeight: 700 }}>
            جاري استرجاع سجل التطور والملف الزمني للمتدرب...
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div dir="rtl" style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: 'Cairo, Tajawal, sans-serif', paddingBottom: '80px' }}>
        
        {/* Top Header Card */}
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
          <div style={{ maxWidth: '1040px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                type="button" 
                onClick={() => navigate('/customers')} 
                style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}
                title="الرجوع لقائمة المتدربين"
              >
                <ChevronRight size={18} />
              </button>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#0F172A' }}>{clientName}</h1>
                  <ClientCodeBadge code={clientCode} item={client} size="md" />
                  <ClientPackageBadge item={client} size="sm" />
                  {(() => {
                    const fasting = extractClientFastingProfile(client);
                    if (fasting?.isCoptic) {
                      return (
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#6D28D9', background: '#F5F3FF', border: '1px solid #DDD6FE', padding: '2px 8px', borderRadius: '4px' }}>
                          {fasting.christianFastingStyle === 'STRICT_VEGAN' ? 'صيام نباتي صرف' : 'صيام مع أسماك'}
                        </span>
                      );
                    }
                    if (fasting?.isRamadan) {
                      return (
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#B45309', background: '#FEF3C7', border: '1px solid #FDE68A', padding: '2px 8px', borderRadius: '4px' }}>
                          صيام رمضان
                        </span>
                      );
                    }
                    if (fasting?.isIntermittent) {
                      return (
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#0369A1', background: '#E0F2FE', border: '1px solid #BAE6FD', padding: '2px 8px', borderRadius: '4px' }}>
                          {fasting.intermittentBadge?.label || 'صيام متقطع'}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
                <span style={{ fontSize: '11.5px', color: '#64748B' }}>سجل التطور الزمني والمقارنة البصرية الشاملة</span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link 
                to={`/coach/editor/${clientCode}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: '0 2px 4px rgba(15, 23, 42, 0.15)'
                }}
              >
                <Dumbbell size={14} />
                <span>محرر الخطة</span>
              </Link>

              <Link 
                to={`/coach/checkin-review?code=${clientCode}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  color: '#0F172A',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  textDecoration: 'none'
                }}
              >
                <Activity size={14} />
                <span>مراجعة الشيك إن</span>
              </Link>

              <button 
                type="button"
                onClick={() => setIsLabModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#F0F9FF',
                  border: '1px solid #BAE6FD',
                  color: '#0284C7',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
                title="فحص المؤشرات الحيوية والتحاليل الطبية الشاملة"
              >
                <HeartPulse size={14} color="#0284C7" />
                <span>فحص التحاليل</span>
              </button>

              {client?.phone_number && (
                <a 
                  href={generateWhatsAppUrl(client.phone_number)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#F0FDF4',
                    border: '1px solid #86EFAC',
                    color: '#16A34A',
                    padding: '7px 12px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    textDecoration: 'none'
                  }}
                >
                  <MessageCircle size={14} />
                  <span>واتساب</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div style={{ maxWidth: '1040px', margin: '20px auto 0 auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {phaseMessage && (
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '10px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>
              {phaseMessage}
            </div>
          )}

          {/* Section 1: Client Overview & Periodization Stage */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '14px' }}>
            
            {/* Identity & Vitals Summary */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                <Scale size={16} color="#0284C7" />
                <strong style={{ fontSize: '13px', color: '#0F172A' }}>بيانات الاشتراك والحالة البدنية</strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 10px' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block' }}>رقم الهاتف:</span>
                  <strong dir="ltr" style={{ fontSize: '12px', color: '#0F172A', fontFamily: 'JetBrains Mono', display: 'block', textAlign: 'right' }}>
                    {client?.phone_number || '--'}
                  </strong>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 10px' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block' }}>الأيام المتبقية:</span>
                  <strong style={{ fontSize: '12px', color: '#0F172A' }}>
                    {client?.days_remaining !== undefined ? `${client.days_remaining} يوم` : 'نشط'}
                  </strong>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 10px' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block' }}>الوزن الحالي المسجل:</span>
                  <strong style={{ fontSize: '12px', color: '#0F172A', fontFamily: 'JetBrains Mono' }}>
                    {checkins[0]?.average_weight_kg ? `${checkins[0].average_weight_kg} كجم` : '--'}
                  </strong>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 10px' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block' }}>إجمالي التقييمات:</span>
                  <strong style={{ fontSize: '12px', color: '#16A34A', fontFamily: 'JetBrains Mono' }}>
                    {checkins.length} أسابيع متابعة
                  </strong>
                </div>
              </div>
            </div>

            {/* Periodization Stage Controller */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Target size={16} color="#D97706" />
                  <strong style={{ fontSize: '13px', color: '#0F172A' }}>المرحلة التدريبية والفسيولوجية</strong>
                </div>
                {!isChangingPhase && (
                  <button 
                    type="button" 
                    onClick={() => setIsChangingPhase(true)}
                    style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', fontWeight: 800, color: '#0F172A', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <ArrowRightLeft size={11} />
                    <span>تغيير المرحلة</span>
                  </button>
                )}
              </div>

              {isChangingPhase ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>اختر المرحلة الجديدة لتكييف السعرات والتدريب تلقائياً:</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {PERIODIZATION_PHASES.map(phase => {
                      const IconComponent = phase.icon;
                      const isSelected = currentPhase === phase.id;
                      return (
                        <div 
                          key={phase.id}
                          onClick={() => handlePhaseChange(phase.id)}
                          style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: isSelected ? `1.5px solid ${phase.color}` : '1px solid #E2E8F0',
                            background: isSelected ? phase.bg : '#FFFFFF',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <IconComponent size={13} color={phase.color} />
                            <strong style={{ fontSize: '11px', color: '#0F172A' }}>{phase.label}</strong>
                          </div>
                          <span style={{ fontSize: '9.5px', color: '#64748B', lineHeight: '1.3' }}>{phase.desc}</span>
                        </div>
                      );
                    })}
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setIsChangingPhase(false)}
                    style={{ alignSelf: 'flex-start', marginTop: '4px', background: 'transparent', border: 'none', color: '#64748B', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                (() => {
                  const activeStage = PERIODIZATION_PHASES.find(p => p.id === currentPhase) || PERIODIZATION_PHASES[0];
                  const ActiveIcon = activeStage.icon;
                  return (
                    <div style={{ background: activeStage.bg, border: `1px solid ${activeStage.color}33`, borderRadius: '8px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                          <ActiveIcon size={16} color={activeStage.color} />
                          <strong style={{ fontSize: '13px', color: activeStage.color }}>{activeStage.label}</strong>
                        </div>
                        <p style={{ margin: 0, fontSize: '11px', color: '#475569', lineHeight: '1.4' }}>
                          {activeStage.desc}
                        </p>
                      </div>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${activeStage.color}40` }}>
                        <ActiveIcon size={18} color={activeStage.color} />
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

          </div>

          {/* Section 2: Visual Transformation Studio (Side-by-Side Comparison) */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 900, color: '#0F172A' }}>
                  استوديو المقارنة البصرية لصور التطور (Before & After)
                </h3>
                <span style={{ fontSize: '11px', color: '#64748B' }}>مقارنة أسبوع البداية مع أحدث أسبوع مسجل بالزوايا الثلاث</span>
              </div>
              <span style={{ fontSize: '11px', color: '#0284C7', background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                {photos.length} صور مرفوعة
              </span>
            </div>

            {photos.length === 0 ? (
              <div style={{ padding: '30px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '12px' }}>
                لم يتم رفع صور تقييم أسبوعية لهذا المتدرب حتى الآن.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                {[
                  { angle: 'FRONT', title: 'الأمامية (Front)' },
                  { angle: 'SIDE', title: 'الجانبية (Side)' },
                  { angle: 'BACK', title: 'الخلفية (Back)' }
                ].map(({ angle, title }) => {
                  const anglePhotos = photosByAngle[angle] || [];
                  const oldestPhoto = anglePhotos[anglePhotos.length - 1]; // Baseline / Week 1
                  const latestPhoto = anglePhotos[0]; // Most recent

                  return (
                    <div key={angle} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px' }}>
                      <strong style={{ display: 'block', fontSize: '12px', color: '#0F172A', fontWeight: 800, marginBottom: '8px', textAlign: 'center' }}>
                        {title}
                      </strong>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {/* Baseline */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                          <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>البداية (Baseline)</span>
                          {oldestPhoto ? (
                            <div 
                              style={{ width: '100%', height: '140px', borderRadius: '6px', overflow: 'hidden', background: '#0F172A', position: 'relative', cursor: 'pointer' }}
                              onClick={() => setPreviewPhoto({ title: `${title} - البداية`, url: oldestPhoto.photo_url })}
                            >
                              <img src={oldestPhoto.photo_url} alt="البداية" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(15, 23, 42, 0.75)', color: '#FFFFFF', padding: '2px 4px', borderRadius: '3px', fontSize: '9px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <ZoomIn size={10} />
                              </div>
                            </div>
                          ) : (
                            <div style={{ width: '100%', height: '140px', borderRadius: '6px', border: '1px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '10px' }}>
                              غير متوفرة
                            </div>
                          )}
                        </div>

                        {/* Latest */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                          <span style={{ fontSize: '10px', color: '#16A34A', fontWeight: 800 }}>الأحدث (Current)</span>
                          {latestPhoto ? (
                            <div 
                              style={{ width: '100%', height: '140px', borderRadius: '6px', overflow: 'hidden', background: '#0F172A', position: 'relative', cursor: 'pointer', border: '1.5px solid #16A34A' }}
                              onClick={() => setPreviewPhoto({ title: `${title} - الأحدث`, url: latestPhoto.photo_url })}
                            >
                              <img src={latestPhoto.photo_url} alt="الأحدث" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(15, 23, 42, 0.75)', color: '#FFFFFF', padding: '2px 4px', borderRadius: '3px', fontSize: '9px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <ZoomIn size={10} />
                              </div>
                            </div>
                          ) : (
                            <div style={{ width: '100%', height: '140px', borderRadius: '6px', border: '1px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '10px' }}>
                              غير متوفرة
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Check-in History Timeline */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 900, color: '#0F172A' }}>
                  سجل التقييمات والمتابعات الأسبوعية (Check-in Timeline)
                </h3>
                <span style={{ fontSize: '11px', color: '#64748B' }}>تتبع الوزن ومحيط الخصر ومؤشرات الاستشفاء أسبوعاً بأسبوع</span>
              </div>
            </div>

            {checkins.length === 0 ? (
              <div style={{ padding: '30px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '12px' }}>
                لا توجد متابعات مسجلة في قاعدة البيانات لهذا المتدرب.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {checkins.map((item, index) => {
                  const nextItem = checkins[index + 1];
                  const weightDiff = nextItem && item.average_weight_kg && nextItem.average_weight_kg
                    ? (item.average_weight_kg - nextItem.average_weight_kg).toFixed(1)
                    : null;

                  const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US') : 'الأسبوع الحالي';

                  return (
                    <div 
                      key={item.id || index}
                      style={{
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16A34A' }} />
                          <strong style={{ fontSize: '12.5px', color: '#0F172A' }}>
                            الأسبوع {item.week_number || (checkins.length - index)}
                          </strong>
                          <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'JetBrains Mono' }}>
                            {dateStr}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '2px 8px', borderRadius: '4px', color: '#0F172A' }}>
                            الوزن: {item.average_weight_kg || item.weight_kg || '--'} كجم
                          </span>
                          {weightDiff !== null && (
                            <span style={{
                              fontSize: '10.5px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: Number(weightDiff) < 0 ? '#ECFDF5' : (Number(weightDiff) > 0 ? '#FFF1F2' : '#F1F5F9'),
                              color: Number(weightDiff) < 0 ? '#16A34A' : (Number(weightDiff) > 0 ? '#E11D48' : '#64748B')
                            }}>
                              {Number(weightDiff) > 0 ? `+${weightDiff}` : `${weightDiff}`} كجم
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Biofeedback metrics row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px', fontSize: '11px' }}>
                        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '5px 8px', borderRadius: '4px' }}>
                          <span style={{ color: '#64748B' }}>الخصر: </span>
                          <strong style={{ color: '#0F172A' }}>{item.waist_circumference_cm ? `${item.waist_circumference_cm} سم` : '--'}</strong>
                        </div>
                        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '5px 8px', borderRadius: '4px' }}>
                          <span style={{ color: '#64748B' }}>التزام الدايت: </span>
                          <strong style={{ color: '#16A34A' }}>{item.nutrition_adherence_percent || 100}%</strong>
                        </div>
                        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '5px 8px', borderRadius: '4px' }}>
                          <span style={{ color: '#64748B' }}>جلسات التمرين: </span>
                          <strong style={{ color: '#0F172A' }}>{item.workouts_completed || 0} أيام</strong>
                        </div>
                        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '5px 8px', borderRadius: '4px' }}>
                          <span style={{ color: '#64748B' }}>الطاقة / النوم: </span>
                          <strong style={{ color: '#0284C7' }}>
                            {item.biofeedback?.energyLevel || 7}/10 • {item.biofeedback?.sleepQuality || 7}/10
                          </strong>
                        </div>
                      </div>

                      {item.coach_notes && (
                        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '4px', padding: '6px 10px', fontSize: '11px', color: '#1E40AF' }}>
                          <strong>توجيه الكابتن: </strong>
                          <span>{item.coach_notes}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Modal for Zooming Photos */}
        {previewPhoto && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(4px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={() => setPreviewPhoto(null)}
          >
            <div 
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0' }}>
                <strong style={{ fontSize: '13px', color: '#0F172A' }}>{previewPhoto.title}</strong>
                <button 
                  type="button" 
                  onClick={() => setPreviewPhoto(null)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
                >
                  <X size={18} />
                </button>
              </div>
              <div style={{ padding: '12px', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src={previewPhoto.url} 
                  alt={previewPhoto.title} 
                  style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: '4px' }} 
                />
              </div>
            </div>
          </div>
        )}

        {/* Clinical Lab Biomarkers Review Studio Modal */}
        {isLabModalOpen && (
          <LabBiomarkersReviewStudio
            client={client || { client_code: cleanId, full_name: client?.full_name || `مشترك #${cleanId}` }}
            initialValues={client?.biomarkers || {}}
            medicalReportsUrls={client?.medical_reports_urls || []}
            onClose={() => setIsLabModalOpen(false)}
            onSave={(updatedBiomarkers) => {
              setClient(prev => ({ ...prev, biomarkers: updatedBiomarkers }));
              setIsLabModalOpen(false);
            }}
          />
        )}

      </div>
    </AdminLayout>
  );
}

