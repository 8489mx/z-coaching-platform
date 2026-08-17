import React from 'react';

export default function IntakeProgressBar({
  tabs,
  activeTab,
  setActiveTab,
  saveStatus,
  onReset
}) {
  return (
    <div className="onboarding-stepper-wrapper mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="badge bg-warning-subtle text-warning">
              <i className="bi bi-arrow-repeat me-1 spin"></i> جاري الحفظ التلقائي...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="badge bg-success-subtle text-success">
              <i className="bi bi-check-circle me-1"></i> تم الحفظ
            </span>
          )}
        </div>
        <button 
          type="button"
          onClick={onReset} 
          className="btn btn-outline-danger btn-sm rounded-pill px-3"
          style={{ fontSize: '0.8rem' }}
        >
          <i className="bi bi-arrow-counterclockwise me-1"></i> استمارة جديدة
        </button>
      </div>

      <div className="stepper-nav d-flex overflow-auto pb-2 gap-2">
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`step-pill btn rounded-pill px-3 py-2 fw-semibold d-flex align-items-center gap-2 ${isActive ? 'btn-primary shadow-sm' : 'btn-light border text-dark'}`}
              style={{ fontSize: '0.86rem', whiteSpace: 'nowrap' }}
            >
              <span className="step-num">{idx + 1}</span>
              <i className={`bi ${tab.icon}`}></i>
              <span>{tab.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
