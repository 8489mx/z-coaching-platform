import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function DashboardClone() {
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
        <Link to="/intake" className="btn btn-primary mt-3">{t('go_to_intake')}</Link>
      </div>
    );
  }

  const { training_program, nutrition_program, cardio_program, intake_decision } = programData;
  const trainingSessionsCount = training_program?.training_decision?.recommended_days || 0;
  const targetCalories = nutrition_program?.stages?.macro_targets?.target_calories || 0;
  
  let cardioDesc = "None";
  if (cardio_program?.prescription?.steps_prescription?.active) {
    cardioDesc = "Steps Only";
  } else if (cardio_program?.prescription?.recommended_sessions > 0) {
    cardioDesc = `${cardio_program.prescription.recommended_sessions} Sessions/wk`;
  }

  const planStatus = intake_decision?.plan_status || "UNKNOWN";

  return (
    <div>
      <div className="row justify-content-center">
          <div className="col-md-6 col-lg-3">
              <div className="card shadow-sm border-0">
                  <div className="card-body">
                      <div className="row d-flex justify-content-center border-dashed-bottom pb-3">
                          <div className="col-9">
                              <p className="text-dark mb-0 fw-semibold fs-14">{t('training_days')}</p>
                              <h3 className="mt-2 mb-0 fw-bold">{trainingSessionsCount}</h3>
                          </div>
                          <div className="col-3 align-self-center">
                              <div className="d-flex justify-content-center align-items-center thumb-xl bg-light rounded-circle mx-auto">
                                  <i className="iconoir-dumbbell h1 align-self-center mb-0 text-secondary"></i>
                              </div>
                          </div>
                      </div>
                      <p className="mb-0 text-truncate text-muted mt-3">
                        <Link to="/schedule" className="text-primary">{t('view_full_schedule')}</Link>
                      </p>
                  </div>
              </div>
          </div>
          
          <div className="col-md-6 col-lg-3">
              <div className="card shadow-sm border-0">
                  <div className="card-body">
                      <div className="row d-flex justify-content-center border-dashed-bottom pb-3">
                          <div className="col-9">
                              <p className="text-dark mb-0 fw-semibold fs-14">{t('target_calories')}</p>
                              <h3 className="mt-2 mb-0 fw-bold">{targetCalories}</h3>
                          </div>
                          <div className="col-3 align-self-center">
                              <div className="d-flex justify-content-center align-items-center thumb-xl bg-light rounded-circle mx-auto">
                                  <i className="iconoir-apple-half-drawn h1 align-self-center mb-0 text-secondary"></i>
                              </div>
                          </div>
                      </div>
                      <p className="mb-0 text-truncate text-muted mt-3">
                         <Link to="/nutrition" className="text-primary">{t('view_nutrition_plan')}</Link>
                      </p>
                  </div>
              </div>
          </div>
          
          <div className="col-md-6 col-lg-3">
              <div className="card shadow-sm border-0">
                  <div className="card-body">
                      <div className="row d-flex justify-content-center border-dashed-bottom pb-3">
                          <div className="col-9">
                              <p className="text-dark mb-0 fw-semibold fs-14">{t('cardio_prescription')}</p>
                              <h3 className="mt-2 mb-0 fw-bold fs-20">{cardioDesc === 'None' ? t('none') : cardioDesc === 'Steps Only' ? t('steps_only') : cardioDesc}</h3>
                          </div>
                          <div className="col-3 align-self-center">
                              <div className="d-flex justify-content-center align-items-center thumb-xl bg-light rounded-circle mx-auto">
                                  <i className="iconoir-activity h1 align-self-center mb-0 text-secondary"></i>
                              </div>
                          </div>
                      </div>
                      <p className="mb-0 text-truncate text-muted mt-3">
                         <span className="text-success">{t('generated_by_ai')}</span>
                      </p>
                  </div>
              </div>
          </div>

          <div className="col-md-6 col-lg-3">
              <div className="card shadow-sm border-0">
                  <div className="card-body">
                      <div className="row d-flex justify-content-center border-dashed-bottom pb-3">
                          <div className="col-9">
                              <p className="text-dark mb-0 fw-semibold fs-14">{t('plan_status')}</p>
                              <h3 className="mt-2 mb-0 fw-bold fs-20 text-success">{planStatus}</h3>
                          </div>
                          <div className="col-3 align-self-center">
                              <div className="d-flex justify-content-center align-items-center thumb-xl bg-light rounded-circle mx-auto">
                                  <i className="iconoir-check-circle h1 align-self-center mb-0 text-success"></i>
                              </div>
                          </div>
                      </div>
                      <p className="mb-0 text-truncate text-muted mt-3">
                         {t('all_systems_go')}
                      </p>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
