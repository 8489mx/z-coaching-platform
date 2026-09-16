import React, { useState } from 'react';
import { Zap, ArrowRightLeft, FileText, ShieldAlert, ShieldCheck, AlertTriangle, Plus, Trash2, Pill } from 'lucide-react';
import { evaluateClinicalSupplementSafety, getStandardSupplementCatalog } from '../../../utils/clinicalSupplementSafetyEngine';

export function CoachCardioHabitsTab({
  program,
  setCardioSwapModal,
  handleUpdateCardioParam,
  handleUpdateSupplementsInCardio,
  coachNotes,
  setCoachNotes
}) {
  const [selectedCatalogSupp, setSelectedCatalogSupp] = useState('CREATINE');

  const clientConditions = [
    ...(Array.isArray(program?.client?.injuries) ? program.client.injuries : []),
    ...(Array.isArray(program?.client?.allergies) ? program.client.allergies : []),
    ...(Array.isArray(program?.client?.medical_conditions) ? program.client.medical_conditions : []),
  ];

  const clientMeds = [
    ...(Array.isArray(program?.client?.medications) ? program.client.medications : []),
    ...(Array.isArray(program?.client?.current_meds_supplements_list) ? program.client.current_meds_supplements_list : [])
  ];

  const clientBiomarkers = program?.client?.biomarkers || program?.client?.lab_markers || {};

  const hasAsthma = Boolean(
    clientConditions.some(c => {
      const s = typeof c === 'string' ? c : (c?.conditionCode || c?.name || c?.area || '');
      return /asthma|ربو|تنفسي|respiratory/i.test(s);
    })
  );

  const modality = String(program?.cardio?.modality || '');
  const zone = String(program?.cardio?.target_heart_rate_zone || '');
  const isHiitCardio = /hiit|sprint|كثافة عالية/i.test(modality) || /hiit|zone 4/i.test(zone);

  // Active supplements array
  const currentSupplements = Array.isArray(program?.cardio?.supplements) ? program.cardio.supplements : [];
  
  // Real-time clinical safety assessment
  const safetyAudit = evaluateClinicalSupplementSafety({
    supplements: currentSupplements,
    medicalConditions: clientConditions,
    activeMedications: clientMeds,
    biomarkers: clientBiomarkers,
    weightKg: program?.client?.weight || 75
  });

  const supplementCatalog = getStandardSupplementCatalog();

  const handleAddSupplement = () => {
    if (!selectedCatalogSupp) return;
    const catItem = supplementCatalog.find(c => c.code === selectedCatalogSupp);
    if (!catItem) return;

    // Avoid duplicates
    if (currentSupplements.some(s => (s.code || s.name || s) === catItem.code)) return;

    const newSuppItem = {
      code: catItem.code,
      name: catItem.name_ar,
      dosage: catItem.standard_dosage,
      category: catItem.category
    };

    const updated = [...currentSupplements, newSuppItem];
    if (typeof handleUpdateSupplementsInCardio === 'function') {
      handleUpdateSupplementsInCardio(updated);
    } else {
      handleUpdateCardioParam('supplements', updated);
    }
  };

  const handleRemoveSupplement = (suppCode) => {
    const updated = currentSupplements.filter(s => (s.code || s.name || s) !== suppCode);
    if (typeof handleUpdateSupplementsInCardio === 'function') {
      handleUpdateSupplementsInCardio(updated);
    } else {
      handleUpdateCardioParam('supplements', updated);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} dir="rtl">
      
      {/* Asthma & Respiratory GINA Guardrail Banner */}
      {hasAsthma && (
        <div style={{
          background: isHiitCardio ? '#FEF2F2' : '#F0FDF4',
          border: isHiitCardio ? '1.5px solid #F87171' : '1px solid #BBF7D0',
          borderRadius: '12px',
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          boxShadow: isHiitCardio ? '0 3px 10px rgba(239, 68, 68, 0.12)' : 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: isHiitCardio ? '#FEE2E2' : '#DCFCE7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isHiitCardio ? '#DC2626' : '#166534',
              flexShrink: 0
            }}>
              <ShieldAlert size={18} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: isHiitCardio ? '#991B1B' : '#166534' }}>
                {isHiitCardio
                  ? 'تحذير سريري: نمط الكارديو المختار (HIIT) غير آمن لمرضى الربو والجهاز التنفسي'
                  : 'حماية سريرية نشطة لمرضى الربو والجهاز التنفسي (GINA Protocol - Zone 2 LISS)'}
              </div>
              <div style={{ fontSize: '11px', color: isHiitCardio ? '#B91C1C' : '#15803D', marginTop: '2px' }}>
                {isHiitCardio
                  ? 'تمارين الـ HIIT تسبب فرط تهوية مستمر وجفاف المجرى الهوائي مما يحفز نوبات تضيق القصبات (EIB). الموصى به: Zone 2.'
                  : 'تم تقييد الكارديو في النطاق الهوائي المعتدل مع اختبار التحدث لضمان استقرار الشعب الهوائية.'}
              </div>
            </div>
          </div>
          {isHiitCardio && (
            <span style={{ fontSize: '10.5px', fontWeight: 800, background: '#DC2626', color: '#FFFFFF', padding: '4px 10px', borderRadius: '8px', whiteSpace: 'nowrap' }}>
              مطلوب مراجعة المدرب
            </span>
          )}
        </div>
      )}

      {/* Engine Cardio & Recovery Reasoning Card */}
      {program.cardio?.reasoning && (
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#FAF5FF', border: '1px solid #E9D5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333EA', flexShrink: 0 }}>
              <Zap size={14} />
            </div>
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A' }}>بروتوكول الكارديو والاستشفاء ونمط الحياة</div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px' }}>
                {typeof program.cardio.reasoning === 'string' ? program.cardio.reasoning : (program.cardio.reasoning?.rationale || 'بروتوكول كارديو Zone 2 لحرق الدهون وتحسين صحة القلب بدون إجهاد للمفاصل.')}
              </div>
            </div>
          </div>
          {program.cardio?.target_heart_rate_zone && (
            <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', whiteSpace: 'nowrap' }}>
              {program.cardio.target_heart_rate_zone}
            </span>
          )}
        </div>
      )}

      {/* Cardio Modality Card */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <strong style={{ fontSize: '13px', color: '#0F172A' }}>نظام وجهاز الكارديو:</strong>
          <button
            type="button"
            onClick={() => setCardioSwapModal(true)}
            style={{ padding: '6px 14px', borderRadius: '8px', background: '#0F172A', color: '#FFFFFF', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <ArrowRightLeft size={12} />
            <span>تبديل الجهاز / النمط</span>
          </button>
        </div>

        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <strong style={{ color: '#0F172A', fontSize: '12.5px' }}>{program.cardio?.modality || 'مشي على سير مائل (Incline Treadmill)'}</strong>
          
          {/* Cardio Volume Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', paddingTop: '6px', borderTop: '1px solid #E2E8F0' }}>
            <div>
              <label style={{ fontSize: '10.5px', color: '#64748B', display: 'block', marginBottom: '2px', fontWeight: 600 }}>الجلسات أسبوعياً</label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', height: '30px', padding: '0 4px' }}>
                <button type="button" onClick={() => handleUpdateCardioParam('weekly_sessions', Math.max(1, (Number(program.cardio?.weekly_sessions) || 3) - 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, padding: '0 6px' }}>-</button>
                <span style={{ flex: 1, textAlign: 'center', fontSize: '11.5px', fontWeight: 700, color: '#0F172A' }}>{program.cardio?.weekly_sessions || 3} جلسات</span>
                <button type="button" onClick={() => handleUpdateCardioParam('weekly_sessions', (Number(program.cardio?.weekly_sessions) || 3) + 1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, padding: '0 6px' }}>+</button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '10.5px', color: '#64748B', display: 'block', marginBottom: '2px', fontWeight: 600 }}>مدة الجلسة (دقيقة)</label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', height: '30px', padding: '0 4px' }}>
                <button type="button" onClick={() => handleUpdateCardioParam('session_duration_min', Math.max(10, (Number(program.cardio?.session_duration_min) || 30) - 5))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, padding: '0 6px' }}>-</button>
                <span style={{ flex: 1, textAlign: 'center', fontSize: '11.5px', fontWeight: 700, color: '#0F172A' }}>{program.cardio?.session_duration_min || 30} دقيقة</span>
                <button type="button" onClick={() => handleUpdateCardioParam('session_duration_min', (Number(program.cardio?.session_duration_min) || 30) + 5)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, padding: '0 6px' }}>+</button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '10.5px', color: '#64748B', display: 'block', marginBottom: '2px', fontWeight: 600 }}>نطاق النبض المستهدف</label>
              <select
                value={program.cardio?.target_heart_rate_zone || 'Zone 2'}
                onChange={(e) => handleUpdateCardioParam('target_heart_rate_zone', e.target.value)}
                style={{
                  width: '100%',
                  height: '30px',
                  borderRadius: '8px',
                  border: hasAsthma && isHiitCardio ? '1.5px solid #EF4444' : '1px solid #CBD5E1',
                  background: hasAsthma && isHiitCardio ? '#FEF2F2' : '#FFFFFF',
                  color: hasAsthma && isHiitCardio ? '#DC2626' : '#0F172A',
                  padding: '0 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  outline: 'none'
                }}
              >
                <option value="Zone 1">Zone 1 (استشفاء خفيف)</option>
                <option value="Zone 2">Zone 2 (حرق دهون وتحمل - موصى به)</option>
                <option value="Zone 3">Zone 3 (تحمل هوائي متوسط)</option>
                <option value="Zone 4 / HIIT">Zone 4 / HIIT (كثافة عالية)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CLINICAL SUPPLEMENT SAFETY SHIELD SECTION
          ========================================================================= */}
      <div style={{
        background: '#FFFFFF',
        border: safetyAudit.overall_status === 'CONTRAINDICATED' ? '1.5px solid #FCA5A5' : '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '14px',
        boxShadow: safetyAudit.overall_status === 'CONTRAINDICATED' ? '0 4px 14px rgba(239, 68, 68, 0.08)' : 'none'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: safetyAudit.overall_status === 'CONTRAINDICATED' ? '#FEE2E2' : (safetyAudit.overall_status === 'CAUTION' ? '#FEF3C7' : '#DCFCE7'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: safetyAudit.overall_status === 'CONTRAINDICATED' ? '#DC2626' : (safetyAudit.overall_status === 'CAUTION' ? '#D97706' : '#16A34A')
            }}>
              <Pill size={16} />
            </div>
            <div>
              <strong style={{ fontSize: '13px', color: '#0F172A' }}>درع الأمان السريري وفحص المكملات الغذائية:</strong>
              <div style={{ fontSize: '11px', color: '#64748B' }}>فحص لحظي لتوافق المكملات مع الأمراض والأدوية ومؤشرات الدم</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '8px',
              background: safetyAudit.overall_status === 'CONTRAINDICATED' ? '#FEF2F2' : (safetyAudit.overall_status === 'CAUTION' ? '#FFFBEB' : '#F0FDF4'),
              color: safetyAudit.overall_status === 'CONTRAINDICATED' ? '#DC2626' : (safetyAudit.overall_status === 'CAUTION' ? '#B45309' : '#15803D'),
              border: `1px solid ${safetyAudit.overall_status === 'CONTRAINDICATED' ? '#FCA5A5' : (safetyAudit.overall_status === 'CAUTION' ? '#FDE68A' : '#BBF7D0')}`
            }}>
              {safetyAudit.overall_status === 'CONTRAINDICATED'
                ? 'تحذير: تعارض سريري نشط'
                : (safetyAudit.overall_status === 'CAUTION' ? 'تنبيه: مطلوب مباعدة وجرعات دقيقة' : 'كافة المكملات متوافقة وآمنة')}
            </span>
          </div>
        </div>

        {/* Clinical Summary Bar */}
        <div style={{
          background: safetyAudit.overall_status === 'CONTRAINDICATED' ? '#FEF2F2' : (safetyAudit.overall_status === 'CAUTION' ? '#FFFBEB' : '#F8FAFC'),
          border: `1px solid ${safetyAudit.overall_status === 'CONTRAINDICATED' ? '#FECACA' : (safetyAudit.overall_status === 'CAUTION' ? '#FEF3C7' : '#E2E8F0')}`,
          borderRadius: '10px',
          padding: '8px 12px',
          fontSize: '11px',
          color: safetyAudit.overall_status === 'CONTRAINDICATED' ? '#991B1B' : (safetyAudit.overall_status === 'CAUTION' ? '#92400E' : '#475569'),
          marginBottom: '10px'
        }}>
          {safetyAudit.clinical_summary_ar}
        </div>

        {/* Add Supplement Picker */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
          <select
            value={selectedCatalogSupp}
            onChange={(e) => setSelectedCatalogSupp(e.target.value)}
            style={{
              flex: 1,
              height: '32px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              padding: '0 10px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#0F172A',
              outline: 'none',
              background: '#FFFFFF'
            }}
          >
            {supplementCatalog.map(supp => (
              <option key={supp.code} value={supp.code}>
                {supp.name_ar} ({supp.standard_dosage})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleAddSupplement}
            style={{
              height: '32px',
              padding: '0 14px',
              borderRadius: '8px',
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={14} />
            <span>إضافة مكمل</span>
          </button>
        </div>

        {/* List of Prescribed Supplements with Clinical Badges */}
        {safetyAudit.evaluations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '14px', color: '#94A3B8', fontSize: '11.5px', background: '#F8FAFC', borderRadius: '8px' }}>
            لم يتم إدراج مكملات غذائية لهذا المشترك بعد. اختر من القائمة بالأعلى لإجراء الفحص السريري اللحظي.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {safetyAudit.evaluations.map((evalItem, idx) => {
              const isContra = evalItem.safety_status === 'CONTRAINDICATED';
              const isCaut = evalItem.safety_status === 'CAUTION';

              return (
                <div
                  key={idx}
                  style={{
                    background: isContra ? '#FFF1F2' : (isCaut ? '#FFFDF5' : '#F8FAFC'),
                    border: `1px solid ${isContra ? '#FECDD3' : (isCaut ? '#FEF08A' : '#E2E8F0')}`,
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isContra ? (
                        <ShieldAlert size={16} color="#E11D48" />
                      ) : isCaut ? (
                        <AlertTriangle size={16} color="#D97706" />
                      ) : (
                        <ShieldCheck size={16} color="#16A34A" />
                      )}
                      <strong style={{ fontSize: '12px', color: isContra ? '#9F1239' : (isCaut ? '#92400E' : '#0F172A') }}>
                        {evalItem.supplement_name_ar}
                      </strong>
                      <span style={{ fontSize: '10.5px', color: '#64748B' }}>({evalItem.standard_dosage})</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '6px',
                        background: isContra ? '#E11D48' : (isCaut ? '#D97706' : '#16A34A'),
                        color: '#FFFFFF'
                      }}>
                        {isContra ? 'محظور سريرياً' : (isCaut ? 'تنبيه ومباعدة' : 'آمن ومعتمد')}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveSupplement(evalItem.supplement_code)}
                        style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', padding: '2px' }}
                        title="حذف المكمل"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Rationale and Action */}
                  <div style={{ fontSize: '10.5px', color: isContra ? '#881337' : (isCaut ? '#78350F' : '#64748B'), lineHeight: 1.4 }}>
                    {isContra ? evalItem.action_required_ar : evalItem.clinical_rationale_ar}
                  </div>

                  {evalItem.trigger_factors && evalItem.trigger_factors.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                      {evalItem.trigger_factors.map((tf, i) => (
                        <span key={i} style={{ fontSize: '9.5px', padding: '1px 6px', borderRadius: '6px', background: isContra ? '#FFE4E6' : '#FEF9C3', color: isContra ? '#BE123C' : '#854D0E', fontWeight: 600 }}>
                          {tf}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Daily Habits Bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <strong style={{ fontSize: '13px', color: '#0F172A' }}>المؤشرات والعادات اليومية (NEAT & Hydration):</strong>
          <span style={{ fontSize: '10.5px', color: '#64748B' }}>انقر لتعديل الأرقام مباشرة</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {/* Steps */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 10px' }}>
            <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block', marginBottom: '4px' }}>الخطوات اليومية المستهدفة</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="number"
                step="500"
                min="3000"
                max="30000"
                value={program.cardio?.neat_target_steps || 8500}
                onChange={(e) => handleUpdateCardioParam('neat_target_steps', Number(e.target.value) || 8500)}
                style={{ width: '100%', height: '30px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '13px', fontWeight: 800, color: '#0F172A', outline: 'none', background: '#FFFFFF' }}
              />
              <span style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap' }}>خطوة</span>
            </div>
          </div>

          {/* Water */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 10px' }}>
            <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block', marginBottom: '4px' }}>شرب الماء اليومي</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="number"
                step="0.2"
                min="1"
                max="10"
                value={program.cardio?.daily_water_target_liters || 3.8}
                onChange={(e) => handleUpdateCardioParam('daily_water_target_liters', Number(e.target.value) || 3.8)}
                style={{ width: '100%', height: '30px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '13px', fontWeight: 800, color: '#0F172A', outline: 'none', background: '#FFFFFF' }}
              />
              <span style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap' }}>لتر</span>
            </div>
          </div>

          {/* Sleep */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 10px' }}>
            <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block', marginBottom: '4px' }}>ساعات النوم المستهدفة</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="number"
                step="0.5"
                min="4"
                max="12"
                value={program.cardio?.sleep_target_hours || 8}
                onChange={(e) => handleUpdateCardioParam('sleep_target_hours', Number(e.target.value) || 8)}
                style={{ width: '100%', height: '30px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '13px', fontWeight: 800, color: '#0F172A', outline: 'none', background: '#FFFFFF' }}
              />
              <span style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap' }}>ساعات</span>
            </div>
          </div>
        </div>
      </div>

      {/* Coach Directives & Final Plan Notes */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <FileText size={15} color="#0F172A" />
          <strong style={{ fontSize: '13px', color: '#0F172A' }}>ملاحظات وتوجيهات الكوتش الخاصة للمشترك:</strong>
        </div>
        <textarea
          rows={4}
          placeholder="اكتب التوجيهات الختامية والنصائح المخصصة للمشترك قبل اعتماد الخطة..."
          value={coachNotes}
          onChange={(e) => setCoachNotes(e.target.value)}
          style={{ width: '100%', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box', fontFamily: 'Cairo, sans-serif' }}
        />
      </div>

    </div>
  );
}
