import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getArabicExerciseName } from '../utils/exerciseTranslator';
import { API_BASE } from '../config/api';

export default function MobileAppSimulator() {
 const [activeTab, setActiveTab] = useState('home'); // 'home' | 'workout' | 'nutrition' | 'checkin'
 const [loading, setLoading] = useState(true);
 const [program, setProgram] = useState(null);
 const [user, setUser] = useState(null);
 const [clients, setClients] = useState([]);
 const [selectedSessionIdx, setSelectedSessionIdx] = useState(0);
 const [restSeconds, setRestSeconds] = useState(0);
 const [completedExercises, setCompletedExercises] = useState({});

 // Checkin state
 const [weights, setWeights] = useState(['85.0', '84.8', '84.7', '84.5', '84.4', '84.3', '84.2']);
 const [waist, setWaist] = useState('88.5');
 const [adherence, setAdherence] = useState(95);
 const [submittingCheckin, setSubmittingCheckin] = useState(false);

 const searchParams = new URLSearchParams(window.location.search);
 const targetUserId = searchParams.get('user_id') || '2';

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

 // Robust session resolution across Initial V2 Plan & Adapted V2 Plan
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
 { name_ar: "شوفان مطبوخ بالماء", portion_g_rounded: 80 }
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
 { name_ar: "جبنة قريش", portion_g_rounded: 200 },
 { name_ar: "خبز أسمر / بلدي", portion_g_rounded: 100 }
 ]
 }
 ];

 const meals = 
 (program?.nutrition_program?.quantized_plan?.meals && program.nutrition_program.quantized_plan.meals.length > 0)
 ? program.nutrition_program.quantized_plan.meals 
 : defaultMeals;

 return (
 <div className="d-flex flex-column align-items-center justify-content-center py-4" style={{ minHeight: '100vh', backgroundColor: '#0b1120', fontFamily: 'Cairo, Tajawal, sans-serif' }} dir="rtl">
 
 {/* Top Simulator Control Bar */}
 <div className="card border-0 shadow-sm mb-4 px-4 py-3 bg-dark text-white rounded-pill d-flex flex-row align-items-center justify-content-between gap-3" style={{ width: '100%', maxWidth: '440px', backgroundColor: '#1e293b' }}>
 <div className="d-flex align-items-center gap-2">
 <span className="badge bg-primary px-3 py-2 rounded-pill fw-bold" style={{ fontSize: '0.82rem' }}>
 <i className="ti ti-device-mobile me-1"></i> Flutter App
 </span>
 {clients.length > 0 && (
 <select 
 className="form-select form-select-sm bg-secondary text-white border-0 rounded-pill py-1 px-3"
 style={{ fontSize: '0.85rem' }}
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
 <Link to="/" className="btn btn-outline-light btn-sm rounded-pill px-3 fw-semibold">
 العودة للويب 
 </Link>
 </div>

 {/* Mobile Device Frame */}
 <div 
 className="card border-0 shadow-lg overflow-hidden position-relative"
 style={{
 width: '390px',
 height: '790px',
 borderRadius: '46px',
 backgroundColor: '#f8fafc',
 border: '11px solid #1e293b',
 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
 }}
 >
 {/* Dynamic Island */}
 <div className="position-absolute top-0 start-50 translate-middle-x mt-2 bg-dark rounded-pill" style={{ width: '120px', height: '24px', zIndex: 100 }}></div>

 {/* App Top Bar */}
 <div className="pt-5 pb-3 px-3 bg-white border-bottom d-flex align-items-center justify-content-between">
 <div className="d-flex align-items-center gap-2">
 <img src="/admin-dashboard_data/avtar/profile.png" alt="Avatar" className="rounded-circle border" width="38" height="38" />
 <div>
 <h6 className="fw-bold text-dark mb-0 lh-1" style={{ fontSize: '0.95rem' }}>{user?.full_name || 'كيمو المحروقي'}</h6>
 <small className="text-muted" style={{ fontSize: '0.72rem' }}>كود المشترك: {user?.client_code || targetUserId}</small>
 </div>
 </div>
 <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1 fw-bold" style={{ fontSize: '0.72rem' }}>
 Z-Engine V2
 </span>
 </div>

 {/* App Scrollable Content */}
 <div className="flex-grow-1 overflow-auto p-3 custom-scroll" style={{ height: 'calc(100% - 145px)' }}>
 {loading ? (
 <div className="text-center py-5">
 <div className="spinner-border text-primary" role="status"></div>
 <p className="text-muted small mt-2">جاري مزامنة التطبيق مع MariaDB `z`...</p>
 </div>
 ) : (
 <>
 {/* TAB 1: HOME OVERVIEW */}
 {activeTab === 'home' && (
 <div>
 {/* Coach Direct Notes Banner */}
 {program?.coach_notes && (
 <div className="p-3 mb-3 rounded-4 shadow-sm" style={{ backgroundColor: '#ecfdf5', borderRight: '4px solid #10b981' }}>
 <div className="d-flex align-items-center gap-1 mb-1">
 <span className="badge bg-success rounded-pill px-2" style={{ fontSize: '0.68rem' }}>توجيهات الكابتن </span>
 </div>
 <p className="small mb-0 text-dark fw-semibold" style={{ fontSize: '0.88rem', lineHeight: '1.6' }}>
 {program.coach_notes}
 </p>
 </div>
 )}

 {/* Daily Target Macros Card */}
 <div className="card border-0 shadow-sm bg-white rounded-4 mb-3">
 <div className="card-body p-3">
 <div className="d-flex justify-content-between align-items-center mb-3">
 <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.92rem' }}>طاقة وماكروز اليوم</h6>
 <span className="badge bg-primary-subtle text-primary">المستهدف</span>
 </div>
 <div className="row text-center g-2">
 <div className="col-3">
 <div className="p-2 bg-light rounded-3">
 <div className="fw-bold text-primary" style={{ fontSize: '0.95rem' }}>{caloriesTarget}</div>
 <div className="text-muted" style={{ fontSize: '0.65rem' }}>سعرة</div>
 </div>
 </div>
 <div className="col-3">
 <div className="p-2 bg-light rounded-3">
 <div className="fw-bold text-danger" style={{ fontSize: '0.95rem' }}>{proteinTarget}g</div>
 <div className="text-muted" style={{ fontSize: '0.65rem' }}>بروتين</div>
 </div>
 </div>
 <div className="col-3">
 <div className="p-2 bg-light rounded-3">
 <div className="fw-bold text-info" style={{ fontSize: '0.95rem' }}>{carbsTarget}g</div>
 <div className="text-muted" style={{ fontSize: '0.65rem' }}>كارب</div>
 </div>
 </div>
 <div className="col-3">
 <div className="p-2 bg-light rounded-3">
 <div className="fw-bold text-warning" style={{ fontSize: '0.95rem' }}>{fatsTarget}g</div>
 <div className="text-muted" style={{ fontSize: '0.65rem' }}>دهون</div>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Workout Action Card */}
 <div 
 onClick={() => setActiveTab('workout')}
 className="card border-0 shadow-sm bg-white rounded-4 mb-3 p-3"
 style={{ cursor: 'pointer' }}
 >
 <div className="d-flex align-items-center justify-content-between">
 <div className="d-flex align-items-center gap-3">
 <div className="p-2 bg-primary-subtle text-primary rounded-3">
 <i className="ti ti-barbell fs-4"></i>
 </div>
 <div>
 <div className="fw-bold text-dark">
 {activeSession?.session_name || activeSession?.session_code || 'تمرين اليوم'}
 </div>
 <small className="text-muted">{exercises.length} تمارين مبرمجة</small>
 </div>
 </div>
 <i className="ti ti-chevron-left text-muted"></i>
 </div>
 </div>

 {/* Check-in Action Card */}
 <div 
 onClick={() => setActiveTab('checkin')}
 className="card border-0 shadow-sm bg-white rounded-4 p-3"
 style={{ cursor: 'pointer' }}
 >
 <div className="d-flex align-items-center justify-content-between">
 <div className="d-flex align-items-center gap-3">
 <div className="p-2 bg-warning-subtle text-warning rounded-3">
 <i className="ti ti-clipboard-check fs-4"></i>
 </div>
 <div>
 <div className="fw-bold text-dark">المتابعة الأسبوعية</div>
 <small className="text-muted">تسجيل الأوزان وتحديث الخطة</small>
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
 className={`btn btn-sm rounded-pill px-3 fw-bold text-nowrap ${selectedSessionIdx === idx ? 'btn-primary' : 'btn-light border'}`}
 >
 {sess.session_name || sess.session_code || `تمرين ${idx + 1}`}
 </button>
 ))}
 </div>

 {/* Rest Timer Floating Toast */}
 {restSeconds > 0 && (
 <div className="alert alert-primary p-2 rounded-3 mb-3 d-flex justify-content-between align-items-center">
 <div className="small fw-bold">
 <i className="ti ti-timer me-1"></i> الراحة المتبقية: {restSeconds} ثانية
 </div>
 <button onClick={() => setRestSeconds(0)} className="btn btn-sm btn-link p-0 text-dark">إلغاء</button>
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
 <div key={exIdx} className="card border-0 shadow-sm bg-white rounded-4 p-3">
 <div className="d-flex justify-content-between align-items-start">
 <div>
 <div className="fw-bold text-dark">{ex.name_en || ex.exercise_code?.replace(/_/g, ' ') || 'Exercise'}</div>
 <small className="text-muted">{getArabicExerciseName(ex)}</small>
 </div>
 <button 
 onClick={() => toggleExercise(ex.exercise_code || exIdx)}
 className={`btn btn-sm rounded-circle p-1 d-flex align-items-center justify-content-center ${isDone ? 'btn-success text-white' : 'btn-outline-secondary'}`}
 style={{ width: '28px', height: '28px' }}
 >
 <i className={`ti ${isDone ? 'ti-check' : 'ti-circle'}`}></i>
 </button>
 </div>
 
 <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top">
 <div className="d-flex gap-1">
 <span className="badge bg-light text-dark border">{sets} مجموعات</span>
 <span className="badge bg-light text-dark border">{reps} تكرار</span>
 <span className="badge bg-light text-dark border">RIR {rir}</span>
 </div>
 <button 
 onClick={() => setRestSeconds(rest)}
 className="btn btn-outline-primary btn-sm rounded-pill py-0 px-2 fw-bold"
 style={{ fontSize: '0.72rem' }}
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

 {/* TAB 3: NUTRITION SCREEN */}
 {activeTab === 'nutrition' && (
 <div className="d-flex flex-column gap-3">
 {meals.map((meal, mIdx) => (
 <div key={mIdx} className="card border-0 shadow-sm bg-white rounded-4 overflow-hidden">
 <div className="bg-light p-3 border-bottom d-flex justify-content-between align-items-center">
 <h6 className="fw-bold text-dark mb-0">{meal.name || `الوجبة ${meal.meal_number || (mIdx + 1)}`}</h6>
 <span className="badge bg-primary-subtle text-primary">{meal.foods?.length || 0} أصناف</span>
 </div>
 <div className="p-3 d-flex flex-column gap-2">
 {meal.foods?.map((f, fIdx) => (
 <div key={fIdx} className="p-2 border rounded-3 bg-light d-flex justify-content-between align-items-center">
 <span className="fw-semibold text-dark small">{f.name_ar || f.name_en || 'صنف'}</span>
 <span className="badge bg-white text-primary border fw-bold">
 ({f.portion_g_rounded || f.grams || 100} جرام)
 </span>
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 )}

 {/* TAB 4: CHECKIN SCREEN */}
 {activeTab === 'checkin' && (
 <form onSubmit={handleCheckinSubmit}>
 <div className="card border-0 shadow-sm bg-white rounded-4 p-3 mb-3">
 <h6 className="fw-bold text-dark mb-1">أوزان الأيام الـ 7 على الريق</h6>
 <small className="text-muted d-block mb-3">سجل أوزانك اليومية بعد الاستيقاظ</small>
 <div className="row g-2">
 {weights.map((w, idx) => (
 <div className="col-4" key={idx}>
 <label className="text-muted small" style={{ fontSize: '0.68rem' }}>يوم {idx + 1}</label>
 <input 
 type="number" 
 step="0.1" 
 className="form-control form-control-sm text-center fw-bold" 
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

 <div className="card border-0 shadow-sm bg-white rounded-4 p-3 mb-3">
 <label className="fw-bold text-dark small mb-1">محيط الخصر (سم)</label>
 <input 
 type="number" 
 step="0.5" 
 className="form-control mb-3" 
 value={waist}
 onChange={(e) => setWaist(e.target.value)}
 />

 <div className="d-flex justify-content-between align-items-center mb-1">
 <label className="fw-bold text-dark small">الالتزام بالدايت: {adherence}%</label>
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
 className="btn btn-primary w-100 rounded-pill py-2 fw-bold"
 >
 {submittingCheckin ? 'جاري الإرسال...' : 'إرسال المتابعة للكابتن '}
 </button>
 </form>
 )}
 </>
 )}
 </div>

 {/* App Bottom Navigation Bar */}
 <div className="bg-white border-top py-2 px-3 d-flex justify-content-around align-items-center position-absolute bottom-0 start-0 end-0" style={{ height: '65px' }}>
 <button 
 onClick={() => setActiveTab('home')}
 className={`btn btn-link p-0 text-decoration-none d-flex flex-column align-items-center ${activeTab === 'home' ? 'text-primary' : 'text-muted'}`}
 >
 <i className="ti ti-layout-dashboard fs-5"></i>
 <span style={{ fontSize: '0.68rem', fontWeight: activeTab === 'home' ? 'bold' : 'normal' }}>الرئيسية</span>
 </button>
 <button 
 onClick={() => setActiveTab('workout')}
 className={`btn btn-link p-0 text-decoration-none d-flex flex-column align-items-center ${activeTab === 'workout' ? 'text-primary' : 'text-muted'}`}
 >
 <i className="ti ti-barbell fs-5"></i>
 <span style={{ fontSize: '0.68rem', fontWeight: activeTab === 'workout' ? 'bold' : 'normal' }}>التمارين</span>
 </button>
 <button 
 onClick={() => setActiveTab('nutrition')}
 className={`btn btn-link p-0 text-decoration-none d-flex flex-column align-items-center ${activeTab === 'nutrition' ? 'text-primary' : 'text-muted'}`}
 >
 <i className="ti ti-salad fs-5"></i>
 <span style={{ fontSize: '0.68rem', fontWeight: activeTab === 'nutrition' ? 'bold' : 'normal' }}>الوجبات</span>
 </button>
 <button 
 onClick={() => setActiveTab('checkin')}
 className={`btn btn-link p-0 text-decoration-none d-flex flex-column align-items-center ${activeTab === 'checkin' ? 'text-primary' : 'text-muted'}`}
 >
 <i className="ti ti-clipboard-check fs-5"></i>
 <span style={{ fontSize: '0.68rem', fontWeight: activeTab === 'checkin' ? 'bold' : 'normal' }}>المتابعة</span>
 </button>
 </div>

 </div>
 </div>
 );
}
