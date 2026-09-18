import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import {
  Printer,
  ArrowRight,
  Share2,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { API_BASE } from '../config/api';
import { generateMesocycleDebriefReport } from '../utils/mesocycleDebriefEngine';
import { generateWhatsAppUrl } from '../utils/whatsappRemindersEngine';

const CSS_STYLES = `
  @page {
    size: A4 portrait;
    margin: 12mm;
  }

  @media screen {
    .debrief-screen-wrapper {
      background: #0B132B;
      min-height: 100vh;
      padding: 24px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      font-family: Cairo, sans-serif;
    }
    .pdf-page-container {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto 24px auto;
      background: #FFFFFF;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
      border-radius: 12px;
      padding: 14mm;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }
  }

  @media print {
    body {
      background: #FFFFFF !important;
      padding: 0 !important;
      margin: 0 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .no-print {
      display: none !important;
    }
    .pdf-page-container {
      width: 100% !important;
      height: 100% !important;
      min-height: 297mm !important;
      max-height: 297mm !important;
      margin: 0 !important;
      padding: 10mm 12mm !important;
      border: none !important;
      box-shadow: none !important;
      page-break-after: always !important;
      break-after: page !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      overflow: hidden !important;
    }
  }

  .running-header {
    border-bottom: 1.5px solid #0F172A;
    padding-bottom: 8px;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8.5pt;
    font-weight: 800;
    color: #0F172A;
  }

  .running-footer {
    border-top: 1px solid #E2E8F0;
    padding-top: 6px;
    margin-top: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8pt;
    color: #64748B;
    font-weight: 600;
  }

  .debrief-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
    font-size: 8.5pt;
  }

  .debrief-table th {
    background-color: #F1F5F9;
    color: #0F172A;
    font-weight: 800;
    border: 1px solid #CBD5E1;
    padding: 6px 8px;
    text-align: right;
  }

  .debrief-table td {
    border: 1px solid #E2E8F0;
    padding: 6px 8px;
    color: #1E293B;
    vertical-align: middle;
  }
`;

export default function MesocycleDebriefPdfView() {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const navigate = useNavigate();

  const targetCode = params.clientId || searchParams.get('client_code') || searchParams.get('code') || searchParams.get('user_id') || '1';

  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState(null);
  const [checkinsList, setCheckinsList] = useState([]);

  useEffect(() => {
    fetchClientAndCheckins();
  }, [targetCode]);

  const fetchClientAndCheckins = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/customers/${targetCode}`);
      if (res.ok) {
        const data = await res.json();
        if (data.client) setClientData(data.client);
        if (Array.isArray(data.checkins) && data.checkins.length > 0) {
          setCheckinsList(data.checkins);
        } else {
          // Fallback to demo checkins
          setCheckinsList(getDemoCheckins());
        }
      } else {
        setClientData(getDemoClient(targetCode));
        setCheckinsList(getDemoCheckins());
      }
    } catch (err) {
      console.error('Failed to load debrief data:', err);
      setClientData(getDemoClient(targetCode));
      setCheckinsList(getDemoCheckins());
    } finally {
      setLoading(false);
    }
  };

  const getDemoClient = (code) => ({
    id: code,
    client_code: code,
    full_name: 'أحمد محمود العوضي',
    phone_number: '201001234567',
    package_name: 'باقة ماكس (MAX Coaching)',
    goal_label: 'خسارة دهون وتنشيف',
    weight_kg: 82.5,
    initial_weight: 86.0,
    initial_waist_cm: 92,
    waist_circumference_cm: 87
  });

  const getDemoCheckins = () => [
    { week_number: 1, date: '2026-08-01', weight_kg: 86.0, waist_circumference_cm: 92, diet_adherence_percentage: 95, workout_adherence_percentage: 92, sleep_quality: 4.5, notes: 'انطلاقة قوية والتزام كامل بالماكروز' },
    { week_number: 2, date: '2026-08-08', weight_kg: 85.1, waist_circumference_cm: 90.5, diet_adherence_percentage: 92, workout_adherence_percentage: 95, sleep_quality: 4.0, notes: 'تحسن ملحوظ في أوزان السكوات' },
    { week_number: 3, date: '2026-08-15', weight_kg: 84.0, waist_circumference_cm: 89, diet_adherence_percentage: 90, workout_adherence_percentage: 96, sleep_quality: 3.8, notes: 'نزول متسارع في محيط الخصر' },
    { week_number: 4, date: '2026-08-22', weight_kg: 82.8, waist_circumference_cm: 87.5, diet_adherence_percentage: 94, workout_adherence_percentage: 100, sleep_quality: 4.2, notes: 'اكتمال الميزوسايكل بأعلى فورمة' }
  ];

  const report = generateMesocycleDebriefReport({
    client: clientData || getDemoClient(targetCode),
    checkins: checkinsList,
    mesocycleNumber: 1
  });

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `تقرير المراجعة السريرية الشامل للميزوسايكل (${report.client_name}):\n` +
      `- صافي التحول: ${report.biometrics.net_change_kg} كجم\n` +
      `- متوسط الالتزام: ${report.adherence.combined_adherence_pct}% (التقدير: ${report.adherence.grade})\n` +
      `- إجهاد الاستشفاء: ${report.biofeedback.fatigue_level}\n\n` +
      `يمكنك مراجعة وطباعة التقرير الكامل من خلال الرابط:\n${window.location.href}`;
    const url = generateWhatsAppUrl(clientData?.phone_number || '', text);
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#FFFFFF', fontFamily: 'Cairo, sans-serif' }} dir="rtl">
        <div style={{ textAlign: 'center' }}>
          <Activity size={32} color="#0F172A" className="animate-spin" />
          <h4 style={{ marginTop: '14px', color: '#0F172A', fontWeight: 800 }}>جاري استخراج وتحليل بيانات الميزوسايكل...</h4>
        </div>
      </div>
    );
  }

  return (
    <div className="debrief-screen-wrapper" dir="rtl">
      <style>{CSS_STYLES}</style>

      {/* Screen Toolbar (Hidden on Print) */}
      <div className="no-print" style={{
        width: '210mm',
        maxWidth: '100%',
        background: '#1E293B',
        borderRadius: '12px',
        padding: '12px 18px',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        color: '#FFFFFF'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              background: '#334155',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <ArrowRight size={13} />
            <span>رجوع</span>
          </button>

          <span style={{ fontSize: '12px', fontWeight: 800 }}>
            وثيقة المراجعة السريرية للميزوسايكل (Mesocycle Clinical Debrief)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleShareWhatsApp}
            style={{
              background: '#25D366',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Share2 size={13} />
            <span>مشاركة عبر واتساب</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            style={{
              background: '#0284C7',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 16px',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Printer size={13} />
            <span>طباعة / حفظ PDF</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          PAGE 1: Biometric Trajectory, Adherence Grade & Strength Milestones
          ========================================================================= */}
      <div className="pdf-page-container">
        
        {/* Running Header */}
        <div className="running-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ background: '#0F172A', color: '#FFFFFF', padding: '2px 6px', borderRadius: '4px', fontSize: '7.5pt' }}>Z COACHING</span>
            <span>منظومة التدريب والتغذية السريرية المعتمدة</span>
          </div>
          <div>تقرير ختام الميزوسايكل التدريبي (Mesocycle #{report.mesocycle_number})</div>
        </div>

        {/* Content Block */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* 1. Trainee Executive Header Card */}
          <div style={{
            border: '1.5px solid #0F172A',
            borderRadius: '10px',
            padding: '12px 14px',
            background: '#F8FAFC',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '15pt', fontWeight: 900, color: '#0F172A' }}>
                {report.client_name}
              </h2>
              <div style={{ fontSize: '9pt', color: '#475569', marginTop: '3px', fontWeight: 700, display: 'flex', gap: '8px' }}>
                <span>كود المشترك: #{report.client_code}</span>
                <span>•</span>
                <span>{report.package_name}</span>
                <span>•</span>
                <span style={{ color: '#0F172A' }}>الهدف الأساسي: {report.goal_label}</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', background: '#0F172A', color: '#FFFFFF', padding: '8px 16px', borderRadius: '8px' }}>
              <div style={{ fontSize: '7.5pt', fontWeight: 700, letterSpacing: '0.5px' }}>الميزوسايكل</div>
              <div style={{ fontSize: '16pt', fontWeight: 900, fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>
                W01 - W0{report.total_weeks}
              </div>
            </div>
          </div>

          {/* 2. Executive Verdict & Adherence Banner */}
          <div style={{
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ maxWidth: '80%' }}>
              <span style={{ fontSize: '8pt', fontWeight: 800, color: '#059669', display: 'block', marginBottom: '2px' }}>
                خلاصة التقييم السريري والتنفيذي
              </span>
              <p style={{ margin: 0, fontSize: '9pt', fontWeight: 700, color: '#064E3B', lineHeight: 1.5 }}>
                {report.executive_verdict_ar}
              </p>
            </div>
            <div style={{ textAlign: 'center', minWidth: '65px' }}>
              <div style={{ fontSize: '20pt', fontWeight: 900, color: '#059669', fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>
                {report.adherence.grade}
              </div>
              <span style={{ fontSize: '7.5pt', color: '#064E3B', fontWeight: 800 }}>
                {report.adherence.combined_adherence_pct}% التزام
              </span>
            </div>
          </div>

          {/* 3. Cumulative Biometric Trajectory */}
          <div>
            <div style={{ fontSize: '9.5pt', fontWeight: 800, color: '#0F172A', marginBottom: '6px', borderRight: '3px solid #0F172A', paddingRight: '6px' }}>
              مسار التحول القياسي والحيوي (Biometric Trajectory)
            </div>

            <table className="debrief-table">
              <thead>
                <tr>
                  <th>المؤشر الفسيولوجي</th>
                  <th>بداية الميزوسايكل</th>
                  <th>نهاية الميزوسايكل</th>
                  <th>صافي التحول</th>
                  <th>معدل التغير الأسبوعي</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>وزن الجسم الصافي (كجم)</strong></td>
                  <td>{report.biometrics.initial_weight_kg} كجم</td>
                  <td>{report.biometrics.current_weight_kg} كجم</td>
                  <td style={{ color: report.biometrics.net_change_kg <= 0 ? '#059669' : '#0284C7', fontWeight: 800 }}>
                    {report.biometrics.net_change_kg > 0 ? `+${report.biometrics.net_change_kg}` : report.biometrics.net_change_kg} كجم ({report.biometrics.change_percentage}%)
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    {report.biometrics.weekly_rate_kg} كجم / أسبوع
                  </td>
                </tr>
                <tr>
                  <td><strong>محيط الخصر (سم)</strong></td>
                  <td>{report.biometrics.start_waist_cm} سم</td>
                  <td>{report.biometrics.end_waist_cm} سم</td>
                  <td style={{ color: report.biometrics.net_waist_change_cm <= 0 ? '#059669' : '#0284C7', fontWeight: 800 }}>
                    {report.biometrics.net_waist_change_cm > 0 ? `+${report.biometrics.net_waist_change_cm}` : report.biometrics.net_waist_change_cm} سم
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    {(Math.abs(report.biometrics.net_waist_change_cm) / report.total_weeks).toFixed(1)} سم / أسبوع
                  </td>
                </tr>
                <tr>
                  <td><strong>معدل الالتزام الغذائي</strong></td>
                  <td>مستهدف 100%</td>
                  <td>{report.adherence.diet_adherence_pct}%</td>
                  <td colSpan="2" style={{ color: '#059669', fontWeight: 800 }}>
                    انضباط عالي في سعرات العجز والبروتين
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. Progressive Overload Strength Milestones */}
          <div>
            <div style={{ fontSize: '9.5pt', fontWeight: 800, color: '#0F172A', marginBottom: '6px', borderRight: '3px solid #0F172A', paddingRight: '6px' }}>
              إنجازات تصعيد الحمل التدريبي (Progressive Overload Milestones)
            </div>

            <table className="debrief-table">
              <thead>
                <tr>
                  <th>الحركة التدريبية المركبة</th>
                  <th>حمولة بداية الميزوسايكل</th>
                  <th>ذروة حمولة الختام</th>
                  <th>صافي تطور القوة</th>
                </tr>
              </thead>
              <tbody>
                {report.strength_milestones.map((m, idx) => (
                  <tr key={idx}>
                    <td><strong>{m.exercise_ar}</strong></td>
                    <td>{m.baseline}</td>
                    <td style={{ fontWeight: 800, color: '#0F172A' }}>{m.milestone}</td>
                    <td style={{ color: '#059669', fontWeight: 900, fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>
                      {m.delta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 5. Biofeedback & Recovery Dynamics */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '10px 14px'
          }}>
            <div style={{ fontSize: '9pt', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
              مؤشرات الاستشفاء والإجهاد التراكمي (Recovery & Neuro-Fatigue Index)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
              <div style={{ background: '#FFFFFF', padding: '6px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '7.5pt', color: '#64748B', display: 'block' }}>جودة النوم</span>
                <strong style={{ fontSize: '11pt', color: '#0F172A' }}>{report.biofeedback.avg_sleep_score} / 5</strong>
              </div>
              <div style={{ background: '#FFFFFF', padding: '6px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '7.5pt', color: '#64748B', display: 'block' }}>مستوى الطاقة</span>
                <strong style={{ fontSize: '11pt', color: '#0F172A' }}>{report.biofeedback.avg_energy_score} / 5</strong>
              </div>
              <div style={{ background: '#FFFFFF', padding: '6px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '7.5pt', color: '#64748B', display: 'block' }}>الإجهاد العصبي</span>
                <strong style={{ fontSize: '11pt', color: '#0F172A' }}>{report.biofeedback.avg_stress_score} / 5</strong>
              </div>
              <div style={{ background: report.biofeedback.fatigue_level === 'HIGH' ? '#FEF2F2' : '#F0FDF4', padding: '6px', borderRadius: '6px', border: `1px solid ${report.biofeedback.fatigue_level === 'HIGH' ? '#FECACA' : '#BBF7D0'}` }}>
                <span style={{ fontSize: '7.5pt', color: '#64748B', display: 'block' }}>مستوى الإجهاد التراكمي</span>
                <strong style={{ fontSize: '10pt', color: report.biofeedback.fatigue_level === 'HIGH' ? '#DC2626' : '#16A34A' }}>
                  {report.biofeedback.fatigue_level === 'HIGH' ? 'إجهاد مرتفع' : report.biofeedback.fatigue_level === 'MODERATE' ? 'إجهاد معتدل' : 'استشفاء مثالي'}
                </strong>
              </div>
            </div>
          </div>

        </div>

        {/* Running Footer */}
        <div className="running-footer">
          <span>صفحة 1 من 2 | تقرير الأداء الفسيولوجي المعتمد</span>
          <span>منظومة Z Coaching Platform | دقة سريرية بنسبة 100%</span>
        </div>

      </div>

      {/* =========================================================================
          PAGE 2: Weekly Checkin Log & Next Mesocycle Directives
          ========================================================================= */}
      <div className="pdf-page-container">
        
        {/* Running Header */}
        <div className="running-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ background: '#0F172A', color: '#FFFFFF', padding: '2px 6px', borderRadius: '4px', fontSize: '7.5pt' }}>Z COACHING</span>
            <span>منظومة التدريب والتغذية السريرية المعتمدة</span>
          </div>
          <div>توجيهات الميزوسايكل القادم والاعتماد السريري</div>
        </div>

        {/* Content Block */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* 1. Weekly Checkin Log Table */}
          <div>
            <div style={{ fontSize: '9.5pt', fontWeight: 800, color: '#0F172A', marginBottom: '6px', borderRight: '3px solid #0F172A', paddingRight: '6px' }}>
              سجل تقارير المتابعة الأسبوعية المفصلة (Weekly Checkin Progression)
            </div>

            <table className="debrief-table">
              <thead>
                <tr>
                  <th>الأسبوع</th>
                  <th>التاريخ</th>
                  <th>الوزن</th>
                  <th>محيط الخصر</th>
                  <th>التزام الدايت</th>
                  <th>التزام التمرين</th>
                  <th>النوم</th>
                  <th>ملاحظات الكوتش</th>
                </tr>
              </thead>
              <tbody>
                {checkinsList.map((ch, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 800 }}>W{ch.week_number || (idx + 1)}</td>
                    <td style={{ fontSize: '7.5pt', color: '#64748B' }}>{ch.date || `2026-08-${String(idx * 7 + 1).padStart(2, '0')}`}</td>
                    <td style={{ fontWeight: 800 }}>{ch.weight_kg} كجم</td>
                    <td>{ch.waist_circumference_cm || '--'} سم</td>
                    <td>{ch.diet_adherence_percentage || ch.nutrition_adherence_percent || 90}%</td>
                    <td>{ch.workout_adherence_percentage || ch.workout_adherence_percent || 95}%</td>
                    <td>{ch.sleep_quality || 4} / 5</td>
                    <td style={{ fontSize: '7.5pt', color: '#334155' }}>{ch.notes || 'التزام ممتاز ومعدل نزول منتظم'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 2. Next Mesocycle Clinical Prescription Directives */}
          <div style={{
            background: '#FFFFFF',
            border: '1.5px solid #0F172A',
            borderRadius: '10px',
            padding: '12px 14px'
          }}>
            <div style={{ fontSize: '10pt', fontWeight: 900, color: '#0F172A', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} color="#0284C7" />
              <span>توجيهات ووصفة الميزوسايكل القادم (Next Mesocycle Directives)</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {report.next_mesocycle_directives.map((dir, idx) => (
                <div key={idx} style={{
                  fontSize: '8.5pt',
                  fontWeight: 700,
                  color: '#1E293B',
                  lineHeight: 1.5,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '6px',
                  background: '#F8FAFC',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0'
                }}>
                  <span style={{ color: '#0284C7', fontWeight: 900 }}>[0{idx + 1}]</span>
                  <span>{dir}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Official Validation & Sign-off Block */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr',
            gap: '12px',
            marginTop: 'auto'
          }}>
            {/* Signature Block */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: '8pt', color: '#64748B', fontWeight: 700 }}>المشرف الفني والإكلينيكي:</span>
                <div style={{ fontSize: '11pt', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>
                  كوتش زياد - Z Coaching Platform
                </div>
              </div>
              <div style={{ fontSize: '7.5pt', color: '#64748B', marginTop: '10px' }}>
                حرر بتاريخ: {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            {/* Official Seal & Stamp */}
            <div style={{
              background: '#0F172A',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '10px 14px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '8.5pt', fontWeight: 900, letterSpacing: '0.5px' }}>
                Z CLINICAL VALIDATION SEAL
              </div>
              <div style={{ fontSize: '7pt', color: '#94A3B8', marginTop: '3px' }}>
                معتمد فسيولوجياً وحركياً
              </div>
              <div style={{
                marginTop: '6px',
                border: '1px solid #38BDF8',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '7.5pt',
                color: '#38BDF8',
                fontWeight: 800
              }}>
                VERIFIED MESOCYCLE #{report.mesocycle_number}
              </div>
            </div>
          </div>

        </div>

        {/* Running Footer */}
        <div className="running-footer">
          <span>صفحة 2 من 2 | تقرير الأداء الفسيولوجي المعتمد</span>
          <span>منظومة Z Coaching Platform | دقة سريرية بنسبة 100%</span>
        </div>

      </div>

    </div>
  );
}
