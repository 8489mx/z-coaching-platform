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
          <Route path="/progress" element={<ProgressClone />} />
          <Route path="/progress.html" element={<Navigate to="/progress" />} />
          <Route path="/profile" element={<ProfileClone />} />
          <Route path="/profile.html" element={<Navigate to="/profile" />} />
          <Route path="/test-engine" element={<EngineTester />} />
          <Route path="/onboarding" element={<ClientOnboarding />} />
          <Route path="/intake" element={<ClientLogin />} />
          <Route path="/intake/form" element={<FullIntakeForm />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
