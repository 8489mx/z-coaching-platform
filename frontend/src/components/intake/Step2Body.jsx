import React from 'react';

export default function Step2Body({
  formData,
  updateField,
  updateNested
}) {
  const isFemale = formData.personal?.sex === 'FEMALE';

  return (
    <div className="step-content">
      {/* 1. Body Measurements */}
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

        {/* Female Hip Circumference for US Navy Formula */}
        {isFemale && (
          <div className="form-group">
            <label className="form-label">
              محيط الأرداف / الحوض (سم) <span className="text-muted fw-normal">(اختياري للإناث)</span>
            </label>
            <input 
              type="number" 
              step="0.5"
              className="form-control" 
              placeholder="مثال: 98"
              value={formData.body?.hipCm || ''} 
              onChange={e => updateField('body', 'hipCm', Number(e.target.value))} 
              style={{ fontWeight: '600' }}
            />
            <small className="text-muted" style={{ fontSize: '0.74rem' }}>
              * يُقاس عند أعرض نقطة في منطقة الحوض لحساب دقيق لنسبة الدهون
            </small>
          </div>
        )}

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

      <div className="section-divider"></div>

      {/* 2. Daily Activity Outside Gym (NEAT Multiplier) */}
      <h3 className="section-title">مستوى النشاط والحركة اليومية خارج الجيم</h3>
      <div className="form-group">
        <label className="form-label">طبيعة حركتك في العمل والدراسة واليوم المعتاد:</label>
        <div className="choices-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {[
            { v: 'SEDENTARY', l: 'خامل (جلوس معظم اليوم أمام الشاشات أو مكتبياً)' }, 
            { v: 'LIGHT', l: 'نشاط خفيف (حركة متفرقة وأعمال خفيفة)' }, 
            { v: 'MODERATE', l: 'نشاط متوسط (مشي وحركة وتواجد على القدمين جزء من اليوم)' }, 
            { v: 'HIGH', l: 'نشاط عالي (عمل بدني شاق أو وقوف مستمر طوال اليوم)' }
          ].map(l => (
            <div 
              key={l.v} 
              className={`choice-pill ${formData.lifestyle?.dailyActivity === l.v ? 'selected' : ''}`} 
              onClick={() => updateField('lifestyle', 'dailyActivity', l.v)}
            >
              <div className="choice-title">{l.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section-divider"></div>

      {/* 3. Optional Progress Photos Upload Box */}
      <div className="p-3.5 my-3 rounded-4 border" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center gap-2">
            <span className="badge rounded-pill fw-bold" style={{ background: '#f5f3ff', color: '#1e144f', border: '1px solid #ddd6fe' }}>
              اختياري
            </span>
            <span className="fw-bold text-dark" style={{ fontSize: '0.92rem' }}>
              رفع صور التقييم الجسدي
            </span>
          </div>
          <small className="text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>
            مشفرة وخاصة بالكابتن فقط
          </small>
        </div>
        <p className="text-muted mb-3" style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>
          يمكنك إرفاق صور لجسمك بملابس رياضية (أمام - جانب - خلف) لمساعدة الكابتن في التدقيق البصري لنسبة الدهون ونقاط القوة العضلية.
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
    </div>
  );
}
