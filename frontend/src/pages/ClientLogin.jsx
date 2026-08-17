import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';
import '../onboarding.css';

export default function ClientLogin() {
  const [clientCode, setClientCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!clientCode || !phoneNumber) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/auth/login-fast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_code: clientCode.trim(),
          phone_number: phoneNumber.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'بيانات الدخول غير صحيحة. يرجى التأكد من كود المشترك ورقم الهاتف.');
      }

      sessionStorage.setItem('z_client_code', data.user.client_code);
      sessionStorage.setItem('z_client_phone', data.user.phone_number);
      sessionStorage.setItem('z_client_id', data.user.id);
      sessionStorage.setItem('z_active_client_name', data.user.full_name || '');

      navigate('/intake/form');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-layout" dir="rtl" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', fontFamily: 'Cairo, Tajawal, sans-serif' }}>
      <div className="onboarding-container shadow-sm bg-white p-4" style={{ maxWidth: '440px', width: '100%', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.8rem' }}>
            <i className="bi bi-person-badge"></i>
          </div>
          <h3 style={{ color: '#0f172a', fontWeight: 'bold' }}>دخول المتدرب</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 0 }}>أدخل كود المشترك ورقم هاتفك للبدء في استمارة خطتك</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group mb-3">
            <label className="form-label fw-bold text-dark small">كود المشترك</label>
            <input 
              type="text" 
              className="form-control form-control-lg" 
              placeholder="مثال: 2"
              value={clientCode}
              onChange={(e) => setClientCode(e.target.value)}
              style={{ borderRadius: '12px', fontSize: '0.95rem' }}
              required 
            />
          </div>

          <div className="form-group mb-4">
            <label className="form-label fw-bold text-dark small">رقم الهاتف</label>
            <input 
              type="tel" 
              className="form-control form-control-lg" 
              placeholder="012xxxxxxxx"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              style={{ borderRadius: '12px', fontSize: '0.95rem' }}
              required 
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg w-100 rounded-pill fw-bold" 
            disabled={loading}
            style={{ padding: '0.85rem', background: '#261c6a', border: 'none', boxShadow: '0 4px 14px rgba(38, 28, 106, 0.28)' }}
          >
            {loading ? 'جاري التحقق...' : 'دخول وملء استمارة الـ Intake'}
          </button>
        </form>
      </div>
    </div>
  );
}
