import React, { useMemo } from 'react';

const MOTIVATIONAL_QUOTES = [
  'كل يوم تقرب خطوة من هدفك — استمر!',
  'جسمك هو أغلى استثمار — اعتني بيه',
  'القوة مش في الوزن اللي بترفعه، القوة في الثبات والالتزام',
  'التغيير الحقيقي بيحصل لما بتتحدى نفسك كل يوم',
  'مفيش اختصار للنجاح — الطريق هو التمرين والأكل الصح',
  'النهارده أحسن من إمبارح — وبكره هيكون أحسن',
  'ابدأ النهارده واللي هتوصله هيبهرك',
];

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

  const dailyQuote = useMemo(() => {
    const dayIndex = new Date().getDate() % MOTIVATIONAL_QUOTES.length;
    return MOTIVATIONAL_QUOTES[dayIndex];
  }, []);

  return (
    <>
      {/* 1. Welcome Card Hero (Premium Glass with Warm Gradient Accent) */}
      <div className="row mb-3">
        <div className="col-12 z-animate-in">
          <div 
            className="z-glass-card position-relative overflow-hidden" 
            style={{ 
              borderRadius: '18px',
              borderRight: 'none',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(245,243,255,0.75) 50%, rgba(236,253,245,0.65) 100%)',
            }}
          >
            {/* Subtle gradient accent bar on the right */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '4px',
              background: 'linear-gradient(180deg, #261c6a 0%, #06b6d4 50%, #10b981 100%)',
              borderRadius: '0 18px 18px 0'
            }}></div>

            <div className="card-body p-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
              
              {/* Right Side: Welcome text, client name, and badges */}
              <div style={{ maxWidth: '620px' }}>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <h3 className="fw-bold text-dark mb-0" style={{ letterSpacing: '-0.5px', fontSize: '1.3rem' }}>
                    {greeting} {fullName}! 
                  </h3>
                  <span className="badge rounded-pill fw-bold" style={{ 
                    background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', 
                    color: '#261c6a', 
                    border: '1px solid #ddd6fe', 
                    fontSize: '0.68rem',
                    boxShadow: '0 1px 4px rgba(38,28,106,0.08)'
                  }}>
                    Z-ENGINE V2
                  </span>
                </div>

                {/* Motivational Quote */}
                <p className="mb-2 fw-semibold" style={{ 
                  fontSize: '0.85rem', 
                  color: '#261c6a',
                  lineHeight: '1.6',
                  opacity: 0.85
                }}>
                  {dailyQuote}
                </p>

                <p className="text-muted mb-3" style={{ fontSize: '0.82rem' }}>
                  خطة الميزوسايكل المخصصة (الأسبوع 1 / مرحلة: التراكم والتجهيز) جاهزة ومفعلة. مستوى الجهد المستهدف: <strong className="text-dark">3 RIR</strong>.
                </p>
                <div className="welcome-badges d-flex gap-2 flex-wrap">
                  <span className="badge rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-1" style={{ 
                    background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', 
                    color: '#261c6a', 
                    border: '1px solid #ddd6fe', 
                    fontSize: '0.74rem',
                    boxShadow: '0 1px 3px rgba(38,28,106,0.06)'
                  }}>
                    <i className="ti ti-crown"></i>
                    <span>بناء عضلي وحرق دهون</span>
                  </span>
                  <span className="badge rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-1" style={{ 
                    background: 'linear-gradient(135deg, #ecfeff, #cffafe)', 
                    color: '#0891b2', 
                    border: '1px solid #a5f3fc', 
                    fontSize: '0.74rem',
                    boxShadow: '0 1px 3px rgba(6,182,212,0.06)'
                  }}>
                    <i className="ti ti-barbell"></i>
                    <span>تجهيزات جيم تجاري كامل</span>
                  </span>
                  <span className="badge rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-1" style={{ 
                    background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', 
                    color: '#059669', 
                    border: '1px solid #a7f3d0', 
                    fontSize: '0.74rem',
                    boxShadow: '0 1px 3px rgba(16,185,129,0.06)'
                  }}>
                    <i className="ti ti-flame"></i>
                    <span>8,000 خطوة يومياً</span>
                  </span>
                </div>
              </div>
              
              {/* Left Side: Fitness Illustration */}
              <div className="d-flex align-items-center gap-3">
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
                  <div className="p-2 px-3 rounded-3 text-center" style={{ 
                    background: 'linear-gradient(135deg, #fbfaff, #f5f3ff)', 
                    border: '1px solid #ede9fe', 
                    minWidth: '110px',
                    boxShadow: '0 1px 4px rgba(38,28,106,0.04)'
                  }}>
                    <span className="text-muted d-block" style={{ fontSize: '0.66rem' }}>مرحلة الخطة</span>
                    <strong className="d-block" style={{ fontSize: '0.84rem', color: '#261c6a' }}>الأسبوع الأول</strong>
                  </div>
                  <div className="p-2 px-3 rounded-3 text-center" style={{ 
                    background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', 
                    border: '1px solid #a7f3d0', 
                    minWidth: '110px',
                    boxShadow: '0 1px 4px rgba(16,185,129,0.06)'
                  }}>
                    <span className="text-muted d-block" style={{ fontSize: '0.66rem' }}>التكيف الذكي</span>
                    <strong className="d-block text-success" style={{ fontSize: '0.84rem' }}>مفعل بنجاح</strong>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      </div>

      {/* 2. Coach Direct Notes Banner (Premium Glass) */}
      {coachNotes && (
        <div className="row mb-3">
          <div className="col-12 z-animate-in">
            <div className="z-glass-card" style={{ 
              borderRadius: '16px', 
              background: 'linear-gradient(135deg, rgba(251,250,255,0.85), rgba(245,243,255,0.75))',
              borderRight: '4px solid #261c6a' 
            }}>
              <div className="card-body p-3 px-4">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="badge rounded-pill fw-bold" style={{ 
                    background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', 
                    color: '#261c6a', 
                    border: '1px solid #ddd6fe', 
                    fontSize: '0.7rem' 
                  }}>
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
