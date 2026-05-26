const items = [
  { cls: 'err-full',           label: 'Full Error',         desc: 'Spelling, substitution, repetition, incomplete' },
  { cls: 'err-omission',       label: 'Omission',           desc: 'Word missing from typed text' },
  { cls: 'err-addition',       label: 'Addition',           desc: 'Extra word in typed text' },
  { cls: 'err-capitalization', label: 'Capitalization',     desc: 'Wrong case (half error)' },
  { cls: 'err-punctuation',    label: 'Punctuation',        desc: 'Wrong punctuation (half error)' },
  { cls: 'err-transposition',  label: 'Transposition',      desc: 'Letters swapped (half error)' },
  { cls: 'err-spacing',        label: 'Spacing',            desc: 'Extra or missing spaces (half error)' }
];

export default function ErrorLegend({ omitOriginal = false }) {
  const visible = omitOriginal
    ? items.filter((i) => i.cls !== 'err-addition')
    : items;

  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Highlight Legend</p>
      <div className="flex flex-wrap gap-2">
        {visible.map(({ cls, label, desc }) => (
          <span
            key={label}
            title={desc}
            className={`${cls} inline-block cursor-default text-xs font-semibold`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
