import React, { useState, useRef, useEffect } from 'react';
import { 
  Maximize2, 
  X, 
  Award, 
  TrendingUp, 
  Camera, 
  Upload, 
  Download, 
  Share2, 
  RefreshCw, 
  Check, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { 
  CARD_FORMATS, 
  calculateTransformationStats, 
  renderTransformationCard, 
  downloadCanvasAsPng, 
  buildTransformationWhatsAppShare 
} from '../../utils/transformationCardGenerator';
import { optimizeImageFile } from '../../utils/imageOptimizer';
import { generateWhatsAppUrl } from '../../utils/whatsappRemindersEngine';

/**
 * مجسم تشريحي بمسارات فيكتور دقيقة يوضح تغير تكوين الجسم
 * يُعرض تلقائياً في حال عدم توفر صورة حقيقية مرفوعة
 */
function BodyProgressCanvas({ gender = 'MALE', angle = 'FRONT', progressStage = 'CURRENT', weight = 75, waist = 80 }) {
  const isMale = (gender || '').toUpperCase() === 'MALE';
  const isBefore = progressStage === 'BEFORE';
  
  const waistWidth = isBefore ? 64 : 54;
  const chestWidth = isBefore ? 78 : 82;
  const shoulderWidth = isBefore ? 86 : 92;
  const armThick = isBefore ? 18 : 20;
  const hipWidth = isBefore ? 68 : 60;
  const legThick = isBefore ? 24 : 22;

  const primaryColor = isBefore ? '#64748B' : '#0F172A';
  const accentColor = isBefore ? '#94A3B8' : (isMale ? '#0284C7' : '#E11D48');
  const bgGradStart = isBefore ? '#F8FAFC' : '#F0F9FF';
  const bgGradEnd = isBefore ? '#EDF2F7' : '#E0F2FE';

  return (
    <svg viewBox="0 0 200 320" width="100%" height="100%" style={{ maxHeight: '270px', filter: 'drop-shadow(0 4px 10px rgba(15,23,42,0.05))' }}>
      <defs>
        <linearGradient id={`bodyGrad_${progressStage}_${angle}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={bgGradStart} />
          <stop offset="100%" stopColor={bgGradEnd} />
        </linearGradient>
        <linearGradient id={`muscleGrad_${progressStage}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.8" />
          <stop offset="100%" stopColor={primaryColor} stopOpacity="0.9" />
        </linearGradient>
      </defs>

      <ellipse cx="100" cy="305" rx="55" ry="8" fill="rgba(15, 23, 42, 0.08)" />

      {angle === 'FRONT' && (
        <g id="front_body" transform="translate(100, 20)">
          <circle cx="0" cy="20" r="16" fill={primaryColor} />
          <rect x="-6" y="34" width="12" height="12" fill={primaryColor} rx="2" />
          <path d={`M -${shoulderWidth/2} 48 Q 0 40 ${shoulderWidth/2} 48 L ${chestWidth/2} 80 L -${chestWidth/2} 80 Z`} fill={primaryColor} />
          <path d={`M -${chestWidth/2} 80 Q -${waistWidth/2} 115 -${hipWidth/2} 150 L ${hipWidth/2} 150 Q ${waistWidth/2} 115 ${chestWidth/2} 80 Z`} fill={primaryColor} />
          {!isBefore && (
            <g stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.4">
              <path d="M -22 68 Q 0 74 0 82 M 22 68 Q 0 74 0 82" fill="none" />
              <line x1="0" y1="90" x2="0" y2="135" />
              <line x1="-12" y1="102" x2="12" y2="102" />
              <line x1="-10" y1="118" x2="10" y2="118" />
              <line x1="-8" y1="132" x2="8" y2="132" />
            </g>
          )}
          <path d={`M -${shoulderWidth/2} 50 Q -${shoulderWidth/2 + 16} 95 -${shoulderWidth/2 + 8} 145`} stroke={primaryColor} strokeWidth={armThick} strokeLinecap="round" fill="none" />
          <path d={`M ${shoulderWidth/2} 50 Q ${shoulderWidth/2 + 16} 95 ${shoulderWidth/2 + 8} 145`} stroke={primaryColor} strokeWidth={armThick} strokeLinecap="round" fill="none" />
          <path d={`M -${hipWidth/2 - 6} 150 Q -24 215 -18 280`} stroke={primaryColor} strokeWidth={legThick} strokeLinecap="round" fill="none" />
          <path d={`M ${hipWidth/2 - 6} 150 Q 24 215 18 280`} stroke={primaryColor} strokeWidth={legThick} strokeLinecap="round" fill="none" />
        </g>
      )}

      {angle === 'SIDE' && (
        <g id="side_body" transform="translate(100, 20)">
          <circle cx="0" cy="20" r="16" fill={primaryColor} />
          <path d={`M -12 44 Q -${isBefore ? 24 : 16} 100 -12 150 L 14 150 Q 18 100 12 44 Z`} fill={primaryColor} />
          <path d="M 2 50 Q 12 95 6 145" stroke={primaryColor} strokeWidth={armThick} strokeLinecap="round" fill="none" />
          <path d="M 0 150 Q 8 215 2 280" stroke={primaryColor} strokeWidth={legThick * 1.1} strokeLinecap="round" fill="none" />
        </g>
      )}

      {angle === 'BACK' && (
        <g id="back_body" transform="translate(100, 20)">
          <circle cx="0" cy="20" r="16" fill={primaryColor} />
          <path d={`M -${shoulderWidth/2} 48 Q 0 42 ${shoulderWidth/2} 48 L ${chestWidth/2} 80 L -${chestWidth/2} 80 Z`} fill={primaryColor} />
          <path d={`M -${chestWidth/2} 80 Q -${waistWidth/2} 115 -${hipWidth/2} 150 L ${hipWidth/2} 150 Q ${waistWidth/2} 115 ${chestWidth/2} 80 Z`} fill={primaryColor} />
          {!isBefore && (
            <g stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.4">
              <path d="M -26 62 Q 0 74 26 62" fill="none" />
              <path d="M 0 54 L 0 140" fill="none" />
            </g>
          )}
          <path d={`M -${shoulderWidth/2} 50 Q -${shoulderWidth/2 + 14} 95 -${shoulderWidth/2 + 6} 145`} stroke={primaryColor} strokeWidth={armThick} strokeLinecap="round" fill="none" />
          <path d={`M ${shoulderWidth/2} 50 Q ${shoulderWidth/2 + 14} 95 ${shoulderWidth/2 + 6} 145`} stroke={primaryColor} strokeWidth={armThick} strokeLinecap="round" fill="none" />
          <path d={`M -${hipWidth/2 - 6} 150 Q -24 215 -18 280`} stroke={primaryColor} strokeWidth={legThick} strokeLinecap="round" fill="none" />
          <path d={`M ${hipWidth/2 - 6} 150 Q 24 215 18 280`} stroke={primaryColor} strokeWidth={legThick} strokeLinecap="round" fill="none" />
        </g>
      )}

      <rect x="25" y="290" width="150" height="22" rx="5" fill="#FFFFFF" stroke="#E2E8F0" />
      <text x="100" y="305" textAnchor="middle" fill="#0F172A" fontSize="10.5" fontWeight="800" fontFamily="Cairo, sans-serif">
        {progressStage === 'BEFORE' ? 'صورة الأساس (قبل)' : 'التقييم الحالي (بعد)'}
      </text>
    </svg>
  );
}

export default function InteractivePhotoComparisonStudio({
  history = [],
  activeCheckin = {},
  client = {},
  onClose = null
}) {
  // 1. الحالات الأساسية
  const [angle, setAngle] = useState('FRONT'); // 'FRONT' | 'SIDE' | 'BACK'
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 2. صور مخصصة مرفوعة محلياً داخل الاستوديو
  const [uploadedPhotos, setUploadedPhotos] = useState({
    before: { FRONT: null, SIDE: null, BACK: null },
    after: { FRONT: null, SIDE: null, BACK: null }
  });

  // 3. حالة نافذة توليد كارت التسويق
  const [showMarketingModal, setShowMarketingModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('PORTRAIT_4_5');
  const [hideClientName, setHideClientName] = useState(true);
  const [customCardTitle, setCustomCardTitle] = useState('تحول رياضي معتمد');
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const canvasRef = useRef(null);

  // استخراج قائمة الأسابيع المتوفرة
  const availableWeeks = history && history.length > 0 ? history : [
    { 
      week: 0, 
      weight: client.start_weight || client.weight_kg || 78.5, 
      waist: 88, 
      date: 'نقطة البداية',
      photos: { front: null, side: null, back: null }
    },
    { 
      week: activeCheckin.week_number || 4, 
      weight: activeCheckin.metrics?.current_weight || 74.0, 
      waist: activeCheckin.metrics?.waist_current || 82, 
      date: activeCheckin.submission_date || 'التقييم الحالي',
      photos: activeCheckin.photos || { front: null, side: null, back: null }
    }
  ];

  const [beforeWeekIdx, setBeforeWeekIdx] = useState(0);
  const [afterWeekIdx, setAfterWeekIdx] = useState(Math.max(0, availableWeeks.length - 1));

  const beforeEntry = availableWeeks[beforeWeekIdx] || availableWeeks[0];
  const afterEntry = availableWeeks[afterWeekIdx] || availableWeeks[availableWeeks.length - 1];

  // استخراج رابط الصورة الفعلي لكل مرحلة وزاوية
  const getPhotoFor = (stage, selectedAngle) => {
    const angleKey = selectedAngle.toLowerCase();
    const entry = stage === 'BEFORE' ? beforeEntry : afterEntry;
    const uploaded = stage === 'BEFORE' ? uploadedPhotos.before[selectedAngle] : uploadedPhotos.after[selectedAngle];
    if (uploaded) return uploaded;

    if (!entry) return null;

    // 1. فحص مصفوفة الصور إن كانت مخزنة في السجل
    if (Array.isArray(entry.photos)) {
      const match = entry.photos.find(p => String(p.pose || '').toUpperCase() === selectedAngle);
      if (match) return match.photo_url || match.dataUrl || match.url;
    }

    // 2. فحص مصفوفة صور التقييم الحالي
    if (stage !== 'BEFORE' && Array.isArray(activeCheckin?.photos)) {
      const match = activeCheckin.photos.find(p => String(p.pose || '').toUpperCase() === selectedAngle);
      if (match) return match.photo_url || match.dataUrl || match.url;
    }

    // 3. فحص كائن الصور الفردي
    if (entry.photos && typeof entry.photos === 'object') {
      const photoVal = entry.photos[angleKey] || entry.photos[selectedAngle];
      if (photoVal) return typeof photoVal === 'string' ? photoVal : (photoVal.photo_url || photoVal.dataUrl);
    }

    // 4. الخصائص المباشرة
    return entry[`${angleKey}_url`] || entry[`${angleKey}_photo`] || null;
  };

  const beforePhoto = getPhotoFor('BEFORE', angle);
  const afterPhoto = getPhotoFor('CURRENT', angle);

  // إحصائيات التحول
  const stats = calculateTransformationStats({
    beforeWeight: beforeEntry.weight,
    afterWeight: afterEntry.weight,
    beforeWaist: beforeEntry.waist || 85,
    afterWaist: afterEntry.waist || 80,
    beforeWeek: beforeEntry.week,
    afterWeek: afterEntry.week,
    adherence: afterEntry.adherence || 94
  });

  // معالجة رفع صورة محلياً (مضغوطة بدقة فائقة)
  const handlePhotoUpload = async (stage, selectedAngle, e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const optimized = await optimizeImageFile(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.82 });
        if (optimized) {
          setUploadedPhotos(prev => ({
            ...prev,
            [stage]: {
              ...prev[stage],
              [selectedAngle]: optimized
            }
          }));
        }
      } catch (err) {
        console.warn('Error optimizing photo for comparison:', err);
      }
    }
  };

  // إعادة رسم كارت التسويق عند فتح النافذة أو تغيير الإعدادات
  useEffect(() => {
    if (showMarketingModal && canvasRef.current) {
      setIsGeneratingCard(true);
      const format = CARD_FORMATS[selectedFormat] || CARD_FORMATS.PORTRAIT_4_5;
      
      renderTransformationCard(canvasRef.current, {
        format,
        client: {
          name: client.full_name || client.name || 'المشترك المعتمد',
          code: client.client_code || client.code || '101'
        },
        beforeData: {
          week: beforeEntry.week,
          weight: beforeEntry.weight,
          waist: beforeEntry.waist || 85,
          date: beforeEntry.date,
          photoUrl: beforePhoto
        },
        afterData: {
          week: afterEntry.week,
          weight: afterEntry.weight,
          waist: afterEntry.waist || 80,
          date: afterEntry.date,
          photoUrl: afterPhoto
        },
        privacy: {
          blurFace: false,
          hideClientName,
          customTitle: customCardTitle
        },
        stats
      }).then(() => {
        setIsGeneratingCard(false);
      });
    }
  }, [showMarketingModal, selectedFormat, hideClientName, customCardTitle, angle, beforeWeekIdx, afterWeekIdx, uploadedPhotos]);

  // تنزيل كارت التحول
  const handleDownloadCard = () => {
    if (!canvasRef.current) return;
    const cleanCode = client.client_code || client.code || '101';
    downloadCanvasAsPng(canvasRef.current, `z_transformation_${cleanCode}_w${afterEntry.week}.png`);
  };

  // مشاركة عبر واتساب
  const handleWhatsAppShare = () => {
    const msg = buildTransformationWhatsAppShare({
      client: {
        code: client.client_code || client.code || '101',
        name: client.full_name || client.name || 'المشترك'
      },
      stats,
      beforeData: beforeEntry,
      afterData: afterEntry
    });
    const url = generateWhatsAppUrl(client.phone_number, msg);
    window.open(url, '_blank');
  };

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0' }} dir="rtl">
      
      {/* 1. ترويسة الاستوديو وأدوات التحكم الرئيسية */}
      <div style={{ 
        padding: '10px 14px', 
        background: '#F8FAFC', 
        borderBottom: '1px solid #E2E8F0', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '10px' 
      }}>
        {/* الزاوية ونمط العرض */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* مبدل زاوية التصوير */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>الزاوية:</span>
            <div style={{ display: 'inline-flex', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '2px' }}>
              {[
                { id: 'FRONT', label: 'أمامي' },
                { id: 'SIDE', label: 'جانبي' },
                { id: 'BACK', label: 'خلفي' }
              ].map(a => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAngle(a.id)}
                  style={{
                    border: 'none',
                    background: angle === a.id ? '#0F172A' : 'transparent',
                    color: angle === a.id ? '#FFFFFF' : '#64748B',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.12s ease'
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* محددات الأسابيع وزر توليد الكارت */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          {/* محدد أسبوع قبل */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
            <span style={{ color: '#64748B', fontWeight: 600 }}>من:</span>
            <select
              value={beforeWeekIdx}
              onChange={(e) => setBeforeWeekIdx(Number(e.target.value))}
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 6px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#0F172A',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {availableWeeks.map((w, idx) => (
                <option key={idx} value={idx}>
                  الأسبوع {w.week} ({w.weight} كجم)
                </option>
              ))}
            </select>
          </div>

          <span style={{ color: '#94A3B8', fontWeight: 800 }}>←</span>

          {/* محدد أسبوع بعد */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
            <span style={{ color: '#64748B', fontWeight: 600 }}>إلى:</span>
            <select
              value={afterWeekIdx}
              onChange={(e) => setAfterWeekIdx(Number(e.target.value))}
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 6px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#0F172A',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {availableWeeks.map((w, idx) => (
                <option key={idx} value={idx}>
                  الأسبوع {w.week} ({w.weight} كجم)
                </option>
              ))}
            </select>
          </div>

          {/* زر توليد كارت التحول التسويقي */}
          <button
            type="button"
            onClick={() => setShowMarketingModal(true)}
            style={{
              padding: '4px 12px',
              borderRadius: '8px',
              border: 'none',
              background: '#0F172A',
              color: '#C4952D',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 5px rgba(15, 23, 42, 0.2)'
            }}
          >
            <Award size={13} color="#C4952D" />
            <span>كارت التحول التسويقي</span>
          </button>

          {/* زر التكبير لملء الشاشة */}
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            title="تكبير شاشة المقارنة"
            style={{
              padding: '5px 8px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#0F172A',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Maximize2 size={13} />
          </button>

        </div>
      </div>

      {/* 2. منطقة المقارنة البصرية (عرض متجاور هادئ ومنظم) */}
      <div style={{ position: 'relative', background: '#FAFAFA', padding: '16px', minHeight: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', width: '100%', maxWidth: '720px' }}>
          
          {/* كارت قبل (BEFORE) */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px', marginBottom: '8px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#64748B' }}>
                الأسبوع {beforeEntry.week} (البداية)
              </span>
              <span style={{ fontSize: '10.5px', color: '#94A3B8' }}>{beforeEntry.date}</span>
            </div>

            {/* الصورة أو المجسم */}
            <div style={{ height: '240px', width: '100%', position: 'relative', overflow: 'hidden', borderRadius: '6px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {beforePhoto ? (
                <img 
                  src={beforePhoto} 
                  alt="صورة قبل" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <BodyProgressCanvas 
                  gender={client.gender} 
                  angle={angle} 
                  progressStage="BEFORE" 
                  weight={beforeEntry.weight} 
                  waist={beforeEntry.waist || 85} 
                />
              )}

              {/* زر رفع أو استبدال الصورة */}
              <label 
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#FFFFFF',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="رفع صورة حقيقية لهذه المرحلة"
              >
                <Camera size={11} />
                <span>{beforePhoto ? 'تغيير' : 'رفع صورة'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={(e) => handlePhotoUpload('before', angle, e)} 
                />
              </label>
            </div>

            {/* أرقام القياسات */}
            <div style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '6px 8px', display: 'flex', justifyContent: 'space-around', fontSize: '11px', marginTop: '8px' }}>
              <span>الوزن: <strong style={{ color: '#0F172A', fontFamily: 'JetBrains Mono' }}>{beforeEntry.weight} كجم</strong></span>
              {beforeEntry.waist && <span>الخصر: <strong style={{ color: '#0F172A', fontFamily: 'JetBrains Mono' }}>{beforeEntry.waist} سم</strong></span>}
            </div>
          </div>

          {/* كارت بعد (AFTER) */}
          <div style={{ background: '#FFFFFF', border: '1.5px solid #CBD5E1', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px', marginBottom: '8px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A' }}>
                الأسبوع {afterEntry.week} (التقييم الحالي)
              </span>
              <span style={{ fontSize: '10.5px', color: '#64748B' }}>{afterEntry.date}</span>
            </div>

            {/* الصورة أو المجسم */}
            <div style={{ height: '240px', width: '100%', position: 'relative', overflow: 'hidden', borderRadius: '6px', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {afterPhoto ? (
                <img 
                  src={afterPhoto} 
                  alt="صورة بعد" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <BodyProgressCanvas 
                  gender={client.gender} 
                  angle={angle} 
                  progressStage="CURRENT" 
                  weight={afterEntry.weight} 
                  waist={afterEntry.waist || 80} 
                />
              )}

              {/* زر رفع أو استبدال الصورة */}
              <label 
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#FFFFFF',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="رفع صورة حقيقية لهذه المرحلة"
              >
                <Camera size={11} />
                <span>{afterPhoto ? 'تغيير' : 'رفع صورة'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={(e) => handlePhotoUpload('after', angle, e)} 
                />
              </label>
            </div>

            {/* أرقام القياسات */}
            <div style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '6px 8px', display: 'flex', justifyContent: 'space-around', fontSize: '11px', marginTop: '8px' }}>
              <span>الوزن: <strong style={{ color: '#0F172A', fontFamily: 'JetBrains Mono' }}>{afterEntry.weight} كجم</strong></span>
              {afterEntry.waist && <span>الخصر: <strong style={{ color: '#0F172A', fontFamily: 'JetBrains Mono' }}>{afterEntry.waist} سم</strong></span>}
            </div>
          </div>

        </div>
      </div>

      {/* 3. شريط إحصائيات التحول الدقيقة */}
      <div style={{ padding: '10px 14px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TrendingUp size={14} color="#0F172A" />
          <strong style={{ color: '#0F172A' }}>صافي نتائج التحول والقياسات:</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px' }}>
          <span>
            فارق الوزن: <strong style={{ color: stats.weightDiff < 0 ? '#16A34A' : (stats.weightDiff === 0 ? '#0284C7' : '#DC2626'), fontFamily: 'JetBrains Mono' }}>
              {stats.weightDiff > 0 ? `+${stats.weightDiff}` : stats.weightDiff} كجم
            </strong>
          </span>
          <span>
            تغير الخصر: <strong style={{ color: stats.waistDiff <= 0 ? '#16A34A' : '#DC2626', fontFamily: 'JetBrains Mono' }}>
              {stats.waistDiff > 0 ? `+${stats.waistDiff}` : stats.waistDiff} سم
            </strong>
          </span>
          <span style={{ color: '#64748B' }}>
            المدة: <strong style={{ color: '#0F172A' }}>{stats.weeksCount} أسابيع</strong>
          </span>
          <span style={{ color: '#64748B' }}>
            الالتزام: <strong style={{ color: '#C4952D' }}>{stats.adherenceRate}%</strong>
          </span>
        </div>
      </div>

      {/* =========================================================================
          نافذة توليد كارت التحول التسويقي (Marketing Transformation Card Modal)
          ========================================================================= */}
      {showMarketingModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setShowMarketingModal(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              width: '940px',
              maxWidth: '96vw',
              maxHeight: '94vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
              border: '1px solid #CBD5E1'
            }}
          >
            {/* ترويسة النافذة */}
            <div style={{ padding: '12px 18px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={16} color="#C4952D" />
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                  توليد كارت التحول التسويقي الفاخر (Z Marketing Studio)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMarketingModal(false)}
                style={{
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  borderRadius: '6px',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B'
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* محتوى النافذة */}
            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', background: '#F1F5F9' }}>
              
              {/* المعاينة الحية للكارت */}
              <div style={{ background: '#0F172A', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '440px', position: 'relative' }}>
                <canvas 
                  ref={canvasRef} 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '480px', 
                    borderRadius: '8px', 
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(196, 149, 45, 0.3)'
                  }} 
                />
                {isGeneratingCard && (
                  <div style={{ position: 'absolute', background: 'rgba(15,23,42,0.7)', color: '#FFFFFF', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                    جاري إعداد الكارت عالي الدقة...
                  </div>
                )}
              </div>

              {/* لوحة خيارات التخصيص */}
              <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* 1. اختيار مقاس الكارت */}
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                    مقاس الكارت (Aspect Ratio):
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                    {Object.values(CARD_FORMATS).map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedFormat(f.id)}
                        style={{
                          textAlign: 'right',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: selectedFormat === f.id ? '1.5px solid #0F172A' : '1px solid #E2E8F0',
                          background: selectedFormat === f.id ? '#F8FAFC' : '#FFFFFF',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '11.5px', color: '#0F172A', display: 'block' }}>{f.name}</strong>
                          <span style={{ fontSize: '10px', color: '#64748B' }}>{f.recommendedFor}</span>
                        </div>
                        {selectedFormat === f.id && <Check size={14} color="#C4952D" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. عنوان الكارت */}
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: '4px' }}>
                    عنوان التحول:
                  </label>
                  <input 
                    type="text"
                    value={customCardTitle}
                    onChange={(e) => setCustomCardTitle(e.target.value)}
                    placeholder="مثال: تحول رياضي استثنائي"
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '11.5px',
                      color: '#0F172A',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* 3. خيارات الخصوصية */}
                <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569' }}>إعدادات الخصوصية وحماية الهوية:</span>
                  

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      checked={hideClientName}
                      onChange={(e) => setHideClientName(e.target.checked)}
                      style={{ accentColor: '#C4952D', cursor: 'pointer' }}
                    />
                    <span>إخفاء الاسم الكامل (إظهار كود المشترك فقط)</span>
                  </label>
                </div>

                {/* 4. أزرار الإجراءات */}
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleDownloadCard}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#0F172A',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 6px rgba(15,23,42,0.25)'
                    }}
                  >
                    <Download size={14} color="#C4952D" />
                    <span>تحميل الكارت بصيغة PNG عالية الدقة</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #86EFAC',
                      background: '#F0FDF4',
                      color: '#16A34A',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Share2 size={13} />
                    <span>مشاركة البيانات عبر واتساب</span>
                  </button>
                </div>

              </div>

            </div>

            {/* فوتر النافذة */}
            <div style={{ padding: '10px 18px', background: '#FFFFFF', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px' }}>
              <span style={{ color: '#64748B' }}>
                الكارت يوثق نزول <strong>{Math.abs(stats.weightDiff)} كجم</strong> خلال <strong>{stats.weeksCount} أسابيع</strong> بنسبة التزام <strong>{stats.adherenceRate}%</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowMarketingModal(false)}
                style={{
                  padding: '5px 14px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          نافذة ملء الشاشة عالية الدقة (Fullscreen Modal)
          ========================================================================= */}
      {isFullscreen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(8px)',
            zIndex: 1500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setIsFullscreen(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              width: '920px',
              maxWidth: '96vw',
              maxHeight: '92vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid #CBD5E1'
            }}
          >
            <div style={{ padding: '12px 18px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Maximize2 size={16} color="#0F172A" />
                <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>
                  استوديو المقارنة عالي الدقة: {client.full_name || client.name} (#{client.client_code || client.code})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                style={{ border: '1px solid #E2E8F0', background: '#FFFFFF', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#F1F5F9', minHeight: '420px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '100%', maxWidth: '800px' }}>
                
                {/* كارت قبل في ملء الشاشة */}
                <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', display: 'block', marginBottom: '8px' }}>
                    الأسبوع {beforeEntry.week} (البداية) • {beforeEntry.weight} كجم
                  </span>
                  <div style={{ height: '320px', overflow: 'hidden', borderRadius: '6px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {beforePhoto ? (
                      <img src={beforePhoto} alt="قبل" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <BodyProgressCanvas gender={client.gender} angle={angle} progressStage="BEFORE" weight={beforeEntry.weight} waist={beforeEntry.waist} />
                    )}
                  </div>
                </div>

                {/* كارت بعد في ملء الشاشة */}
                <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1.5px solid #0F172A', textAlign: 'center', boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: '8px' }}>
                    الأسبوع {afterEntry.week} (التقييم الحالي) • {afterEntry.weight} كجم
                  </span>
                  <div style={{ height: '320px', overflow: 'hidden', borderRadius: '6px', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {afterPhoto ? (
                      <img src={afterPhoto} alt="بعد" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <BodyProgressCanvas gender={client.gender} angle={angle} progressStage="CURRENT" weight={afterEntry.weight} waist={afterEntry.waist} />
                    )}
                  </div>
                </div>

              </div>
            </div>

            <div style={{ padding: '12px 18px', background: '#FFFFFF', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <span style={{ color: '#64748B' }}>
                مقارنة بين الأسبوع <strong>{beforeEntry.week}</strong> والأسبوع <strong>{afterEntry.week}</strong> ({stats.weeksCount} أسابيع)
              </span>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: '#0F172A', color: '#FFFFFF', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                إغلاق الاستوديو
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
