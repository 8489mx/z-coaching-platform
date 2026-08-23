import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveSession } from '../utils/auth';
import { generateInitialPlan } from '../utils/onboardingPlanGeneratorEngine';

export const MEDICAL_CONDITIONS_OPTIONS = [
  // 1. الغدد والأيض والسكري
  { id: 'TYPE_1_DIABETES', label: 'سكري نوع أول (معتمد على حقن الأنسولين)' },
  { id: 'TYPE_2_DIABETES_ORAL', label: 'سكري نوع ثاني (أقراص فموية / تنظيم غذائي)' },
  { id: 'TYPE_2_DIABETES_INSULIN', label: 'سكري نوع ثاني (حقن أنسولين)' },
  { id: 'PCOS_IR', label: 'مقاومة إنسولين / تكيس مبايض' },
  { id: 'HYPOTHYROIDISM', label: 'خمول الغدة الدرقية (Eltroxin)' },
  { id: 'FATTY_LIVER', label: 'كبد دهني / ارتفاع إنزيمات الكبد' },

  // 2. القلب والأوعية والدم
  { id: 'HYPERTENSION', label: 'ارتفاع ضغط الدم' },
  { id: 'BLOOD_THINNERS', label: 'أدوية السيولة ومضادات التجلط (ماريفان / زارلتو)' },
  { id: 'SEVERE_ANEMIA', label: 'أنيميا حادة / نقص مخزون الحديد (Ferritin)' },

  // 3. الجهاز الهضمي والعمليات
  { id: 'BARIATRIC_SURGERY', label: 'جراحة سمنة سابقة (تكميم / تحويل مسار)' },
  { id: 'IBS', label: 'متلازمة القولون العصبي / حساسيات طعام' },
  { id: 'GERD_REFLUX', label: 'ارتجاع المريء / فتق الحجاب الحاجز' },
  { id: 'CHOLECYSTECTOMY', label: 'استئصال المرارة سابقاً' },

  // 4. الكلى والمسالك
  { id: 'RENAL_INSUFFICIENCY', label: 'قصور أو مشاكل في وظائف الكلى' },
  { id: 'GOUT', label: 'داء النقرس / ارتفاع اليوريك أسيد' },

  // 5. الجهاز التنفسي
  { id: 'BRONCHIAL_ASTHMA', label: 'حساسية الصدر / الربو القصبي' },

  // 6. العقاقير الخاصة
  { id: 'GLP1_USER', label: 'حقن التخسيس (Ozempic / Mounjaro / Saxenda)' },
  { id: 'ROACCUTANE_USER', label: 'علاج حب الشباب (روكتان / أيزوتريتينوين)' },
  { id: 'CORTICOSTEROIDS', label: 'علاج الكورتيزون المزمن' },

  // 7. المفاصل، الفتق، والسيدات
  { id: 'LOWER_BACK_PAIN', label: 'انزلاق غضروفي / آلام أسفل الظهر' },
  { id: 'SHOULDER_IMPINGEMENT', label: 'نغزة أو آلام بمفصل الكتف' },
  { id: 'PATELLAR_TENDINITIS', label: 'خشونة أو آلام صابونة الركبة' },
  { id: 'HERNIA_VARICOSE', label: 'فتق (إربي/سري) أو دوالي شديدة بالساقين' },
  { id: 'LACTATION', label: 'مرحلة الرضاعة الطبيعية (للسيدات)' },
  { id: 'NONE_HEALTHY', label: 'سليم تماماً ولا أعاني من أي مشكلة صحية ✔' }
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

  // Basic Metrics State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('MALE');
  const [age, setAge] = useState(26);
  const [weightKg, setWeightKg] = useState(78);
  const [heightCm, setHeightCm] = useState(175);
  const [activityLevel, setActivityLevel] = useState('LIGHT');
  const [goal, setGoal] = useState('FAT_LOSS');
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState(4);
  const [environment, setEnvironment] = useState('GYM');

  // Medical & Dietary Protocol State
  const [selectedConditions, setSelectedConditions] = useState(['NONE_HEALTHY']);
  const [religion, setReligion] = useState('MUSLIM');
  const [christianFastingStyle, setChristianFastingStyle] = useState('PESCATARIAN_ALLOWED');
  const [splitPreference, setSplitPreference] = useState('AUTO');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleCondition = (id) => {
    if (id === 'NONE_HEALTHY') {
      setSelectedConditions(['NONE_HEALTHY']);
      return;
    }
    let updated = selectedConditions.filter((c) => c !== 'NONE_HEALTHY');
    if (updated.includes(id)) {
      updated = updated.filter((c) => c !== id);
    } else {
      updated.push(id);
    }
    setSelectedConditions(updated.length ? updated : ['NONE_HEALTHY']);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('يرجى إدخال اسم المتدرب بالكامل');
      return;
    }

    setLoading(true);

    try {
      // Map conditions to medical flags for engines
      const medicalFlags = [...selectedConditions];
      if (
        selectedConditions.includes('TYPE_1_DIABETES') ||
        selectedConditions.includes('TYPE_2_DIABETES_INSULIN')
      ) {
        medicalFlags.push('INSULIN_DEPENDENT');
        medicalFlags.push('INSULIN');
      }

      // Generate initial plan deterministically
      const initialPlan = generateInitialPlan({
        name: name.trim(),
        gender,
        age: Number(age),
        weightKg: Number(weightKg),
        heightCm: Number(heightCm),
        activityLevel,
        goal,
        trainingDaysPerWeek: Number(trainingDaysPerWeek),
        environment,
        medicalFlags,
        splitPreference
      });

      // Prepare client session payload
      const clientSession = {
        id: 'client_' + Date.now(),
        client_code: 'Z-' + Math.floor(1000 + Math.random() * 9000),
        name: name.trim(),
        phone: phone.trim() || '01000000000',
        gender,
        weight_kg: Number(weightKg),
        height_cm: Number(heightCm),
        goal,
        religion,
        christian_fasting_style: religion === 'CHRISTIAN' ? christianFastingStyle : null,
        selected_conditions: selectedConditions,
        medical_flags: medicalFlags,
        daily_targets: initialPlan.daily_targets,
        training_split: initialPlan.training_split,
        clinical_notes: initialPlan.clinical_notes,
        today_plan: {
          meals: ['وجبة الإفطار المتوازنة', 'وجبة الغداء الغنية بالبروتين', 'سناك الطاقة قبل التمرين', 'وجبة العشاء والاستشفاء'],
          waterTargetLiters: initialPlan.daily_targets?.water_liters || 3.0,
          workoutTitle: `تمرين اليوم: ${initialPlan.training_split?.name_ar || 'تمرين عام'}`
        }
      };

      // Save persistent session
      saveSession(clientSession);

      // Try background sync to server if available
      try {
        await fetch('/api/v1/client/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clientSession)
        });
      } catch (syncErr) {
        console.warn('Background sync warning:', syncErr.message);
      }

      // Navigate to client cockpit
      navigate('/client/today', { replace: true });
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء إعداد الخطة التدريبية');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header Title */}
        <div className="text-center mb-8">
          <div className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-bold mb-2">
            منظومة كابتن كريم زكريا الإكلينيكية 2026
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white m-0">استمارة التحليل وتصميم البرنامج الرياضي</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-2 mb-0">
            تصميم دقيق لبرنامجك التدريبي والغذائي وفق أحدث المعايير البيوميكانيكية والفسيولوجية
          </p>
        </div>

        {error && (
          <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs p-4 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Info */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <h3 className="font-bold text-sm text-emerald-400 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>1. البيانات الأساسية والقياسات البدنية</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: أحمد مصطفى"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">رقم الواتساب للتواصل</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">النوع (الجنس)</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="MALE">ذكر (Male)</option>
                  <option value="FEMALE">أنثى (Female)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">العمر (بالسنوات)</label>
                <input
                  type="number"
                  min="14"
                  max="85"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">الوزن الحالي (كجم)</label>
                <input
                  type="number"
                  step="0.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">الطول (سم)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Goals & Activity */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <h3 className="font-bold text-sm text-emerald-400 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>2. الأهداف التدريبية والنشاط اليومي</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">الهدف الرئيسي</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="FAT_LOSS">خسارة دهون وتنشيف ذكي (Fat Loss)</option>
                  <option value="AGGRESSIVE_CUT">تنشيف سريع ومكثف (Aggressive Cut)</option>
                  <option value="LEAN_BULK">بناء عضلي وزيادة وزن نقية (Lean Bulk)</option>
                  <option value="MAINTENANCE">تحسين اللياقة وإعادة تشكيل الجسم (Body Recomposition)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">مستوى النشاط اليومي خارج التمرين</label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="SEDENTARY">مكتبي خامل (أقل من 4000 خطوة يومياً)</option>
                  <option value="LIGHT">نشاط خفيف (4000 - 8000 خطوة يومياً)</option>
                  <option value="MODERATE">نشاط متوسط (8000 - 12000 خطوة يومياً)</option>
                  <option value="HEAVY">نشاط بدني شاق / عمل ميداني</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">عدد أيام التمرين الأسبوعية المتاحة</label>
                <select
                  value={trainingDaysPerWeek}
                  onChange={(e) => setTrainingDaysPerWeek(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="2">يومان أسبوعياً</option>
                  <option value="3">3 أيام أسبوعياً</option>
                  <option value="4">4 أيام أسبوعياً (الموصى به)</option>
                  <option value="5">5 أيام أسبوعياً</option>
                  <option value="6">6 أيام أسبوعياً</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">بيئة التمرين</label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="GYM">جيم مجهز بالكامل (GYM)</option>
                  <option value="HOME">تمرين منزلي بأوزان / دمبلز (Home Gym)</option>
                  <option value="BODYWEIGHT">تمرين بوزن الجسم فقط (Bodyweight / Calisthenics)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Training Split Preference */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <h3 className="font-bold text-sm text-emerald-400 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>3. تفضيل النظام والتقسيم التدريبي (Split Preference)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {SPLIT_PREFERENCES.map((sp) => (
                <div
                  key={sp.id}
                  onClick={() => setSplitPreference(sp.id)}
                  className={`p-3 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between ${
                    splitPreference === sp.id
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white">{sp.label}</span>
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                        splitPreference === sp.id
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'border border-slate-600'
                      }`}
                    >
                      {splitPreference === sp.id ? '✓' : ''}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 m-0 leading-relaxed">{sp.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Religious Calendar & Fasting */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <h3 className="font-bold text-sm text-emerald-400 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>4. الجدول العقائدي ومواسم الصيام</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">النمط الديني لتنظيم مواعيد الصيام والوجبات</label>
                <select
                  value={religion}
                  onChange={(e) => setReligion(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="MUSLIM">مسلم (صيام رمضان، شوال، والنوافل)</option>
                  <option value="CHRISTIAN">مسيحي (الصوم الكبير، صوم الرسل، الميلاد، والأربعاء والجمعة)</option>
                  <option value="NONE">بدون مواسم صيام دينية خاصة</option>
                </select>
              </div>

              {religion === 'CHRISTIAN' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">نمط الصيام المسيحي المعتمد</label>
                  <select
                    value={christianFastingStyle}
                    onChange={(e) => setChristianFastingStyle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="PESCATARIAN_ALLOWED">صيام نباتي مع السماح بالمأكولات البحرية والأسماك</option>
                    <option value="STRICT_VEGAN">صيام نباتي صارم (نباتي صرف بدون أسماك)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Medical Conditions & Injuries (Multi-Select Chips) */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="mb-3">
              <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-2 m-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>5. الحالة الصحية والإصابات (يمكن اختيار أكثر من حالة):</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 mb-0">
                يتم قفل وضبط الماكروز وجداول الأمان وجدار الحماية الدوائي تلقائياً حسب اختياراتك
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {MEDICAL_CONDITIONS_OPTIONS.map((opt) => {
                const isSelected = selectedConditions.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleCondition(opt.id)}
                    className={`p-3 rounded-xl border text-xs text-right transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-sm'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center text-[10px] flex-shrink-0 ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'border border-slate-600'
                      }`}
                    >
                      {isSelected ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-slate-950 font-black py-3.5 rounded-2xl text-sm transition shadow-xl shadow-emerald-950/50 cursor-pointer"
          >
            {loading ? 'جاري تحليل البيانات وتوليد البرنامج الرياضي...' : 'توليد الخطة وبدء رحلة التحول الآن'}
          </button>
        </form>
      </div>
    </div>
  );
}
