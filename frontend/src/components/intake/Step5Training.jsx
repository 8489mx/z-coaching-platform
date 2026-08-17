import React from 'react';

const FOCUS_MUSCLE_OPTIONS = [
  { code: 'CHEST', label: 'الصدر' },
  { code: 'BACK', label: 'الظهر والسحب' },
  { code: 'SHOULDERS', label: 'الأكتاف' },
  { code: 'ARMS', label: 'الذراعين (باي وتراي)' },
  { code: 'LEGS', label: 'الأرجل والأفخاذ' },
  { code: 'ABS_CORE', label: 'البطن وعضلات الكور' },
  { code: 'GLUTES', label: 'المؤخرة والأرداف (للإناث)' }
];

const INJURY_AREAS = [
  { code: 'LOWER_BACK', label: 'أسفل الظهر' },
  { code: 'SHOULDER', label: 'مفصل الكتف' },
  { code: 'KNEE', label: 'مفصل الركبة' },
  { code: 'NECK', label: 'الرقبة وأعلى الظهر' },
  { code: 'ELBOW_WRIST', label: 'الكوع أو المعصم' }
];

const SPORTS_LIST = [
  { code: 'FOOTBALL', name: 'كرة قدم (Football)' },
  { code: 'RACKET_SPORTS', name: 'بادل أو تنس (Padel / Tennis)' },
  { code: 'SWIMMING', name: 'سباحة (Swimming)' },
  { code: 'RUNNING', name: 'جري سريع (Running)' },
  { code: 'MARTIAL_ARTS', name: 'ملاكمة / فنون قتالية (Martial Arts)' },
  { code: 'BASKETBALL', name: 'كرة سلة (Basketball)' },
  { code: 'CYCLING', name: 'ركوب دراجات (Cycling)' },
  { code: 'CROSSFIT_OR_FUNCTIONAL', name: 'كروس فيت / تمارين وظيفية (CrossFit)' }
];

