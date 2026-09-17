import React, { useState } from 'react';
import { Check, ArrowLeftRight, ShieldCheck } from 'lucide-react';
import { 
  formatItemPortionDisplay, 
  PORTION_DISPLAY_MODES, 
  COOKING_STATE_MODES, 
  getTravelDiningBlueprints 
} from '../../../utils/foodSwapEngine';
import { getPrepOptionsForFood } from '../../../utils/culinaryRecipes';
import { SMART_GUIDELINES_MATRIX } from '../../../utils/pdfExportEngine';

export default function MealsTab({
  consumedMacros,
  targetMacros,
  meals,
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
  const [travelModeActive, setTravelModeActive] = useState(false);
  const [diningBlueprints] = useState(() => getTravelDiningBlueprints());
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      
      {/* Daily Macros Target Progress Card - Executive Clean */}
      <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '14px 16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, display: 'block' }}>إجمالي السعرات اليومية</span>
            <strong style={{ fontSize: '1rem', color: '#0F172A', fontWeight: 900 }}>
              {Math.round(consumedMacros.cal)} <span style={{ fontSize: '0.76rem', color: '#94A3B8', fontWeight: 500 }}>/ {targetMacros.cal} سعرة</span>
            </strong>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
            متبقي: <strong style={{ color: '#0F172A' }}>{Math.max(0, targetMacros.cal - Math.round(consumedMacros.cal))}</strong> سعرة
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {/* Protein */}
          <div style={{ background: '#F8FAFC', padding: '8px 10px', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#64748B', fontWeight: 600 }}>
              <span>بروتين</span>
              <span style={{ color: '#0F172A', fontWeight: 700 }} dir="ltr">{Math.round(consumedMacros.p)}/{targetMacros.p}g</span>
            </div>
            <div style={{ width: '100%', height: '3px', background: '#E2E8F0', borderRadius: '9999px', marginTop: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, (consumedMacros.p / targetMacros.p) * 100)}%`, height: '100%', background: '#0284C7' }}></div>
            </div>
          </div>

          {/* Carbs */}
          <div style={{ background: '#F8FAFC', padding: '8px 10px', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#64748B', fontWeight: 600 }}>
              <span>كارب</span>
              <span style={{ color: '#0F172A', fontWeight: 700 }} dir="ltr">{Math.round(consumedMacros.c)}/{targetMacros.c}g</span>
            </div>
            <div style={{ width: '100%', height: '3px', background: '#E2E8F0', borderRadius: '9999px', marginTop: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, (consumedMacros.c / targetMacros.c) * 100)}%`, height: '100%', background: '#D97706' }}></div>
            </div>
          </div>

          {/* Fats */}
          <div style={{ background: '#F8FAFC', padding: '8px 10px', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#64748B', fontWeight: 600 }}>
              <span>دهون</span>
              <span style={{ color: '#0F172A', fontWeight: 700 }} dir="ltr">{Math.round(consumedMacros.f)}/{targetMacros.f}g</span>
            </div>
            <div style={{ width: '100%', height: '3px', background: '#E2E8F0', borderRadius: '9999px', marginTop: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, (consumedMacros.f / targetMacros.f) * 100)}%`, height: '100%', background: '#059669' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Static Daily Hydration Target (معدل الترطيب اليومي المستهدف - استرشادي ثابت بدون عدادات) */}
      <div style={{
        background: '#F0F9FF',
        borderRadius: '14px',
        padding: '10px 14px',
        border: '1px solid #BAE6FD',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#0284C7'
          }} />
          <div>
            <span style={{ fontSize: '0.7rem', color: '#0369A1', fontWeight: 700, display: 'block' }}>
              معدل الترطيب اليومي المستهدف (استرشادي ثابت)
            </span>
            <strong style={{ fontSize: '0.84rem', color: '#0F172A', fontWeight: 800 }}>
              3.5 إلى 4.0 لتر/اليوم
            </strong>
          </div>
        </div>
        <span style={{
          fontSize: '0.68rem',
          color: '#0284C7',
          background: '#FFFFFF',
          border: '1px solid #BAE6FD',
          padding: '3px 8px',
          borderRadius: '6px',
          fontWeight: 700
        }}>
          توزيع متوازن على مدار اليوم
        </span>
      </div>

      {/* Unified Compact Meal Controls Bar */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: '8px', 
          background: '#F8FAFC', 
          border: '1px solid #E2E8F0', 
          borderRadius: '12px', 
          padding: '6px 10px', 
          margin: '4px 0 10px 0' 
        }}
      >
        {/* Portion Mode & Cooking State Capsules */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Portion Mode */}
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
                    borderRadius: '8px',
                    padding: '3px 8px',
                    fontSize: '0.68rem',
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

          <span style={{ color: '#CBD5E1', fontSize: '10px' }}>•</span>

          {/* Cooking State */}
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
                    borderRadius: '8px',
                    padding: '3px 8px',
                    fontSize: '0.68rem',
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

        {/* Secondary Quick Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setTravelModeActive(prev => !prev)}
            style={{
              background: travelModeActive ? '#EFF6FF' : '#F8FAFC',
              color: travelModeActive ? '#0284C7' : '#64748B',
              border: `1px solid ${travelModeActive ? '#BAE6FD' : '#E2E8F0'}`,
              borderRadius: '8px',
              padding: '3px 8px',
              fontSize: '0.68rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {travelModeActive ? 'إخفاء المطاعم' : 'خطط المطاعم'}
          </button>

          <button
            type="button"
            onClick={() => setFreeGuideModalOpen(true)}
            style={{
              background: '#F0FDF4',
              color: '#166534',
              border: '1px solid #BBF7D0',
              borderRadius: '8px',
              padding: '3px 8px',
              fontSize: '0.68rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            دليل الالتزام
          </button>
        </div>
      </div>

      {/* Pre-Engineered Dining Blueprints Section (Visible when travelMode is active) */}
      {travelModeActive && (
        <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '16px', padding: '14px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '0.84rem', fontWeight: 800, color: '#0F172A' }}>
            خطط المطاعم والسفر الجاهزة (Dining Blueprints)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {diningBlueprints.map(bp => (
              <div key={bp.id} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '0.8rem', color: '#0369A1' }}>{bp.title_ar}</strong>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '1px 6px', borderRadius: '6px' }} dir="ltr">
                    ~{bp.estimated_macros.calories_kcal} kcal • P: {bp.estimated_macros.protein_g}g
                  </span>
                </div>
                <ul style={{ margin: 0, paddingRight: '16px', fontSize: '0.72rem', color: '#334155', lineHeight: 1.4 }}>
                  {bp.ordered_items_ar.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workout Timing & Flexibility Guidance Banner */}
      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px 14px', marginBottom: '12px' }}>
        <p style={{ margin: 0, fontSize: '0.73rem', color: '#334155', lineHeight: 1.5 }}>
          <strong>ملاحظة مرونة التوقيت:</strong> توزيع وتوقيت الوجبات حول التمرين استرشادي لتحقيق أقصى طاقة واستشفاء؛ ولديك كامل المرونة في تقديم أو تأخير أي وجبة وفق جدول يومك ومواعيد دوامك، فالفيصل الرياضي والأيضي هو إكمال إجمالي السعرات والماكروز المقررة لك في نهاية اليوم.
        </p>
      </div>

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

            <button
              type="button"
              onClick={() => handleToggleMealCompleted(meal.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: meal.completed ? '#16A34A' : '#F8FAFC',
                color: meal.completed ? '#FFFFFF' : '#475569',
                border: `1px solid ${meal.completed ? '#16A34A' : '#CBD5E1'}`,
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {meal.completed && <Check style={{ width: '12px', height: '12px' }} />}
              <span>{meal.completed ? 'تم التناول' : 'تسجيل التناول'}</span>
            </button>
          </div>

          {/* Meal Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {meal.items.map(item => {
              const prepOptions = getPrepOptionsForFood(item.code || item.name);
              const formatted = formatItemPortionDisplay({
                food_code: item.code || item.name, 
                amount_g: item.amount, 
                unit: item.unit, 
                macro_type: item.p > item.c ? 'PROTEIN' : (item.c > 5 ? 'CARBS' : 'FATS'),
                food_state: cookingStateMode
              }, portionDisplayMode, cookingStateMode);

              const cleanSecondary = formatted.secondary_text
                ? String(formatted.secondary_text).replace(/^[\[\(\s]+|[\]\)\s]+$/g, '').trim()
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

      {/* SMART PLAN GUIDELINES ACCORDION */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px 14px', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div 
            onClick={() => setGuidelinesOpen(prev => !prev)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}
          >
            <ShieldCheck style={{ width: '15px', height: '15px', color: '#0F172A' }} />
            <strong style={{ fontSize: '0.8rem', color: '#0F172A' }}>إرشادات وقواعد الخطة</strong>
            <span style={{ fontSize: '0.68rem', color: '#64748B', background: '#F1F5F9', padding: '1px 6px', borderRadius: '6px' }}>
              {guidelinesOpen ? 'طي' : 'عرض (5 إرشادات)'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setPdfModalOpen(true)}
            style={{
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '0.7rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            تصدير PDF
          </button>
        </div>

        {guidelinesOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
            {SMART_GUIDELINES_MATRIX.map((guide) => (
              <div key={guide.id} style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '8px', padding: '8px 10px' }}>
                <strong style={{ fontSize: '0.74rem', color: '#0F172A', display: 'block', marginBottom: '2px' }}>{guide.title_ar}</strong>
                <span style={{ fontSize: '0.7rem', color: '#64748B', lineHeight: 1.4 }}>{guide.instruction_ar}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Supplements & Micronutrition Checklist Card */}
      {supplementsList.length > 0 && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong style={{ fontSize: '0.84rem', color: '#0F172A', fontWeight: 800 }}>المكملات الغذائية المعتمدة وبروتوكول الاستشفاء</strong>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
              تم تناول: <strong style={{ color: '#0F172A' }}>{supplementsList.filter(s => supplementsTaken[s.id]).length}</strong> / {supplementsList.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {supplementsList.map((supp) => {
              const isDone = Boolean(supplementsTaken[supp.id]);
              return (
                <div
                  key={supp.id}
                  onClick={() => toggleSupplementTaken(supp.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: `1px solid ${isDone ? '#BBF7D0' : '#E2E8F0'}`,
                    background: isDone ? '#F0FDF4' : '#F8FAFC',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <button
                      type="button"
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '8px',
                        border: isDone ? 'none' : '1px solid #CBD5E1',
                        background: isDone ? '#16A34A' : '#FFFFFF',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      {isDone && <Check size={13} strokeWidth={3} />}
                    </button>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.76rem', color: isDone ? '#166534' : '#0F172A', textDecoration: isDone ? 'line-through' : 'none' }}>
                          {supp.name}
                        </strong>
                        {supp.dose && (
                          <span style={{ fontSize: '0.68rem', color: '#64748B', background: '#E2E8F0', padding: '1px 5px', borderRadius: '6px', fontWeight: 600 }}>
                            {supp.dose}
                          </span>
                        )}
                        {supp.timing && (
                          <span style={{ fontSize: '0.68rem', color: '#0284C7', background: '#E0F2FE', padding: '1px 5px', borderRadius: '6px', fontWeight: 600 }}>
                            {supp.timing}
                          </span>
                        )}
                      </div>
                      {supp.notes && (
                        <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block', marginTop: '2px' }}>
                          {supp.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  {supp.cal > 0 && (
                    <div style={{ textAlign: 'left', flexShrink: 0, paddingRight: '8px' }}>
                      <strong style={{ fontSize: '0.74rem', color: '#0F172A', display: 'block' }}>{supp.cal} kcal</strong>
                      <span style={{ fontSize: '0.65rem', color: '#64748B' }} dir="ltr">P:{supp.p} C:{supp.c} F:{supp.f}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
