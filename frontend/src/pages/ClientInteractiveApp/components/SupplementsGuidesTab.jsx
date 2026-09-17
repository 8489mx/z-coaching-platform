import React, { useState } from 'react';
import { Check, BookOpen, Coffee, UtensilsCrossed, ChevronDown, ChevronUp } from 'lucide-react';
import { getTravelDiningBlueprints } from '../../../utils/foodSwapEngine';
import { SMART_GUIDELINES_MATRIX } from '../../../utils/pdfExportEngine';

export default function SupplementsGuidesTab({
  supplementsList = [],
  supplementsTaken = {},
  toggleSupplementTaken,
  setFreeGuideModalOpen,
  setFreeGuideTab
}) {
  const [diningBlueprints] = useState(() => getTravelDiningBlueprints());
  const [guidelinesOpen, setGuidelinesOpen] = useState(true);
  const [diningOpen, setDiningOpen] = useState(false);

  const completedSuppsCount = supplementsList.filter(s => supplementsTaken[s.id]).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      
      {/* Tab Overview Banner */}
      <div 
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '14px 16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <h2 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            المكملات والأدلة المرجعية
          </h2>
          <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block', marginTop: '2px' }}>
            بروتوكول المغذيات الدقيقة وإرشادات الالتزام المعتمدة
          </span>
        </div>
        <span 
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: '#0284C7',
            background: '#F0F9FF',
            border: '1px solid #BAE6FD',
            padding: '3px 8px',
            borderRadius: '8px'
          }}
        >
          أدلة معتمدة
        </span>
      </div>

      {/* 1. Daily Supplements & Micronutrition Checklist */}
      <div 
        style={{ 
          background: '#FFFFFF', 
          border: '1px solid #E2E8F0', 
          borderRadius: '16px', 
          padding: '14px 16px', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)' 
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <strong style={{ fontSize: '0.84rem', color: '#0F172A', fontWeight: 800, display: 'block' }}>
              المكملات الغذائية اليومية
            </strong>
            <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
              بروتوكول الاستشفاء العضلي وسد العجز الغذائي
            </span>
          </div>
          {supplementsList.length > 0 && (
            <span style={{ fontSize: '0.72rem', color: '#0284C7', fontWeight: 700, background: '#F0F9FF', padding: '2px 8px', borderRadius: '8px', border: '1px solid #BAE6FD' }}>
              تم تناول: <strong style={{ color: '#0F172A' }}>{completedSuppsCount}</strong> / {supplementsList.length}
            </span>
          )}
        </div>

        {supplementsList.length === 0 ? (
          <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
              لا توجد مكملات إضافية مقررة في هذا الطور. يعتمد نظامك بالكامل على مصادر الغذاء الطبيعي المتكامل.
            </span>
          </div>
        ) : (
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
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${isDone ? '#BBF7D0' : '#E2E8F0'}`,
                    background: isDone ? '#F0FDF4' : '#F8FAFC',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    <button
                      type="button"
                      style={{
                        width: '22px',
                        height: '22px',
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
                      {isDone && <Check size={14} strokeWidth={3} />}
                    </button>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.78rem', color: isDone ? '#166534' : '#0F172A', textDecoration: isDone ? 'line-through' : 'none' }}>
                          {supp.name}
                        </strong>
                        {supp.dose && (
                          <span style={{ fontSize: '0.66rem', color: '#475569', background: '#E2E8F0', padding: '1px 6px', borderRadius: '6px', fontWeight: 600 }}>
                            {supp.dose}
                          </span>
                        )}
                        {supp.timing && (
                          <span style={{ fontSize: '0.66rem', color: '#0284C7', background: '#E0F2FE', padding: '1px 6px', borderRadius: '6px', fontWeight: 600 }}>
                            {supp.timing}
                          </span>
                        )}
                      </div>
                      {supp.notes && (
                        <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block', marginTop: '2px', lineHeight: 1.3 }}>
                          {supp.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  {supp.cal > 0 && (
                    <div style={{ textAlign: 'left', flexShrink: 0, paddingRight: '8px' }}>
                      <strong style={{ fontSize: '0.74rem', color: '#0F172A', display: 'block' }}>{supp.cal} kcal</strong>
                      <span style={{ fontSize: '0.64rem', color: '#64748B' }} dir="ltr">P:{supp.p} C:{supp.c} F:{supp.f}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Free Zero-Calorie Beverages & Seasonings Guide Launcher */}
      <div 
        style={{ 
          background: '#FFFFFF', 
          border: '1px solid #E2E8F0', 
          borderRadius: '16px', 
          padding: '14px 16px', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)' 
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <Coffee size={17} />
            </div>
            <div>
              <strong style={{ fontSize: '0.84rem', color: '#0F172A', fontWeight: 800, display: 'block' }}>
                المشروبات والتوابل الحرة (Zero-Calorie)
              </strong>
              <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                مسموحات مفتوحة بدون احتساب سعرات
              </span>
            </div>
          </div>
        </div>

        <p style={{ fontSize: '0.72rem', color: '#475569', margin: '0 0 10px 0', lineHeight: 1.4 }}>
          القهوة السادة، الشاي الأخضر، القرفة، الزنجبيل، المياه الغازية الصفرية، وكافة البهارات والأعشاب الطبيعية لا تكسر الصيام ولا تؤثر على عجز السعرات.
        </p>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => {
              if (setFreeGuideTab) setFreeGuideTab('DRINKS');
              setFreeGuideModalOpen(true);
            }}
            style={{
              flex: 1,
              background: '#F0FDF4',
              color: '#166534',
              border: '1px solid #BBF7D0',
              borderRadius: '8px',
              padding: '8px 10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            استعراض المشروبات الحرة
          </button>
          <button
            type="button"
            onClick={() => {
              if (setFreeGuideTab) setFreeGuideTab('SPICES');
              setFreeGuideModalOpen(true);
            }}
            style={{
              flex: 1,
              background: '#FFFBEB',
              color: '#92400E',
              border: '1px solid #FDE68A',
              borderRadius: '8px',
              padding: '8px 10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            البهارات والصلصات المسموحة
          </button>
        </div>
      </div>

      {/* 3. Dining Blueprints (خطط المطاعم والسفر الجاهزة) */}
      <div 
        style={{ 
          background: '#FFFFFF', 
          border: '1px solid #E2E8F0', 
          borderRadius: '16px', 
          padding: '14px 16px', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)' 
        }}
      >
        <div 
          onClick={() => setDiningOpen(prev => !prev)}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F0F9FF', border: '1px solid #BAE6FD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
              <UtensilsCrossed size={17} />
            </div>
            <div>
              <strong style={{ fontSize: '0.84rem', color: '#0F172A', fontWeight: 800, display: 'block' }}>
                خطط المطاعم والعزومات (Dining Blueprints)
              </strong>
              <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                خيارات ذكية جاهزة للالتزام خارج المنزل
              </span>
            </div>
          </div>
          <button 
            type="button" 
            style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            {diningOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        {diningOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
            {diningBlueprints.map(bp => (
              <div key={bp.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '0.78rem', color: '#0369A1' }}>{bp.title_ar}</strong>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '1px 6px', borderRadius: '6px' }} dir="ltr">
                    ~{bp.estimated_macros.calories_kcal} kcal • P: {bp.estimated_macros.protein_g}g
                  </span>
                </div>
                <ul style={{ margin: 0, paddingRight: '16px', fontSize: '0.7rem', color: '#334155', lineHeight: 1.4 }}>
                  {bp.ordered_items_ar.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Smart Guidelines Matrix (إرشادات وقواعد الالتزام) */}
      <div 
        style={{ 
          background: '#FFFFFF', 
          border: '1px solid #E2E8F0', 
          borderRadius: '16px', 
          padding: '14px 16px', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)' 
        }}
      >
        <div 
          onClick={() => setGuidelinesOpen(prev => !prev)}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F172A' }}>
              <BookOpen size={17} />
            </div>
            <div>
              <strong style={{ fontSize: '0.84rem', color: '#0F172A', fontWeight: 800, display: 'block' }}>
                قواعد وإرشادات الالتزام التنفيذية
              </strong>
              <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                توجيهات علمية للوصول لأعلى معدل استجابة
              </span>
            </div>
          </div>
          <button 
            type="button" 
            style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            {guidelinesOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        {guidelinesOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
            {SMART_GUIDELINES_MATRIX.map((guide) => (
              <div key={guide.id} style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '10px', padding: '9px 12px' }}>
                <strong style={{ fontSize: '0.75rem', color: '#0F172A', display: 'block', marginBottom: '2px' }}>
                  {guide.title_ar}
                </strong>
                <span style={{ fontSize: '0.7rem', color: '#64748B', lineHeight: 1.4 }}>
                  {guide.instruction_ar}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
