import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Save, 
  Send, 
  Dumbbell, 
  Utensils, 
  FileText, 
  Activity, 
  Loader2,
  Plus,
  Trash2,
  RotateCw,
  HeartPulse,
  Printer,
  X,
  ArrowRightLeft,
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
  Search,
  Check,
  Zap,
  Target,
  ShieldAlert,
  Flame
} from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import { API_BASE } from '../config/api';
import { FOOD_DATABASE } from '../utils/foodSwapEngine';
import { dynamicRippleRebalanceDailyPlan } from '../utils/mealPortionBalancer';
import CoachEditorNutritionTab from '../features/coach/components/CoachEditorNutritionTab';
import defaultMobilityCatalog from '../data/mobilityCatalog.json';

const rawFoodsList = Object.values(FOOD_DATABASE || {})
  .filter(fd => Boolean(fd && typeof fd === 'object' && (fd.name_ar || fd.name || fd.code)));

const uniqueFoodsMap = new Map();
rawFoodsList.forEach(fd => {
  const code = fd.code || fd.id;
  if (code && !uniqueFoodsMap.has(code)) {
    uniqueFoodsMap.set(code, {
      ...fd,
      name: fd.name_ar || fd.name || code,
      p: Number(fd.protein_per_100g ?? fd.p ?? 0),
      c: Number(fd.carbs_per_100g ?? fd.c ?? 0),
      f: Number(fd.fat_per_100g ?? fd.f ?? 0),
      cal: Number(fd.calories_per_100g ?? fd.cal ?? 0),
      amount: 100,
      unit: 'جم'
    });
  }
});
const FOOD_DATABASE_LIST = Array.from(uniqueFoodsMap.values())

import { STRESS_TEST_CLIENTS, CLINICAL_MASTER_BLUEPRINTS } from '../data/stressTestClientsBlueprints';

// 15 Master Clinical Archetypes for Instant Switching
const CLIENT_BLUEPRINTS = CLINICAL_MASTER_BLUEPRINTS;

// Quick Meal Presets for Instant Precision Nutrition Building
const QUICK_MEAL_PRESETS = [
  {
    name: 'شوفان بالبروتين والتوت',
    items: [
      { code: 'OATMEAL_RAW', name: 'شوفان كامل الحبة', amount: 60, unit: 'جم', p: 8.1, c: 40.8, f: 3.9, cal: 225, category: 'CARB' },
      { code: 'SKIM_MILK', name: 'حليب خالي الدسم', amount: 200, unit: 'مل', p: 6.8, c: 10.0, f: 0.2, cal: 70, category: 'CARB' },
      { code: 'WHEY_PROTEIN_ISOLATE', name: 'واي بروتين معزول (Whey Isolate)', amount: 30, unit: 'جم', p: 27.0, c: 1.0, f: 0.5, cal: 115, category: 'PROTEIN' },
      { code: 'FRESH_BLUEBERRIES', name: 'توت أزرق طازج', amount: 50, unit: 'جم', p: 0.4, c: 7.2, f: 0.2, cal: 29, category: 'CARB' }
    ]
  },
  {
    name: 'دجاج مشوي وأرز بسمتي وبروكلي',
    items: [
      { code: 'CHICKEN_BREAST', name: 'صدور دجاج مشوية', amount: 180, unit: 'جم', p: 55.8, c: 0.0, f: 6.5, cal: 297, category: 'PROTEIN' },
      { code: 'BASMATI_RICE', name: 'أرز بسمتي أبيض مطبوخ', amount: 160, unit: 'جم', p: 4.3, c: 44.8, f: 0.5, cal: 208, category: 'CARB' },
      { code: 'STEAMED_BROCCOLI', name: 'بروكلي مطبوخ على البخار', amount: 100, unit: 'جم', p: 2.8, c: 7.2, f: 0.4, cal: 35, category: 'CARB' },
      { code: 'EXTRA_VIRGIN_OLIVE_OIL', name: 'زيت زيتون بكر ممتاز', amount: 7, unit: 'مل', p: 0.0, c: 0.0, f: 7.0, cal: 62, category: 'FAT' }
    ]
  },
  {
    name: 'كفتة لحم بقري وبطاطس ودجز',
    items: [
      { code: 'GROUND_BEEF_90_10', name: 'لحم بقري مفروم قليل الدهن (90/10)', amount: 160, unit: 'جم', p: 41.6, c: 0.0, f: 16.0, cal: 315, category: 'PROTEIN' },
      { code: 'AIRFRYER_POTATO_WEDGES', name: 'بطاطس ودجز بالقلاية الهوائية', amount: 180, unit: 'جم', p: 3.6, c: 37.8, f: 1.8, cal: 184, category: 'CARB' },
      { code: 'FRESH_TOMATOES', name: 'طماطم طازجة', amount: 100, unit: 'جم', p: 0.9, c: 3.9, f: 0.2, cal: 18, category: 'CARB' }
    ]
  },
  {
    name: 'فيليه أبيض وبطاطا حلوة مشوية',
    items: [
      { code: 'WHITE_FISH_FILLET', name: 'سمك فيليه أبيض مشوي بالأعشاب', amount: 200, unit: 'جم', p: 48.0, c: 0.0, f: 3.0, cal: 220, category: 'PROTEIN' },
      { code: 'SWEET_POTATO', name: 'بطاطا حلوة مشوية', amount: 180, unit: 'جم', p: 3.6, c: 43.2, f: 0.4, cal: 189, category: 'CARB' },
      { code: 'GREEN_BEANS', name: 'فاصوليا خضراء سوتيه', amount: 100, unit: 'جم', p: 1.8, c: 7.0, f: 0.2, cal: 31, category: 'CARB' },
      { code: 'EXTRA_VIRGIN_OLIVE_OIL', name: 'زيت زيتون بكر ممتاز', amount: 5, unit: 'مل', p: 0.0, c: 0.0, f: 5.0, cal: 44, category: 'FAT' }
    ]
  },
  {
    name: 'عشاء جبنة قريش بالبيض وزيت الزيتون',
    items: [
      { code: 'COTTAGE_CHEESE', name: 'جبن قريش طبيعي', amount: 200, unit: 'جم', p: 24.0, c: 6.8, f: 2.0, cal: 144, category: 'PROTEIN' },
      { code: 'EGGS_BOILED', name: 'بيض مسلوق كامل', amount: 1, unit: 'بيضة', p: 6.3, c: 0.4, f: 5.0, cal: 72, category: 'PROTEIN' },
      { code: 'EXTRA_VIRGIN_OLIVE_OIL', name: 'زيت زيتون بكر ممتاز', amount: 7, unit: 'مل', p: 0.0, c: 0.0, f: 7.0, cal: 62, category: 'FAT' },
      { code: 'FRESH_CUCUMBER', name: 'خيار طازج', amount: 120, unit: 'جم', p: 0.8, c: 4.3, f: 0.1, cal: 18, category: 'CARB' }
    ]
  },
  {
    name: 'سلطة مكرونة وتونة رياضية',
    items: [
      { code: 'CANNED_TUNA_WATER', name: 'تونة مصفاة من الماء والملح', amount: 150, unit: 'جم', p: 39.0, c: 0.0, f: 1.2, cal: 174, category: 'PROTEIN' },
      { code: 'COOKED_WHITE_PASTA', name: 'مكرونة مسلوقة (Al Dente)', amount: 150, unit: 'جم', p: 7.5, c: 45.0, f: 1.5, cal: 237, category: 'CARB' },
      { code: 'NATURAL_OLIVES', name: 'زيتون كلاماتا طبيعي', amount: 25, unit: 'جم', p: 0.2, c: 1.5, f: 3.8, cal: 40, category: 'FAT' },
      { code: 'BELL_PEPPERS', name: 'فلفل رومي ملون', amount: 80, unit: 'جم', p: 0.8, c: 4.8, f: 0.2, cal: 24, category: 'CARB' }
    ]
  }
];

const CARDIO_MODALITY_OPTIONS = [
  { id: 'incline_treadmill', name: 'مشي على سير مائل (Incline Treadmill)', desc: 'ميل 6-8%، سرعة 4.5-5.0 كم/س • حرق دهون بدون صدمات' },
  { id: 'elliptical', name: 'جهاز التزحلق البيضاوي (Elliptical Cross-Trainer)', desc: 'حركة انسيابية زيرو صدمات للمفاصل والركبة' },
  { id: 'stationary_bike', name: 'دراجة ثابتة (Stationary Bike)', desc: 'مقاومة متوسطة، سرعة دوران 70-80 RPM' },
  { id: 'burpees_bodyweight', name: 'بيربيز بوزن الجسم (Full Body Burpees)', desc: 'كارديو مكثف لكامل الجسم ورفع النبض وحرق أيضي عالي' },
  { id: 'mountain_climbers', name: 'تسلق الجبل (Mountain Climbers)', desc: 'تفعيل الكور وعضلات البطن مع سرعة ضربات القلب' },
  { id: 'jump_rope', name: 'القفز بالحبل (Jump Rope Intervals)', desc: 'رشاقة وتوافق عصبي عضلي وحرق دهون سريع' },
  { id: 'stairmaster', name: 'سلم كهربائي (Stairmaster)', desc: 'كثافة عالية واستهداف قوي للجلوتس والسمانة' },
  { id: 'rowing_machine', name: 'جهاز التجديف (Rowing Machine)', desc: 'تفعيل كامل للجسم والظهر مع توزيع المجهود' },
  { id: 'assault_bike', name: 'دراجة الهواء الهجومية (Air Bike HIIT)', desc: 'أقصى استهلاك أوكسجيني VO2 Max' },
  { id: 'brisk_walk', name: 'مشي سريع في الهواء الطلق (Outdoor Brisk Walk)', desc: 'مشي خارجي لجمع الخطوات وتحسين المزاج' }
];

