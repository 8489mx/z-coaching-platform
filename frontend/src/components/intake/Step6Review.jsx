import React from 'react';

export default function Step6Review({
  submitting,
  onSubmit
}) {
  return (
    <div className="step-content" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <div style={{ fontSize: '4.5rem', marginBottom: '1rem', color: '#00b4d8' }}>
        <i className="bi bi-check2-circle"></i>
      </div>
      <h3 style={{ fontSize: '1.85rem', fontWeight: 'bold', color: '#0f172a' }}>
        هل أنت جاهز لتوليد خطتك التدريبية والغذائية؟
      </h3>
      <p style={{ color: '#64748b', margin: '1rem auto 2.5rem', maxWidth: '540px', lineHeight: '1.7', fontSize: '1.05rem' }}>
        تم حفظ جميع بياناتك بنجاح. سيقوم محرك الذكاء الرياضي (Z-Engine V2) بتحليل أكثر من 70 نقطة بيانات صممتها بدقة لتوليد أقصى تطور لجسمك وهدفك.
      </p>
      
      <button 
        type="button"
        className="btn btn-primary" 
        style={{ padding: '1.1rem 3.5rem', fontSize: '1.2rem', borderRadius: '40px' }} 
        disabled={submitting}
        onClick={onSubmit}
      >
        {submitting ? 'جاري بناء الميزوسايكل والدايت المكمم...' : 'إرسال وتوليد الخطة الذكية الآن 🚀'}
      </button>
    </div>
  );
}
