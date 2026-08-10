import React, { useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { logout, user } = useAuth();
  
  const isRtl = i18n.language === 'ar';

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [isRtl, i18n.language]);

  useEffect(() => {
    let isMounted = true;
    
    const loadScript = (src, id) => {
      return new Promise((resolve, reject) => {
        const existing = document.getElementById(id);
        if (existing) {
          resolve();
          return;
        }
        
        const script = document.createElement('script');
        script.id = id;
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    const initScripts = async () => {
      if (!isMounted) return;
      try {
        await loadScript('/assets/libs/bootstrap/js/bootstrap.bundle.min.js', 'bootstrap-js');
        await loadScript('/assets/libs/simplebar/simplebar.min.js', 'simplebar-js');
        
        setTimeout(async () => {
          if (!isMounted) return;
          await loadScript('/assets/js/app.js', 'app-js');
        }, 150);
      } catch (err) {
        console.error('Error loading layout scripts', err);
      }
    };

    initScripts();

    return () => {
      isMounted = false;
    };
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('appLanguage', lng);
  };

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/login');
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'}>
      {isRtl && (
        <style>
          {`
            .startbar { right: 0 !important; left: auto !important; border-left: 1px solid var(--bs-border-color) !important; border-right: none !important; }
            .page-content { margin-right: var(--bs-startbar-width) !important; margin-left: 0 !important; }
            .topbar { left: 0 !important; right: auto !important; margin-right: auto !important; margin-left: 0 !important; }
            .menu-icon { margin-left: 10px !important; margin-right: 0 !important; }
            .nav-item .nav-link { padding-right: 15px !important; padding-left: 15px !important; justify-content: flex-start !important; }
            .navbar-nav .nav-link span { text-align: right !important; }
            .text-end { text-align: left !important; }
            .ms-auto { margin-right: auto !important; margin-left: 0 !important; }
            .me-2 { margin-left: 0.5rem !important; margin-right: 0 !important; }
            .me-3 { margin-left: 1rem !important; margin-right: 0 !important; }
            .card-title, .card-header h4 { text-align: right !important; display: block; width: 100%; }
            .border-dashed { border-style: dashed !important; }
            .form-label { text-align: right !important; display: block; }
            .form-control, .form-select { text-align: right !important; }
            .form-select { background-position: left 0.75rem center !important; padding-right: 0.75rem !important; padding-left: 2.25rem !important; }
            .list-group-item { text-align: right !important; }
            .alert { text-align: right !important; }
            @media (max-width: 1024px) {
                .page-content { margin-right: 0 !important; }
                .topbar { right: 0 !important; }
            }
          `}
        </style>
      )}
      <div className="topbar d-print-none">
        <div className="container-xxl">
            <nav className="topbar-custom d-flex justify-content-between" id="topbar-custom">    
                <ul className="topbar-item list-unstyled d-inline-flex align-items-center mb-0">                        
                    <li>
                        <button className="nav-link mobile-menu-btn nav-icon" id="togglemenu">
                            <i className="iconoir-menu-scale"></i>
                        </button>
                    </li> 
                    <li className="mx-3 welcome-text">
                        <h3 className="mb-0 fw-bold text-truncate">{t('app_name')}</h3>
                    </li>                   
                </ul>
                <ul className="topbar-item list-unstyled d-inline-flex align-items-center mb-0">
                    <li className="hide-phone app-search">
                        <form role="search" action="#" method="get">
                            <input type="search" name="search" className="form-control top-search mb-0" placeholder="Search here..." />
                            <button type="submit"><i className="iconoir-search"></i></button>
                        </form>
                    </li>     
                    <li className="dropdown">
                        <a className="nav-link dropdown-toggle arrow-none nav-icon" data-bs-toggle="dropdown" href="#" role="button" aria-haspopup="false" aria-expanded="false">
                          <i className="iconoir-language" style={{fontSize: '24px'}}></i>
                        </a>
                        <div className="dropdown-menu">
                            <button className="dropdown-item" onClick={() => changeLanguage('en')}>English</button>
                            <button className="dropdown-item" onClick={() => changeLanguage('ar')}>العربية</button>
                        </div>
                    </li>
                    <li className="topbar-item">
                        <a className="nav-link nav-icon" href="#" id="light-dark-mode">
                            <i className="icofont-moon dark-mode"></i>
                            <i className="icofont-sun light-mode"></i>
                        </a>                    
                    </li>
                    <li className="dropdown topbar-item">
                        <a className="nav-link dropdown-toggle arrow-none nav-icon" data-bs-toggle="dropdown" href="#" role="button" aria-haspopup="false" aria-expanded="false">
                            <img src="/assets/images/users/avatar-1.jpg" alt="" className="thumb-lg rounded-circle" />
                        </a>
                        <div className="dropdown-menu dropdown-menu-end py-0">
                            <div className="d-flex align-items-center dropdown-item py-2 bg-secondary-subtle">
                                <div className="flex-shrink-0">
                                    <img src="/assets/images/users/avatar-1.jpg" alt="" className="thumb-md rounded-circle" />
                                </div>
                                <div className="flex-grow-1 ms-2 text-truncate align-self-center">
                                    <h6 className="my-0 fw-medium text-dark fs-13">Coach</h6>
                                    <small className="text-muted mb-0">Admin</small>
                                </div>
                            </div>
                            <div className="dropdown-divider mb-0"></div>
                            <button className="dropdown-item text-danger" onClick={handleLogout}><i className="las la-power-off fs-18 me-1 align-text-bottom"></i> {t('logout')}</button>
                        </div>
                    </li>
                </ul>
            </nav>
        </div>
      </div>
      
      <div className="startbar d-print-none">
        <div className="brand">
            <Link to="/" className="logo">
                <span style={{fontSize: '22px', fontWeight: 'bold', color: 'var(--bs-primary)', letterSpacing: '1px'}}>
                    {t('app_name')}
                </span>
            </Link>
        </div>
        <div className="startbar-menu">
            <div className="startbar-collapse" id="startbarCollapse" data-simplebar="">
                <div className="d-flex align-items-start flex-column w-100">
                    <ul className="navbar-nav mb-auto w-100">
                        <li className="menu-label pt-0 mt-0">
                            <span>{t('app_name')}</span>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/">
                                <i className="iconoir-home-simple menu-icon"></i>
                                <span>{t('dashboard')}</span>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/profile">
                                <i className="iconoir-profile-circle menu-icon"></i>
                                <span>{t('client_profile')}</span>
                            </Link>
                        </li>
                        {user?.role === 'ADMIN' && (
                          <li className="nav-item">
                              <Link className="nav-link" to="/admin/clients">
                                  <i className="iconoir-group menu-icon"></i>
                                  <span>العملاء والطلبات</span>
                              </Link>
                          </li>
                        )}
                        <li className="nav-item">
                            <Link className="nav-link" to="/intake">
                                <i className="iconoir-journal-page menu-icon"></i>
                                <span>{t('intake_wizard')}</span>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/schedule">
                                <i className="iconoir-calendar menu-icon"></i>
                                <span>{t('training_schedule')}</span>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/nutrition">
                                <i className="iconoir-apple-half menu-icon"></i>
                                <span>{t('nutrition_plan')}</span>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/catalogs">
                                <i className="iconoir-table-rows menu-icon"></i>
                                <span>{t('data_catalogs')}</span>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/logs">
                                <i className="iconoir-activity menu-icon"></i>
                                <span>{t('pipeline_logs')}</span>
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </div>    
      </div>

      <div className="page-wrapper">
        <div className="page-content">
          <div className="container-xxl mt-4">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
