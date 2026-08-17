import React, { useState, useEffect } from "react";
import { API_BASE } from "../config/api";
import UserDashboardHeader from "../components/user-dashboard/UserDashboardHeader";
import UserDashboardSidebar from "../components/user-dashboard/UserDashboardSidebar";
import UserWelcomeHero from "../components/user-dashboard/UserWelcomeHero";
import MacroOverviewCard from "../components/user-dashboard/MacroOverviewCard";
import CardioZoneBanner from "../components/user-dashboard/CardioZoneBanner";
import WorkoutSection from "../components/user-dashboard/WorkoutSection";
import MealsSection from "../components/user-dashboard/MealsSection";
import SupplementsSection from "../components/user-dashboard/SupplementsSection";
import SmartSwapModal from "../components/modals/SmartSwapModal";
import CheckinModal from "../components/modals/CheckinModal";

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
};

/**
 * Formats a food item into a single, clean Arabic string without English or second lines.
 */
function formatArabicFoodSingleLine(food) {
 if (!food) return "صنف غذائي";
 let name = food.name_ar;
 if (!name && food.food_code && ARABIC_FOOD_NAMES[food.food_code]) {
 name = ARABIC_FOOD_NAMES[food.food_code];
 }
 if (!name) {
 name = food.name_en || food.food_code || "صنف غذائي";
 }

 name = name.replace(/\([A-Za-z0-9\s-_]+\)/g, "").trim();

 let grams = food.portion_g_rounded || food.grams || food.portion_g;
 if (!grams && food.serving_display_ar) {
 const match = food.serving_display_ar.match(/\((\d+)\s*جرام\)/);
 if (match) grams = parseInt(match[1], 10);
 }
 if (!grams) grams = 100;

 return `${name} (${grams} جرام)`;
}

