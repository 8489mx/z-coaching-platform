import React, { useState, useMemo } from 'react';
import { 
  HeartPulse, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  FileText, 
  Upload, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  ShieldCheck, 
  Utensils, 
  Share2, 
  ChevronDown, 
  ChevronRight,
  Info,
  Pill,
  Apple,
  Clock
} from 'lucide-react';
import { 
  BIOMARKER_PANELS, 
  BIOMARKER_CATALOG, 
  calculateHomaIR, 
  evaluateClinicalBiomarkers 
} from '../../utils/clinicalBiomarkerEngine';
import { optimizeImageFile } from '../../utils/imageOptimizer';

export default function LabBiomarkersReviewStudio({
  client = {},
  initialValues = {},
  medicalReportsUrls = [],
  onSave = null,
  onClose = null
}) {
  const isMale = (client.gender || 'MALE').toUpperCase() === 'MALE';

  // 1. حالة سحب العينة: 'FASTING' (صائم 8-12 ساعة) أو 'NON_FASTING' (فاطر / عشوائي)
  const [sampleFastingState, setSampleFastingState] = useState('FASTING');

  // 2. حالة القيم المخبرية المدخلة
  const [labValues, setLabValues] = useState(() => ({
    hemoglobin: initialValues.hemoglobin || '',
    wbc: initialValues.wbc || '',
    platelets: initialValues.platelets || '',
    hematocrit: initialValues.hematocrit || '',
    creatinine: initialValues.creatinine || '',
    egfr: initialValues.egfr || '',
    bun: initialValues.bun || '',
    uric_acid: initialValues.uric_acid || '',
    potassium: initialValues.potassium || '',
    alt: initialValues.alt || '',
    ast: initialValues.ast || '',
    albumin: initialValues.albumin || '',
    total_bilirubin: initialValues.total_bilirubin || '',
    fasting_glucose: initialValues.fasting_glucose || '',
    hba1c: initialValues.hba1c || '',
    fasting_insulin: initialValues.fasting_insulin || '',
    triglycerides: initialValues.triglycerides || '',
    total_cholesterol: initialValues.total_cholesterol || '',
    hdl: initialValues.hdl || '',
    ldl: initialValues.ldl || '',
    vitamin_d: initialValues.vitamin_d || '',
    ferritin: initialValues.ferritin || '',
    vitamin_b12: initialValues.vitamin_b12 || '',
    magnesium: initialValues.magnesium || '',
    creatine_kinase: initialValues.creatine_kinase || '',
    tsh: initialValues.tsh || '',
    ...initialValues
  }));

  // 2. حالة التزام المشترك بالمكملات: 'FULL' أو 'NONE' (بروتوكول الغذاء أولاً)
  const [supplementAdherence, setSupplementAdherence] = useState('NONE'); // الافتراضي هو الغذاء الطبيعي
  const [activePanelTab, setActivePanelTab] = useState('ALL'); // 'ALL' أو معرف المجموعة

  // 3. عارض المستندات المرفوعة (صور / PDF)
  const [reportsList, setReportsList] = useState(() => {
    const list = Array.isArray(medicalReportsUrls) ? [...medicalReportsUrls] : [];
    if (list.length === 0) {
      list.push('/admin-dashboard_data/avtar/profile-img.png'); // صورة افتراضية استرشادية
    }
    return list;
  });
  const [selectedReportIdx, setSelectedReportIdx] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // تحديث قيمة حقل معين
  const handleValueChange = (key, val) => {
    setLabValues(prev => ({ ...prev, [key]: val }));
  };

  // رفع ملف جديد محلياً (صورة مضغوطة فائقة الوضوح أو PDF)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const optimizedUrl = await optimizeImageFile(file, { maxWidth: 1800, maxHeight: 1800, quality: 0.84 });
        if (optimizedUrl) {
          setReportsList(prev => [...prev, optimizedUrl]);
          setSelectedReportIdx(reportsList.length);
        }
      } catch (err) {
        console.warn('Image optimization error:', err);
      }
    }
  };

  // التقييم السريري اللحظي بواسطة المحرك
  const clinicalResult = useMemo(() => {
    return evaluateClinicalBiomarkers({
      values: labValues,
      client,
      supplementAdherence,
      sampleFastingState
    });
  }, [labValues, client, supplementAdherence, sampleFastingState]);

  // حساب HOMA-IR التلقائي للعرض (فقط في حال كانت العينة صائمة)
  const homaIR = useMemo(() => {
    if (sampleFastingState !== 'FASTING') return null;
    return calculateHomaIR(labValues.fasting_glucose, labValues.fasting_insulin);
  }, [labValues.fasting_glucose, labValues.fasting_insulin, sampleFastingState]);

  // حفظ واعتماد
  const handleSaveDecisions = () => {
    if (onSave) {
      onSave({
        labValues,
        clinicalResult,
        supplementAdherence,
        savedAt: new Date().toISOString()
      });
    }
    if (onClose) onClose();
  };

  // مشاركة ملخص التقرير عبر واتساب
  const handleWhatsAppShare = () => {
    const cleanCode = client.client_code || client.code || '101';
    const clientName = client.full_name || client.name || 'المشترك';
    
    const lines = [
      `التقرير السريري للتحاليل المخبرية • منصة Z Coaching`,
      `المشترك: ${clientName} (#${cleanCode})`,
      `نمط الخطة: ${supplementAdherence === 'NONE' ? 'بروتوكول التغذية الحيوية (الغذاء أولاً)' : 'بروتوكول التدعيم المتكامل (تغذية ومكملات)'}`,
      ``,
      `أبرز القرارات والتوصيات المعتمدة:`
    ];

    if (clinicalResult.dietary_modifications.protein_cap_g_per_kg) {
      lines.push(`- سقف البروتين الآمن: ${clinicalResult.dietary_modifications.protein_cap_g_per_kg} جم/كجم.`);
    }
    if (clinicalResult.dietary_modifications.min_fiber_g > 28) {
      lines.push(`- رفع مستهدف الألياف اليومية إلى ${clinicalResult.dietary_modifications.min_fiber_g} جم.`);
    }
    if (clinicalResult.dietary_modifications.withhold_creatine) {
      lines.push(`- حظر مكمل الكرياتين مؤقتاً لحماية وظائف الكلى.`);
    }

    if (clinicalResult.whole_food_interventions.length > 0) {
      lines.push(``, `أهم التدخلات الغذائية الطبيعية اليومية:`);
      clinicalResult.whole_food_interventions.slice(0, 3).forEach(w => {
        lines.push(`• ${w.food_title_ar}`);
      });
    }

    const phone = client.phone_number || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank');
  };

  return (
    <div style={{ background: '#FFFFFF', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '90vh', overflow: 'hidden' }} dir="rtl">
      
      {/* 1. ترويسة الاستوديو */}
      <div style={{ padding: '12px 18px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#0F172A', color: '#C4952D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HeartPulse size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
              استوديو التحاليل والمؤشرات السريرية (Clinical Labs Analyzer)
            </h3>
            <span style={{ fontSize: '11px', color: '#64748B' }}>
              المشترك: <strong>{client.full_name || client.name}</strong> (#{client.client_code || client.code}) • الوزن: {client.weight_kg || 75} كجم
            </span>
          </div>
        </div>

        {/* مفاتيح التبديل: حالة العينة + نمط الخطة */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* محدد حالة العينة */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>سحب العينة:</span>
            <div style={{ display: 'inline-flex', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '2px' }}>
              <button
                type="button"
                onClick={() => setSampleFastingState('FASTING')}
                style={{
                  border: 'none',
                  background: sampleFastingState === 'FASTING' ? '#0F172A' : 'transparent',
                  color: sampleFastingState === 'FASTING' ? '#FFFFFF' : '#64748B',
                  padding: '4px 9px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="عينة مسحوبة بعد صيام 8-12 ساعة (مطلوب لحساب HOMA-IR بدقة)"
              >
                <Clock size={11} />
                <span>صائم (8-12 س)</span>
              </button>

              <button
                type="button"
                onClick={() => setSampleFastingState('NON_FASTING')}
                style={{
                  border: 'none',
                  background: sampleFastingState === 'NON_FASTING' ? '#B45309' : 'transparent',
                  color: sampleFastingState === 'NON_FASTING' ? '#FFFFFF' : '#64748B',
                  padding: '4px 9px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="عينة مسحوبة بعد الأكل أو عشوائية (تعطيل HOMA-IR واعتماد التراكمي)"
              >
                <Activity size={11} />
                <span>فاطر (عشوائي)</span>
              </button>
            </div>
          </div>

          {/* محدد التزام المكملات أو الغذاء أولاً */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>نمط الخطة:</span>
            <div style={{ display: 'inline-flex', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '2px' }}>
              <button
                type="button"
                onClick={() => setSupplementAdherence('NONE')}
                style={{
                  border: 'none',
                  background: supplementAdherence === 'NONE' ? '#16A34A' : 'transparent',
                  color: supplementAdherence === 'NONE' ? '#FFFFFF' : '#475569',
                  padding: '4px 9px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="بروتوكول التغذية الحيوية الكاملة بالاعتماد التام على الأطعمة الطبيعية"
              >
                <Apple size={12} />
                <span>التغذية الحيوية (الغذاء أولاً)</span>
              </button>

              <button
                type="button"
                onClick={() => setSupplementAdherence('FULL')}
                style={{
                  border: 'none',
                  background: supplementAdherence === 'FULL' ? '#0F172A' : 'transparent',
                  color: supplementAdherence === 'FULL' ? '#C4952D' : '#64748B',
                  padding: '4px 9px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="إدراج مكملات غذائية استشفائية موجهة"
              >
                <Pill size={12} />
                <span>بروتوكول التدعيم المتقدم</span>
              </button>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{ width: '28px', height: '28px', border: '1px solid #CBD5E1', background: '#FFFFFF', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 2. جسم الاستوديو المقسم: عارض المستندات يميناً + لوحة الإدخال والقرارات يساراً */}
      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', flex: 1, overflow: 'hidden', background: '#F1F5F9' }}>
        
        {/* الجانب الأيمن: عارض تقرير المعمل (صورة أو PDF) */}
        <div style={{ background: '#0F172A', borderLeft: '1px solid #334155', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          
          {/* شريط أدوات العارض */}
          <div style={{ padding: '8px 12px', background: '#1E293B', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8' }}>
              ورقة التحاليل المرفوعة ({reportsList.length} ملف)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 2.5))}
                style={{ background: '#334155', border: 'none', color: '#FFFFFF', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer' }}
                title="تكبير"
              >
                <ZoomIn size={12} />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.75))}
                style={{ background: '#334155', border: 'none', color: '#FFFFFF', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer' }}
                title="تصغير"
              >
                <ZoomOut size={12} />
              </button>
              <button
                type="button"
                onClick={() => setRotation(prev => (prev + 90) % 360)}
                style={{ background: '#334155', border: 'none', color: '#FFFFFF', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer' }}
                title="تدوير 90 درجة"
              >
                <RotateCw size={12} />
              </button>
              <label style={{ background: '#0284C7', color: '#FFFFFF', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Upload size={11} />
                <span>رفع تقرير</span>
                <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleFileUpload} />
              </label>
            </div>
          </div>

          {/* مساحة عرض الصورة مع التحكم بالزووم والتدوير */}
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', background: '#0B1120' }}>
            {reportsList[selectedReportIdx] ? (
              <div style={{ transform: `scale(${zoomLevel}) rotate(${rotation}deg)`, transition: 'transform 0.15s ease', maxWidth: '100%' }}>
                <img 
                  src={reportsList[selectedReportIdx]} 
                  alt="ورقة التحاليل الطبية" 
                  style={{ maxHeight: '480px', maxWidth: '100%', borderRadius: '4px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', background: '#FFFFFF' }}
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#64748B', fontSize: '11.5px' }}>
                <FileText size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                <span>لم يتم إرفاق ملف تحاليل للمشترك بعد</span>
              </div>
            )}
          </div>

          {/* شريط مصغرات التقارير إن وُجد أكثر من ملف */}
          {reportsList.length > 1 && (
            <div style={{ padding: '6px 10px', background: '#1E293B', display: 'flex', gap: '6px', overflowX: 'auto', borderTop: '1px solid #334155' }}>
              {reportsList.map((rep, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedReportIdx(idx)}
                  style={{
                    border: selectedReportIdx === idx ? '2px solid #C4952D' : '1px solid #475569',
                    borderRadius: '4px',
                    padding: '2px',
                    background: '#0F172A',
                    cursor: 'pointer'
                  }}
                >
                  <img src={rep} alt={`تقرير ${idx + 1}`} style={{ width: '36px', height: '36px', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}

        </div>

        {/* الجانب الأيسر: لوحة إدخال المؤشرات الحيوية وتحليل القرارات السريرية */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', background: '#FFFFFF' }}>
          
          {/* تبويبات الفئات السريرية الست */}
          <div style={{ padding: '8px 14px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: '6px', overflowX: 'auto' }}>
            <button
              type="button"
              onClick={() => setActivePanelTab('ALL')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: activePanelTab === 'ALL' ? '1px solid #0F172A' : '1px solid #CBD5E1',
                background: activePanelTab === 'ALL' ? '#0F172A' : '#FFFFFF',
                color: activePanelTab === 'ALL' ? '#FFFFFF' : '#475569',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              كافة الفحوصات (الكل)
            </button>

            {Object.values(BIOMARKER_PANELS).map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePanelTab(p.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: activePanelTab === p.id ? '1px solid #0F172A' : '1px solid #CBD5E1',
                  background: activePanelTab === p.id ? '#0F172A' : '#FFFFFF',
                  color: activePanelTab === p.id ? '#FFFFFF' : '#475569',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {p.title_ar}
              </button>
            ))}
          </div>

          <div style={{ padding: '14px', flex: 1 }}>
            
            {/* 1. شبكة إدخال المؤشرات الحيوية */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
              {BIOMARKER_CATALOG.filter(item => activePanelTab === 'ALL' || item.panel === activePanelTab).map(metric => {
                const isFastingMetric = metric.key === 'fasting_glucose';
                const displayName = (isFastingMetric && sampleFastingState === 'NON_FASTING')
                  ? 'السكر (عشوائي / بعد الأكل)'
                  : metric.name_ar;
                const val = labValues[metric.key];
                const hasValue = val !== '' && val !== null && val !== undefined;
                const numVal = Number(val);
                const minVal = (isFastingMetric && sampleFastingState === 'NON_FASTING') ? 70 : (isMale ? metric.normal_min_m : metric.normal_min_f);
                const maxVal = (isFastingMetric && sampleFastingState === 'NON_FASTING') ? 140 : (isMale ? metric.normal_max_m : metric.normal_max_f);

                let statusColor = '#CBD5E1'; // رمادي محايد
                if (hasValue && !isNaN(numVal)) {
                  if (numVal < minVal || numVal > maxVal) {
                    statusColor = '#EF4444'; // خارج النطاق الطبيعي (أحمر)
                  } else {
                    statusColor = '#22C55E'; // نطاق طبيعي آمن (أخضر)
                  }
                }

                return (
                  <div 
                    key={metric.key} 
                    style={{ 
                      background: '#F8FAFC', 
                      border: `1.5px solid ${statusColor}`, 
                      borderRadius: '8px', 
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A' }}>
                        {displayName}
                      </span>
                      <span style={{ fontSize: '9.5px', color: '#64748B', fontFamily: 'JetBrains Mono' }}>
                        {minVal} - {maxVal} {metric.unit}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input 
                        type="number" 
                        step="any"
                        value={val || ''}
                        onChange={(e) => handleValueChange(metric.key, e.target.value)}
                        placeholder="سجل القيمة..."
                        style={{
                          width: '100%',
                          padding: '5px 8px',
                          borderRadius: '4px',
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          color: '#0F172A',
                          fontSize: '12px',
                          fontWeight: 700,
                          fontFamily: 'JetBrains Mono, monospace',
                          outline: 'none'
                        }}
                      />
                      <span style={{ fontSize: '10px', color: '#64748B', whiteSpace: 'nowrap' }}>
                        {metric.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* حساب HOMA-IR التلقائي أو تنبيه العينة غير الصائمة */}
            {sampleFastingState === 'NON_FASTING' && (labValues.fasting_glucose || labValues.fasting_insulin) && (
              <div style={{ marginTop: '12px', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={15} color="#B45309" />
                <span style={{ fontSize: '11px', color: '#92400E', fontWeight: 700 }}>
                  تنبيه سريري: تم تعطيل احتساب HOMA-IR نظراً لسحب العينة في وضع غير صائم (فاطر) لمنع القراءات الإيجابية الكاذبة، ويتم الاعتماد على السكر التراكمي (HbA1c) الموثوق كمعيار أيضي رئيسي.
                </span>
              </div>
            )}
            {homaIR && sampleFastingState === 'FASTING' && (
              <div style={{ marginTop: '12px', background: homaIR >= 2.5 ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${homaIR >= 2.5 ? '#FCA5A5' : '#86EFAC'}`, borderRadius: '8px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A' }}>
                  معامل مقاومة الأنسولين المحسوب آلياً (HOMA-IR): <strong style={{ color: homaIR >= 2.5 ? '#DC2626' : '#16A34A', fontFamily: 'JetBrains Mono' }}>{homaIR}</strong>
                </span>
                <span style={{ fontSize: '10.5px', color: homaIR >= 2.5 ? '#B91C1C' : '#15803D', fontWeight: 700 }}>
                  {homaIR >= 2.5 ? 'مؤشر مقاومة أنسولين معتدلة إلى مرتفعة' : 'حساسية أنسولين ممتازة'}
                </span>
              </div>
            )}

            {/* 2. قسم التحليل الإكلينيكي وقرارات المحرك الفورية */}
            <div style={{ marginTop: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} color="#0F172A" />
                  <strong style={{ fontSize: '12.5px', color: '#0F172A' }}>
                    خطة العمل الإكلينيكية والقرارات الفسيولوجية المعتمدة:
                  </strong>
                </div>
                <span style={{ fontSize: '10.5px', background: supplementAdherence === 'NONE' ? '#DCFCE7' : '#F1F5F9', color: supplementAdherence === 'NONE' ? '#166534' : '#0F172A', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                  {supplementAdherence === 'NONE' ? 'بروتوكول الغذاء أولاً' : 'بروتوكول التدعيم المتقدم'}
                </span>
              </div>

              {/* تنبيهات المؤشرات الخارجة عن النطاق */}
              {clinicalResult.flags.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                  {clinicalResult.flags.map((flag, idx) => (
                    <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRight: '4px solid #EF4444', borderRadius: '6px', padding: '6px 10px', fontSize: '11px' }}>
                      <strong style={{ color: '#DC2626', display: 'block', marginBottom: '2px' }}>{flag.title_ar}</strong>
                      <span style={{ color: '#475569' }}>{flag.details_ar}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A', padding: '8px 12px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} />
                  <span>كافة المؤشرات المدخلة تقع ضمن النطاقات الفسيولوجية الطبيعية والآمنة.</span>
                </div>
              )}

              {/* قرارات ضبط التغذية الصارمة (Guardrails) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '8px 10px', borderRadius: '6px', fontSize: '11px' }}>
                  <span style={{ color: '#64748B', display: 'block' }}>سقف البروتين اليومي:</span>
                  <strong style={{ color: '#0F172A', fontFamily: 'JetBrains Mono' }}>
                    {clinicalResult.dietary_modifications.protein_cap_g_per_kg ? `${clinicalResult.dietary_modifications.protein_cap_g_per_kg} جم/كجم` : 'مفتوح حسب الهدف'}
                  </strong>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '8px 10px', borderRadius: '6px', fontSize: '11px' }}>
                  <span style={{ color: '#64748B', display: 'block' }}>مستهدف الألياف اليومي:</span>
                  <strong style={{ color: '#0F172A', fontFamily: 'JetBrains Mono' }}>
                    {clinicalResult.dietary_modifications.min_fiber_g} جم
                  </strong>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '8px 10px', borderRadius: '6px', fontSize: '11px' }}>
                  <span style={{ color: '#64748B', display: 'block' }}>حظر مكمل الكرياتين:</span>
                  <strong style={{ color: clinicalResult.dietary_modifications.withhold_creatine ? '#DC2626' : '#16A34A' }}>
                    {clinicalResult.dietary_modifications.withhold_creatine ? 'محظور لحماية الكلى' : 'مسموح به'}
                  </strong>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '8px 10px', borderRadius: '6px', fontSize: '11px' }}>
                  <span style={{ color: '#64748B', display: 'block' }}>مستهدف الماء اليومي:</span>
                  <strong style={{ color: '#0284C7', fontFamily: 'JetBrains Mono' }}>
                    {clinicalResult.dietary_modifications.daily_water_target_liters} لتر
                  </strong>
                </div>
              </div>

              {/* خطة الغذاء الطبيعي البديلة للمكملات (FOOD-FIRST INTERVENTIONS) */}
              {clinicalResult.whole_food_interventions.length > 0 && (
                <div style={{ background: '#FFFFFF', border: '1.5px solid #86EFAC', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Utensils size={14} color="#16A34A" />
                    <strong style={{ fontSize: '11.5px', color: '#166534' }}>
                      تدخلات الأغذية الطبيعية في الوجبات (Food-First Substitutions):
                    </strong>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {clinicalResult.whole_food_interventions.map((food, idx) => (
                      <div key={idx} style={{ background: '#F0FDF4', padding: '6px 8px', borderRadius: '4px', fontSize: '11px' }}>
                        <strong style={{ color: '#0F172A', display: 'block' }}>• {food.food_title_ar}</strong>
                        <p style={{ margin: '2px 0 0 0', color: '#475569', fontSize: '10.5px' }}>{food.rationale_ar}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* المكملات المقترحة (في حال نمط التدعيم المتقدم) */}
              {supplementAdherence === 'FULL' && clinicalResult.supplement_recommendations.length > 0 && (
                <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Pill size={14} color="#0F172A" />
                      <strong style={{ fontSize: '11.5px', color: '#0F172A' }}>
                        المكملات الغذائية الإضافية (تدعيم سريري موجه):
                      </strong>
                    </div>
                    <span style={{ fontSize: '10px', background: '#F1F5F9', color: '#0F172A', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                      تدعيم سريري موجه
                    </span>
                  </div>
                  <p style={{ fontSize: '10.5px', color: '#64748B', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                    توجيه سريري متقدم: الأولوية المعتمدة للمصادر الغذائية الحيوية، مع توظيف المكمل كعنصر داعم موجه.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {clinicalResult.supplement_recommendations.map((supp, idx) => (
                      <div key={idx} style={{ fontSize: '11px', color: '#334155' }}>
                        <strong>{supp.name_ar}</strong>: {supp.dosage_ar} ({supp.purpose_ar})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* التوصيات والإحالات الطبية المتخصصة (Medical Referrals) */}
              {clinicalResult.medical_referrals.length > 0 && (
                <div style={{ background: '#FEF2F2', border: '1px solid #F87171', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <AlertTriangle size={14} color="#DC2626" />
                    <strong style={{ fontSize: '11.5px', color: '#DC2626' }}>
                      تنبيه وإحالة طبية إلزامية للطبيب المختص:
                    </strong>
                  </div>
                  <ul style={{ margin: 0, paddingRight: '16px', fontSize: '11px', color: '#991B1B' }}>
                    {clinicalResult.medical_referrals.map((refMsg, idx) => (
                      <li key={idx}>{refMsg}</li>
                    ))}
                  </ul>
                  <small style={{ fontSize: '10px', color: '#7F1D1D', display: 'block', marginTop: '4px' }}>
                    * تنويه مهني: يُحظر وصف أي أدوية علاجية؛ ويقتصر دور المنظومة على التكييف الغذائي والرياضي مع إحالة الحالات الحرجة للعيادة المختصة.
                  </small>
                </div>
              )}

            </div>

          </div>

          {/* 3. شريط الإجراءات والاعتماد النهائي */}
          <div style={{ padding: '12px 16px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleWhatsAppShare}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: '1px solid #86EFAC',
                background: '#F0FDF4',
                color: '#16A34A',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Share2 size={13} />
              <span>مشاركة الملخص عبر واتساب</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  إلغاء
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveDecisions}
                style={{
                  padding: '8px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(15,23,42,0.25)'
                }}
              >
                <ShieldCheck size={14} color="#C4952D" />
                <span>اعتماد التقرير وتطبيق التعديلات على الخطة</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
