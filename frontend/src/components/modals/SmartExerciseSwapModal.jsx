import { API_BASE } from '../../config/api';
import React, { useEffect, useState } from 'react';

export default function SmartExerciseSwapModal({
  isOpen,
  onClose,
  currentExercise,
  sessionIndex,
  exerciseIndex,
  programId,
  onSwapApplied
}) {
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [applyingCode, setApplyingCode] = useState(null);
  const [environmentFilter, setEnvironmentFilter] = useState('ALL');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !currentExercise) return;

    const exCode = currentExercise.exercise_code || currentExercise.id || currentExercise;
    setLoading(true);
    fetch(`${API_BASE}/api/v1/exercises/swaps/${encodeURIComponent(exCode)}`)
      .then((res) => res.json())
      .then((data) => {
        setSwaps(data.swaps || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load exercise swaps:', err);
        setLoading(false);
      });
  }, [isOpen, currentExercise]);

  if (!isOpen || !currentExercise) return null;

  const currentNameAr = currentExercise.name_ar || 'التمرين الحالي';
  const currentNameEn = currentExercise.name_en || currentExercise.exercise_code || 'Current Exercise';

  const handleApplySwap = async (candidate) => {
    try {
      setApplyingCode(candidate.exercise_code);
      if (programId) {
        const res = await fetch(`${API_BASE}/api/v1/exercises/swap-in-program/${programId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionIndex,
            exerciseIndex,
            newExerciseCode: candidate.exercise_code,
            newExerciseNameAr: candidate.name_ar,
            newExerciseNameEn: candidate.name_en,
          }),
        });
        const data = await res.json();
        if (data.program && onSwapApplied) {
          onSwapApplied(data.program, candidate);
        }
      } else if (onSwapApplied) {
        onSwapApplied(null, candidate);
      }
      setApplyingCode(null);
      onClose();
    } catch (err) {
      console.error('Failed to apply exercise swap:', err);
      setApplyingCode(null);
    }
  };

  const filteredSwaps = swaps.filter((s) => {
    if (environmentFilter === 'GYM') return s.environment === 'GYM' || s.environment === 'GYM_OR_HOME';
    if (environmentFilter === 'HOME') return s.environment === 'HOME' || s.environment === 'GYM_OR_HOME' || s.equipment === 'DUMBBELL' || s.equipment === 'BODYWEIGHT' || s.equipment === 'RESISTANCE_BAND';
    return true;
  });

  return (
    <div 
      className="modal show d-block" 
      tabIndex="-1" 
      style={{ 
        backgroundColor: "rgba(15, 23, 42, 0.65)", 
        backdropFilter: "blur(8px)", 
        zIndex: 1065 
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxWidth: '680px' }}>
        <div 
          className="modal-content border-0 shadow-2xl overflow-hidden" 
          style={{ 
            borderRadius: "24px", 
            background: "#ffffff",
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3), 0 0 35px rgba(38, 28, 106, 0.1)' 
          }} 
          dir="rtl"
        >
          {/* Header */}
          <div 
            className="p-4 bg-white d-flex justify-content-between align-items-center" 
            style={{ borderBottom: '1px solid #f1f5f9' }}
          >
            <div className="d-flex align-items-center gap-3">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" 
                style={{ 
                  width: '46px', 
                  height: '46px', 
                  background: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)', 
                  color: '#0891b2', 
                  border: '1px solid #a5f3fc',
                  boxShadow: '0 2px 10px rgba(6, 182, 212, 0.15)'
                }}
              >
                <i className="ti ti-arrows-exchange fs-3"></i>
              </div>
              <div>
                <h5 className="fw-bold text-dark mb-0 lh-1" style={{ fontSize: '1.12rem', color: '#1e144f' }}>
                  محرك استبدال التمارين الذكي <span style={{ fontSize: '0.85rem', color: '#0891b2', fontWeight: '600' }}>(Biomechanical Swaps)</span>
                </h5>
                <small className="text-muted mt-1 d-block" style={{ fontSize: '0.76rem' }}>
                  بدائل علمية مطابقة للنمط الحركي وزاوية الاستطالة مع أمان تام للمفاصل
                </small>
              </div>
            </div>

            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 transition-all"
              style={{ width: '34px', height: '34px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}
              title="إغلاق"
            >
              <i className="ti ti-x fs-6"></i>
            </button>
          </div>

          {/* Current Exercise Banner */}
          <div className="p-3 px-4 bg-light border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <span className="badge bg-secondary-subtle text-secondary mb-1" style={{ fontSize: '0.70rem' }}>التمرين المطلوب استبداله</span>
              <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.95rem' }}>
                {currentNameAr} <small className="text-muted fw-normal font-monospace">({currentNameEn})</small>
              </h6>
            </div>

            {/* Filter Pills */}
            <div className="d-flex gap-1 bg-white p-1 rounded-pill border">
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 py-0 fw-semibold ${environmentFilter === 'ALL' ? 'btn-primary' : 'btn-light text-muted'}`}
                style={{ fontSize: '0.74rem', height: '26px' }}
                onClick={() => setEnvironmentFilter('ALL')}
              >
                الكل
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 py-0 fw-semibold ${environmentFilter === 'GYM' ? 'btn-primary' : 'btn-light text-muted'}`}
                style={{ fontSize: '0.74rem', height: '26px' }}
                onClick={() => setEnvironmentFilter('GYM')}
              >
                الجيم
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 py-0 fw-semibold ${environmentFilter === 'HOME' ? 'btn-primary' : 'btn-light text-muted'}`}
                style={{ fontSize: '0.74rem', height: '26px' }}
                onClick={() => setEnvironmentFilter('HOME')}
              >
                المنزل / دمبلز
              </button>
            </div>
          </div>

          {/* Modal Body: Candidates List */}
          <div className="p-4 overflow-y-auto" style={{ maxHeight: '420px', background: '#fafbfc' }}>
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-info" role="status"></div>
                <p className="text-muted mt-2 small">جاري مطابقة الألياف والزوايا الحركية للبدائل...</p>
              </div>
            ) : filteredSwaps.length === 0 ? (
              <div className="text-center py-5 text-muted small bg-white rounded-4 border p-4">
                <i className="ti ti-info-circle fs-3 text-secondary d-block mb-2"></i>
                لا توجد بدائل مباشرة مسجلة لهذا الفلتر حالياً، يمكنك اختيار تمرين من المكتبة الشاملة.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {filteredSwaps.map((candidate, cIdx) => {
                  const isApplying = applyingCode === candidate.exercise_code;

                  return (
                    <div 
                      key={cIdx} 
                      className="card border-0 p-3 bg-white shadow-xs transition-all"
                      style={{ 
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                        transition: 'all 0.25s ease'
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                            <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.94rem' }}>
                              {candidate.name_ar}
                            </h6>
                            <span className="badge rounded-pill bg-light text-muted border font-monospace" style={{ fontSize: '0.70rem' }}>
                              {candidate.name_en}
                            </span>
                            <span className="badge rounded-pill bg-info-subtle text-info border border-info-subtle" style={{ fontSize: '0.70rem' }}>
                              {candidate.equipment_ar || candidate.equipment}
                            </span>
                          </div>

                          {/* Biomechanical Match Reason */}
                          <div className="p-2 px-3 rounded-3 mb-1" style={{ background: '#f8faff', border: '1px solid #e0e7ff' }}>
                            <div className="d-flex align-items-center gap-1.5 text-primary fw-semibold" style={{ fontSize: '0.76rem' }}>
                              <i className="ti ti-bolt fs-6"></i>
                              <span>المطابقة الميكانيكية: {candidate.biomechanical_match_ar}</span>
                            </div>
                          </div>

                          {/* Joint Safety Advantage */}
                          {candidate.joint_safety_benefit_ar && (
                            <div className="d-flex align-items-center gap-1.5 text-success mt-1" style={{ fontSize: '0.74rem' }}>
                              <i className="ti ti-shield-check fs-6"></i>
                              <span>ميزة الأمان وتفادي الألم: {candidate.joint_safety_benefit_ar}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="d-flex flex-column align-items-end gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleApplySwap(candidate)}
                            disabled={isApplying}
                            className="btn btn-primary btn-sm rounded-pill px-3 py-1 fw-bold d-flex align-items-center gap-1.5 shadow-sm"
                            style={{ 
                              fontSize: '0.78rem',
                              background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                              border: 'none',
                              height: '32px'
                            }}
                          >
                            {isApplying ? (
                              <>
                                <span className="spinner-border spinner-border-sm" role="status"></span>
                                <span>جاري الاعتماد...</span>
                              </>
                            ) : (
                              <>
                                <i className="ti ti-check fs-6"></i>
                                <span>اعتماد البديل</span>
                              </>
                            )}
                          </button>

                          <a
                            href={candidate.youtube_search_url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-light btn-sm rounded-pill px-2.5 py-0 d-flex align-items-center gap-1 text-danger border"
                            style={{ fontSize: '0.70rem', height: '24px' }}
                            title="مشاهدة فيديو التكنيك العملي على يوتيوب"
                          >
                            <i className="ti ti-brand-youtube fs-6"></i>
                            <span>فيديو الشرح</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 px-4 bg-white border-top d-flex justify-content-between align-items-center">
            <small className="text-muted" style={{ fontSize: '0.74rem' }}>
              يتم تحديث الميزوسايكل والأيام بالكامل عند اختيار البديل تلقائياً.
            </small>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-light btn-sm rounded-pill px-4 fw-semibold border"
              style={{ fontSize: '0.78rem' }}
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
