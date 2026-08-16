import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../config/api';
import NotificationsDropdown from '../components/NotificationsDropdown';

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
    activityLevel: 'MODERATE', // 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'HEAVY' | 'ATHLETE'
    goal: 'FAT_LOSS_STANDARD', // 'AGGRESSIVE_CUT' | 'FAT_LOSS_STANDARD' | 'MAINTENANCE' | 'LEAN_BULK' | 'MAX_BULK'
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
      // Katch-McArdle Formula
      const leanMass = form.weight * (1 - form.bodyFat / 100);
      return Math.round(370 + 21.6 * leanMass);
    }
    // Mifflin-St Jeor Formula
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

  // 3. Goal Calorie Adjustment
  const getGoalAdjustment = () => {
    switch (form.goal) {
      case 'AGGRESSIVE_CUT': return -0.25;
      case 'FAT_LOSS_STANDARD': return -0.20;
      case 'MAINTENANCE': return 0.0;
      case 'LEAN_BULK': return 0.10;
      case 'MAX_BULK': return 0.18;
      default: return -0.20;
    }
  };

  const bmr = calculateBMR();
  const tdee = Math.round(bmr * getActivityMultiplier());
  const targetCalories = Math.round(tdee * (1 + getGoalAdjustment()));

  // 4. Macro Splits
  const targetProteinGrams = Math.round(form.weight * form.proteinPerKg);
  const proteinCalories = targetProteinGrams * 4;

  const targetFatGrams = Math.round(Math.max(form.weight * 0.7, (targetCalories * 0.22) / 9));
  const fatCalories = targetFatGrams * 9;

  const remainingCalories = Math.max(0, targetCalories - proteinCalories - fatCalories);
  const targetCarbGrams = Math.round(remainingCalories / 4);

  // 5. Water & Steps Target
  const waterTargetLiters = (form.weight * 0.038).toFixed(1);
  const stepsTarget = form.goal.includes('CUT') || form.goal.includes('LOSS') ? '10,000 - 12,000' : '8,000 - 10,000';

  const handleCopyWhatsapp = () => {
    const text = `📊 *خطة السعرات والماكروز المحسوبة بدقة (Z-Calculator)* 🏋️‍♂️\n\n🎯 *الهدف:* ${getGoalLabel(form.goal)}\n🔥 *السعرات اليومية المستهدفة:* ${targetCalories} سعرة حرارية\n(معدل الحرق اليومي TDEE: ${tdee} سعرة)\n\n🥩 *البروتين:* ${targetProteinGrams} جم (${proteinCalories} kcal)\n🍚 *الكاربوهيدرات:* ${targetCarbGrams} جم (${targetCarbGrams * 4} kcal)\n🥑 *الدهون الصحية:* ${targetFatGrams} جم (${fatCalories} kcal)\n\n💧 *احتياج الماء اليومي:* ${waterTargetLiters} لتر\n🚶‍♂️ *المعدل المستهدف للخطوات:* ${stepsTarget} خطوة يومياً\n\nبالتوفيق يا بطل! 💪`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleApplyToClient = async () => {
    if (!selectedClient) {
      alert('يرجى اختيار متدرب من القائمة أولاً');
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/api/v1/programs/active/${selectedClient}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تحميل خطة المتدرب');

      const updatedProgram = { ...data.master_program };
      if (!updatedProgram.nutrition_program) updatedProgram.nutrition_program = {};
      if (!updatedProgram.nutrition_program.daily_targets) updatedProgram.nutrition_program.daily_targets = {};

      updatedProgram.nutrition_program.daily_targets.calories = targetCalories;
      updatedProgram.nutrition_program.daily_targets.protein_g = targetProteinGrams;
      updatedProgram.nutrition_program.daily_targets.carbs_g = targetCarbGrams;
      updatedProgram.nutrition_program.daily_targets.fats_g = targetFatGrams;

      const saveRes = await fetch(`${API_BASE}/api/v1/programs/update-custom`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_code: selectedClient,
          master_program: updatedProgram
        })
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error || 'فشل حفظ وتطبيق الخطة');

      alert(`✅ تم تطبيق السعرات (${targetCalories} kcal) والماكروز على خطة المشترك بنجاح في MariaDB z!`);
    } catch (err) {
      alert('خطأ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const getGoalLabel = (g) => {
    switch (g) {
      case 'AGGRESSIVE_CUT': return 'تنشيف سريع قاسي (-25% عجز)';
      case 'FAT_LOSS_STANDARD': return 'حرق دهون وتنشيف قياسي (-20% عجز)';
      case 'MAINTENANCE': return 'ثبات وزن وإعادة بناء الجسم (Recomposition)';
      case 'LEAN_BULK': return 'تضخيم وبناء عضلي صافي (+10% فائض)';
      case 'MAX_BULK': return 'تضخيم وزيادة وزن قوية (+18% فائض)';
      default: return 'حرق دهون';
    }
  };

  return (
    <div className="codex-wrapper" dir="rtl" style={{ minHeight: '100vh', backgroundColor: '#f6f8fb', fontFamily: 'Cairo, Tajawal, sans-serif' }}>
      {/* 1. Header */}
      <header className="codex-header">
        <div className="header-contian d-flex justify-content-between align-items-center">
          <div className="header-left d-flex align-items-center gap-3">
            <h5 className="fw-bold text-dark mb-0">حاسبة السعرات والماكروز المتقدمة (Z Macro Engine)</h5>
          </div>

          <div className="header-right d-flex align-items-center justify-content-end gap-3 pe-2">
            <NotificationsDropdown />

            <Link to="/" className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-semibold">
              <i className="ti ti-arrow-right me-1"></i> لوحة التحكم
            </Link>

            <div className="d-flex align-items-center gap-2 py-1 px-3 bg-light rounded-pill border ms-2">
              <img className="img-fluid rounded-circle border" src="/admin-dashboard_data/logo/z_coaching_logo.jpg" alt="Coach Logo" width="36" height="36" />
              <div className="d-none d-md-block text-end pe-1">
                <span className="fw-bold d-block text-dark lh-1" style={{ fontSize: '0.9rem' }}>حاسبة الماكروز</span>
                <small className="text-muted" style={{ fontSize: '0.72rem' }}>Z Macro & TDEE</small>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Sidebar (Right Side RTL) */}
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
          <Link 
            to="/" 
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
          </Link>
        </div>

        <div className="codex-menuwrapper custom-scroll" data-simplebar>
          <ul className="codex-menu">
            <li className="menu-item">
              <Link to="/">
                <div className="icon-item"><i className="ti ti-layout-dashboard"></i></div>
                <span>لوحة التحكم الرئيسية</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/user-dashboard">
                <div className="icon-item"><i className="ti ti-user-circle"></i></div>
                <span>واجهة المتدرب</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/progress">
                <div className="icon-item"><i className="ti ti-chart-line"></i></div>
                <span>تطور القياسات والصور</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/subscriptions">
                <div className="icon-item"><i className="ti ti-credit-card"></i></div>
                <span>الاشتراكات والمالية</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/exercises">
                <div className="icon-item"><i className="ti ti-barbell"></i></div>
                <span>مكتبة التمارين</span>
              </Link>
            </li>
            <li className="menu-item active">
              <Link to="/calculator">
                <div className="icon-item"><i className="ti ti-calculator"></i></div>
                <span>حاسبة الماكروز والسعرات</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/customers">
                <div className="icon-item"><i className="ti ti-user-plus"></i></div>
                <span>إدارة المشتركين والأكواد</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/profile">
                <div className="icon-item"><i className="ti ti-settings"></i></div>
                <span>إعدادات وهوية المدرب</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/mobile">
                <div className="icon-item"><i className="ti ti-device-mobile"></i></div>
                <span>تطبيق المتدرب (Mobile)</span>
              </Link>
            </li>
          </ul>
        </div>

        <div className="sidebarpro-sec mt-3 mb-4 mx-3 p-3 text-center" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill fw-bold" style={{ fontSize: '0.74rem' }}>
              <i className="ti ti-circle-filled me-1" style={{ fontSize: '7px' }}></i> محرك الذكاء نشط
            </span>
          </div>
          <h6 className="mb-1 fw-bold text-dark" style={{ fontSize: '0.88rem' }}>Z Coaching Platform</h6>
          <p className="text-muted mb-3" style={{ fontSize: '0.74rem' }}>النظام يعمل بكفاءة 100%</p>
          <Link 
            to="/intake/form" 
            className="btn btn-sm w-100 rounded-pill fw-bold text-white shadow-sm"
            style={{ 
              background: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)',
              padding: '8px 14px',
              fontSize: '0.86rem',
              border: 'none'
            }}
          >
            <i className="ti ti-user-plus me-1"></i> تسجيل مشترك جديد
          </Link>
        </div>
      </aside>

      {/* 3. Main Workspace */}
      <main className="themebody-wrap">
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
                          <option value="MALE">ذكر 👨</option>
                          <option value="FEMALE">أنثى 👩</option>
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
                            <div className="fw-bold text-primary small">🥩 البروتين</div>
                            <h4 className="fw-bold text-dark mb-0">{targetProteinGrams} <small className="fs-6 text-muted">جم</small></h4>
                            <small className="text-muted">{proteinCalories} kcal</small>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="p-3 rounded-3 text-center border" style={{ backgroundColor: '#f0fdf4' }}>
                            <div className="fw-bold text-success small">🍚 الكاربوهيدرات</div>
                            <h4 className="fw-bold text-dark mb-0">{targetCarbGrams} <small className="fs-6 text-muted">جم</small></h4>
                            <small className="text-muted">{targetCarbGrams * 4} kcal</small>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="p-3 rounded-3 text-center border" style={{ backgroundColor: '#fffbeb' }}>
                            <div className="fw-bold text-warning small">🥑 الدهون</div>
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
                            onClick={handleApplyToClient} 
                            disabled={saving || !selectedClient}
                            className="btn btn-primary w-100 rounded-pill fw-bold"
                          >
                            {saving ? 'جاري التطبيق...' : 'تطبيق على المتدرب 💾'}
                          </button>
                        </div>
                        <div className="col-12 mt-2">
                          <button 
                            onClick={handleCopyWhatsapp} 
                            className="btn btn-outline-success w-100 rounded-pill fw-bold"
                          >
                            {copied ? '✅ تم النسخ إلى الحافظة!' : 'نسخ ملخص الماكروز للواتساب 📲'}
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
      </main>
    </div>
  );
}
