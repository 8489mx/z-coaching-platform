import React, { useState } from 'react';
import '../onboarding.css';

const STEPS = [
 { id: 1, title: 'Personal & Goals', subtitle: 'Tell us about yourself' },
 { id: 2, title: 'Body Metrics', subtitle: 'Your current measurements' },
 { id: 3, title: 'Lifestyle', subtitle: 'Daily activity & sleep' },
 { id: 4, title: 'Nutrition', subtitle: 'Dietary preferences' },
 { id: 5, title: 'Training', subtitle: 'Experience & capability' },
 { id: 6, title: 'Review', subtitle: 'Generate your plan' }
];

export default function ClientOnboarding() {
 const [currentStep, setCurrentStep] = useState(1);
 
 // Form State
 const [formData, setFormData] = useState({
 personal: { dateOfBirth: '1995-01-01', sex: 'MALE', residenceCountry: 'EG', guardianConsent: null },
 goals: { primary: 'FAT_LOSS', secondaryTraining: 'GENERAL_STRENGTH' },
 body: { heightCm: 175, weightKg: 80, waistCm: 85, weightTrend: 'STABLE', measurementQuality: 'HIGH', progressPhotosAvailable: true },
 lifestyle: { 
 dailyActivity: 'LIGHT', 
 workSchedule: { type: 'STANDARD', physicallyDemandingDays: [] },
 sleep: { averageHours: 7, quality: 'GOOD' },
 stressLevel: 'MODERATE'
 },
 medical: {
 conditions: [],
 dangerousSymptoms: { chestPainOrPressure: 'NO', fainting: 'NO', unusualShortnessOfBreath: 'NO', abnormalPalpitations: 'NO', otherDangerousSymptomsPresent: 'NO', otherDangerousSymptoms: [] },
 medications: [], eatingDisorderHistory: 'NONE', pregnancyStatus: 'NOT_PREGNANT', menstrualStatus: 'REGULAR', unclassifiedText: []
 },
 nutrition: {
 preferredMealCount: 3, unavailableEatingWindows: [], budget: 'MEDIUM', foodStorageAvailable: true, foodReheatingAvailable: true,
 allergies: [], medicalExclusions: [], dislikedFoods: [], intolerances: [], digestiveIssues: []
 },
 training: {
 location: 'GYM', equipment: [], maxDaysPerWeek: 4, preferredDaysPerWeek: 4,
 trainingScheduleAvailabilityType: 'FLEXIBLE', availableTrainingDays: [], unavailableTrainingDays: [],
 maxSessionMinutes: 60, experience: 'BEGINNER', recentTraining: 'NONE_LAST_4_WEEKS', injuries: [], medicalMovementRestrictions: []
 },
 cardio: {
 additionalSports: [], averageDailySteps: 5000, walkingAbility: 'EASY', maxSessionsPerWeek: 2, maxDurationMinutes: 30
 },
 unclassifiedNotes: []
 });

 const updateField = (section, field, value) => {
 setFormData(prev => ({
 ...prev,
 [section]: {
 ...prev[section],
 [field]: value
 }
 }));
 };

 const updateNestedField = (section, subSection, field, value) => {
 setFormData(prev => ({
 ...prev,
 [section]: {
 ...prev[section],
 [subSection]: {
 ...prev[section][subSection],
 [field]: value
 }
 }
 }));
 };

 const handleNext = () => {
 if (currentStep < 6) setCurrentStep(currentStep + 1);
 };

 const handlePrev = () => {
 if (currentStep > 1) setCurrentStep(currentStep - 1);
 };

 const submitToEngine = async () => {
 // We will save to localStorage and navigate to /test-engine to show the result visually for now.
 localStorage.setItem('z_intake_payload', JSON.stringify(formData));
 window.location.href = '/test-engine?autoRun=true';
 };

 const renderStep1 = () => (
 <div className="step-content">
 <div className="grid-2-col">
 <div className="form-group">
 <label className="form-label">Date of Birth</label>
 <input type="date" className="form-control" 
 value={formData.personal.dateOfBirth} 
 onChange={e => updateField('personal', 'dateOfBirth', e.target.value)} />
 </div>
 <div className="form-group">
 <label className="form-label">Sex</label>
 <div className="choices-grid">
 <div className={`choice-pill ${formData.personal.sex === 'MALE' ? 'selected' : ''}`} 
 onClick={() => updateField('personal', 'sex', 'MALE')}>
 <div className="choice-title">Male</div>
 </div>
 <div className={`choice-pill ${formData.personal.sex === 'FEMALE' ? 'selected' : ''}`}
 onClick={() => updateField('personal', 'sex', 'FEMALE')}>
 <div className="choice-title">Female</div>
 </div>
 </div>
 </div>
 </div>
 
 <div className="form-group mt-4">
 <label className="form-label">Primary Goal</label>
 <div className="choices-grid">
 {['FAT_LOSS', 'MUSCLE_GAIN', 'RECOMPOSITION', 'MAINTENANCE'].map(goal => (
 <div key={goal} 
 className={`choice-pill ${formData.goals.primary === goal ? 'selected' : ''}`}
 onClick={() => updateField('goals', 'primary', goal)}>
 <div className="choice-title">{goal.replace('_', ' ')}</div>
 </div>
 ))}
 </div>
 </div>
 </div>
 );

 const renderStep2 = () => (
 <div className="step-content">
 <div className="grid-2-col">
 <div className="form-group">
 <label className="form-label">Height (cm)</label>
 <input type="number" className="form-control" 
 value={formData.body.heightCm} 
 onChange={e => updateField('body', 'heightCm', Number(e.target.value))} />
 </div>
 <div className="form-group">
 <label className="form-label">Weight (kg)</label>
 <input type="number" className="form-control" 
 value={formData.body.weightKg} 
 onChange={e => updateField('body', 'weightKg', Number(e.target.value))} />
 </div>
 <div className="form-group">
 <label className="form-label">Waist (cm)</label>
 <input type="number" className="form-control" 
 value={formData.body.waistCm} 
 onChange={e => updateField('body', 'waistCm', Number(e.target.value))} />
 </div>
 <div className="form-group">
 <label className="form-label">Weight Trend</label>
 <select className="form-control" 
 value={formData.body.weightTrend} 
 onChange={e => updateField('body', 'weightTrend', e.target.value)}>
 <option value="LOSING">Losing weight</option>
 <option value="STABLE">Stable</option>
 <option value="GAINING">Gaining weight</option>
 </select>
 </div>
 </div>
 </div>
 );

 const renderStep3 = () => (
 <div className="step-content">
 <div className="form-group">
 <label className="form-label">Daily Activity Level</label>
 <div className="choices-grid">
 {['SEDENTARY', 'LIGHT', 'MODERATE', 'HIGH'].map(level => (
 <div key={level} 
 className={`choice-pill ${formData.lifestyle.dailyActivity === level ? 'selected' : ''}`}
 onClick={() => updateField('lifestyle', 'dailyActivity', level)}>
 <div className="choice-title">{level}</div>
 </div>
 ))}
 </div>
 </div>
 <div className="grid-2-col mt-4">
 <div className="form-group">
 <label className="form-label">Average Sleep (Hours)</label>
 <input type="number" step="0.5" className="form-control" 
 value={formData.lifestyle.sleep.averageHours} 
 onChange={e => updateNestedField('lifestyle', 'sleep', 'averageHours', Number(e.target.value))} />
 </div>
 <div className="form-group">
 <label className="form-label">Stress Level</label>
 <select className="form-control" 
 value={formData.lifestyle.stressLevel} 
 onChange={e => updateField('lifestyle', 'stressLevel', e.target.value)}>
 <option value="LOW">Low</option>
 <option value="MODERATE">Moderate</option>
 <option value="HIGH">High</option>
 <option value="SEVERE">Severe</option>
 </select>
 </div>
 </div>
 </div>
 );

 const renderStep4 = () => (
 <div className="step-content">
 <div className="grid-2-col">
 <div className="form-group">
 <label className="form-label">Preferred Meals per day</label>
 <div className="choices-grid">
 {[2, 3, 4, 5, 6].map(count => (
 <div key={count} 
 className={`choice-pill ${formData.nutrition.preferredMealCount === count ? 'selected' : ''}`}
 onClick={() => updateField('nutrition', 'preferredMealCount', count)}>
 <div className="choice-title">{count} Meals</div>
 </div>
 ))}
 </div>
 </div>
 <div className="form-group">
 <label className="form-label">Budget</label>
 <select className="form-control" 
 value={formData.nutrition.budget} 
 onChange={e => updateField('nutrition', 'budget', e.target.value)}>
 <option value="LOW">Low</option>
 <option value="MEDIUM">Medium</option>
 <option value="HIGH">High</option>
 <option value="UNLIMITED">Unlimited</option>
 </select>
 </div>
 </div>
 </div>
 );

 const renderStep5 = () => (
 <div className="step-content">
 <div className="grid-2-col">
 <div className="form-group">
 <label className="form-label">Training Location</label>
 <div className="choices-grid">
 <div className={`choice-pill ${formData.training.location === 'GYM' ? 'selected' : ''}`} 
 onClick={() => updateField('training', 'location', 'GYM')}>
 <div className="choice-title">Gym</div>
 </div>
 <div className={`choice-pill ${formData.training.location === 'HOME' ? 'selected' : ''}`}
 onClick={() => updateField('training', 'location', 'HOME')}>
 <div className="choice-title">Home</div>
 </div>
 </div>
 </div>
 <div className="form-group">
 <label className="form-label">Training Experience</label>
 <select className="form-control" 
 value={formData.training.experience} 
 onChange={e => updateField('training', 'experience', e.target.value)}>
 <option value="NEVER_TRAINED">Never Trained</option>
 <option value="BEGINNER">Beginner ({"<"} 1 year)</option>
 <option value="INTERMEDIATE">Intermediate (1-3 years)</option>
 <option value="ADVANCED">Advanced ({">"} 3 years)</option>
 </select>
 </div>
 <div className="form-group">
 <label className="form-label">Preferred Training Days</label>
 <input type="number" min="1" max="6" className="form-control" 
 value={formData.training.preferredDaysPerWeek} 
 onChange={e => {
 updateField('training', 'preferredDaysPerWeek', Number(e.target.value));
 updateField('training', 'maxDaysPerWeek', Number(e.target.value) + 1);
 }} />
 </div>
 <div className="form-group">
 <label className="form-label">Average Daily Steps</label>
 <input type="number" step="1000" className="form-control" 
 value={formData.cardio.averageDailySteps} 
 onChange={e => updateField('cardio', 'averageDailySteps', Number(e.target.value))} />
 </div>
 </div>
 </div>
 );

 const renderStep6 = () => (
 <div className="step-content">
 <div style={{textAlign: 'center', padding: '2rem'}}>
 <div style={{fontSize: '4rem', marginBottom: '1rem'}}></div>
 <h3>You're all set!</h3>
 <p style={{color: '#94a3b8', margin: '1rem 0 2rem'}}>
 We have gathered all your information. Based on our advanced decision engine, we will now generate your fully customized nutrition, training, and mobility plan.
 </p>
 <button className="btn btn-primary" onClick={submitToEngine} style={{fontSize: '1.25rem', padding: '1rem 3rem'}}>
 Generate My Plan
 </button>
 </div>
 </div>
 );

 return (
 <div className="onboarding-layout">
 <div className="onboarding-container">
 
 <div className="onboarding-header">
 <h1 className="onboarding-title">{STEPS[currentStep - 1].title}</h1>
 <p className="onboarding-subtitle">{STEPS[currentStep - 1].subtitle}</p>
 
 <div className="progress-container">
 {STEPS.map(step => (
 <div key={step.id} 
 className={`progress-step ${step.id === currentStep ? 'active' : ''} ${step.id < currentStep ? 'completed' : ''}`} />
 ))}
 </div>
 </div>

 <div className="onboarding-body">
 {currentStep === 1 && renderStep1()}
 {currentStep === 2 && renderStep2()}
 {currentStep === 3 && renderStep3()}
 {currentStep === 4 && renderStep4()}
 {currentStep === 5 && renderStep5()}
 {currentStep === 6 && renderStep6()}
 </div>

 <div className="onboarding-footer">
 <button 
 className="btn btn-secondary" 
 onClick={handlePrev} 
 disabled={currentStep === 1}
 style={{visibility: currentStep === 1 ? 'hidden' : 'visible'}}
 >
 ← Back
 </button>
 
 {currentStep < 6 && (
 <button className="btn btn-primary" onClick={handleNext}>
 Continue →
 </button>
 )}
 </div>
 
 </div>
 </div>
 );
}
