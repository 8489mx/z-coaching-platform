import React from 'react';
import { getArabicExerciseName } from '../../utils/exerciseTranslator';

export default function WorkoutSection({
  todaySession,
  loading,
  completedExercises,
  onToggleExercise
}) {
  return (
    <div className="card border-0 shadow-sm h-100 bg-white" style={{ borderRadius: "16px", border: "1px solid #e2e8f0" }} id="today-workout">
      <div className="card-body p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h5 className="fw-bold mb-0 text-dark">
              تمرين اليوم: {todaySession?.session_code || "UPPER_A"}
            </h5>
            <small className="text-muted">مستوى الجهد: 3 RIR | أولوية التمارين المركبة</small>
          </div>
          <span className="badge rounded-pill px-3 py-1 fw-bold" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.78rem' }}>
            يوم الاثنين
          </span>
        </div>

        <div className="table-responsive mt-3">
          {loading && !todaySession ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted mt-2 small">جاري تحميل تمارين اليوم...</p>
            </div>
          ) : (
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="border-0 rounded-start">التمرين</th>
                  <th className="border-0">المجموعات والتكرارات</th>
                  <th className="border-0">الراحة</th>
                  <th className="border-0 rounded-end text-center">الإنجاز</th>
                </tr>
              </thead>
              <tbody>
                {todaySession?.exercises?.map((ex, exIdx) => {
                  const isDone = completedExercises[ex.exercise_code];
                  return (
                    <tr key={exIdx}>
                      <td>
                        <a 
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent((ex.name_ar || getArabicExerciseName(ex)) + ' ' + (ex.name_en || ex.exercise_code) + ' form technique')}`}
                          target="_blank" 
                          rel="noreferrer"
                          className="text-decoration-none d-inline-block"
                          title="اضغط لمشاهدة فيديو التكنيك العملي على يوتيوب"
                        >
                          <div className="fw-bold text-dark d-flex align-items-center gap-1" style={{ fontSize: "0.88rem" }}>
                            <span>{ex.name_en || ex.exercise_code.replace(/_/g, " ")}</span>
                            <i className="ti ti-video text-danger fs-6" title="فيديو التمرين"></i>
                          </div>
                          <small style={{ fontSize: "0.76rem", color: "#64748b" }}>
                            {getArabicExerciseName(ex)}
                          </small>
                        </a>
                      </td>
                      <td>
                        <span className="badge bg-light text-secondary border me-1 font-monospace" style={{ fontSize: '0.75rem' }}>
                          {ex.prescription?.sets} مجموعات
                        </span>
                        <span className="badge bg-light text-success border font-monospace" style={{ fontSize: '0.75rem' }}>
                          {ex.prescription?.target_min || ex.prescription?.target_max} تكرار
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border font-monospace" style={{ fontSize: '0.75rem' }}>
                          {ex.prescription?.rest_seconds || 90} ثانية
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
                          title={isDone ? 'تم الإنجاز' : 'تحديد كمكتمل'}
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
