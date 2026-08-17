import React from 'react';

export default function ExecutiveKpis({ 
  clientsCount = 3, 
  overdueCount = 0, 
  expiringCount = 1, 
  monthlyRevenue = 4500 
}) {
  return (
    <div className="row row-cols-xxl-4 row-cols-md-2 gy-3 mb-4">
      {/* Card 1: Active Clients */}
      <div className="col">
        <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: '16px' }}>
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="stat-icon bg-primary-subtle text-primary p-2 rounded-3 d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px' }}>
                <i className="ti ti-users fs-4"></i>
              </div>
              <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1 fw-bold">المشتركين النشطين</span>
            </div>
            <h2 className="fw-bold mb-1 text-dark">{clientsCount}</h2>
            <p className="text-muted small mb-0 fw-semibold">إجمالي المتدربين المسجلين في النظام</p>
          </div>
        </div>
      </div>

      {/* Card 2: Overdue Check-ins */}
      <div className="col">
        <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: '16px' }}>
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="stat-icon bg-danger-subtle text-danger p-2 rounded-3 d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px' }}>
                <i className="ti ti-clock-alert fs-4"></i>
              </div>
              <span className="badge bg-danger-subtle text-danger rounded-pill px-3 py-1 fw-bold">متأخر عن المتابعة</span>
            </div>
            <h2 className="fw-bold mb-1 text-danger">{overdueCount}</h2>
            <p className="text-muted small mb-0 fw-semibold">مشتركين متأخرين عن إرسال المتابعة</p>
          </div>
        </div>
      </div>

      {/* Card 3: Expiring Soon Subscriptions */}
      <div className="col">
        <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: '16px' }}>
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="stat-icon bg-warning-subtle text-warning p-2 rounded-3 d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px' }}>
                <i className="ti ti-alert-triangle fs-4"></i>
              </div>
              <span className="badge bg-warning-subtle text-warning rounded-pill px-3 py-1 fw-bold">تجديد قريب</span>
            </div>
            <h2 className="fw-bold mb-1 text-warning">{expiringCount}</h2>
            <p className="text-muted small mb-0 fw-semibold">اشتراكات تنتهي خلال 7 أيام</p>
          </div>
        </div>
      </div>

      {/* Card 4: Total Revenue */}
      <div className="col">
        <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: '16px' }}>
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="stat-icon bg-success-subtle text-success p-2 rounded-3 d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px' }}>
                <i className="ti ti-wallet fs-4"></i>
              </div>
              <span className="badge bg-success-subtle text-success rounded-pill px-3 py-1 fw-bold">الدخل الشهري</span>
            </div>
            <h2 className="fw-bold mb-1 text-success">
              {Number(monthlyRevenue).toLocaleString()} <small className="fs-6 text-muted fw-normal">ج.م</small>
            </h2>
            <p className="text-muted small mb-0 fw-semibold">الإيراد المالي الفعّال للاشتراكات</p>
          </div>
        </div>
      </div>
    </div>
  );
}
