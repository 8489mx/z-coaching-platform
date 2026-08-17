import React from 'react';

export default function MacroOverviewCard({ nutrition }) {
  const targetCalories = Math.round(nutrition?.stages?.energy_target?.target_calories_kcal || 2200);
  const targetProtein = Math.round(nutrition?.stages?.macro_targets?.protein_g || 170);
  const targetCarbs = Math.round(nutrition?.stages?.macro_targets?.carbs_g || 220);
  const targetFats = Math.round(nutrition?.stages?.macro_targets?.fats_g || 65);

  return (
    <div className="row row-cols-xxl-5 row-cols-md-3 row-cols-sm-2 gy-3 mb-4">
      {/* Calories */}
      <div className="col">
        <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: "14px" }}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="stat-icon bg-primary-subtle text-primary p-2 rounded-3">
                <i className="ti ti-bolt fs-4"></i>
              </div>
              <span className="badge badge-primary">الهدف اليومي</span>
            </div>
            <h4 className="fw-bold mb-0 text-dark">
              {targetCalories} <small className="fs-6 text-muted">سعرة</small>
            </h4>
            <p className="text-muted small mb-2">السعرات المستهدفة</p>
            <div className="progress" style={{ height: "6px" }}>
              <div className="progress-bar bg-primary" style={{ width: "75%" }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Protein */}
      <div className="col">
        <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: "14px" }}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="stat-icon bg-danger-subtle text-danger p-2 rounded-3">
                <i className="ti ti-barbell fs-4"></i>
              </div>
              <span className="badge bg-danger-subtle text-danger">هدف عالي</span>
            </div>
            <h4 className="fw-bold mb-0 text-dark">
              {targetProtein} <small className="fs-6 text-muted">جرام</small>
            </h4>
            <p className="text-muted small mb-2">البروتين الصافي</p>
            <div className="progress" style={{ height: "6px" }}>
              <div className="progress-bar bg-danger" style={{ width: "85%" }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Carbs */}
      <div className="col">
        <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: "14px" }}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="stat-icon bg-warning-subtle text-warning p-2 rounded-3">
                <i className="ti ti-flame fs-4"></i>
              </div>
              <span className="badge bg-warning-subtle text-warning">طاقة ونشاط</span>
            </div>
            <h4 className="fw-bold mb-0 text-dark">
              {targetCarbs} <small className="fs-6 text-muted">جرام</small>
            </h4>
            <p className="text-muted small mb-2">الكربوهيدرات الصحية</p>
            <div className="progress" style={{ height: "6px" }}>
              <div className="progress-bar bg-warning" style={{ width: "65%" }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Fats */}
      <div className="col">
        <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: "14px" }}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="stat-icon bg-success-subtle text-success p-2 rounded-3">
                <i className="ti ti-shield-check fs-4"></i>
              </div>
              <span className="badge bg-success-subtle text-success">توازن هرموني</span>
            </div>
            <h4 className="fw-bold mb-0 text-dark">
              {targetFats} <small className="fs-6 text-muted">جرام</small>
            </h4>
            <p className="text-muted small mb-2">الدهون المفيدة</p>
            <div className="progress" style={{ height: "6px" }}>
              <div className="progress-bar bg-success" style={{ width: "50%" }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Steps & Water */}
      <div className="col">
        <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: "14px" }}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="stat-icon bg-info-subtle text-info p-2 rounded-3">
                <i className="ti ti-droplet fs-4"></i>
              </div>
              <span className="badge bg-info-subtle text-info">السوائل</span>
            </div>
            <h4 className="fw-bold mb-0 text-dark">
              3.5 <small className="fs-6 text-muted">لتر / يوم</small>
            </h4>
            <p className="text-muted small mb-2">شرب الماء والترطيب</p>
            <div className="progress" style={{ height: "6px" }}>
              <div className="progress-bar bg-info" style={{ width: "80%" }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
