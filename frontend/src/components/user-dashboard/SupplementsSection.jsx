import React from 'react';

const DEFAULT_SUPPLEMENTS = [
  {
    name_ar: "كرياتين مونوهايدرات (Creatine Monohydrate)",
    dosage: "5 جرام يومياً",
    timing: "يومياً بعد التمرين مباشرة مع ماء أو عصير",
    purpose: "زيادة القوة الانفجارية، تسريع الاستشفاء العضلي، وتحسين الحجم المائي داخل الخلايا.",
    instructions: "لا حاجة لفترة تحميل (Loading Phase). الاستمرار اليومي المنتظم هو الأساس."
  },
  {
    name_ar: "واي بروتين (Whey Protein)",
    dosage: "1 مكيال (30 جم بروتين)",
    timing: "بعد التمرين أو كوجبة خفيفة سريعة لتغطية الاحتياج اليومي",
    purpose: "تغطية الاحتياج اليومي من البروتين عالي الجودة وتفعيل تخليق البروتين العضلي (MPS).",
    instructions: "يُمزج مع 250-300 مل ماء بارد."
  },
  {
    name_ar: "أوميجا 3 عالي التركيز (Omega-3 Fish Oil)",
    dosage: "1000 - 2000 مجم (EPA + DHA)",
    timing: "مع وجبة تحتوي على دهون صحية (مثل الإفطار أو الغداء)",
    purpose: "تقليل الالتهابات المفصلية، دعم صحة القلب، وتحسين حساسية الإنسولين.",
    instructions: "يُفضل حفظ العبوة في مكان بارد ومظلم."
  },
  {
    name_ar: "فيتامين D3 + K2",
    dosage: "5000 IU يومياً",
    timing: "صباحاً مع أول وجبة تحتوي على دهون",
    purpose: "دعم صحة العظام، رفع كفاءة الجهاز المناعي، ودعم مستويات التستوستيرون الطبيعية.",
    instructions: "فيتامين يذوب في الدهون، لذا تناوله مع وجبة الإفطار ضروري للامتصاص."
  },
  {
    name_ar: "ماغنيسيوم جلايسينات (Magnesium)",
    dosage: "200 - 400 مجم",
    timing: "قبل النوم بـ 30 - 45 دقيقة",
    purpose: "استرخاء الجهاز العصبي، تحسين جودة النوم العميق، ومنع التقلصات العضلية الليلية.",
    instructions: "تجنب تناوله مع منتجات غنية بالكالسيوم في نفس اللحظة."
  }
];

export default function SupplementsSection({ supplements }) {
  const list = supplements || DEFAULT_SUPPLEMENTS;

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
            معتمد من الكابتن ✓
          </span>
        </div>

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
                  <span className="badge rounded-pill fw-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.68rem' }}>
                    {sup.dosage}
                  </span>
                </div>
                <div className="small text-muted mb-2" style={{ fontSize: '0.76rem' }}>
                  <i className="ti ti-clock me-1" style={{ color: '#261c6a' }}></i> <strong className="text-dark">التوقيت:</strong> {sup.timing}
                </div>
                <div className="small text-muted mb-1" style={{ fontSize: '0.75rem', lineHeight: '1.5' }}>
                  <strong className="text-dark">الهدف:</strong> {sup.purpose}
                </div>
                {sup.instructions && (
                  <div className="small text-muted border-top pt-2 mt-2" style={{ borderColor: '#ede9fe', fontSize: '0.72rem' }}>
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
