import React from 'react';

export default function CardioZoneBanner({ onOpenCheckin }) {
  return (
    <div className="row mb-3">
      <div className="col-12 z-animate-in">
        <div 
          className="z-glass-card" 
          style={{ 
            borderRadius: "16px",
            background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,241,242,0.6) 100%)'
          }}
        >
          <div className="card-body p-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 z-icon-coral"
                style={{ width: '38px', height: '38px', borderRadius: '10px' }}
              >
                <i className="ti ti-activity-heartbeat fs-5"></i>
              </div>
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <h5 className="text-dark fw-bold mb-0" style={{ letterSpacing: '-0.3px', fontSize: '0.98rem' }}>
                    الكارديو اليومي ونطاق نبضات حرق الدهون (Zone 2)
                  </h5>
                  <span className="badge rounded-pill fw-bold" style={{ background: '#fff1f2', color: '#e11d48', fontSize: '0.64rem' }}>
                    Fat Burn Zone
                  </span>
                </div>
                <p className="text-muted mb-0 small" style={{ fontSize: '0.78rem' }}>
                  النبض المستهدف: <strong className="text-danger fw-bold">115 - 134 نبضة/دقيقة</strong> | 30 دقيقة مشي مائل أو عجلة ثابتة
                </p>
              </div>
            </div>

            <button 
              type="button"
              onClick={onOpenCheckin} 
              className="btn btn-sm px-4 fw-bold rounded-pill shadow-xs d-flex align-items-center gap-2"
              style={{ 
                height: '38px', 
                fontSize: '0.82rem', 
                background: 'linear-gradient(135deg, #E5F0FF 0%, #F0F9FF 100%)',
                color: '#0284C7',
                border: '1px solid #BAE6FD',
                boxShadow: '0 2px 8px rgba(38,28,106,0.08)'
              }}
            >
              <i className="ti ti-calendar-plus"></i>
              <span>تسجيل نشاط اليوم</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

