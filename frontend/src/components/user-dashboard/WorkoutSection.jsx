import React, { useState } from 'react';
import { getArabicExerciseName } from '../../utils/exerciseTranslator';

export default function WorkoutSection({
  todaySession,
  loading,
  completedExercises,
  onToggleExercise,
  onOpenExerciseSwapModal
}) {
  const exercises = todaySession?.exercises || [];
  const completedCount = exercises.filter(ex => completedExercises[ex.exercise_code]).length;
  const isAllCompleted = exercises.length > 0 && completedCount === exercises.length;

  const [expandedExercise, setExpandedExercise] = useState(null);
  const [loggedSets, setLoggedSets] = useState({});
  const [restTimerSeconds, setRestTimerSeconds] = useState(null);

  // 1-Tap Quick Complete
  const handleQuickCompleteAll = () => {
    exercises.forEach(ex => {
      if (!completedExercises[ex.exercise_code]) {
        onToggleExercise(ex.exercise_code);
      }
    });
  };

  const handleToggleSet = (exCode, setIdx, defaultReps, defaultWeight = 20) => {
    const key = `${exCode}_set_${setIdx}`;
    setLoggedSets(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="z-glass-card mb-4 z-animate-in" id="today-workout">
      <div className="card-body p-4">
        
        {/* Section Header */}
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2 pb-2 border-bottom" style={{ borderColor: '#f1f5f9' }}>
          <div className="d-flex align-items-center gap-2">
            <div className="d-flex align-items-center justify-content-center flex-shrink-0 z-icon-energy" style={{ width: '34px', height: '34px', borderRadius: '10px' }}>
              <i className="ti ti-barbell fs-5"></i>
            </div>
            <div>
              <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.05rem' }}>
                جدول تمرين اليوم: {todaySession?.session_name || todaySession?.session_code || "UPPER_A"}
              </h5>
              <small className="text-muted" style={{ fontSize: '0.76rem' }}>مستوى الجهد المستهدف: 2-3 RIR | أولوية التمارين المركبة عالية الكفاءة</small>
            </div>
          </div>
          
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* 1-Tap Quick Complete Button */}
            <button
              type="button"
              onClick={handleQuickCompleteAll}
              disabled={isAllCompleted}
              className={`btn btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-1.5 shadow-sm transition-all ${isAllCompleted ? 'btn-success' : 'btn-outline-primary'}`}
              style={{
                fontSize: '0.76rem',
                height: '32px',
                background: isAllCompleted ? '#16a34a' : '#E5F0FF',
                borderColor: isAllCompleted ? '#16a34a' : '#7DD3FC',
                color: isAllCompleted ? '#fff' : '#0284C7'
              }}
              title="اعتماد الجلسة بالكامل كما هي بنقرة واحدة عند ضيق الوقت"
            >
              <i className={`ti ${isAllCompleted ? 'ti-circle-check' : 'ti-bolt'} fs-6`}></i>
              <span>{isAllCompleted ? 'تم إكمال الجلسة بالكامل' : 'إكمال سريع للجلسة (1-Tap Complete)'}</span>
            </button>

            <span className="badge rounded-pill px-3 py-1 fw-bold" style={{ background: 'linear-gradient(135deg, #ecfeff, #cffafe)', color: '#0891b2', border: 'none', fontSize: '0.74rem' }}>
              {todaySession?.day_label || "يوم التدريب"}
            </span>
            <span className="badge rounded-pill px-3 py-1 fw-semibold" style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', color: '#059669', border: 'none', fontSize: '0.74rem' }}>
              الإنجاز: {completedCount} من {exercises.length}
            </span>
          </div>
        </div>

        {/* Dynamic Warm-Up Pre-Workout Box */}
        {todaySession?.mobility_protocol?.dynamic_warmup && (
          <div className="mb-4 p-3 rounded-3 border" style={{ background: 'linear-gradient(135deg, #f8faff 0%, #f0fdf4 100%)', borderColor: '#dcfce7' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle fw-bold" style={{ fontSize: '0.72rem' }}>
                  قبل التمرين (5-7 دقائق)
                </span>
                <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.88rem' }}>
                  {todaySession.mobility_protocol.dynamic_warmup.title_ar}
                </h6>
              </div>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>تهيئة المفاصل والجهاز العصبي</small>
            </div>
            
            <div className="row g-2">
              {todaySession.mobility_protocol.dynamic_warmup.exercises?.map((wEx, wIdx) => (
                <div className="col-md-6" key={wIdx}>
                  <div className="bg-white p-2 px-3 rounded-2 border d-flex justify-content-between align-items-center shadow-2xs" style={{ borderColor: '#e2e8f0' }}>
                    <div>
                      <div className="fw-bold text-dark" style={{ fontSize: '0.80rem' }}>
                        {wIdx + 1}. {wEx.name_ar}
                      </div>
                      <small className="text-muted d-block" style={{ fontSize: '0.70rem' }}>
                        {wEx.dose} — <span className="text-primary">{wEx.target_joints_ar}</span>
                      </small>
                    </div>
                    {wEx.youtube_url && (
                      <a
                        href={wEx.youtube_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-light rounded-circle p-1 text-danger flex-shrink-0"
                        title="فيديو شرح الحركة"
                        style={{ width: '26px', height: '26px' }}
                      >
                        <i className="ti ti-brand-youtube fs-6"></i>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exercises Full-Width Table */}
        <div className="table-responsive mb-4">
          {loading && !todaySession ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted mt-2 small">جاري تحميل تمارين اليوم...</p>
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-4 text-muted small bg-light rounded-3 border">
              لا توجد تمارين مسجلة في خطة هذا المتدرب بعد.
            </div>
          ) : (
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="border-0 rounded-start" style={{ width: '40%' }}>التمرين والأداء الحركي</th>
                  <th className="border-0 text-center" style={{ width: '25%' }}>المجموعات والتكرارات</th>
                  <th className="border-0 text-center" style={{ width: '20%' }}>فترة الراحة</th>
                  <th className="border-0 rounded-end text-center" style={{ width: '15%' }}>الإنجاز والتبديل</th>
                </tr>
              </thead>
              <tbody>
                {exercises.map((ex, exIdx) => {
                  const isDone = completedExercises[ex.exercise_code];
                  const sets = ex.prescription?.sets || ex.sets || 3;
                  const minReps = ex.prescription?.target_min || ex.reps || 8;
                  const maxReps = ex.prescription?.target_max || ex.reps || 12;
                  const rest = ex.prescription?.rest_seconds || ex.rest_seconds || 90;
                  const arName = ex.name_ar || getArabicExerciseName(ex.exercise_code || ex);
                  const enName = ex.name_en || ex.exercise_code?.replace(/_/g, " ") || "Exercise";

                  return (
                    <tr key={exIdx}>
                      <td>
                        <div className="d-flex justify-content-between align-items-center">
                          <a 
                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(arName + ' ' + enName + ' form technique')}`}
                            target="_blank" 
                            rel="noreferrer"
                            className="text-decoration-none d-inline-block"
                            title="اضغط لمشاهدة فيديو التكنيك العملي على يوتيوب"
                          >
                            <div className="fw-bold text-dark d-flex align-items-center gap-1" style={{ fontSize: "0.86rem" }}>
                              <span>{enName}</span>
                              <i className="ti ti-video text-danger fs-6" title="فيديو شرح التمرين"></i>
                            </div>
                            <small style={{ fontSize: "0.76rem", color: "#64748b" }} className="d-block">
                              {arName}
                            </small>
                            {ex.specific_warmup_protocol && (
                              <div className="mt-1 d-inline-flex align-items-center gap-1 px-2 py-0.5 rounded-pill" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '0.68rem', color: '#b45309' }}>
                                <i className="ti ti-flame text-warning"></i>
                                <span>تسخين متدرج: 50%×8 | 70%×4 | 90%×1 قبل مجموعات العمل</span>
                              </div>
                            )}
                          </a>

                          <button
                            type="button"
                            onClick={() => onOpenExerciseSwapModal && onOpenExerciseSwapModal(ex, 0, exIdx)}
                            className="btn btn-sm rounded-pill px-2 py-0 fw-semibold shadow-xs d-flex align-items-center gap-1 flex-shrink-0 ms-2"
                            style={{ 
                              fontSize: "0.72rem", 
                              background: "#ecfeff", 
                              color: "#0891b2", 
                              border: "1px solid #a5f3fc", 
                              height: '24px' 
                            }}
                            title="تبديل التمرين ببديل مطابق لنفس الزاوية الحركية"
                          >
                            <i className="ti ti-arrows-exchange"></i>
                            <span>تبديل</span>
                          </button>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="badge rounded-pill me-1" style={{ background: '#E5F0FF', color: '#0284C7', border: '1px solid #BAE6FD', fontSize: '0.74rem' }}>
                          {sets} مجموعات
                        </span>
                        <span className="badge rounded-pill" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: '0.74rem' }}>
                          {minReps === maxReps ? minReps : `${minReps} - ${maxReps}`} تكرار
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge rounded-pill" style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', fontSize: '0.74rem' }}>
                          <i className="ti ti-clock me-1"></i> {rest} ثانية
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          onClick={() => onToggleExercise(ex.exercise_code)}
                          className="btn btn-sm rounded-circle p-0 d-inline-flex align-items-center justify-content-center transition-all"
                          style={{
                            width: '32px',
                            height: '32px',
                            background: isDone ? '#16a34a' : '#ffffff',
                            borderColor: isDone ? '#16a34a' : '#e2e8f0',
                            color: isDone ? '#ffffff' : '#94a3b8',
                            boxShadow: isDone ? '0 2px 8px rgba(22, 163, 74, 0.3)' : 'none'
                          }}
                          title={isDone ? 'تم الإنجاز بنجاح' : 'تحديد كمكتمل'}
                        >
                          <i className={`ti ${isDone ? "ti-check fs-6" : "ti-circle fs-6"}`}></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Static Stretching Post-Workout Cool-Down Box */}
        {todaySession?.mobility_protocol?.static_cooldown && (
          <div className="p-3 rounded-3 border" style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #fdf4ff 100%)', borderColor: '#f3e8ff' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <span className="badge rounded-pill bg-purple-subtle text-purple border border-purple-subtle fw-bold" style={{ fontSize: '0.72rem', background: '#F0F9FF', color: '#6b21a8' }}>
                  بعد التمرين (5 دقائق)
                </span>
                <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.88rem' }}>
                  {todaySession.mobility_protocol.static_cooldown.title_ar}
                </h6>
              </div>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>استرخاء العضلات وتسريع الاستشفاء</small>
            </div>
            
            <div className="row g-2">
              {todaySession.mobility_protocol.static_cooldown.exercises?.map((cEx, cIdx) => (
                <div className="col-md-6" key={cIdx}>
                  <div className="bg-white p-2 px-3 rounded-2 border d-flex justify-content-between align-items-center shadow-2xs" style={{ borderColor: '#e2e8f0' }}>
                    <div>
                      <div className="fw-bold text-dark" style={{ fontSize: '0.80rem' }}>
                        {cIdx + 1}. {cEx.name_ar}
                      </div>
                      <small className="text-muted d-block" style={{ fontSize: '0.70rem' }}>
                        ثبات {cEx.duration_seconds} ثانية — <span className="text-purple" style={{ color: '#7c3aed' }}>{cEx.target_muscle_ar}</span>
                      </small>
                    </div>
                    {cEx.youtube_url && (
                      <a
                        href={cEx.youtube_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-light rounded-circle p-1 text-danger flex-shrink-0"
                        title="فيديو شرح الاستطالة"
                        style={{ width: '26px', height: '26px' }}
                      >
                        <i className="ti ti-brand-youtube fs-6"></i>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}



