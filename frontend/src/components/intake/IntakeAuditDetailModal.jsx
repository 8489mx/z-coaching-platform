import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  HeartPulse, 
  Dumbbell, 
  Activity, 
  Apple, 
  Camera, 
  MessageCircle, 
  Sparkles, 
  User, 
  ZoomIn, 
  ShieldAlert, 
  Utensils, 
  Flame, 
  Scale, 
  Check,
  Ban,
  ShieldCheck
} from 'lucide-react';

// Helpers to translate codes to human-readable Arabic
const GOALS_MAP = {
  FAT_LOSS: 'حرق وخسارة الدهون',
  MUSCLE_GAIN: 'زيادة الكتلة العضلية (تضخيم)',
  BODY_RECOMPOSITION: 'إعادة تشكيل الجسم (Recomp)',
  WEIGHT_MAINTENANCE: 'تثبيت الوزن الحالي',
  GENERAL_HEALTH: 'لياقة وصحة عامة',
  PERFORMANCE: 'زيادة الأداء الرياضي والقوة'
};

const ACTIVITY_MAP = {
  SEDENTARY: 'خامل (مكتبي)',
  LIGHT: 'خفيف (حركة عادية)',
  MODERATE: 'متوسط (حركة يومية)',
  HIGH: 'عالي (عمل مجهد)'
};

const EXPERIENCE_MAP = {
  BEGINNER: 'مبتدئ (< 6 شهور)',
  INTERMEDIATE: 'متوسط (6ش - سنتين)',
  ADVANCED: 'متقدم (+ سنتين)',
  NEVER_TRAINED: 'لم يتدرب من قبل'
};

const EXCLUDED_FOODS_LABELS = {
  EGGS: 'البيض',
  EGG: 'البيض',
  DAIRY: 'الألبان والأجبان',
  MILK: 'الحليب ومشتقاته',
  FISH_SEAFOOD: 'الأسماك والبحريات',
  FISH: 'الأسماك',
  SEAFOOD: 'المأكولات البحرية',
  PEANUTS_NUTS: 'المكسرات والفول السوداني',
  PEANUTS: 'الفول السوداني',
  NUTS: 'المكسرات',
  WHEAT_GLUTEN: 'الجلوتين والقمح',
  GLUTEN_WHEAT: 'الجلوتين والقمح',
  GLUTEN: 'الجلوتين',
  WHEAT: 'القمح',
  OATS: 'الشوفان',
  OAT: 'الشوفان',
  RED_MEAT: 'اللحوم الحمراء',
  MEAT: 'اللحوم الحمراء',
  BEEF: 'اللحوم الحمراء',
  LEGUMES: 'البقوليات',
  LEGUME: 'البقوليات',
  EGGPLANT_COOKED_VEG: 'الباذنجان',
  EGGPLANT: 'الباذنجان'
};

const DIGESTIVE_LABELS = {
  IBS: 'القولون العصبي (IBS)',
  GERD: 'ارتجاع المريء وحموضة',
  ACID_REFLUX: 'ارتجاع المريء',
  LACTOSE: 'حساسية اللاكتوز',
  NONE: 'سليم تماماً'
};

const INJURIES_LABELS = {
  LOWER_BACK: 'أسفل الظهر والقطنية',
  SPINE: 'العمود الفقري',
  LUMBAR: 'الفقرات القطنية',
  SHOULDER: 'مفصل الكتف الدوار',
  ROTATOR_CUFF: 'الكتف الدوار',
  KNEE: 'الركبة والغضاريف',
  NECK: 'الرقبة والفقرات العنقية',
  CERVICAL_SPINE: 'الفقرات العنقية',
  ELBOW_WRIST: 'الكوع والرسغ',
  WRIST: 'رسغ اليد',
  ELBOW: 'الكوع',
  NONE: 'لا توجد إصابات'
};

const FOCUS_MUSCLES_LABELS = {
  CHEST: 'الصدر',
  BACK: 'الظهر',
  SHOULDERS: 'الأكتاف',
  SHOULDER: 'الأكتاف',
  ARMS: 'الذراعين',
  LEGS_GLUTES: 'الأرجل والمؤخرة',
  LEGS: 'الأرجل',
  GLUTES: 'المؤخرة',
  ABS_CORE: 'البطن والكور',
  ABS: 'البطن'
};

const CONDITIONS_LABELS = {
  DIABETES: 'السكري',
  TYPE_2_DIABETES: 'السكري (النوع 2)',
  HYPERTENSION: 'ضغط الدم',
  HEART_CONDITION: 'أمراض القلب',
  CARDIOVASCULAR_DISEASE: 'الأوعية الدموية',
  THYROID_CONDITION: 'الغدة الدرقية',
  ANEMIA: 'الأنيميا',
  ASTHMA_OR_RESPIRATORY_CONDITION: 'الربو والتنفس',
  PCOS: 'تكيس المبايض',
  NONE: 'لا توجد'
};

