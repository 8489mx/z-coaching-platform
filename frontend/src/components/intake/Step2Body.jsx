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
            محيط الرقبة (سم) <span className="text-muted fw-normal">(اختياري لحساب نسبة الدهون)</span>
          </label>
          <input 
            type="number" 
            step="0.5"
            className="form-control" 
            placeholder="مثال: 39"
            value={formData.body?.neckCm || ''} 
            onChange={e => updateField('body', 'neckCm', Number(e.target.value))} 
            style={{ fontWeight: '600' }}
          />
          <small className="text-muted" style={{ fontSize: '0.74rem' }}>
            * يُقاس حول منتصف الرقبة (أسفل تفاحة آدم للرجال)
          </small>
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
          <label className="form-label">
            نسبة الدهون % <span className="text-muted fw-normal">(اختياري إذا قمت بفحص InBody حديث)</span>
          </label>
          <input 
            type="number" 
            step="0.5"
            min="4"
            max="60"
            className="form-control" 
            placeholder="مثال: 18.5"
            value={formData.body?.bodyFat || ''} 
            onChange={e => updateField('body', 'bodyFat', Number(e.target.value))} 
            style={{ fontWeight: '600' }}
          />
          <small className="text-muted" style={{ fontSize: '0.74rem' }}>
            * إذا لم تكن متوفرة، سيحسبها النظام تلقائياً من محيط الرقبة والخصر
          </small>
        </div>

        <div className="form-group">
          <label className="form-label">دقة القياسات المدخلة</label>
          <div className="choices-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div 
              className={`choice-pill ${formData.body?.measurementQuality === 'ACTUAL_MEASURED' || formData.body?.measurementQuality === 'HIGH' ? 'selected' : ''}`} 
              onClick={() => updateField('body', 'measurementQuality', 'ACTUAL_MEASURED')}
            >
              <div className="choice-title">مقاسة فعلياً بميزان ومازورة</div>
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

      {/* 2. Unified Smart NEAT Daily Activity */}
      <h3 className="section-title">النشاط الحركي اليومي ومتوسط الخطوات (Smart NEAT)</h3>
      <div className="form-group mb-3">
        <label className="form-label">طبيعة حركتك ونشاطك اليومي المعتاد خارج أوقات التمرين:</label>
        <div className="choices-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {[
            { 
              v: 'SEDENTARY', 
              t: 'خامل / قليل الحركة', 
              d: 'عمل مكتبي، قيادة سيارة، جلوس معظم اليوم أمام الشاشات (~4,000 - 5,000 خطوة)' 
            }, 
            { 
              v: 'LIGHT', 
              t: 'نشاط خفيف', 
              d: 'حركة متقطعة في المنزل أو العمل، وقوف لبعض الوقت (~6,000 - 7,500 خطوة)' 
            }, 
            { 
              v: 'MODERATE', 
              t: 'نشاط متوسط / حركي', 
              d: 'مشي متكرر، طبيعة عمل تتطلب حركة مستمرة ووقوفاً (~8,000 - 10,000 خطوة)' 
            }, 
            { 
              v: 'HIGH', 
              t: 'نشاط عالي / شاق', 
              d: 'عمل ميداني أو بدني شاق، مجهود متواصل طوال اليوم (~12,000+ خطوة)' 
            }
          ].map(l => (
            <div 
              key={l.v} 
              className={`choice-pill text-start p-3 ${formData.lifestyle?.dailyActivity === l.v ? 'selected' : ''}`} 
              onClick={() => updateField('lifestyle', 'dailyActivity', l.v)}
              style={{ height: 'auto', minHeight: '80px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}
            >
              <div className="choice-title fw-bold mb-1" style={{ fontSize: '0.88rem' }}>{l.t}</div>
              <small className="text-muted" style={{ fontSize: '0.74rem', lineHeight: '1.4' }}>{l.d}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group mb-4">
        <label className="form-label">
          إذا كنت ترتدي ساعة ذكية، يمكنك كتابة متوسط خطواتك اليومية الفعلي بدقة <span className="text-muted fw-normal">(اختياري تماماً)</span>:
        </label>
        <input 
          type="number" 
          step="500" 
          min="1000" 
          max="30000" 
          className="form-control" 
          placeholder="مثال: 8500 (اتركها فارغة للاعتماد على المستوى المختار أعلاه)"
          value={formData.cardio?.averageDailySteps || ''} 
          onChange={e => updateField('cardio', 'averageDailySteps', e.target.value ? Number(e.target.value) : '')} 
          style={{ fontWeight: '600', maxWidth: '400px' }}
        />
      </div>


      <div className="section-divider"></div>

      {/* 3. Optional Progress Photos: 3 Upload Boxes (Front, Side, Back) */}
      <div className="my-3">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center gap-2">
            <span className="badge rounded-pill fw-bold" style={{ background: '#E5F0FF', color: '#1e144f', border: '1px solid #BAE6FD' }}>
              اختياري
            </span>
            <span className="fw-bold text-dark" style={{ fontSize: '1rem' }}>
              صور التقييم الجسدي (3 زوايا)
            </span>
          </div>
          <small className="text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>
            مشفرة وخاصة بالكابتن فقط
          </small>
        </div>
        <p className="text-muted mb-3" style={{ fontSize: '0.82rem', lineHeight: '1.6' }}>
          رفع الصور يساعد الكابتن في الفحص البصري لتوزيع الدهون، استقامة القوام، وتحديد الأولويات العضلية بدقة.
        </p>

        <div className="row g-3">
          {[
            {
              key: 'front',
              title: 'صورة من الأمام (Front)',
              subtitle: 'وقفة مستقيمة بمواجهة الكاميرا واليدين للجانبين',
              icon: 'ti-user'
            },
            {
              key: 'side',
              title: 'صورة من الجانب (Side)',
              subtitle: 'وقفة جانبية لتقييم مظهر البطن واستقامة الظهر',
              icon: 'ti-user-circle'
            },
            {
              key: 'back',
              title: 'صورة من الخلف (Back)',
              subtitle: 'وقفة خلفية لتقييم عضلات الظهر والأكتاف',
              icon: 'ti-user-check'
            }
          ].map((box) => {
            const photoSrc = formData.body?.photos?.[box.key];
            const inputId = `upload-photo-${box.key}`;

            return (
              <div className="col-md-4" key={box.key}>
                <div 
                  className="card h-100 border text-center p-3"
                  style={{
                    borderRadius: '14px',
                    borderColor: photoSrc ? '#10b981' : '#e2e8f0',
                    background: photoSrc ? '#f0fdf4' : '#ffffff',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <input
                    type="file"
                    id={inputId}
                    accept="image/*"
                    className="d-none"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          const currentPhotos = formData.body?.photos || {};
                          const updatedPhotos = { ...currentPhotos, [box.key]: reader.result };
                          updateField('body', 'photos', updatedPhotos);
                          updateField('body', 'progressPhotosAvailable', true);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />

                  {photoSrc ? (
                    <div className="d-flex flex-column align-items-center">
                      <div className="position-relative mb-2" style={{ width: '100%', height: '140px' }}>
                        <img
                          src={photoSrc}
                          alt={box.title}
                          className="rounded-3 shadow-xs"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        <span 
                          className="position-absolute top-0 start-0 m-2 badge bg-success shadow-sm"
                          style={{ fontSize: '0.7rem' }}
                        >
                          <i className="ti ti-check me-1"></i> تم الرفع
                        </span>
                      </div>

                      <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '0.85rem' }}>{box.title}</h6>
                      <div className="d-flex gap-2 mt-2">
                        <label 
                          htmlFor={inputId}
                          className="btn btn-sm btn-outline-primary py-1 px-2"
                          style={{ fontSize: '0.75rem', cursor: 'pointer', borderRadius: '8px' }}
                        >
                          <i className="ti ti-replace me-1"></i> تغيير
                        </label>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger py-1 px-2"
                          style={{ fontSize: '0.75rem', borderRadius: '8px' }}
                          onClick={() => {
                            const currentPhotos = { ...(formData.body?.photos || {}) };
                            delete currentPhotos[box.key];
                            updateField('body', 'photos', currentPhotos);
                            const remaining = Object.values(currentPhotos).filter(Boolean).length;
                            updateField('body', 'progressPhotosAvailable', remaining > 0);
                          }}
                        >
                          <i className="ti ti-trash me-1"></i> حذف
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor={inputId}
                      className="d-flex flex-column align-items-center justify-content-center h-100 py-3"
                      style={{ cursor: 'pointer', minHeight: '160px' }}
                    >
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                        style={{ width: '48px', height: '48px', background: '#f1f5f9', color: '#1e144f' }}
                      >
                        <i className="ti ti-camera" style={{ fontSize: '1.35rem' }}></i>
                      </div>
                      <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '0.88rem' }}>
                        {box.title}
                      </h6>
                      <p className="text-muted mb-2 px-1" style={{ fontSize: '0.72rem', lineHeight: '1.4' }}>
                        {box.subtitle}
                      </p>
                      <span 
                        className="btn btn-sm btn-light border fw-semibold px-3 py-1"
                        style={{ fontSize: '0.75rem', borderRadius: '8px', color: '#1e144f' }}
                      >
                        + اختيار الصورة
                      </span>
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
