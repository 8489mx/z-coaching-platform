import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, MessageCircle, ExternalLink, Zap, ZoomIn } from 'lucide-react';
import { formatWhatsAppPhone } from '../../utils/whatsappRemindersEngine';

const GOALS_MAP = {
  fat_loss: 'خسارة دهون حادة (Fat Loss)',
  lean_bulk: 'بناء كتلة عضلية صافية (Lean Bulk)',
  recomposition: 'إعادة تشكيل الجسم (Body Recomp)',
  general_fitness: 'لياقة عامة وتأهيل بدني (Fitness)'
};

const ACTIVITY_MAP = {
  sedentary: 'خامل / عمل مكتبي',
  moderate: 'متوسط النشاط',
  very_active: 'عالي النشاط / عمل ميداني'
};

const OCCUPATION_MAP = {
  DESK_OFFICE: 'مكتبي ثابت',
  FIELD_MOBILE: 'ميداني متحرك',
  MANUAL_LABOR: 'عمل بدني شاق',
  STUDENT: 'طالب جامعي / دراسي',
  UNEMPLOYED: 'لا أعمل حالياً / عمل منزلي'
};

const ENVIRONMENT_MAP = {
  commercial_gym: 'جيم تجاري متكامل',
  home_gym: 'جيم منزلي متطور',
  minimal_equipment: 'أدوات منزلية خفيفة',
  calisthenics_bands: 'وزن الجسم فقط (Calisthenics)'
};

const EXPERIENCE_MAP = {
  beginner: 'مبتدئ (أقل من سنة)',
  intermediate: 'متوسط (1 إلى 3 سنوات)',
  advanced: 'متقدم (أكثر من 3 سنوات)'
};

const RECENT_TRAINING_MAP = {
  ACTIVE: 'أتمرن حالياً بانتظام',
  INCONSISTENT: 'متقطع في آخر 6 شهور',
  NONE_LAST_4_WEEKS: 'منقطع منذ 1 إلى 3 شهور',
  RETURNING_AFTER_LONG_BREAK: 'عودة بعد انقطاع طويل'
};

const MEALS_MAP = {
  '3_meals': '3 وجبات',
  '3_meals_snack': '3 وجبات + سناك',
  '4_to_5_meals': '4 إلى 5 وجبات'
};

const IF_MAP = {
  none: 'بدون صيام متقطع',
  '16_8': 'صيام 16/8',
  '14_10': 'صيام 14/10'
};

const BUDGET_MAP = {
  LOW: 'اقتصادية (بيض، تونة، دجاج، قريش)',
  MEDIUM: 'متوسطة (دواجن، لحوم، أسماك)',
  HIGH: 'مرتفعة (ستيك، سلمون، مكملات)'
};

const PREP_MAP = {
  FULL_KITCHEN: 'مطبخ متكامل (أطبخ بنفسي)',
  REHEAT_ONLY: 'تسخين فقط (وجبات جاهزة)',
  NO_KITCHEN: 'اعتماد على مطاعم صحية'
};

const SUGAR_MAP = {
  zero_or_sweetener: 'بدون سكر / بدائل دايت',
  '1_tsp': 'ملعقة صغيرة واحدة (5 جم)',
  '2_tsp': 'ملعقتين صغيرتين (10 جم)',
  '3_plus_tsp': '3 ملاعق أو أكثر'
};

const SLEEP_MAP = {
  regular_night: 'نوم ليلي منتظم',
  rotating_shifts: 'شفتات عمل متغيرة',
  night_shift: 'شفت ليلي ثابت (سهر)',
  irregular: 'نوم غير منتظم / مضطرب'
};

const SLEEP_HOURS_MAP = {
  less_than_6: 'أقل من 6 ساعات (نوم قليل)',
  '6_7': 'من 6 إلى 7 ساعات',
  '7_8': 'من 7 إلى 8 ساعات (مثالي)',
  more_than_8: 'أكثر من 8 ساعات'
};

const RELIGION_MAP = {
  MUSLIM: 'صيام رمضان (توقيت ليلي)',
  CHRISTIAN: 'صيام مسيحي',
  OTHER: 'نظام اعتيادي (بدون صيام ديني)'
};

const CHRISTIAN_FASTING_MAP = {
  PESCATARIAN_ALLOWED: 'نباتي مع سمك (المفضل)',
  STRICT_VEGAN: 'نباتي صرف (بدون سمك)'
};

const EXCLUDED_FOODS_LABELS = {
  none: 'لا توجد أي حساسية غذائية',
  eggs: 'حساسية بيض',
  dairy_lactose: 'حساسية لاكتوز وألبان',
  gluten_celiac: 'حساسية قمح وجلوتين / سيلياك',
  peanuts_tree_nuts: 'حساسية مكسرات وفول سوداني',
  fish_shellfish: 'حساسية أسماك ومأكولات بحرية',
  soy: 'حساسية فول صويا',
  sesame_seeds: 'حساسية سمسم وطحينة وبذور',
  favism_g6pd: 'بقوليات وأنيميا الفول (G6PD)',
  strawberries_berries: 'حساسية فراولة وتوت',
  tropical_fruits_mango: 'حساسية المانجو والفواكه الاستوائية (مانجو، كيوي)'
};

