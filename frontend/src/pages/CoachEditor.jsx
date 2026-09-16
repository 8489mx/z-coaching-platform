import React from 'react';
import { Dumbbell, Utensils, Activity } from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import CoachEditorNutritionTab from '../features/coach/components/CoachEditorNutritionTab';
import LabBiomarkersReviewStudio from '../components/clinical/LabBiomarkersReviewStudio';
import ExerciseVideoModal from '../components/modals/ExerciseVideoModal';
import {
  CoachClientsQueue,
  CoachHeaderBar,
  CoachTrainingTab,
  CoachCardioHabitsTab,
  CoachSwapFoodModal,
  CoachAddFoodModal,
  CoachSwapExerciseModal,
  CoachAddExerciseModal,
  CoachCardioSwapModal,
  CoachMobilityModal
} from './CoachEditor/components';
import { useCoachEditorData } from './CoachEditor/hooks';

export default function CoachEditor() {
  const editor = useCoachEditorData();

  const {
    clientCodeParam,
    searchParams,
    setSearchParams,
    loading,
    setLoading,
    saving,
    setSaving,
    publishing,
    setPublishing,
    program,
    setProgram,
    activeSessionDemand,
    weeklyVolumeAudit,
    coachNotes,
    setCoachNotes,
    activeSessionIdx,
    setActiveSessionIdx,
    activeWorkspaceTab,
    setActiveWorkspaceTab,
    notification,
    setNotification,
    selectedWeek,
    setSelectedWeek,
    activeVideoModalEx,
    setActiveVideoModalEx,
    autoRippleEnabled,
    setAutoRippleEnabled,
    clientsList,
    setClientsList,
    queueFilter,
    setQueueFilter,
    queueSearch,
    setQueueSearch,
    showQueueSlider,
    setShowQueueSlider,
    allExercisesList,
    setAllExercisesList,
    cardioSwapModal,
    setCardioSwapModal,
    isLabModalOpen,
    setIsLabModalOpen,
    addFoodModal,
    setAddFoodModal,
    swapFoodModal,
    setSwapFoodModal,
    addExModal,
    setAddExModal,
    swapExModal,
    setSwapExModal,
    mobilityModal,
    setMobilityModal,
    allMobilityList,
    setAllMobilityList,
    showReasoning,
    setShowReasoning,
    exModalSearch,
    setExModalSearch,
    addExMuscleFilter,
    setAddExMuscleFilter,
    addExEquipmentFilter,
    setAddExEquipmentFilter,
    foodModalSearch,
    setFoodModalSearch,
    mobilityModalSearch,
    setMobilityModalSearch,
    swapFoodSearch,
    setSwapFoodSearch,
    swapExSearch,
    setSwapExSearch,
    handleSelectClient,
    showToast,
    handleUpdateFoodAmount,
    handleDeleteFood,
    handleAddNewMeal,
    handleDuplicateMeal,
    handleDeleteMeal,
    handleAddFoodToMeal,
    handleExecuteFoodSwap,
    handleExecuteExerciseSwap,
    handleUpdateExerciseParam,
    handleMoveExercise,
    handleDuplicateSession,
    handleDeleteExercise,
    handleAddExerciseToSession,
    handleSelectCardioModality,
    handleUpdateCardioParam,
    handleAddMobilityToSession,
    handleRemoveMobilityFromSession,
    handleSaveDraft,
    handleApproveAndPublish,
    filteredQueue,
    displayedQueue,
    urgentCount,
    pendingPlanCount,
    needsUpdateCount,
    currentWeekData,
    currentSessions,
    activeSession,
    FOOD_DATABASE_LIST,
    CARDIO_MODALITY_OPTIONS
  } = editor;

  return (
    <AdminLayout fullWidth={true}>
      <div 
        dir="rtl" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px', 
          fontFamily: 'Cairo, sans-serif',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        
        {/* =========================================================================
            0. CLIENTS ACTION QUEUE SLIDER BAR
            ========================================================================= */}
        <CoachClientsQueue
          urgentCount={urgentCount}
          pendingPlanCount={pendingPlanCount}
          needsUpdateCount={needsUpdateCount}
          clientsList={clientsList}
          queueFilter={queueFilter}
          setQueueFilter={setQueueFilter}
          queueSearch={queueSearch}
          setQueueSearch={setQueueSearch}
          showQueueSlider={showQueueSlider}
          setShowQueueSlider={setShowQueueSlider}
          displayedQueue={displayedQueue}
          filteredQueue={filteredQueue}
          program={program}
          clientCodeParam={clientCodeParam}
          handleSelectClient={handleSelectClient}
        />

        {/* =========================================================================
            1. Executive Client Bar & Action Header
            ========================================================================= */}
        <CoachHeaderBar
          program={program}
          clientCodeParam={clientCodeParam}
          handleSaveDraft={handleSaveDraft}
          saving={saving}
          setIsLabModalOpen={setIsLabModalOpen}
          handleApproveAndPublish={handleApproveAndPublish}
          publishing={publishing}
          clientsList={clientsList}
          handleSelectClient={handleSelectClient}
        />

        {/* 2. Unified Clean Workspace Tabs */}
        <div 
          style={{ 
            display: 'flex', 
            gap: '4px', 
            background: '#F1F5F9',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '3px'
          }}
        >
          {[
            { id: 'TRAINING', label: 'البرنامج التدريبي', count: `${currentSessions?.length || 3} أيام`, icon: Dumbbell },
            { id: 'NUTRITION', label: 'الخطة الغذائية والماكروز', count: `${program.nutrition?.targets?.calories || 1900} kcal`, icon: Utensils },
            { id: 'CARDIO_HABITS', label: 'الكارديو والعادات الحيوية', count: `${program.cardio?.neat_target_steps || 8500} خطوة`, icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeWorkspaceTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveWorkspaceTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: isSel ? '#0F172A' : 'transparent',
                  color: isSel ? '#FFFFFF' : '#64748B',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  boxShadow: isSel ? '0 2px 4px rgba(15, 23, 42, 0.2)' : 'none',
                  transition: 'all 0.12s ease'
                }}
              >
                <Icon size={14} color={isSel ? '#FFFFFF' : '#64748B'} />
                <span>{tab.label}</span>
                {tab.count && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '0 5px',
                    borderRadius: '10px',
                    background: isSel ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                    color: isSel ? '#FFFFFF' : '#475569'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 3. TAB 1: WORKOUT & TRAINING */}
        {activeWorkspaceTab === 'TRAINING' && (
          <CoachTrainingTab
            program={program}
            selectedWeek={selectedWeek}
            setSelectedWeek={setSelectedWeek}
            currentWeekData={currentWeekData}
            currentSessions={currentSessions}
            activeSessionIdx={activeSessionIdx}
            setActiveSessionIdx={setActiveSessionIdx}
            activeSession={activeSession}
            handleRemoveMobilityFromSession={handleRemoveMobilityFromSession}
            setMobilityModal={setMobilityModal}
            setActiveVideoModalEx={setActiveVideoModalEx}
            handleUpdateExerciseParam={handleUpdateExerciseParam}
            setSwapExModal={setSwapExModal}
            handleDeleteExercise={handleDeleteExercise}
            setAddExModal={setAddExModal}
            handleMoveExercise={handleMoveExercise}
            handleDuplicateSession={handleDuplicateSession}
            activeSessionDemand={activeSessionDemand}
            weeklyVolumeAudit={weeklyVolumeAudit}
          />
        )}

        {/* 4. TAB 2: NUTRITION & MACROS */}
        {activeWorkspaceTab === 'NUTRITION' && (
          <CoachEditorNutritionTab
            searchParams={searchParams}
            setSearchParams={setSearchParams}
            loading={loading}
            setLoading={setLoading}
            saving={saving}
            setSaving={setSaving}
            publishing={publishing}
            setPublishing={setPublishing}
            program={program}
            setProgram={setProgram}
            coachNotes={coachNotes}
            setCoachNotes={setCoachNotes}
            activeSessionIdx={activeSessionIdx}
            setActiveSessionIdx={setActiveSessionIdx}
            activeWorkspaceTab={activeWorkspaceTab}
            setActiveWorkspaceTab={setActiveWorkspaceTab}
            notification={notification}
            setNotification={setNotification}
            clientsList={clientsList}
            setClientsList={setClientsList}
            queueFilter={queueFilter}
            setQueueFilter={setQueueFilter}
            queueSearch={queueSearch}
            setQueueSearch={setQueueSearch}
            showQueueSlider={showQueueSlider}
            setShowQueueSlider={setShowQueueSlider}
            allExercisesList={allExercisesList}
            setAllExercisesList={setAllExercisesList}
            cardioSwapModal={cardioSwapModal}
            setCardioSwapModal={setCardioSwapModal}
            addFoodModal={addFoodModal}
            setAddFoodModal={setAddFoodModal}
            swapFoodModal={swapFoodModal}
            setSwapFoodModal={setSwapFoodModal}
            addExModal={addExModal}
            setAddExModal={setAddExModal}
            swapExModal={swapExModal}
            setSwapExModal={setSwapExModal}
            mobilityModal={mobilityModal}
            setMobilityModal={setMobilityModal}
            allMobilityList={allMobilityList}
            setAllMobilityList={setAllMobilityList}
            showReasoning={showReasoning}
            setShowReasoning={setShowReasoning}
            exModalSearch={exModalSearch}
            setExModalSearch={setExModalSearch}
            foodModalSearch={foodModalSearch}
            setFoodModalSearch={setFoodModalSearch}
            mobilityModalSearch={mobilityModalSearch}
            setMobilityModalSearch={setMobilityModalSearch}
            swapFoodSearch={swapFoodSearch}
            setSwapFoodSearch={setSwapFoodSearch}
            swapExSearch={swapExSearch}
            setSwapExSearch={setSwapExSearch}
            handleSelectClient={handleSelectClient}
            handleUpdateFoodAmount={handleUpdateFoodAmount}
            handleDeleteFood={handleDeleteFood}
            handleAddNewMeal={handleAddNewMeal}
            handleDuplicateMeal={handleDuplicateMeal}
            handleDeleteMeal={handleDeleteMeal}
            handleAddFoodToMeal={handleAddFoodToMeal}
            handleExecuteFoodSwap={handleExecuteFoodSwap}
            handleExecuteExerciseSwap={handleExecuteExerciseSwap}
            handleUpdateExerciseParam={handleUpdateExerciseParam}
            handleDeleteExercise={handleDeleteExercise}
            handleAddExerciseToSession={handleAddExerciseToSession}
            handleSelectCardioModality={handleSelectCardioModality}
            handleAddMobilityToSession={handleAddMobilityToSession}
            handleRemoveMobilityFromSession={handleRemoveMobilityFromSession}
            handleSaveDraft={handleSaveDraft}
            handleApproveAndPublish={handleApproveAndPublish}
            showToast={showToast}
            autoRippleEnabled={autoRippleEnabled}
            setAutoRippleEnabled={setAutoRippleEnabled}
            FOOD_DATABASE_LIST={FOOD_DATABASE_LIST}
            CARDIO_MODALITY_OPTIONS={CARDIO_MODALITY_OPTIONS}
          />
        )}

        {/* 5. TAB 3: CARDIO & HABITS */}
        {activeWorkspaceTab === 'CARDIO_HABITS' && (
          <CoachCardioHabitsTab
            program={program}
            setCardioSwapModal={setCardioSwapModal}
            handleUpdateCardioParam={handleUpdateCardioParam}
            coachNotes={coachNotes}
            setCoachNotes={setCoachNotes}
          />
        )}

        {/* =========================================================================
            MODALS (All Emoji-Free)
            ========================================================================= */}

        {/* Smart Food Swap Modal */}
        <CoachSwapFoodModal
          swapFoodModal={swapFoodModal}
          setSwapFoodModal={setSwapFoodModal}
          swapFoodSearch={swapFoodSearch}
          setSwapFoodSearch={setSwapFoodSearch}
          handleExecuteFoodSwap={handleExecuteFoodSwap}
        />

        {/* Smart Exercise Swap Modal */}
        <CoachSwapExerciseModal
          swapExModal={swapExModal}
          setSwapExModal={setSwapExModal}
          swapExSearch={swapExSearch}
          setSwapExSearch={setSwapExSearch}
          allExercisesList={allExercisesList}
          handleExecuteExerciseSwap={handleExecuteExerciseSwap}
        />

        {/* Cardio Swap Modal */}
        <CoachCardioSwapModal
          cardioSwapModal={cardioSwapModal}
          setCardioSwapModal={setCardioSwapModal}
          handleSelectCardioModality={handleSelectCardioModality}
        />

        {/* Mobility Selection Modal */}
        <CoachMobilityModal
          mobilityModal={mobilityModal}
          setMobilityModal={setMobilityModal}
          mobilityModalSearch={mobilityModalSearch}
          setMobilityModalSearch={setMobilityModalSearch}
          allMobilityList={allMobilityList}
          handleAddMobilityToSession={handleAddMobilityToSession}
        />

        {/* Add Exercise Modal */}
        <CoachAddExerciseModal
          addExModal={addExModal}
          setAddExModal={setAddExModal}
          program={program}
          allExercisesList={allExercisesList}
          addExMuscleFilter={addExMuscleFilter}
          setAddExMuscleFilter={setAddExMuscleFilter}
          addExEquipmentFilter={addExEquipmentFilter}
          setAddExEquipmentFilter={setAddExEquipmentFilter}
          exModalSearch={exModalSearch}
          setExModalSearch={setExModalSearch}
          handleAddExerciseToSession={handleAddExerciseToSession}
        />

        {/* Add Food Modal */}
        <CoachAddFoodModal
          addFoodModal={addFoodModal}
          setAddFoodModal={setAddFoodModal}
          foodModalSearch={foodModalSearch}
          setFoodModalSearch={setFoodModalSearch}
          handleAddFoodToMeal={handleAddFoodToMeal}
        />

        {/* Clinical Lab Biomarkers Review Studio Modal */}
        {isLabModalOpen && (
          <LabBiomarkersReviewStudio
            client={program?.client || { client_code: clientCodeParam, full_name: program?.client?.full_name || 'مشترك' }}
            initialValues={program?.client?.biomarkers || {}}
            medicalReportsUrls={program?.client?.medical_reports_urls || []}
            onClose={() => setIsLabModalOpen(false)}
            onSave={(updatedBiomarkers) => {
              setProgram(prev => ({
                ...prev,
                client: {
                  ...prev.client,
                  biomarkers: updatedBiomarkers
                }
              }));
              setIsLabModalOpen(false);
              showToast('تم تحديث المؤشرات الحيوية والتحاليل في ملف المشترك بنجاح');
            }}
          />
        )}

        {/* Exercise Video Modal */}
        {activeVideoModalEx && (
          <ExerciseVideoModal
            exercise={activeVideoModalEx}
            onClose={() => setActiveVideoModalEx(null)}
          />
        )}

        {/* Floating Notification Toast */}
        {notification && (
          <div 
            style={{
              position: 'fixed',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#0F172A',
              color: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 700,
              zIndex: 99999
            }}
            dir="rtl"
          >
            {notification.msg}
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
