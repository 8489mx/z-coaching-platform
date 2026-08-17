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
    dosage: "1 مكيال (سكوب 25-30 جم بروتين)",
    timing: "بعد التمرين أو كوجبة خفيفة سريعة لتغطية الاحتياج اليومي",
    purpose: "تغطية الاحتياج اليومي من البروتين عالي الجودة وسريع الامتصاص وتفعيل تخليق البروتين العضلي (MPS).",
    instructions: "يُمزج مع 250-300 مل ماء بارد."
  },
  {
    name_ar: "أوميجا 3 عالي التركيز (Omega-3 Fish Oil)",
    dosage: "1000 - 2000 مجم (EPA + DHA)",
    timing: "مع وجبة تحتوي على دهون صحية (مثل الإفطار أو الغداء)",
    purpose: "تقليل الالتهابات المفصلية، دعم صحة القلب والأوعية الدموية، وتحسين حساسية الإنسولين.",
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
    <div className="card border-0 shadow-sm bg-white mt-4 mb-4" style={{ borderRadius: "16px" }} id="supplements-plan">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h5 className="fw-bold text-dark mb-1">
              <i className="ti ti-pill text-primary me-2"></i> بروتوكول المكملات الغذائية والجرعات المعتمدة (Supplements Protocol)
            </h5>
            <p className="text-muted small mb-0">توقيتات تناول المكملات الموصى بها لتعزيز الأداء والاستشفاء العضلي</p>
          </div>
          <span className="badge bg-success-subtle text-success px-3 py-2 rounded-pill fw-bold">
            معتمد من الكابتن
          </span>
        </div>

        <div className="row g-3">
          {list.map((sup, idx) => (
            <div className="col-lg-4 col-md-6" key={idx}>
              <div className="card border h-100 rounded-3 p-3 shadow-none bg-light">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="fw-bold text-dark mb-0">{sup.name_ar}</h6>
                  <span className="badge bg-primary text-white fw-bold">{sup.dosage}</span>
                </div>
                <div className="small text-muted mb-2">
                  <i className="ti ti-clock text-primary me-1"></i> <strong className="text-dark">التوقيت:</strong> {sup.timing}
                </div>
                <div className="small text-muted mb-1">
                  <strong className="text-dark">الهدف:</strong> {sup.purpose}
                </div>
                {sup.instructions && (
                  <div className="small text-muted border-top pt-2 mt-2">
                    <i className="ti ti-info-circle text-info me-1"></i> {sup.instructions}
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
