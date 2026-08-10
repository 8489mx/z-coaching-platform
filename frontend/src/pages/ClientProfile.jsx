import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function ClientProfile() {
  const [programData, setProgramData] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    const data = localStorage.getItem("zcc_master_program");
    if (data) {
      try {
        setProgramData(JSON.parse(data));
      } catch (e) {
        console.error("Error parsing program data", e);
      }
    }
  }, []);

  if (!programData) {
    return (
      <div className="text-center my-5">
        <h4>{t('no_program')}</h4>
        <p className="text-muted">{t('no_program_desc')}</p>
      </div>
    );
  }

  const { intake_decision, nutrition_engine, training_engine, cardio_engine } = programData;
  const intake = intake_decision?.data || {};
  const primaryGoal = intake.goals?.primary || "Unknown";
  const weight = intake.body?.weightKg || "--";

  return (
    <div>
        <div className="row justify-content-center">
            <div className="col-12">
                <div className="card">
                    <div className="card-body">
                        <div className="row">
                            <div className="col-lg-4 align-self-center mb-3 mb-lg-0">
                                <div className="d-flex align-items-center flex-row flex-wrap">
                                    <div className="position-relative me-3">
                                        <img src="assets/images/users/avatar-7.jpg" alt="" height="120" className="rounded-circle" />
                                    </div>
                                    <div className="">
                                        <h5 className="fw-semibold fs-22 mb-1">Ahmed Khaled (Test)</h5>                                                        
                                        <p className="mb-0 text-muted fw-medium">{t('active_member')}, Egypt</p>                                                        
                                    </div>
                                </div>                                                
                            </div>
                            
                            <div className="col-lg-4 ms-auto align-self-center">
                                <div className="d-flex justify-content-center">
                                    <div className="border-dashed rounded border-theme-color p-2 me-2 flex-grow-1 flex-basis-0 text-center">
                                        <h5 className="fw-semibold fs-22 mb-1">{weight} {t('kg', 'kg')}</h5>
                                        <p className="text-muted mb-0 fw-medium">{t('current_weight')}</p>
                                    </div>
                                    <div className="border-dashed rounded border-theme-color p-2 me-2 flex-grow-1 flex-basis-0 text-center">
                                        <h5 className="fw-semibold fs-22 mb-1">{primaryGoal.replace("_", " ")}</h5>
                                        <p className="text-muted mb-0 fw-medium">{t('primary_goal')}</p>
                                    </div>
                                    <div className="border-dashed rounded border-theme-color p-2 me-2 flex-grow-1 flex-basis-0 text-center">
                                        <h5 className="fw-semibold fs-22 mb-1">{t('week_1')}</h5>
                                        <p className="text-muted mb-0 fw-medium">{t('plan_progress')}</p>
                                    </div>
                                </div>                                          
                            </div>
                            <div className="col-lg-4 align-self-center">
                                <div className="row row-cols-2">
                                    <div className="col text-end">
                                        
                                    </div>  
                                    <div className="col align-self-center">
                                        <button type="button" className="btn btn-primary d-inline-block w-100 mb-2">{t('update_profile')}</button> 
                                        <a href="#/intake" className="btn btn-light d-inline-block w-100">{t('regenerate_plan')}</a>  
                                    </div>
                                </div>                                   
                            </div>
                        </div>
                    </div> 
                </div> 
            </div> 
        </div>

        <div className="row justify-content-center">
            <div className="col-md-4">
                <div className="card">
                    <div className="card-header">
                        <div className="row align-items-center">
                            <div className="col">                      
                                <h4 className="card-title">{t('intake_information')}</h4>                      
                            </div>
                        </div>                                  
                    </div>
                    <div className="card-body pt-0">
                        <p className="text-muted fw-medium mb-3">{t('intake_snapshot_desc')}</p>
                        <ul className="list-unstyled mb-0">                                        
                            <li className=""><i className="iconoir-calendar me-2 text-secondary fs-22 align-middle"></i> <b> {t('gender')} </b> : {intake.personal?.sex}</li>
                            <li className="mt-2"><i className="iconoir-ruler me-2 text-secondary fs-22 align-middle"></i> <b> {t('height')} </b> : {intake.body?.heightCm} cm</li>
                            <li className="mt-2"><i className="iconoir-activity me-2 text-secondary fs-22 align-middle"></i> <b> {t('activity')} </b> : {intake.lifestyle?.dailyActivity}</li>
                            <li className="mt-2"><i className="iconoir-no-smoking me-2 text-secondary fs-22 align-middle"></i> <b> {t('medical')} </b> : {intake.medical?.conditions?.length > 0 ? intake.medical.conditions[0].conditionCode : 'None'}</li>
                            <li className="mt-2"><i className="iconoir-apple-half text-secondary fs-22 align-middle me-2"></i> <b> {t('allergies')} </b> : {intake.nutrition?.allergies?.length > 0 ? 'Yes' : 'None'}</li>
                        </ul> 
                    </div>
                </div> 
            </div> 
            <div className="col-md-8">
                <div className="card">
                    <div className="card-header">
                        <h4 className="card-title">{t('recent_engine_logs')}</h4>
                    </div>
                    <div className="card-body pt-0">
                        <ul className="list-group list-group-flush mb-0">
                            {nutrition_engine && (
                              <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                  <div>
                                      <h6 className="m-0">{t('nutrition_engine_macros')}</h6>
                                      <small className="text-muted">{t('target')}: {nutrition_engine.energy_target?.targetCalories} {t('kcal')}</small>
                                  </div>
                                  <span className="badge bg-success rounded-pill">{t('success')}</span>
                              </li>
                            )}
                            {training_engine && (
                              <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                  <div>
                                      <h6 className="m-0">{t('training_engine_volume')}</h6>
                                      <small className="text-muted">{training_engine.training_plan_specification?.daysPerWeek} {t('days_week_split')}</small>
                                  </div>
                                  <span className="badge bg-success rounded-pill">{t('success')}</span>
                              </li>
                            )}
                            {cardio_engine && (
                              <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                  <div>
                                      <h6 className="m-0">{t('cardio_engine_plan')}</h6>
                                      <small className="text-muted">{cardio_engine.cardio_prescription?.sessionsPerWeek} {t('sessions_week')}</small>
                                  </div>
                                  <span className="badge bg-success rounded-pill">{t('success')}</span>
                              </li>
                            )}
                            <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                <div>
                                    <h6 className="m-0">{t('intake_form_submitted')}</h6>
                                    <small className="text-muted">{t('parsed_successfully')}</small>
                                </div>
                                <span className="badge bg-primary rounded-pill">{t('info')}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
