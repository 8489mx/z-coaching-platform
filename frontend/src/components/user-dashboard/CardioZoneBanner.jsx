import React from 'react';

export default function CardioZoneBanner({ onOpenCheckin }) {
  return (
    <div className="row mb-4">
      <div className="col-12">
        <div 
          className="card border-0 shadow-sm text-white" 
          style={{ 
            borderRadius: "16px",
            background: "linear-gradient(135deg, #372896 0%, #261c6a 100%)",
            boxShadow: "0 6px 20px rgba(38, 28, 106, 0.2)"
          }}
        >
          <div className="card-body p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h4 className="text-white fw-bold mb-1" style={{ letterSpacing: '-0.3px' }}>
                الكارديو اليومي ونطاق نبضات حرق الدهون (Zone 2)
              </h4>
              <p className="text-white-50 mb-0 small" style={{ fontSize: '0.85rem' }}>
                النبض المستهدف: <strong>115 - 134 نبضة/دقيقة</strong> | 8,000 خطوة موزعة على مدار اليوم.
              </p>
            </div>
            <button 
              type="button"
              onClick={onOpenCheckin} 
              className="btn btn-light px-4 fw-bold rounded-pill shadow-xs d-flex align-items-center gap-2"
              style={{ 
                height: '36px', 
                fontSize: '0.82rem', 
                color: '#261c6a',
                border: 'none'
              }}
            >
              <i className="ti ti-activity-heartbeat fs-6"></i>
              <span>تسجيل نشاط اليوم</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
