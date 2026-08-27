import React, { useState, useEffect } from 'react';
import { generateSmartGroceryList } from '../../utils/groceryListGenerator';

export default function SmartGroceryListModal({ isOpen, onClose, culinaryMeals = [], clientName = 'بطلنا' }) {
  const [days, setDays] = useState(7);
  const [checkedItems, setCheckedItems] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        if (onClose) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = generateSmartGroceryList(culinaryMeals, days);

  const toggleCheck = (itemId) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const totalItemsCount = categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPercent = totalItemsCount > 0 ? Math.round((completedCount / totalItemsCount) * 100) : 0;

  return (
    <div 
      className="modal show d-block" 
      tabIndex="-1" 
      style={{ 
        backgroundColor: 'rgba(15, 23, 42, 0.65)', 
        backdropFilter: 'blur(6px)', 
        zIndex: 10050,
        position: 'fixed',
        top: 0,
        bottom: 0,
        right: 0,
        left: 0,
        overflowY: 'auto'
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg" style={{ width: '96%', maxWidth: '780px', margin: '1.5rem auto' }}>
        <div className="modal-content border-0 shadow-sm shadow-slate-200/50" style={{ borderRadius: '24px', overflow: 'hidden', background: '#FAFBFC' }} dir="rtl">
          
          {/* Header */}
          <div className="modal-header border-bottom p-4 bg-white d-flex justify-content-between align-items-center" style={{ borderColor: '#E7EEF3' }}>
            <div className="d-flex align-items-center gap-3">
              <div 
                style={{ 
                  width: '42px', 
                  height: '42px', 
                  borderRadius: '12px', 
                  background: '#0F172A', 
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)'
                }}
              >
                <i className="ti ti-shopping-cart"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold text-dark mb-0" style={{ fontSize: '1.1rem', color: '#0F172A' }}>
                  قائمة مشتريات السوبرماركت المجمعة (Smart Grocery List)
                </h5>
                <small className="text-muted" style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  خطة مقادير ومشتريات الأسبوع للمشترك: <strong>{clientName}</strong>
                </small>
              </div>
            </div>

            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose} 
              aria-label="Close"
              style={{ filter: 'grayscale(1)' }}
            ></button>
          </div>

          {/* Controls & Progress Bar */}
          <div className="p-3 px-4 bg-white border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2" style={{ borderColor: '#E7EEF3' }}>
            <div className="d-flex align-items-center gap-2">
              <span className="small fw-bold text-muted">حساب المشتريات لـ:</span>
              <div className="btn-group btn-group-sm" role="group">
                <button 
                  type="button" 
                  className={`btn rounded-pill px-3 fw-bold ${days === 7 ? 'btn-primary' : 'btn-light border'}`}
                  onClick={() => setDays(7)}
                  style={{ fontSize: '0.78rem' }}
                >
                  أسبوع كامل (7 أيام)
                </button>
                <button 
                  type="button" 
                  className={`btn rounded-pill px-3 fw-bold ms-1 ${days === 3 ? 'btn-primary' : 'btn-light border'}`}
                  onClick={() => setDays(3)}
                  style={{ fontSize: '0.78rem' }}
                >
                  3 أيام
                </button>
                <button 
                  type="button" 
                  className={`btn rounded-pill px-3 fw-bold ms-1 ${days === 1 ? 'btn-primary' : 'btn-light border'}`}
                  onClick={() => setDays(1)}
                  style={{ fontSize: '0.78rem' }}
                >
                  يوم واحد
                </button>
              </div>
            </div>

            {/* Shopping Progress */}
            <div className="d-flex align-items-center gap-2">
              <span className="small text-muted fw-semibold">
                تم شراء: <strong>{completedCount}</strong> من {totalItemsCount}
              </span>
              <div className="progress" style={{ width: '80px', height: '8px', borderRadius: '10px', background: '#E2E8F0' }}>
                <div 
                  className="progress-bar bg-success" 
                  role="progressbar" 
                  style={{ width: `${progressPercent}%`, transition: 'width 0.3s ease' }}
                ></div>
              </div>
            </div>
          </div>

          {/* Modal Body: Categorized Items */}
          <div className="modal-body p-4 custom-scroll" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {categories.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="ti ti-shopping-cart-x fs-1 d-block mb-2 text-muted"></i>
                <p className="mb-0 fw-bold">لا توجد وجبات مسجلة في خطة الدايت الحالية.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-4">
                {categories.map((cat) => (
                  <div key={cat.id} className="z-premium-card p-3" style={{ borderRadius: '18px', border: '1px solid #E7EEF3', background: '#FFFFFF' }}>
                    {/* Category Header */}
                    <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom" style={{ borderColor: '#F1F5F9' }}>
                      <span 
                        className="badge px-2 py-1 rounded-pill fw-bold"
                        style={{ background: cat.badge_bg, color: cat.badge_color, fontSize: '0.78rem' }}
                      >
                        <i className={`ti ${cat.icon} me-1`}></i>
                        {cat.title_ar}
                      </span>
                      <small className="text-muted ms-auto" style={{ fontSize: '0.72rem' }}>
                        ({cat.items.length} أصناف)
                      </small>
                    </div>

                    {/* Items List with Checkboxes */}
                    <div className="row g-2">
                      {cat.items.map((item, idx) => {
                        const itemKey = `${cat.id}_${item.food_code}_${idx}`;
                        const isChecked = !!checkedItems[itemKey];

                        return (
                          <div key={idx} className="col-md-6 col-12">
                            <div 
                              onClick={() => toggleCheck(itemKey)}
                              className="p-2 px-3 rounded-3 border d-flex align-items-center justify-content-between transition-all"
                              style={{ 
                                cursor: 'pointer',
                                background: isChecked ? '#F0FDF4' : '#FAFBFC',
                                borderColor: isChecked ? '#86EFAC' : '#E2E8F0',
                                opacity: isChecked ? 0.75 : 1,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div className="d-flex align-items-center gap-2">
                                <input 
                                  type="checkbox" 
                                  className="form-check-input mt-0"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                                />
                                <span 
                                  className="fw-bold text-dark"
                                  style={{ 
                                    fontSize: '0.84rem', 
                                    textDecoration: isChecked ? 'line-through' : 'none',
                                    color: isChecked ? '#64748B' : '#0F172A'
                                  }}
                                >
                                  {item.name_ar}
                                </span>
                              </div>

                              <div className="text-end">
                                <span className="badge bg-white border text-dark font-monospace fw-bold px-2 py-1" style={{ fontSize: '0.78rem', borderColor: '#CBD5E1' }}>
                                  {item.display_weekly}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer border-top p-3 px-4 bg-white d-flex justify-content-between align-items-center" style={{ borderColor: '#E7EEF3' }}>
            <button 
              type="button" 
              className="btn btn-light rounded-pill px-4 fw-semibold border"
              onClick={onClose}
              style={{ fontSize: '0.82rem' }}
            >
              إغلاق
            </button>
            <button 
              type="button" 
              className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
              onClick={() => window.print()}
              style={{ fontSize: '0.82rem' }}
            >
              <i className="ti ti-printer"></i>
              <span>طباعة القائمة</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
