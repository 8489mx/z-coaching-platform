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
          
          {/* Page Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div>
              <h4 className="fw-bold text-dark mb-1">مكتبة التمارين والتكنيك الحركي (Exercise Library)</h4>
              <p className="text-muted small mb-0">دليل التمارين المعتمد مع مقاطع الفيديو التوضيحية وشرح التكنيك والأخطاء الشائعة</p>
            </div>
            <span className="badge bg-primary px-3 py-2 rounded-pill fs-6">
              إجمالي التمارين: {exercises.length} تمرين
            </span>
          </div>

          {/* Muscle Group Filter Pills */}
          <div className="d-flex gap-2 mb-3 flex-wrap">
            {muscleCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setMuscleFilter(cat.id)}
                className={`btn btn-sm rounded-pill px-3 fw-bold ${muscleFilter === cat.id ? 'btn-primary shadow-sm' : 'btn-white bg-white border'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Equipment Sub-filter */}
          <div className="d-flex align-items-center gap-2 mb-4">
            <span className="small text-muted fw-bold">الأداة المستخدمة:</span>
            <select 
              className="form-select form-select-sm border rounded-pill bg-white px-3" 
              style={{ width: '180px' }}
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

          {/* Exercise Cards Grid */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted mt-2">جاري استرجاع قائمة التمارين...</p>
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-5 bg-white rounded-4 border">
              <i className="ti ti-barbell-off fs-1 text-muted mb-2 d-block"></i>
              <h6 className="fw-bold text-dark">لا توجد تمارين مطابقة</h6>
              <p className="small text-muted mb-0">جرب تغيير الفلتر أو البحث عن كلمة أخرى</p>
            </div>
          ) : (
            <div className="row g-4">
              {exercises.map((ex) => (
                <div className="col-lg-6" key={ex.id}>
                  <div className="card border-0 shadow-sm bg-white h-100" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                    <div className="card-body p-4 d-flex flex-column justify-content-between">
                      <div>
                        {/* Card Top Badges */}
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="badge bg-primary-subtle text-primary fw-bold px-3 py-1 rounded-pill">
                            {ex.muscle_ar}
                          </span>
                          <span className="badge bg-light text-dark border px-2 py-1 rounded-pill small">
                            {ex.equipment_ar}
                          </span>
                        </div>

                        {/* Exercise Title */}
                        <h5 className="fw-bold text-dark mb-1">{ex.name_ar}</h5>
                        <div className="small text-muted mb-3" style={{ direction: 'ltr', textAlign: 'right' }}>
                          {ex.name_en}
                        </div>

                        {/* Coaching Cues Box */}
                        <div className="p-3 mb-2 rounded-3" style={{ backgroundColor: '#f0fdf4', borderRight: '3px solid #22c55e' }}>
                          <div className="fw-bold text-success small mb-1">
                            <i className="ti ti-check me-1"></i> التكنيك السليم للأداء:
                          </div>
                          <p className="small mb-0 text-dark" style={{ lineHeight: '1.6' }}>
                            {ex.cues_ar}
                          </p>
                        </div>

                        {/* Common Mistakes Box */}
                        <div className="p-3 rounded-3 mb-3" style={{ backgroundColor: '#fef2f2', borderRight: '3px solid #ef4444' }}>
                          <div className="fw-bold text-danger small mb-1">
                            <i className="ti ti-alert-circle me-1"></i> أخطاء شائعة لتجنب الإصابة:
                          </div>
                          <p className="small mb-0 text-dark" style={{ lineHeight: '1.6' }}>
                            {ex.mistakes_ar}
                          </p>
                        </div>
                      </div>

                      {/* Video Button */}
                      <div className="pt-2 border-top d-flex justify-content-between align-items-center">
                        <span className="small text-muted">
                          المستوى: <span className="fw-bold text-dark">{ex.difficulty}</span>
                        </span>
                        <button 
                          type="button"
                          onClick={() => setActiveVideo(ex)}
                          className="btn btn-outline-primary btn-sm rounded-pill px-4 fw-bold shadow-sm"
                        >
                          <i className="ti ti-player-play me-1"></i> مشاهدة الفيديو التوضيحي 🎬
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Video Modal */}
      <ExerciseVideoModal 
        exercise={activeVideo} 
        onClose={() => setActiveVideo(null)} 
      />
    </AdminLayout>
  );
}
