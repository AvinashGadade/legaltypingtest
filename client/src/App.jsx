import { Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import DownloadPassages from './pages/DownloadPassages.jsx';
import PracticeSetup from './pages/PracticeSetup.jsx';
import TypingTest from './pages/TypingTest.jsx';
import Result from './pages/Result.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminUpload from './pages/AdminUpload.jsx';
import AdminPassages from './pages/AdminPassages.jsx';
import AdminStudents from './pages/AdminStudents.jsx';
import StudentLogin from './pages/StudentLogin.jsx';
import StudentRegister from './pages/StudentRegister.jsx';
import StudentHistory from './pages/StudentHistory.jsx';
import Subscription from './pages/Subscription.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Contact from './pages/Contact.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import ProtectedStudentRoute from './components/ProtectedStudentRoute.jsx';
import ProtectedAdminRoute from './components/ProtectedAdminRoute.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/download-passages" element={<DownloadPassages />} />
      <Route path="/practice" element={<PracticeSetup />} />
      <Route path="/practice/test" element={<TypingTest />} />
      <Route path="/result/:id" element={<Result />} />
      <Route path="/result" element={<Result />} />
      <Route path="/student/login" element={<StudentLogin />} />
      <Route path="/student/register" element={<StudentRegister />} />
      <Route path="/student/forgot-password" element={<ForgotPassword />} />
      <Route path="/student/reset-password" element={<ResetPassword />} />
      <Route path="/student/history" element={<ProtectedStudentRoute><StudentHistory /></ProtectedStudentRoute>} />
      <Route path="/subscription" element={<ProtectedStudentRoute><Subscription /></ProtectedStudentRoute>} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
      <Route path="/admin/upload" element={<ProtectedAdminRoute><AdminUpload /></ProtectedAdminRoute>} />
      <Route path="/admin/passages" element={<ProtectedAdminRoute><AdminPassages /></ProtectedAdminRoute>} />
      <Route path="/admin/students" element={<ProtectedAdminRoute><AdminStudents /></ProtectedAdminRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
