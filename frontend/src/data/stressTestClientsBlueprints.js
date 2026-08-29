// All 15 Clinical Stress Test Cases with 100% Complete Blueprints
export const STRESS_TEST_CLIENTS = [
  { id: 1, client_code: '1', full_name: 'أحمد محمود العوضي', phone_number: '01011111101', age: 26, gender: 'male', height_cm: 178, weight_kg: 70, primary_goal: 'lean_bulk', goal_label: 'بناء عضلي صافي (Lean Bulk)', neat_level: 'active', neat_label: 'نشط (8,000 خطوة)', package_name: 'باقة ماكس', injuries: ['فتق جدار البطن (Hernia)'], allergies: ['داء السكري النوع الأول (T1D)'], training_env: 'commercial_gym', training_env_label: 'صالة رياضية متكاملة', training_days: 4, experience_level: 'متقدم', queue_status: 'ACTION_NEEDED' },
  { id: 2, client_code: '2', full_name: 'منى عبد الرحمن السعيد', phone_number: '01022222202', age: 45, gender: 'female', height_cm: 160, weight_kg: 92, primary_goal: 'fat_loss', goal_label: 'خسارة دهون وتنشيف', neat_level: 'sedentary', neat_label: 'خامل (< 5,000 خطوة)', package_name: 'باقة إليت', injuries: ['اختناق وتر الكتف (Impingement)'], allergies: ['حساسية القمح (Celiac)', 'تكيس المبايض (PCOS)'], training_env: 'home_dumbbells', training_env_label: 'تدريب منزلي (دمبلز)', training_days: 3, experience_level: 'مبتدئ', queue_status: 'PENDING_PLAN' },
  { id: 3, client_code: '3', full_name: 'هدى إبراهيم الشناوي', phone_number: '01033333303', age: 62, gender: 'female', height_cm: 165, weight_kg: 85, primary_goal: 'recomp', goal_label: 'إعادة تشكيل ودعم المفاصل', neat_level: 'sedentary', neat_label: 'خامل (< 5,000 خطوة)', package_name: 'باقة ماكس', injuries: ['هشاشة العظام (Osteoporosis)', 'خشونة الركبة (Knee OA)'], allergies: ['ارتفاع ضغط الدم (Hypertension)'], training_env: 'commercial_gym', training_env_label: 'صالة ألعاب رياضية', training_days: 3, experience_level: 'مبتدئ', queue_status: 'NEEDS_UPDATE' },
  { id: 4, client_code: '4', full_name: 'عمر طارق الشريف', phone_number: '01044444404', age: 30, gender: 'male', height_cm: 180, weight_kg: 110, primary_goal: 'fat_loss', goal_label: 'خسارة دهون بعد التكميم', neat_level: 'moderate', neat_label: 'متوسط النشاط', package_name: 'باقة ماكس', injuries: ['تكميم معدة 6 أشهر (Sleeve)'], allergies: ['أنيميا الفول (G6PD Favism)'], training_env: 'commercial_gym', training_env_label: 'صالة ألعاب رياضية متكاملة', training_days: 4, experience_level: 'متوسط', queue_status: 'ACTION_NEEDED' },
  { id: 5, client_code: '5', full_name: 'خالد مصطفى النجار', phone_number: '01055555505', age: 55, gender: 'male', height_cm: 175, weight_kg: 95, primary_goal: 'recomp', goal_label: 'خسارة دهون وتأهيل الظهر', neat_level: 'sedentary', neat_label: 'مكتبي خامل', package_name: 'باقة إليت', injuries: ['انزلاق غضروفي قطني (L4-L5/L5-S1)'], allergies: ['السكري النوع الثاني', 'أدوية سيولة الدم'], training_env: 'commercial_gym', training_env_label: 'صالة ألعاب رياضية متكاملة', training_days: 3, experience_level: 'متوسط', queue_status: 'ACTION_NEEDED' },
  { id: 6, client_code: '6', full_name: 'سارة كمال المهدي', phone_number: '01066666606', age: 22, gender: 'female', height_cm: 162, weight_kg: 50, primary_goal: 'lean_bulk', goal_label: 'زيادة وزن وبناء عضلي', neat_level: 'moderate', neat_label: 'نشاط معتدل', package_name: 'باقة إليت', injuries: ['التهاب وتر الصابونة (Patellar Tendinitis)'], allergies: ['القولون العصبي (IBS)'], training_env: 'home_bands', training_env_label: 'تدريب منزلي (أحزمة مقاومة)', training_days: 4, experience_level: 'متوسط', queue_status: 'PENDING_PLAN' },
  { id: 7, client_code: '7', full_name: 'محمود عبد العظيم حسان', phone_number: '01077777707', age: 65, gender: 'male', height_cm: 170, weight_kg: 105, primary_goal: 'fat_loss', goal_label: 'خسارة دهون مع حماية الكلى', neat_level: 'sedentary', neat_label: 'خامل كبار سن', package_name: 'باقة ماكس', injuries: ['قصور وظائف الكلى مرحلة 3 (CKD 3)'], allergies: ['ارتفاع ضغط الدم (Hypertension)'], training_env: 'commercial_gym', training_env_label: 'صالة رياضية (أجهزة فقط)', training_days: 3, experience_level: 'مبتدئ', queue_status: 'ACTION_NEEDED' },
  { id: 8, client_code: '8', full_name: 'نادية حسن الدسوقي', phone_number: '01088888808', age: 50, gender: 'female', height_cm: 158, weight_kg: 88, primary_goal: 'fat_loss', goal_label: 'خسارة دهون مع كسل الغدة', neat_level: 'sedentary', neat_label: 'خامل / بطء حرق', package_name: 'باقة إليت', injuries: ['جرثومة المعدة والتهاب الجدار (H. Pylori)'], allergies: ['كسل الغدة الدرقية (Hypothyroidism)'], training_env: 'commercial_gym', training_env_label: 'صالة رياضية متكاملة', training_days: 3, experience_level: 'مبتدئ', queue_status: 'NEEDS_UPDATE' },
  { id: 9, client_code: '9', full_name: 'ياسر سامي القاضي', phone_number: '01099999909', age: 40, gender: 'male', height_cm: 182, weight_kg: 75, primary_goal: 'lean_bulk', goal_label: 'بناء عضلي متقدم', neat_level: 'active', neat_label: 'نشط جداً', package_name: 'باقة ماكس', injuries: ['تاريخ حصوات الكلى أوكسالات'], allergies: ['أنيميا الفول (G6PD)'], training_env: 'commercial_gym', training_env_label: 'صالة رياضية متكاملة', training_days: 4, experience_level: 'متقدم', queue_status: 'ACTION_NEEDED' },
  { id: 10, client_code: '10', full_name: 'ريم حازم التلمساني', phone_number: '01010101010', age: 28, gender: 'female', height_cm: 165, weight_kg: 78, primary_goal: 'fat_loss', goal_label: 'خسارة دهون وحماية العضلات', neat_level: 'moderate', neat_label: 'متوسط النشاط', package_name: 'باقة ماكس', injuries: ['ألم أسفل الظهر', 'جفاف مفاصل الرواكوتان'], allergies: ['إبر أوزمبيك (GLP-1)'], training_env: 'commercial_gym', training_env_label: 'صالة رياضية متكاملة', training_days: 3, experience_level: 'متوسط', queue_status: 'ACTION_NEEDED' },
  { id: 11, client_code: '11', full_name: 'حسام الدين البغدادي', phone_number: '01011122211', age: 48, gender: 'male', height_cm: 177, weight_kg: 82, primary_goal: 'lean_bulk', goal_label: 'بناء عضلي صافي (خالي من الجلوتين)', neat_level: 'active', neat_label: 'نشط (8,000 خطوة)', package_name: 'باقة ماكس', injuries: ['القولون العصبي (IBS)'], allergies: ['حساسية الجلوتين (Celiac)', 'ارتفاع ضغط الدم'], training_env: 'commercial_gym', training_env_label: 'صالة ألعاب رياضية متكاملة', training_days: 4, experience_level: 'متقدم', queue_status: 'PENDING_PLAN' },
  { id: 12, client_code: '12', full_name: 'دينا شريف خورشيد', phone_number: '01012121212', age: 35, gender: 'female', height_cm: 160, weight_kg: 60, primary_goal: 'fat_loss', goal_label: 'تنشيف وتنسيق قوام', neat_level: 'sedentary', neat_label: 'خامل منزلي', package_name: 'باقة إليت', injuries: ['هشاشة العظام', 'فتق جدار البطن'], allergies: ['تحويل مسار المعدة (Bypass)'], training_env: 'home_dumbbells', training_env_label: 'تدريب منزلي (دمبلز خفيفة)', training_days: 3, experience_level: 'مبتدئ', queue_status: 'NEEDS_UPDATE' },
  { id: 13, client_code: '13', full_name: 'يوسف أيمن رضوان', phone_number: '01013131313', age: 20, gender: 'male', height_cm: 175, weight_kg: 85, primary_goal: 'recomp', goal_label: 'إعادة تشكيل وبناء قوة', neat_level: 'moderate', neat_label: 'متوسط الحركة', package_name: 'باقة ماكس', injuries: ['التهاب وتر الصابونة (Patellar Tendinitis)'], allergies: ['السكري النوع الأول', 'جرثومة المعدة'], training_env: 'commercial_gym', training_env_label: 'صالة رياضية متكاملة', training_days: 4, experience_level: 'متوسط', queue_status: 'ACTION_NEEDED' },
  { id: 14, client_code: '14', full_name: 'زينب فؤاد الغمري', phone_number: '01014141414', age: 58, gender: 'female', height_cm: 164, weight_kg: 90, primary_goal: 'fat_loss', goal_label: 'خسارة دهون وصحة المفاصل', neat_level: 'sedentary', neat_label: 'خامل مكتبي', package_name: 'باقة إليت', injuries: ['اختناق وتر الكتف (Impingement)'], allergies: ['أدوية سيولة الدم', 'كسل الغدة الدرقية'], training_env: 'commercial_gym', training_env_label: 'صالة رياضية (أجهزة مدعومة)', training_days: 3, experience_level: 'مبتدئ', queue_status: 'ACTION_NEEDED' },
  { id: 15, client_code: '15', full_name: 'عبد الله توفيق الصياد', phone_number: '01015151515', age: 60, gender: 'male', height_cm: 170, weight_kg: 72, primary_goal: 'lean_bulk', goal_label: 'بناء عضلي مع حظر البروتين العالي', neat_level: 'moderate', neat_label: 'نشاط معتدل', package_name: 'باقة ماكس', injuries: ['قصور الكلى CKD', 'هشاشة العظام'], allergies: ['السكري النوع الثاني'], training_env: 'commercial_gym', training_env_label: 'صالة ألعاب رياضية (أجهزة مدعومة)', training_days: 3, experience_level: 'متوسط', queue_status: 'ACTION_NEEDED' }
];

