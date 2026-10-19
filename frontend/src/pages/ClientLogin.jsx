import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, AlertCircle, Smartphone, KeyRound, Loader2, Lock, LayoutDashboard, RotateCw } from 'lucide-react';
import { API_BASE } from '../config/api';
import { getStoredCoachConfig } from '../utils/themeAndCoachConfig';

export default function ClientLogin({ onLoginSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('simulator');
  const [simulatorKey, setSimulatorKey] = useState(0);

  const coachConfig = getStoredCoachConfig();
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const [showCoachForm, setShowCoachForm] = useState(false);
  const [coachEmail, setCoachEmail] = useState('');
  const [coachPassword, setCoachPassword] = useState('');
  const [coachError, setCoachError] = useState('');

  const handleCoachLogin = async (e) => {
    e.preventDefault();
    if (!coachEmail.trim() || !coachPassword) {
      setCoachError('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }
    try {
      setIsCoachLoading(true);
      setCoachError('');

      const res = await fetch(`${API_BASE}/api/v1/auth/login-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: coachEmail.trim(), password: coachPassword })
      });

      const data = await res.json();
      const isStaff = data?.user && (data.user.role === 'ADMIN' || data.user.role === 'COACH');
      if (res.ok && data.token && isStaff) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('z_coach_user', JSON.stringify(data.user));
        localStorage.setItem('z_auth_token', data.token);
        window.location.href = '/';
      } else {
        setIsCoachLoading(false);
        setCoachPassword('');
        setCoachError(res.ok ? 'هذا الحساب ليس حساب كوتش أو إدارة.' : 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      }
    } catch (err) {
      console.error('Coach login error:', err);
      setIsCoachLoading(false);
      setCoachError('تعذر الاتصال بالخادم لدخول الكابتن.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const cleanCode = code.replace(/^#+/, '').replace(/^client[-_]?/i, '').trim();

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
        setIsLoading(false);
        setError(data.error || 'بيانات الدخول غير صحيحة. يرجى التأكد من كتابة كود المشترك ورقم الهاتف المسجل بشكل دقيق.');
      }
    } catch (err) {
      console.error("Client login error:", err);
      setIsLoading(false);
      setError('تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.');
    }
  };

  if (viewMode === 'simulator') {
    return (
      <div 
        dir="rtl" 
        style={{ 
          width: '100vw',
          height: '100vh', 
          background: '#EEF2F6', 
          position: 'relative',
          overflow: 'hidden',
          fontFamily: "'IBM Plex Sans Arabic', 'Cairo', sans-serif" 
        }}
      >
        {/* Floating Quick Action Capsule */}
        <div 
          style={{ 
            position: 'absolute', 
            top: '12px', 
            left: '16px', 
            zIndex: 100, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(16px)',
            padding: '4px 6px',
            borderRadius: '9999px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)'
          }}
        >
          <button
            type="button"
            onClick={() => setSimulatorKey((k) => k + 1)}
            style={{
              height: '28px',
              padding: '0 11px',
              borderRadius: '9999px',
              background: '#F1F5F9',
              border: 'none',
              color: '#334155',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <RotateCw size={11} />
            <span>تحديث</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('login')}
            style={{
              height: '28px',
              padding: '0 11px',
              borderRadius: '9999px',
              background: '#0F172A',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <LogIn size={11} />
            <span>بوابة الدخول</span>
          </button>
        </div>

        {/* Embedded Pure Mobile Prototype */}
        <iframe
          key={simulatorKey}
          src={`/mobile_app_preview.html?phone=1&v=20261018_v25_${simulatorKey}`}
          title="Karim Zakaria Mobile App Simulator"
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        />
      </div>
    );
  }

  return (
    <div 
      dir="rtl" 
      style={{ 
        minHeight: '100vh', 
        background: '#F2F2F7', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '24px 16px',
        fontFamily: "'IBM Plex Sans Arabic', 'Inter', sans-serif",
        position: 'relative'
      }}
    >
      {/* Return to Simulator Action */}
      <button
        type="button"
        onClick={() => setViewMode('simulator')}
        style={{
          position: 'fixed',
          top: '16px',
          right: '20px',
          height: '38px',
          padding: '0 16px',
          borderRadius: '9999px',
          background: '#1C1C1E',
          color: '#FFFFFF',
          border: 'none',
          fontSize: '12.5px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
          zIndex: 100
        }}
      >
        <Smartphone size={15} />
        <span>العودة لمحاكي تطبيق المتدرب</span>
      </button>

      <div 
        style={{ 
          maxWidth: '420px', 
          width: '100%', 
          background: '#FFFFFF', 
          border: '1px solid rgba(0, 0, 0, 0.04)', 
          borderRadius: '24px', 
          padding: '32px 26px', 
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.06)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Brand Icon & Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div 
            style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '16px', 
              background: '#1C1C1E', 
              color: '#FFFFFF', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 14px auto',
              fontWeight: 900,
              fontSize: '1.4rem',
              fontFamily: "'Inter', sans-serif",
              boxShadow: '0 6px 16px rgba(28, 28, 30, 0.2)'
            }}
          >
            Z
          </div>
          
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1C1C1E', margin: '0 0 6px 0', letterSpacing: '-0.01em' }}>
            بوابة المشتركين المعتمدة
          </h2>
          <p style={{ fontSize: '12.5px', color: '#8E8E93', margin: 0, lineHeight: '1.5', fontWeight: 500 }}>
            أدخل رقم هاتفك وكود الاشتراك للوصول إلى استمارتك وخطتك المخصصة
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Phone Field */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1C1C1E', marginBottom: '6px' }}>
              رقم الموبايل المسجل *
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', right: '14px', color: '#8E8E93', pointerEvents: 'none', display: 'flex' }}>
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
                  height: '46px',
                  borderRadius: '12px',
                  border: '1px solid #E5E5EA',
                  background: '#F9F9FB',
                  padding: '0 40px 0 14px',
                  fontSize: '14.5px',
                  fontWeight: 700,
                  fontFamily: "'Inter', 'IBM Plex Sans Arabic', sans-serif",
                  color: '#1C1C1E',
                  textAlign: 'left',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.15s ease'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#007AFF'; e.target.style.background = '#FFFFFF'; }}
                onBlur={(e) => { e.target.style.borderColor = '#E5E5EA'; e.target.style.background = '#F9F9FB'; }}
              />
            </div>
          </div>

          {/* Client Code Field */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1C1C1E', marginBottom: '6px' }}>
              كود المشترك الخاص بك *
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', right: '14px', color: '#8E8E93', pointerEvents: 'none', display: 'flex' }}>
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
                  height: '46px',
                  borderRadius: '12px',
                  border: '1px solid #E5E5EA',
                  background: '#F9F9FB',
                  padding: '0 40px',
                  fontSize: '15px',
                  fontWeight: 800,
                  fontFamily: "'Inter', 'IBM Plex Sans Arabic', sans-serif",
                  color: '#1C1C1E',
                  outline: 'none',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  letterSpacing: '0.5px',
                  transition: 'all 0.15s ease'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#007AFF'; e.target.style.background = '#FFFFFF'; }}
                onBlur={(e) => { e.target.style.borderColor = '#E5E5EA'; e.target.style.background = '#F9F9FB'; }}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div 
              style={{
                background: '#FFF1F0', border: '1px solid #FFCCC7',
                borderRadius: '12px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#FF3B30',
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
            disabled={isLoading || isCoachLoading}
            style={{
              height: '48px',
              borderRadius: '9999px',
              background: '#007AFF',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '14px',
              fontWeight: 700,
              cursor: (isLoading || isCoachLoading) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(0, 122, 255, 0.25)',
              marginTop: '4px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (!isLoading && !isCoachLoading) e.currentTarget.style.background = '#0071E3';
            }}
            onMouseLeave={(e) => {
              if (!isLoading && !isCoachLoading) e.currentTarget.style.background = '#007AFF';
            }}
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

        {/* Dedicated Direct Entry to Coach Dashboard */}
        <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, height: '1px', background: '#E5E5EA' }} />
            <span style={{ fontSize: '11px', color: '#8E8E93', fontWeight: 600 }}>أو للمدربين والإدارة</span>
            <div style={{ flex: 1, height: '1px', background: '#E5E5EA' }} />
          </div>

          {!showCoachForm ? (
            <button
              type="button"
              onClick={() => { setShowCoachForm(true); setError(''); }}
              disabled={isLoading}
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '9999px',
                background: '#F2F2F7',
                color: '#1C1C1E',
                border: 'none',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <LayoutDashboard size={16} />
              <span>دخول لوحة تحكم الكابتن</span>
            </button>
          ) : (
            <form onSubmit={handleCoachLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="email"
                value={coachEmail}
                onChange={(e) => setCoachEmail(e.target.value)}
                placeholder="البريد الإلكتروني للكوتش"
                autoComplete="username"
                dir="ltr"
                required
                style={{ width: '100%', height: '44px', borderRadius: '12px', border: '1px solid #E5E5EA', background: '#F9F9FB', padding: '0 14px', fontSize: '14px', color: '#1C1C1E', outline: 'none', boxSizing: 'border-box' }}
              />
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', right: '14px', color: '#8E8E93', pointerEvents: 'none', display: 'flex' }}>
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  value={coachPassword}
                  onChange={(e) => setCoachPassword(e.target.value)}
                  placeholder="كلمة المرور"
                  autoComplete="current-password"
                  dir="ltr"
                  required
                  style={{ width: '100%', height: '44px', borderRadius: '12px', border: '1px solid #E5E5EA', background: '#F9F9FB', padding: '0 40px 0 14px', fontSize: '14px', color: '#1C1C1E', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              {coachError && (
                <div style={{ background: '#FFF1F0', border: '1px solid #FFCCC7', borderRadius: '12px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#FF3B30', fontWeight: 700 }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{coachError}</span>
                </div>
              )}
              <button
                type="submit"
                disabled={isCoachLoading}
                style={{
                  width: '100%',
                  height: '46px',
                  borderRadius: '9999px',
                  background: '#1C1C1E',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isCoachLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isCoachLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>جاري التحقق...</span>
                  </>
                ) : (
                  <>
                    <LayoutDashboard size={16} color="#FFFFFF" />
                    <span>دخول لوحة تحكم الكابتن</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer Info */}
        <div style={{ borderTop: '1px solid #F1F5F9', marginTop: '16px', paddingTop: '14px', textAlign: 'center' }}>
          <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>
            كابتن {coachConfig?.coachName || 'كريم زكريا'} • منصة التدريب الرياضي المعتمدة
          </span>
        </div>
      </div>
    </div>
  );
}
