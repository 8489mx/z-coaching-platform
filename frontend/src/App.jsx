import React, { useEffect } from 'react';
import './i18n';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Global Modal Escape Key Listener Component
function GlobalModalEscapeHandler() {
  useEffect(() => {
    const handleGlobalEscape = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        // Find any open modals / dialog shells / lightbox overlays
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

// Primary Core Cockpits
import CoachCommandCenter from './pages/CoachCommandCenter';
import ClientInteractiveApp from './pages/ClientInteractiveApp';

// Essential Feature Pages
import PublicPricingJoin from './pages/PublicPricingJoin';
import Customers from './pages/Customers';
import ExerciseLibrary from './pages/ExerciseLibrary';
import MacroCalculator from './pages/MacroCalculator';
import Subscriptions from './pages/Subscriptions';
import MasterSettingsHub from './pages/MasterSettingsHub';
import IntakeSubmissions from './pages/IntakeSubmissions';
import FullIntakeForm from './pages/FullIntakeForm';
import ClientLogin from './pages/ClientLogin';
import ClientOnboarding from './pages/ClientOnboarding';
import ClientOnboardingForm from './pages/ClientOnboardingForm';
import CoachEditor from './pages/CoachEditor';
import ProgramPdfView from './pages/ProgramPdfView';
import ProgressClone from './pages/ProgressClone';
import ProfileClone from './pages/ProfileClone';
import WeeklyCheckinForm from './pages/WeeklyCheckinForm';
import CoachAnalyticsDashboard from './pages/CoachAnalyticsDashboard';
import CheckinReviewDashboard from './pages/CheckinReviewDashboard';
import ClientTimelineProfile from './pages/ClientTimelineProfile';
import MobilityLibrary from './pages/MobilityLibrary';

function App() {
  return (
    <AuthProvider>
      <GlobalModalEscapeHandler />
      <Router>
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
          <Route path="/client/grocery" element={<ClientInteractiveApp />} />
          <Route path="/client-app" element={<ClientInteractiveApp />} />
          <Route path="/mobile" element={<ClientInteractiveApp />} />
          <Route path="/program" element={<ClientInteractiveApp />} />
          <Route path="/user-dashboard" element={<ClientInteractiveApp />} />
          <Route path="/user-dashboard.html" element={<Navigate to="/client/today" replace />} />

          {/* Client Onboarding, Intake & Check-in */}
          <Route path="/join" element={<PublicPricingJoin />} />
          <Route path="/pricing" element={<PublicPricingJoin />} />
          <Route path="/onboarding" element={<ClientOnboardingForm />} />
          <Route path="/onboarding/multi" element={<ClientOnboardingForm />} />
          <Route path="/onboarding/classic" element={<ClientOnboarding />} />
          <Route path="/intake" element={<ClientLogin />} />
          <Route path="/client/login" element={<ClientLogin />} />
          <Route path="/login" element={<ClientLogin />} />
          <Route path="/intake/form" element={<FullIntakeForm />} />
          <Route path="/intake/submissions" element={<IntakeSubmissions />} />
          <Route path="/check-in" element={<WeeklyCheckinForm />} />
          <Route path="/client/check-in" element={<WeeklyCheckinForm />} />
          <Route path="/progress" element={<ProgressClone />} />
          <Route path="/progress.html" element={<Navigate to="/progress" replace />} />
          <Route path="/check-ins" element={<ProgressClone />} />

          {/* Coach Management Tools */}
          <Route path="/customers" element={<Customers />} />
          <Route path="/exercises" element={<ExerciseLibrary />} />
          <Route path="/calculator" element={<MacroCalculator />} />
          <Route path="/mobility" element={<MobilityLibrary />} />
          <Route path="/coach/mobility" element={<MobilityLibrary />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/master-settings" element={<MasterSettingsHub />} />
          <Route path="/settings" element={<Navigate to="/master-settings" replace />} />
          <Route path="/coach/editor" element={<CoachEditor />} />
          <Route path="/coach/editor/:userId" element={<CoachEditor />} />
          <Route path="/coach/analytics" element={<CoachAnalyticsDashboard />} />
          <Route path="/coach/checkin-review" element={<CheckinReviewDashboard />} />
          <Route path="/customers/:id" element={<ClientTimelineProfile />} />
          <Route path="/profile" element={<ProfileClone />} />
          <Route path="/profile.html" element={<Navigate to="/profile" replace />} />
          <Route path="/pdf" element={<ProgramPdfView />} />
          <Route path="/test-engine" element={<Navigate to="/" replace />} />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
