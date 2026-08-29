import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveSession } from '../utils/auth';
import { generateInitialPlan } from '../utils/onboardingPlanGeneratorEngine';

export const MEDICAL_CONDITIONS_OPTIONS = [
  // 1. الغدد والأيض والسكري
  { id: 'TYPE_1_DIABETES', label: 'سكري نوع أول (أنسولين)' },
  { id: 'TYPE_2_DIABETES_ORAL', label: 'سكري نوع ثانٍ (أقراص)' },
  { id: 'TYPE_2_DIABETES_INSULIN', label: 'سكري نوع ثاني (حقن أنسولين)' },
  { id: 'PCOS_IR', label: 'مقاومة إنسولين / تكيس مبايض' },
  { id: 'HYPOTHYROIDISM', label: 'خمول الغدة الدرقية' },
  { id: 'FATTY_LIVER', label: 'كبد دهني / ارتفاع إنزيمات الكبد' },

  // 2. القلب والأوعية والدم
  { id: 'HYPERTENSION', label: 'ارتفاع ضغط الدم' },
  { id: 'BLOOD_THINNERS', label: 'أدوية السيولة ومضادات التجلط' },
  { id: 'SEVERE_ANEMIA', label: 'أنيميا حادة / نقص مخزون الحديد' },

  // 3. الجهاز الهضمي والعمليات
  { id: 'BARIATRIC_SURGERY', label: 'جراحة سمنة (تكميم / تحويل مسار)' },
  { id: 'H_PYLORI_GASTRITIS', label: 'جرثومة أو قرحة المعدة / ارتجاع' },
  { id: 'IBS', label: 'متلازمة القولون العصبي' },
  { id: 'GERD_REFLUX', label: 'ارتجاع المريء' },
  { id: 'CHOLECYSTECTOMY', label: 'استئصال المرارة سابقاً' },

  // 4. الكلى والمسالك
  { id: 'KIDNEY_STONES', label: 'حصوات الكلى والأوكسالات' },
  { id: 'RENAL_INSUFFICIENCY', label: 'قصور وظائف الكلى' },
  { id: 'GOUT', label: 'داء النقرس / أملاح اليوريك أسيد' },

  // 5. الحالات النادرة والخاصة
  { id: 'CELIAC_DISEASE', label: 'مرض السيلياك (حساسية الجلوتين التامة)' },
  { id: 'OSTEOPOROSIS', label: 'هشاشة أو لين العظام' },
  { id: 'G6PD_DEFICIENCY', label: 'أنيميا الفول (نقص إنزيم G6PD)' },
  { id: 'BRONCHIAL_ASTHMA', label: 'حساسية الصدر / الربو القصبي' },
  { id: 'GLP1_USER', label: 'حقن التخسيس (Ozempic / Mounjaro)' },
  { id: 'ROACCUTANE_USER', label: 'علاج الروكتان لحب الشباب' },
  { id: 'CORTICOSTEROIDS', label: 'علاج الكورتيزون المزمن' },

  // 6. المفاصل، الفتق، والسيدات
  { id: 'LOWER_BACK_PAIN', label: 'انزلاق غضروفي / آلام أسفل الظهر' },
  { id: 'SHOULDER_IMPINGEMENT', label: 'نغزة أو التهاب أوتار الكتف' },
  { id: 'PATELLAR_TENDINITIS', label: 'خشونة أو آلام صابونة الركبة' },
  { id: 'HERNIA_VARICOSE', label: 'فتق جدار البطن أو دوالي الساقين' },
  { id: 'LACTATION', label: 'مرحلة الرضاعة الطبيعية' },
  { id: 'NONE_HEALTHY', label: 'سليم تماماً ولا أعاني من أي عارض صحي' }
];

