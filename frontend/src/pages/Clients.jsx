import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Clients() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/v1/clients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setClients(data.clients || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const res = await fetch('/api/v1/clients', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ phone_number: phoneNumber, full_name: fullName })
      });
      if (res.ok) {
        setPhoneNumber('');
        setFullName('');
        fetchClients();
        // Close modal manually if needed or just rely on Bootstrap's data-bs-dismiss
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add client');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  if (user?.role === 'CLIENT') {
    return <div className="p-4 text-center">غير مصرح لك بدخول هذه الصفحة</div>;
  }

  return (
    <div className="row">
      <div className="col-12">
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h4 className="card-title mb-0">قائمة العملاء</h4>
            <button className="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#addClientModal">
              إضافة عميل جديد
            </button>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="text-center"><div className="spinner-border text-primary"></div></div>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>كود العميل</th>
                      <th>الاسم</th>
                      <th>رقم الهاتف</th>
                      <th>حالة الاستمارة</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.length === 0 && (
                      <tr><td colSpan="5" className="text-center text-muted">لا يوجد عملاء حالياً</td></tr>
                    )}
                    {clients.map(client => {
                      const latestIntake = client.intakeSubmissions?.[0];
                      return (
                        <tr key={client.id}>
                          <td><span className="badge bg-secondary">#{client.client_code}</span></td>
                          <td>{client.full_name || '-'}</td>
                          <td>{client.phone_number}</td>
                          <td>
                            {latestIntake ? (
                              <span className={`badge ${latestIntake.status === 'PENDING' ? 'bg-warning' : latestIntake.status === 'PROCESSED' ? 'bg-success' : 'bg-danger'}`}>
                                {latestIntake.status === 'PENDING' ? 'في انتظار المراجعة' : latestIntake.status === 'PROCESSED' ? 'تمت الموافقة' : 'مرفوض'}
                              </span>
                            ) : (
                              <span className="text-muted fs-12">لم يتم الإرسال</span>
                            )}
                          </td>
                          <td>
                            {latestIntake && latestIntake.status === 'PENDING' ? (
                              <button onClick={() => navigate(`/admin/review/${latestIntake.id}`)} className="btn btn-sm btn-outline-primary">
                                مراجعة وتوليد
                              </button>
                            ) : (
                              <button disabled className="btn btn-sm btn-outline-secondary">
                                لا يوجد إجراء
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Client Modal */}
      <div className="modal fade" id="addClientModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">إضافة عميل جديد</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form onSubmit={handleAddClient}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">اسم العميل (اختياري)</label>
                  <input type="text" className="form-control text-end" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label">رقم هاتف العميل</label>
                  <input type="text" className="form-control text-end" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
                  <div className="form-text text-muted">سيقوم النظام بتوليد كود تلقائي لهذا العميل</div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={isAdding} data-bs-dismiss="modal">
                  {isAdding ? 'جاري الإضافة...' : 'حفظ وإنشاء كود'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
