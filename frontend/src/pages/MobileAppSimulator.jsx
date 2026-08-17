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

  const nutrition = program?.nutrition_program || {};
  const stages = nutrition.stages || {};
  const energyTarget = stages.energy_target || {};
  const macroTargets = stages.macro_targets || {};
  const mealDist = stages.meal_distribution?.daily_targets || {};
  const portionTarget = stages.portion_solver?.daily_target || {};
  const directTargets = program?.adapted_nutrition || nutrition.targets || nutrition.macro_targets || {};

  const mealsSum = (nutrition.quantized_plan?.meals || []).reduce((acc, m) => {
    acc.calories += (m.totals?.calories_kcal || m.target?.planned_calories || 0);
    acc.protein += (m.totals?.protein_g || 0);
    acc.carbs += (m.totals?.carbohydrate_g || 0);
    acc.fats += (m.totals?.fat_g || 0);
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const caloriesTarget = Math.round(
    energyTarget.target_calories ||
    macroTargets.target_calories ||
    mealDist.target_calories ||
    portionTarget.calories_kcal ||
    directTargets.target_calories_kcal ||
    directTargets.calories_kcal ||
    (mealsSum.calories > 0 ? mealsSum.calories : 2200)
  );

  const proteinTarget = Math.round(
    macroTargets.protein?.target_g ||
    mealDist.protein_g ||
    portionTarget.protein_g ||
    directTargets.protein_g ||
    (mealsSum.protein > 0 ? mealsSum.protein : 130)
  );

  const carbsTarget = Math.round(
    macroTargets.carbohydrate?.target_g ||
    mealDist.carbohydrate_g ||
    portionTarget.carbohydrate_g ||
    directTargets.carbohydrate_g ||
    directTargets.carbs_g ||
    (mealsSum.carbs > 0 ? mealsSum.carbs : 350)
  );

  const fatsTarget = Math.round(
    macroTargets.fat?.target_g ||
    mealDist.fat_g ||
    portionTarget.fat_g ||
    directTargets.fat_g ||
    directTargets.fats_g ||
    (mealsSum.fats > 0 ? mealsSum.fats : 70)
  );

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

      {/* Mobile Device Frame (Uplifting Bright Luxury / Apple Fitness & Nike Training Aesthetic) */}
      <div 
        className="card border-0 shadow-2xl overflow-hidden position-relative"
        style={{
          width: '390px',
          height: '790px',
          borderRadius: '46px',
          backgroundColor: '#f8fafc',
          border: '10px solid #1e293b',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(38, 28, 106, 0.2)',
          color: '#0f172a'
        }}
      >
        {/* Dynamic Island */}
        <div className="position-absolute top-0 start-50 translate-middle-x mt-2 bg-dark rounded-pill" style={{ width: '120px', height: '24px', zIndex: 100 }}></div>

        {/* App Top Bar (Quiet Luxury Header matching Image 2) */}
        <div 
          className="pt-5 pb-3 px-3 d-flex align-items-center justify-content-between position-relative bg-white" 
          style={{ 
            borderBottom: '1px solid #f1f5f9',
            boxShadow: '0 1px 6px rgba(0, 0, 0, 0.02)',
            zIndex: 10
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0" 
              style={{ 
                width: '38px', 
                height: '38px', 
                background: 'linear-gradient(135deg, #261c6a 0%, #4338ca 100%)', 
                color: '#ffffff', 
                border: '2px solid #ede9fe', 
                fontSize: '0.92rem',
                boxShadow: '0 2px 8px rgba(38, 28, 106, 0.15)'
              }}
            >
              {(user?.full_name || 'U')[0]}
            </div>
            <div>
              <h6 className="fw-bold text-dark mb-0 lh-1" style={{ fontSize: '0.94rem', letterSpacing: '-0.3px', color: '#1e144f' }}>
                {user?.full_name || 'كابتن أحمد سمير'}
              </h6>
              <small className="text-muted" style={{ fontSize: '0.68rem' }}>كود المتدرب: <span className="font-monospace text-dark fw-bold">{user?.client_code || targetUserId}</span></small>
            </div>
          </div>
          
          <div className="d-flex align-items-center gap-1">
            <span 
              className="badge rounded-pill px-2 py-1 fw-bold" 
              style={{ 
                background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', 
                color: '#261c6a', 
                border: '1px solid #ddd6fe', 
                fontSize: '0.68rem'
              }}
            >
              Z-ENGINE V2
            </span>
          </div>
        </div>

        {/* App Scrollable Content (Calm, Soft, Luxurious matching Image 2) */}
        <div 
          className="flex-grow-1 overflow-auto p-3 custom-scroll" 
          style={{ 
            height: 'calc(100% - 145px)',
            background: 'linear-gradient(180deg, #f8faff 0%, #f4f6fb 100%)'
          }}
        >
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
              <p className="text-muted small mt-2">جاري مزامنة خطة المتدرب...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: HOME OVERVIEW */}
              {activeTab === 'home' && (
                <div className="d-flex flex-column gap-3">
                  
                  {/* 1. Calm Hero Card (Exact Twin of UserWelcomeHero in Image 2) */}
                  <div 
                    className="card border-0 rounded-4 position-relative overflow-hidden shadow-sm" 
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,243,255,0.85) 60%, rgba(236,253,245,0.7) 100%)',
                      border: '1px solid rgba(221, 214, 254, 0.5)',
                      boxShadow: '0 4px 16px rgba(38, 28, 106, 0.04)'
                    }}
                  >
                    {/* Subtle Right Gradient Bar */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bottom: 0,
                      width: '4px',
                      background: 'linear-gradient(180deg, #261c6a 0%, #06b6d4 50%, #10b981 100%)',
                      borderRadius: '0 16px 16px 0'
                    }}></div>

                    <div className="card-body p-3">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '1rem', letterSpacing: '-0.3px', color: '#1e144f' }}>
                          مساء الخير يا كابتن {user?.full_name?.split(' ')[0] || 'أحمد'}!
                        </h6>
                        <span className="badge rounded-pill fw-bold" style={{ 
                          background: '#ecfdf5', 
                          color: '#059669', 
                          border: '1px solid #a7f3d0', 
                          fontSize: '0.62rem' 
                        }}>
                          مفعل بنجاح ✓
                        </span>
                      </div>

                      <p className="mb-2 fw-semibold" style={{ 
                        fontSize: '0.78rem', 
                        color: '#4338ca',
                        lineHeight: '1.5'
                      }}>
                        التغيير الحقيقي بيحصل لما بتتحدى نفسك كل يوم
                      </p>

                      <p className="text-muted mb-2 small" style={{ fontSize: '0.72rem', lineHeight: '1.4' }}>
                        خطة الميزوسايكل المخصصة (الأسبوع 1 / مرحلة: التراكم) جاهزة. مستوى الجهد: <strong className="text-dark">3 RIR</strong>.
                      </p>

                      {/* Quiet Luxury Badges */}
                      <div className="d-flex gap-1 flex-wrap">
                        <span className="badge rounded-pill px-2 py-1 fw-semibold d-flex align-items-center gap-1" style={{ 
                          background: '#f5f3ff', 
                          color: '#261c6a', 
                          border: '1px solid #ddd6fe', 
                          fontSize: '0.66rem' 
                        }}>
                          <i className="ti ti-crown"></i> بناء عضلي وحرق دهون
                        </span>

                        <span className="badge rounded-pill px-2 py-1 fw-semibold d-flex align-items-center gap-1" style={{ 
                          background: '#ecfeff', 
                          color: '#0891b2', 
                          border: '1px solid #a5f3fc', 
                          fontSize: '0.66rem' 
                        }}>
                          <i className="ti ti-barbell"></i> جيم تجاري كامل
                        </span>

                        <span className="badge rounded-pill px-2 py-1 fw-semibold d-flex align-items-center gap-1" style={{ 
                          background: '#ecfdf5', 
                          color: '#059669', 
                          border: '1px solid #a7f3d0', 
                          fontSize: '0.66rem' 
                        }}>
                          <i className="ti ti-shoe"></i> 8,000 خطوة
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Coach Direct Notes Banner (Clean Quiet Luxury Card - No Yellow!) */}
                  {program?.coach_notes && (
                    <div 
                      className="p-3 rounded-4 bg-white position-relative overflow-hidden" 
                      style={{ 
                        border: '1px solid #ede9fe', 
                        borderRight: '3.5px solid #6366f1',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)'
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="badge rounded-pill px-2 py-1 fw-bold" style={{ background: '#f5f3ff', color: '#4338ca', fontSize: '0.66rem', border: '1px solid #ddd6fe' }}>
                          توجيهات الكابتن للأسبوع
                        </span>
                        <small className="text-muted" style={{ fontSize: '0.64rem' }}>ملاحظات الخطة</small>
                      </div>
                      <p className="small mb-0 text-dark fw-semibold" style={{ fontSize: '0.82rem', lineHeight: '1.5', color: '#1e293b' }}>
                        {program.coach_notes}
                      </p>
                    </div>
                  )}

                  {/* 2. Daily Energy & Macro Target Hub (Clean Light Card) */}
                  <div 
                    className="card border-0 bg-white rounded-4 overflow-hidden" 
                    style={{ 
                      boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div className="card-body p-3">
                      {/* Calories Top Bar */}
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center gap-2">
                          <div 
                            className="rounded-circle d-flex align-items-center justify-content-center" 
                            style={{ width: '32px', height: '32px', background: '#f5f3ff', color: '#261c6a', border: '1px solid #ede9fe' }}
                          >
                            <i className="ti ti-flame fs-5"></i>
                          </div>
                          <div>
                            <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.9rem', letterSpacing: '-0.3px' }}>
                              احتياج الطاقة والماكروز
                            </h6>
                            <small className="text-muted" style={{ fontSize: '0.68rem' }}>موزونة لتعظيم البناء العضلي</small>
                          </div>
                        </div>

                        <div className="text-end">
                          <span className="fw-black text-dark d-block lh-1" style={{ fontSize: '1.15rem', fontWeight: '900', color: '#261c6a' }}>
                            {caloriesTarget}
                          </span>
                          <span className="text-muted" style={{ fontSize: '0.64rem' }}>سعرة مستهدفة</span>
                        </div>
                      </div>

                      {/* 3 Macro Cards with Clean Saturated Identity */}
                      <div className="row g-2 text-center">
                        {/* Protein */}
                        <div className="col-4">
                          <div 
                            className="p-2 rounded-3 d-flex flex-column justify-content-between h-100" 
                            style={{ 
                              background: '#f0f9ff', 
                              border: '1px solid #bae6fd' 
                            }}
                          >
                            <span className="fw-bold" style={{ fontSize: '0.68rem', color: '#0369a1' }}>البروتين</span>
                            <div className="fw-black my-1" style={{ fontSize: '1.15rem', color: '#0284c7', fontWeight: '900' }}>
                              {proteinTarget}<span className="fs-6 fw-bold">g</span>
                            </div>
                            <div className="progress" style={{ height: '4px', background: '#bae6fd' }}>
                              <div className="progress-bar" style={{ width: '85%', background: '#0284c7' }}></div>
                            </div>
                          </div>
                        </div>

                        {/* Carbs */}
                        <div className="col-4">
                          <div 
                            className="p-2 rounded-3 d-flex flex-column justify-content-between h-100" 
                            style={{ 
                              background: '#fffbeb', 
                              border: '1px solid #fde68a' 
                            }}
                          >
                            <span className="fw-bold" style={{ fontSize: '0.68rem', color: '#b45309' }}>الكارب</span>
                            <div className="fw-black my-1" style={{ fontSize: '1.15rem', color: '#d97706', fontWeight: '900' }}>
                              {carbsTarget}<span className="fs-6 fw-bold">g</span>
                            </div>
                            <div className="progress" style={{ height: '4px', background: '#fde68a' }}>
                              <div className="progress-bar" style={{ width: '70%', background: '#f59e0b' }}></div>
                            </div>
                          </div>
                        </div>

                        {/* Fats */}
                        <div className="col-4">
                          <div 
                            className="p-2 rounded-3 d-flex flex-column justify-content-between h-100" 
                            style={{ 
                              background: '#f0fdf4', 
                              border: '1px solid #bbf7d0' 
                            }}
                          >
                            <span className="fw-bold" style={{ fontSize: '0.68rem', color: '#15803d' }}>الدهون</span>
                            <div className="fw-black my-1" style={{ fontSize: '1.15rem', color: '#059669', fontWeight: '900' }}>
                              {fatsTarget}<span className="fs-6 fw-bold">g</span>
                            </div>
                            <div className="progress" style={{ height: '4px', background: '#bbf7d0' }}>
                              <div className="progress-bar" style={{ width: '60%', background: '#10b981' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Today's Workout Card (Clean White/Lavender Card - Calm & Premium) */}
                  <div 
                    className="card border-0 bg-white rounded-4 overflow-hidden" 
                    style={{ 
                      boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
                      border: '1px solid #e2e8f0',
                      borderTop: '3.5px solid #261c6a'
                    }}
                  >
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <div 
                            className="rounded-3 d-flex align-items-center justify-content-center" 
                            style={{ width: '36px', height: '36px', background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe' }}
                          >
                            <i className="ti ti-barbell fs-5"></i>
                          </div>
                          <div>
                            <span className="badge rounded-pill fw-bold px-2 py-0 mb-1" style={{ background: '#f5f3ff', color: '#261c6a', fontSize: '0.64rem' }}>
                              تمرين اليوم الأساسي
                            </span>
                            <h5 className="fw-bold text-dark mb-0" style={{ fontSize: '0.98rem', letterSpacing: '-0.3px', color: '#261c6a' }}>
                              {activeSession?.session_name || activeSession?.session_code || 'UPPER_A'}
                            </h5>
                          </div>
                        </div>

                        <span className="badge rounded-pill px-2 py-1 fw-bold" style={{ background: '#ecfeff', color: '#0891b2', border: '1px solid #a5f3fc', fontSize: '0.66rem' }}>
                          3 RIR جهود
                        </span>
                      </div>

                      <div className="d-flex align-items-center justify-content-between mt-3 pt-2 border-top" style={{ borderColor: '#f1f5f9' }}>
                        <div className="small text-muted" style={{ fontSize: '0.74rem' }}>
                          <span className="text-dark fw-bold">{exercises.length}</span> تمارين • <span className="text-dark fw-bold">45</span> دقيقة
                        </div>

                        <button 
                          onClick={() => setActiveTab('workout')}
                          className="btn btn-sm rounded-pill px-3 py-1 fw-bold d-flex align-items-center gap-1 shadow-xs text-white"
                          style={{ background: 'linear-gradient(135deg, #261c6a 0%, #4338ca 100%)', border: 'none', fontSize: '0.78rem' }}
                        >
                          <span>بدء الجلسة الآن</span>
                          <i className="ti ti-arrow-left"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 4. Delicious Today's Meals Hub (Clean Fresh Card) */}
                  <div 
                    className="card border-0 bg-white rounded-4 overflow-hidden" 
                    style={{ 
                      boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
                      border: '1px solid #e2e8f0',
                      borderTop: '3.5px solid #059669'
                    }}
                  >
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center gap-2">
                          <div 
                            className="rounded-circle d-flex align-items-center justify-content-center" 
                            style={{ width: '32px', height: '32px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}
                          >
                            <i className="ti ti-salad fs-5"></i>
                          </div>
                          <div>
                            <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.9rem' }}>
                              جدول الوجبات والبدائل
                            </h6>
                            <small className="text-muted" style={{ fontSize: '0.68rem' }}>3 وجبات رئيسية موزونة لتغطية الماكروز</small>
                          </div>
                        </div>

                        <button 
                          onClick={() => setActiveTab('nutrition')}
                          className="btn btn-sm rounded-pill px-2 py-0 fw-bold"
                          style={{ background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0', fontSize: '0.72rem', height: '26px' }}
                        >
                          عرض الكل ←
                        </button>
                      </div>

                      {/* 3 Meals Mini Ribbon */}
                      <div className="d-flex flex-column gap-2">
                        {meals.slice(0, 3).map((m, mIdx) => (
                          <div 
                            key={mIdx} 
                            onClick={() => setActiveTab('nutrition')}
                            className="p-2 px-3 rounded-3 d-flex justify-content-between align-items-center cursor-pointer transition-all"
                            style={{ 
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              cursor: 'pointer'
                            }}
                          >
                            <div className="d-flex align-items-center gap-2">
                              <span 
                                className="rounded-circle d-inline-block" 
                                style={{ width: '8px', height: '8px', background: mIdx === 0 ? '#f59e0b' : mIdx === 1 ? '#10b981' : '#6366f1' }}
                              ></span>
                              <span className="fw-bold text-dark" style={{ fontSize: '0.82rem' }}>
                                {mIdx === 0 ? 'وجبة الإفطار' : mIdx === 1 ? 'وجبة الغداء' : 'وجبة العشاء'}
                              </span>
                              <small className="text-muted" style={{ fontSize: '0.68rem' }}>({m.foods?.length || 0} أصناف)</small>
                            </div>

                            <span className="fw-bold font-monospace text-dark" style={{ fontSize: '0.78rem' }}>
                              ~{Math.round(m.totals?.calories_kcal || m.target?.planned_calories || 700)} سعرة
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 5. Weekly Checkin Status Bar (Fresh Mint Card) */}
                  <div 
                    onClick={() => setActiveTab('checkin')}
                    className="card border-0 bg-white rounded-4 p-3 transition-all cursor-pointer shadow-sm"
                    style={{ 
                      border: '1px solid #e2e8f0',
                      borderRight: '3.5px solid #10b981',
                      cursor: 'pointer'
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-3">
                        <div 
                          className="rounded-3 d-flex align-items-center justify-content-center" 
                          style={{ width: '36px', height: '36px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}
                        >
                          <i className="ti ti-clipboard-check fs-5"></i>
                        </div>
                        <div>
                          <div className="fw-bold text-dark" style={{ fontSize: '0.88rem' }}>المتابعة الأسبوعية</div>
                          <small className="text-muted d-block" style={{ fontSize: '0.72rem' }}>
                            سجل أوزانك وتحديث مقاساتك مع الكابتن
                          </small>
                        </div>
                      </div>
                      <span className="badge rounded-pill px-3 py-1 fw-bold" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: '0.72rem' }}>
                        تسجيل الآن ←
                      </span>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: WORKOUT SCREEN (Bright Crisp Gym Mode) */}
              {activeTab === 'workout' && (
                <div className="d-flex flex-column gap-3">
                  {/* Session Selector Chips */}
                  <div className="d-flex gap-2 overflow-auto pb-1">
                    {sessions.map((sess, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSessionIdx(idx)}
                        className={`btn btn-sm rounded-pill px-3 fw-bold text-nowrap transition-all ${selectedSessionIdx === idx ? 'text-white shadow-sm' : 'bg-white text-dark border'}`}
                        style={{
                          background: selectedSessionIdx === idx ? 'linear-gradient(135deg, #261c6a 0%, #4c1d95 100%)' : '#ffffff',
                          borderColor: selectedSessionIdx === idx ? 'transparent' : '#e2e8f0',
                          fontSize: '0.78rem',
                          height: '36px'
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
                        background: 'linear-gradient(135deg, #261c6a 0%, #06b6d4 100%)',
                        boxShadow: '0 8px 25px rgba(6, 182, 212, 0.35)'
                      }}
                    >
                      <div className="small fw-bold d-flex align-items-center gap-2" style={{ fontSize: '0.88rem' }}>
                        <i className="ti ti-timer fs-5"></i>
                        <span>الراحة المتبقية: <strong>{restSeconds}</strong> ثانية</span>
                      </div>
                      <button onClick={() => setRestSeconds(0)} className="btn btn-sm btn-light rounded-pill px-3 py-1 fw-bold" style={{ fontSize: '0.74rem' }}>إلغاء</button>
                    </div>
                  )}

                  {/* Exercises List with Technique Video and Crisp Checkmarks */}
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
                          className="card border-0 rounded-4 p-3 transition-all bg-white" 
                          style={{ 
                            border: isDone ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                            boxShadow: isDone ? '0 4px 15px rgba(16, 185, 129, 0.1)' : '0 2px 10px rgba(0,0,0,0.02)',
                            background: isDone ? 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)' : '#ffffff'
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
                                <span className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>{enName}</span>
                                <i className="ti ti-video text-danger fs-6" title="فيديو شرح التمرين"></i>
                              </a>
                              <small className="text-muted d-block" style={{ fontSize: '0.76rem' }}>{arName}</small>
                            </div>
                            
                            <button 
                              onClick={() => toggleExercise(ex.exercise_code || exIdx)}
                              className={`btn btn-sm rounded-circle p-1 d-flex align-items-center justify-content-center transition-all flex-shrink-0 ${isDone ? 'text-white shadow-xs' : 'border bg-light text-muted'}`}
                              style={{ 
                                width: '34px', 
                                height: '34px', 
                                background: isDone ? '#10b981' : '#f8fafc', 
                                borderColor: isDone ? '#10b981' : '#cbd5e1' 
                              }}
                              title={isDone ? 'تم إكمال التمرين' : 'اضغط لتحديد الإكمال'}
                            >
                              <i className={`ti ${isDone ? 'ti-check fs-6 fw-bold' : 'ti-circle'}`}></i>
                            </button>
                          </div>
                          
                          <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top" style={{ borderColor: isDone ? '#bbf7d0' : '#f1f5f9' }}>
                            <div className="d-flex gap-1 flex-wrap">
                              <span className="badge rounded-pill px-2 py-1 fw-bold" style={{ background: '#f5f3ff', color: '#261c6a', fontSize: '0.68rem', border: '1px solid #ddd6fe' }}>
                                {sets} مجموعات
                              </span>
                              <span className="badge rounded-pill px-2 py-1 fw-bold" style={{ background: '#eff6ff', color: '#0284c7', fontSize: '0.68rem', border: '1px solid #bae6fd' }}>
                                {reps} تكرار
                              </span>
                              <span className="badge rounded-pill px-2 py-1 fw-bold" style={{ background: '#fefce8', color: '#ca8a04', fontSize: '0.68rem', border: '1px solid #fde68a' }}>
                                RIR {rir}
                              </span>
                            </div>
                            <button 
                              onClick={() => setRestSeconds(rest)}
                              className="btn btn-sm rounded-pill py-0 px-2 fw-bold d-flex align-items-center gap-1 shadow-xs"
                              style={{ fontSize: '0.72rem', background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', height: '26px' }}
                            >
                              <i className="ti ti-timer"></i> <span>{rest}ث راحة</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: NUTRITION SCREEN (Appetizing Fresh Meals Hub) */}
              {activeTab === 'nutrition' && (
                <div className="d-flex flex-column gap-3">
                  {meals.map((meal, mIdx) => {
                    const mealTheme = mIdx === 0 
                      ? { bg: '#fffbeb', border: '#f59e0b', color: '#d97706', label: 'الوجبة 1 (الإفطار)' }
                      : mIdx === 1
                      ? { bg: '#ecfdf5', border: '#10b981', color: '#059669', label: 'الوجبة 2 (الغداء)' }
                      : { bg: '#f5f3ff', border: '#261c6a', color: '#261c6a', label: 'الوجبة 3 (العشاء)' };

                    return (
                      <div 
                        key={mIdx} 
                        className="card border-0 shadow-sm bg-white rounded-4 overflow-hidden" 
                        style={{ 
                          border: '1px solid #edf2f7',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                        }}
                      >
                        <div 
                          className="p-3 border-bottom d-flex justify-content-between align-items-center" 
                          style={{ 
                            background: `linear-gradient(135deg, #ffffff 0%, ${mealTheme.bg} 100%)`, 
                            borderTop: `4px solid ${mealTheme.border}`,
                            borderColor: '#ede9fe' 
                          }}
                        >
                          <div>
                            <h6 className="fw-bold mb-0" style={{ fontSize: '0.92rem', color: mealTheme.color }}>
                              {mealTheme.label}
                            </h6>
                            <small className="text-muted" style={{ fontSize: '0.68rem' }}>موزونة قبل / بعد الطهي</small>
                          </div>
                          <span 
                            className="badge rounded-pill fw-bold px-2 py-1" 
                            style={{ 
                              background: mealTheme.bg, 
                              color: mealTheme.color, 
                              fontSize: '0.7rem', 
                              border: `1px solid ${mealTheme.border}40` 
                            }}
                          >
                            {meal.foods?.length || 0} أصناف
                          </span>
                        </div>

                        <div className="p-3 d-flex flex-column gap-2" style={{ background: '#fafbff' }}>
                          {meal.foods?.map((f, fIdx) => {
                            const grams = f.portion_g_rounded || f.grams || 100;
                            return (
                              <div 
                                key={fIdx} 
                                className="p-2 px-3 border rounded-3 bg-white d-flex justify-content-between align-items-center shadow-xs" 
                                style={{ borderColor: '#edf2f7' }}
                              >
                                <div>
                                  <span className="fw-bold text-dark d-block" style={{ fontSize: '0.86rem' }}>
                                    {f.name_ar || f.name_en || 'صنف غذائي'}
                                  </span>
                                  <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                                    الكمية: <strong className="text-dark fw-bold">{grams} جرام</strong>
                                  </small>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenSwapModal(mIdx, fIdx, f, meal.role)}
                                  className="btn btn-sm rounded-pill px-2 py-0 fw-bold d-flex align-items-center gap-1 shadow-xs"
                                  style={{ 
                                    fontSize: '0.74rem', 
                                    background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', 
                                    color: '#261c6a', 
                                    border: '1px solid #ddd6fe', 
                                    height: '28px' 
                                  }}
                                  title="تبديل الصنف ببديل مكافئ"
                                >
                                  <i className="ti ti-arrows-exchange"></i>
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

              {/* TAB 4: CHECKIN SCREEN (Fresh Clean Form) */}
              {activeTab === 'checkin' && (
                <form onSubmit={handleCheckinSubmit} className="d-flex flex-column gap-3">
                  <div className="card border-0 bg-white shadow-sm rounded-4 p-3" style={{ border: '1px solid #e2e8f0' }}>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', background: '#ecfdf5', color: '#059669' }}>
                        <i className="ti ti-scale fs-6"></i>
                      </div>
                      <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.9rem' }}>أوزان الأيام الـ 7 على الريق</h6>
                    </div>
                    <small className="text-muted d-block mb-3" style={{ fontSize: '0.72rem' }}>سجل أوزانك الصباحية بعد الاستيقاظ مباشرة</small>
                    
                    <div className="row g-2">
                      {weights.map((w, idx) => (
                        <div className="col-4" key={idx}>
                          <label className="text-muted small d-block mb-1" style={{ fontSize: '0.66rem' }}>يوم {idx + 1}</label>
                          <input 
                            type="number" 
                            step="0.1" 
                            className="form-control form-control-sm text-center fw-bold text-dark" 
                            style={{ height: '36px', borderRadius: '8px', fontSize: '0.84rem', borderColor: '#cbd5e1', background: '#f8fafc' }}
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

                  <div className="card border-0 bg-white shadow-sm rounded-4 p-3" style={{ border: '1px solid #e2e8f0' }}>
                    <label className="fw-bold text-dark small mb-1" style={{ fontSize: '0.84rem' }}>محيط الخصر (سم)</label>
                    <input 
                      type="number" 
                      step="0.5" 
                      className="form-control form-control-sm mb-3 fw-bold" 
                      style={{ height: '38px', borderRadius: '8px', fontSize: '0.86rem', borderColor: '#cbd5e1' }}
                      value={waist}
                      onChange={(e) => setWaist(e.target.value)}
                    />

                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="fw-bold text-dark small" style={{ fontSize: '0.82rem' }}>نسبة الالتزام بالدايت: <strong className="text-success">{adherence}%</strong></label>
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
                      background: 'linear-gradient(135deg, #261c6a 0%, #4c1d95 100%)', 
                      border: 'none', 
                      fontSize: '0.88rem',
                      boxShadow: '0 4px 15px rgba(38, 28, 106, 0.3)'
                    }}
                  >
                    {submittingCheckin ? 'جاري الإرسال...' : <><i className="ti ti-send"></i> إرسال المتابعة للكابتن</>}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* App Bottom Navigation Bar (Bright White Floating Bar) */}
        <div 
          className="bg-white border-top py-2 px-3 d-flex justify-content-around align-items-center position-absolute bottom-0 start-0 end-0 shadow-lg" 
          style={{ 
            height: '66px', 
            borderColor: '#f1f5f9',
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
                  color: isActive ? '#261c6a' : '#94a3b8',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)'
                }}
              >
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: '32px',
                    height: '32px',
                    background: isActive ? '#f5f3ff' : 'transparent',
                    marginBottom: '2px'
                  }}
                >
                  <i className={`ti ${t.icon} ${isActive ? 'fs-5 fw-bold text-primary' : 'fs-5'}`}></i>
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: isActive ? '800' : '500' }}>{t.label}</span>
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

