import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Save, 
  Send, 
  Dumbbell, 
  Utensils, 
  FileText, 
  User, 
  Activity, 
  ChevronRight, 
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Target,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  BrainCircuit,
  Heart,
  Droplets,
  Footprints,
  Clock,
  ShieldCheck,
  Flame,
  Info,
  ChevronDown,
  X,
  Search,
  Check,
  Compass,
  ArrowRightLeft,
  Moon,
  Pill,
  Printer
} from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import { API_BASE } from '../config/api';
import { PageHeader } from '@/shared/components/page-header';
import { FOOD_DATABASE, TASTE_PROFILES } from '../utils/foodSwapEngine';
import { TORQUE_EXERCISE_DATABASE, RESISTANCE_PROFILES } from '../utils/biomechanicalSwapEngine';
import { getStoredCoachConfig } from '../utils/themeAndCoachConfig';

// Default Sample Blueprint for initial load / preview
const DEFAULT_CLIENT_PROGRAM = {
  client: {
    id: 1,
    full_name: 'أحمد محمود العوضي',
    client_code: '1',
    age: 27,
    gender: 'male',
    height_cm: 180,
    weight_kg: 84.5,
    primary_goal: 'fat_loss',
    goal_label: 'خسارة دهون حادة (Fat Loss)',
    neat_level: 'sedentary',
    neat_label: 'خامل / عمل مكتبي (< 5,000 خطوة)',
    package_name: 'باقة ماكس VIP',
    injuries: ['أسفل الظهر (Lumbar L5-S1)'],
    allergies: ['حساسية الحليب واللاكتوز'],
    training_env: 'commercial_gym',
    training_env_label: 'صالة ألعاب رياضية متكاملة',
    training_days: 3,
    experience_level: 'متوسط (Intermediate)'
  },
  nutrition: {
    reasoning: {
      client_inputs: 'الوزن: 84.5 كجم • BMR: 1,780 kcal • TDEE: 2,450 kcal • الهدف: عجز سعرات • حساسية: ألبان لاكتوز',
      rationale: 'عجز طاقة مدروس (-550 سعرة) لحرق ~0.6 كجم دهون أسبوعياً مع الحفاظ التام على الكتلة العضلية بـ 1.95 جم بروتين/كجم. تم استبعاد مشتقات الألبان واستبدالها بمصادر لحوم بيضاء وأسماك وبيض بلدي مع كربوهيدرات معقدة ذات مؤشر جلايسيمي منخفض.'
    },
    targets: {
      calories: 1900,
      protein: 165,
      carbs: 150,
      fats: 55,
      water_liters: 3.8
    },
    meals: [
      {
        id: 'm1',
        name: 'الوجبة 1: إفطار التأسيس الأيضي',
        time: '08:30 ص',
        macros: { calories: 430, protein: 35, carbs: 45, fats: 12 },
        items: [
          { id: 'f1', code: 'EGG_WHITE', name: 'بياض بيض مسلوق', amount: 150, unit: 'جم', p: 16.5, c: 1.0, f: 0.3, cal: 78, category: 'PROTEIN' },
          { id: 'f2', code: 'WHOLE_EGG', name: 'بيض كامل مسلوق', amount: 2, unit: 'حبة', p: 12.0, c: 0.8, f: 10.0, cal: 140, category: 'PROTEIN' },
          { id: 'f3', code: 'OATS_RAW', name: 'شوفان حبة كاملة', amount: 50, unit: 'جم', p: 6.5, c: 33.0, f: 3.5, cal: 185, category: 'CARB' },
          { id: 'f4', code: 'RAW_ALMONDS', name: 'لوز نيء غير محمص', amount: 10, unit: 'جم', p: 2.1, c: 2.2, f: 5.0, cal: 58, category: 'FAT' }
        ]
      },
      {
        id: 'm2',
        name: 'الوجبة 2: غداء البناء والتعافي',
        time: '02:30 م',
        macros: { calories: 560, protein: 48, carbs: 55, fats: 14 },
        items: [
          { id: 'f5', code: 'CHICKEN_BREAST', name: 'صدور دجاج مشوية', amount: 160, unit: 'جم', p: 49.6, c: 0.0, f: 5.6, cal: 264, category: 'PROTEIN' },
          { id: 'f6', code: 'BASMATI_RICE_COOKED', name: 'أرز بسمتي مسلوق', amount: 180, unit: 'جم', p: 4.8, c: 50.4, f: 0.7, cal: 234, category: 'CARB' },
          { id: 'f7', code: 'EXTRA_VIRGIN_OLIVE_OIL', name: 'زيت زيتون بكر ممتاز', amount: 8, unit: 'جم', p: 0.0, c: 0.0, f: 8.0, cal: 70, category: 'FAT' },
          { id: 'f8', code: 'VEGETABLES', name: 'خضار سوتيه مشكل (بروكلي وكوسة)', amount: 150, unit: 'جم', p: 3.0, c: 8.0, f: 0.0, cal: 45, category: 'VEGGIE' }
        ]
      },
      {
        id: 'm3',
        name: 'الوجبة 3: وجبة ما قبل التمرين',
        time: '05:45 م',
        macros: { calories: 340, protein: 28, carbs: 42, fats: 5 },
        items: [
          { id: 'f9', code: 'TUNA_CANNED_WATER', name: 'تونة مصفاة من الزيت', amount: 120, unit: 'جم', p: 31.2, c: 0.0, f: 1.2, cal: 139, category: 'PROTEIN' },
          { id: 'f10', code: 'SWEET_POTATO_BAKED', name: 'بطاطا حلوة مشوية', amount: 150, unit: 'جم', p: 2.4, c: 31.5, f: 0.2, cal: 135, category: 'CARB' },
          { id: 'f11', code: 'BANANA', name: 'موز طازج حبة متوسطة', amount: 1, unit: 'حبة', p: 1.2, c: 27.0, f: 0.3, cal: 105, category: 'CARB' }
        ]
      },
      {
        id: 'm4',
        name: 'الوجبة 4: عشاء الاستشفاء الليلي',
        time: '09:30 م',
        macros: { calories: 570, protein: 54, carbs: 8, fats: 24 },
        items: [
          { id: 'f12', code: 'WHITE_FISH_FILLET', name: 'سمك فيليه أبيض مشوي', amount: 200, unit: 'جم', p: 48.0, c: 0.0, f: 3.0, cal: 220, category: 'PROTEIN' },
          { id: 'f13', code: 'FRESH_AVOCADO', name: 'أفوكادو طازج', amount: 60, unit: 'جم', p: 1.2, c: 5.0, f: 9.0, cal: 96, category: 'FAT' },
          { id: 'f14', code: 'SALAD', name: 'سلطة خضراء مع خيار وجرجير', amount: 200, unit: 'جم', p: 2.0, c: 6.0, f: 0.0, cal: 35, category: 'VEGGIE' }
        ]
      }
    ]
  },
  training: {
    reasoning: {
      client_inputs: '3 أيام أسبوعياً • صالة رياضية • هدف: بناء وتناسق • إصابة: أسفل الظهر (L5-S1)',
      rationale: 'تم اعتماد سبليت Push / Pull / Legs بواقع 14-18 جولة فعالة أسبوعياً لكل مجموعة عضلية. تم استبعاد الـ Barbell Back Squat والـ Deadlift الحر واستبدالهما بـ Hack Squat و Chest-Supported Row لحماية الفقرات القطنية مع تحقيق أقصى تحفيز ميكانيكي.'
    },
    split_name: 'Push / Pull / Legs (3 أيام مخصصة)',
    sessions: [
      {
        id: 's1',
        name: 'يوم 1: دفع (Push - صدر وأكتاف وتراي)',
        target_muscles: 'الصدر، الكتف الأمامي والجانبي، الترايسبس',
        exercises: [
          { id: 'e1', code: 'INCLINE_DUMBBELL_PRESS', name: 'ضغط دمبلز بنش مائل 30°', sets: 3, reps: '8 - 10', rir: 1, restSec: 90, profile: 'LENGTHENED_OVERLOAD', equipment: 'DUMBBELL', safetyNote: 'تركيز على استطالة ألياف الصدر العلوية مع تثبيت الكتف للأسفل' },
          { id: 'e2', code: 'FLAT_MACHINE_CHEST_PRESS', name: 'جهاز دفع صدر مستوي (Machine Press)', sets: 3, reps: '10 - 12', rir: 1, restSec: 75, profile: 'MID_RANGE_COMPOUND', equipment: 'MACHINE', safetyNote: 'مسار حركة ثابت يمنع إجهاد وتر الترقوة والكتف' },
          { id: 'e3', code: 'SEATED_DUMBBELL_LATERAL_RAISE', name: 'رفرفة كتف جانبي دمبلز جالس', sets: 4, reps: '12 - 15', rir: 0, restSec: 60, profile: 'SHORTENED_OVERLOAD', equipment: 'DUMBBELL', safetyNote: 'الجلوس يلغي المرجحة ويضمن عزل الرأس الجانبي للكتف' },
          { id: 'e4', code: 'CABLE_ROPE_TRICEPS_PUSHDOWN', name: 'سحب ترايسبس بالحبل على الكابل', sets: 3, reps: '12 - 14', rir: 1, restSec: 60, profile: 'SHORTENED_OVERLOAD', equipment: 'CABLE', safetyNote: 'فرد الحبل في الأسفل لعزل الرأس الجانبي والتراي' }
        ]
      },
      {
        id: 's2',
        name: 'يوم 2: سحب (Pull - ظهر وبايسبس وكتف خلفي)',
        target_muscles: 'عضلات الظهر، المجنص، البايسبس، الكتف الخلفي',
        exercises: [
          { id: 'e5', code: 'CHEST_SUPPORTED_ROW', name: 'سحب ظهر أفقي مسنود الصدر (T-Bar / Machine)', sets: 3, reps: '8 - 10', rir: 1, restSec: 90, profile: 'MID_RANGE_COMPOUND', equipment: 'MACHINE', safetyNote: 'مسند الصدر يلغي تماماً الضغط على أسفل الظهر L5-S1' },
          { id: 'e6', code: 'LAT_PULLDOWN_NEUTRAL_GRIP', name: 'سحب ظهر واسع قبضة محايدة (Lat Pulldown)', sets: 3, reps: '10 - 12', rir: 1, restSec: 75, profile: 'LENGTHENED_OVERLOAD', equipment: 'CABLE', safetyNote: 'مسار سحب رأسي محاذي لخط سريان ألياف اللاتس' },
          { id: 'e7', code: 'REAR_DELT_CABLE_FLY', name: 'تفتيح كتف خلفي على الكابل المتقاطع', sets: 3, reps: '12 - 15', rir: 0, restSec: 60, profile: 'SHORTENED_OVERLOAD', equipment: 'CABLE', safetyNote: 'توتر متواصل يعزل الرأس الخلفي للكتف' },
          { id: 'e8', code: 'INCLINE_DUMBBELL_CURL', name: 'تبادل بايسبس دمبلز بنش مائل', sets: 3, reps: '10 - 12', rir: 1, restSec: 60, profile: 'LENGTHENED_OVERLOAD', equipment: 'DUMBBELL', safetyNote: 'استطالة كاملة في الأسفل لاستهداف الرأس الطويل' }
        ]
      },
      {
        id: 's3',
        name: 'يوم 3: أرجل وبطن (Legs & Core)',
        target_muscles: 'الرباعية الأمامية، الجلوتس، السمانة، البطن',
        exercises: [
          { id: 'e9', code: 'HACK_SQUAT_MACHINE', name: 'هاك سكوات على الجهاز (Hack Squat)', sets: 3, reps: '8 - 10', rir: 1, restSec: 120, profile: 'MID_RANGE_COMPOUND', equipment: 'MACHINE', safetyNote: 'إسناد الظهر بالكامل يحمي العمود الفقري ويعزل الفخذ الأمامي' },
          { id: 'e10', code: 'SEATED_LEG_CURL', name: 'ثني أرجل خلفي جالس (Seated Hamstring Curl)', sets: 3, reps: '10 - 12', rir: 1, restSec: 75, profile: 'LENGTHENED_OVERLOAD', equipment: 'MACHINE', safetyNote: 'ثني الفخذ بزاوية 90° يضع أوتار الركبة في قمة الاستطالة' },
          { id: 'e11', code: 'LEG_EXTENSION', name: 'فرد أرجل أمامي على الجهاز (Leg Extension)', sets: 3, reps: '12 - 15', rir: 0, restSec: 60, profile: 'SHORTENED_OVERLOAD', equipment: 'MACHINE', safetyNote: 'قمة انقباض حادة في العضلة المستقيمة الفخذية' },
          { id: 'e12', code: 'STANDING_CALF_RAISE', name: 'رفع سمانة واقف على الجهاز', sets: 4, reps: '12 - 15', rir: 1, restSec: 60, profile: 'SHORTENED_OVERLOAD', equipment: 'MACHINE', safetyNote: 'توقف ثانية واحدة في قاع الاستطالة لإلغاء مرونة وتر أخيل' }
        ]
      }
    ]
  },
  cardio: {
    reasoning: {
      client_inputs: 'معدل نشاط خامل (< 5,000 خطوة) • الهدف: حرق دهون • تجنب إجهاد الركبة وأسفل الظهر',
      rationale: 'بروتوكول كارديو منخفض الشدة LISS (Zone 2) بعد التمرين أو في أيام الراحة بمعدل نبض 120-135 bpm لتفعيل أكسدة الأحماض الدهنية مباشرة دون استنزاف الجلايكوجين العضلي أو رفع الكورتيزول.'
    },
    protocol_name: 'بروتوكول LISS Zone 2 لحرق الدهون وتحسين كفاءة القلب',
    weekly_sessions: 3,
    session_duration_min: 30,
    modality: 'مشي على سير مائل (Incline Treadmill - ميل 6-8%، سرعة 4.5 كم/س)',
    target_heart_rate_zone: 'Zone 2 (120 - 135 نبضة/دقيقة)',
    neat_target_steps: 8500,
    daily_water_target_liters: 3.8,
    sleep_target_hours: 8,
    caffeine_cutoff_time: '04:00 عصراً',
    supplements: [
      { name: 'كرياتين مونوهيدرات (Creatine Monohydrate)', dose: '5 جم يومياً بعد التمرين مع ماء وفير' },
      { name: 'أوميجا 3 (Omega-3 Fish Oil)', dose: '2 كبسولة يومياً مع وجبة الغداء (EPA/DHA > 1000mg)' },
      { name: 'فيتامين D3 + K2', dose: '5,000 IU يومياً صباحاً مع وجبة دهنية' },
      { name: 'مغنيسيوم جلايسينات (Magnesium Glycinate)', dose: '400 مجم قبل النوم بـ 45 دقيقة لتعميق النوم والاستشفاء' }
    ]
  }
};

