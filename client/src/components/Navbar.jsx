import { Link, useNavigate } from 'react-router-dom';
import { Home, LogOut, Upload, FileText, Keyboard, Download, UserPlus, History, CreditCard } from 'lucide-react';

export default function Navbar({ admin = false }) {
  const navigate = useNavigate();
  const studentName = localStorage.getItem('studentName');
  const studentLogout = () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentName');
    navigate('/student/login');
  };
  const logout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <header className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <Link to="/" className="font-bold tracking-wide">Bombay High Court Typing Practice</Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <Link to="/" className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20"><Home size={16} /> Dashboard</Link>
          <Link to="/download-passages" className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20"><Download size={16} /> Downloads</Link>
          <Link to="/practice" className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20"><Keyboard size={16} /> Practice</Link>
          {studentName && !admin && (
            <>
              <Link to="/student/history" className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20"><History size={16} /> History</Link>
              <Link to="/subscription" className="flex items-center gap-1 rounded-lg bg-cyan-400 px-3 py-2 text-white hover:bg-cyan-500"><CreditCard size={16} /> Subscribe</Link>
              <button onClick={studentLogout} className="flex items-center gap-1 rounded-lg bg-white/15 px-3 py-2 hover:bg-white/25"><LogOut size={16} /> {studentName}</button>
            </>
          )}
          {!studentName && !admin && (
            <>
              <Link to="/student/login" className="rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20">Student Login</Link>
              <Link to="/student/register" className="flex items-center gap-1 rounded-lg bg-cyan-400 px-3 py-2 text-white hover:bg-cyan-500"><UserPlus size={16} /> Register</Link>
            </>
          )}
          {admin ? (
            <>
              <Link to="/admin/dashboard" className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20"><Home size={16} /> Admin</Link>
              <Link to="/admin/upload" className="flex items-center gap-1 rounded-lg bg-cyan-400 px-3 py-2 text-white hover:bg-cyan-500"><Upload size={16} /> Upload PDF</Link>
              <Link to="/admin/passages" className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20"><FileText size={16} /> Passages</Link>
              <button onClick={logout} className="flex items-center gap-1 rounded-lg bg-white/15 px-3 py-2 hover:bg-white/25"><LogOut size={16} /> Logout</button>
            </>
          ) : <Link to="/admin/login" className="rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20">Admin Login</Link>}
        </nav>
      </div>
    </header>
  );
}
