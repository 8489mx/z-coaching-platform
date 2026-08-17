import React from 'react';
import { getArabicExerciseName } from '../../utils/exerciseTranslator';

export default function WorkoutSection({
  todaySession,
  loading,
  completedExercises,
  onToggleExercise
}) {
  const exercises = todaySession?.exercises || [];
  const completedCount = exercises.filter(ex => completedExercises[ex.exercise_code]).length;

  return (
    <div className="z-glass-card mb-4 z-animate-in" id="today-workout">
      <div className="card-body p-4">
        
        {/* Section Header */}
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2 pb-2 border-bottom" style={{ borderColor: '#f1f5f9' }}>
          <div className="d-flex align-items-center gap-2">
            <div className="d-flex align-items-center justify-content-center flex-shrink-0 z-icon-energy" style={{ width: '32px', height: '32px', borderRadius: '9px' }}>
              <i className="ti ti-barbell fs-6"></i>
            </div>
            <div>
              <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.05rem' }}>
                جدول تمرين اليوم: {todaySession?.session_name || todaySession?.session_code || "UPPER_A"}
              </h5>
              <small className="text-muted" style={{ fontSize: '0.76rem' }}>مستوى الجهد المستهدف: 3 RIR | أولوية التمارين المركبة عالية الكفاءة</small>
            </div>
          </div>
          
          <div className="d-flex align-items-center gap-2">
            <span className="badge rounded-pill px-3 py-1 fw-bold" style={{ background: 'linear-gradient(135deg, #ecfeff, #cffafe)', color: '#0891b2', border: 'none', fontSize: '0.74rem', boxShadow: '0 1px 3px rgba(6,182,212,0.08)' }}>
              {todaySession?.day_label || "يوم الاثنين"}
            </span>
            <span className="badge rounded-pill px-3 py-1 fw-semibold" style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', color: '#059669', border: 'none', fontSize: '0.74rem', boxShadow: '0 1px 3px rgba(16,185,129,0.08)' }}>
              الإنجاز: {completedCount} من {exercises.length}
            </span>
          </div>
        </div>

        {/* Exercises Full-Width Table */}
        <div className="table-responsive">
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
                  <th className="border-0 rounded-end text-center" style={{ width: '15%' }}>الإنجاز</th>
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
                          <small style={{ fontSize: "0.76rem", color: "#64748b" }}>
                            {arName}
                          </small>
                        </a>
                      </td>
                      <td className="text-center">
                        <span className="badge rounded-pill me-1" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.74rem' }}>
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

      </div>
    </div>
  );
}
