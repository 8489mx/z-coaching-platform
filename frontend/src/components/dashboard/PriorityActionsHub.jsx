import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function PriorityActionsHub({
  overdueClients = [],
  expiringClients = [],
  onOpenWhatsapp
}) {
  const [activeTab, setActiveTab] = useState('ALL');

  return (
    <div className="card border-0 shadow-sm bg-white mb-4" style={{ borderRadius: '18px' }}>
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div>
            <h5 className="fw-bold text-dark mb-1">
              <i className="ti ti-bolt text-warning me-2"></i> مركز المهام العاجلة والتنبيهات ذات الأولوية (Priority Actions)
            </h5>
            <p className="text-muted small mb-0">اتخذ إجراءات فورية بنقرة واحدة لتذكير المتدربين المتأخرين وتجديد الاشتراكات</p>
          </div>
          <div className="d-flex gap-2">
            <button 
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`btn btn-sm rounded-pill px-3 fw-bold ${activeTab === 'ALL' ? 'btn-primary' : 'btn-light border'}`}
            >
              الكل
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('OVERDUE')}
              className={`btn btn-sm rounded-pill px-3 fw-bold ${activeTab === 'OVERDUE' ? 'btn-danger' : 'btn-light border'}`}
            >
              المتأخرين عن المتابعة ({overdueClients.length})
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('EXPIRING')}
              className={`btn btn-sm rounded-pill px-3 fw-bold ${activeTab === 'EXPIRING' ? 'btn-warning text-dark' : 'btn-light border'}`}
            >
              تجديد الاشتراكات ({expiringClients.length})
            </button>
          </div>
        </div>

        <div className="row g-3">
          {/* Overdue Check-ins */}
          {(activeTab === 'ALL' || activeTab === 'OVERDUE') && overdueClients.map((oc) => (
            <div className="col-lg-6" key={`overdue-${oc.id}`}>
              <div className="p-3 rounded-4 border d-flex justify-content-between align-items-center" style={{ backgroundColor: '#fff5f5', borderColor: '#fed7d7' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2 bg-danger text-white rounded-circle">
                    <i className="ti ti-clock-alert fs-4"></i>
                  </div>
                  <div>
                    <div className="fw-bold text-dark">{oc.full_name || `المتدرب ${oc.client_code}`}</div>
                    <small className="text-danger fw-semibold">متأخر عن إرسال أوزان المتابعة الأسبوعية (يومان)</small>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => onOpenWhatsapp(oc, 'checkin_reminder')}
                  className="btn btn-danger btn-sm rounded-pill px-3 fw-bold shadow-sm"
                >
                  <i className="ti ti-brand-whatsapp me-1"></i> تذكير واتساب
                </button>
              </div>
            </div>
          ))}

          {/* Expiring Subscriptions */}
          {(activeTab === 'ALL' || activeTab === 'EXPIRING') && expiringClients.map((sc) => (
            <div className="col-lg-6" key={`expiring-${sc.id || sc.client_code}`}>
              <div className="p-3 rounded-4 border d-flex justify-content-between align-items-center" style={{ backgroundColor: '#fffdf5', borderColor: '#feebc8' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2 bg-warning text-dark rounded-circle">
                    <i className="ti ti-credit-card fs-4"></i>
                  </div>
                  <div>
                    <div className="fw-bold text-dark">{sc.full_name || sc.client_code}</div>
                    <small className="text-warning fw-semibold text-dark">متبقي {sc.days_remaining} أيام على انتهاء اشتراك ({sc.package})</small>
                  </div>
                </div>
                <Link 
                  to="/subscriptions"
                  className="btn btn-warning btn-sm rounded-pill px-3 fw-bold text-dark shadow-sm"
                >
                  <i className="ti ti-refresh me-1"></i> تجديد الآن
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
