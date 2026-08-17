import React from 'react';

export default function Step3Medical({
  formData,
  updateField,
  updateNested,
  addArrayItem,
  updateArrayItem,
  removeArrayItem
}) {
  return (
    <div className="step-content">
      <div className="alert" style={{ background: '#fff3cd', color: '#856404', padding: '1rem', borderRadius: '10px', marginBottom: '2rem', border: '1px solid #ffeeba' }}>
        <strong>تنبيه طبي هام:</strong> يرجى الإجابة بدقة لضمان تصميم خطة آمنة لك. إذا كنت تعاني من حالات حرجة، يجب استشارة الطبيب قبل البدء بأي برنامج رياضي أو غذائي.
      </div>
      
      <h3 className="section-title">حالات طبية مزمنة (إن وجدت)</h3>
      <div className="array-builder">
        {formData.medical.conditions.map((cond, idx) => (
          <div key={idx} className="array-item">
            <button type="button" className="btn-remove" onClick={() => removeArrayItem('medical', 'conditions', idx)}>
              <i className="bi bi-trash"></i>
            </button>
            <div className="grid-2-col" style={{ width: '100%' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">المرض / الحالة</label>
                <select className="form-control" value={cond.conditionCode} onChange={e => updateArrayItem('medical', 'conditions', idx, 'conditionCode', e.target.value)}>
                  <option value="DIABETES">السكري (بشكل عام)</option>
                  <option value="INSULIN_RESISTANCE">مقاومة الأنسولين</option>
                  <option value="HYPERTENSION">ارتفاع ضغط الدم</option>
                  <option value="HEART_CONDITION">أمراض القلب</option>
                  <option value="KIDNEY_CONDITION">أمراض الكلى</option>
                  <option value="LIVER_CONDITION">أمراض الكبد</option>
                  <option value="THYROID_CONDITION">مشاكل الغدة الدرقية</option>
                  <option value="ANEMIA">أنيميا (فقر الدم)</option>
                  <option value="ASTHMA_OR_RESPIRATORY_CONDITION">ربو أو أمراض تنفسية</option>
                  <option value="DIAGNOSED_DIGESTIVE_CONDITION">أمراض الجهاز الهضمي (مشخصة)</option>
                  <option value="PCOS">تكيس المبايض (PCOS)</option>
                  <option value="OTHER">أخرى</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">استقرار الحالة</label>
                <select className="form-control" value={cond.stability} onChange={e => updateArrayItem('medical', 'conditions', idx, 'stability', e.target.value)}>
                  <option value="STABLE">مستقرة ومتحكم بها</option>
                  <option value="UNSTABLE">غير مستقرة</option>
                  <option value="UNKNOWN">غير معروف</option>
                </select>
              </div>
              {cond.conditionCode === 'OTHER' && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">تفاصيل الحالة</label>
                  <input type="text" className="form-control" value={cond.otherConditionText || ''} onChange={e => updateArrayItem('medical', 'conditions', idx, 'otherConditionText', e.target.value)} />
                </div>
              )}
            </div>
            <div className="form-group mt-3">
              <label className="form-label">تعليمات الطبيب المعالج (إن وجدت)</label>
              {(cond.physicianInstructions || []).map((inst, instIdx) => (
                <div key={instIdx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input type="text" className="form-control" value={inst} onChange={e => {
                    const newInst = [...(cond.physicianInstructions || [])];
                    newInst[instIdx] = e.target.value;
                    updateArrayItem('medical', 'conditions', idx, 'physicianInstructions', newInst);
                  }} placeholder="مثال: يمنع رفع أوزان ثقيلة..." />
                  <button type="button" className="btn btn-danger" onClick={() => {
                    const newInst = [...(cond.physicianInstructions || [])];
                    newInst.splice(instIdx, 1);
                    updateArrayItem('medical', 'conditions', idx, 'physicianInstructions', newInst);
                  }}><i className="bi bi-x"></i></button>
                </div>
              ))}
              <button type="button" className="btn btn-secondary btn-sm mt-1" onClick={() => {
                const newInst = [...(cond.physicianInstructions || []), ''];
                updateArrayItem('medical', 'conditions', idx, 'physicianInstructions', newInst);
              }}>+ إضافة تعليمات</button>
            </div>
          </div>
        ))}
        <button type="button" className="btn-add-outline" onClick={() => addArrayItem('medical', 'conditions', { conditionCode: 'THYROID_CONDITION', stability: 'STABLE', physicianInstructions: [] })}>
          + إضافة حالة طبية
        </button>
      </div>

      <div className="section-divider"></div>
      <h3 className="section-title">أعراض تحذيرية</h3>
      <div className="grid-2-col">
        <div className="form-group">
          <label className="form-label">ألم أو ضغط بالصدر؟</label>
          <select className="form-control" value={formData.medical.dangerousSymptoms.chestPainOrPressure} onChange={e => updateNested('medical', 'dangerousSymptoms', 'chestPainOrPressure', e.target.value)}>
            <option value="NO">لا</option><option value="YES">نعم</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">إغماء أو دوار شديد؟</label>
          <select className="form-control" value={formData.medical.dangerousSymptoms.fainting} onChange={e => updateNested('medical', 'dangerousSymptoms', 'fainting', e.target.value)}>
            <option value="NO">لا</option><option value="YES">نعم</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">ضيق تنفس غير معتاد؟</label>
          <select className="form-control" value={formData.medical.dangerousSymptoms.unusualShortnessOfBreath} onChange={e => updateNested('medical', 'dangerousSymptoms', 'unusualShortnessOfBreath', e.target.value)}>
            <option value="NO">لا</option><option value="YES">نعم</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">خفقان قلب غير طبيعي؟</label>
          <select className="form-control" value={formData.medical.dangerousSymptoms.abnormalPalpitations} onChange={e => updateNested('medical', 'dangerousSymptoms', 'abnormalPalpitations', e.target.value)}>
            <option value="NO">لا</option><option value="YES">نعم</option>
          </select>
        </div>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">هل توجد أي أعراض تحذيرية أخرى؟</label>
          <select className="form-control mb-2" value={formData.medical.dangerousSymptoms.otherDangerousSymptomsPresent} onChange={e => updateNested('medical', 'dangerousSymptoms', 'otherDangerousSymptomsPresent', e.target.value)}>
            <option value="NO">لا</option><option value="YES">نعم</option>
          </select>
          {formData.medical.dangerousSymptoms.otherDangerousSymptomsPresent === 'YES' && (
            <div>
              {(formData.medical.dangerousSymptoms.otherDangerousSymptoms || []).map((sym, symIdx) => (
                <div key={symIdx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input type="text" className="form-control" value={sym} onChange={e => {
                    const newSym = [...(formData.medical.dangerousSymptoms.otherDangerousSymptoms || [])];
                    newSym[symIdx] = e.target.value;
                    updateNested('medical', 'dangerousSymptoms', 'otherDangerousSymptoms', newSym);
                  }} placeholder="اذكر العرض التحذيري" />
                  <button type="button" className="btn btn-danger" onClick={() => {
                    const newSym = [...(formData.medical.dangerousSymptoms.otherDangerousSymptoms || [])];
                    newSym.splice(symIdx, 1);
                    updateNested('medical', 'dangerousSymptoms', 'otherDangerousSymptoms', newSym);
                  }}><i className="bi bi-x"></i></button>
                </div>
              ))}
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                const newSym = [...(formData.medical.dangerousSymptoms.otherDangerousSymptoms || []), ''];
                updateNested('medical', 'dangerousSymptoms', 'otherDangerousSymptoms', newSym);
              }}>+ إضافة عرض آخر</button>
            </div>
          )}
        </div>
      </div>

      <div className="section-divider"></div>
      <h3 className="section-title">الأدوية الحالية (Medications)</h3>
      <div className="form-group">
        <label className="form-label">قائمة الأدوية (أضف دواء تلو الآخر)</label>
        {(formData.medical.medications || []).map((med, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input type="text" className="form-control" value={med} onChange={e => {
              const newMeds = [...(formData.medical.medications || [])];
              newMeds[idx] = e.target.value;
              updateField('medical', 'medications', newMeds);
            }} placeholder="اسم الدواء والجرعة" />
            <button type="button" className="btn btn-danger" onClick={() => {
              const newMeds = [...(formData.medical.medications || [])];
              newMeds.splice(idx, 1);
              updateField('medical', 'medications', newMeds);
            }}><i className="bi bi-x"></i></button>
          </div>
        ))}
        <button type="button" className="btn-add-outline" onClick={() => {
          const newMeds = [...(formData.medical.medications || []), ''];
          updateField('medical', 'medications', newMeds);
        }}>+ إضافة دواء</button>
      </div>

      <div className="section-divider"></div>
      <h3 className="section-title">أسئلة أخرى</h3>
      <div className="grid-2-col">
        {formData.personal.sex === 'FEMALE' && (
          <>
            <div className="form-group">
              <label className="form-label">حالة الحمل (للنساء)</label>
              <select className="form-control" value={formData.medical.pregnancyStatus} onChange={e => updateField('medical', 'pregnancyStatus', e.target.value)}>
                <option value="NOT_PREGNANT">غير حامل</option>
                <option value="PREGNANT">حامل</option>
                <option value="POSTPARTUM">في فترة ما بعد الولادة</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">انتظام الدورة الشهرية</label>
              <select className="form-control" value={formData.medical.menstrualStatus} onChange={e => updateField('medical', 'menstrualStatus', e.target.value)}>
                <option value="REGULAR">منتظمة</option>
                <option value="IRREGULAR">غير منتظمة</option>
                <option value="AMENORRHEA">منقطعة</option>
                <option value="POST_MENOPAUSAL">بعد سن اليأس</option>
              </select>
            </div>
          </>
        )}
        <div className="form-group">
          <label className="form-label">تاريخ اضطرابات الأكل (Eating Disorders)</label>
          <select className="form-control" value={formData.medical.eatingDisorderHistory} onChange={e => updateField('medical', 'eatingDisorderHistory', e.target.value)}>
            <option value="NONE">لا يوجد</option>
            <option value="PAST">سابقاً وتجاوزته</option>
            <option value="CURRENT">حالي</option>
          </select>
        </div>
      </div>
    </div>
  );
}
