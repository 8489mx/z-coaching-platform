import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Copy, Check, Send, MessageCircle } from 'lucide-react';
import { copyToClipboard } from '../../utils/clipboardUtils';
import { formatWhatsAppPhone } from '../../utils/whatsappRemindersEngine';
import { ClientCodeBadge } from '../../utils/tierBadgeHelper';

export default function WhatsAppModal({ client, onClose, initialTemplate, initialCustomText }) {
  const [template, setTemplate] = useState('intake');
  const [customText, setCustomText] = useState('');
  const [copied, setCopied] = useState(false);

  const clientName = client?.full_name || 'مشتركنا';
  const clientCode = String(client?.client_code || client?.id || '').replace(/^client[-_]?/i, '');
  const clientPhone = client?.phone_number || '';
  const baseUrl = window.location.origin;

  const templates = {
    intake: `مرحباً ${clientName}،
تم تأكيد اشتراكك وتفعيل حسابك في المنظومة التدريبية بنجاح.

بيانات دخول استمارتك:
- كود المشترك: #${clientCode}
- رقم الهاتف المسجل: ${clientPhone}

رابط استمارتك الصحية والرياضية المباشر:
${baseUrl}/intake/form?code=${clientCode}&phone=${clientPhone}

يرجى فتح الرابط وتعبئة بياناتك بدقة لنبدأ فوراً في تجهيز خطتك التدريبية والغذائية.`,

    plan_ready: `مرحباً ${clientName}،
تم الانتهاء من إعداد خطتك التدريبية والغذائية المخصصة واعتمادها بنجاح.

يمكنك الآن الدخول إلى لوحة المتابعة الخاصة بك للاطلاع على جدولك وتفاصيل الوجبات:
${baseUrl}/user-dashboard?user_id=${clientCode}

بالتوفيق وبداية موفقة.`,

    checkin_reminder: `تذكير المتابعة الأسبوعية
مرحباً ${clientName}،
حان موعد تقديم تقرير التقييم الأسبوعي (الوزن، الالتزام، وصور التطور) لتحديث وتعديل برنامجك التدريبي والغذائي.

رابط إرسال التقييم الأسبوعي:
${baseUrl}/check-in?code=${clientCode}`,

    checkin_approved: `تم اعتماد تقرير المتابعة الأسبوعي
مرحباً ${clientName}،
تمت مراجعة نتائج أسبوعك وتحديث السعرات والبرنامج لمواصلة التطور والنتائج المطلوبة.

تفضل بالاطلاع على التحديثات الجديدة في خطتك:
${baseUrl}/user-dashboard?user_id=${clientCode}`,

    renewal: `مرحباً ${clientName}،
نود تذكيرك باقتراب موعد تجديد اشتراكك في المنظومة لمواصلة التطور والحفاظ على تقدمك الرياضي والغذائي دون انقطاع.

يمكنك إتمام تجديد اشتراكك واستعراض الباقات المتاحة مباشرة عبر الرابط:
${baseUrl}/user-dashboard?user_id=${clientCode}&action=renew

نتطلع لاستمرار رحلة التطور معك.`,

    rescue_overdue: `صباح الفل يا ${clientName}،
حبينا نطمن عليك! مستنيين شيك إنك وصورك الأسبوعية عشان نراجع التطور في الميزان ومحيطات الجسم ونحدث خطتك للأسبوع الجديد.

رابط تسجيل الشيك إن في دقيقة:
${baseUrl}/check-in?code=${clientCode}`
  };

  useEffect(() => {
    if (client) {
      if (initialCustomText) {
        setCustomText(initialCustomText);
        setTemplate(initialTemplate || 'renewal');
      } else {
        let chosen = initialTemplate;
        if (!chosen) {
          const status = String(client.status || client.subscription_status || '').toUpperCase();
          if (status === 'EXPIRING_SOON') {
            chosen = 'renewal';
          } else if (client.isOverdue || status === 'CHECKIN_OVERDUE') {
            chosen = 'rescue_overdue';
          } else {
            chosen = 'intake';
          }
        }
        setTemplate(chosen);
        setCustomText(templates[chosen] || templates.intake);
      }
    }
  // مقصود: التأثير يعمل عند تغيّر مفتاحه فقط. إضافة الدوال للتبعيات تُعاد إنشاؤها كل رندر فتدخل في حلقة إعادة تشغيل.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, initialTemplate, initialCustomText]);

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

  const applyTemplate = (tplKey) => {
    setTemplate(tplKey);
    setCustomText(templates[tplKey] || '');
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(customText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSend = () => {
    const cleanPhone = formatWhatsAppPhone(clientPhone);
    const encodedMsg = encodeURIComponent(customText);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMsg}`, '_blank');
  };

  const modalContent = (
    <div 
      dir="rtl"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)', 
        backdropFilter: 'blur(4px)', 
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
        fontFamily: 'Cairo, sans-serif'
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        style={{ 
          width: '100%',
          maxWidth: '560px',
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header */}
        <div 
          style={{ 
            padding: '16px 20px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFFFFF'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#F4F0FD',
              color: '#673DE6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <MessageCircle size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#101828' }}>
                مركز رسائل الواتساب الذكية
              </h3>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                المشترك: <ClientCodeBadge code={clientCode} size="xs" style={{ margin: '0 4px' }} /> <strong style={{ color: '#0F172A' }}>{clientName}</strong> | {clientPhone}
              </span>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Template Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              اختر نوع الرسالة:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {[
                { id: 'intake', label: 'رابط استمارة البيانات' },
                { id: 'plan_ready', label: 'إشعار جاهزية الخطة' },
                { id: 'checkin_reminder', label: 'تذكير التقييم الأسبوعي' },
                { id: 'checkin_approved', label: 'اعتماد التقييم والتحديث' },
                { id: 'renewal', label: 'تذكير تجديد الاشتراك' },
                { id: 'rescue_overdue', label: 'استعادة متأخر الشيك إن' }
              ].map(t => {
                const isActive = template === t.id;
                return (
                  <button 
                    key={t.id}
                    type="button"
                    onClick={() => applyTemplate(t.id)}
                    style={{
                      height: '36px',
                      borderRadius: '8px',
                      border: isActive ? '1.5px solid #673DE6' : '1px solid #E2E8F0',
                      background: isActive ? '#673DE6' : '#F8FAFC',
                      color: isActive ? '#FFFFFF' : '#475569',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message Text Area */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              نص الرسالة (يمكنك التعديل عليه قبل الإرسال):
            </label>
            <textarea 
              rows={8}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              style={{
                width: '100%',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                padding: '10px 12px',
                fontSize: '12px',
                lineHeight: 1.6,
                color: '#0F172A',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box',
                fontFamily: 'Cairo, sans-serif',
                background: '#FFFFFF'
              }}
            />
          </div>

        </div>

        {/* Modal Footer */}
        <div 
          style={{ 
            padding: '12px 20px',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}
        >
          <button 
            type="button"
            onClick={handleCopy}
            style={{
              height: '38px',
              padding: '0 16px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#0F172A',
              fontSize: '11.5px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {copied ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
            <span>{copied ? 'تم النسخ بنجاح' : 'نسخ النص'}</span>
          </button>

          <button 
            type="button"
            onClick={handleSend}
            style={{
              height: '38px',
              padding: '0 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#16A34A',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            <Send size={14} />
            <span>إرسال عبر واتساب الآن</span>
          </button>
        </div>

      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
