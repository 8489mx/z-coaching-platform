import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

export default function WhatsAppModal({ client, onClose }) {
  const [template, setTemplate] = useState('intake');
  const [customText, setCustomText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (client) {
      applyTemplate('intake', client);
    }
  }, [client]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!client) return null;

  const clientName = client.full_name || 'بطلنا';
  const clientCode = client.client_code || client.id || '';
  const clientPhone = client.phone_number || '';
  const baseUrl = window.location.origin;

  const templates = {
    intake: `أهلاً بك يا ${clientName} معنا في Z Coaching! 
يرجى ملء استمارة تسجيل البيانات الصحية والتدريبية من خلال الرابط التالي للبدء في تصميم خطتك المخصصة:
${baseUrl}/intake/form?code=${clientCode}&phone=${clientPhone}
كود المشترك الخاص بك: ${clientCode}
رقم الهاتف المسجل: ${clientPhone}`,

    plan_ready: `مرحباً يا ${clientName}! 
تم إعداد خطتك التدريبية والغذائية المخصصة بنجاح بواسطة محرك Z Coaching الذكي وتم اعتمادها.
يمكنك الآن تسجيل الدخول للاطلاع على جدولك وتفاصيل الوجبات:
${baseUrl}/user-dashboard?user_id=${clientCode}
بالتوفيق وبداية قوية بإذن الله! `,

    checkin_reminder: `تذكير المتابعة الأسبوعية
مرحباً يا ${clientName}، حان موعد تقديم تقرير المتابعة الأسبوعي (الوزن، الالتزام، والقياسات) لتحديث وتعديل برنامجك التدريبي والغذائي.
يرجى الدخول وتعبئة تقرير الأسبوع:
${baseUrl}/user-dashboard?user_id=${clientCode}`,

    checkin_approved: `تم اعتماد تقرير المتابعة بنجاح! 
عاش يا ${clientName}، تم تحليل نتائج أسبوعك وتعديل السعرات والبرنامج التدريبي لمواصلة التطور والنتائج القياسية.
تفضل بالاطلاع على التحديثات الجديدة في خطتك:
${baseUrl}/user-dashboard?user_id=${clientCode}`
  };

  const applyTemplate = (tplKey, targetClient = client) => {
    setTemplate(tplKey);
    setCustomText(templates[tplKey] || '');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSend = () => {
    const cleanPhone = clientPhone.replace(/\D/g, '');
    const encodedMsg = encodeURIComponent(customText);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMsg}`, '_blank');
  };

  const modalContent = (
    <div 
      className="modal show d-block" 
      tabIndex="-1" 
      style={{ 
        backgroundColor: 'rgba(15, 23, 42, 0.65)', 
        backdropFilter: 'blur(4px)', 
        zIndex: 10000,
        position: 'fixed',
        top: 0,
        bottom: 0,
        overflowY: 'auto'
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg" style={{ width: '96%', maxWidth: '720px', margin: '1.5rem auto' }}>
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }} dir="rtl">
          {/* Header */}
          <div className="modal-header border-bottom p-4 bg-white d-flex justify-content-between align-items-center" style={{ borderColor: '#f1f5f9' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #dcfce7' }}>
                <i className="ti ti-brand-whatsapp fs-5"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold text-dark mb-0" style={{ fontSize: '1.05rem' }}>مركز رسائل الواتساب الذكية</h5>
                <small className="text-muted" style={{ fontSize: '0.78rem' }}>المتدرب: {clientName} ({clientPhone})</small>
              </div>
            </div>
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

          {/* Body */}
          <div className="modal-body p-4 bg-white">
            <label className="form-label fw-bold small text-dark mb-2">اختر قالب الرسالة الجاهزة:</label>
            <div className="d-flex gap-2 mb-3 flex-wrap">
              {[
                { id: 'intake', label: 'رابط استمارة البيانات' },
                { id: 'plan_ready', label: 'إشعار جاهزية الخطة' },
                { id: 'checkin_reminder', label: 'تذكير المتابعة الأسبوعية' },
                { id: 'checkin_approved', label: 'اعتماد المتابعة والتحديث' }
              ].map(t => (
                <button 
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t.id)}
                  className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold transition-all ${template === t.id ? 'text-white shadow-sm' : 'bg-white text-dark border'}`}
                  style={{
                    background: template === t.id ? '#261c6a' : '#ffffff',
                    borderColor: template === t.id ? '#261c6a' : '#e2e8f0',
                    fontSize: '0.8rem',
                    height: '32px'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mb-2">
              <label className="form-label fw-bold small text-dark">نص الرسالة (يمكنك التعديل عليه بحرية):</label>
              <textarea 
                className="form-control" 
                rows="6" 
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                style={{ whiteSpace: 'pre-line', fontSize: '0.86rem', borderRadius: '12px', lineHeight: '1.6' }}
              ></textarea>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer p-3 bg-light d-flex justify-content-between border-top" style={{ borderColor: '#f1f5f9' }}>
            <button 
              type="button" 
              onClick={handleCopy}
              className="btn btn-sm rounded-pill px-4 fw-semibold bg-white border text-dark"
              style={{ height: '36px', fontSize: '0.82rem' }}
            >
              <i className={copied ? "ti ti-check text-success me-1" : "ti ti-copy me-1"}></i>
              {copied ? 'تم النسخ!' : 'نسخ النص'}
            </button>
            <button 
              type="button" 
              onClick={handleSend}
              className="btn btn-success btn-sm rounded-pill px-4 fw-bold d-flex align-items-center gap-2 shadow-sm text-white"
              style={{ height: '36px', fontSize: '0.82rem' }}
            >
              <i className="ti ti-brand-whatsapp fs-6"></i>
              <span>إرسال واتساب</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
