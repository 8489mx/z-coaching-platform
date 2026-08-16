import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../onboarding.css';

export default function Customers() {
  const [phone, setPhone] = useState('');
  const [clients, setClients] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('z_clients');
    if (saved) {
      try {
        setClients(JSON.parse(saved));
      } catch(e) {}
    }
  }, []);

  const handleCreateClient = (e) => {
    e.preventDefault();
    if (!phone) return;

    // Check if phone already exists
    const existing = clients.find(c => c.phone === phone);
    if (existing) {
      alert(`هذا العميل موجود بالفعل وكوده هو: ${existing.code}`);
      return;
    }

    // Generate code
    const nextId = clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1;
    const newClient = {
      id: nextId,
      code: `${nextId}`,
      phone: phone,
      createdAt: new Date().toISOString()
    };

    const newClientsList = [...clients, newClient];
    setClients(newClientsList);
    localStorage.setItem('z_clients', JSON.stringify(newClientsList));
    setPhone('');
    
    alert(`تم إنشاء العميل بنجاح!\nالكود: ${newClient.code}`);
  };

  return (
    <div className="onboarding-layout" dir="rtl" style={{ alignItems: 'flex-start', paddingTop: '4rem' }}>
      <div className="onboarding-container" style={{ maxWidth: '800px', width: '100%' }}>
        <div className="intake-header">
          <h2 className="intake-header-title">
            <i className="bi bi-people" style={{marginLeft: '0.5rem'}}></i>
            إدارة العملاء (إضافة عميل جديد)
          </h2>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            العودة للداش بورد
          </button>
        </div>

        <div className="intake-body">
          <form onSubmit={handleCreateClient} style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
            <h4 style={{marginBottom: '1rem', color: '#1e293b'}}>إضافة عميل جديد</h4>
            <div className="form-group">
              <label className="form-label">رقم هاتف العميل</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input 
                  type="tel" 
                  className="form-control" 
                  placeholder="مثال: 01012345678"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required 
                />
                <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                  توليد كود وبدء الملف
                </button>
              </div>
            </div>
          </form>

          <h4 style={{marginBottom: '1rem', color: '#1e293b'}}>العملاء المسجلين ({clients.length})</h4>
          
          {clients.length === 0 ? (
            <div style={{textAlign: 'center', padding: '2rem', color: '#64748b', background: '#f8fafc', borderRadius: '10px'}}>
              لا يوجد عملاء حتى الآن
            </div>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                  <tr style={{background: '#f1f5f9', color: '#475569', textAlign: 'right'}}>
                    <th style={{padding: '1rem', borderBottom: '1px solid #e2e8f0'}}>كود العميل</th>
                    <th style={{padding: '1rem', borderBottom: '1px solid #e2e8f0'}}>رقم الهاتف</th>
                    <th style={{padding: '1rem', borderBottom: '1px solid #e2e8f0'}}>تاريخ التسجيل</th>
                    <th style={{padding: '1rem', borderBottom: '1px solid #e2e8f0'}}>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(client => (
                    <tr key={client.id} style={{borderBottom: '1px solid #e2e8f0'}}>
                      <td style={{padding: '1rem', fontWeight: 'bold', color: '#4f46e5'}}>{client.code}</td>
                      <td style={{padding: '1rem'}}>{client.phone}</td>
                      <td style={{padding: '1rem', color: '#64748b'}}>{new Date(client.createdAt).toLocaleDateString('ar-EG')}</td>
                      <td style={{padding: '1rem'}}>
                        <button className="btn btn-secondary" style={{padding: '0.4rem 0.8rem', fontSize: '0.85rem'}} onClick={() => {
                          // Auto login and go to intake
                          sessionStorage.setItem('z_client_code', client.code);
                          sessionStorage.setItem('z_client_phone', client.phone);
                          navigate('/intake/form');
                        }}>
                          فتح ملف العميل (Intake)
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
