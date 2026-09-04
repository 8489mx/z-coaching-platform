import React from 'react';

export default function SupplementsSection({ supplements }) {
  const list = supplements || [];

  return (
    <div className="z-glass-card mt-4 mb-4 z-animate-in" id="supplements-plan">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2 pb-3 border-bottom" style={{ borderColor: 'rgba(237,233,254,0.6)' }}>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 z-icon-energy" style={{ width: '32px', height: '32px', borderRadius: '9px' }}>
                <i className="ti ti-pill fs-6"></i>
              </div>
              <h5 className="fw-bold text-dark mb-0" style={{ fontSize: '1.05rem' }}>
                بروتوكول المكملات الغذائية والجرعات المعتمدة (Supplements Protocol)
              </h5>
            </div>
            <p className="text-muted small mb-0" style={{ fontSize: '0.78rem' }}>توقيتات تناول المكملات الموصى بها لتعزيز الأداء والاستشفاء العضلي</p>
          </div>
          <span className="badge rounded-pill px-3 py-1 fw-bold" style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', color: '#059669', border: 'none', fontSize: '0.74rem', boxShadow: '0 1px 3px rgba(16,185,129,0.08)' }}>
            معتمد من الكابتن 
          </span>
        </div>

        {list.length === 0 ? (
          <div className="p-4 text-center rounded-3" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
            <p className="text-muted small mb-1 fw-bold">لا توجد مكملات غذائية موصوفة في الخطة الحالية.</p>
            <span className="text-secondary small" style={{ fontSize: '0.75rem' }}>
              خطتك الغذائية مصممة لتغطية 100% من احتياجاتك من السعرات والماكروز والمغذيات الدقيقة عبر الأغذية الطبيعية المتكاملة.
            </span>
          </div>
        ) : (
          <div className="row g-3">
            {list.map((sup, idx) => (
            <div className="col-lg-4 col-md-6" key={idx}>
              <div 
                className="card border h-100 p-3 transition-all" 
                style={{ 
                  background: 'rgba(255,255,255,0.7)', 
                  borderColor: 'rgba(226,232,240,0.8)', 
                  borderRadius: '14px',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}
              >
                <div className="d-flex justify-content-between align-items-start mb-2 gap-2">
                  <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.88rem' }}>{sup.name_ar}</h6>
                  <span className="badge rounded-pill fw-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #E5F0FF, #F0F9FF)', color: '#0284C7', border: '1px solid #BAE6FD', fontSize: '0.68rem' }}>
                    {sup.dosage}
                  </span>
                </div>
                <div className="small text-muted mb-2" style={{ fontSize: '0.76rem' }}>
                  <i className="ti ti-clock me-1" style={{ color: '#0284C7' }}></i> <strong className="text-dark">التوقيت:</strong> {sup.timing}
                </div>
                <div className="small text-muted mb-1" style={{ fontSize: '0.75rem', lineHeight: '1.5' }}>
                  <strong className="text-dark">الهدف:</strong> {sup.purpose}
                </div>
                {sup.instructions && (
                  <div className="small text-muted border-top pt-2 mt-2" style={{ borderColor: '#F0F9FF', fontSize: '0.72rem' }}>
                    <i className="ti ti-info-circle text-primary me-1"></i> {sup.instructions}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
