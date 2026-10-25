import React, { useState } from 'react';
import { 
  Dumbbell, 
  Play, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  CheckCircle2, 
  ArrowLeftRight, 
  BookOpen, 
  Activity
} from 'lucide-react';
import { getPrehabRoutine } from '../../../utils/posturalPrehabEngine';
import { READINESS_GUIDANCE_AR } from '../../../utils/progressionEngine';
import ExerciseLogCard from './ExerciseLogCard';

export default function WorkoutTab({
  trainingWeeks = [],
  currentTrainingWeek,
  setCurrentTrainingWeek,
  selectedWeekData,
  workoutSession = { exercises: [] },
  dailyReadiness,
  handleSetDailyReadiness,
  clientData,
  prehabCompleted,
  setPrehabCompleted,
  cardioPrescription,
  cardioAdvisories = [],
  setExerciseSwapTarget,
  handleToggleExerciseCompleted,
  setActiveVideoExercise,
  selectedDay = 1,
  setSelectedDay,
  progression = null,
  isDeloadActive = false,
  sessionLogDraft = {},
  sessionLogStatus = null,
  updateLogDraft,
  repeatLastLog,
  submitSessionLog
}) {
  const [showWorkoutGuide, setShowWorkoutGuide] = useState(false);
  const [expandedTechnique, setExpandedTechnique] = useState({});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      
      {/* Days Selector Strip - Native to Workout Schedule */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        padding: '8px 10px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        display: 'flex',
        gap: '5px',
        overflowX: 'auto',
        scrollbarWidth: 'none'
      }}>
        {['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map((dayName, idx) => {
          const dayNum = idx + 1;
          const isSelected = selectedDay === dayNum;
          return (
            <button
              key={dayNum}
              type="button"
              onClick={() => setSelectedDay && setSelectedDay(dayNum)}
              style={{
                flex: '1 0 auto',
                padding: '7px 10px',
                borderRadius: '10px',
                fontSize: '0.7rem',
                fontWeight: isSelected ? 800 : 600,
                background: isSelected ? '#0284C7' : '#F8FAFC',
                color: isSelected ? '#FFFFFF' : '#64748B',
                border: isSelected ? '1px solid #0284C7' : '1px solid #E2E8F0',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 2px 6px rgba(2, 132, 199, 0.22)' : 'none',
                transition: 'all 0.15s ease',
                textAlign: 'center'
              }}
            >
              {dayName}
            </button>
          );
        })}
      </div>

      {/* Mesocycle Weeks Selector (دورة الميزوسايكل الفسيولوجية) */}
      {trainingWeeks.length > 0 && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '12px 14px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <div>
              <strong style={{ fontSize: '0.82rem', color: '#0F172A', display: 'block' }}>
                دورة التدريب (الميزوسايكل)
              </strong>
              <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                5 أسابيع متدرجة الحمل والاستشفاء
              </span>
            </div>
            {selectedWeekData && (
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '6px',
                background: selectedWeekData.phase === 'DELOAD' ? '#DCFCE7' : '#EFF6FF',
                color: selectedWeekData.phase === 'DELOAD' ? '#166534' : '#1D4ED8',
                border: selectedWeekData.phase === 'DELOAD' ? '1px solid #BBF7D0' : '1px solid #BFDBFE'
              }}>
                {selectedWeekData.phase === 'DELOAD' ? 'أسبوع كسر الإجهاد والاستشفاء (Deload -40% حجم)' : `الأسبوع ${selectedWeekData.week_number} • RIR ${selectedWeekData.target_rir ?? 2}`}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
            {trainingWeeks.map(w => {
              const isCurrent = currentTrainingWeek === w.week_number;
              const isDeload = w.phase === 'DELOAD';
              return (
                <button
                  key={w.week_number}
                  type="button"
                  onClick={() => setCurrentTrainingWeek(w.week_number)}
                  style={{
                    padding: '6px 4px',
                    borderRadius: '8px',
                    border: isCurrent 
                      ? (isDeload ? '2px solid #16A34A' : '2px solid #0284C7')
                      : '1px solid #E2E8F0',
                    background: isCurrent 
                      ? (isDeload ? '#DCFCE7' : '#0284C7') 
                      : (isDeload ? '#F0FDF4' : '#F8FAFC'),
                    color: isCurrent 
                      ? (isDeload ? '#166534' : '#FFFFFF') 
                      : (isDeload ? '#15803D' : '#475569'),
                    fontSize: '0.72rem',
                    fontWeight: isCurrent ? 800 : 600,
                    cursor: 'pointer',
                    textAlign: 'center',
                    lineHeight: 1.2
                  }}
                >
                  <div>أسبوع {w.week_number}</div>
                  <div style={{ fontSize: '0.62rem', opacity: 0.8, marginTop: '2px' }}>
                    {isDeload ? 'استشفاء' : `RIR ${w.target_rir ?? 2}`}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedWeekData?.phase === 'DELOAD' && (
            <div style={{
              background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
              border: '1px solid #86EFAC',
              borderRadius: '12px',
              padding: '10px 14px',
              marginTop: '4px',
              fontSize: '0.7rem',
              color: '#166534',
              lineHeight: 1.5
            }}>
              <strong style={{ display: 'block', marginBottom: '2px', fontWeight: 800 }}>
                بروتوكول أسبوع تفريغ الأحمال (Active Deload Protocol):
              </strong>
              تم تقليص عدد المجموعات بنسبة 40% وضبط تكرارات الاحتياط عند RIR 3-4 لتجديد النواقل العصبية والأوتار المفصلية مع الحفاظ التام على أوزانك المعتادة.
            </div>
          )}
        </div>
      )}

      {/* Workout Session Banner - Executive Light Theme */}
      <div style={{ 
        background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)', 
        border: '1px solid #BAE6FD', 
        borderRadius: '16px', 
        padding: '16px 18px', 
        boxShadow: '0 2px 8px rgba(2, 132, 199, 0.06)' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0369A1', fontSize: '0.7rem', fontWeight: 800 }}>
            <Dumbbell style={{ width: '14px', height: '14px', color: '#0284C7' }} />
            <span>جدول تمارين اليوم (دليل استرشادي سريع)</span>
          </div>
          <span style={{ 
            fontSize: '0.72rem', 
            color: '#0284C7', 
            fontWeight: 800, 
            background: '#FFFFFF', 
            border: '1px solid #BAE6FD', 
            padding: '2px 8px', 
            borderRadius: '8px' 
          }}>
            {workoutSession.exercises?.length || 0} تمارين
          </span>
        </div>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F172A', margin: '0 0 6px 0' }}>
          {workoutSession.title}
        </h2>
        <div style={{ fontSize: '0.7rem', color: '#475569', lineHeight: 1.4 }}>
          {workoutSession.warmupProtocol}
        </div>
      </div>

      {/* Autoregulation & Daily Readiness Hub */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        padding: '12px 16px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <strong style={{ fontSize: '0.82rem', color: '#0F172A', display: 'block' }}>
              الجاهزية اليومية والتنظيم الذاتي (RPE)
            </strong>
            <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
              حدد مستوى طاقتك اليومية لتكييف شدة التمرين وتجنب الإجهاد العصبي
            </span>
          </div>
          
          <div style={{ display: 'inline-flex', gap: '4px', background: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
            {[
              { id: 'OPTIMAL', label: 'نشيط ومستعد' },
              { id: 'MODERATE', label: 'طاقة معتدلة' },
              { id: 'FATIGUED', label: 'خمول / إجهاد' }
            ].map(opt => {
              const active = dailyReadiness === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSetDailyReadiness(opt.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: active ? 800 : 600,
                    background: active 
                      ? (opt.id === 'FATIGUED' ? '#FEE2E2' : (opt.id === 'OPTIMAL' ? '#DCFCE7' : '#FFFFFF'))
                      : 'transparent',
                    color: active 
                      ? (opt.id === 'FATIGUED' ? '#991B1B' : (opt.id === 'OPTIMAL' ? '#166534' : '#0284C7'))
                      : '#64748B',
                    border: active ? '1px solid rgba(0,0,0,0.06)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {dailyReadiness === 'FATIGUED' && (
          <div style={{
            background: '#FEF2F2',
            borderRight: '3px solid #EF4444',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '0.72rem',
            color: '#991B1B',
            lineHeight: '1.5',
            marginTop: '8px'
          }}>
            {READINESS_GUIDANCE_AR.FATIGUED}
          </div>
        )}
      </div>



      {/* POSTURAL & JOINT PREHAB PRIMER CARD (يظهر فقط لمن لديهم إصابات أو مشاكل قوامية مسجلة) */}
      {(() => {
        const userConditions = clientData?.clinicalProfile?.medical_conditions || [];
        if (!userConditions || userConditions.length === 0) return null;

        const prehabRoutine = getPrehabRoutine(
          userConditions,
          'UPPER'
        );

        if (!prehabRoutine || !prehabRoutine.has_prehab || !prehabRoutine.exercises || prehabRoutine.exercises.length === 0) {
          return null;
        }

        return (
          <div 
            style={{
              background: prehabCompleted ? '#F0FDF4' : '#FFFBEB',
              border: `1px solid ${prehabCompleted ? '#BBF7D0' : '#FDE68A'}`,
              borderRadius: '14px',
              padding: '16px',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck style={{ width: '18px', height: '18px', color: prehabCompleted ? '#166534' : '#92400E' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.86rem', fontWeight: 800, color: prehabCompleted ? '#166534' : '#92400E' }}>
                    {prehabRoutine.routine_title_ar}
                  </h3>
                  <span style={{ fontSize: '0.7rem', color: prehabCompleted ? '#15803D' : '#B45309' }}>
                    مخصص لحالتك: ({prehabRoutine.estimated_time_minutes} دقائق قبل بدء أوزان اليوم)
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPrehabCompleted(!prehabCompleted)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: prehabCompleted ? '#16A34A' : '#D97706',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <Check style={{ width: '14px', height: '14px' }} />
                <span>{prehabCompleted ? 'تم الإحماء التأهيلي' : 'تأكيد إتمام التأهيل'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {prehabRoutine.exercises.map((pEx, pIdx) => (
                <div 
                  key={pEx.id || pIdx}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.8rem', color: '#0F172A', display: 'block' }}>
                      {pIdx + 1}. {pEx.name_ar}
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: '#0284C7', fontWeight: 700 }}>
                      {pEx.prescription}
                    </span>
                    <small style={{ display: 'block', fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>
                      توجيه: {pEx.cue_ar}
                    </small>
                  </div>
                  <span style={{ background: '#F1F5F9', color: '#475569', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                    {pEx.target_area}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}



      {/* Exercises Streamlined Visual Workout Cards */}
      {isDeloadActive && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '10px 12px', fontSize: '0.76rem', color: '#1E3A8A', fontWeight: 700, lineHeight: 1.6 }}>
          أسبوع استشفاء معتمد من الكابتن: المجموعات أقل والشدة أخف (RIR 4). العب بنفس أوزانك أو أخف قليلاً بتكنيك نظيف، وبعد الأسبوع ده هترجع لأهداف دورة جديدة.
        </div>
      )}

      {!isDeloadActive && progression?.new_cycle_ready && (
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '12px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.76rem', color: '#166534', fontWeight: 700, lineHeight: 1.6 }}>
            انتهى أسبوع الاستشفاء: ابدأ دورة جديدة من الأسبوع 1. أوزانك الجديدة محسوبة تحت كل تمرين.
          </span>
          {currentTrainingWeek !== 1 && typeof setCurrentTrainingWeek === 'function' && (
            <button type="button" onClick={() => setCurrentTrainingWeek(1)} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#166534', color: '#FFFFFF', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer' }}>
              ابدأ الأسبوع 1
            </button>
          )}
        </div>
      )}

      {workoutSession.exercises && workoutSession.exercises.map((ex, exIdx) => {
        const isCompleted = Boolean(ex.completed || (ex.sets && ex.sets.length > 0 && ex.sets.every(s => s.completed)));
        const isTechniqueExpanded = Boolean(expandedTechnique[ex.id]);
        const restSec = ex.restDurationSec || (ex.isCompound ? 90 : 60);

        return (
          <div 
            key={ex.id}
            style={{
              background: isCompleted ? '#F0FDF4' : '#FFFFFF',
              borderRadius: '16px',
              border: isCompleted ? '1.5px solid #86EFAC' : '1px solid #E2E8F0',
              padding: '14px',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Top Row: Exercise Name, Type Badge & Swap Action */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: ex.isCompound ? '#B45309' : '#0284C7', background: ex.isCompound ? '#FEF3C7' : '#E0F2FE', padding: '1px 6px', borderRadius: '6px' }}>
                    {ex.isCompound ? 'تمرين مركب' : 'تمرين عزل'}
                  </span>
                  {isCompleted && (
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#16A34A', background: '#DCFCE7', padding: '1px 6px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      <CheckCircle2 style={{ width: '10px', height: '10px' }} />
                      <span>مكتمل</span>
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', margin: '0 0 2px 0', direction: 'ltr', textAlign: 'right' }}>
                  {exIdx + 1}. {ex.nameEn || ex.name}
                </h3>
                {(ex.nameAr || ex.name) && (
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
                    {ex.nameAr || ex.name}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setExerciseSwapTarget({ exercise: ex, exIdx })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#F8FAFC',
                  color: '#0F172A',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
                title="تبديل فوري في حال انشغال الجهاز أو زحمة الجيم"
              >
                <ArrowLeftRight style={{ width: '13px', height: '13px', color: '#0284C7' }} />
                <span>بديل زحمة الجيم</span>
              </button>
            </div>

            {/* Prescription Target Summary Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', background: '#F8FAFC', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.78rem' }}>
              <span style={{ fontWeight: 800, color: '#0F172A' }}>
                {ex.targetSets || (ex.sets && ex.sets.length) || 3} جولات × {ex.targetReps || '10-12'} تكرار
              </span>
              <span style={{ color: '#94A3B8' }}>•</span>
              <span style={{ fontWeight: 700, color: '#475569' }}>
                راحة: {restSec} ثانية
              </span>
              {ex.targetRir !== undefined && (
                <>
                  <span style={{ color: '#94A3B8' }}>•</span>
                  <span style={{ fontWeight: 700, color: '#2563EB' }}>
                    الشدة: RIR {ex.targetRir}
                  </span>
                </>
              )}
            </div>

            {/* Single smart log card: weight, last-set reps, effort (no per-set rows, no timers) */}
            {typeof updateLogDraft === 'function' && (
              <ExerciseLogCard
                exercise={ex}
                progressionEntry={progression?.exercises?.[ex.code || ex.id]}
                draft={sessionLogDraft[ex.code || ex.id]}
                onChange={updateLogDraft}
                onRepeatLast={repeatLastLog}
              />
            )}

            {/* Visual Movement Frames (Start & Finish Positions) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ position: 'relative', height: '115px', borderRadius: '10px', overflow: 'hidden', background: '#F1F5F9', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={ex.image_stretch || `/exercises/${ex.id}/0.jpg`}
                  alt="وضع البداية"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }}
                  onError={(e) => { 
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement?.querySelector('.img-fallback');
                    if (fallback) fallback.style.display = 'flex';
                  }}
                  loading="lazy"
                />
                <div className="img-fallback" style={{ display: 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#94A3B8', fontSize: '0.68rem', fontWeight: 700 }}>
                  <Dumbbell style={{ width: '18px', height: '18px', opacity: 0.6 }} />
                  <span>وضعية البداية</span>
                </div>
                <span style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(255, 255, 255, 0.92)', color: '#0F172A', border: '1px solid rgba(0, 0, 0, 0.08)', fontSize: '9px', fontWeight: 800, padding: '1px 6px', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                  1. وضع البداية
                </span>
              </div>

              <div style={{ position: 'relative', height: '115px', borderRadius: '10px', overflow: 'hidden', background: '#F1F5F9', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={ex.image_contraction || `/exercises/${ex.id}/1.jpg`}
                  alt="وضع الانقباض"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }}
                  onError={(e) => { 
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement?.querySelector('.img-fallback');
                    if (fallback) fallback.style.display = 'flex';
                  }}
                  loading="lazy"
                />
                <div className="img-fallback" style={{ display: 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#94A3B8', fontSize: '0.68rem', fontWeight: 700 }}>
                  <Dumbbell style={{ width: '18px', height: '18px', opacity: 0.6 }} />
                  <span>وضعية الانقباض</span>
                </div>
                <span style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(255, 255, 255, 0.92)', color: '#0F172A', border: '1px solid rgba(0, 0, 0, 0.08)', fontSize: '9px', fontWeight: 800, padding: '1px 6px', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                  2. وضع الانقباض
                </span>
              </div>
            </div>

            {/* Technique & Video Trigger Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Watch Video / Short */}
              <button
                type="button"
                onClick={() => setActiveVideoExercise(ex)}
                style={{
                  flex: 1,
                  height: '28px',
                  borderRadius: '6px',
                  background: '#F8FBFF',
                  color: '#284C7C',
                  border: '1px solid #D9E7F5',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#EBF4FE';
                  e.currentTarget.style.borderColor = '#C5DBF0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#F8FBFF';
                  e.currentTarget.style.borderColor = '#D9E7F5';
                }}
              >
                <Play style={{ width: '13px', height: '13px', fill: '#284C7C' }} />
                <span>مشاهدة التكنيك بالفيديو</span>
              </button>

              {/* Expand Cues & Safety */}
              <button
                type="button"
                onClick={() => setExpandedTechnique(prev => ({ ...prev, [ex.id]: !prev[ex.id] }))}
                style={{
                  height: '28px',
                  padding: '0 10px',
                  borderRadius: '8px',
                  background: '#F8FBFF',
                  color: '#284C7C',
                  border: '1px solid #D9E7F5',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#EBF4FE';
                  e.currentTarget.style.borderColor = '#C5DBF0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#F8FBFF';
                  e.currentTarget.style.borderColor = '#D9E7F5';
                }}
              >
                <ShieldCheck style={{ width: '13px', height: '13px', color: '#284C7C' }} />
                <span>إرشادات التكنيك</span>
                {isTechniqueExpanded ? <ChevronUp style={{ width: '12px', height: '12px' }} /> : <ChevronDown style={{ width: '12px', height: '12px' }} />}
              </button>
            </div>

            {/* Collapsible Coaching Cues & Injury Avoidance */}
            {isTechniqueExpanded && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '10px', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '6px', color: '#92400E' }}>
                <div>
                  <strong style={{ color: '#0F172A', display: 'block', marginBottom: '2px' }}>التكنيك السليم:</strong>
                  <span>{ex.safetyNote || ex.cues_ar || 'الحفاظ على المدى الحركي الكامل والتحكم في الوزن أثناء النزول.'}</span>
                </div>
                {ex.mistakes_ar && (
                  <div style={{ borderTop: '1px dashed #FCD34D', paddingTop: '6px', marginTop: '2px' }}>
                    <strong style={{ color: '#B45309', display: 'block', marginBottom: '2px' }}>أخطاء شائعة لتجنب الإصابة:</strong>
                    <span>{ex.mistakes_ar}</span>
                  </div>
                )}
              </div>
            )}

            {/* Optional Reference Mark (بدون أي مؤقت أو عد تنازلي) */}
            <button
              type="button"
              onClick={() => handleToggleExerciseCompleted(ex.id)}
              style={{
                width: '100%',
                height: '28px',
                borderRadius: '8px',
                background: isCompleted ? '#F0FDF4' : '#F8FAFC',
                color: isCompleted ? '#166534' : '#64748B',
                border: `1px solid ${isCompleted ? '#BBF7D0' : '#E2E8F0'}`,
                fontSize: '0.76rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Check style={{ width: '14px', height: '14px', color: isCompleted ? '#16A34A' : '#94A3B8' }} />
              <span>{isCompleted ? 'تم إنجاز هذا التمرين' : 'تحديد كمنجز (اختياري)'}</span>
            </button>

          </div>
        );
      })}

      {typeof submitSessionLog === 'function' && workoutSession.exercises?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            type="button"
            onClick={submitSessionLog}
            disabled={sessionLogStatus?.type === 'saving'}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: '#0F172A', color: '#FFFFFF', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            حفظ تسجيل الجلسة
          </button>
          {sessionLogStatus?.message && (
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textAlign: 'center', color: sessionLogStatus.type === 'error' ? '#B91C1C' : sessionLogStatus.type === 'success' ? '#15803D' : '#475569' }}>
              {sessionLogStatus.message}
            </div>
          )}
        </div>
      )}

      {/* Cardio Prescription Card (موقعه الرياضي السليم: بعد انتهاء التمارين) */}
      {cardioPrescription && (
        <div style={{ 
          background: 'linear-gradient(135deg, #ECFEFF 0%, #E0F2FE 100%)', 
          border: '1px solid #BAE6FD', 
          borderRadius: '16px', 
          padding: '14px 16px',
          boxShadow: '0 2px 8px rgba(2, 132, 199, 0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity style={{ width: '16px', height: '16px', color: '#0284C7' }} />
              <h3 style={{ margin: 0, fontSize: '0.86rem', fontWeight: 800, color: '#0369A1' }}>
                {cardioPrescription.protocol_title_ar || 'كارديو نهاية الحصة التدريبية'}
              </h3>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0284C7', background: '#FFFFFF', border: '1px solid #BAE6FD', padding: '2px 8px', borderRadius: '6px' }}>
              {cardioPrescription.duration_minutes} دقيقة | {cardioPrescription.sessions_per_week} جلسات/أسبوع
            </span>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #BAE6FD', borderRadius: '10px', padding: '8px 12px', marginBottom: '6px' }}>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#0F172A', lineHeight: 1.4 }}>
              <strong>الشدة المستهدفة (Zone 2):</strong> {cardioPrescription.talk_test_cue_ar}
            </p>
          </div>

          <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569' }}>
            <strong>الجهاز المقترح:</strong> {cardioPrescription.suggested_settings_ar || cardioPrescription.equipment_recommendation}
          </p>
          {cardioAdvisories.map((note) => (
            <p key={note} style={{ margin: '8px 0 0', fontSize: '0.72rem', color: '#92400E', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '8px 10px', lineHeight: 1.7 }}>
              {note}
            </p>
          ))}
        </div>
      )}

      {/* Workout Execution & Reading Guide Card (دليل رموز الخطة) */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        padding: '12px 16px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen style={{ width: '16px', height: '16px', color: '#0284C7' }} />
            <div>
              <strong style={{ fontSize: '0.82rem', color: '#0F172A', display: 'block' }}>
                دليل رموز الخطة وإرشادات التنفيذ
              </strong>
              <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                كيف تتدرب باحترافية وتحدد أوزانك وتفهم الرموز
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowWorkoutGuide(prev => !prev)}
            style={{
              background: showWorkoutGuide ? '#F1F5F9' : '#E0F2FE',
              color: showWorkoutGuide ? '#475569' : '#0369A1',
              border: 'none',
              borderRadius: '8px',
              padding: '5px 12px',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>{showWorkoutGuide ? 'إخفاء الدليل' : 'استعراض الدليل'}</span>
            {showWorkoutGuide ? <ChevronUp style={{ width: '12px', height: '12px' }} /> : <ChevronDown style={{ width: '12px', height: '12px' }} />}
          </button>
        </div>

        {showWorkoutGuide && (
          <div style={{ marginTop: '12px', borderTop: '1px solid #F1F5F9', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            
            {/* Rule 1: Working Sets */}
            <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '10px 12px', border: '1px solid #E2E8F0' }}>
              <strong style={{ fontSize: '0.78rem', color: '#0F172A', display: 'block', marginBottom: '3px' }}>
                1. مجموعات العمل الفعالة (Working Sets)
              </strong>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569', lineHeight: '1.5' }}>
                المجموعات المكتوبة في الجدول (مثال: 3 جولات) هي مجموعات عمل أساسية بنفس الوزن التشغيلي. التسخين يتم مسبقاً بوزن خفيف (بروتوكول RAMP) ولا يُحسب ضمن جولات الجدول إطلاقاً.
              </p>
            </div>

            {/* Rule 2: Initial Weight Selection */}
            <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '10px 12px', border: '1px solid #E2E8F0' }}>
              <strong style={{ fontSize: '0.78rem', color: '#0F172A', display: 'block', marginBottom: '3px' }}>
                2. كيف تحدد وزنك؟
              </strong>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569', lineHeight: '1.5' }}>
                اختر وزناً يمكنك من إتمام التكرارات المطلوبة مع إبقاء 1-2 عدة في الاحتياط قبل الفشل العضلي (RIR 1-2) بتكنيك محكم وآمن، ثم ثبّت هذا الوزن كمرجع لجلساتك.
              </p>
            </div>

            {/* Rule 3: Rep Range */}
            <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '10px 12px', border: '1px solid #E2E8F0' }}>
              <strong style={{ fontSize: '0.78rem', color: '#0F172A', display: 'block', marginBottom: '3px' }}>
                3. النطاق التكراري (مثال: 8-10 عدات)
              </strong>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569', lineHeight: '1.5' }}>
                اختيار وزن يجعلك تصل للإجهاد المستهدف ضمن هذا المدى؛ إذا استطعت تجاوز الحد الأقصى بتكنيك سليم فالوزن خفيف، وإذا عجزت قبل الحد الأدنى فالوزن ثقيل.
              </p>
            </div>

            {/* Rule 4: Rest Periods */}
            <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '10px 12px', border: '1px solid #E2E8F0' }}>
              <strong style={{ fontSize: '0.78rem', color: '#0F172A', display: 'block', marginBottom: '3px' }}>
                4. فترات الراحة بين الجولات
              </strong>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569', lineHeight: '1.5' }}>
                الراحة المحددة إلزامية لإعادة شحن مركبات الطاقة الخلوية (ATP) واستشفاء الجهاز العصبي، لرفع نفس الوزن في المجموعة التالية بكامل القوة.
              </p>
            </div>

            {/* Rule 5: Progressive Overload */}
            <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '10px 12px', border: '1px solid #E2E8F0' }}>
              <strong style={{ fontSize: '0.78rem', color: '#0F172A', display: 'block', marginBottom: '3px' }}>
                5. متى ترفع الوزن؟ (الزيادة التدريجية)
              </strong>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569', lineHeight: '1.5' }}>
                ترفع الوزن في الأسبوع التالي بمقدار 2.5 إلى 5 كجم فقط عندما تنجح في إتمام الحد الأقصى للتكرارات في كافة مجموعات التمرين بنفس الوزن الحالي.
              </p>
            </div>

            {/* Rule 6: Equipment Swap */}
            <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '10px 12px', border: '1px solid #E2E8F0' }}>
              <strong style={{ fontSize: '0.78rem', color: '#0F172A', display: 'block', marginBottom: '3px' }}>
                6. زر "بديل زحمة الجيم"
              </strong>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569', lineHeight: '1.5' }}>
                في حال كان الجهاز المطلوب مشغولاً في الصالة، اضغط على "بديل زحمة الجيم" لتحصل فوراً على التمرين المطابق لنفس الزاوية العضلية دون تعطيل وقتك.
              </p>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
