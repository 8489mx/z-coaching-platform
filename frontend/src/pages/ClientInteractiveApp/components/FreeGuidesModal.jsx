import React from 'react';
import { Utensils, X } from 'lucide-react';
import { 
  FREE_BEVERAGES_CATALOG, 
  FREE_SEASONINGS_CATALOG, 
  COOKING_OILS_AND_SAUCES_GUIDE,
  SODIUM_AND_WATER_GUIDE,
  DINING_OUT_SURVIVAL_GUIDE 
} from '../../../utils/freeSeasoningsAndDrinks';

export default function FreeGuidesModal({ isOpen, onClose, freeGuideTab, setFreeGuideTab }) {
  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '0'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: '#FFFFFF',
          width: '100%',
          maxWidth: '440px',
          borderTopLeftRadius: '28px',
          borderTopRightRadius: '28px',
          padding: '24px 20px',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.15)',
          direction: 'rtl'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Utensils size={18} color="#0F172A" />
            <div>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {freeGuideTab === 'DRINKS' ? 'المشروبات الحرة وسكر الشاي والقهوة' :
                 freeGuideTab === 'OILS' ? 'زيوت الطهي وبخاخ الزيت والصوصات' :
                 freeGuideTab === 'SODIUM' ? 'بروتوكول الصوديوم وثبات الميزان' :
                 freeGuideTab === 'RESTAURANT' ? 'دليل الأكل بالمطاعم والعزومات' :
                 'دليل التوابل والبهارات ومحسنات الطعم'}
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                إرشادات علمية دقيقة لضمان أقصى التزام وحرق دهون
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X style={{ width: '16px', height: '16px', color: '#64748B' }} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', padding: '4px', borderRadius: '12px', marginBottom: '14px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[
            { id: 'DRINKS', label: 'المشروبات والسكر' },
            { id: 'OILS', label: 'الزيوت والصوصات' },
            { id: 'SODIUM', label: 'الصوديوم والميزان' },
            { id: 'RESTAURANT', label: 'أكل المطاعم' },
            { id: 'SPICES', label: 'البهارات والتوابل' }
          ].map(t => {
            const isSel = freeGuideTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setFreeGuideTab(t.id)}
                style={{
                  flex: '1 0 auto',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isSel ? '#0F172A' : 'transparent',
                  color: isSel ? '#FFFFFF' : '#475569',
                  fontSize: '0.74rem',
                  fontWeight: isSel ? 800 : 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          {freeGuideTab === 'DRINKS' && (
            FREE_BEVERAGES_CATALOG.map((drink) => (
              <div key={drink.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '0.84rem', color: '#0F172A' }}>{drink.name_ar}</strong>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: drink.id === 'TABLE_SUGAR_ALLOWANCE' ? '#D97706' : '#059669', background: drink.id === 'TABLE_SUGAR_ALLOWANCE' ? '#FEF3C7' : '#ECFDF5', padding: '2px 6px', borderRadius: '6px' }}>
                    {drink.calories_text}
                  </span>
                </div>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.74rem', color: '#475569', lineHeight: 1.4 }}>
                  {drink.desc_ar}
                </p>
                <small style={{ display: 'block', fontSize: '0.7rem', color: '#0284C7', fontWeight: 700 }}>
                  نصيحة: {drink.tip_ar}
                </small>
              </div>
            ))
          )}

          {freeGuideTab === 'OILS' && (
            COOKING_OILS_AND_SAUCES_GUIDE.map((oil) => (
              <div key={oil.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '0.84rem', color: '#0F172A' }}>{oil.title_ar}</strong>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: oil.id === 'BANNED_SAUCES' ? '#BE123C' : '#059669', background: oil.id === 'BANNED_SAUCES' ? '#FFE4E6' : '#ECFDF5', padding: '2px 6px', borderRadius: '6px' }}>
                    {oil.badge_ar}
                  </span>
                </div>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.74rem', color: '#475569', lineHeight: 1.4 }}>
                  {oil.desc_ar}
                </p>
                <small style={{ display: 'block', fontSize: '0.7rem', color: '#0F172A', fontWeight: 700 }}>
                  القاعدة الذهبية: {oil.rule_ar}
                </small>
              </div>
            ))
          )}

          {freeGuideTab === 'SODIUM' && (
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>
                {SODIUM_AND_WATER_GUIDE.title_ar}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {SODIUM_AND_WATER_GUIDE.key_points_ar.map((point, pIdx) => (
                  <div key={pIdx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284C7', marginTop: '6px', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.74rem', color: '#334155', lineHeight: 1.5 }}>
                      {point}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {freeGuideTab === 'RESTAURANT' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {DINING_OUT_SURVIVAL_GUIDE.rules_ar.map((r, rIdx) => (
                <div key={rIdx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '12px' }}>
                  <strong style={{ fontSize: '0.84rem', color: '#0F172A', display: 'block', marginBottom: '3px' }}>
                    {r.rule_title_ar}
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: '#475569', lineHeight: 1.4 }}>
                    {r.detail_ar}
                  </p>
                </div>
              ))}
            </div>
          )}

          {freeGuideTab === 'SPICES' && (
            FREE_SEASONINGS_CATALOG.map((seasoning) => (
              <div key={seasoning.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '12px' }}>
                <strong style={{ fontSize: '0.84rem', color: '#0F172A', display: 'block', marginBottom: '4px' }}>{seasoning.name_ar}</strong>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.74rem', color: '#334155', lineHeight: 1.4 }}>
                  <strong>الأصناف:</strong> {seasoning.items_ar}
                </p>
                <small style={{ display: 'block', fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>
                  طريقة الاستخدام: {seasoning.usage_ar}
                </small>
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            background: '#0F172A',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '14px',
            padding: '12px',
            fontSize: '0.84rem',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          إغلاق الدليل
        </button>
      </div>
    </div>
  );
}
