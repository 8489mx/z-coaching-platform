import React from 'react';

const UNIFIED_EXCLUSION_FOODS = [
  { code: 'DAIRY', label: 'الألبان والأجبان (بما فيها الجبن القريش)' },
  { code: 'EGGS', label: 'البيض ومنتجاته' },
  { code: 'FISH_SEAFOOD', label: 'الأسماك والتونة والمأكولات البحرية' },
  { code: 'GLUTEN_WHEAT', label: 'القمح والجلوتين' },
  { code: 'PEANUTS_NUTS', label: 'الفول السوداني والمكسرات' },
  { code: 'RED_MEAT', label: 'اللحوم الحمراء والكبدة' },
  { code: 'LEGUMES', label: 'البقوليات (الفول، العدس، الحمص)' },
  { code: 'OATS', label: 'الشوفان كامل الحبة' }
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
      {/* 0. Diet Framework Selection */}
      <h3 className="section-title">نوع النظام والبروتوكول الغذائي</h3>
      <div className="form-group mb-4">
        <label className="form-label">اختر النظام المناسب لأسلوب حياتك أو دع الكوتش الذكي يحدد الأنسب لحالتك:</label>
        <div className="choices-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          {[
            { 
              code: 'AUTO_COACH_MATCH', 
              title: 'دع الكوتش الذكي يختار الأنسب لحالتي (موصى به)', 
              desc: 'فحص وتشخيص فسيولوجي تلقائي لحساسياتك وجدول يومك لاختيار الدايت الأضمن',
              recommended: true 
            },
            { 
              code: 'BALANCED_HIGH_PROTEIN', 
              title: 'النظام المتوازن عالي البروتين (Balanced High-Protein)', 
              desc: 'سعرات ثابتة وماكروز متوازنة يومياً مع سهولة تامة في الالتزام' 
            },
            { 
              code: 'CARB_CYCLING', 
              title: 'تدوير الكاربوهيدرات (Carb Cycling)', 
              desc: 'كارب عالي بأيام تمرين الأرجل والظهر، وكارب منخفض بأيام الراحة' 
            },
            { 
              code: 'INTERMITTENT_FASTING', 
              title: 'الصيام المتقطع (Intermittent Fasting 16/8)', 
              desc: 'وجبتان رئيسيتان كبيرتان + سناك في نافذة طعام 8 ساعات' 
            },
            { 
              code: 'FLEXIBLE_80_20', 
              title: 'الدايت المرن وقاعدة 80/20 (IIFYM)', 
              desc: '80% أكل صحي نظيف + 20% حصة مرنة محسوبة لمنع الحرمان' 
            },
            { 
              code: 'TARGETED_LOW_CARB', 
              title: 'اللو كارب والكيتو المقنن (Targeted Low-Carb)', 
              desc: 'كارب منخفض جداً (≤40g) ودهون صحية مرتفعة لمقاومة الإنسولين' 
            },
            { 
              code: 'LOW_FODMAP', 
              title: 'بروتوكول القولون العصبي (Low-FODMAP)', 
              desc: 'استبعاد مهيجات التخمر والغازات لعلاج الانتفاخات وبطن مسطحة' 
            },
            { 
              code: 'MEDITERRANEAN_HEALTH', 
              title: 'دايت البحر المتوسط لصحة القلب (Mediterranean)', 
              desc: 'تركيز على زيت الزيتون والأسماك الغنية بالأوميجا 3 والمكسرات' 
            },
          ].map(df => {
            const isSelected = (formData.nutrition?.dietFramework === df.code) || (!formData.nutrition?.dietFramework && df.code === 'AUTO_COACH_MATCH');
            return (
              <div 
                key={df.code} 
                className={`choice-pill ${isSelected ? 'selected' : ''}`}
                style={{
                  border: df.recommended && isSelected ? '2px solid #0284C7' : undefined,
                  background: df.recommended && isSelected ? 'linear-gradient(135deg, #E5F0FF 0%, #F0F9FF 100%)' : undefined,
                  textAlign: 'right',
                  padding: '12px 14px',
                  cursor: 'pointer'
                }}
                onClick={() => updateField('nutrition', 'dietFramework', df.code)}
              >
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <div className="choice-title" style={{ fontWeight: '700', fontSize: '0.86rem' }}>
                    {df.title}
                  </div>
                  {df.recommended && (
                    <span className="badge bg-primary text-white" style={{ fontSize: '0.66rem', borderRadius: '50px' }}>
                      موصى به
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b', lineHeight: '1.4' }}>
                  {df.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section-divider"></div>

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

      {/* 2. Budget Tier & Supplements Flag */}
      <h3 className="section-title">الميزانية والمكملات المتاحة</h3>
      
      <div className="form-group mb-4">
        <label className="form-label">الميزانية المخصصة للغذاء ومصادر البروتين:</label>
        <div className="choices-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {[
            { v: 'ECONOMIC', l: 'اقتصادية (بيض، قريش، دجاج، تونة، بقوليات)' },
            { v: 'MODERATE', l: 'متوسطة (دجاج، لحوم حمراء، أسماك متنوعة)' },
            { v: 'HIGH', l: 'مفتوحة (سلمون، لحوم ستيك، خيارات واسعة)' }
          ].map(b => (
            <div 
              key={b.v} 
              className={`choice-pill ${(formData.nutrition?.budgetTier === b.v || (b.v === 'MODERATE' && !formData.nutrition?.budgetTier)) ? 'selected' : ''}`} 
              onClick={() => updateField('nutrition', 'budgetTier', b.v)}
            >
              <div className="choice-title">{b.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group mb-4">
        <label className="form-label">هل تستخدم أو متاح لديك مكمل واي بروتين (Whey Protein)؟</label>
        <div className="choices-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div 
            className={`choice-pill ${formData.nutrition?.proteinPowderAvailable === true ? 'selected' : ''}`} 
            onClick={() => updateField('nutrition', 'proteinPowderAvailable', true)}
          >
            <div className="choice-title">نعم، متاح لدي مكمل واي بروتين</div>
          </div>
          <div 
            className={`choice-pill ${(formData.nutrition?.proteinPowderAvailable === false || formData.nutrition?.proteinPowderAvailable === undefined) ? 'selected' : ''}`} 
            onClick={() => updateField('nutrition', 'proteinPowderAvailable', false)}
          >
            <div className="choice-title">لا، أعتمد على الأكل الطبيعي فقط</div>
          </div>
        </div>
      </div>

      <div className="section-divider"></div>

      {/* 3. Unified Exclusions (Allergies + Disliked Foods combined) */}
      <h3 className="section-title">استبعاد الأطعمة (حساسية أو عدم تفضيل)</h3>
      <p className="text-muted mb-3" style={{ fontSize: '0.82rem' }}>
        حدد أي مجموعات ترغب باستبعادها تماماً من خطتك الغذائية:
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

      {/* 4. Digestive Issues & Intolerances */}
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

