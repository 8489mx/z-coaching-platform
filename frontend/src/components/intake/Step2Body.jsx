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
            placeholder="مثال: 175"
            value={formData.body?.heightCm || ''} 
            onChange={e => updateField('body', 'heightCm', Number(e.target.value))} 
            style={{ fontWeight: '600' }}
          />
        </div>
        <div className="form-group">
          <label className="form-label">الوزن الحالي (كجم)</label>
          <input 
            type="number" 
            step="0.1"
            className="form-control" 
            placeholder="مثال: 82.5"
            value={formData.body?.weightKg || ''} 
            onChange={e => updateField('body', 'weightKg', Number(e.target.value))} 
            style={{ fontWeight: '600' }}
          />
        </div>
        <div className="form-group">
          <label className="form-label">
            محيط الخصر عند السرة (سم) <span className="text-muted fw-normal">(اختياري)</span>
          </label>
          <input 
            type="number" 
            step="0.5"
            className="form-control" 
            placeholder="مثال: 88"
            value={formData.body?.waistCm || ''} 
            onChange={e => updateField('body', 'waistCm', Number(e.target.value))} 
            style={{ fontWeight: '600' }}
          />
          <small className="text-muted" style={{ fontSize: '0.74rem' }}>
            * يُقاس بشريط قياس (مازورة) حول مستوى السرة تماماً بدون شد أو حبس نفس
          </small>
        </div>
        <div className="form-group">
          <label className="form-label">دقة القياسات المدخلة</label>
          <div className="choices-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div 
              className={`choice-pill ${formData.body?.measurementQuality === 'ACTUAL_MEASURED' || formData.body?.measurementQuality === 'HIGH' ? 'selected' : ''}`} 
              onClick={() => updateField('body', 'measurementQuality', 'ACTUAL_MEASURED')}
            >
              <div className="choice-title">مقاسة فعلياً بميزان وشريط قياس</div>
            </div>
            <div 
              className={`choice-pill ${formData.body?.measurementQuality === 'APPROXIMATE' || formData.body?.measurementQuality === 'LOW' ? 'selected' : ''}`} 
              onClick={() => updateField('body', 'measurementQuality', 'APPROXIMATE')}
            >
              <div className="choice-title">أرقام تقريبية</div>
            </div>
          </div>
        </div>
      </div>

      {/* Weight Trend Last 3 Months */}
      <div className="form-group mt-3">
        <label className="form-label">اتجاه وزنك خلال آخر 3 شهور:</label>
        <div className="choices-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {[
            { v: 'STABLE', l: 'وزني ثابت ومستقر تقريباً' },
            { v: 'LOSING', l: 'وزني في نزول مستمر' },
            { v: 'GAINING', l: 'وزني في زيادة مستمرة' }
          ].map(trend => (
            <div 
              key={trend.v} 
              className={`choice-pill ${formData.body?.weightTrend === trend.v ? 'selected' : ''}`} 
              onClick={() => updateField('body', 'weightTrend', trend.v)}
            >
              <div className="choice-title">{trend.l}</div>
            </div>
          ))}
        </div>

        {(formData.body?.weightTrend === 'LOSING' || formData.body?.weightTrend === 'GAINING') && (
          <div className="p-3 rounded-3 mt-2 bg-light border">
            <label className="form-label text-dark fw-bold mb-1">
              كم كيلو تقريباً {formData.body?.weightTrend === 'LOSING' ? 'نزل وزنك' : 'زاد وزنك'} خلال هذه الفترة؟
            </label>
            <select 
              className="form-control"
              value={formData.body?.weightTrendAmount || '3_TO_5_KG'}
              onChange={e => updateField('body', 'weightTrendAmount', e.target.value)}
              style={{ fontWeight: '600' }}
            >
              <option value="1_TO_2_KG">من 1 إلى 2 كجم (تغير طفيف)</option>
              <option value="3_TO_5_KG">من 3 إلى 5 كجم (تغير ملحوظ)</option>
              <option value="MORE_THAN_5_KG">أكثر من 5 كجم (تغير كبير)</option>
            </select>
          </div>
        )}
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
