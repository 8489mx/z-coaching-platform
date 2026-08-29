import sequelize from "./config/database.js";
import { User, CheckinSubmission, Program } from "./models/index.js";

const SIMULATED_CLIENTS = [
  {
    "client_code": "1",
    "full_name": "أحمد محمود العوضي",
    "phone_number": "01011111101",
    "age": 26,
    "gender": "MALE",
    "height_cm": 178,
    "weight_kg": 72.1,
    "start_weight": 70,
    "primary_goal": "lean_bulk",
    "goal_label": "بناء عضلي صافي (Lean Bulk)",
    "package_code": "MAX_3_PLUS_1",
    "package_name": "باقة ماكس (VIP 4 شهور)",
    "package_tier": "max",
    "subscription_price": 3500,
    "payment_method": "INSTAPAY",
    "days_elapsed": 60,
    "total_days": 120,
    "checkin_frequency_days": 7,
    "adherence_pattern": "CONSISTENT_HIGH",
    "status": "ACTIVE",
    "persona_story": "مشترك منذ شهرين (8 أسابيع)، زيادة عضلية صافية من 70 كجم إلى 72.1 كجم، التزام بالوجبات 95%، سكر الدم مستقر مع جرعات الإنسولين، تمارين الصدر والظهر مسنودة لحماية الفتق.",
    "history_weeks": [
      {
        "week": 0,
        "weight": 70,
        "waist": 78,
        "adherence": 100,
        "date": "1 يوليو",
        "diff": 0
      },
      {
        "week": 1,
        "weight": 70.3,
        "waist": 78,
        "adherence": 96,
        "date": "8 يوليو",
        "diff": 0.3
      },
      {
        "week": 2,
        "weight": 70.6,
        "waist": 78.2,
        "adherence": 94,
        "date": "15 يوليو",
        "diff": 0.3
      },
      {
        "week": 3,
        "weight": 70.9,
        "waist": 78.3,
        "adherence": 98,
        "date": "22 يوليو",
        "diff": 0.3
      },
      {
        "week": 4,
        "weight": 71.2,
        "waist": 78.5,
        "adherence": 95,
        "date": "29 يوليو",
        "diff": 0.3
      },
      {
        "week": 5,
        "weight": 71.5,
        "waist": 78.5,
        "adherence": 92,
        "date": "5 أغسطس",
        "diff": 0.3
      },
      {
        "week": 6,
        "weight": 71.7,
        "waist": 78.6,
        "adherence": 95,
        "date": "12 أغسطس",
        "diff": 0.2
      },
      {
        "week": 7,
        "weight": 71.9,
        "waist": 78.8,
        "adherence": 96,
        "date": "19 أغسطس",
        "diff": 0.2
      },
      {
        "week": 8,
        "weight": 72.1,
        "waist": 78.8,
        "adherence": 95,
        "date": "26 أغسطس",
        "diff": 0.2
      }
    ],
    "latest_checkin": {
      "week": 8,
      "weight_change": 0.2,
      "waist_change": 0,
      "workouts_completed": 4,
      "workouts_target": 4,
      "daily_steps": 8800,
      "energy": 9,
      "sleep": 8,
      "hunger": 6,
      "recovery": 9,
      "stress": 3,
      "digestion": "ممتاز ومستقر تماماً",
      "client_notes": "الأوزان في الدمبلز بنش بريس المائل زادت لـ 32 كجم للدمبل، وجرعات الإنسولين مستقرة تماماً مع وجبات الكارب المعقد وبدون أي هبوط.",
      "ai_recommendation": "استجابة بنائية مثالية (+2.1 كجم على مدار 8 أسابيع دون زيادة في محيط الخصر). استمرار على 2,650 سعرة.",
      "status_badge": "تطور عضلي صافي ممتاز"
    }
  },
  {
    "client_code": "2",
    "full_name": "منى عبد الرحمن السعيد",
    "phone_number": "01022222202",
    "age": 45,
    "gender": "FEMALE",
    "height_cm": 160,
    "weight_kg": 85.4,
    "start_weight": 92,
    "primary_goal": "fat_loss",
    "goal_label": "خسارة دهون وتنشيف",
    "package_code": "ELITE_6M_PLUS_2",
    "package_name": "باقة إيليت نصف سنوية (8 شهور)",
    "package_tier": "elite",
    "subscription_price": 4200,
    "payment_method": "VODAFONE_CASH",
    "days_elapsed": 90,
    "total_days": 240,
    "checkin_frequency_days": 14,
    "adherence_pattern": "SOLID_TRANSFORMATION",
    "status": "ACTIVE",
    "persona_story": "مشتركة منذ 3 شهور (12 أسبوعاً)، نزول مذهل من 92.0 كجم إلى 85.4 كجم (-6.6 كجم دهون)، محيط الخصر نزل 8 سم، تحسن كبير في أعراض تكيس المبايض والكتف.",
    "history_weeks": [
      {
        "week": 0,
        "weight": 92,
        "waist": 98,
        "adherence": 100,
        "date": "1 يونيو",
        "diff": 0
      },
      {
        "week": 2,
        "weight": 90.8,
        "waist": 96.5,
        "adherence": 94,
        "date": "15 يونيو",
        "diff": -1.2
      },
      {
        "week": 4,
        "weight": 89.6,
        "waist": 95,
        "adherence": 92,
        "date": "29 يونيو",
        "diff": -1.2
      },
      {
        "week": 6,
        "weight": 88.3,
        "waist": 93.5,
        "adherence": 90,
        "date": "13 يوليو",
        "diff": -1.3
      },
      {
        "week": 8,
        "weight": 87.2,
        "waist": 92,
        "adherence": 95,
        "date": "27 يوليو",
        "diff": -1.1
      },
      {
        "week": 10,
        "weight": 86.3,
        "waist": 91,
        "adherence": 88,
        "date": "10 أغسطس",
        "diff": -0.9
      },
      {
        "week": 12,
        "weight": 85.4,
        "waist": 90,
        "adherence": 92,
        "date": "24 أغسطس",
        "diff": -0.9
      }
    ],
    "latest_checkin": {
      "week": 6,
      "weight_change": -0.9,
      "waist_change": -1,
      "workouts_completed": 3,
      "workouts_target": 3,
      "daily_steps": 9200,
      "energy": 8.5,
      "sleep": 7.5,
      "hunger": 4,
      "recovery": 8,
      "stress": 4,
      "digestion": "اختفاء تام للانتفاخات بعد حمية الجلوتين",
      "client_notes": "مقاسات الملابس نزلت مقاسين كاملين، ووجع الكتف اختفى بنسبة 80% مع تمرين الفلور بريس واستخدام الدمبلز المحايدة.",
      "ai_recommendation": "معدل خسارة دهون ممتاز وثابت (-6.6 كجم). حساسية الإنسولين في أعلى مستوياتها. الاستمرار على عجز السعرات 1,600 kcal.",
      "status_badge": "بطلة تحول والتزام عالي"
    }
  },
  {
    "client_code": "3",
    "full_name": "هدى إبراهيم الشناوي",
    "phone_number": "01033333303",
    "age": 62,
    "gender": "FEMALE",
    "height_cm": 165,
    "weight_kg": 82.2,
    "start_weight": 85,
    "primary_goal": "recomp",
    "goal_label": "إعادة تشكيل ودعم المفاصل",
    "package_code": "REHAB_CLINICAL_3M",
    "package_name": "باقة التأهيل العيادي (3 شهور)",
    "package_tier": "max",
    "subscription_price": 3000,
    "payment_method": "INSTAPAY",
    "days_elapsed": 86,
    "total_days": 90,
    "checkin_frequency_days": 7,
    "adherence_pattern": "EXPIRING_REHAB",
    "status": "EXPIRING_SOON",
    "persona_story": "مشتركة منذ 3 شهور تقريباً (متبقي 4 أيام فقط على انتهاء الباقة!)، تحسن حركة الركبة بدون ألم والنزول من 85 كجم إلى 82.2 كجم، مطلوب مراسلتها للتجديد.",
    "history_weeks": [
      {
        "week": 0,
        "weight": 85,
        "waist": 94,
        "adherence": 100,
        "date": "5 يونيو",
        "diff": 0
      },
      {
        "week": 4,
        "weight": 83.8,
        "waist": 92.5,
        "adherence": 90,
        "date": "3 يوليو",
        "diff": -1.2
      },
      {
        "week": 8,
        "weight": 82.8,
        "waist": 91.5,
        "adherence": 92,
        "date": "31 يوليو",
        "diff": -1
      },
      {
        "week": 12,
        "weight": 82.2,
        "waist": 90.5,
        "adherence": 94,
        "date": "28 أغسطس",
        "diff": -0.6
      }
    ],
    "latest_checkin": {
      "week": 12,
      "weight_change": -0.6,
      "waist_change": -1,
      "workouts_completed": 3,
      "workouts_target": 3,
      "daily_steps": 6500,
      "energy": 8,
      "sleep": 7,
      "hunger": 3,
      "recovery": 8.5,
      "stress": 2,
      "digestion": "مريح وممتاز مع قلة الصوديوم",
      "client_notes": "الركبة بقت مرنة جداً وبطلع السلم بدون طقطقة، وضغط الدم 120/80 مستقر. حابة أجدد الاشتراك وأكمل للمرحلة المتقدمة.",
      "ai_recommendation": "تحقيق أهداف المرحلة الأولى بنجاح. باقة الاشتراك تنتهي بعد 4 أيام؛ يوصى بإرسال رسالة التجديد واقتراح ترقية لـ 6 شهور.",
      "status_badge": "اشتراك وشيك الانتهاء (تجديد)"
    }
  },
  {
    "client_code": "4",
    "full_name": "عمر طارق الشريف",
    "phone_number": "01044444404",
    "age": 30,
    "gender": "MALE",
    "height_cm": 180,
    "weight_kg": 103.5,
    "start_weight": 110,
    "primary_goal": "fat_loss",
    "goal_label": "خسارة دهون بعد التكميم",
    "package_code": "MAX_3_PLUS_1",
    "package_name": "باقة ماكس (VIP 4 شهور)",
    "package_tier": "max",
    "subscription_price": 3500,
    "payment_method": "INSTAPAY",
    "days_elapsed": 30,
    "total_days": 120,
    "checkin_frequency_days": 7,
    "adherence_pattern": "SLEEVE_POST_OP",
    "status": "ACTIVE",
    "persona_story": "مشترك بعد 6 أشهر من التكميم، خلال أول شهر نزل من 110 كجم إلى 103.5 كجم (-6.5 كجم)، حظر كامل للبقوليات لحماية G6PD وفصل السوائل عن الوجبات.",
    "history_weeks": [
      {
        "week": 0,
        "weight": 110,
        "waist": 112,
        "adherence": 100,
        "date": "1 أغسطس",
        "diff": 0
      },
      {
        "week": 1,
        "weight": 108.2,
        "waist": 110,
        "adherence": 90,
        "date": "8 أغسطس",
        "diff": -1.8
      },
      {
        "week": 2,
        "weight": 106.5,
        "waist": 108.5,
        "adherence": 88,
        "date": "15 أغسطس",
        "diff": -1.7
      },
      {
        "week": 3,
        "weight": 104.9,
        "waist": 107,
        "adherence": 92,
        "date": "22 أغسطس",
        "diff": -1.6
      },
      {
        "week": 4,
        "weight": 103.5,
        "waist": 105.5,
        "adherence": 95,
        "date": "29 أغسطس",
        "diff": -1.4
      }
    ],
    "latest_checkin": {
      "week": 4,
      "weight_change": -1.4,
      "waist_change": -1.5,
      "workouts_completed": 4,
      "workouts_target": 4,
      "daily_steps": 8500,
      "energy": 7.5,
      "sleep": 8,
      "hunger": 3,
      "recovery": 8,
      "stress": 3,
      "digestion": "ممتاز بعد تنظيم مواعيد شرب الماء",
      "client_notes": "التزمت بالبروتين 140 جم وفصل المياه نص ساعة قبل وبعد الأكل ساعدني جداً في الهضم ومنع الغثيان.",
      "ai_recommendation": "نزول متسارع متوافق مع مرحلة ما بعد التكميم. الحفاظ على ترطيب الجسم والأملاح المعدنية. استمرار الخطة.",
      "status_badge": "نزول دهون سريع ومحكوم"
    }
  },
  {
    "client_code": "5",
    "full_name": "خالد مصطفى النجار",
    "phone_number": "01055555505",
    "age": 55,
    "gender": "MALE",
    "height_cm": 175,
    "weight_kg": 93,
    "start_weight": 95,
    "primary_goal": "recomp",
    "goal_label": "خسارة دهون وتأهيل الظهر",
    "package_code": "VIP_PRO_6M",
    "package_name": "باقة VIP الاحترافية (6 شهور)",
    "package_tier": "max",
    "subscription_price": 6000,
    "payment_method": "BANK_TRANSFER",
    "days_elapsed": 70,
    "total_days": 180,
    "checkin_frequency_days": 7,
    "adherence_pattern": "FLUCTUATING_PLATEAU",
    "status": "ACTIVE",
    "persona_story": "مشترك منذ شهرين ونصف، مستواه متذبذب بسبب كثرة رحلات العمل (التزام بين 65% و 90%)، حدث ثبات في الوزن عند 93 كجم لأسبوعين متتاليين.",
    "history_weeks": [
      {
        "week": 0,
        "weight": 95,
        "waist": 104,
        "adherence": 100,
        "date": "20 يونيو",
        "diff": 0
      },
      {
        "week": 2,
        "weight": 94.2,
        "waist": 103,
        "adherence": 85,
        "date": "4 يوليو",
        "diff": -0.8
      },
      {
        "week": 4,
        "weight": 93.5,
        "waist": 102,
        "adherence": 70,
        "date": "18 يوليو",
        "diff": -0.7
      },
      {
        "week": 6,
        "weight": 93,
        "waist": 101.5,
        "adherence": 90,
        "date": "1 أغسطس",
        "diff": -0.5
      },
      {
        "week": 8,
        "weight": 93.1,
        "waist": 101.5,
        "adherence": 65,
        "date": "15 أغسطس",
        "diff": 0.1
      },
      {
        "week": 10,
        "weight": 93,
        "waist": 101.5,
        "adherence": 80,
        "date": "29 أغسطس",
        "diff": -0.1
      }
    ],
    "latest_checkin": {
      "week": 10,
      "weight_change": -0.1,
      "waist_change": 0,
      "workouts_completed": 2,
      "workouts_target": 3,
      "daily_steps": 5400,
      "energy": 6,
      "sleep": 5.5,
      "hunger": 7,
      "recovery": 6.5,
      "stress": 8,
      "digestion": "مقبول",
      "client_notes": "كان عندي سفر شغل الأسبوع ده وفوت تمرين ومكنتش قادر أعد الخطوات، بس محافظ على أدوية السيولة وضبط الكارب ومفيش أي ألم في أسفل الظهر.",
      "ai_recommendation": "كشف ثبات وزن أيضي (Plateau). ينصح بتطبيق إعادة تدوير سعرات (Calorie Cycling) مع يوم إعادة تغذية Refeed، وتثبيت المشي 7,500 خطوة.",
      "status_badge": "ثبات وزن يحتاج تعديل كوتش"
    }
  },
  {
    "client_code": "6",
    "full_name": "سارة كمال المهدي",
    "phone_number": "01066666606",
    "age": 22,
    "gender": "FEMALE",
    "height_cm": 162,
    "weight_kg": 50.8,
    "start_weight": 50,
    "primary_goal": "lean_bulk",
    "goal_label": "زيادة وزن وبناء عضلي",
    "package_code": "ELITE_3_PLUS_1",
    "package_name": "باقة إيليت (4 شهور)",
    "package_tier": "elite",
    "subscription_price": 2500,
    "payment_method": "VODAFONE_CASH",
    "days_elapsed": 14,
    "total_days": 120,
    "checkin_frequency_days": 7,
    "adherence_pattern": "NEW_CLIENT_START",
    "status": "ACTIVE",
    "persona_story": "مشتركة جديدة (أسبوعين فقط)، زيادة هادئة وناجحة من 50.0 إلى 50.8 كجم (+800 جم)، مرتاحة جداً مع حمية Low-FODMAP للقولون العصبي.",
    "history_weeks": [
      {
        "week": 0,
        "weight": 50,
        "waist": 64,
        "adherence": 100,
        "date": "15 أغسطس",
        "diff": 0
      },
      {
        "week": 1,
        "weight": 50.4,
        "waist": 64.2,
        "adherence": 92,
        "date": "22 أغسطس",
        "diff": 0.4
      },
      {
        "week": 2,
        "weight": 50.8,
        "waist": 64.4,
        "adherence": 95,
        "date": "29 أغسطس",
        "diff": 0.4
      }
    ],
    "latest_checkin": {
      "week": 2,
      "weight_change": 0.4,
      "waist_change": 0.2,
      "workouts_completed": 4,
      "workouts_target": 4,
      "daily_steps": 7800,
      "energy": 8.5,
      "sleep": 8,
      "hunger": 6,
      "recovery": 8.5,
      "stress": 3,
      "digestion": "ممتاز وهادئ جداً",
      "client_notes": "شهيتي اتحسنت جداً، والتمارين المنزلية بالأحزمة مريحة على الركبة ومفيش أي وجع في وتر الصابونة.",
      "ai_recommendation": "بداية استجابة إيجابية (+400 جم أسبوعياً). الاستمرار على بروتوكول الزيادة الحالي 1,950 kcal.",
      "status_badge": "بداية ممتازة لمشتركة جديدة"
    }
  },
  {
    "client_code": "7",
    "full_name": "محمود عبد العظيم حسان",
    "phone_number": "01077777707",
    "age": 65,
    "gender": "MALE",
    "height_cm": 170,
    "weight_kg": 101.5,
    "start_weight": 105,
    "primary_goal": "fat_loss",
    "goal_label": "خسارة دهون مع حماية الكلى",
    "package_code": "REHAB_CLINICAL_3M",
    "package_name": "باقة الرعاية الطبية الفائقة (3 شهور)",
    "package_tier": "max",
    "subscription_price": 3200,
    "payment_method": "INSTAPAY",
    "days_elapsed": 45,
    "total_days": 90,
    "checkin_frequency_days": 7,
    "adherence_pattern": "CLINICAL_SAFETY_STRICT",
    "status": "ACTIVE",
    "persona_story": "مشترك منذ شهر ونصف (6 أسابيع)، التزام صارم بسقف البروتين 75 جم، نزول من 105 كجم إلى 101.5 كجم، استقرار تحاليل الكلى وضغط الدم.",
    "history_weeks": [
      {
        "week": 0,
        "weight": 105,
        "waist": 115,
        "adherence": 100,
        "date": "15 يوليو",
        "diff": 0
      },
      {
        "week": 2,
        "weight": 103.8,
        "waist": 114,
        "adherence": 98,
        "date": "29 يوليو",
        "diff": -1.2
      },
      {
        "week": 4,
        "weight": 102.6,
        "waist": 112.5,
        "adherence": 96,
        "date": "12 أغسطس",
        "diff": -1.2
      },
      {
        "week": 6,
        "weight": 101.5,
        "waist": 111,
        "adherence": 97,
        "date": "26 أغسطس",
        "diff": -1.1
      }
    ],
    "latest_checkin": {
      "week": 6,
      "weight_change": -0.6,
      "waist_change": -0.8,
      "workouts_completed": 3,
      "workouts_target": 3,
      "daily_steps": 6200,
      "energy": 8,
      "sleep": 7.5,
      "hunger": 3,
      "recovery": 8.5,
      "stress": 2,
      "digestion": "طبيعي ومريح",
      "client_notes": "تحليل وظائف الكلى الأخير كان مستقر جداً، ومقاس الخصر نزل 4 سم بدون أي إجهاد على المفاصل أو القلب.",
      "ai_recommendation": "التزام سريري استثنائي. حماية الكلى بنسبة 100%. الاستمرار على نفس السعرات والماكروز المقيدة.",
      "status_badge": "حالة طبية مستقرة بامتياز"
    }
  },
  {
    "client_code": "8",
    "full_name": "نادية حسن الدسوقي",
    "phone_number": "01088888808",
    "age": 50,
    "gender": "FEMALE",
    "height_cm": 158,
    "weight_kg": 85.8,
    "start_weight": 88,
    "primary_goal": "fat_loss",
    "goal_label": "خسارة دهون مع كسل الغدة",
    "package_code": "LIFESTYLE_TRANSFORMATION_3M",
    "package_name": "باقة تحول نمط الحياة (3 شهور)",
    "package_tier": "elite",
    "subscription_price": 2800,
    "payment_method": "VODAFONE_CASH",
    "days_elapsed": 81,
    "total_days": 90,
    "checkin_frequency_days": 14,
    "adherence_pattern": "HYPOTHYROID_SLOW_BURN",
    "status": "EXPIRING_SOON",
    "persona_story": "مشتركة منذ شهرين ونصف (متبقي 9 أيام على التجديد)، نزول دهون بطيء ومنضبط (-2.2 كجم) بسبب بطء نشاط الغدة الدرقية، تحسن كبير في طاقة الجسم.",
    "history_weeks": [
      {
        "week": 0,
        "weight": 88,
        "waist": 96,
        "adherence": 100,
        "date": "9 يونيو",
        "diff": 0
      },
      {
        "week": 3,
        "weight": 87.3,
        "waist": 95,
        "adherence": 88,
        "date": "30 يونيو",
        "diff": -0.7
      },
      {
        "week": 6,
        "weight": 86.6,
        "waist": 94,
        "adherence": 85,
        "date": "21 يوليو",
        "diff": -0.7
      },
      {
        "week": 9,
        "weight": 86,
        "waist": 93,
        "adherence": 90,
        "date": "11 أغسطس",
        "diff": -0.6
      },
      {
        "week": 11,
        "weight": 85.8,
        "waist": 92.5,
        "adherence": 92,
        "date": "25 أغسطس",
        "diff": -0.2
      }
    ],
    "latest_checkin": {
      "week": 11,
      "weight_change": -0.2,
      "waist_change": -0.5,
      "workouts_completed": 3,
      "workouts_target": 3,
      "daily_steps": 7500,
      "energy": 7.5,
      "sleep": 8,
      "hunger": 4,
      "recovery": 7.5,
      "stress": 4,
      "digestion": "متحسن بعد تناول أدوية الجرثومة والغدة بانتظام",
      "client_notes": "الخمول الصباحي قل جداً وبصحى بنشاط، وباقي 9 أيام على اشتراكي وعايزة أجدد وأكمل.",
      "ai_recommendation": "اشتراك يقترب من الانتهاء (9 أيام). استجابة طيبة رغم بطء الغدة. يوصى بتجهيز عرض التجديد السنوي.",
      "status_badge": "تجديد اشتراك وشيك"
    }
  },
  {
    "client_code": "9",
    "full_name": "ياسر سامي القاضي",
    "phone_number": "01099999909",
    "age": 40,
    "gender": "MALE",
    "height_cm": 182,
    "weight_kg": 78.8,
    "start_weight": 75,
    "primary_goal": "lean_bulk",
    "goal_label": "بناء عضلي متقدم",
    "package_code": "MAX_YEARLY_VIP",
    "package_name": "باقة VIP السنوية الكاملة (12 شهر)",
    "package_tier": "max",
    "subscription_price": 9500,
    "payment_method": "INSTAPAY",
    "days_elapsed": 120,
    "total_days": 365,
    "checkin_frequency_days": 7,
    "adherence_pattern": "TRANSFORMATION_CHAMPION",
    "status": "ACTIVE",
    "persona_story": "مشترك سنوي VIP منذ 4 أشهر (16 أسبوعاً)، بطل ملتزم بنسبة 98%، زيادة عضلية خارقة من 75.0 كجم إلى 78.8 كجم (+3.8 كجم صافي)، تروية 4.0 لتر ماء تحمي الكلى.",
    "history_weeks": [
      {
        "week": 0,
        "weight": 75,
        "waist": 80,
        "adherence": 100,
        "date": "1 مايو",
        "diff": 0
      },
      {
        "week": 4,
        "weight": 76,
        "waist": 80.2,
        "adherence": 98,
        "date": "29 مايو",
        "diff": 1
      },
      {
        "week": 8,
        "weight": 77.1,
        "waist": 80.5,
        "adherence": 96,
        "date": "26 يونيو",
        "diff": 1.1
      },
      {
        "week": 12,
        "weight": 78,
        "waist": 80.8,
        "adherence": 98,
        "date": "24 يوليو",
        "diff": 0.9
      },
      {
        "week": 16,
        "weight": 78.8,
        "waist": 81,
        "adherence": 97,
        "date": "21 أغسطس",
        "diff": 0.8
      }
    ],
    "latest_checkin": {
      "week": 16,
      "weight_change": 0.3,
      "waist_change": 0,
      "workouts_completed": 4,
      "workouts_target": 4,
      "daily_steps": 11000,
      "energy": 9.5,
      "sleep": 8.5,
      "hunger": 8,
      "recovery": 9.5,
      "stress": 2,
      "digestion": "مثالي",
      "client_notes": "الأوزان في الهاك سكوات وصلت 140 كجم والتطور العضلي واضح جداً في عضلات الظهر والأكتاف بدون أي ألم في الكلى.",
      "ai_recommendation": "نموذج للتطور العضلي الاحترافي. زيادة عضلية نقية وثبات نسبة الدهون. الاستمرار على 2,800 kcal.",
      "status_badge": "بطل التزام سنوي VIP"
    }
  },
  {
    "client_code": "10",
    "full_name": "ريم حازم التلمساني",
    "phone_number": "01010101010",
    "age": 28,
    "gender": "FEMALE",
    "height_cm": 165,
    "weight_kg": 73.5,
    "start_weight": 78,
    "primary_goal": "fat_loss",
    "goal_label": "خسارة دهون وحماية العضلات",
    "package_code": "MAX_3_PLUS_1",
    "package_name": "باقة ماكس (VIP 4 شهور)",
    "package_tier": "max",
    "subscription_price": 3500,
    "payment_method": "INSTAPAY",
    "days_elapsed": 35,
    "total_days": 120,
    "checkin_frequency_days": 7,
    "adherence_pattern": "GLP1_RAPID_DROP",
    "status": "ACTIVE",
    "persona_story": "مشتركة منذ 5 أسابيع، تأثير الأوزمبيك فعال مع نزول سريع من 78 كجم إلى 73.5 كجم (-4.5 كجم)، حماية الكتلة العضلية بـ 130 جم بروتين إلزامي.",
    "history_weeks": [
      {
        "week": 0,
        "weight": 78,
        "waist": 86,
        "adherence": 100,
        "date": "25 يوليو",
        "diff": 0
      },
      {
        "week": 2,
        "weight": 76,
        "waist": 84,
        "adherence": 94,
        "date": "8 أغسطس",
        "diff": -2
      },
      {
        "week": 4,
        "weight": 74.2,
        "waist": 82.5,
        "adherence": 92,
        "date": "22 أغسطس",
        "diff": -1.8
      },
      {
        "week": 5,
        "weight": 73.5,
        "waist": 81.5,
        "adherence": 95,
        "date": "29 أغسطس",
        "diff": -0.7
      }
    ],
    "latest_checkin": {
      "week": 5,
      "weight_change": -0.7,
      "waist_change": -1,
      "workouts_completed": 3,
      "workouts_target": 3,
      "daily_steps": 8500,
      "energy": 7.5,
      "sleep": 7.5,
      "hunger": 2,
      "recovery": 8,
      "stress": 4,
      "digestion": "شبع سريع ومريح",
      "client_notes": "الشهية قليلة جداً بس حريصة أخلص حصة البروتين كلها عشان شعري ومفاصل الظهر ميتأثروش.",
      "ai_recommendation": "نزول ممتاز ومحمي من الهدم العضلي. التأكيد على السوائل وأملاح الإلكترولايت.",
      "status_badge": "حماية عضلية ممتازة مع GLP-1"
    }
  },
  {
    "client_code": "11",
    "full_name": "حسام الدين البغدادي",
    "phone_number": "01011122211",
    "age": 48,
    "gender": "MALE",
    "height_cm": 177,
    "weight_kg": 84.2,
    "start_weight": 82,
    "primary_goal": "lean_bulk",
    "goal_label": "بناء عضلي صافي (خالي من الجلوتين)",
    "package_code": "ELITE_3_PLUS_1",
    "package_name": "باقة إيليت (4 شهور)",
    "package_tier": "elite",
    "subscription_price": 2500,
    "payment_method": "INSTAPAY",
    "days_elapsed": 60,
    "total_days": 120,
    "checkin_frequency_days": 14,
    "adherence_pattern": "STEADY_LEAN_GAIN",
    "status": "ACTIVE",
    "persona_story": "مشترك منذ شهرين (4 تشيك إن نصف شهرية)، زيادة من 82 إلى 84.2 كجم بدون أي انتفاخات أو أعراض حساسية قمح، ضغط الدم منضبط.",
    "history_weeks": [
      {
        "week": 0,
        "weight": 82,
        "waist": 85,
        "adherence": 100,
        "date": "1 يوليو",
        "diff": 0
      },
      {
        "week": 2,
        "weight": 82.6,
        "waist": 85.2,
        "adherence": 94,
        "date": "15 يوليو",
        "diff": 0.6
      },
      {
        "week": 4,
        "weight": 83.2,
        "waist": 85.3,
        "adherence": 92,
        "date": "29 يوليو",
        "diff": 0.6
      },
      {
        "week": 6,
        "weight": 83.7,
        "waist": 85.5,
        "adherence": 95,
        "date": "12 أغسطس",
        "diff": 0.5
      },
      {
        "week": 8,
        "weight": 84.2,
        "waist": 85.6,
        "adherence": 96,
        "date": "26 أغسطس",
        "diff": 0.5
      }
    ],
    "latest_checkin": {
      "week": 4,
      "weight_change": 0.5,
      "waist_change": 0.1,
      "workouts_completed": 4,
      "workouts_target": 4,
      "daily_steps": 8500,
      "energy": 9,
      "sleep": 8,
      "hunger": 7,
      "recovery": 9,
      "stress": 3,
      "digestion": "ممتاز",
      "client_notes": "الأرز البسمتي والشوفان الخالي من الجلوتين مريحين جداً، وقوة السحب زادت في كل تمارين الظهر.",
      "ai_recommendation": "تضخيم نقي ممتاز (+2.2 كجم في شهرين). الاستمرار على 2,750 kcal.",
      "status_badge": "تطور مستقر وخالي جلوتين"
    }
  },
  {
    "client_code": "12",
    "full_name": "دينا شريف خورشيد",
    "phone_number": "01012121212",
    "age": 35,
    "gender": "FEMALE",
    "height_cm": 160,
    "weight_kg": 57.8,
    "start_weight": 60,
    "primary_goal": "fat_loss",
    "goal_label": "تنشيف وتنسيق قوام",
    "package_code": "MAX_1M_TRIAL",
    "package_name": "باقة التجربة السريعة (شهر واحد)",
    "package_tier": "max",
    "subscription_price": 1200,
    "payment_method": "VODAFONE_CASH",
    "days_elapsed": 27,
    "total_days": 30,
    "checkin_frequency_days": 7,
    "adherence_pattern": "TRIAL_EXPIRING",
    "status": "EXPIRING_SOON",
    "persona_story": "مشتركة باقة تجريبية لشهر واحد (متبقي 3 أيام فقط على الانتهاء!)، نزلت من 60 كجم إلى 57.8 كجم (-2.2 كجم)، جاهزة للترقية لباقة 4 شهور.",
    "history_weeks": [
      {
        "week": 0,
        "weight": 60,
        "waist": 72,
        "adherence": 100,
        "date": "2 أغسطس",
        "diff": 0
      },
      {
        "week": 1,
        "weight": 59.2,
        "waist": 71,
        "adherence": 96,
        "date": "9 أغسطس",
        "diff": -0.8
      },
      {
        "week": 2,
        "weight": 58.5,
        "waist": 70,
        "adherence": 92,
        "date": "16 أغسطس",
        "diff": -0.7
      },
      {
        "week": 3,
        "weight": 57.8,
        "waist": 69.2,
        "adherence": 95,
        "date": "23 أغسطس",
        "diff": -0.7
      }
    ],
    "latest_checkin": {
      "week": 3,
      "weight_change": -0.7,
      "waist_change": -0.8,
      "workouts_completed": 3,
      "workouts_target": 3,
      "daily_steps": 7200,
      "energy": 8,
      "sleep": 7.5,
      "hunger": 4,
      "recovery": 8.5,
      "stress": 2,
      "digestion": "ممتاز",
      "client_notes": "التجربة كانت رائعة وفرقت معايا جداً في شكل بطني وخصري، وحابة أجدد على باقة 4 شهور ماكس.",
      "ai_recommendation": "الباقة تنتهي خلال 3 أيام. تم إعداد رسالة ترقية باقة ماكس بخصم التجديد الفوري.",
      "status_badge": "تجديد باقة تجريبية وشيك (3 أيام)"
    }
  },
  {
    "client_code": "13",
    "full_name": "يوسف أيمن رضوان",
    "phone_number": "01013131313",
    "age": 20,
    "gender": "MALE",
    "height_cm": 175,
    "weight_kg": 84.4,
    "start_weight": 85,
    "primary_goal": "recomp",
    "goal_label": "إعادة تشكيل وبناء قوة",
    "package_code": "MAX_3_PLUS_1",
    "package_name": "باقة ماكس (VIP 4 شهور)",
    "package_tier": "max",
    "subscription_price": 3500,
    "payment_method": "INSTAPAY",
    "days_elapsed": 21,
    "total_days": 120,
    "checkin_frequency_days": 7,
    "adherence_pattern": "YOUNG_RECOMP_START",
    "status": "ACTIVE",
    "persona_story": "مشترك منذ 3 أسابيع، إعادة تشكيل وقوة بدنية، استشفاء وتر الصابونة بالتمارين الثباتية (Wall Sits)، التزام بالأنسولين والأكل.",
    "history_weeks": [
      {
        "week": 0,
        "weight": 85,
        "waist": 88,
        "adherence": 100,
        "date": "8 أغسطس",
        "diff": 0
      },
      {
        "week": 1,
        "weight": 84.8,
        "waist": 87.5,
        "adherence": 94,
        "date": "15 أغسطس",
        "diff": -0.2
      },
      {
        "week": 2,
        "weight": 84.6,
        "waist": 87,
        "adherence": 96,
        "date": "22 أغسطس",
        "diff": -0.2
      },
      {
        "week": 3,
        "weight": 84.4,
        "waist": 86.5,
        "adherence": 98,
        "date": "29 أغسطس",
        "diff": -0.2
      }
    ],
    "latest_checkin": {
      "week": 3,
      "weight_change": -0.2,
      "waist_change": -0.5,
      "workouts_completed": 4,
      "workouts_target": 4,
      "daily_steps": 9500,
      "energy": 9,
      "sleep": 8.5,
      "hunger": 6,
      "recovery": 9,
      "stress": 2,
      "digestion": "مستقر وممتاز بدون مسكنات",
      "client_notes": "الركبة ارتاحت جداً مع تمارين التثبيت، والتحكم في سكر الدم قبل التمرين مخليني بأعلى تركيز.",
      "ai_recommendation": "إعادة تشكيل ناجحة (نزول دهون وزيادة عضلية متزامنة). الاستمرار على 2,350 kcal.",
      "status_badge": "إعادة تشكيل وقوة متصاعدة"
    }
  },
  {
    "client_code": "14",
    "full_name": "زينب فؤاد الغمري",
    "phone_number": "01014141414",
    "age": 58,
    "gender": "FEMALE",
    "height_cm": 164,
    "weight_kg": 86.6,
    "start_weight": 90,
    "primary_goal": "fat_loss",
    "goal_label": "خسارة دهون وصحة المفاصل",
    "package_code": "REHAB_CLINICAL_3M",
    "package_name": "باقة التأهيل العيادي (3 شهور)",
    "package_tier": "max",
    "subscription_price": 3000,
    "payment_method": "VODAFONE_CASH",
    "days_elapsed": 84,
    "total_days": 90,
    "checkin_frequency_days": 7,
    "adherence_pattern": "REHAB_EXPIRING_SOON",
    "status": "EXPIRING_SOON",
    "persona_story": "مشتركة منذ 12 أسبوعاً (متبقي 6 أيام على الانتهاء)، نزول من 90.0 كجم إلى 86.6 كجم (-3.4 كجم)، استقرار سيولة الدم وتحسن وتر الكتف.",
    "history_weeks": [
      {
        "week": 0,
        "weight": 90,
        "waist": 98,
        "adherence": 100,
        "date": "7 يونيو",
        "diff": 0
      },
      {
        "week": 4,
        "weight": 88.8,
        "waist": 96.5,
        "adherence": 92,
        "date": "5 يوليو",
        "diff": -1.2
      },
      {
        "week": 8,
        "weight": 87.6,
        "waist": 95,
        "adherence": 90,
        "date": "2 أغسطس",
        "diff": -1.2
      },
      {
        "week": 12,
        "weight": 86.6,
        "waist": 93.5,
        "adherence": 94,
        "date": "28 أغسطس",
        "diff": -1
      }
    ],
    "latest_checkin": {
      "week": 12,
      "weight_change": -0.3,
      "waist_change": -0.5,
      "workouts_completed": 3,
      "workouts_target": 3,
      "daily_steps": 6800,
      "energy": 8,
      "sleep": 7.5,
      "hunger": 3,
      "recovery": 8,
      "stress": 3,
      "digestion": "ممتاز",
      "client_notes": "كتفي بقى يتحرك براحة تامة في كل الاتجاهات، والتحاليل منتظمة جداً. متبقي أسبوع وعايزة أجدد الباقة.",
      "ai_recommendation": "الباقة تنتهي خلال 6 أيام. تم تحقيق كافة الأهداف التأهيلية. جاهزة للتجديد.",
      "status_badge": "تجديد اشتراك وشيك (6 أيام)"
    }
  },
  {
    "client_code": "15",
    "full_name": "عبد الله توفيق الصياد",
    "phone_number": "01015151515",
    "age": 60,
    "gender": "MALE",
    "height_cm": 170,
    "weight_kg": 73.2,
    "start_weight": 72,
    "primary_goal": "lean_bulk",
    "goal_label": "بناء عضلي مع حظر البروتين العالي",
    "package_code": "MAX_3_PLUS_1",
    "package_name": "باقة ماكس للرعاية الخاصة (4 شهور)",
    "package_tier": "max",
    "subscription_price": 3500,
    "payment_method": "INSTAPAY",
    "days_elapsed": 50,
    "total_days": 120,
    "checkin_frequency_days": 7,
    "adherence_pattern": "CKD_SENIOR_LEAN_GAIN",
    "status": "ACTIVE",
    "persona_story": "مشترك منذ شهر ونصف (7 أسابيع)، بناء عضلي مدروس لكبار السن مع حظر البروتين فوق 60 جم، زيادة من 72 إلى 73.2 كجم مع حماية العظام والكلى.",
    "history_weeks": [
      {
        "week": 0,
        "weight": 72,
        "waist": 82,
        "adherence": 100,
        "date": "10 يوليو",
        "diff": 0
      },
      {
        "week": 2,
        "weight": 72.4,
        "waist": 82,
        "adherence": 98,
        "date": "24 يوليو",
        "diff": 0.4
      },
      {
        "week": 4,
        "weight": 72.8,
        "waist": 82.2,
        "adherence": 96,
        "date": "7 أغسطس",
        "diff": 0.4
      },
      {
        "week": 6,
        "weight": 73.1,
        "waist": 82.3,
        "adherence": 97,
        "date": "21 أغسطس",
        "diff": 0.3
      },
      {
        "week": 7,
        "weight": 73.2,
        "waist": 82.3,
        "adherence": 98,
        "date": "28 أغسطس",
        "diff": 0.1
      }
    ],
    "latest_checkin": {
      "week": 7,
      "weight_change": 0.1,
      "waist_change": 0,
      "workouts_completed": 3,
      "workouts_target": 3,
      "daily_steps": 7600,
      "energy": 8.5,
      "sleep": 8,
      "hunger": 6,
      "recovery": 9,
      "stress": 2,
      "digestion": "مريح وممتاز مع الكارب العالي",
      "client_notes": "قوة العضلات زادت في أجهزة دفع الأرجل والصدر، ووظائف الكلى ونسبة الكرياتينين واليوريا مثالية في التحليل.",
      "ai_recommendation": "بروتوكول عالي الأمان والفاعلية. استقرار تام لكافة المؤشرات الحيوية. استمرار على 2,250 kcal.",
      "status_badge": "حالة كلى وعظام آمنة ومستقرة"
    }
  }
];