export const SPLIT_PREFERENCES = [
  { id: 'AUTO', label: 'تحديد ذكي تلقائي (موصى به)', desc: 'يختار النظام أفضل تقسيم مناسب لأيام تمرينك وهدفك' },
  { id: 'ARNOLD', label: 'التقسيم الكلاسيكي (Arnold Split 6x)', desc: 'تركيز مكثف على الأذرع والأكتاف والصدر والظهر' },
  { id: 'UL_ARMS', label: 'علوي / سفلي + ذراعين (UL+Arms 5x)', desc: 'تطور شامل متوازن مع يوم مخصص لنقاط الضعف' },
  { id: 'FEMALE_GLUTE', label: 'تخصص الجلوتس والأرجل (Glute Hypertrophy)', desc: 'تركيز فسيولوجي على الجزء السفلي وتناسق القوام' },
  { id: 'UPPER_LOWER', label: 'علوي / سفلي كلاسيكي (Upper/Lower 4x)', desc: 'استشفاء مثالي وبناء عضلي عالي الكفاءة' },
  { id: 'PPL', label: 'دفع / سحب / أرجل (PPL 3x-6x)', desc: 'عزل المجموعات العضلية المترابطة حركياً' },
  { id: 'FULL_BODY', label: 'تمرين شامل لكامل الجسم (Full Body 2x-3x)', desc: 'أعلى تردد بنائي بأقل عدد أيام أسبوعية' }
];

