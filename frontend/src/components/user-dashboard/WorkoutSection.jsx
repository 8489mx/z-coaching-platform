import React from 'react';
import { getArabicExerciseName } from '../../utils/exerciseTranslator';

export default function WorkoutSection({
  todaySession,
  loading,
  completedExercises,
  onToggleExercise
}) {
  return (
    <div className="card border-0 shadow-sm h-100 bg-white" style={{ borderRadius: "14px" }} id="today-workout">
      <div className="card-body p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h5 className="fw-bold mb-0 text-dark">
              🏋️ تمرين اليوم: {todaySession?.session_code || "UPPER_A"}
            </h5>
            <small className="text-muted">مستوى الجهد: 3 RIR | أولوية التمارين المركبة</small>
          </div>
          <span className="badge badge-primary px-3 py-2 rounded-pill">
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
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>التمرين</th>
                  <th>المجموعات والتكرارات</th>
                  <th>الراحة</th>
                  <th>الإنجاز</th>
                </tr>
              </thead>
              <tbody>
                {todaySession?.exercises?.map((ex, exIdx) => {
                  const isDone = completedExercises[ex.exercise_code];
                  return (
                    <tr key={exIdx}>
                      <td>
                        {/* Primary English name in bold */}
                        <div className="fw-bold text-dark" style={{ fontSize: "0.95rem" }}>
                          {ex.name_en || ex.exercise_code.replace(/_/g, " ")}
                        </div>
                        {/* Arabic subtitle in lighter smaller font */}
                        <small className="text-muted d-block" style={{ fontSize: "0.8rem", fontWeight: "normal" }}>
                          {getArabicExerciseName(ex)}
                        </small>
                      </td>
                      <td>
                        <span className="badge bg-primary-subtle text-primary me-1">
                          {ex.prescription?.sets} مجموعات
                        </span>
                        <span className="badge bg-success-subtle text-success">
                          {ex.prescription?.target_min || ex.prescription?.target_max} تكرار
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-warning-subtle text-warning">
                          {ex.prescription?.rest_seconds || 90} ثانية
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => onToggleExercise(ex.exercise_code)}
                          className={`btn btn-sm rounded-circle p-2 ${isDone ? "btn-success" : "btn-outline-secondary"}`}
                        >
                          <i className={`ti ${isDone ? "ti-check" : "ti-circle"}`}></i>
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
