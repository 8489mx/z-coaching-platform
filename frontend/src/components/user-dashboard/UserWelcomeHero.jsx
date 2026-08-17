import React from 'react';

export default function UserWelcomeHero({ currentUser, coachNotes }) {
  return (
    <>
      {/* 1. Welcome Card Hero */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card welcome-card border-0 text-white" style={{ background: "linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)", borderRadius: "16px" }}>
            <div className="card-body d-lg-flex align-items-center justify-content-between p-4">
              <div>
                <h2 className="fw-bold text-white mb-2">
                  مساء الخير يا كابتن {currentUser?.full_name || "أحمد سمير"}! 👋
                </h2>
                <p className="text-white-50 fs-6 mb-3">
                  خطة الميزوسايكل المخصصة (الأسبوع 1 / مرحلة: التراكم والتجهيز) جاهزة. مستوى الجهد المستهدف: <strong>3 RIR</strong>.
                </p>
                <div className="welcome-badges d-flex gap-2 flex-wrap">
                  <span className="badge bg-white text-primary rounded-pill px-3 py-2 fw-bold">
                    <i className="ti ti-crown me-1"></i> بناء عضلي وحرق دهون
                  </span>
                  <span className="badge bg-white text-dark rounded-pill px-3 py-2 fw-bold">
                    <i className="ti ti-barbell me-1"></i> تجهيزات جيم تجاري كامل
                  </span>
                  <span className="badge bg-white text-success rounded-pill px-3 py-2 fw-bold">
                    <i className="ti ti-flame me-1"></i> 8,000 خطوة يومياً
                  </span>
                </div>
              </div>
              <img className="img-fluid d-none d-lg-block" src="/admin-dashboard_data/user-dashboard/userwelcome-shap.png" alt="hero" style={{ maxHeight: "140px" }} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Coach Direct Notes Banner (If Present) */}
      {coachNotes && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', backgroundColor: '#ecfdf5', borderRight: '5px solid #10b981' }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="badge bg-success px-3 py-1 rounded-pill fw-bold">توجيهات الكابتن المباشرة 👑</span>
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
