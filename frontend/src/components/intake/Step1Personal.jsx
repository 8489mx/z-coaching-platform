import React from 'react';
import SearchableSelect from '../common/SearchableSelect';

const COUNTRIES_OPTIONS = [
  { value: 'EG', label: 'مصر (Egypt)' },
  { value: 'SA', label: 'المملكة العربية السعودية (Saudi Arabia)' },
  { value: 'AE', label: 'الإمارات العربية المتحدة (UAE)' },
  { value: 'KW', label: 'الكويت (Kuwait)' },
  { value: 'QA', label: 'قطر (Qatar)' },
  { value: 'BH', label: 'البحرين (Bahrain)' },
  { value: 'OM', label: 'سلطنة عُمان (Oman)' },
  { value: 'IQ', label: 'العراق (Iraq)' },
  { value: 'JO', label: 'الأردن (Jordan)' },
  { value: 'LB', label: 'لبنان (Lebanon)' },
  { value: 'PS', label: 'فلسطين (Palestine)' },
  { value: 'SY', label: 'سوريا (Syria)' },
  { value: 'SD', label: 'السودان (Sudan)' },
  { value: 'LY', label: 'ليبيا (Libya)' },
  { value: 'MA', label: 'المغرب (Morocco)' },
  { value: 'DZ', label: 'الجزائر (Algeria)' },
  { value: 'TN', label: 'تونس (Tunisia)' },
  { value: 'YE', label: 'اليمن (Yemen)' },
  { value: 'TR', label: 'تركيا (Turkey)' },
  { value: 'GB', label: 'المملكة المتحدة (UK)' },
  { value: 'US', label: 'الولايات المتحدة (USA)' },
  { value: 'CA', label: 'كندا (Canada)' },
  { value: 'DE', label: 'ألمانيا (Germany)' },
  { value: 'IT', label: 'إيطاليا (Italy)' },
  { value: 'FR', label: 'فرنسا (France)' },
  { value: 'SE', label: 'السويد (Sweden)' },
  { value: 'NL', label: 'هولندا (Netherlands)' },
  { value: 'OTHER', label: 'دولة أخرى (Other Country)' }
];

export default function Step1Personal({
  formData,
  updateField,
  updateNested
}) {
  return (
    <div className="step-content">
      {/* 1. Basic Info */}
      <h3 className="section-title">بيانات المتدرب والتواصل</h3>
      <div className="grid-3-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">الاسم الأول</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="الاسم الأول..."
            value={formData.personal?.firstName || ''} 
            onChange={e => updateField('personal', 'firstName', e.target.value)} 
          />
        </div>
        <div className="form-group">
          <label className="form-label">اسم العائلة (اللقب)</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="اسم العائلة..."
            value={formData.personal?.lastName || ''} 
            onChange={e => updateField('personal', 'lastName', e.target.value)} 
          />
        </div>
        <div className="form-group">
          <label className="form-label">رقم الهاتف / الواتساب</label>
          <input 
            type="tel" 
            className="form-control" 
            placeholder="مثال: 01012345678"
            value={formData.personal?.phone || ''} 
            onChange={e => updateField('personal', 'phone', e.target.value)} 
            style={{ direction: 'ltr', textAlign: 'right', fontWeight: '600' }}
          />
        </div>
      </div>
      
      <div className="section-divider"></div>

      {/* 2. Personal Specs */}
      <h3 className="section-title">البيانات الشخصية</h3>
      <div className="grid-3-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">السن (بالسنوات)</label>
          <input 
            type="number" 
            min="14" 
            max="100"
            className="form-control" 
            placeholder="مثال: 24"
            value={formData.personal?.age ?? ''} 
            onChange={e => {
              const val = e.target.value;
              updateField('personal', 'age', val === '' ? '' : parseInt(val, 10));
            }} 
            style={{ fontWeight: '600' }}
          />
          <small className="text-muted" style={{ fontSize: '0.72rem' }}>متاح من سن 14 سنة فما فوق</small>
        </div>

        <div className="form-group">
          <label className="form-label">الجنس</label>
          <div className="choices-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div 
              className={`choice-pill ${formData.personal?.sex === 'MALE' ? 'selected' : ''}`} 
              onClick={() => updateField('personal', 'sex', 'MALE')}
            >
              <div className="choice-title">ذكر</div>
            </div>
            <div 
              className={`choice-pill ${formData.personal?.sex === 'FEMALE' ? 'selected' : ''}`} 
              onClick={() => updateField('personal', 'sex', 'FEMALE')}
            >
              <div className="choice-title">أنثى</div>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">بلد الإقامة</label>
          <SearchableSelect 
            options={COUNTRIES_OPTIONS}
            value={formData.personal?.residenceCountry || 'EG'} 
            onChange={val => updateField('personal', 'residenceCountry', val)}
            placeholder="اختر الدولة..."
            searchPlaceholder="ابحث عن دولتك (عربي / English)..."
          />
        </div>
      </div>
      
      <div className="section-divider"></div>

      {/* 3. Primary & Secondary Goals */}
      <h3 className="section-title">الأهداف المستهدفة</h3>
      <div className="form-group mb-4">
        <label className="form-label">الهدف الأساسي (إجباري)</label>
        <div className="choices-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {[
            { v: 'FAT_LOSS', l: 'خسارة الدهون ونحت الجسم' }, 
            { v: 'MUSCLE_GAIN', l: 'بناء وتضخيم الكتلة العضلية' }, 
            { v: 'BODY_RECOMPOSITION', l: 'إعادة تشكيل الجسم (حرق وبناء معاً)' },
            { v: 'WEIGHT_MAINTENANCE', l: 'المحافظة على الوزن وتناسق القوام' },
            { v: 'GENERAL_HEALTH', l: 'تحسين الصحة العامة واللياقة' },
            { v: 'PERFORMANCE', l: 'زيادة القوة والأداء الرياضي البدني' }
          ].map(g => (
            <div 
              key={g.v} 
              className={`choice-pill ${formData.goals?.primary === g.v ? 'selected' : ''}`} 
              onClick={() => updateField('goals', 'primary', g.v)}
            >
              <div className="choice-title">{g.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group mb-4">
        <label className="form-label">الهدف التدريبي الثانوي (اختياري)</label>
        <select 
          className="form-control" 
          value={formData.goals?.secondaryTraining || 'NONE'} 
          onChange={e => updateField('goals', 'secondaryTraining', e.target.value)}
          style={{ fontWeight: '600' }}
        >
          <option value="NONE">لا يوجد هدف ثانوي محدد</option>
          <option value="BODY_TONING">شد ترهلات الجسم ونحت وتفصيل العضلات (Body Toning)</option>
          <option value="HYPERTROPHY">زيادة الحجم العضلي والتضخيم (Hypertrophy)</option>
          <option value="STRENGTH">زيادة القوة البدنية ورفع أوزان أعلى (Strength)</option>
          <option value="ENDURANCE">زيادة قوة التحمل واللياقة التنفسية (Endurance)</option>
        </select>
      </div>

    </div>
  );
}
