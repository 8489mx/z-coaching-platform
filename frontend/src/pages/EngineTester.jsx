import React, { useState } from 'react';
import { API_BASE } from '../config/api';
import '../engine-tester.css';

const DEFAULT_INTAKE = {
  "personal": {
    "dateOfBirth": "1994-05-20",
    "sex": "FEMALE",
    "residenceCountry": "EG",
    "guardianConsent": null
  },
  "goals": {
    "primary": "FAT_LOSS",
    "secondaryTraining": "GENERAL_STRENGTH"
  },
  "body": {
    "heightCm": 165,
    "weightKg": 72,
    "waistCm": 82,
    "weightTrend": "STABLE",
    "measurementQuality": "HIGH",
    "progressPhotosAvailable": true
  },
  "lifestyle": {
    "dailyActivity": "LIGHT",
    "workSchedule": {
      "type": "VARIABLE",
      "physicallyDemandingDays": []
    },
    "sleep": {
      "averageHours": 7.5,
      "quality": "GOOD"
    },
    "stressLevel": "MODERATE"
  },
  "medical": {
    "conditions": [
      {
        "conditionCode": "THYROID_CONDITION",
        "otherConditionText": null,
        "stability": "STABLE",
        "physicianInstructions": [],
        "unclassifiedInstructionsText": null
      }
    ],
    "dangerousSymptoms": {
      "chestPainOrPressure": "NO",
      "fainting": "NO",
      "unusualShortnessOfBreath": "NO",
      "abnormalPalpitations": "NO",
      "otherDangerousSymptomsPresent": "NO",
      "otherDangerousSymptoms": []
    },
    "medications": [],
    "eatingDisorderHistory": "NONE",
    "pregnancyStatus": "NOT_PREGNANT",
    "menstrualStatus": "REGULAR",
    "unclassifiedText": []
  },
  "nutrition": {
    "preferredMealCount": 3,
    "unavailableEatingWindows": [
      { "start": "09:00", "end": "12:00" }
    ],
    "budget": "MEDIUM",
    "foodStorageAvailable": true,
    "foodReheatingAvailable": true,
    "allergies": [
      { "substance": "SESAME", "medicallyConfirmed": true }
    ],
    "medicalExclusions": [],
    "dislikedFoods": ["TUNA"],
    "intolerances": [
      {
        "substance": "LACTOSE",
        "severity": "MILD",
        "medicallyDiagnosed": false,
        "notes": null
      }
    ],
    "digestiveIssues": []
  },
  "training": {
    "location": "HOME",
    "equipment": [
      {
        "equipmentCode": "DUMBBELLS",
        "otherEquipmentText": null,
        "loadCapacity": "LIGHT"
      }
    ],
    "maxDaysPerWeek": 4,
    "preferredDaysPerWeek": 3,
    "trainingScheduleAvailabilityType": "FLEXIBLE",
    "availableTrainingDays": [],
    "unavailableTrainingDays": [],
    "maxSessionMinutes": 45,
    "experience": "NEVER_TRAINED",
    "recentTraining": "NONE_LAST_4_WEEKS",
    "injuries": [],
    "medicalMovementRestrictions": []
  },
  "cardio": {
    "additionalSports": [],
    "averageDailySteps": 4500,
    "walkingAbility": "EASY",
    "maxSessionsPerWeek": 2,
    "maxDurationMinutes": 20
  },
  "unclassifiedNotes": []
};

