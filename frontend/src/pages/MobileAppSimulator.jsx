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

      {/* Mobile Device Frame */}
      <div 
        className="card border-0 shadow-2xl overflow-hidden position-relative"
        style={{
          width: '390px',
          height: '790px',
          borderRadius: '46px',
          backgroundColor: '#f8fafc',
          border: '10px solid #1a2234',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.8)'
        }}
      >
        {/* Dynamic Island */}
        <div className="position-absolute top-0 start-50 translate-middle-x mt-2 bg-dark rounded-pill" style={{ width: '120px', height: '24px', zIndex: 100 }}></div>

        {/* App Top Bar */}
        <div className="pt-5 pb-3 px-3 bg-white border-bottom d-flex align-items-center justify-content-between" style={{ borderColor: '#f1f5f9' }}>
          <div className="d-flex align-items-center gap-2">
            <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '36px', height: '36px', background: '#f5f3ff', color: '#261c6a', border: '1.5px solid #ddd6fe', fontSize: '0.85rem' }}>
              {(user?.full_name || 'U')[0]}
            </div>
            <div>
              <h6 className="fw-bold text-dark mb-0 lh-1" style={{ fontSize: '0.92rem' }}>{user?.full_name || 'كيمو المحروقي'}</h6>
              <small className="text-muted" style={{ fontSize: '0.7rem' }}>كود المشترك: {user?.client_code || targetUserId}</small>
            </div>
          </div>
          <span className="badge rounded-pill px-2 py-1 fw-bold" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.68rem' }}>
            Z-ENGINE V2
          </span>
        </div>

        {/* App Scrollable Content */}
        <div className="flex-grow-1 overflow-auto p-3 custom-scroll" style={{ height: 'calc(100% - 145px)' }}>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
              <p className="text-muted small mt-2">جاري مزامنة التطبيق...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: HOME OVERVIEW */}
              {activeTab === 'home' && (
                <div>
                  {/* Coach Direct Notes Banner */}
                  {program?.coach_notes && (
                    <div className="p-3 mb-3 rounded-4 shadow-xs" style={{ backgroundColor: '#fbfaff', border: '1px solid #ede9fe', borderRight: '4px solid #261c6a' }}>
                      <div className="d-flex align-items-center gap-1 mb-1">
                        <span className="badge rounded-pill px-2" style={{ background: '#f5f3ff', color: '#261c6a', fontSize: '0.66rem', border: '1px solid #ddd6fe' }}>
                          توجيهات الكابتن 
                        </span>
                      </div>
                      <p className="small mb-0 text-dark fw-semibold" style={{ fontSize: '0.82rem', lineHeight: '1.5' }}>
                        {program.coach_notes}
                      </p>
                    </div>
                  )}

                  {/* Daily Target Macros Card (Clean legible typography) */}
                  <div className="card border-0 shadow-sm bg-white rounded-4 mb-3" style={{ border: '1px solid #e2e8f0' }}>
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.88rem' }}>طاقة وماكروز اليوم</h6>
                        <span className="badge rounded-pill fw-semibold" style={{ background: '#f5f3ff', color: '#261c6a', fontSize: '0.66rem', border: '1px solid #ddd6fe' }}>
                          المستهدف
                        </span>
                      </div>
                      <div className="row text-center g-2">
                        <div className="col-3">
                          <div className="p-2 rounded-3 border" style={{ background: '#fbfaff', borderColor: '#ede9fe' }}>
                            <div className="fw-bold" style={{ fontSize: '0.9rem', color: '#261c6a' }}>{caloriesTarget}</div>
                            <div className="text-muted" style={{ fontSize: '0.64rem' }}>سعرة</div>
                          </div>
                        </div>
                        <div className="col-3">
                          <div className="p-2 rounded-3 border" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                            <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>{proteinTarget}g</div>
                            <div className="text-muted" style={{ fontSize: '0.64rem' }}>بروتين</div>
                          </div>
                        </div>
                        <div className="col-3">
                          <div className="p-2 rounded-3 border" style={{ background: '#fffbeb', borderColor: '#fef3c7' }}>
                            <div className="fw-bold" style={{ fontSize: '0.9rem', color: '#d97706' }}>{carbsTarget}g</div>
                            <div className="text-muted" style={{ fontSize: '0.64rem' }}>كارب</div>
                          </div>
                        </div>
                        <div className="col-3">
                          <div className="p-2 rounded-3 border" style={{ background: '#ecfdf5', borderColor: '#d1fae5' }}>
                            <div className="fw-bold" style={{ fontSize: '0.9rem', color: '#059669' }}>{fatsTarget}g</div>
                            <div className="text-muted" style={{ fontSize: '0.64rem' }}>دهون</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Workout Action Card */}
                  <div 
                    onClick={() => setActiveTab('workout')}
                    className="card border-0 shadow-sm bg-white rounded-4 mb-3 p-3 transition-all"
                    style={{ cursor: 'pointer', border: '1px solid #e2e8f0' }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-3">
                        <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe' }}>
                          <i className="ti ti-barbell fs-5"></i>
                        </div>
                        <div>
                          <div className="fw-bold text-dark" style={{ fontSize: '0.86rem' }}>
                            {activeSession?.session_name || activeSession?.session_code || 'تمرين اليوم'}
                          </div>
                          <small className="text-muted" style={{ fontSize: '0.72rem' }}>{exercises.length} تمارين مبرمجة</small>
                        </div>
                      </div>
                      <i className="ti ti-chevron-left text-muted"></i>
                    </div>
                  </div>

                  {/* Check-in Action Card */}
                  <div 
                    onClick={() => setActiveTab('checkin')}
                    className="card border-0 shadow-sm bg-white rounded-4 p-3 transition-all"
                    style={{ cursor: 'pointer', border: '1px solid #e2e8f0' }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-3">
                        <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                          <i className="ti ti-clipboard-check fs-5"></i>
                        </div>
                        <div>
                          <div className="fw-bold text-dark" style={{ fontSize: '0.86rem' }}>المتابعة الأسبوعية</div>
                          <small className="text-muted" style={{ fontSize: '0.72rem' }}>تسجيل الأوزان وتحديث الخطة</small>
                        </div>
                      </div>
                      <i className="ti ti-chevron-left text-muted"></i>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: WORKOUT SCREEN */}
              {activeTab === 'workout' && (
                <div>
                  {/* Session Selector Chips */}
                  <div className="d-flex gap-2 overflow-auto pb-2 mb-2">
                    {sessions.map((sess, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSessionIdx(idx)}
                        className={`btn btn-sm rounded-pill px-3 fw-bold text-nowrap transition-all ${selectedSessionIdx === idx ? 'text-white shadow-xs' : 'bg-white text-dark border'}`}
                        style={{
                          background: selectedSessionIdx === idx ? '#261c6a' : '#ffffff',
                          borderColor: selectedSessionIdx === idx ? '#261c6a' : '#e2e8f0',
                          fontSize: '0.76rem',
                          height: '32px'
                        }}
                      >
                        {sess.session_name || sess.session_code || `تمرين ${idx + 1}`}
                      </button>
                    ))}
                  </div>

                  {/* Rest Timer Floating Toast */}
                  {restSeconds > 0 && (
                    <div className="p-2 rounded-3 mb-3 d-flex justify-content-between align-items-center text-white" style={{ background: '#261c6a' }}>
                      <div className="small fw-bold" style={{ fontSize: '0.78rem' }}>
                        <i className="ti ti-timer me-1"></i> الراحة المتبقية: {restSeconds} ثانية
                      </div>
                      <button onClick={() => setRestSeconds(0)} className="btn btn-sm btn-link p-0 text-white opacity-75">إلغاء</button>
                    </div>
                  )}

                  {/* Exercises List */}
                  <div className="d-flex flex-column gap-2">
                    {exercises.map((ex, exIdx) => {
                      const sets = ex.prescription?.sets || ex.sets || 3;
                      const reps = ex.prescription?.target_min || ex.reps || 10;
                      const rest = ex.prescription?.rest_seconds || ex.rest_seconds || 90;
                      const rir = ex.prescription?.target_rir !== undefined 
                        ? ex.prescription.target_rir 
                        : (ex.rir !== undefined ? ex.rir : 2);
                      const isDone = completedExercises[ex.exercise_code || exIdx];

                      return (
                        <div key={exIdx} className="card border-0 shadow-sm bg-white rounded-4 p-3" style={{ border: '1px solid #e2e8f0' }}>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div className="fw-bold text-dark" style={{ fontSize: '0.86rem' }}>{ex.name_en || ex.exercise_code?.replace(/_/g, ' ') || 'Exercise'}</div>
                              <small className="text-muted" style={{ fontSize: '0.74rem' }}>{getArabicExerciseName(ex)}</small>
                            </div>
                            <button 
                              onClick={() => toggleExercise(ex.exercise_code || exIdx)}
                              className={`btn btn-sm rounded-circle p-1 d-flex align-items-center justify-content-center transition-all ${isDone ? 'text-white' : 'border bg-white text-muted'}`}
                              style={{ width: '28px', height: '28px', background: isDone ? '#16a34a' : '#ffffff', borderColor: '#e2e8f0' }}
                            >
                              <i className={`ti ${isDone ? 'ti-check' : 'ti-circle'}`} style={{ fontSize: '0.75rem' }}></i>
                            </button>
                          </div>
                          
                          <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top" style={{ borderColor: '#f1f5f9' }}>
                            <div className="d-flex gap-1">
                              <span className="badge bg-light text-dark border" style={{ fontSize: '0.66rem' }}>{sets} مجموعات</span>
                              <span className="badge bg-light text-dark border" style={{ fontSize: '0.66rem' }}>{reps} تكرار</span>
                              <span className="badge bg-light text-dark border" style={{ fontSize: '0.66rem' }}>RIR {rir}</span>
                            </div>
                            <button 
                              onClick={() => setRestSeconds(rest)}
                              className="btn btn-sm rounded-pill py-0 px-2 fw-semibold"
                              style={{ fontSize: '0.7rem', background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', height: '24px' }}
                            >
                              <i className="ti ti-timer me-1"></i> {rest}ث
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: NUTRITION SCREEN WITH SMART SWAP (Clean readable text) */}
              {activeTab === 'nutrition' && (
                <div className="d-flex flex-column gap-3">
                  {meals.map((meal, mIdx) => (
                    <div key={mIdx} className="card border-0 shadow-sm bg-white rounded-4 overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                      <div className="p-3 border-bottom d-flex justify-content-between align-items-center" style={{ background: '#fbfaff', borderColor: '#ede9fe' }}>
                        <h6 className="fw-bold mb-0" style={{ fontSize: '0.88rem', color: '#261c6a' }}>{meal.name || `الوجبة ${meal.meal_number || (mIdx + 1)}`}</h6>
                        <span className="badge rounded-pill fw-semibold" style={{ background: '#f5f3ff', color: '#261c6a', fontSize: '0.66rem', border: '1px solid #ddd6fe' }}>
                          {meal.foods?.length || 0} أصناف
                        </span>
                      </div>
                      <div className="p-3 d-flex flex-column gap-2">
                        {meal.foods?.map((f, fIdx) => {
                          const grams = f.portion_g_rounded || f.grams || 100;
                          return (
                            <div key={fIdx} className="p-2 px-3 border rounded-3 bg-white d-flex justify-content-between align-items-center" style={{ borderColor: '#f1f5f9' }}>
                              <div>
                                <span className="fw-semibold text-dark d-block" style={{ fontSize: '0.82rem' }}>
                                  {f.name_ar || f.name_en || 'صنف'}
                                </span>
                                <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                                  الكمية: <strong className="text-dark fw-bold">{grams} جم</strong>
                                </small>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenSwapModal(mIdx, fIdx, f, meal.role)}
                                className="btn btn-sm rounded-pill px-2 py-0 fw-semibold d-flex align-items-center gap-1 shadow-xs"
                                style={{ fontSize: '0.72rem', background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', height: '26px' }}
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
                  ))}
                </div>
              )}

              {/* TAB 4: CHECKIN SCREEN */}
              {activeTab === 'checkin' && (
                <form onSubmit={handleCheckinSubmit}>
                  <div className="card border-0 shadow-sm bg-white rounded-4 p-3 mb-3" style={{ border: '1px solid #e2e8f0' }}>
                    <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '0.88rem' }}>أوزان الأيام الـ 7 على الريق</h6>
                    <small className="text-muted d-block mb-3" style={{ fontSize: '0.72rem' }}>سجل أوزانك اليومية بعد الاستيقاظ</small>
                    <div className="row g-2">
                      {weights.map((w, idx) => (
                        <div className="col-4" key={idx}>
                          <label className="text-muted small" style={{ fontSize: '0.66rem' }}>يوم {idx + 1}</label>
                          <input 
                            type="number" 
                            step="0.1" 
                            className="form-control form-control-sm text-center fw-semibold" 
                            style={{ height: '34px', borderRadius: '8px', fontSize: '0.8rem' }}
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

                  <div className="card border-0 shadow-sm bg-white rounded-4 p-3 mb-3" style={{ border: '1px solid #e2e8f0' }}>
                    <label className="fw-bold text-dark small mb-1" style={{ fontSize: '0.8rem' }}>محيط الخصر (سم)</label>
                    <input 
                      type="number" 
                      step="0.5" 
                      className="form-control form-control-sm mb-3" 
                      style={{ height: '34px', borderRadius: '8px', fontSize: '0.8rem' }}
                      value={waist}
                      onChange={(e) => setWaist(e.target.value)}
                    />

                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="fw-bold text-dark small" style={{ fontSize: '0.78rem' }}>الالتزام بالدايت: {adherence}%</label>
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
                    className="btn btn-sm rounded-pill w-100 fw-bold shadow-xs text-white d-flex align-items-center justify-content-center gap-1"
                    style={{ height: '38px', background: '#261c6a', border: 'none', fontSize: '0.82rem' }}
                  >
                    {submittingCheckin ? 'جاري الإرسال...' : <><i className="ti ti-send"></i> إرسال المتابعة للكابتن</>}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* App Bottom Navigation Bar */}
        <div className="bg-white border-top py-2 px-3 d-flex justify-content-around align-items-center position-absolute bottom-0 start-0 end-0" style={{ height: '65px', borderColor: '#f1f5f9' }}>
          {[
            { id: 'home', label: 'الرئيسية', icon: 'ti-layout-dashboard' },
            { id: 'workout', label: 'التمارين', icon: 'ti-barbell' },
            { id: 'nutrition', label: 'الوجبات', icon: 'ti-salad' },
            { id: 'checkin', label: 'المتابعة', icon: 'ti-clipboard-check' }
          ].map(t => (
            <button 
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="btn btn-link p-0 text-decoration-none d-flex flex-column align-items-center transition-all"
              style={{ color: activeTab === t.id ? '#261c6a' : '#94a3b8' }}
            >
              <i className={`ti ${t.icon} fs-5`}></i>
              <span style={{ fontSize: '0.68rem', fontWeight: activeTab === t.id ? '700' : '500' }}>{t.label}</span>
            </button>
          ))}
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
