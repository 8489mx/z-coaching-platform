import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getArabicExerciseName } from "../utils/exerciseTranslator";
import { API_BASE } from "../config/api";

const ARABIC_FOOD_NAMES = {
  COTTAGE_CHEESE_LOW_FAT_2_PERCENT: "جبن قريش قليل الدسم",
  EGG_WHOLE_HARD_BOILED: "بيض مسلوق كامل",
  WHOLE_EGG: "بيض مسلوق كامل",
  EGG_WHITE_COOKED: "بياض بيض مسلوق",
  EGG_WHITE: "بياض بيض مسلوق",
  OATS_ROLLED_DRY: "شوفان كامل الحبة",
  BANANA_RAW: "موز طازج",
  CHICKEN_BREAST_ROASTED_SKINLESS: "صدور دجاج مشوية",
  CHICKEN_BREAST: "صدور دجاج مشوية",
  POTATO_BOILED_WITHOUT_SKIN: "بطاطس مسلوقة",
  POTATO_BOILED: "بطاطس مسلوقة",
  RICE_WHITE_COOKED: "أرز أبيض مطبوخ",
  RICE_WHITE: "أرز أبيض مطبوخ",
  CARROT_RAW: "جزر طازج",
  CUCUMBER_WITH_PEEL_RAW: "خيار طازج",
  TOMATO_RED_RAW: "طماطم طازجة",
  OLIVE_OIL: "زيت زيتون",
  BREAD_WHOLE_WHEAT: "توست أسمر",
  TUNA_CANNED_IN_WATER: "تونة بالماء",
  SALMON_ATLANTIC_WILD_RAW: "سمك سلمون",
  BEEF_GROUND_95_5_RAW: "لحم بقري مفروم قليل الدسم",
  SWEET_POTATO_COOKED: "بطاطا حلوة مشوية",
  PASTA_WHOLE_WHEAT_COOKED: "مكرونة قمح كامل مسلوقة",
  AVOCADO_RAW: "أفوكادو طازج",
  GREEK_YOGURT_PLAIN_NONFAT: "زبادي يوناني خالي الدسم",
  ALMONDS_RAW: "لوز نيء",
  PEANUT_BUTTER_ALL_NATURAL: "زبدة فول سوداني",
  APPLE_RAW: "تفاح طازج",
  BERRIES_MIXED_RAW: "توت مشكل",
  SPINACH_RAW: "سبانخ طازجة",
  BROCCOLI_COOKED: "بروكلي مسلوق",
};

const DEFAULT_SUPPLEMENTS = [
  {
    id: "CREATINE",
    name_ar: "كرياتين مونوهايدرات (Creatine Monohydrate)",
    dosage: "5 جرام يومياً",
    timing: "بعد التمرين مباشرة مع الماء أو مصدر كاربوهيدرات (أو صباحاً بأيام الراحة)",
    purpose: "زيادة القوة البدنية، مخازن ATP، وتسريع البناء العضلي",
    instructions: "اشرب معه كمية كافية من الماء (3-4 لتر يومياً) ولا حاجة لمرحلة تحميل."
  },
  {
    id: "WHEY_PROTEIN",
    name_ar: "واي بروتين (Whey Protein)",
    dosage: "1 سكوب (30 جرام)",
    timing: "بعد التمرين مباشرة أو كوجبة خفيفة بين الوجبات الرئيسية",
    purpose: "تغطية الاحتياج اليومي من البروتين الصافي سريع الامتصاص",
    instructions: "يُمزج مع 250 مل ماء بارد أو حليب خالي الدسم."
  },
  {
    id: "OMEGA_3",
    name_ar: "أوميجا 3 عالي التركيز (Omega-3 Fish Oil)",
    dosage: "2 كبسولة (1000mg EPA/DHA)",
    timing: "مع وجبة الإفطار أو الغداء",
    purpose: "تقليل الالتهابات، صحة المفاصل، وصحة القلب والأوعية الدموية",
    instructions: "يُفضل تناوله مع وجبة تحتوي على دهون صحية لامتصاص مثالي."
  },
  {
    id: "VITAMIN_D3_K2",
    name_ar: "فيتامين D3 + K2",
    dosage: "5000 IU يومياً",
    timing: "صباحاً مع وجبة الإفطار",
    purpose: "دعم المناعة، مستويات التستوستيرون الطبيعية، وامتصاص الكالسيوم",
    instructions: "فيتامين يذوب في الدهون، لذا يؤخذ مع وجبة الإفطار."
  },
  {
    id: "MAGNESIUM_GLYCINATE",
    name_ar: "ماغنيسيوم جلايسينات (Magnesium)",
    dosage: "300 - 400 مجم",
    timing: "قبل النوم بـ 45 دقيقة",
    purpose: "تحسين جودة النوم العميق، استرخاء الجهاز العصبي، وتفادي التقلصات",
    instructions: "يساعد في تهدئة العضلات بعد التمارين الشديدة."
  }
];

