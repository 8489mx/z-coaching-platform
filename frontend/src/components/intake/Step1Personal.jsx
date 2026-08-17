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
 placeholder="الاسم الأول..."
 value={formData.personal.firstName} 
 onChange={e => updateField('personal', 'firstName', e.target.value)} 
 />
 </div>
 <div className="form-group">
 <label className="form-label">اسم العائلة (اللقب)</label>
 <input 
 type="text" 
 className="form-control" 
 placeholder="اسم العائلة..."
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
 <div className="choice-title">ذكر </div>
 </div>
 <div 
 className={`choice-pill ${formData.personal.sex === 'FEMALE' ? 'selected' : ''}`} 
 onClick={() => updateField('personal', 'sex', 'FEMALE')}
 >
 <div className="choice-title">أنثى </div>
 </div>
 </div>
 </div>
        <div className="form-group">
          <label className="form-label">بلد الإقامة</label>
          <select 
            className="form-control"
            value={formData.personal.residenceCountry || 'EG'} 
            onChange={e => updateField('personal', 'residenceCountry', e.target.value)}
            style={{ fontWeight: '600' }}
          >
            <option value="EG">مصر (Egypt)</option>
            <option value="SA">المملكة العربية السعودية (Saudi Arabia)</option>
            <option value="AE">الإمارات العربية المتحدة (UAE)</option>
            <option value="KW">الكويت (Kuwait)</option>
            <option value="QA">قطر (Qatar)</option>
            <option value="BH">البحرين (Bahrain)</option>
            <option value="OM">سلطنة عُمان (Oman)</option>
            <option value="IQ">العراق (Iraq)</option>
            <option value="JO">الأردن (Jordan)</option>
            <option value="LB">لبنان (Lebanon)</option>
            <option value="PS">فلسطين (Palestine)</option>
            <option value="SY">سوريا (Syria)</option>
            <option value="SD">السودان (Sudan)</option>
            <option value="LY">ليبيا (Libya)</option>
            <option value="MA">المغرب (Morocco)</option>
            <option value="DZ">الجزائر (Algeria)</option>
            <option value="TN">تونس (Tunisia)</option>
            <option value="YE">اليمن (Yemen)</option>
            <option value="TR">تركيا (Turkey)</option>
            <option value="GB">المملكة المتحدة (UK)</option>
            <option value="US">الولايات المتحدة (USA)</option>
            <option value="CA">كندا (Canada)</option>
            <option value="DE">ألمانيا (Germany)</option>
            <option value="IT">إيطاليا (Italy)</option>
            <option value="FR">فرنسا (France)</option>
            <option value="SE">السويد (Sweden)</option>
            <option value="NL">هولندا (Netherlands)</option>
          </select>
        </div>
      </div>
 
 <div className="section-divider"></div>
 <h3 className="section-title">الأهداف المستهدفة</h3>
 <div className="form-group">
 <label className="form-label">الهدف الأساسي</label>
 <div className="choices-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
 {[
 { v: 'FAT_LOSS', l: 'خسارة الدهون ونحت الجسم' }, 
 { v: 'MUSCLE_GAIN', l: 'بناء وتضخيم العضلات' }, 
 { v: 'WEIGHT_MAINTENANCE', l: 'المحافظة على الوزن وتناسق القوام' },
 { v: 'GENERAL_HEALTH', l: 'تحسين الصحة العامة واللياقة' },
 { v: 'PERFORMANCE', l: 'زيادة القوة والأداء الرياضي' }
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
 value={formData.goals.secondaryTraining || 'GENERAL_STRENGTH'} 
 onChange={e => updateField('goals', 'secondaryTraining', e.target.value)}
 style={{ fontWeight: '600' }}
 >
 <option value="GENERAL_STRENGTH">شد الجسم ونحت وتفصيل العضلات (إبراز التقاسيم)</option>
 <option value="HYPERTROPHY">زيادة الحجم العضلي والتضخيم (تكبير الكتلة العضلية)</option>
 <option value="POWERLIFTING">زيادة القوة البدنية ورفع أوزان أعلى (Power & Strength)</option>
 <option value="ENDURANCE">زيادة النفس وقوة التحمل واللياقة العامة (Endurance)</option>
 </select>
 </div>
 </div>
 );
}
