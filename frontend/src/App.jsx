import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
// Global Modal Escape Key Listener Component
function GlobalModalEscapeHandler() {
  React.useEffect(() => {
    const handleGlobalEscape = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        const openModals = document.querySelectorAll(
          '.dialog-shell, .dialog-overlay, .modal.show, [role="dialog"], [aria-modal="true"], .fixed[style*="z-index"], .modal[style*="display: block"]'
        );
        if (openModals.length > 0) {
          const topModal = openModals[openModals.length - 1];
          const closeBtn = topModal.querySelector(
            'button[aria-label*="close" i], button[aria-label*="Close" i], button.dialog-close-button, button.btn-close, [data-dismiss="modal"], button svg.lucide-x, button:has(svg.lucide-x)'
          );
          if (closeBtn) {
            const actualButton = closeBtn.tagName === 'BUTTON' ? closeBtn : closeBtn.closest('button');
            if (actualButton) {
              actualButton.click();
              e.preventDefault();
              e.stopPropagation();
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalEscape, { capture: true });
    return () => window.removeEventListener('keydown', handleGlobalEscape, { capture: true });
  }, []);

  return null;
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Cairo, sans-serif' }}>
          <h2 style={{ color: '#E11D48', fontWeight: 800 }}>عذراً، حدث خطأ غير متوقع أثناء تحميل الصفحة</h2>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '10px' }}>
            {this.state.error?.message || 'خطأ في معالجة البيانات، يرجى إعادة المحاولة'}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '20px',
              padding: '10px 24px',
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Client-facing pages stay in the main bundle so they open instantly (and keep working on flaky gym connections).
import ClientInteractiveApp from './pages/ClientInteractiveApp';
import ClientLogin from './pages/ClientLogin';
import FullIntakeForm from './pages/FullIntakeForm';
import WeeklyCheckinForm from './pages/WeeklyCheckinForm';

// Coach/admin and secondary pages are code-split and loaded on first visit.
const CoachCommandCenter = React.lazy(() => import('./pages/CoachCommandCenter'));
const PublicPricingJoin = React.lazy(() => import('./pages/PublicPricingJoin'));
const ClientOnlineRenewal = React.lazy(() => import('./pages/ClientOnlineRenewal'));
const Customers = React.lazy(() => import('./pages/Customers'));
const ExerciseLibrary = React.lazy(() => import('./pages/ExerciseLibrary'));
const MacroCalculator = React.lazy(() => import('./pages/MacroCalculator'));
const MasterSettingsHub = React.lazy(() => import('./pages/MasterSettingsHub'));
const IntakeSubmissions = React.lazy(() => import('./pages/IntakeSubmissions'));
const CoachEditor = React.lazy(() => import('./pages/CoachEditor'));
const ProgramPdfView = React.lazy(() => import('./pages/ProgramPdfView'));
const MesocycleDebriefPdfView = React.lazy(() => import('./pages/MesocycleDebriefPdfView'));
const FinancialsRenewalsDashboard = React.lazy(() => import('./pages/FinancialsRenewalsDashboard'));
const WhatsAppRemindersHub = React.lazy(() => import('./pages/WhatsAppRemindersHub'));
const CheckinReviewDashboard = React.lazy(() => import('./pages/CheckinReviewDashboard'));
const ClientTimelineProfile = React.lazy(() => import('./pages/ClientTimelineProfile'));
const MobilityLibrary = React.lazy(() => import('./pages/MobilityLibrary'));

function RouteLoadingFallback() {
  return (
    <div dir="rtl" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cairo, sans-serif', color: '#64748B', fontSize: '14px', fontWeight: 700 }}>
      جاري تحميل الصفحة...
    </div>
  );
}

/**
 * Sends an old link to its real page and keeps what it carries (?code=...), so a client opening a
 * renewal or check-in link from an older message still lands on the right screen, already identified.
 */
function RedirectKeepingQuery({ to }) {
  const { search } = useLocation();
  return <Navigate to={`${to}${search}`} replace />;
}

function RootRouteHandler() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch {}

  if (!token && !user) {
    return <ClientLogin />;
  }

  const isCoach = user?.role === 'ADMIN' || user?.role === 'COACH' || Boolean(localStorage.getItem('z_coach_user'));
  if (isCoach) {
    return <CoachCommandCenter />;
  }
  return <Navigate to="/client/today" replace />;
}

