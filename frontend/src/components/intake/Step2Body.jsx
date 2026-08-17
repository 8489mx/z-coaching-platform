import React from 'react';

export default function Step2Body({
  formData,
  updateField,
  updateNested
}) {
  return (
    <div className="step-content">
      <h3 className="section-title">القياسات الجسدية الحالية</h3>
      <div className="grid-2-col">
        <div className="form-group">
          <label className="form-label">الطول (سم)</label>
          <input 
            type="number" 
            className="form-control" 
            value={formData.body.heightCm} 
            onChange={e => updateField('body', 'heightCm', Number(e.target.value))} 
          />
        </div>
        <div className="form-group">
          <label className="form-label">الوزن (كجم)</label>
          <input 
            type="number" 
            className="form-control" 
            value={formData.body.weightKg} 
            onChange={e => updateField('body', 'weightKg', Number(e.target.value))} 
          />
        </div>
        <div className="form-group">
          <label className="form-label">محيط الخصر (سم) - اختياري ولكن مهم</label>
          <input 
            type="number" 
            className="form-control" 
            value={formData.body.waistCm} 
            onChange={e => updateField('body', 'waistCm', Number(e.target.value))} 
          />
        </div>
        <div className="form-group">
          <label className="form-label">دقة القياسات المتوفرة لديك</label>
          <select 
            className="form-control" 
            value={formData.body.measurementQuality} 
            onChange={e => updateField('body', 'measurementQuality', e.target.value)}
          >
            <option value="LOW">منخفضة (تخمين فقط)</option>
            <option value="MEDIUM">متوسطة</option>
            <option value="HIGH">عالية (ميزان دقيق وشريط قياس)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">اتجاه وزنك مؤخراً</label>
          <select 
            className="form-control" 
            value={formData.body.weightTrend || 'STABLE'} 
            onChange={e => updateField('body', 'weightTrend', e.target.value)}
          >
            <option value="LOSING">وزني ينزل مؤخراً</option>
            <option value="STABLE">وزني ثابت ومستقر</option>
            <option value="GAINING">وزني يزداد مؤخراً</option>
          </select>
        </div>
      </div>

      {/* Optional Progress Photos Upload Box */}
      <div className="p-3 my-3 rounded-4 border" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center gap-2">
            <span className="badge rounded-pill fw-bold" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe' }}>
              اختياري
            </span>
            <span className="fw-bold text-dark" style={{ fontSize: '0.92rem' }}>
              رفع صور التقييم وتتبع التطور الجسدي
            </span>
          </div>
          <small className="text-muted" style={{ fontSize: '0.75rem' }}>
            مشفرة وخاصة بالكابتن فقط
          </small>
        </div>
        <p className="text-muted mb-2" style={{ fontSize: '0.78rem', lineHeight: '1.4' }}>
          يمكنك إرفاق صور لجسمك بملابس رياضية (أمام - جانب - خلف) لمساعدة الكابتن والمحرك في التحديد الدقيق لنسبة الدهون ونقاط القوة والضعف العضلية.
        </p>
        <div className="d-flex align-items-center gap-2">
          <input 
            type="file" 
            id="intake-photo-upload" 
            multiple 
            accept="image/*" 
            className="form-control form-control-sm"
            style={{ maxWidth: '350px' }}
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) {
                updateField('body', 'progressPhotosAvailable', true);
              }
            }}
          />
        </div>
      </div>

      <div className="section-divider"></div>
      <h3 className="section-title">النشاط اليومي وأسلوب الحياة</h3>
      <div className="form-group">
        <label className="form-label">مستوى نشاطك اليومي (خارج الجيم)</label>
        <div className="choices-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {[
            { v: 'SEDENTARY', l: 'خامل (جلوس معظم اليوم)' }, 
            { v: 'LIGHT', l: 'خفيف (مشي قليل)' }, 
            { v: 'MODERATE', l: 'متوسط (حركة مستمرة)' }, 
            { v: 'HIGH', l: 'عالي (عمل بدني)' }, 
            { v: 'VERY_HIGH', l: 'عالي جداً (عمل شاق مستمر)' }
          ].map(l => (
            <div 
              key={l.v} 
              className={`choice-pill ${formData.lifestyle.dailyActivity === l.v ? 'selected' : ''}`} 
              onClick={() => updateField('lifestyle', 'dailyActivity', l.v)}
            >
              <div className="choice-title">{l.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2-col mt-4">
        <div className="form-group">
          <label className="form-label">نوع جدول العمل</label>
          <select 
            className="form-control" 
            value={formData.lifestyle.workSchedule.type} 
            onChange={e => updateNested('lifestyle', 'workSchedule', 'type', e.target.value)}
          >
            <option value="FIXED">ثابت (مواعيد محددة)</option>
            <option value="VARIABLE">متغير أو مرن</option>
            <option value="SHIFT_BASED">نظام شفتات / ورديات</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">مستوى التوتر العام</label>
          <select 
            className="form-control" 
            value={formData.lifestyle.stressLevel} 
            onChange={e => updateField('lifestyle', 'stressLevel', e.target.value)}
          >
            <option value="LOW">منخفض</option>
            <option value="MODERATE">متوسط</option>
            <option value="HIGH">عالي</option>
            <option value="SEVERE">شديد</option>
          </select>
        </div>
      </div>

      <div className="section-divider"></div>
      <h3 className="section-title">النوم والاستشفاء</h3>
      <div className="grid-2-col">
        <div className="form-group">
          <label className="form-label">متوسط ساعات النوم يومياً</label>
          <input 
            type="number" 
            step="0.5" 
            className="form-control" 
            value={formData.lifestyle.sleep.averageHours} 
            onChange={e => updateNested('lifestyle', 'sleep', 'averageHours', Number(e.target.value))} 
          />
        </div>
        <div className="form-group">
          <label className="form-label">جودة النوم</label>
          <select 
            className="form-control" 
            value={formData.lifestyle.sleep.quality} 
            onChange={e => updateNested('lifestyle', 'sleep', 'quality', e.target.value)}
          >
            <option value="POOR">سيئة (أستيقظ متعباً)</option>
            <option value="FAIR">مقبولة</option>
            <option value="GOOD">جيدة (نوم عميق)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
