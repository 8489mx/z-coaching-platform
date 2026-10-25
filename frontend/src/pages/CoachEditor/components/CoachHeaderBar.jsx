import React from 'react';
import { 
  Save, 
  Send, 
  Printer, 
  HeartPulse, 
  Loader2, 
  ShieldAlert, 
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Smartphone,
  MessageCircle,
  ChevronDown,
  Sliders
} from 'lucide-react';
import { extractClientFastingProfile } from '../../../utils/seasonalFastingRadar';
import { generateWhatsAppUrl } from '../../../utils/whatsappRemindersEngine';
import { getClientTier, ClientCodeBadge } from '../../../utils/tierBadgeHelper';

export function CoachHeaderBar({
  program,
  clientCodeParam,
  handleSaveDraft,
  saving,
  setIsLabModalOpen,
  setIsPlanQualityOpen,
  setIsEmergencyModalOpen,
  handleApproveAndPublish,
  publishing,
  _clientsList = [],
  _handleSelectClient
}) {
  const currentCode = String(program?.client?.client_code || clientCodeParam || '');
  const clientPhone = program?.client?.phone_number || program?.client?.phone || '';

  const [isAdvancedMenuOpen, setIsAdvancedMenuOpen] = React.useState(false);
  const advancedMenuRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (advancedMenuRef.current && !advancedMenuRef.current.contains(event.target)) {
        setIsAdvancedMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const rawMedicalConditions = [
    ...(Array.isArray(program?.client?.medical_conditions) ? program.client.medical_conditions : []),
    ...(Array.isArray(program?.client?.health_conditions) ? program.client.health_conditions : []),
    ...(typeof program?.client?.chronic_diseases === 'string' ? [program.client.chronic_diseases] : Array.isArray(program?.client?.chronic_diseases) ? program.client.chronic_diseases : [])
  ];
  const clientMedicalConditions = rawMedicalConditions
    .map(c => typeof c === 'string' ? c : (c?.name || c?.name_ar || c?.conditionCode || ''))
    .filter(c => Boolean(c) && c !== 'none' && c !== 'لا يوجد');

  return (
    <div 
      style={{ 
        background: '#FFFFFF', 
        border: '1px solid #EAECF0', 
        borderRadius: '14px', 
        padding: '14px 20px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '12px',
        boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)'
      }}
      dir="rtl"
    >
      {/* Client Bio Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Row 1: Code, Name, Package */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <ClientCodeBadge
              code={program?.client?.client_code || clientCodeParam || '1'}
              item={program?.client}
              size="md"
            />

            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#101828' }}>
              {program?.client?.full_name || 'أحمد محمود العوضي'}
            </h4>

            {(() => {
              const tier = getClientTier(program?.client);
              const isMax = tier === 'MAX';
              return (
                <span style={{
                  fontSize: '11px',
                  padding: '2px 10px',
                  borderRadius: '8px',
                  background: '#F8FAFC',
                  border: '1px solid #EAECF0',
                  color: isMax ? '#B45309' : '#0284C7',
                  fontWeight: 800,
                  fontFamily: 'JetBrains Mono, Cairo, sans-serif'
                }}>
                  {isMax ? 'باقة MAX' : 'باقة ELITE'}
                </span>
              );
            })()}
          </div>

          {/* Row 2: Metrics & Target Goal */}
          <div style={{ fontSize: '12px', color: '#475467', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span>{program?.client?.age || 27} سنة</span>
            <span style={{ color: '#D0D5DD', margin: '0 3px' }}>|</span>
            <span>{program?.client?.weight_kg || 84.5} كجم</span>
            <span style={{ color: '#D0D5DD', margin: '0 3px' }}>|</span>
            <span>{program?.client?.height_cm || 180} سم</span>
            <span style={{ color: '#D0D5DD', margin: '0 3px' }}>|</span>
            <span style={{ color: '#101828', fontWeight: 600 }}>{program?.client?.goal_label || 'خسارة دهون وتنشيف'}</span>
          </div>

          {/* Row 3: Compact Badges (Health, Injuries, Allergies, Fasting) */}
          {(clientMedicalConditions.length > 0 || (program?.client?.injuries && program.client.injuries.length > 0) || (program?.client?.allergies && program.client.allergies.length > 0)) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
              {clientMedicalConditions.length > 0 && (
                <span style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '8px', background: '#F2F4F7', border: '1px solid #EAECF0', color: '#475467', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <span>الحالة الصحية: {clientMedicalConditions.join('، ')}</span>
                </span>
              )}

              {program?.client?.injuries && program?.client?.injuries.length > 0 && (
                <span style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '8px', background: '#FEF3F2', border: '1px solid #FECDCA', color: '#B42318', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <ShieldAlert size={11} />
                  <span>إصابة: {program?.client?.injuries.join('، ')}</span>
                </span>
              )}

              {program?.client?.allergies && program?.client?.allergies.length > 0 && (
                <span style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '8px', background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0284C7', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <AlertCircle size={11} />
                  <span>حساسية: {program?.client?.allergies.join('، ')}</span>
                </span>
              )}

              {(() => {
                const fasting = extractClientFastingProfile(program?.client);
                return (
                  <>
                    {fasting.primaryFastingBadge && (
                      <span style={{ 
                        fontSize: '10.5px', 
                        padding: '2px 8px', 
                        borderRadius: '8px', 
                        background: fasting.primaryFastingBadge.bg, 
                        border: `1px solid ${fasting.primaryFastingBadge.border}`, 
                        color: fasting.primaryFastingBadge.color, 
                        fontWeight: 600 
                      }}>
                        {fasting.primaryFastingBadge.label}
                      </span>
                    )}
                    {fasting.intermittentBadge && (
                      <span style={{ 
                        fontSize: '10.5px', 
                        padding: '2px 8px', 
                        borderRadius: '8px', 
                        background: fasting.intermittentBadge.bg, 
                        border: `1px solid ${fasting.intermittentBadge.border}`, 
                        color: fasting.intermittentBadge.color, 
                        fontWeight: 600 
                      }}>
                        {fasting.intermittentBadge.label}
                      </span>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Actions Toolbar - Hostinger Design System */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        
        {/* Live Client App Preview */}
        <a
          href={`/mobile_app_preview.html?code=${encodeURIComponent(currentCode || '1')}${program?.client?.full_name ? `&name=${encodeURIComponent(program.client.full_name)}` : ''}`}
          target="_blank"
          rel="noreferrer"
          title="معاينة حية لتطبيق المتدرب على الموبايل"
          style={{
            height: '34px',
            padding: '0 13px',
            borderRadius: '8px',
            background: '#FFFFFF',
            color: '#344054',
            border: '1px solid #D0D5DD',
            fontSize: '11.5px',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
        >
          <Smartphone size={13} color="#475467" />
          <span>تطبيق المتدرب</span>
        </a>

        {/* WhatsApp Direct Chat */}
        {clientPhone && (
          <a
            href={generateWhatsAppUrl(clientPhone, `أهلاً ${program?.client?.full_name ? program.client.full_name.replace(/مشترك #\d+/g, '').trim() : ''}، بخصوص خطتك التدريبية والغذائية:`)}
            target="_blank"
            rel="noreferrer"
            title="مراسلة المتدرب مباشرة عبر واتساب"
            style={{
              height: '34px',
              padding: '0 13px',
              borderRadius: '8px',
              background: '#FFFFFF',
              color: '#027A48',
              border: '1px solid #D0D5DD',
              fontSize: '11.5px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F9FAFB';
              e.currentTarget.style.borderColor = '#A6F4C7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.borderColor = '#D0D5DD';
            }}
          >
            <MessageCircle size={13} color="#027A48" />
            <span>واتساب</span>
          </a>
        )}

        {/* Cluster 2: Advanced Tools Dropdown */}
        <div ref={advancedMenuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setIsAdvancedMenuOpen(prev => !prev)}
            style={{
              height: '34px',
              padding: '0 14px',
              borderRadius: '10px',
              background: isAdvancedMenuOpen ? '#F9FAFB' : '#FFFFFF',
              color: '#344054',
              border: '1px solid #D0D5DD',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
              transition: 'all 0.15s ease'
            }}
            title="أدوات ومحركات الفحص المتقدمة"
          >
            <Sliders size={14} color="#475467" />
            <span>أدوات متقدمة</span>
            <ChevronDown size={13} color="#667085" style={{ transform: isAdvancedMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {isAdvancedMenuOpen && (
            <div style={{
              position: 'absolute',
              top: '40px',
              left: 0,
              background: '#FFFFFF',
              border: '1px solid #EAECF0',
              borderRadius: '16px',
              boxShadow: '0 10px 25px -5px rgba(16, 24, 40, 0.1), 0 8px 10px -6px rgba(16, 24, 40, 0.05)',
              padding: '6px',
              minWidth: '220px',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              <button
                type="button"
                onClick={() => {
                  setIsAdvancedMenuOpen(false);
                  setIsLabModalOpen(true);
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: '#101828',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textAlign: 'right'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
                  <HeartPulse size={13} />
                </div>
                <span>فحص التحاليل والمؤشرات</span>
              </button>

              {typeof setIsPlanQualityOpen === 'function' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAdvancedMenuOpen(false);
                    setIsPlanQualityOpen(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    background: 'transparent',
                    border: 'none',
                    color: '#101828',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textAlign: 'right'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: '#ECFDF3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#027A48' }}>
                    <ShieldCheck size={13} />
                  </div>
                  <span>درع جودة الخطة</span>
                </button>
              )}

              {typeof setIsEmergencyModalOpen === 'function' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAdvancedMenuOpen(false);
                    setIsEmergencyModalOpen(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    background: 'transparent',
                    border: 'none',
                    color: '#101828',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textAlign: 'right'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: '#FFFAEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B54708' }}>
                    <AlertTriangle size={13} />
                  </div>
                  <span>محرك المرونة والطوارئ</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Cluster 3: Primary Save & Publishing Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => handleSaveDraft(false)}
            disabled={saving}
            style={{
              height: '34px',
              padding: '0 16px',
              borderRadius: '10px',
              background: '#FFFFFF',
              color: '#344054',
              border: '1px solid #D0D5DD',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} color="#475467" />}
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
              height: '34px',
              padding: '0 16px',
              borderRadius: '10px',
              background: '#FFFFFF',
              color: '#344054',
              border: '1px solid #D0D5DD',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
          >
            <Printer size={13} color="#475467" />
            <span>معاينة PDF</span>
          </button>

          {/* Hostinger Primary Purple Button for Plan Publishing */}
          <button
            type="button"
            onClick={handleApproveAndPublish}
            disabled={publishing}
            style={{
              height: '34px',
              padding: '0 18px',
              borderRadius: '10px',
              background: '#673DE6',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 3px rgba(103, 61, 230, 0.25)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#5025D1')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#673DE6')}
          >
            {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            <span>اعتماد ونشر الخطة</span>
          </button>
        </div>

      </div>
    </div>
  );
}
