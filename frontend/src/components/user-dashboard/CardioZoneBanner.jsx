import React from 'react';

export default function CardioZoneBanner({ onOpenCheckin }) {
 return (
 <div className="row mb-4">
 <div className="col-12">
 <div className="card bg-primary text-white border-0 shadow-sm" style={{ borderRadius: "14px" }}>
 <div className="card-body p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
 <div>
 <h4 className="text-white fw-bold mb-1">
 الكارديو اليومي ونطاق نبضات حرق الدهون (Zone 2)
 </h4>
 <p className="text-white-50 mb-0">
 النبض المستهدف: <strong>115 - 134 نبضة/دقيقة</strong> | 8,000 خطوة موزعة على مدار اليوم.
 </p>
 </div>
 <button 
 type="button"
 onClick={onOpenCheckin} 
 className="btn btn-white text-primary px-4 py-2 fw-bold rounded-pill shadow-sm"
 style={{ backgroundColor: '#fff' }}
 >
 تسجيل نشاط اليوم
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}
