import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function TrainingSchedule() {
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

  const { training_program, cardio_program } = program;
  const trainingSessions = training_program?.weekly_training_plan?.sessions || [];
  const cardioSessions = cardio_program?.weekly_schedule?.sessions || [];

  const daysOfWeek = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];

  return (
    <div>
      <div className="row">
          <div className="col-12">
              <h4 className="card-title mb-4">{t('weekly_training_schedule')}</h4>
          </div>
      </div>
      
      <div className="row">
        {daysOfWeek.map((dayName, idx) => {
          const tDay = trainingSessions.find(s => s.scheduled_day === dayName.toUpperCase());
          const cDay = cardioSessions.find(s => s.scheduled_day === dayName.toUpperCase());
          
          const isRest = !tDay && !cDay;
          
          return (
            <div className="col-lg-3 mb-4" key={dayName}>
                <div className={`card h-100 ${isRest ? 'bg-light' : 'border-primary border'}`}>
                    <div className={`card-header ${isRest ? '' : 'bg-primary text-white'}`}>
                        <h4 className={`card-title mb-0 ${isRest ? 'text-muted' : 'text-white'}`}>{t('day')} {idx + 1}: {t(dayName)}</h4>
                    </div>
                    <div className={`card-body ${isRest ? 'text-center' : ''}`}>
                        {isRest ? (
                          <>
                            <i className="iconoir-peace-hand h1 text-muted mb-3 d-block mt-4"></i>
                            <h5 className="card-title text-muted">{t('rest_day')}</h5>
                            <p className="card-text text-muted mb-0">{t('active_recovery')}</p>
                          </>
                        ) : (
                          <>
                            {tDay && (
                              <div className="mb-3">
                                <h5 className="card-title text-primary">{tDay.session_code || tDay.focus || t('training_session')}</h5>
                                <p className="card-text text-muted mb-2">
                                  <span className="badge bg-soft-primary text-primary">{tDay.focus}</span>
                                </p>
                                <ul className="list-unstyled mb-0 mt-3">
                                    {tDay.exercises && tDay.exercises.slice(0, 4).map((ex, exIdx) => (
                                      <li key={exIdx} className="mb-2">
                                        <i className="iconoir-check text-success me-2"></i>
                                        <strong>{ex.name_en || ex.exercise_code || ex.slot_code}</strong>
                                        <br/>
                                        <small className="text-muted ms-4">
                                          {ex.prescription ? `${ex.prescription.sets} ${t('sets')} x ${ex.prescription.target_min}-${ex.prescription.target_max} ${ex.prescription.unit}` : ""}
                                        </small>
                                      </li>
                                    ))}
                                    {tDay.exercises && tDay.exercises.length > 4 && (
                                      <li><i className="iconoir-more-horizontal text-muted me-2"></i>+{tDay.exercises.length - 4} {t('more')}</li>
                                    )}
                                </ul>
                              </div>
                            )}

                            {cDay && (
                              <div className="mt-3 pt-3 border-top">
                                <h5 className="card-title text-info"><i className="iconoir-activity"></i> {t('cardio')}</h5>
                                <ul className="list-unstyled mb-0">
                                    <li>
                                      <i className="iconoir-check text-info me-2"></i>
                                      {cDay.session?.modality || t('cardio')} ({cDay.session?.intensity || "MODERATE"})
                                      <br/>
                                      <small className="text-muted ms-4">{cDay.session?.durationMinutes || 0} {t('mins')}</small>
                                    </li>
                                </ul>
                              </div>
                            )}
                          </>
                        )}
                    </div>
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
