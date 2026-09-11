import React from 'react';
import { Utensils, X } from 'lucide-react';
import { getPrepOptionsForFood } from '../../../utils/culinaryRecipes';

export default function FoodPrepModal({ activePrepItem, onClose }) {
  if (!activePrepItem) return null;

  const recipeData = getPrepOptionsForFood(activePrepItem.code || activePrepItem.name);
  if (!recipeData) return null;

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Utensils style={{ width: '18px', height: '18px', color: '#0F172A' }} />
            <div>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                خلطات وطرق تحضير منزلية (3 خيارات)
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                {activePrepItem.name} ({activePrepItem.amount} {activePrepItem.unit})
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

        {/* Notice */}
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '10px 14px', marginBottom: '10px' }}>
          <p style={{ margin: 0, fontSize: '0.74rem', color: '#166534', lineHeight: 1.4 }}>
            <strong>ملاحظة هامة:</strong> السعرات والماكروز محسوبة من وزن الصنف الأساسي فقط؛ كافة الإضافات أدناه مجانية وصفرية السعرات لكسر الملل ورفع لذة الوجبة!
          </p>
        </div>

        {/* Equipment Alternative Notice */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px 14px', marginBottom: '16px' }}>
          <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569', lineHeight: 1.4 }}>
            <strong>بدائل أدوات الطهي:</strong> في حال عدم توفر قلاية هوائية (Air Fryer)، فإن الفرن المنزلي العادي (صينية بورق زبدة) أو الميكروويف المزود بخاصية الشواء (Grill) بديل ممتاز يعطي نفس القرمشة الصحية.
          </p>
        </div>

        {/* 3 Prep Options List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          {(recipeData.prep_options || []).map((opt, idx) => (
            <div 
              key={opt.id || idx}
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ background: '#0284C7', color: '#FFFFFF', borderRadius: '50%', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                  {idx + 1}
                </span>
                <h4 style={{ margin: 0, fontSize: '0.84rem', fontWeight: 800, color: '#0F172A' }}>
                  {opt.name_ar}
                </h4>
              </div>

              <p style={{ margin: '0 0 6px 0', fontSize: '0.74rem', color: '#475569', lineHeight: 1.4 }}>
                <strong>المكونات البيتية الحرة:</strong> {opt.free_ingredients_ar}
              </p>

              <p style={{ margin: 0, fontSize: '0.74rem', color: '#0369A1', lineHeight: 1.4 }}>
                <strong>التكنيك وسر الطهي:</strong> {opt.technique_ar}
              </p>
            </div>
          ))}
        </div>

        {recipeData.cooking_tip && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '10px 14px', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.74rem', color: '#92400E', fontWeight: 700 }}>
              سر الشيف: {recipeData.cooking_tip}
            </span>
          </div>
        )}

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
          حسناً، فهمت الطريقة
        </button>
      </div>
    </div>
  );
}
