import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { applyEmergencyScenarioAdaptation, TRAVEL_EQUIPMENT_TYPES } from '../../../utils/emergencyScenarioEngine';

export default function EmergencyScenarioModal({
  isOpen,
  onClose,
  setActiveScenario,
  setMeals
}) {
  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(5px)',
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#FFFFFF',
          color: '#0F172A',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '20px',
          direction: 'rtl',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle style={{ width: '20px', height: '20px', color: '#D97706' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, color: '#0F172A' }}>
              تكييف الخطة مع الظروف والطارئ
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X style={{ width: '14px', height: '14px' }} />
          </button>
        </div>

        <p style={{ fontSize: '0.76rem', color: '#64748B', marginBottom: '16px', lineHeight: '1.4' }}>
          اختر ظرفك الحالي لتكييف جدول التمارين والوجبات فوراً وبكل سهولة:
        </p>

        {/* Scenarios Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* 1. Travel Hotel Gym */}
          <button
            type="button"
            onClick={() => {
              const adaptation = applyEmergencyScenarioAdaptation({
                scenario_type: 'TRAVEL',
                equipment_tier: TRAVEL_EQUIPMENT_TYPES.HOTEL_LIMITED_GYM,
                base_calories: 1870,
                base_protein_g: 155
              });
              setActiveScenario(adaptation);
              onClose();
              alert('تم تفعيل وضع السفر وتكييف التمارين لجيم الفندق (دامبلز وكابلات) وسعرات الصيانة!');
            }}
            style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'right',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <strong style={{ fontSize: '0.86rem', color: '#B45309', display: 'block' }}>1. وضع السفر - جيم فندق محدود (Hotel Gym)</strong>
            <span style={{ fontSize: '0.72rem', color: '#78350F' }}>تحويل أوتوماتيكي للأجهزة الحرة إلى دامبلز وكابلات وسعرات صيانة لتفادي الإجهاد.</span>
          </button>

          {/* 2. Travel Room Bodyweight */}
          <button
            type="button"
            onClick={() => {
              const adaptation = applyEmergencyScenarioAdaptation({
                scenario_type: 'TRAVEL',
                equipment_tier: TRAVEL_EQUIPMENT_TYPES.NO_GYM_ROOM,
                base_calories: 1870,
                base_protein_g: 155
              });
              setActiveScenario(adaptation);
              onClose();
              alert('تم تفعيل تمارين الغرفة بوزن الجسم وأحزمة المقاومة مع تحكم سلبي 3 ثوانٍ!');
            }}
            style={{
              background: '#F0F9FF',
              border: '1px solid #BAE6FD',
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'right',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <strong style={{ fontSize: '0.86rem', color: '#0284C7', display: 'block' }}>2. وضع السفر - بدون جيم (Room Workout)</strong>
            <span style={{ fontSize: '0.72rem', color: '#0369A1' }}>تمارين بوزن الجسم وأحزمة المقاومة مع التركيز على سرعة النزول السلبي 3s.</span>
          </button>

          {/* 3. Sickness & Recovery */}
          <button
            type="button"
            onClick={() => {
              const adaptation = applyEmergencyScenarioAdaptation({
                scenario_type: 'SICKNESS',
                base_calories: 1870,
                base_protein_g: 155
              });
              setActiveScenario(adaptation);
              onClose();
              alert('تم إيقاف المقاومة وتفعيل سعرات الصيانة وبروتوكول المناعة (فيتامين C، زنك، وترطيب إضافي)!');
            }}
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'right',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <strong style={{ fontSize: '0.86rem', color: '#DC2626', display: 'block' }}>3. وضع المرض والوعكة الصحية (Sickness Recovery)</strong>
            <span style={{ fontSize: '0.72rem', color: '#991B1B' }}>إيقاف الأوزان فوراً، رفع السوائل (+1L)، سعرات الصيانة، ومغذيات المناعة.</span>
          </button>

          {/* 4. High Stress & Exams */}
          <button
            type="button"
            onClick={() => {
              const adaptation = applyEmergencyScenarioAdaptation({
                scenario_type: 'HIGH_STRESS',
                base_calories: 1870,
                base_protein_g: 155
              });
              setActiveScenario(adaptation);
              onClose();
              alert('تم تقليص البرنامج إلى جلستين Full Body أسبوعياً (35 دقيقة) وتثبيت الماكروز!');
            }}
            style={{
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'right',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <strong style={{ fontSize: '0.86rem', color: '#059669', display: 'block' }}>4. وضع ضغط العمل والامتحانات (High-Stress)</strong>
            <span style={{ fontSize: '0.72rem', color: '#065F46' }}>جلستان Full Body أسبوعياً بأعلى كفاءة زمنية (35 دقيقة) ومصادر طعام سريعة.</span>
          </button>

          {/* 5. Dining Out & Evening Events */}
          <button
            type="button"
            onClick={() => {
              if (typeof setMeals === 'function') {
                setMeals(prev => prev.map((m, idx) => {
                  if (idx < 2) {
                    return {
                      ...m,
                      items: m.items.map(it => (it.c > 15 ? { ...it, amount: Math.round(it.amount * 0.6) } : it))
                    };
                  }
                  return m;
                }));
              }
              onClose();
              alert('تم تفعيل بروتوكول العزومة والمطاعم: تم حجز 600 سعرة لوجبة المساء مع التركيز على البروتين الصافي نهاراً!');
            }}
            style={{
              background: '#FFF7ED',
              border: '1px solid #FED7AA',
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'right',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <strong style={{ fontSize: '0.86rem', color: '#EA580C', display: 'block' }}>5. عزومة أو وجبة مطعم مسائية (Dining Out Mode)</strong>
            <span style={{ fontSize: '0.72rem', color: '#9A3412' }}>حجز بنك سعرات (600 سعرة) لوجبة المساء مع تركيز الوجبات النهارية على البروتين والسلطة.</span>
          </button>

          {/* 6. Swap Rest & Workout Day */}
          <button
            type="button"
            onClick={() => {
              onClose();
              alert('تم تبديل تمرين اليوم بيوم راحة بنجاح! تمرينك ترحل لليوم التالي مع الحفاظ على سلسلة أيام التزامك (Streak).');
            }}
            style={{
              background: '#EEF2FF',
              border: '1px solid #C7D2FE',
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'right',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <strong style={{ fontSize: '0.86rem', color: '#4F46E5', display: 'block' }}>6. تبديل يوم التمرين بيوم راحة (Rest Day Swap)</strong>
            <span style={{ fontSize: '0.72rem', color: '#3730A3' }}>لو جدولك انشغل اليوم؛ حوّل اليوم لاستشفاء وراحة وننقل التمرين لغد دون كسر الـ Streak!</span>
          </button>

        </div>
      </div>
    </div>
  );
}
