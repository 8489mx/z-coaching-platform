import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../onboarding.css';

export default function ClientLogin() {
  const [clientCode, setClientCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (!clientCode || !phoneNumber) return;
    
    // Validate against created clients
    const savedClients = localStorage.getItem('z_clients');
    if (savedClients) {
      try {
        const clients = JSON.parse(savedClients);
        const exists = clients.find(c => c.code === clientCode && c.phone === phoneNumber);
        if (!exists) {
          alert('بيانات الدخول غير صحيحة. يرجى التأكد من كود العميل ورقم الهاتف أو إنشاء حساب جديد من لوحة العملاء.');
          return;
        }
      } catch (e) {}
    } else {
      alert('لا يوجد أي عملاء مسجلين في النظام. يرجى إنشاء عميل أولاً من صفحة العملاء.');
      return;
    }

    // Store credentials in session or local to maintain session
    sessionStorage.setItem('z_client_code', clientCode);
    sessionStorage.setItem('z_client_phone', phoneNumber);
    
    // Navigate to the form
    navigate('/intake/form');
  };

  return (
    <div className="onboarding-layout" dir="rtl">
      <div className="onboarding-container" style={{ maxWidth: '450px', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: '#1e293b', fontWeight: 'bold' }}>أهلاً بك في Z-Coaching</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>أدخل بياناتك للبدء أو لاستكمال خطتك</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">كود العميل</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="مثال: 1"
              value={clientCode}
              onChange={(e) => setClientCode(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">رقم الهاتف</label>
            <input 
              type="tel" 
              className="form-control" 
              placeholder="رقم الموبايل المسجل"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}>
            دخول الدورة التدريبية
          </button>
        </form>
      </div>
    </div>
  );
}
