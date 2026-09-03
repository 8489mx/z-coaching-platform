import React from 'react';
import { Link } from 'react-router-dom';

export default function ExecutiveKpis({ 
  clientsCount = 0, 
  overdueCount = 0, 
  expiringCount = 0, 
  monthlyRevenue = 0 
}) {
  const cards = [
    {
      icon: 'ti-users',
      iconClass: 'z-icon-power',
      label: 'المشتركون النشطون',
      value: clientsCount,
      unit: 'مشترك',
      badge: { text: '+15%', bg: '#E5F0FF', color: '#0284C7', icon: 'ti-trending-up' },
      footer: '+3 هذا الأسبوع',
      sparkGrad: ['#334155', '#0F172A'],
      sparkPath: 'M1 14C10 14 16 4 24 7C32 10 40 2 50 3C56 5 58 2 59 1',
    },
    {
      icon: 'ti-bell-ringing',
      iconClass: 'z-icon-coral',
      label: 'تنبيهات المتابعة',
      value: overdueCount,
      unit: 'حالات',
      badge: { text: 'مطلوب مراجعة', bg: '#FFE4E6', color: '#E11D48', icon: null },
      footer: 'المتابعة الأسبوعية',
      footerColor: '#E11D48',
      sparkGrad: ['#FB7185', '#E11D48'],
      sparkPath: 'M1 5C12 12 18 3 28 8C38 13 48 5 59 11',
    },
    {
      icon: 'ti-calendar-time',
      iconClass: 'z-icon-warmth',
      label: 'تجديدات قريبة',
      value: expiringCount,
      unit: 'اشتراك',
      badge: { text: 'خلال 7 أيام', bg: '#FEF3C7', color: '#C4952D', icon: null },
      footer: 'إدارة الباقات',
      footerLink: '/subscriptions',
      sparkGrad: ['#FBBF24', '#C4952D'],
      sparkPath: 'M1 12C10 5 20 13 30 7C40 1 50 10 59 3',
    },
    {
      icon: 'ti-wallet',
      iconClass: 'z-icon-vitality',
      label: 'الإيراد الشهري التقديري',
      value: Number(monthlyRevenue).toLocaleString(),
      unit: 'ج.م',
      badge: { text: 'نمو مستمر', bg: '#ECFDF5', color: '#059669', icon: 'ti-trending-up' },
      footer: 'باقات MAX وإيليت',
      sparkGrad: ['#34D399', '#059669'],
      sparkPath: 'M1 15C10 12 18 3 28 6C38 11 48 2 59 3',
    }
  ];

  return (
    <div className="row g-3 mb-4">
      {cards.map((card, i) => (
        <div key={i} className="col-xl-3 col-sm-6 col-12 z-animate-in">
          <div 
            className="z-premium-card h-100 p-3" 
            style={{ 
              borderRadius: '20px',
              border: '1px solid #E7EEF3',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
              transition: 'all 0.25s ease'
            }}
          >
            <div className="d-flex flex-column justify-content-between h-100" style={{ minHeight: '130px' }}>
              {/* Top Row: Icon + Badge */}
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div 
                  className="d-flex align-items-center justify-content-center"
                  style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '10px', 
                    background: card.iconClass === 'z-icon-power' ? '#E5F0FF' : card.iconClass === 'z-icon-coral' ? '#FFE4E6' : card.iconClass === 'z-icon-warmth' ? '#FEF3C7' : '#ECFDF5',
                    color: card.iconClass === 'z-icon-power' ? '#0284C7' : card.iconClass === 'z-icon-coral' ? '#E11D48' : card.iconClass === 'z-icon-warmth' ? '#C4952D' : '#059669',
                    fontSize: '1.1rem'
                  }}
                >
                  <i className={`ti ${card.icon}`}></i>
                </div>
                <span 
                  className="badge rounded-pill fw-bold px-2 py-1 d-inline-flex align-items-center gap-1" 
                  style={{ 
                    background: card.badge.bg, 
                    color: card.badge.color, 
                    fontSize: '0.72rem', 
                    border: 'none'
                  }}
                >
                  {card.badge.icon && <i className={`ti ${card.badge.icon}`} style={{ fontSize: '0.74rem' }}></i>}
                  {card.badge.text}
                </span>
              </div>

              {/* Value */}
              <div className="my-1">
                <h3 className="fw-black text-dark mb-0 d-flex align-items-baseline gap-1" style={{ fontSize: '1.6rem', letterSpacing: '-0.5px', color: '#0F172A' }}>
                  <span>{card.value}</span>
                  {card.unit && <span className="fs-6 text-muted fw-normal" style={{ fontSize: '0.78rem' }}>{card.unit}</span>}
                </h3>
                <p className="text-muted small mb-0 fw-semibold" style={{ fontSize: '0.8rem', color: '#64748B' }}>{card.label}</p>
              </div>

              {/* Footer */}
              <div className="d-flex align-items-center justify-content-between border-top pt-2 mt-2" style={{ borderColor: '#F1F5F9' }}>
                <span style={{ fontSize: '0.72rem', color: card.footerColor || '#64748B', fontWeight: '600' }}>
                  {card.footer}
                </span>
                {card.footerLink && (
                  <Link to={card.footerLink} className="text-decoration-none fw-bold" style={{ fontSize: '0.72rem', color: '#0F172A' }}>
                    عرض التفاصيل &larr;
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
