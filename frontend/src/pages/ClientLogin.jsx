import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, LogIn, AlertCircle, Smartphone, KeyRound, Loader2, ArrowLeft, Lock, ChevronRight, ClipboardList } from 'lucide-react';
import { API_BASE } from '../config/api';
import { getStoredCoachConfig } from '../utils/themeAndCoachConfig';

export default function ClientLogin({ onLoginSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const coachConfig = getStoredCoachConfig();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (phone.trim().length < 9 || code.trim().length < 1) {
      setError('يرجى إدخال رقم الموبايل وكود الاشتراك بشكل صحيح.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    // Normalization: Remove non-numeric chars, remove leading +20 or 002
    let normalizedPhone = phone.replace(/\D/g, '');
    if (normalizedPhone.startsWith('20') && normalizedPhone.length > 10) normalizedPhone = normalizedPhone.substring(2);
    if (normalizedPhone.startsWith('0020')) normalizedPhone = normalizedPhone.substring(4);
    if (!normalizedPhone.startsWith('01') && normalizedPhone.startsWith('1')) {
      normalizedPhone = '0' + normalizedPhone;
    }
    const cleanCode = code.replace('#', '').trim();

    try {
      // Save session credentials for intake & client app
      sessionStorage.setItem('z_client_code', cleanCode);
      sessionStorage.setItem('z_client_phone', normalizedPhone);
      localStorage.setItem('kz_client_code', cleanCode);
      localStorage.setItem('kz_client_phone', normalizedPhone);

      const response = await fetch(`${API_BASE}/api/v1/auth/login-fast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_code: cleanCode, phone_number: normalizedPhone })
      });
      
      const data = await response.json();
      
      if (response.ok && data.token) {
        localStorage.setItem('kz_client_token', data.token);
        localStorage.setItem('token', data.token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('kz_client_name', data.user.full_name || 'المشترك');
        }
        setIsLoading(false);
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          // If accessing /intake, route to intake form, otherwise to client dashboard
          if (location.pathname.includes('intake')) {
            navigate(`/intake/form?code=${encodeURIComponent(cleanCode)}&phone=${encodeURIComponent(normalizedPhone)}`);
          } else {
            navigate('/client/today');
          }
        }
      } else {
        // Fallback: If code exists, allow proceeding directly to intake form
        setIsLoading(false);
        navigate(`/intake/form?code=${encodeURIComponent(cleanCode)}&phone=${encodeURIComponent(normalizedPhone)}`);
      }
    } catch (err) {
      // Offline / direct pass-through for intake filling
      setIsLoading(false);
      navigate(`/intake/form?code=${encodeURIComponent(cleanCode)}&phone=${encodeURIComponent(normalizedPhone)}`);
    }
  };

  return (
    <div 
      dir="rtl" 
      style={{ 
        minHeight: '100vh', 
        background: '#F8FAFC', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '24px 16px',
        fontFamily: 'Cairo, Tajawal, sans-serif'
      }}
    >
      <div 
        style={{ 
          maxWidth: '440px', 
          width: '100%', 
          background: '#FFFFFF', 
          border: '1px solid #E2E8F0', 
          borderRadius: '16px', 
          padding: '32px 28px', 
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Top Accent Line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #0F172A, #334155, #0F172A)' }} />

        {/* Brand Icon & Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div 
            style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '14px', 
              background: '#0F172A', 
              color: '#FFFFFF', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 14px auto',
              fontWeight: 900,
              fontSize: '1.4rem',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)'
            }}
          >
            Z
          </div>
          
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', margin: '0 0 6px 0' }}>
            بوابة المشتركين المعتمدة
          </h2>
          <p style={{ fontSize: '12.5px', color: '#64748B', margin: 0, lineHeight: '1.5' }}>
            أدخل رقم هاتفك وكود الاشتراك للوصول إلى استمارتك وخطتك المخصصة
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Phone Field */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
              رقم الموبايل المسجل *
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', right: '12px', color: '#94A3B8', pointerEvents: 'none' }}>
                <Smartphone size={17} />
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010XXXXXXXX"
                dir="ltr"
                required
                style={{
                  width: '100%',
                  height: '44px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  padding: '0 12px 0 38px',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'JetBrains Mono, Cairo',
                  color: '#0F172A',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease'
                }}
                onFocus={(e) => (e.target.style.borderColor = '#0F172A')}
                onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
              />
            </div>
          </div>

          {/* Client Code Field */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
              كود المشترك الخاص بك *
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', right: '12px', color: '#94A3B8', pointerEvents: 'none' }}>
                <KeyRound size={17} />
              </span>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="مثال: 1 أو 84902"
                dir="ltr"
                required
                style={{
                  width: '100%',
                  height: '44px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  padding: '0 12px 0 38px',
                  fontSize: '15px',
                  fontWeight: 900,
                  fontFamily: 'JetBrains Mono, Cairo',
                  color: '#0F172A',
                  outline: 'none',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  letterSpacing: '1px',
                  transition: 'border-color 0.15s ease'
                }}
                onFocus={(e) => (e.target.style.borderColor = '#0F172A')}
                onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div 
              style={{
                background: '#F8FAFC', border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#DC2626',
                fontWeight: 700
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              height: '46px',
              borderRadius: '8px',
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '13.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
              marginTop: '4px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#0F172A')}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>جاري التحقق والدخول...</span>
              </>
            ) : (
              <>
                <span>دخول للاستمارة والبرنامج</span>
                <LogIn size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer Info */}
        <div style={{ borderTop: '1px solid #F1F5F9', marginTop: '20px', paddingTop: '16px', textAlign: 'center' }}>
          <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>
            كابتن {coachConfig?.coachName || 'كريم زكريا'} • منصة التدريب الرياضي المعتمدة
          </span>
        </div>
      </div>
    </div>
  );
}
