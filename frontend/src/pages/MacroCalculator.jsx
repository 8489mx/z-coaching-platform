import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';

export default function MacroCalculator() {
 const [clients, setClients] = useState([]);
 const [selectedClient, setSelectedClient] = useState('');
 
 // Calculator Inputs
 const [form, setForm] = useState({
 gender: 'MALE',
 age: 26,
 weight: 85,
 height: 178,
 bodyFat: 18,
 activityLevel: 'MODERATE',
 goal: 'FAT_LOSS_STANDARD',
 proteinPerKg: 2.2,
 });

 const [copied, setCopied] = useState(false);
 const [saving, setSaving] = useState(false);

 useEffect(() => {
 fetchClients();
 }, []);

 const fetchClients = async () => {
 try {
 const res = await fetch(`${API_BASE}/api/v1/clients`);
 const data = await res.json();
 if (data.clients) setClients(data.clients);
 } catch (e) {
 console.error(e);
 }
 };

 // 1. Calculate BMR
 const calculateBMR = () => {
 if (form.bodyFat && form.bodyFat > 5 && form.bodyFat < 60) {
 const leanMass = form.weight * (1 - form.bodyFat / 100);
 return Math.round(370 + 21.6 * leanMass);
 }
 if (form.gender === 'MALE') {
 return Math.round(10 * form.weight + 6.25 * form.height - 5 * form.age + 5);
 } else {
 return Math.round(10 * form.weight + 6.25 * form.height - 5 * form.age - 161);
 }
 };

 // 2. Activity Multiplier
 const getActivityMultiplier = () => {
 switch (form.activityLevel) {
 case 'SEDENTARY': return 1.2;
 case 'LIGHT': return 1.375;
 case 'MODERATE': return 1.55;
 case 'HEAVY': return 1.725;
 case 'ATHLETE': return 1.9;
 default: return 1.55;
 }
 };

 // 3. Goal Multiplier
 const getGoalMultiplier = () => {
 switch (form.goal) {
 case 'AGGRESSIVE_CUT': return 0.75;
 case 'FAT_LOSS_STANDARD': return 0.80;
 case 'MAINTENANCE': return 1.00;
 case 'LEAN_BULK': return 1.10;
 case 'MAX_BULK': return 1.18;
 default: return 0.80;
 }
 };

 const bmr = calculateBMR();
 const tdee = Math.round(bmr * getActivityMultiplier());
 const targetCalories = Math.round(tdee * getGoalMultiplier());

 const targetProteinGrams = Math.round(form.weight * form.proteinPerKg);
 const proteinCalories = targetProteinGrams * 4;

 const fatCalories = Math.round(targetCalories * 0.25);
 const targetFatGrams = Math.round(fatCalories / 9);

 const remainingCalories = Math.max(0, targetCalories - proteinCalories - fatCalories);
 const targetCarbGrams = Math.round(remainingCalories / 4);

 const waterTargetLiters = (form.weight * 0.04).toFixed(1);
 const stepsTarget = form.goal.includes('CUT') || form.goal.includes('FAT') ? 10000 : 8000;

 const handleApplyToClient = async () => {
 if (!selectedClient) {
 alert('يرجى اختيار متدرب أولاً');
 return;
 }

 try {
 setSaving(true);
 const res = await fetch(`${API_BASE}/api/v1/programs/active/${selectedClient}`);
 const progData = await res.json();
 if (!res.ok) throw new Error(progData.error || 'فشل جلب برنامج المتدرب');

 const master = progData.master_program || {};
 if (!master.nutrition_program) master.nutrition_program = {};
 if (!master.nutrition_program.stages) master.nutrition_program.stages = {};

 master.nutrition_program.stages.energy_target = {
 target_calories_kcal: targetCalories,
 bmr_kcal: bmr,
 tdee_kcal: tdee
 };

 master.nutrition_program.stages.macro_targets = {
 protein_g: targetProteinGrams,
 carbs_g: targetCarbGrams,
 carbohydrate_g: targetCarbGrams,
 fats_g: targetFatGrams,
 fat_g: targetFatGrams
 };

 const updateRes = await fetch(`${API_BASE}/api/v1/programs/update-custom`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 client_code: selectedClient,
 master_program: master
 })
 });

 if (!updateRes.ok) throw new Error('فشل تحديث الخطة في MariaDB z');
 alert(` تم تحديث وتطبيق أهداف السعرات والماكروز الجديدة على خطة المتدرب ${selectedClient} بنجاح!`);
 } catch (e) {
 alert('خطأ: ' + e.message);
 } finally {
 setSaving(false);
 }
 };

 const handleCopyWhatsapp = () => {
 const text = ` أهداف السعرات والماكروز اليومية المخصصة لك:
 السعرات المستهدفة: ${targetCalories} سعرة
 البروتين: ${targetProteinGrams} جرام
 الكاربوهيدرات: ${targetCarbGrams} جرام
 الدهون الصحية: ${targetFatGrams} جرام
 احتياج الماء: ${waterTargetLiters} لتر يومياً
 الخطوات المستهدفة: ${stepsTarget.toLocaleString()} خطوة

بالتوفيق وبداية أسبوع قوية! `;

 navigator.clipboard.writeText(text);
 setCopied(true);
 setTimeout(() => setCopied(false), 2500);
 };

 const getGoalLabel = (goal) => {
 switch (goal) {
 case 'AGGRESSIVE_CUT': return 'تنشيف سريع قاسي (-25%)';
 case 'FAT_LOSS_STANDARD': return 'تنشيف وحرق دهون قياسي (-20%)';
 case 'MAINTENANCE': return 'ثبات وإعادة تشكيل الجسم (0%)';
 case 'LEAN_BULK': return 'بناء عضلي صافي (+10%)';
 case 'MAX_BULK': return 'تضخيم وزيادة وزن (+18%)';
 default: return goal;
 }
 };

 return (
 <AdminLayout>
 <div className="theme-body">
 <div className="container-fluid">
 
 {/* Title */}
 <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
 <div>
 <h4 className="fw-bold text-dark mb-1">حاسبة معدل الأيض واحتياج الماكروز السريعة</h4>
 <p className="text-muted small mb-0">احتساب BMR و TDEE وتقسيم جرامات البروتين والكاربوهيدرات والدهون مع إمكانية التطبيق الفوري</p>
 </div>
 </div>

 <div className="row g-4">
 {/* Form Column */}
 <div className="col-lg-6">
 <div className="card border-0 shadow-sm bg-white h-100" style={{ borderRadius: '16px' }}>
 <div className="card-body p-4">
 <h5 className="fw-bold text-dark mb-3">
 <i className="ti ti-adjustments text-primary me-2"></i> بيانات المتدرب والمستوى البدني
 </h5>

 <div className="row g-3">
 <div className="col-6">
 <label className="form-label small fw-bold text-dark">النوع (الجنس)</label>
 <select 
 className="form-select"
 value={form.gender}
 onChange={(e) => setForm({ ...form, gender: e.target.value })}
 >
 <option value="MALE">ذكر </option>
 <option value="FEMALE">أنثى </option>
 </select>
 </div>

 <div className="col-6">
 <label className="form-label small fw-bold text-dark">العمر (سنة)</label>
 <input 
 type="number" 
 className="form-control" 
 value={form.age}
 onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
 />
 </div>

 <div className="col-4">
 <label className="form-label small fw-bold text-dark">الوزن (كجم)</label>
 <input 
 type="number" 
 className="form-control" 
 value={form.weight}
 onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
 />
 </div>

 <div className="col-4">
 <label className="form-label small fw-bold text-dark">الطول (سم)</label>
 <input 
 type="number" 
 className="form-control" 
 value={form.height}
 onChange={(e) => setForm({ ...form, height: Number(e.target.value) })}
 />
 </div>

 <div className="col-4">
 <label className="form-label small fw-bold text-dark">نسبة الدهون % (اختياري)</label>
 <input 
 type="number" 
 className="form-control" 
 placeholder="مثال 18"
 value={form.bodyFat}
 onChange={(e) => setForm({ ...form, bodyFat: Number(e.target.value) })}
 />
 </div>

 <div className="col-12">
 <label className="form-label small fw-bold text-dark">مستوى النشاط اليومي والتمارين</label>
 <select 
 className="form-select"
 value={form.activityLevel}
 onChange={(e) => setForm({ ...form, activityLevel: e.target.value })}
 >
 <option value="SEDENTARY">قليل الحركة (عمل مكتبي بدون تمارين - 1.2)</option>
 <option value="LIGHT">نشاط خفيف (تمارين 1-3 أيام أسبوعياً - 1.375)</option>
 <option value="MODERATE">نشاط معتدل (تمارين 3-5 أيام أسبوعياً - 1.55)</option>
 <option value="HEAVY">نشاط عالي (تمارين 6-7 أيام شديدة - 1.725)</option>
 <option value="ATHLETE">نشاط رياضي شاق (تمارين مرتين يومياً - 1.9)</option>
 </select>
 </div>

 <div className="col-12">
 <label className="form-label small fw-bold text-dark">الهدف المستهدف</label>
 <select 
 className="form-select"
 value={form.goal}
 onChange={(e) => setForm({ ...form, goal: e.target.value })}
 >
 <option value="AGGRESSIVE_CUT">تنشيف سريع قاسي (-25% عجز سعرات)</option>
 <option value="FAT_LOSS_STANDARD">تنشيف وحرق دهون قياسي (-20% عجز سعرات)</option>
 <option value="MAINTENANCE">ثبات الوزن وإعادة تشكيل الجسم (Recomposition 0%)</option>
 <option value="LEAN_BULK">بناء عضلي صافي وتضخيم نظيف (+10% فائض)</option>
 <option value="MAX_BULK">تضخيم وزيادة وزن قوية (+18% فائض)</option>
 </select>
 </div>

 <div className="col-12">
 <label className="form-label small fw-bold text-dark d-flex justify-content-between">
 <span>احتياج البروتين لكل كجم وزن</span>
 <span className="text-primary fw-bold">{form.proteinPerKg} جم / كجم</span>
 </label>
 <input 
 type="range" 
 className="form-range" 
 min="1.6" 
 max="2.6" 
 step="0.1"
 value={form.proteinPerKg}
 onChange={(e) => setForm({ ...form, proteinPerKg: Number(e.target.value) })}
 />
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Output Results Column */}
 <div className="col-lg-6">
 <div className="card border-0 shadow-sm bg-white h-100" style={{ borderRadius: '16px' }}>
 <div className="card-body p-4 d-flex flex-column justify-content-between">
 <div>
 <div className="d-flex justify-content-between align-items-center mb-3">
 <h5 className="fw-bold text-dark mb-0">
 <i className="ti ti-flame text-danger me-2"></i> نتائج الطاقة والماكروز المستهدفة
 </h5>
 <span className="badge bg-primary-subtle text-primary px-3 py-1 rounded-pill">
 {getGoalLabel(form.goal).split(' ')[0]}
 </span>
 </div>

 {/* Calorie Stat Cards */}
 <div className="row g-2 mb-4">
 <div className="col-6">
 <div className="p-3 bg-light rounded-4 border text-center">
 <small className="text-muted d-block">معدل الحرق الأساسي (BMR)</small>
 <h4 className="fw-bold text-dark mb-0">{bmr} <small className="fs-6 text-muted">kcal</small></h4>
 </div>
 </div>
 <div className="col-6">
 <div className="p-3 bg-light rounded-4 border text-center">
 <small className="text-muted d-block">استهلاك الطاقة الكلي (TDEE)</small>
 <h4 className="fw-bold text-dark mb-0">{tdee} <small className="fs-6 text-muted">kcal</small></h4>
 </div>
 </div>
 <div className="col-12">
 <div className="p-3 rounded-4 text-center text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #0099cc 0%, #0077b6 100%)' }}>
 <small className="opacity-90 d-block">السعرات اليومية المستهدفة للخطة</small>
 <h2 className="fw-bold mb-0">{targetCalories} <span className="fs-5">سعرة حرارية</span></h2>
 </div>
 </div>
 </div>

 {/* Macros Breakdown Cards */}
 <div className="row g-2 mb-4">
 <div className="col-4">
 <div className="p-3 rounded-3 text-center border" style={{ backgroundColor: '#eff6ff' }}>
 <div className="fw-bold text-primary small"> البروتين</div>
 <h4 className="fw-bold text-dark mb-0">{targetProteinGrams} <small className="fs-6 text-muted">جم</small></h4>
 <small className="text-muted">{proteinCalories} kcal</small>
 </div>
 </div>
 <div className="col-4">
 <div className="p-3 rounded-3 text-center border" style={{ backgroundColor: '#f0fdf4' }}>
 <div className="fw-bold text-success small"> الكاربوهيدرات</div>
 <h4 className="fw-bold text-dark mb-0">{targetCarbGrams} <small className="fs-6 text-muted">جم</small></h4>
 <small className="text-muted">{targetCarbGrams * 4} kcal</small>
 </div>
 </div>
 <div className="col-4">
 <div className="p-3 rounded-3 text-center border" style={{ backgroundColor: '#fffbeb' }}>
 <div className="fw-bold text-warning small"> الدهون</div>
 <h4 className="fw-bold text-dark mb-0">{targetFatGrams} <small className="fs-6 text-muted">جم</small></h4>
 <small className="text-muted">{fatCalories} kcal</small>
 </div>
 </div>
 </div>

 {/* Extra Targets */}
 <div className="p-3 bg-light rounded-3 border d-flex justify-content-between align-items-center mb-4">
 <div className="d-flex align-items-center gap-2">
 <i className="ti ti-droplet text-info fs-4"></i>
 <div>
 <div className="small fw-bold text-dark">احتياج الماء اليومي</div>
 <small className="text-muted">{waterTargetLiters} لتر / يوم</small>
 </div>
 </div>
 <div className="d-flex align-items-center gap-2">
 <i className="ti ti-walk text-success fs-4"></i>
 <div>
 <div className="small fw-bold text-dark">معدل الخطوات اليومي</div>
 <small className="text-muted">{stepsTarget} خطوة</small>
 </div>
 </div>
 </div>
 </div>

 {/* Actions & Client Assignment */}
 <div className="pt-3 border-top">
 <div className="row g-2">
 <div className="col-md-7">
 <select 
 className="form-select"
 value={selectedClient}
 onChange={(e) => setSelectedClient(e.target.value)}
 >
 <option value="">-- اختر متدرب لتطبيق الخطة عليه --</option>
 {clients.map(c => (
 <option key={c.id} value={c.client_code || c.id}>
 {c.full_name || `عميل ${c.client_code}`} ({c.client_code})
 </option>
 ))}
 </select>
 </div>
 <div className="col-md-5">
 <button 
 type="button"
 onClick={handleApplyToClient} 
 disabled={saving || !selectedClient}
 className="btn btn-primary w-100 rounded-pill fw-bold"
 >
 {saving ? 'جاري التطبيق...' : 'تطبيق على المتدرب '}
 </button>
 </div>
 <div className="col-12 mt-2">
 <button 
 type="button"
 onClick={handleCopyWhatsapp} 
 className="btn btn-outline-success w-100 rounded-pill fw-bold"
 >
 {copied ? ' تم النسخ إلى الحافظة!' : 'نسخ ملخص الماكروز للواتساب '}
 </button>
 </div>
 </div>
 </div>

 </div>
 </div>
 </div>
 </div>

 </div>
 </div>
 </AdminLayout>
 );
}
