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

      if (!updateRes.ok) throw new Error('فشل تحديث الخطة في السيرفر');
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
                <span className="badge rounded-pill fw-bold" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.7rem' }}>
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
                    <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe' }}>
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

                    <div className="col-12">
                      <label className="form-label small fw-bold text-dark">مستوى النشاط اليومي والتمارين</label>
                      <select 
                        className="form-select"
                        style={{ height: '38px', borderRadius: '10px', fontSize: '0.82rem' }}
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
                        <span className="badge rounded-pill fw-bold" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.75rem' }}>
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
                      <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.72rem' }}>
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
                            <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: '24px', height: '24px', background: '#f5f3ff', color: '#261c6a' }}>
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
                        <div className="p-3 rounded-3 text-center text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #372896 0%, #261c6a 100%)', boxShadow: '0 4px 14px rgba(38, 28, 106, 0.25)' }}>
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
                            <span className="small fw-semibold" style={{ fontSize: '0.74rem', color: '#261c6a' }}>البروتين</span>
                            <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: '22px', height: '22px', background: '#f5f3ff', color: '#261c6a' }}>
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
                            <div className="progress-bar" style={{ width: '85%', background: '#261c6a' }}></div>
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
                          <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: '28px', height: '28px', background: '#f5f3ff', color: '#261c6a' }}>
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
                          style={{ height: '36px', background: '#261c6a', border: 'none', fontSize: '0.8rem' }}
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
