import React from 'react';

export default function Step6Review({
  submitting,
  onSubmit
}) {
  return (
    <div className="step-content text-center py-5 px-3">
      <div className="mb-3 text-primary" style={{ fontSize: '4.5rem' }}>
        <i className="ti ti-circle-check"></i>
      </div>
      <h3 className="fw-bold text-dark mb-3" style={{ fontSize: '1.75rem' }}>
        هل أنت جاهز لإرسال استمارتك للكابتن؟
      </h3>
      <p className="text-muted mx-auto mb-4" style={{ maxWidth: '560px', lineHeight: '1.8', fontSize: '1rem' }}>
        تم حفظ جميع بياناتك وإجاباتك بدقة. سيقوم الكابتن بمراجعة ملفك الصحي والبدني، وتأكيد باقة اشتراكك، وتصميم خطتك التدريبية والغذائية المخصصة لك بالكامل.
      </p>
      
      <button 
        type="button"
        className="btn btn-primary shadow-sm" 
        style={{ 
          padding: '1rem 3.5rem', 
          fontSize: '1.15rem', 
          borderRadius: '40px',
          background: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)',
          border: 'none',
          fontWeight: '700'
        }} 
        disabled={submitting}
        onClick={onSubmit}
      >
        {submitting ? (
          <><span className="spinner-border spinner-border-sm me-2" role="status"></span> جاري إرسال الاستمارة...</>
        ) : (
          <><i className="ti ti-send me-2"></i> إرسال الاستمارة للكابتن للمراجعة</>
        )}
      </button>
    </div>
  );
}