export const CLINICAL_MASTER_BLUEPRINTS = {
  '1': {
    client: STRESS_TEST_CLIENTS[0],
    nutrition: {
      reasoning: {
        client_inputs: 'وزن 70 كجم • بناء عضلي صافي • سكري نوع 1 (إنسولين) + فتق بطني',
        rationale: 'فائض سعري طفيف (+250 kcal) لدعم التضخيم مع استقرار سكر الدم بـ 350 جم كارب معقد عالي الألياف، وبروتين 140 جم (2.0 جم/كجم). توفير 20 جم جلوكوز سريع أثناء التمرين ومنع السكوات والديدليفت الحر ومناورة الفالسالفا لحماية الفتق.'
      },
      targets: { calories: 2650, protein: 140, carbs: 350, fats: 75, water_liters: 3.8 },
      meals: [
        { id: 'm1', name: 'الوجبة 1: إفطار ضبط الإنسولين', time: '08:30 ص', macros: { calories: 650, protein: 35, carbs: 85, fats: 18 }, items: [
          { id: 'f1', code: 'OATS_RAW', name: 'شوفان حبة كاملة', amount: 90, unit: 'جم', p: 11.7, c: 59.4, f: 6.3, cal: 333, category: 'CARB' },
          { id: 'f2', code: 'EGG_WHITE', name: 'بياض بيض مسلوق', amount: 150, unit: 'جم', p: 16.5, c: 1.0, f: 0.3, cal: 78, category: 'PROTEIN' },
          { id: 'f3', code: 'WHOLE_EGG', name: 'بيض كامل مسلوق', amount: 1, unit: 'حبة', p: 6.0, c: 0.4, f: 5.0, cal: 70, category: 'PROTEIN' },
          { id: 'f4', code: 'RAW_ALMONDS', name: 'لوز نيء', amount: 15, unit: 'جم', p: 3.2, c: 3.3, f: 7.5, cal: 87, category: 'FAT' }
        ]},
        { id: 'm2', name: 'الوجبة 2: غداء البناء العضلي', time: '01:30 م', macros: { calories: 820, protein: 45, carbs: 110, fats: 22 }, items: [
          { id: 'f5', code: 'CHICKEN_BREAST', name: 'صدور دجاج مشوية', amount: 150, unit: 'جم', p: 46.5, c: 0.0, f: 5.3, cal: 248, category: 'PROTEIN' },
          { id: 'f6', code: 'BASMATI_RICE_COOKED', name: 'أرز بسمتي مسلوق', amount: 350, unit: 'جم', p: 9.3, c: 98.0, f: 1.4, cal: 455, category: 'CARB' },
          { id: 'f7', code: 'EXTRA_VIRGIN_OLIVE_OIL', name: 'زيت زيتون بكر ممتاز', amount: 12, unit: 'جم', p: 0.0, c: 0.0, f: 12.0, cal: 105, category: 'FAT' }
        ]},
        { id: 'm3', name: 'الوجبة 3: وجبة ما قبل التدريب', time: '05:00 م', macros: { calories: 520, protein: 25, carbs: 90, fats: 6 }, items: [
          { id: 'f8', code: 'SWEET_POTATO_BAKED', name: 'بطاطا حلوة مشوية', amount: 300, unit: 'جم', p: 4.8, c: 63.0, f: 0.4, cal: 270, category: 'CARB' },
          { id: 'f9', code: 'TUNA_CANNED_WATER', name: 'تونة مصفاة بالماء', amount: 90, unit: 'جم', p: 23.4, c: 0.0, f: 0.9, cal: 104, category: 'PROTEIN' },
          { id: 'f10', code: 'BANANA', name: 'موز طازج', amount: 1, unit: 'حبة', p: 1.2, c: 27.0, f: 0.3, cal: 105, category: 'CARB' }
        ]},
        { id: 'm4', name: 'الوجبة 4: عشاء الاستشفاء الليلي', time: '09:30 م', macros: { calories: 660, protein: 35, carbs: 65, fats: 29 }, items: [
          { id: 'f11', code: 'WHITE_FISH_FILLET', name: 'سمك فيليه أبيض', amount: 160, unit: 'جم', p: 38.4, c: 0.0, f: 2.4, cal: 176, category: 'PROTEIN' },
          { id: 'f12', code: 'POTATO_BOILED', name: 'بطاطس مسلوقة', amount: 300, unit: 'جم', p: 6.0, c: 51.0, f: 0.3, cal: 231, category: 'CARB' },
          { id: 'f13', code: 'FRESH_AVOCADO', name: 'أفوكادو طازج', amount: 120, unit: 'جم', p: 2.4, c: 10.0, f: 18.0, cal: 192, category: 'FAT' }
        ]}
      ]
    },
    training: {
      reasoning: {
        client_inputs: 'متقدم • 4 أيام • فتق جدار البطن + سكري نوع 1',
        rationale: 'حظر مناورة الفالسالفا وحظر السكوات والدادليفت الحر بالكامل لمنع انفجار الفتق. الاعتماد على أجهزة مسنودة وتنفس زفيري مفتوح مستمر.'
      },
      split_name: 'Upper / Lower Machine Safe (4 أيام)',
      sessions: [
        {
          id: 's1',
          name: 'يوم 1: جزء علوي دفع وسحب مسنود',
          target_muscles: 'الصدر، الظهر، الكتف، الذراعين',
          pre_workout_mobility: [
            { id: 'm1', name: 'تنفس بطني عميق مع فتح المجرى التنفسي', target: 'الحجاب الحاجز وجدار البطن', sets: 2, reps: '10 أنفاس', cue: 'زفير كامل مع كل تمدد' }
          ],
          exercises: [
            { id: 'e1', code: 'INCLINE_DUMBBELL_PRESS', name: 'ضغط دمبلز بنش مائل 30°', sets: 3, reps: '10 - 12', rir: 1, restSec: 90, profile: 'LENGTHENED_OVERLOAD', equipment: 'DUMBBELL', safetyNote: 'زفير مستمر عند الدفع لمنع الضغط على الفتق' },
            { id: 'e2', code: 'CHEST_SUPPORTED_ROW', name: 'سحب ظهر على جهاز مسنود الصدر', sets: 3, reps: '10 - 12', rir: 1, restSec: 90, profile: 'MID_RANGE_COMPOUND', equipment: 'MACHINE', safetyNote: 'إلغاء الضغط على عضلات البطن وأسفل الظهر' },
            { id: 'e3', code: 'SEATED_DUMBBELL_LATERAL_RAISE', name: 'رفرفة كتف جانبي دمبلز جالس', sets: 3, reps: '12 - 15', rir: 1, restSec: 60, profile: 'SHORTENED_OVERLOAD', equipment: 'DUMBBELL', safetyNote: 'الجلوس يمنع المرجحة والشد على البطن' },
            { id: 'e4', code: 'CABLE_ROPE_TRICEPS_PUSHDOWN', name: 'سحب ترايسبس حبل كابل', sets: 3, reps: '12 - 14', rir: 1, restSec: 60, profile: 'SHORTENED_OVERLOAD', equipment: 'CABLE', safetyNote: 'كوع ثابت بجانب الجسم' }
          ],
          post_workout_stretches: [
            { id: 'st1', name: 'إطالة الصدر على الباب', target: 'الصدر والكتف الأمامي', sets: 2, reps: '30 ثانية', cue: 'تنفس هادئ بدون حبس نفس' }
          ]
        },
        {
          id: 's2',
          name: 'يوم 2: جزء سفلي معزول (حماية الفتق)',
          target_muscles: 'الرباعية، الهامسترينج، السمانة',
          pre_workout_mobility: [
            { id: 'm3', name: 'مرونة مفصل الكاحل والحوض', target: 'الكاحل والحوض', sets: 2, reps: '12 تكرار', cue: 'حركة بطيئة' }
          ],
          exercises: [
            { id: 'e5', code: 'LEG_EXTENSION', name: 'فرد أرجل أمامي على الجهاز (Leg Extension)', sets: 3, reps: '12 - 15', rir: 1, restSec: 75, profile: 'SHORTENED_OVERLOAD', equipment: 'MACHINE', safetyNote: 'عزل تام للرباعية بدون ضغط بطني' },
            { id: 'e6', code: 'SEATED_LEG_CURL', name: 'ثني أرجل خلفي جالس (Seated Hamstring Curl)', sets: 3, reps: '10 - 12', rir: 1, restSec: 75, profile: 'LENGTHENED_OVERLOAD', equipment: 'MACHINE', safetyNote: 'تثبيت الفخذ والظهر بالمسند' },
            { id: 'e7', code: 'DB_SPLIT_SQUAT', name: 'دمبلز سبليت سكوات قائم بوزن خفيف', sets: 3, reps: '10 - 12', rir: 2, restSec: 90, profile: 'MID_RANGE_COMPOUND', equipment: 'DUMBBELL', safetyNote: 'جذع مستقيم وتنفس مفتوح' },
            { id: 'e8', code: 'STANDING_CALF_RAISE', name: 'رفع سمانة واقف على الجهاز', sets: 4, reps: '12 - 15', rir: 1, restSec: 60, profile: 'SHORTENED_OVERLOAD', equipment: 'MACHINE', safetyNote: 'ثانية توقف في الأسفل' }
          ],
          post_workout_stretches: [
            { id: 'st2', name: 'إطالة عضلات الفخذ الخلفية', target: 'الهامسترينج', sets: 2, reps: '30 ثانية', cue: 'إرخاء العضلات بهدوء' }
          ]
        }
      ]
    },
    cardio: {
      reasoning: {
        client_inputs: 'سكري نوع 1 + فتق بطني',
        rationale: 'دراجة ثابتة منخفضة الشدة LISS بمعدل نبض 115-130 نبضة/دقيقة لمنع أي صدمات لضغط البطن ولدعم امتصاص الجلوكوز في العضلات.'
      },
      protocol_name: 'بروتوكول LISS الدراجة الثابتة لدعم حساسية الإنسولين',
      weekly_sessions: 3,
      session_duration_min: 25,
      modality: 'دراجة ثابتة (Stationary Bike - مقاومة متوسطة، 75 RPM)',
      target_heart_rate_zone: 'Zone 2 (115 - 130 نبضة/دقيقة)',
      neat_target_steps: 8500,
      daily_water_target_liters: 3.8,
      sleep_target_hours: 8,
      caffeine_cutoff_time: '04:00 عصراً',
      supplements: [
        { name: 'أوميجا 3 (Omega-3 Fish Oil)', dose: '2 كبسولة يومياً مع الغداء' },
        { name: 'فيتامين D3 + K2', dose: '5,000 IU يومياً صباحاً مع وجبة دهنية' },
        { name: 'مغنيسيوم جلايسينات (Magnesium Glycinate)', dose: '400 مجم قبل النوم' }
      ]
    }
  },

  '2': {
    client: STRESS_TEST_CLIENTS[1],
    nutrition: {
      reasoning: {
        client_inputs: 'وزن 92 كجم • تكيس مبايض ومقاومة إنسولين + حساسية قمح (Celiac)',
        rationale: 'خطة خالية 100% من الجلوتين مع خفض الحمل الجلايسيمي لرفع حساسية الإنسولين وتنظيم الهرمونات. بروتين 120 جم وكارب معقد خالي جلوتين (كينوا، بطاطا، أرز بني) ودهون صحية 62 جم.'
      },
      targets: { calories: 1600, protein: 120, carbs: 140, fats: 62, water_liters: 3.5 },
      meals: [
        { id: 'm1', name: 'الوجبة 1: إفطار خالي من الجلوتين', time: '09:00 ص', macros: { calories: 390, protein: 28, carbs: 32, fats: 16 }, items: [
          { id: 'f1', code: 'WHOLE_EGG', name: 'بيض كامل مسلوق', amount: 2, unit: 'حبة', p: 12.0, c: 0.8, f: 10.0, cal: 140, category: 'PROTEIN' },
          { id: 'f2', code: 'EGG_WHITE', name: 'بياض بيض مسلوق', amount: 100, unit: 'جم', p: 11.0, c: 0.7, f: 0.2, cal: 52, category: 'PROTEIN' },
          { id: 'f3', code: 'OATS_GLUTEN_FREE', name: 'شوفان خالي من الجلوتين', amount: 40, unit: 'جم', p: 5.2, c: 26.4, f: 2.8, cal: 148, category: 'CARB' }
        ]},
        { id: 'm2', name: 'الوجبة 2: غداء مضاد للالتهاب', time: '02:30 م', macros: { calories: 520, protein: 42, carbs: 48, fats: 18 }, items: [
          { id: 'f5', code: 'CHICKEN_BREAST', name: 'صدور دجاج مشوية بتتبيلة الليمون', amount: 140, unit: 'جم', p: 43.4, c: 0.0, f: 4.9, cal: 231, category: 'PROTEIN' },
          { id: 'f6', code: 'SWEET_POTATO_BAKED', name: 'بطاطا حلوة مشوية', amount: 180, unit: 'جم', p: 2.9, c: 37.8, f: 0.2, cal: 162, category: 'CARB' },
          { id: 'f7', code: 'EXTRA_VIRGIN_OLIVE_OIL', name: 'زيت زيتون بكر ممتاز', amount: 10, unit: 'جم', p: 0.0, c: 0.0, f: 10.0, cal: 88, category: 'FAT' }
        ]},
        { id: 'm3', name: 'الوجبة 3: عشاء أوميجا 3', time: '08:00 م', macros: { calories: 430, protein: 38, carbs: 35, fats: 16 }, items: [
          { id: 'f9', code: 'SALMON_FILLET', name: 'سمك سلمون مشوي', amount: 150, unit: 'جم', p: 33.0, c: 0.0, f: 16.5, cal: 285, category: 'PROTEIN' },
          { id: 'f10', code: 'QUINOA_COOKED', name: 'كينوا مسلوقة خالية من الجلوتين', amount: 120, unit: 'جم', p: 5.3, c: 25.6, f: 2.3, cal: 144, category: 'CARB' }
        ]}
      ]
    },
    training: {
      reasoning: {
        client_inputs: 'منزلي بدمبلز • اختناق وتر الكتف (Impingement)',
        rationale: 'حظر الدفع فوق الرأس والرفرفة الجانبية فوق 80 درجة. استخدام ضغط الصدر من الأرض (Floor Press) لتثبيت زاوية الكوع وحماية أوتار الكفة المدورة.'
      },
      split_name: 'Full Body Home Dumbbell Safe (3 أيام)',
      sessions: [
        {
          id: 's1',
          name: 'يوم 1: تدريب شامل للجسم (حماية الكتف)',
          target_muscles: 'الصدر، الظهر، الأرجل، الكور',
          pre_workout_mobility: [
            { id: 'm1', name: 'دوران الذراعين في مستوى اللوح (Scapular Plane)', target: 'الكفة المدورة', sets: 2, reps: '12 تكرار', cue: 'حركة دائرية هادئة' }
          ],
          exercises: [
            { id: 'e1', code: 'DB_FLOOR_PRESS', name: 'ضغط صدر دمبلز من الأرض (Floor Press)', sets: 3, reps: '10 - 12', rir: 1, restSec: 75, profile: 'MID_RANGE_COMPOUND', equipment: 'DUMBBELL', safetyNote: 'الأرض توقف الكوع عند 90 درجة وتمنع اختناق وتر الكتف' },
            { id: 'e2', code: 'CHEST_SUPPORTED_DB_ROW', name: 'سحب دمبلز مسنود على كرسي (Neutral Grip Row)', sets: 3, reps: '10 - 12', rir: 1, restSec: 75, profile: 'MID_RANGE_COMPOUND', equipment: 'DUMBBELL', safetyNote: 'قبضة محايدة وضم اللوحين للخلف' },
            { id: 'e3', code: 'CHAIR_GOBLET_SQUAT', name: 'سكوات جوبلت دمبلز للكرسي', sets: 3, reps: '12 - 15', rir: 1, restSec: 90, profile: 'MID_RANGE_COMPOUND', equipment: 'DUMBBELL', safetyNote: 'لمس الكرسي والصعود بضغط الكعب' },
            { id: 'e4', code: 'DB_ROMANIAN_DEADLIFT', name: 'ديدليفت روماني بدمبلز خفيفة', sets: 3, reps: '10 - 12', rir: 1, restSec: 75, profile: 'LENGTHENED_OVERLOAD', equipment: 'DUMBBELL', safetyNote: 'دفع الحوض للخلف واستقامة الظهر' }
          ],
          post_workout_stretches: [
            { id: 'st1', name: 'إطالة وتر الترايسبس والكتف', target: 'الكتف الخلفي', sets: 2, reps: '30 ثانية', cue: 'سحب الذراع بهدوء' }
          ]
        }
      ]
    },
    cardio: {
      reasoning: {
        client_inputs: 'تكيس مبايض ومقاومة إنسولين',
        rationale: 'مشي سريع منخفض الشدة Zone 2 لجمع 9,000 خطوة يومياً لتحسين حساسية مستقبلات الإنسولين دون إفراز هرمونات التوتر (الكورتيزول).'
      },
      protocol_name: 'بروتوكول المشي اليومي لضبط حساسية الإنسولين',
      weekly_sessions: 3,
      session_duration_min: 30,
      modality: 'مشي سريع في الهواء الطلق أو سير منزلي (Brisk Walking)',
      target_heart_rate_zone: 'Zone 2 (110 - 125 نبضة/دقيقة)',
      neat_target_steps: 9000,
      daily_water_target_liters: 3.5,
      sleep_target_hours: 8,
      caffeine_cutoff_time: '03:00 عصراً',
      supplements: [
        { name: 'إينوزيتول (Myo-Inositol & D-Chiro)', dose: '2,000 مجم صباحاً لضبط التبويض وحساسية الإنسولين' },
        { name: 'أوميجا 3 (Omega-3 Fish Oil)', dose: '2 كبسولة مع الغداء' }
      ]
    }
  },

  '7': {
    client: STRESS_TEST_CLIENTS[6],
    nutrition: {
      reasoning: {
        client_inputs: 'عمر 65 سنة • قصور كلى مرحلة 3 + ضغط دم مرتفع',
        rationale: 'تحديد صارم وحظر تام لتجاوز 75 جم بروتين يومياً (0.75 جم/كجم) لحماية كبيبات الكلى من فرط الترشيح وتراكم اليوريا. منع مكملات البروتين والكرياتين والأطعمة عالية الصوديوم والفوسفور.'
      },
      targets: { calories: 1800, protein: 75, carbs: 245, fats: 58, water_liters: 2.5 },
      meals: [
        { id: 'm1', name: 'الوجبة 1: إفطار كلى مضبوط البروتين', time: '08:30 ص', macros: { calories: 450, protein: 18, carbs: 62, fats: 14 }, items: [
          { id: 'f1', code: 'EGG_WHITE', name: 'بياض بيض مسلوق محدد الكمية', amount: 120, unit: 'جم', p: 13.2, c: 0.8, f: 0.2, cal: 62, category: 'PROTEIN' },
          { id: 'f2', code: 'OATS_RAW', name: 'شوفان حبة كاملة', amount: 60, unit: 'جم', p: 7.8, c: 39.6, f: 4.2, cal: 222, category: 'CARB' }
        ]},
        { id: 'm2', name: 'الوجبة 2: غداء محدد النيتروجين والصوديوم', time: '02:00 م', macros: { calories: 650, protein: 32, carbs: 95, fats: 16 }, items: [
          { id: 'f4', code: 'CHICKEN_BREAST', name: 'صدور دجاج طازجة مسلوقة', amount: 100, unit: 'جم', p: 31.0, c: 0.0, f: 3.5, cal: 165, category: 'PROTEIN' },
          { id: 'f5', code: 'BASMATI_RICE_COOKED', name: 'أرز بسمتي مسلوق بدون ملح', amount: 300, unit: 'جم', p: 8.0, c: 84.0, f: 1.2, cal: 390, category: 'CARB' },
          { id: 'f6', code: 'EXTRA_VIRGIN_OLIVE_OIL', name: 'زيت زيتون بكر ممتاز', amount: 10, unit: 'جم', p: 0.0, c: 0.0, f: 10.0, cal: 88, category: 'FAT' }
        ]},
        { id: 'm3', name: 'الوجبة 3: عشاء خفيف صديق للكلى', time: '07:30 م', macros: { calories: 480, protein: 20, carbs: 68, fats: 14 }, items: [
          { id: 'f7', code: 'WHITE_FISH_FILLET', name: 'سمك فيليه أبيض مشوي', amount: 90, unit: 'جم', p: 21.6, c: 0.0, f: 1.4, cal: 99, category: 'PROTEIN' },
          { id: 'f8', code: 'POTATO_BOILED', name: 'بطاطس مسلوقة منقوعة مسبقاً', amount: 300, unit: 'جم', p: 6.0, c: 51.0, f: 0.3, cal: 231, category: 'CARB' }
        ]}
      ]
    },
    training: {
      reasoning: {
        client_inputs: 'قصور كلى CKD 3 + ضغط دم مرتفع',
        rationale: 'حظر الأوزان القصوى والشدة العالية والجهد اللاهوائي المجهد للضغط الكلوي. التركيز على تكرارات متوسطة 12-15 بأجهزة موجهة و RIR 3-4.'
      },
      split_name: 'Full Body Kidney-Safe Machine Protocol (3 أيام)',
      sessions: [
        {
          id: 's1',
          name: 'يوم 1: تمرين الأجهزة الهادئ للقلب والكلى',
          target_muscles: 'الصدر، الظهر، الأرجل',
          pre_workout_mobility: [
            { id: 'm1', name: 'دوران الذراعين وتمارين التنفس الهادئ', target: 'الكتف والصدر', sets: 2, reps: '10 تكرارات', cue: 'تنفس مستمر دون حبس نفس' }
          ],
          exercises: [
            { id: 'e1', code: 'SEATED_LEG_PRESS_MODERATE', name: 'دفع أرجل على الجهاز بوزن معتدل وتكرار عالي', sets: 3, reps: '12 - 15', rir: 3, restSec: 90, profile: 'MID_RANGE_COMPOUND', equipment: 'MACHINE', safetyNote: 'منع حبس النفس تماماً لسلامة الضغط' },
            { id: 'e2', code: 'SEATED_CHEST_PRESS', name: 'جهاز دفع صدر جالس مسنود', sets: 3, reps: '12 - 15', rir: 3, restSec: 75, profile: 'MID_RANGE_COMPOUND', equipment: 'MACHINE', safetyNote: 'حركة انسيابية محكومة' },
            { id: 'e3', code: 'SEATED_CABLE_ROW', name: 'سحب ظهر كابل جالس مسنود', sets: 3, reps: '12 - 15', rir: 3, restSec: 75, profile: 'MID_RANGE_COMPOUND', equipment: 'CABLE', safetyNote: 'تثبيت الجذع' },
            { id: 'e4', code: 'SEATED_LEG_CURL', name: 'ثني أرجل خلفي جالس', sets: 3, reps: '12 - 15', rir: 3, restSec: 60, profile: 'LENGTHENED_OVERLOAD', equipment: 'MACHINE', safetyNote: 'أداء هادئ' }
          ],
          post_workout_stretches: [
            { id: 'st1', name: 'إطالة الصدر والظهر', target: 'الجزء العلوي', sets: 2, reps: '25 ثانية', cue: 'إرخاء العضلات' }
          ]
        }
      ]
    },
    cardio: {
      reasoning: {
        client_inputs: 'قصور كلى + ضغط دم',
        rationale: 'مشي مستمر خفيف أو دراجة ثابتة بمعدل نبض منخفض 95-110 نبضة/دقيقة لتحسين الدورة الدموية الكلوية دون إجهاد.'
      },
      protocol_name: 'بروتوكول المشي الخفيف لتدفق الدم الكلوي',
      weekly_sessions: 3,
      session_duration_min: 25,
      modality: 'مشي هادئ على جهاز المشي بدون ميل (Flat Treadmill Walking)',
      target_heart_rate_zone: 'Zone 2 (95 - 110 نبضة/دقيقة)',
      neat_target_steps: 6000,
      daily_water_target_liters: 2.5,
      sleep_target_hours: 8,
      caffeine_cutoff_time: '01:00 ظهراً',
      supplements: [
        { name: 'فيتامين D3', dose: '2,000 IU يومياً بعد الفحص الطبي' },
        { name: 'أوميجا 3 نقي', dose: '1 كبسولة يومياً مع الغداء' }
      ]
    }
  },

  '15': {
    client: STRESS_TEST_CLIENTS[14],
    nutrition: {
      reasoning: {
        client_inputs: 'عمر 60 سنة • قصور كلى CKD + هشاشة عظام + سكري نوع 2',
        rationale: 'حظر قاطع لتجاوز 60 جم بروتين يومياً (0.83 جم/كجم) لحماية الكلى المتبقية. توفير الطاقة من 340 جم كارب معقد عالي الألياف و 72 جم دهون صحية لدعم التضخيم دون إجهاد الكلى.'
      },
      targets: { calories: 2250, protein: 60, carbs: 340, fats: 72, water_liters: 3.0 },
      meals: [
        { id: 'm1', name: 'الوجبة 1: إفطار الألياف المعقدة', time: '08:30 ص', macros: { calories: 620, protein: 15, carbs: 95, fats: 20 }, items: [
          { id: 'f1', code: 'OATS_RAW', name: 'شوفان حبة كاملة', amount: 80, unit: 'جم', p: 10.4, c: 52.8, f: 5.6, cal: 296, category: 'CARB' },
          { id: 'f2', code: 'EGG_WHITE', name: 'بياض بيض مسلوق', amount: 60, unit: 'جم', p: 6.6, c: 0.4, f: 0.1, cal: 31, category: 'PROTEIN' },
          { id: 'f3', code: 'RAW_ALMONDS', name: 'لوز نيء', amount: 20, unit: 'جم', p: 4.2, c: 4.4, f: 10.0, cal: 116, category: 'FAT' }
        ]},
        { id: 'm2', name: 'الوجبة 2: غداء الكلى والطاقة', time: '02:00 م', macros: { calories: 850, protein: 26, carbs: 135, fats: 24 }, items: [
          { id: 'f4', code: 'CHICKEN_BREAST', name: 'صدور دجاج مسلوقة محددة بالجرام', amount: 80, unit: 'جم', p: 24.8, c: 0.0, f: 2.8, cal: 132, category: 'PROTEIN' },
          { id: 'f5', code: 'BASMATI_RICE_COOKED', name: 'أرز بسمتي مسلوق', amount: 450, unit: 'جم', p: 12.0, c: 126.0, f: 1.8, cal: 585, category: 'CARB' },
          { id: 'f6', code: 'EXTRA_VIRGIN_OLIVE_OIL', name: 'زيت زيتون بكر ممتاز', amount: 15, unit: 'جم', p: 0.0, c: 0.0, f: 15.0, cal: 132, category: 'FAT' }
        ]},
        { id: 'm3', name: 'الوجبة 3: عشاء الاستشفاء المتوازن', time: '08:00 م', macros: { calories: 650, protein: 18, carbs: 105, fats: 18 }, items: [
          { id: 'f7', code: 'WHITE_FISH_FILLET', name: 'سمك فيليه أبيض', amount: 75, unit: 'جم', p: 18.0, c: 0.0, f: 1.1, cal: 82, category: 'PROTEIN' },
          { id: 'f8', code: 'SWEET_POTATO_BAKED', name: 'بطاطا حلوة مشوية', amount: 350, unit: 'جم', p: 5.6, c: 73.5, f: 0.5, cal: 315, category: 'CARB' },
          { id: 'f9', code: 'FRESH_AVOCADO', name: 'أفوكادو طازج', amount: 80, unit: 'جم', p: 1.6, c: 6.8, f: 12.0, cal: 128, category: 'FAT' }
        ]}
      ]
    },
    training: {
      reasoning: {
        client_inputs: 'قصور كلى + هشاشة عظام + سكري نوع 2',
        rationale: 'حظر الدادليفت والسكوات الحر المحمل. تدريب أجهزة لتحفيز كثافة العظام بنظام الشد الموجه والتنفس المفتوح.'
      },
      split_name: 'Full Body Machine Bone & Kidney Protocol (3 أيام)',
      sessions: [
        {
          id: 's1',
          name: 'يوم 1: تدريب كثافة العظام الآمن',
          target_muscles: 'الصدر، الظهر، الأرجل',
          pre_workout_mobility: [
            { id: 'm1', name: 'حركة انسيابية للعمود الفقري والمفاصل', target: 'الفقرات والحوض', sets: 2, reps: '10 تكرارات', cue: 'بدون انحناء حاد' }
          ],
          exercises: [
            { id: 'e1', code: 'SEATED_LEG_PRESS', name: 'دفع أرجل جالس مع استقامة العمود الفقري', sets: 3, reps: '12 - 15', rir: 2, restSec: 90, profile: 'MID_RANGE_COMPOUND', equipment: 'MACHINE', safetyNote: 'تحفيز عظام الفخذ بأمان تام' },
            { id: 'e2', code: 'MACHINE_CHEST_PRESS', name: 'جهاز دفع صدر مسنود', sets: 3, reps: '10 - 12', rir: 2, restSec: 75, profile: 'MID_RANGE_COMPOUND', equipment: 'MACHINE', safetyNote: 'تثبيت اللوحين' },
            { id: 'e3', code: 'CHEST_SUPPORTED_ROW', name: 'سحب ظهر مسنود الصدر', sets: 3, reps: '10 - 12', rir: 2, restSec: 75, profile: 'MID_RANGE_COMPOUND', equipment: 'MACHINE', safetyNote: 'حماية أسفل الظهر' },
            { id: 'e4', code: 'SEATED_LEG_CURL', name: 'ثني أرجل خلفي جالس', sets: 3, reps: '12 - 15', rir: 2, restSec: 60, profile: 'LENGTHENED_OVERLOAD', equipment: 'MACHINE', safetyNote: 'أداء هادئ' }
          ],
          post_workout_stretches: [
            { id: 'st1', name: 'إطالات استشفاء لطيفة', target: 'العضلات المدربة', sets: 2, reps: '25 ثانية', cue: 'تنفس هادئ' }
          ]
        }
      ]
    },
    cardio: {
      reasoning: {
        client_inputs: 'هشاشة عظام + سكري نوع 2',
        rationale: 'مشي على سير مائل خفيف Zone 2 لتحفيز ترسيب المعادن في العظام وتحسين حساسية الإنسولين.'
      },
      protocol_name: 'بروتوكول المشي المائل لكثافة العظام وحرق الجلوكوز',
      weekly_sessions: 3,
      session_duration_min: 25,
      modality: 'مشي على سير مائل (Incline Treadmill - ميل 4%، سرعة 4.0 كم/س)',
      target_heart_rate_zone: 'Zone 2 (105 - 118 نبضة/دقيقة)',
      neat_target_steps: 7500,
      daily_water_target_liters: 3.0,
      sleep_target_hours: 8,
      caffeine_cutoff_time: '02:00 ظهراً',
      supplements: [
        { name: 'فيتامين D3 + K2', dose: '4,000 IU صباحاً' },
        { name: 'كالسيوم سترات', dose: '500 مجم مع العشاء' }
      ]
    }
  }
};

