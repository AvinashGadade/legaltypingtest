const items = [
  ['err-addition', 'Addition: Extra words in typed text'],
  ['err-omission', 'Omission: Words missing in typed text'],
  ['err-full', 'Full Error: Substitutions, spelling, repetitions, incomplete words'],
  ['err-capitalization', 'Capitalization Error: Incorrect case'],
  ['err-spacing', 'Spacing Error: Missing or extra spaces']
];

export default function ErrorLegend({ omitOriginal = false }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
      {items.filter(([, label]) => !omitOriginal || !label.startsWith('Addition')).map(([cls, label]) => (
        <span key={label} className={`${cls} inline-block`}>{label}</span>
      ))}
    </div>
  );
}
