export default function ResultCard({ title, value, note, danger = false }) {
  return (
    <div className={`card p-5 ${danger ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white' : ''}`}>
      <p className={`text-sm font-semibold ${danger ? 'text-white/85' : 'text-slate-500'}`}>{title}</p>
      <div className="mt-2 text-3xl font-extrabold tracking-tight">{value}</div>
      <p className={`mt-3 text-sm leading-5 ${danger ? 'text-white/90' : 'text-slate-500'}`}>{note}</p>
    </div>
  );
}