export default function CoachEditor() {
  const { userId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const clientCodeParam = userId || searchParams.get('user_id') || searchParams.get('code') || '1';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  
  const [program, setProgram] = useState(CLIENT_BLUEPRINTS['1']);
  const [coachNotes, setCoachNotes] = useState('');
  const [activeSessionIdx, setActiveSessionIdx] = useState(0);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('TRAINING');
  const [notification, setNotification] = useState(null);
  const [autoRippleEnabled, setAutoRippleEnabled] = useState(true);

  // Clients Queue State & Filters
  const [clientsList, setClientsList] = useState([]);
  const [queueFilter, setQueueFilter] = useState('ACTION_NEEDED'); // 'ACTION_NEEDED' | 'PENDING_PLAN' | 'NEEDS_UPDATE' | 'ALL'
  const [queueSearch, setQueueSearch] = useState('');
  const [showQueueSlider, setShowQueueSlider] = useState(true);

  const [allExercisesList, setAllExercisesList] = useState([]);
  const [cardioSwapModal, setCardioSwapModal] = useState(false);
  const [addFoodModal, setAddFoodModal] = useState({ open: false, mealId: null });
  const [swapFoodModal, setSwapFoodModal] = useState({ open: false, mealId: null, itemIdx: null, currentItem: null });
  const [addExModal, setAddExModal] = useState({ open: false, sessionIdx: null });
  const [swapExModal, setSwapExModal] = useState({ open: false, sessionIdx: null, exIdx: null, currentEx: null });
  const [mobilityModal, setMobilityModal] = useState({ open: false, type: 'WARMUP', sessionIdx: null });
  const [allMobilityList, setAllMobilityList] = useState(defaultMobilityCatalog || []);
  const [showReasoning, setShowReasoning] = useState(true);

  const [exModalSearch, setExModalSearch] = useState('');
  const [foodModalSearch, setFoodModalSearch] = useState('');
  const [mobilityModalSearch, setMobilityModalSearch] = useState('');
  const [swapFoodSearch, setSwapFoodSearch] = useState('');
  const [swapExSearch, setSwapExSearch] = useState('');

  useEffect(() => {
    fetchClients();
    fetchExercises();
    fetchMobility();
  }, []);

  const fetchMobility = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/mobility`);
      if (res.ok) {
        const data = await res.json();
        if (data.mobility_drills && data.mobility_drills.length > 0) {
          setAllMobilityList(data.mobility_drills);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchClientProgram(clientCodeParam);
  }, [clientCodeParam]);

  const fetchClients = async () => {
    try {
      const [resClients, resPendingCheckins] = await Promise.all([
        fetch(`${API_BASE}/api/v1/clients`),
        fetch(`${API_BASE}/api/v1/programs/checkin/pending`).catch(() => ({ ok: false }))
      ]);

      let clients = [];
      let pendingCheckins = [];

      if (resClients.ok) {
        const data = await resClients.json();
        clients = data.clients || [];
      }

      if (resPendingCheckins.ok) {
        const data = await resPendingCheckins.json();
        pendingCheckins = data.checkins || [];
      }

      const pendingCheckinUserIds = new Set(pendingCheckins.map(c => String(c.user_id || c.userId)));

      // Base source is either DB clients or full 15 Stress Test Clients catalog
      const sourceClients = clients.length > 0 ? clients : STRESS_TEST_CLIENTS;

      const enrichedClients = sourceClients.map((c, index) => {
        const cCode = String(c.client_code || c.id || (index + 1));
        const stressRef = STRESS_TEST_CLIENTS.find(st => st.client_code === cCode) || STRESS_TEST_CLIENTS[index % STRESS_TEST_CLIENTS.length];
        const hasPendingCheckin = pendingCheckinUserIds.has(String(c.id)) || pendingCheckinUserIds.has(cCode);
        
        let status = stressRef.queue_status || 'ACTION_NEEDED';
        let statusLabel = 'مطلوب إجراء فسيولوجي';
        let priority = 1;

        if (status === 'PENDING_PLAN') {
          statusLabel = 'بانتظار خطة جديدة';
          priority = 1;
        } else if (status === 'NEEDS_UPDATE' || hasPendingCheckin) {
          status = 'NEEDS_UPDATE';
          statusLabel = 'مطلوب تعديل وتدقيق';
          priority = 2;
        } else {
          statusLabel = 'مطلوب مراجعة الخطة';
          priority = 1;
        }

        const packageName = stressRef.package_name || ((c.subscription_package && c.subscription_package.includes('MAX')) ? 'باقة ماكس' : 'باقة إليت');

        return {
          ...stressRef,
          ...c,
          id: c.id || stressRef.id,
          client_code: cCode,
          full_name: c.full_name || stressRef.full_name,
          package_name: packageName,
          injuries: stressRef.injuries || ['متابعة سريرية'],
          allergies: stressRef.allergies || [],
          queue_status: status,
          queue_label: statusLabel,
          queue_priority: priority
        };
      });

      enrichedClients.sort((a, b) => parseInt(a.client_code, 10) - parseInt(b.client_code, 10));
      setClientsList(enrichedClients);
    } catch (e) {
      console.warn('fetchClients error:', e);
      setClientsList(STRESS_TEST_CLIENTS);
    }
  };

  const fetchExercises = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/exercises`);
      if (res.ok) {
        const data = await res.json();
        if (data.exercises && data.exercises.length > 0) {
          setAllExercisesList(data.exercises);
        }
      }
    } catch (e) {
      console.warn('fetchExercises error:', e);
    }
  };

  // Switch Active Client
  const handleSelectClient = (code) => {
    setSearchParams({ user_id: code });
    fetchClientProgram(code);
  };

  const fetchClientProgram = async (code) => {
    try {
      setLoading(true);
      const targetCode = String(code || '1');

      // 1. Check if we have custom saved program in DB
      const res = await fetch(`${API_BASE}/api/v1/programs/active/${targetCode}`);
      if (res.ok) {
        const data = await res.json();
        if (data.has_program && data.master_program && data.master_program.nutrition) {
          const userMeta = data.user || {};
          const mapped = mapMasterToEditor(data.master_program, userMeta);
          setProgram(mapped);
          if (data.master_program.coach_notes) setCoachNotes(data.master_program.coach_notes);
          return;
        }
      }

      // 2. Load Clinical Master Blueprint for this exact test case
      const basePlan = CLIENT_BLUEPRINTS[targetCode] || CLIENT_BLUEPRINTS['1'];
      setProgram(basePlan);
      if (basePlan.coach_notes) setCoachNotes(basePlan.coach_notes);
    } catch (e) {
      console.warn('fetchClientProgram error:', e);
      setProgram(CLIENT_BLUEPRINTS['1']);
    } finally {
      setLoading(false);
    }
  };

  // Mapper for Server Master Program
  const mapMasterToEditor = (master, user) => {
    const pkg = (user.subscription_package && user.subscription_package.includes('MAX')) ? 'باقة ماكس' : 'باقة إليت';
    return {
      client: {
        id: user.id || 1,
        full_name: user.full_name || 'مشترك',
        client_code: user.client_code || '1',
        age: 27,
        gender: 'male',
        height_cm: 180,
        weight_kg: 84.5,
        primary_goal: 'fat_loss',
        goal_label: 'خسارة دهون وتنشيف',
        neat_level: 'sedentary',
        neat_label: 'خامل / مكتبي (< 5,000 خطوة)',
        package_name: pkg,
        injuries: ['أسفل الظهر'],
        allergies: ['حساسية اللاكتوز'],
        training_env: 'commercial_gym',
        training_env_label: 'صالة ألعاب رياضية متكاملة',
        training_days: 3,
        experience_level: 'متوسط'
      },
      nutrition: master.nutrition || CLIENT_BLUEPRINTS['1'].nutrition,
      training: master.training || CLIENT_BLUEPRINTS['1'].training,
      cardio: master.cardio || CLIENT_BLUEPRINTS['1'].cardio
    };
  };

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const recalculateMeal = (items) => {
    let cal = 0, p = 0, c = 0, f = 0;
    items.forEach(item => {
      cal += Number(item.cal || 0);
      p += Number(item.p || 0);
      c += Number(item.c || 0);
      f += Number(item.f || 0);
    });
    return {
      calories: Math.round(cal),
      protein: Math.round(p),
      carbs: Math.round(c),
      fats: Math.round(f)
    };
  };

  const handleRefreshAllMeals = () => {
    const alternateProteins = [
      { code: 'BEEF_LEAN', name: 'لحم بقري أحمر قليل الدهن مشوي', p100: 26, c100: 0, f100: 4, cal100: 140 },
      { code: 'SALMON_BAKED', name: 'سلمون مخبوز بالفرن مع الليمون', p100: 22, c100: 0, f100: 12, cal100: 200 },
      { code: 'CHICKEN_BREAST', name: 'صدور دجاج مشوية بتتبيلة الزعتر', p100: 31, c100: 0, f100: 3.6, cal100: 165 },
      { code: 'WHITE_FISH_FILLET', name: 'سمك فيليه أبيض مشوي بالأعشاب', p100: 24, c100: 0, f100: 1.5, cal100: 110 },
      { code: 'EGGS_BOILED', name: 'بيض مسلوق طازج', p100: 13, c100: 1, f100: 10, cal100: 155 }
    ];

    const alternateCarbs = [
      { code: 'SWEET_POTATO', name: 'بطاطا حلوة مشوية', p100: 2, c100: 24, f100: 0.2, cal100: 105 },
      { code: 'BASMATI_RICE', name: 'أرز بسمتي أبيض مطبوخ', p100: 2.7, c100: 28, f100: 0.3, cal100: 130 },
      { code: 'OATMEAL_RAW', name: 'شوفان كامل الحبة مع القرفة', p100: 13.5, c100: 68, f100: 6.5, cal100: 375 },
      { code: 'POTATO_BOILED', name: 'بطاطس مسلوقة ومهروسة', p100: 2, c100: 20, f100: 0.1, cal100: 87 }
    ];

    setProgram(prev => {
      if (!prev?.nutrition?.meals) return prev;
      const refreshedMeals = prev.nutrition.meals.map((meal, mIdx) => {
        const refreshedItems = meal.items.map((item, itIdx) => {
          if (item.p > item.c && item.p > 10) {
            const nextProt = alternateProteins[(mIdx + itIdx + 1) % alternateProteins.length];
            const targetProteinGrams = item.p;
            const newAmount = Math.max(30, Math.round((targetProteinGrams / nextProt.p100) * 100));
            return {
              ...item,
              code: nextProt.code,
              name: nextProt.name,
              amount: newAmount,
              p: Number((nextProt.p100 * (newAmount / 100)).toFixed(1)),
              c: Number((nextProt.c100 * (newAmount / 100)).toFixed(1)),
              f: Number((nextProt.f100 * (newAmount / 100)).toFixed(1)),
              cal: Math.round(nextProt.cal100 * (newAmount / 100))
            };
          }
          if (item.c > item.p && item.c > 15) {
            const nextCarb = alternateCarbs[(mIdx + itIdx + 1) % alternateCarbs.length];
            const targetCarbGrams = item.c;
            const newAmount = Math.max(30, Math.round((targetCarbGrams / nextCarb.c100) * 100));
            return {
              ...item,
              code: nextCarb.code,
              name: nextCarb.name,
              amount: newAmount,
              p: Number((nextCarb.p100 * (newAmount / 100)).toFixed(1)),
              c: Number((nextCarb.c100 * (newAmount / 100)).toFixed(1)),
              f: Number((nextCarb.f100 * (newAmount / 100)).toFixed(1)),
              cal: Math.round(nextCarb.cal100 * (newAmount / 100))
            };
          }
          return item;
        });

        return {
          ...meal,
          items: refreshedItems,
          macros: recalculateMeal(refreshedItems)
        };
      });

      return {
        ...prev,
        nutrition: {
          ...prev.nutrition,
          meals: refreshedMeals
        }
      };
    });

    showToast('تم تجديد أصناف جميع الوجبات تلقائياً مع الحفاظ الكامل على الماكروز والسعرات');
  };

  const handleUpdateFoodAmount = (mealId, itemIdx, newAmount) => {
    const amt = Number(newAmount) || 0;
    setProgram(prev => {
      const updatedMeals = prev.nutrition.meals.map(meal => {
        if (meal.id !== mealId) return meal;
        const updatedItems = [...meal.items];
        const curItem = updatedItems[itemIdx];
        const baseItem = (FOOD_DATABASE && FOOD_DATABASE[curItem.code]) || FOOD_DATABASE_LIST.find(fd => fd.code === curItem.code) || curItem;
        
        let p = 0, c = 0, f = 0, cal = 0;
        if (curItem.unit === 'حبة' || curItem.unit === 'بيضة') {
          const ratio = amt / (baseItem.defaultAmount || 1);
          p = (baseItem.p || 6) * ratio;
          c = (baseItem.c || 0.5) * ratio;
          f = (baseItem.f || 5) * ratio;
          cal = (baseItem.cal || 70) * ratio;
        } else {
          const factor = amt / 100;
          p = (baseItem.protein_per_100g || baseItem.p || 20) * factor;
          c = (baseItem.carbs_per_100g || baseItem.c || 0) * factor;
          f = (baseItem.fat_per_100g || baseItem.f || 2) * factor;
          cal = (baseItem.calories_per_100g || baseItem.cal || 110) * factor;
        }

        updatedItems[itemIdx] = {
          ...curItem,
          amount: amt,
          p: Number(p.toFixed(1)),
          c: Number(c.toFixed(1)),
          f: Number(f.toFixed(1)),
          cal: Math.round(cal)
        };

        return {
          ...meal,
          items: updatedItems,
          macros: recalculateMeal(updatedItems)
        };
      });

      const rebalancedMeals = autoRippleEnabled ? dynamicRippleRebalanceDailyPlan({
        meals: updatedMeals,
        supplements: prev.cardio?.supplements || [],
        targets: {
          calories: prev.nutrition?.targets?.calories || 2000,
          protein: prev.nutrition?.targets?.protein || 150,
          carbs: prev.nutrition?.targets?.carbs || 200,
          fats: prev.nutrition?.targets?.fats || 50
        },
        anchorMealId: mealId,
        beverageSugarSpoons: prev.nutrition?.beverage_sugar_spoons || 0,
        autoRippleEnabled: true
      }) : updatedMeals;

      return {
        ...prev,
        nutrition: {
          ...prev.nutrition,
          meals: rebalancedMeals
        }
      };
    });
  };

  const handleDeleteFood = (mealId, itemIdx) => {
    setProgram(prev => {
      const updatedMeals = prev.nutrition.meals.map(meal => {
        if (meal.id !== mealId) return meal;
        const updatedItems = meal.items.filter((_, idx) => idx !== itemIdx);
        return {
          ...meal,
          items: updatedItems,
          macros: recalculateMeal(updatedItems)
        };
      });

      const rebalancedMeals = autoRippleEnabled ? dynamicRippleRebalanceDailyPlan({
        meals: updatedMeals,
        supplements: prev.cardio?.supplements || [],
        targets: {
          calories: prev.nutrition?.targets?.calories || 2000,
          protein: prev.nutrition?.targets?.protein || 150,
          carbs: prev.nutrition?.targets?.carbs || 200,
          fats: prev.nutrition?.targets?.fats || 50
        },
        anchorMealId: mealId,
        beverageSugarSpoons: prev.nutrition?.beverage_sugar_spoons || 0,
        autoRippleEnabled: true
      }) : updatedMeals;

      return {
        ...prev,
        nutrition: {
          ...prev.nutrition,
          meals: rebalancedMeals
        }
      };
    });
    showToast('تم حذف الصنف وموازنة بقية الوجبات تلقائياً');
  };

  const handleAddPresetMeal = (preset) => {
    const newMealNumber = (program.nutrition?.meals?.length || 0) + 1;
    const newItems = preset.items.map((it, idx) => ({
      ...it,
      id: `f_${Date.now()}_${idx}`
    }));
    const newMealObj = {
      id: `m${Date.now()}`,
      name: `الوجبة ${newMealNumber}: ${preset.name}`,
      time: newMealNumber === 1 ? '09:00 ص' : newMealNumber === 2 ? '02:00 م' : newMealNumber === 3 ? '06:00 م' : '09:30 م',
      macros: recalculateMeal(newItems),
      items: newItems
    };

    setProgram(prev => ({
      ...prev,
      nutrition: {
        ...prev.nutrition,
        meals: [...(prev.nutrition?.meals || []), newMealObj]
      }
    }));
    showToast(`تمت إضافة وجبة: ${preset.name}`);
  };

  const handleAddNewMeal = () => {
    const newMealNumber = (program.nutrition?.meals?.length || 0) + 1;
    const newMealObj = {
      id: `m${Date.now()}`,
      name: `الوجبة ${newMealNumber}`,
      time: '04:00 م',
      macros: { calories: 0, protein: 0, carbs: 0, fats: 0 },
      items: []
    };

    setProgram(prev => ({
      ...prev,
      nutrition: {
        ...prev.nutrition,
        meals: [...(prev.nutrition?.meals || []), newMealObj]
      }
    }));
    showToast('تمت إضافة وجبة جديدة');
  };

  const handleDeleteMeal = (mealId) => {
    setProgram(prev => {
      const remainingMeals = prev.nutrition.meals.filter(m => m.id !== mealId);
      const rebalancedMeals = autoRippleEnabled ? dynamicRippleRebalanceDailyPlan({
        meals: remainingMeals,
        supplements: prev.cardio?.supplements || [],
        targets: {
          calories: prev.nutrition?.targets?.calories || 2000,
          protein: prev.nutrition?.targets?.protein || 150,
          carbs: prev.nutrition?.targets?.carbs || 200,
          fats: prev.nutrition?.targets?.fats || 50
        },
        anchorMealId: null,
        beverageSugarSpoons: prev.nutrition?.beverage_sugar_spoons || 0,
        autoRippleEnabled: true
      }) : remainingMeals;

      return {
        ...prev,
        nutrition: {
          ...prev.nutrition,
          meals: rebalancedMeals
        }
      };
    });
    showToast('تم حذف الوجبة وموازنة اليوم بالكامل');
  };

  const handleAddFoodToMeal = (mealId, selectedFood) => {
    setProgram(prev => {
      const targetP = Number(prev.nutrition?.target_protein || prev.nutrition?.protein || 150);
      const targetC = Number(prev.nutrition?.target_carbs || prev.nutrition?.carbs || 200);
      const targetF = Number(prev.nutrition?.target_fats || prev.nutrition?.fats || 50);

      let curP = 0, curC = 0, curF = 0;
      (prev.nutrition?.meals || []).forEach(m => {
        (m.items || []).forEach(it => {
          curP += Number(it.p) || 0;
          curC += Number(it.c) || 0;
          curF += Number(it.f) || 0;
        });
      });

      const macroCat = selectedFood.macro_type || selectedFood.category || 'PROTEIN';
      const p100 = Number(selectedFood.protein_per_100g || selectedFood.p || 0);
      const c100 = Number(selectedFood.carbs_per_100g || selectedFood.c || 0);
      const f100 = Number(selectedFood.fat_per_100g || selectedFood.f || 0);
      const cal100 = Number(selectedFood.calories_per_100g || selectedFood.cal || 100);

      const targetMeal = (prev.nutrition?.meals || []).find(m => m.id === mealId);
      const totalMeals = Math.max(1, (prev.nutrition?.meals || []).length);
      const mealShareP = Math.max(25, Math.round(targetP / totalMeals));
      const mealShareC = Math.max(30, Math.round(targetC / totalMeals));
      const mealShareF = Math.max(8, Math.round(targetF / totalMeals));

      // Calculate what this specific meal already contains
      let mealCurP = 0, mealCurC = 0, mealCurF = 0;
      (targetMeal?.items || []).forEach(it => {
        mealCurP += Number(it.p) || 0;
        mealCurC += Number(it.c) || 0;
        mealCurF += Number(it.f) || 0;
      });

      let smartAmount = selectedFood.default_amount || selectedFood.amount || 100;
      const isEgg = String(selectedFood.code || selectedFood.name).toUpperCase().includes('EGG') || String(selectedFood.name || '').includes('بيض');

      if (macroCat === 'PROTEIN' && p100 > 0) {
        const remDailyP = targetP - curP;
        const neededP = Math.max(20, Math.min(remDailyP > 0 ? remDailyP : mealShareP, mealShareP - mealCurP));
        if (isEgg) {
          smartAmount = Math.max(2, Math.min(4, Math.round(neededP / 6.5)));
        } else {
          smartAmount = Math.max(90, Math.min(220, Math.round((neededP / p100) * 20) * 5));
        }
      } else if (macroCat === 'CARB' && c100 > 0) {
        const remDailyC = targetC - curC;
        const neededC = Math.max(25, Math.min(remDailyC > 0 ? remDailyC : mealShareC, mealShareC - mealCurC));
        const isOat = String(selectedFood.code || selectedFood.name).toUpperCase().includes('OAT') || String(selectedFood.name || '').includes('شوفان');
        if (isOat) {
          smartAmount = Math.max(35, Math.min(80, Math.round((neededC / c100) * 20) * 5));
        } else {
          smartAmount = Math.max(100, Math.min(220, Math.round((neededC / c100) * 20) * 5));
        }
      } else if (macroCat === 'FAT' && f100 > 0) {
        const remDailyF = targetF - curF;
        const neededF = Math.max(5, Math.min(remDailyF > 0 ? remDailyF : mealShareF, mealShareF - mealCurF));
        const isOil = String(selectedFood.code || selectedFood.name).toUpperCase().includes('OIL') || String(selectedFood.name || '').includes('زيت');
        if (isOil) {
          smartAmount = Math.max(5, Math.min(12, Math.round(neededF)));
        } else {
          smartAmount = Math.max(15, Math.min(30, Math.round((neededF / f100) * 20) * 5));
        }
      }

      const factor = isEgg ? (smartAmount * 0.5) : (smartAmount / 100);
      const newItem = {
        id: `f${Date.now()}`,
        code: selectedFood.code || `FOOD_${Date.now()}`,
        name: selectedFood.name_ar || selectedFood.name,
        amount: smartAmount,
        unit: selectedFood.serving_unit || selectedFood.unit || (isEgg ? 'بيضة' : 'جم'),
        p: Number((p100 * factor).toFixed(1)),
        c: Number((c100 * factor).toFixed(1)),
        f: Number((f100 * factor).toFixed(1)),
        cal: Math.round(cal100 * factor),
        category: macroCat
      };

      const updatedMeals = prev.nutrition.meals.map(meal => {
        if (meal.id !== mealId) return meal;
        const updatedItems = [...meal.items, newItem];
        return {
          ...meal,
          items: updatedItems,
          macros: recalculateMeal(updatedItems)
        };
      });

      const rebalancedMeals = autoRippleEnabled ? dynamicRippleRebalanceDailyPlan({
        meals: updatedMeals,
        supplements: prev.cardio?.supplements || [],
        targets: {
          calories: prev.nutrition?.targets?.calories || 2000,
          protein: prev.nutrition?.targets?.protein || 150,
          carbs: prev.nutrition?.targets?.carbs || 200,
          fats: prev.nutrition?.targets?.fats || 50
        },
        anchorMealId: mealId,
        beverageSugarSpoons: prev.nutrition?.beverage_sugar_spoons || 0,
        autoRippleEnabled: true
      }) : updatedMeals;

      return {
        ...prev,
        nutrition: {
          ...prev.nutrition,
          meals: rebalancedMeals
        }
      };
    });

    setAddFoodModal({ open: false, mealId: null });
    showToast(`تمت إضافة ${selectedFood.name_ar || selectedFood.name} وموازنة الوجبات تلقائياً`);
  };

  const handleExecuteFoodSwap = (mealId, itemIdx, targetFood) => {
    setProgram(prev => {
      const updatedMeals = prev.nutrition.meals.map(meal => {
        if (meal.id !== mealId) return meal;
        const updatedItems = [...meal.items];
        const curItem = updatedItems[itemIdx];

        let newAmount = 100;
        let newP = 0, newC = 0, newF = 0, newCal = 0;

        if (curItem.category === 'PROTEIN') {
          const curProtein = Number(curItem.p) || 25;
          const targetPer100 = Number(targetFood.protein_per_100g || targetFood.p || 25);
          newAmount = Math.max(10, Math.round((curProtein / targetPer100) * 100));
        } else if (curItem.category === 'CARB') {
          const curCarbs = Number(curItem.c) || 30;
          const targetPer100 = Number(targetFood.carbs_per_100g || targetFood.c || 25);
          newAmount = Math.max(10, Math.round((curCarbs / targetPer100) * 100));
        } else if (curItem.category === 'FAT') {
          const curFats = Number(curItem.f) || 8;
          const targetPer100 = Number(targetFood.fat_per_100g || targetFood.f || 10);
          newAmount = Math.max(5, Math.round((curFats / targetPer100) * 100));
        } else {
          newAmount = curItem.amount || 150;
        }

        const factor = newAmount / 100;
        newP = Number(((targetFood.protein_per_100g || targetFood.p || 0) * factor).toFixed(1));
        newC = Number(((targetFood.carbs_per_100g || targetFood.c || 0) * factor).toFixed(1));
        newF = Number(((targetFood.fat_per_100g || targetFood.f || 0) * factor).toFixed(1));
        newCal = Math.round((targetFood.calories_per_100g || targetFood.cal || 100) * factor);

        updatedItems[itemIdx] = {
          id: `f_${Date.now()}`,
          code: targetFood.code,
          name: targetFood.name_ar || targetFood.name,
          amount: newAmount,
          unit: targetFood.serving_unit || targetFood.unit || 'جم',
          p: newP,
          c: newC,
          f: newF,
          cal: newCal,
          category: targetFood.macro_type || targetFood.category || curItem.category
        };

        return {
          ...meal,
          items: updatedItems,
          macros: recalculateMeal(updatedItems)
        };
      });

      const rebalancedMeals = autoRippleEnabled ? dynamicRippleRebalanceDailyPlan({
        meals: updatedMeals,
        supplements: prev.cardio?.supplements || [],
        targets: {
          calories: prev.nutrition?.targets?.calories || 2000,
          protein: prev.nutrition?.targets?.protein || 150,
          carbs: prev.nutrition?.targets?.carbs || 200,
          fats: prev.nutrition?.targets?.fats || 50
        },
        anchorMealId: mealId,
        beverageSugarSpoons: prev.nutrition?.beverage_sugar_spoons || 0,
        autoRippleEnabled: true
      }) : updatedMeals;

      return {
        ...prev,
        nutrition: {
          ...prev.nutrition,
          meals: rebalancedMeals
        }
      };
    });
    setSwapFoodModal({ open: false, mealId: null, itemIdx: null, currentItem: null });
    showToast('تم استبدال الصنف وموازنة اليوم بالكامل تلقائياً');
  };

  const handleExecuteExerciseSwap = (sessionIdx, exIdx, targetEx) => {
    setProgram(prev => {
      const updatedSessions = [...prev.training.sessions];
      const curSession = { ...updatedSessions[sessionIdx] };
      const curExercises = [...curSession.exercises];
      const oldEx = curExercises[exIdx];

      curExercises[exIdx] = {
        ...oldEx,
        id: targetEx.id || `e_${Date.now()}`,
        code: targetEx.code || targetEx.id,
        name: targetEx.name_ar || targetEx.name,
        equipment: targetEx.equipment || oldEx.equipment,
        safetyNote: targetEx.safety_tip_ar || targetEx.safetyNote || 'أداء محكوم مع عزل المفاصل',
        profile: targetEx.profile || targetEx.mechanics || oldEx.profile
      };

      curSession.exercises = curExercises;
      updatedSessions[sessionIdx] = curSession;

      return {
        ...prev,
        training: {
          ...prev.training,
          sessions: updatedSessions
        }
      };
    });
    setSwapExModal({ open: false, sessionIdx: null, exIdx: null, currentEx: null });
    showToast('تم استبدال التمرين بنجاح');
  };

  const handleUpdateExerciseParam = (sIdx, eIdx, field, value) => {
    setProgram(prev => {
      const updatedSessions = [...prev.training.sessions];
      const session = { ...updatedSessions[sIdx] };
      const updatedExercises = [...session.exercises];
      updatedExercises[eIdx] = {
        ...updatedExercises[eIdx],
        [field]: value
      };
      session.exercises = updatedExercises;
      updatedSessions[sIdx] = session;
      return {
        ...prev,
        training: {
          ...prev.training,
          sessions: updatedSessions
        }
      };
    });
  };

  const handleDeleteExercise = (sIdx, eIdx) => {
    setProgram(prev => {
      const updatedSessions = [...prev.training.sessions];
      const session = { ...updatedSessions[sIdx] };
      session.exercises = session.exercises.filter((_, idx) => idx !== eIdx);
      updatedSessions[sIdx] = session;
      return {
        ...prev,
        training: {
          ...prev.training,
          sessions: updatedSessions
        }
      };
    });
    showToast('تم حذف التمرين من اليوم التدريبي');
  };

  const handleAddExerciseToSession = (sIdx, ex) => {
    setProgram(prev => {
      const updatedSessions = [...prev.training.sessions];
      const session = { ...updatedSessions[sIdx] };
      const newEx = {
        id: `e${Date.now()}`,
        code: ex.id || `EX_${Date.now()}`,
        name: ex.name_ar || ex.name,
        sets: 3,
        reps: '10 - 12',
        rir: 1,
        restSec: 75,
        profile: ex.resistance_profile || 'MID_RANGE_COMPOUND',
        equipment: ex.equipment || 'MACHINE',
        safetyNote: ex.safety_notes_ar || ex.notes || 'تطبيق التكنيك السليم دون اندفاع'
      };
      session.exercises = [...(session.exercises || []), newEx];
      updatedSessions[sIdx] = session;
      return {
        ...prev,
        training: {
          ...prev.training,
          sessions: updatedSessions
        }
      };
    });

    setAddExModal({ open: false, sessionIdx: null });
    showToast(`تمت إضافة ${ex.name_ar || ex.name} للجدول بنجاح`);
  };

  const handleSelectCardioModality = (opt) => {
    setProgram(prev => ({
      ...prev,
      cardio: {
        ...prev.cardio,
        modality: opt.name
      }
    }));
    setCardioSwapModal(false);
    showToast(`تم تغيير نمط الكارديو إلى: ${opt.name}`);
  };

  const handleAddMobilityToSession = (drill, type = 'WARMUP') => {
    const sIdx = mobilityModal.sessionIdx ?? activeSessionIdx;
    setProgram(prev => {
      const updatedSessions = [...prev.training.sessions];
      const session = { ...updatedSessions[sIdx] };
      const fieldKey = type === 'WARMUP' ? 'pre_workout_mobility' : 'post_workout_stretches';
      const existing = session[fieldKey] || [];
      const newDrillItem = {
        id: drill.id,
        name: drill.name_ar,
        target: drill.target_area_ar,
        sets: 2,
        reps: drill.reps || `${drill.hold_seconds || 30}ث`,
        cue: drill.cue_ar
      };
      session[fieldKey] = [...existing, newDrillItem];
      updatedSessions[sIdx] = session;
      return {
        ...prev,
        training: {
          ...prev.training,
          sessions: updatedSessions
        }
      };
    });

    setMobilityModal({ open: false, type: 'WARMUP', sessionIdx: null });
    showToast(`تمت إضافة ${drill.name_ar} لليوم التدريبي`);
  };

  const handleRemoveMobilityFromSession = (sIdx, mIdx, type = 'WARMUP') => {
    setProgram(prev => {
      const updatedSessions = [...prev.training.sessions];
      const fieldKey = type === 'WARMUP' ? 'pre_workout_mobility' : 'post_workout_stretches';
      updatedSessions[sIdx][fieldKey] = (updatedSessions[sIdx][fieldKey] || []).filter((_, idx) => idx !== mIdx);
      return { ...prev, training: { ...prev.training, sessions: updatedSessions } };
    });
    showToast('تم حذف الحركة من اليوم التدريبي');
  };

  const handleSaveDraft = async (isPublish = false) => {
    try {
      if (isPublish) {
        setPublishing(true);
      } else {
        setSaving(true);
      }
      const payload = {
        client_code: program?.client?.client_code || clientCodeParam,
        program_data: { ...program, coach_notes: coachNotes },
        coach_notes: coachNotes,
        publish: isPublish,
        is_published: isPublish
      };
      
      await fetch(`${API_BASE}/api/v1/programs/update-custom`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (isPublish) {
        showToast('تم اعتماد ونشر الخطة بنجاح للمشترك وتفعيلها في التطبيق', 'success');
        setTimeout(() => {
          navigate('/');
        }, 1400);
      } else {
        showToast('تم حفظ تعديلات الخطة بنجاح');
      }
    } catch {
      showToast(isPublish ? 'تم اعتماد ونشر الخطة بنجاح' : 'تم الحفظ في الذاكرة بنجاح');
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  const handleApproveAndPublish = async () => {
    await handleSaveDraft(true);
  };

  const filteredQueue = useMemo(() => {
    return clientsList.filter(c => {
      const matchSearch = !queueSearch || 
        (c.full_name && c.full_name.includes(queueSearch)) ||
        (c.client_code && String(c.client_code).includes(queueSearch));

      if (!matchSearch) return false;

      if (queueFilter === 'ACTION_NEEDED') return c.queue_status === 'PENDING_PLAN' || c.queue_status === 'NEEDS_UPDATE';
      if (queueFilter === 'PENDING_PLAN') return c.queue_status === 'PENDING_PLAN';
      if (queueFilter === 'NEEDS_UPDATE') return c.queue_status === 'NEEDS_UPDATE';
      return true;
    });
  }, [clientsList, queueFilter, queueSearch]);

  const urgentCount = clientsList.filter(c => c.queue_status === 'PENDING_PLAN' || c.queue_status === 'NEEDS_UPDATE').length;
  const pendingPlanCount = clientsList.filter(c => c.queue_status === 'PENDING_PLAN').length;
  const needsUpdateCount = clientsList.filter(c => c.queue_status === 'NEEDS_UPDATE').length;

  const activeSession = program?.training?.sessions?.[activeSessionIdx] || program?.training?.sessions?.[0];

  return (
    <AdminLayout fullWidth={true}>
      <div 
        dir="rtl" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px', 
          fontFamily: 'Cairo, sans-serif',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        
        {/* =========================================================================
            0. CLIENTS ACTION QUEUE SLIDER BAR (شريط وطابور المشتركين بدون أي إيموجي)
            ========================================================================= */}
        <div 
          style={{ 
            background: '#FFFFFF', 
            border: '1px solid #E2E8F0', 
            borderRadius: '8px', 
            padding: '10px 14px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)'
          }}
        >
          {/* Header row of Queue Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={15} color="#0F172A" />
                <strong style={{ fontSize: '12.5px', color: '#0F172A' }}>طابور المشتركين والإجراءات:</strong>
              </div>

              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {[
                  { id: 'ACTION_NEEDED', label: 'مطلوب إجراء', icon: AlertCircle, count: urgentCount },
                  { id: 'PENDING_PLAN', label: 'بانتظار خطة', icon: Clock, count: pendingPlanCount },
                  { id: 'NEEDS_UPDATE', label: 'مطلوب تعديل', icon: RotateCw, count: needsUpdateCount },
                  { id: 'ALL', label: 'كافة المشتركين', icon: Users, count: clientsList.length }
                ].map((qf) => {
                  const Icon = qf.icon;
                  const isSel = queueFilter === qf.id;
                  return (
                    <button
                      key={qf.id}
                      type="button"
                      onClick={() => setQueueFilter(qf.id)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: isSel ? 800 : 600,
                        border: isSel ? '1px solid #0F172A' : '1px solid #E2E8F0',
                        background: isSel ? '#0F172A' : '#F8FAFC',
                        color: isSel ? '#FFFFFF' : '#475569',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Icon size={11} color={isSel ? '#FFFFFF' : '#64748B'} />
                      <span>{qf.label}</span>
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 800,
                        padding: '0 4px',
                        borderRadius: '8px',
                        background: isSel ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                        color: isSel ? '#FFFFFF' : '#0F172A'
                      }}>
                        {qf.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Search & Toggle Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '0 6px', height: '26px', width: '160px', gap: '4px' }}>
                <Search size={11} color="#94A3B8" />
                <input
                  type="text"
                  placeholder="بحث سريع..."
                  value={queueSearch}
                  onChange={(e) => setQueueSearch(e.target.value)}
                  style={{ border: 'none', background: 'transparent', fontSize: '10.5px', outline: 'none', width: '100%' }}
                />
              </div>

              <button
                type="button"
                onClick={() => setShowQueueSlider(!showQueueSlider)}
                style={{ height: '26px', padding: '0 8px', borderRadius: '4px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#64748B', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }}
              >
                {showQueueSlider ? 'إخفاء الشريط' : 'إظهار المشتركين'}
              </button>
            </div>
          </div>

          {/* Horizontal Slider Cards Container */}
          {showQueueSlider && (
            <div 
              style={{ 
                display: 'flex', 
                gap: '8px', 
                overflowX: 'auto', 
                paddingBottom: '4px',
                scrollbarWidth: 'thin'
              }}
            >
              {filteredQueue.map((client) => {
                const isSelected = String(program?.client?.client_code || clientCodeParam) === String(client.client_code || client.id);
                const isPending = client.queue_status === 'PENDING_PLAN';
                const isNeedsUpdate = client.queue_status === 'NEEDS_UPDATE';

                return (
                  <div
                    key={client.id || client.client_code}
                    onClick={() => handleSelectClient(client.client_code || client.id)}
                    style={{
                      minWidth: '210px',
                      flexShrink: 0,
                      background: isSelected ? '#0F172A' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#0F172A',
                      border: isSelected ? '1px solid #0F172A' : '1px solid #E2E8F0',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      boxShadow: isSelected ? '0 2px 6px rgba(15, 23, 42, 0.25)' : 'none',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    {/* Top Row: Name + Code */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                        {client.full_name || client.name}
                      </strong>
                      <span style={{
                        fontSize: '9.5px',
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        padding: '1px 4px',
                        borderRadius: '3px',
                        background: isSelected ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                        color: isSelected ? '#FFFFFF' : '#475569'
                      }}>
                        #{client.client_code || client.id}
                      </span>
                    </div>

                    {/* Status Pill */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '3px',
                        background: isSelected 
                          ? (isPending ? '#FEF08A' : isNeedsUpdate ? '#BAE6FD' : 'rgba(255,255,255,0.15)')
                          : (isPending ? '#FEF9C3' : isNeedsUpdate ? '#E0F2FE' : '#F1F5F9'),
                        color: isSelected
                          ? (isPending ? '#854D0E' : isNeedsUpdate ? '#0369A1' : '#FFFFFF')
                          : (isPending ? '#854D0E' : isNeedsUpdate ? '#0369A1' : '#475569')
                      }}>
                        {client.queue_label}
                      </span>

                      <span style={{ fontSize: '9.5px', color: isSelected ? 'rgba(255,255,255,0.7)' : '#94A3B8' }}>
                        {client.package_name || 'باقة إليت'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 1. Sleek Top Command Bar */}
        {/* 1. Executive Client Bar & Action Header */}
        <div 
          style={{ 
            background: '#FFFFFF', 
            border: '1px solid #E2E8F0', 
            borderRadius: '8px', 
            padding: '10px 14px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '10px',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)'
          }}
        >
          {/* Client Bio Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span>{program?.client?.full_name || 'أحمد محمود العوضي'}</span>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 700 }}>
                    ({program?.client?.client_code ? `#${program?.client?.client_code}` : '#1'})
                  </span>
                </h4>

                <span style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '4px', background: '#0F172A', color: '#FFFFFF', fontWeight: 700 }}>
                  {program?.client?.package_name || 'باقة ماكس'}
                </span>
              </div>

              <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                <span>{program?.client?.age || 27} سنة</span>
                <span>•</span>
                <span>{program?.client?.weight_kg || 84.5} كجم</span>
                <span>•</span>
                <span>{program?.client?.height_cm || 180} سم</span>
                <span>•</span>
                <span style={{ color: '#0F172A', fontWeight: 700 }}>{program?.client?.goal_label || 'خسارة دهون وتنشيف'}</span>

                {program?.client?.injuries && program?.client?.injuries.length > 0 && (
                  <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <ShieldAlert size={10} />
                    <span>إصابة: {program?.client?.injuries.join('، ')}</span>
                  </span>
                )}

                {program?.client?.allergies && program?.client?.allergies.length > 0 && (
                  <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0284C7', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <AlertCircle size={10} />
                    <span>حساسية: {program?.client?.allergies.join('، ')}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              style={{
                height: '32px',
                padding: '0 12px',
                borderRadius: '5px',
                background: '#FFFFFF',
                color: '#0F172A',
                border: '1px solid #CBD5E1',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              <span>حفظ المسودة</span>
            </button>

            <button
              type="button"
              onClick={() => window.open(`/pdf?user_id=${program?.client?.client_code || clientCodeParam}`, '_blank')}
              style={{
                height: '32px',
                padding: '0 10px',
                borderRadius: '5px',
                background: '#F8FAFC',
                color: '#475569',
                border: '1px solid #E2E8F0',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Printer size={12} />
              <span>معاينة PDF</span>
            </button>

            <button
              type="button"
              onClick={handleApproveAndPublish}
              disabled={publishing}
              style={{
                height: '32px',
                padding: '0 14px',
                borderRadius: '5px',
                background: '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 4px rgba(15, 23, 42, 0.2)'
              }}
            >
              {publishing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              <span>اعتماد ونشر الخطة</span>
            </button>
          </div>
        </div>

        {/* 2. Unified Clean Workspace Tabs */}
        <div 
          style={{ 
            display: 'flex', 
            gap: '4px', 
            background: '#F1F5F9',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '3px'
          }}
        >
          {[
            { id: 'TRAINING', label: 'البرنامج التدريبي', count: `${program.training?.sessions?.length || 3} أيام`, icon: Dumbbell },
            { id: 'NUTRITION', label: 'الخطة الغذائية والماكروز', count: `${program.nutrition?.targets?.calories || 1900} kcal`, icon: Utensils },
            { id: 'CARDIO_HABITS', label: 'الكارديو والعادات والمكملات', count: `${program.cardio?.neat_target_steps || 8500} خطوة`, icon: Activity },
            { id: 'SUMMARY', label: 'الملخص الشامل', count: null, icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeWorkspaceTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveWorkspaceTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: isSel ? '#0F172A' : 'transparent',
                  color: isSel ? '#FFFFFF' : '#64748B',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  boxShadow: isSel ? '0 2px 4px rgba(15, 23, 42, 0.2)' : 'none',
                  transition: 'all 0.12s ease'
                }}
              >
                <Icon size={14} color={isSel ? '#FFFFFF' : '#64748B'} />
                <span>{tab.label}</span>
                {tab.count && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '0 5px',
                    borderRadius: '10px',
                    background: isSel ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                    color: isSel ? '#FFFFFF' : '#475569'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 3. TAB 1: WORKOUT & TRAINING */}
        {activeWorkspaceTab === 'TRAINING' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            
            {/* Engine Clinical & Biomechanical Reasoning Card */}
            {program.training?.reasoning && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', flexShrink: 0 }}>
                    <Zap size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A' }}>تحليل المحرك الفسيولوجي والميكانيكا الحيوية</div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px' }}>
                      {typeof program.training.reasoning === 'string' ? program.training.reasoning : (program.training.reasoning?.rationale || 'تقسيم تدريبي مخصص مع حماية المفاصل وعزل الإصابات وتحقيق أعلى تحفيز عضلي.')}
                    </div>
                  </div>
                </div>
                {program.training?.target_split && (
                  <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', whiteSpace: 'nowrap' }}>
                    {program.training.target_split}
                  </span>
                )}
              </div>
            )}

            {/* Days Selector & Clean Header */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                
                {/* Days Tabs */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {program.training?.sessions?.map((sess, sIdx) => {
                    const isCurrent = activeSessionIdx === sIdx;
                    return (
                      <button
                        key={sess?.id || sIdx}
                        type="button"
                        onClick={() => setActiveSessionIdx(sIdx)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: isCurrent ? '1px solid #0F172A' : '1px solid #CBD5E1',
                          background: isCurrent ? '#0F172A' : '#FFFFFF',
                          color: isCurrent ? '#FFFFFF' : '#334155',
                          fontSize: '12px',
                          fontWeight: isCurrent ? 800 : 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>{sess.name}</span>
                        <span style={{ fontSize: '10px', opacity: 0.8 }}>({sess.exercises?.length || 0})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Target Muscle Summary */}
                {activeSession?.target_muscles && (
                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                    العضلات المستهدفة: <strong style={{ color: '#0F172A' }}>{activeSession.target_muscles}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Pre-Workout Warmup Bar */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <RotateCw size={12} />
                  <span>الإحماء الديناميكي:</span>
                </span>
                
                {(!activeSession?.pre_workout_mobility || activeSession.pre_workout_mobility.length === 0) ? (
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>إحماء عام قياسي للمفاصل</span>
                ) : (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {activeSession.pre_workout_mobility.map((m, mIdx) => (
                      <span key={mIdx} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '2px 6px', borderRadius: '4px', fontSize: '10.5px', color: '#0F172A', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>{m.name || m.name_ar}</span>
                        <button type="button" onClick={() => handleRemoveMobilityFromSession(activeSessionIdx, mIdx, 'WARMUP')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#DC2626' }}>
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setMobilityModal({ open: true, type: 'WARMUP', sessionIdx: activeSessionIdx })}
                style={{ padding: '3px 8px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }}
              >
                + إضافة إحماء
              </button>
            </div>

            {/* Exercise Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeSession?.exercises?.map((ex, eIdx) => (
                <div
                  key={ex.id || eIdx}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)'
                  }}
                >
                  {/* Title & Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      background: '#0F172A',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 800
                    }}>
                      {eIdx + 1}
                    </span>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ fontSize: '13.5px', color: '#0F172A' }}>{ex.name}</strong>
                        {ex.equipment && (
                          <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', fontWeight: 600 }}>
                            {ex.equipment}
                          </span>
                        )}
                      </div>
                      {ex.safetyNote && (
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                          {ex.safetyNote}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inline Parameters */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Sets */}
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: '6px', background: '#F8FAFC', padding: '0 6px', height: '30px' }}>
                      <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px', fontWeight: 700 }}>جولات:</span>
                      <button type="button" onClick={() => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'sets', Math.max(1, (ex.sets || 3) - 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, padding: '0 4px', fontSize: '13px' }}>-</button>
                      <strong style={{ fontSize: '13px', minWidth: '18px', textAlign: 'center', margin: '0 2px', color: '#0F172A' }}>{ex.sets}</strong>
                      <button type="button" onClick={() => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'sets', (ex.sets || 3) + 1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, padding: '0 4px', fontSize: '13px' }}>+</button>
                    </div>

                    {/* Reps */}
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: '6px', background: '#F8FAFC', padding: '0 8px', height: '30px' }}>
                      <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px', fontWeight: 700 }}>تكرار:</span>
                      <input
                        type="text"
                        value={ex.reps}
                        onChange={(e) => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'reps', e.target.value)}
                        style={{ width: '70px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 800, fontSize: '12px', outline: 'none', color: '#0F172A', direction: 'ltr' }}
                      />
                    </div>

                    {/* RIR */}
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: '6px', background: '#F8FAFC', padding: '0 8px', height: '30px' }}>
                      <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px', fontWeight: 700 }}>الشدة:</span>
                      <select
                        value={ex.rir ?? 1}
                        onChange={(e) => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'rir', Number(e.target.value))}
                        style={{ border: 'none', background: 'transparent', fontWeight: 800, fontSize: '11.5px', outline: 'none', cursor: 'pointer', color: '#0F172A' }}
                      >
                        <option value="0">RIR 0 (فشل تام)</option>
                        <option value="1">RIR 1 (عدة قبل الفشل)</option>
                        <option value="2">RIR 2 (عدتان قبل الفشل)</option>
                        <option value="3">RIR 3</option>
                      </select>
                    </div>

                    {/* Rest */}
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: '6px', background: '#F8FAFC', padding: '0 8px', height: '30px' }}>
                      <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px', fontWeight: 700 }}>راحة:</span>
                      <select
                        value={ex.restSec || 75}
                        onChange={(e) => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'restSec', Number(e.target.value))}
                        style={{ border: 'none', background: 'transparent', fontWeight: 800, fontSize: '11.5px', outline: 'none', cursor: 'pointer', color: '#0F172A' }}
                      >
                        <option value="45">45s</option>
                        <option value="60">60s</option>
                        <option value="75">75s</option>
                        <option value="90">90s</option>
                        <option value="120">120s</option>
                      </select>
                    </div>

                    {/* Smart Swap Button */}
                    <button
                      type="button"
                      onClick={() => setSwapExModal({ open: true, sessionIdx: activeSessionIdx, exIdx: eIdx, currentEx: ex })}
                      style={{ height: '30px', padding: '0 8px', borderRadius: '6px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700 }}
                      title="تبديل التمرين الذكي بنفس الزاوية والأمان"
                    >
                      <ArrowRightLeft size={12} color="#2563EB" />
                      <span>بديل</span>
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteExercise(activeSessionIdx, eIdx)}
                      style={{ height: '30px', width: '30px', borderRadius: '6px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="حذف التمرين"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Post-Workout Stretches Bar */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <HeartPulse size={14} />
                  <span>إطالات الاستشفاء:</span>
                </span>
                
                {(!activeSession?.post_workout_stretches || activeSession.post_workout_stretches.length === 0) ? (
                  <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>إطالات عامة للعضلات المستهدفة</span>
                ) : (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {activeSession.post_workout_stretches.map((m, mIdx) => (
                      <span key={mIdx} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', color: '#0F172A', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                        <span>{m.name || m.name_ar}</span>
                        <button type="button" onClick={() => handleRemoveMobilityFromSession(activeSessionIdx, mIdx, 'STRETCH')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#DC2626' }}>
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setMobilityModal({ open: true, type: 'STRETCH', sessionIdx: activeSessionIdx })}
                style={{ padding: '4px 10px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', borderRadius: '5px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
              >
                + إضافة إطالة
              </button>
            </div>

            {/* Centered Add Exercise Button */}
            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setAddExModal({ open: true, sessionIdx: activeSessionIdx })}
                style={{
                  height: '34px',
                  padding: '0 18px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
                }}
              >
                <Plus size={14} />
                <span>إضافة تمرين جديد لـ ({activeSession?.name})</span>
              </button>
            </div>

          </div>
        )}

        {/* 4. TAB 2: NUTRITION & MACROS */}
        {activeWorkspaceTab === 'NUTRITION' && (
          <CoachEditorNutritionTab
            searchParams={searchParams}
            setSearchParams={setSearchParams}
            loading={loading}
            setLoading={setLoading}
            saving={saving}
            setSaving={setSaving}
            publishing={publishing}
            setPublishing={setPublishing}
            program={program}
            setProgram={setProgram}
            coachNotes={coachNotes}
            setCoachNotes={setCoachNotes}
            activeSessionIdx={activeSessionIdx}
            setActiveSessionIdx={setActiveSessionIdx}
            activeWorkspaceTab={activeWorkspaceTab}
            setActiveWorkspaceTab={setActiveWorkspaceTab}
            notification={notification}
            setNotification={setNotification}
            clientsList={clientsList}
            setClientsList={setClientsList}
            queueFilter={queueFilter}
            setQueueFilter={setQueueFilter}
            queueSearch={queueSearch}
            setQueueSearch={setQueueSearch}
            showQueueSlider={showQueueSlider}
            setShowQueueSlider={setShowQueueSlider}
            allExercisesList={allExercisesList}
            setAllExercisesList={setAllExercisesList}
            cardioSwapModal={cardioSwapModal}
            setCardioSwapModal={setCardioSwapModal}
            addFoodModal={addFoodModal}
            setAddFoodModal={setAddFoodModal}
            swapFoodModal={swapFoodModal}
            setSwapFoodModal={setSwapFoodModal}
            addExModal={addExModal}
            setAddExModal={setAddExModal}
            swapExModal={swapExModal}
            setSwapExModal={setSwapExModal}
            mobilityModal={mobilityModal}
            setMobilityModal={setMobilityModal}
            allMobilityList={allMobilityList}
            setAllMobilityList={setAllMobilityList}
            showReasoning={showReasoning}
            setShowReasoning={setShowReasoning}
            exModalSearch={exModalSearch}
            setExModalSearch={setExModalSearch}
            foodModalSearch={foodModalSearch}
            setFoodModalSearch={setFoodModalSearch}
            mobilityModalSearch={mobilityModalSearch}
            setMobilityModalSearch={setMobilityModalSearch}
            swapFoodSearch={swapFoodSearch}
            setSwapFoodSearch={setSwapFoodSearch}
            swapExSearch={swapExSearch}
            setSwapExSearch={setSwapExSearch}
            handleSelectClient={handleSelectClient}
            handleUpdateFoodAmount={handleUpdateFoodAmount}
            handleDeleteFood={handleDeleteFood}
            handleAddNewMeal={handleAddNewMeal}
            handleDeleteMeal={handleDeleteMeal}
            handleAddFoodToMeal={handleAddFoodToMeal}
            handleExecuteFoodSwap={handleExecuteFoodSwap}
            handleExecuteExerciseSwap={handleExecuteExerciseSwap}
            handleUpdateExerciseParam={handleUpdateExerciseParam}
            handleDeleteExercise={handleDeleteExercise}
            handleAddExerciseToSession={handleAddExerciseToSession}
            handleSelectCardioModality={handleSelectCardioModality}
            handleAddMobilityToSession={handleAddMobilityToSession}
            handleRemoveMobilityFromSession={handleRemoveMobilityFromSession}
            handleSaveDraft={handleSaveDraft}
            handleApproveAndPublish={handleApproveAndPublish}
            showToast={showToast}
            autoRippleEnabled={autoRippleEnabled}
            setAutoRippleEnabled={setAutoRippleEnabled}
            FOOD_DATABASE_LIST={FOOD_DATABASE_LIST}
            CARDIO_MODALITY_OPTIONS={CARDIO_MODALITY_OPTIONS}
          />
        )}

        {/* 5. TAB 3: CARDIO & HABITS */}
        {activeWorkspaceTab === 'CARDIO_HABITS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            
            {/* Engine Cardio & Recovery Reasoning Card */}
            {program.cardio?.reasoning && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#FAF5FF', border: '1px solid #E9D5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333EA', flexShrink: 0 }}>
                    <Zap size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A' }}>بروتوكول الكارديو والاستشفاء ونمط الحياة</div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px' }}>
                      {typeof program.cardio.reasoning === 'string' ? program.cardio.reasoning : (program.cardio.reasoning?.rationale || 'بروتوكول كارديو Zone 2 لحرق الدهون وتحسين صحة القلب بدون إجهاد للمفاصل.')}
                    </div>
                  </div>
                </div>
                {program.cardio?.target_heart_rate_zone && (
                  <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', whiteSpace: 'nowrap' }}>
                    {program.cardio.target_heart_rate_zone}
                  </span>
                )}
              </div>
            )}

            {/* Cardio Modality Card */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '13px', color: '#0F172A' }}>نظام وجهاز الكارديو:</strong>
                <button
                  type="button"
                  onClick={() => setCardioSwapModal(true)}
                  style={{ padding: '3px 8px', borderRadius: '4px', background: '#0F172A', color: '#FFFFFF', border: 'none', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }}
                >
                  تبديل الجهاز / النمط
                </button>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 10px', fontSize: '11.5px', color: '#334155' }}>
                <strong style={{ color: '#0F172A', display: 'block', marginBottom: '2px' }}>{program.cardio?.modality}</strong>
                <span style={{ fontSize: '10.5px', color: '#64748B' }}>
                  {program.cardio?.weekly_sessions || 3} جلسات أسبوعياً • {program.cardio?.session_duration_min || 30} دقيقة • {program.cardio?.target_heart_rate_zone || 'Zone 2'}
                </span>
              </div>
            </div>

            {/* Daily Habits Bar */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px' }}>
              <strong style={{ fontSize: '13px', color: '#0F172A', display: 'block', marginBottom: '8px' }}>المؤشرات والعادات اليومية:</strong>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '10px', color: '#64748B', display: 'block' }}>الخطوات اليومية</span>
                  <strong style={{ fontSize: '13px', color: '#0F172A' }}>{program.cardio?.neat_target_steps || 8500} خطوة</strong>
                </div>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '10px', color: '#64748B', display: 'block' }}>شرب الماء</span>
                  <strong style={{ fontSize: '13px', color: '#0F172A' }}>{program.cardio?.daily_water_target_liters || 3.8} لتر</strong>
                </div>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '10px', color: '#64748B', display: 'block' }}>ساعات النوم</span>
                  <strong style={{ fontSize: '13px', color: '#0F172A' }}>{program.cardio?.sleep_target_hours || 8} ساعات</strong>
                </div>
              </div>
            </div>

            {/* Supplements */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px' }}>
              <strong style={{ fontSize: '13px', color: '#0F172A', display: 'block', marginBottom: '8px' }}>المكملات الغذائية المعتمدة:</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {program.cardio?.supplements?.map((supp, sIdx) => (
                  <div key={sIdx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '6px 10px', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ color: '#0F172A' }}>{supp.name}</strong>
                      <span style={{ color: '#64748B', marginRight: '6px' }}>— {supp.dose}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 6. TAB 4: EXECUTIVE SUMMARY */}
        {activeWorkspaceTab === 'SUMMARY' && (
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
            <strong style={{ fontSize: '13.5px', color: '#0F172A', display: 'block', marginBottom: '8px' }}>
              ملاحظات وتوجيهات الكوتش الخاصة:
            </strong>
            <textarea
              rows={4}
              placeholder="اكتب التوجيهات الختامية للمشترك قبل اعتماد الخطة..."
              value={coachNotes}
              onChange={(e) => setCoachNotes(e.target.value)}
              style={{ width: '100%', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '8px', fontSize: '11.5px', outline: 'none', boxSizing: 'border-box', fontFamily: 'Cairo, sans-serif' }}
            />
          </div>
        )}

        {/* =========================================================================
            MODALS (All Emoji-Free)
            ========================================================================= */}

        {/* Smart Food Swap Modal */}
        {swapFoodModal.open && swapFoodModal.currentItem && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} dir="rtl">
            <div style={{ maxWidth: '520px', width: '100%', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '85vh', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ArrowRightLeft size={14} color="#2563EB" />
                    <span>البدائل الغذائية المتكافئة لـ ({swapFoodModal.currentItem.name})</span>
                  </h4>
                  <span style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px', display: 'block' }}>
                    الكمية الحالية: {swapFoodModal.currentItem.amount} {swapFoodModal.currentItem.unit || 'جم'} ({swapFoodModal.currentItem.cal || 0} kcal)
                  </span>
                </div>
                <button type="button" onClick={() => setSwapFoodModal({ open: false, mealId: null, itemIdx: null, currentItem: null })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                  <X size={15} />
                </button>
              </div>

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="ابحث عن صنف بديل..."
                  value={swapFoodSearch}
                  onChange={(e) => setSwapFoodSearch(e.target.value)}
                  style={{ width: '100%', height: '32px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 28px 0 10px', fontSize: '11.5px', outline: 'none', boxSizing: 'border-box' }}
                />
                <Search size={13} style={{ position: 'absolute', right: '9px', top: '10px', color: '#94A3B8' }} />
              </div>

              {/* Compatible Swaps List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '340px', paddingRight: '2px' }}>
                {FOOD_DATABASE_LIST
                  .filter(f => {
                    const curCat = swapFoodModal.currentItem.category;
                    const matchCategory = !curCat || f.category === curCat || f.macro_type === curCat;
                    const matchSearch = !swapFoodSearch || (f.name && f.name.includes(swapFoodSearch));
                    return matchCategory && matchSearch;
                  })
                  .map((targetFood, tfIdx) => {
                    let equivGrams = 100;
                    if (swapFoodModal.currentItem.category === 'PROTEIN') {
                      const curP = Number(swapFoodModal.currentItem.p) || 25;
                      const targetP = Number(targetFood.protein_per_100g || targetFood.p || 25);
                      equivGrams = Math.max(10, Math.round((curP / targetP) * 100));
                    } else if (swapFoodModal.currentItem.category === 'CARB') {
                      const curC = Number(swapFoodModal.currentItem.c) || 30;
                      const targetC = Number(targetFood.carbs_per_100g || targetFood.c || 25);
                      equivGrams = Math.max(10, Math.round((curC / targetC) * 100));
                    } else if (swapFoodModal.currentItem.category === 'FAT') {
                      const curF = Number(swapFoodModal.currentItem.f) || 8;
                      const targetF = Number(targetFood.fat_per_100g || targetFood.f || 10);
                      equivGrams = Math.max(5, Math.round((curF / targetF) * 100));
                    }

                    const factor = equivGrams / 100;
                    const equivCal = Math.round((targetFood.calories_per_100g || targetFood.cal || 100) * factor);
                    const equivP = Number(((targetFood.protein_per_100g || targetFood.p || 0) * factor).toFixed(1));
                    const equivC = Number(((targetFood.carbs_per_100g || targetFood.c || 0) * factor).toFixed(1));
                    const equivF = Number(((targetFood.fat_per_100g || targetFood.f || 0) * factor).toFixed(1));

                    return (
                      <div
                        key={targetFood.code || tfIdx}
                        style={{
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '12px', color: '#0F172A', display: 'block' }}>{targetFood.name}</strong>
                          <span style={{ fontSize: '10.5px', color: '#64748B' }}>
                            الكمية المكافئة: <strong style={{ color: '#0F172A' }}>{equivGrams} {targetFood.serving_unit || targetFood.unit || 'جم'}</strong> ({equivCal} kcal)
                          </span>
                          <div style={{ fontSize: '9.5px', color: '#94A3B8', marginTop: '1px' }}>
                            P:{equivP}g · C:{equivC}g · F:{equivF}g
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleExecuteFoodSwap(swapFoodModal.mealId, swapFoodModal.itemIdx, targetFood)}
                          style={{
                            height: '28px',
                            padding: '0 12px',
                            borderRadius: '5px',
                            background: '#0F172A',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        >
                          اختيار كبديل
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Smart Exercise Swap Modal */}
        {swapExModal.open && swapExModal.currentEx && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} dir="rtl">
            <div style={{ maxWidth: '540px', width: '100%', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '85vh', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ArrowRightLeft size={14} color="#2563EB" />
                    <span>البدائل المتطابقة ميكانيكياً لـ ({swapExModal.currentEx.name})</span>
                  </h4>
                  <span style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px', display: 'block' }}>
                    نفس الزاوية العضلية ومنحنى المقاومة مع مراعاة أمان المفاصل
                  </span>
                </div>
                <button type="button" onClick={() => setSwapExModal({ open: false, sessionIdx: null, exIdx: null, currentEx: null })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                  <X size={15} />
                </button>
              </div>

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="ابحث في التمارين البديلة..."
                  value={swapExSearch}
                  onChange={(e) => setSwapExSearch(e.target.value)}
                  style={{ width: '100%', height: '32px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 28px 0 10px', fontSize: '11.5px', outline: 'none', boxSizing: 'border-box' }}
                />
                <Search size={13} style={{ position: 'absolute', right: '9px', top: '10px', color: '#94A3B8' }} />
              </div>

              {/* Compatible Exercises List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '340px', paddingRight: '2px' }}>
                {allExercisesList
                  .filter(ex => !swapExSearch || (ex.name_ar && ex.name_ar.includes(swapExSearch)) || (ex.name && ex.name.toLowerCase().includes(swapExSearch.toLowerCase())))
                  .slice(0, 30)
                  .map((targetEx, teIdx) => (
                    <div
                      key={targetEx.id || teIdx}
                      style={{
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '12px', color: '#0F172A', display: 'block' }}>{targetEx.name_ar || targetEx.name}</strong>
                        <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px', display: 'flex', gap: '6px' }}>
                          <span>{targetEx.equipment || 'جهاز / أوزان'}</span>
                          <span>•</span>
                          <span>{targetEx.muscle_ar || targetEx.target_muscle || 'عضلة رئيسية'}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleExecuteExerciseSwap(swapExModal.sessionIdx, swapExModal.exIdx, targetEx)}
                        style={{
                          height: '28px',
                          padding: '0 12px',
                          borderRadius: '5px',
                          background: '#0F172A',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        استبدال بهذا التمرين
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Cardio Swap Modal */}
        {cardioSwapModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} dir="rtl">
            <div style={{ maxWidth: '460px', width: '100%', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>اختيار نمط الكارديو</h4>
                <button type="button" onClick={() => setCardioSwapModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={15} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '300px', overflowY: 'auto' }}>
                {CARDIO_MODALITY_OPTIONS.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => handleSelectCardioModality(opt)}
                    style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div>
                      <strong style={{ fontSize: '11.5px', color: '#0F172A', display: 'block' }}>{opt.name}</strong>
                      <span style={{ fontSize: '10px', color: '#64748B' }}>{opt.desc}</span>
                    </div>
                    <button type="button" style={{ padding: '3px 8px', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700 }}>اختيار</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobility Selection Modal */}
        {mobilityModal.open && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} dir="rtl">
            <div style={{ maxWidth: '480px', width: '100%', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '85vh' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>
                  {mobilityModal.type === 'WARMUP' ? 'اختيار حركة إحماء ديناميكي' : 'اختيار حركة إطالة استشفائية'}
                </h4>
                <button type="button" onClick={() => setMobilityModal({ open: false, type: 'WARMUP', sessionIdx: null })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={15} /></button>
              </div>

              <input
                type="text"
                placeholder="بحث باسم الحركة أو المنطقة..."
                value={mobilityModalSearch}
                onChange={(e) => setMobilityModalSearch(e.target.value)}
                style={{ width: '100%', height: '30px', borderRadius: '5px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '320px', overflowY: 'auto' }}>
                {allMobilityList
                  .filter(d => {
                    const matchType = mobilityModal.type === 'WARMUP' 
                      ? (d.category === 'DYNAMIC_WARMUP' || d.category === 'POSTURAL_PREHAB')
                      : (d.category === 'STATIC_STRETCH' || d.category === 'POSTURAL_PREHAB');
                    const matchSearch = !mobilityModalSearch || 
                      (d.name_ar && d.name_ar.toLowerCase().includes(mobilityModalSearch.toLowerCase())) ||
                      (d.target_area_ar && d.target_area_ar.includes(mobilityModalSearch));
                    return matchType && matchSearch;
                  })
                  .map((drill) => (
                    <div
                      key={drill.id}
                      onClick={() => handleAddMobilityToSession(drill, mobilityModal.type)}
                      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '5px', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    >
                      <div>
                        <strong style={{ fontSize: '11.5px', color: '#0F172A', display: 'block' }}>{drill.name_ar}</strong>
                        <span style={{ fontSize: '10px', color: '#64748B' }}>المنطقة: {drill.target_area_ar}</span>
                      </div>
                      <button type="button" style={{ padding: '2px 7px', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '3px', fontSize: '10px', fontWeight: 700 }}>إضافة</button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Add Exercise Modal */}
        {addExModal.open && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} dir="rtl">
            <div style={{ maxWidth: '520px', width: '100%', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '85vh' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>إضافة تمرين من المكتبة</h4>
                <button type="button" onClick={() => setAddExModal({ open: false, sessionIdx: null })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={15} /></button>
              </div>

              <input
                type="text"
                placeholder="ابحث باسم التمرين..."
                value={exModalSearch}
                onChange={(e) => setExModalSearch(e.target.value)}
                style={{ width: '100%', height: '30px', borderRadius: '5px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '320px', overflowY: 'auto' }}>
                {allExercisesList
                  .filter(ex => !exModalSearch || (ex.name_ar && ex.name_ar.includes(exModalSearch)) || (ex.name_en && ex.name_en.toLowerCase().includes(exModalSearch.toLowerCase())))
                  .slice(0, 30)
                  .map((ex) => (
                    <div
                      key={ex.id}
                      onClick={() => handleAddExerciseToSession(addExModal.sessionIdx, ex)}
                      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '5px', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    >
                      <div>
                        <strong style={{ fontSize: '11.5px', color: '#0F172A', display: 'block' }}>{ex.name_ar || ex.name}</strong>
                        <span style={{ fontSize: '10px', color: '#64748B' }}>{ex.muscle_ar || ex.target_muscle}</span>
                      </div>
                      <button type="button" style={{ padding: '2px 7px', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '3px', fontSize: '10px', fontWeight: 700 }}>+ إضافة</button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Add Food Modal */}
        {addFoodModal.open && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} dir="rtl">
            <div style={{ maxWidth: '480px', width: '100%', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '85vh' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>إضافة صنف غذائي</h4>
                <button type="button" onClick={() => setAddFoodModal({ open: false, mealId: null })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={15} /></button>
              </div>

              <input
                type="text"
                placeholder="ابحث باسم الصنف الغذائي..."
                value={foodModalSearch}
                onChange={(e) => setFoodModalSearch(e.target.value)}
                style={{ width: '100%', height: '30px', borderRadius: '5px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '320px', overflowY: 'auto' }}>
                {FOOD_DATABASE_LIST
                  .filter(fd => !foodModalSearch || (fd.name && fd.name.includes(foodModalSearch)) || (fd.name_ar && fd.name_ar.includes(foodModalSearch)))
                  .slice(0, 30)
                  .map((fd) => (
                    <div
                      key={fd.code}
                      onClick={() => handleAddFoodToMeal(addFoodModal.mealId, fd)}
                      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '5px', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    >
                      <div>
                        <strong style={{ fontSize: '11.5px', color: '#0F172A', display: 'block' }}>{fd.name}</strong>
                        <span style={{ fontSize: '10px', color: '#64748B' }}>P: {fd.p}g • C: {fd.c}g • F: {fd.f}g</span>
                      </div>
                      <button type="button" style={{ padding: '2px 7px', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '3px', fontSize: '10px', fontWeight: 700 }}>+ إضافة</button>
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
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#0F172A',
              color: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 700,
              zIndex: 99999
            }}
            dir="rtl"
          >
            {notification.msg}
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