const CONDITIONS_LABELS = {
  bariatric_surgery: 'تكميم معدة / تحويل مسار',
  diabetes: 'سكري / مقاومة أنسولين',
  favism_g6pd: 'أنيميا الفول (G6PD)',
  renal: 'أمراض الكلى / ضعف وظائف الكلى',
  hepatic: 'أمراض الكبد / دهون على الكبد',
  thyroid: 'اضطرابات الغدة الدرقية',
  gi_tract: 'قولون عصبي / ارتجاع مريء',
  hypertension: 'ضغط دم مرتفع',
  gout: 'نقرس / يوريك أسيد مرتفع'
};

const DIABETES_MAP = {
  type1: 'النوع الأول (Type 1)',
  type2: 'النوع الثاني (Type 2)'
};

const BARIATRIC_CAPACITY_MAP = {
  under_150: 'أقل من 150 جم (وجبات مكثفة صغيرة)',
  '150_200': '150 إلى 200 جم (المعدل القياسي)',
  over_200: 'أكثر من 200 جم'
};

const INJURY_NATURE_MAP = {
  chronic: 'إجهاد تراكمي وتدريجي (Chronic)',
  acute: 'حادث أو صدمة مفاجئة (Acute)'
};

const INJURIES_LABELS = {
  none: 'لا توجد أي إصابات مفصلية',
  knee: 'إصابات الركبة (صليبي / غضروف / صابونة)',
  spine_back: 'العمود الفقري (انزلاق غضروفي قطني / عنقي)',
  shoulder: 'الكتف (اختناق أوتار / كفة مدورة)',
  core: 'الجدار البطني (انفصال عضلي / فتق)',
  elbow_wrist: 'الكوع أو المعصم'
};

const FOCUS_MUSCLES_MAP = {
  upper_chest: 'الصدر العلوي (Upper Chest)',
  lats_width: 'عرض الظهر (Lats Width)',
  side_delts: 'الكتف الجانبي (Side Delts)',
  arms: 'الذراعين (Arms)',
  glutes_legs: 'الجلوتس والأرجل (Glutes / Legs)'
};

const MEDS_SUPPLEMENTS_MAP = {
  none: 'لا أتناول أي مكملات أو أدوية',
  creatine: 'كرياتين مونوهيدرات',
  whey_protein: 'واي بروتين / مكمل بروتين',
  omega3: 'أوميجا 3 (زيت سمك)',
  vitamin_d: 'فيتامين د3',
  multivitamin: 'مالتي فيتامين ومعادن',
  magnesium: 'مغنيسيوم جلايسينات',
  pre_workout: 'مشروب طاقة / كافيين بري وورك آوت',
  hypertension_meds: 'أدوية ضغط الدم',
  diabetes_meds: 'أدوية السكر أو الأنسولين',
  thyroid_meds: 'علاج الغدة الدرقية'
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

  // الخادم يخزّن جسم الطلب كما أرسله الفورم: { answers: { ...الإجابات } }، فبعد فك التشفير تصل
  // الإجابات داخل غلاف ثانٍ. نفك الغلاف هنا كما تفعل loadLatestIntakeAnswers على الخادم.
  const storedAnswers = submission.answers || {};
  const answers = storedAnswers.answers && typeof storedAnswers.answers === 'object' && !Array.isArray(storedAnswers.answers)
    ? { ...storedAnswers, ...storedAnswers.answers }
    : storedAnswers;
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
              <FieldRow label="مستوى الحركة اليومية (NEAT)" value={answers.neat_level} dictionary={ACTIVITY_MAP} />
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
              <FieldRow label="سعة الوجبة (جرام)" value={answers.medical_conditions?.bariatric?.meal_capacity_grams} dictionary={BARIATRIC_CAPACITY_MAP} />
              <FieldRow label="متلازمة الإغراق (Dumping)" value={answers.medical_conditions?.bariatric?.dumping_syndrome} />
              <FieldRow label="تكيس المبايض (PCOS)" value={answers.medical_conditions?.female_cases?.is_pcos} />
              <FieldRow label="مرضعة" value={answers.medical_conditions?.female_cases?.is_lactating} />
              <FieldRow label="ولادة حديثة" value={answers.medical_conditions?.female_cases?.is_postpartum} />
              <FieldRow label="قائمة الأدوية والمكملات" value={answers.current_meds_supplements_list} dictionary={MEDS_SUPPLEMENTS_MAP} />
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
              <FieldRow label="متوسط ساعات النوم" value={answers.sleep_schedule?.average_hours} dictionary={SLEEP_HOURS_MAP} />
              <FieldRow label="ساعة النوم المعتادة" value={answers.sleep_schedule?.bedtime_hour} />
            </Section>

            <Section title="5) التدريب">
              <FieldRow label="بيئة التدريب" value={answers.training_environment} dictionary={ENVIRONMENT_MAP} />
              <FieldRow label="أيام التمرين في الأسبوع" value={answers.training_logistics?.days_per_week} />
              <FieldRow label="مستوى الخبرة" value={answers.training_logistics?.experience_level} dictionary={EXPERIENCE_MAP} />
              <FieldRow label="يمارس رياضة أخرى" value={answers.training_logistics?.has_other_sports} />
              <FieldRow label="اسم الرياضة الأخرى" value={answers.training_logistics?.sports_name} />
              <FieldRow label="ساعات الرياضة الأخرى" value={answers.training_logistics?.hours_per_week} />
              <FieldRow label="التدريب مؤخراً" value={answers.recent_training} dictionary={RECENT_TRAINING_MAP} />
              <FieldRow label="عضلات التركيز" value={answers.focus_muscles} dictionary={FOCUS_MUSCLES_MAP} />
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
