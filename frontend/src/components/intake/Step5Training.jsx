import React from 'react';

export default function Step5Training({
  formData,
  updateField,
  addArrayItem,
  updateArrayItem,
  removeArrayItem
}) {
  const daysOfWeek = [
    { code: 'SATURDAY', name: 'السبت' },
    { code: 'SUNDAY', name: 'الأحد' },
    { code: 'MONDAY', name: 'الإثنين' },
    { code: 'TUESDAY', name: 'الثلاثاء' },
    { code: 'WEDNESDAY', name: 'الأربعاء' },
    { code: 'THURSDAY', name: 'الخميس' },
    { code: 'FRIDAY', name: 'الجمعة' }
  ];

  const commonInjuries = [
    'أسفل الظهر (Lower Back)',
    'مفصل الكتف (Shoulder)',
    'مفصل الركبة (Knee)',
    'الرقبة وأعلى الظهر (Neck)',
    'الكوع والمرفق (Elbow)',
    'المعصم والرسغ (Wrist)',
    'الكاحل والقدم (Ankle)',
    'فتق إربي أو جدار البطن (Hernia)',
    'إصابة في موضع آخر'
  ];

  const sportsList = [
    { code: 'FOOTBALL', name: 'كرة قدم (Football)' },
    { code: 'RACKET_SPORTS', name: 'بادل أو تنس (Padel / Tennis)' },
    { code: 'SWIMMING', name: 'سباحة (Swimming)' },
    { code: 'RUNNING', name: 'جري سريع (Running)' },
    { code: 'MARTIAL_ARTS', name: 'ملاكمة / فنون قتالية (Martial Arts)' },
    { code: 'BASKETBALL', name: 'كرة سلة (Basketball)' },
    { code: 'CYCLING', name: 'ركوب دراجات (Cycling)' },
    { code: 'CROSSFIT_OR_FUNCTIONAL', name: 'كروس فيت / تمارين وظيفية (CrossFit)' }
  ];

  return (
    <div className="step-content">
      {/* 1. Training Environment & Experience */}
      <h3 className="section-title">بيئة وخبرة التدريب الرياضي</h3>
      <div className="grid-2-col">
        <div className="form-group">
          <label className="form-label">مكان التمرين المتاح لديك</label>
          <div className="choices-grid">
            <div 
              className={`choice-pill ${formData.training.location === 'GYM' ? 'selected' : ''}`} 
              onClick={() => updateField('training', 'location', 'GYM')}
            >
              <div className="choice-title">في الجيم (صالة رياضية مجهزة)</div>
            </div>
            <div 
              className={`choice-pill ${formData.training.location === 'HOME' ? 'selected' : ''}`} 
              onClick={() => updateField('training', 'location', 'HOME')}
            >
              <div className="choice-title">في المنزل (بأدوات منزلية)</div>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">مستوى خبرتك في تمارين الحديد والمقاومة</label>
          <select 
            className="form-control" 
            value={formData.training.experience || 'BEGINNER'} 
            onChange={e => updateField('training', 'experience', e.target.value)}
            style={{ fontWeight: '600' }}
          >
            <option value="NEVER_TRAINED">لم أتدرب من قبل (مبتدئ جديد تماماً)</option>
            <option value="BEGINNER">مبتدئ (أقل من سنة خبرة في الجيم)</option>
            <option value="INTERMEDIATE">متوسط (من سنة إلى 3 سنوات تمرين منتظم)</option>
            <option value="ADVANCED">متقدم (أكثر من 3 سنوات وتدريب شاق)</option>
          </select>
        </div>
      </div>

      <div className="grid-2-col">
        <div className="form-group">
          <label className="form-label">مدى التزامك بالتمرين خلال آخر 4 أسابيع؟</label>
          <select 
            className="form-control" 
            value={formData.training.recentTraining || 'NONE_LAST_4_WEEKS'} 
            onChange={e => updateField('training', 'recentTraining', e.target.value)}
          >
            <option value="NONE_LAST_4_WEEKS">منقطع تماماً عن التمرين</option>
            <option value="IRREGULAR">متقطع (يوم أو يومين بالأسبوع على فترات)</option>
            <option value="CONSISTENT_LIGHT">منتظم ولكن بأوزان ونشاط خفيف</option>
            <option value="CONSISTENT_HARD">منتظم بتدريب قوي وشديد</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">المدة الزمنية المفضلة للحصة الواحدة</label>
          <select 
            className="form-control" 
            value={formData.training.maxSessionMinutes || 60} 
            onChange={e => updateField('training', 'maxSessionMinutes', Number(e.target.value))}
          >
            <option value={45}>45 دقيقة (سريعة ومركزة)</option>
            <option value={60}>60 دقيقة (المدة المثالية الموصى بها)</option>
            <option value={75}>75 دقيقة (شاملة الإحماء والكارديو)</option>
            <option value={90}>90 دقيقة (تدريب مكثف ومتقدم)</option>
          </select>
        </div>
      </div>

      {/* 2. Days & Weekly Availability */}
      <div className="section-divider"></div>
      <h3 className="section-title">أيام التمرين الأسبوعية</h3>
      
      <div className="form-group">
        <label className="form-label">كم يوماً تفضل أن تتمرن في الأسبوع؟</label>
        <div className="choices-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
          {[3, 4, 5, 6].map(days => (
            <div 
              key={days} 
              className={`choice-pill ${formData.training.preferredDaysPerWeek === days ? 'selected' : ''}`} 
              onClick={() => {
                updateField('training', 'preferredDaysPerWeek', days);
                updateField('training', 'maxDaysPerWeek', Math.max(days, formData.training.maxDaysPerWeek || days));
              }}
            >
              <div className="choice-title">{days} أيام أسبوعياً</div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">مرونة جدول الأيام (كيف توزع أيام التمرين؟)</label>
        <select 
          className="form-control" 
          value={formData.training.trainingScheduleAvailabilityType || 'FLEXIBLE'} 
          onChange={e => updateField('training', 'trainingScheduleAvailabilityType', e.target.value)}
        >
          <option value="FLEXIBLE">مرن تماماً (دع النظام الذكي يحدد أفضل توزيع استشفاء)</option>
          <option value="FIXED_AVAILABLE_DAYS">أيام محددة فقط أستطيع الذهاب فيها للجيم</option>
          <option value="FIXED_UNAVAILABLE_DAYS">أيام معينة مشغولة تماماً لا أستطيع التمرين فيها</option>
          <option value="VARIABLE">متغير أسبوعياً حسب ظروف العمل والشفتات</option>
        </select>
      </div>

      {(formData.training.trainingScheduleAvailabilityType === 'FIXED_AVAILABLE_DAYS' || formData.training.trainingScheduleAvailabilityType === 'FIXED_UNAVAILABLE_DAYS') && (
        <div className="p-3 mb-3 rounded-3 border" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
          <label className="form-label fw-bold mb-2">
            {formData.training.trainingScheduleAvailabilityType === 'FIXED_AVAILABLE_DAYS' ? 'حدد الأيام المتاحة لك للتمرين:' : 'حدد الأيام التي لا تستطيع التمرين فيها نهائياً:'}
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {daysOfWeek.map(d => {
              const arrKey = formData.training.trainingScheduleAvailabilityType === 'FIXED_AVAILABLE_DAYS' ? 'availableTrainingDays' : 'unavailableTrainingDays';
              const isSelected = (formData.training[arrKey] || []).includes(d.code);
              return (
                <button
                  key={d.code}
                  type="button"
                  className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline-secondary'}`}
                  style={{ borderRadius: '8px', padding: '0.4rem 0.9rem', fontWeight: '600' }}
                  onClick={() => {
                    let newArr = [...(formData.training[arrKey] || [])];
                    if (isSelected) newArr = newArr.filter(code => code !== d.code);
                    else newArr.push(d.code);
                    updateField('training', arrKey, newArr);
                  }}
                >
                  {d.name} {isSelected && '✓'}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Home Equipment (Only if HOME selected) */}
      {formData.training.location === 'HOME' && (
        <>
          <div className="section-divider"></div>
          <h3 className="section-title">الأدوات والمعدات المتاحة في المنزل</h3>
          <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '-0.5rem' }}>
            حدد الأدوات التي تمتلكها ليقوم المحرك ببناء التمارين المناسبة لها بدقة 100%.
          </p>
          <div className="array-builder">
            {formData.training.equipment.map((eq, idx) => (
              <div key={idx} className="array-item">
                <button type="button" className="btn-remove" onClick={() => removeArrayItem('training', 'equipment', idx)}>
                  <i className="bi bi-trash"></i>
                </button>
                <div className="grid-2-col" style={{ width: '100%' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">نوع الأداة</label>
                    <select className="form-control" value={eq.equipmentCode} onChange={e => updateArrayItem('training', 'equipment', idx, 'equipmentCode', e.target.value)}>
                      <option value="BODYWEIGHT">وزن الجسم فقط (بدون أدوات)</option>
                      <option value="DUMBBELLS">دمبلز (Dumbbells)</option>
                      <option value="BARBELL_AND_PLATES">بار وأوزان حديد (Barbell & Plates)</option>
                      <option value="ADJUSTABLE_BENCH">دكة تمارين قابلة للتعديل (Adjustable Bench)</option>
                      <option value="FLAT_BENCH">دكة مستوية ثابتة (Flat Bench)</option>
                      <option value="RESISTANCE_BANDS">أستيك وحبال مقاومة (Bands)</option>
                      <option value="PULL_UP_BAR">عقلة منزلية للباب أو الحائط (Pull-up Bar)</option>
                      <option value="KETTLEBELLS">كيتل بيل (Kettlebells)</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">مستوى الوزن / المقاومة</label>
                    <select className="form-control" value={eq.loadCapacity || 'LIGHT'} onChange={e => updateArrayItem('training', 'equipment', idx, 'loadCapacity', e.target.value)}>
                      <option value="LIGHT">خفيفة (أقل من 5 كجم)</option>
                      <option value="MODERATE">متوسطة (5 إلى 15 كجم)</option>
                      <option value="HEAVY">ثقيلة (أكثر من 15 كجم)</option>
                      <option value="BODYWEIGHT_ONLY">وزن الجسم فقط</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className="btn-add-outline" onClick={() => addArrayItem('training', 'equipment', { equipmentCode: 'DUMBBELLS', loadCapacity: 'MODERATE' })}>
              + إضافة أداة رياضية
            </button>
          </div>
        </>
      )}

      {/* 4. Injuries & Pain Management */}
      <div className="section-divider"></div>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h3 className="section-title mb-0">الإصابات والآلام الحركية (إن وجدت)</h3>
        {formData.training.injuries.length === 0 && (
          <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 rounded-pill" style={{ fontSize: '0.72rem' }}>
            سليم وخالٍ من الإصابات ✓
          </span>
        )}
      </div>
      <p className="text-muted" style={{ fontSize: '0.82rem' }}>
        إذا كنت تعاني من ألم في مفصل أو عضلة، أضفه هنا ليقوم المحرك باستبعاد الحركات المجهدة له وتأهيل المنطقة المصابة.
      </p>

      <div className="array-builder">
        {formData.training.injuries.map((injury, idx) => (
          <div key={idx} className="array-item">
            <button type="button" className="btn-remove" onClick={() => removeArrayItem('training', 'injuries', idx)}>
              <i className="bi bi-trash"></i>
            </button>
            <div className="grid-2-col" style={{ width: '100%' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">موضع الإصابة أو الألم</label>
                <input 
                  type="text" 
                  className="form-control" 
                  list={`injury-suggestions-${idx}`}
                  value={injury.area || ''} 
                  onChange={e => updateArrayItem('training', 'injuries', idx, 'area', e.target.value)} 
                  placeholder="مثال: أسفل الظهر، الركبة اليسرى، الكتف" 
                />
                <datalist id={`injury-suggestions-${idx}`}>
                  {commonInjuries.map((item, cIdx) => (
                    <option key={cIdx} value={item} />
                  ))}
                </datalist>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">شدة وتأثير الألم على الحركة</label>
                <select 
                  className="form-control" 
                  value={injury.movementImpact || 'NONE'} 
                  onChange={e => updateArrayItem('training', 'injuries', idx, 'movementImpact', e.target.value)}
                >
                  <option value="NONE">ألم خفيف بسيط لا يمنع التمرين</option>
                  <option value="LIMITS">ألم متوسط يحد من زوايا حركية معينة</option>
                  <option value="PREVENTS">ألم شديد يمنع تمرين هذه المنطقة تماماً</option>
                </select>
              </div>
            </div>
          </div>
        ))}
        <button 
          type="button" 
          className="btn-add-outline" 
          onClick={() => addArrayItem('training', 'injuries', { area: '', painLevel: 3, movementImpact: 'LIMITS', worsening: false, numbnessOrWeakness: false, affectedMovements: [], medicalRestrictions: [] })}
        >
          + إضافة إصابة أو منطقة ألم
        </button>
      </div>

      {/* 5. Smart Cardio & Step Counter */}
      <div className="section-divider"></div>
      <h3 className="section-title">نشاط الكارديو وحرق الدهون (Cardio & Steps)</h3>
      <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '-0.5rem' }}>
        حساب الخطوات والنشاط الحركي يساعد المحرك في استنتاج معدل حرق السعرات بدقة عالمية وضبط العجز الحراري.
      </p>

      {/* Quick Visual Step Guide for Beginners */}
      <div className="form-group mb-3">
        <label className="form-label fw-bold">اختر مستوى نشاطك الحركي التقريبي (أو اكتب خطواتك بدقة):</label>
        <div className="row g-2 mb-2">
          {[
            { steps: 3000, label: 'خامل / مكتبي', desc: 'جلوس معظم اليوم وقليل المشي (~3,000 خطوة)' },
            { steps: 6000, label: 'حركة يومية خفيفة', desc: 'مشاوير وقضاء طلبات معتادة (~6,000 خطوة)' },
            { steps: 8500, label: 'نشيط وحركي (مثالي)', desc: 'مشي منتظم وحركة مستمرة (~8,500 خطوة)' },
            { steps: 12000, label: 'نشاط شاق جداً', desc: 'وقفة ومشي مستمر طوال اليوم (~12,000+ خطوة)' }
          ].map(lvl => (
            <div key={lvl.steps} className="col-md-3 col-6">
              <div 
                className={`p-2.5 rounded-3 border text-center h-100 cursor-pointer ${formData.cardio.averageDailySteps === lvl.steps ? 'border-primary bg-primary-subtle' : 'bg-light'}`}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                onClick={() => updateField('cardio', 'averageDailySteps', lvl.steps)}
              >
                <small className="d-block fw-bold text-primary mb-1">{lvl.label}</small>
                <span className="fw-bold fs-6 d-block text-dark">{lvl.steps.toLocaleString('ar-EG')}</span>
                <span className="text-muted d-block" style={{ fontSize: '0.7rem' }}>{lvl.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2-col">
        <div className="form-group">
          <label className="form-label">الخطوات اليومية المحسوبة (يمكنك كتابة رقم ساعتك الذكية):</label>
          <input 
            type="number" 
            step="500" 
            min="1000" 
            max="30000" 
            className="form-control" 
            value={formData.cardio.averageDailySteps || 5000} 
            onChange={e => updateField('cardio', 'averageDailySteps', Number(e.target.value))} 
            placeholder="مثال: 8000"
          />
        </div>

        <div className="form-group">
          <label className="form-label">القدرة على المشي لفترات متواصلة</label>
          <select 
            className="form-control" 
            value={formData.cardio.walkingAbility || 'EASY'} 
            onChange={e => updateField('cardio', 'walkingAbility', e.target.value)}
          >
            <option value="EASY">سهل ومريح (أستطيع المشي بدون أي تعب)</option>
            <option value="MODERATE_DIFFICULTY">صعوبة متوسطة مع المسافات الطويلة</option>
            <option value="PAINFUL">ألم وصعوبة تمنع المشي لفترات</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">عدد جلسات الكارديو المخصصة أسبوعياً</label>
          <select 
            className="form-control" 
            value={formData.cardio.maxSessionsPerWeek || 2} 
            onChange={e => updateField('cardio', 'maxSessionsPerWeek', Number(e.target.value))}
          >
            <option value={1}>جلسة واحدة أسبوعياً</option>
            <option value={2}>جلستان أسبوعياً (موصى بها)</option>
            <option value={3}>3 جلسات أسبوعياً (تسريع نزول الدهون)</option>
            <option value={4}>4 جلسات أسبوعياً</option>
            <option value={0}>لا أفضل الكارديو المنفصل (الاعتماد على الخطوات فقط)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">أقصى مدة لجلسة الكارديو (بالدقائق)</label>
          <select 
            className="form-control" 
            value={formData.cardio.maxDurationMinutes || 30} 
            onChange={e => updateField('cardio', 'maxDurationMinutes', Number(e.target.value))}
          >
            <option value={15}>15 دقيقة</option>
            <option value={20}>20 دقيقة</option>
            <option value={30}>30 دقيقة (المدة القياسية لنبض Zone 2)</option>
            <option value={45}>45 دقيقة</option>
          </select>
        </div>
      </div>

      {/* 6. Optional Additional Sports (Football, Padel, Swimming, etc.) */}
      <div className="section-divider"></div>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h3 className="section-title mb-0">الرياضات والأنشطة الإضافية (اختياري)</h3>
        <span className="badge rounded-pill fw-bold" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.72rem' }}>
          لضبط حرق السعرات بدقة
        </span>
      </div>
      <p className="text-muted" style={{ fontSize: '0.82rem' }}>
        إذا كنت تلعب كورة أو بادل أو سباحة بانتظام، أضفها ليقوم المحرك بحساب استهلاكها من الطاقة وحماية عضلاتك من الإجهاد.
      </p>

      <div className="array-builder">
        {(formData.cardio.additionalSports || []).map((sport, idx) => (
          <div key={idx} className="array-item">
            <button type="button" className="btn-remove" onClick={() => removeArrayItem('cardio', 'additionalSports', idx)}>
              <i className="bi bi-trash"></i>
            </button>
            <div className="grid-2-col" style={{ width: '100%' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">نوع الرياضة</label>
                <select 
                  className="form-control" 
                  value={sport.sportCode || 'FOOTBALL'} 
                  onChange={e => updateArrayItem('cardio', 'additionalSports', idx, 'sportCode', e.target.value)}
                >
                  {sportsList.map(s => (
                    <option key={s.code} value={s.code}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">مدة الماتش / التمرين (بالدقائق)</label>
                <input 
                  type="number" 
                  min="15" 
                  max="180" 
                  step="15" 
                  className="form-control" 
                  value={sport.minutesPerSession || 60} 
                  onChange={e => updateArrayItem('cardio', 'additionalSports', idx, 'minutesPerSession', Number(e.target.value))} 
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">شدة اللعب</label>
                <select 
                  className="form-control" 
                  value={sport.intensity || 'MODERATE'} 
                  onChange={e => updateArrayItem('cardio', 'additionalSports', idx, 'intensity', e.target.value)}
                >
                  <option value="LOW">خفيفة للترفيه والمرح</option>
                  <option value="MODERATE">متوسطة</option>
                  <option value="HIGH">عالية وماتشات حماسية وتنافسية</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">مستوى المشاركة</label>
                <select 
                  className="form-control" 
                  value={sport.participationLevel || 'RECREATIONAL'} 
                  onChange={e => updateArrayItem('cardio', 'additionalSports', idx, 'participationLevel', e.target.value)}
                >
                  <option value="RECREATIONAL">هواية مع الأصدقاء (Recreational)</option>
                  <option value="COMPETITIVE">بطولات وتنافس رسمي (Competitive)</option>
                </select>
              </div>
            </div>
          </div>
        ))}
        <button 
          type="button" 
          className="btn-add-outline" 
          onClick={() => addArrayItem('cardio', 'additionalSports', { sportCode: 'FOOTBALL', otherSportText: null, days: ['FRIDAY'], minutesPerSession: 60, intensity: 'MODERATE', participationLevel: 'RECREATIONAL' })}
        >
          + إضافة رياضة أسبوعية (كورة، بادل، سباحة...)
        </button>
      </div>
    </div>
  );
}
