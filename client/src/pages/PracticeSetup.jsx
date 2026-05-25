import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import PassageSelector from '../components/PassageSelector.jsx';

export default function PracticeSetup() {
  const navigate = useNavigate();
  return <div><Navbar /><main className="mx-auto max-w-6xl px-4 py-8"><PassageSelector onStart={(passage) => navigate('/practice/test', { state: { passage } })} /></main></div>;
}
