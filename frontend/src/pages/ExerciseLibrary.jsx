import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import ExerciseVideoModal from '../components/modals/ExerciseVideoModal';

export default function ExerciseLibrary() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [muscleFilter, setMuscleFilter] = useState('ALL');
  const [equipmentFilter, setEquipmentFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    fetchExercises();
  }, [muscleFilter, equipmentFilter, searchTerm]);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (muscleFilter !== 'ALL') params.append('muscle', muscleFilter);
      if (equipmentFilter !== 'ALL') params.append('equipment', equipmentFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await fetch(`${API_BASE}/api/v1/exercises?${params.toString()}`);
      const data = await res.json();
      if (data.exercises) setExercises(data.exercises);
    } catch (e) {
      console.error('fetchExercises error:', e);
    } finally {
      setLoading(false);
    }
  };

  const muscleCategories = [
    { id: 'ALL', label: 'جميع العضلات' },
    { id: 'CHEST', label: 'عضلات الصدر' },
    { id: 'BACK', label: 'عضلات الظهر' },
    { id: 'LEGS', label: 'الأرجل والأرداف' },
    { id: 'SHOULDERS', label: 'الأكتاف' },
    { id: 'ARMS', label: 'الذراعين (باي وتراي)' },
    { id: 'CORE', label: 'البطن والكور' },
  ];

  return (
    <AdminLayout searchTerm={searchTerm} onSearchChange={setSearchTerm} searchPlaceholder="بحث في مكتبة التمارين والتكنيك...">
      <div className="theme-body">
        <div className="container-fluid">
          
          {/* Page Header (Consistent with Dashboard) */}
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h4 className="fw-bold text-dark mb-0" style={{ letterSpacing: '-0.3px', fontSize: '1.25rem' }}>
                  مكتبة التمارين والتكنيك الحركي (Exercise Library)
                </h4>
                <span className="badge rounded-pill fw-bold" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.7rem' }}>
                  Z COACHING V2.0
                </span>
              </div>
              <p className="text-muted small mb-0" style={{ fontSize: '0.8rem' }}>
                دليل التمارين المعتمد مع مقاطع الفيديو التوضيحية وشرح التكنيك والأخطاء الشائعة
              </p>
            </div>
            <span className="badge rounded-pill px-3 py-2 fw-semibold" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.78rem' }}>
              إجمالي التمارين: {exercises.length} تمرين
            </span>
          </div>

          {/* Filter Bar */}
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            {/* Muscle Group Filter Pills */}
            <div className="d-flex gap-2 flex-wrap align-items-center">
              {muscleCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setMuscleFilter(cat.id)}
                  className={`btn btn-sm rounded-pill px-3 fw-bold transition-all ${muscleFilter === cat.id ? 'text-white shadow-xs' : 'bg-white text-dark border'}`}
                  style={{
                    background: muscleFilter === cat.id ? '#261c6a' : '#ffffff',
                    borderColor: muscleFilter === cat.id ? '#261c6a' : '#e2e8f0',
                    fontSize: '0.8rem',
                    height: '34px'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Equipment Sub-filter */}
            <div className="d-flex align-items-center gap-2">
              <span className="small text-muted fw-semibold" style={{ fontSize: '0.78rem' }}>الأداة:</span>
              <select 
                className="form-select form-select-sm border rounded-pill bg-white shadow-xs" 
                style={{ width: '160px', height: '36px', fontSize: '0.82rem', borderColor: '#e2e8f0' }}
                value={equipmentFilter}
                onChange={(e) => setEquipmentFilter(e.target.value)}
              >
                <option value="ALL">جميع الأدوات</option>
                <option value="BARBELL">بار أولمبي</option>
                <option value="DUMBBELL">دمبلز</option>
                <option value="CABLE">كابلات</option>
                <option value="MACHINE">أجهزة</option>
                <option value="BODYWEIGHT">وزن الجسم</option>
              </select>
            </div>
          </div>

          {/* Exercise Cards Grid */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
              <p className="text-muted mt-2 small">جاري استرجاع قائمة التمارين...</p>
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-5 bg-white rounded-4 border" style={{ borderColor: '#e2e8f0' }}>
              <i className="ti ti-barbell-off fs-1 text-muted mb-2 d-block"></i>
              <h6 className="fw-bold text-dark">لا توجد تمارين مطابقة</h6>
              <p className="small text-muted mb-0">جرب تغيير الفلتر أو البحث عن كلمة أخرى</p>
            </div>
          ) : (
            <div className="row g-3">
              {exercises.map((ex) => (
                <div className="col-lg-6" key={ex.id}>
                  <div className="card border-0 shadow-sm bg-white h-100" style={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div className="card-body p-3 d-flex flex-column justify-content-between">
                      <div>
                        {/* Card Top Badges */}
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.72rem' }}>
                            {ex.muscle_ar}
                          </span>
                          <span className="badge bg-light text-secondary border px-2 py-1 rounded-pill" style={{ fontSize: '0.7rem' }}>
                            {ex.equipment_ar}
                          </span>
                        </div>

                        {/* Exercise Title */}
                        <h5 className="fw-bold text-dark mb-0" style={{ fontSize: '0.96rem', letterSpacing: '-0.2px' }}>{ex.name_en}</h5>
                        <div className="small text-muted mb-3" style={{ fontSize: '0.78rem' }}>
                          {ex.name_ar}
                        </div>

                        {/* Coaching Cues Box (Quiet Luxury) */}
                        <div className="p-2 px-3 mb-2 rounded-3" style={{ backgroundColor: '#fbfaff', border: '1px solid #ede9fe', borderRight: '3px solid #261c6a' }}>
                          <div className="fw-bold small mb-1" style={{ color: '#261c6a', fontSize: '0.76rem' }}>
                            <i className="ti ti-check me-1"></i> التكنيك السليم للأداء:
                          </div>
                          <p className="mb-0 text-dark" style={{ lineHeight: '1.5', fontSize: '0.78rem' }}>
                            {ex.cues_ar}
                          </p>
                        </div>

                        {/* Common Mistakes Box (Quiet Luxury) */}
                        <div className="p-2 px-3 rounded-3 mb-3" style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRight: '3px solid #d97706' }}>
                          <div className="fw-bold text-warning small mb-1" style={{ fontSize: '0.76rem', color: '#b45309' }}>
                            <i className="ti ti-alert-circle me-1"></i> أخطاء شائعة لتجنب الإصابة:
                          </div>
                          <p className="mb-0 text-dark" style={{ lineHeight: '1.5', fontSize: '0.78rem' }}>
                            {ex.mistakes_ar}
                          </p>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="d-flex justify-content-between align-items-center pt-2 border-top" style={{ borderColor: '#f8fafc' }}>
                        <button
                          type="button"
                          className="btn btn-sm rounded-pill px-3 fw-semibold shadow-xs d-flex align-items-center gap-1"
                          style={{ fontSize: '0.76rem', background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', height: '30px' }}
                          onClick={() => setActiveVideo(ex)}
                        >
                          <i className="ti ti-player-play-filled" style={{ fontSize: '0.75rem' }}></i>
                          <span>مشاهدة الفيديو التوضيحي</span>
                        </button>
                        <span className="text-muted small" style={{ fontSize: '0.74rem' }}>
                          المستوى: <strong>{ex.difficulty === 'ADVANCED' ? 'متقدم' : ex.difficulty === 'BEGINNER' ? 'مبتدئ' : 'متوسط'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Video Modal Popup */}
      {activeVideo && (
        <ExerciseVideoModal
          exercise={activeVideo}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </AdminLayout>
  );
}