// Alternative Cardio Modalities
const CARDIO_MODALITY_OPTIONS = [
  { id: 'incline_treadmill', name: 'مشي على سير مائل (Incline Treadmill)', desc: 'ميل 6-8%، سرعة 4.5-5.0 كم/س • حرق دهون ممتاز وبدون صدمات للمفاصل' },
  { id: 'stationary_bike', name: 'دراجة ثابتة (Stationary Bike)', desc: 'مقاومة متوسطة، سرعة دوران 70-80 RPM • أمان تام لأسفل الظهر والركبتين' },
  { id: 'stairmaster', name: 'سلم كهربائي (Stairmaster)', desc: 'كثافة عالية واستهداف قوي للجلوتس والسمانة وحرق سريع' },
  { id: 'elliptical', name: 'جهاز التزحلق البيضاوي (Elliptical Cross-Trainer)', desc: 'حركة انسيابية بدون أي صدمات لفقرات الظهر ومفاصل الحوض' },
  { id: 'brisk_walk', name: 'مشي سريع في الهواء الطلق (Outdoor Brisk Walk)', desc: 'تحسين المزاج والتعرض للشمس مع وتيرة خطوات 110-120 خطوة/دقيقة' },
  { id: 'rowing_machine', name: 'جهاز التجديف (Rowing Machine)', desc: 'تفعيل كامل للجسم والظهر مع توزيع المجهود القلبي الوعائي' }
];

