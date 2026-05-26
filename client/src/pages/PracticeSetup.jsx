import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import PassageSelector from '../components/PassageSelector.jsx';

export default function PracticeSetup() {
  const navigate = useNavigate();

  const locked = (type, passage) => {
    if (type === 'login') {
      navigate('/student/login', {
        state: {
          from:    '/practice',
          message: `Please sign in to access Passage ${passage?.passage_number || 5} and above.`
        }
      });
      return;
    }
    navigate('/subscription', {
      state: { message: `Passage ${passage?.passage_number || 5} requires lifetime subscription access.` }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-slate-900">Typing Practice</h1>
          <p className="mt-1 text-slate-500">
            Choose your passage, then type it as fast and accurately as you can.
          </p>
        </div>
        <PassageSelector
          onStart={(passage) => navigate('/practice/test', { state: { passage } })}
          onLocked={locked}
        />
      </main>
    </div>
  );
}
