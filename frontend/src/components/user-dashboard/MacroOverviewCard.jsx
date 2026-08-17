import React from 'react';

export default function MacroOverviewCard({ nutrition }) {
  const targetCalories = Math.round(nutrition?.stages?.energy_target?.target_calories_kcal || 2200);
  const targetProtein = Math.round(nutrition?.stages?.macro_targets?.protein_g || 170);
  const targetCarbs = Math.round(nutrition?.stages?.macro_targets?.carbs_g || 220);
  const targetFats = Math.round(nutrition?.stages?.macro_targets?.fats_g || 65);

  return (
    <div className="row g-3 mb-3">
      {/* Calories */}
      <div className="col-xl col-md-4 col-sm-6 col-12">
        <div className="card border-0 bg-white h-100 shadow-sm" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div className="card-body p-3 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#f5f3ff', color: '#261c6a' }}>
                <i className="ti ti-bolt fs-6"></i>
              </div>
              <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#f5f3ff', color: '#261c6a', fontSize: '0.68rem', border: '1px solid #ddd6fe' }}>
                الهدف اليومي
              </span>
            </div>
            <div>
              <h3 className="fw-bold mb-0 text-dark d-flex align-items-baseline gap-1" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>
                <span>{targetCalories}</span>
                <span className="fs-6 text-muted fw-normal">سعرة</span>
              </h3>
              <p className="text-muted small mb-2 fw-medium" style={{ fontSize: '0.76rem' }}>السعرات المستهدفة</p>
              <div className="progress" style={{ height: "4px", borderRadius: '2px', background: '#f1f5f9' }}>
                <div className="progress-bar" style={{ width: "75%", background: '#261c6a' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Protein */}
      <div className="col-xl col-md-4 col-sm-6 col-12">
        <div className="card border-0 bg-white h-100 shadow-sm" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div className="card-body p-3 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#f5f3ff', color: '#261c6a' }}>
                <i className="ti ti-barbell fs-6"></i>
              </div>
              <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#f5f3ff', color: '#261c6a', fontSize: '0.68rem', border: '1px solid #ddd6fe' }}>
                هدف عالي
              </span>
            </div>
            <div>
              <h3 className="fw-bold mb-0 text-dark d-flex align-items-baseline gap-1" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>
                <span>{targetProtein}</span>
                <span className="fs-6 text-muted fw-normal">جرام</span>
              </h3>
              <p className="text-muted small mb-2 fw-medium" style={{ fontSize: '0.76rem' }}>البروتين الصافي</p>
              <div className="progress" style={{ height: "4px", borderRadius: '2px', background: '#f1f5f9' }}>
                <div className="progress-bar" style={{ width: "85%", background: '#261c6a' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Carbs */}
      <div className="col-xl col-md-4 col-sm-6 col-12">
        <div className="card border-0 bg-white h-100 shadow-sm" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div className="card-body p-3 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fffbeb', color: '#d97706' }}>
                <i className="ti ti-flame fs-6"></i>
              </div>
              <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#fffbeb', color: '#d97706', fontSize: '0.68rem' }}>
                طاقة ونشاط
              </span>
            </div>
            <div>
              <h3 className="fw-bold mb-0 text-dark d-flex align-items-baseline gap-1" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>
                <span>{targetCarbs}</span>
                <span className="fs-6 text-muted fw-normal">جرام</span>
              </h3>
              <p className="text-muted small mb-2 fw-medium" style={{ fontSize: '0.76rem' }}>الكربوهيدرات الصحية</p>
              <div className="progress" style={{ height: "4px", borderRadius: '2px', background: '#f1f5f9' }}>
                <div className="progress-bar" style={{ width: "65%", background: '#d97706' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fats */}
      <div className="col-xl col-md-6 col-sm-6 col-12">
        <div className="card border-0 bg-white h-100 shadow-sm" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div className="card-body p-3 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#ecfdf5', color: '#059669' }}>
                <i className="ti ti-shield-check fs-6"></i>
              </div>
              <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.68rem' }}>
                توازن هرموني
              </span>
            </div>
            <div>
              <h3 className="fw-bold mb-0 text-dark d-flex align-items-baseline gap-1" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>
                <span>{targetFats}</span>
                <span className="fs-6 text-muted fw-normal">جرام</span>
              </h3>
              <p className="text-muted small mb-2 fw-medium" style={{ fontSize: '0.76rem' }}>الدهون المفيدة</p>
              <div className="progress" style={{ height: "4px", borderRadius: '2px', background: '#f1f5f9' }}>
                <div className="progress-bar" style={{ width: "50%", background: '#059669' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Steps & Water */}
      <div className="col-xl col-md-6 col-sm-6 col-12">
        <div className="card border-0 bg-white h-100 shadow-sm" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div className="card-body p-3 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#f5f3ff', color: '#261c6a' }}>
                <i className="ti ti-droplet fs-6"></i>
              </div>
              <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#f5f3ff', color: '#261c6a', fontSize: '0.68rem', border: '1px solid #ddd6fe' }}>
                السوائل
              </span>
            </div>
            <div>
              <h3 className="fw-bold mb-0 text-dark d-flex align-items-baseline gap-1" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>
                <span>3.5</span>
                <span className="fs-6 text-muted fw-normal">لتر / يوم</span>
              </h3>
              <p className="text-muted small mb-2 fw-medium" style={{ fontSize: '0.76rem' }}>شرب الماء والترطيب</p>
              <div className="progress" style={{ height: "4px", borderRadius: '2px', background: '#f1f5f9' }}>
                <div className="progress-bar" style={{ width: "70%", background: '#261c6a' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
