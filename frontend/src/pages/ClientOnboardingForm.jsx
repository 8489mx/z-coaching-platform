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
  { id: 'NONE_HEALTHY', label: 'سليم تماماً ولا أعاني من أي عارض ✔' }
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
    experienceLevel: 'BEGINNER', // 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
    trainingEnvironment: 'GYM', // 'GYM' | 'HOME'
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

  const toggleHomeTool = (id) => {
    let current = [...formData.homeEquipment];
    if (id === 'BODYWEIGHT_ONLY') {
      setFormData({ ...formData, homeEquipment: ['BODYWEIGHT_ONLY'] });
      return;
    }
    current = current.filter(t => t !== 'BODYWEIGHT_ONLY');
    if (current.includes(id)) {
      current = current.filter(t => t !== id);
    } else {
      current.push(id);
    }
    setFormData({ ...formData, homeEquipment: current.length ? current : ['BODYWEIGHT_ONLY'] });
  };

  const toggleCondition = (id) => {
    let updated = formData.selectedConditions.filter(c => c !== 'NONE_HEALTHY');
    if (id === 'NONE_HEALTHY') {
      updated = ['NONE_HEALTHY'];
    } else if (updated.includes(id)) {
      updated = updated.filter(c => c !== id);
    } else {
      updated.push(id);
    }
    setFormData({ ...formData, selectedConditions: updated.length ? updated : ['NONE_HEALTHY'] });
  };

  const togglePosturalIssue = (id) => {
    let updated = [...formData.posturalIssues];
    if (updated.includes(id)) {
      updated = updated.filter(p => p !== id);
    } else {
      updated.push(id);
    }
    setFormData({ ...formData, posturalIssues: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('يرجى إدخال اسم المتدرب بالكامل');
      return;
    }
    if (!formData.phone.trim()) {
      setError('يرجى إدخال رقم هاتف المتدرب');
      return;
    }

    try {
      setLoading(true);

      const conditionsToPass = formData.selectedConditions.filter(c => c !== 'NONE_HEALTHY');
      if (formData.gender === 'FEMALE' && formData.pregnancyTrimester === 'POSTPARTUM_LACTATING') {
        if (!conditionsToPass.includes('LACTATION')) conditionsToPass.push('LACTATION');
      }

      const planResult = generateInitialPlan({
        name: formData.name.trim(),
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
        benchPressWeightKg: formData.benchPressWeightKg || null,
        squatWeightKg: formData.squatWeightKg || null,
        preferredWorkoutTime: formData.preferredWorkoutTime,
        medicalFlags: conditionsToPass,
        medicalConditions: conditionsToPass,
        posturalIssues: formData.posturalIssues,
        pregnancyTrimester: formData.pregnancyTrimester,
        splitPreference: formData.preferredSplit
      });

      const clientCode = 'Z-' + Math.floor(1000 + Math.random() * 9000);
      const clientSession = {
        client_code: clientCode,
        phone_number: formData.phone.trim(),
        full_name: formData.name.trim(),
        gender: formData.gender,
        goal: formData.goal,
        daily_targets: planResult.daily_targets,
        training_split: planResult.training_split,
        training_phase: planResult.training_phase,
        clinical_profile: planResult.clinical_profile,
        rehab_routine: planResult.rehab_routine,
        cardio_protocol: planResult.cardio_protocol,
        clinical_notes: planResult.clinical_notes,
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

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-4">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-emerald-400 m-0">استمارة التقييم البيولوجي والبدني التفاعلية</h1>
              <p className="text-xs md:text-sm text-slate-400 mt-1 mb-0">نظام الإظهار التدريجي الذكي والمعايرة الإكلينيكية الحتمية</p>
            </div>
            <span className="badge bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-2 rounded-xl text-xs font-monospace">
              V2026.OMNI
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* 1. البيانات الشخصية والقياسات */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-slate-200 m-0">1. البيانات الشخصية والقياسات الأساسية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">الاسم بالكامل:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد محمود"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">رقم الهاتف (WhatsApp):</label>
                <input
                  type="tel"
                  required
                  placeholder="مثال: 01012345678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">النوع:</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="MALE">ذكر</option>
                  <option value="FEMALE">أنثى</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">العمر:</label>
                <input
                  type="number"
                  required
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">الطول (سم):</label>
                <input
                  type="number"
                  required
                  value={formData.heightCm}
                  onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">الوزن الحالي (كجم):</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.weightKg}
                  onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">الهدف الرئيسي:</label>
                <select
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="FAT_LOSS">خسارة دهون متوازنة</option>
                  <option value="AGGRESSIVE_CUT">خسارة دهون سريعة (عجز مكثف)</option>
                  <option value="LEAN_BULK">بناء عضلي نقي (Lean Bulk)</option>
                  <option value="MAINTENANCE">تثبيت الوزن وتحسين القوام</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">مستوى النشاط اليومي:</label>
                <select
                  value={formData.activityLevel}
                  onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="SEDENTARY">خامل (عمل مكتبي / قلة حركة)</option>
                  <option value="LIGHT">خفيف (مشي بسيط 5,000 خطوة)</option>
                  <option value="MODERATE">متوسط (حركة يومية 8,000+ خطوة)</option>
                  <option value="HEAVY">نشط جداً (عمل بدني شاق)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">أيام التمرين الأسبوعية:</label>
                <select
                  value={formData.trainingDaysPerWeek}
                  onChange={(e) => setFormData({ ...formData, trainingDaysPerWeek: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="2">يومان أسبوعياً</option>
                  <option value="3">3 أيام أسبوعياً</option>
                  <option value="4">4 أيام أسبوعياً</option>
                  <option value="5">5 أيام أسبوعياً</option>
                  <option value="6">6 أيام أسبوعياً</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. المستوى التدريبي ومعايرة الأوزان */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-3">
            <label className="text-xs font-bold text-slate-300 block">2. مستواك في تمارين المقاومة:</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {[
                { id: 'BEGINNER', label: 'مبتدئ (أول مرة أتمرن / عودة بعد انقطاع)' },
                { id: 'INTERMEDIATE', label: 'متوسط (6 أشهر - سنتين)' },
                { id: 'ADVANCED', label: 'متقدم (أكثر من سنتين)' }
              ].map(lvl => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, experienceLevel: lvl.id })}
                  className={'p-3 rounded-xl border text-xs font-bold transition text-center ' + (
                    formData.experienceLevel === lvl.id
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-950 border-slate-700 text-slate-300'
                  )}
                >
                  {lvl.label}
                </button>
              ))}
            </div>

            {/* يظهر فقط للمتوسط والمتقدم */}
            {formData.experienceLevel !== 'BEGINNER' && (
              <div className="bg-slate-950/80 border border-amber-900/40 p-4 rounded-xl space-y-3 mt-3">
                <span className="text-xs font-bold text-amber-400 block">معايرة أوزان البداية (اختياري لمعايرة الجلسة الأولى بنسبة 75%):</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">أقصى وزن معتاد بالبنش برس (كجم):</label>
                    <input
                      type="number"
                      placeholder="مثال: 70"
                      value={formData.benchPressWeightKg}
                      onChange={(e) => setFormData({ ...formData, benchPressWeightKg: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">أقصى وزن طارات بالسكوات (كجم):</label>
                    <input
                      type="number"
                      placeholder="مثال: 50"
                      value={formData.squatWeightKg}
                      onChange={(e) => setFormData({ ...formData, squatWeightKg: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. بيئة التدريب والأدوات المنزلية المتعددة */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-3">
            <label className="text-xs font-bold text-slate-300 block">3. مكان التمرين المفضل:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, trainingEnvironment: 'GYM' })}
                className={'p-3 rounded-xl border text-xs font-bold transition text-center ' + (
                  formData.trainingEnvironment === 'GYM' ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-950 border-slate-700 text-slate-300'
                )}
              >
                في الجيم (أجهزة وأوزان متكاملة)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, trainingEnvironment: 'HOME' })}
                className={'p-3 rounded-xl border text-xs font-bold transition text-center ' + (
                  formData.trainingEnvironment === 'HOME' ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-950 border-slate-700 text-slate-300'
                )}
              >
                في البيت (أدوات منزلية / وزن الجسم)
              </button>
            </div>

            {/* أدوات المنزل المتعددة */}
            {formData.trainingEnvironment === 'HOME' && (
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-2 mt-2">
                <span className="text-xs font-bold text-slate-300 block">حدد الأدوات المتوفرة لديك بالمنزل (يمكن اختيار أكثر من أداة):</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {availableHomeTools.map(tool => (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => toggleHomeTool(tool.id)}
                      className={'p-2.5 rounded-xl border text-xs text-right transition flex items-center justify-between ' + (
                        formData.homeEquipment.includes(tool.id)
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      )}
                    >
                      <span>{tool.label}</span>
                      <span className="text-emerald-400 font-bold">{formData.homeEquipment.includes(tool.id) ? '✓' : ''}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. الحالة الفسيولوجية للسيدات */}
          {formData.gender === 'FEMALE' && (
            <div className="bg-rose-950/20 border border-rose-900/40 p-4 rounded-2xl space-y-3">
              <span className="text-xs font-bold text-rose-300 block">4. الحالة الفسيولوجية للسيدات:</span>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { id: 'NONE', label: 'طبيعي / غير حامل' },
                  { id: 'FIRST', label: 'حمل (الثلث الأول: 1-12 أسبوع)' },
                  { id: 'SECOND', label: 'حمل (الثلث الثاني: 13-26 أسبوع)' },
                  { id: 'THIRD', label: 'حمل (الثلث الثالث: 27+ أسبوع)' },
                  { id: 'POSTPARTUM_LACTATING', label: 'مرحلة الرضاعة الطبيعية' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, pregnancyTrimester: opt.id })}
                    className={'p-2.5 rounded-xl border text-xs font-bold text-center ' + (
                      formData.pregnancyTrimester === opt.id
                        ? 'bg-rose-500 text-slate-950 border-rose-400'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 5. التقويم الموسمي والصيام العقائدي */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-3">
            <label className="text-xs font-bold text-slate-300 block">5. نمط الصيام والتقويم العقائدي:</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <select
                  value={formData.religion}
                  onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="MUSLIM">مسلم (صيام رمضان المبارك والنوافل)</option>
                  <option value="CHRISTIAN">مسيحي (مواسم الصيام الكبير والميلاد)</option>
                  <option value="NONE">النمط اليومي المعتاد (Non-Fasting Baseline)</option>
                </select>
              </div>
              {formData.religion === 'CHRISTIAN' && (
                <div>
                  <select
                    value={formData.christianFastingStyle}
                    onChange={(e) => setFormData({ ...formData, christianFastingStyle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="PESCATARIAN_ALLOWED">صيام نباتي مع السماح بالأسماك والمأكولات البحرية</option>
                    <option value="STRICT_VEGAN">صيام نباتي صرف بدون أسماك (Strict Vegan)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* 6. تفضيلات التقسيم التدريبي */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-3">
            <label className="text-xs font-bold text-slate-300 block">6. التقسيم التدريبي المفضل:</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {SPLIT_PREFERENCES.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, preferredSplit: s.id })}
                  className={'p-3 rounded-xl border text-right transition ' + (
                    formData.preferredSplit === s.id
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  )}
                >
                  <div className="text-xs font-bold text-white">{s.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 7. تصحيح انحرافات القوام */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-3">
            <label className="text-xs font-bold text-slate-300 block">7. تصحيح انحرافات القوام (اختر ما ينطبق لحقن التمارين التصحيحية):</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { id: 'ANTERIOR_PELVIC_TILT', label: 'ميل الحوض الأمامي (Anterior Pelvic Tilt - بروز البطن وتقوس الظهر)' },
                { id: 'ROUNDED_SHOULDERS', label: 'تقوس الأكتاف للأمام وانحناء الرقبة (Rounded Shoulders / Kyphosis)' }
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePosturalIssue(p.id)}
                  className={'p-3 rounded-xl border text-right transition flex items-center justify-between ' + (
                    formData.posturalIssues.includes(p.id)
                      ? 'bg-indigo-950 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  )}
                >
                  <span className="text-xs font-semibold">{p.label}</span>
                  <span className="text-xs font-bold">{formData.posturalIssues.includes(p.id) ? '✓' : ''}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 8. مصفوفة الحالات الصحية والإصابات (26+ حالة بنظام الـ Chips المتعددة) */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="d-flex align-items-center justify-content-between">
              <label className="text-xs font-bold text-slate-300 block m-0">8. الحالة الصحية والإصابات (انقر لتحديد ما ينطبق لتفعيل جدران الحماية):</label>
              <span className="text-[11px] text-slate-400">تطبيق تراكمي تلقائي</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {MEDICAL_CONDITIONS_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleCondition(opt.id)}
                  className={'p-2.5 rounded-xl border text-xs text-right transition flex items-center justify-between ' + (
                    formData.selectedConditions.includes(opt.id)
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-200 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  )}
                >
                  <span>{opt.label}</span>
                  <span className="text-emerald-400 font-bold">{formData.selectedConditions.includes(opt.id) ? '✓' : ''}</span>
                </button>
              ))}
            </div>
          </div>

          {/* زر التوليد والبدء */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm transition shadow-lg shadow-emerald-950/50 disabled:opacity-50"
            >
              {loading ? 'جاري بناء ومعايرة خطة الإنتاج المخصصة...' : 'توليد خطة اليوم والبدء الفوري'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
