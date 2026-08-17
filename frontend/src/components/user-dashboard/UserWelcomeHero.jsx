import React from 'react';

export default function UserWelcomeHero({ currentUser, coachNotes }) {
  return (
    <>
      {/* 1. Welcome Card Hero (Manzuma Midnight Violet Theme) */}
      <div className="row mb-4">
        <div className="col-12">
          <div 
            className="card welcome-card border-0 text-white shadow-sm" 
            style={{ 
              background: "linear-gradient(135deg, #372896 0%, #261c6a 60%, #1a124a 100%)", 
              borderRadius: "18px",
              boxShadow: "0 8px 24px rgba(38, 28, 106, 0.25)"
            }}
          >
            <div className="card-body d-lg-flex align-items-center justify-content-between p-4">
              <div>
                <h2 className="fw-bold text-white mb-2" style={{ letterSpacing: '-0.5px' }}>
                  مساء الخير يا كابتن {currentUser?.full_name || "أحمد سمير"}! 
                </h2>
                <p className="text-white-50 fs-6 mb-3">
                  خطة الميزوسايكل المخصصة (الأسبوع 1 / مرحلة: التراكم والتجهيز) جاهزة. مستوى الجهد المستهدف: <strong>3 RIR</strong>.
                </p>
                <div className="welcome-badges d-flex gap-2 flex-wrap">
                  <span className="badge bg-white rounded-pill px-3 py-2 fw-bold shadow-xs" style={{ color: '#261c6a' }}>
                    <i className="ti ti-crown me-1"></i> بناء عضلي وحرق دهون
                  </span>
                  <span className="badge bg-white rounded-pill px-3 py-2 fw-bold shadow-xs" style={{ color: '#334155' }}>
                    <i className="ti ti-barbell me-1"></i> تجهيزات جيم تجاري كامل
                  </span>
                  <span className="badge bg-white text-success rounded-pill px-3 py-2 fw-bold shadow-xs">
                    <i className="ti ti-flame me-1"></i> 8,000 خطوة يومياً
                  </span>
                </div>
              </div>
              <img className="img-fluid d-none d-lg-block" src="/admin-dashboard_data/user-dashboard/userwelcome-shap.png" alt="hero" style={{ maxHeight: "140px", opacity: 0.85 }} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Coach Direct Notes Banner (If Present) */}
      {coachNotes && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', backgroundColor: '#f0fdf4', borderRight: '4px solid #16a34a' }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="badge bg-success px-3 py-1 rounded-pill fw-bold">توجيهات الكابتن المباشرة </span>
                  <small className="text-muted">ملاحظات خطتك الحالية</small>
                </div>
                <p className="mb-0 text-dark fw-semibold" style={{ fontSize: '1.05rem', lineHeight: '1.8' }}>
                  {coachNotes}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
