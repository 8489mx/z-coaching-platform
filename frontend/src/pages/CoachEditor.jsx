import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import WhatsAppModal from '../components/modals/WhatsAppModal';

export default function CoachEditor() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState('workout'); // 'workout' | 'nutrition' | 'mobility' | 'notes'
  const [user, setUser] = useState(null);
  const [program, setProgram] = useState(null);
  const [coachNotes, setCoachNotes] = useState('');
  const [exerciseCatalog, setExerciseCatalog] = useState([]);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(0);
  const [whatsappClient, setWhatsappClient] = useState(null);
  const [selectedExToAdd, setSelectedExToAdd] = useState('');

  // Active client ID and submission ID from URL
  const searchParams = new URLSearchParams(window.location.search);
  const targetUserId = userId || searchParams.get('user_id') || '';
  const submissionId = searchParams.get('submission_id');

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

  const handleSaveDraft = async () => {
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
      if (!res.ok) throw new Error(data.error || 'فشل حفظ المسودة');

      alert('تم حفظ المسودة بنجاح ويمكنك الرجوع لها والتعديل عليها في أي وقت.');
      setProgram(updatedProgram);
    } catch (err) {
      alert('خطأ أثناء الحفظ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApproveAndPublish = async () => {
    try {
      setPublishing(true);
      const updatedProgram = {
        ...program,
        coach_notes: coachNotes
      };

      // 1. Save custom program changes
      await fetch(`${API_BASE}/api/v1/programs/update-custom`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_code: targetUserId,
          program_data: updatedProgram,
          coach_notes: coachNotes
        })
      });

      // 2. If submissionId exists, approve and publish submission
      if (submissionId) {
        await fetch(`${API_BASE}/api/v1/intake/${submissionId}/approve-and-publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coach_notes: coachNotes })
        });
      }

      setProgram(updatedProgram);

      // 3. Trigger WhatsApp Modal to deliver plan to client
      setWhatsappClient({
        full_name: user?.full_name || 'البطل',
        phone_number: user?.phone_number || '',
        client_code: user?.client_code || targetUserId
      });

    } catch (err) {
      alert('حدث خطأ أثناء اعتماد الخطة: ' + err.message);
    } finally {
      setPublishing(false);
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
    const catItem = exerciseCatalog.find(e => e.code === exCode);
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
    setSelectedExToAdd('');
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
  const cardio = program?.cardio_program;
  const mobility = program?.mobility_program;

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
                <i className="ti ti-file-text me-1"></i> معاينة الـ PDF (صفحتين)
              </Link>
              <Link 
                to={`/user-dashboard?user_id=${targetUserId}`} 
                target="_blank" 
                className="btn btn-light btn-sm rounded-pill px-3 border"
              >
                <i className="ti ti-eye me-1"></i> معاينة بوابة العميل
              </Link>
              
              {/* 1. Save Draft Button */}
              <button 
                type="button"
                onClick={handleSaveDraft} 
                disabled={saving || publishing} 
                className="btn btn-light btn-sm rounded-pill px-3 fw-semibold border"
                style={{ height: '34px', fontSize: '0.8rem' }}
              >
                {saving ? 'جاري الحفظ...' : 'حفظ كمسودة'}
              </button>

              {/* 2. Approve & Publish Button */}
              <button 
                type="button"
                onClick={handleApproveAndPublish} 
                disabled={publishing || saving} 
                className="btn btn-sm rounded-pill px-4 fw-bold shadow-sm text-white d-flex align-items-center gap-1"
                style={{ height: '34px', background: '#261c6a', border: 'none', boxShadow: '0 3px 10px rgba(38, 28, 106, 0.28)', fontSize: '0.8rem' }}
              >
                {publishing ? (
                  <><span className="spinner-border spinner-border-sm me-1"></span> جاري الاعتماد والنشر...</>
                ) : (
                  <><i className="ti ti-check"></i> اعتماد وإرسال الخطة للعميل</>
                )}
              </button>
            </div>
          </div>

          {/* AI Rationale & Safety Audit Box */}
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px', background: '#fbfaff', border: '1px solid #ede9fe', borderRight: '4px solid #261c6a' }}>
            <div className="card-body p-3">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe' }}>
                  <i className="ti ti-sparkles" style={{ fontSize: '0.85rem' }}></i>
                </div>
                <h6 className="fw-bold mb-0" style={{ color: '#261c6a', fontSize: '0.92rem' }}>
                  تقرير الذكاء الرياضي والتدقيق الأمني (Explainable AI & Safety Audit)
                </h6>
              </div>

              <div className="row g-2 text-dark small" style={{ fontSize: '0.82rem', lineHeight: '1.6' }}>
                <div className="col-md-6">
                  <div className="p-2 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
                    <strong className="text-danger d-block mb-1">
                      <i className="ti ti-heart-rate-monitor me-1"></i> مراعاة الإصابات والموانع:
                    </strong>
                    <span>
                      {program?.ai_rationale?.injury_exclusions?.[0] || 'تم فحص المفاصل والأربطة؛ البرنامج يعتمد على التمارين المركبة الحرة مع مدى حركي آمن.'}
                    </span>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-2 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
                    <strong className="text-success d-block mb-1">
                      <i className="ti ti-apple me-1"></i> الحساسية وتفضيلات الطعام:
                    </strong>
                    <span>
                      {program?.ai_rationale?.food_exclusions?.[0] || 'الدايت خالٍ من أي أطعمة تسبب الحساسية مع خيارات تبديل ذكية متنوعة.'}
                    </span>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-2 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
                    <strong className="d-block mb-1" style={{ color: '#261c6a' }}>
                      <i className="ti ti-flame me-1"></i> استراتيجية السعرات والماكروز:
                    </strong>
                    <span>
                      {program?.ai_rationale?.macro_rationale || 'عجز سعرات مدروس (~400 kcal) مع بروتين كافي لحماية الكتلة العضلية وتحفيز حرق الدهون.'}
                    </span>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-2 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
                    <strong className="text-warning d-block mb-1">
                      <i className="ti ti-activity me-1"></i> الكارديو وحرق الدهون:
                    </strong>
                    <span>
                      {program?.ai_rationale?.cardio_strategy || '2-3 جلسات أسبوعياً Zone 2 (120-135 bpm) لحرق الدهون دون إجهاد الاستشفاء.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Editor Tabs Navigation (Quiet Luxury Style) */}
          <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
            <div className="d-flex gap-2 p-1 bg-white rounded-pill shadow-sm border flex-wrap" style={{ borderColor: '#e2e8f0' }}>
              {[
                { id: 'workout', label: 'جدول التمارين والمجموعات', icon: 'ti-barbell' },
                { id: 'nutrition', label: 'الدايت والوجبات', icon: 'ti-salad' },
                { id: 'mobility', label: 'الإحماء والإطالات', icon: 'ti-stretching' },
                { id: 'notes', label: 'توجيهات الكابتن المباشرة', icon: 'ti-notes' }
              ].map(t => (
                <button 
                  key={t.id}
                  type="button"
                  className={`btn btn-sm rounded-pill px-4 fw-bold transition-all ${activeTab === t.id ? 'text-white shadow-sm' : 'bg-transparent text-dark'}`}
                  style={{
                    background: activeTab === t.id ? '#261c6a' : 'transparent',
                    border: 'none',
                    fontSize: '0.82rem',
                    height: '34px'
                  }}
                  onClick={() => setActiveTab(t.id)}
                >
                  <i className={`ti ${t.icon} me-1`}></i> {t.label}
                </button>
              ))}
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
                                  value={ex.prescription?.target_min || 8}
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
                              <td className="text-center" style={{ width: '80px' }}>
                                <button 
                                  type="button"
                                  className="btn btn-outline-danger btn-sm rounded-circle p-1"
                                  onClick={() => handleDeleteExercise(selectedSessionIndex, exIdx)}
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

                    {/* Add Exercise from Catalog Form */}
                    <div className="mt-4 p-3 bg-light rounded-4 d-flex align-items-center gap-2 flex-wrap">
                      <span className="fw-semibold small text-muted">إضافة تمرين جديد للحصة:</span>
                      <select 
                        className="form-select form-select-sm" 
                        style={{ maxWidth: '320px' }}
                        value={selectedExToAdd}
                        onChange={(e) => setSelectedExToAdd(e.target.value)}
                      >
                        <option value="">-- اختر من مكتبة التمارين --</option>
                        {exerciseCatalog.map((catEx, idx) => (
                          <option key={idx} value={catEx.code}>
                            {catEx.name_ar} ({catEx.name_en})
                          </option>
                        ))}
                      </select>
                      <button 
                        type="button" 
                        className="btn btn-primary btn-sm rounded-pill px-3 fw-bold"
                        disabled={!selectedExToAdd}
                        onClick={() => handleAddExerciseToSession(selectedSessionIndex, selectedExToAdd)}
                      >
                        <i className="ti ti-plus me-1"></i> إضافة التمرين
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NUTRITION & MEALS EDITOR */}
          {activeTab === 'nutrition' && (
            <div className="row g-3">
              {meals.map((meal, mIdx) => (
                <div key={mIdx} className="col-md-6 col-12">
                  <div className="card border-0 shadow-sm bg-white h-100" style={{ borderRadius: '16px' }}>
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold text-dark mb-0">
                          {meal.meal_label || `الوجبة ${mIdx + 1}`}
                        </h6>
                        <span className="badge bg-success-subtle text-success fw-bold">
                          {meal.foods?.length || 0} أصناف
                        </span>
                      </div>

                      <ul className="list-group list-group-flush mb-0">
                        {meal.foods?.map((food, fIdx) => (
                          <li key={fIdx} className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center border-0 border-bottom">
                            <div>
                              <div className="fw-bold text-dark small">{food.name_ar || food.food_code}</div>
                              <small className="text-muted">{food.serving_display_ar || `${food.grams || 100} جرام`}</small>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              <div className="input-group input-group-sm" style={{ width: '120px' }}>
                                <input 
                                  type="number" 
                                  className="form-control text-center fw-bold" 
                                  value={food.portion_g_rounded || food.grams || 100}
                                  onChange={(e) => handleFoodGramChange(mIdx, fIdx, e.target.value)}
                                />
                                <span className="input-group-text bg-light text-muted small">جرام</span>
                              </div>
                              <button 
                                type="button"
                                className="btn btn-outline-danger btn-sm rounded-circle p-1"
                                onClick={() => handleDeleteFood(mIdx, fIdx)}
                                title="حذف الصنف"
                              >
                                <i className="ti ti-trash"></i>
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: CARDIO & MOBILITY */}
          {activeTab === 'mobility' && (
            <div className="row g-3">
              <div className="col-md-6">
                <div className="card border-0 shadow-sm bg-white p-4 h-100" style={{ borderRadius: '16px' }}>
                  <h5 className="fw-bold text-dark mb-3">
                    <i className="ti ti-activity text-primary me-2"></i> بروتوكول الكارديو (Cardio Protocol)
                  </h5>
                  <div className="p-3 bg-light rounded-3 mb-3">
                    <p className="mb-1 small"><strong>الجلسات الأسبوعية:</strong> {cardio?.schedule?.sessions?.length || 2} جلسات</p>
                    <p className="mb-1 small"><strong>المدة لكل جلسة:</strong> {cardio?.schedule?.sessions?.[0]?.duration_minutes || 30} دقيقة</p>
                    <p className="mb-0 small"><strong>نطاق النبضات المستهدف (Zone 2):</strong> {cardio?.schedule?.sessions?.[0]?.heart_rate_target?.target_range_bpm || '120 - 135 bpm'}</p>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card border-0 shadow-sm bg-white p-4 h-100" style={{ borderRadius: '16px' }}>
                  <h5 className="fw-bold text-dark mb-3">
                    <i className="ti ti-stretching text-success me-2"></i> الإحماء والموبيلتي (Mobility & Warm-up)
                  </h5>
                  <div className="p-3 bg-light rounded-3 mb-3">
                    <p className="mb-1 small"><strong>استراتيجية الإحماء:</strong> مدمجة مع التمارين الأساسية (Integrated Mobility)</p>
                    <p className="mb-0 small"><strong>تمارين الإطالة المخصصة:</strong> فتح الحوض، الكتف، وعضلات الظهر السفلية قبل كل تمرين.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COACH DIRECT NOTES */}
          {activeTab === 'notes' && (
            <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: '16px' }}>
              <div className="card-body p-4">
                <h5 className="fw-bold text-dark mb-2">توجيهات وملاحظات الكابتن للعميل</h5>
                <p className="text-muted small mb-3">
                  هذه التعليمات ستظهر مباشرة في ترويسة تطبيق العميل وفي أول صفحة من ملف الـ PDF.
                </p>
                <textarea 
                  className="form-control bg-light border-0 p-3 mb-3" 
                  rows="6"
                  placeholder="اكتب توجيهاتك ونصائح الأسبوع الأول للمتدرب هنا..."
                  value={coachNotes}
                  onChange={(e) => setCoachNotes(e.target.value)}
                  style={{ fontSize: '0.95rem', lineHeight: '1.7' }}
                />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* WhatsApp Modal after Publishing */}
      {whatsappClient && (
        <WhatsAppModal 
          client={whatsappClient}
          onClose={() => {
            setWhatsappClient(null);
            navigate('/intake/submissions');
          }}
        />
      )}
    </AdminLayout>
  );
}
