import React, { useState } from 'react';
import { ArrowRightLeft, Search, X } from 'lucide-react';
import { FOOD_DATABASE_LIST } from '../../constants/coachEditorConstants';
import { arabicSearchMatch } from '../../../../utils/searchUtils';
import { convertPortionCookingYield, FOOD_YIELD_MAPPING, resolveFoodYieldRule } from '../../../../utils/kitchenYieldEngine';

export function CoachSwapFoodModal({
  swapFoodModal,
  setSwapFoodModal,
  swapFoodSearch,
  setSwapFoodSearch,
  handleExecuteFoodSwap
}) {
  const [_activeFilter, _setActiveFilter] = useState('ALL');

  if (!swapFoodModal.open || !swapFoodModal.currentItem) return null;

  const curCat = String(swapFoodModal.currentItem.category || '').toUpperCase();
  const normCur = (curCat === 'FATS' || curCat === 'FAT') ? 'FAT'
    : (curCat === 'CARBS' || curCat === 'CARB') ? 'CARB'
    : (curCat === 'PROTEINS' || curCat === 'PROTEIN') ? 'PROTEIN'
    : curCat;

  const getHandPortionTip = (category) => {
    if (category === 'PROTEIN') return 'معيار يدوي: بحجم راحة اليد (Palm)';
    if (category === 'CARB') return 'معيار يدوي: بحجم قبضة اليد المقبوضة (Fist)';
    if (category === 'FAT') return 'معيار يدوي: بحجم عقلة الإبهام (Thumb)';
    return 'معيار يدوي متطابق';
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} dir="rtl">
      <div style={{ maxWidth: '560px', width: '100%', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '88vh', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowRightLeft size={15} color="#2563EB" />
              <span>البدائل الغذائية المتكافئة لـ ({swapFoodModal.currentItem.name})</span>
            </h4>
            <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>الكمية الحالية: <strong style={{ color: '#0F172A' }}>{swapFoodModal.currentItem.amount} {swapFoodModal.currentItem.unit || 'جم'}</strong> ({swapFoodModal.currentItem.cal || 0} kcal)</span>
              <span style={{ color: '#D0D5DD', margin: '0 3px' }}>|</span>
              <span style={{ color: '#2563EB', fontWeight: 600 }}>{getHandPortionTip(normCur)}</span>
            </div>
          </div>
          <button type="button" onClick={() => setSwapFoodModal({ open: false, mealId: null, itemIdx: null, currentItem: null })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={15} />
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="ابحث عن صنف بديل باسمه العربي أو الإنجليزي..."
            value={swapFoodSearch}
            onChange={(e) => setSwapFoodSearch(e.target.value)}
            style={{ width: '100%', height: '34px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 32px 0 12px', fontSize: '11.5px', outline: 'none', boxSizing: 'border-box' }}
          />
          <Search size={13} style={{ position: 'absolute', right: '11px', top: '11px', color: '#94A3B8' }} />
        </div>

        {/* Compatible Swaps List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '400px', paddingRight: '2px' }}>
          {FOOD_DATABASE_LIST
            .filter(f => {
              const fCat = String(f.category || f.macro_type || '').toUpperCase();
              const normF = (fCat === 'FATS' || fCat === 'FAT') ? 'FAT'
                : (fCat === 'CARBS' || fCat === 'CARB') ? 'CARB'
                : (fCat === 'PROTEINS' || fCat === 'PROTEIN') ? 'PROTEIN'
                : fCat;
              const matchCategory = !normCur || normF === normCur;
              const matchSearch = !swapFoodSearch || 
                arabicSearchMatch(f.name, swapFoodSearch) || 
                arabicSearchMatch(f.name_ar, swapFoodSearch) || 
                arabicSearchMatch(f.name_en, swapFoodSearch);
              return matchCategory && matchSearch;
            })
            .map((targetFood, tfIdx) => {
              let equivGrams = 100;

              if (normCur === 'PROTEIN') {
                const curP = Number(swapFoodModal.currentItem.p) || 25;
                const targetP = Number(targetFood.protein_per_100g || targetFood.p || 25);
                equivGrams = Math.max(10, Math.round((curP / targetP) * 100));
              } else if (normCur === 'CARB') {
                const curC = Number(swapFoodModal.currentItem.c) || 30;
                const targetC = Number(targetFood.carbs_per_100g || targetFood.c || 25);
                equivGrams = Math.max(10, Math.round((curC / targetC) * 100));
              } else if (normCur === 'FAT') {
                const curF = Number(swapFoodModal.currentItem.f) || 8;
                const targetF = Number(targetFood.fat_per_100g || targetFood.f || 10);
                const rawEquiv = Math.round((curF / targetF) * 100);
                const foodStr = String((targetFood.code || '') + ' ' + (targetFood.name || '')).toUpperCase();
                const isOilOrGhee = /OIL|GHEE|BUTTER|زيت|سمن|زبدة/.test(foodStr) && !/PEANUT|فول/.test(foodStr);
                const isSeeds = /CHIA|SEEDS|FLAX|شيا|بذور|كتان/.test(foodStr);
                const isNutButter = /TAHINI|PEANUT|طحينة|فول سوداني/.test(foodStr);
                if (isOilOrGhee) {
                  equivGrams = Math.max(5, Math.min(10, rawEquiv));
                } else if (isSeeds) {
                  equivGrams = Math.max(5, Math.min(10, rawEquiv));
                } else if (isNutButter) {
                  equivGrams = Math.max(10, Math.min(15, rawEquiv));
                } else {
                  equivGrams = Math.max(15, Math.min(30, rawEquiv));
                }
              }

              // Round to clean 5g increments
              equivGrams = Math.round(equivGrams / 5) * 5;

              const factor = equivGrams / 100;
              const equivCal = Math.round((targetFood.calories_per_100g || targetFood.cal || 100) * factor);
              const equivP = Number(((targetFood.protein_per_100g || targetFood.p || 0) * factor).toFixed(1));
              const equivC = Number(((targetFood.carbs_per_100g || targetFood.c || 0) * factor).toFixed(1));
              const equivF = Number(((targetFood.fat_per_100g || targetFood.f || 0) * factor).toFixed(1));

              // Cooking Yield Conversion Info (Raw vs Cooked)
              let cookingYieldInfo = null;
              const yieldRule = resolveFoodYieldRule(targetFood.code || targetFood.name || '');
              if (yieldRule && yieldRule.raw_to_cooked !== 1) {
                const isRawBase = yieldRule.base_state === 'RAW';
                const yieldConv = convertPortionCookingYield({
                  food_code: targetFood.code || targetFood.name,
                  amount_g: equivGrams,
                  from_state: isRawBase ? 'RAW' : 'COOKED',
                  to_state: isRawBase ? 'COOKED' : 'RAW'
                });
                if (yieldConv.converted_amount_g !== equivGrams) {
                  cookingYieldInfo = isRawBase ? `يزن مطبوخاً: ~${yieldConv.converted_amount_g} جم` : `يزن نيئاً: ~${yieldConv.converted_amount_g} جم`;
                }
              } else if (!cookingYieldInfo && targetFood.code && FOOD_YIELD_MAPPING[targetFood.code]) {
                const yieldConv = convertPortionCookingYield({
                  food_code: targetFood.code,
                  amount_g: equivGrams,
                  from_state: 'COOKED',
                  to_state: 'RAW'
                });
                if (yieldConv.converted_amount_g !== equivGrams) {
                  cookingYieldInfo = `يزن نيئاً: ~${yieldConv.converted_amount_g} جم`;
                }
              }

              return (
                <div
                  key={targetFood.code || tfIdx}
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '12px', color: '#0F172A' }}>{targetFood.name}</strong>
                      {cookingYieldInfo && (
                        <span style={{ fontSize: '9.5px', background: '#F1F5F9', color: '#475569', padding: '1px 6px', borderRadius: '6px', border: '1px solid #CBD5E1', fontWeight: 600 }}>
                          {cookingYieldInfo}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px' }}>
                      الكمية المكافئة: <strong style={{ color: '#0F172A' }}>{equivGrams} {targetFood.serving_unit || targetFood.unit || 'جم'}</strong> ({equivCal} kcal)
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#94A3B8', marginTop: '1px' }}>
                      P: {equivP}g · C: {equivC}g · F: {equivF}g
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleExecuteFoodSwap(swapFoodModal.mealId, swapFoodModal.itemIdx, targetFood)}
                    style={{
                      height: '28px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      background: '#673DE6',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    اختيار كبديل
                  </button>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

export function CoachAddFoodModal({
  addFoodModal,
  setAddFoodModal,
  foodModalSearch,
  setFoodModalSearch,
  handleAddFoodToMeal
}) {
  if (!addFoodModal.open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} dir="rtl">
      <div style={{ maxWidth: '480px', width: '100%', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '85vh', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
          <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>إضافة صنف غذائي</h4>
          <button type="button" onClick={() => setAddFoodModal({ open: false, mealId: null })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={15} /></button>
        </div>

        <input
          type="text"
          placeholder="ابحث باسم الصنف الغذائي..."
          value={foodModalSearch}
          onChange={(e) => setFoodModalSearch(e.target.value)}
          style={{ width: '100%', height: '34px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 14px', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '320px', overflowY: 'auto' }}>
          {FOOD_DATABASE_LIST
            .filter(fd => !foodModalSearch || 
              arabicSearchMatch(fd.name, foodModalSearch) || 
              arabicSearchMatch(fd.name_ar, foodModalSearch) || 
              arabicSearchMatch(fd.name_en, foodModalSearch) || 
              arabicSearchMatch(fd.code, foodModalSearch) ||
              (Array.isArray(fd.aliases) && fd.aliases.some(a => arabicSearchMatch(a, foodModalSearch))))
            .slice(0, 30)
            .map((fd) => {
              const portionFactor = (fd.amount || 100) / 100;
              const portionCal = Math.round((fd.cal || 0) * portionFactor);
              const portionP = Number(((fd.p || 0) * portionFactor).toFixed(1));
              const portionC = Number(((fd.c || 0) * portionFactor).toFixed(1));
              const portionF = Number(((fd.f || 0) * portionFactor).toFixed(1));

              return (
                <div
                  key={fd.code}
                  onClick={() => handleAddFoodToMeal(addFoodModal.mealId, fd)}
                  style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div>
                    <strong style={{ fontSize: '11.5px', color: '#0F172A', display: 'block' }}>{fd.name}</strong>
                    <span style={{ fontSize: '10px', color: '#64748B' }}>
                      حصة معتمدة: <strong style={{ color: '#0F172A' }}>{fd.amount} {fd.unit}</strong> ({portionCal} kcal) • P: {portionP}g • C: {portionC}g • F: {portionF}g
                    </span>
                  </div>
                  <button type="button" style={{ padding: '2px 7px', background: '#673DE6', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>+ إضافة</button>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
