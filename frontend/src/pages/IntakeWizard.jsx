import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function IntakeWizard() {
  const navigate = useNavigate();
  const { token, fetchProgram } = useAuth();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // Flat form data state
  const [formData, setFormData] = useState({
    age: "",
    gender: "MALE",
    country: "EG",
    goal: "FAT_LOSS",
    height: "",
    weight: "",
    activity: "SEDENTARY",
    sleep: "GOOD",
    medical: "",
    allergies: "",
    meals: "3",
    dislikes: "",
    location: "GYM",
    days: "4",
    experience: "BEGINNER",
    cardio: "2"
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleGeneratePlan = async () => {
    setLoading(true);
    setError(null);
    try {
      // Calculate a mock DOB based on age
      const currentYear = new Date().getFullYear();
      const birthYear = formData.age ? currentYear - parseInt(formData.age) : 1990;
      const dateOfBirth = `${birthYear}-01-01`;

      // Build conditions array
      const conditions = [];
      if (formData.medical.trim() !== "") {
        conditions.push({
          conditionCode: "OTHER_CONDITION",
          otherConditionText: formData.medical,
          stability: "STABLE",
          physicianInstructions: []
        });
      }

      // Build allergies array
      const allergies = [];
      if (formData.allergies.trim() !== "") {
        allergies.push({
          substance: formData.allergies,
          medicallyConfirmed: true
        });
      }

      // Build dislikes array
      const dislikedFoods = formData.dislikes ? formData.dislikes.split(',').map(s => s.trim().toUpperCase().replace(/ /g, '_')) : [];

      // Map flat state to nested JSON expected by the engine
      const intakePayload = {
        meta: { assessmentDate: new Date().toISOString().split("T")[0] },
        personal: { 
          dateOfBirth, 
          sex: formData.gender, 
          residenceCountry: formData.country 
        },
        goals: { 
          primary: formData.goal, 
          secondaryTraining: "GENERAL_STRENGTH" 
        },
        body: { 
          heightCm: parseInt(formData.height) || 170, 
          weightKg: parseFloat(formData.weight) || 70, 
          waistCm: 80, 
          weightTrend: "STABLE", 
          measurementQuality: "HIGH", 
          progressPhotosAvailable: true 
        },
        lifestyle: { 
          dailyActivity: formData.activity, 
          workSchedule: { type: "VARIABLE", physicallyDemandingDays: [] }, 
          sleep: { averageHours: 7.5, quality: formData.sleep }, 
          stressLevel: "MODERATE" 
        },
        medical: { 
          conditions, 
          dangerousSymptoms: { chestPainOrPressure: "NO", fainting: "NO", unusualShortnessOfBreath: "NO", abnormalPalpitations: "NO", otherDangerousSymptomsPresent: "NO", otherDangerousSymptoms: [] }, 
          medications: [], 
          eatingDisorderHistory: "NONE", 
          pregnancyStatus: "NOT_PREGNANT", 
          menstrualStatus: "REGULAR", 
          unclassifiedText: [] 
        },
        nutrition: { 
          preferredMealCount: parseInt(formData.meals) || 3, 
          unavailableEatingWindows: [], 
          budget: "MEDIUM", 
          foodStorageAvailable: true, 
          foodReheatingAvailable: true, 
          allergies, 
          medicalExclusions: [], 
          dislikedFoods, 
          intolerances: [], 
          digestiveIssues: [] 
        },
        training: { 
          location: formData.location, 
          equipment: formData.location === 'HOME' ? [{ equipmentCode: "DUMBBELLS", loadCapacity: "LIGHT" }] : [], 
          maxDaysPerWeek: parseInt(formData.days) || 4, 
          preferredDaysPerWeek: parseInt(formData.days) || 4, 
          trainingScheduleAvailabilityType: "FLEXIBLE", 
          availableTrainingDays: [], 
          unavailableTrainingDays: [], 
          maxSessionMinutes: 60, 
          experience: formData.experience, 
          recentTraining: "NONE_LAST_4_WEEKS", 
          injuries: [], 
          medicalMovementRestrictions: [] 
        },
        cardio: { 
          additionalSports: [], 
          averageDailySteps: 5000, 
          walkingAbility: "EASY", 
          maxSessionsPerWeek: parseInt(formData.cardio) || 2, 
          maxDurationMinutes: 30 
        },
        unclassifiedNotes: []
      };

      const response = await fetch("/api/v1/intake", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(intakePayload)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit intake");
      }

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="container mt-5" dir="rtl">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card shadow border-0 text-center p-5">
              <i className="iconoir-check-circle text-success" style={{ fontSize: '4rem' }}></i>
              <h2 className="mt-4">تم الإرسال بنجاح!</h2>
              <p className="text-muted mt-2 fs-5">
                لقد تم حفظ إجاباتك بنجاح. سيقوم المدرب بمراجعتها وإعداد خطتك في أقرب وقت.
              </p>
              <button onClick={() => navigate('/client-login')} className="btn btn-primary mt-4">عودة للصفحة الرئيسية</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row justify-content-center">
        <div className="col-12">
            <div className="card">
                <div className="card-header">
                    <h4 className="card-title">{t('zcc_intake')}</h4>
                </div>
                <div className="card-body pt-0">
                    {error && <div className="alert alert-danger mt-3">{error}</div>}
                    
                    <form onSubmit={(e) => e.preventDefault()}>
                        <nav className="mt-3">
                            <div className="nav nav-tabs border-bottom-0">
                                <span className={`nav-link py-2 ${currentStep === 1 ? 'active fw-bold' : 'text-muted'}`}>{t('step_1')}</span>
                                <span className={`nav-link py-2 ${currentStep === 2 ? 'active fw-bold' : 'text-muted'}`}>{t('step_2')}</span>
                                <span className={`nav-link py-2 ${currentStep === 3 ? 'active fw-bold' : 'text-muted'}`}>{t('step_3')}</span>
                                <span className={`nav-link py-2 ${currentStep === 4 ? 'active fw-bold' : 'text-muted'}`}>{t('step_4')}</span>
                            </div>
                        </nav>
                        <div className="tab-content mt-4 border p-4 rounded bg-light">
                            
                            {/* STEP 1 */}
                            {currentStep === 1 && (
                              <div>
                                  <h4 className="card-title mb-4 fs-16 text-primary">{t('personal_goals')}</h4>
                                  <div className="row">
                                      <div className="col-md-6 mb-3">
                                          <label className="form-label">{t('age')}</label>
                                          <input name="age" type="number" className="form-control" placeholder="e.g. 30" value={formData.age} onChange={handleChange} required />
                                      </div>
                                      <div className="col-md-6 mb-3">
                                          <label className="form-label">{t('gender')}</label>
                                          <select name="gender" className="form-select" value={formData.gender} onChange={handleChange}>
                                              <option value="MALE">{t('male')}</option>
                                              <option value="FEMALE">{t('female')}</option>
                                          </select>
                                      </div>
                                      <div className="col-md-6 mb-3">
                                          <label className="form-label">{t('country_code')}</label>
                                          <input name="country" type="text" className="form-control" placeholder="e.g. EG, US" value={formData.country} onChange={handleChange} />
                                      </div>
                                      <div className="col-md-6 mb-3">
                                          <label className="form-label">{t('primary_goal')}</label>
                                          <select name="goal" className="form-select" value={formData.goal} onChange={handleChange}>
                                              <option value="FAT_LOSS">{t('fat_loss')}</option>
                                              <option value="MUSCLE_GAIN">{t('muscle_gain')}</option>
                                              <option value="MAINTENANCE">{t('maintenance')}</option>
                                              <option value="GENERAL_HEALTH">{t('general_health')}</option>
                                          </select>
                                      </div>
                                  </div>
                                  <div className="text-end mt-3">
                                      <button type="button" onClick={nextStep} className="btn btn-primary px-4">{t('next')} <i className="iconoir-arrow-right"></i></button>
                                  </div>                                        
                              </div>
                            )}

                            {/* STEP 2 */}
                            {currentStep === 2 && (
                              <div>
                                  <h4 className="card-title mb-4 fs-16 text-primary">{t('body_lifestyle')}</h4>
                                  <div className="row">
                                      <div className="col-md-6 mb-3">
                                          <label className="form-label">{t('height_cm')}</label>
                                          <input name="height" type="number" className="form-control" placeholder="175" value={formData.height} onChange={handleChange} />
                                      </div>
                                      <div className="col-md-6 mb-3">
                                          <label className="form-label">{t('weight_kg')}</label>
                                          <input name="weight" type="number" className="form-control" placeholder="80" value={formData.weight} onChange={handleChange} />
                                      </div>
                                      <div className="col-md-6 mb-3">
                                          <label className="form-label">{t('daily_activity')}</label>
                                          <select name="activity" className="form-select" value={formData.activity} onChange={handleChange}>
                                              <option value="SEDENTARY">{t('sedentary')}</option>
                                              <option value="LIGHT">{t('lightly_active')}</option>
                                              <option value="MODERATE">{t('moderately_active')}</option>
                                              <option value="VERY_ACTIVE">{t('very_active')}</option>
                                          </select>
                                      </div>
                                      <div className="col-md-6 mb-3">
                                          <label className="form-label">{t('sleep_quality')}</label>
                                          <select name="sleep" className="form-select" value={formData.sleep} onChange={handleChange}>
                                              <option value="POOR">{t('poor')}</option>
                                              <option value="FAIR">{t('fair')}</option>
                                              <option value="GOOD">{t('good')}</option>
                                              <option value="EXCELLENT">{t('excellent')}</option>
                                          </select>
                                      </div>
                                  </div>
                                  <div className="d-flex justify-content-between mt-3">
                                      <button type="button" onClick={prevStep} className="btn btn-secondary px-4"><i className="iconoir-arrow-left"></i> {t('previous')}</button>
                                      <button type="button" onClick={nextStep} className="btn btn-primary px-4">{t('next')} <i className="iconoir-arrow-right"></i></button>
                                  </div> 
                              </div>
                            )}

                            {/* STEP 3 */}
                            {currentStep === 3 && (
                              <div>
                                  <h4 className="card-title mb-4 fs-16 text-primary">{t('medical_nutrition')}</h4>
                                  <div className="row">
                                      <div className="col-md-6 mb-3">
                                          <label className="form-label">{t('conditions')}</label>
                                          <textarea name="medical" rows="2" className="form-control" placeholder="Any medical conditions..." value={formData.medical} onChange={handleChange}></textarea>
                                      </div>
                                      <div className="col-md-6 mb-3">
                                          <label className="form-label">{t('allergies')}</label>
                                          <textarea name="allergies" rows="2" className="form-control" placeholder="Peanuts, Dairy, etc." value={formData.allergies} onChange={handleChange}></textarea>
                                      </div>
                                      <div className="col-md-6 mb-3">
                                          <label className="form-label">{t('preferred_meals')}</label>
                                          <select name="meals" className="form-select" value={formData.meals} onChange={handleChange}>
                                              <option value="3">{t('meals_3')}</option>
                                              <option value="4">{t('meals_4')}</option>
                                              <option value="5">{t('meals_5')}</option>
                                          </select>
                                      </div>
                                      <div className="col-md-6 mb-3">
                                          <label className="form-label">{t('disliked_foods')}</label>
                                          <input name="dislikes" type="text" className="form-control" placeholder="Tuna, Broccoli" value={formData.dislikes} onChange={handleChange} />
                                      </div>
                                  </div>
                                  <div className="d-flex justify-content-between mt-3">
                                      <button type="button" onClick={prevStep} className="btn btn-secondary px-4"><i className="iconoir-arrow-left"></i> {t('previous')}</button>
                                      <button type="button" onClick={nextStep} className="btn btn-primary px-4">{t('next')} <i className="iconoir-arrow-right"></i></button>                                         
                                  </div> 
                              </div>
                            )}

                            {/* STEP 4 */}
                            {currentStep === 4 && (
                              <div>
                                  <h4 className="card-title mb-4 fs-16 text-primary">{t('training_cardio')}</h4>
                                  <div className="row">
                                      <div className="col-md-6 mb-3">
                                          <label className="form-label">{t('training_location')}</label>
                                          <select name="location" className="form-select" value={formData.location} onChange={handleChange}>
                                              <option value="GYM">{t('commercial_gym')}</option>
                                              <option value="HOME">{t('home_gym')}</option>
                                          </select>
                                      </div>
                                      <div className="col-md-6 mb-3">
                                          <label className="form-label">{t('max_days_week')}</label>
                                          <input name="days" type="number" className="form-control" placeholder="4" min="1" max="7" value={formData.days} onChange={handleChange} />
                                      </div>
                                      <div className="col-md-6 mb-3">
                                          <label className="form-label">{t('experience_level')}</label>
                                          <select name="experience" className="form-select" value={formData.experience} onChange={handleChange}>
                                              <option value="NEVER_TRAINED">{t('never_trained')}</option>
                                              <option value="BEGINNER">{t('beginner')}</option>
                                              <option value="INTERMEDIATE">{t('intermediate')}</option>
                                              <option value="ADVANCED">{t('advanced')}</option>
                                          </select>
                                      </div>
                                      <div className="col-md-6 mb-3">
                                          <label className="form-label">{t('cardio_sessions_week')}</label>
                                          <input name="cardio" type="number" className="form-control" placeholder="2" min="0" max="7" value={formData.cardio} onChange={handleChange} />
                                      </div>
                                  </div>
                                  
                                  <div className="text-center mt-5 mb-4 border-top pt-4">
                                      <h4 className="mb-2 fs-18">{t('ready_to_generate')}</h4>
                                      <p className="text-muted">{t('intake_desc')}</p>                                          
                                  </div> 
                                  <div className="d-flex justify-content-between mt-3">
                                      <button type="button" onClick={prevStep} className="btn btn-secondary px-4"><i className="iconoir-arrow-left"></i> {t('previous')}</button>
                                      <button type="button" onClick={handleGeneratePlan} disabled={loading} className="btn btn-success px-5 fw-bold">
                                          {loading ? 'جاري الإرسال...' : 'إرسال الاستمارة'}
                                      </button>                                         
                                  </div> 
                              </div>
                            )}
                        </div>
                    </form>
                </div> 
            </div> 
        </div> 
    </div>
  );
}