export default function UserDashboardClone() {
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [completedExercises, setCompletedExercises] = useState({});

  // Smart Swap Modal State
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [activeMealIndex, setActiveMealIndex] = useState(null);
  const [activeFoodIndex, setActiveFoodIndex] = useState(null);
  const [selectedFoodItem, setSelectedFoodItem] = useState(null);
  const [swapCandidates, setSwapCandidates] = useState([]);
  const [swapLoading, setSwapLoading] = useState(false);

  // Weekly Check-in Modal State
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [checkinForm, setCheckinForm] = useState({
    weightDay1: 85.0,
    weightDay2: 84.8,
    weightDay3: 84.7,
    weightDay4: 84.5,
    weightDay5: 84.4,
    weightDay6: 84.3,
    weightDay7: 84.2,
    waistCm: 88.5,
    nutritionAdherence: 95,
    hungerLevel: 2,
    energyInGym: 4,
  });
  const [checkinResult, setCheckinResult] = useState(null);

  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const targetUserId = searchParams.get('user_id') || sessionStorage.getItem('z_active_client_code') || "";

  useEffect(() => {
    fetchClients();
    if (targetUserId) {
      fetchLiveProgram();
    } else {
      setLoading(false);
      setProgram(null);
      setCurrentUser(null);
    }
  }, [targetUserId]);

  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/clients`);
      const data = await res.json();
      if (data.clients) setClients(data.clients);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLiveProgram = async () => {
    if (!targetUserId) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/programs/active/${targetUserId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل تحميل البرنامج من قاعدة البيانات");

      if (data.user) {
        setCurrentUser(data.user);
      }
      setProgram(data.master_program || null);
    } catch (e) {
      console.error("fetchLiveProgram error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickGeneratePlan = async () => {
    try {
      setGeneratingPlan(true);
      const res = await fetch(`${API_BASE}/api/v1/programs/generate-for-client/${targetUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data.master_program) {
        setProgram(data.master_program);
        if (data.user) setCurrentUser(data.user);
      } else {
        alert(data.error || 'حدث خطأ أثناء توليد الخطة');
      }
    } catch (e) {
      alert('خطأ في الاتصال بالخادم: ' + e.message);
    } finally {
      setGeneratingPlan(false);
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

 // Toggle exercise checkbox
 const toggleExercise = (code) => {
 setCompletedExercises(prev => ({ ...prev, [code]: !prev[code] }));
 };

 // Submit Weekly Check-in
 const handleCheckinSubmit = async (e) => {
 e.preventDefault();
 try {
 setLoading(true);
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
 alert(" تم إرسال متابعتك الأسبوعية بنجاح إلى الكابتن للمراجعة والاعتماد!");
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
 <UserDashboardHeader currentUser={currentUser} targetUserId={targetUserId} clients={clients} />

 {/* 2. Sidebar */}
 <UserDashboardSidebar targetUserId={targetUserId} onOpenCheckin={() => setCheckinModalOpen(true)} />

 {/* 3. Main Workspace */}
 <main className="themebody-wrap">
 <div className="theme-body">
        <div className="container-fluid">
          {/* 1. Hero Card */}
          <UserWelcomeHero currentUser={currentUser} coachNotes={program?.coach_notes} />

          {!program && !loading ? (
            /* Pending Intake & Program Generation Card */
            <div className="row mb-4 z-animate-in">
              <div className="col-12">
                <div className="p-4 p-md-5 rounded-4 bg-white border text-center shadow-sm position-relative overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                    style={{ width: '64px', height: '64px', background: '#f5f3ff', color: '#261c6a', border: '2px solid #ddd6fe' }}
                  >
                    <i className="ti ti-clipboard-check fs-2"></i>
                  </div>

                  <h4 className="fw-bold text-dark mb-2" style={{ letterSpacing: '-0.3px' }}>
                    بانتظار استكمال استمارة المشترك
                  </h4>

                  <p className="text-muted mx-auto mb-4" style={{ maxWidth: '540px', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    تم تسجيل حساب المشترك بنجاح، ولم يتم توليد الخطة بعد. يمكنك إرسال رابط الاستمارة للمتدرب لتعبئة بياناته، أو توليد خطة مبدئية فوراً بواسطة محرك <strong className="text-primary">Z-Engine V2</strong>.
                  </p>

                  <div className="p-3 bg-light rounded-3 d-inline-flex flex-wrap align-items-center justify-content-center gap-3 mb-4 border">
                    <span className="small text-dark fw-bold">
                      كود المشترك: <span className="badge font-monospace" style={{ background: '#261c6a', color: '#fff' }}>{currentUser?.client_code || targetUserId}</span>
                    </span>
                    <span className="small text-muted">|</span>
                    <span className="small text-dark fw-bold">
                      الهاتف: <span dir="ltr" className="text-muted">{currentUser?.phone_number || '-'}</span>
                    </span>
                    <span className="small text-muted">|</span>
                    <span className="small text-dark fw-bold">
                      الباقة: <span className="badge bg-success-subtle text-success border border-success-subtle">{currentUser?.subscription_package?.includes('MAX') ? 'باقة ماكس (3 شهور + 1 مجاناً)' : 'باقة إيليت (3 شهور + 1 مجاناً)'}</span>
                    </span>
                  </div>

                  <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">
                    {/* Copy Link Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const link = `${window.location.origin}/intake/form?code=${currentUser?.client_code || targetUserId}&phone=${currentUser?.phone_number || ''}`;
                        navigator.clipboard.writeText(link);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2500);
                      }}
                      className="btn btn-sm btn-light rounded-pill px-4 fw-semibold border d-flex align-items-center gap-2"
                      style={{ height: '38px', fontSize: '0.82rem' }}
                    >
                      <i className={copiedLink ? "ti ti-check text-success" : "ti ti-copy"}></i>
                      <span>{copiedLink ? 'تم نسخ الرابط!' : 'نسخ رابط الاستمارة'}</span>
                    </button>

                    {/* WhatsApp Button */}
                    {currentUser?.phone_number && (
                      <button
                        type="button"
                        onClick={() => {
                          const link = `${window.location.origin}/intake/form?code=${currentUser?.client_code || targetUserId}&phone=${currentUser?.phone_number || ''}`;
                          const msg = `مرحباً بك مع كابتن كيمو في منظومة Z Coaching!\nيرجى تعبئة استمارة التقييم للبدء في خطتك:\n${link}\nكودك: ${currentUser?.client_code || targetUserId}`;
                          let phone = currentUser.phone_number.replace(/\D/g, '');
                          if (phone.startsWith('01')) phone = '2' + phone;
                          window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        className="btn btn-sm btn-success rounded-pill px-4 fw-bold d-flex align-items-center gap-2 text-white shadow-xs"
                        style={{ height: '38px', fontSize: '0.82rem' }}
                      >
                        <i className="ti ti-brand-whatsapp fs-6"></i>
                        <span>إرسال عبر WhatsApp</span>
                      </button>
                    )}

                    {/* Quick Generate Engine V2 Plan */}
                    <button
                      type="button"
                      disabled={generatingPlan}
                      onClick={handleQuickGeneratePlan}
                      className="btn btn-sm rounded-pill px-4 fw-bold d-flex align-items-center gap-2 text-white shadow-sm"
                      style={{ 
                        height: '38px', 
                        fontSize: '0.82rem', 
                        background: 'linear-gradient(135deg, #261c6a 0%, #4338ca 100%)', 
                        border: 'none',
                        boxShadow: '0 3px 12px rgba(38,28,106,0.25)'
                      }}
                    >
                      {generatingPlan ? (
                        <><span className="spinner-border spinner-border-sm"></span> جاري بناء الخطة بالمحرك...</>
                      ) : (
                        <><i className="ti ti-sparkles fs-6"></i> توليد الخطة الآن (Z-Engine)</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* 2. Macro Stats */}
              <MacroOverviewCard nutrition={nutrition} />

              {/* 3. Daily 3 Meals Section (3 side-by-side vertical cards across the page) */}
              <MealsSection 
                nutrition={nutrition}
                loading={loading}
                formatArabicFoodSingleLine={formatArabicFoodSingleLine}
                onOpenSwapModal={handleOpenSwapModal}
              />

              {/* 4. Cardio Zone Banner */}
              <CardioZoneBanner onOpenCheckin={() => setCheckinModalOpen(true)} />

              {/* 5. Today's Full-Width Workout Section */}
              <WorkoutSection 
                todaySession={todaySession}
                loading={loading}
                completedExercises={completedExercises}
                onToggleExercise={toggleExercise}
              />

              {/* 6. Supplements Protocol */}
              <SupplementsSection supplements={program?.supplements} />
            </>
          )}
        </div>
      </div>
 </main>

 {/* Modals */}
 <SmartSwapModal 
 isOpen={swapModalOpen}
 onClose={() => setSwapModalOpen(false)}
 selectedFoodItem={selectedFoodItem}
 swapCandidates={swapCandidates}
 swapLoading={swapLoading}
 onExecuteSwap={handleExecuteSwap}
 formatFoodTitle={formatArabicFoodSingleLine}
 />

 <CheckinModal 
 isOpen={checkinModalOpen}
 onClose={() => setCheckinModalOpen(false)}
 checkinForm={checkinForm}
 setCheckinForm={setCheckinForm}
 onSubmit={handleCheckinSubmit}
 loading={loading}
 checkinResult={checkinResult}
 />
 </div>
 );
}
