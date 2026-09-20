import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, MessageCircle, ExternalLink, Zap, ZoomIn } from 'lucide-react';
import { getClientTier } from '../../utils/tierBadgeHelper';
import { extractClientFastingProfile } from '../../utils/seasonalFastingRadar';
import { formatWhatsAppPhone } from '../../utils/whatsappRemindersEngine';

const GOALS_MAP = {
  FAT_LOSS: 'حرق وخسارة الدهون',
  MUSCLE_GAIN: 'زيادة الكتلة العضلية (تضخيم)',
  BODY_RECOMPOSITION: 'إعادة تشكيل الجسم (Recomp)',
  WEIGHT_MAINTENANCE: 'تثبيت الوزن الحالي',
  GENERAL_HEALTH: 'لياقة وصحة عامة',
  PERFORMANCE: 'زيادة الأداء الرياضي والقوة'
};

const _ACTIVITY_MAP = {
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
  EGGS: 'البيض', EGG: 'البيض',
  DAIRY: 'الألبان والأجبان', MILK: 'الحليب ومشتقاته',
  FISH_SEAFOOD: 'الأسماك والبحريات', FISH: 'الأسماك', SEAFOOD: 'المأكولات البحرية',
  PEANUTS_NUTS: 'المكسرات والفول السوداني', PEANUTS: 'الفول السوداني', NUTS: 'المكسرات',
  WHEAT_GLUTEN: 'الجلوتين والقمح', GLUTEN_WHEAT: 'الجلوتين والقمح', GLUTEN: 'الجلوتين', WHEAT: 'القمح',
  OATS: 'الشوفان', OAT: 'الشوفان',
  RED_MEAT: 'اللحوم الحمراء', MEAT: 'اللحوم الحمراء', BEEF: 'اللحوم الحمراء',
  LEGUMES: 'البقوليات', LEGUME: 'البقوليات',
  EGGPLANT_COOKED_VEG: 'الباذنجان', EGGPLANT: 'الباذنجان'
};

const INJURIES_LABELS = {
  LOWER_BACK: 'أسفل الظهر والقطنية', SPINE: 'العمود الفقري', LUMBAR: 'الفقرات القطنية',
  SHOULDER: 'مفصل الكتف الدوار', ROTATOR_CUFF: 'الكتف الدوار',
  KNEE: 'الركبة والغضاريف',
  NECK: 'الرقبة والفقرات العنقية', CERVICAL_SPINE: 'الفقرات العنقية',
  ELBOW_WRIST: 'الكوع والرسغ', WRIST: 'رسغ اليد', ELBOW: 'الكوع',
  NONE: 'لا توجد إصابات'
};

const CONDITIONS_LABELS = {
  DIABETES: 'السكري', TYPE_2_DIABETES: 'السكري (النوع 2)', TYPE_1_DIABETES: 'السكري (النوع 1)',
  HYPERTENSION: 'ضغط الدم',
  HEART_CONDITION: 'أمراض القلب', CARDIOVASCULAR_DISEASE: 'الأوعية الدموية',
  THYROID_CONDITION: 'الغدة الدرقية',
  ANEMIA: 'الأنيميا',
  ASTHMA_OR_RESPIRATORY_CONDITION: 'الربو والتنفس',
  PCOS: 'تكيس المبايض',
  NONE: 'لا توجد'
};

const MEALS_MAP = {
  '2_meals': 'وجبتين',
  '3_meals': '3 وجبات',
  '4_meals': '4 وجبات',
  '5_meals': '5 وجبات'
};

const SLEEP_MAP = {
  'rotating_shifts': 'شفتات متغيرة (قطع كافيين 6س)',
  'night_shift': 'شفت ليلي دائم',
  'irregular': 'نوم غير منتظم',
  'regular': 'نوم ليلي منتظم'
};

const SUGAR_MAP = {
  '1_tsp': 'ملعقة صغيرة (20 سعرة / 5جم كارب)',
  '2_tsp': 'ملعقتين صغيرتين (40 سعرة / 10جم كارب)',
  '3_plus_tsp': '3 ملاعق أو أكثر (ينصح بالبدائل)',
  'none': 'بدون سكر / محليات دايت صفرية'
};

const BUDGET_MAP = {
  'LOW': 'اقتصادية', 'low': 'اقتصادية',
  'MEDIUM': 'متوازنة', 'medium': 'متوازنة',
  'HIGH': 'ممتازة', 'high': 'ممتازة'
};

