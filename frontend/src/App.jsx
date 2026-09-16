import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

// Primary Core Cockpits
import CoachCommandCenter from './pages/CoachCommandCenter';
import ClientInteractiveApp from './pages/ClientInteractiveApp';

// Essential Feature Pages
import PublicPricingJoin from './pages/PublicPricingJoin';
import ClientOnlineRenewal from './pages/ClientOnlineRenewal';
import Customers from './pages/Customers';
import ExerciseLibrary from './pages/ExerciseLibrary';
import MacroCalculator from './pages/MacroCalculator';
import MasterSettingsHub from './pages/MasterSettingsHub';
import IntakeSubmissions from './pages/IntakeSubmissions';
import FullIntakeForm from './pages/FullIntakeForm';
import ClientLogin from './pages/ClientLogin';
import CoachEditor from './pages/CoachEditor';
import ProgramPdfView from './pages/ProgramPdfView';
import MesocycleDebriefPdfView from './pages/MesocycleDebriefPdfView';
import WeeklyCheckinForm from './pages/WeeklyCheckinForm';
import FinancialsRenewalsDashboard from './pages/FinancialsRenewalsDashboard';
import WhatsAppRemindersHub from './pages/WhatsAppRemindersHub';
import CheckinReviewDashboard from './pages/CheckinReviewDashboard';
import ClientTimelineProfile from './pages/ClientTimelineProfile';
import MobilityLibrary from './pages/MobilityLibrary';

function App() {
  return (
    <AuthProvider>
      <GlobalModalEscapeHandler />
      <Router>
        <ErrorBoundary>
        <Routes>
          {/* Coach Primary Command Center */}
          <Route path="/" element={<CoachCommandCenter />} />
          <Route path="/today" element={<CoachCommandCenter />} />
          <Route path="/coach/today" element={<CoachCommandCenter />} />
          <Route path="/index" element={<Navigate to="/" replace />} />
          <Route path="/index.html" element={<Navigate to="/" replace />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />

          {/* Client Unified Interactive Hub */}
          <Route path="/client/today" element={<ClientInteractiveApp />} />
          <Route path="/client/meals" element={<ClientInteractiveApp />} />
          <Route path="/client/workout" element={<ClientInteractiveApp />} />
          <Route path="/client/grocery" element={<Navigate to="/client/today" replace />} />
          <Route path="/client-app" element={<ClientInteractiveApp />} />
          <Route path="/mobile" element={<ClientInteractiveApp />} />
          <Route path="/program" element={<ClientInteractiveApp />} />
          <Route path="/user-dashboard" element={<ClientInteractiveApp />} />
          <Route path="/user-dashboard.html" element={<Navigate to="/client/today" replace />} />

          {/* Client Onboarding, Pricing, Renewal & Check-in */}
          <Route path="/join" element={<PublicPricingJoin />} />
          <Route path="/pricing" element={<PublicPricingJoin />} />
          <Route path="/renew" element={<ClientOnlineRenewal />} />
          <Route path="/client/renew" element={<ClientOnlineRenewal />} />
          <Route path="/onboarding" element={<Navigate to="/intake/form" replace />} />
          <Route path="/onboarding/multi" element={<Navigate to="/intake/form" replace />} />
          <Route path="/onboarding/classic" element={<Navigate to="/intake/form" replace />} />
          <Route path="/intake" element={<ClientLogin />} />
          <Route path="/client/login" element={<ClientLogin />} />
          <Route path="/login" element={<ClientLogin />} />
          <Route path="/intake/form" element={<FullIntakeForm />} />
          <Route path="/intake/submissions" element={<IntakeSubmissions />} />
          <Route path="/check-in" element={<WeeklyCheckinForm />} />
          <Route path="/client/check-in" element={<WeeklyCheckinForm />} />
          <Route path="/progress" element={<Navigate to="/coach/checkin-review" replace />} />
          <Route path="/progress.html" element={<Navigate to="/coach/checkin-review" replace />} />
          <Route path="/check-ins" element={<Navigate to="/coach/checkin-review" replace />} />

          {/* Coach Management Tools */}
          <Route path="/customers" element={<Customers />} />
          <Route path="/exercises" element={<ExerciseLibrary />} />
          <Route path="/calculator" element={<MacroCalculator />} />
          <Route path="/mobility" element={<MobilityLibrary />} />
          <Route path="/coach/mobility" element={<MobilityLibrary />} />
          <Route path="/subscriptions" element={<Navigate to="/coach/financials" replace />} />
          <Route path="/master-settings" element={<MasterSettingsHub />} />
          <Route path="/settings" element={<Navigate to="/master-settings" replace />} />
          <Route path="/coach/editor" element={<CoachEditor />} />
          <Route path="/coach/editor/:userId" element={<CoachEditor />} />
          <Route path="/coach/analytics" element={<Navigate to="/coach/financials" replace />} />
          <Route path="/coach/checkin-review" element={<CheckinReviewDashboard />} />
          <Route path="/checkins/review" element={<CheckinReviewDashboard />} />
          <Route path="/checkin/review" element={<CheckinReviewDashboard />} />
          <Route path="/coach/checkin" element={<CheckinReviewDashboard />} />
          <Route path="/coach/checkins" element={<CheckinReviewDashboard />} />
          <Route path="/coach/financials" element={<FinancialsRenewalsDashboard />} />
          <Route path="/financials" element={<FinancialsRenewalsDashboard />} />
          <Route path="/coach/reminders" element={<WhatsAppRemindersHub />} />
          <Route path="/reminders" element={<WhatsAppRemindersHub />} />
          <Route path="/customers/:id" element={<ClientTimelineProfile />} />
          <Route path="/profile" element={<Navigate to="/master-settings" replace />} />
          <Route path="/profile.html" element={<Navigate to="/master-settings" replace />} />
          <Route path="/pdf" element={<ProgramPdfView />} />
          <Route path="/coach/mesocycle-debrief/:clientId" element={<MesocycleDebriefPdfView />} />
          <Route path="/coach/mesocycle-debrief" element={<MesocycleDebriefPdfView />} />
          <Route path="/mesocycle-debrief" element={<MesocycleDebriefPdfView />} />
          <Route path="/test-engine" element={<Navigate to="/" replace />} />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
}

export default App;
