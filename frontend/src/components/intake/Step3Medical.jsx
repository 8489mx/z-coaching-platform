import React from 'react';

const DANGER_SYMPTOMS = [
  { key: 'chestPain', label: 'ألم أو ضغط وضيق في منطقة الصدر' },
  { key: 'fainting', label: 'حالات إغماء أو دوار شديد متكرر' },
  { key: 'shortnessOfBreath', label: 'ضيق تنفس غير معتاد مع أقل مجهود' },
  { key: 'palpitations', label: 'خفقان أو ضربات قلب سريعة وغير منتظمة' },
  { key: 'doctorBan', label: 'توصية أو تحذير طبي سابق بعدم ممارسة الرياضة' }
];

const CHRONIC_CONDITIONS_LIST = [
  { code: 'DIABETES', label: 'مرض السكري' },
  { code: 'HYPERTENSION', label: 'ارتفاع ضغط الدم' },
  { code: 'HEART_CONDITION', label: 'أمراض القلب والشرايين' },
  { code: 'THYROID_CONDITION', label: 'مشاكل الغدة الدرقية' },
  { code: 'ANEMIA', label: 'الأنيميا وفقر الدم' },
  { code: 'ASTHMA', label: 'الربو وحساسية الصدر' },
  { code: 'PCOS', label: 'تكيس المبايض (للإناث)' }
];

export default function Step3Medical({
  formData,
  updateField,
  updateNested
}) {
  const isFemale = formData.personal?.sex === 'FEMALE';
  const selectedSymptoms = formData.medical?.dangerousSymptomsList || [];
  const noSymptoms = selectedSymptoms.length === 0;

  const toggleSymptom = (key) => {
    if (key === 'NONE') {
      updateField('medical', 'dangerousSymptomsList', []);
      return;
    }
    const current = [...selectedSymptoms];
    const idx = current.indexOf(key);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(key);
    }
    updateField('medical', 'dangerousSymptomsList', current);
  };

  const selectedConditions = formData.medical?.selectedConditions || [];
  const toggleCondition = (code) => {
    if (code === 'NONE') {
      updateField('medical', 'selectedConditions', []);
      return;
    }
    const current = [...selectedConditions];
    const idx = current.findIndex(c => (typeof c === 'string' ? c : c.code) === code);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push({ code, status: 'STABLE' });
    }
    updateField('medical', 'selectedConditions', current);
  };

  const updateConditionStatus = (code, status) => {
    const current = selectedConditions.map(c => {
      const cCode = typeof c === 'string' ? c : c.code;
      if (cCode === code) return { code: cCode, status };
      return typeof c === 'string' ? { code: c, status: 'STABLE' } : c;
    });
    updateField('medical', 'selectedConditions', current);
  };

  return (
    <div className="step-content">
      {/* 1. Danger Symptoms (PAR-Q+ Safety Audit) */}
      <h3 className="section-title">فحص الأمان الطبي العام (Safety Audit)</h3>
      <p className="text-muted mb-3" style={{ fontSize: '0.82rem' }}>
        هل تعاني حالياً أو عانيت خلال آخر 12 شهراً من أي من الأعراض التالية؟ (اختيار متعدد):
      </p>

      <div className="choices-grid mb-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {DANGER_SYMPTOMS.map(sym => {
          const isSelected = selectedSymptoms.includes(sym.key);
          return (
            <div 
              key={sym.key}
              className={`choice-pill ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleSymptom(sym.key)}
            >
              <div className="choice-title">{sym.label}</div>
            </div>
          );
        })}
        <div 
          className={`choice-pill ${noSymptoms ? 'selected' : ''}`}
          onClick={() => toggleSymptom('NONE')}
          style={{ borderColor: noSymptoms ? '#10b981' : '#e2e8f0' }}
        >
          <div className="choice-title" style={{ color: noSymptoms ? '#059669' : 'inherit', fontWeight: '700' }}>
            لا أعاني من أي أعراض تحذيرية نهائياً
          </div>
        </div>
      </div>

      <div className="section-divider"></div>

      {/* 2. Chronic Conditions */}
      <h3 className="section-title">الحالات الصحية المزمنة (إن وجدت)</h3>
      <div className="choices-grid mb-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {CHRONIC_CONDITIONS_LIST.map(cond => {
          if (cond.code === 'PCOS' && !isFemale) return null;
          const isSelected = selectedConditions.some(c => (typeof c === 'string' ? c : c.code) === cond.code);
          return (
            <div 
              key={cond.code}
              className={`choice-pill ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleCondition(cond.code)}
            >
              <div className="choice-title">{cond.label}</div>
            </div>
          );
        })}
        <div 
          className={`choice-pill ${selectedConditions.length === 0 ? 'selected' : ''}`}
          onClick={() => toggleCondition('NONE')}
        >
          <div className="choice-title">لا توجد حالات مزمنة</div>
        </div>
      </div>

      {/* Condition Stability Selectors if any selected */}
      {selectedConditions.length > 0 && (
        <div className="p-3 mb-3 rounded-3 bg-light border">
          <label className="form-label text-dark fw-bold mb-2">استقرار الحالة المشخصة:</label>
          <div className="d-flex flex-column gap-2">
            {selectedConditions.map(c => {
              const cCode = typeof c === 'string' ? c : c.code;
              const condObj = CHRONIC_CONDITIONS_LIST.find(item => item.code === cCode);
              const status = typeof c === 'object' && c.status ? c.status : 'STABLE';
              return (
                <div key={cCode} className="d-flex align-items-center justify-content-between p-2 bg-white rounded-2 border">
                  <span className="fw-bold small text-dark">{condObj?.label || cCode}</span>
                  <div className="d-flex gap-1">
                    <button 
                      type="button" 
                      onClick={() => updateConditionStatus(cCode, 'STABLE')}
                      className={`btn btn-sm px-2.5 py-1 rounded-2 fw-semibold ${status === 'STABLE' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      style={{ fontSize: '0.74rem' }}
                    >
                      مستقرة وتحت السيطرة
                    </button>
                    <button 
                      type="button" 
                      onClick={() => updateConditionStatus(cCode, 'UNSTABLE')}
                      className={`btn btn-sm px-2.5 py-1 rounded-2 fw-semibold ${status === 'UNSTABLE' ? 'btn-danger' : 'btn-outline-secondary'}`}
                      style={{ fontSize: '0.74rem' }}
                    >
                      غير مستقرة
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Women's Health (Females Only) */}
      {isFemale && (
        <>
          <div className="section-divider"></div>
          <h3 className="section-title">صحة المرأة ومرحلة الحمل / الرضاعة</h3>
          <div className="form-group mb-2">
            <label className="form-label">الحالة الحالية:</label>
            <div className="choices-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              {[
                { v: 'NOT_PREGNANT', l: 'لا ينطبق أي مما سبق' },
                { v: 'PREGNANT', l: 'حامل حالياً' },
                { v: 'NURSING', l: 'مرضعة طبيعياً' },
                { v: 'POSTPARTUM_12M', l: 'خلال 12 شهر بعد الولادة' }
              ].map(w => (
                <div 
                  key={w.v}
                  className={`choice-pill ${formData.medical?.pregnancyStatus === w.v ? 'selected' : ''}`}
                  onClick={() => updateField('medical', 'pregnancyStatus', w.v)}
                >
                  <div className="choice-title">{w.l}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
