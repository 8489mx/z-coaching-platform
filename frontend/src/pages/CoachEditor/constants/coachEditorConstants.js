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

function getRealisticDefaultPortion(fd) {
  if (fd.default_amount) return { amount: fd.default_amount, unit: fd.serving_unit || 'جم' };
  if (fd.default_portion) return { amount: fd.default_portion, unit: fd.unit_name_ar || fd.serving_unit || 'جم' };

  const str = String((fd.code || '') + ' ' + (fd.name_ar || '') + ' ' + (fd.name || '')).toUpperCase();

  // Eggs
  if (/EGG|بيض/.test(str)) {
    return { amount: 1, unit: 'بيضة' };
  }
  // Ghee & Butter (5g)
  if (/GHEE|BUTTER|سمن|زبدة/.test(str) && !/PEANUT|فول/.test(str)) {
    return { amount: 5, unit: 'جم' };
  }
  // Oils (10g / 10ml)
  if (/OIL|زيت/.test(str)) {
    return { amount: 10, unit: 'مل' };
  }
  // Chia Seeds & Flax Seeds (10g)
  if (/CHIA|SEEDS|FLAX|شيا|بذور|كتان/.test(str)) {
    return { amount: 10, unit: 'جم' };
  }
  // Tahini & Peanut Butter (15g)
  if (/TAHINI|PEANUT|طحينة|فول سوداني/.test(str)) {
    return { amount: 15, unit: 'جم' };
  }
  // Raw Nuts (20g)
  if (/ALMOND|WALNUT|CASHEW|NUTS|لوز|جوز|كاجو|مكسرات/.test(str)) {
    return { amount: 20, unit: 'جم' };
  }
  // Dark Chocolate (15g)
  if (/CHOCOLATE|شوكولاتة/.test(str)) {
    return { amount: 15, unit: 'جم' };
  }
  // Oats (50g)
  if (/OAT|شوفان/.test(str)) {
    return { amount: 50, unit: 'جم' };
  }
  // Whey Protein / Casein (30g)
  if (/WHEY|CASEIN|ISOLATE|بروتين معزول|واي/.test(str)) {
    return { amount: 30, unit: 'جم' };
  }
  // Milk & Beverages (200ml)
  if (/MILK|حليب|لبن/.test(str)) {
    return { amount: 200, unit: 'مل' };
  }
  // Fruits (120g)
  if (/BANANA|APPLE|ORANGE|GUAVA|موز|تفاح|برتقال|جوافة/.test(str)) {
    return { amount: 120, unit: 'جم' };
  }
  // Default for meats, carbs, veg
  return { amount: 100, unit: 'جم' };
}

const rawFoodsList = Object.values(FOOD_DATABASE || {})
  .filter(fd => Boolean(fd && typeof fd === 'object' && (fd.name_ar || fd.name || fd.code)));

const uniqueFoodsMap = new Map();
rawFoodsList.forEach(fd => {
  const code = fd.code || fd.id;
  if (code && !uniqueFoodsMap.has(code)) {
    const realisticPortion = getRealisticDefaultPortion(fd);
    uniqueFoodsMap.set(code, {
      ...fd,
      name: fd.name_ar || fd.name || code,
      p: Number(fd.protein_per_100g ?? fd.p ?? 0),
      c: Number(fd.carbs_per_100g ?? fd.c ?? 0),
      f: Number(fd.fat_per_100g ?? fd.f ?? 0),
      cal: Number(fd.calories_per_100g ?? fd.cal ?? 0),
      amount: realisticPortion.amount,
      unit: realisticPortion.unit
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
