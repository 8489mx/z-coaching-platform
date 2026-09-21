import React, { useState } from 'react';
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
  CoachFastingToggle,
  CoachCycleStatusLine,
  CoachSwapFoodModal,
  CoachAddFoodModal,
  CoachSwapExerciseModal,
  CoachAddExerciseModal,
  CoachCardioSwapModal,
  CoachMobilityModal,
  CoachPlanQualityModal,
  CoachEmergencyModal
} from './CoachEditor/components';
import { useCoachEditorData } from './CoachEditor/hooks';

export default function CoachEditor() {
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const editor = useCoachEditorData();

  const {
    clientCodeParam,
    trainingCycle,
    _searchParams,
    _setSearchParams,
    _loading,
    _setLoading,
    saving,
    _setSaving,
    publishing,
    _setPublishing,
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
    _setNotification,
    selectedWeek,
    setSelectedWeek,
    activeVideoModalEx,
    setActiveVideoModalEx,
    _autoRippleEnabled,
    _setAutoRippleEnabled,
    clientsList,
    _setClientsList,
    queueFilter,
    setQueueFilter,
    queueSearch,
    setQueueSearch,
    showQueueSlider,
    setShowQueueSlider,
    allExercisesList,
    _setAllExercisesList,
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
    _setAllMobilityList,
    _showReasoning,
    _setShowReasoning,
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
    _handleUpdateFoodAmount,
    _handleDeleteFood,
    _handleAddNewMeal,
    _handleDuplicateMeal,
    _handleDeleteMeal,
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
    _FOOD_DATABASE_LIST,
    _CARDIO_MODALITY_OPTIONS
  } = editor;

  const [isPlanQualityOpen, setIsPlanQualityOpen] = React.useState(false);

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
            سطر موضع المتدرب من دورته التدريبية
            ========================================================================= */}
        {trainingCycle && (
          <CoachCycleStatusLine trainingCycle={trainingCycle} />
        )}
        
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
          setIsPlanQualityOpen={setIsPlanQualityOpen}
          setIsEmergencyModalOpen={setIsEmergencyModalOpen}
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
            clientProgression={editor.clientProgression}
          />
        )}

        {/* 4. TAB 2: NUTRITION & MACROS */}
        {activeWorkspaceTab === 'NUTRITION' && (
          <CoachFastingToggle
            fastingContext={editor.clientFasting}
            onChange={editor.updateFastingOverride}
            saving={editor.fastingSaving}
          />
        )}
        {activeWorkspaceTab === 'NUTRITION' && (
          <CoachEditorNutritionTab
            {...editor}
            program={program}
            setProgram={setProgram}
            coachNotes={coachNotes}
            setCoachNotes={setCoachNotes}
            activeSessionIdx={activeSessionIdx}
            setActiveSessionIdx={setActiveSessionIdx}
            activeWorkspaceTab={activeWorkspaceTab}
            setActiveWorkspaceTab={setActiveWorkspaceTab}
          />
        )}

        {/* 5. TAB 3: CARDIO & HABITS */}
        {activeWorkspaceTab === 'CARDIO_HABITS' && (
          <CoachCardioHabitsTab
            program={program}
            setCardioSwapModal={setCardioSwapModal}
            handleUpdateCardioParam={handleUpdateCardioParam}
            handleUpdateSupplementsInCardio={editor.handleUpdateSupplementsInCardio}
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
          clientProfile={program?.client_profile || null}
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

        {/* Pre-Flight Plan Quality & Clinical Audit Shield Modal */}
        <CoachPlanQualityModal
          isOpen={isPlanQualityOpen}
          onClose={() => setIsPlanQualityOpen(false)}
          program={program}
          onApproveAndPublish={handleApproveAndPublish}
          publishing={publishing}
        />

        {/* Emergency & Flexibility Adaptation Modal */}
        <CoachEmergencyModal
          isOpen={isEmergencyModalOpen}
          onClose={() => setIsEmergencyModalOpen(false)}
          program={program}
          setProgram={setProgram}
          showToast={editor.showToast || showToast}
        />

        {/* Exercise Video Modal */}
        {activeVideoModalEx && (
          <ExerciseVideoModal
            exercise={activeVideoModalEx}
            onClose={() => setActiveVideoModalEx(null)}
          />
        )}

        {/* Medical review confirmation before publishing (server returns 409 until confirmed) */}
        {editor.medicalReviewPrompt && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99998, padding: '16px' }}
            onClick={() => editor.setMedicalReviewPrompt(null)}
            dir="rtl"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '18px 20px', boxShadow: '0 20px 40px rgba(15, 23, 42, 0.18)' }}
            >
              <strong style={{ display: 'block', fontSize: '14px', color: '#991B1B', marginBottom: '8px' }}>مراجعة طبية مطلوبة قبل الاعتماد</strong>
              <p style={{ fontSize: '12px', color: '#334155', lineHeight: 1.6, margin: '0 0 14px 0' }}>{editor.medicalReviewPrompt.message}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={editor.confirmMedicalReviewAndPublish}
                  style={{ flex: 1, padding: '9px 12px', borderRadius: '10px', border: 'none', background: '#991B1B', color: '#FFFFFF', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                >
                  راجعت الحالة مع الطبيب، اعتمد الخطة
                </button>
                <button
                  type="button"
                  onClick={() => editor.setMedicalReviewPrompt(null)}
                  style={{ flex: 1, padding: '9px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Notification Toast */}
        {notification && (
          <div 
            style={{
              position: 'fixed',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: notification.type === 'warning' ? '#B45309' : '#0F172A',
              color: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: '10px',
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
