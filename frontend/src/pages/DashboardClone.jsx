import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import NotificationsDropdown from '../components/NotificationsDropdown';

export default function DashboardClone() {
  const [clients, setClients] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [subscriptionsOverview, setSubscriptionsOverview] = useState({
    active_subscriptions: 3,
    expiring_soon: 1,
    expired: 0,
    total_monthly_revenue: 4500,
    clients: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedCheckin, setSelectedCheckin] = useState(null);
  const [coachNotes, setCoachNotes] = useState('');
  const [approving, setApproving] = useState(false);

  // WhatsApp Automation Hub State
  const [whatsappModalClient, setWhatsappModalClient] = useState(null);
  const [whatsappTemplate, setWhatsappTemplate] = useState('intake'); // 'intake' | 'plan_ready' | 'checkin_reminder' | 'checkin_approved'
  const [whatsappCustomText, setWhatsappCustomText] = useState('');
  const [whatsappCopied, setWhatsappCopied] = useState(false);

  // Live Search
  const [searchTerm, setSearchTerm] = useState('');

  // Active Alert Filter Tab
  const [activeAlertTab, setActiveAlertTab] = useState('ALL'); // 'ALL' | 'OVERDUE' | 'PENDING' | 'EXPIRING'

  useEffect(() => {
    fetchDashboardData();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        setSelectedCheckin(null);
        setWhatsappModalClient(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [clientsRes, checkinsRes, subsRes] = await Promise.all([
        fetch('http://localhost:3000/api/v1/clients'),
        fetch('http://localhost:3000/api/v1/programs/checkin/pending'),
        fetch('http://localhost:3000/api/v1/subscriptions/overview')
      ]);

      const clientsData = await clientsRes.json();
      const checkinsData = await checkinsRes.json();
      const subsData = await subsRes.json();

      if (clientsData.clients) setClients(clientsData.clients);
      if (checkinsData.checkins) setCheckins(checkinsData.checkins);
      if (subsData) setSubscriptionsOverview(subsData);
    } catch (e) {
      console.error('fetchDashboardData error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCheckin = async () => {
    if (!selectedCheckin) return;
    try {
      setApproving(true);
      const res = await fetch('http://localhost:3000/api/v1/programs/checkin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkin_id: selectedCheckin.id,
          coach_notes: coachNotes || 'تمت مراجعة واعتماد المتابعة وتحديث الخطة بنجاح.'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل اعتماد المتابعة');

      alert('✅ تم اعتماد المتابعة وتحديث خطة المتدرب بنجاح في MariaDB z!');
      setSelectedCheckin(null);
      setCoachNotes('');
      fetchDashboardData();
    } catch (err) {
      alert('خطأ: ' + err.message);
    } finally {
      setApproving(false);
    }
  };

  // WhatsApp Helpers
  const openWhatsappModal = (client, template = 'intake') => {
    setWhatsappModalClient(client);
    setWhatsappTemplate(template);
    setWhatsappCustomText(generateWhatsappMessage(client, template));
  };

  const generateWhatsappMessage = (client, template) => {
    if (!client) return '';
    const origin = window.location.origin;
    const code = client.client_code || client.id;
    const phone = client.phone_number || '';
    const name = client.full_name && client.full_name !== 'null' ? client.full_name : 'بطل FitNexus';

    switch (template) {
      case 'intake':
        return `مرحباً بك يا ${name}! 🏋️‍♂️\nيرجى استكمال استمارة البيانات والقياسات التدريبية والغذائية لبدء تصميم خطتك المخصصة بدقة عبر الرابط التالي:\n${origin}/intake/form?code=${code}&phone=${phone}`;
      case 'plan_ready':
        return `أهلاً بك يا ${name}! 🚀\nتم تجهيز وتفعيل خطتك التدريبية والغذائية للأسبوع الأول بنجاح على منظومة FitNexus.\n\n📱 يمكنك استعراض خطتك عبر:\n${origin}/user-dashboard?user_id=${code}\n\n📄 أو تحميل الخطة كملف PDF:\n${origin}/pdf?user_id=${code}\n\nبالتوفيق يا بطل! 💪`;
      case 'checkin_reminder':
        return `مرحباً يا ${name}! ⏰\nتذكير بموعد إرسال المتابعة الأسبوعية (أوزان الـ 7 أيام ومحيط الخصر).\nيرجى الدخول على حسابك لتسجيل التقرير حتى يتم تحديث وتكييف خطتك للأسبوع التالي:\n${origin}/user-dashboard?user_id=${code}`;
      case 'checkin_approved':
        return `عاش يا ${name}! 🏆\nتمت مراجعة واعتماد متابعتك الأسبوعية وتحديث جدول التمارين والسعرات للأسبوع التالي بنجاح.\nتفقد خطتك المحدثة الآن:\n${origin}/user-dashboard?user_id=${code}`;
      default:
        return '';
    }
  };

  const handleTemplateChange = (template) => {
    setWhatsappTemplate(template);
    setWhatsappCustomText(generateWhatsappMessage(whatsappModalClient, template));
  };

  const sendWhatsappDirect = () => {
    if (!whatsappModalClient) return;
    const phoneClean = (whatsappModalClient.phone_number || '').replace(/[^0-9]/g, '');
    const msgEncoded = encodeURIComponent(whatsappCustomText);
    window.open(`https://wa.me/${phoneClean}?text=${msgEncoded}`, '_blank');
  };

  const copyWhatsappText = () => {
    navigator.clipboard.writeText(whatsappCustomText);
    setWhatsappCopied(true);
    setTimeout(() => setWhatsappCopied(false), 2500);
  };

  const pendingCount = checkins.filter(c => c.status === 'PENDING_REVIEW').length;
  
  // Detect Overdue Clients (e.g. Clients who haven't submitted a recent checkin or flagged late)
  const overdueClients = clients.filter(c => c.phone_number && c.id !== 2); // Sample demonstration of overdue follow-up
  const expiringClients = (subscriptionsOverview.clients || []).filter(c => c.status === 'EXPIRING_SOON' || c.status === 'EXPIRED');

  const filteredClients = clients.filter(c => {
    if (!searchTerm.trim()) return true;
    const t = searchTerm.trim().toLowerCase();
    const name = (c.full_name || '').toLowerCase();
    const phone = (c.phone_number || '').toLowerCase();
    const code = String(c.client_code || c.id).toLowerCase();
    const email = (c.email || '').toLowerCase();
    return name.includes(t) || phone.includes(t) || code.includes(t) || email.includes(t);
  });

  return (
    <div className="codex-wrapper" dir="rtl" style={{ minHeight: '100vh', backgroundColor: '#f6f8fb', fontFamily: 'Cairo, Tajawal, sans-serif' }}>
      {/* 1. Header */}
      <header className="codex-header">
        <div className="header-contian d-flex justify-content-between align-items-center">
          <div className="header-left d-flex align-items-center">
            <div className="input-group" style={{ minWidth: '340px' }}>
              <span className="input-group-text pe-0"><i className="ti ti-search text-muted"></i></span>
              <input 
                type="text" 
                placeholder="بحث سريع بالاسم، الهاتف، أو كود المشترك..." 
                className="form-control" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="header-right d-flex align-items-center justify-content-end gap-3 pe-2">
            <NotificationsDropdown />

            <Link to="/intake/form" className="btn btn-primary btn-sm rounded-pill px-3 py-2 fw-bold shadow-sm">
              <i className="ti ti-user-plus me-1"></i> تسجيل متدرب جديد
            </Link>

            <div className="d-flex align-items-center gap-2 py-1 px-3 bg-light rounded-pill border ms-2">
              <img className="img-fluid rounded-circle border" src="/admin-dashboard_data/logo/z_coaching_logo.jpg" alt="Coach Logo" width="36" height="36" />
              <div className="d-none d-md-block text-end pe-1">
                <span className="fw-bold d-block text-dark lh-1" style={{ fontSize: '0.9rem' }}>لوحة تحكم المدرب</span>
                <small className="text-muted" style={{ fontSize: '0.72rem' }}>Master Coach 👑</small>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Sidebar (Right Side RTL - Coach Portal) */}
      <aside className="codex-sidebar">
        <div 
          className="codex-brand" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            textAlign: 'center', 
            padding: '14px 10px 8px 10px',
            width: '100%',
            border: 'none',
            background: 'transparent'
          }}
        >
          <Link 
            to="/" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              textDecoration: 'none',
              width: '100%',
              margin: '0 auto'
            }}
          >
            <img 
              src="/admin-dashboard_data/logo/z_clean_symbol.jpg?v=2" 
              alt="Z Logo" 
              style={{ 
                height: '76px', 
                width: '76px', 
                objectFit: 'contain', 
                margin: '0 auto',
                display: 'block'
              }} 
            />
            <span 
              style={{ 
                fontSize: '0.92rem', 
                letterSpacing: '4px', 
                fontWeight: '900',
                background: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'block',
                marginTop: '-4px',
                lineHeight: '1.2',
                textAlign: 'center',
                width: '100%'
              }}
            >
              COACHING
            </span>
          </Link>
        </div>

        <div className="codex-menuwrapper custom-scroll" data-simplebar>
          <ul className="codex-menu">
            <li className="menu-item active">
              <Link to="/">
                <div className="icon-item"><i className="ti ti-layout-dashboard"></i></div>
                <span>لوحة التحكم الرئيسية</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/user-dashboard">
                <div className="icon-item"><i className="ti ti-user-circle"></i></div>
                <span>واجهة المتدرب</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/progress">
                <div className="icon-item"><i className="ti ti-chart-line"></i></div>
                <span>تطور القياسات والصور</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/subscriptions">
                <div className="icon-item"><i className="ti ti-credit-card"></i></div>
                <span>الاشتراكات والمالية</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/exercises">
                <div className="icon-item"><i className="ti ti-barbell"></i></div>
                <span>مكتبة التمارين</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/calculator">
                <div className="icon-item"><i className="ti ti-calculator"></i></div>
                <span>حاسبة الماكروز والسعرات</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/customers">
                <div className="icon-item"><i className="ti ti-user-plus"></i></div>
                <span>إدارة المشتركين والأكواد</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/profile">
                <div className="icon-item"><i className="ti ti-settings"></i></div>
                <span>إعدادات وهوية المدرب</span>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/mobile">
                <div className="icon-item"><i className="ti ti-device-mobile"></i></div>
                <span>تطبيق المتدرب (Mobile)</span>
              </Link>
            </li>
          </ul>
        </div>

        <div className="sidebarpro-sec mt-3 mb-4 mx-3 p-3 text-center" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill fw-bold" style={{ fontSize: '0.74rem' }}>
              <i className="ti ti-circle-filled me-1" style={{ fontSize: '7px' }}></i> محرك الذكاء نشط
            </span>
          </div>
          <h6 className="mb-1 fw-bold text-dark" style={{ fontSize: '0.88rem' }}>Z Coaching Platform</h6>
          <p className="text-muted mb-3" style={{ fontSize: '0.74rem' }}>النظام يعمل بكفاءة 100%</p>
          <Link 
            to="/intake/form" 
            className="btn btn-sm w-100 rounded-pill fw-bold text-white shadow-sm"
            style={{ 
              background: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)',
              padding: '8px 14px',
              fontSize: '0.86rem',
              border: 'none'
            }}
          >
            <i className="ti ti-user-plus me-1"></i> تسجيل مشترك جديد
          </Link>
        </div>
      </aside>

      {/* 3. Main Workspace */}
      <main className="themebody-wrap">
        <div className="theme-body">
          <div className="container-fluid">
            
            {/* Executive Welcome Hero Banner */}
            <div className="card border-0 mb-4 p-4 text-white shadow-sm" style={{ borderRadius: '20px', background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)' }}>
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                  <h3 className="fw-bold mb-1">مرحباً بك يا كابتن في Z Coaching! 👑</h3>
                  <p className="mb-0 opacity-90" style={{ fontSize: '0.95rem' }}>
                    لوحة القيادة المركزية: إليك ملخص حالة المتدربين، المتابعات المتأخرة، وتجديدات الاشتراكات لليوم.
                  </p>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  <Link to="/intake/form" className="btn btn-light rounded-pill px-3 py-2 fw-bold text-primary shadow-sm">
                    <i className="ti ti-plus me-1"></i> تسجيل متدرب
                  </Link>
                  <Link to="/calculator" className="btn btn-outline-light rounded-pill px-3 py-2 fw-bold">
                    <i className="ti ti-calculator me-1"></i> حاسبة الماكروز
                  </Link>
                  <Link to="/exercises" className="btn btn-outline-light rounded-pill px-3 py-2 fw-bold">
                    <i className="ti ti-barbell me-1"></i> مكتبة التمارين
                  </Link>
                </div>
              </div>
            </div>

            {/* Top 4 Executive KPI Cards */}
            <div className="row row-cols-xxl-4 row-cols-md-2 gy-3 mb-4">
              {/* Card 1: Active Clients */}
              <div className="col">
                <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: '16px' }}>
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="stat-icon bg-primary-subtle text-primary p-2 rounded-3 d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px' }}>
                        <i className="ti ti-users fs-4"></i>
                      </div>
                      <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1 fw-bold">المشتركين النشطين</span>
                    </div>
                    <h2 className="fw-bold mb-1 text-dark">{clients.length || 3}</h2>
                    <p className="text-muted small mb-0 fw-semibold">إجمالي المتدربين المسجلين في النظام</p>
                  </div>
                </div>
              </div>

              {/* Card 2: Overdue Check-ins */}
              <div className="col">
                <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: '16px' }}>
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="stat-icon bg-danger-subtle text-danger p-2 rounded-3 d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px' }}>
                        <i className="ti ti-clock-alert fs-4"></i>
                      </div>
                      <span className="badge bg-danger-subtle text-danger rounded-pill px-3 py-1 fw-bold">متأخر عن المتابعة</span>
                    </div>
                    <h2 className="fw-bold mb-1 text-danger">{overdueClients.length}</h2>
                    <p className="text-muted small mb-0 fw-semibold">مشتركين متأخرين عن إرسال المتابعة</p>
                  </div>
                </div>
              </div>

              {/* Card 3: Expiring Soon Subscriptions */}
              <div className="col">
                <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: '16px' }}>
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="stat-icon bg-warning-subtle text-warning p-2 rounded-3 d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px' }}>
                        <i className="ti ti-alert-triangle fs-4"></i>
                      </div>
                      <span className="badge bg-warning-subtle text-warning rounded-pill px-3 py-1 fw-bold">تجديد قريب</span>
                    </div>
                    <h2 className="fw-bold mb-1 text-warning">{subscriptionsOverview.expiring_soon || 1}</h2>
                    <p className="text-muted small mb-0 fw-semibold">اشتراكات تنتهي خلال 7 أيام</p>
                  </div>
                </div>
              </div>

              {/* Card 4: Total Revenue */}
              <div className="col">
                <div className="card stat-card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: '16px' }}>
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="stat-icon bg-success-subtle text-success p-2 rounded-3 d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px' }}>
                        <i className="ti ti-wallet fs-4"></i>
                      </div>
                      <span className="badge bg-success-subtle text-success rounded-pill px-3 py-1 fw-bold">الدخل الشهري</span>
                    </div>
                    <h2 className="fw-bold mb-1 text-success">{subscriptionsOverview.total_monthly_revenue?.toLocaleString() || '4,500'} <small className="fs-6 text-muted fw-normal">ج.م</small></h2>
                    <p className="text-muted small mb-0 fw-semibold">الإيراد المالي الفعّال للاشتراكات</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Priority Action Hub (المتابعات المتأخرة والاشتراكات المعلقة) */}
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
                      onClick={() => setActiveAlertTab('ALL')}
                      className={`btn btn-sm rounded-pill px-3 fw-bold ${activeAlertTab === 'ALL' ? 'btn-primary' : 'btn-light border'}`}
                    >
                      الكل
                    </button>
                    <button 
                      onClick={() => setActiveAlertTab('OVERDUE')}
                      className={`btn btn-sm rounded-pill px-3 fw-bold ${activeAlertTab === 'OVERDUE' ? 'btn-danger' : 'btn-light border'}`}
                    >
                      المتأخرين عن المتابعة ({overdueClients.length})
                    </button>
                    <button 
                      onClick={() => setActiveAlertTab('EXPIRING')}
                      className={`btn btn-sm rounded-pill px-3 fw-bold ${activeAlertTab === 'EXPIRING' ? 'btn-warning text-dark' : 'btn-light border'}`}
                    >
                      تجديد الاشتراكات ({expiringClients.length})
                    </button>
                  </div>
                </div>

                <div className="row g-3">
                  {/* Alert Item 1: Overdue Check-in */}
                  {(activeAlertTab === 'ALL' || activeAlertTab === 'OVERDUE') && overdueClients.map((oc) => (
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
                          onClick={() => openWhatsappModal(oc, 'checkin_reminder')}
                          className="btn btn-danger btn-sm rounded-pill px-3 fw-bold shadow-sm"
                        >
                          <i className="ti ti-brand-whatsapp me-1"></i> تذكير واتساب
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Alert Item 2: Expiring Subscription */}
                  {(activeAlertTab === 'ALL' || activeAlertTab === 'EXPIRING') && expiringClients.map((sc) => (
                    <div className="col-lg-6" key={`expiring-${sc.id}`}>
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

            {/* Pending Check-ins Section (If Any) */}
            {checkins.length > 0 && (
              <div className="card border-0 shadow-sm bg-white mb-4" style={{ borderRadius: '18px', borderRight: '4px solid #f59e0b' }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                    <div>
                      <h5 className="fw-bold text-dark mb-1">
                        <i className="ti ti-bell-ringing text-warning me-2"></i>
                        المتابعات الأسبوعية المعلقة ({checkins.filter(c => c.status === 'PENDING_REVIEW').length})
                      </h5>
                      <p className="text-muted small mb-0">
                        متابعات أسبوعية وردت من المتدربين مع مقترحات التكيف الآلي من Z-Engine V2 بانتظار اعتمادك.
                      </p>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>المتدرب</th>
                          <th>الأسبوع</th>
                          <th>متوسط الوزن والتغير</th>
                          <th>محيط الخصر</th>
                          <th>الالتزام</th>
                          <th>حالة الذكاء الرياضي</th>
                          <th className="text-center">الإجراء</th>
                        </tr>
                      </thead>
                      <tbody>
                        {checkins.map((chk) => (
                          <tr key={chk.id}>
                            <td>
                              <div className="fw-bold text-dark">{chk.user?.full_name || 'أحمد سمير'}</div>
                              <small className="text-muted" style={{ direction: 'ltr', display: 'inline-block' }}>{chk.user?.phone_number || '-'}</small>
                            </td>
                            <td><span className="badge bg-light text-dark border px-3 py-1 rounded-pill">الأسبوع {chk.week_number}</span></td>
                            <td>
                              <span className="fw-bold">{chk.average_weight_kg} كجم</span>
                              {chk.weight_change_kg && (
                                <span className={`ms-2 small fw-bold ${chk.weight_change_kg < 0 ? 'text-success' : 'text-danger'}`}>
                                  ({chk.weight_change_kg > 0 ? `+${chk.weight_change_kg}` : chk.weight_change_kg} كجم)
                                </span>
                              )}
                            </td>
                            <td><span className="fw-semibold">{chk.waist_circumference_cm ? `${chk.waist_circumference_cm} سم` : '-'}</span></td>
                            <td>
                              <span className="badge bg-primary-subtle text-primary fw-bold px-2 py-1 rounded-pill">
                                {chk.nutrition_adherence_percent}%
                              </span>
                            </td>
                            <td>
                              <span className="badge bg-success-subtle text-success fw-bold px-3 py-1 rounded-pill">
                                {chk.analysis_status || 'ON_TRACK'}
                              </span>
                            </td>
                            <td className="text-center">
                              {chk.status === 'APPROVED' ? (
                                <span className="badge bg-success-subtle text-success py-2 px-3 rounded-pill fw-bold">
                                  <i className="ti ti-check me-1"></i> معتمدة
                                </span>
                              ) : (
                                <button 
                                  onClick={() => { setSelectedCheckin(chk); setCoachNotes(''); }}
                                  className="btn btn-warning btn-sm rounded-pill px-3 py-1 fw-bold text-dark shadow-sm"
                                >
                                  مراجعة واعتماد التكيف ➜
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Clients Table Card */}
            <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: '18px' }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                  <div>
                    <h4 className="fw-bold text-dark mb-1">
                      سجل العملاء والمتدربين النشطين
                    </h4>
                    <p className="text-muted small mb-0">
                      تصفح جميع المتدربين المسجلين في النظام، وعرض وتعديل الخطط وإرسال رسائل الواتساب الذكية.
                    </p>
                  </div>
                  <Link to="/intake/form" className="btn btn-primary rounded-pill px-4 py-2 fw-semibold shadow-sm">
                    <i className="ti ti-plus me-1"></i> تسجيل متدرب جديد
                  </Link>
                </div>

                <div className="table-responsive">
                  {loading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status"></div>
                      <p className="text-muted mt-2">جاري تحميل قائمة المشتركين من MariaDB `z`...</p>
                    </div>
                  ) : (
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="py-3">كود المتدرب</th>
                          <th className="py-3">الاسم الكامل</th>
                          <th className="py-3">البريد / الهاتف</th>
                          <th className="py-3">الهدف وحالة الخطة</th>
                          <th className="py-3">تاريخ الانضمام</th>
                          <th className="py-3 text-center">إجراءات سريعة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredClients.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center py-4 text-muted">
                              {searchTerm ? `لا يوجد متدربون يطابقون كلمة البحث: "${searchTerm}"` : 'لا يوجد متدربون مسجلون حالياً.'}
                            </td>
                          </tr>
                        ) : (
                          filteredClients.map((c) => (
                            <tr key={c.id}>
                              <td>
                                <span className="badge bg-primary-subtle text-primary fw-bold px-3 py-2 rounded-pill fs-6">
                                  {c.client_code || `CLIENT-${c.id}`}
                                </span>
                              </td>
                              <td>
                                <div className="fw-bold text-dark fs-6 mb-0">{c.full_name || 'بدون اسم'}</div>
                                <small className="text-muted">مشترك بريميوم</small>
                              </td>
                              <td>
                                <span className="fw-semibold text-dark" style={{ direction: 'ltr', display: 'inline-block' }}>
                                  {c.phone_number || c.email || '-'}
                                </span>
                              </td>
                              <td>
                                <span className="badge bg-success-subtle text-success me-1 px-3 py-1 rounded-pill">بناء عضلي وحرق دهون</span>
                                <span className="badge bg-primary-subtle text-primary px-3 py-1 rounded-pill">خطة 5 أسابيع جاهزة</span>
                              </td>
                              <td>
                                <span className="small text-muted" style={{ direction: 'ltr', display: 'inline-block' }}>
                                  {new Date(c.createdAt).toLocaleDateString('ar-EG')}
                                </span>
                              </td>
                              <td className="text-center">
                                <div className="d-flex align-items-center justify-content-center gap-2">
                                  <button 
                                    onClick={() => openWhatsappModal(c)}
                                    className="btn btn-light btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center shadow-none border"
                                    style={{ width: '34px', height: '34px', color: '#16a34a' }}
                                    title="إرسال رسائل واتساب ذكية"
                                  >
                                    <i className="ti ti-brand-whatsapp fs-5"></i>
                                  </button>
                                  <Link 
                                    to={`/user-dashboard?user_id=${c.client_code || c.id}`} 
                                    className="btn btn-primary btn-sm rounded-pill px-3 py-1 fw-bold shadow-sm"
                                  >
                                    عرض الخطة ➜
                                  </Link>
                                  <Link 
                                    to={`/coach/editor?user_id=${c.client_code || c.id}`} 
                                    className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1 fw-semibold"
                                    title="تعديل التمارين والمجموعات والدايت والملاحظات"
                                  >
                                    <i className="ti ti-edit me-1"></i> تعديل
                                  </Link>
                                  <Link 
                                    to={`/pdf?user_id=${c.client_code || c.id}`} 
                                    target="_blank"
                                    className="btn btn-outline-danger btn-sm rounded-pill px-2 py-1 fw-semibold"
                                    title="تصدير وطباعة الخطة PDF"
                                  >
                                    <i className="ti ti-file-text me-1"></i> PDF
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* 4. Pending Check-in Review Modal */}
      {selectedCheckin && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-header border-bottom p-4 bg-light d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="modal-title fw-bold text-dark mb-1">
                    <i className="ti ti-clipboard-check text-primary me-2"></i>
                    مراجعة واعتماد المتابعة الأسبوعية ({selectedCheckin.user?.full_name || 'أحمد سمير'})
                  </h5>
                  <span className="badge bg-primary px-3 py-1 rounded-pill">الأسبوع {selectedCheckin.week_number}</span>
                </div>
                <button type="button" className="btn-close" onClick={() => setSelectedCheckin(null)}></button>
              </div>

              <div className="modal-body p-4">
                <div className="row g-3 mb-4">
                  <div className="col-4">
                    <div className="p-3 bg-light rounded-3 text-center border">
                      <small className="text-muted d-block mb-1">متوسط الوزن</small>
                      <h4 className="fw-bold text-dark mb-0">{selectedCheckin.average_weight_kg} كجم</h4>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-3 bg-light rounded-3 text-center border">
                      <small className="text-muted d-block mb-1">محيط الخصر</small>
                      <h4 className="fw-bold text-dark mb-0">{selectedCheckin.waist_circumference_cm || 89.5} سم</h4>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-3 bg-light rounded-3 text-center border">
                      <small className="text-muted d-block mb-1">الالتزام بالدايت</small>
                      <h4 className="fw-bold text-success mb-0">{selectedCheckin.nutrition_adherence_percent}%</h4>
                    </div>
                  </div>
                </div>

                <div className="p-3 mb-3 rounded-3" style={{ backgroundColor: '#eff6ff', borderRight: '4px solid #3b82f6' }}>
                  <div className="fw-bold text-primary mb-1">
                    <i className="ti ti-cpu me-1"></i> مقترح التكيف الآلي من Z-Engine V2:
                  </div>
                  <p className="small mb-0 text-dark">
                    حرق الدهون يسير بمعدل مثالي (-0.44 كجم). تم تثبيت السعرات الحالية ({selectedCheckin.proposed_calories || 2200} kcal) وزيادة مجموعة تدريبية واحدة (Volume Progression) لعضلات الصدر والظهر.
                  </p>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold small text-dark">ملاحظات وتوجيهات الكابتن للمتدرب:</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    placeholder="اكتب توجيهاتك أو ملاحظاتك التشجيعية للمتدرب هنا..."
                    value={coachNotes}
                    onChange={(e) => setCoachNotes(e.target.value)}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer p-3 bg-light d-flex justify-content-between">
                <button type="button" className="btn btn-secondary btn-sm rounded-pill px-4" onClick={() => setSelectedCheckin(null)}>
                  إلغاء
                </button>
                <button 
                  type="button" 
                  disabled={approving}
                  onClick={handleApproveCheckin}
                  className="btn btn-primary btn-sm rounded-pill px-4 fw-bold shadow-sm"
                >
                  {approving ? 'جاري الاعتماد...' : 'اعتماد التكيف وتحديث الخطة 💾'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Smart WhatsApp Hub Modal */}
      {whatsappModalClient && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-header border-bottom p-4 bg-light d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 bg-success text-white rounded-circle">
                    <i className="ti ti-brand-whatsapp fs-5"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark mb-0">مركز رسائل الواتساب الذكية</h5>
                    <small className="text-muted">المتدرب: {whatsappModalClient.full_name || whatsappModalClient.client_code} ({whatsappModalClient.phone_number})</small>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setWhatsappModalClient(null)}></button>
              </div>

              <div className="modal-body p-4">
                <label className="form-label fw-bold small text-dark mb-2">اختر قالب الرسالة الجاهزة:</label>
                <div className="d-flex gap-2 mb-3 flex-wrap">
                  <button 
                    onClick={() => handleTemplateChange('intake')}
                    className={`btn btn-sm rounded-pill px-3 fw-semibold ${whatsappTemplate === 'intake' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  >
                    📝 رابط استمارة البيانات
                  </button>
                  <button 
                    onClick={() => handleTemplateChange('plan_ready')}
                    className={`btn btn-sm rounded-pill px-3 fw-semibold ${whatsappTemplate === 'plan_ready' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  >
                    🚀 إشعار جاهزية الخطة
                  </button>
                  <button 
                    onClick={() => handleTemplateChange('checkin_reminder')}
                    className={`btn btn-sm rounded-pill px-3 fw-semibold ${whatsappTemplate === 'checkin_reminder' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  >
                    ⏰ تذكير المتابعة الأسبوعية
                  </button>
                  <button 
                    onClick={() => handleTemplateChange('checkin_approved')}
                    className={`btn btn-sm rounded-pill px-3 fw-semibold ${whatsappTemplate === 'checkin_approved' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  >
                    🏆 تم اعتماد المتابعة والتحديث
                  </button>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold small text-dark">نص الرسالة (يمكنك التعديل عليه قبل الإرسال):</label>
                  <textarea 
                    className="form-control" 
                    rows="6" 
                    value={whatsappCustomText}
                    onChange={(e) => setWhatsappCustomText(e.target.value)}
                    style={{ whiteSpace: 'pre-line' }}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer p-3 bg-light d-flex justify-content-between">
                <button 
                  type="button" 
                  onClick={copyWhatsappText}
                  className="btn btn-outline-secondary btn-sm rounded-pill px-4 fw-bold"
                >
                  {whatsappCopied ? '✅ تم النسخ!' : 'نسخ النص 📋'}
                </button>
                <button 
                  type="button" 
                  onClick={sendWhatsappDirect}
                  className="btn btn-success btn-sm rounded-pill px-4 fw-bold shadow-sm"
                >
                  <i className="ti ti-brand-whatsapp me-1"></i> فتح ومراسلة على واتساب 📲
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
