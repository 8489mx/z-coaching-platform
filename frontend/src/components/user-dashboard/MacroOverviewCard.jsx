import React from 'react';

const MACRO_CARDS = [
  { 
    key: 'calories', icon: 'ti-bolt', iconClass: 'z-icon-power',
    badge: { text: 'الهدف اليومي', bg: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', color: '#261c6a' },
    getVal: n => Math.round(n?.stages?.energy_target?.target_calories_kcal || 2200),
    unit: 'سعرة', label: 'السعرات المستهدفة', pct: 75, barColor: 'linear-gradient(90deg, #818cf8, #261c6a)'
  },
  { 
    key: 'protein', icon: 'ti-barbell', iconClass: 'z-icon-energy',
    badge: { text: 'هدف عالي', bg: 'linear-gradient(135deg, #ecfeff, #cffafe)', color: '#0891b2' },
    getVal: n => Math.round(n?.stages?.macro_targets?.protein_g || 170),
    unit: 'جرام', label: 'البروتين الصافي', pct: 85, barColor: 'linear-gradient(90deg, #22d3ee, #0891b2)'
  },
  { 
    key: 'carbs', icon: 'ti-flame', iconClass: 'z-icon-warmth',
    badge: { text: 'طاقة ونشاط', bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)', color: '#d97706' },
    getVal: n => Math.round(n?.stages?.macro_targets?.carbs_g || 220),
    unit: 'جرام', label: 'الكربوهيدرات الصحية', pct: 65, barColor: 'linear-gradient(90deg, #fbbf24, #d97706)'
  },
  { 
    key: 'fats', icon: 'ti-shield-check', iconClass: 'z-icon-vitality',
    badge: { text: 'توازن هرموني', bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', color: '#059669' },
    getVal: n => Math.round(n?.stages?.macro_targets?.fats_g || 65),
    unit: 'جرام', label: 'الدهون المفيدة', pct: 50, barColor: 'linear-gradient(90deg, #34d399, #059669)'
  },
  { 
    key: 'water', icon: 'ti-droplet', iconClass: 'z-icon-power',
    badge: { text: 'السوائل', bg: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', color: '#261c6a' },
    getVal: () => '3.5',
    unit: 'لتر / يوم', label: 'شرب الماء والترطيب', pct: 70, barColor: 'linear-gradient(90deg, #818cf8, #261c6a)'
  },
];

export default function MacroOverviewCard({ nutrition }) {
  return (
    <div className="row g-3 mb-3">
      {MACRO_CARDS.map((card, i) => (
        <div key={card.key} className={`${card.key === 'fats' || card.key === 'water' ? 'col-xl col-md-6 col-sm-6' : 'col-xl col-md-4 col-sm-6'} col-12 z-animate-in`}>
          <div className="z-glass-card h-100" style={{ borderRadius: '14px' }}>
            <div className="card-body p-3 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div 
                  className={`d-flex align-items-center justify-content-center ${card.iconClass}`}
                  style={{ width: '32px', height: '32px', borderRadius: '9px', transition: 'transform 0.3s ease' }}
                >
                  <i className={`ti ${card.icon} fs-6`}></i>
                </div>
                <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ 
                  background: card.badge.bg, 
                  color: card.badge.color, 
                  fontSize: '0.68rem',
                  border: 'none',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}>
                  {card.badge.text}
                </span>
              </div>
              <div>
                <h3 className="fw-bold mb-0 text-dark d-flex align-items-baseline gap-1" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>
                  <span>{card.getVal(nutrition)}</span>
                  <span className="fs-6 text-muted fw-normal">{card.unit}</span>
                </h3>
                <p className="text-muted small mb-2 fw-medium" style={{ fontSize: '0.76rem' }}>{card.label}</p>
                <div className="progress z-progress-animated" style={{ height: '5px', borderRadius: '3px', background: 'rgba(241,245,249,0.8)' }}>
                  <div className="progress-bar" style={{ width: `${card.pct}%`, background: card.barColor, borderRadius: '3px' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
