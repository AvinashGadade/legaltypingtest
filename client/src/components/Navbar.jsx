import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, LogOut, Upload, FileText, Keyboard,
  Download, UserPlus, History, CreditCard, Menu, X, Scale, ShieldCheck, Mail
} from 'lucide-react';

export default function Navbar({ admin = false }) {
  const navigate   = useNavigate();
  const location   = useLocation();
  const [open, setOpen] = useState(false);

  const studentName = localStorage.getItem('studentName');

  const studentLogout = () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentName');
    navigate('/student/login');
  };
  const adminLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const active = (path) =>
    location.pathname === path
      ? 'bg-white/20 text-white'
      : 'text-white/80 hover:bg-white/10 hover:text-white';

  const NavLink = ({ to, icon: Icon, children }) => (
    <Link
      to={to}
      onClick={() => setOpen(false)}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${active(to)}`}
    >
      {Icon && <Icon size={15} />}
      {children}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 font-bold" onClick={() => setOpen(false)}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/30 ring-1 ring-indigo-400/30">
            <Scale size={16} className="text-indigo-300" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-extrabold leading-tight text-white">LegalTypingTest</p>
            <p className="text-[10px] font-medium leading-tight text-indigo-300">Bombay High Court</p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {!admin && (
            <>
              <NavLink to="/" icon={Home}>Home</NavLink>
              <NavLink to="/download-passages" icon={Download}>Downloads</NavLink>
              <NavLink to="/practice" icon={Keyboard}>Practice</NavLink>
              <NavLink to="/contact" icon={Mail}>Contact</NavLink>
              {studentName && (
                <>
                  <NavLink to="/student/history" icon={History}>History</NavLink>
                  <Link
                    to="/subscription"
                    className="ml-1 flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold text-slate-900 transition-all hover:bg-amber-300"
                  >
                    <CreditCard size={15} /> Subscribe
                  </Link>
                </>
              )}
              {!studentName && (
                <>
                  <NavLink to="/student/login" icon={null}>Login</NavLink>
                  <Link
                    to="/student/register"
                    className="ml-1 flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-400"
                  >
                    <UserPlus size={15} /> Register
                  </Link>
                </>
              )}
              {studentName && (
                <button
                  onClick={studentLogout}
                  className="ml-1 flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white/80 transition-all hover:bg-white/15 hover:text-white"
                >
                  <LogOut size={15} />
                  <span className="max-w-[100px] truncate">{studentName}</span>
                </button>
              )}
              {/* Admin login — subtle, always accessible */}
              <Link
                to="/admin/login"
                className="ml-2 flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-white/40 transition-all hover:border-white/20 hover:text-white/70"
                title="Admin Login"
              >
                <ShieldCheck size={12} /> Admin
              </Link>
            </>
          )}

          {admin && (
            <>
              <NavLink to="/admin/dashboard" icon={Home}>Dashboard</NavLink>
              <NavLink to="/admin/upload" icon={Upload}>Upload PDF</NavLink>
              <NavLink to="/admin/passages" icon={FileText}>Passages</NavLink>
              <button
                onClick={adminLogout}
                className="ml-1 flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white/80 transition-all hover:bg-white/15 hover:text-white"
              >
                <LogOut size={15} /> Logout
              </button>
            </>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="slide-down border-t border-white/10 px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-1 pt-2">
            {!admin && (
              <>
                <NavLink to="/" icon={Home}>Home</NavLink>
                <NavLink to="/download-passages" icon={Download}>Downloads</NavLink>
                <NavLink to="/practice" icon={Keyboard}>Practice</NavLink>
                <NavLink to="/contact" icon={Mail}>Contact</NavLink>
                {studentName && (
                  <>
                    <NavLink to="/student/history" icon={History}>My History</NavLink>
                    <NavLink to="/subscription" icon={CreditCard}>Subscribe ₹100</NavLink>
                    <button
                      onClick={() => { studentLogout(); setOpen(false); }}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-300 hover:bg-white/5"
                    >
                      <LogOut size={15} /> Sign out ({studentName})
                    </button>
                  </>
                )}
                {!studentName && (
                  <>
                    <NavLink to="/student/login">Student Login</NavLink>
                    <NavLink to="/student/register" icon={UserPlus}>Register</NavLink>
                  </>
                )}
                <NavLink to="/admin/login" icon={ShieldCheck}>Admin Login</NavLink>
              </>
            )}
            {admin && (
              <>
                <NavLink to="/admin/dashboard" icon={Home}>Dashboard</NavLink>
                <NavLink to="/admin/upload" icon={Upload}>Upload PDF</NavLink>
                <NavLink to="/admin/passages" icon={FileText}>Passages</NavLink>
                <button
                  onClick={() => { adminLogout(); setOpen(false); }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-300"
                >
                  <LogOut size={15} /> Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
