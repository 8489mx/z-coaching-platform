import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    client_code: '',
    phone_number: '',
    full_name: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isRegister ? '/api/v1/auth/register-fast' : '/api/v1/auth/login-fast';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        login(data.token);
        navigate('/');
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      console.error(err);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-xxl" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="row vh-100 d-flex justify-content-center">
            <div className="col-12 align-self-center">
                <div className="card-body">
                    <div className="row">
                        <div className="col-lg-4 mx-auto">
                            <div className="card">
                                <div className="card-body p-0 bg-black auth-header-box rounded-top">
                                    <div className="text-center p-3">
                                        <h4 className="mt-3 mb-1 fw-semibold text-white fs-18">
                                          {isRegister ? 'Create Account' : 'Welcome Back'}
                                        </h4>   
                                        <p className="text-muted fw-medium mb-0">
                                          {isRegister ? 'Sign up to continue.' : 'Sign in to continue.'}
                                        </p>  
                                    </div>
                                </div>
                                <div className="card-body pt-0">                                    
                                    <form className="my-4" onSubmit={handleSubmit}>            
                                        {error && <div className="alert alert-danger">{error}</div>}

                                        <div className="form-group mb-2">
                                            <label className="form-label">Client Code (Username)</label>
                                            <input type="text" className="form-control" name="client_code" placeholder="e.g. USER123" value={formData.client_code} onChange={handleChange} required />                               
                                        </div>

                                        <div className="form-group mb-2">
                                            <label className="form-label">Phone Number</label>                                            
                                            <input type="text" className="form-control" name="phone_number" placeholder="Enter phone" value={formData.phone_number} onChange={handleChange} required />                            
                                        </div>

                                        {isRegister && (
                                          <div className="form-group mb-2">
                                              <label className="form-label">Full Name</label>                                            
                                              <input type="text" className="form-control" name="full_name" placeholder="Enter your name" value={formData.full_name} onChange={handleChange} required />                            
                                          </div>
                                        )}

                                        <div className="form-group mb-0 row mt-4">
                                            <div className="col-12">
                                                <div className="d-grid mt-3">
                                                    <button className="btn btn-primary" type="submit" disabled={loading}>
                                                      {loading ? 'Processing...' : (isRegister ? 'Register' : 'Log In')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>                           
                                    </form>
                                    
                                    <div className="text-center mb-2">
                                        <p className="text-muted">
                                          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
                                          <button type="button" className="btn btn-link p-0 text-primary" onClick={() => setIsRegister(!isRegister)}>
                                            {isRegister ? 'Log in here' : 'Register here'}
                                          </button>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>                                        
    </div>
  );
}
