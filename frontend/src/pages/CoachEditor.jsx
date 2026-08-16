import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';

export default function CoachEditor() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('workout'); // 'workout' | 'nutrition' | 'notes'
  const [user, setUser] = useState(null);
  const [program, setProgram] = useState(null);
  const [coachNotes, setCoachNotes] = useState('');
  const [exerciseCatalog, setExerciseCatalog] = useState([]);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(0);

  // Active client ID from URL or session
  const searchParams = new URLSearchParams(window.location.search);
  const targetUserId = searchParams.get('user_id') || '2';

  useEffect(() => {
    fetchProgramAndCatalog();
  }, [targetUserId]);

  const fetchProgramAndCatalog = async () => {
    try {
      setLoading(true);
      const [progRes, catRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/programs/active/${targetUserId}`),
        fetch(`${API_BASE}/api/v1/programs/exercises-catalog`)
      ]);

      const progData = await progRes.json();
      const catData = await catRes.json();

      if (!progRes.ok) throw new Error(progData.error || 'فشل تحميل خطة المتدرب');

      setUser(progData.user);
      setProgram(progData.master_program);
      setCoachNotes(progData.master_program?.coach_notes || '');
      if (catData.exercises) setExerciseCatalog(catData.exercises);
    } catch (err) {
      alert('خطأ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProgram = async () => {
    try {
      setSaving(true);
      const updatedProgram = {
        ...program,
        coach_notes: coachNotes
      };

      const res = await fetch(`${API_BASE}/api/v1/programs/update-custom`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_code: targetUserId,
          program_data: updatedProgram,
          coach_notes: coachNotes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل حفظ التعديلات');

      alert('✅ تم حفظ وتطبيق التعديلات بنجاح في قاعدة البيانات MariaDB `z`!');
      setProgram(data.master_program);
    } catch (err) {
      alert('خطأ في الحفظ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Workout Modifiers
  const updateExerciseField = (sessionIdx, exIdx, field, value) => {
    const newProg = JSON.parse(JSON.stringify(program));
    const targetEx = newProg.training_program.weeks[0].sessions[sessionIdx].exercises[exIdx];
    targetEx[field] = Number(value) || value;
    setProgram(newProg);
  };

  const handleSwapExercise = (sessionIdx, exIdx, newCode) => {
    const found = exerciseCatalog.find(e => e.code === newCode);
    if (!found) return;

    const newProg = JSON.parse(JSON.stringify(program));
    const targetEx = newProg.training_program.weeks[0].sessions[sessionIdx].exercises[exIdx];
    targetEx.exercise_code = found.code;
    targetEx.name_en = found.name_en;
    targetEx.name_ar = found.name_ar;
    setProgram(newProg);
  };

  const handleDeleteExercise = (sessionIdx, exIdx) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التمرين من الجلسة؟')) return;
    const newProg = JSON.parse(JSON.stringify(program));
    newProg.training_program.weeks[0].sessions[sessionIdx].exercises.splice(exIdx, 1);
    setProgram(newProg);
  };

  const handleAddExercise = (sessionIdx) => {
    const firstEx = exerciseCatalog[0] || { code: 'CHEST_DUMBBELL_FLAT_BENCH_PRESS', name_en: 'Dumbbell Bench Press', name_ar: 'ضغط صدر بالدمبلز' };
    const newProg = JSON.parse(JSON.stringify(program));
    newProg.training_program.weeks[0].sessions[sessionIdx].exercises.push({
      exercise_code: firstEx.code,
      name_en: firstEx.name_en,
      name_ar: firstEx.name_ar,
      sets: 3,
      reps: 10,
      rir: 2,
      rest_seconds: 90
    });
    setProgram(newProg);
  };

  // Nutrition Modifiers
  const updateMacroTarget = (macro, value) => {
    const newProg = JSON.parse(JSON.stringify(program));
    if (!newProg.nutrition_program.targets) newProg.nutrition_program.targets = {};
    newProg.nutrition_program.targets[macro] = Number(value);
    setProgram(newProg);
  };

  const updateFoodGrams = (mealIdx, foodIdx, newGrams) => {
    const newProg = JSON.parse(JSON.stringify(program));
    const food = newProg.nutrition_program.quantized_plan.meals[mealIdx].foods[foodIdx];
    const grams = Number(newGrams) || 50;
    food.portion_g_rounded = grams;
    food.grams = grams;
    food.serving_display_ar = `${food.name_ar || 'صنف'} (${grams} جرام)`;
    setProgram(newProg);
  };

  const handleDeleteFood = (mealIdx, foodIdx) => {
    const newProg = JSON.parse(JSON.stringify(program));
    newProg.nutrition_program.quantized_plan.meals[mealIdx].foods.splice(foodIdx, 1);
    setProgram(newProg);
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f6f8fb', fontFamily: 'Cairo, Tajawal, sans-serif' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted mt-2">جاري تحميل بيانات خطة المتدرب...</p>
        </div>
      </div>
    );
  }

  const sessions = program?.training_program?.weeks?.[0]?.sessions || [];
  const meals = program?.nutrition_program?.quantized_plan?.meals || [];
  const activeSession = sessions[selectedSessionIndex] || sessions[0];

  return (
    <div className="codex-wrapper" dir="rtl" style={{ minHeight: '100vh', backgroundColor: '#f6f8fb', fontFamily: 'Cairo, Tajawal, sans-serif' }}>
      {/* 1. Header */}
      <header className="codex-header">
        <div className="header-contian d-flex justify-content-between align-items-center">
          <div className="header-left d-flex align-items-center gap-3">
            <Link to="/" className="btn btn-outline-secondary btn-sm rounded-pill px-3">
              <i className="ti ti-arrow-right me-1"></i> العودة للرئيسية
            </Link>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary px-3 py-2 fs-6 rounded-pill">
                كود العميل: {user?.client_code || targetUserId}
              </span>
              <h5 className="fw-bold text-dark mb-0">{user?.full_name || 'المتدرب'}</h5>
            </div>
          </div>

          <div className="header-right d-flex align-items-center justify-content-end gap-2 pe-2">
            <Link 
              to={`/pdf?user_id=${targetUserId}`} 
              target="_blank" 
              className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-semibold"
            >
              <i className="ti ti-file-text me-1"></i> تصدير PDF
            </Link>
            <Link 
              to={`/user-dashboard?user_id=${targetUserId}`} 
              target="_blank" 
              className="btn btn-light btn-sm rounded-pill px-3 border"
            >
              <i className="ti ti-eye me-1"></i> معاينة واجهة المتدرب
            </Link>
            <button 
              onClick={handleSaveProgram} 
              disabled={saving} 
              className="btn btn-primary btn-sm rounded-pill px-4 fw-bold shadow-sm"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ وتفعيل التعديلات 💾'}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Sidebar (Right Side RTL) */}
      <aside className="codex-sidebar">
        <div className="codex-brand">
          <Link className="d-flex align-items-center text-decoration-none" to="/">
            <img className="img-fluid" src="/admin-dashboard_data/logo/logo.png" alt="logo" />
            <span className="fs-3 align-middle ms-2 lh-1 text-primary fw-bold">FitNexus</span>
          </Link>
        </div>

        <div className="codex-menuwrapper custom-scroll" data-simplebar>
          <ul className="codex-menu">
            <li className="menu-item">
              <Link to="/">
                <div className="icon-item"><i className="ti ti-users"></i></div>
                <span>العملاء والمتدربين</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to={`/user-dashboard?user_id=${targetUserId}`}>
                <div className="icon-item"><i className="ti ti-layout-dashboard"></i></div>
                <span>واجهة المتدرب</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/customers">
                <div className="icon-item"><i className="ti ti-user-plus"></i></div>
                <span>توليد أكواد المشتركين</span>
              </Link>
            </li>
          </ul>
        </div>

        <div className="sidebarpro-sec">
          <img className="img-fluid" src="/admin-dashboard_data/pro-sec.png" alt="pro" />
          <h6 className="mb-1 fw-bold text-black">محرر وتخصيص الخطة</h6>
          <p className="small text-muted mb-0">تحكم كامل في التمارين والمجموعات والسعرات</p>
        </div>
      </aside>

      {/* 3. Main Workspace */}
      <main className="themebody-wrap">
        <div className="theme-body">
          <div className="container-fluid">
            
            {/* Editor Tabs Navigation */}
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
              <div className="nav nav-pills bg-white p-2 rounded-pill shadow-sm border">
                <button 
                  className={`nav-link rounded-pill px-4 fw-bold ${activeTab === 'workout' ? 'active' : ''}`}
                  onClick={() => setActiveTab('workout')}
                >
                  <i className="ti ti-barbell me-1"></i> محرر التمارين والمجموعات
                </button>
                <button 
                  className={`nav-link rounded-pill px-4 fw-bold ${activeTab === 'nutrition' ? 'active' : ''}`}
                  onClick={() => setActiveTab('nutrition')}
                >
                  <i className="ti ti-salad me-1"></i> محرر الدايت والوجبات
                </button>
                <button 
                  className={`nav-link rounded-pill px-4 fw-bold ${activeTab === 'notes' ? 'active' : ''}`}
                  onClick={() => setActiveTab('notes')}
                >
                  <i className="ti ti-notes me-1"></i> توجيهات وملاحظات الكابتن
                </button>
              </div>

              <button 
                onClick={handleSaveProgram} 
                disabled={saving} 
                className="btn btn-primary rounded-pill px-4 py-2 fw-bold"
              >
                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات في MariaDB z 💾'}
              </button>
            </div>

            {/* TAB 1: WORKOUT EDITOR */}
            {activeTab === 'workout' && (
              <div className="row">
                {/* Session Selector Sidebar */}
                <div className="col-lg-3 mb-4">
                  <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: '16px' }}>
                    <div className="card-body p-3">
                      <h6 className="fw-bold text-dark mb-3 px-2">أيام وتدريبات الأسبوع</h6>
                      <div className="d-flex flex-column gap-2">
                        {sessions.map((sess, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedSessionIndex(idx)}
                            className={`btn text-start p-3 rounded-3 d-flex justify-content-between align-items-center ${selectedSessionIndex === idx ? 'btn-primary text-white' : 'btn-light'}`}
                            style={{ border: '1px solid #e2e8f0' }}
                          >
                            <div>
                              <div className="fw-bold">{sess.session_name || `تمرين ${idx + 1}`}</div>
                              <small style={{ opacity: 0.85 }}>{sess.exercises?.length || 0} تمارين</small>
                            </div>
                            <i className="ti ti-chevron-left"></i>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Exercises Table Editor */}
                <div className="col-lg-9 mb-4">
                  <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: '16px' }}>
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                        <div>
                          <h5 className="fw-bold text-dark mb-1">
                            {activeSession?.session_name || 'تفاصيل التمارين'}
                          </h5>
                          <p className="text-muted small mb-0">يمكنك تعديل التمارين، المجموعات، التكرارات، فترات الراحة أو استبدال أي تمرين فوراً.</p>
                        </div>
                        <button 
                          onClick={() => handleAddExercise(selectedSessionIndex)}
                          className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-bold"
                        >
                          <i className="ti ti-plus me-1"></i> إضافة تمرين للجلسة
                        </button>
                      </div>

                      <div className="table-responsive">
                        <table className="table table-hover align-middle">
                          <thead className="table-light">
                            <tr>
                              <th style={{ width: '35%' }}>التمرين</th>
                              <th style={{ width: '15%' }}>المجموعات</th>
                              <th style={{ width: '15%' }}>التكرارات</th>
                              <th style={{ width: '15%' }}>الراحة (ثانية)</th>
                              <th style={{ width: '10%' }}>RIR</th>
                              <th className="text-center" style={{ width: '10%' }}>حذف</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeSession?.exercises?.map((ex, exIdx) => (
                              <tr key={exIdx}>
                                <td>
                                  <div className="d-flex flex-column gap-1">
                                    <select 
                                      className="form-select form-select-sm fw-bold border-primary-subtle"
                                      value={ex.exercise_code || ''}
                                      onChange={(e) => handleSwapExercise(selectedSessionIndex, exIdx, e.target.value)}
                                    >
                                      {exerciseCatalog.map((catEx) => (
                                        <option key={catEx.code} value={catEx.code}>
                                          {catEx.name_en} ({catEx.name_ar})
                                        </option>
                                      ))}
                                    </select>
                                    <small className="text-muted" style={{ fontSize: '0.78rem' }}>
                                      {ex.name_ar || ''}
                                    </small>
                                  </div>
                                </td>
                                <td>
                                  <input 
                                    type="number" 
                                    min="1" 
                                    max="10" 
                                    className="form-control form-control-sm text-center" 
                                    value={ex.sets || 3}
                                    onChange={(e) => updateExerciseField(selectedSessionIndex, exIdx, 'sets', e.target.value)}
                                  />
                                </td>
                                <td>
                                  <input 
                                    type="number" 
                                    min="1" 
                                    max="50" 
                                    className="form-control form-control-sm text-center" 
                                    value={ex.reps || 10}
                                    onChange={(e) => updateExerciseField(selectedSessionIndex, exIdx, 'reps', e.target.value)}
                                  />
                                </td>
                                <td>
                                  <input 
                                    type="number" 
                                    min="15" 
                                    max="300" 
                                    step="15" 
                                    className="form-control form-control-sm text-center" 
                                    value={ex.rest_seconds || 90}
                                    onChange={(e) => updateExerciseField(selectedSessionIndex, exIdx, 'rest_seconds', e.target.value)}
                                  />
                                </td>
                                <td>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    max="5" 
                                    className="form-control form-control-sm text-center" 
                                    value={ex.rir !== undefined ? ex.rir : 2}
                                    onChange={(e) => updateExerciseField(selectedSessionIndex, exIdx, 'rir', e.target.value)}
                                  />
                                </td>
                                <td className="text-center">
                                  <button 
                                    onClick={() => handleDeleteExercise(selectedSessionIndex, exIdx)}
                                    className="btn btn-outline-danger btn-sm rounded-circle p-1"
                                    style={{ width: '30px', height: '30px' }}
                                    title="حذف التمرين"
                                  >
                                    <i className="ti ti-trash"></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: NUTRITION & MEALS EDITOR */}
            {activeTab === 'nutrition' && (
              <div>
                {/* Target Macros Overview */}
                <div className="card border-0 shadow-sm bg-white mb-4" style={{ borderRadius: '16px' }}>
                  <div className="card-body p-4">
                    <h5 className="fw-bold text-dark mb-3">الأهداف اليومية للسعرات والماكروز</h5>
                    <div className="row g-3">
                      <div className="col-md-3">
                        <label className="form-label small text-muted">السعرات المستهدفة (kcal)</label>
                        <input 
                          type="number" 
                          className="form-control form-control-lg fw-bold text-primary" 
                          value={program?.nutrition_program?.targets?.calories_kcal || 2200}
                          onChange={(e) => updateMacroTarget('calories_kcal', e.target.value)}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small text-muted">البروتين (جرام)</label>
                        <input 
                          type="number" 
                          className="form-control form-control-lg fw-bold text-danger" 
                          value={program?.nutrition_program?.targets?.protein_g || 170}
                          onChange={(e) => updateMacroTarget('protein_g', e.target.value)}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small text-muted">الكاربوهيدرات (جرام)</label>
                        <input 
                          type="number" 
                          className="form-control form-control-lg fw-bold text-info" 
                          value={program?.nutrition_program?.targets?.carbs_g || 220}
                          onChange={(e) => updateMacroTarget('carbs_g', e.target.value)}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small text-muted">الدهون الصحية (جرام)</label>
                        <input 
                          type="number" 
                          className="form-control form-control-lg fw-bold text-warning" 
                          value={program?.nutrition_program?.targets?.fats_g || 60}
                          onChange={(e) => updateMacroTarget('fats_g', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Meals Editor Cards */}
                <div className="row g-4">
                  {meals.map((meal, mealIdx) => (
                    <div className="col-lg-4" key={mealIdx}>
                      <div className="card border-0 shadow-sm bg-white h-100" style={{ borderRadius: '16px' }}>
                        <div className="card-header bg-light border-0 p-3 d-flex justify-content-between align-items-center" style={{ borderRadius: '16px 16px 0 0' }}>
                          <h6 className="fw-bold text-dark mb-0">الوجبة {meal.meal_number || (mealIdx + 1)}</h6>
                          <span className="badge bg-primary-subtle text-primary">
                            {meal.foods?.length || 0} أصناف
                          </span>
                        </div>
                        <div className="card-body p-3">
                          <div className="d-flex flex-column gap-2">
                            {meal.foods?.map((f, foodIdx) => (
                              <div key={foodIdx} className="p-2 border rounded-3 bg-light d-flex justify-content-between align-items-center gap-2">
                                <div className="flex-grow-1">
                                  <div className="fw-bold text-dark small">{f.name_ar || f.name_en || 'صنف'}</div>
                                  <div className="d-flex align-items-center gap-2 mt-1">
                                    <label className="small text-muted" style={{ fontSize: '0.75rem' }}>جرام:</label>
                                    <input 
                                      type="number" 
                                      min="10" 
                                      max="1000" 
                                      step="5" 
                                      className="form-control form-control-sm text-center" 
                                      style={{ width: '80px', height: '28px' }}
                                      value={f.portion_g_rounded || f.grams || 100}
                                      onChange={(e) => updateFoodGrams(mealIdx, foodIdx, e.target.value)}
                                    />
                                  </div>
                                </div>
                                <button 
                                  onClick={() => handleDeleteFood(mealIdx, foodIdx)}
                                  className="btn btn-outline-danger btn-sm p-1 rounded-circle"
                                  style={{ width: '28px', height: '28px' }}
                                  title="حذف الصنف"
                                >
                                  <i className="ti ti-trash"></i>
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
            )}

            {/* TAB 3: COACH DIRECT NOTES */}
            {activeTab === 'notes' && (
              <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: '16px' }}>
                <div className="card-body p-4">
                  <h5 className="fw-bold text-dark mb-2">توجيهات وملاحظات الكابتن المباشرة للمتدرب</h5>
                  <p className="text-muted small mb-4">
                    اكتب هنا أي ملاحظات أو نصائح مخصصة لهذا المتدرب (مثل التركيز على شرب الماء، بطء الحركة السلبية، أو زيادة الكارديو). ستظهر هذه الملاحظات بشكل بارز في أعلى صفحة المتدرب.
                  </p>

                  <div className="form-group mb-4">
                    <label className="form-label fw-bold text-dark">نص التوجيهات والملاحظات</label>
                    <textarea 
                      className="form-control" 
                      rows="6" 
                      placeholder="مثال: ركز هذا الأسبوع على النزول البطيء (3 ثواني) في تمارين الصدر، ولا تنسَ شرب 3.5 لتر ماء يومياً قبل الساعة 8 مساءً..."
                      value={coachNotes}
                      onChange={(e) => setCoachNotes(e.target.value)}
                      style={{ fontSize: '1.05rem', lineHeight: '1.8' }}
                    ></textarea>
                  </div>

                  <button 
                    onClick={handleSaveProgram} 
                    disabled={saving} 
                    className="btn btn-primary rounded-pill px-4 py-2 fw-bold"
                  >
                    {saving ? 'جاري الحفظ...' : 'حفظ الملاحظات وتحديث واجهة المتدرب 💾'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