export default function Step5Training({
  formData,
  updateField,
  addArrayItem,
  updateArrayItem,
  removeArrayItem
}) {
  const isFemale = formData.personal?.sex === 'FEMALE';
  const focusMuscles = formData.training?.targetFocusMuscles || [];

  const toggleFocusMuscle = (code) => {
    const current = [...focusMuscles];
    const idx = current.indexOf(code);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      if (current.length < 2) current.push(code);
    }
    updateField('training', 'targetFocusMuscles', current);
  };

  const selectedInjuries = formData.training?.selectedInjuries || [];
  const noInjuries = selectedInjuries.length === 0;

  const toggleInjury = (code) => {
    if (code === 'NONE') {
      updateField('training', 'selectedInjuries', []);
      return;
    }
    const current = [...selectedInjuries];
    const idx = current.findIndex(item => (typeof item === 'string' ? item : item.code) === code);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push({ code, impact: 'LIMITS' });
    }
    updateField('training', 'selectedInjuries', current);
  };

  return (
    <div className="step-content">
      {/* 1. Training Environment & Experience */}
      <h3 className="section-title">بيئة ومكان وخبرة التدريب</h3>
      
      <div className="form-group mb-4">
        <label className="form-label">مكان وتجهيزات التمرين المتاحة لديك:</label>
        <div className="choices-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {[
            { v: 'GYM', l: 'جيم تجاري متكامل الأجهزة' },
            { v: 'HOME_GEAR', l: 'في المنزل (بدامبلز وبنش)' },
            { v: 'HOME_BODYWEIGHT', l: 'في المنزل (بوزن الجسم بدون أدوات)' }
          ].map(loc => (
            <div 
              key={loc.v} 
              className={`choice-pill ${(formData.training?.location === loc.v || (loc.v === 'GYM' && formData.training?.location === 'GYM') || (loc.v === 'HOME_GEAR' && formData.training?.location === 'HOME')) ? 'selected' : ''}`} 
              onClick={() => updateField('training', 'location', loc.v)}
            >
              <div className="choice-title">{loc.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group mb-4">
        <label className="form-label">مستوى خبرتك في تمارين الحديد والمقاومة:</label>
        <div className="choices-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {[
            { v: 'BEGINNER', l: 'مبتدئ (أقل من سنة خبرة)' },
            { v: 'INTERMEDIATE', l: 'متوسط (من سنة إلى 3 سنوات تمرين منتظم)' },
            { v: 'ADVANCED', l: 'متقدم (أكثر من 3 سنوات وتدريب شاق)' }
          ].map(exp => (
            <div 
              key={exp.v} 
              className={`choice-pill ${formData.training?.experience === exp.v ? 'selected' : ''}`} 
              onClick={() => updateField('training', 'experience', exp.v)}
            >
              <div className="choice-title">{exp.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section-divider"></div>

      {/* 2. Days & Weekly Availability */}
      <h3 className="section-title">أيام ومدة التمرين الأسبوعية</h3>
      
      <div className="form-group mb-4">
        <label className="form-label">كم يوماً تستطيع الالتزام بالتمرين أسبوعياً؟</label>
        <div className="choices-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))' }}>
          {[2, 3, 4, 5, 6].map(days => (
            <div 
              key={days} 
              className={`choice-pill ${formData.training?.preferredDaysPerWeek === days ? 'selected' : ''}`} 
              onClick={() => {
                updateField('training', 'preferredDaysPerWeek', days);
                updateField('training', 'maxDaysPerWeek', days);
              }}
            >
              <div className="choice-title">{days} أيام</div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group mb-4">
        <label className="form-label">المدة الزمنية المفضلة للحصة التدريبية الواحدة:</label>
        <div className="choices-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          {[
            { m: 45, l: '45 دقيقة (حصة سريعة)' },
            { m: 60, l: '60 دقيقة (المدة المثالية)' },
            { m: 75, l: '75 دقيقة' },
            { m: 90, l: '90 دقيقة (مكثف)' }
          ].map(dur => (
            <div 
              key={dur.m} 
              className={`choice-pill ${formData.training?.maxSessionMinutes === dur.m ? 'selected' : ''}`} 
              onClick={() => updateField('training', 'maxSessionMinutes', dur.m)}
            >
              <div className="choice-title">{dur.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section-divider"></div>

      {/* 3. Muscle Focus & Injuries */}
      <h3 className="section-title">العضلات المستهدفة بالتركيز والإصابات</h3>
      
      <div className="form-group mb-4">
        <label className="form-label">
          عضلات ترغب في التركيز عليها وإبرازها أكثر <span className="text-muted fw-normal">(اختر حتى منطقتين)</span>:
        </label>
        <div className="choices-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          {FOCUS_MUSCLE_OPTIONS.map(m => {
            if (m.code === 'GLUTES' && !isFemale) return null;
            const isSelected = focusMuscles.includes(m.code);
            return (
              <div 
                key={m.code}
                className={`choice-pill ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleFocusMuscle(m.code)}
              >
                <div className="choice-title">{isSelected ? '✓ ' : ''}{m.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Injury Pills */}
      <div className="form-group mb-4">
        <label className="form-label">موضع الإصابة أو الألم الحركي (إن وجد لاستبعاد التمارين الخطرة):</label>
        <div className="choices-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          {INJURY_AREAS.map(inj => {
            const isSelected = selectedInjuries.some(item => (typeof item === 'string' ? item : item.code) === inj.code);
            return (
              <div 
                key={inj.code}
                className={`choice-pill ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleInjury(inj.code)}
                style={{
                  borderColor: isSelected ? '#e11d48' : '#e2e8f0',
                  background: isSelected ? 'rgba(225, 29, 72, 0.06)' : 'transparent'
                }}
              >
                <div className="choice-title" style={{ color: isSelected ? '#e11d48' : 'inherit' }}>
                  {isSelected ? '⚠ ' : ''}{inj.label}
                </div>
              </div>
            );
          })}
          <div 
            className={`choice-pill ${noInjuries ? 'selected' : ''}`}
            onClick={() => toggleInjury('NONE')}
            style={{ borderColor: noInjuries ? '#10b981' : '#e2e8f0' }}
          >
            <div className="choice-title" style={{ color: noInjuries ? '#059669' : 'inherit', fontWeight: '700' }}>
              ✓ لا توجد إصابات (سليم تماماً)
            </div>
          </div>
        </div>
      </div>

      {/* 4. Smart Cardio & Step Counter */}
      <div className="section-divider"></div>
      <h3 className="section-title">نشاط الكارديو وحرق السعرات (Cardio & Steps)</h3>
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
                className={`p-2.5 rounded-3 border text-center h-100 cursor-pointer ${formData.cardio?.averageDailySteps === lvl.steps ? 'border-primary bg-primary-subtle' : 'bg-light'}`}
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
          <label className="form-label">الخطوات اليومية المحسوبة (أو من ساعتك الذكية):</label>
          <input 
            type="number" 
            step="500" 
            min="1000" 
            max="30000" 
            className="form-control" 
            value={formData.cardio?.averageDailySteps || 5000} 
            onChange={e => updateField('cardio', 'averageDailySteps', Number(e.target.value))} 
            placeholder="مثال: 8000"
          />
        </div>

        <div className="form-group">
          <label className="form-label">القدرة على المشي لفترات متواصلة</label>
          <select 
            className="form-control" 
            value={formData.cardio?.walkingAbility || 'EASY'} 
            onChange={e => updateField('cardio', 'walkingAbility', e.target.value)}
          >
            <option value="EASY">سهل ومريح (بدون أي تعب بالمفاصل)</option>
            <option value="MODERATE_DIFFICULTY">صعوبة متوسطة مع المسافات الطويلة</option>
            <option value="PAINFUL">مؤلم للركبة أو الظهر (تحويل لدراجة/سباحة)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">عدد جلسات الكارديو المخصصة أسبوعياً</label>
          <select 
            className="form-control" 
            value={formData.cardio?.maxSessionsPerWeek !== undefined ? formData.cardio.maxSessionsPerWeek : 2} 
            onChange={e => updateField('cardio', 'maxSessionsPerWeek', Number(e.target.value))}
          >
            <option value={2}>جلستان أسبوعياً (موصى بها)</option>
            <option value={3}>3 جلسات أسبوعياً (تسريع حرق الدهون)</option>
            <option value={4}>4 جلسات أسبوعياً</option>
            <option value={0}>لا أفضل كارديو منفصل (الاعتماد على الخطوات فقط)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">مدة جلسة الكارديو (بالدقائق)</label>
          <select 
            className="form-control" 
            value={formData.cardio?.maxDurationMinutes || 30} 
            onChange={e => updateField('cardio', 'maxDurationMinutes', Number(e.target.value))}
          >
            <option value={15}>15 دقيقة (سريعة)</option>
            <option value={20}>20 دقيقة</option>
            <option value={30}>30 دقيقة (المدة المثالية Zone 2)</option>
            <option value={45}>45 دقيقة</option>
          </select>
        </div>
      </div>

      {/* 5. Optional Additional Sports */}
      <div className="section-divider"></div>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h3 className="section-title mb-0">الرياضات الإضافية (اختياري)</h3>
        <span className="badge rounded-pill fw-bold" style={{ background: '#f5f3ff', color: '#1e144f', border: '1px solid #ddd6fe', fontSize: '0.72rem' }}>
          لضبط حرق السعرات بدقة
        </span>
      </div>
      <p className="text-muted" style={{ fontSize: '0.82rem' }}>
        إذا كنت تلعب كورة أو بادل أو سباحة بانتظام، أضفها ليقوم المحرك بحساب استهلاكها من الطاقة وحماية عضلاتك من الإجهاد.
      </p>

      <div className="array-builder">
        {(formData.cardio?.additionalSports || []).map((sport, idx) => (
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
                  {SPORTS_LIST.map(s => (
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
            </div>
          </div>
        ))}
        <button 
          type="button" 
          className="btn-add-outline" 
          onClick={() => addArrayItem('cardio', 'additionalSports', { sportCode: 'FOOTBALL', minutesPerSession: 60, intensity: 'MODERATE', participationLevel: 'RECREATIONAL' })}
        >
          + إضافة رياضة أسبوعية (كورة، بادل، سباحة...)
        </button>
      </div>
    </div>
  );
}
