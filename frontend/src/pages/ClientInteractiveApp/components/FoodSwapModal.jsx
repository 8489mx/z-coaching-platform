import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { API_BASE } from '../../../../config/api';
import { arabicSearchMatch } from '../../../utils/searchUtils';
import { isNoSwapFood, NO_SWAP_NOTE_AR } from '../../../utils/swapExchangeRules';

// P2-C3: the web swap window no longer computes swaps locally. It asks the one
// server swap engine (the same routes the mobile app uses), so a swap shows the
// same numbers, the same safety rules, and the same clinical-lockout refusal in
// both apps. A food the server does not know simply offers nothing — there is no
// fallback to a guessed default food, and no local-only swap that skips the
// server's safety checks.
export default function FoodSwapModal({
  activeSwapItem,
  onClose,
  onExecuteSwap
}) {
  const [clientSwapSearch, setClientSwapSearch] = useState('');
  const [candidates, setCandidates] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [executingCode, setExecutingCode] = useState(null);
  const [executeError, setExecuteError] = useState(null);

  const itemCode = activeSwapItem?.code || '';
  const itemAmount = Number(activeSwapItem?.amount) || 100;

  useEffect(() => {
    if (!activeSwapItem) return undefined;
    if (isNoSwapFood(itemCode) || !itemCode) {
      setCandidates([]);
      setLoadError(null);
      return undefined;
    }
    const controller = new AbortController();
    setCandidates(null);
    setLoadError(null);
    setExecuteError(null);
    fetch(`${API_BASE}/api/v1/programs/swap-candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ food_code: itemCode, source_grams: itemAmount }),
      signal: controller.signal
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error((data && (data.error || data.message_ar)) || 'تعذر تحميل البدائل');
        return data;
      })
      .then((data) => {
        if (!controller.signal.aborted) setCandidates(Array.isArray(data?.candidates) ? data.candidates : []);
      })
      .catch((err) => {
        if (!controller.signal.aborted && err?.name !== 'AbortError') setLoadError(err?.message || 'تعذر تحميل البدائل');
      });
    return () => controller.abort();
  }, [activeSwapItem?.id, itemCode, itemAmount]);

  if (!activeSwapItem) return null;

  const handleClose = () => {
    setClientSwapSearch('');
    onClose();
  };

  const handleExecute = (cand) => {
    setExecutingCode(cand.food_code);
    setExecuteError(null);
    fetch(`${API_BASE}/api/v1/programs/swap-food`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_food_code: itemCode, source_grams: itemAmount, target_food_code: cand.food_code })
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error((data && data.error) || 'تعذر تنفيذ البديل');
        return data;
      })
      .then((data) => {
        const swapped = data?.swapped_food;
        if (!swapped) throw new Error('تعذر تنفيذ البديل');
        // Same shape the local apply already expects; the numbers come from the server.
        onExecuteSwap({
          replacement_food: {
            code: swapped.food_code,
            name_ar: swapped.name_ar,
            portion_g: swapped.grams,
            macros: {
              protein_g: swapped.protein_g,
              carbs_g: swapped.carbs_g,
              fat_g: swapped.fat_g,
              calories_kcal: swapped.calories
            }
          }
        });
        setClientSwapSearch('');
      })
      .catch((err) => setExecuteError(err?.message || 'تعذر تنفيذ البديل'))
      .finally(() => setExecutingCode(null));
  };

  // Protein powder has no swap (owner rule): take it, or tell the coach it ran out.
  if (isNoSwapFood(itemCode)) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center'
        }}
        onClick={handleClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '480px',
            background: '#FFFFFF',
            borderTopLeftRadius: '28px',
            borderTopRightRadius: '28px',
            padding: '24px 20px',
            boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.15)',
            direction: 'rtl'
          }}
        >
          <div style={{ padding: '24px', textAlign: 'center', color: '#334155', fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.6 }}>
            {NO_SWAP_NOTE_AR}
          </div>
        </div>
      </div>
    );
  }

  const visibleCandidates = (candidates || []).filter((cand) => {
    if (!clientSwapSearch.trim()) return true;
    return arabicSearchMatch(cand.name_ar, clientSwapSearch)
      || arabicSearchMatch(cand.name_en, clientSwapSearch)
      || arabicSearchMatch(cand.food_code, clientSwapSearch);
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center'
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          background: '#FFFFFF',
          borderTopLeftRadius: '28px',
          borderTopRightRadius: '28px',
          padding: '24px 20px',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.15)',
          direction: 'rtl'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#D97706', background: '#FEF3C7', padding: '2px 6px', borderRadius: '6px' }}>
              محرك المبادلات الذكية (Clinical Smart Swaps)
            </span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: '4px 0 0 0' }}>
              بدائل مكافئة لـ: {activeSwapItem.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X style={{ width: '16px', height: '16px', color: '#64748B' }} />
          </button>
        </div>

        {/* Current Item */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '12px', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>الصنف الحالي بالخطة:</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
            <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>{activeSwapItem.name}</strong>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0284C7', fontFamily: 'monospace' }}>
              {activeSwapItem.amount} {activeSwapItem.unit} ({Math.round(activeSwapItem.cal)} Kcal)
            </span>
          </div>
        </div>

        {/* Search & Filter Controls for Smart Swaps */}
        <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="text"
            placeholder="ابحث باسم أي صنف بديل تحبه..."
            value={clientSwapSearch}
            onChange={(e) => setClientSwapSearch(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              padding: '0 16px',
              fontSize: '0.82rem',
              fontWeight: 600,
              outline: 'none',
              background: '#F8FAFC',
              color: '#0F172A',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {executeError && (
          <div style={{ padding: '10px 12px', marginBottom: '12px', textAlign: 'center', color: '#B91C1C', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700 }}>
            {executeError}
          </div>
        )}

        {/* Calculated Swap Alternatives List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '45vh', overflowY: 'auto' }}>
          {candidates === null && !loadError && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '0.78rem' }}>
              جاري تحميل البدائل من محرك المبادلات...
            </div>
          )}
          {loadError && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#B91C1C', fontSize: '0.78rem', fontWeight: 700 }}>
              {loadError}
              <div style={{ marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setCandidates(null);
                    setLoadError(null);
                    fetch(`${API_BASE}/api/v1/programs/swap-candidates`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ food_code: itemCode, source_grams: itemAmount })
                    })
                      .then(async (res) => {
                        const data = await res.json().catch(() => null);
                        if (!res.ok) throw new Error((data && (data.error || data.message_ar)) || 'تعذر تحميل البدائل');
                        return data;
                      })
                      .then((data) => setCandidates(Array.isArray(data?.candidates) ? data.candidates : []))
                      .catch((err) => setLoadError(err?.message || 'تعذر تحميل البدائل'));
                  }}
                  style={{ background: '#0284C7', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  حاول تاني
                </button>
              </div>
            </div>
          )}
          {candidates !== null && !loadError && visibleCandidates.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '0.78rem' }}>
              {clientSwapSearch.trim() ? 'لا توجد بدائل مطابقة للبحث بنفس نوع الأكل وقيمة قريبة.' : 'الصنف ده مالوش بديل بنفس نوع الأكل وقيمة قريبة؛ خليه زي ما هو.'}
            </div>
          )}
          {candidates !== null && !loadError && visibleCandidates.slice(0, 25).map((cand, sIdx) => (
            <div
              key={cand.food_code || sIdx}
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '12px',
                padding: '10px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '0.84rem', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {cand.name_ar}
                  </strong>
                </div>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#059669', fontFamily: 'monospace' }}>
                  الكمية المكافئة: {cand.display_ar || `${cand.target_grams} جم`}
                </span>
              </div>

              <button
                type="button"
                disabled={executingCode === cand.food_code}
                onClick={() => handleExecute(cand)}
                style={{
                  background: '#0284C7',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: executingCode === cand.food_code ? 'wait' : 'pointer',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(0, 132, 199, 0.25)',
                  opacity: executingCode === cand.food_code ? 0.6 : 1
                }}
              >
                {executingCode === cand.food_code ? 'جاري التبديل...' : 'تبديل الآن'}
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
