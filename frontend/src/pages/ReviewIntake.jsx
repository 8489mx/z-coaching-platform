import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ReviewIntake() {
  const { id } = useParams(); // submission_id
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSubmission();
  }, [id]);

  const fetchSubmission = async () => {
    try {
      const res = await fetch(`/api/v1/intake/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSubmission(data.submission);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/programs/generate-from-submission/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/admin/clients');
      } else {
        setError(data.error || 'Failed to generate program');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="text-center mt-5"><div className="spinner-border"></div></div>;
  if (error) return <div className="alert alert-danger text-end m-4">{error}</div>;
  if (!submission) return <div className="alert alert-warning text-end m-4">الاستمارة غير موجودة</div>;

  const answers = submission.answers || {};

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-10">
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <h4 className="card-title mb-0">مراجعة استمارة العميل</h4>
            <button onClick={() => navigate('/admin/clients')} className="btn btn-outline-secondary btn-sm">عودة للقائمة</button>
          </div>
          <div className="card-body bg-light">
            {error && <div className="alert alert-danger">{error}</div>}
            
            <div className="row">
              {/* Personal */}
              <div className="col-md-6 mb-3">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="border-bottom pb-2 mb-3">البيانات الشخصية والهدف</h5>
                    <ul className="list-group list-group-flush text-end">
                      <li className="list-group-item d-flex justify-content-between"><span>الجنس:</span> <strong>{answers.personal?.sex}</strong></li>
                      <li className="list-group-item d-flex justify-content-between"><span>تاريخ الميلاد:</span> <strong>{answers.personal?.dateOfBirth}</strong></li>
                      <li className="list-group-item d-flex justify-content-between"><span>الهدف الأساسي:</span> <strong className="text-primary">{answers.goals?.primary}</strong></li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="col-md-6 mb-3">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="border-bottom pb-2 mb-3">الجسم والنشاط</h5>
                    <ul className="list-group list-group-flush text-end">
                      <li className="list-group-item d-flex justify-content-between"><span>الطول:</span> <strong>{answers.body?.heightCm} cm</strong></li>
                      <li className="list-group-item d-flex justify-content-between"><span>الوزن:</span> <strong>{answers.body?.weightKg} kg</strong></li>
                      <li className="list-group-item d-flex justify-content-between"><span>النشاط اليومي:</span> <strong>{answers.lifestyle?.dailyActivity}</strong></li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Training */}
              <div className="col-md-6 mb-3">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="border-bottom pb-2 mb-3">التدريب والكارديو</h5>
                    <ul className="list-group list-group-flush text-end">
                      <li className="list-group-item d-flex justify-content-between"><span>مكان التدريب:</span> <strong>{answers.training?.location}</strong></li>
                      <li className="list-group-item d-flex justify-content-between"><span>أيام التدريب:</span> <strong>{answers.training?.maxDaysPerWeek} أيام</strong></li>
                      <li className="list-group-item d-flex justify-content-between"><span>مستوى الخبرة:</span> <strong>{answers.training?.experience}</strong></li>
                      <li className="list-group-item d-flex justify-content-between"><span>أيام الكارديو:</span> <strong>{answers.cardio?.maxSessionsPerWeek} أيام</strong></li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Nutrition */}
              <div className="col-md-6 mb-3">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="border-bottom pb-2 mb-3">التغذية والصحة</h5>
                    <ul className="list-group list-group-flush text-end">
                      <li className="list-group-item d-flex justify-content-between"><span>عدد الوجبات:</span> <strong>{answers.nutrition?.preferredMealCount}</strong></li>
                      <li className="list-group-item d-flex justify-content-between"><span>الحساسية:</span> <strong>{answers.nutrition?.allergies?.length > 0 ? answers.nutrition.allergies[0].substance : 'لا يوجد'}</strong></li>
                      <li className="list-group-item d-flex justify-content-between"><span>الحالة الطبية:</span> <strong>{answers.medical?.conditions?.length > 0 ? answers.medical.conditions[0].otherConditionText : 'سليم'}</strong></li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>

            <div className="text-center mt-5">
              <button 
                onClick={handleGenerate} 
                disabled={generating || submission.status !== 'PENDING'} 
                className="btn btn-success px-5 py-2 fw-bold fs-5 shadow"
              >
                {generating ? 'جاري التوليد باستخدام الذكاء الاصطناعي...' : 
                 submission.status === 'PROCESSED' ? 'تم التوليد مسبقاً' :
                 'توليد الخطة الشاملة للعميل'}
              </button>
              <p className="text-muted mt-2">
                سيقوم النظام بتوليد خطة التغذية، والتدريب، والكارديو، وحفظها في ملف العميل مباشرة.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
