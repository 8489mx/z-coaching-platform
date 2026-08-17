import React from 'react';

export default function UserWelcomeHero({ currentUser, coachNotes }) {
  const rawGender = (currentUser?.gender || '').toLowerCase();
  const fullName = currentUser?.full_name || 'أحمد سمير';

  const isFemale = rawGender === 'female' || rawGender === 'f' || rawGender === 'أنثى' || 
                   fullName.includes('سارة') || 
                   fullName.includes('مريم') || 
                   fullName.includes('نور') ||
                   fullName.includes('فاطمة') ||
                   fullName.includes('ياسمين') ||
                   fullName.includes('رانيا') ||
                   fullName.includes('منة');

  const greeting = isFemale ? 'مساء الخير يا بطلة' : 'مساء الخير يا كابتن';
  const artworkSrc = isFemale 
    ? "/admin-dashboard_data/user-dashboard/userwelcome-shap.png" 
    : "/admin-dashboard_data/user-dashboard/male-fitness-art.png";

  return (
    <>
      {/* 1. Welcome Card Hero (Quiet Luxury Standard with Dynamic Male/Female Fitness Art) */}
      <div className="row mb-3">
        <div className="col-12">
          <div 
            className="card border-0 bg-white shadow-sm position-relative overflow-hidden" 
            style={{ 
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              borderRight: "4px solid #261c6a"
            }}
          >
            <div className="card-body p-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
              
              {/* Right Side: Welcome text, client name, and badges */}
              <div style={{ maxWidth: '620px' }}>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <h3 className="fw-bold text-dark mb-0" style={{ letterSpacing: '-0.5px', fontSize: '1.3rem' }}>
                    {greeting} {fullName}! 
                  </h3>
                  <span className="badge rounded-pill fw-bold" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.68rem' }}>
                    Z-ENGINE V2
                  </span>
                </div>
                <p className="text-muted mb-3" style={{ fontSize: '0.82rem' }}>
                  خطة الميزوسايكل المخصصة (الأسبوع 1 / مرحلة: التراكم والتجهيز) جاهزة ومفعلة. مستوى الجهد المستهدف: <strong className="text-dark">3 RIR</strong>.
                </p>
                <div className="welcome-badges d-flex gap-2 flex-wrap">
                  <span className="badge rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-1" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.74rem' }}>
                    <i className="ti ti-crown"></i>
                    <span>بناء عضلي وحرق دهون</span>
                  </span>
                  <span className="badge rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-1" style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', fontSize: '0.74rem' }}>
                    <i className="ti ti-barbell"></i>
                    <span>تجهيزات جيم تجاري كامل</span>
                  </span>
                  <span className="badge rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-1" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: '0.74rem' }}>
                    <i className="ti ti-flame"></i>
                    <span>8,000 خطوة يومياً</span>
                  </span>
                </div>
              </div>
              
              {/* Left Side: Fitness Illustration (Male Champion / Female Athlete) + Compact Phase Summary */}
              <div className="d-flex align-items-center gap-3">
                {/* Fitness Line Art with Violet Luxury Tint */}
                <div className="d-none d-md-block pe-2">
                  <img 
                    src={artworkSrc} 
                    alt={isFemale ? "Female Athlete" : "Male Champion"} 
                    style={{ 
                      maxHeight: "130px", 
                      maxWidth: "180px",
                      objectFit: "contain",
                      filter: "invert(16%) sepia(85%) saturate(3500%) hue-rotate(248deg) brightness(85%) contrast(110%)",
                      opacity: 0.92
                    }} 
                  />
                </div>

                {/* Plan Status Pills */}
                <div className="d-none d-xl-flex flex-column gap-2">
                  <div className="p-2 px-3 rounded-3 text-center" style={{ background: '#fbfaff', border: '1px solid #ede9fe', minWidth: '110px' }}>
                    <span className="text-muted d-block" style={{ fontSize: '0.66rem' }}>مرحلة الخطة</span>
                    <strong className="d-block" style={{ fontSize: '0.84rem', color: '#261c6a' }}>الأسبوع الأول</strong>
                  </div>
                  <div className="p-2 px-3 rounded-3 text-center" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', minWidth: '110px' }}>
                    <span className="text-muted d-block" style={{ fontSize: '0.66rem' }}>التكيف الذكي</span>
                    <strong className="d-block text-success" style={{ fontSize: '0.84rem' }}>مفعل بنجاح ✓</strong>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      </div>

      {/* 2. Coach Direct Notes Banner (Quiet Luxury) */}
      {coachNotes && (
        <div className="row mb-3">
          <div className="col-12">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', backgroundColor: '#fbfaff', border: '1px solid #ede9fe', borderRight: '4px solid #261c6a' }}>
              <div className="card-body p-3 px-4">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="badge rounded-pill fw-bold" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.7rem' }}>
                    توجيهات الكابتن المباشرة 
                  </span>
                  <small className="text-muted" style={{ fontSize: '0.74rem' }}>ملاحظات خطتك الحالية</small>
                </div>
                <p className="mb-0 text-dark fw-semibold" style={{ fontSize: '0.88rem', lineHeight: '1.6' }}>
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
