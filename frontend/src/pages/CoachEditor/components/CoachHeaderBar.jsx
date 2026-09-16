import React from 'react';
import { 
  Save, 
  Send, 
  Printer, 
  HeartPulse, 
  Loader2, 
  ShieldAlert, 
  AlertCircle,
  Smartphone,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  Sliders
} from 'lucide-react';
import { extractClientFastingProfile } from '../../../utils/seasonalFastingRadar';
import { generateWhatsAppUrl } from '../../../utils/whatsappRemindersEngine';

export function CoachHeaderBar({
  program,
  clientCodeParam,
  handleSaveDraft,
  saving,
  setIsLabModalOpen,
  setIsSandboxOpen,
  handleApproveAndPublish,
  publishing,
  clientsList = [],
  handleSelectClient
}) {
  const currentCode = String(program?.client?.client_code || clientCodeParam || '');
  const currentIndex = clientsList.findIndex(c => String(c.client_code || c.id) === currentCode);
  const prevClient = currentIndex > 0 ? clientsList[currentIndex - 1] : null;
  const nextClient = currentIndex >= 0 && currentIndex < clientsList.length - 1 ? clientsList[currentIndex + 1] : null;
  const clientPhone = program?.client?.phone_number || program?.client?.phone || '';
  return (
    <div 
      style={{ 
        background: '#FFFFFF', 
        border: '1px solid #E2E8F0', 
        borderRadius: '8px', 
        padding: '10px 14px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '10px',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)'
      }}
      dir="rtl"
    >
      {/* Client Bio Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span>{program?.client?.full_name || 'أحمد محمود العوضي'}</span>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 700 }}>
                ({program?.client?.client_code ? `#${program?.client?.client_code}` : '#1'})
              </span>
            </h4>

            <span style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '6px', background: '#0F172A', color: '#FFFFFF', fontWeight: 700 }}>
              {program?.client?.package_name || 'باقة ماكس'}
            </span>
          </div>

          <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
            <span>{program?.client?.age || 27} سنة</span>
            <span>•</span>
            <span>{program?.client?.weight_kg || 84.5} كجم</span>
            <span>•</span>
            <span>{program?.client?.height_cm || 180} سم</span>
            <span>•</span>
            <span style={{ color: '#0F172A', fontWeight: 700 }}>{program?.client?.goal_label || 'خسارة دهون وتنشيف'}</span>

            {program?.client?.injuries && program?.client?.injuries.length > 0 && (
              <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '6px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <ShieldAlert size={10} />
                <span>إصابة: {program?.client?.injuries.join('، ')}</span>
              </span>
            )}

            {program?.client?.allergies && program?.client?.allergies.length > 0 && (
              <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '6px', background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0284C7', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <AlertCircle size={10} />
                <span>حساسية: {program?.client?.allergies.join('، ')}</span>
              </span>
            )}

            {(() => {
              const fasting = extractClientFastingProfile(program?.client);
              return (
                <>
                  {fasting.primaryFastingBadge && (
                    <span style={{ 
                      fontSize: '10px', 
                      padding: '1px 6px', 
                      borderRadius: '6px', 
                      background: fasting.primaryFastingBadge.bg, 
                      border: `1px solid ${fasting.primaryFastingBadge.border}`, 
                      color: fasting.primaryFastingBadge.color, 
                      fontWeight: 800 
                    }}>
                      {fasting.primaryFastingBadge.label}
                    </span>
                  )}
                  {fasting.intermittentBadge && (
                    <span style={{ 
                      fontSize: '10px', 
                      padding: '1px 6px', 
                      borderRadius: '6px', 
                      background: fasting.intermittentBadge.bg, 
                      border: `1px solid ${fasting.intermittentBadge.border}`, 
                      color: fasting.intermittentBadge.color, 
                      fontWeight: 800 
                    }}>
                      {fasting.intermittentBadge.label}
                    </span>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {/* Previous / Next Client Quick Switcher */}
        {clientsList.length > 1 && handleSelectClient && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#F1F5F9', padding: '2px', borderRadius: '8px', border: '1px solid #E2E8F0', marginLeft: '4px' }}>
            <button
              type="button"
              onClick={() => prevClient && handleSelectClient(prevClient.client_code || prevClient.id)}
              disabled={!prevClient}
              title={prevClient ? `المشترك السابق: ${prevClient.full_name || prevClient.name}` : 'لا يوجد مشترك سابق'}
              style={{
                height: '28px',
                padding: '0 8px',
                borderRadius: '6px',
                border: 'none',
                background: prevClient ? '#FFFFFF' : 'transparent',
                color: prevClient ? '#0F172A' : '#94A3B8',
                fontSize: '11px',
                fontWeight: 700,
                cursor: prevClient ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                boxShadow: prevClient ? '0 1px 2px rgba(15, 23, 42, 0.05)' : 'none'
              }}
            >
              <ChevronRight size={13} />
              <span>السابق</span>
            </button>

            <button
              type="button"
              onClick={() => nextClient && handleSelectClient(nextClient.client_code || nextClient.id)}
              disabled={!nextClient}
              title={nextClient ? `المشترك التالي: ${nextClient.full_name || nextClient.name}` : 'لا يوجد مشترك تالي'}
              style={{
                height: '28px',
                padding: '0 8px',
                borderRadius: '6px',
                border: 'none',
                background: nextClient ? '#FFFFFF' : 'transparent',
                color: nextClient ? '#0F172A' : '#94A3B8',
                fontSize: '11px',
                fontWeight: 700,
                cursor: nextClient ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                boxShadow: nextClient ? '0 1px 2px rgba(15, 23, 42, 0.05)' : 'none'
              }}
            >
              <span>التالي</span>
              <ChevronLeft size={13} />
            </button>
          </div>
        )}

        {/* 1-Click WhatsApp Direct Chat */}
        {clientPhone && (
          <a
            href={generateWhatsAppUrl(clientPhone, `أهلاً ${program?.client?.full_name ? program.client.full_name.replace(/مشترك #\d+/g, '').trim() : ''}، بخصوص خطتك التدريبية والغذائية:`)}
            target="_blank"
            rel="noreferrer"
            title="مراسلة المتدرب مباشرة عبر واتساب"
            style={{
              height: '32px',
              padding: '0 10px',
              borderRadius: '8px',
              background: '#F0FDF4',
              color: '#16A34A',
              border: '1px solid #BBF7D0',
              fontSize: '11.5px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
          >
            <MessageCircle size={13} />
            <span>واتساب</span>
          </a>
        )}

        {/* Live Client App Preview */}
        <a
          href={`/client?code=${currentCode || '1'}`}
          target="_blank"
          rel="noreferrer"
          title="معاينة حية لتطبيق المتدرب على الموبايل"
          style={{
            height: '32px',
            padding: '0 10px',
            borderRadius: '8px',
            background: '#F8FAFC',
            color: '#475569',
            border: '1px solid #CBD5E1',
            fontSize: '11.5px',
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.15s ease'
          }}
        >
          <Smartphone size={13} />
          <span>تطبيق المتدرب</span>
        </a>

        {/* Coach What-If Scenario Sandbox Button */}
        {typeof setIsSandboxOpen === 'function' && (
          <button
            type="button"
            onClick={() => setIsSandboxOpen(true)}
            title="فتح مُحاكي سيناريوهات التكييف الفسيولوجي للمدرب"
            style={{
              height: '32px',
              padding: '0 10px',
              borderRadius: '8px',
              background: '#F1F5F9',
              color: '#0F172A',
              border: '1px solid #CBD5E1',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
          >
            <Sliders size={13} color="#0284C7" />
            <span>مُحاكي السيناريوهات</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={saving}
          style={{
            height: '32px',
            padding: '0 12px',
            borderRadius: '8px',
            background: '#FFFFFF',
            color: '#0F172A',
            border: '1px solid #CBD5E1',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          <span>حفظ المسودة</span>
        </button>

        <button
          type="button"
          onClick={async () => {
            try {
              await handleSaveDraft(false);
            } catch {}
            window.open(`/pdf?user_id=${program?.client?.client_code || clientCodeParam}`, '_blank');
          }}
          style={{
            height: '32px',
            padding: '0 10px',
            borderRadius: '8px',
            background: '#F8FAFC',
            color: '#475569',
            border: '1px solid #E2E8F0',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Printer size={12} />
          <span>معاينة PDF</span>
        </button>

        <button
          type="button"
          onClick={() => setIsLabModalOpen(true)}
          style={{
            height: '32px',
            padding: '0 11px',
            borderRadius: '8px',
            background: '#F0F9FF',
            color: '#0284C7',
            border: '1px solid #BAE6FD',
            fontSize: '11.5px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}
          title="فحص المؤشرات الحيوية والتحاليل المخبرية للمشترك"
        >
          <HeartPulse size={13} color="#0284C7" />
          <span>فحص التحاليل</span>
        </button>

        <button
          type="button"
          onClick={handleApproveAndPublish}
          disabled={publishing}
          style={{
            height: '32px',
            padding: '0 14px',
            borderRadius: '8px',
            background: '#0F172A',
            color: '#FFFFFF',
            border: 'none',
            fontSize: '11.5px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 2px 4px rgba(15, 23, 42, 0.2)'
          }}
        >
          {publishing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          <span>اعتماد ونشر الخطة</span>
        </button>
      </div>
    </div>
  );
}
