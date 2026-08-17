import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getArabicExerciseName } from '../utils/exerciseTranslator';
import { API_BASE } from '../config/api';
import SmartSwapModal from '../components/modals/SmartSwapModal';

export default function MobileAppSimulator() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'workout' | 'nutrition' | 'checkin'
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedSessionIdx, setSelectedSessionIdx] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  const [completedExercises, setCompletedExercises] = useState({});

  // Smart Swap State in Mobile App
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [activeMealIndex, setActiveMealIndex] = useState(null);
  const [activeFoodIndex, setActiveFoodIndex] = useState(null);
  const [selectedFoodItem, setSelectedFoodItem] = useState(null);
  const [swapCandidates, setSwapCandidates] = useState([]);
  const [swapLoading, setSwapLoading] = useState(false);

  // Checkin state
  const [weights, setWeights] = useState(['85.0', '84.8', '84.7', '84.5', '84.4', '84.3', '84.2']);
  const [waist, setWaist] = useState('88.5');
  const [adherence, setAdherence] = useState(95);
  const [submittingCheckin, setSubmittingCheckin] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const targetUserId = searchParams.get('user_id') || '2';

  // ESC key handler (Exits simulator just like a modal/popup)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        if (swapModalOpen) {
          setSwapModalOpen(false);
        } else {
          navigate('/');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [swapModalOpen, navigate]);

  useEffect(() => {
    fetchClients();
    fetchData(targetUserId);
  }, [targetUserId]);

  useEffect(() => {
    let interval = null;
    if (restSeconds > 0) {
      interval = setInterval(() => {
        setRestSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restSeconds]);

  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/clients`);
      const data = await res.json();
      if (data.clients) setClients(data.clients);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async (uid) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/programs/active/${uid}`);
      const data = await res.json();
      if (data.master_program) {
        setProgram(data.master_program);
        setUser(data.user);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleExercise = (code) => {
    setCompletedExercises(prev => ({ ...prev, [code]: !prev[code] }));
  };

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
          protein_g: data.swapped_food.protein_g,
          carbs_g: data.swapped_food.carbs_g,
          fats_g: data.swapped_food.fats_g,
          calories_kcal: data.swapped_food.calories_kcal
        };
        setProgram(updated);
      }

      setSwapModalOpen(false);
      alert(` تم تبديل الصنف إلى ${data.swapped_food.name_ar} (${data.swapped_food.grams} جم) بنجاح!`);
    } catch (e) {
      alert("خطأ أثناء التبديل: " + e.message);
    } finally {
      setSwapLoading(false);
    }
  };

  const handleCheckinSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingCheckin(true);
      const res = await fetch(`${API_BASE}/api/v1/programs/checkin/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_code: targetUserId,
          week_number: 1,
          daily_weights_kg: weights.map(Number),
          previous_average_weight_kg: 85.5,
          waist_circumference_cm: Number(waist),
          nutrition_adherence_percent: Number(adherence),
          workouts_completed: 4,
          workouts_scheduled: 4,
          biofeedback: {
            hunger_level: 2,
            energy_in_gym: 4,
            sleep_quality: 4,
            stress_level: 2
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إرسال المتابعة');

      alert(' تم إرسال المتابعة الأسبوعية بنجاح إلى لوحة الكابتن!');
      setActiveTab('home');
      fetchData(targetUserId);
    } catch (err) {
      alert('خطأ: ' + err.message);
    } finally {
      setSubmittingCheckin(false);
    }
  };

  // Resolve sessions
  const sessions = 
    program?.adapted_training_week?.sessions ||
    program?.training_program?.weeks?.[0]?.sessions || 
    program?.training_program?.mesocycle?.weeks?.[0]?.sessions || 
    [];

  const activeSession = sessions[selectedSessionIdx] || sessions[0];
  const exercises = activeSession?.exercises || [];

  const targets = 
    program?.adapted_nutrition || 
    program?.nutrition_program?.targets || 
    {};

  const caloriesTarget = Math.round(
    targets.target_calories_kcal || 
    targets.calories_kcal || 
    program?.nutrition_program?.stages?.energy_target?.target_calories_kcal || 
    2200
  );
  const proteinTarget = Math.round(targets.protein_g || 170);
  const carbsTarget = Math.round(targets.carbohydrate_g || targets.carbs_g || 220);
  const fatsTarget = Math.round(targets.fat_g || targets.fats_g || 60);

  const defaultMeals = [
    {
      meal_number: 1,
      name: "وجبة الإفطار",
      foods: [
        { name_ar: "بيض مسلوق كامل", portion_g_rounded: 150 },
        { name_ar: "شوفان كامل الحبة", portion_g_rounded: 80 }
      ]
    },
    {
      meal_number: 2,
      name: "وجبة الغداء",
      foods: [
        { name_ar: "صدور دجاج مشوية", portion_g_rounded: 200 },
        { name_ar: "أرز أبيض مطبوخ", portion_g_rounded: 220 },
        { name_ar: "سلطة خضراء بزيت زيتون", portion_g_rounded: 150 }
      ]
    },
    {
      meal_number: 3,
      name: "وجبة العشاء",
      foods: [
        { name_ar: "جبنة قريش قليلة الدسم", portion_g_rounded: 200 },
        { name_ar: "خبز بلدي / توست حبوب", portion_g_rounded: 100 }
      ]
    }
  ];

  const meals = 
    (program?.nutrition_program?.quantized_plan?.meals && program.nutrition_program.quantized_plan.meals.length > 0)
      ? program.nutrition_program.quantized_plan.meals 
      : defaultMeals;

  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-4" style={{ minHeight: '100vh', backgroundColor: '#090d16', fontFamily: 'Cairo, Tajawal, system-ui, sans-serif' }} dir="rtl">
      
      {/* Top Simulator Control Bar */}
      <div 
        className="card border-0 shadow-lg mb-4 px-4 py-2 text-white rounded-pill d-flex flex-row align-items-center justify-content-between gap-3" 
        style={{ width: '100%', maxWidth: '440px', backgroundColor: '#131b2e', border: '1px solid #1e293b' }}
      >
        <div className="d-flex align-items-center gap-2">
          <span className="badge rounded-pill fw-bold" style={{ background: '#f5f3ff', color: '#261c6a', fontSize: '0.74rem' }}>
            <i className="ti ti-device-mobile me-1"></i> FLUTTER APP
          </span>
          {clients.length > 0 && (
            <select 
              className="form-select form-select-sm text-white border-0 rounded-pill py-1 px-3"
              style={{ fontSize: '0.8rem', background: '#1e293b', maxWidth: '160px' }}
              value={targetUserId}
              onChange={(e) => window.location.href = `/mobile?user_id=${e.target.value}`}
            >
              {clients.map(c => (
                <option key={c.id} value={c.client_code || c.id}>
                  {c.full_name || `عميل ${c.client_code}`} ({c.client_code})
                </option>
              ))}
            </select>
          )}
        </div>
        <Link 
          to="/" 
          className="btn btn-sm rounded-pill px-3 fw-semibold text-white d-flex align-items-center gap-1 shadow-xs"
          style={{ height: '32px', fontSize: '0.78rem', background: '#261c6a', border: 'none' }}
          title="اضغط ESC في أي وقت للرجوع للوحة القيادة"
        >
          <i className="ti ti-arrow-right"></i>
          <span>العودة للويب</span>
          <span className="badge bg-black bg-opacity-25 text-white-50 ms-1 px-1 py-0 rounded" style={{ fontSize: '0.62rem' }}>ESC</span>
        </Link>
      </div>

      {/* Mobile Device Frame (Dark Athletic Luxury / Apple Fitness & Whoop Aesthetic) */}
      <div 
        className="card border-0 shadow-2xl overflow-hidden position-relative"
        style={{
          width: '390px',
          height: '790px',
          borderRadius: '46px',
          backgroundColor: '#080c14',
          border: '10px solid #131b2e',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.9), 0 0 35px rgba(38, 28, 106, 0.25)',
          color: '#f8fafc'
        }}
      >
        {/* Dynamic Island */}
        <div className="position-absolute top-0 start-50 translate-middle-x mt-2 bg-black rounded-pill border border-dark" style={{ width: '120px', height: '24px', zIndex: 100 }}></div>

        {/* App Top Bar (Dark Athletic Luxury Header) */}
        <div 
          className="pt-5 pb-3 px-3 d-flex align-items-center justify-content-between position-relative" 
          style={{ 
            background: 'linear-gradient(180deg, #0f172a 0%, #080c14 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            zIndex: 10
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0" 
              style={{ 
                width: '38px', 
                height: '38px', 
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', 
                color: '#ffffff', 
                border: '2px solid rgba(165, 180, 252, 0.5)', 
                fontSize: '0.92rem',
                boxShadow: '0 0 12px rgba(99, 102, 241, 0.35)'
              }}
            >
              {(user?.full_name || 'U')[0]}
            </div>
            <div>
              <h6 className="fw-bold text-white mb-0 lh-1" style={{ fontSize: '0.94rem', letterSpacing: '-0.2px' }}>
                {user?.full_name || 'كيمو المحروقي'}
              </h6>
              <small className="text-muted" style={{ fontSize: '0.68rem' }}>كود المشترك: <strong className="font-monospace text-slate-300" style={{ color: '#cbd5e1' }}>{user?.client_code || targetUserId}</strong></small>
            </div>
          </div>
          <span 
            className="badge rounded-pill px-2 py-1 fw-bold" 
            style={{ 
              background: 'rgba(99, 102, 241, 0.15)', 
              color: '#a5b4fc', 
              border: '1px solid rgba(129, 140, 248, 0.35)', 
              fontSize: '0.66rem',
              boxShadow: '0 0 10px rgba(99, 102, 241, 0.2)'
            }}
          >
            Z-ENGINE V2
          </span>
        </div>

        {/* App Scrollable Content */}
        <div 
          className="flex-grow-1 overflow-auto p-3 custom-scroll" 
          style={{ 
            height: 'calc(100% - 145px)',
            background: 'radial-gradient(circle at 50% 0%, rgba(38, 28, 106, 0.25) 0%, #080c14 70%)'
          }}
        >
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border spinner-border-sm text-info" role="status"></div>
              <p className="text-muted small mt-2">جاري مزامنة خطة المتدرب...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: HOME OVERVIEW */}
              {activeTab === 'home' && (
                <div className="d-flex flex-column gap-3">
                  
                  {/* Coach Direct Notes Banner (Dark Luxury VIP Card) */}
                  {program?.coach_notes && (
                    <div 
                      className="p-3 rounded-4 position-relative overflow-hidden" 
                      style={{ 
                        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.75) 0%, rgba(15, 23, 42, 0.85) 100%)', 
                        border: '1px solid rgba(129, 140, 248, 0.3)', 
                        borderRight: '4px solid #818cf8',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="badge rounded-pill px-2 py-1 fw-bold" style={{ background: 'rgba(129, 140, 248, 0.2)', color: '#c7d2fe', fontSize: '0.66rem', border: '1px solid rgba(129, 140, 248, 0.4)' }}>
                          <i className="ti ti-crown me-1" style={{ color: '#fbbf24' }}></i> توجيهات الكابتن 
                        </span>
                        <small className="text-muted" style={{ fontSize: '0.64rem' }}>خطة الأسبوع</small>
                      </div>
                      <p className="small mb-0 text-slate-200 fw-semibold" style={{ fontSize: '0.84rem', lineHeight: '1.55', color: '#e2e8f0' }}>
                        {program.coach_notes}
                      </p>
                    </div>
                  )}

                  {/* Daily Target Macros Card (Neon Macro Capsule Hub) */}
                  <div 
                    className="card border-0 rounded-4 overflow-hidden" 
                    style={{ 
                      background: 'linear-gradient(180deg, #101726 0%, #0b0f19 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
                    }}
                  >
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '26px', height: '26px', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc' }}>
                            <i className="ti ti-flame fs-6"></i>
                          </div>
                          <h6 className="fw-bold text-white mb-0" style={{ fontSize: '0.9rem', letterSpacing: '-0.2px' }}>طاقة وماكروز اليوم</h6>
                        </div>
                        <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '0.64rem', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                          الهدف اليومي ✓
                        </span>
                      </div>
                      
                      <div className="row text-center g-2">
                        {/* Calories */}
                        <div className="col-3">
                          <div 
                            className="p-2 rounded-3 d-flex flex-column justify-content-between" 
                            style={{ 
                              background: 'rgba(30, 27, 75, 0.6)', 
                              border: '1px solid rgba(129, 140, 248, 0.3)',
                              minHeight: '76px'
                            }}
                          >
                            <span className="text-muted" style={{ fontSize: '0.62rem', color: '#94a3b8' }}>السعرات</span>
                            <div className="fw-black" style={{ fontSize: '1.05rem', color: '#c7d2fe', letterSpacing: '-0.4px', fontWeight: '900' }}>{caloriesTarget}</div>
                            <div className="fw-semibold" style={{ fontSize: '0.6rem', color: '#818cf8' }}>سعرة</div>
                          </div>
                        </div>

                        {/* Protein */}
                        <div className="col-3">
                          <div 
                            className="p-2 rounded-3 d-flex flex-column justify-content-between" 
                            style={{ 
                              background: 'rgba(8, 145, 178, 0.12)', 
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              minHeight: '76px'
                            }}
                          >
                            <span className="text-muted" style={{ fontSize: '0.62rem', color: '#94a3b8' }}>بروتين</span>
                            <div className="fw-black" style={{ fontSize: '1.05rem', color: '#38bdf8', letterSpacing: '-0.4px', fontWeight: '900' }}>{proteinTarget}g</div>
                            <div className="fw-semibold" style={{ fontSize: '0.6rem', color: '#38bdf8' }}>عالي</div>
                          </div>
                        </div>

                        {/* Carbs */}
                        <div className="col-3">
                          <div 
                            className="p-2 rounded-3 d-flex flex-column justify-content-between" 
                            style={{ 
                              background: 'rgba(217, 119, 6, 0.12)', 
                              border: '1px solid rgba(251, 191, 36, 0.3)',
                              minHeight: '76px'
                            }}
                          >
                            <span className="text-muted" style={{ fontSize: '0.62rem', color: '#94a3b8' }}>كارب</span>
                            <div className="fw-black" style={{ fontSize: '1.05rem', color: '#fbbf24', letterSpacing: '-0.4px', fontWeight: '900' }}>{carbsTarget}g</div>
                            <div className="fw-semibold" style={{ fontSize: '0.6rem', color: '#fbbf24' }}>طاقة</div>
                          </div>
                        </div>

                        {/* Fats */}
                        <div className="col-3">
                          <div 
                            className="p-2 rounded-3 d-flex flex-column justify-content-between" 
                            style={{ 
                              background: 'rgba(5, 150, 105, 0.12)', 
                              border: '1px solid rgba(52, 211, 153, 0.3)',
                              minHeight: '76px'
                            }}
                          >
                            <span className="text-muted" style={{ fontSize: '0.62rem', color: '#94a3b8' }}>دهون</span>
                            <div className="fw-black" style={{ fontSize: '1.05rem', color: '#34d399', letterSpacing: '-0.4px', fontWeight: '900' }}>{fatsTarget}g</div>
                            <div className="fw-semibold" style={{ fontSize: '0.6rem', color: '#34d399' }}>صحية</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hero Workout Action Card (Dark Electric Cyan & Violet Glow) */}
                  <div 
                    onClick={() => setActiveTab('workout')}
                    className="card border-0 rounded-4 p-3 transition-all position-relative overflow-hidden"
                    style={{ 
                      cursor: 'pointer', 
                      background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
                      border: '1px solid rgba(99, 102, 241, 0.35)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)'
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-3">
                        <div 
                          className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" 
                          style={{ 
                            width: '44px', 
                            height: '44px', 
                            background: 'linear-gradient(135deg, #06b6d4 0%, #4f46e5 100%)', 
                            color: '#ffffff',
                            boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
                          }}
                        >
                          <i className="ti ti-barbell fs-4"></i>
                        </div>
                        <div>
                          <div className="fw-bold text-white" style={{ fontSize: '0.92rem' }}>
                            {activeSession?.session_name || activeSession?.session_code || 'تمرين اليوم'}
                          </div>
                          <small className="text-slate-400 d-block" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {exercises.length} تمارين مبرمجة • مستوى 3 RIR
                          </small>
                        </div>
                      </div>
                      <span 
                        className="badge rounded-pill px-3 py-2 fw-bold" 
                        style={{ 
                          background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', 
                          color: '#ffffff', 
                          fontSize: '0.72rem',
                          boxShadow: '0 0 10px rgba(6, 182, 212, 0.3)'
                        }}
                      >
                        ابدأ التمرين ←
                      </span>
                    </div>
                  </div>

                  {/* Meals Action Card (Dark Amber Glow) */}
                  <div 
                    onClick={() => setActiveTab('nutrition')}
                    className="card border-0 rounded-4 p-3 transition-all position-relative overflow-hidden"
                    style={{ 
                      cursor: 'pointer', 
                      background: 'linear-gradient(135deg, #1c1917 0%, #0f172a 100%)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)'
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-3">
                        <div 
                          className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" 
                          style={{ 
                            width: '44px', 
                            height: '44px', 
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
                            color: '#ffffff',
                            boxShadow: '0 0 15px rgba(245, 158, 11, 0.35)'
                          }}
                        >
                          <i className="ti ti-salad fs-4"></i>
                        </div>
                        <div>
                          <div className="fw-bold text-white" style={{ fontSize: '0.92rem' }}>
                            جدول الوجبات والبدائل
                          </div>
                          <small className="text-slate-400 d-block" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {meals.length} وجبات رئيسية موزونة
                          </small>
                        </div>
                      </div>
                      <span 
                        className="badge rounded-pill px-3 py-2 fw-bold" 
                        style={{ 
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
                          color: '#ffffff', 
                          fontSize: '0.72rem'
                        }}
                      >
                        عرض الوجبات ←
                      </span>
                    </div>
                  </div>

                  {/* Check-in Action Card (Dark Emerald Glow) */}
                  <div 
                    onClick={() => setActiveTab('checkin')}
                    className="card border-0 rounded-4 p-3 transition-all position-relative overflow-hidden"
                    style={{ 
                      cursor: 'pointer', 
                      background: 'linear-gradient(135deg, #062e24 0%, #0f172a 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)'
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-3">
                        <div 
                          className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" 
                          style={{ 
                            width: '44px', 
                            height: '44px', 
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                            color: '#ffffff',
                            boxShadow: '0 0 15px rgba(16, 185, 129, 0.35)'
                          }}
                        >
                          <i className="ti ti-clipboard-check fs-4"></i>
                        </div>
                        <div>
                          <div className="fw-bold text-white" style={{ fontSize: '0.92rem' }}>المتابعة الأسبوعية</div>
                          <small className="text-slate-400 d-block" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            تسجيل الأوزان وتحديث الخطة
                          </small>
                        </div>
                      </div>
                      <span 
                        className="badge rounded-pill px-3 py-2 fw-bold" 
                        style={{ 
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                          color: '#ffffff', 
                          fontSize: '0.72rem'
                        }}
                      >
                        تسجيل ←
                      </span>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: WORKOUT SCREEN */}
              {activeTab === 'workout' && (
                <div className="d-flex flex-column gap-3">
                  {/* Session Selector Chips */}
                  <div className="d-flex gap-2 overflow-auto pb-1">
                    {sessions.map((sess, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSessionIdx(idx)}
                        className={`btn btn-sm rounded-pill px-3 fw-bold text-nowrap transition-all ${selectedSessionIdx === idx ? 'text-white shadow-md' : 'text-slate-300'}`}
                        style={{
                          background: selectedSessionIdx === idx ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : '#1e293b',
                          border: selectedSessionIdx === idx ? '1px solid rgba(165, 180, 252, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                          fontSize: '0.76rem',
                          height: '34px',
                          color: selectedSessionIdx === idx ? '#ffffff' : '#cbd5e1'
                        }}
                      >
                        {sess.session_name || sess.session_code || `تمرين ${idx + 1}`}
                      </button>
                    ))}
                  </div>

                  {/* Rest Timer Floating Toast */}
                  {restSeconds > 0 && (
                    <div 
                      className="p-3 rounded-4 d-flex justify-content-between align-items-center text-white shadow-lg animate__animated animate__pulse animate__infinite" 
                      style={{ 
                        background: 'linear-gradient(135deg, #312e81 0%, #0891b2 100%)',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        boxShadow: '0 0 20px rgba(6, 182, 212, 0.35)'
                      }}
                    >
                      <div className="small fw-bold d-flex align-items-center gap-2" style={{ fontSize: '0.84rem' }}>
                        <i className="ti ti-timer fs-5 text-cyan-300"></i>
                        <span>الراحة المتبقية: <strong className="text-warning">{restSeconds}</strong> ثانية</span>
                      </div>
                      <button onClick={() => setRestSeconds(0)} className="btn btn-sm btn-outline-light rounded-pill px-2 py-0 fw-bold" style={{ fontSize: '0.72rem' }}>إلغاء</button>
                    </div>
                  )}

                  {/* Exercises List with Technique Video and Celebration Check */}
                  <div className="d-flex flex-column gap-2">
                    {exercises.map((ex, exIdx) => {
                      const sets = ex.prescription?.sets || ex.sets || 3;
                      const reps = ex.prescription?.target_min || ex.reps || 10;
                      const rest = ex.prescription?.rest_seconds || ex.rest_seconds || 90;
                      const rir = ex.prescription?.target_rir !== undefined 
                        ? ex.prescription.target_rir 
                        : (ex.rir !== undefined ? ex.rir : 2);
                      const isDone = completedExercises[ex.exercise_code || exIdx];
                      const arName = ex.name_ar || getArabicExerciseName(ex.exercise_code || ex);
                      const enName = ex.name_en || ex.exercise_code?.replace(/_/g, ' ') || 'Exercise';

                      return (
                        <div 
                          key={exIdx} 
                          className="card border-0 rounded-4 p-3 transition-all" 
                          style={{ 
                            background: isDone ? 'linear-gradient(135deg, #062e24 0%, #0f172a 100%)' : '#101726',
                            border: isDone ? '1.5px solid #34d399' : '1px solid rgba(255, 255, 255, 0.08)',
                            boxShadow: isDone ? '0 0 15px rgba(52, 211, 153, 0.15)' : '0 4px 15px rgba(0,0,0,0.3)'
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start gap-2">
                            <div className="flex-grow-1">
                              <a 
                                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(arName + ' ' + enName + ' form technique')}`}
                                target="_blank" 
                                rel="noreferrer"
                                className="text-decoration-none d-flex align-items-center gap-1"
                                title="اضغط لمشاهدة فيديو التكنيك"
                              >
                                <span className="fw-bold text-white" style={{ fontSize: '0.88rem' }}>{enName}</span>
                                <i className="ti ti-video text-danger fs-6" title="فيديو شرح التمرين"></i>
                              </a>
                              <small className="d-block" style={{ fontSize: '0.74rem', color: '#94a3b8' }}>{arName}</small>
                            </div>
                            
                            <button 
                              onClick={() => toggleExercise(ex.exercise_code || exIdx)}
                              className={`btn btn-sm rounded-circle p-1 d-flex align-items-center justify-content-center transition-all flex-shrink-0`}
                              style={{ 
                                width: '32px', 
                                height: '32px', 
                                background: isDone ? '#10b981' : '#1e293b', 
                                border: isDone ? '1px solid #34d399' : '1px solid rgba(255, 255, 255, 0.15)',
                                color: isDone ? '#ffffff' : '#64748b',
                                boxShadow: isDone ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none'
                              }}
                              title={isDone ? 'تم إكمال التمرين' : 'اضغط لتحديد الإكمال'}
                            >
                              <i className={`ti ${isDone ? 'ti-check fs-6' : 'ti-circle'}`}></i>
                            </button>
                          </div>
                          
                          <div className="d-flex align-items-center justify-content-between mt-2 pt-2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            <div className="d-flex gap-1 flex-wrap">
                              <span className="badge rounded-pill px-2 py-1 fw-bold" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#c7d2fe', fontSize: '0.66rem', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                                {sets} مجموعات
                              </span>
                              <span className="badge rounded-pill px-2 py-1 fw-bold" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontSize: '0.66rem', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                                {reps} تكرار
                              </span>
                              <span className="badge rounded-pill px-2 py-1 fw-bold" style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', fontSize: '0.66rem', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                                RIR {rir}
                              </span>
                            </div>
                            <button 
                              onClick={() => setRestSeconds(rest)}
                              className="btn btn-sm rounded-pill py-0 px-2 fw-semibold d-flex align-items-center gap-1 shadow-xs"
                              style={{ fontSize: '0.7rem', background: '#1e293b', color: '#c7d2fe', border: '1px solid rgba(129, 140, 248, 0.3)', height: '26px' }}
                            >
                              <i className="ti ti-timer text-info"></i> <span>{rest}ث</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: NUTRITION SCREEN WITH APPETIZING DARK LUXURY CARDS */}
              {activeTab === 'nutrition' && (
                <div className="d-flex flex-column gap-3">
                  {meals.map((meal, mIdx) => {
                    const mealTheme = mIdx === 0 
                      ? { bg: 'rgba(217, 119, 6, 0.15)', border: '#f59e0b', color: '#fbbf24', label: 'الوجبة 1 (الإفطار)' }
                      : mIdx === 1
                      ? { bg: 'rgba(5, 150, 105, 0.15)', border: '#10b981', color: '#34d399', label: 'الوجبة 2 (الغداء)' }
                      : { bg: 'rgba(79, 70, 229, 0.15)', border: '#818cf8', color: '#a5b4fc', label: 'الوجبة 3 (العشاء)' };

                    return (
                      <div 
                        key={mIdx} 
                        className="card border-0 rounded-4 overflow-hidden" 
                        style={{ 
                          background: '#101726',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)'
                        }}
                      >
                        <div 
                          className="p-3 d-flex justify-content-between align-items-center" 
                          style={{ 
                            background: `linear-gradient(135deg, #131d31 0%, #0b0f19 100%)`, 
                            borderTop: `3.5px solid ${mealTheme.border}`,
                            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                          }}
                        >
                          <div>
                            <h6 className="fw-bold mb-0" style={{ fontSize: '0.9rem', color: mealTheme.color }}>
                              {mealTheme.label}
                            </h6>
                            <small className="text-muted" style={{ fontSize: '0.66rem', color: '#94a3b8' }}>موزونة قبل / بعد الطهي</small>
                          </div>
                          <span 
                            className="badge rounded-pill fw-bold px-2 py-1" 
                            style={{ 
                              background: mealTheme.bg, 
                              color: mealTheme.color, 
                              fontSize: '0.68rem', 
                              border: `1px solid ${mealTheme.border}40` 
                            }}
                          >
                            {meal.foods?.length || 0} أصناف
                          </span>
                        </div>

                        <div className="p-3 d-flex flex-column gap-2" style={{ background: '#080c14' }}>
                          {meal.foods?.map((f, fIdx) => {
                            const grams = f.portion_g_rounded || f.grams || 100;
                            return (
                              <div 
                                key={fIdx} 
                                className="p-2 px-3 rounded-3 d-flex justify-content-between align-items-center" 
                                style={{ 
                                  background: '#101726', 
                                  border: '1px solid rgba(255, 255, 255, 0.06)' 
                                }}
                              >
                                <div>
                                  <span className="fw-bold text-white d-block" style={{ fontSize: '0.84rem' }}>
                                    {f.name_ar || f.name_en || 'صنف غذائي'}
                                  </span>
                                  <small style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                    الكمية: <strong className="fw-bold" style={{ color: mealTheme.color }}>{grams} جرام</strong>
                                  </small>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenSwapModal(mIdx, fIdx, f, meal.role)}
                                  className="btn btn-sm rounded-pill px-2 py-0 fw-bold d-flex align-items-center gap-1 shadow-xs"
                                  style={{ 
                                    fontSize: '0.72rem', 
                                    background: 'rgba(99, 102, 241, 0.15)', 
                                    color: '#c7d2fe', 
                                    border: '1px solid rgba(129, 140, 248, 0.35)', 
                                    height: '26px' 
                                  }}
                                  title="تبديل الصنف ببديل مكافئ"
                                >
                                  <i className="ti ti-arrows-exchange text-info"></i>
                                  <span>تبديل</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 4: CHECKIN SCREEN */}
              {activeTab === 'checkin' && (
                <form onSubmit={handleCheckinSubmit} className="d-flex flex-column gap-3">
                  <div className="card border-0 rounded-4 p-3" style={{ background: '#101726', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '26px', height: '26px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                        <i className="ti ti-scale fs-6"></i>
                      </div>
                      <h6 className="fw-bold text-white mb-0" style={{ fontSize: '0.88rem' }}>أوزان الأيام الـ 7 على الريق</h6>
                    </div>
                    <small className="d-block mb-3" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>سجل أوزانك الصباحية بعد الاستيقاظ مباشرة</small>
                    
                    <div className="row g-2">
                      {weights.map((w, idx) => (
                        <div className="col-4" key={idx}>
                          <label className="small d-block mb-1" style={{ fontSize: '0.66rem', color: '#94a3b8' }}>يوم {idx + 1}</label>
                          <input 
                            type="number" 
                            step="0.1" 
                            className="form-control form-control-sm text-center fw-bold text-white" 
                            style={{ height: '34px', borderRadius: '8px', fontSize: '0.82rem', borderColor: 'rgba(255, 255, 255, 0.12)', background: '#080c14' }}
                            value={w}
                            onChange={(e) => {
                              const copy = [...weights];
                              copy[idx] = e.target.value;
                              setWeights(copy);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card border-0 rounded-4 p-3" style={{ background: '#101726', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <label className="fw-bold text-white small mb-1" style={{ fontSize: '0.82rem' }}>محيط الخصر (سم)</label>
                    <input 
                      type="number" 
                      step="0.5" 
                      className="form-control form-control-sm mb-3 fw-bold text-white" 
                      style={{ height: '36px', borderRadius: '8px', fontSize: '0.84rem', borderColor: 'rgba(255, 255, 255, 0.12)', background: '#080c14' }}
                      value={waist}
                      onChange={(e) => setWaist(e.target.value)}
                    />

                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="fw-bold text-white small" style={{ fontSize: '0.8rem' }}>نسبة الالتزام بالدايت: <strong className="text-success" style={{ color: '#34d399' }}>{adherence}%</strong></label>
                    </div>
                    <input 
                      type="range" 
                      className="form-range" 
                      min="50" 
                      max="100" 
                      step="5"
                      value={adherence}
                      onChange={(e) => setAdherence(Number(e.target.value))}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={submittingCheckin}
                    className="btn btn-sm rounded-pill w-100 fw-bold shadow-md text-white d-flex align-items-center justify-content-center gap-1"
                    style={{ 
                      height: '42px', 
                      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', 
                      border: 'none', 
                      fontSize: '0.86rem',
                      boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
                    }}
                  >
                    {submittingCheckin ? 'جاري الإرسال...' : <><i className="ti ti-send"></i> إرسال المتابعة للكابتن</>}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* App Bottom Navigation Bar (Floating Dark Glass) */}
        <div 
          className="py-2 px-3 d-flex justify-content-around align-items-center position-absolute bottom-0 start-0 end-0" 
          style={{ 
            height: '66px', 
            background: 'rgba(11, 15, 25, 0.95)',
            backdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            zIndex: 10
          }}
        >
          {[
            { id: 'home', label: 'الرئيسية', icon: 'ti-layout-dashboard' },
            { id: 'workout', label: 'التمارين', icon: 'ti-barbell' },
            { id: 'nutrition', label: 'الوجبات', icon: 'ti-salad' },
            { id: 'checkin', label: 'المتابعة', icon: 'ti-clipboard-check' }
          ].map(t => {
            const isActive = activeTab === t.id;
            return (
              <button 
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className="btn btn-link p-0 text-decoration-none d-flex flex-column align-items-center transition-all"
                style={{ 
                  color: isActive ? '#38bdf8' : '#64748b',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)'
                }}
              >
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center position-relative"
                  style={{
                    width: '30px',
                    height: '30px',
                    background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    marginBottom: '2px'
                  }}
                >
                  <i className={`ti ${t.icon} ${isActive ? 'fs-5 fw-bold text-cyan-300' : 'fs-5'}`} style={{ color: isActive ? '#38bdf8' : '#64748b' }}></i>
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: isActive ? '800' : '500', color: isActive ? '#ffffff' : '#64748b' }}>{t.label}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Smart Swap Modal (Available in Mobile App) */}
      <SmartSwapModal 
        isOpen={swapModalOpen}
        onClose={() => setSwapModalOpen(false)}
        selectedFoodItem={selectedFoodItem}
        swapCandidates={swapCandidates}
        swapLoading={swapLoading}
        onExecuteSwap={handleExecuteSwap}
      />
    </div>
  );
}
