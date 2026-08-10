import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function NutritionPlan() {
  const { programData, loadingProgram } = useAuth();
  const { t } = useTranslation();
  const [program, setProgram] = useState(null);

  useEffect(() => {
    if (programData) {
      setProgram(programData);
    } else {
      setProgram(null);
    }
  }, [programData]);

  if (loadingProgram) {
    return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;
  }

  if (!program) {
    return (
      <div className="text-center my-5">
        <h4>{t('no_program')}</h4>
        <p className="text-muted">{t('no_program_desc')}</p>
      </div>
    );
  }

  const { nutrition_program, intake_decision } = program;
  const macroTargets = nutrition_program?.stages?.macro_targets || {};
  const portionSolver = nutrition_program?.stages?.portion_solver || {};
  const meals = portionSolver.meals || [];
  const nutritionDecision = intake_decision?.nutrition_decision || {};

  return (
    <div>
      <div className="row">
          <div className="col-12">
              <h4 className="card-title mb-4">{t('daily_nutrition_plan')}</h4>
          </div>
      </div>
      
      {/* MACROS SUMMARY */}
      <div className="row mb-4">
          <div className="col-md-3">
              <div className="card bg-primary text-white text-center p-3 h-100">
                  <h5 className="text-white opacity-75">{t('calories')}</h5>
                  <h2 className="text-white mb-0">{macroTargets.target_calories || 0} <small className="fs-14 fw-normal">{t('kcal')}</small></h2>
                  {nutritionDecision.calorie_direction && (
                    <span className="badge bg-white text-primary mt-2">{nutritionDecision.calorie_direction}</span>
                  )}
              </div>
          </div>
          <div className="col-md-3">
              <div className="card text-center p-3 border-danger border border-2 h-100">
                  <h5 className="text-danger">{t('protein')}</h5>
                  <h2 className="text-dark mb-0">{Math.round(macroTargets.protein?.target_g || 0)} <small className="fs-14 fw-normal text-muted">{t('g')}</small></h2>
                  <small className="text-muted mt-2">{macroTargets.protein?.percent_of_calories || 0}%</small>
              </div>
          </div>
          <div className="col-md-3">
              <div className="card text-center p-3 border-info border border-2 h-100">
                  <h5 className="text-info">{t('carbs')}</h5>
                  <h2 className="text-dark mb-0">{Math.round(macroTargets.carbohydrate?.target_g || 0)} <small className="fs-14 fw-normal text-muted">{t('g')}</small></h2>
                  <small className="text-muted mt-2">{macroTargets.carbohydrate?.percent_of_calories || 0}%</small>
              </div>
          </div>
          <div className="col-md-3">
              <div className="card text-center p-3 border-warning border border-2 h-100">
                  <h5 className="text-warning">{t('fat')}</h5>
                  <h2 className="text-dark mb-0">{Math.round(macroTargets.fat?.target_g || 0)} <small className="fs-14 fw-normal text-muted">{t('g')}</small></h2>
                  <small className="text-muted mt-2">{macroTargets.fat?.percent_of_calories || 0}%</small>
              </div>
          </div>
      </div>
      
      {/* MEALS */}
      <h5 className="mb-3">{t('daily_meals')} ({meals.length} {t('meals')})</h5>
      <div className="row">
        {meals.map((meal, idx) => (
          <div className="col-md-6 mb-4" key={idx}>
              <div className="card h-100 shadow-sm border-0">
                  <div className="card-header bg-light d-flex justify-content-between align-items-center">
                      <h5 className="card-title mb-0">{t('meal')} {idx + 1}: <span className="text-primary">{meal.role}</span></h5>
                      <div className="badge bg-secondary px-2 py-1">
                        {Math.round(meal.totals?.calories_kcal || 0)} {t('kcal')}
                      </div>
                  </div>
                  <div className="card-body">
                      <div className="d-flex justify-content-between text-muted fs-13 border-bottom pb-2 mb-3">
                          <span>P: {Math.round(meal.totals?.protein_g || 0)}{t('g')}</span>
                          <span>C: {Math.round(meal.totals?.carbohydrate_g || 0)}{t('g')}</span>
                          <span>F: {Math.round(meal.totals?.fat_g || 0)}{t('g')}</span>
                      </div>
                      <ul className="list-group list-group-flush">
                          {meal.items && meal.items.map((item, itemIdx) => (
                            <li className="list-group-item px-0 d-flex justify-content-between align-items-center" key={itemIdx}>
                                <div>
                                    <h6 className="mb-0 fs-14">{item.food_code.replace(/_/g, ' ')}</h6>
                                    <small className="text-muted">{item.slot.replace(/_/g, ' ')}</small>
                                </div>
                                <span className="fw-bold bg-light px-2 py-1 rounded">{Math.round(item.grams)}{t('g')}</span>
                            </li>
                          ))}
                      </ul>
                  </div>
              </div>
          </div>
        ))}
      </div>
      
      {/* CONSTRAINTS */}
      {nutritionDecision.constraints && nutritionDecision.constraints.length > 0 && (
        <div className="row mt-3">
          <div className="col-12">
            <h5 className="mb-3 text-muted">{t('applied_constraints')}</h5>
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <ul className="mb-0">
                  {nutritionDecision.constraints.map((c, i) => (
                    <li key={i} className="mb-2">
                      <strong>{c.code}:</strong> {c.reason} 
                      {c.value?.food ? ` (${c.value.food})` : ""}
                      {c.value?.substance ? ` (${c.value.substance})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
