import React, { useState } from 'react';
import { Zap, ArrowRightLeft, FileText, ShieldCheck, Plus, Trash2, Pill } from 'lucide-react';
import { getStandardSupplementCatalog } from '../../../utils/clinicalSupplementSafetyEngine';
import { evaluateCardioInterferenceDecoupling, CARDIO_INTENSITIES } from '../../../utils/cardioInterferenceEngine';
import { getPracticalCardioPrescription, CARDIO_TYPES } from '../../../utils/cardioZonesEngine';
import CurvedSelect from '../../../components/common/CurvedSelect';

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

  const _clientMeds = [
    ...(Array.isArray(program?.client?.medications) ? program.client.medications : []),
    ...(Array.isArray(program?.client?.current_meds_supplements_list) ? program.client.current_meds_supplements_list : [])
  ];

  const _clientBiomarkers = program?.client?.biomarkers || program?.client?.lab_markers || {};

  const modality = String(program?.cardio?.modality || '');
  const zone = String(program?.cardio?.target_heart_rate_zone || '');
  const isHiitCardio = /hiit|sprint|كثافة عالية/i.test(modality) || /hiit|zone 4/i.test(zone);

  const clientAge = Number(program?.client?.age) || 28;
  const interferenceAudit = evaluateCardioInterferenceDecoupling({
    age: clientAge,
    cardio_type: isHiitCardio ? CARDIO_INTENSITIES.HIGH_INTENSITY_HIIT : CARDIO_INTENSITIES.ZONE_2_STEADY_STATE,
    is_same_day: true
  });
  const practicalCardio = getPracticalCardioPrescription({
    type: isHiitCardio ? CARDIO_TYPES.HIIT_INTERVALS : CARDIO_TYPES.LISS_TALK_TEST,
    duration_minutes: Number(program.cardio?.session_duration_min) || 30,
    sessions_per_week: Number(program.cardio?.weekly_sessions) || 3,
    medicalConditions: clientConditions,
    weight_kg: program?.client?.weight_kg,
    height_cm: program?.client?.height_cm
  });
  // HIIT chosen by the coach but blocked by the engine (asthma, cardiovascular, pregnancy, BMI >= 35).
  const hiitBlocked = isHiitCardio && practicalCardio.clinical_guardrails?.hiit_banned === true;

  // Active supplements array
  const currentSupplements = Array.isArray(program?.cardio?.supplements) ? program.cardio.supplements : [];
  
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
      dosage: catItem.standard_dosage || '',
      timing: (catItem.category === 'STIMULANT' || catItem.category === 'PERFORMANCE') ? 'قبل التمرين بـ 30 دقيقة' : 'مع وجبة الإفطار',
      category: catItem.category
    };

    const updated = [...currentSupplements, newSuppItem];
    if (typeof handleUpdateSupplementsInCardio === 'function') {
      handleUpdateSupplementsInCardio(updated);
    } else {
      handleUpdateCardioParam('supplements', updated);
    }
  };

  const handleUpdateSupplementField = (idx, field, val) => {
    const updated = currentSupplements.map((s, i) => {
      if (i === idx) {
        if (typeof s === 'string') return { code: s, name: s, [field]: val };
        return { ...s, [field]: val };
      }
      return s;
    });
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
              <CurvedSelect
                value={program.cardio?.target_heart_rate_zone || 'Zone 2'}
                onChange={(e) => handleUpdateCardioParam('target_heart_rate_zone', e.target.value)}
                style={{
                  width: '100%',
                  height: '30px',
                  borderRadius: '8px',
                  border: hiitBlocked ? '1.5px solid #EF4444' : '1px solid #CBD5E1',
                  background: hiitBlocked ? '#FEF2F2' : '#FFFFFF',
                  color: hiitBlocked ? '#DC2626' : '#0F172A',
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
              </CurvedSelect>
            </div>
          </div>

          {/* Practical Talk-Test Biofeedback & AMPK-mTOR Molecular Decoupling */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px', paddingTop: '8px', borderTop: '1px solid #E2E8F0' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '8px 10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Zap size={12} color="#2563EB" />
                <span>بروتوكول اختبار التحدث (Talk-Test)</span>
              </div>
              <div style={{ fontSize: '10.5px', color: '#475569', lineHeight: 1.4 }}>
                {practicalCardio.talk_test_cue_ar}
              </div>
              {practicalCardio.clinical_guidance_ar && (
                <div style={{ fontSize: '10px', color: '#B91C1C', fontWeight: 700, marginTop: '4px', lineHeight: 1.4 }}>
                  {practicalCardio.clinical_guidance_ar}
                </div>
              )}
              {interferenceAudit?.heart_rate_prescription?.range_display && (
                <div style={{ fontSize: '10px', color: '#2563EB', fontWeight: 700, marginTop: '4px' }}>
                  النبض المستهدف (العمر {clientAge} سنة): {interferenceAudit.heart_rate_prescription.range_display}
                </div>
              )}
            </div>

            <div style={{
              background: interferenceAudit.has_interference_risk ? '#FEF2F2' : '#F0FDF4',
              border: interferenceAudit.has_interference_risk ? '1px solid #FECACA' : '1px solid #BBF7D0',
              borderRadius: '8px',
              padding: '8px 10px'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: interferenceAudit.has_interference_risk ? '#B91C1C' : '#166534', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ShieldCheck size={12} color={interferenceAudit.has_interference_risk ? '#DC2626' : '#16A34A'} />
                <span>الفصل الجزيئي لمنع الهدم العضلي (AMPK-mTOR)</span>
              </div>
              <div style={{ fontSize: '10.5px', color: interferenceAudit.has_interference_risk ? '#991B1B' : '#15803D', lineHeight: 1.4 }}>
                {interferenceAudit.timing_verdict_ar}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================================
          SUPPLEMENTS SCHEDULE SECTION (DIRECT & EXECUTIVE)
          ========================================================================= */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '14px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563EB'
            }}>
              <Pill size={16} />
            </div>
            <div>
              <strong style={{ fontSize: '13px', color: '#0F172A' }}>جدول المكملات الغذائية اليومية:</strong>
              <div style={{ fontSize: '11px', color: '#64748B' }}>تحديد المكملات والجرعات ومواعيد التناول اليومية للمتدرب</div>
            </div>
          </div>

          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: '#F1F5F9', color: '#475569' }}>
            {currentSupplements.length} مكملات محددة
          </span>
        </div>

        {/* Add Supplement Picker */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
          <CurvedSelect
            value={selectedCatalogSupp}
            onChange={(e) => setSelectedCatalogSupp(e.target.value)}
            style={{
              flex: 1,
              height: '34px',
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
          </CurvedSelect>

          <button
            type="button"
            onClick={handleAddSupplement}
            style={{
              height: '34px',
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

        {/* Direct Supplements List */}
        {currentSupplements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '14px', color: '#94A3B8', fontSize: '11.5px', background: '#F8FAFC', borderRadius: '8px' }}>
            لم يتم إدراج مكملات غذائية لهذا المشترك بعد. اختر من القائمة بالأعلى لإضافة مكمل.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(140px, 1.2fr) minmax(110px, 1fr) minmax(130px, 1fr) 36px',
              gap: '8px',
              padding: '6px 10px',
              background: '#F1F5F9',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#475569'
            }}>
              <span>اسم المكمل</span>
              <span>الجرعة المحددة</span>
              <span>موعد التناول</span>
              <span style={{ textAlign: 'center' }}>إجراء</span>
            </div>

            {/* Supplement Rows */}
            {currentSupplements.map((supp, idx) => {
              const suppName = typeof supp === 'string' ? supp : (supp.name || supp.name_ar || supp.code);
              const suppDosage = typeof supp === 'string' ? '' : (supp.dosage || supp.standard_dosage || '');
              const suppTiming = typeof supp === 'string' ? '' : (supp.timing || '');

              return (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(140px, 1.2fr) minmax(110px, 1fr) minmax(130px, 1fr) 36px',
                    gap: '8px',
                    alignItems: 'center',
                    padding: '8px 10px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563EB', flexShrink: 0 }}></span>
                    <strong style={{ fontSize: '12px', color: '#0F172A' }}>{suppName}</strong>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={suppDosage}
                      onChange={(e) => handleUpdateSupplementField(idx, 'dosage', e.target.value)}
                      placeholder="مثال: 5 جم يومياً"
                      style={{
                        width: '100%',
                        height: '28px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        padding: '0 8px',
                        fontSize: '11px',
                        color: '#0F172A',
                        background: '#FFFFFF',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      value={suppTiming}
                      onChange={(e) => handleUpdateSupplementField(idx, 'timing', e.target.value)}
                      placeholder="مثال: بعد التمرين مباشرة"
                      style={{
                        width: '100%',
                        height: '28px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        padding: '0 8px',
                        fontSize: '11px',
                        color: '#0F172A',
                        background: '#FFFFFF',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleRemoveSupplement(supp.code || supp.name || supp)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: '1px solid #FECACA',
                        background: '#FEF2F2',
                        color: '#DC2626',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0
                      }}
                      title="حذف المكمل"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
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
