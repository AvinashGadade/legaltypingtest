import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { API_BASE_URL as API } from '../utils/api.js';

export default function ProtectedStudentRoute({ children }) {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    const token = localStorage.getItem('studentToken');
    if (!token) {
      setStatus('guest');
      return;
    }

    fetch(`${API}/students/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error('Invalid login');
        setStatus('student');
      })
      .catch(() => {
        localStorage.removeItem('studentToken');
        localStorage.removeItem('studentName');
        setStatus('guest');
      });
  }, []);

  if (status === 'checking') {
    return <div className="grid min-h-screen place-items-center text-slate-600">Checking login...</div>;
  }

  return status === 'student' ? children : <Navigate to="/student/login" replace />;
}