async function runDeepSimulationSeeding() {
  try {
    await sequelize.authenticate();
    console.log("Connected to database for Deep Simulation Matrix...");

    // 1. Clean checkins
    await CheckinSubmission.destroy({ where: {}, truncate: false });

    // 2. Update each user and insert realistic checkins
    for (const sc of SIMULATED_CLIENTS) {
      const user = await User.findOne({ where: { client_code: sc.client_code } });
      if (user) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - sc.days_elapsed);

        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + sc.total_days);

        await user.update({
          subscription_package: sc.package_code,
          subscription_price: sc.subscription_price,
          subscription_start_date: startDate,
          subscription_end_date: endDate,
          payment_method: sc.payment_method,
          payment_status: 'PAID',
          subscription_status: sc.status === 'EXPIRING_SOON' ? 'ACTIVE' : sc.status
        });

        // Insert weekly check-ins history
        for (let i = 1; i < sc.history_weeks.length; i++) {
          const hw = sc.history_weeks[i];
          const isLatest = i === sc.history_weeks.length - 1;

          await CheckinSubmission.create({
            user_id: user.id,
            week_number: hw.week,
            daily_weights_kg: [hw.weight],
            average_weight_kg: hw.weight,
            weight_change_kg: hw.diff,
            waist_circumference_cm: hw.waist,
            nutrition_adherence_percent: hw.adherence,
            workouts_completed: isLatest ? sc.latest_checkin.workouts_completed : 4,
            workouts_scheduled: isLatest ? sc.latest_checkin.workouts_target : 4,
            biofeedback: {
              energy_level: isLatest ? sc.latest_checkin.energy : 8,
              sleep_hours: isLatest ? sc.latest_checkin.sleep : 7.5,
              sleep_quality: isLatest ? sc.latest_checkin.sleep : 8,
              hunger_level: isLatest ? sc.latest_checkin.hunger : 4,
              recovery_score: isLatest ? sc.latest_checkin.recovery : 8,
              stress_level: isLatest ? sc.latest_checkin.stress : 3,
              digestion_quality: isLatest ? sc.latest_checkin.digestion : 'جيد ومستقر'
            },
            pain_reports: [],
            analysis_status: isLatest ? (sc.adherence_pattern === 'FLUCTUATING_PLATEAU' ? 'PLATEAU_DETECTED' : 'ON_TRACK') : 'ON_TRACK',
            analysis_output: {
              recommendation: isLatest ? sc.latest_checkin.ai_recommendation : 'استمرار على نفس الخطة',
              status_badge: isLatest ? sc.latest_checkin.status_badge : 'تقدم مستمر',
              weight_change_kg: hw.diff
            },
            coach_notes: isLatest ? sc.latest_checkin.client_notes : 'مراجعة أسبوعية معتمدة',
            status: isLatest && (sc.adherence_pattern === 'FLUCTUATING_PLATEAU' || sc.client_code === '10') ? 'PENDING_REVIEW' : 'APPROVED'
          });
        }
        console.log("Seeded User #" + sc.client_code + " (" + sc.full_name + ") with " + (sc.history_weeks.length - 1) + " check-ins.");
      }
    }

    console.log("\n--- DEEP SIMULATION MATRIX SEEDED IN DB SUCCESSFULLY ---");
    process.exit(0);
  } catch (err) {
    console.error("Deep simulation seeding error:", err);
    process.exit(1);
  }
}

runDeepSimulationSeeding();
