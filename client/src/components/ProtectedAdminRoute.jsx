import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { API_BASE_URL as API } from '../utils/api.js';

export default function ProtectedAdminRoute({ children }) {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setStatus('guest');
      return;
    }

    fetch(`${API}/admin/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error('Invalid admin login');
        setStatus('admin');
      })
      .catch(() => {
        localStorage.removeItem('adminToken');
        setStatus('guest');
      });
  }, []);

  if (status === 'checking') {
    return <div className="grid min-h-screen place-items-center text-slate-600">Checking admin login...</div>;
  }

  return status === 'admin' ? children : <Navigate to="/admin/login" replace />;
}