const ENVIRONMENT_MAP = {
  'HOME': 'المنزل', 'home_gym': 'المنزل',
  'GYM': 'الجيم', 'commercial_gym': 'الجيم'
};

const DIABETES_MAP = {
  'type_1': 'النوع الأول',
  'type_2': 'النوع الثاني',
  'prediabetes': 'مقدمات سكري'
};

const IF_MAP = {
  '16_8': '16 ساعة صيام',
  '14_10': '14 ساعة صيام',
  'none': 'لا أصوم'
};

const OCCUPATION_MAP = {
  'desk_office': 'مكتبي',
  'active_physical': 'حركي / مجهود بدني',
  'student': 'طالب',
  'driver': 'سائق',
  'mixed': 'مختلط'
};

const PREP_MAP = {
  'high': 'أطبخ كل وجباتي',
  'medium': 'أطبخ جزئياً',
  'low': 'أعتمد على المطاعم'
};

const RELIGION_MAP = {
  'muslim': 'مسلم',
  'christian': 'مسيحي',
  'other': 'أخرى'
};

const CHRISTIAN_FASTING_MAP = {
  'vegan_only': 'نباتي بالكامل (أصوام سيديّة)',
  'seafood_allowed': 'نباتي + سمك',
  'none': 'غير صائم حالياً'
};