export default function ClientOnboardingForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    gender: 'MALE',
    age: 26,
    heightCm: 175,
    weightKg: 78,
    activityLevel: 'LIGHT',
    goal: 'FAT_LOSS',
    trainingDaysPerWeek: 4,
    experienceLevel: 'BEGINNER',
    trainingEnvironment: 'GYM',
    homeEquipment: ['BODYWEIGHT_ONLY'],
    preferredSplit: 'AUTO',
    preferredWorkoutTime: 'EVENING',
    religion: 'MUSLIM',
    christianFastingStyle: 'PESCATARIAN_ALLOWED',
    selectedConditions: ['NONE_HEALTHY'],
    posturalIssues: [],
    pregnancyTrimester: 'NONE',
    benchPressWeightKg: '',
    benchPressReps: '',
    squatWeightKg: '',
    squatReps: '',
    neckCircumferenceCm: '',
    waistCircumferenceCm: '',
    hipCircumferenceCm: ''
  });

  const availableHomeTools = [
    { id: 'DUMBBELLS', label: 'دمبلز بأوزان محددة' },
    { id: 'BANDS', label: 'أشرطة مقاومة مطاطية (Resistance Bands)' },
    { id: 'BARBELL', label: 'بار حر وأوزان طارات' },
    { id: 'TREADMILL', label: 'مشاية كهربائية منزلية (Treadmill)' },
    { id: 'STATIONARY_BIKE', label: 'دراجة رياضية ثابتة (Stationary Bike)' },
    { id: 'PULLUP_BAR', label: 'عقلة منزلية / حبال معلقة TRX' },
    { id: 'MULTI_GYM', label: 'جهاز مالتي هوم جيم' },
    { id: 'BODYWEIGHT_ONLY', label: 'وزن الجسم فقط' }
  ];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleHomeTool = (toolId) => {
    setFormData(prev => {
      let current = [...prev.homeEquipment];
      if (toolId === 'BODYWEIGHT_ONLY') {
        return { ...prev, homeEquipment: ['BODYWEIGHT_ONLY'] };
      }
      current = current.filter(t => t !== 'BODYWEIGHT_ONLY');
      if (current.includes(toolId)) {
        const next = current.filter(t => t !== toolId);
        return { ...prev, homeEquipment: next.length > 0 ? next : ['BODYWEIGHT_ONLY'] };
      } else {
        return { ...prev, homeEquipment: [...current, toolId] };
      }
    });
  };

  const toggleCondition = (condId) => {
    setFormData(prev => {
      let current = [...prev.selectedConditions];
      if (condId === 'NONE_HEALTHY') {
        return { ...prev, selectedConditions: ['NONE_HEALTHY'] };
      }
      current = current.filter(c => c !== 'NONE_HEALTHY');
      if (current.includes(condId)) {
        const next = current.filter(c => c !== condId);
        return { ...prev, selectedConditions: next.length > 0 ? next : ['NONE_HEALTHY'] };
      } else {
        return { ...prev, selectedConditions: [...current, condId] };
      }
    });
  };

  const togglePosturalIssue = (issueId) => {
    setFormData(prev => {
      const current = prev.posturalIssues.includes(issueId)
        ? prev.posturalIssues.filter(i => i !== issueId)
        : [...prev.posturalIssues, issueId];
      return { ...prev, posturalIssues: current };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('يرجى إدخال الاسم بالكامل');
      return;
    }
    if (!formData.phone.trim()) {
      setError('يرجى إدخال رقم الهاتف للتواصل');
      return;
    }

    try {
      setLoading(true);

      const conditionsToPass = formData.selectedConditions.filter(c => c !== 'NONE_HEALTHY');

      const plan = generateInitialPlan({
        name: formData.name,
        gender: formData.gender,
        age: Number(formData.age),
        weightKg: Number(formData.weightKg),
        heightCm: Number(formData.heightCm),
        activityLevel: formData.activityLevel,
        goal: formData.goal,
        trainingDaysPerWeek: Number(formData.trainingDaysPerWeek),
        experienceLevel: formData.experienceLevel,
        environment: formData.trainingEnvironment,
        homeEquipment: formData.homeEquipment,
        splitPreference: formData.preferredSplit,
        preferredWorkoutTime: formData.preferredWorkoutTime,
        religion: formData.religion,
        christianFastingStyle: formData.christianFastingStyle,
        medicalConditions: conditionsToPass,
        posturalIssues: formData.posturalIssues,
        pregnancyTrimester: formData.gender === 'FEMALE' ? formData.pregnancyTrimester : 'NONE',
        benchPressWeightKg: formData.benchPressWeightKg ? Number(formData.benchPressWeightKg) : undefined,
        squatWeightKg: formData.squatWeightKg ? Number(formData.squatWeightKg) : undefined,
        neckCircumferenceCm: formData.neckCircumferenceCm ? Number(formData.neckCircumferenceCm) : undefined,
        waistCircumferenceCm: formData.waistCircumferenceCm ? Number(formData.waistCircumferenceCm) : undefined,
        hipCircumferenceCm: formData.hipCircumferenceCm ? Number(formData.hipCircumferenceCm) : undefined
      });

      const clientSession = {
        id: 'client_' + Date.now(),
        client_code: String(Math.floor(1000 + Math.random() * 9000)),
        name: formData.name,
        phone: formData.phone,
        gender: formData.gender,
        age: Number(formData.age),
        weight_kg: Number(formData.weightKg),
        height_cm: Number(formData.heightCm),
        goal: formData.goal,
        initial_plan: plan,
        selected_conditions: conditionsToPass,
        postural_issues: formData.posturalIssues,
        training_environment: formData.trainingEnvironment,
        home_equipment: formData.homeEquipment,
        experience_level: formData.experienceLevel,
        benchmarks: {
          bench_kg: formData.benchPressWeightKg || null,
          squat_kg: formData.squatWeightKg || null
        },
        circumferences: {
          neck: formData.neckCircumferenceCm || null,
          waist: formData.waistCircumferenceCm || null,
          hip: formData.hipCircumferenceCm || null
        },
        package_info: {
          tier: 'MAX',
          duration_months: 4,
          status: 'ACTIVE',
          days_remaining: 120
        },
        onboarding_completed: true,
        created_at: new Date().toISOString()
      };

      saveSession(clientSession);
      navigate('/client/today');
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء إنشاء الخطة');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: '#FFFFFF',
    color: '#0F172A',
    border: '1.5px solid #CBD5E1',
    borderRadius: '12px',
    padding: '10px 14px',
    fontSize: '0.88rem',
    fontWeight: '500',
    width: '100%',
    outline: 'none',
    boxShadow: 'none',
    transition: 'border-color 0.2s ease'
  };

  const labelStyle = {
    fontSize: '0.82rem',
    fontWeight: '700',
    color: '#334155',
    marginBottom: '6px',
    display: 'block'
  };

  const sectionHeaderStyle = {
    fontSize: '0.98rem',
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: '14px',
    paddingBottom: '8px',
    borderBottom: '1.5px solid #F1F5F9',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#FAFBFC', padding: '30px 12px', fontFamily: 'Alexandria, Cairo, sans-serif' }}>
      <div style={{ maxWidth: '840px', margin: '0 auto', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '28px', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.05)' }}>
        
        {/* Header */}
        <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'inline-block', background: '#E0F2FE', color: '#0284C7', padding: '3px 10px', borderRadius: '8px', fontSize: '0.74rem', fontWeight: '800', marginBottom: '6px' }}>
              Z Coaching Interactive Intake
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0F172A', margin: 0 }}>
              استمارة التقييم البيولوجي والبدني التفاعلية
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '4px 0 0 0' }}>
              نظام الإظهار التدريجي الذكي والمعايرة الإكلينيكية الحتمية للبرامج
            </p>
          </div>
          <span style={{ background: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '10px', fontSize: '0.76rem', fontWeight: '800', fontFamily: 'monospace' }}>
            V2026.OMNI
          </span>
        </div>

        {error && (
          <div style={{ background: '#FFF1F2', border: '1.5px solid #FECDD3', color: '#BE123C', padding: '12px 16px', borderRadius: '14px', fontSize: '0.84rem', fontWeight: '700', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* 1. البيانات الشخصية والقياسات الأساسية */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '20px', borderRadius: '18px' }}>
            <div style={sectionHeaderStyle}>
              <span style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#0284C7', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem' }}>1</span>
              <span>البيانات الشخصية والقياسات الأساسية</span>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label style={labelStyle}>الاسم بالكامل:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد محمود"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div className="col-md-6">
                <label style={labelStyle}>رقم الهاتف (WhatsApp):</label>
                <input
                  type="tel"
                  required
                  placeholder="مثال: 01012345678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div className="col-6 col-md-3">
                <label style={labelStyle}>النوع:</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  style={inputStyle}
                >
                  <option value="MALE">ذكر</option>
                  <option value="FEMALE">أنثى</option>
                </select>
              </div>

              <div className="col-6 col-md-3">
                <label style={labelStyle}>العمر:</label>
                <input
                  type="number"
                  required
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div className="col-6 col-md-3">
                <label style={labelStyle}>الطول (سم):</label>
                <input
                  type="number"
                  required
                  value={formData.heightCm}
                  onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div className="col-6 col-md-3">
                <label style={labelStyle}>الوزن الحالي (كجم):</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.weightKg}
                  onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div className="col-md-6">
                <label style={labelStyle}>الهدف الرئيسي من الخطة:</label>
                <select
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  style={inputStyle}
                >
                  <option value="FAT_LOSS">خسارة دهون متوازنة (Fat Loss)</option>
                  <option value="AGGRESSIVE_CUT">خسارة دهون سريعة وتنشيف مكثف</option>
                  <option value="LEAN_BULK">بناء كتلة عضلية صافية (Lean Bulk)</option>
                  <option value="MAINTENANCE">تثبيت الوزن وإعادة تشكيل القوام</option>
                </select>
              </div>

              <div className="col-md-6">
                <label style={labelStyle}>مستوى النشاط الحركي اليومي:</label>
                <select
                  value={formData.activityLevel}
                  onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value })}
                  style={inputStyle}
                >
                  <option value="SEDENTARY">مكتبي خامل (قليل الحركة)</option>
                  <option value="LIGHT">نشاط خفيف (مشي بسيط خلال اليوم)</option>
                  <option value="MODERATE">نشاط متوسط (حركة مستمرة / عمل ميداني)</option>
                  <option value="VERY_ACTIVE">نشاط عالي جداً (مجهود بدني شاق)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. بيئة التدريب والأدوات المتاحة */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '20px', borderRadius: '18px' }}>
            <div style={sectionHeaderStyle}>
              <span style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#0284C7', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem' }}>2</span>
              <span>بيئة التدريب والأدوات المتاحة</span>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <label style={labelStyle}>أين تتمرن؟</label>
                <select
                  value={formData.trainingEnvironment}
                  onChange={(e) => setFormData({ ...formData, trainingEnvironment: e.target.value })}
                  style={inputStyle}
                >
                  <option value="GYM">جيم متكامل (Full Commercial Gym)</option>
                  <option value="HOME">المنزل (Home Setup)</option>
                </select>
              </div>

              <div className="col-md-4">
                <label style={labelStyle}>مستوى خبرتك التدريبية:</label>
                <select
                  value={formData.experienceLevel}
                  onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                  style={inputStyle}
                >
                  <option value="BEGINNER">مبتدئ (أقل من 6 أشهر)</option>
                  <option value="INTERMEDIATE">متوسط (من 6 أشهر إلى سنتين)</option>
                  <option value="ADVANCED">متقدم (أكثر من سنتين)</option>
                </select>
              </div>

              <div className="col-md-4">
                <label style={labelStyle}>عدد أيام التمرين المتاحة أسبوعياً:</label>
                <select
                  value={formData.trainingDaysPerWeek}
                  onChange={(e) => setFormData({ ...formData, trainingDaysPerWeek: Number(e.target.value) })}
                  style={inputStyle}
                >
                  <option value="3">3 أيام أسبوعياً</option>
                  <option value="4">4 أيام أسبوعياً</option>
                  <option value="5">5 أيام أسبوعياً</option>
                  <option value="6">6 أيام أسبوعياً</option>
                </select>
              </div>
            </div>

            {/* الأدوات المنزلية المتوفرة في حال اختيار المنزل */}
            {formData.trainingEnvironment === 'HOME' && (
              <div style={{ background: '#FFFFFF', border: '1.5px dashed #0284C7', padding: '16px', borderRadius: '14px', marginTop: '12px' }}>
                <label style={{ ...labelStyle, color: '#0284C7' }}>الأدوات المتوفرة لديك بالمنزل (يمكنك اختيار أكثر من أداة):</label>
                <div className="row g-2 mt-1">
                  {availableHomeTools.map(tool => {
                    const isSelected = formData.homeEquipment.includes(tool.id);
                    return (
                      <div key={tool.id} className="col-sm-6 col-md-4">
                        <button
                          type="button"
                          onClick={() => toggleHomeTool(tool.id)}
                          style={{
                            width: '100%',
                            textAlign: 'right',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            fontSize: '0.8rem',
                            fontWeight: isSelected ? '800' : '600',
                            background: isSelected ? '#E0F2FE' : '#F8FAFC',
                            color: isSelected ? '#0284C7' : '#334155',
                            border: '1.5px solid ' + (isSelected ? '#0284C7' : '#E2E8F0'),
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <span>{tool.label}</span>
                          <span style={{ fontSize: '0.85rem' }}>{isSelected ? '' : '+'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* أرقام البنش والسكوات للمتقدمين */}
            {formData.experienceLevel !== 'BEGINNER' && formData.trainingEnvironment === 'GYM' && (
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '14px', marginTop: '14px' }}>
                <label style={{ ...labelStyle, color: '#0F172A' }}>أرقام القوة السابقة لمعايرة أوزان أول جلسة تلقائياً:</label>
                <div className="row g-3 mt-1">
                  <div className="col-6">
                    <label style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: '700' }}>أعلى وزن بنش برس حر (كجم):</label>
                    <input
                      type="number"
                      placeholder="مثال: 70"
                      value={formData.benchPressWeightKg}
                      onChange={(e) => setFormData({ ...formData, benchPressWeightKg: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div className="col-6">
                    <label style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: '700' }}>أعلى وزن سكوات حر (كجم):</label>
                    <input
                      type="number"
                      placeholder="مثال: 90"
                      value={formData.squatWeightKg}
                      onChange={(e) => setFormData({ ...formData, squatWeightKg: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. الحالات الصحية وجودار الحماية الإكلينيكي */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '20px', borderRadius: '18px' }}>
            <div style={sectionHeaderStyle}>
              <span style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#059669', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem' }}>3</span>
              <span>السجل الطبي وجدار الحماية السريري (Clinical Guardrails)</span>
            </div>

            <p style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '14px' }}>
              حدد أي عوارض صحية أو إصابات سابقة لتطبيق جدران الحماية واستبعاد التمارين والأغذية المحظورة تلقائياً:
            </p>

            <div className="row g-2">
              {MEDICAL_CONDITIONS_OPTIONS.map(cond => {
                const isSelected = formData.selectedConditions.includes(cond.id);
                return (
                  <div key={cond.id} className="col-sm-6 col-md-4">
                    <button
                      type="button"
                      onClick={() => toggleCondition(cond.id)}
                      style={{
                        width: '100%',
                        textAlign: 'right',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        fontSize: '0.78rem',
                        fontWeight: isSelected ? '800' : '600',
                        background: isSelected ? (cond.id === 'NONE_HEALTHY' ? '#DCFCE7' : '#FEF3C7') : '#FFFFFF',
                        color: isSelected ? (cond.id === 'NONE_HEALTHY' ? '#15803D' : '#92400E') : '#334155',
                        border: '1.5px solid ' + (isSelected ? (cond.id === 'NONE_HEALTHY' ? '#16A34A' : '#F59E0B') : '#E2E8F0'),
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span>{cond.label}</span>
                      <span>{isSelected ? '' : '+'}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* خيارات الحمل للإناث */}
            {formData.gender === 'FEMALE' && (
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '14px', borderRadius: '12px', marginTop: '16px' }}>
                <label style={labelStyle}>حالة الحمل أو الرضاعة الحالية:</label>
                <select
                  value={formData.pregnancyTrimester}
                  onChange={(e) => setFormData({ ...formData, pregnancyTrimester: e.target.value })}
                  style={inputStyle}
                >
                  <option value="NONE">غير حامل وغير مرضعة</option>
                  <option value="FIRST">حامل - الثلث الأول (الأسبوع 1 إلى 12)</option>
                  <option value="SECOND">حامل - الثلث الثاني (الأسبوع 13 إلى 26)</option>
                  <option value="THIRD">حامل - الثلث الثالث (الأسبوع 27 حتى الولادة)</option>
                  <option value="POSTPARTUM_LACTATING">مرحلة ما بعد الولادة والرضاعة الطبيعية</option>
                </select>
              </div>
            )}
          </div>

          {/* 4. تفضيلات تقسيم التمارين ونمط الصيام */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '20px', borderRadius: '18px' }}>
            <div style={sectionHeaderStyle}>
              <span style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#0284C7', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem' }}>4</span>
              <span>تفضيلات الروتين ونمط الصيام</span>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label style={labelStyle}>التقسيم التدريبي المفضل:</label>
                <select
                  value={formData.preferredSplit}
                  onChange={(e) => setFormData({ ...formData, preferredSplit: e.target.value })}
                  style={inputStyle}
                >
                  {SPLIT_PREFERENCES.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label style={labelStyle}>التوقيت المفضل للتمرين:</label>
                <select
                  value={formData.preferredWorkoutTime}
                  onChange={(e) => setFormData({ ...formData, preferredWorkoutTime: e.target.value })}
                  style={inputStyle}
                >
                  <option value="MORNING">صباحاً (أعلى طاقة وبداية اليوم)</option>
                  <option value="AFTERNOON">عصراً (بعد وجبة الغداء بساعتين)</option>
                  <option value="EVENING">مساءً (بعد انتهاء ساعات العمل)</option>
                  <option value="NIGHT">ليلاً (قبل النوم)</option>
                </select>
              </div>

              <div className="col-md-6">
                <label style={labelStyle}>الديانة ونمط الصيام الديني التلقائي:</label>
                <select
                  value={formData.religion}
                  onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                  style={inputStyle}
                >
                  <option value="MUSLIM">مسلم (مزامنة تلقائية مع صيام شهر رمضان المبارك)</option>
                  <option value="CHRISTIAN">مسيحي (مزامنة تلقائية مع الصيام الكبير والصغير)</option>
                  <option value="OTHER">عام / نظام غذائي مستمر طوال العام</option>
                </select>
              </div>

              {formData.religion === 'CHRISTIAN' && (
                <div className="col-md-6">
                  <label style={labelStyle}>نمط الصيام المسيحي المتبع:</label>
                  <select
                    value={formData.christianFastingStyle}
                    onChange={(e) => setFormData({ ...formData, christianFastingStyle: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="PESCATARIAN_ALLOWED">صيام نباتي مع السماح بالأسماك والمأكولات البحرية</option>
                    <option value="STRICT_VEGAN">صيام نباتي صارم (Vegan) بدون أي أسماك أو ألبان</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* زر الاعتماد والبدء */}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '16px',
              padding: '16px 24px',
              fontSize: '1rem',
              fontWeight: '900',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(2, 132, 199, 0.3)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {loading ? 'جاري بناء ومعايرة الخطة بالذكاء الاصطناعي...' : 'إنشاء الخطة المخصصة وبدء البرنامج فوراً'}
          </button>

        </form>
      </div>
    </div>
  );
}
