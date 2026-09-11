import { FOOD_DATABASE } from '../../../utils/foodSwapEngine.js';
import { STRESS_TEST_CLIENTS, CLINICAL_MASTER_BLUEPRINTS } from '../../../data/stressTestClientsBlueprints.js';

export const ADD_EX_MUSCLE_CATEGORIES = [
  { id: 'ALL', label: 'الكل' },
  { id: 'CHEST', label: 'الصدر' },
  { id: 'BACK', label: 'الظهر' },
  { id: 'LEGS', label: 'الأرجل' },
  { id: 'CALVES', label: 'السمانة' },
  { id: 'SHOULDERS', label: 'الأكتاف' },
  { id: 'ARMS', label: 'الذراعين' },
  { id: 'CORE', label: 'البطن' },
];

export const ADD_EX_EQUIPMENT_OPTIONS = [
  { id: 'ALL', label: 'كل الأدوات' },
  { id: 'BARBELL', label: 'بار أولمبي' },
  { id: 'DUMBBELL', label: 'دمبلز' },
  { id: 'CABLE', label: 'كابلات' },
  { id: 'MACHINE', label: 'أجهزة' },
  { id: 'BODYWEIGHT', label: 'وزن الجسم' },
];

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

export const FOOD_DATABASE_LIST = Array.from(uniqueFoodsMap.values());

// 15 Master Clinical Archetypes for Instant Switching
export const CLIENT_BLUEPRINTS = CLINICAL_MASTER_BLUEPRINTS;

export const CARDIO_MODALITY_OPTIONS = [
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

export { STRESS_TEST_CLIENTS, CLINICAL_MASTER_BLUEPRINTS };