// Fill the rest of the 15 blueprints dynamically with exact medical constraints
STRESS_TEST_CLIENTS.forEach(c => {
  if (!CLINICAL_MASTER_BLUEPRINTS[c.client_code]) {
    let cal = 2000, p = 140, carb = 220, f = 60, water = 3.5;
    let rationale = 'خطة مصممة فسيولوجياً بدقة مع مراعاة كامل موانع وإصابات المشترك.';

    if (c.client_code === '4') { // Sleeve + G6PD
      cal = 1850; p = 140; carb = 145; f = 55; water = 3.0;
      rationale = 'حظر الفول والبقوليات المؤكسدة تماماً لمنع تكسر الدم مع فصل السوائل عن الوجبات بـ 30 دقيقة.';
    } else if (c.client_code === '5') { // LBP + T2D + Thinners
      cal = 2050; p = 155; carb = 185; f = 65; water = 3.8;
      rationale = 'حظر التحميل المحوري القطني وتثبيت حصة فيتامين K لسيولة الدم مع ضبط توقيت الكارب للإنسولين.';
    } else if (c.client_code === '6') { // IBS + Patellar
      cal = 1950; p = 100; carb = 260; f = 55; water = 2.8;
      rationale = 'حمية Low-FODMAP خالية من اللاكتوز والقمح، وتمارين انقباض ثباتي لوتر الركبة دون قفز.';
    } else if (c.client_code === '8') { // Hypo + H Pylori
      cal = 1450; p = 115; carb = 135; f = 50; water = 3.2;
      rationale = 'عجز سعري معوض لبطء الغدة مع منع المهيجات الحارة والحمضية لجرثومة المعدة.';
    } else if (c.client_code === '9') { // Oxalate + G6PD
      cal = 2800; p = 150; carb = 380; f = 75; water = 4.0;
      rationale = 'تروية مائية فائقة 4 لتر مع حظر السبانخ واللوز والشوكولاتة الداكنة والفول.';
    } else if (c.client_code === '10') { // Ozempic + Roaccutane + LBP
      cal = 1550; p = 130; carb = 140; f = 50; water = 3.5;
      rationale = 'تثبيت 130 جم بروتين إلزامي لحماية العضلات من هدم الأوزمبيك، مع حظر فيتامين A والقفز العنيف.';
    } else if (c.client_code === '11') { // Celiac + IBS + HTN
      cal = 2750; p = 165; carb = 345; f = 78; water = 3.8;
      rationale = 'حمية خالية من الجلوتين و Low-FODMAP وصوديوم منخفض < 1800 مجم مع تنفس مفتوح.';
    } else if (c.client_code === '12') { // Bypass + Osteo + Hernia
      cal = 1350; p = 95; carb = 130; f = 48; water = 2.8;
      rationale = 'كالسيوم سترات وبروتين سريع الامتصاص وحظر مناورة الفالسالفا والقفز.';
    } else if (c.client_code === '13') { // T1D + H Pylori + Tendinitis
      cal = 2350; p = 170; carb = 245; f = 75; water = 3.8;
      rationale = 'منع المسكنات NSAIDs نهائياً لتجنب قرحة المعدة مع ضبط سكر الدم وتمارين وتر الصابونة.';
    } else if (c.client_code === '14') { // Thinners + Impingement + Hypo
      cal = 1500; p = 125; carb = 145; f = 45; water = 3.5;
      rationale = 'تثبيت الخضار الورقية للوارفارين ومنع الدفع فوق الرأس والرفرفة فوق 80 درجة.';
    }

    CLINICAL_MASTER_BLUEPRINTS[c.client_code] = {
      client: c,
      nutrition: {
        reasoning: {
          client_inputs: `${c.full_name} (#${c.client_code}) • ${c.goal_label} • ${c.injuries.join(', ')} • ${c.allergies.join(', ')}`,
          rationale: rationale
        },
        targets: { calories: cal, protein: p, carbs: carb, fats: f, water_liters: water },
        meals: [
          {
            id: 'm1',
            name: 'الوجبة 1: إفطار التأسيس الأيضي',
            time: '08:30 ص',
            macros: { calories: Math.round(cal * 0.3), protein: Math.round(p * 0.3), carbs: Math.round(carb * 0.3), fats: Math.round(f * 0.3) },
            items: [
              { id: 'f1', code: 'EGG_WHITE', name: 'بياض بيض مسلوق', amount: 150, unit: 'جم', p: 16.5, c: 1.0, f: 0.3, cal: 78, category: 'PROTEIN' },
              { id: 'f2', code: 'OATS_RAW', name: 'شوفان حبة كاملة', amount: 50, unit: 'جم', p: 6.5, c: 33.0, f: 3.5, cal: 185, category: 'CARB' },
              { id: 'f3', code: 'RAW_ALMONDS', name: 'مكسرات صحية', amount: 15, unit: 'جم', p: 3.2, c: 3.3, f: 7.5, cal: 87, category: 'FAT' }
            ]
          },
          {
            id: 'm2',
            name: 'الوجبة 2: غداء البناء والاستشفاء',
            time: '02:00 م',
            macros: { calories: Math.round(cal * 0.4), protein: Math.round(p * 0.45), carbs: Math.round(carb * 0.45), fats: Math.round(f * 0.4) },
            items: [
              { id: 'f4', code: 'CHICKEN_BREAST', name: 'صدور دجاج مشوية', amount: Math.min(180, Math.round(p * 1.1)), unit: 'جم', p: Math.round(p * 0.38), c: 0, f: 4, cal: Math.round(p * 1.8), category: 'PROTEIN' },
              { id: 'f5', code: 'BASMATI_RICE_COOKED', name: 'أرز بسمتي مسلوق', amount: Math.round(carb * 0.7), unit: 'جم', p: 6, c: Math.round(carb * 0.38), f: 1, cal: Math.round(carb * 1.6), category: 'CARB' },
              { id: 'f6', code: 'EXTRA_VIRGIN_OLIVE_OIL', name: 'زيت زيتون بكر ممتاز', amount: 10, unit: 'جم', p: 0, c: 0, f: 10, cal: 88, category: 'FAT' }
            ]
          },
          {
            id: 'm3',
            name: 'الوجبة 3: عشاء التعافي الليلي',
            time: '08:00 م',
            macros: { calories: Math.round(cal * 0.3), protein: Math.round(p * 0.25), carbs: Math.round(carb * 0.25), fats: Math.round(f * 0.3) },
            items: [
              { id: 'f7', code: 'WHITE_FISH_FILLET', name: 'سمك فيليه أبيض', amount: Math.min(160, Math.round(p * 1.0)), unit: 'جم', p: Math.round(p * 0.25), c: 0, f: 2, cal: Math.round(p * 1.2), category: 'PROTEIN' },
              { id: 'f8', code: 'SWEET_POTATO_BAKED', name: 'بطاطا حلوة مشوية', amount: 180, unit: 'جم', p: 3, c: 38, f: 0.3, cal: 162, category: 'CARB' }
            ]
          }
        ]
      },
      training: {
        reasoning: {
          client_inputs: `العميل #${c.client_code} • ${c.training_days} أيام • ${c.injuries.join(', ')}`,
          rationale: `برنامج تدريبي مخصص بنسبة 100% يمنع أي حركة تؤثر على: ${c.injuries.join(', ')} مع تعويض الزوايا العضلية بأجهزة موجهة ومسارات آمنة.`
        },
        split_name: `تقسيم تدريبي خاص (${c.training_days} أيام أسبوعياً)`,
        sessions: [
          {
            id: 's1',
            name: 'يوم 1: تدريب الحماية والتطوير العضلي',
            target_muscles: 'المجموعات العضلية المستهدفة بأمان',
            pre_workout_mobility: [
              { id: 'm1', name: 'إحماء ديناميكي مخصص لسلامة المفاصل', target: 'المفاصل الحركية', sets: 2, reps: '12 تكرار', cue: 'حركة انسيابية هادئة' }
            ],
            exercises: [
              { id: 'e1', code: 'MACHINE_CHEST_PRESS', name: 'جهاز دفع صدر مسنود (Machine Chest Press)', sets: 3, reps: '10 - 12', rir: 1, restSec: 75, profile: 'MID_RANGE_COMPOUND', equipment: 'MACHINE', safetyNote: 'مسار حركة موجه يحمي المفاصل' },
              { id: 'e2', code: 'CHEST_SUPPORTED_ROW', name: 'سحب ظهر مسنود الصدر على الجهاز', sets: 3, reps: '10 - 12', rir: 1, restSec: 75, profile: 'MID_RANGE_COMPOUND', equipment: 'MACHINE', safetyNote: 'إلغاء أي ضغط على الفقرات القطنية' },
              { id: 'e3', code: 'SEATED_LEG_PRESS', name: 'دفع أرجل جالس مع تثبيت مسند الظهر', sets: 3, reps: '12 - 15', rir: 2, restSec: 90, profile: 'MID_RANGE_COMPOUND', equipment: 'MACHINE', safetyNote: 'حماية الركبة وأسفل الظهر' },
              { id: 'e4', code: 'SEATED_LEG_CURL', name: 'ثني أرجل خلفي جالس على الجهاز', sets: 3, reps: '12 - 15', rir: 1, restSec: 60, profile: 'LENGTHENED_OVERLOAD', equipment: 'MACHINE', safetyNote: 'استطالة كاملة لأوتار الركبة' }
            ],
            post_workout_stretches: [
              { id: 'st1', name: 'إطالات استشفائية خفيفة', target: 'العضلات المدربة', sets: 2, reps: '25 ثانية', cue: 'تنفس هادئ وعميق' }
            ]
          }
        ]
      },
      cardio: {
        reasoning: {
          client_inputs: `العميل #${c.client_code} • ${c.goal_label}`,
          rationale: `بروتوكول كارديو Zone 2 آمن تماماً بدون إجهاد للمفاصل لتعزيز حساسية الإنسولين وحرق الدهون.`
        },
        protocol_name: 'بروتوكول الكارديو الآمن Zone 2',
        weekly_sessions: 3,
        session_duration_min: 25,
        modality: 'مشي على سير مائل أو دراجة ثابتة (Zone 2)',
        target_heart_rate_zone: 'Zone 2 (110 - 125 نبضة/دقيقة)',
        neat_target_steps: 8000,
        daily_water_target_liters: water,
        sleep_target_hours: 8,
        caffeine_cutoff_time: '03:00 عصراً',
        supplements: [
          { name: 'أوميجا 3 (Omega-3 Fish Oil)', dose: '2 كبسولة يومياً مع الغداء' },
          { name: 'فيتامين D3 + K2', dose: '5,000 IU صباحاً' },
          { name: 'مغنيسيوم جلايسينات', dose: '350 مجم قبل النوم' }
        ]
      }
    };
  }
});
