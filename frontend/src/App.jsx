import React from 'react';
import './i18n';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import DashboardClone from './pages/DashboardClone';
import UserDashboardClone from './pages/UserDashboardClone';
import IndexClone from './pages/IndexClone';
import ProgressClone from './pages/ProgressClone';
import ProfileClone from './pages/ProfileClone';
import EngineTester from './pages/EngineTester';
import ClientOnboarding from './pages/ClientOnboarding';
import ClientLogin from './pages/ClientLogin';
import FullIntakeForm from './pages/FullIntakeForm';
import Customers from './pages/Customers';
import ClientProgramView from './pages/ClientProgramView';
import CoachEditor from './pages/CoachEditor';
import MobileAppSimulator from './pages/MobileAppSimulator';
import ProgramPdfView from './pages/ProgramPdfView';
import Subscriptions from './pages/Subscriptions';
import ExerciseLibrary from './pages/ExerciseLibrary';
import MacroCalculator from './pages/MacroCalculator';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<DashboardClone />} />
          <Route path="/index" element={<IndexClone />} />
          <Route path="/index.html" element={<Navigate to="/index" />} />
          <Route path="/user-dashboard" element={<UserDashboardClone />} />
          <Route path="/user-dashboard.html" element={<Navigate to="/user-dashboard" />} />
          <Route path="/program" element={<ClientProgramView />} />
          <Route path="/progress" element={<ProgressClone />} />
          <Route path="/progress.html" element={<Navigate to="/progress" />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/exercises" element={<ExerciseLibrary />} />
          <Route path="/calculator" element={<MacroCalculator />} />
          <Route path="/profile" element={<ProfileClone />} />
          <Route path="/profile.html" element={<Navigate to="/profile" />} />
          <Route path="/test-engine" element={<EngineTester />} />
          <Route path="/onboarding" element={<ClientOnboarding />} />
          <Route path="/intake" element={<ClientLogin />} />
          <Route path="/intake/form" element={<FullIntakeForm />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/coach/editor" element={<CoachEditor />} />
          <Route path="/mobile" element={<MobileAppSimulator />} />
          <Route path="/pdf" element={<ProgramPdfView />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
