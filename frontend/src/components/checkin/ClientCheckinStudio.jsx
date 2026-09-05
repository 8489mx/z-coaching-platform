import React, { useState } from 'react';
import { Scale, Camera, Upload, Dumbbell, AlertTriangle, Zap, Sliders, CheckCircle2, Activity } from 'lucide-react';
import { evaluateWeeklyBiofeedback } from '../../utils/biofeedbackDecisionEngine';
import { optimizeImageFile } from '../../utils/imageOptimizer';

export default function ClientCheckinStudio({ clientData = {}, onSubmitSuccess }) {
  // 1. Weight & Circumferences State
  const [weight, setWeight] = useState(clientData.weight || '78.5');
  const [waist, setWaist] = useState('82.0');
  const [chest, setChest] = useState('98.0');
  const [arm, setArm] = useState('36.5');
  const [hips, setHips] = useState('102.0');
  const [thigh, setThigh] = useState('58.0');
  const [showAllCircumferences, setShowAllCircumferences] = useState(false);

  // 2. Photos State (Front, Side, Back)
  const [photos, setPhotos] = useState({
    front: null,
    side: null,
    back: null
  });

  // 3. Adherence & Lifestyle
  const [workoutsDone, setWorkoutsDone] = useState(4);
  const [dietAdherence, setDietAdherence] = useState(90);
  const [waterLiters, setWaterLiters] = useState('3.5');
  const [cheatMeals, setCheatMeals] = useState('0');

  // 4. Joint Health
  const [jointPain, setJointPain] = useState('NONE');
  const [painExercise, setPainExercise] = useState('');

  // 5. Biofeedback
  const [hunger, setHunger] = useState(2);
  const [strength, setStrength] = useState('MAINTAINED');
  const [stress, setStress] = useState('MODERATE');
  const [sleep, setSleep] = useState('OPTIMAL');
  const [digestion, setDigestion] = useState('OPTIMAL');
  const [doms, setDoms] = useState('NORMAL');
  const [steps, setSteps] = useState(8000);
  const [pmsActive, setPmsActive] = useState(false);

  // 6. Reflections
  const [nsvNote, setNsvNote] = useState('');
  const [struggleNote, setStruggleNote] = useState('');
  const [coachNotes, setCoachNotes] = useState('');

  // 7. Submission status & Audit Result
  const [submitted, setSubmitted] = useState(false);
  const [auditResult, setAuditResult] = useState(null);

  const handlePhotoUpload = async (view, e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const optimized = await optimizeImageFile(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.82 });
        if (optimized) {
          setPhotos(prev => ({ ...prev, [view]: optimized }));
        }
      } catch (err) {
        console.warn('Error optimizing checkin photo:', err);
      }
    }
  };

  const handleSubmit = () => {
    const payload = {
      weight_change_kg: parseFloat(weight) - (parseFloat(clientData.weight) || 78.5),
      waist_change_cm: parseFloat(waist) - 83.0,
      hunger_level: hunger,
      strength_trend: strength,
      stress_level: stress,
      sleep_level: sleep,
      digestion_status: digestion,
      doms_recovery: doms,
      daily_steps: steps,
      is_pms_week: pmsActive,
      gender: clientData.gender || 'male'
    };

    const evaluation = evaluateWeeklyBiofeedback(payload);
    setAuditResult(evaluation);
    setSubmitted(true);

    if (onSubmitSuccess) {
      onSubmitSuccess({
        metrics: { weight, waist, chest, arm, hips, thigh },
        photos,
        adherence: { workoutsDone, dietAdherence, waterLiters, cheatMeals },
        jointHealth: { jointPain, painExercise },
        biofeedback: payload,
        reflections: { nsvNote, struggleNote, coachNotes },
        evaluation
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* 1. Header Card */}
      <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', borderRadius: '20px', padding: '20px', color: '#FFFFFF', boxShadow: '0 4px 14px rgba(15, 23, 42, 0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity style={{ width: '22px', height: '22px', color: '#38BDF8' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                استوديو المتابعة والتقييم الأسبوعي الشامل
              </h2>
              <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                أسبوع 2 • قياسات الوزن والمحيطات + صور التطور + المؤشرات الحيوية
              </span>
            </div>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: '0.74rem', color: '#CBD5E1', lineHeight: 1.4 }}>
          كافة إجاباتك وصورك تُحلل مباشرة بواسطة المحرك السريري لضبط السعرات والتمارين للأسبوع القادم.
        </p>
      </div>

      {submitted && auditResult ? (
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 style={{ width: '26px', height: '26px', color: '#16A34A', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '0.98rem', color: '#166534', display: 'block' }}>
                تم تسليم تقييم الأسبوع وحفظ الصور والبيانات بنجاح!
              </strong>
              <span style={{ fontSize: '0.76rem', color: '#15803D' }}>
                {auditResult.metabolicDiagnosis}
              </span>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '14px', border: '1px solid #DCFCE7' }}>
            <strong style={{ fontSize: '0.84rem', color: '#0F172A', display: 'block', marginBottom: '8px' }}>
              التعديلات الفسيولوجية الموجهة لخطتك:
            </strong>
            <ul style={{ margin: 0, paddingRight: '18px', fontSize: '0.78rem', color: '#475569', lineHeight: 1.6 }}>
              {auditResult.recommendedActions.map((act, aIdx) => (
                <li key={aIdx}>{act}</li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => setSubmitted(false)}
            style={{ background: '#16A34A', color: '#FFFFFF', border: 'none', borderRadius: '12px', padding: '12px', fontSize: '0.84rem', fontWeight: 800, cursor: 'pointer' }}
          >
            تعديل بيانات التقييم
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* 1. BODY WEIGHT & MEASUREMENTS */}
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '18px', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
              <Scale style={{ width: '18px', height: '18px', color: '#0284C7' }} />
              <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                1. قياسات الوزن والمحيطات (Body Metrics)
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  الوزن الصباحي على الريق (كجم) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="78.5"
                  style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '0.96rem', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', direction: 'ltr', textAlign: 'center', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  محيط الخصر عند السرة (سم) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                  placeholder="82.0"
                  style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '0.96rem', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', direction: 'ltr', textAlign: 'center', outline: 'none' }}
                />
              </div>
            </div>

            {/* Expandable Additional Circumferences */}
            <div>
              <button
                type="button"
                onClick={() => setShowAllCircumferences(!showAllCircumferences)}
                style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '10px', width: '100%', padding: '8px', fontSize: '0.76rem', fontWeight: 700, color: '#0284C7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Sliders style={{ width: '14px', height: '14px' }} />
                <span>{showAllCircumferences ? 'إخفاء محيطات الجسم الإضافية ▲' : 'إضافة محيطات إضافية (الصدر، الذراع، الأرداف، الفخذ) ▼'}</span>
              </button>

              {showAllCircumferences && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px', padding: '12px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748B', fontWeight: 700, marginBottom: '3px' }}>محيط الصدر (سم):</label>
                    <input type="number" step="0.5" value={chest} onChange={(e) => setChest(e.target.value)} style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '0.88rem', fontWeight: 700, textAlign: 'center', fontFamily: 'monospace', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748B', fontWeight: 700, marginBottom: '3px' }}>محيط الذراع (سم):</label>
                    <input type="number" step="0.5" value={arm} onChange={(e) => setArm(e.target.value)} style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '0.88rem', fontWeight: 700, textAlign: 'center', fontFamily: 'monospace', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748B', fontWeight: 700, marginBottom: '3px' }}>محيط الأرداف (سم):</label>
                    <input type="number" step="0.5" value={hips} onChange={(e) => setHips(e.target.value)} style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '0.88rem', fontWeight: 700, textAlign: 'center', fontFamily: 'monospace', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748B', fontWeight: 700, marginBottom: '3px' }}>محيط الفخذ (سم):</label>
                    <input type="number" step="0.5" value={thigh} onChange={(e) => setThigh(e.target.value)} style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '0.88rem', fontWeight: 700, textAlign: 'center', fontFamily: 'monospace', outline: 'none' }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. PROGRESS PHOTOS STUDIO */}
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '18px', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
              <Camera style={{ width: '18px', height: '18px', color: '#8B5CF6' }} />
              <div>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  2. استوديو رفع صور التطور (Progress Photos)
                </h3>
                <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                  صور صباحية على الريق بنفس الإضاءة وزوايا التصوير لمقارنتها بالأسبوع الماضي
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '12px' }}>
              {[
                { view: 'front', label: 'صورة أمامية' },
                { view: 'side', label: 'صورة جانبية' },
                { view: 'back', label: 'صورة خلفية' }
              ].map(p => {
                const photoData = photos[p.view];
                return (
                  <div key={p.view} style={{ border: '1px dashed #CBD5E1', borderRadius: '14px', padding: '10px', textAlign: 'center', background: photoData ? '#F0FDF4' : '#F8FAFC', position: 'relative' }}>
                    {photoData ? (
                      <div>
                        <img src={photoData} alt={p.label} style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px', marginBottom: '6px' }} />
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#166534', display: 'block' }}>{p.label} (تم الرفع)</span>
                        <button
                          type="button"
                          onClick={() => setPhotos(prev => ({ ...prev, [p.view]: null }))}
                          style={{ background: '#FEE2E2', border: 'none', borderRadius: '6px', color: '#DC2626', padding: '3px 6px', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', marginTop: '4px' }}
                        >
                          حذف الصورة
                        </button>
                      </div>
                    ) : (
                      <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '110px', gap: '6px' }}>
                        <Upload style={{ width: '22px', height: '22px', color: '#94A3B8' }} />
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#475569' }}>{p.label}</span>
                        <span style={{ fontSize: '0.64rem', color: '#94A3B8' }}>اضغط للرفع</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(p.view, e)}
                          style={{ display: 'none' }}
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. WORKOUT & NUTRITION ADHERENCE */}
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '18px', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
              <Dumbbell style={{ width: '18px', height: '18px', color: '#059669' }} />
              <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                3. الالتزام بالتمارين والدايت والماء
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  التمارين المنجزة من الجدول:
                </label>
                <select
                  value={workoutsDone}
                  onChange={(e) => setWorkoutsDone(Number(e.target.value))}
                  style={{ width: '100%', height: '40px', borderRadius: '10px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', outline: 'none' }}
                >
                  <option value={4}>4 من 4 (التزام 100%)</option>
                  <option value={3}>3 من 4 (فاتني تمرين)</option>
                  <option value={2}>2 من 4 (تمرينين فقط)</option>
                  <option value={1}>1 من 4 (أسبوع صعب)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  معدل الالتزام بالدايت %:
                </label>
                <select
                  value={dietAdherence}
                  onChange={(e) => setDietAdherence(Number(e.target.value))}
                  style={{ width: '100%', height: '40px', borderRadius: '10px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', outline: 'none' }}
                >
                  <option value={100}>100% بدون أي خروج</option>
                  <option value={90}>90% خروج طفيف محسوب</option>
                  <option value={80}>80% وجبة مفتوحة واحدة</option>
                  <option value={60}>أقل من 70% تخبيص وخروج</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  متوسط شرب الماء اليومي (لتر):
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={waterLiters}
                  onChange={(e) => setWaterLiters(e.target.value)}
                  placeholder="3.5"
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '0.86rem', fontWeight: 800, textAlign: 'center', fontFamily: 'monospace', color: '#0F172A', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  وجبات مفتوحة / سناكات حرة:
                </label>
                <input
                  type="number"
                  value={cheatMeals}
                  onChange={(e) => setCheatMeals(e.target.value)}
                  placeholder="0"
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '0.86rem', fontWeight: 800, textAlign: 'center', fontFamily: 'monospace', color: '#0F172A', outline: 'none' }}
                />
              </div>
            </div>
          </div>

          {/* 4. JOINT PAIN SCREENING */}
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '18px', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
              <AlertTriangle style={{ width: '18px', height: '18px', color: '#EA580C' }} />
              <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                4. فحص آلام المفاصل بعد التمارين (Joint Screening)
              </h3>
            </div>

            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
              هل شعرت بأي وخز أو ألم مفصلي غير طبيعي هذا الأسبوع؟
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '10px' }}>
              {[
                { id: 'NONE', label: 'لا يوجد ألم', bg: '#F0FDF4', color: '#166534' },
                { id: 'LOWER_BACK', label: 'أسفل الظهر', bg: '#FFFBEB', color: '#B45309' },
                { id: 'KNEE', label: 'الركبة', bg: '#FFFBEB', color: '#B45309' },
                { id: 'SHOULDER', label: 'الكتف', bg: '#FFFBEB', color: '#B45309' },
                { id: 'ELBOW', label: 'الكوع / المرفق', bg: '#FFFBEB', color: '#B45309' },
                { id: 'NECK', label: 'الرقبة', bg: '#FFFBEB', color: '#B45309' }
              ].map(jp => (
                <button
                  key={jp.id}
                  type="button"
                  onClick={() => setJointPain(jp.id)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '8px',
                    border: jointPain === jp.id ? '2px solid #0F172A' : '1px solid #E2E8F0',
                    background: jointPain === jp.id ? '#0F172A' : jp.bg,
                    color: jointPain === jp.id ? '#FFFFFF' : jp.color,
                    fontWeight: 800,
                    fontSize: '0.74rem',
                    cursor: 'pointer'
                  }}
                >
                  {jp.label}
                </button>
              ))}
            </div>

            {jointPain !== 'NONE' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#EA580C', fontWeight: 700, marginBottom: '4px' }}>
                  ما هو التمرين أو الحركة التي شعرت معها بالألم؟
                </label>
                <input
                  type="text"
                  value={painExercise}
                  onChange={(e) => setPainExercise(e.target.value)}
                  placeholder="مثلاً: السكوات الحر أو بنش برس بالبار..."
                  style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #FDBA74', padding: '0 10px', fontSize: '0.78rem', color: '#0F172A', outline: 'none' }}
                />
              </div>
            )}
          </div>

          {/* 5. BIOFEEDBACK & METABOLIC GRID */}
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '18px', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
              <Zap style={{ width: '18px', height: '18px', color: '#EAB308' }} />
              <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                5. المؤشرات الحيوية والأيضية (Biofeedback Grid)
              </h3>
            </div>

            {/* Hunger Scale */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                مقياس الجوع والشبع الأسبوعي (Hunger Index):
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                {[
                  { val: 1, label: 'شبع تام', icon: '1' },
                  { val: 2, label: 'طبيعي', icon: '2' },
                  { val: 3, label: 'متوسط', icon: '3' },
                  { val: 4, label: 'عالي', icon: '4' },
                  { val: 5, label: 'قارس', icon: '5' }
                ].map(h => (
                  <button
                    key={h.val}
                    type="button"
                    onClick={() => setHunger(h.val)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: hunger === h.val ? '2px solid #0284C7' : '1px solid #E2E8F0',
                      background: hunger === h.val ? '#F0F9FF' : '#F8FAFC',
                      color: hunger === h.val ? '#0369A1' : '#475569',
                      fontWeight: hunger === h.val ? 800 : 600,
                      fontSize: '0.74rem',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 800, display: 'block', marginBottom: '2px' }}>{h.icon}</span>
                    <span>{h.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Strength Progression */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                أداء القوة والأوزان في التمرين:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {[
                  { id: 'INCREASING', label: 'أوزاني زادت', bg: '#ECFDF5', color: '#059669' },
                  { id: 'MAINTAINED', label: 'أوزاني ثابتة', bg: '#F8FAFC', color: '#475569' },
                  { id: 'DECREASING', label: 'هبوط بالقوة', bg: '#FEF2F2', color: '#DC2626' }
                ].map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStrength(s.id)}
                    style={{
                      padding: '9px 6px',
                      borderRadius: '8px',
                      border: strength === s.id ? '2px solid #0F172A' : '1px solid #E2E8F0',
                      background: strength === s.id ? '#0F172A' : s.bg,
                      color: strength === s.id ? '#FFFFFF' : s.color,
                      fontWeight: 800,
                      fontSize: '0.74rem',
                      cursor: 'pointer'
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stress & Cortisol */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                مستوى التوتر وضغط العمل (Cortisol):
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {[
                  { id: 'LOW', label: 'هادئ ومستقر' },
                  { id: 'MODERATE', label: 'ضغط طبيعي' },
                  { id: 'HIGH', label: 'توتر وسفر عالي' }
                ].map(st => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStress(st.id)}
                    style={{
                      padding: '8px 6px',
                      borderRadius: '8px',
                      border: stress === st.id ? '2px solid #0284C7' : '1px solid #E2E8F0',
                      background: stress === st.id ? '#F0F9FF' : '#F8FAFC',
                      color: stress === st.id ? '#0369A1' : '#475569',
                      fontWeight: stress === st.id ? 800 : 600,
                      fontSize: '0.74rem',
                      cursor: 'pointer'
                    }}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sleep & Gut Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                  جودة النوم:
                </label>
                <select
                  value={sleep}
                  onChange={(e) => setSleep(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '0.76rem', fontWeight: 700, color: '#0F172A', outline: 'none' }}
                >
                  <option value="OPTIMAL">نوم عميق 7 - 8 ساعات</option>
                  <option value="SUB_OPTIMAL">نوم 5 - 6 ساعات</option>
                  <option value="POOR">أقل من 5 ساعات / أرق</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                  صحة الهضم والإخراج:
                </label>
                <select
                  value={digestion}
                  onChange={(e) => setDigestion(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '0.76rem', fontWeight: 700, color: '#0F172A', outline: 'none' }}
                >
                  <option value="OPTIMAL">هضم مريح وإخراج منتظم</option>
                  <option value="BLOATED">انتفاخات وغازات</option>
                  <option value="CONSTIPATED">إمساك أو بطء هضم</option>
                  <option value="ACIDITY">حموضة بالمعدة</option>
                </select>
              </div>
            </div>

            {/* Cardio Protocol Adherence */}
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                مدى الالتزام بجلسات الكارديو المحددة:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {[
                  { val: 10000, label: 'التزام كامل 100%' },
                  { val: 8000, label: 'معظم الجلسات (~80%)' },
                  { val: 4000, label: 'أقل من 50% أو فوتت' }
                ].map(st => (
                  <button
                    key={st.val}
                    type="button"
                    onClick={() => setSteps(st.val)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: steps === st.val ? '2px solid #0284C7' : '1px solid #E2E8F0',
                      background: steps === st.val ? '#F0F9FF' : '#F8FAFC',
                      color: steps === st.val ? '#0369A1' : '#475569',
                      fontWeight: steps === st.val ? 800 : 600,
                      fontSize: '0.74rem',
                      cursor: 'pointer'
                    }}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Female PMS Protection Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: '0.76rem', color: '#475569', fontWeight: 700 }}>
                أسبوع الدورة الشهرية / PMS (لحماية احتباس السوائل)
              </span>
              <input
                type="checkbox"
                checked={pmsActive}
                onChange={(e) => setPmsActive(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* 6. WEEKLY REFLECTIONS & NOTES */}
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '18px', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
              <Activity style={{ width: '18px', height: '18px', color: '#0F172A' }} />
              <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                6. إنجازات وتحديات الأسبوع والملاحظات
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#166534', marginBottom: '4px' }}>
                  أبرز إنجاز حققته هذا الأسبوع (Non-Scale Victory):
                </label>
                <input
                  type="text"
                  value={nsvNote}
                  onChange={(e) => setNsvNote(e.target.value)}
                  placeholder="مثلاً: وسع البنطلون، طاقتي زادت، التزمت بكل الوجبات..."
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '0.78rem', color: '#0F172A', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#92400E', marginBottom: '4px' }}>
                  أكبر صعوبة أو تحدٍ واجهك:
                </label>
                <input
                  type="text"
                  value={struggleNote}
                  onChange={(e) => setStruggleNote(e.target.value)}
                  placeholder="مثلاً: ضغط في العمل، الرغبة في السكريات ليلاً..."
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '0.78rem', color: '#0F172A', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  رسالة أو ملاحظات إضافية للكوتش:
                </label>
                <textarea
                  value={coachNotes}
                  onChange={(e) => setCoachNotes(e.target.value)}
                  placeholder="اكتب هنا أي تفاصيل خاصة أو استفسار تود طرحه على الكابتن..."
                  rows={3}
                  style={{ width: '100%', borderRadius: '10px', border: '1px solid #CBD5E1', padding: '10px', fontSize: '0.78rem', color: '#0F172A', outline: 'none', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          {/* Submit Master Check-in Button */}
          <button
            type="button"
            onClick={handleSubmit}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '16px',
              padding: '16px',
              fontSize: '0.96rem',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(15, 23, 42, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <Zap style={{ width: '18px', height: '18px' }} />
            <span>إرسال التقييم الأسبوعي وتوليد التحليل الأيضي الفوري</span>
          </button>

        </div>
      )}

    </div>
  );
}
