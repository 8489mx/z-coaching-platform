import React from 'react';

export function getNutritionTargets(nutrition) {
  if (!nutrition) {
    return { calories: 0, protein: 0, carbs: 0, fats: 0, water: '0' };
  }

  const stages = nutrition.stages || {};
  const energyTarget = stages.energy_target || {};
  const macroTargets = stages.macro_targets || {};
  const mealDist = stages.meal_distribution?.daily_targets || {};
  const portionTarget = stages.portion_solver?.daily_target || {};
  const directTargets = nutrition.targets || nutrition.macro_targets || {};

  // High fidelity fallback from quantized meals
  const mealsSum = (nutrition.quantized_plan?.meals || []).reduce((acc, m) => {
    acc.calories += (m.totals?.calories_kcal || m.target?.planned_calories || 0);
    acc.protein += (m.totals?.protein_g || 0);
    acc.carbs += (m.totals?.carbohydrate_g || 0);
    acc.fats += (m.totals?.fat_g || 0);
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const calories = Math.round(
    energyTarget.target_calories ||
    macroTargets.target_calories ||
    mealDist.target_calories ||
    portionTarget.calories_kcal ||
    directTargets.target_calories_kcal ||
    directTargets.calories_kcal ||
    mealsSum.calories || 0
  );

  const protein = Math.round(
    macroTargets.protein?.target_g ||
    mealDist.protein_g ||
    portionTarget.protein_g ||
    directTargets.protein_g ||
    mealsSum.protein || 0
  );

  const carbs = Math.round(
    macroTargets.carbohydrate?.target_g ||
    mealDist.carbohydrate_g ||
    portionTarget.carbohydrate_g ||
    directTargets.carbohydrate_g ||
    directTargets.carbs_g ||
    mealsSum.carbs || 0
  );

  const fats = Math.round(
    macroTargets.fat?.target_g ||
    mealDist.fat_g ||
    portionTarget.fat_g ||
    directTargets.fat_g ||
    directTargets.fats_g ||
    mealsSum.fats || 0
  );

  return { calories, protein, carbs, fats, water: calories > 0 ? '3.5' : '0' };
}

export default function MacroOverviewCard({ nutrition }) {
  const { calories, protein, carbs, fats, water } = getNutritionTargets(nutrition);

  const cards = [
    { 
      key: 'calories', icon: 'ti-bolt', iconClass: 'z-icon-power',
      badge: { text: 'الهدف اليومي', bg: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', color: '#261c6a' },
      val: calories, unit: 'سعرة', label: 'السعرات المستهدفة', pct: 75, barColor: 'linear-gradient(90deg, #818cf8, #261c6a)'
    },
    { 
      key: 'protein', icon: 'ti-barbell', iconClass: 'z-icon-energy',
      badge: { text: 'هدف عالي', bg: 'linear-gradient(135deg, #ecfeff, #cffafe)', color: '#0891b2' },
      val: protein, unit: 'جرام', label: 'البروتين الصافي', pct: 85, barColor: 'linear-gradient(90deg, #22d3ee, #0891b2)'
    },
    { 
      key: 'carbs', icon: 'ti-flame', iconClass: 'z-icon-warmth',
      badge: { text: 'طاقة ونشاط', bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)', color: '#d97706' },
      val: carbs, unit: 'جرام', label: 'الكربوهيدرات الصحية', pct: 65, barColor: 'linear-gradient(90deg, #fbbf24, #d97706)'
    },
    { 
      key: 'fats', icon: 'ti-shield-check', iconClass: 'z-icon-vitality',
      badge: { text: 'توازن هرموني', bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', color: '#059669' },
      val: fats, unit: 'جرام', label: 'الدهون المفيدة', pct: 50, barColor: 'linear-gradient(90deg, #34d399, #059669)'
    },
    { 
      key: 'water', icon: 'ti-droplet', iconClass: 'z-icon-power',
      badge: { text: 'السوائل', bg: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', color: '#261c6a' },
      val: water, unit: 'لتر / يوم', label: 'شرب الماء والترطيب', pct: 70, barColor: 'linear-gradient(90deg, #818cf8, #261c6a)'
    },
  ];

  return (
    <div className="row g-3 mb-3">
      {cards.map((card) => (
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
                <div className="d-flex align-items-baseline gap-1">
                  <h3 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-0.5px' }}>
                    {card.val}
                  </h3>
                  <small className="text-muted" style={{ fontSize: '0.78rem' }}>{card.unit}</small>
                </div>
                <small className="text-muted d-block mt-1" style={{ fontSize: '0.74rem' }}>{card.label}</small>
                
                <div className="progress mt-2 z-progress-animated" style={{ height: '4px', background: 'rgba(0,0,0,0.04)', borderRadius: '2px' }}>
                  <div 
                    className="progress-bar" 
                    role="progressbar" 
                    style={{ width: `${card.pct}%`, background: card.barColor, borderRadius: '2px' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
