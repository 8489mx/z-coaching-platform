import React from 'react';

const UNIFIED_EXCLUSION_FOODS = [
  { code: 'EGGS', label: 'البيض ومنتجاته' },
  { code: 'DAIRY', label: 'الألبان والأجبان (بما فيها الجبن القريش)' },
  { code: 'FISH_SEAFOOD', label: 'الأسماك والتونة والمأكولات البحرية' },
  { code: 'OATS', label: 'الشوفان كامل الحبة' },
  { code: 'RED_MEAT', label: 'اللحوم الحمراء والكبدة' },
  { code: 'PEANUTS_NUTS', label: 'الفول السوداني والمكسرات' },
  { code: 'GLUTEN_WHEAT', label: 'القمح والجلوتين' },
  { code: 'LEGUMES', label: 'البقوليات (الفول، العدس، الحمص)' },
  { code: 'EGGPLANT_VEG', label: 'الباذنجان والخضار المطبوخ' }
];

const DIGESTIVE_ISSUES_LIST = [
  { code: 'IBS', label: 'قولون عصبي وانتفاخات متكررة' },
  { code: 'ACID_REFLUX', label: 'حموضة وارتجاع مريء' },
  { code: 'LACTOSE', label: 'عدم تحمل اللاكتوز (مغص من الحليب)' }
];

export default function Step4Nutrition({
  formData,
  updateField
}) {
  const excludedList = formData.nutrition?.excludedFoodsList || [];
  const noExclusions = excludedList.length === 0;

  const toggleExclusion = (code) => {
    if (code === 'NONE') {
      updateField('nutrition', 'excludedFoodsList', []);
      return;
    }
    const current = [...excludedList];
    const idx = current.indexOf(code);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(code);
    }
    updateField('nutrition', 'excludedFoodsList', current);
  };

  const digestiveList = formData.nutrition?.digestiveIssuesList || [];
  const noDigestive = digestiveList.length === 0;

  const toggleDigestive = (code) => {
    if (code === 'NONE') {
      updateField('nutrition', 'digestiveIssuesList', []);
      return;
    }
    const current = [...digestiveList];
    const idx = current.indexOf(code);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(code);
    }
    updateField('nutrition', 'digestiveIssuesList', current);
  };

  return (
    <div className="step-content">
      {/* 1. Preferred Meal Count */}
      <h3 className="section-title">عدد الوجبات اليومية المفضل</h3>
      <div className="form-group mb-4">
        <label className="form-label">كم وجبة تفضل تناولها في يومك؟</label>
        <div className="choices-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
          {[
            { c: 2, l: 'وجبتان كبيرتان' },
            { c: 3, l: '3 وجبات رئيسية' },
            { c: 4, l: '3 وجبات + سناك' },
            { c: 5, l: '4 إلى 5 وجبات صغيرة' }
          ].map(opt => (
            <div 
              key={opt.c} 
              className={`choice-pill ${formData.nutrition?.preferredMealCount === opt.c ? 'selected' : ''}`} 
              onClick={() => updateField('nutrition', 'preferredMealCount', opt.c)}
            >
              <div className="choice-title">{opt.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section-divider"></div>

      {/* 2. Unified Exclusions (Allergies + Disliked Foods combined) */}
      <h3 className="section-title">استبعاد الأطعمة (حساسية أو عدم تفضيل)</h3>
      <p className="text-muted mb-3" style={{ fontSize: '0.82rem' }}>
        حدد أي أطعمة أو مكونات ترغب باستبعادها تماماً من خطتك الغذائية:
      </p>

      <div className="choices-grid mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
        {UNIFIED_EXCLUSION_FOODS.map(food => {
          const isSelected = excludedList.includes(food.code);
          return (
            <div 
              key={food.code}
              className={`choice-pill ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleExclusion(food.code)}
              style={{
                borderColor: isSelected ? '#e11d48' : '#e2e8f0',
                background: isSelected ? 'rgba(225, 29, 72, 0.06)' : 'transparent'
              }}
            >
              <div className="choice-title" style={{ color: isSelected ? '#e11d48' : 'inherit' }}>
                {isSelected ? '✕ ' : ''}{food.label}
              </div>
            </div>
          );
        })}
        <div 
          className={`choice-pill ${noExclusions ? 'selected' : ''}`}
          onClick={() => toggleExclusion('NONE')}
          style={{ borderColor: noExclusions ? '#10b981' : '#e2e8f0' }}
        >
          <div className="choice-title" style={{ color: noExclusions ? '#059669' : 'inherit', fontWeight: '700' }}>
            ✓ لا يوجد استبعاد (أتناول كافة الأطعمة)
          </div>
        </div>
      </div>

      <div className="section-divider"></div>

      {/* 3. Digestive Issues & Intolerances */}
      <h3 className="section-title">مشاكل واضطرابات الهضم والقولون (إن وجدت)</h3>
      <div className="choices-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {DIGESTIVE_ISSUES_LIST.map(item => {
          const isSelected = digestiveList.includes(item.code);
          return (
            <div 
              key={item.code}
              className={`choice-pill ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleDigestive(item.code)}
            >
              <div className="choice-title">{item.label}</div>
            </div>
          );
        })}
        <div 
          className={`choice-pill ${noDigestive ? 'selected' : ''}`}
          onClick={() => toggleDigestive('NONE')}
        >
          <div className="choice-title">لا توجد مشاكل هضمية</div>
        </div>
      </div>
    </div>
  );
}