/**
 * Route protection guard enforcing login on all application surfaces (S4-3, Option B)
 */
function RequireAuth({ children, allowedRoles }) {
  const location = useLocation();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch {}

  if (!token && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && user?.role) {
    if (!allowedRoles.includes(user.role)) {
      if (user.role === 'CLIENT') {
        return <Navigate to="/client/today" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <GlobalModalEscapeHandler />
      <Router>
        <ErrorBoundary>
        <React.Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          {/* Coach Primary Command Center / Mobile Simulator */}
          <Route path="/" element={<RootRouteHandler />} />
          <Route path="/today" element={<Navigate to="/" replace />} />
          <Route path="/coach/today" element={<Navigate to="/" replace />} />
          <Route path="/index" element={<Navigate to="/" replace />} />
          <Route path="/index.html" element={<Navigate to="/" replace />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />

          {/* Client Unified Interactive Hub */}
          <Route path="/client/today" element={<RequireAuth><ClientInteractiveApp /></RequireAuth>} />
          <Route path="/client/meals" element={<Navigate to="/client/today?tab=meals" replace />} />
          <Route path="/client/workout" element={<Navigate to="/client/today?tab=workout" replace />} />
          <Route path="/client/grocery" element={<Navigate to="/client/today" replace />} />
          <Route path="/client-app" element={<RedirectKeepingQuery to="/client/today" />} />
          <Route path="/mobile" element={<RedirectKeepingQuery to="/client/today" />} />
          <Route path="/program" element={<RedirectKeepingQuery to="/client/today" />} />
          <Route path="/user-dashboard" element={<RedirectKeepingQuery to="/client/today" />} />
          <Route path="/user-dashboard.html" element={<Navigate to="/client/today" replace />} />

          {/* Client Onboarding, Pricing, Renewal & Check-in */}
          <Route path="/join" element={<PublicPricingJoin />} />
          <Route path="/pricing" element={<RedirectKeepingQuery to="/join" />} />
          <Route path="/renew" element={<RequireAuth><ClientOnlineRenewal /></RequireAuth>} />
          <Route path="/client/renew" element={<RedirectKeepingQuery to="/renew" />} />
          <Route path="/onboarding" element={<Navigate to="/intake/form" replace />} />
          <Route path="/onboarding/multi" element={<Navigate to="/intake/form" replace />} />
          <Route path="/onboarding/classic" element={<Navigate to="/intake/form" replace />} />
          <Route path="/intake" element={<ClientLogin />} />
          <Route path="/client/login" element={<RedirectKeepingQuery to="/login" />} />
          <Route path="/login" element={<ClientLogin />} />
          <Route path="/intake/form" element={<RequireAuth><FullIntakeForm /></RequireAuth>} />
          <Route path="/intake/submissions" element={<RequireAuth allowedRoles={['ADMIN', 'COACH']}><IntakeSubmissions /></RequireAuth>} />
          <Route path="/check-in" element={<RequireAuth><WeeklyCheckinForm /></RequireAuth>} />
          <Route path="/client/check-in" element={<RedirectKeepingQuery to="/check-in" />} />
          <Route path="/progress" element={<Navigate to="/coach/checkin-review" replace />} />
          <Route path="/progress.html" element={<Navigate to="/coach/checkin-review" replace />} />
          <Route path="/check-ins" element={<Navigate to="/coach/checkin-review" replace />} />

          {/* Coach Management Tools */}
          <Route path="/customers" element={<RequireAuth allowedRoles={['ADMIN', 'COACH']}><Customers /></RequireAuth>} />
          <Route path="/exercises" element={<RequireAuth allowedRoles={['ADMIN', 'COACH']}><ExerciseLibrary /></RequireAuth>} />
          <Route path="/calculator" element={<RequireAuth allowedRoles={['ADMIN', 'COACH']}><MacroCalculator /></RequireAuth>} />
          <Route path="/mobility" element={<Navigate to="/coach/mobility" replace />} />
          <Route path="/coach/mobility" element={<RequireAuth allowedRoles={['ADMIN', 'COACH']}><MobilityLibrary /></RequireAuth>} />
          <Route path="/subscriptions" element={<Navigate to="/coach/financials" replace />} />
          <Route path="/master-settings" element={<RequireAuth allowedRoles={['ADMIN', 'COACH']}><MasterSettingsHub /></RequireAuth>} />
          <Route path="/settings" element={<Navigate to="/master-settings" replace />} />
          <Route path="/coach/editor" element={<RequireAuth allowedRoles={['ADMIN', 'COACH']}><CoachEditor /></RequireAuth>} />
          <Route path="/coach/editor/:userId" element={<RequireAuth allowedRoles={['ADMIN', 'COACH']}><CoachEditor /></RequireAuth>} />
          <Route path="/coach/analytics" element={<Navigate to="/coach/financials" replace />} />
          <Route path="/coach/checkin-review" element={<RequireAuth allowedRoles={['ADMIN', 'COACH']}><CheckinReviewDashboard /></RequireAuth>} />
          <Route path="/checkins/review" element={<Navigate to="/coach/checkin-review" replace />} />
          <Route path="/checkin/review" element={<Navigate to="/coach/checkin-review" replace />} />
          <Route path="/coach/checkin" element={<Navigate to="/coach/checkin-review" replace />} />
          <Route path="/coach/checkins" element={<Navigate to="/coach/checkin-review" replace />} />
          <Route path="/coach/financials" element={<RequireAuth allowedRoles={['ADMIN', 'COACH']}><FinancialsRenewalsDashboard /></RequireAuth>} />
          <Route path="/financials" element={<Navigate to="/coach/financials" replace />} />
          <Route path="/coach/reminders" element={<RequireAuth allowedRoles={['ADMIN', 'COACH']}><WhatsAppRemindersHub /></RequireAuth>} />
          <Route path="/reminders" element={<Navigate to="/coach/reminders" replace />} />
          <Route path="/customers/:id" element={<RequireAuth allowedRoles={['ADMIN', 'COACH']}><ClientTimelineProfile /></RequireAuth>} />
          <Route path="/profile" element={<Navigate to="/master-settings" replace />} />
          <Route path="/pdf" element={<RequireAuth><ProgramPdfView /></RequireAuth>} />
          <Route path="/program-pdf" element={<RedirectKeepingQuery to="/pdf" />} />
          <Route path="/coach/mesocycle-debrief/:clientId" element={<RequireAuth allowedRoles={['ADMIN', 'COACH']}><MesocycleDebriefPdfView /></RequireAuth>} />
          <Route path="/coach/mesocycle-debrief" element={<RequireAuth allowedRoles={['ADMIN', 'COACH']}><MesocycleDebriefPdfView /></RequireAuth>} />
          <Route path="/mesocycle-debrief" element={<RedirectKeepingQuery to="/coach/mesocycle-debrief" />} />
          <Route path="/test-engine" element={<Navigate to="/" replace />} />

          {/* Catch-all fallback */}
          {/* Links already sent to clients before the paths were fixed (they keep their ?code=).
              RedirectKeepingQuery is defined below this component. */}
          <Route path="/app" element={<RedirectKeepingQuery to="/client/today" />} />
          <Route path="/app/checkin" element={<RedirectKeepingQuery to="/check-in" />} />
          <Route path="/app/renew" element={<RedirectKeepingQuery to="/renew" />} />
          <Route path="/checkin" element={<RedirectKeepingQuery to="/check-in" />} />
          <Route path="/renewal" element={<RedirectKeepingQuery to="/renew" />} />
          <Route path="/client" element={<RedirectKeepingQuery to="/client/today" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </React.Suspense>
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
}

export default App;
