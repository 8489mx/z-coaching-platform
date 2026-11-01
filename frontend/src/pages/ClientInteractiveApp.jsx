import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ExerciseVideoModal from '../components/modals/ExerciseVideoModal';
import {
  ClientHeader,
  MealsTab,
  WorkoutTab,
  SupplementsGuidesTab,
  PlanProfileTab,
  FreeGuidesModal,
  FoodPrepModal,
  MasterPdfModal,
  FoodSwapModal,
  ExerciseSwapModal,
  EmergencyScenarioModal,
  TravelConfirmModal,
  ReturnTravelModal,
  ClientBottomNav
} from './ClientInteractiveApp/components';
import { useClientInteractiveData } from './ClientInteractiveApp/hooks/useClientInteractiveData';

function PendingPlanNotice({ badge, badgeBg, badgeColor, title, desc, onNavigate }) {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '32px 20px', textAlign: 'center', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)', margin: '12px 0' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px 14px', borderRadius: '9999px', background: badgeBg, color: badgeColor, fontSize: '12px', fontWeight: 700, marginBottom: '14px' }}>
        {badge}
      </div>
      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>{title}</h3>
      <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6, marginBottom: '20px' }}>{desc}</p>
      <button type="button" onClick={onNavigate} style={{ padding: '10px 22px', borderRadius: '8px', background: '#0F172A', color: '#FFFFFF', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer' }}>
        استعراض وتعديل استمارة التقييم
      </button>
    </div>
  );
}

