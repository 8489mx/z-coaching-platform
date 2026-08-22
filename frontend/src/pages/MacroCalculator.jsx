import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import { copyToClipboard } from '../utils/clipboardUtils';
import {
  calculateMetabolicMacroProfile,
  DAILY_ACTIVITY_FACTORS,
  WORKOUT_FREQUENCY_FACTORS,
  GOAL_CALORIE_MULTIPLIERS
} from '../utils/metabolicMacroEngine';

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
    dailyActivity: 'STANDING_WALKING',
    workoutFrequency: 'DAYS_3_TO_5',
    goal: 'FAT_LOSS_STANDARD',
    proteinPerKg: 2.2,
    isMuscular: false
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

  const metabolic = calculateMetabolicMacroProfile({
    gender: form.gender,
    age: form.age,
    weight_kg: form.weight,
    height_cm: form.height,
    body_fat_percent: form.bodyFat || null,
    daily_activity: form.dailyActivity,
    workout_frequency: form.workoutFrequency,
    goal: form.goal,
    protein_per_kg: form.proteinPerKg,
    is_muscular: form.isMuscular
  });

  const bmr = metabolic.bmr_kcal;
  const tdee = metabolic.tdee_kcal;
  const targetCalories = metabolic.target_calories_kcal;

  const targetProteinGrams = metabolic.macro_targets.protein_g;
  const targetFatGrams = metabolic.macro_targets.fat_g;
  const targetCarbGrams = metabolic.macro_targets.carbs_g;

  const waterTargetLiters = metabolic.water_target_liters.toFixed(1);
  const stepsTarget = metabolic.steps_target;

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

      if (!updateRes.ok) throw new Error('فشل تحديث الخطة في السيرفر');
      alert(` تم تحديث وتطبيق أهداف السعرات والماكروز الجديدة على خطة المتدرب ${selectedClient} بنجاح!`);
    } catch (e) {
      alert('خطأ: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyWhatsapp = async () => {
    const text = ` أهداف السعرات والماكروز اليومية المخصصة لك:
 السعرات المستهدفة: ${targetCalories} سعرة
 البروتين: ${targetProteinGrams} جرام
 الكاربوهيدرات: ${targetCarbGrams} جرام
 الدهون الصحية: ${targetFatGrams} جرام
 احتياج الماء: ${waterTargetLiters} لتر يومياً
 الخطوات المستهدفة: ${stepsTarget.toLocaleString()} خطوة

بالتوفيق وبداية أسبوع قوية! `;

    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const getGoalLabel = (goal) => {
    switch (goal) {
      case 'AGGRESSIVE_CUT': return 'تنشيف سريع قاسي (-25%)';
      case 'FAT_LOSS_STANDARD': return 'تنشيف وحرق دهون (-20%)';
      case 'MAINTENANCE': return 'ثبات وإعادة تشكيل (0%)';
      case 'LEAN_BULK': return 'بناء عضلي صافي (+10%)';
      case 'MAX_BULK': return 'تضخيم وزيادة وزن (+18%)';
      default: return goal;
    }
  };

  return (
    <AdminLayout>
      <div className="theme-body">
        <div className="container-fluid">
          
          {/* Page Header (Consistent with Dashboard) */}
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h4 className="fw-bold text-dark mb-0" style={{ letterSpacing: '-0.3px', fontSize: '1.25rem' }}>
                  حاسبة معدل الأيض واحتياج الماكروز السريعة
                </h4>
                <span className="badge rounded-pill fw-bold" style={{ background: '#E5F0FF', color: '#0284C7', border: '1px solid #BAE6FD', fontSize: '0.7rem' }}>
                  Z COACHING V2.0
                </span>
              </div>
              <p className="text-muted small mb-0" style={{ fontSize: '0.8rem' }}>
                احتساب BMR و TDEE وتقسيم جرامات البروتين والكاربوهيدرات والدهون مع إمكانية التطبيق الفوري
              </p>
            </div>
          </div>

          <div className="row g-3">
            {/* Form Column */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm bg-white h-100" style={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                    <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', background: '#E5F0FF', color: '#0284C7', border: '1px solid #BAE6FD' }}>
                      <i className="ti ti-adjustments fs-6"></i>
                    </div>
                    <h5 className="fw-bold text-dark mb-0" style={{ fontSize: '0.98rem' }}>
                      بيانات المتدرب والمستوى البدني
                    </h5>
                  </div>

                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label small fw-bold text-dark">النوع (الجنس)</label>
                      <select 
                        className="form-select"
                        style={{ height: '38px', borderRadius: '10px', fontSize: '0.82rem' }}
                        value={form.gender}
                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      >
                        <option value="MALE">ذكر</option>
                        <option value="FEMALE">أنثى</option>
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="form-label small fw-bold text-dark">العمر (سنة)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        style={{ height: '38px', borderRadius: '10px', fontSize: '0.82rem' }}
                        value={form.age}
                        onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                      />
                    </div>

                    <div className="col-4">
                      <label className="form-label small fw-bold text-dark">الوزن (كجم)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        style={{ height: '38px', borderRadius: '10px', fontSize: '0.82rem' }}
                        value={form.weight}
                        onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
                      />
                    </div>

                    <div className="col-4">
                      <label className="form-label small fw-bold text-dark">الطول (سم)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        style={{ height: '38px', borderRadius: '10px', fontSize: '0.82rem' }}
                        value={form.height}
                        onChange={(e) => setForm({ ...form, height: Number(e.target.value) })}
                      />
                    </div>

                    <div className="col-4">
                      <label className="form-label small fw-bold text-dark">نسبة الدهون %</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        style={{ height: '38px', borderRadius: '10px', fontSize: '0.82rem' }}
                        placeholder="اختياري 18%"
                        value={form.bodyFat}
                        onChange={(e) => setForm({ ...form, bodyFat: Number(e.target.value) })}
                      />
                    </div>

                    <div className="col-md-6 col-12">
                      <label className="form-label small fw-bold text-dark">النشاط والحركة اليومية (NEAT)</label>
                      <select 
                        className="form-select"
                        style={{ height: '38px', borderRadius: '10px', fontSize: '0.82rem' }}
                        value={form.dailyActivity}
                        onChange={(e) => setForm({ ...form, dailyActivity: e.target.value })}
                      >
                        <option value="SEDENTARY_DESK">مكتبي خامل (قليل الحركة - 1.20)</option>
                        <option value="LIGHT_MOVEMENT">حركة خفيفة 5k-7k خطوة (1.30)</option>
                        <option value="STANDING_WALKING">وقوف ومشي 8k-11k خطوة (1.45)</option>
                        <option value="HEAVY_PHYSICAL">عمل بدني شاق ومجهد (1.60)</option>
                      </select>
                    </div>

                    <div className="col-md-6 col-12">
                      <label className="form-label small fw-bold text-dark">تكرار تمارين المقاومة (EAT)</label>
                      <select 
                        className="form-select"
                        style={{ height: '38px', borderRadius: '10px', fontSize: '0.82rem' }}
                        value={form.workoutFrequency}
                        onChange={(e) => setForm({ ...form, workoutFrequency: e.target.value })}
                      >
                        <option value="NO_WORKOUTS">بدون تمارين مقاومة (+0.00)</option>
                        <option value="DAYS_1_TO_2">1 - 2 يوم أسبوعياً (+0.075)</option>
                        <option value="DAYS_3_TO_5">3 - 5 أيام أسبوعياً (+0.150)</option>
                        <option value="DAYS_6_PLUS">6+ أيام مكثفة (+0.250)</option>
                      </select>
                    </div>

                    {metabolic.bmi >= 30 && (
                      <div className="col-12">
                        <div className="p-2 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <div className="form-check form-switch mb-0 d-flex align-items-center justify-content-between">
                            <label className="form-check-label small fw-bold text-dark mb-0" htmlFor="muscularSwitch">
                              سقف بروتين مؤشر كتلة الجسم (محسوب على {metabolic.calculation_weight_for_protein_kg}kg)
                            </label>
                            <input
                              className="form-check-input ms-2"
                              type="checkbox"
                              id="muscularSwitch"
                              checked={form.isMuscular}
                              onChange={(e) => setForm({ ...form, isMuscular: e.target.checked })}
                            />
                          </div>
                          <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.73rem' }}>
                            {form.isMuscular ? 'مفعّل: لاعب كمال أجسام ذو كتلة عضلية عالية (حساب على الوزن الكلي).' : 'مفعّل تلقائياً: حماية سقف البروتين لمنع هبوط الكاربوهيدرات والدهون الصحية.'}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="col-12">
                      <label className="form-label small fw-bold text-dark">الهدف المستهدف</label>
                      <select 
                        className="form-select"
                        style={{ height: '38px', borderRadius: '10px', fontSize: '0.82rem' }}
                        value={form.goal}
                        onChange={(e) => setForm({ ...form, goal: e.target.value })}
                      >
                        <option value="AGGRESSIVE_CUT">تنشيف سريع قاسي (-25% عجز سعرات)</option>
                        <option value="FAT_LOSS_STANDARD">تنشيف وحرق دهون قياسي (-20% عجز سعرات)</option>
                        <option value="MAINTENANCE">ثبات الوزن وإعادة تشكيل الجسم (0%)</option>
                        <option value="LEAN_BULK">بناء عضلي صافي وتضخيم نظيف (+10% فائض)</option>
                        <option value="MAX_BULK">تضخيم وزيادة وزن (+18% فائض)</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label small fw-bold text-dark mb-0">احتياج البروتين لكل كجم وزن</label>
                        <span className="badge rounded-pill fw-bold" style={{ background: '#E5F0FF', color: '#0284C7', border: '1px solid #BAE6FD', fontSize: '0.75rem' }}>
                          {form.proteinPerKg} جم / كجم
                        </span>
                      </div>
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
              <div className="card border-0 shadow-sm bg-white h-100" style={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div className="card-body p-4 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                      <div className="d-flex align-items-center gap-2">
                        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
                          <i className="ti ti-flame fs-6"></i>
                        </div>
                        <h5 className="fw-bold text-dark mb-0" style={{ fontSize: '0.98rem' }}>
                          نتائج الطاقة والماكروز المستهدفة
                        </h5>
                      </div>
                      <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#E5F0FF', color: '#0284C7', border: '1px solid #BAE6FD', fontSize: '0.72rem' }}>
                        {getGoalLabel(form.goal).split(' ')[0]}
                      </span>
                    </div>

                    {/* Calorie Stat Cards */}
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div className="p-3 bg-white rounded-3 border d-flex flex-column justify-content-between" style={{ borderColor: '#e2e8f0' }}>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="small text-muted" style={{ fontSize: '0.74rem' }}>معدل الحرق (BMR)</span>
                            <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: '24px', height: '24px', background: '#f1f5f9', color: '#64748b' }}>
                              <i className="ti ti-flame" style={{ fontSize: '0.75rem' }}></i>
                            </div>
                          </div>
                          <h4 className="fw-bold text-dark mb-0 d-flex align-items-baseline gap-1" style={{ fontSize: '1.25rem', letterSpacing: '-0.5px' }}>
                            <span>{bmr}</span>
                            <small className="fs-6 text-muted fw-normal">kcal</small>
                          </h4>
                        </div>
                      </div>

                      <div className="col-6">
                        <div className="p-3 bg-white rounded-3 border d-flex flex-column justify-content-between" style={{ borderColor: '#e2e8f0' }}>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="small text-muted" style={{ fontSize: '0.74rem' }}>استهلاك الطاقة (TDEE)</span>
                            <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: '24px', height: '24px', background: '#E5F0FF', color: '#0284C7' }}>
                              <i className="ti ti-bolt" style={{ fontSize: '0.75rem' }}></i>
                            </div>
                          </div>
                          <h4 className="fw-bold text-dark mb-0 d-flex align-items-baseline gap-1" style={{ fontSize: '1.25rem', letterSpacing: '-0.5px' }}>
                            <span>{tdee}</span>
                            <small className="fs-6 text-muted fw-normal">kcal</small>
                          </h4>
                        </div>
                      </div>

                      <div className="col-12">
                        <div className="p-3 rounded-3 text-center text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #58B4E5 0%, #0284C7 100%)', boxShadow: '0 4px 14px rgba(38, 28, 106, 0.25)' }}>
                          <small className="opacity-90 d-block" style={{ fontSize: '0.74rem' }}>السعرات اليومية المستهدفة للخطة</small>
                          <h2 className="fw-bold mb-0 d-flex align-items-baseline justify-content-center gap-1" style={{ letterSpacing: '-0.5px', fontSize: '1.6rem' }}>
                            <span>{targetCalories}</span>
                            <span className="fs-6 fw-normal opacity-90">سعرة حرارية</span>
                          </h2>
                        </div>
                      </div>
                    </div>

                    {/* Macros Breakdown Cards */}
                    <div className="row g-2 mb-3">
                      {/* Protein */}
                      <div className="col-4">
                        <div className="p-3 bg-white rounded-3 text-center border h-100 d-flex flex-column justify-content-between" style={{ borderColor: '#e2e8f0' }}>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="small fw-semibold" style={{ fontSize: '0.74rem', color: '#0284C7' }}>البروتين</span>
                            <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: '22px', height: '22px', background: '#E5F0FF', color: '#0284C7' }}>
                              <i className="ti ti-barbell" style={{ fontSize: '0.7rem' }}></i>
                            </div>
                          </div>
                          <div>
                            <h4 className="fw-bold text-dark mb-0 font-monospace" style={{ fontSize: '1.25rem' }}>
                              {targetProteinGrams} <small className="fs-6 text-muted fw-normal">جم</small>
                            </h4>
                            <small className="text-muted font-monospace" style={{ fontSize: '0.68rem' }}>{proteinCalories} kcal</small>
                          </div>
                          <div className="progress mt-2" style={{ height: '3px', background: '#f1f5f9' }}>
                            <div className="progress-bar" style={{ width: '85%', background: '#0284C7' }}></div>
                          </div>
                        </div>
                      </div>

                      {/* Carbs */}
                      <div className="col-4">
                        <div className="p-3 bg-white rounded-3 text-center border h-100 d-flex flex-column justify-content-between" style={{ borderColor: '#e2e8f0' }}>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="small fw-semibold" style={{ fontSize: '0.74rem', color: '#d97706' }}>الكارب</span>
                            <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: '22px', height: '22px', background: '#fffbeb', color: '#d97706' }}>
                              <i className="ti ti-flame" style={{ fontSize: '0.7rem' }}></i>
                            </div>
                          </div>
                          <div>
                            <h4 className="fw-bold text-dark mb-0 font-monospace" style={{ fontSize: '1.25rem' }}>
                              {targetCarbGrams} <small className="fs-6 text-muted fw-normal">جم</small>
                            </h4>
                            <small className="text-muted font-monospace" style={{ fontSize: '0.68rem' }}>{targetCarbGrams * 4} kcal</small>
                          </div>
                          <div className="progress mt-2" style={{ height: '3px', background: '#f1f5f9' }}>
                            <div className="progress-bar" style={{ width: '65%', background: '#d97706' }}></div>
                          </div>
                        </div>
                      </div>

                      {/* Fats */}
                      <div className="col-4">
                        <div className="p-3 bg-white rounded-3 text-center border h-100 d-flex flex-column justify-content-between" style={{ borderColor: '#e2e8f0' }}>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="small fw-semibold" style={{ fontSize: '0.74rem', color: '#059669' }}>الدهون</span>
                            <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: '22px', height: '22px', background: '#ecfdf5', color: '#059669' }}>
                              <i className="ti ti-shield-check" style={{ fontSize: '0.7rem' }}></i>
                            </div>
                          </div>
                          <div>
                            <h4 className="fw-bold text-dark mb-0 font-monospace" style={{ fontSize: '1.25rem' }}>
                              {targetFatGrams} <small className="fs-6 text-muted fw-normal">جم</small>
                            </h4>
                            <small className="text-muted font-monospace" style={{ fontSize: '0.68rem' }}>{fatCalories} kcal</small>
                          </div>
                          <div className="progress mt-2" style={{ height: '3px', background: '#f1f5f9' }}>
                            <div className="progress-bar" style={{ width: '50%', background: '#059669' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Extra Targets (Water & Steps) */}
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div className="p-2 px-3 rounded-3 border d-flex align-items-center gap-2" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                          <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: '28px', height: '28px', background: '#E5F0FF', color: '#0284C7' }}>
                            <i className="ti ti-droplet fs-6"></i>
                          </div>
                          <div>
                            <div className="small fw-bold text-dark" style={{ fontSize: '0.76rem' }}>احتياج الماء اليومي</div>
                            <small className="text-muted" style={{ fontSize: '0.72rem' }}>{waterTargetLiters} لتر / يوم</small>
                          </div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-2 px-3 rounded-3 border d-flex align-items-center gap-2" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                          <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: '28px', height: '28px', background: '#ecfdf5', color: '#059669' }}>
                            <i className="ti ti-walk fs-6"></i>
                          </div>
                          <div>
                            <div className="small fw-bold text-dark" style={{ fontSize: '0.76rem' }}>معدل الخطوات اليومي</div>
                            <small className="text-muted" style={{ fontSize: '0.72rem' }}>{stepsTarget.toLocaleString()} خطوة</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Client Assignment */}
                  <div className="pt-3 border-top" style={{ borderColor: '#f1f5f9' }}>
                    <div className="row g-2">
                      <div className="col-md-7">
                        <select 
                          className="form-select"
                          style={{ height: '36px', borderRadius: '10px', fontSize: '0.8rem', borderColor: '#e2e8f0' }}
                          value={selectedClient}
                          onChange={(e) => setSelectedClient(e.target.value)}
                        >
                          <option value="">-- اختر متدرب لتطبيق الخطة --</option>
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
                          className="btn btn-sm rounded-pill w-100 fw-bold shadow-xs text-white d-flex align-items-center justify-content-center gap-1"
                          style={{ height: '36px', background: '#0284C7', border: 'none', fontSize: '0.8rem' }}
                        >
                          {saving ? 'جاري التطبيق...' : <><i className="ti ti-device-floppy"></i> تطبيق على المتدرب</>}
                        </button>
                      </div>
                      <div className="col-12 mt-2">
                        <button 
                          type="button"
                          onClick={handleCopyWhatsapp} 
                          className="btn btn-sm rounded-pill w-100 fw-semibold d-flex align-items-center justify-content-center gap-1 shadow-xs"
                          style={{ height: '36px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontSize: '0.8rem' }}
                        >
                          <i className="ti ti-brand-whatsapp fs-6"></i>
                          <span>{copied ? ' تم النسخ إلى الحافظة!' : 'نسخ ملخص الماكروز للواتساب'}</span>
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
