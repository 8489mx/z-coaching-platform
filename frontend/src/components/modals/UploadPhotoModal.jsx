import React, { useEffect } from 'react';

export default function UploadPhotoModal({
 isOpen,
 onClose,
 uploadForm,
 setUploadForm,
 onFileUpload,
 onSave,
 uploading
}) {
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

 return (
 <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
 <div className="modal-dialog modal-dialog-centered">
 <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px' }}>
 <div className="modal-header border-bottom p-4">
 <h5 className="modal-title fw-bold text-dark mb-0">
 <i className="ti ti-camera text-primary me-2"></i> رفع صورة تطور للمتدرب
 </h5>
 <button type="button" className="btn-close" onClick={onClose}></button>
 </div>

 <form onSubmit={onSave}>
 <div className="modal-body p-4 text-end">
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
 onChange={onFileUpload}
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
 <button type="button" className="btn btn-light rounded-pill px-4" onClick={onClose}>
 إلغاء
 </button>
 <button type="submit" disabled={uploading} className="btn btn-primary rounded-pill px-4 fw-bold">
 {uploading ? 'جاري الرفع...' : 'حفظ الصورة في قاعدة البيانات '}
 </button>
 </div>
 </form>
 </div>
 </div>
 </div>
 );
}