export default function IntakeAuditDetailModal({
  submission,
  onClose,
  onGenerateDraft,
  generatingId
}) {
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (!submission) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        e.preventDefault();
        e.stopPropagation();
        if (previewImage) {
          setPreviewImage(null);
        } else if (onClose) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [submission, previewImage, onClose]);

  if (!submission) return null;

  const answers = submission.answers || {};
  const personal = answers.personal || {};
  const goals = answers.goals || {};
  const body = answers.body || {};
  const lifestyle = answers.lifestyle || {};
  const medical = answers.medical || {};
  const nutrition = answers.nutrition || {};
  const training = answers.training || {};
  const cardio = answers.cardio || {};
  const photos = body.photos || {};

  const clientName = submission.user?.full_name || `${personal.firstName || ''} ${personal.lastName || ''}`.trim() || 'متدرب جديد';
  const clientCode = String(submission.user?.client_code || submission.id || '1').replace(/^client[-_]?/i, '');
  const clientPhone = submission.user?.phone_number || personal.phone || '';

  // Calculations
  const heightCm = Number(body.heightCm) || 170;
  const heightM = heightCm / 100;
  const weightKg = Number(body.weightKg) || 70;
  const bmi = (weightKg / (heightM * heightM)).toFixed(1);

  const ageNum = Number(personal.age) || (personal.dateOfBirth ? (new Date().getFullYear() - new Date(personal.dateOfBirth).getFullYear()) : 30);
  const sexIsFemale = personal.sex === 'FEMALE';
  const bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * ageNum + (sexIsFemale ? -161 : 5));
  const activityMultipliers = { SEDENTARY: 1.2, LIGHT: 1.375, MODERATE: 1.55, HIGH: 1.725 };
  const tdee = Math.round(bmr * (activityMultipliers[lifestyle.dailyActivity] || 1.375));

  let bmiBadge = { label: 'طبيعي', color: '#059669', bg: '#ECFDF5' };
  if (bmi < 18.5) bmiBadge = { label: 'نقص وزن', color: '#D97706', bg: '#FEF3C7' };
  else if (bmi >= 25 && bmi < 30) bmiBadge = { label: 'وزن زائد', color: '#D97706', bg: '#FEF3C7' };
  else if (bmi >= 30) bmiBadge = { label: 'سمنة', color: '#E11D48', bg: '#FFF1F2' };

  const getCode = (item) => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    if (typeof item === 'object') {
      return item.code || item.conditionCode || item.food || item.substance || item.id || item.name || '';
    }
    return String(item);
  };

  const excludedFoodsList = (nutrition.excludedFoodsList || []).map(getCode).filter(f => f && f !== 'NONE');
  const digestiveIssuesList = (nutrition.digestiveIssuesList || []).map(getCode).filter(d => d && d !== 'NONE');
  const selectedInjuriesList = (training.selectedInjuries || []).map(getCode).filter(inj => inj && inj !== 'NONE');
  const medicalConditionsList = (medical.selectedConditions || medical.conditions || []).map(getCode).filter(c => c && c !== 'NONE');
  const targetFocusMusclesList = (training.targetFocusMuscles || []).map(getCode).filter(m => m && m !== 'NONE');

  const hasInjuries = selectedInjuriesList.length > 0;
  const hasExclusions = excludedFoodsList.length > 0;
  const hasDigestive = digestiveIssuesList.length > 0;

  const handleOpenWhatsApp = () => {
    if (!clientPhone) return;
    let cleanPhone = clientPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('01')) cleanPhone = '2' + cleanPhone;
    const msg = `مرحباً يا ${clientName}، استلمت استمارتك في Z Coaching وقمت بمراجعة بياناتك وجاري تجهيز خطتك المخصصة 🚀`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.60)',
        backdropFilter: 'blur(4px)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      dir="rtl"
    >
      <div 
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          width: '840px',
          maxWidth: '96vw',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.20)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden'
        }}
      >
        {/* 1. Modal Header */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '3px', height: '14px', background: '#0F172A', borderRadius: '2px', display: 'inline-block' }} />
            <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>
              مراجعة استمارة المتدرب: {clientName}
            </h4>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10.5px', fontWeight: 800, background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0284C7', padding: '1px 6px', borderRadius: '4px' }}>
              #{clientCode}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {clientPhone && (
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid #22C55E',
                  background: '#FFFFFF',
                  color: '#166534',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>واتساب</span>
              </button>
            )}
            <button 
              type="button" 
              onClick={onClose}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '4px',
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                color: '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="إغلاق"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* 2. Modal Body (Zero Scroll Compact 2-Column Grid) */}
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px', background: '#F8FAFC' }}>
          
          {/* Quick Summary Pill Strip */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#334155' }}>الهدف:</span>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#0284C7' }}>{GOALS_MAP[goals.primary] || 'حرق دهون'}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              {hasExclusions ? (
                <span style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#9F1239', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                  ممنوعات: {excludedFoodsList.map(f => EXCLUDED_FOODS_LABELS[f] || f).join('، ')}
                </span>
              ) : (
                <span style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                  تغذية مرنة
                </span>
              )}

              {hasInjuries ? (
                <span style={{ background: '#FFF7ED', border: '1px solid #FED7AA', color: '#9A3412', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                  إصابة: {selectedInjuriesList.map(inj => INJURIES_LABELS[inj] || inj).join('، ')}
                </span>
              ) : (
                <span style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                  سليم بدون إصابات
                </span>
              )}

              {hasDigestive && (
                <span style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                  {digestiveIssuesList.map(d => DIGESTIVE_LABELS[d] || d).join('، ')}
                </span>
              )}
            </div>
          </div>

          {/* 2-Column Balanced Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            
            {/* RIGHT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              
              {/* Card 1: Vitals & Metabolism */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                  <span style={{ width: '2.5px', height: '11px', background: '#0F172A', borderRadius: '1px', display: 'inline-block' }} />
                  <strong style={{ fontSize: '11.5px', color: '#0F172A' }}>القياسات ومعدل الحرق</strong>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>الوزن / الطول:</span>
                    <strong style={{ fontSize: '11.5px', color: '#0F172A', fontFamily: 'JetBrains Mono, sans-serif' }}>
                      {body.weightKg ? `${body.weightKg} كجم` : '--'} / {body.heightCm ? `${body.heightCm} سم` : '--'}
                    </strong>
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>محيط الخصر & BMI:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <strong style={{ fontSize: '11px', color: '#0F172A' }}>{body.waistCm ? `${body.waistCm} سم` : '--'}</strong>
                      <span style={{ background: bmiBadge.bg, color: bmiBadge.color, fontSize: '9.5px', fontWeight: 800, padding: '0 4px', borderRadius: '3px' }}>
                        BMI {bmi}
                      </span>
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>السن والجنس:</span>
                    <strong style={{ fontSize: '11px', color: '#0F172A' }}>{ageNum} سنة ({sexIsFemale ? 'أنثى' : 'ذكر'})</strong>
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>الحرق (Mifflin):</span>
                    <strong style={{ fontSize: '11px', color: '#059669', fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>
                      BMR ~{bmr}  |  TDEE ~{tdee} سعرة
                    </strong>
                  </div>
                </div>
              </div>

              {/* Card 2: Photos Box */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                  <span style={{ width: '2.5px', height: '11px', background: '#0F172A', borderRadius: '1px', display: 'inline-block' }} />
                  <strong style={{ fontSize: '11.5px', color: '#0F172A' }}>صور القوام (Front / Side / Back)</strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {[
                    { key: 'front', title: 'الأمام', src: photos.front },
                    { key: 'side', title: 'الجانب', src: photos.side },
                    { key: 'back', title: 'الخلف', src: photos.back }
                  ].map(item => (
                    <div key={item.key} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '4px', textAlign: 'center', height: '88px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#64748B', marginBottom: '2px' }}>{item.title}</span>
                      {item.src ? (
                        <div 
                          style={{ position: 'relative', width: '100%', height: '62px', borderRadius: '3px', overflow: 'hidden', cursor: 'pointer' }}
                          onClick={() => setPreviewImage({ title: `صورة من ${item.title}`, src: item.src })}
                        >
                          <img src={item.src} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', bottom: '2px', right: '2px', background: 'rgba(15, 23, 42, 0.75)', color: '#FFFFFF', padding: '1px 3px', borderRadius: '2px', fontSize: '8.5px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <ZoomIn size={8} />
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#94A3B8', fontSize: '9.5px' }}>غير مرفوعة</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* LEFT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              
              {/* Card 3: Nutrition & Exclusions */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                  <span style={{ width: '2.5px', height: '11px', background: '#0F172A', borderRadius: '1px', display: 'inline-block' }} />
                  <strong style={{ fontSize: '11.5px', color: '#0F172A' }}>النمط الغذائي والممنوعات</strong>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ background: hasExclusions ? '#FFF1F2' : '#F8FAFC', border: `1px solid ${hasExclusions ? '#FECDD3' : '#E2E8F0'}`, borderRadius: '4px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: hasExclusions ? '#9F1239' : '#64748B' }}>الممنوعات والحساسية:</span>
                    <strong style={{ fontSize: '11px', color: hasExclusions ? '#BE123C' : '#166534' }}>
                      {hasExclusions ? excludedFoodsList.map(f => EXCLUDED_FOODS_LABELS[f] || f).join('، ') : 'لا توجد ممنوعات'}
                    </strong>
                  </div>

                  <div style={{ background: hasDigestive ? '#FFFBEB' : '#F8FAFC', border: `1px solid ${hasDigestive ? '#FDE68A' : '#E2E8F0'}`, borderRadius: '4px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: hasDigestive ? '#92400E' : '#64748B' }}>القولون والهضم:</span>
                    <strong style={{ fontSize: '11px', color: hasDigestive ? '#B45309' : '#166534' }}>
                      {hasDigestive ? digestiveIssuesList.map(d => DIGESTIVE_LABELS[d] || d).join('، ') : 'سليم تماماً'}
                    </strong>
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>الوجبات والميزانية:</span>
                    <strong style={{ fontSize: '11px', color: '#0F172A' }}>
                      {nutrition.preferredMealCount || 3} وجبات • ميزانية {nutrition.budget === 'LOW' ? 'اقتصادية' : (nutrition.budget === 'HIGH' ? 'ممتازة' : 'متوازنة')}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Card 4: Training & Lifestyle */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                  <span style={{ width: '2.5px', height: '11px', background: '#0F172A', borderRadius: '1px', display: 'inline-block' }} />
                  <strong style={{ fontSize: '11.5px', color: '#0F172A' }}>التدريب ونمط الحياة والصحة</strong>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ background: hasInjuries ? '#FFF7ED' : '#F8FAFC', border: `1px solid ${hasInjuries ? '#FED7AA' : '#E2E8F0'}`, borderRadius: '4px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: hasInjuries ? '#9A3412' : '#64748B' }}>الإصابات الحركية:</span>
                    <strong style={{ fontSize: '11px', color: hasInjuries ? '#C2410C' : '#166534' }}>
                      {hasInjuries ? selectedInjuriesList.map(inj => INJURIES_LABELS[inj] || inj).join('، ') : 'سليم وبدون إصابات'}
                    </strong>
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>نظام التمرين:</span>
                    <strong style={{ fontSize: '11px', color: '#0F172A' }}>
                      {training.location === 'HOME' ? 'المنزل' : 'الجيم'} • {training.preferredDaysPerWeek || 4} أيام • {training.maxSessionMinutes || 60} د • {EXPERIENCE_MAP[training.experience] || 'مبتدئ'}
                    </strong>
                  </div>

                  {targetFocusMusclesList.length > 0 && (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10.5px', color: '#64748B' }}>عضلات التركيز:</span>
                      <strong style={{ fontSize: '11px', color: '#0F172A' }}>
                        {targetFocusMusclesList.map(m => FOCUS_MUSCLES_LABELS[m] || m).join('، ')}
                      </strong>
                    </div>
                  )}

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>الصحة ونمط اليوم:</span>
                    <strong style={{ fontSize: '11px', color: '#0F172A' }}>
                      {medicalConditionsList.length > 0 ? medicalConditionsList.map(c => CONDITIONS_LABELS[c] || c).join('، ') : 'صحة ممتازة'} • {lifestyle.sleep?.averageHours || 7}س نوم
                    </strong>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* 3. Modal Footer */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid #F1F5F9', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <button 
            type="button" 
            onClick={onClose}
            style={{
              padding: '4px 12px',
              borderRadius: '4px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#475569',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            إغلاق
          </button>

          {onGenerateDraft && (
            <button
              type="button"
              onClick={() => onGenerateDraft(submission)}
              disabled={generatingId === submission.id}
              style={{
                padding: '5px 14px',
                borderRadius: '4px',
                border: 'none',
                background: '#0F172A',
                color: '#FFFFFF',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 4px rgba(15, 23, 42, 0.20)'
              }}
            >
              {generatingId === submission.id ? (
                <span>جاري التوليد...</span>
              ) : (
                <span>توليد الخطة</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Lightbox for Zoomed Image */}
      {previewImage && ReactDOM.createPortal(
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.90)',
            backdropFilter: 'blur(8px)',
            zIndex: 20000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setPreviewImage(null)}
        >
          <div style={{ maxWidth: '800px', width: '92%', textAlign: 'center', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#FFFFFF', marginBottom: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '14px' }}>{previewImage.title}</span>
              <button 
                type="button"
                onClick={() => setPreviewImage(null)}
                style={{ background: 'rgba(255, 255, 255, 0.2)', border: 'none', color: '#FFFFFF', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>
            <img 
              src={previewImage.src} 
              alt="Preview" 
              style={{ maxHeight: '80vh', maxWidth: '100%', objectFit: 'contain', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)' }} 
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}


