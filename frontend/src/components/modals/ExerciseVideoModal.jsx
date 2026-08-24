import React, { useEffect } from 'react';

export default function ExerciseVideoModal({ exercise, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        onClose();
      }
    };
    if (exercise) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exercise, onClose]);

  if (!exercise) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-sm shadow-slate-200/50" style={{ borderRadius: '20px', overflow: 'hidden' }}>
          <div className="modal-header border-bottom p-3 bg-light d-flex justify-content-between align-items-center">
            <div>
              <h6 className="modal-title fw-bold text-dark mb-0">{exercise.name_ar}</h6>
              <small className="text-muted">{exercise.name_en}</small>
            </div>
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" 
              style={{ width: '32px', height: '32px', background: '#ffffff', border: '1px solid #e2e8f0', color: '#64748b' }}
              title="إغلاق"
            >
              <i className="ti ti-x fs-6"></i>
            </button>
          </div>
          <div className="modal-body p-0 bg-black">
            <div className="ratio ratio-16x9">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${exercise.video_id}?autoplay=1&rel=0`}
                title={exercise.name_ar}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
          <div className="modal-footer p-3 bg-white d-flex justify-content-between">
            <span className="small text-muted">اضغط Esc للإغلاق في أي وقت</span>
            <button type="button" className="btn btn-secondary btn-sm rounded-pill px-4" onClick={onClose}>
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
