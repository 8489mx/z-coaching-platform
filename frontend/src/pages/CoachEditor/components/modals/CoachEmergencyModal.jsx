import React, { useState } from 'react';
import { Plane, AlertTriangle, Activity, Briefcase, Utensils, X, Check, RotateCcw } from 'lucide-react';
import { applyEmergencyScenarioAdaptation, TRAVEL_EQUIPMENT_TYPES } from '../../../../utils/emergencyScenarioEngine';

export function CoachEmergencyModal({
  isOpen,
  onClose,
  program,
  setProgram,
  showToast = () => {}
}) {
  const [selectedScenario, setSelectedScenario] = useState('TRAVEL_HOTEL');

  if (!isOpen) return null;

  const handleApplyAdaptation = (scenarioKey) => {
    if (!program || !setProgram) return;

    let scenarioType = 'TRAVEL';
    let equipmentTier = TRAVEL_EQUIPMENT_TYPES.HOTEL_LIMITED_GYM;
    let labelAr = '';

    if (scenarioKey === 'TRAVEL_HOTEL') {
      scenarioType = 'TRAVEL';
      equipmentTier = TRAVEL_EQUIPMENT_TYPES.HOTEL_LIMITED_GYM;
      labelAr = 'وضع السفر - جيم الفندق';
    } else if (scenarioKey === 'TRAVEL_ROOM') {
      scenarioType = 'TRAVEL';
      equipmentTier = TRAVEL_EQUIPMENT_TYPES.NO_GYM_ROOM;
      labelAr = 'وضع السفر - غرفة الفندق بوزن الجسم';
    } else if (scenarioKey === 'SICKNESS') {
      scenarioType = 'SICKNESS';
      labelAr = 'وضع الوعكة الصحية والاستشفاء';
    } else if (scenarioKey === 'HIGH_STRESS') {
      scenarioType = 'HIGH_STRESS';
      labelAr = 'وضع ضغط العمل والامتحانات';
    }

    const currentSessions = program.training?.sessions || [];
    const currentCal = Number(program.nutrition?.targets?.calories) || 2000;
    const currentP = Number(program.nutrition?.targets?.protein) || 150;
    const currentWater = Number(program.cardio?.daily_water_target_liters) || 3.5;

    const adaptedSessions = currentSessions.map(session => {
      const adapted = applyEmergencyScenarioAdaptation({
        scenario_type: scenarioType,
        equipment_tier: equipmentTier,
        base_calories: currentCal,
        base_protein_g: currentP,
        base_daily_water_liters: currentWater,
        base_sessions_per_week: currentSessions.length,
        exercises: session.exercises || []
      });
      return {
        ...session,
        exercises: adapted.adapted_exercises || session.exercises
      };
    });

    const adaptedOutcome = applyEmergencyScenarioAdaptation({
      scenario_type: scenarioType,
      equipment_tier: equipmentTier,
      base_calories: currentCal,
      base_protein_g: currentP,
      base_daily_water_liters: currentWater,
      base_sessions_per_week: currentSessions.length,
      exercises: []
    });

    setProgram(prev => ({
      ...prev,
      training: {
        ...prev.training,
        sessions: adaptedSessions,
        emergency_adaptation: {
          active: true,
          scenario_key: scenarioKey,
          label_ar: labelAr,
          applied_at: new Date().toISOString()
        }
      },
      nutrition: {
        ...prev.nutrition,
        targets: {
          ...prev.nutrition?.targets,
          calories: adaptedOutcome.nutrition_adjustment?.target_calories || prev.nutrition?.targets?.calories || 2000,
          protein: adaptedOutcome.nutrition_adjustment?.target_protein_g || prev.nutrition?.targets?.protein || 150
        }
      },
      cardio: {
        ...prev.cardio,
        daily_water_target_liters: adaptedOutcome.daily_water_target_liters || prev.cardio?.daily_water_target_liters || 3.5
      }
    }));

    showToast(`تم تفعيل (${labelAr}) وتكييف الخطة فسيولوجياً بنجاح`);
    onClose();
  };

  const scenariosList = [
    {
      id: 'TRAVEL_HOTEL',
      icon: Plane,
      color: '#0284C7',
      bg: '#F0F9FF',
      border: '#BAE6FD',
      title_ar: '1. وضع السفر - جيم فندق محدود (Hotel Gym)',
      summary_ar: 'تحويل أوتوماتيكي للأجهزة الحرة والبارات إلى دمبلز وكابلات وسعرات صيانة لتفادي الإجهاد العصبي أثناء السفر.'
    },
    {
      id: 'TRAVEL_ROOM',
      icon: Plane,
      color: '#7E22CE',
      bg: '#FAF5FF',
      border: '#E9D5FF',
      title_ar: '2. وضع السفر - غرفة الفندق بدون جيم (Room Workout)',
      summary_ar: 'تمارين بوزن الجسم وأحزمة المقاومة مع تحكم سلبي 3 ثوانٍ لتحقيق نفس التحفيز العضلي دون الحاجة لأي معدات.'
    },
    {
      id: 'SICKNESS',
      icon: Activity,
      color: '#DC2626',
      bg: '#FEF2F2',
      border: '#FECACA',
      title_ar: '3. وضع الوعكة الصحية والاستشفاء (Sickness Recovery)',
      summary_ar: 'إيقاف رفع الأثقال فوراً، التحول لسعرات الصيانة لمنع الهدم، رفع السوائل (+1.0 لتر)، وإرشادات المغذيات المناعية.'
    },
    {
      id: 'HIGH_STRESS',
      icon: Briefcase,
      color: '#059669',
      bg: '#ECFDF5',
      border: '#A7F3D0',
      title_ar: '4. وضع ضغط العمل والامتحانات (High-Stress & Exams)',
      summary_ar: 'تقليص البرنامج إلى جلستين Full Body سريعتين (35-40 دقيقة) للحفاظ على الكتلة العضلية بنسبة 100% بأقل وقت.'
    }
  ];

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }} 
      dir="rtl"
    >
      <div 
        style={{
          maxWidth: '560px',
          width: '100%',
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxHeight: '88vh',
          boxShadow: '0 20px 50px rgba(0,0,0,0.15)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={16} color="#D97706" />
              <span>محرك المرونة وسيناريوهات الطوارئ (Flexibility Engine)</span>
            </h4>
            <span style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px', display: 'block' }}>
              تكييف ذكي وفوري للخطة التدريبية والغذائية للمشترك وفق ظروفه الحالية
            </span>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={16} />
          </button>
        </div>

        {/* Current Status Badge */}
        {program.training?.emergency_adaptation?.active && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '8px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#92400E', fontWeight: 700 }}>
              الوضع النشط حالياً: {program.training.emergency_adaptation.label_ar}
            </span>
            <button
              type="button"
              onClick={() => {
                setProgram(prev => ({
                  ...prev,
                  training: {
                    ...prev.training,
                    emergency_adaptation: null
                  }
                }));
                showToast('تم إلغاء وضع الطوارئ والعودة للخطة القياسية');
              }}
              style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', color: '#0F172A', cursor: 'pointer', fontWeight: 700 }}
            >
              استعادة الخطة القياسية
            </button>
          </div>
        )}

        {/* Scenarios Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '420px', paddingRight: '2px' }}>
          {scenariosList.map(sc => {
            const Icon = sc.icon;
            const isSelected = selectedScenario === sc.id;
            return (
              <div
                key={sc.id}
                onClick={() => setSelectedScenario(sc.id)}
                style={{
                  background: isSelected ? sc.bg : '#F8FAFC',
                  border: isSelected ? `1.5px solid ${sc.border}` : '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FFFFFF', border: `1px solid ${sc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: sc.color, flexShrink: 0, marginTop: '2px' }}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '12px', color: '#0F172A', display: 'block' }}>{sc.title_ar}</strong>
                    <p style={{ fontSize: '10.5px', color: '#64748B', margin: '4px 0 0', lineHeight: 1.4 }}>{sc.summary_ar}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApplyAdaptation(sc.id);
                  }}
                  style={{
                    height: '30px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    background: sc.color,
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  تطبيق الوضع
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: '#F1F5F9',
              color: '#475569',
              border: 'none',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
}
