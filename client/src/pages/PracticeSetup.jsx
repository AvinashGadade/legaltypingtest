import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import PassageSelector from '../components/PassageSelector.jsx';

export default function PracticeSetup() {
  const navigate = useNavigate();
  const locked = (type, passage) => {
    if (type === 'login') {
      navigate('/student/login', { state: { from: '/practice', message: `Please login to unlock Passage ${passage?.passage_number || 5} onwards.` } });
      return;
    }
    navigate('/subscription', { state: { message: `Passage ${passage?.passage_number || 5} requires lifetime access.` } });
  };

  return <div><Navbar /><main className="mx-auto max-w-6xl px-4 py-8"><PassageSelector onStart={(passage) => navigate('/practice/test', { state: { passage } })} onLocked={locked} /></main></div>;
}
