import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import UploadPhotoModal from '../components/modals/UploadPhotoModal';

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
  const [sliderPos, setSliderPos] = useState(50);

  const searchParams = new URLSearchParams(window.location.search);
  const targetUserId = searchParams.get('user_id') || '2';

  useEffect(() => {
    fetchClients();
    fetchProgressData(targetUserId);
    fetchPhotos(targetUserId);
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
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadForm({ ...uploadForm, photo_url: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePhoto = async (e) => {
    e.preventDefault();
    if (!uploadForm.photo_url) return;
    try {
      setUploading(true);
      const res = await fetch(`${API_BASE}/api/v1/photos/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_code: targetUserId,
          week_number: uploadForm.week_number,
          pose: uploadForm.pose,
          photo_url: uploadForm.photo_url,
          notes: uploadForm.notes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل حفظ الصورة');

      alert(' تم حفظ الصورة بنجاح!');
      setUploadModalOpen(false);
      setUploadForm({ week_number: 1, pose: 'FRONT', photo_url: '', notes: '' });
      fetchPhotos(targetUserId);
    } catch (err) {
      alert('خطأ: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const initialWeight = checkins[0]?.average_weight || 90.0;
  const currentWeight = checkins[checkins.length - 1]?.average_weight || 84.4;
  const totalWeightLoss = (initialWeight - currentWeight).toFixed(1);

  const initialWaist = checkins[0]?.waist_circumference_cm || 94.0;
  const currentWaist = checkins[checkins.length - 1]?.waist_circumference_cm || 87.5;
  const totalWaistLoss = (initialWaist - currentWaist).toFixed(1);

  const beforePhoto = photos.find(p => p.week_number === 1 && p.pose === 'FRONT') || { photo_url: '/admin-dashboard_data/user-dashboard/before-sample.png' };
  const afterPhoto = photos.filter(p => p.pose === 'FRONT').pop() || { photo_url: '/admin-dashboard_data/user-dashboard/after-sample.png' };

  const weightDataPoints = checkins.length > 0 ? checkins.map(c => ({
    week: c.week_number,
    weight: c.average_weight,
    waist: c.waist_circumference_cm,
    adherence: c.nutrition_adherence_percent
  })) : [
    { week: 1, weight: 90.0, waist: 94.0, adherence: 90 },
    { week: 2, weight: 87.5, waist: 91.0, adherence: 95 },
    { week: 3, weight: 85.8, waist: 89.0, adherence: 92 },
    { week: 4, weight: 84.4, waist: 87.5, adherence: 96 }
  ];

  return (
    <AdminLayout>
      <div className="theme-body">
        <div className="container-fluid">
          
          {/* Page Header (Quiet Luxury) */}
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h4 className="fw-bold text-dark mb-0" style={{ letterSpacing: '-0.3px', fontSize: '1.25rem' }}>
                  لوحة الرسوم البيانية وتتبع تطور المتدرب
                </h4>
                <span className="badge rounded-pill fw-bold" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.7rem' }}>
                  Z COACHING V2.0
                </span>
              </div>
              <p className="text-muted small mb-0" style={{ fontSize: '0.8rem' }}>
                تحليل مسار الوزن، قياسات الخصر، ومعرض صور التحول البصري للمتدرب: <strong className="text-dark">{user?.full_name || 'كيمو المحروقي'}</strong>
              </p>
            </div>
            <div className="d-flex gap-2">
              <button 
                type="button"
                onClick={() => setUploadModalOpen(true)} 
                className="btn btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-1 shadow-sm text-white"
                style={{ 
                  height: '34px', 
                  fontSize: '0.8rem',
                  background: '#261c6a',
                  border: 'none',
                  boxShadow: '0 3px 10px rgba(38, 28, 106, 0.28)'
                }}
              >
                <i className="ti ti-upload fs-6"></i> 
                <span>إضافة صورة جديدة</span>
              </button>
            </div>
          </div>

          {/* Top 4 KPI Cards (Exact Universal Design) */}
          <div className="row row-cols-xxl-4 row-cols-md-2 g-3 mb-3">
            {/* 1. Current Average Weight */}
            <div className="col">
              <div className="card border-0 bg-white h-100 shadow-sm" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.68rem', border: '1px solid #a7f3d0' }}>
                      {totalWeightLoss >= 0 ? `-${totalWeightLoss} كجم` : `+${Math.abs(totalWeightLoss)} كجم`}
                    </span>
                    <div className="d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#f5f3ff', color: '#261c6a' }}>
                      <i className="ti ti-scale fs-6"></i>
                    </div>
                  </div>
                  <div>
                    <h3 className="fw-bold mb-0 text-dark d-flex align-items-baseline gap-1" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>
                      <span>{currentWeight}</span>
                      <span className="fs-6 text-muted fw-normal">كجم</span>
                    </h3>
                    <p className="text-muted small mb-0 fw-medium" style={{ fontSize: '0.76rem' }}>متوسط الوزن الحالي (البداية: {initialWeight} كجم)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Waist Circumference */}
            <div className="col">
              <div className="card border-0 bg-white h-100 shadow-sm" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#eff6ff', color: '#0284c7', fontSize: '0.68rem', border: '1px solid #bae6fd' }}>
                      -{totalWaistLoss} سم
                    </span>
                    <div className="d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#eff6ff', color: '#0284c7' }}>
                      <i className="ti ti-ruler-2 fs-6"></i>
                    </div>
                  </div>
                  <div>
                    <h3 className="fw-bold mb-0 text-dark d-flex align-items-baseline gap-1" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>
                      <span>{currentWaist}</span>
                      <span className="fs-6 text-muted fw-normal">سم</span>
                    </h3>
                    <p className="text-muted small mb-0 fw-medium" style={{ fontSize: '0.76rem' }}>محيط الخصر (البداية: {initialWaist} سم)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Progress Photos Count */}
            <div className="col">
              <div className="card border-0 bg-white h-100 shadow-sm" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#f8fafc', color: '#64748b', fontSize: '0.68rem', border: '1px solid #e2e8f0' }}>
                      الصور الموثقة
                    </span>
                    <div className="d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#f1f5f9', color: '#64748b' }}>
                      <i className="ti ti-camera fs-6"></i>
                    </div>
                  </div>
                  <div>
                    <h3 className="fw-bold mb-0 text-dark d-flex align-items-baseline gap-1" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>
                      <span>{photos.length}</span>
                      <span className="fs-6 text-muted fw-normal">صور</span>
                    </h3>
                    <p className="text-muted small mb-0 fw-medium" style={{ fontSize: '0.76rem' }}>صور التطور المسجلة في الحساب</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Mesocycle Week */}
            <div className="col">
              <div className="card border-0 bg-white h-100 shadow-sm" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#f5f3ff', color: '#261c6a', fontSize: '0.68rem', border: '1px solid #ddd6fe' }}>
                      الميزوسايكل
                    </span>
                    <div className="d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#f5f3ff', color: '#261c6a' }}>
                      <i className="ti ti-calendar-event fs-6"></i>
                    </div>
                  </div>
                  <div>
                    <h3 className="fw-bold mb-0 text-dark d-flex align-items-baseline gap-1" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>
                      <span>الأسبوع {checkins.length > 0 ? checkins.length + 1 : 2}</span>
                    </h3>
                    <p className="text-muted small mb-0 fw-medium" style={{ fontSize: '0.76rem' }}>من إجمالي 5 أسابيع مبرمجة</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Charts Row */}
          <div className="row g-3 mb-4">
            {/* Weight Progression Chart */}
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm bg-white h-100" style={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '0.98rem' }}>
                        <i className="ti ti-trending-down text-primary me-2"></i> مسار تغير الوزن الأسبوعي
                      </h5>
                      <p className="text-muted small mb-0" style={{ fontSize: '0.78rem' }}>مقارنة متوسط الأوزان الأسبوعية مع منحنى التطور المستهدف</p>
                    </div>
                    <span className="badge rounded-pill fw-semibold px-3 py-1" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.75rem' }}>
                      المعدل الحالي: {totalWeightLoss} كجم
                    </span>
                  </div>

                  <div className="p-4 rounded-4 border position-relative" style={{ minHeight: '250px', background: '#fbfaff', borderColor: '#ede9fe' }}>
                    <div className="d-flex justify-content-between align-items-end h-100 pt-3 pb-1">
                      {weightDataPoints.map((dp, idx) => {
                        const heightPct = Math.max(30, Math.min(95, 100 - (initialWeight - dp.weight) * 15));
                        return (
                          <div key={idx} className="d-flex flex-column align-items-center" style={{ flex: 1 }}>
                            <span className="badge bg-white border shadow-xs mb-2 fw-bold font-monospace" style={{ color: '#261c6a', fontSize: '0.78rem' }}>
                              {dp.weight} كجم
                            </span>
                            <div 
                              className="w-50 rounded-pill" 
                              style={{ 
                                height: `${heightPct * 1.5}px`, 
                                background: 'linear-gradient(180deg, #372896 0%, #261c6a 100%)',
                                boxShadow: '0 4px 10px rgba(38, 28, 106, 0.22)'
                              }}
                            ></div>
                            <span className="fw-bold text-dark small mt-2" style={{ fontSize: '0.78rem' }}>الأسبوع {dp.week}</span>
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
              <div className="card border-0 shadow-sm bg-white h-100" style={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div className="card-body p-4">
                  <h5 className="fw-bold text-dark mb-3" style={{ fontSize: '0.98rem' }}>
                    <i className="ti ti-activity-heartbeat text-success me-2"></i> جودة الاستجابة والمؤشرات الحيوية
                  </h5>
                  <div className="d-flex flex-column gap-3">
                    <div className="p-3 rounded-3 border" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small text-muted" style={{ fontSize: '0.78rem' }}>الالتزام بالدايت</span>
                        <span className="fw-bold text-dark" style={{ fontSize: '0.82rem' }}>95%</span>
                      </div>
                      <div className="progress" style={{ height: '4px', background: '#e2e8f0' }}>
                        <div className="progress-bar" style={{ width: '95%', background: '#059669' }}></div>
                      </div>
                    </div>

                    <div className="p-3 rounded-3 border" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small text-muted" style={{ fontSize: '0.78rem' }}>مستوى الجوع والتحكم بالشهية</span>
                        <span className="fw-bold text-dark" style={{ fontSize: '0.82rem' }}>2 / 5 (ممتاز)</span>
                      </div>
                      <div className="progress" style={{ height: '4px', background: '#e2e8f0' }}>
                        <div className="progress-bar" style={{ width: '80%', background: '#261c6a' }}></div>
                      </div>
                    </div>

                    <div className="p-3 rounded-3 border" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small text-muted" style={{ fontSize: '0.78rem' }}>مستوى الطاقة والنشاط في التمرين</span>
                        <span className="fw-bold text-dark" style={{ fontSize: '0.82rem' }}>4 / 5 (عالي)</span>
                      </div>
                      <div className="progress" style={{ height: '4px', background: '#e2e8f0' }}>
                        <div className="progress-bar" style={{ width: '85%', background: '#d97706' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Before & After Photo Comparison */}
          <div className="card border-0 shadow-sm bg-white mb-4" style={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                  <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '0.98rem' }}>
                    <i className="ti ti-transform text-primary me-2"></i> مقارنة التحول البصري التفاعلية (Before & After Slider)
                  </h5>
                  <p className="text-muted small mb-0" style={{ fontSize: '0.78rem' }}>اسحب المؤشر لمقارنة التطور العضلي ونسبة الدهون بين الأسبوع الأول والأسبوع الأخير</p>
                </div>
              </div>

              <div className="row g-4 align-items-center justify-content-center">
                <div className="col-lg-6 text-center">
                  <div 
                    className="position-relative mx-auto overflow-hidden rounded-4 border shadow-sm"
                    style={{ maxWidth: '440px', height: '360px', backgroundColor: '#0f172a' }}
                  >
                    {/* Before Image */}
                    <img 
                      src={beforePhoto.photo_url || '/admin-dashboard_data/user-dashboard/before-sample.png'} 
                      alt="Before" 
                      className="position-absolute top-0 start-0 w-100 h-100"
                      style={{ objectFit: 'contain' }}
                    />
                    
                    {/* After Image with clip */}
                    <div 
                      className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden"
                      style={{ width: `${sliderPos}%` }}
                    >
                      <img 
                        src={afterPhoto.photo_url || '/admin-dashboard_data/user-dashboard/after-sample.png'} 
                        alt="After" 
                        className="position-absolute top-0 start-0"
                        style={{ width: '440px', height: '360px', objectFit: 'contain' }}
                      />
                    </div>

                    {/* Divider Line */}
                    <div 
                      className="position-absolute top-0 bottom-0 bg-white"
                      style={{ left: `${sliderPos}%`, width: '2px', zIndex: 5 }}
                    >
                      <div className="position-absolute top-50 start-50 translate-middle text-white rounded-circle p-1 d-flex align-items-center justify-content-center shadow" style={{ width: '28px', height: '28px', background: '#261c6a' }}>
                        <i className="ti ti-arrows-left-right" style={{ fontSize: '0.75rem' }}></i>
                      </div>
                    </div>

                    {/* Labels */}
                    <span className="position-absolute top-0 start-0 m-2 badge bg-dark bg-opacity-75 text-white small" style={{ fontSize: '0.7rem' }}>البداية (الأسبوع 1)</span>
                    <span className="position-absolute top-0 end-0 m-2 badge text-white small" style={{ fontSize: '0.7rem', background: '#261c6a' }}>الآن (الأسبوع {checkins.length + 1})</span>
                  </div>

                  {/* Range Input Slider */}
                  <div className="mt-3 px-4" style={{ maxWidth: '440px', margin: '0 auto' }}>
                    <input 
                      type="range" 
                      className="form-range" 
                      min="0" 
                      max="100" 
                      value={sliderPos}
                      onChange={(e) => setSliderPos(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Upload Photo Modal */}
      {uploadModalOpen && (
        <UploadPhotoModal 
          onClose={() => setUploadModalOpen(false)}
          onSuccess={() => {
            fetchPhotos(targetUserId);
            setUploadModalOpen(false);
          }}
          targetUserId={targetUserId}
        />
      )}
    </AdminLayout>
  );
}
