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
  // 1. A PROTEIN CAP THE BLOODWORK ASKS FOR
  // ==========================================
  // Declared kidney disease is outside the service (src/api/services/serviceScope.js): the KDOQI
  // energy ceiling, the potassium rules and the protein ceiling for a diagnosis left with the case.
  // What remains is the cap the biomarker engine asks for when a client we do follow shows kidney
  // function off in the laboratory results - that cap carries its own number and its own rationale.
  LAB_PROTEIN_CAP: Object.freeze({
    /**
     * Scientific Source:
     * IOM DRI (2005): +25 g/day of protein in lactation. A capped protein plus what breastfeeding
     * costs, never the cap alone.
     */
    LACTATION_EXTRA_PROTEIN_G: 25,
  }),

  // ==========================================
  // 1a. OVERALL BALANCE OF THE DAY
  // ==========================================
  NUTRITION_BALANCE: Object.freeze({
    /**
     * Scientific Source:
     * IOM Dietary Reference Intakes for Energy and Macronutrients (2005), Acceptable Macronutrient
     * Distribution Range for adults: fat 20-35% of energy. Energy a clinical limit pushes out of
     * carbohydrate (diabetes) or protein (kidneys) must not pile up as fat above this share.
     */
    MAX_FAT_ENERGY_SHARE: 0.35,
    // The engine's own top protein level (fat loss / recomposition), used when protein takes the
    // energy fat cannot.
    MAX_PROTEIN_PER_KG: 2.2,
  }),

  // ==========================================
  // 1b. LIVER DISEASE
  // ==========================================
  LIVER: Object.freeze({
    /**
     * Scientific Source:
     * EASL Clinical Practice Guidelines on Nutrition in Chronic Liver Disease (2019) & AASLD NAFLD guidance.
     * Protein is NOT restricted in liver disease (1.2-1.5 g/kg in cirrhosis to prevent sarcopenia); fatty liver
     * (MASLD) benefits from 7-10% weight loss. The condition type is not collected, so the plan requires
     * medical review; no automatic protein cap is applied.
     */
    GUIDANCE_AR: "توجيه سريري لأمراض الكبد: لا يتم تقليل البروتين تلقائياً (نقص البروتين يسرّع ضمور العضلات في أمراض الكبد المزمنة). دهون الكبد تستفيد من نزول 7-10% من الوزن تدريجياً. يجب تأكيد نوع الحالة وخطة التغذية مع الطبيب المعالج قبل اعتماد البرنامج، مع منع الكحول والمكملات العشبية غير الموصوفة.",
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
     * Meal swaps filter out high-GI carbohydrates to preserve glycemic stability.
     * The 'Rule of 15': 15-20g of fast-acting carbohydrate must be on hand during sessions > 45 minutes
     * or whenever symptoms of exercise-induced hypoglycemia appear.
     * Note: Carbohydrate distribution is individualized (ADA Standards of Care); no universal 45% mandatory ceiling.
     * Note: 130g/day is an estimated average requirement (EAR) for cerebral glucose utilization in healthy adults,
     * NOT an insulin-safety guarantee or hypoglycemia prevention shield.
     * Note: The coaching platform NEVER adjusts or recommends adjusting insulin or medication dosages.
     */
    HYPOGLYCEMIA_RESCUE_CARBS_GRAMS: 15,
    SESSION_DURATION_THRESHOLD_MINUTES: 45,
    HIGH_GLYCEMIC_SWAP_BAN: true,
    BANNED_GI_LEVELS: Object.freeze(["HIGH"]),
    RATIONALE_AR: "استبعاد الأطعمة ذات المؤشر الجلايسيمي المرتفع لمرضى السكري ومقاومة الأنسولين لمنع الارتفاعات الحادة في سكر الدم والأنسولين (ADA Guidelines).",
    MAX_CARB_ENERGY_SHARE: null,
    REFERENCE_CARB_ENERGY_SHARE: 0.45,
    FAT_SHARE_REVIEW_THRESHOLD: 0.4,
    CARB_CAP_RATIONALE_AR: "توزيع الكربوهيدرات يتم بشكل فردي وفق إرشادات ADA وحالة كل متدرب، مع حظر الأغذية مرتفعة المؤشر الجلايسيمي وتوفير بروتوكول الإنقاذ السريع.",
    SAFETY_GUIDANCE_AR: "بروتوكول أمان هبوط السكر: يجب توفير 15-20 جم كربوهيدرات سريعة الامتصاص (مثل عصير فواكه أو تمرة واحدة أو أقراص جلوكوز) أثناء التمارين التي تتجاوز 45 دقيقة مع قياس السكر قبل بدء الجلسة.",
    INSULIN_COORDINATION_AR: "مرضى السكري المعتمدون على الإنسولين أو النوع الأول يتطلبون تنسيقاً مع الفريق الطبي المعالج لضبط التغذية والنشاط البدني دون أي تعديل في جرعات الإنسولين أو الأدوية من قبل المنظومة.",
    EAR_130G_DISCLAIMER_AR: "الحد الأدنى 130 جم كربوهيدرات هو تقدير فسيولوجي لاستهلاك جلوكوز الدماغ (EAR)، ولا يُعد ضماناً ذاتياً لمنع هبوط السكر لدى متناولي الإنسولين أو محفزات إفرازه."
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
  // The PREGNANCY block (IOM/ACOG: a 175 g carbohydrate floor, the surplus by trimester, and the
  // ban on low-carb and fasting) left with the case: pregnancy is outside the service and no plan
  // is built for it (src/api/services/serviceScope.js).
});
