import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ChevronLeft,
  Target,
  ArrowRightLeft,
  MessageCircle,
  ZoomIn,
  X,
  Dumbbell,
  BadgeCheck,
  Scale,
  Flame,
  AlertCircle,
  HeartPulse,
  ShieldAlert,
  Copy,
  Check,
  Calendar,
  Phone,
  Camera,
  FileText
} from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import { API_BASE } from '../config/api';
import LabBiomarkersReviewStudio from '../components/clinical/LabBiomarkersReviewStudio';
import { ClientCodeBadge, ClientPackageBadge } from '../utils/tierBadgeHelper';
import { generateWhatsAppUrl } from '../utils/whatsappRemindersEngine';
import { extractClientFastingProfile } from '../utils/seasonalFastingRadar';

const PERIODIZATION_PHASES = [
  { 
    id: 'FAT_LOSS', 
    label: 'تنشيف (Cut)', 
    desc: 'عجز سعرات مدروس لحرق الدهون والحفاظ على الكتلة العضلية', 
    icon: TrendingDown, 
    color: '#E11D48', 
    bg: '#FFF1F2', 
    border: '#FECDD3',
    nutritionGuideline: 'عجز سعرات مقنن (-20%) مع بروتين 2.2 جم/كجم',
    trainingGuideline: 'تمارين مقاومة بكثافة عالية وRIR 1-2'
  },
  { 
    id: 'DIET_BREAK', 
    label: 'صيانة واستشفاء (Diet Break)', 
    desc: 'ثبات السعرات لراحة الجهاز العصبي وإعادة ضبط الهرمونات', 
    icon: Activity, 
    color: '#D97706', 
    bg: '#FFFBEB', 
    border: '#FDE68A',
    nutritionGuideline: 'سعرات الصيانة الحسابية مع رفع الكاربوهيدرات',
    trainingGuideline: 'تخفيف حجم التمرين لتعافي المفاصل والأعصاب'
  },
  { 
    id: 'LEAN_BULK', 
    label: 'تضخيم صافي (Lean Bulk)', 
    desc: 'فائض سعرات مقنن لبناء النسيج العضلي بأقل اكتساب دهون', 
    icon: TrendingUp, 
    color: '#16A34A', 
    bg: '#F0FDF4', 
    border: '#BBF7D0',
    nutritionGuideline: 'فائض محسوب (+200 سعرة) لتخليق البروتين',
    trainingGuideline: 'زيادة تدريجية في الأحمال والمجموعات (Overload)'
  },
  { 
    id: 'MINI_CUT', 
    label: 'تنشيف سريع (Mini-Cut)', 
    desc: 'عجز مكثف لفترة وجيزة (3-4 أسابيع) لخفض الدهون والعودة للبناء', 
    icon: Flame, 
    color: '#9333EA', 
    bg: '#FAF5FF', 
    border: '#E9D5FF',
    nutritionGuideline: 'عجز سعرات مركز ومؤقت (-30%) لحرق سريع',
    trainingGuideline: 'تثبيت الأوزان والأداء لمنع أي هدم عضلي'
  }
];