const EngineTester = () => {
  const [jsonInput, setJsonInput] = useState(() => {
    const saved = localStorage.getItem('z_intake_payload');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        return JSON.stringify(DEFAULT_INTAKE, null, 2);
      }
    }
    return JSON.stringify(DEFAULT_INTAKE, null, 2);
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autoRun') === 'true') {
      handleGenerate();
    }
  }, []);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      let payload;
      try {
        payload = JSON.parse(jsonInput);
      } catch (e) {
        throw new Error("Invalid JSON formatting.");
      }

      // We hit the backend API running on port 3000
      const response = await fetch(`${API_BASE}/api/v1/programs/generate-preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate program.");
      }

      setResult(data.master_program);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = (status) => {
    let className = 'badge';
    if (status === 'READY') className += ' badge-ready';
    else if (status === 'BLOCKED' || status === 'WITHHELD') className += ' badge-blocked';
    else className += ' badge-review';
    return <span className={className}>{status}</span>;
  };

  return (
    <div className="engine-tester-container">
      {/* Left Panel: Input */}
      <div className="tester-panel tester-left">
        <div className="tester-header">
          <h2 className="tester-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#38bdf8'}}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            <span>Z-Engine</span> Tester
          </h2>
        </div>
        
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
          Edit the JSON payload below and generate to test the decision engine rules deterministically.
        </p>

        <textarea 
          className="tester-json-editor"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          spellCheck="false"
        />

        <button 
          className="tester-button" 
          onClick={handleGenerate} 
          disabled={loading}
        >
          {loading ? "Generating..." : "Run Engine"}
        </button>
      </div>

      {/* Right Panel: Output */}
      <div className="tester-panel tester-right">
        {error && (
          <div className="error-banner">
            <strong>Error:</strong> {error}
          </div>
        )}

        {!result && !error && !loading && (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
            <p>Run the engine to see the master program visualization.</p>
          </div>
        )}

        {loading && (
          <div className="empty-state">
            <p>Processing via backend...</p>
          </div>
        )}

        {result && (
          <>
            <div className="result-section">
              <h3 className="result-title">
                Intake Engine Decision
                {renderStatusBadge(result.intake_decision.plan_status)}
              </h3>
              
              {result.intake_decision.decision_reasons && result.intake_decision.decision_reasons.length > 0 && (
                <div style={{marginTop: '1rem'}}>
                  <strong style={{fontSize: '0.85rem', color: '#94a3b8'}}>Reasons/Flags:</strong>
                  <ul style={{fontSize: '0.85rem', marginTop: '0.5rem', paddingLeft: '1.2rem', color: '#fca5a5'}}>
                    {result.intake_decision.decision_reasons.map((r, i) => (
                      <li key={i}>{r.code}: {r.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Training Meso-Cycle (V2) or Plan (V1) */}
            <div className="result-section">
              <h3 className="result-title">
                {result.training_program?.total_weeks ? `Training Meso-Cycle (V2 - ${result.training_program.total_weeks} Weeks)` : 'Training Plan'}
                {renderStatusBadge(result.training_program?.preflight_report?.plan_status || result.training_program?.weekly_training_plan?.status || 'READY')}
              </h3>

              <div className="grid-2" style={{marginBottom: '1rem'}}>
                <div className="stat-box">
                  <div className="stat-label">Split Structure</div>
                  <div className="stat-value stat-value-accent" style={{fontSize: '1.1rem'}}>
                    {result.training_program?.split_code?.replace(/_/g, ' ') || 'UPPER LOWER'}
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Engine Version</div>
                  <div className="stat-value" style={{fontSize: '0.9rem', color: '#38bdf8'}}>
                    {result.training_program?.engine_version || 'V1'}
                  </div>
                </div>
              </div>

              {/* V2 Meso-cycle Weeks */}
              {result.training_program?.weeks && result.training_program.weeks.length > 0 && (
                <div>
                  <h4 style={{fontSize: '0.95rem', color: '#e2e8f0', marginBottom: '0.5rem'}}>Periodized Meso-Cycle Progression:</h4>
                  {result.training_program.weeks.map(week => (
                    <div key={week.week_number} style={{background: 'rgba(30, 41, 59, 0.7)', borderRadius: '8px', padding: '1rem', marginBottom: '0.75rem', border: '1px solid #334155'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
                        <strong style={{color: '#38bdf8'}}>الأسبوع {week.week_number} — {week.phase}</strong>
                        <span className="badge badge-ready">Target RIR: {week.target_rir}</span>
                      </div>
                      <p style={{fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 0.5rem'}}>{week.focus_note}</p>
                      
                      <div style={{display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem'}}>
                        {week.sessions.map((sess, sIdx) => (
                          <div key={sIdx} style={{background: '#0f172a', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.82rem'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', color: '#f1f5f9', fontWeight: 'bold'}}>
                              <span>{sess.session_code} {sess.scheduled_day ? `(${sess.scheduled_day})` : ''}</span>
                              <span style={{color: '#94a3b8'}}>{sess.exercises.length} Exercises</span>
                            </div>
                            <div style={{marginTop: '0.3rem', color: '#cbd5e1'}}>
                              {sess.exercises.slice(0, 3).map((ex, exIdx) => (
                                <span key={exIdx} style={{display: 'inline-block', marginRight: '0.75rem'}}>
                                  • {ex.name_ar || ex.name_en} ({ex.prescription.sets} sets x {ex.prescription.target_min || ex.prescription.target_max} reps)
                                </span>
                              ))}
                              {sess.exercises.length > 3 && <span style={{color: '#64748b'}}>+{sess.exercises.length - 3} more</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Nutrition with Quantized Household Servings */}
            {result.nutrition_program && (
              <div className="result-section">
                <h3 className="result-title">
                  Nutrition Plan (V2 Quantized)
                  {renderStatusBadge(result.nutrition_program.stages?.plan_preflight?.status || 'READY')}
                </h3>
                
                <div className="stat-box" style={{marginBottom: '1rem'}}>
                  <div className="stat-label">Daily Target Calories</div>
                  <div className="stat-value">
                    {Math.round(result.nutrition_program.stages?.energy_target?.target_calories_kcal || 0)}{' '}
                    <span style={{fontSize: '1rem', color: '#94a3b8'}}>kcal</span>
                  </div>
                </div>

                <div className="grid-3" style={{marginBottom: '1.25rem'}}>
                  <div className="stat-box">
                    <div className="stat-label" style={{color: '#f87171'}}>PROTEIN</div>
                    <div className="stat-value" style={{fontSize: '1.1rem'}}>
                      {Math.round(result.nutrition_program.stages?.macro_targets?.protein_g || 0)}g
                    </div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label" style={{color: '#60a5fa'}}>CARBS</div>
                    <div className="stat-value" style={{fontSize: '1.1rem'}}>
                      {Math.round(result.nutrition_program.stages?.macro_targets?.carbohydrate_g || 0)}g
                    </div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label" style={{color: '#fbbf24'}}>FATS</div>
                    <div className="stat-value" style={{fontSize: '1.1rem'}}>
                      {Math.round(result.nutrition_program.stages?.macro_targets?.fat_g || 0)}g
                    </div>
                  </div>
                </div>

                {/* Quantized Meals */}
                {result.nutrition_program.quantized_plan?.meals && (
                  <div>
                    <h4 style={{fontSize: '0.95rem', color: '#e2e8f0', marginBottom: '0.5rem'}}>Household Serving Meals (الوجبات المقربة):</h4>
                    {result.nutrition_program.quantized_plan.meals.map((meal, mIdx) => (
                      <div key={mIdx} style={{background: 'rgba(30, 41, 59, 0.7)', borderRadius: '8px', padding: '0.85rem', marginBottom: '0.5rem', border: '1px solid #334155'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', color: '#f8fafc', fontWeight: 'bold', marginBottom: '0.4rem', fontSize: '0.9rem'}}>
                          <span>الوجبة {mIdx + 1}</span>
                          <span style={{color: '#38bdf8'}}>{Math.round(meal.meal_energy_kcal)} kcal | P: {Math.round(meal.protein_g)}g</span>
                        </div>
                        <ul style={{paddingLeft: '1.2rem', margin: 0, fontSize: '0.85rem', color: '#cbd5e1'}}>
                          {meal.foods?.map((f, fIdx) => (
                            <li key={fIdx} style={{marginBottom: '0.2rem'}}>
                              <strong>{f.serving_display_ar || f.serving_display_en}</strong>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cardio & Mobility with HR Targets */}
            <div className="grid-2">
              {result.cardio_program && (
                <div className="result-section">
                  <h3 className="result-title">
                    Cardio & Heart-Rate Zones
                    {renderStatusBadge(result.cardio_program.preflight_report?.result || 'READY')}
                  </h3>
                  <div className="stat-box" style={{marginBottom: '0.75rem'}}>
                    <div className="stat-label">Daily Steps</div>
                    <div className="stat-value">{result.cardio_program.prescription?.daily_step_target || 8000}</div>
                  </div>
                  {result.cardio_program.weekly_schedule?.sessions?.map((cs, cIdx) => (
                    <div key={cIdx} style={{background: '#0f172a', padding: '0.6rem', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '0.4rem'}}>
                      <div style={{fontWeight: 'bold', color: '#38bdf8'}}>{cs.modality_type} on {cs.day_of_week} ({cs.duration_minutes} min)</div>
                      {cs.heart_rate_target && (
                        <div style={{color: '#a7f3d0', marginTop: '0.2rem'}}>
                          ❤️ {cs.heart_rate_target.target_range_bpm} ({cs.heart_rate_target.zone})
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {result.mobility_program && (
                <div className="result-section">
                  <h3 className="result-title">
                    Mobility & Recovery
                    {renderStatusBadge(result.mobility_program.preflight_report?.approval_state || 'READY')}
                  </h3>
                  <div className="stat-box" style={{marginBottom: '0.75rem'}}>
                    <div className="stat-label">Scheduled Days</div>
                    <div className="stat-value">{result.mobility_program.weekly_schedule?.scheduled_days?.length || 7} Days</div>
                  </div>
                  <p style={{fontSize: '0.82rem', color: '#94a3b8', margin: 0}}>
                    3m Dynamic Warmup Pre-Workout + 2m Static Cooldown Post-Workout + Rest-day recovery routines.
                  </p>
                </div>
              )}
            </div>

            <div className="result-section">
              <h3 className="result-title">Raw Master Program JSON</h3>
              <pre className="pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EngineTester;
