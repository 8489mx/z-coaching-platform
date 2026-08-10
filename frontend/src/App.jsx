import './rtl.css';
import './i18n';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import DashboardClone from './pages/DashboardClone';
import IntakeWizard from './pages/IntakeWizard';
import TrainingSchedule from './pages/TrainingSchedule';
import Catalogs from './pages/Catalogs';
import ClientProfile from './pages/ClientProfile';
import NutritionPlan from './pages/NutritionPlan';
import PipelineTrace from './pages/PipelineTrace';
import Login from './pages/Login';
import ClientLogin from './pages/ClientLogin';
import Clients from './pages/Clients';
import ReviewIntake from './pages/ReviewIntake';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/client-login" element={<ClientLogin />} />
          <Route path="/client-intake" element={<IntakeWizard />} />
          
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardClone />} />
            <Route path="intake" element={<IntakeWizard />} />
            <Route path="profile" element={<ClientProfile />} />
            <Route path="schedule" element={<TrainingSchedule />} />
            <Route path="nutrition" element={<NutritionPlan />} />
            <Route path="catalogs" element={<Catalogs />} />
            <Route path="logs" element={<PipelineTrace />} />
            <Route path="admin/clients" element={<Clients />} />
            <Route path="admin/review/:id" element={<ReviewIntake />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