export default function ClientInteractiveApp() {
  const [searchParams, setSearchParams] = useSearchParams();
  const _navigate = useNavigate();

  // Tab Selection ('meals' | 'workout' | 'checkin')
  const rawTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(rawTab || 'meals');

  const handleSwitchTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Local UI Modal Visibility States
  const [activePrepItem, setActivePrepItem] = useState(null);
  const [freeGuideModalOpen, setFreeGuideModalOpen] = useState(false);
  const [freeGuideTab, setFreeGuideTab] = useState('DRINKS');
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [_activeScenario, setActiveScenario] = useState(null);
  const [travelConfirmTarget, setTravelConfirmTarget] = useState(null);
  const [_travelChosenTier, setTravelChosenTier] = useState(null);
  const [returnTravelModalOpen, setReturnTravelModalOpen] = useState(false);
  const [exerciseSwapTarget, setExerciseSwapTarget] = useState(null);
  const [activeVideoExercise, setActiveVideoExercise] = useState(null);

  // Consolidated Client & Program Interactive Data
  const {
    clientData,
    currentTrainingWeek,
    setCurrentTrainingWeek,
    trainingWeeks,
    selectedWeekData,
    selectedDay,
    setSelectedDay,
    meals,
    setMeals,
    fastingContext,
    targetMacros,
    consumedMacros,
    supplementsList,
    supplementsTaken,
    toggleSupplementTaken,
    handleToggleMealCompleted,
    handleExecuteSwap,
    activeSwapItem,
    setActiveSwapItem,
    setSwapMealId,
    isOffline,
    isSyncing,
    syncStatus,
    handleTriggerSync,
    workoutSession,
    setWorkoutSession,
    dailyReadiness,
    handleSetDailyReadiness,
    handleToggleExerciseCompleted,
    prehabCompleted,
    setPrehabCompleted,
    cardioPrescription,
    cardioAdvisories,
    progression,
    isDeloadActive,
    sessionLogDraft,
    sessionLogStatus,
    updateLogDraft,
    repeatLastLog,
    submitSessionLog
  } = useClientInteractiveData();

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans" dir="rtl" style={{ fontFamily: "'Segoe UI', 'IBM Plex Sans Arabic', -apple-system, BlinkMacSystemFont, 'Tahoma', sans-serif", width: '100%', overflowX: 'hidden' }}>
      
      {/* Mobile Shell Wrapper */}
      <div 
        style={{
          width: '100%',
          maxWidth: '480px',
          margin: '0 auto',
          background: '#FAFAFC',
          minHeight: '100vh',
          boxShadow: '0 0 30px rgba(15, 23, 42, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          paddingBottom: '80px',
          overflowX: 'hidden'
        }}
      >
        {/* Top App Header & Alerts */}
        <ClientHeader
          clientData={clientData}
          isOffline={isOffline}
          syncStatus={syncStatus}
          isSyncing={isSyncing}
          handleTriggerSync={handleTriggerSync}
        />

        {/* MAIN BODY CONTENT */}
        <main style={{ padding: '16px', flex: 1 }}>
          
          {/* TAB 1: MEALS & SMART SWAPS */}
          {activeTab === 'meals' && (
            (clientData.plan_approval_status === 'APPROVED' || clientData.plan_approval_status === 'PUBLISHED') ? (
              <MealsTab
                consumedMacros={consumedMacros}
                targetMacros={targetMacros}
                meals={meals}
                fastingContext={fastingContext}
                handleToggleMealCompleted={handleToggleMealCompleted}
                setActivePrepItem={setActivePrepItem}
                setActiveSwapItem={setActiveSwapItem}
                setSwapMealId={setSwapMealId}
              />
            ) : (
              <PendingPlanNotice
                badge="خطة التغذية قيد المراجعة"
                badgeBg="#F0F9FF"
                badgeColor="#0284C7"
                title="جاري إعداد جدول الوجبات والماكروز"
                desc="يقوم الكوتش بمراجعة احتياجك الأيضي وتصميم توزيع الوجبات والبدائل الذكية. ستظهر وجباتك اليومية كاملة فور اعتماد الخطة ونشرها."
                onNavigate={() => _navigate('/intake/form')}
              />
            )
          )}

          {/* TAB 2: WORKOUT PLAN REFERENCE */}
          {activeTab === 'workout' && (
            (clientData.plan_approval_status === 'APPROVED' || clientData.plan_approval_status === 'PUBLISHED') ? (
              <WorkoutTab
                trainingWeeks={trainingWeeks}
                currentTrainingWeek={currentTrainingWeek}
                setCurrentTrainingWeek={setCurrentTrainingWeek}
                selectedWeekData={selectedWeekData}
                workoutSession={workoutSession}
                dailyReadiness={dailyReadiness}
                handleSetDailyReadiness={handleSetDailyReadiness}
                clientData={clientData}
                prehabCompleted={prehabCompleted}
                setPrehabCompleted={setPrehabCompleted}
                cardioPrescription={cardioPrescription}
                cardioAdvisories={cardioAdvisories}
                setExerciseSwapTarget={setExerciseSwapTarget}
                handleToggleExerciseCompleted={handleToggleExerciseCompleted}
                setActiveVideoExercise={setActiveVideoExercise}
                selectedDay={selectedDay}
                setSelectedDay={setSelectedDay}
                progression={progression}
                isDeloadActive={isDeloadActive}
                sessionLogDraft={sessionLogDraft}
                sessionLogStatus={sessionLogStatus}
                updateLogDraft={updateLogDraft}
                repeatLastLog={repeatLastLog}
                submitSessionLog={submitSessionLog}
              />
            ) : (
              <PendingPlanNotice
                badge="جدول التمارين قيد الإعداد"
                badgeBg="#F0FDF4"
                badgeColor="#16A34A"
                title="جاري تصميم البرنامج التدريبي الإكلينيكي"
                desc="يتم الآن بناء الميزوسيكل التدريبي وتحديد المجموعات والأوزان المستهدفة ومحاذير الإصابات. ستظهر الجداول والتمارين فور اعتماد الخطة."
                onNavigate={() => _navigate('/intake/form')}
              />
            )
          )}

          {/* TAB 3: SUPPLEMENTS & GUIDES */}
          {activeTab === 'supplements' && (
            <SupplementsGuidesTab
              supplementsList={supplementsList}
              supplementsTaken={supplementsTaken}
              toggleSupplementTaken={toggleSupplementTaken}
              setFreeGuideModalOpen={setFreeGuideModalOpen}
              setFreeGuideTab={setFreeGuideTab}
            />
          )}

          {/* TAB 4: PLAN PROFILE & CHECK-IN */}
          {activeTab === 'plan' && (
            <PlanProfileTab
              clientData={clientData}
              setEmergencyModalOpen={setEmergencyModalOpen}
              setPdfModalOpen={setPdfModalOpen}
            />
          )}

        </main>

        {/* BOTTOM NAVIGATION BAR */}
        <ClientBottomNav
          activeTab={activeTab}
          onSwitchTab={handleSwitchTab}
        />

        {/* SMART FOOD SWAP POPUP MODAL WITH CLINICAL FILTERS */}
        <FoodSwapModal
          activeSwapItem={activeSwapItem}
          onClose={() => setActiveSwapItem(null)}
          onExecuteSwap={handleExecuteSwap}
          clinicalProfile={clientData?.clinicalProfile}
          fastingContext={fastingContext}
        />

        {/* ZERO-CALORIE FREE BEVERAGES & SEASONINGS MODAL */}
        <FreeGuidesModal
          isOpen={freeGuideModalOpen}
          onClose={() => setFreeGuideModalOpen(false)}
          freeGuideTab={freeGuideTab}
          setFreeGuideTab={setFreeGuideTab}
        />

        {/* ACCESSIBLE HOME PREP OPTIONS MODAL */}
        <FoodPrepModal
          activePrepItem={activePrepItem}
          onClose={() => setActivePrepItem(null)}
        />

        {/* 1-CLICK MASTER PDF PLAN MODAL */}
        <MasterPdfModal
          isOpen={pdfModalOpen}
          onClose={() => setPdfModalOpen(false)}
          clientName={clientData?.name || 'المشترك'}
          clientCode={clientData?.code || '882'}
          packageTier={clientData?.package || 'MAX'}
          currentWeek={currentTrainingWeek}
        />

        {/* CONFIRMATION MODAL FOR TRAVEL MODE */}
        <TravelConfirmModal
          travelConfirmTarget={travelConfirmTarget}
          onClose={() => setTravelConfirmTarget(null)}
          onConfirm={() => {
            if (travelConfirmTarget?.action) travelConfirmTarget.action();
            setTravelChosenTier(travelConfirmTarget);
            setTravelConfirmTarget(null);
            setEmergencyModalOpen(false);
          }}
        />

        {/* RETURN FROM TRAVEL MODAL (POST-VACATION REFLECTION) */}
        <ReturnTravelModal
          isOpen={returnTravelModalOpen}
          onClose={() => setReturnTravelModalOpen(false)}
          onReset={() => {
            setActiveScenario(null);
            setTravelChosenTier(null);
            setReturnTravelModalOpen(false);
          }}
        />

        {/* SMART EXERCISE SWAP MODAL (FOR BUSY GYM MACHINES) */}
        <ExerciseSwapModal
          exerciseSwapTarget={exerciseSwapTarget}
          clientInjuries={clientData?.injuries || clientData?.training?.injuries || clientData?.medical?.conditions || []}
          onClose={() => setExerciseSwapTarget(null)}
          setWorkoutSession={setWorkoutSession}
        />

        {/* EMERGENCY SCENARIO ADAPTATION MODAL */}
        <EmergencyScenarioModal
          isOpen={emergencyModalOpen}
          onClose={() => setEmergencyModalOpen(false)}
          setActiveScenario={setActiveScenario}
          setMeals={setMeals}
        />

        {/* Exercise Video Modal for Client Workout */}
        {activeVideoExercise && (
          <ExerciseVideoModal
            exercise={activeVideoExercise}
            onClose={() => setActiveVideoExercise(null)}
          />
        )}

      </div>
    </div>
  );
}
