import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function ExerciseLibrary() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [muscleFilter, setMuscleFilter] = useState('ALL');
  const [equipmentFilter, setEquipmentFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    fetchExercises();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        setActiveVideo(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [muscleFilter, equipmentFilter, searchTerm]);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (muscleFilter !== 'ALL') params.append('muscle', muscleFilter);
      if (equipmentFilter !== 'ALL') params.append('equipment', equipmentFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await fetch(`http://localhost:3000/api/v1/exercises?${params.toString()}`);
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
    <div className="codex-wrapper" dir="rtl" style={{ minHeight: '100vh', backgroundColor: '#f6f8fb', fontFamily: 'Cairo, Tajawal, sans-serif' }}>
      {/* 1. Header */}
      <header className="codex-header">
        <div className="header-contian d-flex justify-content-between align-items-center">
          <div className="header-left d-flex align-items-center">
            <div className="input-group" style={{ minWidth: '320px' }}>
              <span className="input-group-text pe-0"><i className="ti ti-search text-muted"></i></span>
              <input 
                type="text" 
                placeholder="بحث في أسماء التمارين، العضلة، التكنيك..." 
                className="form-control" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="header-right d-flex align-items-center justify-content-end gap-3 pe-2">
            <Link to="/" className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-semibold">
              <i className="ti ti-arrow-right me-1"></i> لوحة التحكم
            </Link>

            <div className="d-flex align-items-center gap-2 py-1 px-3 bg-light rounded-pill border ms-2">
              <img className="img-fluid rounded-circle border" src="/admin-dashboard_data/logo/z_coaching_logo.jpg" alt="Coach Logo" width="36" height="36" />
              <div className="d-none d-md-block text-end pe-1">
                <span className="fw-bold d-block text-dark lh-1" style={{ fontSize: '0.9rem' }}>مكتبة التمارين</span>
                <small className="text-muted" style={{ fontSize: '0.72rem' }}>Z Exercise Library</small>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Sidebar (Right Side RTL) */}
      <aside className="codex-sidebar">
        <div 
          className="codex-brand" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            textAlign: 'center', 
            padding: '14px 10px 8px 10px',
            width: '100%',
            border: 'none',
            background: 'transparent'
          }}
        >
          <Link 
            to="/" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              textDecoration: 'none',
              width: '100%',
              margin: '0 auto'
            }}
          >
            <img 
              src="/admin-dashboard_data/logo/z_clean_symbol.jpg?v=2" 
              alt="Z Logo" 
              style={{ 
                height: '76px', 
                width: '76px', 
                objectFit: 'contain', 
                margin: '0 auto',
                display: 'block'
              }} 
            />
            <span 
              style={{ 
                fontSize: '0.92rem', 
                letterSpacing: '4px', 
                fontWeight: '900',
                background: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'block',
                marginTop: '-4px',
                lineHeight: '1.2',
                textAlign: 'center',
                width: '100%'
              }}
            >
              COACHING
            </span>
          </Link>
        </div>

        <div className="codex-menuwrapper custom-scroll" data-simplebar>
          <ul className="codex-menu">
            <li className="menu-item">
              <Link to="/">
                <div className="icon-item"><i className="ti ti-layout-dashboard"></i></div>
                <span>لوحة التحكم الرئيسية</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/user-dashboard">
                <div className="icon-item"><i className="ti ti-user-circle"></i></div>
                <span>واجهة المتدرب</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/progress">
                <div className="icon-item"><i className="ti ti-chart-line"></i></div>
                <span>تطور القياسات والصور</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/subscriptions">
                <div className="icon-item"><i className="ti ti-credit-card"></i></div>
                <span>الاشتراكات والمالية</span>
              </Link>
            </li>
            <li className="menu-item active">
              <Link to="/exercises">
                <div className="icon-item"><i className="ti ti-barbell"></i></div>
                <span>مكتبة التمارين</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/calculator">
                <div className="icon-item"><i className="ti ti-calculator"></i></div>
                <span>حاسبة الماكروز والسعرات</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/customers">
                <div className="icon-item"><i className="ti ti-user-plus"></i></div>
                <span>إدارة المشتركين والأكواد</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/profile">
                <div className="icon-item"><i className="ti ti-settings"></i></div>
                <span>إعدادات وهوية المدرب</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/mobile">
                <div className="icon-item"><i className="ti ti-device-mobile"></i></div>
                <span>تطبيق المتدرب (Mobile)</span>
              </Link>
            </li>
          </ul>
        </div>

        <div className="sidebarpro-sec mt-3 mb-4 mx-3 p-3 text-center" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill fw-bold" style={{ fontSize: '0.74rem' }}>
              <i className="ti ti-circle-filled me-1" style={{ fontSize: '7px' }}></i> محرك الذكاء نشط
            </span>
          </div>
          <h6 className="mb-1 fw-bold text-dark" style={{ fontSize: '0.88rem' }}>Z Coaching Platform</h6>
          <p className="text-muted mb-3" style={{ fontSize: '0.74rem' }}>النظام يعمل بكفاءة 100%</p>
          <Link 
            to="/intake/form" 
            className="btn btn-sm w-100 rounded-pill fw-bold text-white shadow-sm"
            style={{ 
              background: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)',
              padding: '8px 14px',
              fontSize: '0.86rem',
              border: 'none'
            }}
          >
            <i className="ti ti-user-plus me-1"></i> تسجيل مشترك جديد
          </Link>
        </div>
      </aside>

      {/* 3. Main Content Workspace */}
      <main className="themebody-wrap">
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
      </main>

      {/* 4. Video Modal */}
      {activeVideo && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-header border-bottom p-3 bg-light d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="modal-title fw-bold text-dark mb-0">{activeVideo.name_ar}</h6>
                  <small className="text-muted">{activeVideo.name_en}</small>
                </div>
                <button type="button" className="btn-close" onClick={() => setActiveVideo(null)}></button>
              </div>
              <div className="modal-body p-0 bg-black">
                <div className="ratio ratio-16x9">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${activeVideo.video_id}?autoplay=1&rel=0`}
                    title={activeVideo.name_ar}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
              <div className="modal-footer p-3 bg-white d-flex justify-content-between">
                <span className="small text-muted">اضغط Esc للإغلاق في أي وقت</span>
                <button type="button" className="btn btn-secondary btn-sm rounded-pill px-4" onClick={() => setActiveVideo(null)}>
                  إغلاق النافذة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
