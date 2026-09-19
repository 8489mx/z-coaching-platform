import React from 'react';
import { EFFORT_LEVELS, EFFORT_LABELS_AR, resolveIncrementKg } from '../../../utils/progressionEngine';

/**
 * One summary per exercise per session (never per set): working weight, reps of the LAST set, effort.
 * Pre-filled from the engine's target so a normal week is one tap.
 */
export default function ExerciseLogCard({ exercise, progressionEntry, draft, onChange, onRepeatLast }) {
  const code = exercise.code || exercise.id;
  const increment = resolveIncrementKg(code);
  const isBodyweight = increment === 0;
  const target = progressionEntry?.target;
  const lastEntry = progressionEntry?.history?.filter((h) => !h.is_deload).slice(-1)[0];
  const weight = draft?.weight_kg ?? '';
  const reps = draft?.last_set_reps ?? '';
  const effort = draft?.effort || EFFORT_LEVELS.OK;

  const step = (field, delta, min = 0) => {
    const current = Number(field === 'weight_kg' ? weight : reps) || 0;
    const next = Math.max(min, Math.round((current + delta) * 10) / 10);
    onChange(code, field, next);
  };

  const stepperBox = { display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', height: '34px', padding: '0 4px' };
  const stepBtn = { border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, fontSize: '15px', padding: '0 8px', color: '#0F172A' };
  const valueInput = { flex: 1, minWidth: 0, border: 'none', outline: 'none', textAlign: 'center', fontSize: '13px', fontWeight: 800, fontFamily: 'JetBrains Mono, Cairo', color: '#0F172A', background: 'transparent' };

  return (
    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }} dir="rtl">
      <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.5 }}>
        {target
          ? (isBodyweight
            ? `هدفك: ${target.rep_target} عدات في آخر مجموعة`
            : `هدفك: ${target.weight_kg} كجم × ${target.rep_target} عدات في آخر مجموعة`)
          : 'أول تسجيل لهذا التمرين: اكتب الوزن اللي لعبت بيه وعدات آخر مجموعة.'}
      </div>
      {target?.directive_ar && (
        <div style={{ fontSize: '0.7rem', color: '#475569', lineHeight: 1.5 }}>{target.directive_ar}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isBodyweight ? '1fr' : '1fr 1fr', gap: '8px' }}>
        {!isBodyweight && (
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#64748B', marginBottom: '3px' }}>الوزن (كجم)</label>
            <div style={stepperBox}>
              <button type="button" style={stepBtn} onClick={() => step('weight_kg', -increment)} aria-label="إنقاص الوزن">-</button>
              <input
                type="text"
                inputMode="decimal"
                value={weight}
                onChange={(e) => onChange(code, 'weight_kg', e.target.value.replace(/[^\d.]/g, ''))}
                style={valueInput}
                aria-label="الوزن"
              />
              <button type="button" style={stepBtn} onClick={() => step('weight_kg', increment)} aria-label="زيادة الوزن">+</button>
            </div>
          </div>
        )}
        <div>
          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#64748B', marginBottom: '3px' }}>عدات آخر مجموعة</label>
          <div style={stepperBox}>
            <button type="button" style={stepBtn} onClick={() => step('last_set_reps', -1)} aria-label="إنقاص العدات">-</button>
            <input
              type="text"
              inputMode="numeric"
              value={reps}
              onChange={(e) => onChange(code, 'last_set_reps', e.target.value.replace(/[^\d]/g, ''))}
              style={valueInput}
              aria-label="عدات آخر مجموعة"
            />
            <button type="button" style={stepBtn} onClick={() => step('last_set_reps', 1)} aria-label="زيادة العدات">+</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {Object.values(EFFORT_LEVELS).map((level) => {
          const selected = effort === level;
          return (
            <button
              key={level}
              type="button"
              onClick={() => onChange(code, 'effort', level)}
              style={{ flex: '1 1 30%', padding: '6px 8px', borderRadius: '9999px', border: selected ? '1.5px solid #2563EB' : '1px solid #CBD5E1', background: selected ? '#EFF6FF' : '#FFFFFF', color: selected ? '#1E3A8A' : '#475569', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}
            >
              {EFFORT_LABELS_AR[level]}
            </button>
          );
        })}
      </div>

      {lastEntry && (
        <button
          type="button"
          onClick={() => onRepeatLast(code, lastEntry)}
          style={{ alignSelf: 'flex-start', padding: '5px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}
        >
          زي آخر مرة ({isBodyweight ? `${lastEntry.last_set_reps} عدات` : `${lastEntry.weight_kg} كجم × ${lastEntry.last_set_reps}`})
        </button>
      )}
    </div>
  );
}
