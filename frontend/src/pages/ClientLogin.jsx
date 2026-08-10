import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function ClientLogin() {
  const [clientCode, setClientCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const { clientLogin } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await clientLogin(clientCode, phoneNumber);
      navigate('/client-intake');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="container-fluid vh-100 bg-light d-flex justify-content-center align-items-center" dir="rtl">
      <div className="row justify-content-center w-100">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card shadow-lg border-0 rounded-4">
            <div className="card-body p-5 text-center">
              <h2 className="fw-bold mb-4">تسجيل دخول العميل</h2>
              <p className="text-muted mb-4">الرجاء إدخال الكود الخاص بك ورقم الهاتف للمتابعة</p>
              
              {error && <div className="alert alert-danger p-2">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-group mb-3 text-end">
                  <label className="form-label text-end fw-semibold">رقم الكود</label>
                  <input 
                    type="text" 
                    className="form-control text-end" 
                    value={clientCode}
                    onChange={(e) => setClientCode(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group mb-4 text-end">
                  <label className="form-label text-end fw-semibold">رقم الهاتف</label>
                  <input 
                    type="text" 
                    className="form-control text-end" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100 py-2 fs-5">
                  دخول
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
