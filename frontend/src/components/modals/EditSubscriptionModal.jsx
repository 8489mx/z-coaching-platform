import React, { useEffect } from 'react';

export default function EditSubscriptionModal({
 client,
 onClose,
 editForm,
 setEditForm,
 onSave,
 saving
}) {
 useEffect(() => {
 const handleKeyDown = (e) => {
 if (e.key === 'Escape' || e.keyCode === 27) {
 onClose();
 }
 };
 if (client) {
 window.addEventListener('keydown', handleKeyDown);
 }
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, [client, onClose]);

 if (!client) return null;

 return (
 <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
 <div className="modal-dialog modal-dialog-centered">
 <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px' }}>
  <div className="modal-header border-bottom p-4 d-flex justify-content-between align-items-center bg-white">
    <h5 className="modal-title fw-bold text-dark mb-0" style={{ fontSize: '1.05rem' }}>
      تعديل اشتراك: {client.full_name || 'المشترك'}
    </h5>
    <button 
      type="button" 
      onClick={onClose}
      className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
      style={{ width: '34px', height: '34px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}
      title="إغلاق"
    >
      <i className="ti ti-x fs-6"></i>
    </button>
  </div>

 <form onSubmit={onSave}>
 <div className="modal-body p-4 text-end">
 <div className="form-group mb-3">
 <label className="form-label fw-bold text-dark small">نوع الباقة</label>
 <select 
 className="form-select"
 value={editForm.subscription_package}
 onChange={(e) => setEditForm({ ...editForm, subscription_package: e.target.value })}
 >
 <option value="ELITE_3_PLUS_1">باقة إيليت (3 شهور + 1 شهر مجاناً)</option>
 <option value="MAX_3_PLUS_1">باقة ماكس VIP (3 شهور + 1 شهر مجاناً)</option>
 <option value="1_MONTH">باقة شهر واحد</option>
 <option value="6_MONTHS">باقة 6 شهور</option>
 <option value="12_MONTHS">باقة سنة كاملة</option>
 </select>
 </div>

 <div className="form-group mb-3">
 <label className="form-label fw-bold text-dark small">سعر الاشتراك (ج.م)</label>
 <input 
 type="number"
 className="form-control"
 value={editForm.subscription_price}
 onChange={(e) => setEditForm({ ...editForm, subscription_price: e.target.value })}
 required
 />
 </div>

 <div className="row g-2 mb-3">
 <div className="col-6">
 <label className="form-label fw-bold text-dark small">تاريخ البدء</label>
 <input 
 type="date"
 className="form-control"
 value={editForm.subscription_start_date}
 onChange={(e) => setEditForm({ ...editForm, subscription_start_date: e.target.value })}
 required
 />
 </div>
 <div className="col-6">
 <label className="form-label fw-bold text-dark small">تاريخ الانتهاء</label>
 <input 
 type="date"
 className="form-control"
 value={editForm.subscription_end_date}
 onChange={(e) => setEditForm({ ...editForm, subscription_end_date: e.target.value })}
 required
 />
 </div>
 </div>
 </div>

 <div className="modal-footer border-top p-3 d-flex justify-content-between">
 <button type="button" className="btn btn-light rounded-pill px-4" onClick={onClose}>
 إلغاء
 </button>
 <button type="submit" disabled={saving} className="btn btn-primary rounded-pill px-4 fw-bold">
 {saving ? 'جاري الحفظ...' : 'حفظ التعديلات '}
 </button>
 </div>
 </form>
 </div>
 </div>
 </div>
 );
}
