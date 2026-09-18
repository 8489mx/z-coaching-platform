import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, LogIn, AlertCircle, Smartphone, KeyRound, Loader2, ArrowLeft, Lock, ChevronRight, ClipboardList, LayoutDashboard } from 'lucide-react';
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
              borderRadius: '12px', 
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
            disabled={isLoading || isCoachLoading}
            style={{
              height: '46px',
              borderRadius: '8px',
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '13.5px',
              fontWeight: 800,
              cursor: (isLoading || isCoachLoading) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
              marginTop: '4px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (!isLoading && !isCoachLoading) e.currentTarget.style.background = '#334155';
            }}
            onMouseLeave={(e) => {
              if (!isLoading && !isCoachLoading) e.currentTarget.style.background = '#0F172A';
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
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
            <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700 }}>أو للمدربين والإدارة</span>
            <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
          </div>

          {!showCoachForm ? (
            <button
              type="button"
              onClick={() => { setShowCoachForm(true); setError(''); }}
              disabled={isLoading}
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '8px',
                background: '#FFFFFF',
                color: '#0F172A',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                fontWeight: 800,
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
                style={{ width: '100%', height: '44px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', padding: '0 12px', fontSize: '14px', color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
              />
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', right: '12px', color: '#94A3B8', pointerEvents: 'none' }}>
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
                  style={{ width: '100%', height: '44px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', padding: '0 12px 0 38px', fontSize: '14px', color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              {coachError && (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#DC2626', fontWeight: 700 }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{coachError}</span>
                </div>
              )}
              <button
                type="submit"
                disabled={isCoachLoading}
                style={{
                  width: '100%',
                  height: '44px',
                  borderRadius: '8px',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 800,
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