function formatArabicFoodSingleLine(food) {
  if (food.serving_display_ar && food.serving_display_ar.includes("جرام") && !/^[0-9]+g$/.test(food.serving_display_ar)) {
    return food.serving_display_ar;
  }
  const code = food.food_code || "";
  let name = food.name_ar;
  if (!name || name === code || /^[a-zA-Z0-9_]+$/.test(name)) {
    name = ARABIC_FOOD_NAMES[code] || "صنف غذائي";
  }
  const grams = Math.round(food.portion_g_rounded || food.grams || food.portion_g || 100);

  if (code.includes("BANANA") || code.includes("APPLE")) {
    return `${name} (1 حبة متوسطة - ${grams} جرام)`;
  }
  if (code.includes("EGG_WHOLE") || code === "WHOLE_EGG") {
    const pieces = Math.round((grams / 50) * 2) / 2;
    return `${name} (${pieces} بيضة مسلوقة - ${grams} جرام)`;
  }
  if (code.includes("OLIVE_OIL")) {
    const spoons = Math.round((grams / 10) * 2) / 2;
    return `${name} (${spoons} ملعقة طعام - ${grams} جرام)`;
  }

  return `${name} (${grams} جرام)`;
}

export default function UserDashboardClone() {
  const searchParams = new URLSearchParams(window.location.search);
  const targetUserId = searchParams.get('user_id') || sessionStorage.getItem('z_active_client_code') || "CLIENT-AHMED-SAMIR";

  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
  const [completedExercises, setCompletedExercises] = useState({});

  // Smart Food Swap Modal State
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [activeMealIndex, setActiveMealIndex] = useState(null);
  const [activeFoodIndex, setActiveFoodIndex] = useState(null);
  const [selectedFoodItem, setSelectedFoodItem] = useState(null);
  const [swapCandidates, setSwapCandidates] = useState([]);
  const [swapLoading, setSwapLoading] = useState(false);

  // Check-in Modal State
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [checkinForm, setCheckinForm] = useState({
    weightDay1: 90.0,
    weightDay2: 89.8,
    weightDay3: 89.7,
    weightDay4: 89.5,
    weightDay5: 89.4,
    weightDay6: 89.3,
    weightDay7: 89.2,
    waistCm: 93.0,
    nutritionAdherence: 95,
    hungerLevel: 2,
    energyInGym: 4,
    painJoint: "NONE",
  });
  const [checkinResult, setCheckinResult] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);

  // Fetch Live Program from Database via REST API
  useEffect(() => {
    fetchLiveProgram();
  }, [window.location.search]);

  const fetchLiveProgram = async () => {
    try {
      setLoading(true);
      const searchParams = new URLSearchParams(window.location.search);
      const targetUserId = searchParams.get('user_id') || sessionStorage.getItem('z_active_client_code') || "CLIENT-AHMED-SAMIR";

      const res = await fetch(`${API_BASE}/api/v1/programs/active/${targetUserId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل تحميل البرنامج من قاعدة البيانات");

      setProgram(data.master_program);
      if (data.user) {
        setCurrentUser(data.user);
      }
    } catch (e) {
      console.error("fetchLiveProgram error:", e);
    } finally {
      setLoading(false);
    }
  };

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        setSwapModalOpen(false);
        setCheckinModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Open Smart Swap Modal
  const handleOpenSwapModal = async (mealIdx, foodIdx, foodItem, mealRole) => {
    try {
      setActiveMealIndex(mealIdx);
      setActiveFoodIndex(foodIdx);
      setSelectedFoodItem(foodItem);
      setSwapModalOpen(true);
      setSwapLoading(true);

      const sourceGrams = foodItem.portion_g_rounded || foodItem.grams || foodItem.portion_g || 100;
      const res = await fetch(`${API_BASE}/api/v1/programs/swap-candidates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          food_code: foodItem.food_code || foodItem.name_ar || "WHOLE_EGG",
          name_ar: foodItem.name_ar || "",
          meal_context: mealRole || (mealIdx === 0 ? "BREAKFAST" : "MAIN_MEAL"),
          source_grams: sourceGrams
        }),
      });

      const data = await res.json();
      setSwapCandidates(data.candidates || []);
    } catch (e) {
      console.error(e);
    } finally {
      setSwapLoading(false);
    }
  };

  // Execute Swap via API
  const handleExecuteSwap = async (targetFoodCode) => {
    try {
      setSwapLoading(true);
      const sourceGrams = selectedFoodItem.portion_g_rounded || selectedFoodItem.grams || selectedFoodItem.portion_g || 100;
      const foodCode = selectedFoodItem.food_code || (selectedFoodItem.name_ar?.includes("قريش") ? "CHEESE_COTTAGE_LOW_FAT" : (selectedFoodItem.name_ar?.includes("بيض") ? "WHOLE_EGG" : "CHICKEN_BREAST_COOKED"));

      const res = await fetch(`${API_BASE}/api/v1/programs/swap-food`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_food_code: foodCode,
          source_grams: sourceGrams,
          target_food_code: targetFoodCode,
          meal_context: activeMealIndex === 0 ? "BREAKFAST" : "MAIN_MEAL",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل التبديل");

      const updated = JSON.parse(JSON.stringify(program));
      if (updated.nutrition_program?.quantized_plan?.meals?.[activeMealIndex]) {
        const targetMeal = updated.nutrition_program.quantized_plan.meals[activeMealIndex];
        const foods = targetMeal.foods || targetMeal.items;

        foods[activeFoodIndex] = {
          ...foods[activeFoodIndex],
          food_code: data.swapped_food.food_code,
          name_ar: data.swapped_food.name_ar,
          name_en: data.swapped_food.name_en,
          portion_g_rounded: data.swapped_food.grams,
          grams: data.swapped_food.grams,
          serving_display_ar: data.swapped_food.serving_display_ar,
          serving_display_en: data.swapped_food.serving_display_en,
        };
      }

      setProgram(updated);
      setSwapModalOpen(false);

      // Persist to MariaDB z in background
      await fetch(`${API_BASE}/api/v1/programs/update-custom`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_code: targetUserId,
          master_program: updated
        })
      });
    } catch (e) {
      alert(e.message);
    } finally {
      setSwapLoading(false);
    }
  };

  // Submit Weekly Check-in
  const handleCheckinSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const searchParams = new URLSearchParams(window.location.search);
      const targetUserId = searchParams.get('user_id') || sessionStorage.getItem('z_active_client_code') || "CLIENT-AHMED-SAMIR";

      const payload = {
        client_code: targetUserId,
        week_number: 1,
        daily_weights_kg: [
          Number(checkinForm.weightDay1),
          Number(checkinForm.weightDay2),
          Number(checkinForm.weightDay3),
          Number(checkinForm.weightDay4),
          Number(checkinForm.weightDay5),
          Number(checkinForm.weightDay6),
          Number(checkinForm.weightDay7),
        ],
        previous_average_weight_kg: 90.0,
        waist_circumference_cm: Number(checkinForm.waistCm),
        nutrition_adherence_percent: Number(checkinForm.nutritionAdherence),
        workouts_completed: 4,
        workouts_scheduled: 4,
        biofeedback: {
          hunger_level: Number(checkinForm.hungerLevel),
          energy_in_gym: Number(checkinForm.energyInGym),
          sleep_quality: 4,
          stress_level: 2,
        },
        pain_reports: [],
      };

      const res = await fetch(`${API_BASE}/api/v1/programs/checkin/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل إرسال المتابعة");

      setCheckinResult(data.analysis);
      alert("✅ تم إرسال متابعتك الأسبوعية بنجاح إلى الكابتن للمراجعة والاعتماد!");
    } catch (err) {
      alert("فشل إرسال المتابعة: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const nutrition = program?.nutrition_program;
  const training = program?.training_program;
  const todaySession = training?.weeks?.[0]?.sessions?.[0]; // Upper A

  return (
    <div className="codex-wrapper" dir="rtl" style={{ minHeight: "100vh", backgroundColor: "#f6f8fb", fontFamily: "Cairo, Tajawal, sans-serif" }}>
      {/* 1. Header */}
      <header className="codex-header">
        <div className="header-contian d-flex justify-content-between align-items-center">
          <div className="header-left d-flex align-items-center">
            <div className="input-group" style={{ minWidth: "320px" }}>
              <span className="input-group-text pe-0"><i className="ti ti-search text-muted"></i></span>
              <input type="text" placeholder="بحث في التمارين، الوجبات، الأصناف..." className="form-control" />
            </div>
          </div>

          <div className="header-right d-flex align-items-center justify-content-end gap-3 pe-2">
            <ul className="nav-iconlist mb-0 d-flex align-items-center gap-2 list-unstyled">
              <li>
                <div className="navicon-wrap action-dark">
                  <i className="ti ti-moon icon-dark"></i>
                </div>
              </li>
              <li className="action-menu">
                <div className="navicon-wrap notiicon-iconwrap">
                  <i className="ti ti-bell-ringing"></i>
                  <div className="noti-count"></div>
                </div>
              </li>
            </ul>

            <Link 
              to={`/pdf?user_id=${targetUserId}`} 
              target="_blank"
              className="btn btn-outline-danger btn-sm rounded-pill px-3 py-1 fw-bold me-2"
            >
              <i className="ti ti-file-text me-1"></i> تحميل الخطة PDF
            </Link>

            <div className="d-flex align-items-center gap-2 py-1 px-3 bg-light rounded-pill border ms-2">
              <img className="img-fluid rounded-circle border" src="/admin-dashboard_data/avtar/profile.png" alt="User Logo" width="36" height="36" />
              <div className="d-none d-md-block text-end pe-1">
                <span className="fw-bold d-block text-dark lh-1" style={{ fontSize: "0.9rem" }}>{currentUser?.full_name || "أحمد سمير"}</span>
                <small className="text-muted" style={{ fontSize: "0.72rem" }}>مشترك بريميوم 👑</small>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Sidebar (Right Side RTL - Pure Arabic) */}
      <aside className="codex-sidebar">
        <div 
          className="codex-brand" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            textAlign: 'center', 
            padding: '14px 10px 8px 10px',
            width: '100%',
            border: 'none',
            background: 'transparent'
          }}
        >
          <a 
            href="/" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              textDecoration: 'none',
              width: '100%',
              margin: '0 auto'
            }}
          >
            <img 
              src="/admin-dashboard_data/logo/z_clean_symbol.jpg?v=2" 
              alt="Z Logo" 
              style={{ 
                height: '76px', 
                width: '76px', 
                objectFit: 'contain', 
                margin: '0 auto',
                display: 'block'
              }} 
            />
            <span 
              style={{ 
                fontSize: '0.92rem', 
                letterSpacing: '4px', 
                fontWeight: '900',
                background: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'block',
                marginTop: '-4px',
                lineHeight: '1.2',
                textAlign: 'center',
                width: '100%'
              }}
            >
              COACHING
            </span>
          </a>
        </div>

        <div className="codex-menuwrapper custom-scroll" data-simplebar>
          <ul className="codex-menu">
            <li className="menu-item active">
              <Link to="/user-dashboard">
                <div className="icon-item"><i className="ti ti-layout-dashboard"></i></div>
                <span>الرئيسية</span>
              </Link>
            </li>
            <li className="menu-item">
              <a href="#today-workout">
                <div className="icon-item"><i className="ti ti-barbell"></i></div>
                <span>جدول التمارين</span>
              </a>
            </li>
            <li className="menu-item">
              <a href="#diet-plan">
                <div className="icon-item"><i className="ti ti-salad"></i></div>
                <span>الدايت والوجبات</span>
              </a>
            </li>
            <li className="menu-item">
              <a href="#supplements-plan">
                <div className="icon-item"><i className="ti ti-pill"></i></div>
                <span>المكملات الغذائية</span>
              </a>
            </li>
            <li className="menu-item">
              <Link to={`/progress?user_id=${targetUserId}`}>
                <div className="icon-item"><i className="ti ti-chart-line"></i></div>
                <span>الرسوم البيانية والتطور</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to={`/mobile?user_id=${targetUserId}`}>
                <div className="icon-item"><i className="ti ti-device-mobile"></i></div>
                <span>تطبيق الموبايل</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/customers">
                <div className="icon-item"><i className="ti ti-users"></i></div>
                <span>بوابة الكابتن</span>
              </Link>
            </li>
            <li className="menu-item">
              <button onClick={() => setCheckinModalOpen(true)} className="btn p-0 text-end w-100 d-flex align-items-center text-muted" style={{ background: "none", border: "none" }}>
                <div className="icon-item"><i className="ti ti-clipboard-check"></i></div>
                <span>المتابعة الأسبوعية</span>
              </button>
            </li>
          </ul>
        </div>

        <div className="sidebarpro-sec mt-3 mb-4 mx-3 p-3 text-center" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill fw-bold" style={{ fontSize: '0.74rem' }}>
              <i className="ti ti-circle-filled me-1" style={{ fontSize: '7px' }}></i> الخطة الذكية نشطة
            </span>
          </div>
          <h6 className="mb-1 fw-bold text-dark" style={{ fontSize: '0.88rem' }}>Z Athlete Portal</h6>
          <p className="text-muted mb-3" style={{ fontSize: '0.74rem' }}>متابعة الالتزام وتحديثات المدرب</p>
          <button 
            onClick={() => setCheckinModalOpen(true)} 
            className="btn btn-sm w-100 rounded-pill fw-bold text-white shadow-sm"
            style={{ 
              background: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)',
              padding: '8px 14px',
              fontSize: '0.86rem',
              border: 'none'
            }}
          >
            <i className="ti ti-clipboard-check me-1"></i> إرسال المتابعة الأسبوعية
          </button>
        </div>
      </aside>

      {/* 3. Main Workspace */}
      <main className="themebody-wrap">
        <div className="theme-body">
          <div className="container-fluid">
            {/* 1. Welcome Card Hero */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card welcome-card border-0 text-white" style={{ background: "linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)", borderRadius: "16px" }}>
                  <div className="card-body d-lg-flex align-items-center justify-content-between p-4">
                    <div>
                      <h2 className="fw-bold text-white mb-2">
                        مساء الخير يا كابتن {currentUser?.full_name || "أحمد سمير"}! 👋
                      </h2>
                      <p className="text-white-50 fs-6 mb-3">
                        خطة الميزوسايكل المخصصة (الأسبوع 1 / مرحلة: التراكم والتجهيز) جاهزة. مستوى الجهد المستهدف: <strong>3 RIR</strong>.
                      </p>
                      <div className="welcome-badges d-flex gap-2 flex-wrap">
                        <span className="badge bg-white text-primary rounded-pill px-3 py-2 fw-bold">
                          <i className="ti ti-crown me-1"></i> بناء عضلي وحرق دهون
                        </span>
                        <span className="badge bg-white text-dark rounded-pill px-3 py-2 fw-bold">
                          <i className="ti ti-barbell me-1"></i> تجهيزات جيم تجاري كامل
                        </span>
                        <span className="badge bg-white text-success rounded-pill px-3 py-2 fw-bold">
                          <i className="ti ti-flame me-1"></i> 8,000 خطوة يومياً
                        </span>
                      </div>
                    </div>
                    <img className="img-fluid d-none d-lg-block" src="/admin-dashboard_data/user-dashboard/userwelcome-shap.png" alt="hero" style={{ maxHeight: "140px" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Coach Direct Notes Banner (If Present) */}
            {program?.coach_notes && (
              <div className="row mb-4">
                <div className="col-12">
                  <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', backgroundColor: '#ecfdf5', borderRight: '5px solid #10b981' }}>
                    <div className="card-body p-4">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="badge bg-success px-3 py-1 rounded-pill fw-bold">توجيهات الكابتن المباشرة 👑</span>
                        <small className="text-muted">ملاحظات خطتك الحالية</small>
                      </div>
                      <p className="mb-0 text-dark fw-semibold" style={{ fontSize: '1.05rem', lineHeight: '1.8' }}>
                        {program.coach_notes}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Top 5 Stat Cards (Calories, Protein, Carbs, Fats, Steps) */}
            <div className="row row-cols-xxl-5 row-cols-md-3 row-cols-sm-2 gy-3 mb-4">
              <div className="col">
                <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: "14px" }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="stat-icon bg-primary-subtle text-primary p-2 rounded-3">
                        <i className="ti ti-bolt fs-4"></i>
                      </div>
                      <span className="badge badge-primary">الهدف اليومي</span>
                    </div>
                    <h4 className="fw-bold mb-0 text-dark">
                      {Math.round(nutrition?.stages?.energy_target?.target_calories_kcal || 2200)} <small className="fs-6 text-muted">سعرة</small>
                    </h4>
                    <p className="text-muted small mb-2">السعرات المستهدفة</p>
                    <div className="progress" style={{ height: "6px" }}>
                      <div className="progress-bar bg-primary" style={{ width: "75%" }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col">
                <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: "14px" }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="stat-icon bg-danger-subtle text-danger p-2 rounded-3">
                        <i className="ti ti-barbell fs-4"></i>
                      </div>
                      <span className="badge bg-danger-subtle text-danger">هدف عالي</span>
                    </div>
                    <h4 className="fw-bold mb-0 text-dark">
                      {Math.round(nutrition?.stages?.macro_targets?.protein_g || 170)} <small className="fs-6 text-muted">جرام</small>
                    </h4>
                    <p className="text-muted small mb-2">البروتين الصافي</p>
                    <div className="progress" style={{ height: "6px" }}>
                      <div className="progress-bar bg-danger" style={{ width: "85%" }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col">
                <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: "14px" }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="stat-icon bg-info-subtle text-info p-2 rounded-3">
                        <i className="ti ti-flame fs-4"></i>
                      </div>
                      <span className="badge bg-info-subtle text-info">طاقة نظيفة</span>
                    </div>
                    <h4 className="fw-bold mb-0 text-dark">
                      {Math.round(nutrition?.stages?.macro_targets?.carbohydrate_g || 220)} <small className="fs-6 text-muted">جرام</small>
                    </h4>
                    <p className="text-muted small mb-2">الكاربوهيدرات</p>
                    <div className="progress" style={{ height: "6px" }}>
                      <div className="progress-bar bg-info" style={{ width: "70%" }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col">
                <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: "14px" }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="stat-icon bg-warning-subtle text-warning p-2 rounded-3">
                        <i className="ti ti-droplet fs-4"></i>
                      </div>
                      <span className="badge bg-warning-subtle text-warning">صحي</span>
                    </div>
                    <h4 className="fw-bold mb-0 text-dark">
                      {Math.round(nutrition?.stages?.macro_targets?.fat_g || 60)} <small className="fs-6 text-muted">جرام</small>
                    </h4>
                    <p className="text-muted small mb-2">الدهون الصحية</p>
                    <div className="progress" style={{ height: "6px" }}>
                      <div className="progress-bar bg-warning" style={{ width: "60%" }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col">
                <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: "14px" }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="stat-icon bg-success-subtle text-success p-2 rounded-3">
                        <i className="ti ti-trophy fs-4"></i>
                      </div>
                      <span className="badge badge-success">يومياً</span>
                    </div>
                    <h4 className="fw-bold mb-0 text-dark">8,000</h4>
                    <p className="text-muted small mb-2">الخطوات اليومية</p>
                    <div className="progress" style={{ height: "6px" }}>
                      <div className="progress-bar bg-success" style={{ width: "80%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Daily Cardio & Tanaka Fat-Burning Zone Banner */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card bg-primary text-white border-0 shadow-sm" style={{ borderRadius: "14px" }}>
                  <div className="card-body p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div>
                      <h4 className="text-white fw-bold mb-1">
                        🔥 الكارديو اليومي ونطاق نبضات حرق الدهون (Zone 2)
                      </h4>
                      <p className="text-white-50 mb-0">
                        النبض المستهدف: <strong>115 - 134 نبضة/دقيقة</strong> | 8,000 خطوة موزعة على مدار اليوم.
                      </p>
                    </div>
                    <button onClick={() => setCheckinModalOpen(true)} className="btn btn-white text-primary px-4 py-2 fw-bold rounded-pill shadow-sm">
                      تسجيل نشاط اليوم
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Main Two Columns: Today's Workout & Today's Nutrition */}
            <div className="row gy-4">
              {/* Left Column: Today's Workout (English title on top + Arabic subtitle below) */}
              <div className="col-xxl-7 col-xl-6" id="today-workout">
                <div className="card border-0 shadow-sm h-100 bg-white" style={{ borderRadius: "14px" }}>
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div>
                        <h5 className="fw-bold mb-0 text-dark">
                          🏋️ تمرين اليوم: {todaySession?.session_code || "UPPER_A"}
                        </h5>
                        <small className="text-muted">مستوى الجهد: 3 RIR | أولوية التمارين المركبة</small>
                      </div>
                      <span className="badge badge-primary px-3 py-2 rounded-pill">
                        يوم الاثنين
                      </span>
                    </div>

                    <div className="table-responsive mt-3">
                      {loading && !todaySession ? (
                        <div className="text-center py-4">
                          <div className="spinner-border text-primary" role="status"></div>
                          <p className="text-muted mt-2 small">جاري تحميل تمارين اليوم...</p>
                        </div>
                      ) : (
                        <table className="table table-hover align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>التمرين</th>
                              <th>المجموعات والتكرارات</th>
                              <th>الراحة</th>
                              <th>الإنجاز</th>
                            </tr>
                          </thead>
                          <tbody>
                            {todaySession?.exercises?.map((ex, exIdx) => {
                              const isDone = completedExercises[ex.exercise_code];
                              return (
                                <tr key={exIdx}>
                                  <td>
                                    {/* Primary English name in bold */}
                                    <div className="fw-bold text-dark" style={{ fontSize: "0.95rem" }}>
                                      {ex.name_en || ex.exercise_code.replace(/_/g, " ")}
                                    </div>
                                    {/* Arabic subtitle in lighter smaller font */}
                                    <small className="text-muted d-block" style={{ fontSize: "0.8rem", fontWeight: "normal" }}>
                                      {getArabicExerciseName(ex)}
                                    </small>
                                  </td>
                                  <td>
                                    <span className="badge bg-primary-subtle text-primary me-1">
                                      {ex.prescription?.sets} مجموعات
                                    </span>
                                    <span className="badge bg-success-subtle text-success">
                                      {ex.prescription?.target_min || ex.prescription?.target_max} تكرار
                                    </span>
                                  </td>
                                  <td>
                                    <span className="badge bg-warning-subtle text-warning">
                                      {ex.prescription?.rest_seconds || 90} ثانية
                                    </span>
                                  </td>
                                  <td>
                                    <button
                                      onClick={() => toggleExercise(ex.exercise_code)}
                                      className={`btn btn-sm rounded-circle p-2 ${isDone ? "btn-success" : "btn-outline-secondary"}`}
                                    >
                                      <i className={`ti ${isDone ? "ti-check" : "ti-circle"}`}></i>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Today's Diet Plan (100% Pure Arabic Single Line - No English) */}
              <div className="col-xxl-5 col-xl-6" id="diet-plan">
                <div className="card border-0 shadow-sm h-100 bg-white" style={{ borderRadius: "14px" }}>
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div>
                        <h5 className="fw-bold mb-0 text-dark">
                          🥗 وجبات اليوم (بوحدات القياس المنزلية المقربة)
                        </h5>
                        <small className="text-muted">كميات مريحة للمعدة، بدون أرز في الإفطار</small>
                      </div>
                      <span className="badge bg-success px-3 py-2 rounded-pill">
                        3 وجبات متكاملة
                      </span>
                    </div>

                    <div className="d-flex flex-column gap-3 mt-3">
                      {loading && !nutrition?.quantized_plan?.meals ? (
                        <div className="text-center py-4">
                          <div className="spinner-border text-success" role="status"></div>
                          <p className="text-muted mt-2 small">جاري تحميل الوجبات والبدائل...</p>
                        </div>
                      ) : (
                        nutrition?.quantized_plan?.meals?.map((meal, mIdx) => (
                          <div key={mIdx} className="p-3 bg-light rounded-3 border">
                            <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                              <h6 className="fw-bold mb-0 text-primary">
                                {mIdx === 0 ? "🍳 الوجبة 1 (الإفطار)" : mIdx === 1 ? "🍗 الوجبة 2 (الغداء)" : "🥣 الوجبة 3 (العشاء)"}
                              </h6>
                              <span className="badge bg-primary-subtle text-primary">
                                ~{Math.round(meal.totals?.calories_kcal || meal.target?.planned_calories || meal.meal_energy_kcal || 700)} سعرة
                              </span>
                            </div>

                            <div className="d-flex flex-column gap-2">
                              {(meal.foods || meal.items)?.map((food, fIdx) => (
                                <div key={fIdx} className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border">
                                  {/* Pure Arabic Name and Grams on a Single Line */}
                                  <div className="fw-bold text-dark" style={{ fontSize: "0.92rem" }}>
                                    {formatArabicFoodSingleLine(food)}
                                  </div>

                                  <button
                                    onClick={() => handleOpenSwapModal(mIdx, fIdx, food, meal.role)}
                                    className="btn btn-outline-primary btn-sm rounded-pill px-3 py-1"
                                    style={{ fontSize: "0.8rem", fontWeight: "bold" }}
                                  >
                                    <i className="ti ti-refresh me-1"></i> تبديل
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Supplements Protocol Row */}
            <div className="card border-0 shadow-sm bg-white mt-4 mb-4" style={{ borderRadius: "16px" }} id="supplements-plan">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                  <div>
                    <h5 className="fw-bold text-dark mb-1">
                      <i className="ti ti-pill text-primary me-2"></i> بروتوكول المكملات الغذائية والجرعات المعتمدة (Supplements Protocol)
                    </h5>
                    <p className="text-muted small mb-0">توقيتات تناول المكملات الموصى بها لتعزيز الأداء والاستشفاء العضلي</p>
                  </div>
                  <span className="badge bg-success-subtle text-success px-3 py-2 rounded-pill fw-bold">
                    معتمد من الكابتن
                  </span>
                </div>

                <div className="row g-3">
                  {(program?.supplements || DEFAULT_SUPPLEMENTS).map((sup, idx) => (
                    <div className="col-lg-4 col-md-6" key={idx}>
                      <div className="card border h-100 rounded-3 p-3 shadow-none bg-light">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="fw-bold text-dark mb-0">{sup.name_ar}</h6>
                          <span className="badge bg-primary text-white fw-bold">{sup.dosage}</span>
                        </div>
                        <div className="small text-muted mb-2">
                          <i className="ti ti-clock text-primary me-1"></i> <strong className="text-dark">التوقيت:</strong> {sup.timing}
                        </div>
                        <div className="small text-muted mb-1">
                          <strong className="text-dark">الهدف:</strong> {sup.purpose}
                        </div>
                        {sup.instructions && (
                          <div className="small text-muted border-top pt-2 mt-2">
                            <i className="ti ti-info-circle text-info me-1"></i> {sup.instructions}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 4. Smart Food Swap Modal (100% Arabic) */}
      {swapModalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 99999 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px", overflow: "hidden" }}>
              <div className="modal-header bg-primary text-white py-3">
                <h5 className="modal-title fw-bold text-white">
                  <i className="ti ti-refresh me-2"></i> استبدال الصنف الذكي
                </h5>
                <button type="button" className="btn-close btn-close-white ms-0 me-auto" onClick={() => setSwapModalOpen(false)}></button>
              </div>

              <div className="modal-body p-4 text-end">
                <div className="p-3 bg-light rounded-3 mb-3 border">
                  <small className="text-muted d-block">الصنف الحالي المراد استبداله:</small>
                  <h6 className="fw-bold text-primary mb-0">
                    {formatArabicFoodSingleLine(selectedFoodItem)}
                  </h6>
                </div>

                <h6 className="fw-bold mb-3 text-dark">البدائل المتاحة المتوافقة مع الوجبة:</h6>

                {swapLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2 text-muted">جاري احتساب المقادير المكافئة بدقة...</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2" style={{ maxHeight: "320px", overflowY: "auto" }}>
                    {swapCandidates.length === 0 ? (
                      <div className="p-3 text-center text-muted">
                        لا توجد بدائل مباشرة مطابقة حالياً لهذا الصنف.
                      </div>
                    ) : (
                      swapCandidates.map((candidate) => (
                        <button
                          key={candidate.food_code}
                          onClick={() => handleExecuteSwap(candidate.food_code)}
                          className="btn btn-light text-dark p-3 text-end d-flex justify-content-between align-items-center border rounded-3 shadow-sm"
                          style={{ backgroundColor: '#fff' }}
                        >
                          <div>
                            <strong className="d-block text-dark mb-1">{candidate.name_ar}</strong>
                            <span className="badge bg-primary-subtle text-primary fw-bold" style={{ fontSize: '0.82rem' }}>
                              {candidate.serving_display_ar || candidate.display_ar || `${candidate.target_grams || 100} جرام`}
                            </span>
                          </div>
                          <span className="btn btn-primary btn-sm rounded-pill px-3 py-1 fw-semibold">
                            تبديل ➜
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="modal-footer bg-light border-0 py-2">
                <button type="button" className="btn btn-secondary px-4 rounded-pill" onClick={() => setSwapModalOpen(false)}>
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Weekly Check-in Modal */}
      {checkinModalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 99999 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px", overflow: "hidden" }}>
              <div className="modal-header bg-success text-white py-3">
                <h5 className="modal-title fw-bold text-white">
                  <i className="ti ti-clipboard-check me-2"></i> استمارة المتابعة الأسبوعية والتكيف التلقائي
                </h5>
                <button type="button" className="btn-close btn-close-white ms-0 me-auto" onClick={() => setCheckinModalOpen(false)}></button>
              </div>

              <div className="modal-body p-4 text-end">
                <form onSubmit={handleCheckinSubmit}>
                  <h6 className="fw-bold text-primary mb-3">1. أوزان أيام الأسبوع الـ 7 على الريق (كجم):</h6>
                  <div className="row g-2 mb-4">
                    {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                      <div className="col-md-3 col-6" key={d}>
                        <label className="form-label small text-muted">يوم {d}</label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-control text-center"
                          value={checkinForm[`weightDay${d}`]}
                          onChange={(e) => setCheckinForm({ ...checkinForm, [`weightDay${d}`]: e.target.value })}
                          required
                        />
                      </div>
                    ))}
                    <div className="col-md-3 col-6">
                      <label className="form-label small fw-bold text-primary">محيط الخصر (سم)</label>
                      <input
                        type="number"
                        step="0.5"
                        className="form-control text-center fw-bold border-primary"
                        value={checkinForm.waistCm}
                        onChange={(e) => setCheckinForm({ ...checkinForm, waistCm: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <h6 className="fw-bold text-primary mb-3">2. تقييم الالتزام والمؤشرات الحيوية:</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label small">نسبة الالتزام بالدايت (%)</label>
                      <input
                        type="number"
                        min="50"
                        max="100"
                        className="form-control text-center"
                        value={checkinForm.nutritionAdherence}
                        onChange={(e) => setCheckinForm({ ...checkinForm, nutritionAdherence: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small">مستوى الجوع (1 شبعان - 5 جائع جداً)</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        className="form-control text-center"
                        value={checkinForm.hungerLevel}
                        onChange={(e) => setCheckinForm({ ...checkinForm, hungerLevel: e.target.value })}
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="btn btn-success btn-lg w-100 py-3 fw-bold rounded-pill shadow-sm">
                    {loading ? "جاري التحليل والتكيّف..." : "📊 إرسال تقرير المتابعة وحفظه في قاعدة البيانات"}
                  </button>
                </form>

                {checkinResult && (
                  <div className="mt-4 p-3 bg-light rounded-3 border border-success">
                    <h6 className="fw-bold text-success mb-2">
                      ✅ نتيجة التقييم: {checkinResult.status} (تم الحفظ في MariaDB `z`)
                    </h6>
                    <p className="small text-muted mb-0">
                      متوسط الوزن: {checkinResult.weight_analysis?.current_average_kg} كجم | معدل التغير: {checkinResult.weight_analysis?.delta_kg} كجم
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
