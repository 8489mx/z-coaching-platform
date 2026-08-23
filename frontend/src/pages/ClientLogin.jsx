import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveSession, isClientLoggedIn } from '../utils/auth';

export default function ClientLogin() {
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isClientLoggedIn()) {
      navigate('/client/today', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/client/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_code: code.trim(), phone: phone.trim() })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'بيانات الدخول غير صحيحة، يرجى مراجعة الكود ورقم الهاتف');
      }

      saveSession(data.client || data.user || { client_code: code.trim(), phone: phone.trim() });
      navigate('/client/today', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: '#FFFFFF',
    color: '#0F172A',
    border: '1.5px solid #CBD5E1',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '0.92rem',
    fontWeight: '500',
    width: '100%',
    outline: 'none',
    boxShadow: 'none'
  };

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#FAFBFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'Alexandria, Cairo, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '32px 28px', boxShadow: '0 10px 40px rgba(15, 23, 42, 0.06)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', fontSize: '1.4rem', border: '1px solid #7DD3FC' }}>
            <i className="ti ti-lock"></i>
          </div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#0F172A', margin: 0 }}>تسجيل الدخول للمتدربين</h1>
          <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '4px 0 0 0' }}>أدخل كود المشترك ورقم هاتفك للوصول لخطتك</p>
        </div>

        {error && (
          <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#BE123C', fontSize: '0.8rem', padding: '10px 14px', borderRadius: '12px', marginBottom: '18px', textAlign: 'center', fontWeight: '700' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>كود المشترك الخاص بك:</label>
            <input
              type="text"
              required
              placeholder="مثال: 1042"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>رقم الهاتف المسجل (WhatsApp):</label>
            <input
              type="tel"
              required
              placeholder="010XXXXXXXX أو 05XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '14px',
              padding: '14px',
              fontSize: '0.92rem',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
              marginTop: '8px'
            }}
          >
            {loading ? 'جاري التحقق...' : 'دخول للمنصة والتطبيق'}
          </button>
        </form>

      </div>
    </div>
  );
}
