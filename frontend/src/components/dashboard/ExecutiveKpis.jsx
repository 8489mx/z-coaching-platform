import React from 'react';
import { Link } from 'react-router-dom';

export default function ExecutiveKpis({ 
  clientsCount = 5, 
  overdueCount = 4, 
  expiringCount = 1, 
  monthlyRevenue = 4500 
}) {
  return (
    <div className="row g-3 mb-3">
      
      {/* Card 1: Active Clients (Manzuma Midnight Violet) */}
      <div className="col-xl-3 col-sm-6 col-12">
        <div 
          className="card border-0 bg-white h-100 shadow-sm" 
          style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}
        >
          <div className="card-body p-3 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div 
                className="d-flex align-items-center justify-content-center"
                style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#f5f3ff', color: '#261c6a' }}
              >
                <i className="ti ti-users fs-6"></i>
              </div>
              <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#f8fafc', color: '#059669', fontSize: '0.68rem', border: '1px solid #e2e8f0' }}>
                <i className="ti ti-arrow-up-right me-1"></i> +12%
              </span>
            </div>

            <div>
              <h3 className="fw-bold text-dark mb-0" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>
                {clientsCount}
              </h3>
              <p className="text-muted small mb-0 fw-medium" style={{ fontSize: '0.78rem' }}>المشتركون النشطون</p>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top border-light">
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>+2 هذا الشهر</small>
              <svg width="48" height="14" viewBox="0 0 60 18" fill="none">
                <defs>
                  <linearGradient id="kpiGrad1" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#261c6a" />
                  </linearGradient>
                </defs>
                <path d="M1 14C10 14 16 4 24 7C32 10 40 2 50 3C56 5 58 2 59 1" stroke="url(#kpiGrad1)" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Overdue Check-ins (Alert Card) */}
      <div className="col-xl-3 col-sm-6 col-12">
        <div 
          className="card border-0 bg-white h-100 shadow-sm" 
          style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}
        >
          <div className="card-body p-3 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div 
                className="d-flex align-items-center justify-content-center"
                style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626' }}
              >
                <i className="ti ti-bell-ringing fs-6"></i>
              </div>
              <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.68rem' }}>
                تنبيه متابعة
              </span>
            </div>

            <div>
              <h3 className="fw-bold text-dark mb-0" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>
                {overdueCount}
              </h3>
              <p className="text-muted small mb-0 fw-medium" style={{ fontSize: '0.78rem' }}>متأخرين عن المتابعة</p>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top border-light">
              <small className="text-danger fw-semibold" style={{ fontSize: '0.72rem' }}>يتطلب تذكير</small>
              <svg width="48" height="14" viewBox="0 0 60 18" fill="none">
                <defs>
                  <linearGradient id="kpiGrad2" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f87171" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>
                </defs>
                <path d="M1 5C12 12 18 3 28 8C38 13 48 5 59 11" stroke="url(#kpiGrad2)" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Expiring Soon */}
      <div className="col-xl-3 col-sm-6 col-12">
        <div 
          className="card border-0 bg-white h-100 shadow-sm" 
          style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}
        >
          <div className="card-body p-3 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div 
                className="d-flex align-items-center justify-content-center"
                style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fffbeb', color: '#d97706' }}
              >
                <i className="ti ti-calendar-time fs-6"></i>
              </div>
              <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#f5f3ff', color: '#261c6a', fontSize: '0.68rem', border: '1px solid #ddd6fe' }}>
                خلال 7 أيام
              </span>
            </div>

            <div>
              <h3 className="fw-bold text-dark mb-0" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>
                {expiringCount}
              </h3>
              <p className="text-muted small mb-0 fw-medium" style={{ fontSize: '0.78rem' }}>تجديدات قريبة</p>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top border-light">
              <Link to="/subscriptions" className="text-muted text-decoration-none fw-semibold" style={{ fontSize: '0.72rem' }}>
                إدارة التجديدات ←
              </Link>
              <svg width="48" height="14" viewBox="0 0 60 18" fill="none">
                <defs>
                  <linearGradient id="kpiGrad3" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#c084fc" />
                    <stop offset="100%" stopColor="#261c6a" />
                  </linearGradient>
                </defs>
                <path d="M1 12C10 5 20 13 30 7C40 1 50 10 59 3" stroke="url(#kpiGrad3)" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Card 4: Total Revenue */}
      <div className="col-xl-3 col-sm-6 col-12">
        <div 
          className="card border-0 bg-white h-100 shadow-sm" 
          style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}
        >
          <div className="card-body p-3 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div 
                className="d-flex align-items-center justify-content-center"
                style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#ecfdf5', color: '#059669' }}
              >
                <i className="ti ti-wallet fs-6"></i>
              </div>
              <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#f8fafc', color: '#059669', fontSize: '0.68rem', border: '1px solid #e2e8f0' }}>
                <i className="ti ti-arrow-up-right me-1"></i> +18%
              </span>
            </div>

            <div>
              <h3 className="fw-bold text-dark mb-0 d-flex align-items-baseline gap-1" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>
                <span>{Number(monthlyRevenue).toLocaleString()}</span>
                <span className="fs-6 text-muted fw-normal">ج.م</span>
              </h3>
              <p className="text-muted small mb-0 fw-medium" style={{ fontSize: '0.78rem' }}>الإيراد الشهري</p>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top border-light">
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>متوسط 900 ج.م/متدرب</small>
              <svg width="48" height="14" viewBox="0 0 60 18" fill="none">
                <defs>
                  <linearGradient id="kpiGrad4" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                </defs>
                <path d="M1 15C10 12 18 3 28 6C38 11 48 2 59 3" stroke="url(#kpiGrad4)" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
