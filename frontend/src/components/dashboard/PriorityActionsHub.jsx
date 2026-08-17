import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function PriorityActionsHub({
  overdueClients = [],
  expiringClients = [],
  onOpenWhatsapp
}) {
  const [activeTab, setActiveTab] = useState('ALL');

  return (
    <div className="card border-0 shadow-sm bg-white mb-4" style={{ borderRadius: '20px' }}>
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
              <span className="p-2 rounded-3 text-warning d-inline-flex align-items-center justify-content-center" style={{ background: 'rgba(245, 158, 11, 0.1)', width: '32px', height: '32px' }}>
                <i className="ti ti-bolt fs-5"></i>
              </span>
              <span>مركز المهام العاجلة والتنبيهات (Priority Actions)</span>
            </h5>
            <p className="text-muted small mb-0">اتخذ إجراءات فورية بنقرة واحدة لتذكير المتدربين المتأخرين وتجديد الاشتراكات</p>
          </div>
          
          <div className="d-flex gap-2 p-1 bg-light rounded-pill border">
            <button 
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`btn btn-sm rounded-pill px-3 fw-bold ${activeTab === 'ALL' ? 'btn-white bg-white shadow-sm text-primary' : 'btn-transparent text-muted'}`}
              style={{ fontSize: '0.82rem' }}
            >
              الكل
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('OVERDUE')}
              className={`btn btn-sm rounded-pill px-3 fw-bold ${activeTab === 'OVERDUE' ? 'btn-white bg-white shadow-sm text-danger' : 'btn-transparent text-muted'}`}
              style={{ fontSize: '0.82rem' }}
            >
              المتأخرين عن المتابعة ({overdueClients.length})
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('EXPIRING')}
              className={`btn btn-sm rounded-pill px-3 fw-bold ${activeTab === 'EXPIRING' ? 'btn-white bg-white shadow-sm text-warning' : 'btn-transparent text-muted'}`}
              style={{ fontSize: '0.82rem' }}
            >
              تجديد الاشتراكات ({expiringClients.length})
            </button>
          </div>
        </div>

        <div className="row g-3">
          {/* Overdue Check-ins */}
          {(activeTab === 'ALL' || activeTab === 'OVERDUE') && overdueClients.map((oc) => (
            <div className="col-lg-6" key={`overdue-${oc.id}`}>
              <div className="p-3 rounded-4 border bg-white shadow-xs d-flex justify-content-between align-items-center" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2 rounded-circle text-danger d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', background: 'rgba(239, 68, 68, 0.1)' }}>
                    <i className="ti ti-clock-alert fs-5"></i>
                  </div>
                  <div>
                    <div className="fw-bold text-dark" style={{ fontSize: '0.94rem' }}>{oc.full_name || `المتدرب ${oc.client_code}`}</div>
                    <small className="text-danger fw-semibold d-block" style={{ fontSize: '0.78rem' }}>
                      <i className="ti ti-alert-circle me-1"></i> متأخر عن إرسال أوزان المتابعة الأسبوعية (يومان)
                    </small>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => onOpenWhatsapp(oc, 'checkin_reminder')}
                  className="btn btn-outline-danger btn-sm rounded-pill px-3 py-1 fw-bold shadow-sm d-flex align-items-center gap-1"
                  style={{ fontSize: '0.82rem' }}
                >
                  <i className="ti ti-brand-whatsapp text-success fs-6"></i>
                  <span>تذكير واتساب</span>
                </button>
              </div>
            </div>
          ))}

          {/* Expiring Subscriptions */}
          {(activeTab === 'ALL' || activeTab === 'EXPIRING') && expiringClients.map((sc) => (
            <div className="col-lg-6" key={`expiring-${sc.id || sc.client_code}`}>
              <div className="p-3 rounded-4 border bg-white shadow-xs d-flex justify-content-between align-items-center" style={{ borderColor: 'rgba(245, 158, 11, 0.25)' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2 rounded-circle text-warning d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', background: 'rgba(245, 158, 11, 0.1)' }}>
                    <i className="ti ti-credit-card fs-5"></i>
                  </div>
                  <div>
                    <div className="fw-bold text-dark" style={{ fontSize: '0.94rem' }}>{sc.full_name || sc.client_code}</div>
                    <small className="text-muted fw-semibold d-block" style={{ fontSize: '0.78rem' }}>
                      متبقي <strong className="text-warning">{sc.days_remaining} أيام</strong> على انتهاء اشتراك ({sc.package})
                    </small>
                  </div>
                </div>
                <Link 
                  to="/subscriptions"
                  className="btn btn-warning btn-sm rounded-pill px-3 py-1 fw-bold text-dark shadow-sm"
                  style={{ fontSize: '0.82rem' }}
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
