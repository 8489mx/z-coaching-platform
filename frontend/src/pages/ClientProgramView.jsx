import React, { useState, useEffect } from "react";
import { getArabicExerciseName } from "../utils/exerciseTranslator";
import { API_BASE } from "../config/api";

export default function ClientProgramView() {
 const [activeTab, setActiveTab] = useState("nutrition"); // 'nutrition' | 'training' | 'cardio' | 'checkin'
 const [loading, setLoading] = useState(false);
 const [program, setProgram] = useState(null);
 const [error, setError] = useState(null);

 // Smart Swap Modal State
 const [swapModalOpen, setSwapModalOpen] = useState(false);
 const [activeMealIndex, setActiveMealIndex] = useState(null);
 const [activeFoodIndex, setActiveFoodIndex] = useState(null);
 const [selectedFoodItem, setSelectedFoodItem] = useState(null);
 const [swapCandidates, setSwapCandidates] = useState([]);
 const [swapLoading, setSwapLoading] = useState(false);

 // Checkin Wizard State
 const [checkinForm, setCheckinForm] = useState({
 weekNumber: 1,
 weightDay1: 90.0,
 weightDay2: 89.8,
 weightDay3: 89.7,
 weightDay4: 89.5,
 weightDay5: 89.4,
 weightDay6: 89.3,
 weightDay7: 89.2,
 waistCm: 93.0,
 nutritionAdherence: 95,
 workoutsCompleted: 4,
 workoutsScheduled: 4,
 hungerLevel: 2,
 energyInGym: 4,
 sleepQuality: 4,
 stressLevel: 2,
 painJoint: "NONE",
 });
 const [checkinResult, setCheckinResult] = useState(null);

 // Load client program
 useEffect(() => {
 fetchInitialPlan();
 }, []);

 const fetchInitialPlan = async () => {
 try {
 setLoading(true);
 setError(null);

 const sampleIntake = {
 personal: {
 dateOfBirth: "1995-05-15",
 sex: "MALE",
 residenceCountry: "EG",
 },
 goals: {
 primary: "FAT_LOSS",
 secondaryTraining: "MUSCLE_HYPERTROPHY",
 },
 body: {
 heightCm: 178,
 weightKg: 90.0,
 waistCm: 94.0,
 weightTrend: "STABLE",
 },
 lifestyle: {
 dailyActivity: "MODERATE",
 sleep: { averageHours: 7.5, quality: "GOOD" },
 stressLevel: "LOW",
 },
 medical: { conditions: [], dangerousSymptoms: {}, medications: [] },
 nutrition: {
 preferredMealCount: 3,
 budget: "MEDIUM",
 foodStorageAvailable: true,
 foodReheatingAvailable: true,
 allergies: [],
 dislikedFoods: [],
 },
 training: {
 location: "COMMERCIAL_GYM",
 equipment: [
 { equipmentCode: "BARBELL_AND_PLATES", loadCapacity: "HEAVY" },
 { equipmentCode: "SQUAT_RACK", loadCapacity: "HEAVY" },
 { equipmentCode: "ADJUSTABLE_BENCH", loadCapacity: "HEAVY" },
 { equipmentCode: "DUMBBELLS", loadCapacity: "HEAVY" },
 { equipmentCode: "CABLE_STATION", loadCapacity: "HEAVY" },
 ],
 preferredDaysPerWeek: 4,
 maxDaysPerWeek: 4,
 trainingScheduleAvailabilityType: "FLEXIBLE",
 availableTrainingDays: ["MONDAY", "WEDNESDAY", "FRIDAY", "SATURDAY"],
 experience: "INTERMEDIATE",
 recentTraining: "CONSISTENT_LAST_6_MONTHS",
 injuries: [],
 },
 cardio: {
 averageDailySteps: 8000,
 maxSessionsPerWeek: 2,
 maxDurationMinutes: 30,
 },
 };

 const response = await fetch(`${API_BASE}/api/v1/programs/generate-preview`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(sampleIntake),
 });

 const data = await response.json();
 if (!response.ok) throw new Error(data.error || "Failed to load program");

 setProgram(data.master_program);
 } catch (err) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 };

 // Open Smart Swap Modal
 const handleOpenSwapModal = async (mealIdx, foodIdx, foodItem, mealRole) => {
 try {
 setActiveMealIndex(mealIdx);
 setActiveFoodIndex(foodIdx);
 setSelectedFoodItem(foodItem);
 setSwapModalOpen(true);
 setSwapLoading(true);

 const res = await fetch(`${API_BASE}/api/v1/programs/swap-candidates`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 food_code: foodItem.food_code,
 meal_context: mealRole || (mealIdx === 0 ? "BREAKFAST" : "MAIN_MEAL"),
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

 // Execute Smart Swap
 const handleExecuteSwap = async (targetFoodCode) => {
 try {
 setSwapLoading(true);
 const res = await fetch(`${API_BASE}/api/v1/programs/swap-food`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 source_food_code: selectedFoodItem.food_code,
 source_grams: selectedFoodItem.portion_g_rounded || selectedFoodItem.grams || 100,
 target_food_code: targetFoodCode,
 meal_context: activeMealIndex === 0 ? "BREAKFAST" : "MAIN_MEAL",
 }),
 });

 const data = await res.json();
 if (!res.ok) throw new Error(data.error || "Swap failed");

 const updatedProgram = JSON.parse(JSON.stringify(program));
 const targetMeal = updatedProgram.nutrition_program.quantized_plan.meals[activeMealIndex];
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

 setProgram(updatedProgram);
 setSwapModalOpen(false);
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
 const dailyWeights = [
 Number(checkinForm.weightDay1),
 Number(checkinForm.weightDay2),
 Number(checkinForm.weightDay3),
 Number(checkinForm.weightDay4),
 Number(checkinForm.weightDay5),
 Number(checkinForm.weightDay6),
 Number(checkinForm.weightDay7),
 ];

 const painReports =
 checkinForm.painJoint !== "NONE"
 ? [
 {
 body_part: checkinForm.painJoint,
 severity: "MODERATE",
 during_exercise: "BARBELL_BENCH_PRESS",
 },
 ]
 : [];

 const payload = {
 client_id: user?.client_code || targetUserId || '',
 week_number: Number(checkinForm.weekNumber),
 daily_weights_kg: dailyWeights,
 previous_average_weight_kg: 90.0,
 waist_circumference_cm: Number(checkinForm.waistCm),
 nutrition_adherence_percent: Number(checkinForm.nutritionAdherence),
 workouts_completed: Number(checkinForm.workoutsCompleted),
 workouts_scheduled: Number(checkinForm.workoutsScheduled),
 biofeedback: {
 hunger_level: Number(checkinForm.hungerLevel),
 energy_in_gym: Number(checkinForm.energyInGym),
 sleep_quality: Number(checkinForm.sleepQuality),
 stress_level: Number(checkinForm.stressLevel),
 },
 pain_reports: painReports,
 };

 const res = await fetch(`${API_BASE}/api/v1/programs/checkin/evaluate`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(payload),
 });

 const data = await res.json();
 setCheckinResult(data.evaluation);
 } catch (err) {
 alert("Checkin failed: " + err.message);
 } finally {
 setLoading(false);
 }
 };

 const nutrition = program?.nutrition_program;
 const training = program?.training_program;
 const cardio = program?.cardio_program;

 return (
 <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#f8f9fa", direction: "rtl", fontFamily: "Cairo, Tajawal, sans-serif" }}>
 {/* 1. FitNexus Sidebar (Fixed Left/Right according to RTL) */}
 <aside className="codex-sidebar" style={{ width: "260px", background: "#ffffff", borderLeft: "1px solid #e2e8f0", zIndex: 100, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
 <div>
 <div className="codex-brand p-4 d-flex align-items-center justify-content-between border-bottom">
 <a className="d-flex align-items-center text-decoration-none" href="/">
 <img className="img-fluid me-2" src="/admin-dashboard_data/logo/logo.png" alt="logo" style={{ maxHeight: "32px" }} />
 <span className="fs-4 fw-bold text-primary">FitNexus</span>
 </a>
 </div>

 <div className="p-3">
 <ul className="nav flex-column gap-2 list-unstyled">
 <li>
 <a href="/" className="nav-link text-dark p-3 rounded-3 d-flex align-items-center gap-3">
 <i className="ti ti-layout-dashboard fs-5 text-muted"></i>
 <span className="fw-semibold">لوحة التحكم (Dashboard)</span>
 </a>
 </li>
 <li>
 <button
 onClick={() => setActiveTab("nutrition")}
 className={`nav-link w-100 text-end p-3 rounded-3 d-flex align-items-center gap-3 border-0 ${activeTab === "nutrition" ? "bg-primary-subtle text-primary fw-bold" : "text-dark bg-transparent"}`}
 >
 <i className="ti ti-salad fs-5"></i>
 <span>الدايت والوجبات (Diet Plan)</span>
 </button>
 </li>
 <li>
 <button
 onClick={() => setActiveTab("training")}
 className={`nav-link w-100 text-end p-3 rounded-3 d-flex align-items-center gap-3 border-0 ${activeTab === "training" ? "bg-primary-subtle text-primary fw-bold" : "text-dark bg-transparent"}`}
 >
 <i className="ti ti-barbell fs-5"></i>
 <span>تمارين الجيم (Workout)</span>
 </button>
 </li>
 <li>
 <button
 onClick={() => setActiveTab("cardio")}
 className={`nav-link w-100 text-end p-3 rounded-3 d-flex align-items-center gap-3 border-0 ${activeTab === "cardio" ? "bg-primary-subtle text-primary fw-bold" : "text-dark bg-transparent"}`}
 >
 <i className="ti ti-heart-rate-monitor fs-5"></i>
 <span>الكارديو ونبض القلب (Cardio)</span>
 </button>
 </li>
 <li>
 <button
 onClick={() => setActiveTab("checkin")}
 className={`nav-link w-100 text-end p-3 rounded-3 d-flex align-items-center gap-3 border-0 ${activeTab === "checkin" ? "bg-success-subtle text-success fw-bold" : "text-dark bg-transparent"}`}
 >
 <i className="ti ti-chart-line fs-5"></i>
 <span>المتابعة الأسبوعية (Check-in)</span>
 </button>
 </li>
 </ul>
 </div>
 </div>

 {/* Upgrade Banner */}
 <div className="p-3 m-3 bg-light rounded-4 text-center border">
 <div className="fw-bold text-dark mb-1">عضوية بريميوم نشطة </div>
 <small className="text-muted d-block mb-2">تحديث وتكيف أسبوعي ذكي</small>
 <span className="badge bg-primary px-3 py-2 rounded-pill">مشترك مع كابتن</span>
 </div>
 </aside>

 {/* 2. Main Workspace */}
 <div className="flex-grow-1 d-flex flex-column" style={{ overflowX: "hidden" }}>
 {/* Top Header */}
 <header className="bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center">
 <div className="d-flex align-items-center gap-3">
 <div className="input-group" style={{ maxWidth: "300px" }}>
 <span className="input-group-text bg-light border-0"><i className="ti ti-search text-muted"></i></span>
 <input type="text" className="form-control bg-light border-0" placeholder="بحث في البرنامج..." />
 </div>
 <span className="badge bg-primary-subtle text-primary px-3 py-2 fs-6 rounded-pill">
 خطة الـ 3 شهور — النسخة الذكية V2.0
 </span>
 </div>

 <div className="d-flex align-items-center gap-3">
 <div className="text-end">
 <h6 className="mb-0 fw-bold">{user?.full_name || (user?.client_code ? `متدرب #${user.client_code}` : 'المشترك')}</h6>
 <small className="text-muted">مشترك متدرب</small>
 </div>
 <img className="rounded-circle border" src="/admin-dashboard_data/avtar/profile.png" alt="avatar" width="42" height="42" />
 </div>
 </header>

 {/* Workspace Body */}
 <main className="p-4">
 {/* Top 5 Stat Cards Row (Exact Match with Image 2) */}
 <div className="row g-3 mb-4">
 <div className="col">
 <div className="card stat-card border-0 shadow-sm p-3 h-100 bg-white" style={{ borderRadius: "14px" }}>
 <div className="d-flex justify-content-between align-items-center mb-2">
 <div className="stat-icon bg-primary-subtle text-primary rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: "38px", height: "38px" }}>
 <i className="ti ti-flame fs-5"></i>
 </div>
 <span className="badge badge-primary">+100%</span>
 </div>
 <h4 className="fw-bold mb-0">
 {Math.round(nutrition?.stages?.energy_target?.target_calories_kcal || 2200)} <small className="fs-6 text-muted">kcal</small>
 </h4>
 <p className="text-muted small mb-2">السعرات اليومية</p>
 <div className="progress" style={{ height: "6px" }}>
 <div className="progress-bar bg-primary" style={{ width: "75%" }}></div>
 </div>
 </div>
 </div>

 <div className="col">
 <div className="card stat-card border-0 shadow-sm p-3 h-100 bg-white" style={{ borderRadius: "14px" }}>
 <div className="d-flex justify-content-between align-items-center mb-2">
 <div className="stat-icon bg-danger-subtle text-danger rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: "38px", height: "38px" }}>
 <i className="ti ti-meat fs-5"></i>
 </div>
 <span className="badge bg-danger-subtle text-danger">هدف عالي</span>
 </div>
 <h4 className="fw-bold mb-0">
 {Math.round(nutrition?.stages?.macro_targets?.protein_g || 170)} <small className="fs-6 text-muted">g</small>
 </h4>
 <p className="text-muted small mb-2">البروتين الصافي</p>
 <div className="progress" style={{ height: "6px" }}>
 <div className="progress-bar bg-danger" style={{ width: "85%" }}></div>
 </div>
 </div>
 </div>

 <div className="col">
 <div className="card stat-card border-0 shadow-sm p-3 h-100 bg-white" style={{ borderRadius: "14px" }}>
 <div className="d-flex justify-content-between align-items-center mb-2">
 <div className="stat-icon bg-info-subtle text-info rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: "38px", height: "38px" }}>
 <i className="ti ti-bread fs-5"></i>
 </div>
 <span className="badge bg-info-subtle text-info">طاقة نظيفة</span>
 </div>
 <h4 className="fw-bold mb-0">
 {Math.round(nutrition?.stages?.macro_targets?.carbohydrate_g || 220)} <small className="fs-6 text-muted">g</small>
 </h4>
 <p className="text-muted small mb-2">الكاربوهيدرات</p>
 <div className="progress" style={{ height: "6px" }}>
 <div className="progress-bar bg-info" style={{ width: "70%" }}></div>
 </div>
 </div>
 </div>

 <div className="col">
 <div className="card stat-card border-0 shadow-sm p-3 h-100 bg-white" style={{ borderRadius: "14px" }}>
 <div className="d-flex justify-content-between align-items-center mb-2">
 <div className="stat-icon bg-warning-subtle text-warning rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: "38px", height: "38px" }}>
 <i className="ti ti-droplet fs-5"></i>
 </div>
 <span className="badge bg-warning-subtle text-warning">صحي</span>
 </div>
 <h4 className="fw-bold mb-0">
 {Math.round(nutrition?.stages?.macro_targets?.fat_g || 60)} <small className="fs-6 text-muted">g</small>
 </h4>
 <p className="text-muted small mb-2">الدهون الصحية</p>
 <div className="progress" style={{ height: "6px" }}>
 <div className="progress-bar bg-warning" style={{ width: "60%" }}></div>
 </div>
 </div>
 </div>

 <div className="col">
 <div className="card stat-card border-0 shadow-sm p-3 h-100 bg-white" style={{ borderRadius: "14px" }}>
 <div className="d-flex justify-content-between align-items-center mb-2">
 <div className="stat-icon bg-success-subtle text-success rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: "38px", height: "38px" }}>
 <i className="ti ti-walk fs-5"></i>
 </div>
 <span className="badge badge-success">يومياً</span>
 </div>
 <h4 className="fw-bold mb-0">8,000</h4>
 <p className="text-muted small mb-2">الخطوات اليومية</p>
 <div className="progress" style={{ height: "6px" }}>
 <div className="progress-bar bg-success" style={{ width: "80%" }}></div>
 </div>
 </div>
 </div>
 </div>

 {/* TAB 1: DIET PLAN & SMART FOOD SWAPS */}
 {activeTab === "nutrition" && (
 <div className="row g-4">
 <div className="col-12">
 <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: "16px" }}>
 <div className="d-flex justify-content-between align-items-center mb-3">
 <div>
 <h4 className="fw-bold mb-1 text-dark">
 <i className="ti ti-salad text-primary me-2"></i> الوجبات الغذائية اليومية بوحدات القياس المنزلية المقربة
 </h4>
 <p className="text-muted small mb-0">
 موزعة بذكاء على مدار اليوم ومحمية من التكرار والكميات الضخمة، مع إمكانية التبديل الفوري .
 </p>
 </div>
 <span className="badge bg-primary px-3 py-2 rounded-pill">3 وجبات متكاملة</span>
 </div>

 <div className="row g-4">
 {nutrition?.quantized_plan?.meals?.map((meal, mIdx) => (
 <div className="col-lg-4" key={mIdx}>
 <div className="card border h-100 shadow-none bg-light" style={{ borderRadius: "14px" }}>
 <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
 <h5 className="fw-bold mb-0 text-primary">
 {mIdx === 0 ? " الوجبة 1 (الإفطار)" : mIdx === 1 ? " الوجبة 2 (الغداء)" : " الوجبة 3 (العشاء)"}
 </h5>
 <span className="badge bg-primary-subtle text-primary fs-6">
 ~{Math.round(meal.meal_energy_kcal)} kcal
 </span>
 </div>

 <div className="card-body p-3">
 <div className="d-flex flex-column gap-2">
 {(meal.foods || meal.items)?.map((food, fIdx) => (
 <div
 key={fIdx}
 className="p-3 bg-white rounded-3 d-flex justify-content-between align-items-center border"
 >
 <div>
 <h6 className="fw-bold mb-1 text-dark">
 {food.serving_display_ar || food.serving_display_en}
 </h6>
 <small className="text-muted">
 {food.name_ar || food.food_code} ({food.portion_g_rounded || food.grams}g)
 </small>
 </div>

 <button
 onClick={() => handleOpenSwapModal(mIdx, fIdx, food, meal.role)}
 className="btn btn-outline-primary btn-sm px-3 rounded-pill fw-bold"
 >
 <i className="ti ti-refresh me-1"></i> تبديل
 </button>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 )}

 {/* TAB 2: TRAINING MESO-CYCLE */}
 {activeTab === "training" && (
 <div className="row g-4">
 <div className="col-12">
 <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: "16px" }}>
 <div className="d-flex justify-content-between align-items-center mb-3">
 <div>
 <h4 className="fw-bold mb-1 text-dark">
 <i className="ti ti-barbell text-primary me-2"></i> جدول التمارين والميزوسايكل (5-Week Periodized Meso-Cycle)
 </h4>
 <p className="text-muted small mb-0">
 تجهيزات جيم تجاري كامل (بنش باربل + راك سكوات) مع تدرج علمي في الشدة والـ RIR.
 </p>
 </div>
 </div>

 <div className="d-flex flex-column gap-4">
 {training?.weeks?.map((week) => (
 <div className="border rounded-4 p-4 bg-light" key={week.week_number}>
 <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
 <div>
 <h5 className="fw-bold mb-0 text-primary">
 الأسبوع {week.week_number} — {week.phase}
 </h5>
 <small className="text-muted">{week.focus_note}</small>
 </div>
 <span className="badge bg-primary px-3 py-2 fs-6 rounded-pill">
 مستوى الجهد: {week.target_rir} RIR
 </span>
 </div>

 <div className="row g-3">
 {week.sessions?.map((session, sIdx) => (
 <div className="col-lg-6" key={sIdx}>
 <div className="bg-white p-3 rounded-3 border h-100">
 <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
 <h6 className="fw-bold mb-0 text-dark">
 <i className="ti ti-calendar me-1 text-primary"></i> {session.session_code}
 </h6>
 <span className="badge bg-light text-primary border">{session.scheduled_day}</span>
 </div>

 <table className="table table-borderless table-sm mb-0">
 <tbody>
 {session.exercises?.map((ex, exIdx) => (
 <tr key={exIdx} className="border-bottom">
 <td className="py-2">
 <div className="fw-bold text-dark">{getArabicExerciseName(ex)}</div>
 <small className="text-muted">{ex.name_en || ex.exercise_code?.replace(/_/g, ' ')}</small>
 </td>
 <td className="py-2 text-center">
 <span className="badge bg-primary-subtle text-primary">
 {ex.prescription?.sets} مجموعات
 </span>
 </td>
 <td className="py-2 text-center">
 <span className="badge bg-success-subtle text-success">
 {ex.prescription?.target_min || ex.prescription?.target_max} تكرار
 </span>
 </td>
 <td className="py-2 text-end">
 <span className="badge bg-warning-subtle text-warning">
 {ex.prescription?.rest_seconds || 90} ث راحة
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 )}

 {/* TAB 3: CARDIO & ZONE 2 */}
 {activeTab === "cardio" && (
 <div className="row g-4">
 <div className="col-12">
 <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: "16px" }}>
 <h4 className="fw-bold mb-3 text-dark">
 <i className="ti ti-heart-rate-monitor text-primary me-2"></i> برنامج الكارديو ونطاق نبضات القلب لحرق الدهون (Zone 2)
 </h4>
 <div className="row g-4">
 <div className="col-md-4">
 <div className="p-4 bg-light rounded-4 text-center border h-100">
 <div className="bg-success-subtle text-success rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: "60px", height: "60px", fontSize: "1.8rem" }}>
 <i className="ti ti-walk"></i>
 </div>
 <h5 className="text-muted mb-1">الهدف اليومي للخطوات</h5>
 <h2 className="fw-bold text-success mb-1">8,000</h2>
 <small className="text-muted">خطوة موزعة على مدار اليوم</small>
 </div>
 </div>

 {cardio?.weekly_schedule?.sessions?.map((session, csIdx) => (
 <div className="col-md-4" key={csIdx}>
 <div className="p-4 bg-light rounded-4 border h-100">
 <div className="d-flex justify-content-between align-items-center mb-3">
 <h5 className="fw-bold text-primary mb-0">
 حصة {session.modality_type}
 </h5>
 <span className="badge bg-primary px-3 py-2">{session.day_of_week}</span>
 </div>

 <div className="mb-3">
 <span className="badge bg-warning-subtle text-warning fs-6 px-3 py-2">
 ⏱ المدة: {session.duration_minutes} دقيقة
 </span>
 </div>

 {session.heart_rate_target && (
 <div className="p-3 bg-white rounded-3 border">
 <div className="fw-bold text-danger mb-1">
 <i className="ti ti-heartbeat me-1"></i> النبض المستهدف: {session.heart_rate_target.target_range_bpm}
 </div>
 <small className="text-muted d-block">
 {session.heart_rate_target.guidance_ar}
 </small>
 </div>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 )}

 {/* TAB 4: WEEKLY CHECK-IN WIZARD */}
 {activeTab === "checkin" && (
 <div className="row justify-content-center">
 <div className="col-lg-10">
 <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: "16px" }}>
 <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
 <div>
 <h4 className="fw-bold mb-1 text-dark">
 <i className="ti ti-clipboard-check text-success me-2"></i> استمارة المتابعة الأسبوعية والتكيف التلقائي
 </h4>
 <p className="text-muted small mb-0">
 يقوم محرك التكيف الرياضي بحساب التغير الأسبوعي وتوليد الخطة التالية وحفظها في قاعدة البيانات `z`.
 </p>
 </div>
 <span className="badge bg-success px-3 py-2 rounded-pill fs-6">Week {checkinForm.weekNumber}</span>
 </div>

 <form onSubmit={handleCheckinSubmit}>
 <h6 className="fw-bold text-primary mb-3">1. أوزان أيام الأسبوع الـ 7 على الريق (كجم):</h6>
 <div className="row g-2 mb-4">
 {[1, 2, 3, 4, 5, 6, 7].map((d) => (
 <div className="col-md-3 col-6" key={d}>
 <label className="form-label small text-muted">يوم {d}</label>
 <input
 type="number"
 step="0.1"
 className="form-control"
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
 className="form-control fw-bold border-primary"
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
 className="form-control"
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
 className="form-control"
 value={checkinForm.hungerLevel}
 onChange={(e) => setCheckinForm({ ...checkinForm, hungerLevel: e.target.value })}
 />
 </div>
 <div className="col-md-6">
 <label className="form-label small">مستوى الطاقة في التمرين (1-5)</label>
 <input
 type="number"
 min="1"
 max="5"
 className="form-control"
 value={checkinForm.energyInGym}
 onChange={(e) => setCheckinForm({ ...checkinForm, energyInGym: e.target.value })}
 />
 </div>
 <div className="col-md-6">
 <label className="form-label small">هل تشعر بألم في المفاصل؟</label>
 <select
 className="form-select"
 value={checkinForm.painJoint}
 onChange={(e) => setCheckinForm({ ...checkinForm, painJoint: e.target.value })}
 >
 <option value="NONE">لا يوجد ألم (جاهز 100%)</option>
 <option value="SHOULDER">ألم في الكتف (استبدال البنش بالدمبل)</option>
 <option value="KNEE">ألم في الركبة (استبدال السكوات)</option>
 <option value="LOWER_BACK">ألم في أسفل الظهر</option>
 </select>
 </div>
 </div>

 <button
 type="submit"
 disabled={loading}
 className="btn btn-success btn-lg w-100 py-3 fw-bold rounded-pill shadow-sm"
 >
 {loading ? "جاري التحليل والتكيّف..." : " إرسال التقرير الأسبوعي وتوليد الخطة المتكيفة"}
 </button>
 </form>

 {/* Checkin Evaluation Result */}
 {checkinResult && (
 <div className="mt-4 p-4 bg-light rounded-4 border border-success">
 <div className="d-flex justify-content-between align-items-center mb-3">
 <h5 className="fw-bold text-success mb-0">
 <i className="ti ti-circle-check me-2"></i> نتيجة التقييم: {checkinResult.status}
 </h5>
 <span className="badge bg-success px-3 py-2">تم الحفظ في قاعدة بيانات MariaDB `z`</span>
 </div>

 <div className="row g-3 mb-3">
 <div className="col-sm-6">
 <div className="p-3 bg-white rounded-3 border">
 <small className="text-muted d-block">متوسط وزن الأسبوع الحالي</small>
 <h4 className="fw-bold text-primary mb-0">{checkinResult.weight_analysis?.current_average_kg} كجم</h4>
 </div>
 </div>
 <div className="col-sm-6">
 <div className="p-3 bg-white rounded-3 border">
 <small className="text-muted d-block">معدل التغير في الوزن</small>
 <h4 className="fw-bold text-success mb-0">
 {checkinResult.weight_analysis?.delta_kg} كجم ({checkinResult.weight_analysis?.rate_percent}%)
 </h4>
 </div>
 </div>
 </div>

 <div className="alert alert-info mb-0">
 <strong>قرار المحرك:</strong> تم تأكيد تقدم العميل ضمن نطاق الأمان الصحي، والانتقال بنجاح للأسبوع التالي في الميزوسايكل!
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 )}
 </main>
 </div>

 {/* 3. FitNexus Smart Swap Modal */}
 {swapModalOpen && (
 <div
 className="modal fade show d-block"
 tabIndex="-1"
 style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 99999 }}
 >
 <div className="modal-dialog modal-dialog-centered">
 <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px", overflow: "hidden" }}>
 <div className="modal-header bg-primary text-white py-3">
 <h5 className="modal-title fw-bold text-white">
 <i className="ti ti-refresh me-2"></i> استبدال الصنف الذكي
 </h5>
  <button
    type="button"
    className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
    style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#ffffff' }}
    onClick={() => setSwapModalOpen(false)}
    title="إغلاق"
  >
    <i className="ti ti-x fs-6"></i>
  </button>
 </div>

 <div className="modal-body p-4">
 <div className="p-3 bg-light rounded-3 mb-3 border">
 <small className="text-muted d-block">الصنف الحالي المراد استبداله:</small>
 <h6 className="fw-bold text-primary mb-0">
 {selectedFoodItem?.serving_display_ar || selectedFoodItem?.name_ar || selectedFoodItem?.food_code}
 </h6>
 </div>

 <h6 className="fw-bold mb-3 text-dark">اختر الصنف البديل المتوافق:</h6>

 {swapLoading ? (
 <div className="text-center py-4">
 <div className="spinner-border text-primary" role="status"></div>
 <p className="mt-2 text-muted">جاري احتساب البدائل الدقيقة...</p>
 </div>
 ) : (
 <div className="d-flex flex-column gap-2" style={{ maxHeight: "280px", overflowY: "auto" }}>
 {swapCandidates.map((candidate) => (
 <button
 key={candidate.food_code}
 onClick={() => handleExecuteSwap(candidate.food_code)}
 className="btn btn-outline-light text-dark p-3 text-end d-flex justify-content-between align-items-center border rounded-3"
 >
 <div>
 <strong className="d-block text-dark">{candidate.name_ar}</strong>
 <small className="text-muted">{candidate.name_en}</small>
 </div>
 <span className="badge bg-primary rounded-pill px-3 py-2">
 اختيار 
 </span>
 </button>
 ))}
 </div>
 )}
 </div>

 <div className="modal-footer bg-light border-0 py-2">
 <button
 type="button"
 className="btn btn-secondary px-4"
 onClick={() => setSwapModalOpen(false)}
 >
 إلغاء
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
