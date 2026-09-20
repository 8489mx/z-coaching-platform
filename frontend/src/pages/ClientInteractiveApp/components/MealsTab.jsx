import React, { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { 
  formatItemPortionDisplay, 
  PORTION_DISPLAY_MODES, 
  COOKING_STATE_MODES 
} from '../../../utils/foodSwapEngine';
import { getPrepOptionsForFood } from '../../../utils/culinaryRecipes';

export default function MealsTab({
  consumedMacros,
  targetMacros,
  meals,
  fastingContext = null,
  handleToggleMealCompleted,
  setActivePrepItem,
  setActiveSwapItem,
  setSwapMealId,
  setFreeGuideModalOpen,
  setPdfModalOpen,
  supplementsList = [],
  supplementsTaken = {},
  toggleSupplementTaken
}) {
  const [portionDisplayMode, setPortionDisplayMode] = useState(PORTION_DISPLAY_MODES.DUAL);
  const [cookingStateMode, setCookingStateMode] = useState(COOKING_STATE_MODES.BOTH);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      
      {/* Daily Macros Target Card - Executive Prescription Reference */}
      <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '14px 16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, display: 'block' }}>إجمالي السعرات اليومية المقررة</span>
            <strong style={{ fontSize: '1.05rem', color: '#0F172A', fontWeight: 900 }}>
              {targetMacros.cal} <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 500 }}>سعرة حرارية</span>
            </strong>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#0284C7', fontWeight: 700, background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '2px 8px', borderRadius: '6px' }}>
            خطة استرشادية معتمدة
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {/* Protein */}
          <div style={{ background: '#F8FAFC', padding: '8px 10px', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, display: 'block' }}>بروتين صافي</span>
            <strong style={{ fontSize: '0.92rem', color: '#0284C7', fontWeight: 800 }} dir="ltr">{targetMacros.p}g</strong>
          </div>

          {/* Carbs */}
          <div style={{ background: '#F8FAFC', padding: '8px 10px', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, display: 'block' }}>كاربوهيدرات</span>
            <strong style={{ fontSize: '0.92rem', color: '#D97706', fontWeight: 800 }} dir="ltr">{targetMacros.c}g</strong>
          </div>

          {/* Fats */}
          <div style={{ background: '#F8FAFC', padding: '8px 10px', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, display: 'block' }}>دهون صحية</span>
            <strong style={{ fontSize: '0.92rem', color: '#059669', fontWeight: 800 }} dir="ltr">{targetMacros.f}g</strong>
          </div>
        </div>
      </div>

      {/* Unified Compact Portion & State Bar */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          background: '#F8FAFC', 
          border: '1px solid #E2E8F0', 
          borderRadius: '12px', 
          padding: '6px 12px', 
          margin: '2px 0 6px 0' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700 }}>عرض الحصة:</span>
          <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '2px', borderRadius: '8px', gap: '2px' }}>
            {[
              { key: PORTION_DISPLAY_MODES.DUAL, label: 'مزدوج' },
              { key: PORTION_DISPLAY_MODES.GRAMS, label: 'ميزان' },
              { key: PORTION_DISPLAY_MODES.HAND_PORTIONS, label: 'يد' }
            ].map(tab => {
              const isSel = portionDisplayMode === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setPortionDisplayMode(tab.key)}
                  style={{
                    background: isSel ? '#0284C7' : 'transparent',
                    color: isSel ? '#FFFFFF' : '#64748B',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '0.67rem',
                    fontWeight: isSel ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.12s ease'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700 }}>حالة الوزن:</span>
          <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '2px', borderRadius: '8px', gap: '2px' }}>
            {[
              { key: COOKING_STATE_MODES.BOTH, label: 'معاً' },
              { key: COOKING_STATE_MODES.COOKED, label: 'مطبوخ' },
              { key: COOKING_STATE_MODES.RAW, label: 'نيء' }
            ].map(cTab => {
              const isSel = cookingStateMode === cTab.key;
              return (
                <button
                  key={cTab.key}
                  type="button"
                  onClick={() => setCookingStateMode(cTab.key)}
                  style={{
                    background: isSel ? '#0284C7' : 'transparent',
                    color: isSel ? '#FFFFFF' : '#64748B',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '0.67rem',
                    fontWeight: isSel ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.12s ease'
                  }}
                >
                  {cTab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>



      {/* Religious fasting banner (Ramadan or a Coptic fast) */}
      {fastingContext?.active && (
        <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: '14px', padding: '12px 14px' }}>
          <strong style={{ display: 'block', fontSize: '0.84rem', color: '#5B21B6', fontWeight: 800, marginBottom: '4px' }}>
            {fastingContext.period_name_ar || 'وضع الصيام مفعل'}
          </strong>
          <span style={{ fontSize: '0.74rem', color: '#4C1D95', lineHeight: 1.7 }}>
            {fastingContext.reason_ar}
          </span>
        </div>
      )}

      {/* Meals List */}
      {meals.map((meal) => (
        <div 
          key={meal.id}
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
          }}
        >
          {/* Meal Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px', marginBottom: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
                <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {meal.title}
                </h3>
                {(meal.workout_timing === 'PRE_WORKOUT' || meal.title?.includes('قبل التمرين')) && (
                  <span style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', padding: '1px 6px', borderRadius: '6px', fontSize: '0.67rem', fontWeight: 800 }}>
                    وجبة ما قبل التمرين (طاقة وجليكوجين)
                  </span>
                )}
                {(meal.workout_timing === 'POST_WORKOUT' || meal.title?.includes('بعد التمرين') || meal.title?.includes('التعافي')) && (
                  <span style={{ background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0', padding: '1px 6px', borderRadius: '6px', fontSize: '0.67rem', fontWeight: 800 }}>
                    وجبة ما بعد التمرين (بناء عضلي واستشفاء)
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{meal.time}</span>
            </div>

            {meal.macros?.calories ? (
              <span 
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  color: '#0284C7',
                  background: '#F0F9FF',
                  border: '1px solid #BAE6FD',
                  padding: '3px 8px',
                  borderRadius: '8px'
                }} 
                dir="ltr"
              >
                {meal.macros.calories} kcal
              </span>
            ) : null}
          </div>

          {/* Meal Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {meal.items.map(item => {
              const prepOptions = getPrepOptionsForFood(item.code || item.name);
              const isVeggie = item.category === 'VEGGIES' || /خضار|سلطة|جرجير|خيار|طماطم|كوسة|بروكلي/i.test(item.name || item.code);
              const calculatedMacroType = isVeggie ? 'VEGGIES' : (item.p > item.c ? 'PROTEIN' : (item.c > 5 ? 'CARBS' : 'FATS'));
              const formatted = formatItemPortionDisplay({
                food_code: item.code || item.name, 
                amount_g: item.amount, 
                unit: item.unit, 
                macro_type: calculatedMacroType,
                food_state: cookingStateMode
              }, portionDisplayMode, cookingStateMode);

              const cleanSecondary = formatted.secondary_text
                ? String(formatted.secondary_text).replace(/^[[(\s]+|[\])\s]+$/g, '').trim()
                : '';

              return (
                <div 
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 10px',
                    background: '#F8FAFC',
                    borderRadius: '10px',
                    border: '1px solid #F1F5F9'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>
                        {item.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#0284C7', fontWeight: 700 }}>
                        {formatted.mode === PORTION_DISPLAY_MODES.DUAL && cleanSecondary ? (
                          <span>
                            {formatted.primary_text}
                            <span style={{ color: '#64748B', fontWeight: 500, margin: '0 4px' }}>
                              ({cleanSecondary})
                            </span>
                          </span>
                        ) : (
                          formatted.primary_text
                        )}
                      </span>
                    </div>

                    {/* Clean, Non-scrambled LTR Macros */}
                    <div style={{ marginTop: '2px', fontSize: '0.68rem', color: '#64748B' }} dir="ltr">
                      <span style={{ fontWeight: 600, color: '#334155' }}>{Math.round(item.cal)} kcal</span>
                      <span style={{ margin: '0 4px', color: '#CBD5E1' }}>•</span>
                      <span>P: {item.p}g</span>
                      <span style={{ margin: '0 4px', color: '#CBD5E1' }}>•</span>
                      <span>C: {item.c}g</span>
                      <span style={{ margin: '0 4px', color: '#CBD5E1' }}>•</span>
                      <span>F: {item.f}g</span>
                    </div>
                    {item.fasting_substituted_from && (
                      <div style={{ marginTop: '3px', fontSize: '0.68rem', color: '#6D28D9', fontWeight: 600 }}>
                        بديل صيامي بدل {item.fasting_substituted_from.name}
                      </div>
                    )}
                    {item.fasting_note_ar && (
                      <div style={{ marginTop: '3px', fontSize: '0.68rem', color: item.fasting_blocked ? '#B91C1C' : '#92400E', fontWeight: 600 }}>
                        {item.fasting_note_ar}
                      </div>
                    )}
                  </div>

                  {/* Clean Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {prepOptions && (
                      <button
                        type="button"
                        onClick={() => setActivePrepItem(item)}
                        style={{
                          background: '#FFFFFF',
                          color: '#475569',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          padding: '3px 7px',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        title="أفكار خلطات وطرق إعداد"
                      >
                        خلطات
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => { setActiveSwapItem(item); setSwapMealId(meal.id); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        background: '#FFFFFF',
                        color: '#0F172A',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        padding: '3px 8px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title="تبديل الصنف ببديل مكافئ"
                    >
                      <ArrowLeftRight style={{ width: '11px', height: '11px' }} />
                      <span>بديل</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
