import React, { useState } from 'react';
import { API_BASE } from '../../config/api';

/**
 * Early-deload recommendation from the progression engine. Never applied automatically:
 * the coach approves (7-day deload starting now) or dismisses with one tap.
 */
export default function DeloadRecommendationCard({ checkinId, analysisOutput }) {
  const recommendation = analysisOutput?.deload_recommendation;
  const [decision, setDecision] = useState(analysisOutput?.deload_decision || null);
  const [status, setStatus] = useState(null);

  if (!recommendation?.recommended || !checkinId) return null;

  const decide = async (approve) => {
    setStatus({ type: 'saving', message: 'جاري الحفظ...' });
    try {
      const res = await fetch(`${API_BASE}/api/v1/checkin/${checkinId}/deload-decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ type: 'error', message: data.error || 'تعذر حفظ القرار' });
        return;
      }
      setDecision(data.deload_decision);
      setStatus(null);
    } catch {
      setStatus({ type: 'error', message: 'تعذر الاتصال بالخادم' });
    }
  };

  const reasonTitle = recommendation.reason === 'JOINT_PAIN' ? 'ألم مفصلي مرتفع' : 'تراجع الأداء مع إرهاق';

  return (
    <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '20px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }} dir="rtl">
      <strong style={{ fontSize: '13px', color: '#92400E' }}>توصية ديلود مبكر: {reasonTitle}</strong>
      <ul style={{ margin: 0, paddingInlineStart: '18px', fontSize: '12px', color: '#78350F', lineHeight: 1.7 }}>
        {(recommendation.reasons_ar || []).map((r) => <li key={r}>{r}</li>)}
      </ul>
      {recommendation.affected_exercises?.length > 0 && (
        <div style={{ fontSize: '11px', color: '#92400E' }}>التمارين المتأثرة: {recommendation.affected_exercises.join('، ')}</div>
      )}
      {decision ? (
        <div style={{ fontSize: '12px', fontWeight: 800, color: decision.approved ? '#15803D' : '#475569' }}>
          {decision.approved
            ? `تم اعتماد الديلود حتى ${new Date(decision.ends_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}. التطبيق يعرض للمتدرب الجلسات الخفيفة، وبعدها تبدأ دورة جديدة بأوزان محسوبة.`
            : 'تم تجاهل التوصية، والخطة مستمرة كما هي.'}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" onClick={() => decide(true)} disabled={status?.type === 'saving'} style={{ flex: 1, padding: '8px 12px', borderRadius: '10px', border: 'none', background: '#B45309', color: '#FFFFFF', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>
            اعتماد أسبوع ديلود
          </button>
          <button type="button" onClick={() => decide(false)} disabled={status?.type === 'saving'} style={{ flex: 1, padding: '8px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
            تجاهل
          </button>
        </div>
      )}
      {status?.message && <div style={{ fontSize: '11px', color: status.type === 'error' ? '#B91C1C' : '#475569' }}>{status.message}</div>}
    </div>
  );
}
