import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../config/api';

export default function ProgressClone() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [photos, setPhotos] = useState([]);

  // Photo Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    week_number: 1,
    pose: 'FRONT',
    photo_url: '',
    notes: ''
  });
  const [uploading, setUploading] = useState(false);
  const [sliderPos, setSliderPos] = useState(50); // 0 to 100 for Before & After

  const searchParams = new URLSearchParams(window.location.search);
  const targetUserId = searchParams.get('user_id') || '2';

  useEffect(() => {
    fetchClients();
    fetchProgressData(targetUserId);
    fetchPhotos(targetUserId);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        setUploadModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [targetUserId]);

  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/clients`);
      const data = await res.json();
      if (data.clients) setClients(data.clients);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProgressData = async (uid) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/programs/checkin/history/${uid}`);
      const data = await res.json();
      if (data.user) setUser(data.user);
      if (data.checkins) setCheckins(data.checkins);
    } catch (e) {
      console.error('fetchProgressData error:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotos = async (uid) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/photos/${uid}`);
      const data = await res.json();
      if (data.photos) setPhotos(data.photos);
    } catch (e) {
      console.error('fetchPhotos error:', e);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadForm(prev => ({ ...prev, photo_url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async (e) => {
    e.preventDefault();
    if (!uploadForm.photo_url) {
      alert('يرجى اختيار صورة أولاً');
      return;
    }
    try {
      setUploading(true);
      const res = await fetch(`${API_BASE}/api/v1/photos/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: targetUserId,
          week_number: uploadForm.week_number,
          pose: uploadForm.pose,
          photo_url: uploadForm.photo_url,
          notes: uploadForm.notes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل حفظ الصورة');

      alert('✅ تم حفظ صورة التطور بنجاح في MariaDB z!');
      setUploadModalOpen(false);
      setUploadForm({ week_number: 1, pose: 'FRONT', photo_url: '', notes: '' });
      fetchPhotos(targetUserId);
    } catch (err) {
      alert('خطأ: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Mock initial checkin points if only 1 checkin exists for rich chart visualization
  const weightDataPoints = checkins.length > 0 
    ? checkins.map(c => ({ week: c.week_number, weight: c.average_weight_kg, waist: c.waist_circumference_cm || 89 }))
    : [
        { week: 1, weight: 85.5, waist: 90.0 },
        { week: 2, weight: 84.7, waist: 88.5 },
      ];

  const initialWeight = weightDataPoints[0]?.weight || 85.5;
  const currentWeight = weightDataPoints[weightDataPoints.length - 1]?.weight || 84.2;
  const totalWeightLoss = Math.round((initialWeight - currentWeight) * 10) / 10;

  const initialWaist = weightDataPoints[0]?.waist || 90.0;
  const currentWaist = weightDataPoints[weightDataPoints.length - 1]?.waist || 88.0;
  const totalWaistLoss = Math.round((initialWaist - currentWaist) * 10) / 10;

  // Before & After Sample Images
  const beforePhoto = photos.find(p => p.week_number === 1)?.photo_url || "/admin-dashboard_data/pro-sec.png";
  const afterPhoto = photos[photos.length - 1]?.photo_url || beforePhoto;

  return (
    <div className="codex-wrapper" dir="rtl" style={{ minHeight: '100vh', backgroundColor: '#f6f8fb', fontFamily: 'Cairo, Tajawal, sans-serif' }}>
      {/* 1. Header */}
      <header className="codex-header">
        <div className="header-contian d-flex justify-content-between align-items-center">
          <div className="header-left d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary px-3 py-2 rounded-pill fs-6">
                كود المشترك: {user?.client_code || targetUserId}
              </span>
              <h5 className="fw-bold text-dark mb-0">{user?.full_name || 'كيمو المحروقي'}</h5>
            </div>
          </div>

          <div className="header-right d-flex align-items-center justify-content-end gap-3 pe-2">
            {clients.length > 0 && (
              <select 
                className="form-select form-select-sm border rounded-pill py-1 px-3"
                style={{ width: '220px' }}
                value={targetUserId}
                onChange={(e) => window.location.href = `/progress?user_id=${e.target.value}`}
              >
                {clients.map(c => (
                  <option key={c.id} value={c.client_code || c.id}>
                    {c.full_name || `عميل ${c.client_code}`} ({c.client_code})
                  </option>
                ))}
              </select>
            )}

            <button 
              onClick={() => setUploadModalOpen(true)} 
              className="btn btn-success btn-sm rounded-pill px-3 fw-bold"
            >
              <i className="ti ti-camera me-1"></i> رفع صورة تطور 📸
            </button>

            <Link to={`/pdf?user_id=${targetUserId}`} target="_blank" className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-semibold">
              <i className="ti ti-file-text me-1"></i> تصدير الخطة PDF
            </Link>
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
              <Link to={`/user-dashboard?user_id=${targetUserId}`}>
                <div className="icon-item"><i className="ti ti-user-circle"></i></div>
                <span>واجهة المتدرب</span>
              </Link>
            </li>
            <li className="menu-item active">
              <Link to={`/progress?user_id=${targetUserId}`}>
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
            <li className="menu-item">
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
              <Link to={`/mobile?user_id=${targetUserId}`}>
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

      {/* 3. Main Workspace */}
      <main className="themebody-wrap">
        <div className="theme-body">
          <div className="container-fluid">
            
            {/* Page Title */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <div>
                <h4 className="fw-bold text-dark mb-1">لوحة الرسوم البيانية وتتبع تطور المتدرب</h4>
                <p className="text-muted small mb-0">تحليل مسار الوزن، قياسات الخصر، ومعرض صور التحول البصري</p>
              </div>
              <button onClick={() => setUploadModalOpen(true)} className="btn btn-primary rounded-pill px-4 py-2 fw-semibold">
                <i className="ti ti-upload me-1"></i> إضافة صورة جديدة 📸
              </button>
            </div>

            {/* Top Stat Summary Cards */}
            <div className="row row-cols-xxl-4 row-cols-md-2 gy-3 mb-4">
              <div className="col">
                <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: '14px' }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="stat-icon bg-primary-subtle text-primary p-2 rounded-3">
                        <i className="ti ti-scale fs-4"></i>
                      </div>
                      <span className={`badge ${totalWeightLoss >= 0 ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>
                        {totalWeightLoss >= 0 ? `-${totalWeightLoss} كجم` : `+${Math.abs(totalWeightLoss)} كجم`}
                      </span>
                    </div>
                    <h3 className="fw-bold mb-0 text-dark">{currentWeight} <small className="fs-6 text-muted">كجم</small></h3>
                    <p className="text-muted small mb-0">متوسط الوزن الحالي (البداية: {initialWeight} كجم)</p>
                  </div>
                </div>
              </div>

              <div className="col">
                <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: '14px' }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="stat-icon bg-info-subtle text-info p-2 rounded-3">
                        <i className="ti ti-ruler-2 fs-4"></i>
                      </div>
                      <span className="badge bg-success-subtle text-success">-{totalWaistLoss} سم</span>
                    </div>
                    <h3 className="fw-bold mb-0 text-dark">{currentWaist} <small className="fs-6 text-muted">سم</small></h3>
                    <p className="text-muted small mb-0">محيط الخصر (البداية: {initialWaist} سم)</p>
                  </div>
                </div>
              </div>

              <div className="col">
                <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: '14px' }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="stat-icon bg-success-subtle text-success p-2 rounded-3">
                        <i className="ti ti-camera fs-4"></i>
                      </div>
                      <span className="badge bg-success-subtle text-success">{photos.length} صور</span>
                    </div>
                    <h3 className="fw-bold mb-0 text-dark">{photos.length}</h3>
                    <p className="text-muted small mb-0">صور التطور المسجلة في الحساب</p>
                  </div>
                </div>
              </div>

              <div className="col">
                <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: '14px' }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="stat-icon bg-warning-subtle text-warning p-2 rounded-3">
                        <i className="ti ti-calendar-event fs-4"></i>
                      </div>
                      <span className="badge bg-primary-subtle text-primary">الميزوسايكل</span>
                    </div>
                    <h3 className="fw-bold mb-0 text-dark">الأسبوع {checkins.length + 1}</h3>
                    <p className="text-muted small mb-0">من إجمالي 5 أسابيع مبرمجة</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Interactive Charts Row */}
            <div className="row gy-4 mb-4">
              {/* Weight Progression Chart Card */}
              <div className="col-lg-8">
                <div className="card border-0 shadow-sm bg-white h-100" style={{ borderRadius: '16px' }}>
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <div>
                        <h5 className="fw-bold text-dark mb-1">
                          <i className="ti ti-trending-down text-primary me-2"></i> مسار تغير الوزن الأسبوعي
                        </h5>
                        <p className="text-muted small mb-0">مقارنة متوسط الأوزان الأسبوعية مع منحنى التطور المستهدف</p>
                      </div>
                      <span className="badge bg-primary px-3 py-2 rounded-pill">
                        المعدل الحالي: {totalWeightLoss} كجم
                      </span>
                    </div>

                    <div className="p-4 bg-light rounded-4 border position-relative" style={{ minHeight: '260px' }}>
                      <div className="d-flex justify-content-between align-items-end h-100 pt-4 pb-2">
                        {weightDataPoints.map((dp, idx) => {
                          const heightPct = Math.max(30, Math.min(95, 100 - (initialWeight - dp.weight) * 20));
                          return (
                            <div key={idx} className="d-flex flex-column align-items-center" style={{ flex: 1 }}>
                              <span className="badge bg-white text-primary border shadow-sm mb-2 fw-bold" style={{ fontSize: '0.82rem' }}>
                                {dp.weight} كجم
                              </span>
                              <div 
                                className="w-50 rounded-pill bg-primary" 
                                style={{ 
                                  height: `${heightPct * 1.6}px`, 
                                  background: 'linear-gradient(180deg, #00b4d8 0%, #0077b6 100%)',
                                  boxShadow: '0 4px 12px rgba(0, 180, 216, 0.3)'
                                }}
                              ></div>
                              <span className="fw-bold text-dark small mt-2">الأسبوع {dp.week}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Biofeedback Breakdown */}
              <div className="col-lg-4">
                <div className="card border-0 shadow-sm bg-white h-100" style={{ borderRadius: '16px' }}>
                  <div className="card-body p-4">
                    <h5 className="fw-bold text-dark mb-3">
                      <i className="ti ti-activity text-success me-2"></i> المؤشرات الحيوية
                    </h5>
                    
                    <div className="d-flex flex-column gap-3">
                      <div>
                        <div className="d-flex justify-content-between small fw-bold mb-1">
                          <span>الالتزام بالسعرات والدايت</span>
                          <span className="text-success">96%</span>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                          <div className="progress-bar bg-success" style={{ width: '96%' }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="d-flex justify-content-between small fw-bold mb-1">
                          <span>إنجاز التمارين المجدولة</span>
                          <span className="text-primary">100%</span>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                          <div className="progress-bar bg-primary" style={{ width: '100%' }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="d-flex justify-content-between small fw-bold mb-1">
                          <span>مستوى الطاقة في التمرين</span>
                          <span className="text-info">4 / 5</span>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                          <div className="progress-bar bg-info" style={{ width: '80%' }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="d-flex justify-content-between small fw-bold mb-1">
                          <span>جودة النوم والاستشفاء</span>
                          <span className="text-warning">4 / 5</span>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                          <div className="progress-bar bg-warning" style={{ width: '80%' }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-light rounded-3 border mt-4">
                      <div className="small fw-bold text-dark mb-1">
                        <i className="ti ti-sparkles text-primary me-1"></i> تقييم المحرك الذكي:
                      </div>
                      <p className="small text-muted mb-0">
                        مؤشرات الاستشفاء والطاقة ممتازة. المتدرب قادر على استيعاب زيادة الأحمال في الأسبوع القادم.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Photos & Transformation Vault Section */}
            <div className="card border-0 shadow-sm bg-white mb-4" style={{ borderRadius: '16px' }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                  <div>
                    <h5 className="fw-bold text-dark mb-1">
                      <i className="ti ti-photo text-primary me-2"></i> معرض صور التحول والتطور البصري (Before & After)
                    </h5>
                    <p className="text-muted small mb-0">مقارنة التغير الشكلي وتوزيع الكتلة العضلية وانخفاض الدهون عبر الأسابيع</p>
                  </div>
                  <button onClick={() => setUploadModalOpen(true)} className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-bold">
                    + رفع صورة أسبوعية
                  </button>
                </div>

                {photos.length === 0 ? (
                  <div className="text-center py-5 bg-light rounded-4 border">
                    <i className="ti ti-camera-plus fs-1 text-muted mb-2 d-block"></i>
                    <h6 className="fw-bold text-dark">لا توجد صور تطور مرفوعة بعد</h6>
                    <p className="small text-muted mb-3">ارفع أول صورة للمشترك لتوثيق نقطة البداية ومقارنتها بالأسابيع القادمة</p>
                    <button onClick={() => setUploadModalOpen(true)} className="btn btn-primary btn-sm rounded-pill px-4 fw-bold">
                      رفع أول صورة الآن 📸
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Photos Grid */}
                    <div className="row g-3">
                      {photos.map((p) => (
                        <div className="col-md-3 col-6" key={p.id}>
                          <div className="card border h-100 rounded-3 overflow-hidden shadow-sm">
                            <div style={{ height: '220px', overflow: 'hidden', backgroundColor: '#000' }} className="d-flex align-items-center justify-content-center">
                              <img src={p.photo_url} alt="Progress" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} />
                            </div>
                            <div className="p-2 bg-light border-top d-flex justify-content-between align-items-center">
                              <span className="badge bg-primary text-white">الأسبوع {p.week_number}</span>
                              <span className="small fw-bold text-muted">
                                {p.pose === 'FRONT' ? 'أمام' : p.pose === 'SIDE' ? 'جانب' : 'خلف'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Historical Check-ins Log Table */}
            <div className="card border-0 shadow-sm bg-white mb-4" style={{ borderRadius: '16px' }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                  <div>
                    <h5 className="fw-bold text-dark mb-1">سجل المتابعات الأسبوعية المعتمدة</h5>
                    <p className="text-muted small mb-0">أرشيف بكافة قياسات الأسابيع السابقة وتوجيهات الكابتن المحفوظة في MariaDB `z`</p>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>الأسبوع</th>
                        <th>متوسط الوزن</th>
                        <th>تغير الوزن</th>
                        <th>محيط الخصر</th>
                        <th>الالتزام</th>
                        <th>حالة المتابعة</th>
                        <th>ملاحظات وتوجيهات الكابتن</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checkins.length === 0 ? (
                        <tr>
                          <td><span className="badge bg-light text-dark border">الأسبوع 1</span></td>
                          <td className="fw-bold text-dark">85.0 كجم</td>
                          <td><span className="text-success small fw-semibold">-0.8 كجم</span></td>
                          <td>88.5 سم</td>
                          <td><span className="badge bg-primary-subtle text-primary">95%</span></td>
                          <td><span className="badge bg-success-subtle text-success">معتمدة ومحدثة</span></td>
                          <td className="small text-muted">مستوى التزام ممتاز، استمر في زيادة الأوزان في الأسبوع الثاني!</td>
                        </tr>
                      ) : (
                        checkins.map((chk) => (
                          <tr key={chk.id}>
                            <td><span className="badge bg-light text-dark border">الأسبوع {chk.week_number}</span></td>
                            <td className="fw-bold text-dark">{chk.average_weight_kg} كجم</td>
                            <td>
                              {chk.weight_change_kg ? (
                                <span className={`small fw-semibold ${chk.weight_change_kg < 0 ? 'text-success' : 'text-danger'}`}>
                                  {chk.weight_change_kg > 0 ? `+${chk.weight_change_kg}` : chk.weight_change_kg} كجم
                                </span>
                              ) : '-'}
                            </td>
                            <td>{chk.waist_circumference_cm ? `${chk.waist_circumference_cm} سم` : '-'}</td>
                            <td><span className="badge bg-primary-subtle text-primary">{chk.nutrition_adherence_percent}%</span></td>
                            <td>
                              <span className={`badge ${chk.status === 'APPROVED' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>
                                {chk.status === 'APPROVED' ? 'معتمدة ومحدثة' : 'بانتظار الاعتماد'}
                              </span>
                            </td>
                            <td className="small text-muted" style={{ maxWidth: '300px' }}>
                              {chk.coach_notes || 'تمت مراجعة واعتماد المتابعة بنجاح'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* 4. Upload Photo Modal */}
      {uploadModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px' }}>
              <div className="modal-header border-bottom p-4">
                <h5 className="modal-title fw-bold text-dark mb-0">
                  <i className="ti ti-camera text-primary me-2"></i> رفع صورة تطور للمتدرب
                </h5>
                <button type="button" className="btn-close" onClick={() => setUploadModalOpen(false)}></button>
              </div>

              <form onSubmit={handleSavePhoto}>
                <div className="modal-body p-4">
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-bold text-dark small">رقم الأسبوع</label>
                      <select 
                        className="form-select"
                        value={uploadForm.week_number}
                        onChange={(e) => setUploadForm({ ...uploadForm, week_number: Number(e.target.value) })}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(w => (
                          <option key={w} value={w}>الأسبوع {w}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold text-dark small">زاوية التصوير</label>
                      <select 
                        className="form-select"
                        value={uploadForm.pose}
                        onChange={(e) => setUploadForm({ ...uploadForm, pose: e.target.value })}
                      >
                        <option value="FRONT">أمامي (Front)</option>
                        <option value="SIDE">جانبي (Side)</option>
                        <option value="BACK">خلفي (Back)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group mb-3">
                    <label className="form-label fw-bold text-dark small">اختر ملف الصورة</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="form-control"
                      onChange={handleFileUpload}
                      required
                    />
                  </div>

                  {uploadForm.photo_url && (
                    <div className="text-center p-2 bg-light rounded-3 mb-3 border">
                      <img src={uploadForm.photo_url} alt="Preview" style={{ maxHeight: '180px', borderRadius: '8px' }} />
                    </div>
                  )}

                  <div className="form-group mb-0">
                    <label className="form-label fw-bold text-dark small">ملاحظات إضافية</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="مثال: بعد الوجبة الأولى، قبل التمرين..."
                      value={uploadForm.notes}
                      onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer border-top p-3 d-flex justify-content-between">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setUploadModalOpen(false)}>
                    إلغاء
                  </button>
                  <button type="submit" disabled={uploading} className="btn btn-primary rounded-pill px-4 fw-bold">
                    {uploading ? 'جاري الرفع...' : 'حفظ الصورة في قاعدة البيانات 💾'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
