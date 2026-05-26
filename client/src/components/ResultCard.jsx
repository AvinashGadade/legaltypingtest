export default function ResultCard({ title, value, note, danger = false }) {
  return (
    <div className={`card p-5 ${danger ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white border-0' : ''}`}>
      <p className={`text-xs font-bold uppercase tracking-wider ${danger ? 'text-white/75' : 'text-slate-400'}`}>
        {title}
      </p>
      <div className={`mt-2 text-3xl font-black tabular-nums tracking-tight ${danger ? 'text-white' : 'text-slate-900'}`}>
        {value}
      </div>
      <p className={`mt-2 text-xs leading-relaxed ${danger ? 'text-white/80' : 'text-slate-400'}`}>
        {note}
      </p>
    </div>
  );
}
