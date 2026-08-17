import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../config/api';

export default function UploadPhotoModal({
  isOpen = true,
  onClose,
  targetUserId,
  onSuccess
}) {
  const [weekNumber, setWeekNumber] = useState(1);
  const [pose, setPose] = useState('FRONT');
  const [photoUrl, setPhotoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت.');
        return;
      }
      setErrorMsg('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photoUrl) {
      setErrorMsg('يرجى اختيار صورة للرفع أولاً.');
      return;
    }

    try {
      setUploading(true);
      setErrorMsg('');

      const res = await fetch(`${API_BASE}/api/v1/photos/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_code: targetUserId,
          week_number: Number(weekNumber),
          pose,
          photo_url: photoUrl,
          notes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل حفظ الصورة');

      if (onSuccess) {
        onSuccess(data);
      } else {
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div 
      className="modal fade show d-block" 
      tabIndex="-1" 
      style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(6px)", zIndex: 1065 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '520px' }}>
        <div 
          className="modal-content border-0 shadow-2xl bg-white position-relative overflow-hidden" 
          style={{ 
            borderRadius: "24px", 
            border: '1px solid #edf2f7',
            boxShadow: '0 25px 60px -15px rgba(38, 28, 106, 0.22), 0 0 0 1px rgba(0,0,0,0.03)'
          }} 
          dir="rtl"
        >
          {/* Header */}
          <div 
            className="p-4 bg-white d-flex justify-content-between align-items-center" 
            style={{ borderBottom: '1px solid #f1f5f9' }}
          >
            <div className="d-flex align-items-center gap-3">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" 
                style={{ 
                  width: '42px', 
                  height: '42px', 
                  background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', 
                  color: '#261c6a', 
                  border: '1.5px solid #ddd6fe' 
                }}
              >
                <i className="ti ti-camera fs-4"></i>
              </div>
              <div>
                <h5 className="fw-bold text-dark mb-0" style={{ fontSize: '1.08rem', letterSpacing: '-0.3px' }}>
                  رفع صورة تطور للمتدرب
                </h5>
                <small className="text-muted" style={{ fontSize: '0.76rem' }}>
                  توثيق مسار التغير العضلي وشكل الجسم أسبوعياً
                </small>
              </div>
            </div>

            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: '34px', height: '34px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}
              title="إغلاق (Esc)"
            >
              <i className="ti ti-x fs-6"></i>
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit}>
            <div className="p-4 bg-white">
              {errorMsg && (
                <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
                  <i className="ti ti-alert-circle fs-5"></i>
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label fw-bold text-dark small mb-1" style={{ fontSize: '0.78rem' }}>
                    رقم الأسبوع
                  </label>
                  <select 
                    className="form-select form-select-sm border rounded-3 bg-white"
                    style={{ height: '38px', fontSize: '0.84rem' }}
                    value={weekNumber}
                    onChange={(e) => setWeekNumber(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(w => (
                      <option key={w} value={w}>الأسبوع {w}</option>
                    ))}
                  </select>
                </div>

                <div className="col-6">
                  <label className="form-label fw-bold text-dark small mb-1" style={{ fontSize: '0.78rem' }}>
                    زاوية التصوير
                  </label>
                  <select 
                    className="form-select form-select-sm border rounded-3 bg-white"
                    style={{ height: '38px', fontSize: '0.84rem' }}
                    value={pose}
                    onChange={(e) => setPose(e.target.value)}
                  >
                    <option value="FRONT">أمامي (Front)</option>
                    <option value="SIDE">جانبي (Side)</option>
                    <option value="BACK">خلفي (Back)</option>
                  </select>
                </div>
              </div>

              {/* Upload Input Area */}
              <div className="mb-3">
                <label className="form-label fw-bold text-dark small mb-1" style={{ fontSize: '0.78rem' }}>
                  ملف الصورة
                </label>
                <input 
                  type="file" 
                  accept="image/*"
                  className="form-control form-control-sm"
                  style={{ height: '38px', borderRadius: '8px', fontSize: '0.82rem' }}
                  onChange={handleFileUpload}
                  required={!photoUrl}
                />
              </div>

              {/* Image Preview */}
              {photoUrl && (
                <div className="text-center p-2 bg-light rounded-3 mb-3 border position-relative">
                  <img 
                    src={photoUrl} 
                    alt="Preview" 
                    style={{ maxHeight: '160px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setPhotoUrl('')} 
                    className="btn btn-sm btn-danger position-absolute top-0 start-0 m-2 rounded-circle p-1"
                    style={{ width: '26px', height: '26px', lineHeight: 1 }}
                    title="حذف الصورة"
                  >
                    <i className="ti ti-trash"></i>
                  </button>
                </div>
              )}

              {/* Notes */}
              <div className="mb-1">
                <label className="form-label fw-bold text-dark small mb-1" style={{ fontSize: '0.78rem' }}>
                  ملاحظات إضافية (اختياري)
                </label>
                <input 
                  type="text" 
                  className="form-control form-control-sm" 
                  style={{ height: '38px', borderRadius: '8px', fontSize: '0.82rem' }}
                  placeholder="مثال: على الريق صباحاً، بعد تمرين الأرجل..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Footer */}
            <div 
              className="p-3 px-4 d-flex justify-content-between align-items-center bg-light" 
              style={{ borderTop: '1px solid #f1f5f9' }}
            >
              <button 
                type="button" 
                className="btn btn-sm btn-light rounded-pill px-3 fw-semibold border transition-all" 
                style={{ height: '36px', fontSize: '0.8rem', color: '#475569' }}
                onClick={onClose}
              >
                إلغاء
              </button>
              <button 
                type="submit" 
                disabled={uploading} 
                className="btn btn-sm rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2 text-white transition-all"
                style={{ 
                  height: '36px', 
                  fontSize: '0.82rem', 
                  background: 'linear-gradient(135deg, #261c6a 0%, #4338ca 100%)', 
                  border: 'none', 
                  boxShadow: '0 2px 10px rgba(38, 28, 106, 0.22)' 
                }}
              >
                {uploading ? (
                  <><span className="spinner-border spinner-border-sm"></span> جاري الحفظ...</>
                ) : (
                  <><i className="ti ti-upload fs-6"></i> حفظ الصورة</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
