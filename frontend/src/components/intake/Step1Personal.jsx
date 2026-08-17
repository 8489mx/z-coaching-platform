import React from 'react';

export default function Step1Personal({
  formData,
  updateField,
  updateNested
}) {
  return (
    <div className="step-content">
      <h3 className="section-title">بيانات المتدرب والاسم</h3>
      <div className="grid-2-col">
        <div className="form-group">
          <label className="form-label">الاسم الأول</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="مثال: أحمد"
            value={formData.personal.firstName} 
            onChange={e => updateField('personal', 'firstName', e.target.value)} 
          />
        </div>
        <div className="form-group">
          <label className="form-label">اسم العائلة (اللقب)</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="مثال: سمير"
            value={formData.personal.lastName} 
            onChange={e => updateField('personal', 'lastName', e.target.value)} 
          />
        </div>
      </div>
      
      <div className="section-divider"></div>
      <h3 className="section-title">البيانات الشخصية</h3>
      <div className="grid-2-col">
        <div className="form-group">
          <label className="form-label">تاريخ الميلاد</label>
          <input 
            type="date" 
            className="form-control" 
            value={formData.personal.dateOfBirth} 
            onChange={e => updateField('personal', 'dateOfBirth', e.target.value)} 
          />
        </div>
        <div className="form-group">
          <label className="form-label">الجنس</label>
          <div className="choices-grid">
            <div 
              className={`choice-pill ${formData.personal.sex === 'MALE' ? 'selected' : ''}`} 
              onClick={() => updateField('personal', 'sex', 'MALE')}
            >
              <div className="choice-title">ذكر 👨</div>
            </div>
            <div 
              className={`choice-pill ${formData.personal.sex === 'FEMALE' ? 'selected' : ''}`} 
              onClick={() => updateField('personal', 'sex', 'FEMALE')}
            >
              <div className="choice-title">أنثى 👩</div>
            </div>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">بلد الإقامة</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="مثل: EG, SA, AE"
            value={formData.personal.residenceCountry} 
            onChange={e => updateField('personal', 'residenceCountry', e.target.value.toUpperCase())} 
          />
        </div>
      </div>

      <div className="section-divider"></div>
      <h3 className="section-title">الأهداف المستهدفة</h3>
      <div className="form-group">
        <label className="form-label">الهدف الأساسي</label>
        <div className="choices-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {[
            { v: 'FAT_LOSS', l: 'خسارة الدهون 🔥' }, 
            { v: 'MUSCLE_GAIN', l: 'بناء العضلات 💪' }, 
            { v: 'WEIGHT_MAINTENANCE', l: 'المحافظة على الوزن ⚖️' },
            { v: 'GENERAL_HEALTH', l: 'تحسين الصحة العامة 🏃‍♂️' },
            { v: 'PERFORMANCE', l: 'تحسين الأداء الرياضي ⚡' },
            { v: 'OTHER', l: 'أخرى' }
          ].map(g => (
            <div 
              key={g.v} 
              className={`choice-pill ${formData.goals.primary === g.v ? 'selected' : ''}`} 
              onClick={() => updateField('goals', 'primary', g.v)}
            >
              <div className="choice-title">{g.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">الهدف التدريبي الثانوي</label>
        <select 
          className="form-control" 
          value={formData.goals.secondaryTraining} 
          onChange={e => updateField('goals', 'secondaryTraining', e.target.value)}
        >
          <option value="GENERAL_STRENGTH">القوة العامة (General Strength)</option>
          <option value="HYPERTROPHY">تضخيم عضلي (Hypertrophy)</option>
          <option value="ENDURANCE">قوة التحمل (Endurance)</option>
          <option value="POWERLIFTING">رفع أثقال (Powerlifting)</option>
        </select>
      </div>
    </div>
  );
}