export default function ClientTimelineProfile() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState(null);
  const [clientsList, setClientsList] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [currentPhase, setCurrentPhase] = useState('FAT_LOSS');
  const [isChangingPhase, setIsChangingPhase] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [phaseMessage, setPhaseMessage] = useState('');
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Clean and parse ID / Code
  const cleanId = useMemo(() => String(id || '1').replace(/^#+/, '').replace(/^client[-_]?/i, ''), [id]);

  useEffect(() => {
    fetchClientProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanId]);

  const fetchClientProfile = async () => {
    try {
      setLoading(true);

      let checkinsData = [];
      let photosData = [];
      let resolvedUser = null;

      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/v1/checkin/client/${cleanId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          checkinsData = data.checkins || [];
          photosData = data.photos || [];
          if (data.user) resolvedUser = data.user;
        }
      } catch (err) {
        console.warn('Checkin API error:', err);
      }

      try {
        const clientsRes = await fetch(`${API_BASE}/api/v1/clients`);
        if (clientsRes.ok) {
          const clientsJson = await clientsRes.json();
          const list = clientsJson.clients || [];
          setClientsList(list);
          const matched = list.find(c => {
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

      if (finalClient.phase) {
        setCurrentPhase(finalClient.phase);
      }
    } catch (err) {
      console.error('fetchClientProfile global error:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentIndex = useMemo(() => {
    return clientsList.findIndex(c => {
      const strippedCode = String(c.client_code || c.id || '').replace(/^#+/, '').replace(/^client[-_]?/i, '');
      return strippedCode === cleanId || String(c.id) === cleanId;
    });
  }, [clientsList, cleanId]);

  const prevClient = currentIndex > 0 ? clientsList[currentIndex - 1] : null;
  const nextClient = currentIndex >= 0 && currentIndex < clientsList.length - 1 ? clientsList[currentIndex + 1] : null;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;
      if (e.key === 'Escape') {
        if (previewPhoto) setPreviewPhoto(null);
        if (isLabModalOpen) setIsLabModalOpen(false);
      } else if (e.key === '[') {
        if (prevClient) {
          const prevCode = prevClient.client_code || prevClient.id;
          navigate(`/coach/timeline/${prevCode}`);
        }
      } else if (e.key === ']') {
        if (nextClient) {
          const nextCode = nextClient.client_code || nextClient.id;
          navigate(`/coach/timeline/${nextCode}`);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevClient, nextClient, previewPhoto, isLabModalOpen, navigate]);

  const handleCopySummary = async () => {
    const oldestCheckin = checkins.length > 0 ? checkins[checkins.length - 1] : null;
    const latestCheckin = checkins.length > 0 ? checkins[0] : null;
    const initialWeight = oldestCheckin?.average_weight_kg || oldestCheckin?.weight_kg || client?.starting_weight || client?.initial_weight || '--';
    const currentWeight = latestCheckin?.average_weight_kg || latestCheckin?.weight_kg || client?.current_weight || client?.weight_kg || '--';
    const weightDiff = (initialWeight !== '--' && currentWeight !== '--')
      ? (Number(currentWeight) - Number(initialWeight)).toFixed(1)
      : null;

    const currentWaist = latestCheckin?.waist_circumference_cm || '--';
    const activeStage = PERIODIZATION_PHASES.find(p => p.id === currentPhase) || PERIODIZATION_PHASES[0];

    const lines = [
      `تقرير تطور المشترك: ${clientName} (${clientCode ? `#${clientCode}` : ''})`,
      `المرحلة الفسيولوجية: ${activeStage.label}`,
      `الوزن الأولي: ${initialWeight} كجم | الوزن الحالي: ${currentWeight} كجم${weightDiff !== null ? ` (الفرق: ${Number(weightDiff) > 0 ? `+${weightDiff}` : weightDiff} كجم)` : ''}`,
      currentWaist !== '--' ? `محيط الخصر الحالي: ${currentWaist} سم` : null,
      `أسابيع المتابعة المسجلة: ${checkins.length} أسابيع`,
      `صور التطور المسجلة: ${photos.length} صور`,
      client?.days_remaining !== undefined ? `الأيام المتبقية في الاشتراك: ${client.days_remaining} يوم` : null
    ].filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(lines);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 3000);
    } catch (err) {
      console.warn('Clipboard error:', err);
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

  const clientName = client?.full_name || client?.name || `متدرب #${cleanId}`;
  const clientCode = client?.client_code || cleanId;

  const fasting = extractClientFastingProfile(client);

  const daysRemaining = client?.days_remaining !== undefined ? client.days_remaining : client?.daysRemaining;
  const isFrozen = client?.subscription_status === 'FROZEN';
  const isExpired = client?.subscription_status === 'EXPIRED';

  const currentWeightDisplay = checkins[0]?.average_weight_kg || checkins[0]?.weight_kg || client?.current_weight || client?.weight_kg || null;

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
      <div dir="rtl" style={{ color: '#101828', fontFamily: 'Cairo, Tajawal, sans-serif' }}>
        
        {/* Main Content Container matching system boundaries */}
        <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Top Header Card in System Curved Aesthetics */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #EAECF0',
            borderRadius: '16px',
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            
            {/* Row 1: Identity & Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              
              {/* Right: Code, Name, Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  onClick={() => navigate('/customers')} 
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #D0D5DD',
                    borderRadius: '8px',
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#475467',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#101828'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#475467'; }}
                  title="الرجوع لقائمة المشتركين"
                >
                  <ChevronRight size={18} />
                </button>

                <ClientCodeBadge code={clientCode} item={client} size="md" />

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h1 style={{ margin: 0, fontSize: '16.5px', fontWeight: 900, color: '#101828' }}>{clientName}</h1>
                    <ClientPackageBadge item={client} size="sm" />
                    
                    {fasting?.primaryFastingBadge && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: fasting.primaryFastingBadge.color,
                        background: fasting.primaryFastingBadge.bg,
                        border: `1px solid ${fasting.primaryFastingBadge.border}`,
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}>
                        {fasting.primaryFastingBadge.label}
                      </span>
                    )}

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

                    {client?.injuries && client.injuries.length > 0 && (
                      <span style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '6px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldAlert size={12} />
                        <span>إصابة: {client.injuries.join('، ')}</span>
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                    سجل التطور الزمني والمفاضلة البصرية للمشترك (المسار والتكتل)
                  </div>
                </div>
              </div>

              {/* Left: Client Pager & Quick Navigator */}
              {clientsList.length > 1 && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#F8FAFC',
                  padding: '3px 6px',
                  borderRadius: '9px',
                  border: '1px solid #EAECF0'
                }}>
                  <button
                    type="button"
                    onClick={() => prevClient && navigate(`/coach/timeline/${prevClient.client_code || prevClient.id}`)}
                    disabled={!prevClient}
                    title={prevClient ? `المشترك السابق: ${prevClient.full_name || prevClient.name} (اختصار [)` : 'لا يوجد مشترك سابق'}
                    style={{
                      height: '28px',
                      padding: '0 10px',
                      borderRadius: '7px',
                      border: '1px solid #D0D5DD',
                      background: prevClient ? '#FFFFFF' : '#F1F5F9',
                      color: prevClient ? '#101828' : '#94A3B8',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      cursor: prevClient ? 'pointer' : 'not-allowed',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: prevClient ? '0 1px 2px rgba(16, 24, 40, 0.03)' : 'none',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <ChevronRight size={13} />
                    <span>السابق</span>
                  </button>

                  {currentIndex >= 0 && (
                    <span dir="ltr" style={{ fontSize: '11px', color: '#475467', fontWeight: 800, padding: '0 8px', fontFamily: 'JetBrains Mono, monospace' }}>
                      {currentIndex + 1} / {clientsList.length}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => nextClient && navigate(`/coach/timeline/${nextClient.client_code || nextClient.id}`)}
                    disabled={!nextClient}
                    title={nextClient ? `المشترك التالي: ${nextClient.full_name || nextClient.name} (اختصار ])` : 'لا يوجد مشترك تالي'}
                    style={{
                      height: '28px',
                      padding: '0 10px',
                      borderRadius: '7px',
                      border: '1px solid #D0D5DD',
                      background: nextClient ? '#FFFFFF' : '#F1F5F9',
                      color: nextClient ? '#101828' : '#94A3B8',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      cursor: nextClient ? 'pointer' : 'not-allowed',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: nextClient ? '0 1px 2px rgba(16, 24, 40, 0.03)' : 'none',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <span>التالي</span>
                    <ChevronLeft size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Row 2: Unified Executive Action Toolbar (5 Buttons) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              paddingTop: '8px',
              borderTop: '1px solid #F1F5F9'
            }}>
              {/* Copy Summary */}
              <button
                type="button"
                onClick={handleCopySummary}
                style={{
                  height: '35px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: copiedSummary ? '#ECFDF3' : '#FFFFFF',
                  border: copiedSummary ? '1px solid #A6F4C7' : '1px solid #D0D5DD',
                  color: copiedSummary ? '#027A48' : '#344054',
                  padding: '0 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => { if (!copiedSummary) e.currentTarget.style.background = '#F9FAFB'; }}
                onMouseLeave={(e) => { if (!copiedSummary) e.currentTarget.style.background = '#FFFFFF'; }}
                title="نسخ تقرير وملخص التطور الرقمي للحافظة لمشاركته مع المتدرب"
              >
                {copiedSummary ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                <span>{copiedSummary ? 'تم النسخ!' : 'نسخ ملخص التطور'}</span>
              </button>

              {/* Plan Editor */}
              <Link 
                to={`/coach/editor/${clientCode}`}
                style={{
                  height: '35px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#673DE6',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: '0 1px 3px rgba(103, 61, 230, 0.25)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#5025D1')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#673DE6')}
              >
                <Dumbbell size={14} />
                <span>محرر الخطة</span>
              </Link>

              {/* Checkin Review */}
              <Link 
                to={`/coach/checkin-review?code=${clientCode}`}
                style={{
                  height: '35px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#FFFFFF',
                  border: '1px solid #D0D5DD',
                  color: '#344054',
                  padding: '0 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#673DE6'; e.currentTarget.style.color = '#673DE6'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#D0D5DD'; e.currentTarget.style.color = '#344054'; }}
              >
                <Activity size={14} color="#673DE6" />
                <span>مراجعة الشيك إن</span>
              </Link>

              {/* Lab Biomarkers */}
              <button 
                type="button" 
                onClick={() => setIsLabModalOpen(true)}
                style={{
                  height: '35px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#FFFFFF',
                  border: '1px solid #D0D5DD',
                  color: '#344054',
                  padding: '0 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#0284C7'; e.currentTarget.style.color = '#0284C7'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#D0D5DD'; e.currentTarget.style.color = '#344054'; }}
                title="فحص المؤشرات الحيوية والتحاليل الطبية الشاملة"
              >
                <HeartPulse size={14} color="#0284C7" />
                <span>فحص التحاليل</span>
              </button>

              {/* WhatsApp */}
              {client?.phone_number && (
                <a 
                  href={generateWhatsAppUrl(client.phone_number)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    height: '35px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    color: '#166534',
                    padding: '0 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 800,
                    textDecoration: 'none',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#DCFCE7')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#F0FDF4')}
                >
                  <MessageCircle size={14} />
                  <span>واتساب</span>
                </a>
              )}
            </div>

          </div>

          {phaseMessage && (
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '10px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>
              {phaseMessage}
            </div>
          )}

          {/* Section 1: Overview & Periodization Stage */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px', alignItems: 'stretch' }}>
            
            {/* Identity & Vitals Summary */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #EAECF0',
              borderRadius: '12px',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '7px',
                  background: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0284C7'
                }}>
                  <BadgeCheck size={15} />
                </div>
                <strong style={{ fontSize: '13.5px', color: '#101828', fontWeight: 800 }}>بيانات الاشتراك والحالة البدنية</strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* Phone */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 12px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block', fontWeight: 700, marginBottom: '2px' }}>رقم الهاتف:</span>
                  <strong dir="ltr" style={{ fontSize: '12.5px', color: '#101828', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, display: 'block', textAlign: 'right' }}>
                    {client?.phone_number || '--'}
                  </strong>
                </div>

                {/* Subscription Days */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 12px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block', fontWeight: 700, marginBottom: '2px' }}>فترة الاشتراك:</span>
                  <strong style={{ fontSize: '12.5px', color: '#101828', fontWeight: 800 }}>
                    {daysRemaining !== undefined ? `${daysRemaining} يوم متبقي` : 'ساري'}
                  </strong>
                </div>

                {/* Current Weight */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 12px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block', fontWeight: 700, marginBottom: '2px' }}>الوزن الحالي المسجل:</span>
                  <strong style={{ fontSize: '13px', color: '#101828', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800 }}>
                    {currentWeightDisplay ? `${currentWeightDisplay} كجم` : '--'}
                  </strong>
                </div>

                {/* Checkin Weeks */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 12px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block', fontWeight: 700, marginBottom: '2px' }}>إجمالي التقييمات:</span>
                  <strong style={{ fontSize: '12.5px', color: '#16A34A', fontWeight: 800 }}>
                    {checkins.length} أسابيع متابعة
                  </strong>
                </div>
              </div>
            </div>

            {/* Periodization Stage Controller */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #EAECF0',
              borderRadius: '12px',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '7px',
                    background: '#FAF5FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#7C3AED'
                  }}>
                    <Activity size={15} />
                  </div>
                  <strong style={{ fontSize: '13.5px', color: '#101828', fontWeight: 800 }}>المرحلة التدريبية والفسيولوجية</strong>
                </div>
                {!isChangingPhase && (
                  <button 
                    type="button" 
                    onClick={() => setIsChangingPhase(true)}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #D0D5DD',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      color: '#344054',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.12s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#673DE6'; e.currentTarget.style.color = '#673DE6'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#D0D5DD'; e.currentTarget.style.color = '#344054'; }}
                  >
                    <ArrowRightLeft size={12} />
                    <span>تغيير المرحلة</span>
                  </button>
                )}
              </div>

              {isChangingPhase ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 600 }}>اختر المرحلة الجديدة لتكييف السعرات والتدريب تلقائياً:</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {PERIODIZATION_PHASES.map(phase => {
                      const IconComponent = phase.icon;
                      const isSelected = currentPhase === phase.id;
                      return (
                        <div 
                          key={phase.id}
                          onClick={() => handlePhaseChange(phase.id)}
                          style={{
                            padding: '9px 10px',
                            borderRadius: '8px',
                            border: isSelected ? `1.5px solid ${phase.color}` : '1px solid #E2E8F0',
                            background: isSelected ? phase.bg : '#F8FAFC',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px',
                            transition: 'all 0.12s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <IconComponent size={14} color={phase.color} />
                            <strong style={{ fontSize: '11.5px', color: '#101828' }}>{phase.label}</strong>
                          </div>
                          <span style={{ fontSize: '10px', color: '#64748B', lineHeight: 1.3 }}>{phase.desc}</span>
                        </div>
                      );
                    })}
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setIsChangingPhase(false)}
                    style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: '#64748B', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', padding: '2px 0' }}
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                (() => {
                  const activeStage = PERIODIZATION_PHASES.find(p => p.id === currentPhase) || PERIODIZATION_PHASES[0];
                  const ActiveIcon = activeStage.icon;
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{
                        background: activeStage.bg,
                        border: `1px solid ${activeStage.border || activeStage.color + '33'}`,
                        borderRadius: '10px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                            <ActiveIcon size={16} color={activeStage.color} />
                            <strong style={{ fontSize: '13px', color: activeStage.color, fontWeight: 800 }}>{activeStage.label}</strong>
                          </div>
                          <p style={{ margin: 0, fontSize: '11.5px', color: '#475467', lineHeight: 1.5, fontWeight: 600 }}>
                            {activeStage.desc}
                          </p>
                        </div>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1px solid ${activeStage.border || activeStage.color + '40'}`,
                          flexShrink: 0
                        }}>
                          <ActiveIcon size={18} color={activeStage.color} />
                        </div>
                      </div>

                      {/* Physiological Guidelines Micro-Grid (Fills space seamlessly) */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 10px' }}>
                          <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block', fontWeight: 700, marginBottom: '2px' }}>
                            بروتوكول التغذية المعتمد:
                          </span>
                          <span style={{ fontSize: '11px', color: '#101828', fontWeight: 700, lineHeight: 1.4 }}>
                            {activeStage.nutritionGuideline || 'عجز سعرات مقنن مع حماية البروتين'}
                          </span>
                        </div>

                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 10px' }}>
                          <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block', fontWeight: 700, marginBottom: '2px' }}>
                            توجيه الحمل التدريبي:
                          </span>
                          <span style={{ fontSize: '11px', color: '#101828', fontWeight: 700, lineHeight: 1.4 }}>
                            {activeStage.trainingGuideline || 'حمل عالي الكثافة وتثبيت الأوزان'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

          </div>

          {/* Section 2: Visual Transformation Studio (Before & After) */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #EAECF0',
            borderRadius: '12px',
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '7px',
                  background: '#F5F3FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#7C3AED'
                }}>
                  <Camera size={15} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 900, color: '#101828' }}>
                    استوديو المقارنة البصرية لصور التطور (Before & After)
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>مقارنة أسبوع البداية مع أحدث أسبوع مسجل بالزوايا الثلاث</span>
                </div>
              </div>
              <span style={{
                fontSize: '11px',
                color: photos.length > 0 ? '#166534' : '#475467',
                background: photos.length > 0 ? '#F0FDF4' : '#F1F5F9',
                border: photos.length > 0 ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                padding: '3px 10px',
                borderRadius: '6px',
                fontWeight: 800
              }}>
                {photos.length} صور مرفوعة
              </span>
            </div>

            {photos.length === 0 ? (
              <div style={{
                padding: '28px 16px',
                textAlign: 'center',
                background: '#F8FAFC',
                borderRadius: '10px',
                border: '1px dashed #CBD5E1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94A3B8'
                }}>
                  <Camera size={18} />
                </div>
                <strong style={{ fontSize: '12.5px', color: '#334155' }}>لم يتم رفع صور تقييم أسبوعية لهذا المشترك حتى الآن</strong>
                <span style={{ fontSize: '11px', color: '#64748B', maxWidth: '420px', lineHeight: 1.5 }}>
                  ستظهر صور التحول والمقارنة البصرية بالزوايا الثلاث (الأمامية، الجانبية، الخلفية) تلقائياً هنا فور قيام المشترك برفع أول تقييم مصور.
                </span>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                {[
                  { angle: 'FRONT', title: 'الأمامية (Front)' },
                  { angle: 'SIDE', title: 'الجانبية (Side)' },
                  { angle: 'BACK', title: 'الخلفية (Back)' }
                ].map(({ angle, title }) => {
                  const anglePhotos = photosByAngle[angle] || [];
                  const oldestPhoto = anglePhotos[anglePhotos.length - 1];
                  const latestPhoto = anglePhotos[0];

                  return (
                    <div key={angle} style={{ background: '#F8FAFC', border: '1px solid #EAECF0', borderRadius: '10px', padding: '10px' }}>
                      <strong style={{ display: 'block', fontSize: '12px', color: '#101828', fontWeight: 800, marginBottom: '8px', textAlign: 'center' }}>
                        {title}
                      </strong>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {/* Baseline */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                          <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700 }}>البداية (Baseline)</span>
                          {oldestPhoto ? (
                            <div 
                              style={{ width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', background: '#101828', position: 'relative', cursor: 'pointer' }}
                              onClick={() => setPreviewPhoto({ title: `${title} - البداية`, url: oldestPhoto.photo_url || oldestPhoto.url })}
                            >
                              <img src={oldestPhoto.photo_url || oldestPhoto.url} alt="البداية" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(15, 23, 42, 0.75)', color: '#FFFFFF', padding: '2px 4px', borderRadius: '6px', fontSize: '9px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <ZoomIn size={10} />
                              </div>
                            </div>
                          ) : (
                            <div style={{ width: '100%', height: '140px', borderRadius: '8px', border: '1px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '11px', background: '#FFFFFF' }}>
                              غير متوفرة
                            </div>
                          )}
                        </div>

                        {/* Latest */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                          <span style={{ fontSize: '10.5px', color: '#16A34A', fontWeight: 800 }}>الأحدث (Current)</span>
                          {latestPhoto ? (
                            <div 
                              style={{ width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', background: '#101828', position: 'relative', cursor: 'pointer', border: '1.5px solid #16A34A' }}
                              onClick={() => setPreviewPhoto({ title: `${title} - الأحدث`, url: latestPhoto.photo_url || latestPhoto.url })}
                            >
                              <img src={latestPhoto.photo_url || latestPhoto.url} alt="الأحدث" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(15, 23, 42, 0.75)', color: '#FFFFFF', padding: '2px 4px', borderRadius: '6px', fontSize: '9px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <ZoomIn size={10} />
                              </div>
                            </div>
                          ) : (
                            <div style={{ width: '100%', height: '140px', borderRadius: '8px', border: '1px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '11px', background: '#FFFFFF' }}>
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
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #EAECF0',
            borderRadius: '12px',
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '7px',
                  background: '#ECFDF5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#16A34A'
                }}>
                  <Calendar size={15} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 900, color: '#101828' }}>
                    سجل التقييمات والمتابعات الأسبوعية (Check-in Timeline)
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>تتبع الوزن ومحيط الخصر ومؤشرات الاستشفاء أسبوعاً بأسبوع</span>
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#475467', background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '3px 10px', borderRadius: '6px' }}>
                {checkins.length} تقييم مسجل
              </span>
            </div>

            {checkins.length === 0 ? (
              <div style={{
                padding: '28px 16px',
                textAlign: 'center',
                background: '#F8FAFC',
                borderRadius: '10px',
                border: '1px dashed #CBD5E1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px'
              }}>
                <FileText size={20} color="#94A3B8" />
                <strong style={{ fontSize: '12.5px', color: '#334155' }}>لا توجد متابعات أسبوعية مسجلة في قاعدة البيانات لهذا المشترك</strong>
                <span style={{ fontSize: '11px', color: '#64748B' }}>ستظهر هنا تفاصيل الأوزان والمقاسات والملاحظات فور قيام المشترك بتسجيل أول تقييم.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {checkins.map((item, index) => {
                  const nextItem = checkins[index + 1];
                  const itemWeight = item.average_weight_kg || item.weight_kg;
                  const nextWeight = nextItem ? (nextItem.average_weight_kg || nextItem.weight_kg) : null;
                  const weightDiff = (itemWeight && nextWeight)
                    ? (parseFloat(itemWeight) - parseFloat(nextWeight)).toFixed(1)
                    : null;

                  const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-CA') : 'الأسبوع الحالي';

                  const hasCoachNotes = Boolean(
                    item.coach_notes &&
                    typeof item.coach_notes === 'string' &&
                    item.coach_notes.trim().length > 0 &&
                    !/^(لا يوجد|none|null|-)$/i.test(item.coach_notes.trim())
                  );

                  return (
                    <div 
                      key={item.id || index}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #EAECF0',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        boxShadow: '0 1px 2px rgba(16, 24, 40, 0.02)'
                      }}
                    >
                      {/* Top Header of Card */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            background: '#F4F0FD',
                            color: '#673DE6',
                            border: '1px solid #EDE8FA',
                            padding: '2px 9px',
                            borderRadius: '6px'
                          }}>
                            الأسبوع {item.week_number || (checkins.length - index)}
                          </span>
                          <span dir="ltr" style={{ fontSize: '11.5px', color: '#64748B', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                            {dateStr}
                          </span>
                        </div>

                        {/* Weight Display Pill */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            background: '#F8FAFC',
                            border: '1px solid #D0D5DD',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            color: '#101828',
                            fontFamily: 'JetBrains Mono, monospace'
                          }}>
                            الوزن: {itemWeight || '--'} كجم
                          </span>
                          {weightDiff !== null && (
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: Number(weightDiff) < 0 ? '#ECFDF5' : (Number(weightDiff) > 0 ? '#FEF2F2' : '#F1F5F9'),
                              color: Number(weightDiff) < 0 ? '#16A34A' : (Number(weightDiff) > 0 ? '#DC2626' : '#64748B'),
                              border: Number(weightDiff) < 0 ? '1px solid #BBF7D0' : (Number(weightDiff) > 0 ? '1px solid #FECACA' : '1px solid #E2E8F0'),
                              fontFamily: 'JetBrains Mono, monospace'
                            }}>
                              {Number(weightDiff) > 0 ? `+${weightDiff}` : `${weightDiff}`} كجم
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Biofeedback Metrics Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', fontSize: '11.5px' }}>
                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px 10px', borderRadius: '7px' }}>
                          <span style={{ color: '#64748B', fontWeight: 700 }}>الخصر: </span>
                          <strong style={{ color: '#101828', fontFamily: 'JetBrains Mono, monospace' }}>
                            {item.waist_circumference_cm ? `${item.waist_circumference_cm} سم` : '--'}
                          </strong>
                        </div>
                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px 10px', borderRadius: '7px' }}>
                          <span style={{ color: '#64748B', fontWeight: 700 }}>التزام الدايت: </span>
                          <strong style={{ color: '#16A34A', fontFamily: 'JetBrains Mono, monospace' }}>
                            {item.nutrition_adherence_percent || 100}%
                          </strong>
                        </div>
                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px 10px', borderRadius: '7px' }}>
                          <span style={{ color: '#64748B', fontWeight: 700 }}>جلسات التمرين: </span>
                          <strong style={{ color: '#101828' }}>
                            {item.workouts_completed || 0} أيام
                          </strong>
                        </div>
                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px 10px', borderRadius: '7px' }}>
                          <span style={{ color: '#64748B', fontWeight: 700 }}>الطاقة / النوم: </span>
                          <strong style={{ color: '#0284C7', fontFamily: 'JetBrains Mono, monospace' }}>
                            {item.biofeedback?.energyLevel || 7}/10 • {item.biofeedback?.sleepQuality || 7}/10
                          </strong>
                        </div>
                      </div>

                      {/* Coach Notes (Only if exists) */}
                      {hasCoachNotes && (
                        <div style={{
                          background: '#EFF6FF',
                          border: '1px solid #BFDBFE',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          fontSize: '11.5px',
                          color: '#1E40AF',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '6px',
                          lineHeight: 1.5
                        }}>
                          <FileText size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                          <div>
                            <strong style={{ marginLeft: '4px' }}>توجيه الكابتن:</strong>
                            <span>{item.coach_notes}</span>
                          </div>
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
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #EAECF0' }}>
                <strong style={{ fontSize: '13px', color: '#101828' }}>{previewPhoto.title}</strong>
                <button 
                  type="button" 
                  onClick={() => setPreviewPhoto(null)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
                >
                  <X size={18} />
                </button>
              </div>
              <div style={{ padding: '12px', background: '#101828', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src={previewPhoto.url} 
                  alt={previewPhoto.title} 
                  style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: '8px' }} 
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
