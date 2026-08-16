import React, { useState } from 'react';
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

      // We hit the backend API running locally on port 3000
      const response = await fetch("http://localhost:3000/api/v1/programs/generate-preview", {
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

            <div className="grid-2">
              {/* Training Plan Summary */}
              {result.training_program?.weekly_training_plan && (
                <div className="result-section">
                  <h3 className="result-title">
                    Training Plan
                    {renderStatusBadge(result.training_program.weekly_training_plan.status)}
                  </h3>
                  <div className="grid-2" style={{marginBottom: '1rem'}}>
                    <div className="stat-box">
                      <div className="stat-label">Days</div>
                      <div className="stat-value">{result.training_program.weekly_training_plan.recommended_days}</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-label">Split</div>
                      <div className="stat-value stat-value-accent" style={{fontSize: '1rem'}}>{result.training_program.weekly_training_plan.split_code?.replace(/_/g, ' ') || 'N/A'}</div>
                    </div>
                  </div>
                  
                  <strong style={{fontSize: '0.85rem', color: '#94a3b8'}}>Sessions:</strong>
                  <div className="pill-list">
                    {result.training_program.weekly_training_plan.sessions?.map(s => (
                      <span className="pill" key={s.sequence}>{s.session_code}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Nutrition Summary */}
              {result.nutrition_program && (
                <div className="result-section">
                  <h3 className="result-title">
                    Nutrition Plan
                    {renderStatusBadge(result.nutrition_program.status)}
                  </h3>
                  
                  <div className="stat-box" style={{marginBottom: '1rem'}}>
                    <div className="stat-label">Energy Target</div>
                    <div className="stat-value">{result.nutrition_program.stages?.energy_target?.target_calories || 0} <span style={{fontSize: '1rem', color: '#94a3b8'}}>kcal</span></div>
                  </div>

                  <div className="grid-3">
                    <div className="stat-box">
                      <div className="stat-label" style={{color: '#f87171'}}>PRO</div>
                      <div className="stat-value" style={{fontSize: '1.1rem'}}>{result.nutrition_program.stages?.macro_targets?.protein?.target_g || 0}g</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-label" style={{color: '#60a5fa'}}>CARB</div>
                      <div className="stat-value" style={{fontSize: '1.1rem'}}>{result.nutrition_program.stages?.macro_targets?.carbohydrate?.target_g || 0}g</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-label" style={{color: '#fbbf24'}}>FAT</div>
                      <div className="stat-value" style={{fontSize: '1.1rem'}}>{result.nutrition_program.stages?.macro_targets?.fat?.target_g || 0}g</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cardio & Mobility */}
            <div className="grid-2">
              {result.cardio_program?.plan_specification && (
                <div className="result-section">
                  <h3 className="result-title">
                    Cardio Plan
                    {renderStatusBadge(result.cardio_program.plan_specification.status)}
                  </h3>
                  <div className="stat-box">
                    <div className="stat-label">Max Sessions</div>
                    <div className="stat-value">{result.cardio_program.plan_specification.max_sessions_per_week || 0}</div>
                  </div>
                </div>
              )}
              {result.mobility_program?.plan_specification && (
                <div className="result-section">
                  <h3 className="result-title">
                    Mobility Plan
                    {renderStatusBadge(result.mobility_program.plan_specification.status)}
                  </h3>
                  <div className="stat-box">
                    <div className="stat-label">Max Sessions</div>
                    <div className="stat-value">{result.mobility_program.plan_specification.max_sessions_per_week || 0}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="result-section">
              <h3 className="result-title">Raw Master Program</h3>
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
