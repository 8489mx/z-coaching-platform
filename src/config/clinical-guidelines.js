/**
 * Centralized Clinical Guidelines & Safety Constants (دستور الثوابت السريرية الموحد)
 * 
 * Single Source of Truth for all clinical thresholds, protein caps, contraindicated exercises,
 * and safety guardrails across both backend engines and frontend interfaces.
 * 
 * Every clinical number is strictly documented with its scientific source.
 */

export const CLINICAL_GUIDELINES = Object.freeze({
  // ==========================================
  // 1. KIDNEY DISEASE / RENAL IMPAIRMENT
  // ==========================================
  KIDNEY: Object.freeze({
    /**
     * Scientific Source:
     * KDOQI Clinical Practice Guideline for Nutrition in CKD (2020 Update) & NIDDK.
     * For non-dialysis chronic kidney disease / reduced eGFR, safe conservative daily protein ceiling
     * for active adults is capped at 0.8 - 1.0 g/kg body weight to minimize hyperfiltration and renal load.
     */
    MAX_PROTEIN_PER_KG: 1.0,
    RATIONALE_AR: "تم تحديد سقف البروتين بـ 1.0 جم/كجم كحد أقصى آمن لمرضى القصور الكلوي بناءً على توصيات KDOQI لحماية وظائف الكلى وترشيح الكبيبات ومنع تراكم النواتج النيتروجينية.",
  }),

  // ==========================================
  // 2. HYPERTENSION & CARDIOVASCULAR CONDITIONS
  // ==========================================
  HYPERTENSION: Object.freeze({
    /**
     * Scientific Source:
     * American College of Sports Medicine (ACSM) & American Heart Association (AHA) Exercise Standards.
     * Restricting concentric muscular failure (keeping RIR >= 2) prevents severe acute arterial pressure spikes.
     * Inverted body postures and heavy compressive leg presses with excessive Valsalva maneuvers are contraindicated.
     */
    MIN_RIR: 2,
    CONTRAINDICATED_EXERCISES: Object.freeze([
      "LEG_PRESS_MACHINE",
      "INCLINE_LEG_PRESS",
      "HACK_SQUAT_MACHINE",
      "DECLINE_CRUNCH",
      "DECLINE_BENCH_PRESS",
      "DECLINE_DUMBBELL_BENCH_PRESS",
      "INVERTED_BODYWEIGHT_ROW",
    ]),
    VALSALVA_SAFETY_CUE_AR: "توجيه سريري إلزامي: ممنوع حبس النفس (Valsalva Maneuver) نهائياً؛ يجب الزفير ببطء أثناء دفع الوزن والشهيق أثناء النزول لتفادي أي ارتفاع مفاجئ في ضغط الدم الشرياني.",
  }),

  // ==========================================
  // 3. DIABETES & METABOLIC DYSFUNCTION
  // ==========================================
  DIABETES: Object.freeze({
    /**
     * Scientific Source:
     * American Diabetes Association (ADA) Standards of Care in Diabetes (Nutrition Therapy & Glycemic Control).
     * High glycemic index (GI >= 70) foods cause rapid postprandial hyperglycemia and insulin surges.
     * Meal swaps must filter out high-GI carbohydrates to preserve glycemic stability.
     * The 'Rule of 15': 15-20g of fast-acting carbohydrate must be on hand during sessions > 45 minutes
     * or whenever symptoms of exercise-induced hypoglycemia appear.
     */
    HYPOGLYCEMIA_RESCUE_CARBS_GRAMS: 15,
    SESSION_DURATION_THRESHOLD_MINUTES: 45,
    HIGH_GLYCEMIC_SWAP_BAN: true,
    BANNED_GI_LEVELS: Object.freeze(["HIGH"]),
    RATIONALE_AR: "استبعاد الأطعمة ذات المؤشر الجلايسيمي المرتفع لمرضى السكري ومقاومة الأنسولين لمنع الارتفاعات الحادة في سكر الدم والأنسولين (ADA Guidelines).",
    SAFETY_GUIDANCE_AR: "بروتوكول أمان هبوط السكر: يجب توفير 15-20 جم كربوهيدرات سريعة الامتصاص (مثل عصير فواكه أو تمرة واحدة أو أقراص جلوكوز) أثناء التمارين التي تتجاوز 45 دقيقة مع قياس السكر قبل بدء الجلسة.",
  }),

  // ==========================================
  // 4. ASTHMA & RESPIRATORY CONDITIONS
  // ==========================================
  RESPIRATORY: Object.freeze({
    /**
     * Scientific Source:
     * Global Initiative for Asthma (GINA) & European Respiratory Society (ERS).
     * High-intensity interval training (HIIT) inducing sustained hyperventilation and airway drying
     * triggers Exercise-Induced Bronchoconstriction (EIB). Moderate-intensity continuous training (Zone 2)
     * with gradual warm-up is clinically recommended.
     */
    BANNED_CARDIO_MODALITIES: Object.freeze([
      "HIIT_INTERVALS",
      "HIGH_INTENSITY_HIIT",
      "SPRINT_INTERVALS",
    ]),
    PREFERRED_CARDIO_MODALITY: "LISS_TALK_TEST",
    SAFETY_GUIDANCE_AR: "توجيه سريري لمرضى الربو والجهاز التنفسي: حصر الكارديو في النطاق المعتدل المستقر (Zone 2) مع إحماء تدريجي، وحظر الكارديو عالي الشدة (HIIT) لتجنب نوبات ضيق التنفس التحسسية (EIB).",
  }),

  // ==========================================
  // 5. DIGESTIVE CONDITIONS & IBS
  // ==========================================
  IBS: Object.freeze({
    /**
     * Scientific Source:
     * Monash University Low-FODMAP Diet Protocol. Fermentable oligosaccharides, disaccharides,
     * monosaccharides, and polyols (FODMAPs) must be excluded during flare-ups to eliminate
     * abdominal distension, excessive gas production, and visceral hypersensitivity.
     */
    EXCLUDE_HIGH_FODMAP: true,
    BANNED_FODMAP_LEVELS: Object.freeze(["HIGH"]),
    RATIONALE_AR: "استبعاد الأغذية عالية الفودماب (عالية التخمر) لراحة جدار الأمعاء ومنع الغازات والانتفاخ بناءً على بروتوكول جامعة موناش (Monash University Low-FODMAP Diet Protocol).",
  }),

  // ==========================================
  // 6. JOINT STRESS BIOMECHANICAL CLASSIFICATION
  // ==========================================
  JOINT_STRESS_TYPES: Object.freeze({
    LOWER_BACK: "LOWER_BACK",
    KNEE: "KNEE",
    SHOULDER: "SHOULDER",
    WRIST: "WRIST",
    NECK: "NECK",
    HIP: "HIP",
  }),

  // ==========================================
  // 7. PREGNANCY & MATERNAL HEALTH
  // ==========================================
  PREGNANCY: Object.freeze({
    /**
     * Scientific Source:
     * Institute of Medicine (IOM) Dietary Reference Intakes & ACOG Guidelines.
     * Minimum 175g/day carbohydrates required for fetal neurodevelopment and ketosis prevention.
     * Severe calorie deficits, ketogenic diets, and prolonged fasting are strictly contraindicated.
     */
    MIN_CARBS_GRAMS: 175,
    SURPLUS_TRIMESTER_2_KCAL: 340,
    SURPLUS_TRIMESTER_3_KCAL: 450,
    BANNED_FRAMEWORKS: Object.freeze(["TARGETED_LOW_CARB", "INTERMITTENT_FASTING"]),
    RATIONALE_AR: "فرض حد أدنى 175 جم كربوهيدرات يومياً وحظر الكيتو والصيام المتقطع للحوامل بناءً على توصيات معهد الطب الأمريكي (IOM) والكلية الأمريكية لأطباء النساء والتوليد (ACOG) لتغذية دماغ الجنين ومنع الكيتوزس.",
  }),
});
