import React from 'react';
import { Link } from 'react-router-dom';

export default function ExecutiveKpis({ 
  clientsCount = 5, 
  overdueCount = 4, 
  expiringCount = 1, 
  monthlyRevenue = 4500 
}) {
  const cards = [
    {
      icon: 'ti-users',
      iconClass: 'z-icon-power',
      label: 'المشتركون النشطون',
      value: clientsCount,
      unit: null,
      badge: { text: '+12%', bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', color: '#059669', icon: 'ti-trending-up' },
      footer: '+2 هذا الشهر',
      sparkGrad: ['#818cf8', '#261c6a'],
      sparkPath: 'M1 14C10 14 16 4 24 7C32 10 40 2 50 3C56 5 58 2 59 1',
    },
    {
      icon: 'ti-bell-ringing',
      iconClass: 'z-icon-coral',
      label: 'متأخرين عن المتابعة',
      value: overdueCount,
      unit: null,
      badge: { text: 'تنبيه متابعة', bg: 'linear-gradient(135deg, #fff1f2, #ffe4e6)', color: '#e11d48', icon: null },
      footer: 'يتطلب تذكير',
      footerColor: '#e11d48',
      sparkGrad: ['#fb7185', '#e11d48'],
      sparkPath: 'M1 5C12 12 18 3 28 8C38 13 48 5 59 11',
    },
    {
      icon: 'ti-calendar-time',
      iconClass: 'z-icon-warmth',
      label: 'تجديدات قريبة',
      value: expiringCount,
      unit: null,
      badge: { text: 'خلال 7 أيام', bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)', color: '#d97706', icon: null },
      footer: 'إدارة التجديدات',
      footerLink: '/subscriptions',
      sparkGrad: ['#fbbf24', '#d97706'],
      sparkPath: 'M1 12C10 5 20 13 30 7C40 1 50 10 59 3',
    },
    {
      icon: 'ti-wallet',
      iconClass: 'z-icon-vitality',
      label: 'الإيراد الشهري',
      value: Number(monthlyRevenue).toLocaleString(),
      unit: 'ج.م',
      badge: { text: '+18%', bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', color: '#059669', icon: 'ti-trending-up' },
      footer: 'متوسط 900 ج.م/متدرب',
      sparkGrad: ['#34d399', '#059669'],
      sparkPath: 'M1 15C10 12 18 3 28 6C38 11 48 2 59 3',
    }
  ];

  return (
    <div className="row g-3 mb-3">
      {cards.map((card, i) => (
        <div key={i} className="col-xl-3 col-sm-6 col-12 z-animate-in">
          <div 
            className="z-glass-card h-100" 
            style={{ borderRadius: '14px' }}
          >
            <div className="card-body p-3 d-flex flex-column justify-content-between" style={{ minHeight: '140px' }}>
              {/* Top Row: Icon + Badge */}
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div 
                  className={`d-flex align-items-center justify-content-center ${card.iconClass}`}
                  style={{ width: '32px', height: '32px', borderRadius: '9px', transition: 'transform 0.3s ease' }}
                >
                  <i className={`ti ${card.icon} fs-6`}></i>
                </div>
                <span 
                  className="badge rounded-pill fw-semibold px-2 py-1 d-inline-flex align-items-center gap-1" 
                  style={{ 
                    background: card.badge.bg, 
                    color: card.badge.color, 
                    fontSize: '0.68rem', 
                    border: 'none',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                  }}
                >
                  {card.badge.icon && <i className={`ti ${card.badge.icon}`} style={{ fontSize: '0.72rem' }}></i>}
                  {card.badge.text}
                </span>
              </div>

              {/* Value */}
              <div>
                <h3 className="fw-bold text-dark mb-0 d-flex align-items-baseline gap-1" style={{ fontSize: '1.5rem', letterSpacing: '-0.5px' }}>
                  <span>{card.value}</span>
                  {card.unit && <span className="fs-6 text-muted fw-normal">{card.unit}</span>}
                </h3>
                <p className="text-muted small mb-0 fw-medium" style={{ fontSize: '0.78rem' }}>{card.label}</p>
              </div>

              {/* Footer: sparkline + meta */}
              <div className="d-flex justify-content-between align-items-center mt-2 pt-2" style={{ borderTop: '1px solid rgba(226,232,240,0.5)' }}>
                {card.footerLink ? (
                  <Link to={card.footerLink} className="text-decoration-none fw-semibold" style={{ fontSize: '0.72rem', color: card.footerColor || '#64748b' }}>
                    {card.footer} ←
                  </Link>
                ) : (
                  <small className="fw-semibold" style={{ fontSize: '0.72rem', color: card.footerColor || '#64748b' }}>
                    {card.footer}
                  </small>
                )}
                <svg width="50" height="16" viewBox="0 0 60 18" fill="none">
                  <defs>
                    <linearGradient id={`kpiG${i}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={card.sparkGrad[0]} />
                      <stop offset="100%" stopColor={card.sparkGrad[1]} />
                    </linearGradient>
                  </defs>
                  <path d={card.sparkPath} stroke={`url(#kpiG${i})`} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
