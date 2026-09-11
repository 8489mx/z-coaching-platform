import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ExerciseVideoModal from '../components/modals/ExerciseVideoModal';
import {
  ClientHeader,
  MealsTab,
  WorkoutTab,
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

export default function ClientInteractiveApp() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

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
  const [activeScenario, setActiveScenario] = useState(null);
  const [travelConfirmTarget, setTravelConfirmTarget] = useState(null);
  const [travelChosenTier, setTravelChosenTier] = useState(null);
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
    isSyncing,
    syncStatus,
    handleTriggerSync,
    workoutSession,
    setWorkoutSession,
    dailyReadiness,
    handleSetDailyReadiness,
    exerciseWorkingWeights,
    handleUpdateExerciseWeight,
    handleToggleExerciseCompleted,
    prehabCompleted,
    setPrehabCompleted,
    cardioPrescription
  } = useClientInteractiveData();

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans" dir="rtl" style={{ fontFamily: 'Alexandria, Cairo, sans-serif' }}>
      
      {/* Mobile Shell Wrapper */}
      <div 
        style={{
          width: '100%',
          maxWidth: '480px',
          background: '#FAFAFC',
          minHeight: '100vh',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          paddingBottom: '80px'
        }}
      >
        {/* Top App Header & Alerts */}
        <ClientHeader
          clientData={clientData}
          syncStatus={syncStatus}
          isSyncing={isSyncing}
          handleTriggerSync={handleTriggerSync}
          setEmergencyModalOpen={setEmergencyModalOpen}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
        />

        {/* MAIN BODY CONTENT */}
        <main style={{ padding: '16px', flex: 1 }}>
          
          {/* TAB 1: MEALS & SMART SWAPS */}
          {activeTab === 'meals' && (
            <MealsTab
              consumedMacros={consumedMacros}
              targetMacros={targetMacros}
              meals={meals}
              handleToggleMealCompleted={handleToggleMealCompleted}
              setActivePrepItem={setActivePrepItem}
              setActiveSwapItem={setActiveSwapItem}
              setSwapMealId={setSwapMealId}
              setFreeGuideModalOpen={setFreeGuideModalOpen}
              setPdfModalOpen={setPdfModalOpen}
              supplementsList={supplementsList}
              supplementsTaken={supplementsTaken}
              toggleSupplementTaken={toggleSupplementTaken}
            />
          )}

          {/* TAB 2: WORKOUT PLAN REFERENCE */}
          {activeTab === 'workout' && (
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
              setExerciseSwapTarget={setExerciseSwapTarget}
              exerciseWorkingWeights={exerciseWorkingWeights}
              handleUpdateExerciseWeight={handleUpdateExerciseWeight}
              handleToggleExerciseCompleted={handleToggleExerciseCompleted}
              setActiveVideoExercise={setActiveVideoExercise}
            />
          )}

        </main>

        {/* BOTTOM NAVIGATION BAR */}
        <ClientBottomNav
          activeTab={activeTab}
          onSwitchTab={handleSwitchTab}
          clientCode={clientData?.code}
        />

        {/* SMART FOOD SWAP POPUP MODAL WITH CLINICAL FILTERS */}
        <FoodSwapModal
          activeSwapItem={activeSwapItem}
          onClose={() => setActiveSwapItem(null)}
          onExecuteSwap={handleExecuteSwap}
          clinicalProfile={clientData?.clinicalProfile}
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
