import React from 'react';

export default function CardioZoneBanner({ onOpenCheckin }) {
  return (
    <div className="row mb-3">
      <div className="col-12">
        <div 
          className="card border-0 bg-white shadow-sm" 
          style={{ 
            borderRadius: "16px",
            border: "1px solid #e2e8f0"
          }}
        >
          <div className="card-body p-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '38px', height: '38px', background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3' }}
              >
                <i className="ti ti-activity-heartbeat fs-5"></i>
              </div>
              <div>
                <h5 className="text-dark fw-bold mb-1" style={{ letterSpacing: '-0.3px', fontSize: '0.98rem' }}>
                  الكارديو اليومي ونطاق نبضات حرق الدهون (Zone 2)
                </h5>
                <p className="text-muted mb-0 small" style={{ fontSize: '0.78rem' }}>
                  النبض المستهدف: <strong className="text-danger">115 - 134 نبضة/دقيقة</strong> | 8,000 خطوة موزعة على مدار اليوم
                </p>
              </div>
            </div>

            <button 
              type="button"
              onClick={onOpenCheckin} 
              className="btn btn-sm px-4 fw-semibold rounded-pill shadow-xs d-flex align-items-center gap-2"
              style={{ 
                height: '36px', 
                fontSize: '0.8rem', 
                background: '#f5f3ff',
                color: '#261c6a',
                border: '1px solid #ddd6fe'
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