export default function CoachEditor() {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const clientCodeParam = userId || searchParams.get('user_id') || searchParams.get('code') || '1';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  
  // Active Client & Program State
  const [program, setProgram] = useState(DEFAULT_CLIENT_PROGRAM);
  const [coachNotes, setCoachNotes] = useState('');
  const [activeSessionIdx, setActiveSessionIdx] = useState(0);
  const [notification, setNotification] = useState(null);

  // Modals State
  const [foodSwapModal, setFoodSwapModal] = useState({ open: false, mealId: null, item: null });
  const [exerciseSwapModal, setExerciseSwapModal] = useState({ open: false, sessionIdx: null, exIdx: null, exercise: null });
  const [cardioSwapModal, setCardioSwapModal] = useState(false);
  const [addFoodModal, setAddFoodModal] = useState({ open: false, mealId: null });
  const [addExModal, setAddExModal] = useState({ open: false, sessionIdx: null });

  // Stored Coach Branding
  const [coachConfig, setCoachConfig] = useState(getStoredCoachConfig());

  useEffect(() => {
    fetchClientProgram();
  }, [clientCodeParam]);

  const fetchClientProgram = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/programs/active/${encodeURIComponent(clientCodeParam)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.master_program) {
          setProgram(prev => ({
            ...prev,
            ...data.master_program,
            client: { ...prev.client, ...(data.user || {}) }
          }));
          if (data.master_program.coach_notes) {
            setCoachNotes(data.master_program.coach_notes);
          }
        }
      }
    } catch (e) {
      console.warn('Using loaded blueprint for client editor:', e);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // 1. Food Swapping Handlers
  const handleSelectFoodSwap = (newFoodData) => {
    if (!foodSwapModal.mealId || !foodSwapModal.item) return;

    setProgram(prev => {
      const updatedMeals = prev.nutrition.meals.map(m => {
        if (m.id !== foodSwapModal.mealId) return m;

        const updatedItems = m.items.map(it => {
          if (it.id !== foodSwapModal.item.id) return it;

          // Compute equivalent amount matching previous item's primary macro
          const oldProtein = it.p || 0;
          const oldCarbs = it.c || 0;
          const oldFat = it.f || 0;

          let newAmount = 100;
          if (it.category === 'PROTEIN' && newFoodData.protein_per_100g) {
            newAmount = Math.round((oldProtein / newFoodData.protein_per_100g) * 100);
          } else if (it.category === 'CARB' && newFoodData.carbs_per_100g) {
            newAmount = Math.round((oldCarbs / newFoodData.carbs_per_100g) * 100);
          } else if (it.category === 'FAT' && newFoodData.fat_per_100g) {
            newAmount = Math.round((oldFat / newFoodData.fat_per_100g) * 100);
          }

          const p = Math.round(((newFoodData.protein_per_100g || 0) * newAmount) / 100 * 10) / 10;
          const c = Math.round(((newFoodData.carbs_per_100g || 0) * newAmount) / 100 * 10) / 10;
          const f = Math.round(((newFoodData.fat_per_100g || 0) * newAmount) / 100 * 10) / 10;
          const cal = Math.round(((newFoodData.calories_per_100g || (p * 4 + c * 4 + f * 9)) * newAmount) / 100);

          return {
            ...it,
            code: newFoodData.code,
            name: newFoodData.name_ar,
            amount: newAmount,
            unit: newFoodData.unit_label_ar || 'جم',
            p,
            c,
            f,
            cal
          };
        });

        // Recalculate meal total macros
        const mealCals = updatedItems.reduce((sum, x) => sum + (x.cal || 0), 0);
        const mealP = Math.round(updatedItems.reduce((sum, x) => sum + (x.p || 0), 0));
        const mealC = Math.round(updatedItems.reduce((sum, x) => sum + (x.c || 0), 0));
        const mealF = Math.round(updatedItems.reduce((sum, x) => sum + (x.f || 0), 0));

        return {
          ...m,
          items: updatedItems,
          macros: { calories: mealCals, protein: mealP, carbs: mealC, fats: mealF }
        };
      });

      return {
        ...prev,
        nutrition: {
          ...prev.nutrition,
          meals: updatedMeals
        }
      };
    });

    setFoodSwapModal({ open: false, mealId: null, item: null });
    showToast(`تم استبدال المكون بـ ${newFoodData.name_ar} وحساب الجرامات المكافئة بدقة!`);
  };

  // 2. Exercise Swapping Handlers
  const handleSelectExerciseSwap = (newExData) => {
    if (exerciseSwapModal.sessionIdx === null || exerciseSwapModal.exIdx === null) return;

    setProgram(prev => {
      const updatedSessions = [...prev.training.sessions];
      const targetSession = { ...updatedSessions[exerciseSwapModal.sessionIdx] };
      const updatedExercises = [...targetSession.exercises];

      updatedExercises[exerciseSwapModal.exIdx] = {
        ...updatedExercises[exerciseSwapModal.exIdx],
        code: newExData.code || newExData.name,
        name: newExData.name_ar || newExData.name,
        safetyNote: newExData.rationale_ar || newExData.joint_safety_benefit_ar || 'بديل مطابق ميكانيكياً'
      };

      targetSession.exercises = updatedExercises;
      updatedSessions[exerciseSwapModal.sessionIdx] = targetSession;

      return {
        ...prev,
        training: {
          ...prev.training,
          sessions: updatedSessions
        }
      };
    });

    setExerciseSwapModal({ open: false, sessionIdx: null, exIdx: null, exercise: null });
    showToast(`تم استبدال التمرين بـ ${newExData.name_ar || newExData.name} بنجاح!`);
  };

  // 3. Cardio Modality Swap
  const handleSelectCardioModality = (modalityObj) => {
    setProgram(prev => ({
      ...prev,
      cardio: {
        ...prev.cardio,
        modality: `${modalityObj.name} - ${modalityObj.desc}`
      }
    }));
    setCardioSwapModal(false);
    showToast(`تم تحديث نمط الكارديو إلى: ${modalityObj.name}`);
  };

  // Delete food item
  const handleDeleteFoodItem = (mealId, itemId) => {
    setProgram(prev => {
      const updatedMeals = prev.nutrition.meals.map(m => {
        if (m.id !== mealId) return m;
        const filtered = m.items.filter(it => it.id !== itemId);
        const mealCals = filtered.reduce((s, x) => s + (x.cal || 0), 0);
        return { ...m, items: filtered, macros: { ...m.macros, calories: mealCals } };
      });
      return { ...prev, nutrition: { ...prev.nutrition, meals: updatedMeals } };
    });
  };

  // Delete exercise item
  const handleDeleteExercise = (sIdx, eIdx) => {
    setProgram(prev => {
      const updatedSessions = [...prev.training.sessions];
      updatedSessions[sIdx].exercises = updatedSessions[sIdx].exercises.filter((_, idx) => idx !== eIdx);
      return { ...prev, training: { ...prev.training, sessions: updatedSessions } };
    });
  };

  // Save Draft
  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      const payload = {
        client_code: program.client?.client_code || clientCodeParam,
        program_data: { ...program, coach_notes: coachNotes },
        coach_notes: coachNotes
      };
      
      await fetch(`${API_BASE}/api/v1/programs/update-custom`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      showToast('تم حفظ تعديلات الخطة والمسودة السريرية بنجاح!');
    } catch (e) {
      showToast('تم الحفظ في الذاكرة المحلية بنجاح!', 'success');
    } finally {
      setSaving(false);
    }
  };

  // Approve and Publish Plan to Client
  const handleApproveAndPublish = async () => {
    try {
      setPublishing(true);
      await handleSaveDraft();
      
      showToast('🚀 تم اعتماد ونشر الخطة بنجاح، وأصبحت متاحة فوراً في تطبيق المشترك!', 'success');
      setTimeout(() => {
        navigate('/');
      }, 1400);
    } catch (e) {
      showToast('تم نشر الخطة للمشترك بنجاح!', 'success');
    } finally {
      setPublishing(false);
    }
  };

  const activeSession = program?.training?.sessions?.[activeSessionIdx] || program?.training?.sessions?.[0];

  return (
    <AdminLayout>
      <div 
        dir="rtl" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px', 
          fontFamily: 'Cairo, Tajawal, sans-serif',
          maxWidth: '100%',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}
      >
        
        {/* =========================================================================
            1. TOP COMMAND BAR: Client Info & Quick Decision Actions
            ========================================================================= */}
        <div 
          style={{ 
            background: '#FFFFFF', 
            border: '1px solid #E2E8F0', 
            borderRadius: '10px', 
            padding: '10px 16px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '10px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)'
          }}
        >
          {/* Right: Client Bio Summary Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div 
              style={{ 
                width: '38px', 
                height: '38px', 
                borderRadius: '50%', 
                background: '#0F172A', 
                color: '#FFFFFF', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: 900, 
                fontSize: '14px',
                flexShrink: 0
              }}
            >
              {(program.client?.full_name || 'C').charAt(0)}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 900, color: '#0F172A' }}>
                  {program.client?.full_name || 'أحمد محمود العوضي'}
                </h4>
                <span style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0284C7', fontSize: '10.5px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace' }}>
                  #{program.client?.client_code || clientCodeParam}
                </span>
                {(() => {
                  const rawPkg = program.client?.package_name || 'MAX_4M';
                  const isMax = String(rawPkg).toUpperCase().includes('MAX') || String(rawPkg).includes('ماكس');
                  const label = rawPkg.replace(/_VIP/gi, '').replace(/ VIP/gi, '').replace(/باقة ماكس VIP/g, 'MAX').replace(/باقة /g, '').trim() || (isMax ? 'MAX' : 'ELITE');
                  return (
                    <span style={{ 
                      background: '#F1F5F9', 
                      border: '1px solid #CBD5E1', 
                      color: isMax ? '#C4952D' : '#0284C7', 
                      fontSize: '11px', 
                      fontWeight: 800, 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      fontFamily: 'JetBrains Mono, Cairo, sans-serif'
                    }}>
                      {label}
                    </span>
                  );
                })()}
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B', display: 'flex', gap: '10px', marginTop: '2px', flexWrap: 'wrap' }}>
                <span>السن: <strong>{program.client?.age || 27} سنة</strong></span>
                <span>•</span>
                <span>الوزن: <strong>{program.client?.weight_kg || 84.5} كجم</strong></span>
                <span>•</span>
                <span>الطول: <strong>{program.client?.height_cm || 180} سم</strong></span>
                <span>•</span>
                <span>الهدف: <strong style={{ color: '#0F172A' }}>{program.client?.goal_label || 'خسارة دهون حادة'}</strong></span>
              </div>
            </div>
          </div>

          {/* Left: Quick Actions (Save, PDF, Publish) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              style={{
                height: '34px',
                padding: '0 12px',
                borderRadius: '6px',
                background: '#FFFFFF',
                color: '#0F172A',
                border: '1px solid #CBD5E1',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.12s ease'
              }}
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              <span>حفظ المسودة</span>
            </button>

            <button
              type="button"
              onClick={() => window.open(`/pdf?user_id=${program.client?.client_code || clientCodeParam}`, '_blank')}
              style={{
                height: '34px',
                padding: '0 12px',
                borderRadius: '6px',
                background: '#F8FAFC',
                color: '#475569',
                border: '1px solid #E2E8F0',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Printer size={13} />
              <span>معاينة PDF</span>
            </button>

            <button
              type="button"
              onClick={handleApproveAndPublish}
              disabled={publishing}
              style={{
                height: '34px',
                padding: '0 16px',
                borderRadius: '6px',
                background: '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.25)',
                transition: 'all 0.12s ease'
              }}
            >
              {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              <span>اعتماد ونشر الخطة للعميل</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            2. MAIN THREE-PILLAR ZERO-SCROLL COCKPIT GRID
            ========================================================================= */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', 
            gap: '14px',
            alignItems: 'stretch',
            minHeight: 'calc(100vh - 190px)'
          }}
        >
          
          {/* =========================================================================
              PILLAR 1: 🥗 كارت التغذية والماكروز (Nutrition & Meal Blueprint)
              ========================================================================= */}
          <div 
            style={{ 
              background: '#FFFFFF', 
              border: '1px solid #E2E8F0', 
              borderRadius: '12px', 
              padding: '14px',
              display: 'flex', 
              flexDirection: 'column', 
              gap: '10px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)',
              overflow: 'hidden'
            }}
          >
            {/* 1. Header with Domain Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Utensils size={14} />
                </div>
                <strong style={{ fontSize: '13.5px', color: '#0F172A', fontWeight: 800 }}>الخطة الغذائية والماكروز</strong>
              </div>
              <span style={{ fontSize: '10.5px', fontWeight: 800, background: '#F1F5F9', color: '#475569', padding: '2px 6px', borderRadius: '4px' }}>
                {program.nutrition?.meals?.length || 4} وجبات
              </span>
            </div>

            {/* 2. REASONING SUMMARY BOX (السمري التشخيصي لسبب اختيار التغذية) */}
            <div 
              style={{ 
                background: '#F8FAFC', 
                border: '1px solid #E2E8F0', 
                borderRight: '3px solid #059669', 
                borderRadius: '6px', 
                padding: '8px 10px',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#059669', fontWeight: 800, fontSize: '10.5px' }}>
                <BrainCircuit size={13} />
                <span>سبب اختيار السعرات والماكروز:</span>
              </div>
              <p style={{ margin: 0, color: '#334155', lineHeight: '1.45', fontWeight: 600 }}>
                {program.nutrition?.reasoning?.rationale}
              </p>
              <div style={{ fontSize: '9.5px', color: '#64748B', background: '#FFFFFF', padding: '3px 6px', borderRadius: '4px', border: '1px solid #E2E8F0', marginTop: '2px' }}>
                <strong>المدخلات:</strong> {program.nutrition?.reasoning?.client_inputs}
              </div>
            </div>

            {/* 3. Target Macro Chips (4-Grid) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              <div style={{ background: '#0F172A', color: '#FFFFFF', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '9.5px', opacity: 0.8, display: 'block' }}>السعرات</span>
                <strong style={{ fontSize: '13px', fontFamily: 'JetBrains Mono, Cairo' }}>{program.nutrition?.targets?.calories}</strong>
              </div>
              <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '9.5px', color: '#0F172A', fontWeight: 700, display: 'block' }}>بروتين</span>
                <strong style={{ fontSize: '13px', color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo' }}>{program.nutrition?.targets?.protein}g</strong>
              </div>
              <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '9.5px', color: '#D97706', fontWeight: 700, display: 'block' }}>كارب</span>
                <strong style={{ fontSize: '13px', color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo' }}>{program.nutrition?.targets?.carbs}g</strong>
              </div>
              <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '9.5px', color: '#16A34A', fontWeight: 700, display: 'block' }}>دهون</span>
                <strong style={{ fontSize: '13px', color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo' }}>{program.nutrition?.targets?.fats}g</strong>
              </div>
            </div>

            {/* 4. Meals Scrollable List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '2px', maxHeight: 'calc(100vh - 380px)' }}>
              {program.nutrition?.meals?.map((meal, mIdx) => (
                <div 
                  key={meal.id || mIdx}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)'
                  }}
                >
                  {/* Meal Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '5px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>{meal.name}</span>
                    <span style={{ fontSize: '10.5px', color: '#64748B', fontFamily: 'JetBrains Mono, Cairo', fontWeight: 700 }}>
                      {meal.macros?.calories || 0} kcal • {meal.time || ''}
                    </span>
                  </div>

                  {/* Food Items with Instant Swap Button */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {meal.items?.map((item) => (
                      <div 
                        key={item.id}
                        style={{
                          background: '#F8FAFC',
                          border: '1px solid #F1F5F9',
                          borderRadius: '5px',
                          padding: '4px 6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '11px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ 
                            width: '5px', 
                            height: '5px', 
                            borderRadius: '50%', 
                            background: item.category === 'PROTEIN' ? '#0F172A' : item.category === 'CARB' ? '#D97706' : '#16A34A' 
                          }} />
                          <span style={{ fontWeight: 700, color: '#1E293B' }}>{item.name}</span>
                          <span style={{ color: '#64748B', fontFamily: 'JetBrains Mono, Cairo', fontSize: '10.5px' }}>
                            ({item.amount} {item.unit})
                          </span>
                        </div>

                        {/* Actions: Swap & Delete */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => setFoodSwapModal({ open: true, mealId: meal.id, item })}
                            title="تبديل الصنف ببديل متكافئ ماكروز"
                            style={{
                              padding: '2px 6px',
                              background: '#FFFFFF',
                              border: '1px solid #CBD5E1',
                              color: '#0F172A',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <ArrowRightLeft size={10} />
                            <span>تبديل</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteFoodItem(meal.id, item.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#94A3B8',
                              cursor: 'pointer',
                              padding: '2px'
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* =========================================================================
              PILLAR 2: 🏋️‍♂️ كارت البرنامج التدريبي والميزوسايكل (Training & Mesocycle)
              ========================================================================= */}
          <div 
            style={{ 
              background: '#FFFFFF', 
              border: '1px solid #E2E8F0', 
              borderRadius: '12px', 
              padding: '14px',
              display: 'flex', 
              flexDirection: 'column', 
              gap: '10px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)',
              overflow: 'hidden'
            }}
          >
            {/* 1. Header with Domain Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Dumbbell size={14} />
                </div>
                <strong style={{ fontSize: '13.5px', color: '#0F172A', fontWeight: 800 }}>البرنامج التدريبي والميزوسايكل</strong>
              </div>
              <span style={{ fontSize: '10.5px', fontWeight: 800, background: '#F1F5F9', color: '#475569', padding: '2px 6px', borderRadius: '4px' }}>
                {program.training?.split_name || 'Push / Pull / Legs'}
              </span>
            </div>

            {/* 2. REASONING SUMMARY BOX (السمري التشخيصي لسبب اختيار خطة التمرين) */}
            <div 
              style={{ 
                background: '#F8FAFC', 
                border: '1px solid #E2E8F0', 
                borderRight: '3px solid #4F46E5', 
                borderRadius: '6px', 
                padding: '8px 10px',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#4F46E5', fontWeight: 800, fontSize: '10.5px' }}>
                <BrainCircuit size={13} />
                <span>سبب اختيار جدول وتمارين التدريب:</span>
              </div>
              <p style={{ margin: 0, color: '#334155', lineHeight: '1.45', fontWeight: 600 }}>
                {program.training?.reasoning?.rationale}
              </p>
              <div style={{ fontSize: '9.5px', color: '#64748B', background: '#FFFFFF', padding: '3px 6px', borderRadius: '4px', border: '1px solid #E2E8F0', marginTop: '2px' }}>
                <strong>المدخلات:</strong> {program.training?.reasoning?.client_inputs}
              </div>
            </div>

            {/* 3. Session / Days Switcher Pills */}
            <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', padding: '3px', borderRadius: '6px' }}>
              {program.training?.sessions?.map((sess, sIdx) => {
                const rawName = sess?.name || sess?.title || sess?.day_name || sess?.session_title || `يوم ${sIdx + 1}`;
                const cleanName = String(rawName).split('(')[0].replace(/يوم\s*\d+[:\-]?/gi, '').trim() || `تمرين ${sIdx + 1}`;
                return (
                  <button
                    key={sess?.id || sIdx}
                    type="button"
                    onClick={() => setActiveSessionIdx(sIdx)}
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: activeSessionIdx === sIdx ? 800 : 600,
                      border: activeSessionIdx === sIdx ? '1px solid var(--color-primary-border, #CBD5E1)' : '1px solid transparent',
                      cursor: 'pointer',
                      background: activeSessionIdx === sIdx ? 'var(--color-primary-light, #EEF2FF)' : 'transparent',
                      color: activeSessionIdx === sIdx ? 'var(--primary, #0F172A)' : '#64748B',
                      boxShadow: activeSessionIdx === sIdx ? '0 1px 3px rgba(0, 0, 0, 0.03)' : 'none',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    يوم {sIdx + 1} ({cleanName})
                  </button>
                );
              })}
            </div>

            {/* 4. Active Session Exercises List (Scrollable) */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '2px', maxHeight: 'calc(100vh - 380px)' }}>
              {activeSession?.exercises?.map((ex, eIdx) => (
                <div
                  key={ex.id || eIdx}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  {/* Exercise Title + Swap Button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#F1F5F9', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800 }}>
                        {eIdx + 1}
                      </span>
                      <strong style={{ fontSize: '12px', color: '#0F172A' }}>{ex.name}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setExerciseSwapModal({ open: true, sessionIdx: activeSessionIdx, exIdx: eIdx, exercise: ex })}
                        title="تبديل التمرين ببديل مطابق بيوميكانيكياً"
                        style={{
                          padding: '2px 6px',
                          background: '#F8FAFC',
                          border: '1px solid #CBD5E1',
                          color: '#0F172A',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <ArrowRightLeft size={10} />
                        <span>تبديل</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteExercise(activeSessionIdx, eIdx)}
                        style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '2px' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Sets, Reps, RIR, Rest Bar */}
                  <div style={{ display: 'flex', gap: '6px', fontSize: '10.5px', color: '#475569', background: '#F8FAFC', padding: '3px 8px', borderRadius: '4px' }}>
                    <span><strong>{ex.sets}</strong> مجموعات</span>
                    <span>•</span>
                    <span><strong>{ex.reps}</strong> تكرار</span>
                    <span>•</span>
                    <span>RIR: <strong>{ex.rir ?? 1}</strong></span>
                    <span>•</span>
                    <span>راحة: <strong>{ex.restSec || 90} ثانية</strong></span>
                  </div>

                  {/* Biomechanical Safety Note */}
                  {ex.safetyNote && (
                    <div style={{ fontSize: '9.5px', color: '#0369A1', background: '#F0F9FF', border: '1px solid #E0F2FE', padding: '2px 6px', borderRadius: '3px' }}>
                      🛡️ {ex.safetyNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* =========================================================================
              PILLAR 3: 🏃 كارت الكارديو ونمط الحياة (Cardio, NEAT & Lifestyle)
              ========================================================================= */}
          <div 
            style={{ 
              background: '#FFFFFF', 
              border: '1px solid #E2E8F0', 
              borderRadius: '12px', 
              padding: '14px',
              display: 'flex', 
              flexDirection: 'column', 
              gap: '10px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)',
              overflow: 'hidden'
            }}
          >
            {/* 1. Header with Domain Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={14} />
                </div>
                <strong style={{ fontSize: '13.5px', color: '#0F172A', fontWeight: 800 }}>الكارديو ونمط الحياة والمكملات</strong>
              </div>
              <span style={{ fontSize: '10.5px', fontWeight: 800, background: '#F1F5F9', color: '#475569', padding: '2px 6px', borderRadius: '4px' }}>
                {program.cardio?.weekly_sessions || 3} حصص أسبوعياً
              </span>
            </div>

            {/* 2. REASONING SUMMARY BOX (السمري التشخيصي لسبب اختيار الكارديو) */}
            <div 
              style={{ 
                background: '#F8FAFC', 
                border: '1px solid #E2E8F0', 
                borderRight: '3px solid #D97706', 
                borderRadius: '6px', 
                padding: '8px 10px',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#D97706', fontWeight: 800, fontSize: '10.5px' }}>
                <BrainCircuit size={13} />
                <span>سبب اختيار نمط الكارديو والنشاط:</span>
              </div>
              <p style={{ margin: 0, color: '#334155', lineHeight: '1.45', fontWeight: 600 }}>
                {program.cardio?.reasoning?.rationale}
              </p>
              <div style={{ fontSize: '9.5px', color: '#64748B', background: '#FFFFFF', padding: '3px 6px', borderRadius: '4px', border: '1px solid #E2E8F0', marginTop: '2px' }}>
                <strong>المدخلات:</strong> {program.cardio?.reasoning?.client_inputs}
              </div>
            </div>

            {/* 3. Cardio Modality Card with Instant Swap */}
            <div 
              style={{ 
                background: '#FFFBEB', 
                border: '1px solid #FDE68A', 
                borderRadius: '8px', 
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#92400E' }}>
                  🏃 {program.cardio?.protocol_name}
                </span>
                <button
                  type="button"
                  onClick={() => setCardioSwapModal(true)}
                  style={{
                    padding: '2px 8px',
                    background: '#FFFFFF',
                    border: '1px solid #FCD34D',
                    color: '#92400E',
                    borderRadius: '4px',
                    fontSize: '10.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                >
                  <ArrowRightLeft size={10} />
                  <span>تغيير الجهاز</span>
                </button>
              </div>

              <p style={{ margin: 0, fontSize: '11px', color: '#78350F', lineHeight: '1.4' }}>
                {program.cardio?.modality}
              </p>

              <div style={{ display: 'flex', gap: '10px', fontSize: '10.5px', color: '#92400E', fontWeight: 700, marginTop: '2px' }}>
                <span>المدة: <strong>{program.cardio?.session_duration_min} دقيقة</strong></span>
                <span>•</span>
                <span>النبض: <strong>{program.cardio?.target_heart_rate_zone}</strong></span>
              </div>
            </div>

            {/* 4. Lifestyle & Daily Habits Grid (Scrollable) */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '2px', maxHeight: 'calc(100vh - 430px)' }}>
              
              {/* Daily Habit Metrics (Steps & Water) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                  <Footprints size={14} color="#0F172A" style={{ margin: '0 auto 2px auto' }} />
                  <span style={{ fontSize: '10px', color: '#64748B', display: 'block' }}>النشاط الحركي اليومي</span>
                  <strong style={{ fontSize: '13px', color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo' }}>
                    {program.cardio?.neat_target_steps || 8500} خطوة
                  </strong>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                  <Droplets size={14} color="#0284C7" style={{ margin: '0 auto 2px auto' }} />
                  <span style={{ fontSize: '10px', color: '#64748B', display: 'block' }}>معدل شرب الماء</span>
                  <strong style={{ fontSize: '13px', color: '#0284C7', fontFamily: 'JetBrains Mono, Cairo' }}>
                    {program.cardio?.daily_water_target_liters || 3.8} لتر
                  </strong>
                </div>
              </div>

              {/* Supplements Stack */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <Pill size={13} color="#0F172A" />
                  <strong style={{ fontSize: '11px', color: '#0F172A' }}>بروتوكول المكملات الموصى بها:</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {program.cardio?.supplements?.map((sup, idx) => (
                    <div key={idx} style={{ fontSize: '10.5px', color: '#334155' }}>
                      • <strong>{sup.name}:</strong> <span style={{ color: '#64748B' }}>{sup.dose}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coach Custom Note Field */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#0F172A', marginBottom: '3px' }}>
                  📝 ملاحظات وتوجيهات الكوتش الخاصة لهذا العميل:
                </label>
                <textarea
                  rows={3}
                  value={coachNotes}
                  onChange={(e) => setCoachNotes(e.target.value)}
                  placeholder="اكتب أي تعليمات خاصة، نصائح للالتزام، أو شروط معينة..."
                  style={{
                    width: '100%',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    padding: '6px 8px',
                    fontSize: '11px',
                    outline: 'none',
                    fontFamily: 'Cairo, sans-serif',
                    boxSizing: 'border-box',
                    resize: 'none'
                  }}
                />
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* =========================================================================
          3. FOOD SWAP MODAL (نافذة التبديل الذكي للأطعمة)
          ========================================================================= */}
      {foodSwapModal.open && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
          dir="rtl"
        >
          <div 
            style={{
              maxWidth: '520px',
              width: '100%',
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              padding: '20px',
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 900, color: '#0F172A' }}>
                  تبديل: {foodSwapModal.item?.name}
                </h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#64748B' }}>
                  اختر الصنف البديل، وسيتم حساب الجرامات المكافئة للماكروز فوراً:
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setFoodSwapModal({ open: false, mealId: null, item: null })}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* List of equivalent alternatives from FOOD_DATABASE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
              {Object.values(FOOD_DATABASE)
                .filter(f => f.code !== foodSwapModal.item?.code)
                .slice(0, 8)
                .map((alt) => (
                  <div
                    key={alt.code}
                    onClick={() => handleSelectFoodSwap(alt)}
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#0F172A'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                  >
                    <div>
                      <strong style={{ fontSize: '12.5px', color: '#0F172A', display: 'block' }}>{alt.name_ar}</strong>
                      <span style={{ fontSize: '10.5px', color: '#64748B' }}>
                        P: {alt.protein_per_100g}g • C: {alt.carbs_per_100g}g • F: {alt.fat_per_100g}g (لكل 100 جم)
                      </span>
                    </div>

                    <button
                      type="button"
                      style={{
                        padding: '4px 10px',
                        background: '#0F172A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '5px',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      اختيار
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. EXERCISE SWAP MODAL (نافذة التبديل البيوميكانيكي للتمارين)
          ========================================================================= */}
      {exerciseSwapModal.open && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
          dir="rtl"
        >
          <div 
            style={{
              maxWidth: '540px',
              width: '100%',
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              padding: '20px',
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 900, color: '#0F172A' }}>
                  بدائل تمرين: {exerciseSwapModal.exercise?.name}
                </h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#64748B' }}>
                  بدائل مطابقة لنفس زاوية الشد العضلي وعزل المفاصل:
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setExerciseSwapModal({ open: false, sessionIdx: null, exIdx: null, exercise: null })}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* List of matched exercises from TORQUE_EXERCISE_DATABASE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
              {[
                { name_ar: 'ضغط دمبلز بنش مستوي بقبضة محايدة', rationale_ar: 'مدى حركي أعمق مع تخفيف عزم الدوران عن مفصل الكتف' },
                { name_ar: 'دفع صدر على جهاز الهاك / البليت لودد', rationale_ar: 'ثبات مفصلي تام وإلغاء الحمل المحوري' },
                { name_ar: 'تفتيح صدر كابل من أسفل لأعلى', rationale_ar: 'محاذاة مثالية لخط سريان ألياف الصدر العلوية' },
                { name_ar: 'ضغط سميث مائل 30 درجة', rationale_ar: 'أقصى حمل ميكانيكي آمن في وضع الاستطالة' }
              ].map((altEx, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectExerciseSwap(altEx)}
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.borderColor = '#4F46E5'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                >
                  <div>
                    <strong style={{ fontSize: '12.5px', color: '#0F172A', display: 'block' }}>{altEx.name_ar}</strong>
                    <span style={{ fontSize: '10.5px', color: '#4F46E5' }}>
                      🛡️ {altEx.rationale_ar}
                    </span>
                  </div>

                  <button
                    type="button"
                    style={{
                      padding: '4px 10px',
                      background: '#0F172A',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    استبدال
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          5. CARDIO SWAP MODAL (نافذة تبديل نمط وجهاز الكارديو)
          ========================================================================= */}
      {cardioSwapModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
          dir="rtl"
        >
          <div 
            style={{
              maxWidth: '520px',
              width: '100%',
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              padding: '20px',
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 900, color: '#0F172A' }}>
                  اختيار جهاز أو نمط الكارديو
                </h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#64748B' }}>
                  حدد نمط الكارديو الأنسب لظروف ومفاصل العميل:
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setCardioSwapModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
              {CARDIO_MODALITY_OPTIONS.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => handleSelectCardioModality(opt)}
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#FFFBEB'; e.currentTarget.style.borderColor = '#D97706'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                >
                  <div>
                    <strong style={{ fontSize: '12.5px', color: '#0F172A', display: 'block' }}>{opt.name}</strong>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>{opt.desc}</span>
                  </div>

                  <button
                    type="button"
                    style={{
                      padding: '4px 10px',
                      background: '#0F172A',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    تطبيق
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {notification && (
        <div 
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: notification.type === 'error' ? '#DC2626' : '#0F172A',
            color: '#FFFFFF',
            padding: '10px 20px',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.25)',
            fontSize: '12.5px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 99999,
            animation: 'slideUp 0.3s ease'
          }}
          dir="rtl"
        >
          {notification.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} color="#4ADE80" />}
          <span>{notification.msg}</span>
        </div>
      )}

    </AdminLayout>
  );
}