const INJURY_NATURE_MAP = {
  'acute': 'حادة (جديدة)',
  'chronic': 'مزمنة',
  'rehabilitated': 'تأهلت وتشفّت'
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
  const clientName = submission.user?.full_name || answers.full_name || 'بدون اسم';
  const clientCode = String(submission.user?.client_code || submission.id || '').replace(/^client[-_]?/i, '');
  const clientPhone = submission.user?.phone_number || answers.phone || '';

  const handleOpenWhatsApp = () => {
    if (!clientPhone) return;
    const cleanPhone = formatWhatsAppPhone(clientPhone);
    const msg = `مرحباً يا ${clientName}، استلمت استمارتك في Z Coaching وقمت بمراجعة بياناتك وجاري تجهيز خطتك المخصصة`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const FieldRow = ({ label, value, dictionary }) => {
    let displayValue = value;
    if (value === undefined || value === null || value === '') {
      displayValue = <span style={{ color: '#94A3B8' }}>لم يُجب</span>;
    } else if (typeof value === 'boolean') {
      displayValue = value ? 'نعم' : 'لا';
    } else if (Array.isArray(value)) {
      displayValue = value.length > 0 ? value.map(v => dictionary ? (dictionary[v] ?? v) : v).join('، ') : <span style={{ color: '#94A3B8' }}>لم يُجب</span>;
    } else {
      displayValue = dictionary ? (dictionary[value] ?? String(value)) : String(value);
    }
    
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
        <span style={{ fontSize: '11.5px', color: '#64748B' }}>{label}</span>
        <strong style={{ fontSize: '11.5px', color: '#0F172A', textAlign: 'left', wordBreak: 'break-word', maxWidth: '65%' }}>{displayValue}</strong>
      </div>
    );
  };

  const Section = ({ title, children }) => (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
      <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ width: '4px', height: '14px', background: '#0284C7', borderRadius: '4px', display: 'inline-block' }} />
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );

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
          background: '#F8FAFC',
          borderRadius: '16px',
          width: '840px',
          maxWidth: '96vw',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.20)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
              مراجعة الاستمارة: {clientName}
            </h4>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 800, background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '8px' }}>
              #{clientCode}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {clientPhone && (
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0', background: 'transparent',
                  color: '#16A34A',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <MessageCircle size={14} />
                <span>واتساب</span>
              </button>
            )}
            <button 
              type="button" 
              onClick={onClose}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                color: '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Section title="1) القياسات والهدف">
              <FieldRow label="الجنس" value={answers.gender} />
              <FieldRow label="العمر" value={answers.age} />
              <FieldRow label="الطول (سم)" value={answers.height_cm} />
              <FieldRow label="الوزن (كجم)" value={answers.weight_kg} />
              <FieldRow label="محيط الرقبة (سم)" value={answers.circumferences?.neck_cm} />
              <FieldRow label="محيط الخصر (سم)" value={answers.circumferences?.waist_cm} />
              <FieldRow label="محيط الحوض (سم)" value={answers.circumferences?.hips_cm} />
              <FieldRow label="الهدف الأساسي" value={answers.primary_goal} dictionary={GOALS_MAP} />
              <FieldRow label="مستوى الحركة اليومية (NEAT)" value={answers.neat_level} dictionary={_ACTIVITY_MAP} />
              <FieldRow label="طبيعة العمل" value={answers.occupation_type} dictionary={OCCUPATION_MAP} />
            </Section>

            <Section title="2) الملف الطبي">
              <FieldRow label="أعراض خطيرة" value={answers.dangerous_symptoms} />
              <FieldRow label="الحالات الطبية المختارة" value={answers.medical_conditions?.selected} dictionary={CONDITIONS_LABELS} />
              <FieldRow label="نوع السكري" value={answers.medical_conditions?.diabetes?.type} dictionary={DIABETES_MAP} />
              <FieldRow label="يستخدم الإنسولين" value={answers.medical_conditions?.diabetes?.uses_insulin} />
              <FieldRow label="السكر التراكمي (HbA1c)" value={answers.medical_conditions?.diabetes?.hba1c} />
              <FieldRow label="أنيميا الفول (G6PD)" value={answers.medical_conditions?.favism_g6pd} />
              <FieldRow label="ارتفاع ضغط الدم" value={answers.medical_conditions?.hypertension} />
              <FieldRow label="النقرس" value={answers.medical_conditions?.gout} />
              <FieldRow label="عملية سمنة سابقة" value={answers.medical_conditions?.bariatric?.is_operated} />
              <FieldRow label="سعة الوجبة (جرام)" value={answers.medical_conditions?.bariatric?.meal_capacity_grams} />
              <FieldRow label="متلازمة الإغراق (Dumping)" value={answers.medical_conditions?.bariatric?.dumping_syndrome} />
              <FieldRow label="تكيس المبايض (PCOS)" value={answers.medical_conditions?.female_cases?.is_pcos} />
              <FieldRow label="مرضعة" value={answers.medical_conditions?.female_cases?.is_lactating} />
              <FieldRow label="ولادة حديثة" value={answers.medical_conditions?.female_cases?.is_postpartum} />
              <FieldRow label="قائمة الأدوية والمكملات" value={answers.current_meds_supplements_list} />
              <FieldRow label="تفاصيل الأدوية والمكملات" value={answers.current_meds_supplements} />
            </Section>
            
            <Section title="3) الإصابات">
              <FieldRow label="مناطق الإصابة" value={answers.injuries_map?.selected_areas} dictionary={INJURIES_LABELS} />
              <FieldRow label="إصابات الركبة" value={answers.injuries_map?.knee} />
              <FieldRow label="إصابات الظهر والعمود الفقري" value={answers.injuries_map?.spine_back} />
              <FieldRow label="إصابات الكتف" value={answers.injuries_map?.shoulder} />
              <FieldRow label="إصابات الكور" value={answers.injuries_map?.core} />
              <FieldRow label="إصابات مفاصل أخرى" value={answers.injuries_map?.other_joints} />
              <FieldRow label="طبيعة الإصابة" value={answers.injuries_map?.injury_nature} dictionary={INJURY_NATURE_MAP} />
              <FieldRow label="يخف الألم بالراحة" value={answers.injuries_map?.pain_relieved_by_rest} />
            </Section>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Section title="4) التغذية ونمط الحياة">
              <FieldRow label="الديانة" value={answers.religion} dictionary={RELIGION_MAP} />
              <FieldRow label="نمط الصيام المسيحي" value={answers.christianFastingStyle} dictionary={CHRISTIAN_FASTING_MAP} />
              <FieldRow label="ممنوعات وحساسية صارمة" value={answers.strict_allergies} dictionary={EXCLUDED_FOODS_LABELS} />
              <FieldRow label="أطعمة غير مفضلة" value={answers.disliked_foods} dictionary={EXCLUDED_FOODS_LABELS} />
              <FieldRow label="عدد الوجبات" value={answers.meal_structure?.meals_count} dictionary={MEALS_MAP} />
              <FieldRow label="صيام متقطع" value={answers.meal_structure?.intermittent_fasting} dictionary={IF_MAP} />
              <FieldRow label="ميزانية الطعام" value={answers.food_budget} dictionary={BUDGET_MAP} />
              <FieldRow label="القدرة على تحضير الطعام" value={answers.food_prep_ability} dictionary={PREP_MAP} />
              <FieldRow label="سكر المشروبات" value={answers.beverage_sugar_intake} dictionary={SUGAR_MAP} />
              <FieldRow label="نمط النوم" value={answers.sleep_schedule?.pattern} dictionary={SLEEP_MAP} />
              <FieldRow label="متوسط ساعات النوم" value={answers.sleep_schedule?.average_hours} />
              <FieldRow label="ساعة النوم المعتادة" value={answers.sleep_schedule?.bedtime_hour} />
            </Section>

            <Section title="5) التدريب">
              <FieldRow label="بيئة التدريب" value={answers.training_environment} dictionary={ENVIRONMENT_MAP} />
              <FieldRow label="أيام التمرين في الأسبوع" value={answers.training_logistics?.days_per_week} />
              <FieldRow label="مستوى الخبرة" value={answers.training_logistics?.experience_level} dictionary={EXPERIENCE_MAP} />
              <FieldRow label="يمارس رياضة أخرى" value={answers.training_logistics?.has_other_sports} />
              <FieldRow label="اسم الرياضة الأخرى" value={answers.training_logistics?.sports_name} />
              <FieldRow label="ساعات الرياضة الأخرى" value={answers.training_logistics?.hours_per_week} />
              <FieldRow label="التدريب مؤخراً" value={answers.recent_training} />
              <FieldRow label="عضلات التركيز" value={answers.focus_muscles} />
            </Section>

            <Section title="6) الملفات (المرفقات)">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', paddingTop: '8px' }}>
                {[
                  { key: 'front', title: 'الأمام', src: answers.media_uploads?.front_url },
                  { key: 'side', title: 'الجانب', src: answers.media_uploads?.side_url },
                  { key: 'back', title: 'الخلف', src: answers.media_uploads?.back_url },
                  { key: 'inbody', title: 'InBody', src: answers.media_uploads?.inbody_report_url }
                ].map(item => (
                  <div key={item.key} style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px', textAlign: 'center', height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>{item.title}</span>
                    {item.src ? (
                      <div 
                        style={{ position: 'relative', width: '100%', flex: 1, borderRadius: '6px', overflow: 'hidden', cursor: 'pointer' }}
                        onClick={() => setPreviewImage({ title: `صورة ${item.title}`, src: item.src })}
                      >
                        <img src={item.src} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(15, 23, 42, 0.8)', color: '#FFFFFF', padding: '4px', borderRadius: '6px', display: 'flex' }}>
                          <ZoomIn size={10} />
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: '#94A3B8', fontSize: '10px' }}>لم يُجب</span>
                    )}
                  </div>
                ))}
              </div>
              <FieldRow label="مرفقات طبية أخرى" value={answers.media_uploads?.medical_reports_urls?.length ? `${answers.media_uploads.medical_reports_urls.length} ملفات` : null} />
            </Section>

            <Section title="7) الموافقة القانونية (PDPL)">
              {answers.health_data_consent?.accepted ? (
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <strong style={{ fontSize: '11.5px', color: '#065F46' }}>وافق على الشروط</strong>
                  <span style={{ fontSize: '10.5px', color: '#047857' }}>
                    تاريخ الموافقة: {answers.health_data_consent.accepted_at}<br/>
                    نسخة الوثيقة: {answers.health_data_consent.version}
                  </span>
                </div>
              ) : (
                <span style={{ color: '#94A3B8', fontSize: '11.5px' }}>لم يوافق / لم يُجب</span>
              )}
            </Section>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <button 
            type="button" 
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#475569',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            إغلاق
          </button>

          {(() => {
            const hasDraft = submission.status === 'DRAFT_GENERATED' || submission.status === 'APPROVED';
            return (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {hasDraft && (
                  <button
                    type="button"
                    onClick={() => {
                      window.open(`/coach/editor?user_id=${clientCode}`, '_blank');
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #93C5FD',
                      background: '#EFF6FF',
                      color: '#1D4ED8',
                      fontSize: '12.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 1px 2px rgba(29, 78, 216, 0.1)'
                    }}
                  >
                    <ExternalLink size={14} />
                    <span>فتح الخطة في محرر الكوتش</span>
                  </button>
                )}

                {onGenerateDraft && !hasDraft && (
                  <button
                    type="button"
                    onClick={() => onGenerateDraft(submission)}
                    disabled={generatingId === submission.id}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 6px rgba(15, 23, 42, 0.25)'
                    }}
                  >
                    <Zap size={14} color="#FBBF24" />
                    {generatingId === submission.id ? 'جاري توليد الخطة ونقلك للمحرر...' : 'توليد مسودة الخطة وتخصيصها بالمحرر'}
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
