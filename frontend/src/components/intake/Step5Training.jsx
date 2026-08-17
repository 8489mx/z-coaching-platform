import React from 'react';

export default function Step5Training({
 formData,
 updateField,
 addArrayItem,
 updateArrayItem,
 removeArrayItem
}) {
 return (
 <div className="step-content">
 <h3 className="section-title">إمكانيات التدريب</h3>
 <div className="grid-2-col">
 <div className="form-group">
 <label className="form-label">مكان التمرين</label>
 <div className="choices-grid">
 <div 
 className={`choice-pill ${formData.training.location === 'GYM' ? 'selected' : ''}`} 
 onClick={() => updateField('training', 'location', 'GYM')}
 >
 <div className="choice-title">في الجيم </div>
 </div>
 <div 
 className={`choice-pill ${formData.training.location === 'HOME' ? 'selected' : ''}`} 
 onClick={() => updateField('training', 'location', 'HOME')}
 >
 <div className="choice-title">في المنزل </div>
 </div>
 </div>
 </div>
 <div className="form-group">
 <label className="form-label">خبرتك في التمرين (رفع الأثقال)</label>
 <select className="form-control" value={formData.training.experience} onChange={e => updateField('training', 'experience', e.target.value)}>
 <option value="NEVER_TRAINED">لم أتدرب من قبل (Never Trained)</option>
 <option value="BEGINNER">مبتدئ (أقل من سنة)</option>
 <option value="INTERMEDIATE">متوسط (1 إلى 3 سنوات)</option>
 <option value="ADVANCED">متقدم (أكثر من 3 سنوات)</option>
 </select>
 </div>
 </div>

 <div className="grid-2-col">
 <div className="form-group" style={{ gridColumn: '1 / -1' }}>
 <label className="form-label">مرونة أيام التدريب (Schedule Availability)</label>
 <select className="form-control" value={formData.training.trainingScheduleAvailabilityType} onChange={e => updateField('training', 'trainingScheduleAvailabilityType', e.target.value)}>
 <option value="FLEXIBLE">مرن تماماً (أي أيام)</option>
 <option value="VARIABLE">متغير (حسب ظروف العمل)</option>
 <option value="FIXED_AVAILABLE_DAYS">أيام محددة فقط متاح فيها</option>
 <option value="FIXED_UNAVAILABLE_DAYS">أيام محددة غير متاح فيها أبداً</option>
 </select>
 </div>
 {(formData.training.trainingScheduleAvailabilityType === 'FIXED_AVAILABLE_DAYS' || formData.training.trainingScheduleAvailabilityType === 'FIXED_UNAVAILABLE_DAYS') && (
 <div className="form-group" style={{ gridColumn: '1 / -1' }}>
 <label className="form-label">{formData.training.trainingScheduleAvailabilityType === 'FIXED_AVAILABLE_DAYS' ? 'اختر الأيام المتاحة' : 'اختر الأيام غير المتاحة (الممنوعة)'}</label>
 <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
 {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(day => {
 const arrKey = formData.training.trainingScheduleAvailabilityType === 'FIXED_AVAILABLE_DAYS' ? 'availableTrainingDays' : 'unavailableTrainingDays';
 const isSelected = (formData.training[arrKey] || []).includes(day);
 return (
 <div key={day} className={`choice-pill ${isSelected ? 'selected' : ''}`} style={{ padding: '0.5rem 1rem', minHeight: 'auto' }} onClick={() => {
 let newArr = [...(formData.training[arrKey] || [])];
 if (isSelected) newArr = newArr.filter(d => d !== day);
 else newArr.push(day);
 updateField('training', arrKey, newArr);
 }}>
 <div className="choice-title">{day}</div>
 </div>
 );
 })}
 </div>
 </div>
 )}
 <div className="form-group">
 <label className="form-label">أيام التمرين المفضلة أسبوعياً</label>
 <input type="number" min="1" max="6" className="form-control" value={formData.training.preferredDaysPerWeek} onChange={e => {
 const val = Number(e.target.value);
 updateField('training', 'preferredDaysPerWeek', val);
 if (val > formData.training.maxDaysPerWeek) updateField('training', 'maxDaysPerWeek', val);
 }} />
 </div>
 <div className="form-group">
 <label className="form-label">الحد الأقصى للأيام التي يمكنك توفيرها</label>
 <input type="number" min="1" max="7" className="form-control" value={formData.training.maxDaysPerWeek} onChange={e => updateField('training', 'maxDaysPerWeek', Number(e.target.value))} />
 </div>
 <div className="form-group">
 <label className="form-label">أقصى مدة للحصة الواحدة (بالدقائق)</label>
 <input type="number" min="15" max="180" step="15" className="form-control" value={formData.training.maxSessionMinutes} onChange={e => updateField('training', 'maxSessionMinutes', Number(e.target.value))} />
 </div>
 <div className="form-group">
 <label className="form-label">انتظامك في التمرين آخر 4 أسابيع؟</label>
 <select className="form-control" value={formData.training.recentTraining} onChange={e => updateField('training', 'recentTraining', e.target.value)}>
 <option value="NONE_LAST_4_WEEKS">منقطع تماماً</option>
 <option value="IRREGULAR">متقطع (يوم أو يومين فقط)</option>
 <option value="CONSISTENT_LIGHT">منتظم لكن أوزان خفيفة</option>
 <option value="CONSISTENT_HARD">منتظم وشاق</option>
 </select>
 </div>
 </div>
 
 {formData.training.location === 'HOME' && (
 <>
 <div className="section-divider"></div>
 <h3 className="section-title">المعدات المتاحة في المنزل</h3>
 <p style={{ fontSize: '0.85rem', color: '#64748b' }}>حدد ما تملكه لكي نبني خطة مناسبة لمنزلك</p>
 <div className="array-builder">
 {formData.training.equipment.map((eq, idx) => (
 <div key={idx} className="array-item">
 <button type="button" className="btn-remove" onClick={() => removeArrayItem('training', 'equipment', idx)}>
 <i className="bi bi-trash"></i>
 </button>
 <div className="grid-2-col" style={{ width: '100%' }}>
 <div className="form-group" style={{ marginBottom: 0 }}>
 <label className="form-label">نوع المعدة</label>
 <select className="form-control" value={eq.equipmentCode} onChange={e => updateArrayItem('training', 'equipment', idx, 'equipmentCode', e.target.value)}>
 <option value="BODYWEIGHT">وزن الجسم فقط</option>
 <option value="DUMBBELLS">دمبلز (Dumbbells)</option>
 <option value="BARBELL_AND_PLATES">بار وأوزان (Barbell & Plates)</option>
 <option value="ADJUSTABLE_BENCH">دكة قابلة للتعديل (Adjustable Bench)</option>
 <option value="FLAT_BENCH">دكة مستوية (Flat Bench)</option>
 <option value="RESISTANCE_BANDS">أستيك مقاومة (Bands)</option>
 <option value="PULL_UP_BAR">عقلة (Pull-up Bar)</option>
 <option value="SQUAT_RACK">حامل سكوات (Squat Rack)</option>
 <option value="SMITH_MACHINE">جهاز سميث (Smith Machine)</option>
 <option value="CABLE_STATION">جهاز كابل (Cable Station)</option>
 <option value="SELECTORIZED_MACHINES">أجهزة جيم كاملة (Machines)</option>
 <option value="KETTLEBELLS">كيتل بيل (Kettlebells)</option>
 <option value="FOAM_ROLLER">فوم رولر (Foam Roller)</option>
 </select>
 </div>
 <div className="form-group" style={{ marginBottom: 0 }}>
 <label className="form-label">وزنها/مقاومتها</label>
 <select className="form-control" value={eq.loadCapacity} onChange={e => updateArrayItem('training', 'equipment', idx, 'loadCapacity', e.target.value)}>
 <option value="LIGHT">خفيفة جداً (أقل من 5 كجم)</option>
 <option value="MEDIUM">متوسطة (5-15 كجم)</option>
 <option value="HEAVY">ثقيلة</option>
 <option value="ADJUSTABLE">قابلة للتعديل بأوزان متعددة</option>
 </select>
 </div>
 </div>
 </div>
 ))}
 <button type="button" className="btn-add-outline" onClick={() => addArrayItem('training', 'equipment', { equipmentCode: 'DUMBBELLS', loadCapacity: 'LIGHT' })}>
 + إضافة معدة رياضية
 </button>
 </div>
 </>
 )}

 <div className="section-divider"></div>
 <h3 className="section-title">الإصابات والآلام (Injuries)</h3>
 <div className="array-builder">
 {formData.training.injuries.map((injury, idx) => (
 <div key={idx} className="array-item">
 <button type="button" className="btn-remove" onClick={() => removeArrayItem('training', 'injuries', idx)}>
 <i className="bi bi-trash"></i>
 </button>
 <div className="grid-2-col" style={{ width: '100%' }}>
 <div className="form-group" style={{ marginBottom: 0 }}>
 <label className="form-label">منطقة الإصابة أو الألم</label>
 <input type="text" className="form-control" value={injury.area} onChange={e => updateArrayItem('training', 'injuries', idx, 'area', e.target.value)} placeholder="مثال: الركبة اليمنى" />
 </div>
 <div className="form-group" style={{ marginBottom: 0 }}>
 <label className="form-label">مستوى الألم (0 إلى 10)</label>
 <input type="number" min="0" max="10" className="form-control" value={injury.painLevel} onChange={e => updateArrayItem('training', 'injuries', idx, 'painLevel', Number(e.target.value))} />
 </div>
 <div className="form-group" style={{ marginBottom: 0 }}>
 <label className="form-label">تأثيرها على الحركة</label>
 <select className="form-control" value={injury.movementImpact} onChange={e => updateArrayItem('training', 'injuries', idx, 'movementImpact', e.target.value)}>
 <option value="NONE">لا تأثير (NONE)</option>
 <option value="LIMITS">تحد من الحركة (LIMITS)</option>
 <option value="PREVENTS">تمنع الحركة تماماً (PREVENTS)</option>
 </select>
 </div>
 <div className="form-group" style={{ marginBottom: 0 }}>
 <label className="form-label">تزداد سوءاً مع التمرين؟</label>
 <select className="form-control" value={String(injury.worsening)} onChange={e => updateArrayItem('training', 'injuries', idx, 'worsening', e.target.value === 'true')}>
 <option value="false">لا</option>
 <option value="true">نعم</option>
 </select>
 </div>
 <div className="form-group" style={{ marginBottom: 0 }}>
 <label className="form-label">هل يصاحبها تنميل أو ضعف؟</label>
 <select className="form-control" value={String(injury.numbnessOrWeakness)} onChange={e => updateArrayItem('training', 'injuries', idx, 'numbnessOrWeakness', e.target.value === 'true')}>
 <option value="false">لا</option>
 <option value="true">نعم</option>
 </select>
 </div>
 </div>
 
 <div className="form-group mt-3" style={{ marginBottom: 0 }}>
 <label className="form-label">الموانع الطبية لهذه الإصابة (إن وجدت)</label>
 {(injury.medicalRestrictions || []).map((rest, restIdx) => (
 <div key={restIdx} className="grid-2-col" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '0.5rem', position: 'relative' }}>
 <button type="button" className="btn btn-sm btn-danger" style={{ position: 'absolute', left: '10px', top: '10px' }} onClick={() => {
 const newRests = [...(injury.medicalRestrictions || [])];
 newRests.splice(restIdx, 1);
 updateArrayItem('training', 'injuries', idx, 'medicalRestrictions', newRests);
 }}><i className="bi bi-x"></i></button>
 
 <div className="form-group" style={{ marginBottom: 0 }}>
 <label className="form-label" style={{ fontSize: '0.85rem' }}>الحركة الممنوعة</label>
 <select className="form-control" value={rest.movement} onChange={e => {
 const newRests = [...(injury.medicalRestrictions || [])];
 newRests[restIdx] = { ...newRests[restIdx], movement: e.target.value };
 updateArrayItem('training', 'injuries', idx, 'medicalRestrictions', newRests);
 }}>
 <option value="SQUAT">سكوات (SQUAT)</option>
 <option value="HINGE">انحناء (HINGE)</option>
 <option value="PUSH">دفع (PUSH)</option>
 <option value="PULL">سحب (PULL)</option>
 <option value="OVERHEAD">فوق الرأس (OVERHEAD)</option>
 <option value="ALL_TRAINING">تمرين الأثقال بالكامل</option>
 <option value="ALL_CARDIO">الكارديو بالكامل</option>
 </select>
 </div>
 <div className="form-group" style={{ marginBottom: 0 }}>
 <label className="form-label" style={{ fontSize: '0.85rem' }}>المصدر</label>
 <select className="form-control" value={rest.source} onChange={e => {
 const newRests = [...(injury.medicalRestrictions || [])];
 newRests[restIdx] = { ...newRests[restIdx], source: e.target.value };
 updateArrayItem('training', 'injuries', idx, 'medicalRestrictions', newRests);
 }}>
 <option value="PHYSICIAN">طبيب معالج</option>
 <option value="PHYSIOTHERAPIST">علاج طبيعي</option>
 <option value="OTHER_LICENSED_CLINICIAN">مختص آخر</option>
 </select>
 </div>
 </div>
 ))}
 <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
 const newRests = [...(injury.medicalRestrictions || []), { movement: 'SQUAT', instruction: 'AVOID', source: 'PHYSICIAN' }];
 updateArrayItem('training', 'injuries', idx, 'medicalRestrictions', newRests);
 }}>+ إضافة مانع طبي</button>
 </div>
 </div>
 ))}
 <button type="button" className="btn-add-outline" onClick={() => addArrayItem('training', 'injuries', { area: '', painLevel: 0, movementImpact: 'NONE', worsening: false, numbnessOrWeakness: false, affectedMovements: [], medicalRestrictions: [] })}>
 + إضافة إصابة
 </button>
 </div>

 <div className="section-divider"></div>
 <h3 className="section-title">نشاط الكارديو (Cardio)</h3>
 <div className="grid-2-col">
 <div className="form-group">
 <label className="form-label">متوسط خطواتك اليومية الحالية</label>
 <input type="number" step="1000" className="form-control" value={formData.cardio.averageDailySteps} onChange={e => updateField('cardio', 'averageDailySteps', Number(e.target.value))} />
 </div>
 <div className="form-group">
 <label className="form-label">القدرة على المشي لفترات</label>
 <select className="form-control" value={formData.cardio.walkingAbility} onChange={e => updateField('cardio', 'walkingAbility', e.target.value)}>
 <option value="EASY">سهل ومريح (يمكنني المشي لساعات)</option>
 <option value="MODERATE_DIFFICULTY">صعوبة متوسطة</option>
 <option value="PAINFUL">مؤلم أو غير ممكن لظروف طبية</option>
 </select>
 </div>
 <div className="form-group">
 <label className="form-label">أقصى عدد جلسات كارديو يمكنك إضافتها أسبوعياً</label>
 <input type="number" min="0" max="7" className="form-control" value={formData.cardio.maxSessionsPerWeek} onChange={e => updateField('cardio', 'maxSessionsPerWeek', Number(e.target.value))} />
 </div>
 <div className="form-group">
 <label className="form-label">أقصى مدة لجلسة الكارديو (بالدقائق)</label>
 <input type="number" min="10" max="60" step="5" className="form-control" value={formData.cardio.maxDurationMinutes} onChange={e => updateField('cardio', 'maxDurationMinutes', Number(e.target.value))} />
 </div>
 </div>
 </div>
 );
}
