import { Navigate } from 'react-router-dom';

export default function ProtectedStudentRoute({ children }) {
  return localStorage.getItem('studentToken') ? children : <Navigate to="/student/login" replace />;
}
