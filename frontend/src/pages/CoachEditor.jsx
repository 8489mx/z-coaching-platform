import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';

export default function CoachEditor() {
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
          master_program: updatedProgram
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل حفظ التعديلات');

      alert('✅ تم حفظ جميع التعديلات في خطة المتدرب بنجاح في MariaDB z!');
      setProgram(updatedProgram);
    } catch (err) {
      alert('خطأ أثناء الحفظ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePrescriptionChange = (sessionIdx, exIdx, field, val) => {
    const updated = JSON.parse(JSON.stringify(program));
    const targetEx = updated.training_program.weeks[0].sessions[sessionIdx].exercises[exIdx];
    if (!targetEx.prescription) targetEx.prescription = {};
    targetEx.prescription[field] = Number(val);
    setProgram(updated);
  };

  const handleDeleteExercise = (sessionIdx, exIdx) => {
    const updated = JSON.parse(JSON.stringify(program));
    updated.training_program.weeks[0].sessions[sessionIdx].exercises.splice(exIdx, 1);
    setProgram(updated);
  };

  const handleAddExerciseToSession = (sessionIdx, exCode) => {
    if (!exCode) return;
    const catItem = exerciseCatalog.find(e => e.exercise_code === exCode);
    const updated = JSON.parse(JSON.stringify(program));
    const newEx = {
      exercise_code: exCode,
      name_ar: catItem?.name_ar || exCode,
      name_en: catItem?.name_en || exCode,
      target_muscle: catItem?.muscle || 'GENERAL',
      prescription: {
        sets: 3,
        target_min: 10,
        target_max: 12,
        rest_seconds: 90
      }
    };
    updated.training_program.weeks[0].sessions[sessionIdx].exercises.push(newEx);
    setProgram(updated);
  };

  const handleFoodGramChange = (mealIdx, foodIdx, grams) => {
    const updated = JSON.parse(JSON.stringify(program));
    const food = updated.nutrition_program.quantized_plan.meals[mealIdx].foods[foodIdx];
    food.portion_g_rounded = Number(grams);
    food.grams = Number(grams);
    setProgram(updated);
  };

  const handleDeleteFood = (mealIdx, foodIdx) => {
    const updated = JSON.parse(JSON.stringify(program));
    updated.nutrition_program.quantized_plan.meals[mealIdx].foods.splice(foodIdx, 1);
    setProgram(updated);
  };

  const training = program?.training_program;
  const nutrition = program?.nutrition_program;
  const sessions = training?.weeks?.[0]?.sessions || [];
  const meals = nutrition?.quantized_plan?.meals || [];

  return (
    <AdminLayout>
      <div className="theme-body">
        <div className="container-fluid">
          
          {/* Top Quick Actions Bar */}
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div>
              <h4 className="fw-bold text-dark mb-1">
                <i className="ti ti-edit text-primary me-2"></i> محرر وتخصيص الخطة (Master Coach Editor)
              </h4>
              <p className="text-muted small mb-0">المتدرب: <strong>{user?.full_name || targetUserId}</strong> ({user?.phone_number || '-'})</p>
            </div>
            <div className="d-flex gap-2 flex-wrap">
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
                type="button"
                onClick={handleSaveProgram} 
                disabled={saving} 
                className="btn btn-primary btn-sm rounded-pill px-4 fw-bold shadow-sm"
              >
                {saving ? 'جاري الحفظ...' : 'حفظ وتفعيل التعديلات 💾'}
              </button>
            </div>
          </div>

          {/* Editor Tabs Navigation */}
          <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
            <div className="nav nav-pills bg-white p-2 rounded-pill shadow-sm border">
              <button 
                type="button"
                className={`nav-link rounded-pill px-4 fw-bold ${activeTab === 'workout' ? 'active' : ''}`}
                onClick={() => setActiveTab('workout')}
              >
                <i className="ti ti-barbell me-1"></i> محرر التمارين والمجموعات
              </button>
              <button 
                type="button"
                className={`nav-link rounded-pill px-4 fw-bold ${activeTab === 'nutrition' ? 'active' : ''}`}
                onClick={() => setActiveTab('nutrition')}
              >
                <i className="ti ti-salad me-1"></i> محرر الدايت والوجبات
              </button>
              <button 
                type="button"
                className={`nav-link rounded-pill px-4 fw-bold ${activeTab === 'notes' ? 'active' : ''}`}
                onClick={() => setActiveTab('notes')}
              >
                <i className="ti ti-notes me-1"></i> توجيهات وملاحظات الكابتن
              </button>
            </div>
          </div>

          {/* TAB 1: WORKOUT EDITOR */}
          {activeTab === 'workout' && (
            <div className="row">
              {/* Sessions Tabs (Days) */}
              <div className="col-12 mb-3">
                <div className="d-flex gap-2 overflow-auto pb-2">
                  {sessions.map((sess, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => setSelectedSessionIndex(sIdx)}
                      className={`btn rounded-pill px-4 fw-bold ${selectedSessionIndex === sIdx ? 'btn-primary shadow-sm' : 'btn-white bg-white border'}`}
                    >
                      {sess.day_label || `اليوم ${sIdx + 1}`}: {sess.session_code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Session Exercises Table */}
              <div className="col-12">
                <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: '16px' }}>
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="fw-bold text-dark mb-0">
                        تمارين حصة: {sessions[selectedSessionIndex]?.session_code}
                      </h5>
                      <span className="badge bg-primary-subtle text-primary fw-bold">
                        {sessions[selectedSessionIndex]?.exercises?.length || 0} تمارين مبرمجة
                      </span>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>التمرين</th>
                            <th>المجموعات (Sets)</th>
                            <th>أقل تكرار (Min)</th>
                            <th>أعلى تكرار (Max)</th>
                            <th>الراحة (ثانية)</th>
                            <th className="text-center">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessions[selectedSessionIndex]?.exercises?.map((ex, exIdx) => (
                            <tr key={exIdx}>
                              <td>
                                <div className="fw-bold text-dark">{ex.name_ar || ex.exercise_code}</div>
                                <small className="text-muted">{ex.name_en || ex.exercise_code}</small>
                              </td>
                              <td style={{ width: '110px' }}>
                                <input 
                                  type="number" 
                                  className="form-control form-control-sm text-center fw-bold" 
                                  value={ex.prescription?.sets || 3}
                                  onChange={(e) => handlePrescriptionChange(selectedSessionIndex, exIdx, 'sets', e.target.value)}
                                />
                              </td>
                              <td style={{ width: '110px' }}>
                                <input 
                                  type="number" 
                                  className="form-control form-control-sm text-center" 
                                  value={ex.prescription?.target_min || 10}
                                  onChange={(e) => handlePrescriptionChange(selectedSessionIndex, exIdx, 'target_min', e.target.value)}
                                />
                              </td>
                              <td style={{ width: '110px' }}>
                                <input 
                                  type="number" 
                                  className="form-control form-control-sm text-center" 
                                  value={ex.prescription?.target_max || 12}
                                  onChange={(e) => handlePrescriptionChange(selectedSessionIndex, exIdx, 'target_max', e.target.value)}
                                />
                              </td>
                              <td style={{ width: '110px' }}>
                                <input 
                                  type="number" 
                                  className="form-control form-control-sm text-center" 
                                  value={ex.prescription?.rest_seconds || 90}
                                  onChange={(e) => handlePrescriptionChange(selectedSessionIndex, exIdx, 'rest_seconds', e.target.value)}
                                />
                              </td>
                              <td className="text-center">
                                <button 
                                  type="button"
                                  onClick={() => handleDeleteExercise(selectedSessionIndex, exIdx)}
                                  className="btn btn-outline-danger btn-sm rounded-circle p-2"
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

                    {/* Add Exercise from Catalog Selector */}
                    <div className="mt-4 pt-3 border-top d-flex gap-2 align-items-center">
                      <select 
                        id="newExerciseSelect"
                        className="form-select form-select-sm"
                        style={{ maxWidth: '350px' }}
                      >
                        <option value="">-- اختر تمرين لإضافته للحصة --</option>
                        {exerciseCatalog.map(cat => (
                          <option key={cat.exercise_code} value={cat.exercise_code}>
                            {cat.name_ar} ({cat.name_en})
                          </option>
                        ))}
                      </select>
                      <button 
                        type="button"
                        onClick={() => {
                          const val = document.getElementById('newExerciseSelect').value;
                          if (val) handleAddExerciseToSession(selectedSessionIndex, val);
                        }}
                        className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-bold"
                      >
                        <i className="ti ti-plus me-1"></i> إضافة التمرين
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NUTRITION EDITOR */}
          {activeTab === 'nutrition' && (
            <div className="row g-4">
              <div className="col-12">
                <div className="card border-0 shadow-sm bg-white mb-3" style={{ borderRadius: '16px' }}>
                  <div className="card-body p-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                      <h5 className="fw-bold text-dark mb-1">أهداف الطاقة والماكروز اليومية للخطة</h5>
                      <p className="text-muted small mb-0">يمكنك تعديل جرامات كل وجبة ومقادير الأصناف مباشرة</p>
                    </div>
                    <div className="d-flex gap-2">
                      <span className="badge bg-primary px-3 py-2 rounded-pill fs-6">
                        {Math.round(nutrition?.stages?.energy_target?.target_calories_kcal || 2200)} سعرة
                      </span>
                      <span className="badge bg-danger px-3 py-2 rounded-pill fs-6">
                        {Math.round(nutrition?.stages?.macro_targets?.protein_g || 170)} جم بروتين
                      </span>
                    </div>
                  </div>
                </div>

                {meals.map((meal, mealIdx) => (
                  <div className="card border-0 shadow-sm bg-white mb-3" key={mealIdx} style={{ borderRadius: '16px' }}>
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold text-primary mb-0">
                          {mealIdx === 0 ? '🍳 الوجبة 1 (الإفطار)' : mealIdx === 1 ? '🍗 الوجبة 2 (الغداء)' : '🥣 الوجبة 3 (العشاء)'}
                        </h6>
                        <span className="badge bg-light text-dark border">
                          ~{Math.round(meal.totals?.calories_kcal || 700)} سعرة
                        </span>
                      </div>

                      <div className="table-responsive">
                        <table className="table table-sm align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>الصنف الغذائي</th>
                              <th>الوزن المقترح (جرام)</th>
                              <th>الوحدة المنزلية</th>
                              <th className="text-center">إجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {meal.foods?.map((food, foodIdx) => (
                              <tr key={foodIdx}>
                                <td className="fw-semibold text-dark">{food.name_ar || food.name_en}</td>
                                <td style={{ width: '130px' }}>
                                  <input 
                                    type="number" 
                                    className="form-control form-control-sm text-center fw-bold" 
                                    value={food.portion_g_rounded || food.grams || 100}
                                    onChange={(e) => handleFoodGramChange(mealIdx, foodIdx, e.target.value)}
                                  />
                                </td>
                                <td className="small text-muted">{food.serving_display_ar || '-'}</td>
                                <td className="text-center">
                                  <button 
                                    type="button"
                                    onClick={() => handleDeleteFood(mealIdx, foodIdx)}
                                    className="btn btn-outline-danger btn-sm p-1 rounded-circle"
                                    style={{ width: '28px', height: '28px' }}
                                    title="حذف الصنف"
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
                  type="button"
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
    </AdminLayout>
  );
}
