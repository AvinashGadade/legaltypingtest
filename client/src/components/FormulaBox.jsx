export default function FormulaBox() {
  const formulas = [
    'Total Keystrokes: Count of characters in final typed text',
    'Backspace Pressed: Number of backspace key presses',
    'Total Words Typed: Total Keystrokes / 5',
    'Total Errors: Full Errors + Half Errors',
    'Ignorable Errors: 5% of (Total Keystrokes Typed / 5)',
    'Penalty: Total Errors x 10',
    'Error Percentage: (Total Errors / Total Words Typed) x 100',
    'Gross WPM: (Keystrokes Typed / 5) / Time (min)',
    'Net WPM: ((Keystrokes / 5) - Error) / Time (min)',
    'Accuracy: (Net WPM / Gross WPM) x 100',
    'Marks Calculation: 20 - (Total Errors / 4), minimum 0',
    'Qualification: Net WPM >= 40 AND Marks Obtained >= 10'
  ];
  return <ul className="space-y-2 text-sm text-slate-700">{formulas.map((f) => <li key={f}>• {f}</li>)}</ul>;
}
