import { getClientTier, getTierColors, ClientCodeBadge, ClientPackageBadge } from '../../utils/tierBadgeHelper';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom';
import { X, CheckCircle2, AlertTriangle, HeartPulse, Dumbbell, Activity, Apple, Camera, MessageCircle, User, ZoomIn, ShieldAlert, Utensils, Flame, Scale, Check, Ban, ShieldCheck, Zap, ExternalLink } from 'lucide-react';
import { formatWhatsAppPhone } from '../../utils/whatsappRemindersEngine';
import { extractClientFastingProfile } from '../../utils/seasonalFastingRadar';

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
  const navigate = useNavigate();
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
  const personal = answers.personal || {
    firstName: (submission.user?.full_name || answers.full_name || '').split(' ')[0] || '',
    lastName: (submission.user?.full_name || answers.full_name || '').split(' ').slice(1).join(' ') || '',
    age: answers.age,
    sex: answers.gender === 'female' ? 'FEMALE' : 'MALE'
  };
  const goals = answers.goals || {
    primary: answers.primary_goal ? String(answers.primary_goal).toUpperCase() : 'FAT_LOSS'
  };
  const body = answers.body || {
    heightCm: answers.height_cm,
    weightKg: answers.weight_kg,
    waistCm: answers.circumferences?.waist_cm,
    neckCm: answers.circumferences?.neck_cm,
    hipCm: answers.circumferences?.hips_cm
  };
  const circumferences = answers.circumferences || body.circumferences || {};
  const lifestyle = answers.lifestyle || {
    dailyActivity: answers.neat_level ? String(answers.neat_level).toUpperCase() : 'MODERATE'
  };
  const medical = answers.medical || {
    conditions: Array.isArray(answers.medical_conditions?.selected) ? answers.medical_conditions.selected.map(c => ({ conditionCode: String(c).toUpperCase() })) : []
  };
  const nutrition = answers.nutrition || {
    preferredMealCount: answers.meal_structure?.meals_count === '2_meals' ? 2 : (answers.meal_structure?.meals_count === '4_meals' ? 4 : (answers.meal_structure?.meals_count === '5_meals' ? 5 : 3)),
    excludedFoodsList: answers.strict_allergies || [],
    dislikedFoods: answers.disliked_foods || []
  };
  const training = answers.training || {
    location: answers.training_environment === 'home_gym' ? 'HOME' : 'GYM',
    preferredDaysPerWeek: answers.training_logistics?.days_per_week || 4,
    experience: answers.training_logistics?.experience_level ? String(answers.training_logistics.experience_level).toUpperCase() : 'INTERMEDIATE',
    selectedInjuries: Array.isArray(answers.injuries_map?.selected_areas) ? answers.injuries_map.selected_areas : [],
    targetFocusMuscles: answers.focus_muscles || []
  };
  const cardio = answers.cardio || {};
  const photos = body.photos || {
    front: answers.media_uploads?.front_url,
    side: answers.media_uploads?.side_url,
    back: answers.media_uploads?.back_url,
    inbody: answers.media_uploads?.inbody_report_url
  };
  const inbodyPhoto = photos.inbody || answers.media_uploads?.inbody_report_url;
  const medicalReportsList = answers.media_uploads?.medical_reports_urls || [];

  const clientName = submission.user?.full_name || `${personal.firstName || ''} ${personal.lastName || ''}`.trim() || 'متدرب جديد';
  const clientCode = String(submission.user?.client_code || submission.id || '1').replace(/^client[-_]?/i, '');
  const clientPhone = submission.user?.phone_number || personal.phone || '';

  // Calculations
  const heightCm = Number(body.heightCm || answers.height_cm) || 170;
  const heightM = heightCm / 100;
  const weightKg = Number(body.weightKg || answers.weight_kg) || 70;
  const bmi = (weightKg / (heightM * heightM)).toFixed(1);

  const ageNum = Number(personal.age || answers.age) || (personal.dateOfBirth ? (new Date().getFullYear() - new Date(personal.dateOfBirth).getFullYear()) : 30);
  const sexIsFemale = personal.sex === 'FEMALE' || answers.gender === 'female';
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
    const cleanPhone = formatWhatsAppPhone(clientPhone);
    const msg = `مرحباً يا ${clientName}، استلمت استمارتك في Z Coaching وقمت بمراجعة بياناتك وجاري تجهيز خطتك المخصصة`;
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
            {(() => {
              const rawPkg = submission.package_name || submission.subscription_package || '';
              const isMax = getClientTier(submission) === 'MAX';
              const pkgName = isMax ? 'MAX' : 'ELITE';
              return (
                <span style={{ 
                  fontFamily: 'JetBrains Mono, monospace', 
                  fontSize: '10.5px', 
                  fontWeight: 800, 
                  background: '#F8FAFC', 
                  border: '1px solid #E2E8F0', 
                  color: isMax ? '#B45309' : '#0284C7', 
                  padding: '1px 6px', 
                  borderRadius: '6px' 
                }}>
                  #{clientCode}
                </span>
              );
            })()}
            {(() => {
              const fasting = extractClientFastingProfile(submission, answers);
              return (
                <>
                  {fasting.primaryFastingBadge && (
                    <span style={{ 
                      fontSize: '10px', 
                      padding: '1px 6px', 
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
                      fontSize: '10px', 
                      padding: '1px 6px', 
                      borderRadius: '6px', 
                      background: fasting.intermittentBadge.bg, 
                      border: `1px solid ${fasting.intermittentBadge.border}`, 
                      color: fasting.intermittentBadge.color, 
                      fontWeight: 800 
                    }}>
                      {fasting.intermittentBadge.label}
                    </span>
                  )}
                </>
              );
            })()}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {clientPhone && (
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                style={{
                  padding: '3px 8px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0', background: 'transparent',
                  color: '#16A34A',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = '#BBF7D0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }}
              >
                <MessageCircle size={12} />
                <span>واتساب</span>
              </button>
            )}
            <button 
              type="button" 
              onClick={onClose}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '8px',
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
                <span style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#9F1239', padding: '1px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>
                  ممنوعات: {excludedFoodsList.map(f => EXCLUDED_FOODS_LABELS[f] || f).join('، ')}
                </span>
              ) : (
                <span style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#166534', padding: '1px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>
                  تغذية مرنة
                </span>
              )}

              {hasInjuries ? (
                <span style={{ background: '#FFF7ED', border: '1px solid #FED7AA', color: '#9A3412', padding: '1px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>
                  إصابة: {selectedInjuriesList.map(inj => INJURIES_LABELS[inj] || inj).join('، ')}
                </span>
              ) : (
                <span style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#166534', padding: '1px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>
                  سليم بدون إصابات
                </span>
              )}

              {hasDigestive && (
                <span style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#92400E', padding: '1px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>
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
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>الوزن / الطول:</span>
                    <strong style={{ fontSize: '11.5px', color: '#0F172A', fontFamily: 'JetBrains Mono, sans-serif' }}>
                      {body.weightKg ? `${body.weightKg} كجم` : '--'} / {body.heightCm ? `${body.heightCm} سم` : '--'}
                    </strong>
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>محيط الخصر & BMI:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <strong style={{ fontSize: '11px', color: '#0F172A' }}>{body.waistCm ? `${body.waistCm} سم` : '--'}</strong>
                      <span style={{ background: bmiBadge.bg, color: bmiBadge.color, fontSize: '9.5px', fontWeight: 800, padding: '0 4px', borderRadius: '6px' }}>
                        BMI {bmi}
                      </span>
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>السن والجنس:</span>
                    <strong style={{ fontSize: '11px', color: '#0F172A' }}>{ageNum} سنة ({sexIsFemale ? 'أنثى' : 'ذكر'})</strong>
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>الحرق (Mifflin):</span>
                    <strong style={{ fontSize: '11px', color: '#059669', fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>
                      BMR ~{bmr}  |  TDEE ~{tdee} سعرة
                    </strong>
                  </div>

                  {(circumferences.neck_cm || circumferences.waist_cm || circumferences.hips_cm || circumferences.chest_cm) && (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>المحيطات المترية:</span>
                      <div style={{ fontSize: '10.5px', color: '#0F172A', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {circumferences.neck_cm && <span>رقبة: <strong>{circumferences.neck_cm}</strong>سم</span>}
                        {circumferences.waist_cm && <span>وسط: <strong>{circumferences.waist_cm}</strong>سم</span>}
                        {circumferences.hips_cm && <span>حوض: <strong>{circumferences.hips_cm}</strong>سم</span>}
                        {circumferences.chest_cm && <span>صدر: <strong>{circumferences.chest_cm}</strong>سم</span>}
                        {circumferences.arm_cm && <span>ذراع: <strong>{circumferences.arm_cm}</strong>سم</span>}
                        {circumferences.thigh_cm && <span>فخذ: <strong>{circumferences.thigh_cm}</strong>سم</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Photos Box */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '2.5px', height: '11px', background: '#0F172A', borderRadius: '1px', display: 'inline-block' }} />
                    <strong style={{ fontSize: '11.5px', color: '#0F172A' }}>صور القوام وتقرير InBody</strong>
                  </div>
                  {medicalReportsList.length > 0 && (
                    <span style={{ fontSize: '9.5px', color: '#16A34A', fontWeight: 800, background: '#ECFDF5', padding: '1px 6px', borderRadius: '6px' }}>
                      {medicalReportsList.length} تحاليل مرفقة
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: inbodyPhoto ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: '6px' }}>
                  {[
                    { key: 'front', title: 'الأمام', src: photos.front },
                    { key: 'side', title: 'الجانب', src: photos.side },
                    { key: 'back', title: 'الخلف', src: photos.back },
                    ...(inbodyPhoto ? [{ key: 'inbody', title: 'InBody', src: inbodyPhoto }] : [])
                  ].map(item => (
                    <div key={item.key} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '4px', textAlign: 'center', height: '88px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#64748B', marginBottom: '2px' }}>{item.title}</span>
                      {item.src ? (
                        <div 
                          style={{ position: 'relative', width: '100%', height: '62px', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer' }}
                          onClick={() => setPreviewImage({ title: `صورة ${item.title}`, src: item.src })}
                        >
                          <img src={item.src} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', bottom: '2px', right: '2px', background: 'rgba(15, 23, 42, 0.75)', color: '#FFFFFF', padding: '1px 3px', borderRadius: '6px', fontSize: '8.5px', display: 'flex', alignItems: 'center', gap: '2px' }}>
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
                  <div style={{ background: hasExclusions ? '#FFF1F2' : '#F8FAFC', border: `1px solid ${hasExclusions ? '#FECDD3' : '#E2E8F0'}`, borderRadius: '8px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: hasExclusions ? '#9F1239' : '#64748B' }}>الممنوعات والحساسية:</span>
                    <strong style={{ fontSize: '11px', color: hasExclusions ? '#BE123C' : '#166534' }}>
                      {hasExclusions ? excludedFoodsList.map(f => EXCLUDED_FOODS_LABELS[f] || f).join('، ') : 'لا توجد ممنوعات'}
                    </strong>
                  </div>

                  <div style={{ background: hasDigestive ? '#FFFBEB' : '#F8FAFC', border: `1px solid ${hasDigestive ? '#FDE68A' : '#E2E8F0'}`, borderRadius: '8px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: hasDigestive ? '#92400E' : '#64748B' }}>القولون والهضم:</span>
                    <strong style={{ fontSize: '11px', color: hasDigestive ? '#B45309' : '#166534' }}>
                      {hasDigestive ? digestiveIssuesList.map(d => DIGESTIVE_LABELS[d] || d).join('، ') : 'سليم تماماً'}
                    </strong>
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>الوجبات والميزانية:</span>
                    <strong style={{ fontSize: '11px', color: '#0F172A' }}>
                      {nutrition.preferredMealCount || 3} وجبات • ميزانية {nutrition.budget === 'LOW' ? 'اقتصادية' : (nutrition.budget === 'HIGH' ? 'ممتازة' : 'متوازنة')}
                    </strong>
                  </div>

                  {(() => {
                    const fasting = extractClientFastingProfile(submission, answers);
                    return (
                      <div style={{ 
                        background: fasting.primaryFastingBadge?.bg || '#F8FAFC', 
                        border: `1px solid ${fasting.primaryFastingBadge?.border || '#E2E8F0'}`, 
                        borderRadius: '8px', 
                        padding: '4px 8px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center' 
                      }}>
                        <span style={{ fontSize: '10.5px', color: '#475569' }}>نمط الصيام الفسيولوجي:</span>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {fasting.primaryFastingBadge && (
                            <strong style={{ fontSize: '11px', color: fasting.primaryFastingBadge.color }}>
                              {fasting.primaryFastingBadge.label}
                            </strong>
                          )}
                          {fasting.intermittentBadge && (
                            <strong style={{ fontSize: '11px', color: fasting.intermittentBadge.color }}>
                              • {fasting.intermittentBadge.label}
                            </strong>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {Boolean(submission.answers?.cravings_pattern) && (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10.5px', color: '#64748B' }}>توقيت الشراهة:</span>
                      <strong style={{ fontSize: '11px', color: submission.answers?.cravings_pattern === 'late_night' ? '#BE123C' : submission.answers?.cravings_pattern === 'post_meal_sweets' ? '#B45309' : '#0F172A' }}>
                        {submission.answers?.cravings_pattern === 'late_night' ? 'جوع واشتهاء مسائي ليلاً' : submission.answers?.cravings_pattern === 'post_meal_sweets' ? 'اشتهاء السكر بعد الوجبات' : submission.answers?.cravings_pattern === 'midday_dip' ? 'هبوط طاقة منتصف النهار' : 'شهية منضبطة'}
                      </strong>
                    </div>
                  )}

                  {Boolean(submission.answers?.beverage_sugar_intake) && (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10.5px', color: '#64748B' }}>سكر المشروبات اليومي:</span>
                      <strong style={{ fontSize: '11px', color: submission.answers?.beverage_sugar_intake === '2_tsp' ? '#B45309' : submission.answers?.beverage_sugar_intake === '3_plus_tsp' ? '#BE123C' : '#0F172A' }}>
                        {submission.answers?.beverage_sugar_intake === '1_tsp' ? 'ملعقة صغيرة (20 سعرة / 5جم كارب)' :
                         submission.answers?.beverage_sugar_intake === '2_tsp' ? 'ملعقتين صغيرتين (40 سعرة / 10جم كارب)' :
                         submission.answers?.beverage_sugar_intake === '3_plus_tsp' ? '3 ملاعق أو أكثر (ينصح بالبدائل)' : 'بدون سكر / محليات دايت صفرية'}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 4: Training & Lifestyle */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                  <span style={{ width: '2.5px', height: '11px', background: '#0F172A', borderRadius: '1px', display: 'inline-block' }} />
                  <strong style={{ fontSize: '11.5px', color: '#0F172A' }}>التدريب ونمط الحياة والصحة</strong>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ background: hasInjuries ? '#FFF7ED' : '#F8FAFC', border: `1px solid ${hasInjuries ? '#FED7AA' : '#E2E8F0'}`, borderRadius: '8px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: hasInjuries ? '#9A3412' : '#64748B' }}>الإصابات الحركية:</span>
                    <strong style={{ fontSize: '11px', color: hasInjuries ? '#C2410C' : '#166534' }}>
                      {hasInjuries ? selectedInjuriesList.map(inj => INJURIES_LABELS[inj] || inj).join('، ') : 'سليم وبدون إصابات'}
                    </strong>
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>نظام التمرين:</span>
                    <strong style={{ fontSize: '11px', color: '#0F172A' }}>
                      {training.location === 'HOME' ? 'المنزل' : 'الجيم'} • {training.preferredDaysPerWeek || 4} أيام • {training.maxSessionMinutes || 60} د • {EXPERIENCE_MAP[training.experience] || 'مبتدئ'}
                    </strong>
                  </div>

                  {targetFocusMusclesList.length > 0 && (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10.5px', color: '#64748B' }}>عضلات التركيز:</span>
                      <strong style={{ fontSize: '11px', color: '#0F172A' }}>
                        {targetFocusMusclesList.map(m => FOCUS_MUSCLES_LABELS[m] || m).join('، ')}
                      </strong>
                    </div>
                  )}

                  {/* Current Meds & Supplements */}
                  {Boolean((submission.answers?.current_meds_supplements_list?.length > 0 && !submission.answers?.current_meds_supplements_list?.includes('none')) || submission.answers?.current_meds_supplements) && (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10.5px', color: '#64748B' }}>المكملات والأدوية:</span>
                      <strong style={{ fontSize: '11px', color: '#0F172A' }}>
                        {(() => {
                          const MEDS_LABELS = {
                            creatine: 'كرياتين',
                            whey_protein: 'واي بروتين',
                            omega3: 'أوميجا 3',
                            vitamin_d: 'فيتامين د',
                            multivitamin: 'ملتي فيتامين',
                            magnesium: 'مغنيسيوم',
                            pre_workout: 'بري وورك آوت',
                            hypertension_meds: 'علاج ضغط',
                            diabetes_meds: 'علاج سكر',
                            thyroid_meds: 'علاج غدة'
                          };
                          const list = (submission.answers?.current_meds_supplements_list || []).filter(x => x !== 'none').map(k => MEDS_LABELS[k] || k);
                          const note = submission.answers?.current_meds_supplements;
                          const parts = [...list];
                          if (note) parts.push(note);
                          return parts.join('، ') || 'لا توجد';
                        })()}
                      </strong>
                    </div>
                  )}

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>الصحة ونمط اليوم:</span>
                    <strong style={{ fontSize: '11px', color: '#0F172A' }}>
                      {medicalConditionsList.length > 0 ? medicalConditionsList.map(c => CONDITIONS_LABELS[c] || c).join('، ') : 'صحة ممتازة'} • {lifestyle.sleep?.averageHours || 7}س نوم
                    </strong>
                  </div>

                  {/* Sleep & Shift Work */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>النوم والعمل:</span>
                    <strong style={{ fontSize: '11px', color: (submission.answers?.sleep_schedule?.pattern === 'rotating_shifts' || submission.answers?.sleep_schedule?.pattern === 'night_shift') ? '#D97706' : '#0F172A' }}>
                      {submission.answers?.sleep_schedule?.pattern === 'rotating_shifts' ? 'شفتات متغيرة (قطع كافيين 6س)' : submission.answers?.sleep_schedule?.pattern === 'night_shift' ? 'شفت ليلي دائم' : submission.answers?.sleep_schedule?.pattern === 'irregular' ? 'نوم غير منتظم' : 'نوم ليلي منتظم'}
                      {(() => { const h = submission.answers?.sleep_schedule?.average_hours; const map = { less_than_6: 'أقل من 6', '6_7': '6-7', '7_8': '7-8', more_than_8: '+8' }; return h ? ` • ${map[h] || h}س` : ''; })()}
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
              borderRadius: '8px',
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

          {(() => {
            const hasDraft = submission.status === 'DRAFT_GENERATED' || submission.status === 'APPROVED';
            const clientCode = submission.user?.client_code || submission.user?.id || '1';

            return (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {hasDraft && (
                  <button
                    type="button"
                    onClick={() => {
                      window.open(`/coach/editor?user_id=${clientCode}`, '_blank');
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '5px',
                      border: '1px solid #93C5FD',
                      background: '#EFF6FF',
                      color: '#1D4ED8',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 1px 2px rgba(29, 78, 216, 0.1)'
                    }}
                  >
                    <ExternalLink size={13} />
                    <span>فتح الخطة في محرر الكوتش</span>
                  </button>
                )}

                {onGenerateDraft && !hasDraft && (
                  <button
                    type="button"
                    onClick={() => onGenerateDraft(submission)}
                    disabled={generatingId === submission.id}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '5px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 6px rgba(15, 23, 42, 0.25)'
                    }}
                  >
                    <Zap size={13} color="#FBBF24" />
                    {generatingId === submission.id ? (
                      <span>جاري توليد الخطة ونقلك للمحرر...</span>
                    ) : (
                      <span>توليد مسودة الخطة وتخصيصها بالمحرر</span>
                    )}
                  </button>
                )}
              </div>
            );
          })()}
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


