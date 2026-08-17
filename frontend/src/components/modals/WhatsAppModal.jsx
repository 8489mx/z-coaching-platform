import React, { useState, useEffect } from 'react';

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
 ${baseUrl}/intake/login
كود المشترك الخاص بك: ${clientCode}
رقم الهاتف المسجل: ${clientPhone}`,

 plan_ready: `مرحباً يا ${clientName}! 
تم إعداد خطتك التدريبية والغذائية المخصصة بنجاح بواسطة محرك Z Coaching الذكي وتم اعتمادها.
يمكنك الآن تسجيل الدخول للاطلاع على جدولك وتفاصيل الوجبات:
 ${baseUrl}/user-dashboard?user_id=${clientCode}
بالتوفيق وبداية قوية بإذن الله! `,

 checkin_reminder: `تذكير المتابعة الأسبوعية ⏰
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

 return (
 <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', zIndex: 1060 }}>
 <div className="modal-dialog modal-dialog-centered modal-lg">
 <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
 {/* Header */}
 <div className="modal-header border-bottom p-4 bg-light d-flex justify-content-between align-items-center">
 <div className="d-flex align-items-center gap-2">
 <div className="p-2 bg-success text-white rounded-circle">
 <i className="ti ti-brand-whatsapp fs-5"></i>
 </div>
 <div>
 <h5 className="modal-title fw-bold text-dark mb-0">مركز رسائل الواتساب الذكية</h5>
 <small className="text-muted">المتدرب: {clientName} ({clientPhone})</small>
 </div>
 </div>
 <button type="button" className="btn-close" onClick={onClose}></button>
 </div>

 {/* Body */}
 <div className="modal-body p-4">
 <label className="form-label fw-bold small text-dark mb-2">اختر قالب الرسالة الجاهزة:</label>
 <div className="d-flex gap-2 mb-3 flex-wrap">
 <button 
 type="button"
 onClick={() => applyTemplate('intake')}
 className={`btn btn-sm rounded-pill px-3 fw-semibold ${template === 'intake' ? 'btn-primary' : 'btn-outline-secondary'}`}
 >
 رابط استمارة البيانات
 </button>
 <button 
 type="button"
 onClick={() => applyTemplate('plan_ready')}
 className={`btn btn-sm rounded-pill px-3 fw-semibold ${template === 'plan_ready' ? 'btn-primary' : 'btn-outline-secondary'}`}
 >
 إشعار جاهزية الخطة
 </button>
 <button 
 type="button"
 onClick={() => applyTemplate('checkin_reminder')}
 className={`btn btn-sm rounded-pill px-3 fw-semibold ${template === 'checkin_reminder' ? 'btn-primary' : 'btn-outline-secondary'}`}
 >
 ⏰ تذكير المتابعة الأسبوعية
 </button>
 <button 
 type="button"
 onClick={() => applyTemplate('checkin_approved')}
 className={`btn btn-sm rounded-pill px-3 fw-semibold ${template === 'checkin_approved' ? 'btn-primary' : 'btn-outline-secondary'}`}
 >
 تم اعتماد المتابعة والتحديث
 </button>
 </div>

 <div className="mb-3">
 <label className="form-label fw-bold small text-dark">نص الرسالة (يمكنك التعديل عليه قبل الإرسال):</label>
 <textarea 
 className="form-control" 
 rows="6" 
 value={customText}
 onChange={(e) => setCustomText(e.target.value)}
 style={{ whiteSpace: 'pre-line' }}
 ></textarea>
 </div>
 </div>

 {/* Footer */}
 <div className="modal-footer p-3 bg-light d-flex justify-content-between">
 <button 
 type="button" 
 onClick={handleCopy}
 className="btn btn-outline-secondary btn-sm rounded-pill px-4 fw-bold"
 >
 {copied ? ' تم النسخ!' : 'نسخ النص '}
 </button>
 <button 
 type="button" 
 onClick={handleSend}
 className="btn btn-success btn-sm rounded-pill px-4 fw-bold d-flex align-items-center gap-1 shadow-sm"
 >
 <i className="ti ti-brand-whatsapp fs-5"></i>
 فتح وإرسال عبر WhatsApp
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}
