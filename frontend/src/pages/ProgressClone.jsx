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

      alert('✅ تم حفظ الصورة بنجاح!');
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

  const weightDataPoints = checkins.map(c => ({
    week: c.week_number,
    weight: c.average_weight,
    waist: c.waist_circumference_cm,
    adherence: c.nutrition_adherence_percent
  }));

  return (
    <AdminLayout>
      <div className="theme-body">
        <div className="container-fluid">
          
          {/* Page Title */}
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div>
              <h4 className="fw-bold text-dark mb-1">لوحة الرسوم البيانية وتتبع تطور المتدرب</h4>
              <p className="text-muted small mb-0">تحليل مسار الوزن، قياسات الخصر، ومعرض صور التحول البصري</p>
            </div>
            <button 
              type="button"
              onClick={() => setUploadModalOpen(true)} 
              className="btn btn-primary rounded-pill px-4 py-2 fw-semibold"
            >
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
                    <i className="ti ti-activity-heartbeat text-success me-2"></i> جودة الاستجابة والمؤشرات الحيوية
                  </h5>
                  <div className="d-flex flex-column gap-3">
                    <div className="p-3 bg-light rounded-3 border">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small text-muted">الالتزام بالدايت</span>
                        <span className="fw-bold text-dark">95%</span>
                      </div>
                      <div className="progress" style={{ height: '6px' }}>
                        <div className="progress-bar bg-success" style={{ width: '95%' }}></div>
                      </div>
                    </div>

                    <div className="p-3 bg-light rounded-3 border">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small text-muted">مستوى الجوع والتحكم بالشهية</span>
                        <span className="fw-bold text-dark">2 / 5 (ممتاز)</span>
                      </div>
                      <div className="progress" style={{ height: '6px' }}>
                        <div className="progress-bar bg-primary" style={{ width: '80%' }}></div>
                      </div>
                    </div>

                    <div className="p-3 bg-light rounded-3 border">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small text-muted">مستوى الطاقة والنشاط في التمرين</span>
                        <span className="fw-bold text-dark">4 / 5 (عالي)</span>
                      </div>
                      <div className="progress" style={{ height: '6px' }}>
                        <div className="progress-bar bg-warning" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Before & After Photo Comparison */}
          <div className="card border-0 shadow-sm bg-white mb-4" style={{ borderRadius: '18px' }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                  <h5 className="fw-bold text-dark mb-1">
                    <i className="ti ti-transform text-primary me-2"></i> مقارنة التحول البصري التفاعلية (Before & After Slider)
                  </h5>
                  <p className="text-muted small mb-0">اسحب المؤشر لمقارنة التطور العضلي ونسبة الدهون بين الأسبوع الأول والأسبوع الأخير</p>
                </div>
              </div>

              <div className="row g-4 align-items-center">
                <div className="col-lg-7 text-center">
                  <div 
                    className="position-relative mx-auto overflow-hidden rounded-4 border shadow-sm"
                    style={{ maxWidth: '480px', height: '400px', backgroundColor: '#0f172a' }}
                  >
                    {/* Before Image */}
                    <img 
                      src={beforePhoto.photo_url || '/admin-dashboard_data/user-dashboard/before-sample.png'} 
                      alt="Before" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, right: 0 }}
                    />

                    {/* After Image with dynamic clip-path */}
                    <div 
                      style={{ 
                        position: 'absolute', 
                        top: 0, 
                        right: 0, 
                        width: '100%', 
                        height: '100%', 
                        overflow: 'hidden',
                        clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`
                      }}
                    >
                      <img 
                        src={afterPhoto.photo_url || '/admin-dashboard_data/user-dashboard/after-sample.png'} 
                        alt="After" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    {/* Slider Line Divider */}
                    <div 
                      style={{ 
                        position: 'absolute', 
                        top: 0, 
                        bottom: 0, 
                        right: `${100 - sliderPos}%`, 
                        width: '3px', 
                        backgroundColor: '#00b4d8',
                        boxShadow: '0 0 10px rgba(0,180,216,0.8)'
                      }}
                    >
                      <div className="position-absolute top-50 start-50 translate-middle bg-primary text-white rounded-circle p-1 shadow">
                        <i className="ti ti-arrows-left-right fs-6"></i>
                      </div>
                    </div>

                    <span className="badge bg-dark-subtle text-white position-absolute top-0 start-0 m-3 px-3 py-2 rounded-pill">
                      الآن (الأسبوع {checkins.length || 1})
                    </span>
                    <span className="badge bg-dark-subtle text-white position-absolute top-0 end-0 m-3 px-3 py-2 rounded-pill">
                      البداية (الأسبوع 1)
                    </span>
                  </div>

                  {/* Range Slider Control */}
                  <div className="mt-3 mx-auto" style={{ maxWidth: '480px' }}>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={sliderPos}
                      onChange={(e) => setSliderPos(e.target.value)}
                      className="form-range"
                    />
                    <div className="d-flex justify-content-between text-muted small fw-bold">
                      <span>الأسبوع الحالي</span>
                      <span>اسحب للمقارنة</span>
                      <span>أول أسبوع</span>
                    </div>
                  </div>
                </div>

                {/* Photo Gallery Grid */}
                <div className="col-lg-5">
                  <h6 className="fw-bold text-dark mb-3">سجل الصور المحفوظة في قاعدة البيانات:</h6>
                  <div className="row g-2" style={{ maxHeight: '360px', overflowY: 'auto' }}>
                    {photos.length === 0 ? (
                      <div className="p-4 text-center text-muted border rounded-3">
                        لم يتم رفع أي صور بعد. اضغط "إضافة صورة جديدة" بالأعلى للبدء.
                      </div>
                    ) : (
                      photos.map((p, idx) => (
                        <div className="col-6" key={idx}>
                          <div className="card border rounded-3 overflow-hidden">
                            <img src={p.photo_url} alt="Progress" style={{ height: '110px', objectFit: 'cover' }} />
                            <div className="p-2 bg-light d-flex justify-content-between align-items-center">
                              <small className="fw-bold text-dark">الأسبوع {p.week_number}</small>
                              <span className="badge bg-primary-subtle text-primary" style={{ fontSize: '0.7rem' }}>
                                {p.pose === 'FRONT' ? 'أمامي' : p.pose === 'SIDE' ? 'جانبي' : 'خلفي'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Historical Check-ins Table */}
          <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: '18px' }}>
            <div className="card-body p-4">
              <h5 className="fw-bold text-dark mb-3">
                <i className="ti ti-history text-primary me-2"></i> سجل المتابعات الأسبوعية الكامل (MariaDB Database)
              </h5>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>الأسبوع</th>
                      <th>متوسط الوزن</th>
                      <th>معدل التغير</th>
                      <th>محيط الخصر</th>
                      <th>الالتزام</th>
                      <th>الحالة</th>
                      <th>توجيهات المدرب</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkins.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4 text-muted">
                          لا توجد سجلات متابعة بعد.
                        </td>
                      </tr>
                    ) : (
                      checkins.map((chk) => (
                        <tr key={chk.id}>
                          <td><span className="badge bg-primary-subtle text-primary fw-bold">الأسبوع {chk.week_number}</span></td>
                          <td className="fw-bold text-dark">{chk.average_weight} كجم</td>
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

      {/* Upload Photo Modal */}
      <UploadPhotoModal 
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        uploadForm={uploadForm}
        setUploadForm={setUploadForm}
        onFileUpload={handleFileUpload}
        onSave={handleSavePhoto}
        uploading={uploading}
      />
    </AdminLayout>
  );
}
